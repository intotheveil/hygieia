// WEEKLY MEAL-PLAN GENERATOR — pure domain (PLAN.md §P4.5). From the recipes tagged with a diet,
// fill `days` × {breakfast, lunch, dinner} (snack is never scheduled), sum each day's per-portion
// nutrition (P4.1) and aggregate a shopping list (one portion per meal). No React, no I/O, no
// rounding: the UI (P4.6) renders what this returns and rounds for display.
//
// Rules the UI relies on:
//   - DETERMINISTIC. Same `dietSlug` + recipes + ingredients + `seed` → deep-equal plan, whatever
//     the ORDER of the input arrays: every pool is sorted by slug before sampling, the PRNG is
//     mulberry32 seeded from `opts.seed`, and the shopping list is sorted by slug then unit.
//   - A recipe picked for a meal is not picked again for that meal in the next 3 days when the
//     meal's pool has ≥ 4 recipes. A smaller pool still rotates as far as it can (pool 3 → gap 2,
//     pool 2 → alternate, pool 1 → every day) and emits ONE `pool-too-small` warning for that meal.
//   - A meal with NO tagged recipe → `null` slot on every day and one `no-recipe-for-meal` warning
//     PER DAY (so the UI can mark the empty cell); never a throw.
//   - Day totals are the sum of `computeNutrition(recipe).perPortion` over the filled slots; the
//     shopping list sums `line.quantity / recipe.portions` per `ingredient_slug` + `unit`.

import type { MealType, Unit } from '../content/enums.ts'
import type { IngredientSeed, IsoDate, Localized, RecipeSeed } from '../content/types.ts'
import { indexBySlug } from '../fridge/match.ts'
import { computeNutrition, safePortions, type Macros } from '../nutrition/compute.ts'

/** The meals a plan schedules, in day order. `snack` is deliberately absent. */
export const PLAN_MEALS = ['breakfast', 'lunch', 'dinner'] as const satisfies readonly MealType[]
export type PlanMeal = (typeof PLAN_MEALS)[number]

/** Days a recipe stays out of its meal after being picked, when the pool allows (pool ≥ 4). */
export const REPEAT_WINDOW_DAYS = 3

/** Pools with fewer recipes than this cannot honour `REPEAT_WINDOW_DAYS` and warn `pool-too-small`. */
export const MIN_POOL_FOR_NO_REPEAT = REPEAT_WINDOW_DAYS + 1

export type DaySlots = { [M in PlanMeal]: RecipeSeed | null }

export interface DayPlan {
  /** 0-based day offset from `weekStart` (0 = Monday when `weekStart` is a Monday). */
  index: number
  slots: DaySlots
  /** Sum of the per-portion nutrition of the filled slots (one portion each). */
  totals: Macros
}

export interface ShoppingLine extends Localized<'name'> {
  ingredient_slug: string
  unit: Unit
  /** Summed over the week in `unit`, one portion per scheduled meal (`line.quantity / portions`). */
  quantity: number
}

export type PlanWarningReason = 'no-recipe-for-meal' | 'pool-too-small'

export interface PlanWarning {
  /** Day index for a per-day warning; `null` when the warning is about the whole week. */
  day: number | null
  meal: PlanMeal
  reason: PlanWarningReason
}

export interface WeekPlan {
  dietSlug: string
  /** ISO date of day 0, or `null` when the caller did not pin the plan to a calendar week. */
  weekStart: IsoDate | null
  days: DayPlan[]
  shoppingList: ShoppingLine[]
  warnings: PlanWarning[]
  /** The seed the plan was generated with — reshuffle = call again with another one. */
  seed: number
}

export interface GenerateOptions {
  seed: number
  /** Number of days to plan; default 7. Non-finite or negative values fall back to 7 / 0. */
  days?: number
  /** ISO `YYYY-MM-DD` of day 0; carried through to `WeekPlan.weekStart`. Default `null`. */
  weekStart?: IsoDate
}

export type IngredientsInput = readonly IngredientSeed[] | ReadonlyMap<string, IngredientSeed>

const DEFAULT_DAYS = 7

// --- PRNG ----------------------------------------------------------------------------------------

/**
 * mulberry32: a tiny, fast 32-bit seeded PRNG. Returns a function yielding floats in `[0, 1)`;
 * the same seed always yields the same sequence, on every engine (32-bit integer ops only).
 */
export function mulberry32(seed: number): () => number {
  let a = seed | 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// --- helpers -------------------------------------------------------------------------------------

/** Code-point string order: total, locale-independent, hence identical on every machine. */
function compareStrings(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0
}

function isIngredientList(input: IngredientsInput): input is readonly IngredientSeed[] {
  return Array.isArray(input)
}

function toIndex(input: IngredientsInput): ReadonlyMap<string, IngredientSeed> {
  return isIngredientList(input) ? indexBySlug(input) : input
}

function normalizeDays(days: number | undefined): number {
  if (days === undefined || !Number.isFinite(days)) return DEFAULT_DAYS
  return Math.max(0, Math.floor(days))
}

/** The recipes tagged with `dietSlug` whose `meal_types` include `meal`, sorted by slug (total order). */
export function poolFor(
  dietSlug: string,
  meal: PlanMeal,
  recipes: readonly RecipeSeed[],
): RecipeSeed[] {
  return recipes
    .filter((recipe) => recipe.diet_slugs.includes(dietSlug) && recipe.meal_types.includes(meal))
    .sort((a, b) => compareStrings(a.slug, b.slug))
}

function emptyMacros(): Macros {
  return { kcal: 0, protein: 0, carbs: 0, fat: 0 }
}

function addMacros(a: Macros, b: Macros): Macros {
  return {
    kcal: a.kcal + b.kcal,
    protein: a.protein + b.protein,
    carbs: a.carbs + b.carbs,
    fat: a.fat + b.fat,
  }
}

/** ISO date of the next Monday strictly after `from` (UTC calendar), for callers pinning a plan. */
export function nextMonday(from: Date): IsoDate {
  const day = from.getUTCDay() // 0 = Sunday … 6 = Saturday
  const ahead = (8 - day) % 7 || 7
  const monday = new Date(
    Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate() + ahead),
  )
  return monday.toISOString().slice(0, 10)
}

// --- shopping list -------------------------------------------------------------------------------

/**
 * Aggregate every filled slot's ingredient lines, one portion per meal: each line contributes
 * `quantity / portions` in its own `unit`, summed per `ingredient_slug` + `unit`. Names come from
 * the catalogue; an unknown slug keeps the slug as its name (never dropped, never a throw).
 * Sorted by slug then unit so the result is deterministic.
 */
export function shoppingListFor(
  plan: Pick<WeekPlan, 'days'>,
  ingredientsBySlug: ReadonlyMap<string, IngredientSeed>,
): ShoppingLine[] {
  const lines = new Map<string, ShoppingLine>()
  for (const day of plan.days) {
    for (const meal of PLAN_MEALS) {
      const recipe = day.slots[meal]
      if (!recipe) continue
      const perPortion = 1 / safePortions(recipe.portions)
      for (const line of recipe.ingredients) {
        const key = `${line.ingredient_slug}\u0000${line.unit}`
        const existing = lines.get(key)
        if (existing) {
          existing.quantity += line.quantity * perPortion
          continue
        }
        const ingredient = ingredientsBySlug.get(line.ingredient_slug)
        lines.set(key, {
          ingredient_slug: line.ingredient_slug,
          unit: line.unit,
          quantity: line.quantity * perPortion,
          name_el: ingredient?.name_el ?? line.ingredient_slug,
          name_en: ingredient?.name_en ?? line.ingredient_slug,
        })
      }
    }
  }
  return [...lines.values()].sort(
    (a, b) =>
      compareStrings(a.ingredient_slug, b.ingredient_slug) || compareStrings(a.unit, b.unit),
  )
}

// --- generator -----------------------------------------------------------------------------------

/**
 * Build a `days`-day plan for `dietSlug`. Pools are per meal (recipes tagged with the diet whose
 * `meal_types` include the meal), sorted by slug; slots are filled day by day, meal by meal, from
 * one mulberry32 stream seeded with `opts.seed`. See the header for the repeat and warning rules.
 */
export function generateWeekPlan(
  dietSlug: string,
  recipes: readonly RecipeSeed[],
  ingredients: IngredientsInput,
  opts: GenerateOptions,
): WeekPlan {
  const ingredientsBySlug = toIndex(ingredients)
  const dayCount = normalizeDays(opts.days)
  const rng = mulberry32(opts.seed)
  const warnings: PlanWarning[] = []

  const pools = {} as Record<PlanMeal, RecipeSeed[]>
  const history = {} as Record<PlanMeal, RecipeSeed[]>
  for (const meal of PLAN_MEALS) {
    pools[meal] = poolFor(dietSlug, meal, recipes)
    history[meal] = []
    if (pools[meal].length > 0 && pools[meal].length < MIN_POOL_FOR_NO_REPEAT) {
      warnings.push({ day: null, meal, reason: 'pool-too-small' })
    }
  }

  const days: DayPlan[] = []
  for (let index = 0; index < dayCount; index++) {
    const slots: DaySlots = { breakfast: null, lunch: null, dinner: null }
    let totals = emptyMacros()
    for (const meal of PLAN_MEALS) {
      const pool = pools[meal]
      if (pool.length === 0) {
        warnings.push({ day: index, meal, reason: 'no-recipe-for-meal' })
        continue
      }
      // Exclude what this meal served in the last `window` days; a small pool shrinks the window
      // so there is always at least one candidate (pool 4+ → 3, pool 3 → 2, pool 2 → 1, pool 1 → 0).
      const window = Math.min(REPEAT_WINDOW_DAYS, pool.length - 1)
      const recent = new Set(
        window === 0 ? [] : history[meal].slice(-window).map((recipe) => recipe.slug),
      )
      // `recent` holds at most `window` slugs and `window < pool.length`, so `candidates` is never
      // empty; the index is in range because `rng() < 1`.
      const candidates = pool.filter((recipe) => !recent.has(recipe.slug))
      const pick = candidates[Math.floor(rng() * candidates.length)]
      slots[meal] = pick
      history[meal].push(pick)
      totals = addMacros(totals, computeNutrition(pick, ingredientsBySlug).perPortion)
    }
    days.push({ index, slots, totals })
  }

  return {
    dietSlug,
    weekStart: opts.weekStart ?? null,
    days,
    shoppingList: shoppingListFor({ days }, ingredientsBySlug),
    warnings,
    seed: opts.seed,
  }
}
