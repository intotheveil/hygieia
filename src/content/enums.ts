// CONTENT ENUMS — the single TypeScript source for every CHECK constraint in schema `hygieia`
// (PLAN.md §2). The migrations (P1.6) carry the same literals and a contract test asserts the DB
// and these arrays cannot drift; the seed generator and the PGlite gate (scripts/*.mjs) import this
// module directly under node's type stripping, so it must stay ERASABLE syntax only: `as const`
// arrays + derived unions, no `enum`, no `namespace`, no React, no `import.meta.env`.
//
// Order matters: the arrays are compared literally (length AND order) against PLAN.md §2.

/** Ingredient and recipe-line measurement units. */
export const UNITS = ['g', 'ml', 'piece', 'tbsp', 'tsp', 'slice', 'clove', 'bunch'] as const
export type Unit = (typeof UNITS)[number]

/** What an ingredient's EUR price range is quoted per. */
export const PRICE_PER = ['kg', 'l', 'piece'] as const
export type PricePer = (typeof PRICE_PER)[number]

/** The seven workout types from the intent (home / gym / calisthenics, plus endurance and mobility). */
export const WORKOUT_TYPES = [
  'home',
  'gym',
  'calisthenics',
  'running',
  'swimming',
  'cycling',
  'mobility',
] as const
export type WorkoutType = (typeof WORKOUT_TYPES)[number]

export const LEVELS = ['beginner', 'intermediate', 'advanced'] as const
export type Level = (typeof LEVELS)[number]

export const INTENSITIES = ['low', 'moderate', 'high'] as const
export type Intensity = (typeof INTENSITIES)[number]

/** The three blocks a workout template is laid out in, in session order. */
export const BLOCKS = ['warmup', 'main', 'cooldown'] as const
export type Block = (typeof BLOCKS)[number]

export const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'] as const
export type MealType = (typeof MEAL_TYPES)[number]

export const TIP_TOPICS = [
  'sleep',
  'hydration',
  'nutrition',
  'movement',
  'habits',
  'mental',
] as const
export type TipTopic = (typeof TIP_TOPICS)[number]

// --- skincare (P7, operator request 2026-10-06: skin care for men / women + nails) -----------------
// Product TYPES, never brands; `regions` are regulatory / routine STYLES, not shops (DECISIONS P7.1).

/** Who a product type, routine or tip is written for. */
export const AUDIENCES = ['men', 'women', 'all'] as const
export type Audience = (typeof AUDIENCES)[number]

export const SKIN_TYPES = ['normal', 'dry', 'oily', 'combination', 'sensitive', 'all'] as const
export type SkinType = (typeof SKIN_TYPES)[number]

export const SKIN_CONCERNS = [
  'acne',
  'aging',
  'hydration',
  'sun',
  'pigmentation',
  'redness',
  'shaving',
  'beard',
  'pores',
  'texture',
  'nails',
  'hands',
  'general',
] as const
export type SkinConcern = (typeof SKIN_CONCERNS)[number]

/** Regional STYLE / regulation: kr layering, eu minimal + EU filters, us OTC actives, jp lightweight. */
export const REGIONS = ['eu', 'us', 'kr', 'jp', 'global'] as const
export type Region = (typeof REGIONS)[number]

/** When a product type is used in a day (`skincare_product_types.time`). */
export const STEP_TIMES = ['am', 'pm', 'both'] as const
export type StepTime = (typeof STEP_TIMES)[number]

/** When a routine is done (`skincare_routines.time`); nail routines are weekly. */
export const ROUTINE_TIMES = ['am', 'pm', 'weekly'] as const
export type RoutineTime = (typeof ROUTINE_TIMES)[number]

/** Face / nails switch on the skincare page (`area` on routines and tips). */
export const CARE_AREAS = ['face', 'nails'] as const
export type CareArea = (typeof CARE_AREAS)[number]

export const SKINCARE_CATEGORIES = [
  'cleanser',
  'toner',
  'essence',
  'serum',
  'moisturizer',
  'sunscreen',
  'exfoliant',
  'mask',
  'eye',
  'treatment',
  'shaving',
  'beard',
  'lip',
  'cuticle_oil',
  'nail_treatment',
  'hand_cream',
  'base_coat',
  'nail_file',
  'nail_remover',
] as const
export type SkincareCategory = (typeof SKINCARE_CATEGORIES)[number]

/** Typical EUR price band of a product TYPE (informational, no brand, no shop). */
export const PRICE_BANDS = ['low', 'mid', 'high'] as const
export type PriceBand = (typeof PRICE_BANDS)[number]

/** Review state of every content row; seeds land `pending`, an admin flips them (PLAN.md §1.3). */
export const CONTENT_STATUSES = ['pending', 'approved', 'rejected'] as const
export type ContentStatus = (typeof CONTENT_STATUSES)[number]

/**
 * The shape of every content slug: lower-case ASCII letters and digits in hyphen-separated groups
 * (`greek-salad`, `feta`). No upper case, no underscore, no leading/trailing/double hyphen. The app
 * keys content by slug (PLAN.md §1.6), so the rule is enforced at seed-test time, not only in the DB.
 */
export const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/

/** Status-bearing content tables: each row has `status`, `reviewed_at`, `reviewed_by` and a slug. */
export const CONTENT_TABLES = [
  'ingredients',
  'diets',
  'recipes',
  'exercises',
  'workout_templates',
  'health_tips',
  'skincare_product_types',
  'skincare_routines',
  'skincare_tips',
] as const
export type ContentTable = (typeof CONTENT_TABLES)[number]

/** Child tables: no `status` of their own; visible iff the parent row is approved (PLAN.md §2). */
export const CHILD_TABLES = [
  'recipe_ingredients',
  'recipe_diets',
  'workout_template_exercises',
] as const
export type ChildTable = (typeof CHILD_TABLES)[number]

/** Per-user tables: RLS `user_id = auth.uid()` on every verb (PLAN.md §1.7; P8.1 profile tables). */
export const USER_TABLES = [
  'fridge_lists',
  'saved_plans',
  'favourites',
  'entries',
  'goals',
  'saved_items',
  'workout_plans',
  'workout_sessions',
] as const
export type UserTable = (typeof USER_TABLES)[number]
