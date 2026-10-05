import { renderHook, waitFor } from '@testing-library/react'
import { createElement, type ReactNode } from 'react'
import { AuthProvider } from '../auth/AuthProvider'
import { fakeClient, fakeSession } from '../auth/fake-client'
import type { HygieiaClient } from '../lib/supabase'
import { disabledSource } from './disabled'
import { USER_TABLES, type UserDataSource } from './source'
import {
  FAVOURITE_COLUMNS,
  FRIDGE_LIST_COLUMNS,
  SAVED_PLAN_COLUMNS,
  classifyError,
  supabaseSource,
  userDataClientFor,
} from './supabase'
import { useUserData } from './useUserData'

const PLAN = { days: [{ meals: ['greek-salad'] }], kcal: 1800 }

/** Every write the interface offers, so a test can sweep them all. */
function writes(source: UserDataSource) {
  return [
    () => source.fridgeLists.save({ name: 'Weekend', ingredient_slugs: ['feta', 'tomato'] }),
    () => source.fridgeLists.save({ id: 'fl-1', name: 'Weekend', ingredient_slugs: [] }),
    () => source.fridgeLists.remove('fl-1'),
    () => source.favourites.add('rc-1'),
    () => source.favourites.remove('rc-1'),
    () => source.savedPlans.save({ diet_id: 'd-1', week_start: '2026-10-05', plan: PLAN }),
    () => source.savedPlans.remove('sp-1'),
  ]
}

function lists(source: UserDataSource) {
  return [source.fridgeLists.list, source.favourites.list, source.savedPlans.list]
}

describe('disabledSource', () => {
  it.each(['local-only', 'signed-out'] as const)(
    'refuses every write with error "disabled" and lists nothing (%s)',
    async (reason) => {
      const source = disabledSource(reason)
      expect(source.kind).toBe('disabled')
      expect(source.reason).toBe(reason)
      expect(source.userId).toBeUndefined()
      for (const write of writes(source)) {
        await expect(write()).resolves.toEqual({ ok: false, error: 'disabled' })
      }
      for (const list of lists(source)) {
        await expect(list()).resolves.toEqual({ ok: true, data: [] })
      }
    },
  )
})

describe('supabaseSource', () => {
  const uid = '33333333-3333-4333-8333-333333333333'
  const bound = (fake: ReturnType<typeof fakeClient>) =>
    supabaseSource(userDataClientFor(fake.client), uid)

  it('is bound to the user id and targets exactly the three per-user tables', async () => {
    const fake = fakeClient()
    const source = bound(fake)
    expect(source.kind).toBe('supabase')
    expect(source.userId).toBe(uid)
    for (const op of [...lists(source), ...writes(source)]) await op()
    const tables = new Set(fake.calls.map((c) => c.table))
    expect(tables).toEqual(new Set(['fridge_lists', 'saved_plans', 'favourites']))
    expect(tables).toEqual(new Set(Object.values(USER_TABLES)))
    expect(fake.from).not.toHaveBeenCalledWith('profiles')
  })

  it('NEVER sends user_id — not in a payload, not as a filter; the DB default supplies it', async () => {
    const fake = fakeClient()
    const source = bound(fake)
    for (const op of [...lists(source), ...writes(source)]) await op()
    expect(fake.calls.length).toBeGreaterThanOrEqual(10)
    for (const call of fake.calls) {
      if (call.payload !== undefined) expect(call.payload).not.toHaveProperty('user_id')
      expect(call.filters.map(([column]) => column)).not.toContain('user_id')
    }
    for (const columns of [FRIDGE_LIST_COLUMNS, SAVED_PLAN_COLUMNS, FAVOURITE_COLUMNS]) {
      expect(columns).not.toMatch(/\*/)
      expect(columns).not.toMatch(/user_id/)
    }
    // The id never appears anywhere in what went over the wire.
    expect(JSON.stringify(fake.calls)).not.toContain(uid)
  })

  it('favourites: add inserts { recipe_id }, remove deletes by recipe_id', async () => {
    const fake = fakeClient()
    const source = bound(fake)
    await expect(source.favourites.add('rc-7')).resolves.toEqual({ ok: true, data: undefined })
    await expect(source.favourites.remove('rc-7')).resolves.toEqual({ ok: true, data: undefined })
    expect(fake.calls).toEqual([
      { table: 'favourites', op: 'insert', payload: { recipe_id: 'rc-7' }, filters: [] },
      { table: 'favourites', op: 'delete', filters: [['recipe_id', 'rc-7']] },
    ])
  })

  it('fridge lists: save upserts { name, ingredient_slugs } with id only when given; remove by id', async () => {
    const fake = fakeClient()
    const source = bound(fake)
    const created = await source.fridgeLists.save({ name: 'Weekend', ingredient_slugs: ['feta'] })
    expect(created).toEqual({
      ok: true,
      data: {
        id: 'fake-row-id',
        name: 'Weekend',
        ingredient_slugs: ['feta'],
        updated_at: '2026-10-05T12:00:00.000Z',
      },
    })
    await source.fridgeLists.save({ id: 'fl-9', name: 'Renamed', ingredient_slugs: [] })
    await source.fridgeLists.remove('fl-9')
    expect(fake.calls.map((c) => [c.op, c.payload, c.filters])).toEqual([
      ['upsert', { name: 'Weekend', ingredient_slugs: ['feta'] }, []],
      ['upsert', { id: 'fl-9', name: 'Renamed', ingredient_slugs: [] }, []],
      ['delete', undefined, [['id', 'fl-9']]],
    ])
    expect(fake.calls[0]?.payload).not.toHaveProperty('id')
  })

  it('saved plans: save inserts { diet_id, week_start, plan }; remove by id', async () => {
    const fake = fakeClient()
    const source = bound(fake)
    const saved = await source.savedPlans.save({
      diet_id: 'd-1',
      week_start: '2026-10-05',
      plan: PLAN,
    })
    expect(saved.ok).toBe(true)
    if (saved.ok) {
      expect(saved.data).toMatchObject({ id: 'fake-row-id', diet_id: 'd-1', plan: PLAN })
    }
    await source.savedPlans.remove('sp-2')
    expect(fake.calls.map((c) => [c.table, c.op, c.payload, c.filters])).toEqual([
      ['saved_plans', 'insert', { diet_id: 'd-1', week_start: '2026-10-05', plan: PLAN }, []],
      ['saved_plans', 'delete', undefined, [['id', 'sp-2']]],
    ])
  })

  it('lists parse the rows the DB returns and drop nothing the UI needs', async () => {
    const fake = fakeClient({
      userTables: {
        rows: {
          fridge_lists: [
            { id: 'a', name: 'A', ingredient_slugs: ['x'], updated_at: 't1', user_id: 'ignored' },
          ],
          favourites: [{ recipe_id: 'r', created_at: 't2' }],
          saved_plans: [{ id: 'p', diet_id: 'd', week_start: '2026-10-05', plan: PLAN }],
        },
      },
    })
    const source = bound(fake)
    await expect(source.fridgeLists.list()).resolves.toEqual({
      ok: true,
      data: [{ id: 'a', name: 'A', ingredient_slugs: ['x'], updated_at: 't1' }],
    })
    await expect(source.favourites.list()).resolves.toEqual({
      ok: true,
      data: [{ recipe_id: 'r', created_at: 't2' }],
    })
    await expect(source.savedPlans.list()).resolves.toEqual({
      ok: true,
      data: [{ id: 'p', diet_id: 'd', week_start: '2026-10-05', plan: PLAN, created_at: '' }],
    })
    expect(fake.calls.every((c) => c.op === 'select')).toBe(true)
  })

  it('a malformed row makes the read "unknown" rather than throwing', async () => {
    const fake = fakeClient({ userTables: { rows: { favourites: [{ nope: 1 }] } } })
    await expect(bound(fake).favourites.list()).resolves.toEqual({ ok: false, error: 'unknown' })
  })

  it('a server error is "unknown"; a transport failure is "network"; nothing ever throws', async () => {
    const denied = fakeClient({
      userTables: { error: { message: 'permission denied', code: '42501' } },
    })
    for (const op of [...lists(bound(denied)), ...writes(bound(denied))]) {
      await expect(op()).resolves.toEqual({ ok: false, error: 'unknown' })
    }
    const offline = fakeClient({ userTables: { reject: new TypeError('Failed to fetch') } })
    for (const op of [...lists(bound(offline)), ...writes(bound(offline))]) {
      await expect(op()).resolves.toEqual({ ok: false, error: 'network' })
    }
    const codeless = fakeClient({
      userTables: { error: { message: 'TypeError: Failed to fetch' } },
    })
    await expect(bound(codeless).favourites.list()).resolves.toEqual({
      ok: false,
      error: 'network',
    })
  })

  it('classifyError: SQLSTATE/PGRST codes are unknown, TypeError and codeless errors are network', () => {
    expect(classifyError({ message: 'x', code: 'PGRST301' })).toBe('unknown')
    expect(classifyError({ message: 'x', code: '23505' })).toBe('unknown')
    expect(classifyError({ message: 'x', code: '' })).toBe('network')
    expect(classifyError({ message: 'x' })).toBe('network')
    expect(classifyError(new TypeError('Failed to fetch'))).toBe('network')
    expect(classifyError(new Error('boom'))).toBe('unknown')
    expect(classifyError('string')).toBe('unknown')
  })
})

describe('useUserData', () => {
  const uid = '44444444-4444-4444-8444-444444444444'
  const wrap =
    (client: HygieiaClient | null) =>
    ({ children }: { children: ReactNode }) =>
      createElement(AuthProvider, { client, children })

  it('is disabled (local-only) with no client, and outside any AuthProvider', () => {
    const local = renderHook(() => useUserData(), { wrapper: wrap(null) })
    expect(local.result.current).toMatchObject({ kind: 'disabled', reason: 'local-only' })
    const bare = renderHook(() => useUserData())
    expect(bare.result.current).toMatchObject({ kind: 'disabled', reason: 'local-only' })
  })

  it('is disabled (signed-out) while loading and when anonymous', async () => {
    const fake = fakeClient()
    const { result } = renderHook(() => useUserData(), { wrapper: wrap(fake.client) })
    expect(result.current).toMatchObject({ kind: 'disabled', reason: 'signed-out' })
    await waitFor(() => expect(fake.getSession).toHaveBeenCalled())
    await waitFor(() =>
      expect(result.current).toMatchObject({ kind: 'disabled', reason: 'signed-out' }),
    )
    expect(fake.calls).toHaveLength(0)
  })

  it('is the supabase source bound to the uid when signed in, and stable across renders', async () => {
    const fake = fakeClient({ session: fakeSession(uid, 'u@example.test') })
    const { result, rerender } = renderHook(() => useUserData(), { wrapper: wrap(fake.client) })
    await waitFor(() => expect(result.current.kind).toBe('supabase'))
    expect(result.current.userId).toBe(uid)
    expect(result.current.reason).toBeUndefined()
    const first = result.current
    rerender()
    expect(result.current).toBe(first)
  })

  it('switches back to signed-out on SIGNED_OUT', async () => {
    const fake = fakeClient({ session: fakeSession(uid) })
    const { result } = renderHook(() => useUserData(), { wrapper: wrap(fake.client) })
    await waitFor(() => expect(result.current.kind).toBe('supabase'))
    fake.emit('SIGNED_OUT', null)
    await waitFor(() =>
      expect(result.current).toMatchObject({ kind: 'disabled', reason: 'signed-out' }),
    )
  })
})
