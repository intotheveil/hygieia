// PREFERENCES → PAGES (2026-10-06). How each page reads the visitor's preferences (./prefs.ts).
// Pure; imported only by lazily-loaded pages, so none of it reaches the eager chunk.
//
// The one rule: an EXPLICIT URL PARAMETER ALWAYS WINS. A preference only fills a default the
// address left open — a shared or bookmarked link renders the same for everyone.

import type { Level } from '../content/enums.ts'
import type { TopicId } from '../tasks/content/topics.ts'
import type { ActivityLevel, Goal, Prefs } from './prefs.ts'

/** The URL keys of the recipe filter (recipes/filter.ts `RECIPE_FILTER_PARAM_KEYS`). */
const RECIPE_KEYS = ['diet', 'meal', 'q'] as const

/**
 * /recipes: the address to REPLACE the current one with so the list opens filtered by the
 * preferred diet — or null to leave it alone (no diet preference, or the URL already carries any
 * filter: diet, meal or search). The page applies it once, on arrival, so "Clear filters" clears.
 */
export function applyPrefsToRecipeParams(
  search: URLSearchParams,
  prefs: Prefs | null,
): URLSearchParams | null {
  if (!prefs?.diet) return null
  if (RECIPE_KEYS.some((key) => search.has(key))) return null
  const out = new URLSearchParams(search)
  out.set('diet', prefs.diet)
  return out
}

/** Activity level → the workout level it starts at. */
export const ACTIVITY_WORKOUT_LEVEL: Readonly<Record<ActivityLevel, Level>> = {
  low: 'beginner',
  moderate: 'intermediate',
  high: 'advanced',
}

/**
 * /workouts: the params the page reads its selection from — the URL's own, plus `level` from the
 * activity preference when the URL has none. Never mutates its input.
 */
export function applyPrefsToWorkoutParams(
  search: URLSearchParams,
  prefs: Prefs | null,
): URLSearchParams {
  if (!prefs?.activity || search.has('level')) return search
  const out = new URLSearchParams(search)
  out.set('level', ACTIVITY_WORKOUT_LEVEL[prefs.activity])
  return out
}

/** /diets: is this the visitor's diet (highlighted on the list)? */
export function isPreferredDiet(prefs: Prefs | null, slug: string): boolean {
  return prefs?.diet === slug
}

/** The task-plan topics each goal suggests (highlighted on /tasks), most relevant first. */
export const GOAL_TASK_TOPICS: Readonly<Record<Goal, readonly TopicId[]>> = {
  'eat-healthier': ['eat-healthier', 'budget-groceries', 'drink-water'],
  'lose-weight': ['eat-healthier', 'workout-routine', 'drink-water'],
  'build-strength': ['workout-routine', 'better-sleep'],
  'feel-calmer': ['reduce-stress', 'better-sleep', 'morning-routine'],
  skin: ['skincare-habit', 'drink-water', 'better-sleep'],
}

/** /tasks: the topics to mark "suggested for you" (none without a goal). */
export function suggestedTaskTopics(prefs: Prefs | null): readonly TopicId[] {
  return prefs?.goal ? GOAL_TASK_TOPICS[prefs.goal] : []
}

/** /skincare: does the visitor's goal point here (the page then shows its "for your goal" note)? */
export function prefersSkincare(prefs: Prefs | null): boolean {
  return prefs?.goal === 'skin'
}
