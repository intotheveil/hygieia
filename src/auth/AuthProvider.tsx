// AUTH PROVIDER — one place that knows whether there is a session, who it is, and whether auth is
// available at all (P2.1). With no Supabase client (local-only mode) the state is `unavailable`
// from the first render and nothing here touches `window` or storage. With a client, the state is
// seeded from the persisted session (`getSession()`, `persistSession: true` in CLIENT_OPTIONS) and
// then follows `onAuthStateChange` — including the PKCE exchange the client runs on
// `/auth/callback` (`detectSessionInUrl: true`).
//
// The app's client is created LAZILY (src/lib/supabase.ts, P5.3 perf follow-up): with no `client`
// prop the provider asks `getSupabase()` once mounted. In local-only mode that is known
// synchronously (`appEnv`), so the first render is still `unavailable` and nothing is loaded; in
// configured mode the state is `loading` until the library chunk and the persisted session have
// both arrived. Tests inject a fake (or `null`) and never reach `getSupabase()`.

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { appEnv } from '../lib/env'
import { getSupabase, type HygieiaClient } from '../lib/supabase'
import { LOADING, UNAVAILABLE, reduceAuthEvent, stateFromSession, type AuthState } from './session'

export interface AuthContextValue {
  state: AuthState
  /** The client behind the state, for pages that call auth methods or read user data. */
  client: HygieiaClient | null
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

/** Whether a client is still to come when none was injected: only in configured mode. */
const APP_CLIENT_PENDING = appEnv.mode === 'configured'

export function AuthProvider({
  children,
  client: injected,
}: {
  children: ReactNode
  /** Injected in tests (a fake) or explicitly `null`; absent → the app's client, resolved lazily. */
  client?: HygieiaClient | null
}) {
  const [appClient, setAppClient] = useState<HygieiaClient | null>(null)
  const client = injected === undefined ? appClient : injected
  const pending = injected === undefined && APP_CLIENT_PENDING
  const [state, setState] = useState<AuthState>(() =>
    client === null && !pending ? UNAVAILABLE : LOADING,
  )

  // Resolve the app's client once, when nothing was injected and the build is configured.
  useEffect(() => {
    if (!pending) return
    let active = true
    getSupabase().then(
      (resolved) => {
        if (active) setAppClient(resolved)
      },
      () => {
        // The library chunk did not load: auth is unavailable, honestly, rather than loading forever.
        if (active) setState(UNAVAILABLE)
      },
    )
    return () => {
      active = false
    }
  }, [pending])

  useEffect(() => {
    if (client === null) return
    let active = true
    // Events first, so nothing emitted during the initial read is missed.
    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((event, session) => {
      if (active) setState((prev) => reduceAuthEvent(prev, event, session))
    })
    void client.auth.getSession().then(({ data }) => {
      // An event that already arrived knows more than the snapshot: only seed while still loading.
      if (active)
        setState((prev) => (prev.status === 'loading' ? stateFromSession(data.session) : prev))
    })
    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [client])

  const signOut = useCallback(async () => {
    if (client === null) return
    await client.auth.signOut()
  }, [client])

  const value = useMemo<AuthContextValue>(
    () => ({ state, client, signOut }),
    [state, client, signOut],
  )
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/** The auth state, the client and `signOut`. Must be used under AuthProvider. */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>')
  return ctx
}

/**
 * The same value, or null outside the provider. For components that appear on pages which may be
 * rendered without auth (the header's AccountMenu, per-user hooks) and must then degrade to
 * "no account service" rather than crash.
 */
export function useOptionalAuth(): AuthContextValue | null {
  return useContext(AuthContext)
}
