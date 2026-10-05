/**
 * Deterministic error fingerprinting for grouping duplicate `fleet_errors`.
 *
 * SPEC §5: `fingerprint` = hash of (product + message + top stack frame),
 * used to collapse duplicate errors in the feed (show "×N").
 *
 * This module is intentionally PURE and dependency-free so it can run in the
 * client, the server, and edge runtimes inside the reusable telemetry snippet
 * (P3-T3). It therefore does NOT use Node `crypto` or the async browser
 * `SubtleCrypto` — the hash (FNV-1a, 64-bit) is implemented inline and is fully
 * synchronous and portable across every JS runtime that has `BigInt` (ES2020+).
 *
 * It never throws: any missing / odd input is coerced to a safe string.
 */

/**
 * Minimal input shape. Kept inline (not imported from `./types`) so this file
 * has no build-time coupling to the parallel scrubber task (P3-T1). The shape is
 * a structural subset of a `fleet_errors` payload.
 */
export interface FingerprintInput {
  product_id: string
  error_message: string
  stack?: string
}

/**
 * Normalize a human error message so that trivially-different duplicates group
 * to the same fingerprint. The transforms are deliberately CONSERVATIVE — they
 * only strip bits that are known to vary between otherwise-identical errors:
 *
 *   1. Whitespace   — runs of whitespace collapse to a single space, then trim.
 *   2. UUIDs        — `550e8400-e29b-41d4-a716-446655440000` -> `<uuid>`.
 *   3. Hex addresses— `0x1a2b3c` (memory addresses / handles)  -> `<hex>`.
 *   4. Quoted lits  — `"..."`, `'...'`, `` `...` `` string literals -> `<str>`.
 *                     (interpolated values differ per-occurrence; the surrounding
 *                     message is what identifies the error.)
 *   5. Long numbers — runs of 4+ digits (ids, timestamps, ports) -> `<n>`.
 *                     3-digit runs are LEFT intact on purpose so meaningful codes
 *                     like HTTP `404` vs `500` stay distinct.
 *
 * So `user 4821 not found` and `user 9999 not found` -> `user <n> not found`
 * (identical), while `404 not found` and `500 not found` remain distinct.
 *
 * Case is preserved (not lowercased) — differing case in a message is rare and
 * usually meaningful; lowercasing is intentionally not done.
 */
function normalizeMessage(message: string): string {
  return message
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '<uuid>')
    .replace(/0x[0-9a-f]+/gi, '<hex>')
    .replace(/"[^"]*"|'[^']*'|`[^`]*`/g, '<str>')
    .replace(/\d{4,}/g, '<n>')
}

/**
 * Extract the single most-identifying line from a stack trace: the top frame.
 *
 * Prefers the first line that looks like a real V8/Firefox/Safari frame
 * (a trimmed line beginning with `at ` or containing an `@` locator). Falls
 * back to the first non-empty line that is not obviously the error header
 * (`Error: ...`). Returns '' when there is nothing usable.
 */
function topStackFrame(stack: string): string {
  const lines = stack.split('\n')

  for (const raw of lines) {
    const line = raw.trim()
    if (line === '') continue
    // V8 style: "at fn (file:line:col)"; Firefox/Safari style: "fn@file:line:col"
    if (/^at\s/.test(line) || /@.+:\d+/.test(line)) {
      return line
    }
  }

  // No recognizable frame — use the first meaningful non-header line, if any.
  for (const raw of lines) {
    const line = raw.trim()
    if (line === '') continue
    if (/^[a-z0-9_.$]*error\b/i.test(line)) continue // skip "Error: ..." header
    return line
  }

  return ''
}

// FNV-1a, 64-bit. Constants per the reference spec. BigInt keeps this exact and
// portable without relying on 32-bit two's-complement bitwise behaviour.
// NOTE: expressed via the `BigInt(...)` constructor rather than `123n` literal
// syntax because ARES's tsconfig targets ES2017 (BigInt literals need ES2020+).
// The values are bit-identical to the literals, so fingerprints stay compatible
// with the other products byte-for-byte.
const FNV_OFFSET_BASIS_64 = BigInt('14695981039346656037')
const FNV_PRIME_64 = BigInt('1099511628211')
const MASK_64 = (BigInt(1) << BigInt(64)) - BigInt(1)

/**
 * Synchronous FNV-1a 64-bit hash of a string, returned as base36 (0-9a-z).
 * Iterates UTF-16 code units — deterministic for identical input strings.
 */
function fnv1a64(input: string): string {
  let hash = FNV_OFFSET_BASIS_64
  for (let i = 0; i < input.length; i += 1) {
    hash ^= BigInt(input.charCodeAt(i))
    hash = (hash * FNV_PRIME_64) & MASK_64
  }
  return hash.toString(36)
}

// Field separator that cannot appear in a normal message/frame, so distinct
// field boundaries can never collide (e.g. product "ab" + msg "c" vs "a" + "bc").
const SEP = '\u0000'

/**
 * Compute the deterministic grouping fingerprint for an error.
 *
 * Identical (product_id, normalized message, top stack frame) triples always
 * produce the same short string; a change to ANY of the three produces a
 * different one. Never throws on missing or malformed input.
 */
export function fingerprint(input: FingerprintInput): string {
  const productId = String(input?.product_id ?? '')
  const message = normalizeMessage(String(input?.error_message ?? ''))
  const frame = topStackFrame(String(input?.stack ?? ''))

  return fnv1a64([productId, message, frame].join(SEP))
}
