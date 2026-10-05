// FEATURE DICTIONARIES — the composition point (lead, 2026-10-05).
//
// Each feature keeps its own bilingual module in this folder (`<feature>.ts` exporting an
// interface and `en`/`el` literals that both satisfy it — ADR-0002 at feature scale). This barrel
// merges them into the app `Dictionary`, so parallel lanes never edit `dictionary.ts` itself; they
// add ONE import + ONE spread here. `.gitattributes` marks this file `merge=union`: concurrent
// appends merge cleanly. Keep every entry on its own line for that reason.

import { tipsEl, tipsEn, type TipsDictionary } from './tips.ts'
import { workoutsEl, workoutsEn, type WorkoutsDictionary } from './workouts.ts'

// Lanes extend this: one parent per line (kept so by prettier-ignore) so `merge=union` can merge
// concurrent lanes' parents without conflicts.
// prettier-ignore
export interface FeatureDictionary
  extends
    WorkoutsDictionary,
    TipsDictionary {}

export const featuresEn: FeatureDictionary = {
  ...workoutsEn,
  ...tipsEn,
}

export const featuresEl: FeatureDictionary = {
  ...workoutsEl,
  ...tipsEl,
import { fridgeEl, fridgeEn, type FridgeDictionary } from './fridge.ts'

// Lanes add their parent here (`extends FridgeDictionary, RecipesDictionary`). The disable below is
// needed only while there is ONE parent; drop it when the second lands (the rule allows multi-extends).
// eslint-disable-next-line @typescript-eslint/no-empty-object-type -- a bag of parents only; members live in each feature module
export interface FeatureDictionary extends FridgeDictionary {}

export const featuresEn: FeatureDictionary = {
  ...fridgeEn,
}

export const featuresEl: FeatureDictionary = {
  ...fridgeEl,
}
