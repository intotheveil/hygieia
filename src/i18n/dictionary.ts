// THE FULL BILINGUAL DICTIONARY (perf split, 2026-10-06): every key of the product — the app
// dictionary (./app.ts: base + app features, what `useLang()` gives every page) + every ROUTE
// feature (./features/routeFeatures.ts: the strings only /admin, /profile, /skincare, /tasks and
// /workouts/plans show, merged per page by `useLang(<feature>Copy)`). One `Dictionary` type, two
// literals that must both satisfy it (ADR-0002): a key in one language only is a TYPE error.
//
// For tests, e2e and the one-owner check (dictionary.test.ts). App code imports ./app.ts instead
// (eslint `no-restricted-imports`), so the route features never re-enter the eager chunk.

import { appDictionaries, type AppDictionary, type Lang } from './app.ts'
import {
  routeFeaturesEl,
  routeFeaturesEn,
  type RouteFeatureDictionary,
} from './features/routeFeatures.ts'

export * from './app.ts'

/** Every key of the product: the app dictionary + every route feature. */
export type Dictionary = AppDictionary & RouteFeatureDictionary

export const en: Dictionary = { ...appDictionaries.en, ...routeFeaturesEn }
export const el: Dictionary = { ...appDictionaries.el, ...routeFeaturesEl }

export const dictionaries: Record<Lang, Dictionary> = { el, en }
