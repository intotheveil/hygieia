// THE SUPABASE CLIENT. With no configuration (see ./env.ts) there is NO client: `supabase` is null
// and the app runs in local-only mode. Importing this module never throws and, in local-only mode,
// makes no request. The backend is Alyssos's shared project (DECISIONS.md ADR-0003): Hygieia owns
// schema `hygieia` and nothing else, so the client is PINNED to it (`db.schema`) and typed with
// that schema's `Database` — every `from('x')` is an unqualified `hygieia.x`, and `public` is
// unreachable from this client by construction. Only the anon key may ever reach this file.

import { createClient } from '@supabase/supabase-js'
import type { Database } from '../content/db-types.ts'
import { appEnv, type AppEnv, type SupabaseConfig } from './env'

/** Client options, exported so they are asserted rather than re-typed in tests. */
export const CLIENT_OPTIONS = {
  db: { schema: 'hygieia' },
  auth: { persistSession: true, detectSessionInUrl: true, flowType: 'pkce' },
} as const

export function createHygieiaClient(config: SupabaseConfig) {
  return createClient<Database, 'hygieia'>(config.url, config.anonKey, CLIENT_OPTIONS)
}

export type HygieiaClient = ReturnType<typeof createHygieiaClient>

/** The client for an app mode, or null in local-only mode. Never throws. */
export function clientFor(env: AppEnv): HygieiaClient | null {
  return env.mode === 'configured' ? createHygieiaClient(env.supabase) : null
}

/** The app's client: null when Supabase is not configured (local-only mode). */
export const supabase: HygieiaClient | null = clientFor(appEnv)
