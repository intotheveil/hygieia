// FEATURE DICTIONARIES — the composition point (lead, 2026-10-05).
//
// Each feature keeps its own bilingual module in this folder (`<feature>.ts` exporting an
// interface and `en`/`el` literals that both satisfy it — ADR-0002 at feature scale). This barrel
// merges them into the app `Dictionary`, so parallel lanes never edit `dictionary.ts` itself; they
// add ONE import + ONE spread here. `.gitattributes` marks this file `merge=union`: concurrent
// appends merge cleanly. Keep every entry on its own line for that reason.

import { recipesEl, recipesEn, type RecipesDictionary } from './recipes.ts'

// Lanes extend this: `export interface FeatureDictionary extends RecipesDictionary, FridgeDictionary {}`.
// eslint-disable-next-line @typescript-eslint/no-empty-object-type -- one supertype until the second feature lands; the next lane deletes this line
export interface FeatureDictionary extends RecipesDictionary {}

export const featuresEn: FeatureDictionary = {
  ...recipesEn,
}

export const featuresEl: FeatureDictionary = {
  ...recipesEl,
}
