// SUPABASE SOURCE (P2.4, P8.1): per-user rows in schema `hygieia`, bound to the signed-in user. The
// user is NEVER sent: `user_id` has `default auth.uid()` and RLS (`user_id = auth.uid()` on every
// verb, proven in `db:gate`) scopes every read and write to the caller, so no filter on `user_id`
// is needed either — the server is the authority, not a client-side `eq`. Table names are
// unqualified: the client is pinned to schema `hygieia` (P1.13).
//
// Like profile.ts, the module talks to the client through a small typed adapter: a direct
// structural assignment of the real client to a narrow interface makes TypeScript walk Supabase's
// query-builder generics until it gives up (TS2589). `userDataClientFor` pins the exact chains, so
// the compiler still checks every method and argument against the real client.
//
// Writes send only the keys the caller set (`defined`): an absent `entry_date` / `start_date` /
// `performed_at` lets the DB default (`current_date`) apply, and `status` is never written on
// create. Reads parse defensively: an enum value outside the `as const` union, or a jsonb
// `exercises` payload off the documented shape, makes the read `unknown` rather than a crash.

import type { Json } from '../content/db-types'
import type { HygieiaClient } from '../lib/supabase'
import {
  CADENCES,
  ENTRY_KINDS,
  ENTRY_UNITS,
  GOAL_KINDS,
  PLAN_STATUSES,
  SAVED_ITEM_KINDS,
  USER_TABLES,
  fail,
  ok,
  type DateRange,
  type Entry,
  type EntryInput,
  type FavouriteInput,
  type Favourite,
  type FridgeList,
  type FridgeListInput,
  type Goal,
  type GoalInput,
  type JsonValue,
  type PlanStatus,
  type Result,
  type SavedItem,
  type SavedItemInput,
  type SavedPlan,
  type SavedPlanInput,
  type UserDataError,
  type UserDataSource,
  type WorkoutPlan,
  type WorkoutPlanInput,
  type WorkoutSession,
  type WorkoutSessionExercise,
  type WorkoutSessionInput,
  type WorkoutSet,
} from './source'

export const FRIDGE_LIST_COLUMNS = 'id, name, ingredient_slugs, updated_at'
export const SAVED_PLAN_COLUMNS = 'id, diet_id, week_start, plan, created_at'
export const FAVOURITE_COLUMNS = 'recipe_id, created_at'
export const ENTRY_COLUMNS = 'id, kind, entry_date, value, unit, payload, note, created_at'
export const GOAL_COLUMNS = 'kind, target, unit, cadence, updated_at'
export const SAVED_ITEM_COLUMNS = 'kind, item_id, created_at'
export const WORKOUT_PLAN_COLUMNS =
  'id, template_id, name, weeks, days_per_week, start_date, status, created_at, updated_at'
export const WORKOUT_SESSION_COLUMNS =
  'id, plan_id, template_id, performed_at, duration_min, exercises, note, created_at'

/** The upsert conflict target of `goals` (its primary key). */
export const GOALS_ON_CONFLICT = 'user_id,kind'

export interface QueryError {
  message: string
  code?: string
}

export interface QueryResult {
  data: unknown
  error: QueryError | null
}

/** A workout session as written: the exercises already normalised to plain JSON. */
export type WorkoutSessionValues = Omit<WorkoutSessionInput, 'exercises'> & { exercises: Json }

/** The slice of the client this module uses — one entry per table, one method per operation. */
export interface UserDataClient {
  fridgeLists: {
    list(): PromiseLike<QueryResult>
    upsert(values: FridgeListInput): PromiseLike<QueryResult>
    remove(id: string): PromiseLike<QueryResult>
  }
  savedPlans: {
    list(): PromiseLike<QueryResult>
    insert(values: SavedPlanInput): PromiseLike<QueryResult>
    remove(id: string): PromiseLike<QueryResult>
  }
  favourites: {
    list(): PromiseLike<QueryResult>
    insert(values: FavouriteInput): PromiseLike<QueryResult>
    remove(recipeId: string): PromiseLike<QueryResult>
  }
  entries: {
    list(range?: DateRange): PromiseLike<QueryResult>
    insert(values: EntryInput): PromiseLike<QueryResult>
    remove(id: string): PromiseLike<QueryResult>
  }
  goals: {
    list(): PromiseLike<QueryResult>
    upsert(values: GoalInput): PromiseLike<QueryResult>
  }
  savedItems: {
    list(): PromiseLike<QueryResult>
    insert(values: SavedItemInput): PromiseLike<QueryResult>
    remove(kind: string, itemId: string): PromiseLike<QueryResult>
  }
  workoutPlans: {
    list(): PromiseLike<QueryResult>
    insert(values: WorkoutPlanInput): PromiseLike<QueryResult>
    setStatus(id: string, status: PlanStatus): PromiseLike<QueryResult>
  }
  workoutSessions: {
    list(range?: DateRange): PromiseLike<QueryResult>
    insert(values: WorkoutSessionValues): PromiseLike<QueryResult>
    remove(id: string): PromiseLike<QueryResult>
  }
}

export function userDataClientFor(client: HygieiaClient): UserDataClient {
  const {
    fridgeLists,
    savedPlans,
    favourites,
    entries,
    goals,
    savedItems,
    workoutPlans,
    workoutSessions,
  } = USER_TABLES
  const desc = { ascending: false } as const
  return {
    fridgeLists: {
      list: () =>
        client
          .from(fridgeLists)
          .select(FRIDGE_LIST_COLUMNS)
          .order('updated_at', { ascending: false }),
      upsert: (values) =>
        client.from(fridgeLists).upsert(values).select(FRIDGE_LIST_COLUMNS).single(),
      remove: (id) => client.from(fridgeLists).delete().eq('id', id),
    },
    savedPlans: {
      list: () =>
        client
          .from(savedPlans)
          .select(SAVED_PLAN_COLUMNS)
          .order('week_start', { ascending: false }),
      insert: (values) =>
        client.from(savedPlans).insert(values).select(SAVED_PLAN_COLUMNS).single(),
      remove: (id) => client.from(savedPlans).delete().eq('id', id),
    },
    favourites: {
      list: () =>
        client.from(favourites).select(FAVOURITE_COLUMNS).order('created_at', { ascending: false }),
      insert: (values) => client.from(favourites).insert(values),
      remove: (recipeId) => client.from(favourites).delete().eq('recipe_id', recipeId),
    },
    entries: {
      list: (range) => {
        let query = client.from(entries).select(ENTRY_COLUMNS)
        if (range) query = query.gte('entry_date', range.from).lte('entry_date', range.to)
        return query.order('entry_date', desc).order('created_at', desc)
      },
      insert: (values) => client.from(entries).insert(values).select(ENTRY_COLUMNS).single(),
      remove: (id) => client.from(entries).delete().eq('id', id),
    },
    goals: {
      list: () => client.from(goals).select(GOAL_COLUMNS).order('kind', { ascending: true }),
      upsert: (values) =>
        client
          .from(goals)
          .upsert(values, { onConflict: GOALS_ON_CONFLICT })
          .select(GOAL_COLUMNS)
          .single(),
    },
    savedItems: {
      list: () => client.from(savedItems).select(SAVED_ITEM_COLUMNS).order('created_at', desc),
      insert: (values) =>
        client.from(savedItems).insert(values).select(SAVED_ITEM_COLUMNS).single(),
      remove: (kind, itemId) =>
        client.from(savedItems).delete().eq('kind', kind).eq('item_id', itemId),
    },
    workoutPlans: {
      list: () => client.from(workoutPlans).select(WORKOUT_PLAN_COLUMNS).order('updated_at', desc),
      insert: (values) =>
        client.from(workoutPlans).insert(values).select(WORKOUT_PLAN_COLUMNS).single(),
      setStatus: (id, status) =>
        client
          .from(workoutPlans)
          .update({ status })
          .eq('id', id)
          .select(WORKOUT_PLAN_COLUMNS)
          .single(),
    },
    workoutSessions: {
      list: (range) => {
        let query = client.from(workoutSessions).select(WORKOUT_SESSION_COLUMNS)
        if (range) query = query.gte('performed_at', range.from).lte('performed_at', range.to)
        return query.order('performed_at', desc).order('created_at', desc)
      },
      insert: (values) =>
        client.from(workoutSessions).insert(values).select(WORKOUT_SESSION_COLUMNS).single(),
      remove: (id) => client.from(workoutSessions).delete().eq('id', id),
    },
  }
}

// --- error classification -------------------------------------------------------------------------

/**
 * PostgREST answers carry a `code` (Postgres SQLSTATE or `PGRST…`); a transport failure surfaces
 * as a thrown `TypeError` or an error object with no code. Anything the server actually said is
 * `unknown` to the UI (it is not the user's problem to fix); anything that never reached it is
 * `network` (worth a retry).
 */
export function classifyError(error: unknown): UserDataError {
  if (error instanceof Error) return error instanceof TypeError ? 'network' : 'unknown'
  if (typeof error === 'object' && error !== null) {
    const code = (error as { code?: unknown }).code
    if (typeof code !== 'string' || code === '') return 'network'
  }
  return 'unknown'
}

async function run<T>(
  call: () => PromiseLike<QueryResult>,
  parse: (data: unknown) => T | null,
): Promise<Result<T>> {
  try {
    const { data, error } = await call()
    if (error) return fail(classifyError(error))
    const parsed = parse(data)
    return parsed === null ? fail('unknown') : ok(parsed)
  } catch (error) {
    return fail(classifyError(error))
  }
}

// --- row parsing (defensive: a malformed row is `unknown`, never a crash) -----------------------

type Row = Record<string, unknown>

function asRow(data: unknown): Row | null {
  return typeof data === 'object' && data !== null && !Array.isArray(data) ? (data as Row) : null
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((v) => typeof v === 'string')
}

const oneOf =
  <T extends string>(values: readonly T[]) =>
  (value: unknown): value is T =>
    typeof value === 'string' && (values as readonly string[]).includes(value)

const isEntryKind = oneOf(ENTRY_KINDS)
const isEntryUnit = oneOf(ENTRY_UNITS)
const isGoalKind = oneOf(GOAL_KINDS)
const isCadence = oneOf(CADENCES)
const isSavedItemKind = oneOf(SAVED_ITEM_KINDS)
const isPlanStatus = oneOf(PLAN_STATUSES)

/** A nullable column: `null` (or absent) stays null; anything else must satisfy `is`. */
function nullable<T>(value: unknown, is: (v: unknown) => v is T): T | null | undefined {
  if (value === null || value === undefined) return null
  return is(value) ? value : undefined
}
const isString = (v: unknown): v is string => typeof v === 'string'
const isNumber = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)
const stamp = (v: unknown): string => (typeof v === 'string' ? v : '')

export function toFridgeList(data: unknown): FridgeList | null {
  const row = asRow(data)
  if (!row) return null
  const { id, name, ingredient_slugs, updated_at } = row
  if (typeof id !== 'string' || typeof name !== 'string' || !isStringArray(ingredient_slugs))
    return null
  return {
    id,
    name,
    ingredient_slugs,
    updated_at: typeof updated_at === 'string' ? updated_at : '',
  }
}

export function toSavedPlan(data: unknown): SavedPlan | null {
  const row = asRow(data)
  if (!row) return null
  const { id, diet_id, week_start, plan, created_at } = row
  if (typeof id !== 'string' || typeof diet_id !== 'string' || typeof week_start !== 'string')
    return null
  if (plan === undefined) return null
  return {
    id,
    diet_id,
    week_start,
    // reason: `jsonb` arrives already parsed; the DB column is `not null` and only this module
    // writes it with a `JsonValue`, so the shape is ours.
    plan: plan as JsonValue,
    created_at: typeof created_at === 'string' ? created_at : '',
  }
}

export function toFavourite(data: unknown): Favourite | null {
  const row = asRow(data)
  if (!row) return null
  const { recipe_id, created_at } = row
  if (typeof recipe_id !== 'string') return null
  return { recipe_id, created_at: typeof created_at === 'string' ? created_at : '' }
}

export function toEntry(data: unknown): Entry | null {
  const row = asRow(data)
  if (!row) return null
  const { id, kind, entry_date, value, unit, payload, note, created_at } = row
  if (!isString(id) || !isEntryKind(kind) || !isString(entry_date)) return null
  const v = nullable(value, isNumber)
  const u = nullable(unit, isEntryUnit)
  const n = nullable(note, isString)
  if (v === undefined || u === undefined || n === undefined || (v !== null && v < 0)) return null
  return {
    id,
    kind,
    entry_date,
    value: v,
    unit: u,
    // reason: `jsonb` arrives already parsed; only this module writes it, with a `JsonValue`.
    payload: payload === undefined || payload === null ? null : (payload as JsonValue),
    note: n,
    created_at: stamp(created_at),
  }
}

export function toGoal(data: unknown): Goal | null {
  const row = asRow(data)
  if (!row) return null
  const { kind, target, unit, cadence, updated_at } = row
  if (!isGoalKind(kind) || !isNumber(target) || !isString(unit) || !isCadence(cadence)) return null
  return { kind, target, unit, cadence, updated_at: stamp(updated_at) }
}

export function toSavedItem(data: unknown): SavedItem | null {
  const row = asRow(data)
  if (!row) return null
  const { kind, item_id, created_at } = row
  if (!isSavedItemKind(kind) || !isString(item_id)) return null
  return { kind, item_id, created_at: stamp(created_at) }
}

export function toWorkoutPlan(data: unknown): WorkoutPlan | null {
  const row = asRow(data)
  if (!row) return null
  const {
    id,
    template_id,
    name,
    weeks,
    days_per_week,
    start_date,
    status,
    created_at,
    updated_at,
  } = row
  if (!isString(id) || !isString(template_id) || !isString(name)) return null
  if (!isNumber(weeks) || !isNumber(days_per_week) || !isString(start_date)) return null
  if (!isPlanStatus(status)) return null
  return {
    id,
    template_id,
    name,
    weeks,
    days_per_week,
    start_date,
    status,
    created_at: stamp(created_at),
    updated_at: stamp(updated_at),
  }
}

/** The documented set shape: integer reps >= 0, weight_kg null or >= 0, rpe null or 1..10. */
export function toWorkoutSet(data: unknown): WorkoutSet | null {
  const row = asRow(data)
  if (!row) return null
  const { reps, weight_kg, rpe, done } = row
  if (!isNumber(reps) || !Number.isInteger(reps) || reps < 0 || typeof done !== 'boolean')
    return null
  const w = nullable(weight_kg, isNumber)
  const r = nullable(rpe, isNumber)
  if (w === undefined || r === undefined) return null
  if (w !== null && w < 0) return null
  if (r !== null && (r < 1 || r > 10)) return null
  return { reps, weight_kg: w, rpe: r, done }
}

export function toWorkoutSessionExercise(data: unknown): WorkoutSessionExercise | null {
  const row = asRow(data)
  if (!row) return null
  const { exercise_id, sets } = row
  if (!isString(exercise_id) || !Array.isArray(sets)) return null
  const parsed = listOf(toWorkoutSet)(sets)
  return parsed === null ? null : { exercise_id, sets: parsed }
}

export function toWorkoutSession(data: unknown): WorkoutSession | null {
  const row = asRow(data)
  if (!row) return null
  const { id, plan_id, template_id, performed_at, duration_min, exercises, note, created_at } = row
  if (!isString(id) || !isString(performed_at) || !Array.isArray(exercises)) return null
  const p = nullable(plan_id, isString)
  const t = nullable(template_id, isString)
  const d = nullable(duration_min, isNumber)
  const n = nullable(note, isString)
  if (p === undefined || t === undefined || d === undefined || n === undefined) return null
  const parsed = listOf(toWorkoutSessionExercise)(exercises)
  if (parsed === null || parsed.length === 0) return null
  return {
    id,
    plan_id: p,
    template_id: t,
    performed_at,
    duration_min: d,
    exercises: parsed,
    note: n,
    created_at: stamp(created_at),
  }
}

/** Every element must parse; one bad row makes the whole read `unknown`. */
function listOf<T>(parse: (data: unknown) => T | null): (data: unknown) => T[] | null {
  return (data) => {
    if (!Array.isArray(data)) return null
    const out: T[] = []
    for (const item of data) {
      const parsed = parse(item)
      if (parsed === null) return null
      out.push(parsed)
    }
    return out
  }
}

const nothing = (): undefined => undefined

// --- payload shaping ------------------------------------------------------------------------------

/** The same object without its `undefined` keys, so a DB default applies to an unset column. */
function defined<T extends object>(values: T): T {
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(values)) if (value !== undefined) out[key] = value
  return out as T
}

/**
 * Rebuild the exercises as plain JSON with exactly the documented keys — nothing else goes over
 * the wire, and an `interface` value becomes a `Json`-typed literal without a cast.
 */
export function exercisesToJson(exercises: readonly WorkoutSessionExercise[]): Json {
  return exercises.map((exercise) => ({
    exercise_id: exercise.exercise_id,
    sets: exercise.sets.map((set) => ({
      reps: set.reps,
      weight_kg: set.weight_kg,
      rpe: set.rpe,
      done: set.done,
    })),
  }))
}

// --- the source -----------------------------------------------------------------------------------

/**
 * A source bound to `userId`. The id is recorded for the caller (and so the hook re-binds when the
 * session changes); it is never placed in a payload or a filter — see the header.
 */
export function supabaseSource(client: UserDataClient, userId: string): UserDataSource {
  return {
    kind: 'supabase',
    userId,
    fridgeLists: {
      list: () => run(client.fridgeLists.list, listOf(toFridgeList)),
      save: (input) => {
        // Omit `id` entirely when absent so the row default (gen_random_uuid) applies.
        const values: FridgeListInput =
          input.id === undefined
            ? { name: input.name, ingredient_slugs: input.ingredient_slugs }
            : { id: input.id, name: input.name, ingredient_slugs: input.ingredient_slugs }
        return run(() => client.fridgeLists.upsert(values), toFridgeList)
      },
      remove: (id) => run(() => client.fridgeLists.remove(id), nothing),
    },
    favourites: {
      list: () => run(client.favourites.list, listOf(toFavourite)),
      add: (recipeId) => run(() => client.favourites.insert({ recipe_id: recipeId }), nothing),
      remove: (recipeId) => run(() => client.favourites.remove(recipeId), nothing),
    },
    savedPlans: {
      list: () => run(client.savedPlans.list, listOf(toSavedPlan)),
      save: (input) => {
        const values: SavedPlanInput = {
          diet_id: input.diet_id,
          week_start: input.week_start,
          plan: input.plan,
        }
        return run(() => client.savedPlans.insert(values), toSavedPlan)
      },
      remove: (id) => run(() => client.savedPlans.remove(id), nothing),
    },
    // --- P8.1 profile ---
    listEntries: (range) => run(() => client.entries.list(range), listOf(toEntry)),
    addEntry: (input) => {
      const values = defined<EntryInput>({
        kind: input.kind,
        entry_date: input.entry_date,
        value: input.value,
        unit: input.unit,
        payload: input.payload,
        note: input.note,
      })
      return run(() => client.entries.insert(values), toEntry)
    },
    deleteEntry: (id) => run(() => client.entries.remove(id), nothing),
    listGoals: () => run(client.goals.list, listOf(toGoal)),
    upsertGoal: (input) => {
      const values: GoalInput = {
        kind: input.kind,
        target: input.target,
        unit: input.unit,
        cadence: input.cadence,
      }
      return run(() => client.goals.upsert(values), toGoal)
    },
    listSavedItems: () => run(client.savedItems.list, listOf(toSavedItem)),
    saveItem: (kind, itemId) =>
      run(() => client.savedItems.insert({ kind, item_id: itemId }), toSavedItem),
    unsaveItem: (kind, itemId) => run(() => client.savedItems.remove(kind, itemId), nothing),
    // --- P8.1 workout plans + sessions ---
    listWorkoutPlans: () => run(client.workoutPlans.list, listOf(toWorkoutPlan)),
    createWorkoutPlan: (input) => {
      const values = defined<WorkoutPlanInput>({
        template_id: input.template_id,
        name: input.name,
        weeks: input.weeks,
        days_per_week: input.days_per_week,
        start_date: input.start_date,
      })
      return run(() => client.workoutPlans.insert(values), toWorkoutPlan)
    },
    setWorkoutPlanStatus: (id, status) =>
      run(() => client.workoutPlans.setStatus(id, status), toWorkoutPlan),
    listWorkoutSessions: (range) =>
      run(() => client.workoutSessions.list(range), listOf(toWorkoutSession)),
    addWorkoutSession: (input) => {
      const values = defined<WorkoutSessionValues>({
        plan_id: input.plan_id,
        template_id: input.template_id,
        performed_at: input.performed_at,
        duration_min: input.duration_min,
        exercises: exercisesToJson(input.exercises),
        note: input.note,
      })
      return run(() => client.workoutSessions.insert(values), toWorkoutSession)
    },
    deleteWorkoutSession: (id) => run(() => client.workoutSessions.remove(id), nothing),
  }
}
