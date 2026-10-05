// BUNDLED CONTENT SOURCE — the typed seed modules served as content, for the no-backend build
// (PLAN.md §1 items 5–6, P1.13). Every row is `pending` (nobody has reviewed a seed) and carries
// the SAME id the seed migration gives it — `md5('hygieia:<table>:<slug>')::uuid` — so a favourite
// or saved plan made against one source resolves against the other. Children are resolved by slug
// against the seed catalogues once, lazily, on first use.

import {
  CONTENT_STATUSES,
  type ContentTable,
  type Intensity,
  type Level,
  type WorkoutType,
} from './enums.ts'
import { hexToUuid, md5 } from './md5.ts'
import { DIETS } from './seed/diets.ts'
import { EXERCISES } from './seed/exercises.ts'
import { INGREDIENTS } from './seed/ingredients.ts'
import { RECIPES } from './seed/recipes.ts'
import { HEALTH_TIPS } from './seed/tips.ts'
import { WORKOUT_TEMPLATES } from './seed/workouts.ts'
import {
  filterRecipes,
  ok,
  type ContentMeta,
  type ContentSource,
  type Diet,
  type Exercise,
  type HealthTip,
  type Ingredient,
  type Recipe,
  type RecipeFilter,
  type WorkoutTemplate,
} from './source.ts'
import type {
  DietSeed,
  ExerciseSeed,
  HealthTipSeed,
  IngredientSeed,
  RecipeSeed,
  WorkoutTemplateSeed,
} from './types.ts'

/** The id the seed migration gives a content row (PLAN.md §1.6): `md5('hygieia:<table>:<slug>')::uuid`. */
export function seedId(table: ContentTable, slug: string): string {
  return hexToUuid(md5(`hygieia:${table}:${slug}`))
}

const PENDING = CONTENT_STATUSES[0]

function meta(table: ContentTable, slug: string): ContentMeta {
  return { id: seedId(table, slug), status: PENDING }
}

export interface BundledSeeds {
  ingredients: readonly IngredientSeed[]
  diets: readonly DietSeed[]
  recipes: readonly RecipeSeed[]
  exercises: readonly ExerciseSeed[]
  workoutTemplates: readonly WorkoutTemplateSeed[]
  tips: readonly HealthTipSeed[]
}

export const BUNDLED_SEEDS: BundledSeeds = {
  ingredients: INGREDIENTS,
  diets: DIETS,
  recipes: RECIPES,
  exercises: EXERCISES,
  workoutTemplates: WORKOUT_TEMPLATES,
  tips: HEALTH_TIPS,
}

/** Compute once on first call; the seed arrays never change at runtime. */
function lazy<T>(compute: () => T): () => T {
  let value: T | undefined
  let done = false
  return () => {
    if (!done) {
      value = compute()
      done = true
    }
    return value as T
  }
}

/** A bundled source over the given seeds; `bundledSource` below is the one over the real seeds. */
export function createBundledSource(seeds: BundledSeeds): ContentSource {
  const ingredients = lazy<Ingredient[]>(() =>
    seeds.ingredients.map((row) => ({ ...row, ...meta('ingredients', row.slug) })),
  )
  const diets = lazy<Diet[]>(() =>
    seeds.diets.map((row) => ({ ...row, ...meta('diets', row.slug) })),
  )
  const exercises = lazy<Exercise[]>(() =>
    seeds.exercises.map((row) => ({ ...row, ...meta('exercises', row.slug) })),
  )
  const tips = lazy<HealthTip[]>(() =>
    seeds.tips.map((row) => ({ ...row, ...meta('health_tips', row.slug) })),
  )
  const recipes = lazy<Recipe[]>(() => {
    const bySlug = new Map(ingredients().map((row) => [row.slug, row]))
    return seeds.recipes.map((row) => ({
      ...row,
      ...meta('recipes', row.slug),
      lines: row.ingredients.map((line) => ({
        line,
        ingredient: bySlug.get(line.ingredient_slug) ?? null,
      })),
    }))
  })
  const templates = lazy<WorkoutTemplate[]>(() => {
    const bySlug = new Map(exercises().map((row) => [row.slug, row]))
    return seeds.workoutTemplates.map((row) => ({
      ...row,
      ...meta('workout_templates', row.slug),
      slots: row.blocks.map((block) => ({
        block,
        exercise: bySlug.get(block.exercise_slug) ?? null,
      })),
    }))
  })

  return {
    kind: 'bundled',
    listIngredients: async () => ok([...ingredients()]),
    listDiets: async () => ok([...diets()]),
    listRecipes: async (filter?: RecipeFilter) => ok(filterRecipes(recipes(), filter)),
    getRecipe: async (slug: string) => ok(recipes().find((row) => row.slug === slug) ?? null),
    listExercises: async () => ok([...exercises()]),
    listWorkoutTemplates: async () => ok([...templates()]),
    getWorkoutTemplate: async (type: WorkoutType, level: Level, intensity: Intensity) =>
      ok(
        templates().find(
          (row) => row.workout_type === type && row.level === level && row.intensity === intensity,
        ) ?? null,
      ),
    listTips: async () => ok([...tips()]),
  }
}

/** The bundled source over the real seed modules. */
export const bundledSource: ContentSource = createBundledSource(BUNDLED_SEEDS)
