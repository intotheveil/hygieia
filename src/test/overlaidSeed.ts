// THE SEED AS SERVED — every base seed table with every content overlay applied (test helper).
//
// The base seed modules are frozen (their migrations are live); new dishes, diets and ingredients
// arrive as overlays (src/content/seed/overlays/). The seed QUALITY tests (ingredients, diets,
// recipes) read this object instead of the bare base arrays, so every rule they pin — bilingual
// completeness, nutrition sanity, units, diet compliance, coverage — binds overlay content too.
// Not imported by application code; never reaches the bundle.

import { DIETS } from '../content/seed/diets'
import { EXERCISES } from '../content/seed/exercises'
import { INGREDIENTS } from '../content/seed/ingredients'
import { applyOverlays } from '../content/seed/overlays/apply'
import { OVERLAYS } from '../content/seed/overlays/index'
import type { SeedBase } from '../content/seed/overlays/types'
import { RECIPES } from '../content/seed/recipes'
import { SKINCARE_PRODUCT_TYPES, SKINCARE_ROUTINES, SKINCARE_TIPS } from '../content/seed/skincare'
import { HEALTH_TIPS } from '../content/seed/tips'
import { WORKOUT_TEMPLATES } from '../content/seed/workouts'

/** Base seed → overlay 0001 → 0002 … — what the bundled source serves and the DB holds. */
export const OVERLAID_SEED: SeedBase = applyOverlays(
  {
    ingredients: INGREDIENTS,
    diets: DIETS,
    recipes: RECIPES,
    exercises: EXERCISES,
    workout_templates: WORKOUT_TEMPLATES,
    health_tips: HEALTH_TIPS,
    skincare_product_types: SKINCARE_PRODUCT_TYPES,
    skincare_routines: SKINCARE_ROUTINES,
    skincare_tips: SKINCARE_TIPS,
  },
  OVERLAYS,
)
