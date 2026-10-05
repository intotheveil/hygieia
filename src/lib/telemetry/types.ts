// Telemetry payload contract shared by the drop-in client snippet (P3-T3),
// the fingerprint hasher (P3-T2), and the error feed. This module is
// dependency-free on purpose: it must be safe to bundle into arbitrary
// product environments (client, server, edge).

/** Matches the `error_severity` Postgres enum on `fleet_errors`. */
export type Severity = 'critical' | 'error' | 'warning'

/** Matches the `error_source` Postgres enum on `fleet_errors`. */
export type Source = 'client' | 'server' | 'edge'

/**
 * What the drop-in catcher captures at the source, BEFORE any scrubbing.
 * This is untrusted: fields may contain secrets or PII, and `user_context`
 * may contain arbitrary keys/values. `scrubPayload` is what makes it safe.
 */
export interface RawErrorInput {
  product_id: string
  /** ISO-8601 timestamp; if omitted the payload is stamped at scrub time. */
  occurred_at?: string
  severity: Severity
  source: Source
  error_message: string
  stack?: string
  url?: string
  environment?: string
  /** Arbitrary, untrusted context. Only the allowlisted keys survive scrubbing. */
  user_context?: Record<string, unknown>
}

/**
 * A scrubbed row ready to INSERT into `public.fleet_errors`. Column names
 * mirror the P1 schema exactly. `fingerprint` is added by P3-T2 downstream,
 * so it is optional here.
 */
export interface FleetErrorPayload {
  product_id: string
  occurred_at: string
  severity: Severity
  source: Source
  error_message: string
  stack: string | null
  url: string | null
  environment: string | null
  /** NON-PII only: exactly the allowlisted keys (SPEC §5). */
  user_context_json: Record<string, string> | null
  fingerprint?: string
}

/**
 * The ONLY keys allowed to survive into `user_context_json`. Everything else
 * is dropped so a product cannot smuggle PII through an unexpected context
 * key. NON-PII per SPEC §5.
 */
export const ALLOWED_CONTEXT_KEYS = ['role', 'page', 'action'] as const

export type AllowedContextKey = (typeof ALLOWED_CONTEXT_KEYS)[number]
