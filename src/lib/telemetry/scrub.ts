// PII / secret scrubber. SECURITY-CRITICAL (CLAUDE.md §3.1, SPEC §4): this runs
// inside the drop-in telemetry snippet BEFORE any error payload leaves a product,
// so it MUST be pure, synchronous, and dependency-free apart from `./types`.
// No Node-only or browser-only APIs. Prefer over-redaction to leakage.

import { ALLOWED_CONTEXT_KEYS, type FleetErrorPayload, type RawErrorInput } from './types'

const REDACTED = '[REDACTED]'

// Ordered list of secret/PII patterns. Order matters: structural, high-signal
// patterns (private keys, JWTs, provider-prefixed tokens, key=value assignments)
// run before broad PII patterns so the latter can't chop up a longer secret.
type Rule = { re: RegExp; to: string | ((...m: string[]) => string) }

const RULES: readonly Rule[] = [
  // --- Secrets: structural blocks -------------------------------------------
  // PEM private key blocks (RSA/EC/OPENSSH/PGP/etc.).
  {
    re: /-----BEGIN[^-]*PRIVATE KEY-----[\s\S]*?-----END[^-]*PRIVATE KEY-----/g,
    to: '[REDACTED_PRIVATE_KEY]',
  },
  // TRUNCATED PEM private key: a BEGIN marker whose matching END was cut off
  // (log truncation, a copy/paste that lost the tail, a stack that clips it).
  // The complete-block rule above runs FIRST, so by the time we get here any
  // BEGIN still present has no END — redact from the marker to the next blank
  // line or end-of-input rather than leaking the exposed key body. Must run
  // before the JWT/base64 PII rules so they can't nibble the key body first.
  {
    re: /-----BEGIN[^-]*PRIVATE KEY-----[\s\S]*?(?=\r?\n[ \t]*\r?\n|$)/g,
    to: '[REDACTED_PRIVATE_KEY]',
  },
  // JSON Web Tokens: header.payload.signature, header starts `eyJ`.
  {
    re: /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g,
    to: '[REDACTED_JWT]',
  },

  // --- Secrets: auth headers ------------------------------------------------
  // `Authorization: <anything>` header value (covers Basic/Bearer/custom).
  { re: /\bAuthorization\s*:\s*[^\r\n,;'"]+/gi, to: 'Authorization: [REDACTED]' },
  // `Bearer <token>` anywhere.
  { re: /\bBearer\s+[A-Za-z0-9._~+/=-]+/gi, to: 'Bearer [REDACTED]' },

  // --- Secrets: provider-prefixed tokens ------------------------------------
  // Stripe secret/publishable/restricted keys (live + test).
  { re: /\b(?:sk|pk|rk)_(?:live|test)_[A-Za-z0-9]{10,}/g, to: '[REDACTED_KEY]' },
  // OpenAI-style keys: `sk-...` (incl. `sk-proj-...`), 20+ chars.
  { re: /\bsk-[A-Za-z0-9_-]{20,}/g, to: '[REDACTED_KEY]' },
  // AWS access key IDs (AKIA/ASIA/AGPA/AIDA...).
  {
    re: /\b(?:AKIA|ASIA|AGPA|AIDA|AROA|AIPA|ANPA|ANVA)[0-9A-Z]{12,}\b/g,
    to: '[REDACTED_KEY]',
  },
  // Google API keys: `AIza` + 35 chars.
  { re: /\bAIza[0-9A-Za-z_-]{30,}\b/g, to: '[REDACTED_KEY]' },
  // GitHub personal-access / OAuth / server tokens.
  { re: /\bgithub_pat_[A-Za-z0-9_]{20,}/g, to: '[REDACTED_KEY]' },
  { re: /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{20,}/g, to: '[REDACTED_KEY]' },
  // Slack tokens: `xox[baprs]-...`.
  { re: /\bxox[baprs]-[A-Za-z0-9-]{10,}/g, to: '[REDACTED_KEY]' },

  // --- Secrets: key=value / key:"value" assignments -------------------------
  // Any identifier containing key/token/password/secret/auth followed by
  // `=` or `:` and a value (also catches secrets hidden in query params).
  {
    re: /\b([A-Za-z0-9_.-]*(?:api[_-]?key|secret|passwo?rd|passwd|pwd|token|auth)[A-Za-z0-9_.-]*)\s*[=:]\s*(["']?)([^\s"'&,;)}]+)\2/gi,
    to: (_m: string, key: string): string => `${key}=${REDACTED}`,
  },

  // --- Bare high-entropy token: DELIBERATELY NOT ADDED (P3 reviewer backlog) --
  // A prefix-less, non-assigned high-entropy token (e.g. a raw 40-char API key
  // pasted on its own) is NOT caught here, and that is an intentional decision,
  // not an oversight. Every rule that would match "a long random-looking blob"
  // also matches things that legitimately appear in a stack trace and MUST be
  // preserved for the error to stay diagnosable:
  //   - git SHAs (40 lowercase hex), short SHAs, content/bundle hashes;
  //   - UUIDs (`3f2504e0-4f89-41d3-9a0c-0305e82c3301`);
  //   - minified module ids / webpack chunk hashes in `at fn (chunk-AbC12.js)`;
  //   - source-map `file.js:LINE:COL` frames.
  // A length+charset heuristic that fired on those would mangle real stack
  // frames — corrupting the exact data this feature exists to show — for a
  // marginal gain over the rules we DO have. High-value bare tokens already
  // carry provider prefixes (`sk-`, `ghp_`, `AKIA…`, `AIza…`, `eyJ…`) and are
  // caught above; anything assigned (`key=`, `token:`) is caught below. So we
  // rely on the prefix + assignment + structural rules and accept the residual
  // risk, consistent with the scrubber's conservative-over-redaction posture.

  // --- PII ------------------------------------------------------------------
  // Email addresses.
  {
    re: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g,
    to: '[REDACTED_EMAIL]',
  },
  // IPv4 addresses (before phone/CC so its dots aren't misread).
  { re: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g, to: '[REDACTED_IP]' },
  // Credit-card-like sequences: 13–16 digits, optional single space/dash groups.
  { re: /\b\d(?:[ -]?\d){12,15}\b/g, to: '[REDACTED_CC]' },
  // Phone numbers: optional +, 7–15 digits with common separators.
  {
    re: /(?<![\w.])\+?\d(?:[\d().\s-]{5,})\d(?![\w])/g,
    to: '[REDACTED_PHONE]',
  },
]

/**
 * Redact secrets and PII from a free-text string. Pure and defensive: any
 * non-string input yields an empty string rather than throwing.
 */
export function scrubText(input: string): string {
  if (typeof input !== 'string' || input.length === 0) return typeof input === 'string' ? input : ''
  let out = input
  for (const { re, to } of RULES) {
    // reason: RegExp#replace overloads differ for string vs function; the union
    // of `to` is safe here because each rule pairs a global RegExp with its
    // matching replacement kind.
    out = out.replace(re, to as string)
  }
  return out
}

/**
 * Redact a URL. All query-string VALUES are removed wholesale (tokens routinely
 * hide in query params), then the whole thing is run through `scrubText` to
 * catch secrets embedded in the path.
 */
export function scrubUrl(input: string): string {
  if (typeof input !== 'string' || input.length === 0) return typeof input === 'string' ? input : ''
  const withoutQueryValues = input.replace(
    /([?&][^=&#\s]+=)([^&#\s]*)/g,
    (_m: string, keyPart: string): string => `${keyPart}${REDACTED}`,
  )
  return scrubText(withoutQueryValues)
}

function coerceString(value: unknown): string {
  if (typeof value === 'string') return value
  if (value == null) return ''
  return String(value)
}

/**
 * Rebuild `user_context_json` as a strict ALLOWLIST. Only keys in
 * ALLOWED_CONTEXT_KEYS survive; each surviving value is coerced to a string and
 * scrubbed (defense in depth). Everything else is dropped so PII cannot be
 * smuggled through an unexpected context key. Returns null when nothing remains.
 */
export function scrubContext(
  context: Record<string, unknown> | undefined,
): Record<string, string> | null {
  if (context == null || typeof context !== 'object') return null
  const out: Record<string, string> = {}
  for (const key of ALLOWED_CONTEXT_KEYS) {
    if (!Object.prototype.hasOwnProperty.call(context, key)) continue
    const value = (context as Record<string, unknown>)[key]
    if (value == null) continue
    out[key] = scrubText(coerceString(value))
  }
  return Object.keys(out).length > 0 ? out : null
}

/**
 * Scrub a raw captured error into a `fleet_errors`-ready payload. Never throws
 * on odd input; always returns a well-formed FleetErrorPayload. `fingerprint`
 * is intentionally not set here (added downstream by P3-T2).
 */
export function scrubPayload(raw: RawErrorInput): FleetErrorPayload {
  const occurred_at =
    typeof raw?.occurred_at === 'string' && raw.occurred_at.length > 0
      ? raw.occurred_at
      : new Date().toISOString()

  return {
    product_id: coerceString(raw?.product_id),
    occurred_at,
    severity: raw?.severity,
    source: raw?.source,
    error_message: scrubText(coerceString(raw?.error_message)),
    stack: raw?.stack != null ? scrubText(coerceString(raw.stack)) : null,
    url: raw?.url != null ? scrubUrl(coerceString(raw.url)) : null,
    environment: raw?.environment != null ? coerceString(raw.environment) : null,
    user_context_json: scrubContext(raw?.user_context),
  }
}
