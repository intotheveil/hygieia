// Error-storm rate-limit / batcher for the drop-in telemetry snippet (P5-T2).
//
// SPEC §6 P5: "an error storm in one product can't hammer the DB." A runaway
// loop can throw the SAME error thousands of times a second; without a guard
// each throw becomes one INSERT. This module sits between the catcher's
// scrub+fingerprint step and the network, and does two things:
//
//   1. COALESCE by fingerprint within a short window. The dashboard already
//      groups the feed by fingerprint, so a repeat of an already-sent
//      fingerprint adds zero information — we send it ONCE and suppress the
//      repeats. A size-capped, move-to-end LRU of recently-sent fingerprints
//      (with timestamps) bounds memory and lets a fingerprint fire again after
//      the window elapses.
//   2. BATCH distinct errors into a single bulk POST. Distinct errors queue and
//      flush together on a short interval (or when the queue fills), so N
//      distinct errors become ceil(N / maxBatchSize) requests instead of N.
//      A hard queue ceiling drops the OLDEST queued errors past the cap (and
//      COUNTS + logs the drops — never silent truncation) so a storm cannot
//      grow memory without bound.
//
// Portable + dependency-free (client / server / edge): it uses only
// `Date.now`, `setTimeout`/`clearTimeout`, and — for best-effort flush on
// navigation — the browser `window`/`document` unload events when present.
// It NEVER throws into the host: every public method is fully guarded.

import type { FleetErrorPayload } from './types'

/** Delivers one bulk batch. Implementations must swallow their own failures. */
export type SendBatch = (payloads: FleetErrorPayload[]) => void | Promise<void>

/** Tuning knobs; every field has a sane storm-safe default. */
export interface FleetErrorBatcherOptions {
  /** Bulk-POST sink for a flushed batch (e.g. `postFleetErrors`). Required. */
  send: SendBatch
  /** Suppress repeats of the same fingerprint seen within this window. Default 10s. */
  coalesceWindowMs?: number
  /** Max delay before a non-full queue is flushed. Default 1.5s. */
  flushIntervalMs?: number
  /** Queue length that triggers an immediate flush + caps a single POST body. Default 50. */
  maxBatchSize?: number
  /** Hard queue ceiling; oldest beyond this are dropped + counted. Default 500. */
  maxQueueSize?: number
  /** Capacity of the recently-sent fingerprint LRU. Default 500. */
  seenCapacity?: number
}

/** Observable counters — used by tests and for drop diagnostics. */
export interface BatcherStats {
  /** Distinct errors accepted into the queue. */
  enqueued: number
  /** Repeats coalesced away by the fingerprint window. */
  suppressed: number
  /** Queued errors dropped because the queue was at its ceiling. */
  dropped: number
  /** Bulk POSTs dispatched. */
  flushed: number
}

/** The batcher surface the catcher wires into. */
export interface FleetErrorBatcher {
  /** Scrub+fingerprint FIRST, then enqueue the finished payload here. Never throws. */
  enqueue: (payload: FleetErrorPayload) => void
  /** Force-send everything currently queued (also called on unload). Never throws. */
  flush: () => void
  /** Current counters snapshot. */
  stats: () => BatcherStats
  /** Flush, detach unload listeners, and stop timers. */
  dispose: () => void
}

const DEFAULTS = {
  coalesceWindowMs: 10_000,
  flushIntervalMs: 1_500,
  maxBatchSize: 50,
  maxQueueSize: 500,
  seenCapacity: 500,
} as const

class FleetErrorBatcherImpl implements FleetErrorBatcher {
  private readonly send: SendBatch
  private readonly coalesceWindowMs: number
  private readonly flushIntervalMs: number
  private readonly maxBatchSize: number
  private readonly maxQueueSize: number
  private readonly seenCapacity: number

  private queue: FleetErrorPayload[] = []
  /** fingerprint -> last-sent epoch ms. Insertion order == LRU order. */
  private readonly seen = new Map<string, number>()
  private timer: ReturnType<typeof setTimeout> | null = null
  private disposed = false

  private readonly counters: BatcherStats = {
    enqueued: 0,
    suppressed: 0,
    dropped: 0,
    flushed: 0,
  }
  /** Drops accumulated since the last flush, so the warning reports a running batch. */
  private droppedSinceFlush = 0

  // Bound listeners kept so `dispose` can detach exactly what it attached.
  private readonly onUnload: () => void
  private readonly onVisibility: () => void

  constructor(options: FleetErrorBatcherOptions) {
    this.send = options.send
    this.coalesceWindowMs = positive(options.coalesceWindowMs, DEFAULTS.coalesceWindowMs)
    this.flushIntervalMs = positive(options.flushIntervalMs, DEFAULTS.flushIntervalMs)
    this.maxBatchSize = positive(options.maxBatchSize, DEFAULTS.maxBatchSize)
    this.maxQueueSize = positive(options.maxQueueSize, DEFAULTS.maxQueueSize)
    this.seenCapacity = positive(options.seenCapacity, DEFAULTS.seenCapacity)

    this.onUnload = (): void => {
      this.flush()
    }
    this.onVisibility = (): void => {
      try {
        if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
          this.flush()
        }
      } catch {
        // A sandboxed/detached document can throw on access; stay silent.
      }
    }
    this.installUnloadFlush()
  }

  enqueue(payload: FleetErrorPayload): void {
    try {
      if (this.disposed || payload == null) return
      const now = Date.now()
      const fp = payload.fingerprint

      // Coalesce: a fingerprint seen within the window is a duplicate the feed
      // would collapse anyway — suppress it. Payloads with no fingerprint are
      // always treated as distinct (nothing to coalesce on).
      if (typeof fp === 'string' && fp.length > 0) {
        const last = this.seen.get(fp)
        if (last !== undefined && now - last < this.coalesceWindowMs) {
          this.counters.suppressed += 1
          return
        }
        this.markSeen(fp, now)
      }

      // Ceiling: drop the OLDEST queued error to make room, and COUNT it.
      if (this.queue.length >= this.maxQueueSize) {
        this.queue.shift()
        this.counters.dropped += 1
        this.droppedSinceFlush += 1
      }

      this.queue.push(payload)
      this.counters.enqueued += 1

      if (this.queue.length >= this.maxBatchSize) {
        this.flush()
      } else {
        this.schedule()
      }
    } catch {
      // Telemetry must never throw into the host it monitors.
    }
  }

  flush(): void {
    try {
      if (this.timer != null) {
        clearTimeout(this.timer)
        this.timer = null
      }
      if (this.droppedSinceFlush > 0) {
        warn(`dropped ${this.droppedSinceFlush} queued error(s) over cap ${this.maxQueueSize}`)
        this.droppedSinceFlush = 0
      }
      if (this.queue.length === 0) return

      const batch = this.queue
      this.queue = []
      // Chunk so a single POST body stays bounded even if the queue overshot.
      for (let i = 0; i < batch.length; i += this.maxBatchSize) {
        const chunk = batch.slice(i, i + this.maxBatchSize)
        this.counters.flushed += 1
        this.dispatch(chunk)
      }
    } catch {
      // Never throw into the host.
    }
  }

  stats(): BatcherStats {
    return { ...this.counters }
  }

  dispose(): void {
    try {
      this.flush()
    } finally {
      this.removeUnloadFlush()
      if (this.timer != null) {
        clearTimeout(this.timer)
        this.timer = null
      }
      this.disposed = true
    }
  }

  private markSeen(fp: string, now: number): void {
    // Move-to-end keeps the Map in LRU order; evict from the front when full.
    this.seen.delete(fp)
    this.seen.set(fp, now)
    if (this.seen.size > this.seenCapacity) {
      const oldest = this.seen.keys().next().value
      if (oldest !== undefined) this.seen.delete(oldest)
    }
  }

  private schedule(): void {
    if (this.timer != null || this.disposed) return
    this.timer = setTimeout(() => {
      this.timer = null
      this.flush()
    }, this.flushIntervalMs)
  }

  private dispatch(chunk: FleetErrorPayload[]): void {
    try {
      const result = this.send(chunk)
      if (result != null && typeof (result as Promise<void>).then === 'function') {
        // Fire-and-forget: swallow async rejection so it can't surface anywhere.
        void (result as Promise<void>).then(undefined, () => undefined)
      }
    } catch {
      // A throwing sink must not break the batcher.
    }
  }

  private installUnloadFlush(): void {
    try {
      if (typeof window === 'undefined' || typeof window.addEventListener !== 'function') {
        return
      }
      window.addEventListener('beforeunload', this.onUnload)
      window.addEventListener('pagehide', this.onUnload)
      if (typeof document !== 'undefined' && typeof document.addEventListener === 'function') {
        document.addEventListener('visibilitychange', this.onVisibility)
      }
    } catch {
      // No unload hooks available (or blocked); flushing stays interval-driven.
    }
  }

  private removeUnloadFlush(): void {
    try {
      if (typeof window === 'undefined' || typeof window.removeEventListener !== 'function') {
        return
      }
      window.removeEventListener('beforeunload', this.onUnload)
      window.removeEventListener('pagehide', this.onUnload)
      if (typeof document !== 'undefined' && typeof document.removeEventListener === 'function') {
        document.removeEventListener('visibilitychange', this.onVisibility)
      }
    } catch {
      // Best-effort detach.
    }
  }
}

/** Coerce to a positive finite number, else fall back to the default. */
function positive(value: number | undefined, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : fallback
}

/** Non-fatal warning that itself never throws (console may be absent on edge). */
function warn(detail: unknown): void {
  try {
    if (typeof console !== 'undefined' && typeof console.warn === 'function') {
      console.warn('[fleet-telemetry] batcher', detail)
    }
  } catch {
    // A telemetry system must stay silent on its own failure.
  }
}

/**
 * Create a storm-safe batcher. Feed it ALREADY scrubbed + fingerprinted
 * payloads (scrub-before-send is non-negotiable, so it stays in the catcher).
 */
export function createFleetErrorBatcher(options: FleetErrorBatcherOptions): FleetErrorBatcher {
  return new FleetErrorBatcherImpl(options)
}
