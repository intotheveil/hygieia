// IN-MEMORY USER DATA SOURCE (P8.2): a complete `UserDataSource` over plain arrays, for tests and
// stories. Behaves like the supabase source would for ONE signed-in user: ids are generated,
// `created_at` is stamped from an injectable clock, `listEntries` honours the date range and sorts
// `entry_date` desc, `upsertGoal` replaces by kind, `saveItem` is idempotent per (kind, item_id).
// Every method can be made to fail through `failing` (a set of method names → `error: 'network'`),
// so a page's error paths are testable without a backend. Not used by the app itself.

import {
  fail,
  ok,
  type Entry,
  type EntryInput,
  type Favourite,
  type FridgeList,
  type FridgeListInput,
  type Goal,
  type GoalInput,
  type Result,
  type SavedItem,
  type SavedItemKind,
  type SavedPlan,
  type SavedPlanInput,
  type UserDataSource,
  type WorkoutPlan,
  type WorkoutPlanInput,
  type WorkoutSession,
  type WorkoutSessionInput,
} from './source'

export interface MemoryStore {
  entries: Entry[]
  goals: Goal[]
  savedItems: SavedItem[]
  favourites: Favourite[]
  fridgeLists: FridgeList[]
  savedPlans: SavedPlan[]
  workoutPlans: WorkoutPlan[]
  workoutSessions: WorkoutSession[]
}

type Method = Exclude<keyof UserDataSource, 'kind' | 'reason' | 'userId'>

export interface MemorySourceOptions {
  /** Partial initial contents; anything absent starts empty. */
  store?: Partial<MemoryStore>
  /** Methods that answer `{ ok: false, error: 'network' }` instead of touching the store. */
  failing?: ReadonlySet<Method>
  /** ISO timestamp stamped on created rows. */
  now?: () => string
  userId?: string
}

export interface MemorySource {
  source: UserDataSource
  store: MemoryStore
  /** Add a method to `failing` / remove it, between interactions. */
  failOn(method: Method, fail?: boolean): void
}

export function memorySource(options: MemorySourceOptions = {}): MemorySource {
  const store: MemoryStore = {
    entries: [...(options.store?.entries ?? [])],
    goals: [...(options.store?.goals ?? [])],
    savedItems: [...(options.store?.savedItems ?? [])],
    favourites: [...(options.store?.favourites ?? [])],
    fridgeLists: [...(options.store?.fridgeLists ?? [])],
    savedPlans: [...(options.store?.savedPlans ?? [])],
    workoutPlans: [...(options.store?.workoutPlans ?? [])],
    workoutSessions: [...(options.store?.workoutSessions ?? [])],
  }
  const failing = new Set<Method>(options.failing ?? [])
  const now = options.now ?? (() => new Date().toISOString())
  let seq = 0
  const nextId = () => `mem-${++seq}`

  async function guard<T>(method: Method, body: () => T): Promise<Result<T>> {
    if (failing.has(method)) return fail<T>('network')
    try {
      return ok(body())
    } catch {
      return fail<T>('unknown')
    }
  }

  const source: UserDataSource = {
    kind: 'supabase',
    userId: options.userId ?? 'memory-user',
    fridgeLists: {
      list: () => guard('fridgeLists', () => [...store.fridgeLists]),
      save: (input: FridgeListInput) =>
        guard('fridgeLists', () => {
          const row: FridgeList = {
            id: input.id ?? nextId(),
            name: input.name,
            ingredient_slugs: [...input.ingredient_slugs],
            updated_at: now(),
          }
          store.fridgeLists = [row, ...store.fridgeLists.filter((l) => l.id !== row.id)]
          return row
        }),
      remove: (id) =>
        guard('fridgeLists', () => {
          store.fridgeLists = store.fridgeLists.filter((l) => l.id !== id)
        }),
    },
    favourites: {
      list: () => guard('favourites', () => [...store.favourites]),
      add: (recipeId) =>
        guard('favourites', () => {
          if (!store.favourites.some((f) => f.recipe_id === recipeId)) {
            store.favourites = [{ recipe_id: recipeId, created_at: now() }, ...store.favourites]
          }
        }),
      remove: (recipeId) =>
        guard('favourites', () => {
          store.favourites = store.favourites.filter((f) => f.recipe_id !== recipeId)
        }),
    },
    savedPlans: {
      list: () => guard('savedPlans', () => [...store.savedPlans]),
      save: (input: SavedPlanInput) =>
        guard('savedPlans', () => {
          const row: SavedPlan = { id: nextId(), ...input, created_at: now() }
          store.savedPlans = [row, ...store.savedPlans]
          return row
        }),
      remove: (id) =>
        guard('savedPlans', () => {
          store.savedPlans = store.savedPlans.filter((p) => p.id !== id)
        }),
    },

    listEntries: (range) =>
      guard('listEntries', () =>
        store.entries
          .filter(
            (e) => range === undefined || (e.entry_date >= range.from && e.entry_date <= range.to),
          )
          .sort(
            (a, b) =>
              b.entry_date.localeCompare(a.entry_date) || b.created_at.localeCompare(a.created_at),
          ),
      ),
    addEntry: (input: EntryInput) =>
      guard('addEntry', () => {
        const stamp = now()
        const row: Entry = {
          id: nextId(),
          kind: input.kind,
          entry_date: input.entry_date ?? stamp.slice(0, 10),
          value: input.value ?? null,
          unit: input.unit ?? null,
          payload: input.payload ?? null,
          note: input.note ?? null,
          created_at: stamp,
        }
        store.entries = [row, ...store.entries]
        return row
      }),
    deleteEntry: (id) =>
      guard('deleteEntry', () => {
        store.entries = store.entries.filter((e) => e.id !== id)
      }),
    listGoals: () => guard('listGoals', () => [...store.goals]),
    upsertGoal: (input: GoalInput) =>
      guard('upsertGoal', () => {
        const row: Goal = { ...input, updated_at: now() }
        store.goals = [...store.goals.filter((g) => g.kind !== row.kind), row]
        return row
      }),
    listSavedItems: () => guard('listSavedItems', () => [...store.savedItems]),
    saveItem: (kind: SavedItemKind, itemId: string) =>
      guard('saveItem', () => {
        const existing = store.savedItems.find((s) => s.kind === kind && s.item_id === itemId)
        if (existing) return existing
        const row: SavedItem = { kind, item_id: itemId, created_at: now() }
        store.savedItems = [row, ...store.savedItems]
        return row
      }),
    unsaveItem: (kind, itemId) =>
      guard('unsaveItem', () => {
        store.savedItems = store.savedItems.filter(
          (s) => !(s.kind === kind && s.item_id === itemId),
        )
      }),
    listWorkoutPlans: () =>
      guard('listWorkoutPlans', () =>
        [...store.workoutPlans].sort((a, b) => b.updated_at.localeCompare(a.updated_at)),
      ),
    createWorkoutPlan: (input: WorkoutPlanInput) =>
      guard('createWorkoutPlan', () => {
        const stamp = now()
        const row: WorkoutPlan = {
          id: nextId(),
          template_id: input.template_id,
          name: input.name,
          weeks: input.weeks,
          days_per_week: input.days_per_week,
          start_date: input.start_date ?? stamp.slice(0, 10),
          status: 'active',
          created_at: stamp,
          updated_at: stamp,
        }
        store.workoutPlans = [row, ...store.workoutPlans]
        return row
      }),
    setWorkoutPlanStatus: (id, status) =>
      guard('setWorkoutPlanStatus', () => {
        const found = store.workoutPlans.find((p) => p.id === id)
        if (!found) throw new Error(`no plan ${id}`)
        const row: WorkoutPlan = { ...found, status, updated_at: now() }
        store.workoutPlans = store.workoutPlans.map((p) => (p.id === id ? row : p))
        return row
      }),
    listWorkoutSessions: (range) =>
      guard('listWorkoutSessions', () =>
        store.workoutSessions
          .filter(
            (w) =>
              range === undefined || (w.performed_at >= range.from && w.performed_at <= range.to),
          )
          .sort(
            (a, b) =>
              b.performed_at.localeCompare(a.performed_at) ||
              b.created_at.localeCompare(a.created_at),
          ),
      ),
    addWorkoutSession: (input: WorkoutSessionInput) =>
      guard('addWorkoutSession', () => {
        const stamp = now()
        const row: WorkoutSession = {
          id: nextId(),
          plan_id: input.plan_id ?? null,
          template_id: input.template_id ?? null,
          performed_at: input.performed_at ?? stamp.slice(0, 10),
          duration_min: input.duration_min ?? null,
          exercises: input.exercises.map((e) => ({ ...e, sets: e.sets.map((x) => ({ ...x })) })),
          note: input.note ?? null,
          created_at: stamp,
        }
        store.workoutSessions = [row, ...store.workoutSessions]
        return row
      }),
    deleteWorkoutSession: (id) =>
      guard('deleteWorkoutSession', () => {
        store.workoutSessions = store.workoutSessions.filter((w) => w.id !== id)
      }),
  }

  return {
    source,
    store,
    failOn: (method, shouldFail = true) => {
      if (shouldFail) failing.add(method)
      else failing.delete(method)
    },
  }
}
