// USER DATA SOURCE — the one interface behind every per-user feature (PLAN §1 item 7, P2.4):
// fridge lists, saved plans, favourites. Two implementations: `supabase` (./supabase.ts, bound to
// the signed-in user) and `disabled` (./disabled.ts, when there is no backend or no session). The
// UI never branches on where data lives; it branches on `kind`/`reason` only to show the
// bilingual note (components/SignedOutNote.tsx). Nothing here throws: every call resolves to a
// `Result`.
//
// Column names are the contract from PLAN §2 (`fridge_lists`, `saved_plans`, `favourites`).

/** Why a write is refused up front: no Supabase client at all, or a client but no session. */
export type DisabledReason = 'local-only' | 'signed-out'

export type UserDataError = 'disabled' | 'network' | 'unknown'

export type Result<T> = { ok: true; data: T } | { ok: false; error: UserDataError }

export const ok = <T>(data: T): Result<T> => ({ ok: true, data })
export const fail = <T>(error: UserDataError): Result<T> => ({ ok: false, error })

/** The three per-user tables, by feature. Unqualified: the client is pinned to schema `hygieia`. */
export const USER_TABLES = {
  fridgeLists: 'fridge_lists',
  savedPlans: 'saved_plans',
  favourites: 'favourites',
} as const
export type UserTable = (typeof USER_TABLES)[keyof typeof USER_TABLES]

/** JSON as Postgres `jsonb` sees it — the shape of a saved plan's payload. */
export type JsonValue =
  string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue }

// --- rows as read -------------------------------------------------------------------------------

export interface FridgeList {
  id: string
  name: string
  ingredient_slugs: string[]
  updated_at: string
}

export interface SavedPlan {
  id: string
  diet_id: string
  week_start: string
  plan: JsonValue
  created_at: string
}

export interface Favourite {
  recipe_id: string
  created_at: string
}

// --- payloads as written. NONE carries `user_id`: the column default `auth.uid()` supplies it
// and RLS (`user_id = auth.uid()` on every verb) refuses anything else, so sending it would be
// at best redundant and at worst a leak of intent. The types make it unrepresentable. ------------

/** Upsert: a new list when `id` is absent, an update of the caller's own list when present. */
export interface FridgeListInput {
  id?: string
  name: string
  ingredient_slugs: string[]
}

export interface SavedPlanInput {
  diet_id: string
  week_start: string
  plan: JsonValue
}

export interface FavouriteInput {
  recipe_id: string
}

// --- the interface --------------------------------------------------------------------------------

export interface UserDataSource {
  kind: 'supabase' | 'disabled'
  /** Present only when `kind === 'disabled'`. */
  reason?: DisabledReason
  /** Present only when `kind === 'supabase'`: the user the source is bound to. */
  userId?: string
  fridgeLists: {
    list(): Promise<Result<FridgeList[]>>
    save(input: FridgeListInput): Promise<Result<FridgeList>>
    remove(id: string): Promise<Result<void>>
  }
  favourites: {
    list(): Promise<Result<Favourite[]>>
    add(recipeId: string): Promise<Result<void>>
    remove(recipeId: string): Promise<Result<void>>
  }
  savedPlans: {
    list(): Promise<Result<SavedPlan[]>>
    save(input: SavedPlanInput): Promise<Result<SavedPlan>>
    remove(id: string): Promise<Result<void>>
  }
}
