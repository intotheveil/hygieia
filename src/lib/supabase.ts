// THE SUPABASE CLIENT. With no configuration (see ./env.ts) there is NO client: `getSupabase()`
// resolves null and the app runs in local-only mode. Importing this module never throws and, in
// local-only mode, makes no request AND loads no library. The backend is Alyssos's shared project
// (DECISIONS.md ADR-0003): Hygieia owns schema `hygieia` and nothing else, so the client is PINNED
// to it (`db.schema`) and typed with that schema's `Database` — every `from('x')` is an unqualified
// `hygieia.x`, and `public` is unreachable from this client by construction. Only the anon key may
// ever reach this file.
//
// LAZY ON PURPOSE (P5.3 perf follow-up, DECISIONS.md 2026-10-06). `@supabase/supabase-js` is
// ~40 kB gzip (GoTrue, PostgREST, Realtime, Storage clients) and was created at module load, so it
// sat in the eager graph of every route even in local-only mode, where the client is null —
// Lighthouse reported 79 % of the shared chunk unused on every audit. The library is now reached
// ONLY through `import('@supabase/supabase-js')`, which Vite emits as its own chunk; the two
// consumers that need the app's client (`AuthProvider`, `content/index.ts`) await `getSupabase()`,
// and every other module takes a `HygieiaClient` it is handed (the type import below is erased at
// build time, so it pulls nothing in). In configured mode the chunk is same-origin and precached
// by the service worker; it is requested once, when the first consumer asks.

import type { Database } from '../content/db-types.ts'
import { appEnv, type AppEnv, type SupabaseConfig } from './env'

/** Client options, exported so they are asserted rather than re-typed in tests. */
export const CLIENT_OPTIONS = {
  db: { schema: 'hygieia' },
  auth: { persistSession: true, detectSessionInUrl: true, flowType: 'pkce' },
} as const

/** The slice of the library this module uses, as a type: `typeof import(...)` is erased. */
export type SupabaseLibrary = Pick<typeof import('@supabase/supabase-js'), 'createClient'>

/** Load the library — the ONLY runtime reference to `@supabase/supabase-js` in `src/**`. */
export function loadSupabaseLibrary(): Promise<SupabaseLibrary> {
  return import('@supabase/supabase-js')
}

/** Build the pinned, typed client from an already-loaded library. Synchronous and request-free. */
export function createHygieiaClient({ createClient }: SupabaseLibrary, config: SupabaseConfig) {
  return createClient<Database, 'hygieia'>(config.url, config.anonKey, CLIENT_OPTIONS)
}

export type HygieiaClient = ReturnType<typeof createHygieiaClient>

/**
 * The client for an app mode, or null in local-only mode. Never throws synchronously; in
 * local-only mode it resolves null WITHOUT loading the library. Rejects only if the library chunk
 * itself cannot be loaded (consumers treat that like a network failure). `load` is injectable for
 * tests that must prove the library is not touched.
 */
export async function clientFor(
  env: AppEnv,
  load: () => Promise<SupabaseLibrary> = loadSupabaseLibrary,
): Promise<HygieiaClient | null> {
  if (env.mode !== 'configured') return null
  return createHygieiaClient(await load(), env.supabase)
}

let appClient: Promise<HygieiaClient | null> | undefined

/**
 * The app's client, created once on first demand: null when Supabase is not configured
 * (local-only mode). A failed library load is not memoised, so the next call retries.
 */
export function getSupabase(): Promise<HygieiaClient | null> {
  if (appClient === undefined) {
    const pending = clientFor(appEnv)
    appClient = pending
    pending.catch(() => {
      if (appClient === pending) appClient = undefined
    })
  }
  return appClient
}
