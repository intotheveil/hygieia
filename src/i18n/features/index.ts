// FEATURE DICTIONARIES — the composition point (lead, 2026-10-05).
//
// Each feature keeps its own bilingual module in this folder (`<feature>.ts` exporting an
// interface and `en`/`el` literals that both satisfy it — ADR-0002 at feature scale). This barrel
// merges them, so parallel lanes never edit `dictionary.ts` itself; they add ONE import, ONE parent
// in `extends`, and ONE spread per language here. Concurrent lanes conflict on these few lines on
// purpose: the conflict is mechanical (keep both) and the lead resolves it at merge. (A
// `merge=union` attribute was tried and garbled the file — do not re-add.)
//
// A key may live in ONE module only. Two modules declaring the same key with different types is a
// type error here (`minutes`, 2026-10-06); with the same type the LAST spread silently wins — so
// shared copy (`loadFailed`, `retry`, `loading`…) has one owner (plans) and the others reuse it.
//
// TWO GROUPS (perf, 2026-10-06 — CI Lighthouse diet 84). The strings of every feature used to be
// composed into the one dictionary `LangProvider` hands to every page, so all of them sat in the
// eager chunk every route downloads before its first paint (40 kB gzip, 11 kB of it strings that
// only /profile, /workouts/plans, /skincare, /tasks or /admin ever show):
//
//   - APP features (`FeatureDictionary`, `featuresEn/El`) are composed into `AppDictionary`, the
//     `t` of `useLang()` on every page — the header, the home page and the content routes' copy.
//   - ROUTE features (./routeFeatures.ts) are read only by their own lazily-loaded route. They
//     are NOT in `useLang().t`: the route's components call `useLang(<feature>Copy)`, which merges
//     that feature's literal for the current language, so the strings ship in the route's chunk.
//     A route-feature key read through plain `useLang()` is a TYPE error, not a blank string.
//     A key a route feature needs on ANOTHER page belongs in ./shared.ts (an app feature).
//
// A lane adding a feature picks its group: an APP feature here, a ROUTE feature in
// ./routeFeatures.ts (+ a `<feature>Copy` export and `useLang(<feature>Copy)` in that route's
// components). The route group is composed in its own module ON PURPOSE: anything this file imports
// is reachable from the entry, and the bundler then keeps it in the eager chunk even when no eager
// code reads it.

import { dietsEl, dietsEn, type DietsDictionary } from './diets.ts'
import { fridgeEl, fridgeEn, type FridgeDictionary } from './fridge.ts'
import { plansEl, plansEn, type PlansDictionary } from './plans.ts'
import { recipesEl, recipesEn, type RecipesDictionary } from './recipes.ts'
import { sharedEl, sharedEn, type SharedDictionary } from './shared.ts'
import { themeEl, themeEn, type ThemeDictionary } from './theme.ts'
import { tipsEl, tipsEn, type TipsDictionary } from './tips.ts'
import { workoutsEl, workoutsEn, type WorkoutsDictionary } from './workouts.ts'

// --- APP features: in `useLang().t` on every page -----------------------------------------------

// prettier-ignore
export interface FeatureDictionary
  extends
    DietsDictionary,
    FridgeDictionary,
    PlansDictionary,
    RecipesDictionary,
    SharedDictionary,
    ThemeDictionary,
    TipsDictionary,
    WorkoutsDictionary {}

export const featuresEn: FeatureDictionary = {
  ...dietsEn,
  ...fridgeEn,
  ...plansEn,
  ...recipesEn,
  ...sharedEn,
  ...themeEn,
  ...tipsEn,
  ...workoutsEn,
}

export const featuresEl: FeatureDictionary = {
  ...dietsEl,
  ...fridgeEl,
  ...plansEl,
  ...recipesEl,
  ...sharedEl,
  ...themeEl,
  ...tipsEl,
  ...workoutsEl,
}
