// CONTENT SOURCE — the one interface behind every content-reading screen (PLAN.md §1 item 5,
// P1.13): ingredients, diets, recipes, exercises, workout templates, health tips. Two
// implementations: `bundled` (./bundled.ts — the typed seed modules, no backend, every row
// `pending`) and `supabase` (./supabase.ts — `approved` rows from schema `hygieia`). ./index.ts
// picks one from `appEnv.mode`. The UI never branches on where data lives; it reads `kind` and a
// row's `status` only to decide whether to show the draft ribbon (components/DraftRibbon.tsx).
//
// Nothing here throws: every call resolves to a `Result`. Rows are the seed shape plus `id` and
// `status`, so the pure engines that take `*Seed` (fridge matcher, nutrition, cost) accept them
// as they are. Recipes additionally carry `lines` (ingredient lines resolved to ingredient rows)
// and templates carry `slots` (exercise slots resolved to exercise rows). Content is keyed by
// `slug` throughout (PLAN.md §1.6); `id` is carried for favourites / saved plans, which reference
// rows by id.

import type { ContentStatus, Intensity, Level, WorkoutType } from './enums.ts'
import type {
  DietSeed,
  ExerciseSeed,
  HealthTipSeed,
  IngredientSeed,
  RecipeLineSeed,
  RecipeSeed,
  WorkoutBlockSeed,
  WorkoutTemplateSeed,
} from './types.ts'

/** `network`: the request never reached the server (worth a retry). `unknown`: anything else. */
export type ContentError = 'network' | 'unknown'

export type Result<T> = { ok: true; data: T } | { ok: false; error: ContentError }

export const ok = <T>(data: T): Result<T> => ({ ok: true, data })
export const fail = <T>(error: ContentError): Result<T> => ({ ok: false, error })

/** What every row carries on top of its seed as the UI sees it. */
export interface ContentMeta {
  /** `md5('hygieia:<table>:<slug>')::uuid` for seeded rows (PLAN.md §1.6). */
  id: string
  status: ContentStatus
}

export type Ingredient = IngredientSeed & ContentMeta
export type Diet = DietSeed & ContentMeta
export type Exercise = ExerciseSeed & ContentMeta
export type HealthTip = HealthTipSeed & ContentMeta

/**
 * One ingredient line with its ingredient resolved. `ingredient` is null only when the line's
 * ingredient is not visible — in supabase mode an approved recipe can reference an ingredient that
 * is still `pending` (RLS hides it); in bundled mode every seed slug resolves (asserted by tests).
 */
export interface RecipeLine {
  line: RecipeLineSeed
  ingredient: Ingredient | null
}

export type Recipe = RecipeSeed & ContentMeta & { lines: RecipeLine[] }

/** One exercise slot with its exercise resolved; null under the same conditions as `RecipeLine`. */
export interface WorkoutSlot {
  block: WorkoutBlockSeed
  exercise: Exercise | null
}

export type WorkoutTemplate = WorkoutTemplateSeed & ContentMeta & { slots: WorkoutSlot[] }

export interface RecipeFilter {
  /**
   * Keep recipes tagged with AT LEAST ONE of these diet slugs (a multi-select filter is a union).
   * Absent or empty: no diet filter.
   */
  dietSlugs?: readonly string[]
}

export interface ContentSource {
  kind: 'bundled' | 'supabase'
  listIngredients(): Promise<Result<Ingredient[]>>
  listDiets(): Promise<Result<Diet[]>>
  listRecipes(filter?: RecipeFilter): Promise<Result<Recipe[]>>
  /** `ok` with `null` data when no visible recipe has that slug. */
  getRecipe(slug: string): Promise<Result<Recipe | null>>
  listExercises(): Promise<Result<Exercise[]>>
  listWorkoutTemplates(): Promise<Result<WorkoutTemplate[]>>
  /** The one template of a (type, level, intensity) cell, or `null` when it is not visible. */
  getWorkoutTemplate(
    type: WorkoutType,
    level: Level,
    intensity: Intensity,
  ): Promise<Result<WorkoutTemplate | null>>
  listTips(): Promise<Result<HealthTip[]>>
}

/** True when `recipe` passes `filter` (see `RecipeFilter`). Shared by both implementations. */
export function matchesRecipeFilter(recipe: RecipeSeed, filter?: RecipeFilter): boolean {
  const slugs = filter?.dietSlugs
  if (!slugs || slugs.length === 0) return true
  return recipe.diet_slugs.some((slug) => slugs.includes(slug))
}

export function filterRecipes<R extends RecipeSeed>(
  recipes: readonly R[],
  filter?: RecipeFilter,
): R[] {
  return recipes.filter((recipe) => matchesRecipeFilter(recipe, filter))
}
