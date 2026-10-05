// SUPABASE SOURCE (P2.4): per-user rows in schema `hygieia`, bound to the signed-in user. The user
// is NEVER sent: `user_id` has `default auth.uid()` and RLS (`user_id = auth.uid()` on every verb,
// proven in `db:gate`) scopes every read and write to the caller, so no filter on `user_id` is
// needed either — the server is the authority, not a client-side `eq`. Table names are
// unqualified: the client is pinned to schema `hygieia` (P1.13).
//
// Like profile.ts, the module talks to the client through a small typed adapter: a direct
// structural assignment of the real client to a narrow interface makes TypeScript walk Supabase's
// query-builder generics until it gives up (TS2589). `userDataClientFor` pins the exact chains, so
// the compiler still checks every method and argument against the real client.

import type { HygieiaClient } from '../lib/supabase'
import {
  USER_TABLES,
  fail,
  ok,
  type FavouriteInput,
  type Favourite,
  type FridgeList,
  type FridgeListInput,
  type JsonValue,
  type Result,
  type SavedPlan,
  type SavedPlanInput,
  type UserDataError,
  type UserDataSource,
} from './source'

export const FRIDGE_LIST_COLUMNS = 'id, name, ingredient_slugs, updated_at'
export const SAVED_PLAN_COLUMNS = 'id, diet_id, week_start, plan, created_at'
export const FAVOURITE_COLUMNS = 'recipe_id, created_at'

export interface QueryError {
  message: string
  code?: string
}

export interface QueryResult {
  data: unknown
  error: QueryError | null
}

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
}

export function userDataClientFor(client: HygieiaClient): UserDataClient {
  const { fridgeLists, savedPlans, favourites } = USER_TABLES
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
  }
}
