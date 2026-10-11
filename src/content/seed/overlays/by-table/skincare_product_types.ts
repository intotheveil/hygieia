// PER-TABLE OVERLAY INDEX — skincare_product_types (perf, 2026-10-06). The bundled
// `skincare_product_types` loader (src/content/bundled.ts) imports THIS module, not ../index.ts, so
// it downloads only the overlay rows of `skincare_product_types` — never another table's. Every
// overlay touching this table has its slice here, in NNNN order; by-table.test.ts proves the list
// equals `sliceOverlay(o, …)` of every overlay in ../index.ts, so forgetting to register an overlay
// here is a red test. An overlay whose rows span several loaders keeps each loader's rows in its
// own module ../NNNN-<name>/<key>.ts (key = a by-table file name) so this import pulls only them;
// only an overlay touching nothing but this loader's tables may be imported whole
// (../NNNN-<name>.ts). by-table.test.ts enforces the import rule. Erasable syntax only, explicit
// `.ts` imports.

import { SKINCARE_PRODUCT_TYPES as A0011 } from '../0011-skincare-more/skincare_product_types.ts'
import type { OverlaySlice } from '../types.ts'

export { overlayTable } from '../apply.ts'

export const OVERLAYS: readonly OverlaySlice[] = [
  { id: '0011-skincare-more', additions: { skincare_product_types: A0011 } },
]
