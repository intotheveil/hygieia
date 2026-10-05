// COST ENGINE — pure domain (PLAN.md §P4.2). EUR range per recipe and per portion from the
// ingredient catalogue's `price_eur_min/max` quoted per `price_per` (kg / l / piece). Honest by
// construction: `asOf` is the OLDEST price date among the priced lines, and a line that cannot be
// priced is listed in `unpriced` and left out of the range — never silently counted as zero.

import type { IngredientSeed, RecipeLineSeed, RecipeSeed } from '../content/types.ts'

export interface CostRange {
  min: number
  max: number
}

export interface CostLine {
  slug: string
  min: number
  max: number
}

export interface CostResult {
  perRecipe: CostRange
  perPortion: CostRange
  /** The divisor actually used (`recipe.portions`, floored at 1). */
  portions: number
  /** Oldest `price_as_of` (ISO date) among priced lines; null when nothing is priced. */
  asOf: string | null
  /** Slugs of lines with no usable price (unknown ingredient, no max price, or underivable basis). */
  unpriced: string[]
  /** One entry per priced recipe line, in recipe order. */
  lines: CostLine[]
}

/** `recipe.portions` guarded: ≥ 1 by type, but never let a bad row divide by zero or NaN. */
export function safePortions(portions: number): number {
  return Number.isFinite(portions) ? Math.max(1, portions) : 1
}

/**
 * How many `price_per` units a recipe line amounts to, or null when it cannot be derived.
 *   - `kg` / `l`: grams (or ml, treated 1:1) / 1000, with grams = quantity × (1 for g/ml, else
 *     the ingredient's `grams_per_unit`).
 *   - `piece`: the quantity when the line unit is `piece`, else grams / `grams_per_unit`.
 */
export function basisQuantity(line: RecipeLineSeed, ingredient: IngredientSeed): number | null {
  const perUnit = line.unit === 'g' || line.unit === 'ml' ? 1 : ingredient.grams_per_unit
  const grams = line.quantity * perUnit
  let basis: number
  switch (ingredient.price_per) {
    case 'kg':
    case 'l':
      basis = grams / 1000
      break
    case 'piece':
      basis = line.unit === 'piece' ? line.quantity : grams / ingredient.grams_per_unit
      break
  }
  return Number.isFinite(basis) && basis >= 0 ? basis : null
}

/** Usable when `price_eur_max` is a finite number > 0 (`Number.isFinite` also rejects undefined/NaN). */
function hasUsablePrice(ingredient: IngredientSeed): boolean {
  return Number.isFinite(ingredient.price_eur_max) && ingredient.price_eur_max > 0
}

/** ISO `YYYY-MM-DD` strings order lexicographically; an empty/absent date never becomes `asOf`. */
function older(a: string | null, b: string): string | null {
  if (!b) return a
  return a === null || b < a ? b : a
}

export function computeCost(
  recipe: RecipeSeed,
  ingredientsBySlug: ReadonlyMap<string, IngredientSeed>,
): CostResult {
  let min = 0
  let max = 0
  let asOf: string | null = null
  const unpriced: string[] = []
  const lines: CostLine[] = []

  for (const line of recipe.ingredients) {
    const slug = line.ingredient_slug
    const ingredient = ingredientsBySlug.get(slug)
    if (!ingredient || !hasUsablePrice(ingredient)) {
      unpriced.push(slug)
      continue
    }
    const basis = basisQuantity(line, ingredient)
    if (basis === null) {
      unpriced.push(slug)
      continue
    }
    const lineMin =
      basis * (Number.isFinite(ingredient.price_eur_min) ? ingredient.price_eur_min : 0)
    const lineMax = basis * ingredient.price_eur_max
    lines.push({ slug, min: lineMin, max: lineMax })
    min += lineMin
    max += lineMax
    asOf = older(asOf, ingredient.price_as_of)
  }

  const portions = safePortions(recipe.portions)
  return {
    perRecipe: { min, max },
    perPortion: { min: min / portions, max: max / portions },
    portions,
    asOf,
    unpriced,
    lines,
  }
}
