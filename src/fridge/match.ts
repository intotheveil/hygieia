// FRIDGE MATCHER — pure domain (PLAN.md §P3.3). Given the recipe corpus, the ingredient catalogue
// and the set of ingredient slugs the user has, rank the recipes by how much of each one the user
// can already cook. No React, no I/O, no rounding: the UI (P3.4) renders what this returns.
//
// Rules the UI relies on:
//   - A missing ingredient whose `substitute_slugs` names something the user HAS counts as covered
//     and is REPORTED in `substitutions` — never silently folded into `have`.
//   - With `ignorePantryStaples`, a staple the user LACKS leaves the denominator and `missing`
//     (nobody lists salt in their fridge). A staple the user has still counts.
//   - A recipe line whose `ingredient_slug` is not in the catalogue is ignored for matching and
//     listed in `unknown`, so a seed bug is visible rather than skewing coverage.
//   - Recipes with coverage 0 are dropped; the order is total and deterministic.

import type { IngredientSeed, RecipeSeed } from '../content/types.ts'

export interface Substitution {
  /** The ingredient the recipe calls for and the user lacks. */
  missing: IngredientSeed
  /** The ingredient the user has that can stand in for it. */
  use: IngredientSeed
}

/**
 * Generic over the recipe row so a caller that matches resolved `Recipe`s (the fridge page) gets
 * them back as `Recipe`s without a cast; the matcher itself only reads the `RecipeSeed` fields.
 */
export interface MatchResult<R extends RecipeSeed = RecipeSeed> {
  recipe: R
  /** Ingredients the user has directly. */
  have: IngredientSeed[]
  /** Ingredients the user lacks with no substitute in the fridge (staples excluded when ignored). */
  missing: IngredientSeed[]
  /** `(have + substitutions) / (have + substitutions + missing)`, in `(0, 1]` for returned rows. */
  coverage: number
  /** Covered-by-substitute lines, reported separately so the UI can say "feta → use ricotta". */
  substitutions: Substitution[]
  /** Recipe-line slugs that resolve to no ingredient; ignored for matching. */
  unknown: string[]
}

export interface MatchOptions {
  ignorePantryStaples: boolean
}

/** Index an ingredient list by slug (last one wins on a duplicate slug; seeds forbid duplicates). */
export function indexBySlug(
  ingredients: readonly IngredientSeed[],
): ReadonlyMap<string, IngredientSeed> {
  return new Map(ingredients.map((ingredient) => [ingredient.slug, ingredient]))
}

/**
 * Fold a string for accent- and case-insensitive search in both languages: NFD-decompose, strip
 * combining marks (Greek tonos/dialytika, Latin accents), lower-case, fold Greek final sigma to
 * sigma, and collapse whitespace. `'Ντομάτα'` → `'ντοματα'`; `'σαλάτα'` and `'σαλατα'` agree.
 */
export function normalizeForSearch(s: string): string {
  return s
    .normalize('NFD')
    .replace(/\p{M}+/gu, '')
    .toLowerCase()
    .replace(/ς/g, 'σ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Code-point string order: total, locale-independent, hence identical on every machine. */
function compareStrings(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0
}

function compareResults(a: MatchResult, b: MatchResult): number {
  return (
    b.coverage - a.coverage ||
    a.missing.length - b.missing.length ||
    a.recipe.ingredients.length - b.recipe.ingredients.length ||
    compareStrings(a.recipe.title_en, b.recipe.title_en) ||
    compareStrings(a.recipe.slug, b.recipe.slug)
  )
}

/** Match ONE recipe against the fridge. Returned for every recipe, including coverage 0. */
export function matchRecipe<R extends RecipeSeed>(
  recipe: R,
  ingredientsBySlug: ReadonlyMap<string, IngredientSeed>,
  haveSlugs: ReadonlySet<string>,
  opts: MatchOptions,
): MatchResult<R> {
  const have: IngredientSeed[] = []
  const missing: IngredientSeed[] = []
  const substitutions: Substitution[] = []
  const unknown: string[] = []
  const seen = new Set<string>()

  for (const line of recipe.ingredients) {
    const slug = line.ingredient_slug
    if (seen.has(slug)) continue
    seen.add(slug)

    const ingredient = ingredientsBySlug.get(slug)
    if (!ingredient) {
      unknown.push(slug)
      continue
    }
    if (haveSlugs.has(slug)) {
      have.push(ingredient)
      continue
    }
    const substitute = findSubstitute(ingredient, ingredientsBySlug, haveSlugs)
    if (substitute) {
      substitutions.push({ missing: ingredient, use: substitute })
      continue
    }
    if (opts.ignorePantryStaples && ingredient.is_pantry_staple) continue
    missing.push(ingredient)
  }

  const covered = have.length + substitutions.length
  const denominator = covered + missing.length
  const coverage = denominator === 0 ? 0 : covered / denominator
  return { recipe, have, missing, coverage, substitutions, unknown }
}

function findSubstitute(
  ingredient: IngredientSeed,
  ingredientsBySlug: ReadonlyMap<string, IngredientSeed>,
  haveSlugs: ReadonlySet<string>,
): IngredientSeed | undefined {
  for (const slug of ingredient.substitute_slugs) {
    if (!haveSlugs.has(slug)) continue
    const substitute = ingredientsBySlug.get(slug)
    if (substitute) return substitute
  }
  return undefined
}

/**
 * Rank every recipe the user can at least partly cook. Order: coverage desc, then fewer missing,
 * then fewer ingredient lines, then `title_en` asc (then slug — a total order, so repeated calls
 * on the same input return the same array).
 */
export function matchRecipes<R extends RecipeSeed>(
  recipes: readonly R[],
  ingredients: readonly IngredientSeed[],
  haveSlugs: ReadonlySet<string>,
  opts: MatchOptions,
): MatchResult<R>[] {
  if (haveSlugs.size === 0) return []
  const bySlug = indexBySlug(ingredients)
  return recipes
    .map((recipe) => matchRecipe(recipe, bySlug, haveSlugs, opts))
    .filter((result) => result.coverage > 0)
    .sort(compareResults)
}
