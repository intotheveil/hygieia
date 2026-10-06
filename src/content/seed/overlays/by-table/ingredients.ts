// PER-TABLE OVERLAY INDEX — ingredients (perf, 2026-10-06). The bundled `ingredients` loader
// (src/content/bundled.ts) imports THIS module, not ../index.ts, so it downloads only the overlay
// rows of `ingredients` — never another table's. Every overlay touching this table has its slice
// here, in NNNN order; by-table.test.ts proves the list equals `sliceOverlay(o, …)` of every
// overlay in ../index.ts, so forgetting to register an overlay here is a red test. An overlay whose
// rows span several loaders keeps each loader's rows in its own module ../NNNN-<name>/<key>.ts (key
// = a by-table file name) so this import pulls only them; only an overlay touching nothing but this
// loader's tables may be imported whole (../NNNN-<name>.ts). by-table.test.ts enforces the import
// rule. Erasable syntax only, explicit `.ts` imports.

import { INGREDIENTS as I0003 } from '../0003-greek-kitchen/ingredients.ts'
import { OVERLAY as O0004 } from '../0004-prices-nutrition.ts'
import { sliceOverlays } from '../apply.ts'
import { SEED_OVERLAY_TABLES, type OverlaySlice } from '../types.ts'

export { overlayTable } from '../apply.ts'

export const OVERLAYS: readonly OverlaySlice[] = [
  { id: '0003-greek-kitchen', additions: { ingredients: I0003 } },
  // 0004 touches ingredients only, so it is imported whole (by-table.test.ts checks that).
  ...sliceOverlays([O0004], SEED_OVERLAY_TABLES.ingredients),
]
