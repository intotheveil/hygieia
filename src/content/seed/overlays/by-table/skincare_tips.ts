// PER-TABLE OVERLAY INDEX — skincare_tips (perf, 2026-10-06). The bundled `skincare_tips` loader
// (src/content/bundled.ts) imports THIS module, not ../index.ts, so it downloads only the overlay
// rows of `skincare_tips` — never another table's. Every overlay touching this table has its slice
// here, in NNNN order; by-table.test.ts proves the list equals `sliceOverlay(o, …)` of every
// overlay in ../index.ts, so forgetting to register an overlay here is a red test. An overlay whose
// rows span several loaders keeps each loader's rows in its own module ../NNNN-<name>/<key>.ts (key
// = a by-table file name) so this import pulls only them; only an overlay touching nothing but this
// loader's tables may be imported whole (../NNNN-<name>.ts). by-table.test.ts enforces the import
// rule. Erasable syntax only, explicit `.ts` imports.

import { SKINCARE_TIPS as P0001 } from '../0001-fix-typos/skincare_tips.ts'
import { SKINCARE_TIPS as P0002 } from '../0002-tip-sources/skincare_tips.ts'
import type { OverlaySlice } from '../types.ts'

export { overlayTable } from '../apply.ts'

export const OVERLAYS: readonly OverlaySlice[] = [
  { id: '0001-fix-typos', patches: { skincare_tips: P0001 } },
  { id: '0002-tip-sources', patches: { skincare_tips: P0002 } },
]
