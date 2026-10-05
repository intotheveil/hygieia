// useUserData (P2.4): the per-user source for the current session. `disabled('local-only')` when
// there is no Supabase client (or no AuthProvider at all), `disabled('signed-out')` while the
// session is loading or absent, otherwise the supabase source bound to the signed-in user. The
// instance is stable for a given (client, uid) pair, so effects may depend on it.

import { useMemo } from 'react'
import { useOptionalAuth } from '../auth/AuthProvider'
import { disabledSource } from './disabled'
import type { UserDataSource } from './source'
import { supabaseSource, userDataClientFor } from './supabase'

export function useUserData(): UserDataSource {
  const auth = useOptionalAuth()
  const client = auth?.client ?? null
  const uid = auth?.state.status === 'signed-in' ? auth.state.user.id : null
  return useMemo(() => {
    if (client === null) return disabledSource('local-only')
    if (uid === null) return disabledSource('signed-out')
    return supabaseSource(userDataClientFor(client), uid)
  }, [client, uid])
}
