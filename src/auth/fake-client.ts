// TEST DOUBLES for the Supabase client, shared by the auth, user-data and admin tests. No network,
// no real client: a plain object with the few `auth` methods, the `profiles` table the auth modules
// use, the three per-user tables (P2.4) and the six content tables (P4.10) with every call
// RECORDED so tests can assert on table names, filters and payloads. Imported only from *.test.*
// files; never from app code.

import type { AuthChangeEvent, Session } from '@supabase/supabase-js'
import { CONTENT_TABLES } from '../content/enums.ts'
import type { HygieiaClient } from '../lib/supabase'
import { fail, type UserDataSource } from '../user/source'
import type { ProfileInsert } from './profile'

export function fakeSession(id: string, email?: string): Session {
  // reason: only `user.id` / `user.email` are read; the rest of Session is irrelevant to the tests.
  return { user: { id, email }, access_token: 'fake' } as unknown as Session
}

type ProfileMethod =
  | 'listEntries'
  | 'addEntry'
  | 'deleteEntry'
  | 'listGoals'
  | 'upsertGoal'
  | 'listSavedItems'
  | 'saveItem'
  | 'unsaveItem'
  | 'listWorkoutPlans'
  | 'createWorkoutPlan'
  | 'setWorkoutPlanStatus'
  | 'listWorkoutSessions'
  | 'addWorkoutSession'
  | 'deleteWorkoutSession'

/**
 * The P8.1 profile members of a `UserDataSource`, each answering `fail('unknown')`: for page tests
 * that hand-build a source and exercise only the P2.4 slices (fridge lists, favourites, saved
 * plans). Spread it into the literal so the type stays complete as the contract grows.
 */
export function unusedProfileMethods(): Pick<UserDataSource, ProfileMethod> {
  const unused = async <T>() => fail<T>('unknown')
  return {
    listEntries: unused,
    addEntry: unused,
    deleteEntry: unused,
    listGoals: unused,
    upsertGoal: unused,
    listSavedItems: unused,
    saveItem: unused,
    unsaveItem: unused,
    listWorkoutPlans: unused,
    createWorkoutPlan: unused,
    setWorkoutPlanStatus: unused,
    listWorkoutSessions: unused,
    addWorkoutSession: unused,
    deleteWorkoutSession: unused,
  }
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
  /** Every `.gte` / `.lte` in the chain, in order (P8.1 date ranges). Absent when none was called. */
  range?: Array<[string, 'gte' | 'lte', string]>
  /** Every `.order(column, { ascending })` in the chain, in order. Absent when none was called. */
  order?: Array<[string, boolean]>
  /** The options object of an `upsert(values, options)`, when one was given (P8.1 goals). */
  options?: unknown
}

/**
 * The DB column defaults of the P8.1 per-user tables, as the fake's "database" fills them in on a
 * written row the payload left unset (the real DB does the same with `default current_date`,
 * `default 'active'`, nullable columns). Dates are fixed so tests are deterministic.
 */
export const USER_TABLE_DEFAULTS: Record<string, Record<string, unknown>> = {
  entries: { entry_date: '2026-10-06', value: null, unit: null, payload: null, note: null },
  workout_plans: { start_date: '2026-10-06', status: 'active' },
  workout_sessions: {
    plan_id: null,
    template_id: null,
    performed_at: '2026-10-06',
    duration_min: null,
    note: null,
  },
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
  // (`select().order()`, `insert().select().single()`, `delete().eq()`, a bare `insert()`,
  // `update().eq().select().single()`, `.gte().lte()`) can be awaited at any point. The DB
  // defaults are simulated: a written row comes back WITH `user_id` and with the P8.1 column
  // defaults (`USER_TABLE_DEFAULTS`) under whatever the payload set; an `update` applies its payload
  // to the configured rows matching the `.eq` filters and answers with the first of them.
  const userTable = (table: string) => {
    const call: RecordedCall = { table, op: 'select', filters: [] }
    calls.push(call)
    const stamp = '2026-10-05T12:00:00.000Z'
    const fromDefaults = (): Record<string, unknown> => ({
      id: 'fake-row-id',
      user_id: 'fake-uid-from-db-default',
      created_at: stamp,
      updated_at: stamp,
      ...(USER_TABLE_DEFAULTS[table] ?? {}),
    })
    const settle = async (): Promise<{ data: unknown; error: unknown }> => {
      if (opts.userTables?.reject !== undefined) throw opts.userTables.reject
      if (opts.userTables?.error) return { data: null, error: opts.userTables.error }
      if (call.op === 'select') return { data: opts.userTables?.rows?.[table] ?? [], error: null }
      if (call.op === 'delete') return { data: null, error: null }
      const payload = (call.payload ?? {}) as Record<string, unknown>
      if (call.op === 'update') {
        const matching = (opts.userTables?.rows?.[table] ?? []).filter((row) =>
          call.filters.every(([column, value]) => String(row[column]) === value),
        )
        for (const row of matching) Object.assign(row, payload)
        const id = call.filters.find(([column]) => column === 'id')?.[1]
        const base = matching[0] ?? { ...fromDefaults(), ...(id === undefined ? {} : { id }) }
        return { data: { ...base, ...payload }, error: null }
      }
      return { data: { ...fromDefaults(), ...payload }, error: null }
    }
    const builder = {
      select: () => builder,
      order: (column: string, options?: { ascending?: boolean }) => {
        ;(call.order ??= []).push([column, options?.ascending ?? true])
        return builder
      },
      single: () => builder,
      maybeSingle: () => builder,
      eq: (column: string, value: string) => {
        call.filters.push([column, value])
        return builder
      },
      gte: (column: string, value: string) => {
        ;(call.range ??= []).push([column, 'gte', value])
        return builder
      },
      lte: (column: string, value: string) => {
        ;(call.range ??= []).push([column, 'lte', value])
        return builder
      },
      insert: (values: unknown) => {
        call.op = 'insert'
        call.payload = values
        return builder
      },
      upsert: (values: unknown, options?: unknown) => {
        call.op = 'upsert'
        call.payload = values
        if (options !== undefined) call.options = options
        return builder
      },
      update: (values: unknown) => {
        call.op = 'update'
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
