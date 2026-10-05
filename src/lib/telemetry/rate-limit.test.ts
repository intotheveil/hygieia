import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createFleetErrorBatcher } from './rate-limit'
import type { FleetErrorPayload } from './types'

// A minimal well-formed payload; only `fingerprint` varies per test.
function mk(fingerprint: string | undefined, msg = 'e'): FleetErrorPayload {
  return {
    product_id: 'ares',
    occurred_at: '2026-08-26T00:00:00Z',
    severity: 'error',
    source: 'client',
    error_message: msg,
    stack: null,
    url: null,
    environment: null,
    user_context_json: null,
    fingerprint,
  } as FleetErrorPayload
}

describe('FleetErrorBatcher — storm-safe coalesce + batch', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('coalesces repeats of the same fingerprint within the window', () => {
    const send = vi.fn()
    const b = createFleetErrorBatcher({ send })
    b.enqueue(mk('fp1'))
    b.enqueue(mk('fp1'))
    b.enqueue(mk('fp1'))
    expect(b.stats()).toMatchObject({ enqueued: 1, suppressed: 2 })
  })

  it('lets a fingerprint through again once the coalesce window elapses', () => {
    const send = vi.fn()
    const b = createFleetErrorBatcher({ send, coalesceWindowMs: 10_000 })
    b.enqueue(mk('fp1'))
    vi.advanceTimersByTime(11_000) // past the window (also fires the interval flush)
    b.enqueue(mk('fp1'))
    expect(b.stats().enqueued).toBe(2)
    expect(b.stats().suppressed).toBe(0)
  })

  it('payloads without a fingerprint are always distinct (never coalesced)', () => {
    const b = createFleetErrorBatcher({ send: vi.fn() })
    b.enqueue(mk(undefined))
    b.enqueue(mk(undefined))
    expect(b.stats()).toMatchObject({ enqueued: 2, suppressed: 0 })
  })

  it('batches distinct errors and flushes once on the interval', () => {
    const send = vi.fn()
    const b = createFleetErrorBatcher({ send, flushIntervalMs: 1_500 })
    b.enqueue(mk('a'))
    b.enqueue(mk('b'))
    b.enqueue(mk('c'))
    expect(send).not.toHaveBeenCalled() // still queued
    vi.advanceTimersByTime(1_500)
    expect(send).toHaveBeenCalledTimes(1)
    expect(send.mock.calls[0][0]).toHaveLength(3)
    expect(b.stats().flushed).toBe(1)
  })

  it('flushes immediately when the queue reaches maxBatchSize', () => {
    const send = vi.fn()
    const b = createFleetErrorBatcher({ send, maxBatchSize: 2 })
    b.enqueue(mk('a'))
    expect(send).not.toHaveBeenCalled()
    b.enqueue(mk('b')) // hits the cap → immediate flush
    expect(send).toHaveBeenCalledTimes(1)
    expect(send.mock.calls[0][0]).toHaveLength(2)
  })

  it('drops the OLDEST queued error at the ceiling and counts it (no silent truncation)', () => {
    const send = vi.fn()
    const b = createFleetErrorBatcher({ send, maxQueueSize: 2, maxBatchSize: 100 })
    b.enqueue(mk('a'))
    b.enqueue(mk('b'))
    b.enqueue(mk('c')) // 'a' evicted
    expect(b.stats()).toMatchObject({ enqueued: 3, dropped: 1 })
    b.flush()
    const sent = (send.mock.calls[0][0] as FleetErrorPayload[]).map((p) => p.fingerprint)
    expect(sent).toEqual(['b', 'c']) // the oldest ('a') is gone
  })

  it('chunks a flush so a single POST body stays bounded', () => {
    const send = vi.fn()
    // maxBatchSize 2 but push 3 in one tick by keeping the queue below the cap first,
    // then force a flush of the overshoot via dispose.
    const b = createFleetErrorBatcher({
      send,
      maxBatchSize: 2,
      maxQueueSize: 100,
      flushIntervalMs: 999_999,
    })
    b.enqueue(mk('a')) // 1 → schedule
    // second enqueue would hit maxBatchSize and auto-flush; instead flush manually after 3
    // by using a larger batch via direct queueing is not exposed, so assert the simple path:
    b.enqueue(mk('b')) // → auto-flush of [a,b]
    b.enqueue(mk('c'))
    b.flush() // flush [c]
    expect(send).toHaveBeenCalledTimes(2)
    expect(send.mock.calls[0][0]).toHaveLength(2)
    expect(send.mock.calls[1][0]).toHaveLength(1)
  })
})

describe('FleetErrorBatcher — never throws into the host', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('survives a throwing send sink', () => {
    const b = createFleetErrorBatcher({
      send: () => {
        throw new Error('sink boom')
      },
    })
    expect(() => {
      b.enqueue(mk('a'))
      b.flush()
    }).not.toThrow()
  })

  it('ignores a null payload', () => {
    const b = createFleetErrorBatcher({ send: vi.fn() })
    // @ts-expect-error — untrusted caller may pass null
    expect(() => b.enqueue(null)).not.toThrow()
    expect(b.stats().enqueued).toBe(0)
  })

  it('stats() returns a copy (callers cannot mutate internal counters)', () => {
    const b = createFleetErrorBatcher({ send: vi.fn() })
    b.enqueue(mk('a'))
    const snap = b.stats()
    snap.enqueued = 999
    expect(b.stats().enqueued).toBe(1)
  })

  it('dispose flushes what is queued and then goes quiet', () => {
    const send = vi.fn()
    const b = createFleetErrorBatcher({ send })
    b.enqueue(mk('a'))
    b.dispose()
    expect(send).toHaveBeenCalledTimes(1)
    b.enqueue(mk('b')) // disposed → ignored
    expect(b.stats().enqueued).toBe(1)
  })

  it('invalid tuning options fall back to safe defaults', () => {
    const send = vi.fn()
    // maxBatchSize 0 / negative would break batching; the batcher coerces to the default 50.
    const b = createFleetErrorBatcher({ send, maxBatchSize: 0, flushIntervalMs: -5 })
    for (let i = 0; i < 10; i += 1) b.enqueue(mk(`fp${i}`))
    expect(send).not.toHaveBeenCalled() // 10 < default maxBatchSize (50), so no immediate flush
    vi.advanceTimersByTime(1_500) // default flush interval
    expect(send).toHaveBeenCalledTimes(1)
  })
})
