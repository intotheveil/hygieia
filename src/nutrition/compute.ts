// NUTRITION ENGINE — pure domain (PLAN.md §P4.1). kcal and macros per recipe and per portion from
// the ingredient catalogue's per-100 g figures. No rounding here: the display rounds. Values are
// "typical" (USDA FoodData Central reference ranges, per the ingredients' `source_note`), and the
// result says so (`confidence`, `sourceNotes`) so the UI footnote is honest.

import type { Unit } from '../content/enums.ts'
import type { IngredientSeed, RecipeLineSeed, RecipeSeed } from '../content/types.ts'

export interface Macros {
  kcal: number
  protein: number
  carbs: number
  fat: number
}

export interface NutritionResult {
  perRecipe: Macros
  perPortion: Macros
  /** The divisor actually used (`recipe.portions`, floored at 1). */
  portions: number
  /** Recipe-line slugs that resolve to no ingredient; contribute nothing. */
  unknown: string[]
  /** Non-fatal oddities, e.g. a line unit that differs from the ingredient's own unit. */
  warnings: string[]
  confidence: 'typical'
  /** Distinct `source_note` values of the resolved ingredients, in first-seen order. */
  sourceNotes: string[]
}

const ZERO: Macros = { kcal: 0, protein: 0, carbs: 0, fat: 0 }

/** Grams in one `unit` of `ingredient`: `g`/`ml` are 1 (ml treated as g); anything else is the ingredient's `grams_per_unit`. */
export function gramsFor(ingredient: IngredientSeed, unit: Unit): number {
  return unit === 'g' || unit === 'ml' ? 1 : ingredient.grams_per_unit
}

/** Grams a recipe line amounts to, plus a `unitMismatch` warning when the line's unit is not the ingredient's and not g/ml. */
export function lineGrams(
  line: RecipeLineSeed,
  ingredient: IngredientSeed,
): { grams: number; warning: string | null } {
  const grams = line.quantity * gramsFor(ingredient, line.unit)
  const mismatch = line.unit !== 'g' && line.unit !== 'ml' && line.unit !== ingredient.unit
  const warning = mismatch
    ? `unitMismatch: ${ingredient.slug} line unit "${line.unit}" differs from ingredient unit "${ingredient.unit}"; used grams_per_unit=${ingredient.grams_per_unit}`
    : null
  return { grams, warning }
}

/** `recipe.portions` guarded: ≥ 1 by type, but never let a bad row divide by zero or NaN. */
export function safePortions(portions: number): number {
  return Number.isFinite(portions) ? Math.max(1, portions) : 1
}

function scale(macros: Macros, factor: number): Macros {
  return {
    kcal: macros.kcal * factor,
    protein: macros.protein * factor,
    carbs: macros.carbs * factor,
    fat: macros.fat * factor,
  }
}

function add(a: Macros, b: Macros): Macros {
  return {
    kcal: a.kcal + b.kcal,
    protein: a.protein + b.protein,
    carbs: a.carbs + b.carbs,
    fat: a.fat + b.fat,
  }
}

function per100g(ingredient: IngredientSeed): Macros {
  return {
    kcal: ingredient.kcal_100g,
    protein: ingredient.protein_100g,
    carbs: ingredient.carbs_100g,
    fat: ingredient.fat_100g,
  }
}

export function computeNutrition(
  recipe: RecipeSeed,
  ingredientsBySlug: ReadonlyMap<string, IngredientSeed>,
): NutritionResult {
  let perRecipe = ZERO
  const unknown: string[] = []
  const warnings: string[] = []
  const sourceNotes: string[] = []

  for (const line of recipe.ingredients) {
    const ingredient = ingredientsBySlug.get(line.ingredient_slug)
    if (!ingredient) {
      unknown.push(line.ingredient_slug)
      continue
    }
    const { grams, warning } = lineGrams(line, ingredient)
    if (warning) warnings.push(warning)
    perRecipe = add(perRecipe, scale(per100g(ingredient), grams / 100))
    if (ingredient.source_note && !sourceNotes.includes(ingredient.source_note)) {
      sourceNotes.push(ingredient.source_note)
    }
  }

  const portions = safePortions(recipe.portions)
  return {
    perRecipe,
    perPortion: scale(perRecipe, 1 / portions),
    portions,
    unknown,
    warnings,
    confidence: 'typical',
    sourceNotes,
  }
}
