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

// --- P8 contract (implemented by P8.1): the interface extends UserDataSourceP8 (declared at the end of this file) ---
export interface UserDataSource extends UserDataSourceP8 {
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

// --- P8 contract (implemented by P8.1) ---------------------------------------------------------
// Declared here by the P8.2 page lane so its tree compiles; the P8.1 data-spine lane ships the
// identical declarations plus the supabase implementation. At merge the lead keeps ONE copy.

export const ENTRY_KINDS = [
  'weight',
  'meal',
  'workout',
  'water',
  'sleep',
  'steps',
  'skincare',
  'nails',
  'mood',
] as const
export type EntryKind = (typeof ENTRY_KINDS)[number]
export const ENTRY_UNITS = ['kg', 'kcal', 'min', 'ml', 'h', 'steps', 'score'] as const
export type EntryUnit = (typeof ENTRY_UNITS)[number]
export const GOAL_KINDS = ['water', 'sleep', 'workout', 'steps', 'weight', 'skincare'] as const
export type GoalKind = (typeof GOAL_KINDS)[number]
export type Cadence = 'daily' | 'weekly'
export const SAVED_ITEM_KINDS = [
  'workout',
  'skincare_routine',
  'health_tip',
  'skincare_tip',
  'diet',
] as const
export type SavedItemKind = (typeof SAVED_ITEM_KINDS)[number]

export interface Entry {
  id: string
  kind: EntryKind
  entry_date: string
  value: number | null
  unit: EntryUnit | null
  payload: JsonValue | null
  note: string | null
  created_at: string
}
export interface EntryInput {
  kind: EntryKind
  entry_date?: string
  value?: number | null
  unit?: EntryUnit | null
  payload?: JsonValue | null
  note?: string | null
}
export interface Goal {
  kind: GoalKind
  target: number
  unit: string
  cadence: Cadence
  updated_at: string
}
export interface GoalInput {
  kind: GoalKind
  target: number
  unit: string
  cadence: Cadence
}
export interface SavedItem {
  kind: SavedItemKind
  item_id: string
  created_at: string
}

/** The P8 methods, mixed into `UserDataSource` below (one object, every per-user feature). */
export interface UserDataSourceP8 {
  /** `entry_date` descending. */
  listEntries(range?: { from: string; to: string }): Promise<Result<Entry[]>>
  addEntry(input: EntryInput): Promise<Result<Entry>>
  deleteEntry(id: string): Promise<Result<void>>
  listGoals(): Promise<Result<Goal[]>>
  upsertGoal(input: GoalInput): Promise<Result<Goal>>
  listSavedItems(): Promise<Result<SavedItem[]>>
  saveItem(kind: SavedItemKind, itemId: string): Promise<Result<SavedItem>>
  unsaveItem(kind: SavedItemKind, itemId: string): Promise<Result<void>>
}
// --- end P8 contract ------------------------------------------------------------------------------
