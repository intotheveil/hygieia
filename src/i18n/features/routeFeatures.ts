// ROUTE FEATURES (perf, 2026-10-06 — CI Lighthouse diet 84): the feature dictionaries read only by
// their own lazily-loaded route — /admin, /profile, /skincare, /tasks, /workouts/plans — and prefs (the
// home page's lazy onboarding + of-the-day cards and the preference highlights on lazy pages). They are
// NOT in `useLang().t` (./index.ts composes the app features); each route's components call
// `useLang(<feature>Copy)` and the strings ship in that route's chunk. This module composes them
// only for the FULL `Dictionary` (../dictionary.ts: tests, e2e, the one-owner check) and must never
// be imported by app code (eslint `no-restricted-imports`) — a static import from the eager graph
// puts every one of them back into the chunk every page downloads before its first paint.
//
// Same rules as ./index.ts: one owner per key; a key another page needs lives in ./shared.ts.

import { adminEl, adminEn, type AdminDictionary } from './admin.ts'
import { prefsEl, prefsEn, type PrefsDictionary } from './prefs.ts'
import { profileEl, profileEn, type ProfileDictionary } from './profile.ts'
import { skincareEl, skincareEn, type SkincareDictionary } from './skincare.ts'
import { tasksEl, tasksEn, type TasksDictionary } from './tasks.ts'
import { workoutPlansEl, workoutPlansEn, type WorkoutPlansDictionary } from './workoutPlans.ts'

// prettier-ignore
export interface RouteFeatureDictionary
  extends
    AdminDictionary,
    PrefsDictionary,
    ProfileDictionary,
    SkincareDictionary,
    TasksDictionary,
    WorkoutPlansDictionary {}

export const routeFeaturesEn: RouteFeatureDictionary = {
  ...adminEn,
  ...prefsEn,
  ...profileEn,
  ...skincareEn,
  ...tasksEn,
  ...workoutPlansEn,
}

export const routeFeaturesEl: RouteFeatureDictionary = {
  ...adminEl,
  ...prefsEl,
  ...profileEl,
  ...skincareEl,
  ...tasksEl,
  ...workoutPlansEl,
}
