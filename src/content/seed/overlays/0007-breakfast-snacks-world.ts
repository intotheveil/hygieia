// OVERLAY 0007 — "more to eat at breakfast and between meals, from further afield" (operator
// request 2026-10-11: "add many more recipes", 120 in total split across two lanes; this lane is
// the breakfast / snack / world-kitchen half, the other lane's overlay 0006 carries the
// carnivore / whole30 / low-FODMAP / IF / paleo lunch-and-dinner half and is registered BEFORE
// this one — the generator and the tests therefore see 0006 first).
//
//   * Sixty new recipes the catalogue did not have: 29 with a breakfast slot, 24 with a snack slot
//     (the plan generator had 48 of each), the rest lunch / dinner. All are international dishes
//     from cuisines that were thin: Japanese, Korean, Chinese, Thai, Vietnamese, Indian,
//     Levantine, Turkish, North African, Egyptian, Ethiopian, Mexican, Latin American, Peruvian,
//     Nordic and Eastern European. No dish duplicates a served title or slug.
//   * Twelve new ingredients the dishes need: miso, gochujang, fish sauce, rice vinegar, rice
//     paper, kimchi, lemongrass, paneer, teff, rye bread, plantain, corn tortilla. Nutrition per
//     100 g from USDA FoodData Central reference values (branded-food entries where the product has
//     no reference entry); prices are a curated Greek supermarket / Asian grocer range, Oct 2026.
//     Fish sauce is filed under `fish-seafood` on purpose: it is made of anchovies, so the
//     vegan / vegetarian / fasting rules the tests encode by category keep it out of those diets.
//   * Diet tags follow the seed's rules (recipes/group1-3 headers, recipes.test.ts): the
//     mechanical ones are proven by the test over the served seed, the rest were derived with the
//     same limits as the base seed (low-carb <= 30 g carbs per portion, keto / Atkins <= 15 g with
//     no grains / legumes / starchy veg / sugar, high-protein >= 30 g per portion, intermittent
//     fasting >= 400 kcal and >= 25 g protein in a meal slot, DASH without added salt / cured /
//     tinned fish / salty cheese / saturated-fat bases, Mediterranean only for Mediterranean-basin
//     cuisines cooked in olive oil). `fasting` is tagged on every dish the fasting rule admits.
//     Kimchi (fish sauce, shrimp paste) keeps its dishes out of vegetarian / vegan / fasting;
//     miso and gochujang (may contain barley or wheat) keep theirs out of gluten-free.
//
// Conventions are the base seed's (recipes/group1.ts header): equal step counts in both
// languages, Greek in the plural imperative, legumes / grains / pasta quantified DRY, every line in
// g/ml or the ingredient's own unit. No dish carries a photo yet (`image_path` null; the photo
// lane adds them in a later overlay).
//
// The rows live in ./0007-breakfast-snacks-world/<table>.ts, one module per bundled table loader
// (perf, 2026-10-06 — ./by-table/ re-exports each table's slice). This module assembles the overlay
// the generator, the gate and the tests read.

import type { Overlay } from './types.ts'
import { INGREDIENTS } from './0007-breakfast-snacks-world/ingredients.ts'
import { RECIPES } from './0007-breakfast-snacks-world/recipes.ts'

export const OVERLAY: Overlay = {
  id: '0007-breakfast-snacks-world',
  summary: '60 breakfast, snack and world-kitchen recipes, 12 new ingredients',
  additions: {
    ingredients: INGREDIENTS,
    recipes: RECIPES,
  },
}
