// FEATURE DICTIONARIES — the composition point (lead, 2026-10-05).
//
// Each feature keeps its own bilingual module in this folder (`<feature>.ts` exporting an
// interface and `en`/`el` literals that both satisfy it — ADR-0002 at feature scale). This barrel
// merges them into the app `Dictionary`, so parallel lanes never edit `dictionary.ts` itself; they
// add ONE import, ONE parent in `extends`, and ONE spread per language here. Concurrent lanes
// conflict on these few lines on purpose: the conflict is mechanical (keep both) and the lead
// resolves it at merge. (A `merge=union` attribute was tried and garbled the file — do not re-add.)

import { dietsEl, dietsEn, type DietsDictionary } from './diets.ts'
import { fridgeEl, fridgeEn, type FridgeDictionary } from './fridge.ts'
import { plansEl, plansEn, type PlansDictionary } from './plans.ts'
import { tipsEl, tipsEn, type TipsDictionary } from './tips.ts'
import { workoutsEl, workoutsEn, type WorkoutsDictionary } from './workouts.ts'

// prettier-ignore
export interface FeatureDictionary
  extends
    DietsDictionary,
    FridgeDictionary,
    PlansDictionary,
    TipsDictionary,
    WorkoutsDictionary {}

export const featuresEn: FeatureDictionary = {
  ...dietsEn,
  ...fridgeEn,
  ...plansEn,
  ...tipsEn,
  ...workoutsEn,
}

export const featuresEl: FeatureDictionary = {
  ...dietsEl,
  ...fridgeEl,
  ...plansEl,
  ...tipsEl,
  ...workoutsEl,
}
