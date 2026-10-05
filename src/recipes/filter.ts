// RECIPE FILTER — pure domain (PLAN.md §P3.1). Narrow the recipe corpus by diet tags, meal types
// and a title query, and codec the same filter to/from URL search params so the recipes page can
// keep its state in the address bar. No React, no I/O: `RecipesPage` renders what this returns.
//
// Rules the UI relies on:
//   - Every criterion is ANY-OF within itself and ALL-OF across criteria: a recipe passes when it
//     carries at least one requested diet AND at least one requested meal type AND its title in the
//     CURRENT language contains the query. An empty/undefined criterion matches everything.
//   - The title match is accent- and case-insensitive in both scripts via `normalizeForSearch`
//     (`σαλατα` finds `Σαλάτα`, `GREEK` finds `greek`). Title ONLY — ingredient names are not
//     searched, so the result is predictable from what the card shows.
//   - `filterRecipes` preserves input order; `sortRecipes` is a separate, deterministic step.
//   - URL state is `?diet=a,b&meal=lunch&q=…`; unknown or malformed values are dropped on parse,
//     and `parse(serialize(x))` round-trips any canonical filter.

import { MEAL_TYPES, type MealType } from '../content/enums.ts'
import type { RecipeSeed } from '../content/types.ts'
import { normalizeForSearch } from '../fridge/match.ts'
import type { Lang } from '../i18n/dictionary.ts'

/** The URL-backed part of a filter: what the user picked, independent of language. */
export interface RecipeFilterParams {
  /** Any-of. Empty = all diets. */
  dietSlugs: string[]
  /** Any-of. Empty = all meal types. */
  mealTypes: MealType[]
  /** Title substring, matched after `normalizeForSearch`. Blank = no title filter. */
  query: string
}

/** What `filterRecipes` takes: the params (each optional) plus the language whose title to match. */
export interface RecipeFilter extends Partial<RecipeFilterParams> {
  lang: Lang
}

export const RECIPE_FILTER_PARAM_KEYS = { diet: 'diet', meal: 'meal', query: 'q' } as const

/** The recipe title in the given language. */
export function recipeTitle(recipe: RecipeSeed, lang: Lang): string {
  return lang === 'el' ? recipe.title_el : recipe.title_en
}

/**
 * Narrow `recipes` by the filter (see module header). Preserves input order; never mutates.
 * Generic so a `Recipe` row (id, status, lines) comes back as a `Recipe`, not a bare seed.
 */
export function filterRecipes<R extends RecipeSeed>(
  recipes: readonly R[],
  filter: RecipeFilter,
): R[] {
  const diets = toSet(filter.dietSlugs)
  const meals = toSet(filter.mealTypes)
  const needle = normalizeForSearch(filter.query ?? '')

  return recipes.filter(
    (recipe) =>
      (diets === null || recipe.diet_slugs.some((slug) => diets.has(slug))) &&
      (meals === null || recipe.meal_types.some((meal) => meals.has(meal))) &&
      (needle === '' || normalizeForSearch(recipeTitle(recipe, filter.lang)).includes(needle)),
  )
}

/** `null` when the criterion is absent or empty (= match everything). */
function toSet<T>(values: readonly T[] | undefined): ReadonlySet<T> | null {
  return values === undefined || values.length === 0 ? null : new Set(values)
}

/** Code-point string order: total, locale-independent, hence identical on every machine. */
function compareStrings(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0
}

/**
 * A NEW array sorted by the localized title after `normalizeForSearch` (so accents and case do
 * not scatter entries), then by slug — a total order, so the result is deterministic.
 */
export function sortRecipes<R extends RecipeSeed>(recipes: readonly R[], lang: Lang): R[] {
  const keyed = recipes.map((recipe) => ({
    recipe,
    key: normalizeForSearch(recipeTitle(recipe, lang)),
  }))
  keyed.sort((a, b) => compareStrings(a.key, b.key) || compareStrings(a.recipe.slug, b.recipe.slug))
  return keyed.map((entry) => entry.recipe)
}

// --- URL state ----------------------------------------------------------------------------------

/** Lower-case kebab slugs only — what every seed slug looks like; anything else is URL junk. */
const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]*$/

const MEAL_TYPE_SET: ReadonlySet<string> = new Set<string>(MEAL_TYPES)

function isMealType(value: string): value is MealType {
  return MEAL_TYPE_SET.has(value)
}

/** Split every occurrence of `key` on commas, trim, drop blanks, dedupe — order preserved. */
function readList(searchParams: URLSearchParams, key: string): string[] {
  const seen = new Set<string>()
  for (const raw of searchParams.getAll(key)) {
    for (const token of raw.split(',')) {
      const value = token.trim()
      if (value !== '') seen.add(value)
    }
  }
  return [...seen]
}

export interface ParseRecipeFilterOptions {
  /** When given, diet slugs not in this set are dropped (the page passes the loaded catalogue). */
  knownDietSlugs?: ReadonlySet<string>
}

/**
 * Read `?diet=a,b&meal=lunch&q=…` into filter params. Never throws. Diet tokens must look like
 * slugs (and be in `knownDietSlugs` when supplied); meal tokens must be a `MealType`; the query is
 * trimmed. Duplicates are removed, order is preserved.
 */
export function parseRecipeFilterParams(
  searchParams: URLSearchParams,
  options: ParseRecipeFilterOptions = {},
): RecipeFilterParams {
  const dietSlugs = readList(searchParams, RECIPE_FILTER_PARAM_KEYS.diet).filter(
    (slug) =>
      SLUG_PATTERN.test(slug) &&
      (options.knownDietSlugs === undefined || options.knownDietSlugs.has(slug)),
  )
  const mealTypes = readList(searchParams, RECIPE_FILTER_PARAM_KEYS.meal).filter(isMealType)
  const query = (searchParams.get(RECIPE_FILTER_PARAM_KEYS.query) ?? '').trim()
  return { dietSlugs, mealTypes, query }
}

/**
 * Write filter params as `URLSearchParams` (`diet=a,b`, `meal=lunch,dinner`, `q=…`). Empty
 * criteria are omitted so a clean filter serializes to an empty string; lists are deduped.
 * `parseRecipeFilterParams(serializeRecipeFilterParams(x))` equals `x` for canonical `x`.
 */
export function serializeRecipeFilterParams(params: Partial<RecipeFilterParams>): URLSearchParams {
  const out = new URLSearchParams()
  const diets = dedupe(params.dietSlugs ?? [])
  const meals = dedupe(params.mealTypes ?? [])
  const query = (params.query ?? '').trim()
  if (diets.length > 0) out.set(RECIPE_FILTER_PARAM_KEYS.diet, diets.join(','))
  if (meals.length > 0) out.set(RECIPE_FILTER_PARAM_KEYS.meal, meals.join(','))
  if (query !== '') out.set(RECIPE_FILTER_PARAM_KEYS.query, query)
  return out
}

function dedupe<T>(values: readonly T[]): T[] {
  return [...new Set(values)]
}

/** True when the filter narrows nothing — the page uses it to hide "clear filters". */
export function isEmptyRecipeFilter(params: Partial<RecipeFilterParams>): boolean {
  return (
    (params.dietSlugs?.length ?? 0) === 0 &&
    (params.mealTypes?.length ?? 0) === 0 &&
    (params.query ?? '').trim() === ''
  )
}
