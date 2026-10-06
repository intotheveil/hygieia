// BUNDLED CONTENT SOURCE — the typed seed modules served as content, for the no-backend build
// (PLAN.md §1 items 5–6, P1.13). Every row is `pending` (nobody has reviewed a seed) and carries
// the SAME id the seed migration gives it — `md5('hygieia:<table>:<slug>')::uuid` — so a favourite
// or saved plan made against one source resolves against the other. Children are resolved by slug
// against the seed catalogues once, lazily, on first use.
//
// LAZY SEEDS (P5.3 performance follow-up). The six seed tables are hundreds of kB of bilingual
// text; importing them statically put every one of them in the entry chunk (1.26 MB, FCP 3.5 s on
// every route). Each table is now a dynamic `import()` behind a cached promise, so Vite emits one
// chunk per table and a page pulls only what it reads: /recipes loads recipes + ingredients (+ diets
// for the filter), /workouts loads exercises + workouts, /tips loads tips. The public `ContentSource`
// API is unchanged (every method already returned a promise); `bundledSource` is still synchronous
// to construct. A chunk that fails to load (offline before the service worker precached it, or a
// stale deploy whose hashed chunk is gone) resolves to `fail('network')` like a supabase outage would,
// and the loader forgets the rejection so a later call retries.

import {
  CONTENT_STATUSES,
  type ContentTable,
  type Intensity,
  type Level,
  type WorkoutType,
} from './enums.ts'
import { hexToUuid, md5 } from './md5.ts'
import {
  fail,
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
  type Result,
  type SkincareProductType,
  type SkincareRoutine,
  type SkincareTip,
  type WorkoutTemplate,
} from './source.ts'
import type {
  DietSeed,
  ExerciseSeed,
  HealthTipSeed,
  IngredientSeed,
  RecipeSeed,
  SkincareProductTypeSeed,
  SkincareRoutineSeed,
  SkincareTipSeed,
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

/**
 * One seed table: the rows themselves (tests, fixtures) or a loader that imports them on first use
 * (the real seeds, so each table is its own chunk).
 */
export type SeedTable<T> = readonly T[] | (() => Promise<readonly T[]>)

export interface BundledSeeds {
  ingredients: SeedTable<IngredientSeed>
  diets: SeedTable<DietSeed>
  recipes: SeedTable<RecipeSeed>
  exercises: SeedTable<ExerciseSeed>
  workoutTemplates: SeedTable<WorkoutTemplateSeed>
  tips: SeedTable<HealthTipSeed>
  /** P7.1 — the three skincare tables share ONE module, so Vite emits one chunk for all three. */
  skincareProductTypes: SeedTable<SkincareProductTypeSeed>
  skincareRoutines: SeedTable<SkincareRoutineSeed>
  skincareTips: SeedTable<SkincareTipSeed>
}

/**
 * The real seed modules, each behind a dynamic import so Vite splits it into its own chunk. The
 * `.ts` paths are literal on purpose: the bundler needs a static string to know the chunk graph.
 */
export const BUNDLED_SEEDS: BundledSeeds = {
  ingredients: () => import('./seed/ingredients.ts').then((m) => m.INGREDIENTS),
  diets: () => import('./seed/diets.ts').then((m) => m.DIETS),
  recipes: () => import('./seed/recipes.ts').then((m) => m.RECIPES),
  exercises: () => import('./seed/exercises.ts').then((m) => m.EXERCISES),
  workoutTemplates: () => import('./seed/workouts.ts').then((m) => m.WORKOUT_TEMPLATES),
  tips: () => import('./seed/tips.ts').then((m) => m.HEALTH_TIPS),
  skincareProductTypes: () => import('./seed/skincare.ts').then((m) => m.SKINCARE_PRODUCT_TYPES),
  skincareRoutines: () => import('./seed/skincare.ts').then((m) => m.SKINCARE_ROUTINES),
  skincareTips: () => import('./seed/skincare.ts').then((m) => m.SKINCARE_TIPS),
}

/** Resolve a `SeedTable` to its rows (an array resolves at once; a loader is called). */
function rowsOf<T>(table: SeedTable<T>): Promise<readonly T[]> {
  return typeof table === 'function' ? table() : Promise.resolve(table)
}

/**
 * Compute once on first call and share the promise with every concurrent caller; the seed arrays
 * never change at runtime. A REJECTED promise is dropped, so the next call tries again (a chunk that
 * failed to download once may well download the second time).
 */
function lazy<T>(compute: () => Promise<T>): () => Promise<T> {
  let pending: Promise<T> | undefined
  return () => {
    if (!pending) {
      pending = compute().catch((err: unknown) => {
        pending = undefined
        throw err
      })
    }
    return pending
  }
}

/** Run `read`; a thrown chunk-load error becomes `fail('network')` so nothing here ever throws. */
async function attempt<T>(read: () => Promise<T>): Promise<Result<T>> {
  try {
    return ok(await read())
  } catch {
    return fail('network')
  }
}

/** A bundled source over the given seeds; `bundledSource` below is the one over the real seeds. */
export function createBundledSource(seeds: BundledSeeds): ContentSource {
  const ingredients = lazy<Ingredient[]>(async () =>
    (await rowsOf(seeds.ingredients)).map((row) => ({ ...row, ...meta('ingredients', row.slug) })),
  )
  const diets = lazy<Diet[]>(async () =>
    (await rowsOf(seeds.diets)).map((row) => ({ ...row, ...meta('diets', row.slug) })),
  )
  const exercises = lazy<Exercise[]>(async () =>
    (await rowsOf(seeds.exercises)).map((row) => ({ ...row, ...meta('exercises', row.slug) })),
  )
  const tips = lazy<HealthTip[]>(async () =>
    (await rowsOf(seeds.tips)).map((row) => ({ ...row, ...meta('health_tips', row.slug) })),
  )
  const skincareProductTypes = lazy<SkincareProductType[]>(async () =>
    (await rowsOf(seeds.skincareProductTypes)).map((row) => ({
      ...row,
      ...meta('skincare_product_types', row.slug),
    })),
  )
  const skincareRoutines = lazy<SkincareRoutine[]>(async () =>
    (await rowsOf(seeds.skincareRoutines)).map((row) => ({
      ...row,
      ...meta('skincare_routines', row.slug),
    })),
  )
  const skincareTips = lazy<SkincareTip[]>(async () =>
    (await rowsOf(seeds.skincareTips)).map((row) => ({
      ...row,
      ...meta('skincare_tips', row.slug),
    })),
  )
  const recipes = lazy<Recipe[]>(async () => {
    // Both tables in parallel: the recipe chunk and the ingredient chunk download side by side.
    const [rows, ingredientRows] = await Promise.all([rowsOf(seeds.recipes), ingredients()])
    const bySlug = new Map(ingredientRows.map((row) => [row.slug, row]))
    return rows.map((row) => ({
      ...row,
      ...meta('recipes', row.slug),
      lines: row.ingredients.map((line) => ({
        line,
        ingredient: bySlug.get(line.ingredient_slug) ?? null,
      })),
    }))
  })
  const templates = lazy<WorkoutTemplate[]>(async () => {
    const [rows, exerciseRows] = await Promise.all([rowsOf(seeds.workoutTemplates), exercises()])
    const bySlug = new Map(exerciseRows.map((row) => [row.slug, row]))
    return rows.map((row) => ({
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
    listIngredients: () => attempt(async () => [...(await ingredients())]),
    listDiets: () => attempt(async () => [...(await diets())]),
    listRecipes: (filter?: RecipeFilter) =>
      attempt(async () => filterRecipes(await recipes(), filter)),
    getRecipe: (slug: string) =>
      attempt(async () => (await recipes()).find((row) => row.slug === slug) ?? null),
    listExercises: () => attempt(async () => [...(await exercises())]),
    listWorkoutTemplates: () => attempt(async () => [...(await templates())]),
    getWorkoutTemplate: (type: WorkoutType, level: Level, intensity: Intensity) =>
      attempt(
        async () =>
          (await templates()).find(
            (row) =>
              row.workout_type === type && row.level === level && row.intensity === intensity,
          ) ?? null,
      ),
    listTips: () => attempt(async () => [...(await tips())]),
    listSkincareProductTypes: () => attempt(async () => [...(await skincareProductTypes())]),
    listSkincareRoutines: () => attempt(async () => [...(await skincareRoutines())]),
    listSkincareTips: () => attempt(async () => [...(await skincareTips())]),
  }
}

/** The bundled source over the real seed modules. */
export const bundledSource: ContentSource = createBundledSource(BUNDLED_SEEDS)
