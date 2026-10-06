// PER-TABLE OVERLAY INDEX — recipes (perf, 2026-10-06). The bundled `recipes` loader
// (src/content/bundled.ts) imports THIS module, not ../index.ts, so it downloads only the overlay
// rows of `recipes`, `recipe_ingredients`, `recipe_diets` — never another table's. Every overlay
// touching these tables has its slice here, in NNNN order; by-table.test.ts proves the list equals
// `sliceOverlay(o, …)` of every overlay in ../index.ts, so forgetting to register an overlay here
// is a red test. An overlay whose rows span several loaders keeps each loader's rows in its own
// module ../NNNN-<name>/<key>.ts (key = a by-table file name) so this import pulls only them; only
// an overlay touching nothing but this loader's tables may be imported whole (../NNNN-<name>.ts).
// by-table.test.ts enforces the import rule. Erasable syntax only, explicit `.ts` imports.

import { RECIPE_DIETS as RD0003, RECIPES as R0003 } from '../0003-greek-kitchen/recipes.ts'
import type { OverlaySlice } from '../types.ts'

export { overlayTable } from '../apply.ts'

export const OVERLAYS: readonly OverlaySlice[] = [
  { id: '0003-greek-kitchen', additions: { recipes: R0003, recipe_diets: RD0003 } },
]
