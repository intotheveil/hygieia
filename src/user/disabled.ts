// DISABLED SOURCE (P2.4, P8.1): what per-user features see in local-only mode (no Supabase client)
// or with no session. Reads are honestly empty; every write is refused with `error: 'disabled'` so
// a caller can show the bilingual note (components/SignedOutNote.tsx) instead of a spinner. The P8.1
// profile methods refuse READS too (`fail('disabled')`): a profile page with no user has no data
// to be empty of, and the page branches on `kind`/`reason` to show the sign-in note.

import { fail, ok, type DisabledReason, type UserDataSource } from './source'

export function disabledSource(reason: DisabledReason): UserDataSource {
  const refuse = async <T>() => fail<T>('disabled')
  const empty = async <T>() => ok<T[]>([])
  return {
    kind: 'disabled',
    reason,
    fridgeLists: { list: empty, save: refuse, remove: refuse },
    favourites: { list: empty, add: refuse, remove: refuse },
    savedPlans: { list: empty, save: refuse, remove: refuse },
    listEntries: refuse,
    addEntry: refuse,
    deleteEntry: refuse,
    listGoals: refuse,
    upsertGoal: refuse,
    listSavedItems: refuse,
    saveItem: refuse,
    unsaveItem: refuse,
    listWorkoutPlans: refuse,
    createWorkoutPlan: refuse,
    setWorkoutPlanStatus: refuse,
    listWorkoutSessions: refuse,
    addWorkoutSession: refuse,
    deleteWorkoutSession: refuse,
  }
}
