// FEATURE DICTIONARIES — the composition point (lead, 2026-10-05).
//
// Each feature keeps its own bilingual module in this folder (`<feature>.ts` exporting an
// interface and `en`/`el` literals that both satisfy it — ADR-0002 at feature scale). This barrel
// merges them into the app `Dictionary`, so parallel lanes never edit `dictionary.ts` itself; they
// add ONE import + ONE spread here. `.gitattributes` marks this file `merge=union`: concurrent
// appends merge cleanly. Keep every entry on its own line for that reason.

import { dietsEl, dietsEn, type DietsDictionary } from './diets.ts'
import { plansEl, plansEn, type PlansDictionary } from './plans.ts'

// Lanes extend this: one parent per line.
export interface FeatureDictionary extends DietsDictionary, PlansDictionary {}

export const featuresEn: FeatureDictionary = {
  ...dietsEn,
  ...plansEn,
}

export const featuresEl: FeatureDictionary = {
  ...dietsEl,
  ...plansEl,
}
