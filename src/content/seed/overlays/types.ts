// CONTENT OVERLAYS — the typed contract (2026-10-06). The base seed modules (../*.ts) were turned
// into migrations 20261006000500–001000 and 001200, which are APPLIED live and forward-only:
// `seed:check` pins them byte-for-byte, so the base modules can never change again. An overlay is
// how content changes after that: an ordered module `NNNN-<name>.ts` in this directory that
//   * PATCHES existing rows — addressed by slug (content tables) or by natural key (child tables),
//     setting only editable content columns (never id, slug, status or the review stamp), and
//   * ADDS new rows — the same shape as the base seed, ids by the same md5 rule.
// The bundled source applies base → overlay 0001 → 0002 … (./apply.ts); the generator turns each
// overlay into ONE forward-only migration `20261007<NNNN>00_hygieia_overlay_<name>.sql`
// (scripts/gen-seed-sql.mjs), and `db:gate` refuses an overlay migration that writes anything but
// an editable column (scripts/db-gate/overlay-scan.mjs).
//
// Erasable syntax only, explicit `.ts` imports: node's type stripping imports this directory from
// scripts/gen-seed-sql.mjs and scripts/db-gate/overlay-scan.mjs.

import type {
  DietSeed,
  ExerciseSeed,
  HealthTipSeed,
  IngredientSeed,
  RecipeLineSeed,
  RecipeSeed,
  SkincareProductTypeSeed,
  SkincareRoutineSeed,
  SkincareTipSeed,
  WorkoutBlockSeed,
  WorkoutTemplateSeed,
} from '../../types.ts'

/**
 * Every table an overlay may touch, in FOREIGN-KEY order: the order the applier and the generator
 * walk them (patches of every table first, then additions of every table), so a row added in one
 * overlay may reference a row added earlier in the SAME overlay.
 */
export const OVERLAY_TABLES = [
  'ingredients',
  'diets',
  'recipes',
  'recipe_ingredients',
  'recipe_diets',
  'exercises',
  'workout_templates',
  'workout_template_exercises',
  'health_tips',
  'skincare_product_types',
  'skincare_routines',
  'skincare_tips',
] as const
export type OverlayTable = (typeof OVERLAY_TABLES)[number]

/** The status-bearing (slug-keyed) tables; the other three are children keyed by their parent. */
export const OVERLAY_PARENT_TABLES = [
  'ingredients',
  'diets',
  'recipes',
  'exercises',
  'workout_templates',
  'health_tips',
  'skincare_product_types',
  'skincare_routines',
  'skincare_tips',
] as const satisfies readonly OverlayTable[]
export type OverlayParentTable = (typeof OVERLAY_PARENT_TABLES)[number]

/** A recipe ingredient line added to an EXISTING recipe; it is appended (position = line count). */
export type RecipeLineAddition = RecipeLineSeed & { recipe_slug: string }
/** A diet tag added to an existing recipe. */
export interface RecipeDietAddition {
  recipe_slug: string
  diet_slug: string
}
/** A slot appended to an EXISTING workout template (position = slot count). */
export type WorkoutSlotAddition = WorkoutBlockSeed & { template_slug: string }

/** The row shape an addition carries, per table — the base seed shape (children nested). */
export interface OverlayRows {
  ingredients: IngredientSeed
  diets: DietSeed
  recipes: RecipeSeed
  recipe_ingredients: RecipeLineAddition
  recipe_diets: RecipeDietAddition
  exercises: ExerciseSeed
  workout_templates: WorkoutTemplateSeed
  workout_template_exercises: WorkoutSlotAddition
  health_tips: HealthTipSeed
  skincare_product_types: SkincareProductTypeSeed
  skincare_routines: SkincareRoutineSeed
  skincare_tips: SkincareTipSeed
}

/**
 * The columns a patch may SET, per table. For the content tables this is exactly the admin's
 * `EDITABLE_COLUMNS` (src/admin/adminSource.ts), which itself equals the migrations' UPDATE grant
 * minus `status` — `overlays.test.ts` pins the equality. Never id, slug, status, created_at,
 * updated_at, reviewed_at, reviewed_by. Child tables: the content columns of the line/slot; the
 * referenced row is named by slug (`ingredient_slug` → `ingredient_id`, see PATCH_SLUG_COLUMNS).
 * `recipe_diets` has no content column, so it cannot be patched — only added to.
 */
export const PATCH_COLUMNS = {
  ingredients: [
    'name_el',
    'name_en',
    'category',
    'unit',
    'grams_per_unit',
    'kcal_100g',
    'protein_100g',
    'carbs_100g',
    'fat_100g',
    'source_note',
    'price_eur_min',
    'price_eur_max',
    'price_per',
    'price_as_of',
    'price_note',
    'substitute_slugs',
    'is_pantry_staple',
  ],
  diets: [
    'name_el',
    'name_en',
    'summary_el',
    'summary_en',
    'allowed_el',
    'allowed_en',
    'avoided_el',
    'avoided_en',
    'pros_el',
    'pros_en',
    'cons_el',
    'cons_en',
    'avoid_if_el',
    'avoid_if_en',
    'source_url',
  ],
  recipes: [
    'title_el',
    'title_en',
    'steps_el',
    'steps_en',
    'portions',
    'prep_min',
    'meal_types',
    'image_path',
  ],
  recipe_ingredients: ['ingredient_slug', 'quantity', 'unit', 'note_el', 'note_en'],
  recipe_diets: [],
  exercises: [
    'name_el',
    'name_en',
    'cue_el',
    'cue_en',
    'workout_type',
    'level',
    'muscle_groups',
    'equipment_el',
    'equipment_en',
  ],
  workout_templates: [
    'workout_type',
    'level',
    'intensity',
    'title_el',
    'title_en',
    'duration_min',
    'notes_el',
    'notes_en',
  ],
  workout_template_exercises: ['exercise_slug', 'block', 'sets', 'reps', 'seconds', 'rest_seconds'],
  health_tips: [
    'topic',
    'title_el',
    'title_en',
    'body_el',
    'body_en',
    'source_url',
    'needs_source',
  ],
  skincare_product_types: [
    'name_el',
    'name_en',
    'description_el',
    'description_en',
    'category',
    'key_ingredients',
    'avoid_with',
    'regions',
    'audiences',
    'skin_types',
    'concerns',
    'time',
    'price_band_eur',
    'notes_el',
    'notes_en',
  ],
  skincare_routines: [
    'area',
    'name_el',
    'name_en',
    'audience',
    'skin_type',
    'region',
    'time',
    'intro_el',
    'intro_en',
    'steps',
    'duration_min',
  ],
  skincare_tips: [
    'area',
    'title_el',
    'title_en',
    'body_el',
    'body_en',
    'audiences',
    'skin_types',
    'concerns',
    'regions',
    'sources',
    'needs_source',
  ],
} as const satisfies { readonly [T in OverlayTable]: readonly (keyof OverlayRows[T] & string)[] }

/** A child patch key that names a referenced row by slug, and the DB column it becomes. */
export const PATCH_SLUG_COLUMNS: {
  readonly [T in OverlayTable]?: Readonly<Record<string, string>>
} = {
  recipe_ingredients: { ingredient_slug: 'ingredient_id' },
  workout_template_exercises: { exercise_slug: 'exercise_id' },
}

export type PatchColumn<T extends OverlayTable> = (typeof PATCH_COLUMNS)[T][number]

/** What a patch may set on a table: any non-empty subset of its editable columns. */
export type PatchSet<T extends OverlayTable> = {
  [K in PatchColumn<T> & keyof OverlayRows[T]]?: OverlayRows[T][K]
}

/** A patch of a slug-keyed content row. */
export interface SlugPatch<T extends OverlayParentTable> {
  slug: string
  set: PatchSet<T>
}
/** A patch of one recipe line, keyed by (recipe slug, 0-based position). */
export interface RecipeLinePatch {
  recipe_slug: string
  position: number
  set: PatchSet<'recipe_ingredients'>
}
/** A patch of one template slot, keyed by (template slug, 0-based position). */
export interface WorkoutSlotPatch {
  template_slug: string
  position: number
  set: PatchSet<'workout_template_exercises'>
}

export type OverlayPatches = {
  [T in OverlayParentTable]?: readonly SlugPatch<T>[]
} & {
  recipe_ingredients?: readonly RecipeLinePatch[]
  workout_template_exercises?: readonly WorkoutSlotPatch[]
}

export type OverlayAdditions = { [T in OverlayTable]?: readonly OverlayRows[T][] }

/**
 * One overlay module's default-free export. `id` is `NNNN-<name>` and equals the file name minus
 * `.ts`; NNNN orders overlays and names the migration `20261007<NNNN>00_hygieia_overlay_<name>.sql`.
 */
export interface Overlay {
  id: string
  /** One line for the migration header: why this overlay exists. */
  summary: string
  patches?: OverlayPatches
  additions?: OverlayAdditions
}

/** The overlay id rule: four digits, a hyphen, a slug. */
export const OVERLAY_ID_RE = /^(\d{4})-([a-z0-9]+(?:-[a-z0-9]+)*)$/

/** Every base seed table an overlay applies to, keyed by its DB table name. */
export interface SeedBase {
  ingredients: readonly IngredientSeed[]
  diets: readonly DietSeed[]
  recipes: readonly RecipeSeed[]
  exercises: readonly ExerciseSeed[]
  workout_templates: readonly WorkoutTemplateSeed[]
  health_tips: readonly HealthTipSeed[]
  skincare_product_types: readonly SkincareProductTypeSeed[]
  skincare_routines: readonly SkincareRoutineSeed[]
  skincare_tips: readonly SkincareTipSeed[]
}
