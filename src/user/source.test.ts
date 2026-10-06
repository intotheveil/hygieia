import { renderHook, waitFor } from '@testing-library/react'
import { createElement, type ReactNode } from 'react'
import { AuthProvider } from '../auth/AuthProvider'
import { fakeClient, fakeSession } from '../auth/fake-client'
import type { HygieiaClient } from '../lib/supabase'
import { disabledSource } from './disabled'
import {
  CADENCES,
  ENTRY_KINDS,
  ENTRY_UNITS,
  GOAL_KINDS,
  PLAN_STATUSES,
  SAVED_ITEM_KINDS,
  USER_TABLES,
  type UserDataSource,
  type WorkoutSessionExercise,
} from './source'
import {
  ENTRY_COLUMNS,
  FAVOURITE_COLUMNS,
  FRIDGE_LIST_COLUMNS,
  GOAL_COLUMNS,
  GOALS_ON_CONFLICT,
  SAVED_ITEM_COLUMNS,
  SAVED_PLAN_COLUMNS,
  WORKOUT_PLAN_COLUMNS,
  WORKOUT_SESSION_COLUMNS,
  classifyError,
  exercisesToJson,
  supabaseSource,
  toEntry,
  toWorkoutSession,
  toWorkoutSet,
  userDataClientFor,
} from './supabase'
import { useUserData } from './useUserData'

const PLAN = { days: [{ meals: ['greek-salad'] }], kcal: 1800 }
const SQUAT = '11111111-1111-4111-8111-111111111111'
const EXERCISES: WorkoutSessionExercise[] = [
  { exercise_id: SQUAT, sets: [{ reps: 10, weight_kg: 60, rpe: 7, done: true }] },
]
const RANGE = { from: '2026-10-01', to: '2026-10-07' }

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
    // P8.1
    () => source.addEntry({ kind: 'water', value: 250, unit: 'ml' }),
    () => source.deleteEntry('en-1'),
    () => source.upsertGoal({ kind: 'water', target: 2000, unit: 'ml', cadence: 'daily' }),
    () => source.saveItem('workout', 'wt-1'),
    () => source.unsaveItem('workout', 'wt-1'),
    () =>
      source.createWorkoutPlan({ template_id: 'wt-1', name: 'Push', weeks: 4, days_per_week: 3 }),
    () => source.setWorkoutPlanStatus('wp-1', 'completed'),
    () => source.addWorkoutSession({ exercises: EXERCISES }),
    () => source.deleteWorkoutSession('ws-1'),
  ]
}

/** The P2.4 reads: honestly empty when disabled. */
function lists(source: UserDataSource) {
  return [source.fridgeLists.list, source.favourites.list, source.savedPlans.list]
}

/** The P8.1 reads: refused when disabled (a profile with no user has nothing to be empty of). */
function profileReads(source: UserDataSource) {
  return [
    () => source.listEntries(),
    () => source.listEntries(RANGE),
    () => source.listGoals(),
    () => source.listSavedItems(),
    () => source.listWorkoutPlans(),
    () => source.listWorkoutSessions(),
    () => source.listWorkoutSessions(RANGE),
  ]
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
      for (const read of profileReads(source)) {
        await expect(read()).resolves.toEqual({ ok: false, error: 'disabled' })
      }
    },
  )
})

describe('the P8.1 contract constants', () => {
  it('names the eight per-user tables', () => {
    expect(USER_TABLES).toEqual({
      fridgeLists: 'fridge_lists',
      savedPlans: 'saved_plans',
      favourites: 'favourites',
      entries: 'entries',
      goals: 'goals',
      savedItems: 'saved_items',
      workoutPlans: 'workout_plans',
      workoutSessions: 'workout_sessions',
    })
  })

  it('carries the enum lists verbatim (the DB CHECKs are pinned to these in db-schema-contract)', () => {
    expect(ENTRY_KINDS).toEqual([
      'weight',
      'meal',
      'workout',
      'water',
      'sleep',
      'steps',
      'skincare',
      'nails',
      'mood',
    ])
    expect(ENTRY_UNITS).toEqual(['kg', 'kcal', 'min', 'ml', 'h', 'steps', 'score'])
    expect(GOAL_KINDS).toEqual(['water', 'sleep', 'workout', 'steps', 'weight', 'skincare'])
    expect(CADENCES).toEqual(['daily', 'weekly'])
    expect(SAVED_ITEM_KINDS).toEqual([
      'workout',
      'skincare_routine',
      'health_tip',
      'skincare_tip',
      'diet',
    ])
    expect(PLAN_STATUSES).toEqual(['active', 'completed', 'abandoned'])
    expect(GOALS_ON_CONFLICT).toBe('user_id,kind')
  })
})

describe('supabaseSource', () => {
  const uid = '33333333-3333-4333-8333-333333333333'
  const bound = (fake: ReturnType<typeof fakeClient>) =>
    supabaseSource(userDataClientFor(fake.client), uid)
  const everything = (source: UserDataSource) => [
    ...lists(source),
    ...profileReads(source),
    ...writes(source),
  ]
  const ALL_COLUMNS = [
    FRIDGE_LIST_COLUMNS,
    SAVED_PLAN_COLUMNS,
    FAVOURITE_COLUMNS,
    ENTRY_COLUMNS,
    GOAL_COLUMNS,
    SAVED_ITEM_COLUMNS,
    WORKOUT_PLAN_COLUMNS,
    WORKOUT_SESSION_COLUMNS,
  ]

  it('is bound to the user id and targets exactly the eight per-user tables', async () => {
    const fake = fakeClient()
    const source = bound(fake)
    expect(source.kind).toBe('supabase')
    expect(source.userId).toBe(uid)
    for (const op of everything(source)) await op()
    const tables = new Set(fake.calls.map((c) => c.table))
    expect(tables).toEqual(
      new Set([
        'fridge_lists',
        'saved_plans',
        'favourites',
        'entries',
        'goals',
        'saved_items',
        'workout_plans',
        'workout_sessions',
      ]),
    )
    expect(tables).toEqual(new Set(Object.values(USER_TABLES)))
    expect(fake.from).not.toHaveBeenCalledWith('profiles')
  })

  it('NEVER sends user_id — not in a payload, not as a filter; the DB default supplies it', async () => {
    const fake = fakeClient()
    const source = bound(fake)
    for (const op of everything(source)) await op()
    expect(fake.calls.length).toBeGreaterThanOrEqual(26)
    for (const call of fake.calls) {
      if (call.payload !== undefined) expect(call.payload).not.toHaveProperty('user_id')
      expect(call.filters.map(([column]) => column)).not.toContain('user_id')
      expect((call.range ?? []).map(([column]) => column)).not.toContain('user_id')
      expect((call.order ?? []).map(([column]) => column)).not.toContain('user_id')
    }
    for (const columns of ALL_COLUMNS) {
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

  it('fridge lists: create INSERTs and rename UPDATEs … WHERE id, never sending id or user_id; remove by id', async () => {
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
    const renamed = await source.fridgeLists.save({
      id: 'fl-9',
      name: 'Renamed',
      ingredient_slugs: [],
    })
    expect(renamed).toEqual({
      ok: true,
      data: {
        id: 'fl-9',
        name: 'Renamed',
        ingredient_slugs: [],
        updated_at: '2026-10-05T12:00:00.000Z',
      },
    })
    await source.fridgeLists.remove('fl-9')
    // The authenticated grants are insert/update (name, ingredient_slugs) only: an upsert carrying
    // `id` (on conflict (id) do update set id = …) is refused with permission denied in configured
    // mode, so a rename must be an UPDATE filtered by id with exactly the two granted columns.
    expect(fake.calls.map((c) => [c.op, c.payload, c.filters])).toEqual([
      ['insert', { name: 'Weekend', ingredient_slugs: ['feta'] }, []],
      ['update', { name: 'Renamed', ingredient_slugs: [] }, [['id', 'fl-9']]],
      ['delete', undefined, [['id', 'fl-9']]],
    ])
    for (const call of fake.calls.slice(0, 2)) {
      expect(Object.keys(call.payload as object).sort()).toEqual(['ingredient_slugs', 'name'])
      expect(call.options).toBeUndefined()
    }
    expect(fake.calls.map((c) => c.op)).not.toContain('upsert')
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
    for (const op of everything(bound(denied))) {
      await expect(op()).resolves.toEqual({ ok: false, error: 'unknown' })
    }
    const offline = fakeClient({ userTables: { reject: new TypeError('Failed to fetch') } })
    for (const op of everything(bound(offline))) {
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

  // --- P8.1 entries ---------------------------------------------------------------------------

  describe('entries', () => {
    it('addEntry sends only the keys the caller set (DB defaults fill the rest) and parses the row', async () => {
      const fake = fakeClient()
      const source = bound(fake)
      const minimal = await source.addEntry({ kind: 'water', value: 250, unit: 'ml' })
      expect(minimal).toEqual({
        ok: true,
        data: {
          id: 'fake-row-id',
          kind: 'water',
          entry_date: '2026-10-06',
          value: 250,
          unit: 'ml',
          payload: null,
          note: null,
          created_at: '2026-10-05T12:00:00.000Z',
        },
      })
      const full = await source.addEntry({
        kind: 'meal',
        entry_date: '2026-10-03',
        value: 650,
        unit: 'kcal',
        payload: { recipe_id: 'rc-1' },
        note: 'lunch',
      })
      expect(full.ok && full.data.payload).toEqual({ recipe_id: 'rc-1' })
      const detailOnly = await source.addEntry({
        kind: 'skincare',
        payload: { routine_slug: 'am' },
      })
      expect(detailOnly.ok && detailOnly.data).toMatchObject({
        kind: 'skincare',
        value: null,
        unit: null,
        payload: { routine_slug: 'am' },
      })
      expect(fake.calls.map((c) => [c.table, c.op, c.payload])).toEqual([
        ['entries', 'insert', { kind: 'water', value: 250, unit: 'ml' }],
        [
          'entries',
          'insert',
          {
            kind: 'meal',
            entry_date: '2026-10-03',
            value: 650,
            unit: 'kcal',
            payload: { recipe_id: 'rc-1' },
            note: 'lunch',
          },
        ],
        ['entries', 'insert', { kind: 'skincare', payload: { routine_slug: 'am' } }],
      ])
      expect(fake.calls[0]?.payload).not.toHaveProperty('entry_date')
      expect(fake.calls[0]?.payload).not.toHaveProperty('id')
    })

    it('listEntries orders entry_date desc, created_at desc, and applies the inclusive range only when given', async () => {
      const fake = fakeClient({
        userTables: {
          rows: {
            entries: [
              {
                id: 'e1',
                kind: 'weight',
                entry_date: '2026-10-05',
                value: 80.5,
                unit: 'kg',
                payload: null,
                note: null,
                created_at: 't',
                user_id: 'ignored',
              },
            ],
          },
        },
      })
      const source = bound(fake)
      await expect(source.listEntries()).resolves.toEqual({
        ok: true,
        data: [
          {
            id: 'e1',
            kind: 'weight',
            entry_date: '2026-10-05',
            value: 80.5,
            unit: 'kg',
            payload: null,
            note: null,
            created_at: 't',
          },
        ],
      })
      await source.listEntries(RANGE)
      expect(fake.calls.map((c) => [c.op, c.range, c.order])).toEqual([
        [
          'select',
          undefined,
          [
            ['entry_date', false],
            ['created_at', false],
          ],
        ],
        [
          'select',
          [
            ['entry_date', 'gte', '2026-10-01'],
            ['entry_date', 'lte', '2026-10-07'],
          ],
          [
            ['entry_date', false],
            ['created_at', false],
          ],
        ],
      ])
    })

    it('deleteEntry deletes by id', async () => {
      const fake = fakeClient()
      await expect(bound(fake).deleteEntry('e9')).resolves.toEqual({ ok: true, data: undefined })
      expect(fake.calls).toEqual([{ table: 'entries', op: 'delete', filters: [['id', 'e9']] }])
    })

    it('toEntry refuses a kind or unit outside the union, a negative value, and a non-string note', () => {
      const good = {
        id: 'e',
        kind: 'sleep',
        entry_date: '2026-10-05',
        value: 7.5,
        unit: 'h',
        payload: null,
        note: null,
      }
      expect(toEntry(good)).toMatchObject({ kind: 'sleep', value: 7.5, unit: 'h', created_at: '' })
      expect(toEntry({ ...good, kind: 'coffee' })).toBeNull()
      expect(toEntry({ ...good, unit: 'cups' })).toBeNull()
      expect(toEntry({ ...good, value: -1 })).toBeNull()
      expect(toEntry({ ...good, value: '7.5' })).toBeNull()
      expect(toEntry({ ...good, note: 42 })).toBeNull()
      expect(toEntry({ ...good, entry_date: undefined })).toBeNull()
      expect(toEntry([good])).toBeNull()
    })
  })

  // --- P8.1 goals -----------------------------------------------------------------------------

  describe('goals', () => {
    it('upsertGoal sends exactly { kind, target, unit, cadence } with onConflict user_id,kind and parses the row', async () => {
      const fake = fakeClient()
      const source = bound(fake)
      const saved = await source.upsertGoal({
        kind: 'water',
        target: 2000,
        unit: 'ml',
        cadence: 'daily',
      })
      expect(saved).toEqual({
        ok: true,
        data: {
          kind: 'water',
          target: 2000,
          unit: 'ml',
          cadence: 'daily',
          updated_at: '2026-10-05T12:00:00.000Z',
        },
      })
      expect(fake.calls).toEqual([
        {
          table: 'goals',
          op: 'upsert',
          payload: { kind: 'water', target: 2000, unit: 'ml', cadence: 'daily' },
          options: { onConflict: 'user_id,kind' },
          filters: [],
        },
      ])
    })

    it('listGoals parses the rows; a cadence or kind outside the union is "unknown"', async () => {
      const rows = [{ kind: 'sleep', target: 8, unit: 'h', cadence: 'daily', updated_at: 't' }]
      const fake = fakeClient({ userTables: { rows: { goals: rows } } })
      await expect(bound(fake).listGoals()).resolves.toEqual({ ok: true, data: rows })
      const bad = fakeClient({
        userTables: { rows: { goals: [{ ...rows[0], cadence: 'monthly' }] } },
      })
      await expect(bound(bad).listGoals()).resolves.toEqual({ ok: false, error: 'unknown' })
      const badKind = fakeClient({
        userTables: { rows: { goals: [{ ...rows[0], kind: 'meal' }] } },
      })
      await expect(bound(badKind).listGoals()).resolves.toEqual({ ok: false, error: 'unknown' })
    })
  })

  // --- P8.1 saved items -----------------------------------------------------------------------

  describe('saved items', () => {
    it('saveItem inserts { kind, item_id } and returns the row; unsaveItem deletes by kind AND item_id', async () => {
      const fake = fakeClient()
      const source = bound(fake)
      await expect(source.saveItem('skincare_routine', 'sr-1')).resolves.toEqual({
        ok: true,
        data: { kind: 'skincare_routine', item_id: 'sr-1', created_at: '2026-10-05T12:00:00.000Z' },
      })
      await expect(source.unsaveItem('skincare_routine', 'sr-1')).resolves.toEqual({
        ok: true,
        data: undefined,
      })
      expect(fake.calls).toEqual([
        {
          table: 'saved_items',
          op: 'insert',
          payload: { kind: 'skincare_routine', item_id: 'sr-1' },
          filters: [],
        },
        {
          table: 'saved_items',
          op: 'delete',
          filters: [
            ['kind', 'skincare_routine'],
            ['item_id', 'sr-1'],
          ],
        },
      ])
    })

    it('listSavedItems parses rows and refuses an unknown kind', async () => {
      const rows = [{ kind: 'diet', item_id: 'd-1', created_at: 't' }]
      const fake = fakeClient({ userTables: { rows: { saved_items: rows } } })
      await expect(bound(fake).listSavedItems()).resolves.toEqual({ ok: true, data: rows })
      const bad = fakeClient({
        userTables: { rows: { saved_items: [{ kind: 'recipe', item_id: 'r', created_at: 't' }] } },
      })
      await expect(bound(bad).listSavedItems()).resolves.toEqual({ ok: false, error: 'unknown' })
    })
  })

  // --- P8.1 workout plans ---------------------------------------------------------------------

  describe('workout plans', () => {
    const planRow = {
      id: 'wp-1',
      template_id: 'wt-1',
      name: 'Push / pull',
      weeks: 6,
      days_per_week: 4,
      start_date: '2026-10-01',
      status: 'active',
      created_at: 'c',
      updated_at: 'u',
      user_id: 'ignored',
    }

    it('createWorkoutPlan never sends status (DB default active) and sends start_date only when given', async () => {
      const fake = fakeClient()
      const source = bound(fake)
      const created = await source.createWorkoutPlan({
        template_id: 'wt-1',
        name: 'Push',
        weeks: 4,
        days_per_week: 3,
      })
      expect(created).toEqual({
        ok: true,
        data: {
          id: 'fake-row-id',
          template_id: 'wt-1',
          name: 'Push',
          weeks: 4,
          days_per_week: 3,
          start_date: '2026-10-06',
          status: 'active',
          created_at: '2026-10-05T12:00:00.000Z',
          updated_at: '2026-10-05T12:00:00.000Z',
        },
      })
      await source.createWorkoutPlan({
        template_id: 'wt-1',
        name: 'Push',
        weeks: 4,
        days_per_week: 3,
        start_date: '2026-11-01',
      })
      expect(fake.calls.map((c) => c.payload)).toEqual([
        { template_id: 'wt-1', name: 'Push', weeks: 4, days_per_week: 3 },
        { template_id: 'wt-1', name: 'Push', weeks: 4, days_per_week: 3, start_date: '2026-11-01' },
      ])
      for (const call of fake.calls) expect(call.payload).not.toHaveProperty('status')
    })

    it('setWorkoutPlanStatus updates { status } on exactly that id and returns the updated row', async () => {
      const fake = fakeClient({ userTables: { rows: { workout_plans: [{ ...planRow }] } } })
      const source = bound(fake)
      const done = await source.setWorkoutPlanStatus('wp-1', 'completed')
      expect(done.ok && done.data).toMatchObject({
        id: 'wp-1',
        name: 'Push / pull',
        status: 'completed',
      })
      expect(done.ok && done.data).not.toHaveProperty('user_id')
      expect(fake.calls).toEqual([
        {
          table: 'workout_plans',
          op: 'update',
          payload: { status: 'completed' },
          filters: [['id', 'wp-1']],
        },
      ])
      // The next list sees the change (the fake applied it to the matching row).
      const listed = await source.listWorkoutPlans()
      expect(listed.ok && listed.data[0]?.status).toBe('completed')
    })

    it('listWorkoutPlans orders updated_at desc and refuses a status outside the union', async () => {
      const fake = fakeClient({ userTables: { rows: { workout_plans: [{ ...planRow }] } } })
      const listed = await bound(fake).listWorkoutPlans()
      expect(listed).toEqual({
        ok: true,
        data: [
          {
            id: 'wp-1',
            template_id: 'wt-1',
            name: 'Push / pull',
            weeks: 6,
            days_per_week: 4,
            start_date: '2026-10-01',
            status: 'active',
            created_at: 'c',
            updated_at: 'u',
          },
        ],
      })
      expect(fake.calls[0]?.order).toEqual([['updated_at', false]])
      const bad = fakeClient({
        userTables: { rows: { workout_plans: [{ ...planRow, status: 'paused' }] } },
      })
      await expect(bound(bad).listWorkoutPlans()).resolves.toEqual({ ok: false, error: 'unknown' })
    })
  })

  // --- P8.1 workout sessions ------------------------------------------------------------------

  describe('workout sessions', () => {
    it('addWorkoutSession normalises exercises to the documented keys only and omits unset columns', async () => {
      const fake = fakeClient()
      const source = bound(fake)
      const sloppy = [
        {
          exercise_id: SQUAT,
          sets: [{ reps: 8, weight_kg: 70, rpe: null, done: true, extra: 'dropped' }],
          name: 'dropped too',
        },
      ] as unknown as WorkoutSessionExercise[]
      const added = await source.addWorkoutSession({ exercises: sloppy, plan_id: 'wp-1' })
      expect(added).toEqual({
        ok: true,
        data: {
          id: 'fake-row-id',
          plan_id: 'wp-1',
          template_id: null,
          performed_at: '2026-10-06',
          duration_min: null,
          exercises: [
            { exercise_id: SQUAT, sets: [{ reps: 8, weight_kg: 70, rpe: null, done: true }] },
          ],
          note: null,
          created_at: '2026-10-05T12:00:00.000Z',
        },
      })
      expect(fake.calls[0]?.payload).toEqual({
        plan_id: 'wp-1',
        exercises: [
          { exercise_id: SQUAT, sets: [{ reps: 8, weight_kg: 70, rpe: null, done: true }] },
        ],
      })
      await source.addWorkoutSession({
        exercises: EXERCISES,
        template_id: 'wt-1',
        performed_at: '2026-10-02',
        duration_min: 45,
        note: 'felt strong',
      })
      expect(fake.calls[1]?.payload).toEqual({
        template_id: 'wt-1',
        performed_at: '2026-10-02',
        duration_min: 45,
        exercises: exercisesToJson(EXERCISES),
        note: 'felt strong',
      })
    })

    it('listWorkoutSessions orders performed_at desc (then created_at) and applies the inclusive range only when given', async () => {
      const row = {
        id: 'ws-1',
        plan_id: null,
        template_id: 'wt-1',
        performed_at: '2026-10-02',
        duration_min: 40,
        exercises: exercisesToJson(EXERCISES),
        note: null,
        created_at: 't',
        user_id: 'ignored',
      }
      const fake = fakeClient({ userTables: { rows: { workout_sessions: [row] } } })
      const source = bound(fake)
      const listed = await source.listWorkoutSessions()
      expect(listed).toEqual({
        ok: true,
        data: [
          {
            id: 'ws-1',
            plan_id: null,
            template_id: 'wt-1',
            performed_at: '2026-10-02',
            duration_min: 40,
            exercises: EXERCISES,
            note: null,
            created_at: 't',
          },
        ],
      })
      await source.listWorkoutSessions(RANGE)
      expect(fake.calls.map((c) => [c.range, c.order])).toEqual([
        [
          undefined,
          [
            ['performed_at', false],
            ['created_at', false],
          ],
        ],
        [
          [
            ['performed_at', 'gte', '2026-10-01'],
            ['performed_at', 'lte', '2026-10-07'],
          ],
          [
            ['performed_at', false],
            ['created_at', false],
          ],
        ],
      ])
    })

    it('deleteWorkoutSession deletes by id', async () => {
      const fake = fakeClient()
      await expect(bound(fake).deleteWorkoutSession('ws-3')).resolves.toEqual({
        ok: true,
        data: undefined,
      })
      expect(fake.calls).toEqual([
        { table: 'workout_sessions', op: 'delete', filters: [['id', 'ws-3']] },
      ])
    })

    it('the jsonb exercises are validated on read: shape, integer reps >= 0, weight >= 0, rpe 1..10, non-empty', () => {
      expect(toWorkoutSet({ reps: 10, weight_kg: null, rpe: null, done: false })).toEqual({
        reps: 10,
        weight_kg: null,
        rpe: null,
        done: false,
      })
      expect(toWorkoutSet({ reps: 10.5, weight_kg: null, rpe: null, done: false })).toBeNull()
      expect(toWorkoutSet({ reps: -1, weight_kg: null, rpe: null, done: false })).toBeNull()
      expect(toWorkoutSet({ reps: 1, weight_kg: -5, rpe: null, done: false })).toBeNull()
      expect(toWorkoutSet({ reps: 1, weight_kg: 5, rpe: 11, done: false })).toBeNull()
      expect(toWorkoutSet({ reps: 1, weight_kg: 5, rpe: 0, done: false })).toBeNull()
      expect(toWorkoutSet({ reps: 1, weight_kg: 5, rpe: 5, done: 'yes' })).toBeNull()
      const session = {
        id: 'ws',
        plan_id: null,
        template_id: null,
        performed_at: '2026-10-02',
        duration_min: null,
        exercises: exercisesToJson(EXERCISES),
        note: null,
      }
      expect(toWorkoutSession(session)).toMatchObject({ exercises: EXERCISES, created_at: '' })
      expect(toWorkoutSession({ ...session, exercises: [] })).toBeNull()
      expect(toWorkoutSession({ ...session, exercises: 'squats' })).toBeNull()
      expect(toWorkoutSession({ ...session, exercises: [{ exercise_id: 1, sets: [] }] })).toBeNull()
      expect(
        toWorkoutSession({ ...session, exercises: [{ exercise_id: SQUAT, sets: 'none' }] }),
      ).toBeNull()
      expect(toWorkoutSession({ ...session, duration_min: '45' })).toBeNull()
      expect(toWorkoutSession({ ...session, plan_id: 7 })).toBeNull()
    })
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
