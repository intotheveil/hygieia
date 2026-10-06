// BUNDLED CONTENT SOURCE — the typed seed modules served as content, for the no-backend build
// (PLAN.md §1 items 5–6, P1.13). Every row is `pending` (nobody has reviewed a seed) and carries
// the SAME id the seed migration gives it — `md5('hygieia:<table>:<slug>')::uuid` — so a favourite
// or saved plan made against one source resolves against the other. Children are resolved by slug
// against the seed catalogues once, lazily, on first use.
//
// LAZY SEEDS (P5.3 performance follow-up). The six seed tables are hundreds of kB of bilingual
// text; importing them statically put every one of them in the entry chunk (1.26 MB, FCP 3.5 s on
// every route). Each table is now a dynamic `import()` behind a cached promise, so Vite emits one
// chunk per table and a page pulls only what it reads: /recipes loads recipes + ingredients (+
// diets for the filter), /workouts loads exercises + workouts, /tips loads tips. The public
// `ContentSource` API is unchanged (every method already returned a promise); `bundledSource` is
// still synchronous to construct. A chunk that fails to load (offline before the service worker
// precached it, or a stale deploy whose hashed chunk is gone) resolves to `fail('network')` like a
// supabase outage would, and the loader forgets the rejection so a later call retries.
//
// AFTER THE PAINT (perf, 2026-10-06 — CI Lighthouse diet 84). The real loaders start their
// `import()` only after the frame being rendered is on screen (`afterNextPaint`,
// lib/afterPaint.ts): a page that asks for a seed table on mount paints its header, intro and
// skeleton first, and the seed chunk then downloads on its own instead of sharing the first paint's
// bandwidth. The wait is two animation frames on the first call per table (the loaders are memoised
// below); the injected fixture tables used by tests are untouched.
//
// CONTENT OVERLAYS (2026-10-06). The base seed modules are frozen (their migrations are applied
// live); later edits and additions live in ./seed/overlays/ (see types.ts there). Each real loader
// imports its table AND that table's overlay index side by side and returns base → overlay 0001 →
// 0002 … (`overlayTable`, the same pure function the seed generator validates with), so the bundled
// source serves exactly what the DB holds after the overlay migrations. A table no overlay touches
// comes back as the same array. Fixture tables are not overlaid.
//
// PER TABLE (perf, 2026-10-06). The overlay index a loader imports is ./seed/overlays/by-table/<key>.ts
// — only the overlay rows of THAT table (a recipe's lines and diet tags travel with recipes) — not the
// full list: with overlay 0003 the single shared overlay chunk was 21.8 kB gzip and every page paid
// for all of it. The applier (overlays/apply.ts) is a small chunk the indexes share.

import {
  CONTENT_STATUSES,
  type ContentTable,
  type Intensity,
  type Level,
  type WorkoutType,
} from './enums.ts'
import { afterNextPaint } from '../lib/afterPaint.ts'
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
import type { overlayTable } from './seed/overlays/apply.ts'
import type { OverlaySlice, SeedBase } from './seed/overlays/types.ts'
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

/** Run `load` once the current frame has painted (see the header: AFTER THE PAINT). */
const afterPaint =
  <T>(load: () => Promise<T>) =>
  (): Promise<T> =>
    afterNextPaint().then(load)

/** A per-table overlay index (./seed/overlays/by-table/<key>.ts): that table's overlay slices + the applier. */
interface TableOverlays {
  OVERLAYS: readonly OverlaySlice[]
  overlayTable: typeof overlayTable
}

/**
 * Load one base seed table and its per-table overlay index in parallel, then apply the overlays to
 * the table. The index carries only this table's overlay rows (see the header: PER TABLE).
 */
function overlaid<K extends keyof SeedBase>(
  table: K,
  load: () => Promise<SeedBase[K]>,
  overlays: () => Promise<TableOverlays>,
): () => Promise<SeedBase[K]> {
  return () =>
    Promise.all([load(), overlays()]).then(([rows, o]) => o.overlayTable(table, rows, o.OVERLAYS))
}

/**
 * The real seed modules, each behind a dynamic import so Vite splits it into its own chunk. The
 * `.ts` paths are literal on purpose: the bundler needs a static string to know the chunk graph.
 */
export const BUNDLED_SEEDS: BundledSeeds = {
  ingredients: afterPaint(
    overlaid(
      'ingredients',
      () => import('./seed/ingredients.ts').then((m) => m.INGREDIENTS),
      () => import('./seed/overlays/by-table/ingredients.ts'),
    ),
  ),
  diets: afterPaint(
    overlaid(
      'diets',
      () => import('./seed/diets.ts').then((m) => m.DIETS),
      () => import('./seed/overlays/by-table/diets.ts'),
    ),
  ),
  recipes: afterPaint(
    overlaid(
      'recipes',
      () => import('./seed/recipes.ts').then((m) => m.RECIPES),
      () => import('./seed/overlays/by-table/recipes.ts'),
    ),
  ),
  exercises: afterPaint(
    overlaid(
      'exercises',
      () => import('./seed/exercises.ts').then((m) => m.EXERCISES),
      () => import('./seed/overlays/by-table/exercises.ts'),
    ),
  ),
  workoutTemplates: afterPaint(
    overlaid(
      'workout_templates',
      () => import('./seed/workouts.ts').then((m) => m.WORKOUT_TEMPLATES),
      () => import('./seed/overlays/by-table/workout_templates.ts'),
    ),
  ),
  tips: afterPaint(
    overlaid(
      'health_tips',
      () => import('./seed/tips.ts').then((m) => m.HEALTH_TIPS),
      () => import('./seed/overlays/by-table/health_tips.ts'),
    ),
  ),
  skincareProductTypes: afterPaint(
    overlaid(
      'skincare_product_types',
      () => import('./seed/skincare.ts').then((m) => m.SKINCARE_PRODUCT_TYPES),
      () => import('./seed/overlays/by-table/skincare_product_types.ts'),
    ),
  ),
  skincareRoutines: afterPaint(
    overlaid(
      'skincare_routines',
      () => import('./seed/skincare.ts').then((m) => m.SKINCARE_ROUTINES),
      () => import('./seed/overlays/by-table/skincare_routines.ts'),
    ),
  ),
  skincareTips: afterPaint(
    overlaid(
      'skincare_tips',
      () => import('./seed/skincare.ts').then((m) => m.SKINCARE_TIPS),
      () => import('./seed/overlays/by-table/skincare_tips.ts'),
    ),
  ),
}

/** Resolve a `SeedTable` to its rows (an array resolves at once; a loader is called). */
function rowsOf<T>(table: SeedTable<T>): Promise<readonly T[]> {
  return typeof table === 'function' ? table() : Promise.resolve(table)
}

/**
 * Compute once on first call and share the promise with every concurrent caller; the seed arrays
 * never change at runtime. A REJECTED promise is dropped, so the next call tries again (a chunk
 * that failed to download once may well download the second time).
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
