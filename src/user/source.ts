// USER DATA SOURCE — the one interface behind every per-user feature (PLAN §1 item 7, P2.4; P8.1
// profile): fridge lists, saved plans, favourites, and — for the profile page — entries, goals,
// saved items, workout plans and workout sessions. Two implementations: `supabase` (./supabase.ts,
// bound to the signed-in user) and `disabled` (./disabled.ts, when there is no backend or no
// session). The UI never branches on where data lives; it branches on `kind`/`reason` only to show
// the bilingual note (components/SignedOutNote.tsx). Nothing here throws: every call resolves to a
// `Result`.
//
// Column names are the contract from PLAN §2 (`fridge_lists`, `saved_plans`, `favourites`) and
// PLAN P8 (`entries`, `goals`, `saved_items`, `workout_plans`, `workout_sessions`). Every `*_KINDS` /
// `*_UNITS` array below equals the matching CHECK list in 20261006001300_hygieia_profile.sql —
// scripts/db-schema-contract.test.ts pins them against the real database.

/** Why a write is refused up front: no Supabase client at all, or a client but no session. */
export type DisabledReason = 'local-only' | 'signed-out'

export type UserDataError = 'disabled' | 'network' | 'unknown'

export type Result<T> = { ok: true; data: T } | { ok: false; error: UserDataError }

export const ok = <T>(data: T): Result<T> => ({ ok: true, data })
export const fail = <T>(error: UserDataError): Result<T> => ({ ok: false, error })

/** The per-user tables, by feature. Unqualified: the client is pinned to schema `hygieia`. */
export const USER_TABLES = {
  fridgeLists: 'fridge_lists',
  savedPlans: 'saved_plans',
  favourites: 'favourites',
  entries: 'entries',
  goals: 'goals',
  savedItems: 'saved_items',
  workoutPlans: 'workout_plans',
  workoutSessions: 'workout_sessions',
} as const
export type UserTable = (typeof USER_TABLES)[keyof typeof USER_TABLES]

/** JSON as Postgres `jsonb` sees it — the shape of a saved plan's payload and an entry's payload. */
export type JsonValue =
  string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue }

// --- P8.1 enums (= the migration's CHECK lists, in order) -----------------------------------------

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
export const CADENCES = ['daily', 'weekly'] as const satisfies readonly Cadence[]
export const SAVED_ITEM_KINDS = [
  'workout',
  'skincare_routine',
  'health_tip',
  'skincare_tip',
  'diet',
] as const
export type SavedItemKind = (typeof SAVED_ITEM_KINDS)[number]
export type PlanStatus = 'active' | 'completed' | 'abandoned'
export const PLAN_STATUSES = [
  'active',
  'completed',
  'abandoned',
] as const satisfies readonly PlanStatus[]

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

/** One tracked data point: a numeric value in a unit, a free jsonb detail, or both. */
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

/** One target per kind per user (upserted on `(user_id, kind)`). */
export interface Goal {
  kind: GoalKind
  target: number
  unit: string
  cadence: Cadence
  updated_at: string
}

/** A saved reference to a content row of `kind`; polymorphic (no FK), recipes use `favourites`. */
export interface SavedItem {
  kind: SavedItemKind
  item_id: string
  created_at: string
}

export interface WorkoutPlan {
  id: string
  template_id: string
  name: string
  weeks: number
  days_per_week: number
  start_date: string
  status: PlanStatus
  created_at: string
  updated_at: string
}

export interface WorkoutSet {
  reps: number
  weight_kg: number | null
  rpe: number | null
  done: boolean
}

export interface WorkoutSessionExercise {
  exercise_id: string
  sets: WorkoutSet[]
}

export interface WorkoutSession {
  id: string
  plan_id: string | null
  template_id: string | null
  performed_at: string
  duration_min: number | null
  exercises: WorkoutSessionExercise[]
  note: string | null
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

/** Absent `entry_date` = today (DB default `current_date`); absent nullable fields = null. */
export interface EntryInput {
  kind: EntryKind
  entry_date?: string
  value?: number | null
  unit?: EntryUnit | null
  payload?: JsonValue | null
  note?: string | null
}

export interface GoalInput {
  kind: GoalKind
  target: number
  unit: string
  cadence: Cadence
}

export interface SavedItemInput {
  kind: SavedItemKind
  item_id: string
}

/** Absent `start_date` = today; `status` is never written on create (DB default `active`). */
export interface WorkoutPlanInput {
  template_id: string
  name: string
  weeks: number
  days_per_week: number
  start_date?: string
}

/** Absent `performed_at` = today (DB default `current_date`). */
export interface WorkoutSessionInput {
  plan_id?: string | null
  template_id?: string | null
  performed_at?: string
  duration_min?: number | null
  exercises: WorkoutSessionExercise[]
  note?: string | null
}

/** An inclusive date range on a `date` column (`YYYY-MM-DD` both ends). */
export interface DateRange {
  from: string
  to: string
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
  // --- P8.1 profile: entries, goals, saved items ---
  /** Ordered `entry_date desc, created_at desc`; `range` is inclusive on `entry_date`. */
  listEntries(range?: DateRange): Promise<Result<Entry[]>>
  addEntry(input: EntryInput): Promise<Result<Entry>>
  deleteEntry(id: string): Promise<Result<void>>
  listGoals(): Promise<Result<Goal[]>>
  /** Insert or replace the caller's goal of that kind (`on conflict (user_id, kind)`). */
  upsertGoal(input: GoalInput): Promise<Result<Goal>>
  listSavedItems(): Promise<Result<SavedItem[]>>
  saveItem(kind: SavedItemKind, itemId: string): Promise<Result<SavedItem>>
  unsaveItem(kind: SavedItemKind, itemId: string): Promise<Result<void>>
  // --- P8.1 workout plans + sessions ---
  /** Ordered `updated_at desc`. */
  listWorkoutPlans(): Promise<Result<WorkoutPlan[]>>
  createWorkoutPlan(input: WorkoutPlanInput): Promise<Result<WorkoutPlan>>
  setWorkoutPlanStatus(id: string, status: PlanStatus): Promise<Result<WorkoutPlan>>
  /** Ordered `performed_at desc`; `range` is inclusive on `performed_at`. */
  listWorkoutSessions(range?: DateRange): Promise<Result<WorkoutSession[]>>
  addWorkoutSession(input: WorkoutSessionInput): Promise<Result<WorkoutSession>>
  deleteWorkoutSession(id: string): Promise<Result<void>>
}
