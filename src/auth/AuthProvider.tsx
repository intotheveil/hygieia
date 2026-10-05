// AUTH PROVIDER — one place that knows whether there is a session, who it is, and whether auth is
// available at all (P2.1). With no Supabase client (local-only mode) the state is `unavailable`
// from the first render and nothing here touches `window` or storage. With a client, the state is
// seeded from the persisted session (`getSession()`, `persistSession: true` in CLIENT_OPTIONS) and
// then follows `onAuthStateChange` — including the PKCE exchange the client runs on
// `/auth/callback` (`detectSessionInUrl: true`).

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { supabase, type HygieiaClient } from '../lib/supabase'
import { LOADING, UNAVAILABLE, reduceAuthEvent, stateFromSession, type AuthState } from './session'

export interface AuthContextValue {
  state: AuthState
  /** The client behind the state, for pages that call auth methods or read user data. */
  client: HygieiaClient | null
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({
  children,
  client = supabase,
}: {
  children: ReactNode
  /** Injected in tests (a fake) or explicitly `null`; defaults to the app's client. */
  client?: HygieiaClient | null
}) {
  const [state, setState] = useState<AuthState>(() => (client === null ? UNAVAILABLE : LOADING))

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
