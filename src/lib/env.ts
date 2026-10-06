// BROWSER ENV — the only place src/** reads the Supabase configuration.
//
// Hygieia must keep working with NO backend configured: CI builds without env vars, and until a
// Supabase project exists (DECISIONS.md ADR-0001) the deployed site has none either. So a missing
// or malformed value never throws here. It selects LOCAL-ONLY mode, in which nothing is sent
// anywhere.
//
// Only the allow-listed names are read, each by its full literal name. Never pass
// `import.meta.env` around as a whole object: Vite then inlines EVERY `VITE_*` variable present at
// build time into the public bundle, which would bypass the lint allow-list in eslint.config.js.
//
// VITE_AUTH_GOOGLE is a feature FLAG, not configuration: the Google provider needs operator setup
// on the shared project (OPERATOR-P2 OP2.a), and until then Supabase answers "Unsupported provider"
// (incident 2026-10-06). The sign-in page shows "Continue with Google" only when the flag is on.

declare global {
  interface ImportMetaEnv {
    readonly VITE_SUPABASE_URL?: string
    readonly VITE_SUPABASE_ANON_KEY?: string
    readonly VITE_AUTH_GOOGLE?: string
    // Fleet telemetry (PLAN P6.1); read ONLY in src/telemetry.ts, each by its full literal name.
    readonly VITE_FLEET_URL?: string
    readonly VITE_FLEET_KEY?: string
    readonly VITE_FLEET_PRODUCT_ID?: string
  }
}

/** The raw values as Vite provides them (undefined when unset). */
export interface RawSupabaseEnv {
  VITE_SUPABASE_URL?: string
  VITE_SUPABASE_ANON_KEY?: string
  VITE_AUTH_GOOGLE?: string
}

/** A usable Supabase configuration: a parsed http(s) URL and a non-empty anon key. */
export interface SupabaseConfig {
  url: string
  anonKey: string
}

export type LocalOnlyReason = 'missing-url' | 'missing-anon-key' | 'invalid-url'

export type AppEnv =
  { mode: 'configured'; supabase: SupabaseConfig } | { mode: 'local'; reason: LocalOnlyReason }

/**
 * Decide the app mode from raw env values. Pure: never throws, never reads globals.
 * Both names must be present (non-blank) and the URL must be an absolute http(s) URL, otherwise
 * the result is local-only mode with the first reason found.
 */
export function resolveAppEnv(raw: RawSupabaseEnv): AppEnv {
  const url = typeof raw.VITE_SUPABASE_URL === 'string' ? raw.VITE_SUPABASE_URL.trim() : ''
  const anonKey =
    typeof raw.VITE_SUPABASE_ANON_KEY === 'string' ? raw.VITE_SUPABASE_ANON_KEY.trim() : ''
  if (url === '') return { mode: 'local', reason: 'missing-url' }
  if (anonKey === '') return { mode: 'local', reason: 'missing-anon-key' }
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return { mode: 'local', reason: 'invalid-url' }
  }
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    return { mode: 'local', reason: 'invalid-url' }
  }
  return { mode: 'configured', supabase: { url, anonKey } }
}

/** The mode this build runs in, resolved once from the two allowed names. */
export const appEnv: AppEnv = resolveAppEnv({
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
})

/** True when no Supabase backend is configured. */
export const isLocalOnly: boolean = appEnv.mode === 'local'

/**
 * Whether "Continue with Google" may be shown. Pure: true only when VITE_AUTH_GOOGLE is exactly
 * `1` or `true` (trimmed; `true` case-insensitive). Anything else — unset, blank, `0`, `yes` — is
 * off: a provider that needs operator setup is never shown on hope.
 */
export function googleSignInEnabled(raw: Pick<RawSupabaseEnv, 'VITE_AUTH_GOOGLE'>): boolean {
  if (typeof raw.VITE_AUTH_GOOGLE !== 'string') return false
  const value = raw.VITE_AUTH_GOOGLE.trim()
  return value === '1' || value.toLowerCase() === 'true'
}

/** True when this build may offer Google sign-in (flag set at build time, after OP2.a). */
export const isGoogleSignInEnabled: boolean = googleSignInEnabled({
  VITE_AUTH_GOOGLE: import.meta.env.VITE_AUTH_GOOGLE,
})
