// Fleet-telemetry — client (browser) catcher (P3-T3).
//
// The drop-in a product embeds in its browser bundle: it hooks `window.onerror`
// and `window.onunhandledrejection` (CHAINING any existing handler, never
// clobbering it), scrubs secrets + PII and computes the grouping fingerprint
// BEFORE the network call, then POSTs a `fleet_errors` row via the write-only
// (anon) key using plain `fetch`. It depends on neither the dashboard app nor
// `@supabase/supabase-js`, and it never references an operator/secret key.
//
// Everything that touches the network lives in `./fleet-telemetry-server.ts`
// (fetch-only, portable) and is reused here so there is a single delivery path.

import {
  buildScrubbedPayload,
  postFleetError,
  postFleetErrors,
  toErrorMessage,
  toErrorStack,
  type FleetTelemetryConfig,
} from './fleet-telemetry-server'
import { createFleetErrorBatcher, type FleetErrorBatcher } from './rate-limit'
import type { RawErrorInput, Severity } from './types'

/** Untrusted context bag; only allowlisted keys survive scrubbing. */
export type FleetContext = Record<string, unknown>

/**
 * Client init config. Extends the shared transport config with two optional
 * browser-side hooks:
 *  - `getContext` — called at capture time to attach live context (role/page/
 *    action). Only allowlisted keys survive the scrubber.
 *  - `isCritical` — lets the product promote selected errors to 'critical'.
 */
export interface FleetClientConfig extends FleetTelemetryConfig {
  getContext?: () => FleetContext | undefined
  isCritical?: (err: unknown) => boolean
}

/** Per-call options for manual `captureError` reporting. */
export interface CaptureErrorOptions {
  severity?: Severity
  context?: FleetContext
}

// Module-level active config, set by `initFleetTelemetry`, used by `captureError`
// and the installed handlers. Reset to null by the disposer.
let activeConfig: FleetClientConfig | null = null

// The storm batcher for the active config (P5-T2). Window errors + `captureError`
// go through it: scrub+fingerprint happen first, then the finished payload is
// enqueued so repeats coalesce and distinct errors flush as a single bulk POST.
// Null until `initFleetTelemetry` runs; its disposer flushes + tears it down.
let activeBatcher: FleetErrorBatcher | null = null

/**
 * Install the client error catcher. Returns a disposer that restores the
 * previous handlers. No-op (returns a no-op disposer) outside a browser so the
 * same module is safe to import in SSR / test environments.
 */
export function initFleetTelemetry(config: FleetClientConfig): () => void {
  if (typeof window === 'undefined') {
    // Non-browser runtime (SSR / test): nothing to hook. Use the server catcher.
    activeConfig = config
    activeBatcher = makeBatcher(config)
    return () => {
      teardownBatcher()
      activeConfig = null
    }
  }

  activeConfig = config
  activeBatcher = makeBatcher(config)

  const previousOnError = window.onerror
  const previousOnRejection = window.onunhandledrejection

  const onError: OnErrorEventHandler = (event, source, lineno, colno, error) => {
    const thrown = error ?? event
    handleClientError(thrown, { severity: severityFor(thrown, config) })
    // Chain: preserve whatever handler was already installed.
    if (typeof previousOnError === 'function') {
      return previousOnError.call(window, event, source, lineno, colno, error)
    }
    return false
  }

  const onRejection = (event: PromiseRejectionEvent): void => {
    handleClientError(event.reason, { severity: severityFor(event.reason, config) })
    if (typeof previousOnRejection === 'function') {
      previousOnRejection.call(window, event)
    }
  }

  window.onerror = onError
  window.onunhandledrejection = onRejection

  return () => {
    if (typeof window !== 'undefined') {
      // Only restore if we are still the installed handler; otherwise leave the
      // newer handler in place rather than clobbering it.
      if (window.onerror === onError) window.onerror = previousOnError
      if (window.onunhandledrejection === onRejection) {
        window.onunhandledrejection = previousOnRejection
      }
    }
    teardownBatcher()
    activeConfig = null
  }
}

/** Build a batcher whose bulk sink is the write-only bulk POST for this config. */
function makeBatcher(config: FleetClientConfig): FleetErrorBatcher {
  return createFleetErrorBatcher({
    send: (payloads) => postFleetErrors(payloads, config),
  })
}

/** Flush + dispose the active batcher so nothing queued is lost on teardown. */
function teardownBatcher(): void {
  try {
    activeBatcher?.dispose()
  } catch {
    // dispose() is already guarded; this is belt-and-suspenders.
  }
  activeBatcher = null
}

/**
 * Manually report an error from anywhere in the product's client code. Safe to
 * call before `initFleetTelemetry` (it simply no-ops until configured). Never
 * throws into the caller.
 */
export function captureError(err: unknown, options: CaptureErrorOptions = {}): void {
  handleClientError(err, options)
}

/** Decide severity: an explicit product `isCritical` promotes to 'critical'. */
function severityFor(err: unknown, config: FleetClientConfig): Severity {
  try {
    if (config.isCritical?.(err) === true) return 'critical'
  } catch {
    // A faulty predicate must not break capture.
  }
  return 'error'
}

/**
 * Build → scrub → fingerprint → POST for a client-side error. Fully guarded so
 * a telemetry failure can never surface in the host app.
 */
function handleClientError(err: unknown, options: CaptureErrorOptions): void {
  try {
    const config = activeConfig
    if (config == null) return

    const context = mergeContext(safeGetContext(config), options.context)
    const raw: RawErrorInput = {
      product_id: config.productId,
      severity: options.severity ?? 'error',
      source: 'client',
      error_message: toErrorMessage(err),
      stack: toErrorStack(err),
      url: currentUrl(),
      environment: config.environment,
      user_context: context,
    }
    // Scrub + fingerprint FIRST (non-negotiable), then route through the storm
    // batcher: repeats of a fingerprint coalesce and distinct errors flush as a
    // single bulk POST. If there is no batcher (shouldn't happen once init ran),
    // fall back to a direct single-row POST so nothing is silently dropped.
    const payload = buildScrubbedPayload(raw)
    const batcher = activeBatcher
    if (batcher != null) {
      batcher.enqueue(payload)
    } else {
      void postFleetError(payload, config)
    }
  } catch {
    // Never throw into the host product.
  }
}

function safeGetContext(config: FleetClientConfig): FleetContext | undefined {
  try {
    return config.getContext?.()
  } catch {
    return undefined
  }
}

function mergeContext(
  base: FleetContext | undefined,
  override: FleetContext | undefined,
): FleetContext | undefined {
  if (base == null && override == null) return undefined
  return { ...(base ?? {}), ...(override ?? {}) }
}

function currentUrl(): string | undefined {
  try {
    if (typeof window !== 'undefined' && typeof window.location !== 'undefined') {
      return window.location.href
    }
  } catch {
    // Accessing location can throw in sandboxed frames; ignore.
  }
  return undefined
}
