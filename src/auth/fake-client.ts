// TEST DOUBLES for the Supabase client, shared by the auth tests. No network, no real client:
// a plain object with the few `auth` methods and the `profiles` table the auth modules use.
// Imported only from *.test.* files; never from app code.

import type { AuthChangeEvent, Session } from '@supabase/supabase-js'
import type { HygieiaClient } from '../lib/supabase'
import type { ProfileInsert } from './profile'

export function fakeSession(id: string, email?: string): Session {
  // reason: only `user.id` / `user.email` are read; the rest of Session is irrelevant to the tests.
  return { user: { id, email }, access_token: 'fake' } as unknown as Session
}

type Listener = (event: AuthChangeEvent, session: Session | null) => void

export interface ProfilesTableOptions {
  rows?: Array<Record<string, unknown>>
  selectError?: string
  insertError?: string
}

export interface FakeClient {
  client: HygieiaClient
  /** Fire an `onAuthStateChange` event at every live subscriber. */
  emit: (event: AuthChangeEvent, session: Session | null) => void
  listeners: () => number
  unsubscribed: () => number
  getSession: ReturnType<typeof vi.fn>
  signOut: ReturnType<typeof vi.fn>
  signInWithOtp: ReturnType<typeof vi.fn>
  signInWithOAuth: ReturnType<typeof vi.fn>
  from: ReturnType<typeof vi.fn>
  inserts: ProfileInsert[]
}

export function fakeClient(
  opts: {
    session?: Session | null
    otpError?: string
    oauthError?: string
    profiles?: ProfilesTableOptions
  } = {},
): FakeClient {
  const live = new Set<Listener>()
  let unsubscribed = 0
  const rows = opts.profiles?.rows ?? []
  const inserts: ProfileInsert[] = []

  const getSession = vi.fn(async () => ({ data: { session: opts.session ?? null }, error: null }))
  const signOut = vi.fn(async () => ({ error: null }))
  const signInWithOtp = vi.fn(async () => ({
    data: { user: null, session: null },
    error: opts.otpError ? { message: opts.otpError } : null,
  }))
  const signInWithOAuth = vi.fn(async () => ({
    data: { provider: 'google', url: 'https://accounts.example/oauth' },
    error: opts.oauthError ? { message: opts.oauthError } : null,
  }))
  const onAuthStateChange = (cb: Listener) => {
    live.add(cb)
    return {
      data: {
        subscription: {
          unsubscribe: () => {
            live.delete(cb)
            unsubscribed += 1
          },
        },
      },
    }
  }
  const from = vi.fn(() => ({
    select: () => ({
      eq: (_column: string, value: string) => ({
        maybeSingle: async () => ({
          data: rows.find((r) => r.user_id === value) ?? null,
          error: opts.profiles?.selectError ? { message: opts.profiles.selectError } : null,
        }),
      }),
    }),
    insert: (values: ProfileInsert) => {
      inserts.push(values)
      return {
        select: () => ({
          single: async () => ({
            data: opts.profiles?.insertError ? null : { ...values, is_admin: false },
            error: opts.profiles?.insertError ? { message: opts.profiles.insertError } : null,
          }),
        }),
      }
    },
  }))

  const client = {
    auth: { getSession, onAuthStateChange, signOut, signInWithOtp, signInWithOAuth },
    from,
    // reason: a structural fake of the handful of members the auth modules call; the real client's
    // generic query-builder types cannot be satisfied by a hand-written double.
  } as unknown as HygieiaClient

  return {
    client,
    emit: (event, session) => live.forEach((cb) => cb(event, session)),
    listeners: () => live.size,
    unsubscribed: () => unsubscribed,
    getSession,
    signOut,
    signInWithOtp,
    signInWithOAuth,
    from,
    inserts,
  }
}
