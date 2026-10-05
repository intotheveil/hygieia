// Fleet-telemetry — server / edge catcher (P3-T3).
//
// The runtime-agnostic half of the drop-in error catcher. It runs anywhere that
// has a global `fetch` (Node 18+, Deno, Bun, Cloudflare / Vercel / Netlify edge)
// and POSTs a scrubbed `fleet_errors` row directly to Supabase PostgREST using
// ONLY the product's write-only (anon) key. It never imports the dashboard app
// or `@supabase/supabase-js`, and it never references an operator/secret key.
//
// This module also hosts the shared internals (`postFleetError`, `deliverError`)
// reused by the client catcher (`./fleet-telemetry.ts`) so there is exactly one
// place that talks to the network — and it is fetch-only, so it stays portable
// into a browser bundle too.

import { scrubPayload } from './scrub'
import { fingerprint } from './fingerprint'
import type { FleetErrorPayload, RawErrorInput, Severity, Source } from './types'

/**
 * Everything the catcher needs to deliver a row. Carries ONLY the write-only
 * (anon) key — never an operator/service-role key.
 */
export interface FleetTelemetryConfig {
  /** Base URL of the dashboard's Supabase project (e.g. https://xyz.supabase.co). */
  supabaseUrl: string
  /** The restricted, INSERT-only anon key the product embeds. NOT a secret key. */
  writeOnlyKey: string
  /** Stable id for the product doing the reporting (FK to `fleet_products`). */
  productId: string
  /** Optional deployment environment tag (e.g. "production", "staging"). */
  environment?: string
}

/** Per-report options for a manual server/edge report. */
export interface ReportServerErrorOptions {
  severity?: Severity
  /** Defaults to 'server'; pass 'edge' from an edge runtime. */
  source?: Source
  /** Arbitrary, untrusted context — only allowlisted keys survive scrubbing. */
  context?: Record<string, unknown>
}

/** Best-effort extraction of a human message from an unknown thrown value. */
export function toErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message
  if (typeof err === 'string') return err
  if (err == null) return 'Unknown error'
  try {
    return String(err)
  } catch {
    return 'Unknown error'
  }
}

/** Best-effort extraction of a stack string from an unknown thrown value. */
export function toErrorStack(err: unknown): string | undefined {
  if (err instanceof Error && typeof err.stack === 'string') return err.stack
  return undefined
}

/**
 * Scrub a raw captured error and attach its grouping fingerprint. Both the
 * scrub (secrets + PII) and the fingerprint run BEFORE anything is sent. The
 * fingerprint is computed over the ALREADY-scrubbed message/stack so it never
 * depends on redacted content.
 */
export function buildScrubbedPayload(raw: RawErrorInput): FleetErrorPayload {
  const payload = scrubPayload(raw)
  payload.fingerprint = fingerprint({
    product_id: payload.product_id,
    error_message: payload.error_message,
    stack: payload.stack ?? undefined,
  })
  return payload
}

/**
 * POST a scrubbed payload to Supabase PostgREST with the write-only key.
 *
 * Headers exactly match the P1 asymmetric RLS: `apikey` + `Authorization:
 * Bearer` carry the anon write-only key; `Prefer: return=minimal` means the
 * insert does NOT return the row (a returning insert would need SELECT, which
 * the write-only key does not have, and would 401).
 *
 * Fire-and-forget: any network / HTTP failure is swallowed (optionally warned)
 * so telemetry can never throw into the host product it is monitoring.
 */
export async function postFleetError(
  payload: FleetErrorPayload,
  config: FleetTelemetryConfig,
): Promise<void> {
  try {
    const base = config.supabaseUrl.replace(/\/+$/, '')
    const endpoint = `${base}/rest/v1/fleet_errors`
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        apikey: config.writeOnlyKey,
        Authorization: `Bearer ${config.writeOnlyKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify(payload),
    })
    if (!response.ok) {
      warn(`insert responded ${response.status}`)
    }
  } catch (err) {
    warn(err)
  }
}

/**
 * POST a BATCH of scrubbed payloads in a single request. PostgREST accepts a
 * JSON array body at `/rest/v1/fleet_errors` and inserts every element as a row,
 * so a storm coalesced by the batcher (P5-T2) becomes ONE round-trip instead of
 * N. Same headers/contract as {@link postFleetError} (write-only key,
 * `return=minimal`). `keepalive` lets an unload-time flush survive navigation
 * (browsers cap keepalive bodies ~64KB; the batcher chunks by `maxBatchSize` to
 * stay well under). Fire-and-forget: failures are swallowed, never thrown.
 */
export async function postFleetErrors(
  payloads: FleetErrorPayload[],
  config: FleetTelemetryConfig,
): Promise<void> {
  try {
    if (!Array.isArray(payloads) || payloads.length === 0) return
    const base = config.supabaseUrl.replace(/\/+$/, '')
    const endpoint = `${base}/rest/v1/fleet_errors`
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        apikey: config.writeOnlyKey,
        Authorization: `Bearer ${config.writeOnlyKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify(payloads),
      keepalive: true,
    })
    if (!response.ok) {
      warn(`bulk insert responded ${response.status}`)
    }
  } catch (err) {
    warn(err)
  }
}

/**
 * Scrub + fingerprint + POST a raw error. The single delivery path shared by the
 * client catcher and the server reporter. Never throws.
 *
 * NOTE: this is the un-batched, single-row path. The client catcher routes
 * window errors through the P5-T2 batcher (coalesce + bulk POST); a manual
 * `reportServerError` / `wrapWithFleetTelemetry` call deliberately keeps this
 * direct single-insert path so a server handler reporting one error stays simple
 * and synchronous-to-await. A server that wants storm protection can opt into
 * `createFleetErrorBatcher` + `postFleetErrors` explicitly.
 */
export async function deliverError(
  raw: RawErrorInput,
  config: FleetTelemetryConfig,
): Promise<void> {
  try {
    const payload = buildScrubbedPayload(raw)
    await postFleetError(payload, config)
  } catch (err) {
    warn(err)
  }
}

/**
 * Report a server- or edge-side error. Runtime-agnostic: needs only a global
 * `fetch`. Scrubs + fingerprints BEFORE sending. Never throws into the caller.
 *
 * @example
 *   try { await handler(req); }
 *   catch (e) { await reportServerError(e, config, { source: 'edge' }); throw e; }
 */
export async function reportServerError(
  err: unknown,
  config: FleetTelemetryConfig,
  options: ReportServerErrorOptions = {},
): Promise<void> {
  try {
    const raw: RawErrorInput = {
      product_id: config.productId,
      severity: options.severity ?? 'error',
      source: options.source ?? 'server',
      error_message: toErrorMessage(err),
      stack: toErrorStack(err),
      environment: config.environment,
      user_context: options.context,
    }
    await deliverError(raw, config)
  } catch (reportErr) {
    warn(reportErr)
  }
}

/**
 * Wrap a request handler (or any async function) so a thrown error is reported
 * to the fleet, then RE-THROWN so the host's own error handling is unchanged.
 * Framework-agnostic — works with anything shaped `(...args) => result`.
 */
export function wrapWithFleetTelemetry<Args extends unknown[], Result>(
  handler: (...args: Args) => Result | Promise<Result>,
  config: FleetTelemetryConfig,
  options: ReportServerErrorOptions = {},
): (...args: Args) => Promise<Result> {
  return async (...args: Args): Promise<Result> => {
    try {
      return await handler(...args)
    } catch (err) {
      await reportServerError(err, config, options)
      throw err
    }
  }
}

/** Non-fatal warning that itself never throws (console may be absent on edge). */
function warn(detail: unknown): void {
  try {
    if (typeof console !== 'undefined' && typeof console.warn === 'function') {
      console.warn('[fleet-telemetry] failed to report error', detail)
    }
  } catch {
    // Nothing we can do; a telemetry system must stay silent on its own failure.
  }
}
