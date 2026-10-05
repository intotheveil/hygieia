// THE SUPABASE CLIENT. With no configuration (see ./env.ts) there is NO client: `supabase` is null
// and the app runs in local-only mode. Importing this module never throws and, in local-only mode,
// makes no request. The project itself does not exist yet (DECISIONS.md ADR-0001): when it is
// created it must be an EU-region project, and only the anon key may ever reach this file.

import { createClient } from '@supabase/supabase-js'
import { appEnv, type AppEnv, type SupabaseConfig } from './env'

/** Client options, exported so they are asserted rather than re-typed in tests. */
export const CLIENT_OPTIONS = {
  auth: { persistSession: true, detectSessionInUrl: true, flowType: 'pkce' },
} as const

export function createHygieiaClient(config: SupabaseConfig) {
  return createClient(config.url, config.anonKey, CLIENT_OPTIONS)
}

export type HygieiaClient = ReturnType<typeof createHygieiaClient>

/** The client for an app mode, or null in local-only mode. Never throws. */
export function clientFor(env: AppEnv): HygieiaClient | null {
  return env.mode === 'configured' ? createHygieiaClient(env.supabase) : null
}

/** The app's client: null when Supabase is not configured (local-only mode). */
export const supabase: HygieiaClient | null = clientFor(appEnv)
