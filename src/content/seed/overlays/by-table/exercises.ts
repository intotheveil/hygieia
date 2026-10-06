// PER-TABLE OVERLAY INDEX — exercises (perf, 2026-10-06). The bundled `exercises` loader
// (src/content/bundled.ts) imports THIS module, not ../index.ts, so it downloads only the overlay
// rows of `exercises` — never another table's. Every overlay touching this table has its slice
// here, in NNNN order; by-table.test.ts proves the list equals `sliceOverlay(o, …)` of every
// overlay in ../index.ts, so forgetting to register an overlay here is a red test. An overlay whose
// rows span several loaders keeps each loader's rows in its own module ../NNNN-<name>/<key>.ts (key
// = a by-table file name) so this import pulls only them; only an overlay touching nothing but this
// loader's tables may be imported whole (../NNNN-<name>.ts). by-table.test.ts enforces the import
// rule. Erasable syntax only, explicit `.ts` imports.

import type { OverlaySlice } from '../types.ts'

export { overlayTable } from '../apply.ts'

/** No overlay touches this table yet. */
export const OVERLAYS: readonly OverlaySlice[] = []
