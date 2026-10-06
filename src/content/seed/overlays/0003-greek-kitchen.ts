// OVERLAY 0003 — "make it Greek, not just in Greek" (operator request, 2026-10-06).
//
//   * A new diet, `fasting` — the Orthodox fast as Greeks keep it: no meat, poultry, dairy or eggs;
//     fish with a backbone only on named feast days; invertebrate seafood (octopus, squid,
//     cuttlefish, shrimp, mussels) and fish roe (taramas) allowed; no oil or wine on strict days.
//     THE TAG on a recipe means "fits an ordinary fasting day WITH oil and wine" (the way most
//     households keep it); the diet text says strict days (xerofagia) drop both. Source: the
//     Greek Orthodox Archdiocese of America's page on the fasting rule.
//   * Thirty classic Greek dishes the base seed did not have. The base already carries
//     fasolada, fakes, revithada, gigantes, fava, gemista (vegan), briam, spanakorizo, lahanorizo,
//     imam, arakas, fasolakia, bamies, horiatiki, dakos, tzatziki, kolokithokeftedes, spanakopita,
//     octopus xydato and mydopilafo — those are NOT duplicated. Twenty-one new dishes are fasting.
//   * Two new ingredients the dishes need: `tarama` (salted fish roe) and `pearl-onions`.
//     Nutrition per 100 g from USDA FoodData Central reference values (tarama = "Fish, roe, mixed
//     species, raw"; pearl onions = "Onions, raw"); prices are a Greek supermarket range.
//   * `fasting` added to every EXISTING recipe that is mechanically fasting-compatible (no meat,
//     poultry, dairy, eggs, vertebrate fish, animal fats, gelatin, mayonnaise, stock cubes, egg
//     noodles, pesto, chocolate) — strict: the one dish on a shop pita (which may contain milk) is
//     left out. `src/content/seed/recipes.test.ts` enforces the same rule on every fasting tag, and
//     `./greek-kitchen.test.ts` proves FASTING_EXISTING_SLUGS is exactly the set the rule admits.
//
// Conventions are the base seed's (recipes/group1.ts header): equal step counts in both
// languages, Greek in the plural imperative, legumes/grains/pasta quantified DRY, every line in
// g/ml or the ingredient's own unit, diet tags only where the dish complies.
//
// The rows live in ./0003-greek-kitchen/<table>.ts, one module per bundled table loader, so the
// recipes page does not download the diet text with every other route and vice versa (perf,
// 2026-10-06 — ./by-table/ re-exports each table's slice). This module assembles the overlay the
// generator, the gate and the tests read.

import type { Overlay } from './types.ts'
import { DIETS } from './0003-greek-kitchen/diets.ts'
import { INGREDIENTS } from './0003-greek-kitchen/ingredients.ts'
import { RECIPE_DIETS, RECIPES } from './0003-greek-kitchen/recipes.ts'

export { FASTING_EXISTING_SLUGS } from './0003-greek-kitchen/recipes.ts'

export const OVERLAY: Overlay = {
  id: '0003-greek-kitchen',
  summary:
    'Orthodox fasting diet, 30 classic Greek recipes, 2 ingredients, fasting tag on 48 existing recipes',
  additions: {
    ingredients: INGREDIENTS,
    diets: DIETS,
    recipes: RECIPES,
    recipe_diets: RECIPE_DIETS,
  },
}
