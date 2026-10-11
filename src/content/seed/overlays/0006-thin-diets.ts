// OVERLAY 0006 — "lift the thin diets" (operator request, 2026-10-11: "add many more recipes").
//
//   * Sixty recipes for the diets the catalogue under-served: carnivore (10 before), Whole30 (11),
//     intermittent fasting (16), low-FODMAP (19) and paleo (37), with 14 breakfasts and 10 snacks
//     so the planner and the snack filter have something to draw on. Cuisines and proteins vary:
//     beef, lamb, pork, poultry, duck, offal (kidney, heart, tongue, liver, marrow), fish and
//     seafood, eggs, and plant-based low-FODMAP dishes.
//   * Five new ingredients the dishes need: `lamb-mince`, `beef-tongue`, `pork-ribs`, `scallops`,
//     `bok-choy` (USDA FoodData Central reference values; a Greek supermarket price range).
//
// HOW THE TAGS WERE SET (every one is checked again by ./thin-diets.test.ts and, mechanically, by
// src/content/seed/recipes.test.ts):
//   - carnivore: animal products only — meat, poultry, fish, dairy, eggs, animal fats (lard, tallow,
//     butter, ghee), salt, pepper, water. Olive oil and every plant are out, stricter than the
//     seed test, which also lets plant oils and herbs through.
//   - whole30 / paleo: no grains, pasta/rice, legumes, sweeteners (paleo: honey and maple allowed in
//     principle, none used), dairy except eggs and ghee, cured/processed meat, soy, peanuts.
//   - low-fodmap: none of the seed test's high-FODMAP list plus Monash additions (sweet potato,
//     pumpkin, avocado, cashew, pistachio, coconut flour …); spring onion is the green part only;
//     portions of the borderline items (tomato, broccoli, green beans, spinach, feta, olives) stay
//     inside Monash serves; shop ham and turkey slices are left untagged (onion/garlic powder).
//   - keto: ≤ 12 g carbohydrate and ≥ 50 % of energy from fat per portion; atkins ≤ 20 g; low-carb
//     ≤ 30 g (carbohydrate as the seed counts it, fibre included).
//   - high-protein: ≥ 20 g protein and ≥ 25 % of energy from protein per portion.
//   - intermittent-fasting: the base seed's convention, "protein-rich, generous meals for a
//     two-meal window", made explicit: not a snack, ≥ 400 kcal and ≥ 25 g protein per portion.
//   - fasting (the Orthodox fast): whenever `src/test/fastingRule.ts` admits every ingredient.
//
// Conventions are the base seed's (recipes/group1.ts header): equal step counts in both languages,
// Greek in the plural imperative, every line in g/ml or the ingredient's own unit. `image_path` is
// null — photos come in a later stage.
//
// The rows live in ./0006-thin-diets/<table>.ts, one module per bundled table loader (perf,
// 2026-10-06 — ./by-table/ re-exports each table's slice). This module assembles the overlay the
// generator, the gate and the tests read.

import type { Overlay } from './types.ts'
import { INGREDIENTS } from './0006-thin-diets/ingredients.ts'
import { RECIPES } from './0006-thin-diets/recipes.ts'

export const OVERLAY: Overlay = {
  id: '0006-thin-diets',
  summary:
    '60 recipes for the thin diets (carnivore, Whole30, low-FODMAP, IF, paleo), 5 ingredients',
  additions: {
    ingredients: INGREDIENTS,
    recipes: RECIPES,
  },
}
