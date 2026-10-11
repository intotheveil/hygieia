// OVERLAY 0009 — crêpes (operator request 2026-10-11: "κρέπες" — the Greek street-food staple —
// stressing that they are SAVOURY as often as sweet).
//
//   * Twelve new recipes, six savoury and six sweet. Savoury: the Greek kreperie crêpe (ham, gouda,
//     tomato, lettuce), chicken-mushroom-kasseri, spinach-feta rolled like a spanakopita, smoked
//     salmon with cream cheese and dill, the Breton galette complète on 100 % buckwheat, and a vegan
//     (Orthodox-fasting) crêpe on soy milk with no egg. Sweet: lemon and sugar, banana with
//     hazelnut-cocoa spread (the kreperie classic), strawberries with Greek yoghurt and honey,
//     honey-walnut-cinnamon, caramelised apple, and a protein crêpe on oats, egg white and whey.
//     Slugs all start `crepe-`; no dish duplicates a served title or slug.
//   * Three new ingredients the dishes need: buckwheat flour, Emmental, hazelnut-cocoa spread.
//     Nutrition per 100 g from USDA FoodData Central reference values (branded-food entries for the
//     spread); prices are a curated Greek supermarket range, Oct 2026. Buckwheat flour is naturally
//     gluten-free, so the gluten-by-name rule in ../recipes.test.ts lists it as an exception the way
//     it lists `buckwheat`; the galette is tagged gluten-free on that basis (the line note asks for
//     100 % buckwheat, no wheat blend). The spread carries milk powder: it is fasting-forbidden
//     (src/test/fastingRule.ts) and never vegan.
//   * Diet tags follow the ONE overlay rule set (src/test/dietRules.ts, sound and complete; bound by
//     ./diet-rules-sweep.test.ts) and the generic seed rules (../recipes.test.ts). `flexitarian` and
//     `pescatarian` ride on every meat-free dish, as in the base seed; `fasting` is tagged on exactly
//     the dishes the fasting rule admits (the vegan crêpe).
//
// Conventions are the base seed's (recipes/group1.ts header): equal step counts in both languages,
// Greek in the plural imperative, every line in g/ml or the ingredient's own unit. No dish carries a
// photo here (`image_path` null); overlay 0010 adds them.
//
// The rows live in ./0009-crepes/<table>.ts, one module per bundled table loader (perf, 2026-10-06 —
// ./by-table/ re-exports each table's slice). This module assembles the overlay the generator, the
// gate and the tests read.

import type { Overlay } from './types.ts'
import { INGREDIENTS } from './0009-crepes/ingredients.ts'
import { RECIPES } from './0009-crepes/recipes.ts'

export const OVERLAY: Overlay = {
  id: '0009-crepes',
  summary: '12 crêpes (6 savoury, 6 sweet), 3 new ingredients',
  additions: {
    ingredients: INGREDIENTS,
    recipes: RECIPES,
  },
}
