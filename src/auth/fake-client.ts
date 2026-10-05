// TEST DOUBLES for the Supabase client, shared by the auth, user-data and admin tests. No network,
// no real client: a plain object with the few `auth` methods, the `profiles` table the auth modules
// use, the three per-user tables (P2.4) and the six content tables (P4.10) with every call
// RECORDED so tests can assert on table names, filters and payloads. Imported only from *.test.*
// files; never from app code.

import type { AuthChangeEvent, Session } from '@supabase/supabase-js'
import { CONTENT_TABLES } from '../content/enums.ts'
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

/** One query-builder chain against a per-user or content table, as the fake saw it. */
export interface RecordedCall {
  table: string
  op: 'select' | 'insert' | 'upsert' | 'update' | 'delete'
  payload?: unknown
  /** Every `.eq(column, value)` in the chain, in order. */
  filters: Array<[string, string]>
}

export interface UserTablesOptions {
  /** Rows a `select` returns, by table name. */
  rows?: Partial<Record<string, Array<Record<string, unknown>>>>
  /** Make every per-user query answer with this error (PostgREST shape). */
  error?: { message: string; code?: string }
  /** Make every per-user query REJECT with this (a transport failure). */
  reject?: unknown
}

export interface ContentTablesOptions {
  /**
   * Rows by content table. A `select` answers with the rows matching every recorded `.eq` filter
   * (so `status = pending` narrows like the DB would); an `update` applies its payload to the rows
   * matching the filters, so a reload sees the change. The arrays are mutated in place.
   */
  rows?: Partial<Record<string, Array<Record<string, unknown>>>>
  /** Make every content query answer with this error (PostgREST shape). */
  error?: { message: string; code?: string }
  /** Make only `update` chains answer with this error (reads still work). */
  updateError?: { message: string; code?: string }
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
  /** Every chain against a per-user or content table (never `profiles`), in call order. */
  calls: RecordedCall[]
}

export function fakeClient(
  opts: {
    session?: Session | null
    otpError?: string
    oauthError?: string
    profiles?: ProfilesTableOptions
    userTables?: UserTablesOptions
    contentTables?: ContentTablesOptions
  } = {},
): FakeClient {
  const live = new Set<Listener>()
  let unsubscribed = 0
  const rows = opts.profiles?.rows ?? []
  const inserts: ProfileInsert[] = []
  const calls: RecordedCall[] = []

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
  const profilesTable = () => ({
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
  })

  // A thenable builder: every method returns the same object, so any chain the real client allows
  // (`select().order()`, `insert().select().single()`, `delete().eq()`, a bare `insert()`) can be
  // awaited at any point. The DB default is simulated: a written row comes back WITH `user_id`.
  const userTable = (table: string) => {
    const call: RecordedCall = { table, op: 'select', filters: [] }
    calls.push(call)
    const settle = async (): Promise<{ data: unknown; error: unknown }> => {
      if (opts.userTables?.reject !== undefined) throw opts.userTables.reject
      if (opts.userTables?.error) return { data: null, error: opts.userTables.error }
      if (call.op === 'select') return { data: opts.userTables?.rows?.[table] ?? [], error: null }
      if (call.op === 'delete') return { data: null, error: null }
      const payload = (call.payload ?? {}) as Record<string, unknown>
      const stamp = '2026-10-05T12:00:00.000Z'
      return {
        data: {
          id: 'fake-row-id',
          user_id: 'fake-uid-from-db-default',
          created_at: stamp,
          updated_at: stamp,
          ...payload,
        },
        error: null,
      }
    }
    const builder = {
      select: () => builder,
      order: () => builder,
      single: () => builder,
      maybeSingle: () => builder,
      eq: (column: string, value: string) => {
        call.filters.push([column, value])
        return builder
      },
      insert: (values: unknown) => {
        call.op = 'insert'
        call.payload = values
        return builder
      },
      upsert: (values: unknown) => {
        call.op = 'upsert'
        call.payload = values
        return builder
      },
      delete: () => {
        call.op = 'delete'
        return builder
      },
      then: <A, B>(
        onFulfilled?: (value: { data: unknown; error: unknown }) => A | PromiseLike<A>,
        onRejected?: (reason: unknown) => B | PromiseLike<B>,
      ) => settle().then(onFulfilled, onRejected),
    }
    return builder
  }

  // The content tables (P4.10): the same thenable builder plus `update`, with the recorded `.eq`
  // filters APPLIED to the rows, so the fake narrows by status / id like the DB would.
  const contentRows = opts.contentTables?.rows ?? {}
  const contentTable = (table: string) => {
    const call: RecordedCall = { table, op: 'select', filters: [] }
    calls.push(call)
    const matching = () =>
      (contentRows[table] ?? []).filter((row) =>
        call.filters.every(([column, value]) => String(row[column]) === value),
      )
    const settle = async (): Promise<{ data: unknown; error: unknown }> => {
      if (opts.contentTables?.error) return { data: null, error: opts.contentTables.error }
      if (call.op === 'update') {
        if (opts.contentTables?.updateError)
          return { data: null, error: opts.contentTables.updateError }
        const payload = (call.payload ?? {}) as Record<string, unknown>
        for (const row of matching()) Object.assign(row, payload)
        return { data: null, error: null }
      }
      return { data: matching(), error: null }
    }
    const builder = {
      select: () => builder,
      order: () => builder,
      eq: (column: string, value: string) => {
        call.filters.push([column, value])
        return builder
      },
      update: (values: unknown) => {
        call.op = 'update'
        call.payload = values
        return builder
      },
      then: <A, B>(
        onFulfilled?: (value: { data: unknown; error: unknown }) => A | PromiseLike<A>,
        onRejected?: (reason: unknown) => B | PromiseLike<B>,
      ) => settle().then(onFulfilled, onRejected),
    }
    return builder
  }

  const from = vi.fn((table: string) =>
    table === 'profiles'
      ? profilesTable()
      : (CONTENT_TABLES as readonly string[]).includes(table)
        ? contentTable(table)
        : userTable(table),
  )

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
    calls,
  }
}
