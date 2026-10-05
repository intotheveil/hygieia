// PROFILE BOOTSTRAP (P2.3). A Hygieia account IS a shared-project auth user (ADR-0003 rule 6); the
// `hygieia.profiles` row is created HERE, client-side, on the first signed-in session — there is no
// trigger on `auth.users`. RLS lets a user read and insert only their own row and the column grant
// excludes `is_admin`, so the insert payload below must never carry it: admin status is granted by
// the operator in SQL (docs/ops/admin.md), and the app only ever READS it.
//
// Table name is unqualified: the client is pinned to schema `hygieia` (P1.13).

import { useEffect, useState } from 'react'
import type { HygieiaClient } from '../lib/supabase'
import { useAuth } from './AuthProvider'
import type { AuthUser } from './session'

export interface Profile {
  user_id: string
  display_name: string
  is_admin: boolean
}

/** What the first-session insert may carry. `is_admin` is deliberately absent. */
export interface ProfileInsert {
  user_id: string
  display_name: string
}

export const PROFILE_COLUMNS = 'user_id, display_name, is_admin'

interface QueryResult {
  data: unknown
  error: { message: string } | null
}

/**
 * The slice of the Supabase client this module uses, as a structural type so tests pass a plain
 * fake and the real `HygieiaClient` satisfies it without a cast.
 */
export interface ProfileClient {
  from(table: 'profiles'): {
    select(columns: string): {
      eq(column: 'user_id', value: string): { maybeSingle(): PromiseLike<QueryResult> }
    }
    insert(values: ProfileInsert): {
      select(columns: string): { single(): PromiseLike<QueryResult> }
    }
  }
}

/**
 * The real client seen through `ProfileClient`. A plain structural assignment makes TypeScript walk
 * Supabase's query-builder generics until it gives up (TS2589); this adapter pins the exact chain
 * the module uses, so the compiler still checks every method and argument against the real client.
 */
export function profileClientFor(client: HygieiaClient): ProfileClient {
  return {
    from: (table) => ({
      select: (columns) => ({
        eq: (column, value) => ({
          maybeSingle: () => client.from(table).select(columns).eq(column, value).maybeSingle(),
        }),
      }),
      insert: (values) => ({
        select: (columns) => ({
          single: () => client.from(table).insert(values).select(columns).single(),
        }),
      }),
    }),
  }
}

/** The email's local part, or `user` when there is no usable email. */
export function displayNameFor(email: string | null): string {
  if (!email) return 'user'
  const local = email.split('@')[0]?.trim() ?? ''
  return local === '' ? 'user' : local
}

function toProfile(data: unknown): Profile | null {
  if (typeof data !== 'object' || data === null) return null
  const row = data as Record<string, unknown>
  if (typeof row.user_id !== 'string' || typeof row.display_name !== 'string') return null
  return { user_id: row.user_id, display_name: row.display_name, is_admin: row.is_admin === true }
}

/** Read the user's profile row, creating it on first sign-in. Throws on a database error. */
export async function ensureProfile(client: ProfileClient, user: AuthUser): Promise<Profile> {
  const found = await client
    .from('profiles')
    .select(PROFILE_COLUMNS)
    .eq('user_id', user.id)
    .maybeSingle()
  if (found.error) throw new Error(found.error.message)
  const existing = toProfile(found.data)
  if (existing) return existing

  const payload: ProfileInsert = { user_id: user.id, display_name: displayNameFor(user.email) }
  const inserted = await client.from('profiles').insert(payload).select(PROFILE_COLUMNS).single()
  if (inserted.error) throw new Error(inserted.error.message)
  const created = toProfile(inserted.data)
  if (!created) throw new Error('profile insert returned no row')
  return created
}

export interface ProfileState {
  status: 'idle' | 'loading' | 'ready' | 'error'
  profile: Profile | null
  isAdmin: boolean
}

const IDLE: ProfileState = { status: 'idle', profile: null, isAdmin: false }
const LOADING: ProfileState = { status: 'loading', profile: null, isAdmin: false }
const ERROR: ProfileState = { status: 'error', profile: null, isAdmin: false }

/** The outcome of the bootstrap for one user id; anything else is derived at render time. */
interface Settled {
  uid: string
  result: ProfileState
}

/**
 * The signed-in user's profile; `idle` whenever there is no session. `isAdmin` is true only when
 * the row says so — never derived from an email or anything client-side.
 */
export function useProfile(): ProfileState {
  const { state, client } = useAuth()
  const user = state.status === 'signed-in' ? state.user : null
  const uid = user?.id ?? null
  const email = user?.email ?? null
  // Only the async outcome is state; idle (no user) and loading (outcome is for another or no
  // user) are derived, so the effect never sets state synchronously.
  const [settled, setSettled] = useState<Settled | null>(null)

  useEffect(() => {
    if (uid === null || client === null) return
    let active = true
    ensureProfile(profileClientFor(client), { id: uid, email }).then(
      (row) => {
        if (active)
          setSettled({ uid, result: { status: 'ready', profile: row, isAdmin: row.is_admin } })
      },
      () => {
        if (active) setSettled({ uid, result: ERROR })
      },
    )
    return () => {
      active = false
    }
  }, [uid, email, client])

  if (uid === null || client === null) return IDLE
  return settled?.uid === uid ? settled.result : LOADING
}
