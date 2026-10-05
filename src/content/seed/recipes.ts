// RECIPES SEED — the aggregate (P1.11). The corpus is drafted in three group files so builders can
// work in parallel without colliding; this module is the single import every consumer uses
// (the seed generator, the bundled ContentSource, the tests). Order: group 1 (Greek and
// Mediterranean classics), group 2 (meat/poultry/egg-centric low-carb and keto), group 3 (special
// patterns: gluten-free, low-FODMAP, Whole30, intermittent fasting).
//
// Plain data on purpose: scripts/gen-seed-sql.mjs (P1.12) imports it under node's type stripping.

import type { RecipeSeed } from '../types.ts'
import { RECIPES_GROUP1 } from './recipes/group1.ts'
import { RECIPES_GROUP2 } from './recipes/group2.ts'
import { RECIPES_GROUP3 } from './recipes/group3.ts'

export const RECIPES: readonly RecipeSeed[] = [
  ...RECIPES_GROUP1,
  ...RECIPES_GROUP2,
  ...RECIPES_GROUP3,
]
