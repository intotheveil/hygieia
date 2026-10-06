// VISITOR PREFERENCES (2026-10-06, operator request: first-visit onboarding). Three optional answers
// — goal, diet, activity level — kept in localStorage `hygieia:prefs` for signed-in and anonymous
// visitors alike (no account needed, nothing sent anywhere). Pure: parsing and the storage access
// are separate from React, and every storage call is wrapped (private mode / blocked storage is
// "no preference", never an error).
//
// `readPrefs()` → `null` means FIRST VISIT (nothing stored): the home page shows the onboarding
// card. A visitor who pressed "Skip" has `skipped: true` and no answers, so the card stays away.
//
// This module is in the EAGER chunk (the home page orders its modules by the goal before its first
// paint), so it stays small: the per-page helpers live in ./apply.ts and the onboarding UI in
// src/home/ (lazy). Rule everywhere: an explicit URL parameter wins over a preference.

import type { ModuleId } from '../i18n/app'

export const PREFS_STORAGE_KEY = 'hygieia:prefs'

/** `/?prefs=edit` reopens the onboarding card on the home page (the footer's "Change preferences"). */
export const PREFS_PARAM = 'prefs'
export const PREFS_EDIT_HREF = `/?${PREFS_PARAM}=edit`

export const GOALS = [
  'eat-healthier',
  'lose-weight',
  'build-strength',
  'feel-calmer',
  'skin',
] as const
export type Goal = (typeof GOALS)[number]

/**
 * The diets the onboarding offers — each one a diet slug of the catalogue (src/content/seed/diets.ts),
 * so it can pre-filter /recipes as `?diet=<slug>`. Orthodox (Lent) fasting is not in the catalogue,
 * so it is not offered.
 */
export const PREF_DIETS = ['mediterranean', 'vegetarian', 'vegan', 'keto', 'low-carb'] as const
export type PrefDiet = (typeof PREF_DIETS)[number]

export const ACTIVITY_LEVELS = ['low', 'moderate', 'high'] as const
export type ActivityLevel = (typeof ACTIVITY_LEVELS)[number]

export interface Prefs {
  /** null = no answer. */
  goal: Goal | null
  /** null = no particular diet. */
  diet: PrefDiet | null
  activity: ActivityLevel | null
  /** True when the visitor dismissed the onboarding without answering. */
  skipped: boolean
}

export const NO_PREFS: Prefs = { goal: null, diet: null, activity: null, skipped: false }

type PrefsStorage = Pick<Storage, 'getItem' | 'setItem'>

function member<T extends string>(options: readonly T[], value: unknown): T | null {
  return typeof value === 'string' && (options as readonly string[]).includes(value)
    ? (value as T)
    : null
}

/** A stored value → Prefs, or null when absent or not a prefs record. Never throws; junk fields drop. */
export function parsePrefs(raw: string | null): Prefs | null {
  if (raw === null) return null
  let value: unknown
  try {
    value = JSON.parse(raw)
  } catch {
    return null
  }
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return null
  const record = value as Record<string, unknown>
  return {
    goal: member(GOALS, record.goal),
    diet: member(PREF_DIETS, record.diet),
    activity: member(ACTIVITY_LEVELS, record.activity),
    skipped: record.skipped === true,
  }
}

/**
 * The browser's localStorage, or null. Read off `globalThis` (not `window`) because the full
 * dictionary — type-checked by the node-side script tests too — imports this module's types.
 */
function browserStorage(): PrefsStorage | null {
  try {
    return (globalThis as { localStorage?: PrefsStorage }).localStorage ?? null
  } catch {
    return null
  }
}

/** The stored preferences, or null on a first visit (or when storage is unavailable). */
export function readPrefs(storage: PrefsStorage | null = browserStorage()): Prefs | null {
  if (storage === null) return null
  try {
    return parsePrefs(storage.getItem(PREFS_STORAGE_KEY))
  } catch {
    return null
  }
}

/** Persist; false when storage refused (the choice still applies for this page view). */
export function writePrefs(prefs: Prefs, storage: PrefsStorage | null = browserStorage()): boolean {
  if (storage === null) return false
  try {
    storage.setItem(
      PREFS_STORAGE_KEY,
      JSON.stringify({
        goal: prefs.goal,
        diet: prefs.diet,
        activity: prefs.activity,
        skipped: prefs.skipped,
      }),
    )
    return true
  } catch {
    return false
  }
}

/** The home module each goal leads with. */
export const GOAL_MODULE: Readonly<Record<Goal, ModuleId>> = {
  'eat-healthier': 'recipes',
  'lose-weight': 'diets',
  'build-strength': 'workouts',
  'feel-calmer': 'tips',
  skin: 'skincare',
}

/** The home module order: the goal's module first, the rest in their usual order. */
export function applyPrefsToModules(
  ids: readonly ModuleId[],
  prefs: Prefs | null,
): readonly ModuleId[] {
  const first = prefs?.goal ? GOAL_MODULE[prefs.goal] : null
  if (first === null || !ids.includes(first)) return ids
  return [first, ...ids.filter((id) => id !== first)]
}
