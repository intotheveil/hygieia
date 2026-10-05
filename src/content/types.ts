// CONTENT DOMAIN TYPES — the TypeScript contract every seed module, migration and UI depends on
// (PLAN.md §2). Column names are the DB column names verbatim (snake_case, `*_el` / `*_en` pairs on
// the same row — PLAN.md §1.2), so a seed object IS a row minus the server-owned columns.
//
// Two layers:
//   - `*Seed`  — what a seed module declares: content only, no `id`, no `status`, no review stamp,
//                no timestamps. Children refer to their parents by SLUG (`ingredient_slug`,
//                `diet_slugs`, `exercise_slug`); the generator resolves slugs to ids.
//   - `*Row`   — what the DB returns: the seed plus `ReviewColumns`.
//
// This module is type-only and stays ERASABLE syntax (no `enum`, no parameter properties, no
// `namespace`): node's type stripping imports `src/content/**` from `scripts/*.mjs`.

import type {
  Block,
  ContentStatus,
  Intensity,
  Level,
  MealType,
  PricePer,
  TipTopic,
  Unit,
  WorkoutType,
} from './enums.ts'

/**
 * A bilingual column pair: `Localized<'name', string>` is `{ name_el: string; name_en: string }`.
 * Both are always present — a missing translation is a type error here and a `not null` violation
 * in the DB (PLAN.md §1.2).
 */
export type Localized<K extends string, T = string> = {
  [P in `${K}_el` | `${K}_en`]: T
}

/** A calendar date as an ISO `YYYY-MM-DD` string (Postgres `date`). */
export type IsoDate = string

/** A point in time as an ISO 8601 string (Postgres `timestamptz`). */
export type IsoTimestamp = string

/** The server-owned columns every content row carries on top of its seed (PLAN.md §1.3, §1.6). */
export interface ReviewColumns {
  /** `md5('hygieia:<table>:<slug>')::uuid` for seeded rows (PLAN.md §1.6). */
  id: string
  status: ContentStatus
  reviewed_at: IsoTimestamp | null
  /** `auth.users.id` of the reviewing admin; null until first reviewed. */
  reviewed_by: string | null
  created_at: IsoTimestamp
  updated_at: IsoTimestamp
}

// --- ingredients ---------------------------------------------------------------------------------

export interface IngredientSeed extends Localized<'name'> {
  slug: string
  category: string
  unit: Unit
  /** Grams in one `unit` of this ingredient; 1 when `unit` is already `g`/`ml`. Must be > 0. */
  grams_per_unit: number
  kcal_100g: number
  protein_100g: number
  carbs_100g: number
  fat_100g: number
  /** Where the nutrition figures come from, e.g. "Typical values, USDA FoodData Central …". */
  source_note: string
  price_eur_min: number
  /** Must be ≥ `price_eur_min`. */
  price_eur_max: number
  price_per: PricePer
  price_as_of: IsoDate
  price_note: string
  /** Slugs of other ingredients that can stand in for this one; each must resolve. */
  substitute_slugs: string[]
  is_pantry_staple: boolean
}

export interface IngredientRow extends IngredientSeed, ReviewColumns {}

// --- diets ---------------------------------------------------------------------------------------

export interface DietSeed
  extends
    Localized<'name'>,
    Localized<'summary'>,
    Localized<'allowed', string[]>,
    Localized<'avoided', string[]>,
    Localized<'pros', string[]>,
    Localized<'cons', string[]>,
    Localized<'avoid_if', string[]> {
  slug: string
  /** A real, stable `http(s)://` reference, or null — never invented (PLAN.md §0). */
  source_url: string | null
}

export interface DietRow extends DietSeed, ReviewColumns {}

// --- recipes -------------------------------------------------------------------------------------

/** One ingredient line of a recipe; `note_el`/`note_en` come as a pair or not at all. */
export interface RecipeLineSeed {
  ingredient_slug: string
  quantity: number
  unit: Unit
  note_el?: string
  note_en?: string
}

export interface RecipeSeed extends Localized<'title'>, Localized<'steps', string[]> {
  slug: string
  portions: number
  prep_min: number
  /** Non-empty. */
  meal_types: MealType[]
  image_path: string | null
  ingredients: RecipeLineSeed[]
  /** Slugs of the diets this recipe is tagged with; each must resolve. */
  diet_slugs: string[]
}

export interface RecipeRow extends RecipeSeed, ReviewColumns {}

// --- exercises -----------------------------------------------------------------------------------

export interface ExerciseSeed
  extends Localized<'name'>, Localized<'cue'>, Localized<'equipment', string | null> {
  slug: string
  workout_type: WorkoutType
  level: Level
  muscle_groups: string[]
}

export interface ExerciseRow extends ExerciseSeed, ReviewColumns {}

// --- workout templates ---------------------------------------------------------------------------

/** One exercise slot in a template; at least one of `reps` / `seconds` is set. */
export interface WorkoutBlockSeed {
  block: Block
  exercise_slug: string
  sets: number
  reps: number | null
  seconds: number | null
  rest_seconds: number
}

export interface WorkoutTemplateSeed extends Localized<'title'>, Localized<'notes'> {
  slug: string
  workout_type: WorkoutType
  level: Level
  intensity: Intensity
  duration_min: number
  /** In session order; the generator assigns `position` from the index. */
  blocks: WorkoutBlockSeed[]
}

export interface WorkoutTemplateRow extends WorkoutTemplateSeed, ReviewColumns {}

// --- health tips ---------------------------------------------------------------------------------

export interface HealthTipSeed extends Localized<'title'>, Localized<'body'> {
  slug: string
  topic: TipTopic
  source_url: string | null
  /** True when no real source exists yet; `source_url` null implies this (PLAN.md §0). */
  needs_source: boolean
}

export interface HealthTipRow extends HealthTipSeed, ReviewColumns {}
