// FEATURE DICTIONARIES — the composition point (lead, 2026-10-05).
//
// Each feature keeps its own bilingual module in this folder (`<feature>.ts` exporting an
// interface and `en`/`el` literals that both satisfy it — ADR-0002 at feature scale). This barrel
// merges them into the app `Dictionary`, so parallel lanes never edit `dictionary.ts` itself; they
// add ONE import, ONE parent in `extends`, and ONE spread per language here. Concurrent lanes
// conflict on these few lines on purpose: the conflict is mechanical (keep both) and the lead
// resolves it at merge. (A `merge=union` attribute was tried and garbled the file — do not re-add.)
//
// A key may live in ONE module only. Two modules declaring the same key with different types is a
// type error here (`minutes`, 2026-10-06); with the same type the LAST spread silently wins — so
// shared copy (`loadFailed`, `retry`, `loading`…) has one owner (plans) and the others reuse it.

import { adminEl, adminEn, type AdminDictionary } from './admin.ts'
import { dietsEl, dietsEn, type DietsDictionary } from './diets.ts'
import { fridgeEl, fridgeEn, type FridgeDictionary } from './fridge.ts'
import { plansEl, plansEn, type PlansDictionary } from './plans.ts'
import { profileEl, profileEn, type ProfileDictionary } from './profile.ts'
import { recipesEl, recipesEn, type RecipesDictionary } from './recipes.ts'
import { skincareEl, skincareEn, type SkincareDictionary } from './skincare.ts'
import { tasksEl, tasksEn, type TasksDictionary } from './tasks.ts'
import { themeEl, themeEn, type ThemeDictionary } from './theme.ts'
import { tipsEl, tipsEn, type TipsDictionary } from './tips.ts'
import { workoutPlansEl, workoutPlansEn, type WorkoutPlansDictionary } from './workoutPlans.ts'
import { workoutsEl, workoutsEn, type WorkoutsDictionary } from './workouts.ts'

// prettier-ignore
export interface FeatureDictionary
  extends
    AdminDictionary,
    DietsDictionary,
    FridgeDictionary,
    PlansDictionary,
    ProfileDictionary,
    RecipesDictionary,
    SkincareDictionary,
    TasksDictionary,
    ThemeDictionary,
    TipsDictionary,
    WorkoutPlansDictionary,
    WorkoutsDictionary {}

export const featuresEn: FeatureDictionary = {
  ...adminEn,
  ...dietsEn,
  ...fridgeEn,
  ...plansEn,
  ...profileEn,
  ...recipesEn,
  ...skincareEn,
  ...tasksEn,
  ...themeEn,
  ...tipsEn,
  ...workoutPlansEn,
  ...workoutsEn,
}

export const featuresEl: FeatureDictionary = {
  ...adminEl,
  ...dietsEl,
  ...fridgeEl,
  ...plansEl,
  ...profileEl,
  ...recipesEl,
  ...skincareEl,
  ...tasksEl,
  ...themeEl,
  ...tipsEl,
  ...workoutPlansEl,
  ...workoutsEl,
}
