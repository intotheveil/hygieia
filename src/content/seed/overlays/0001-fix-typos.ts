// OVERLAY 0001 — two small copy corrections found by reading the seed (2026-10-06). Proves the
// overlay path end to end: bundled source, generated migration, gate.
//   * health_tips/nutrition-fish-twice-a-week (EN): "Small fish are … Grilled or baked …, it is a
//     ten-minute meal" — the pronoun did not agree with its plural subject.
//   * skincare_tips/face-all-sunscreen-every-day-clouds-included (EL): «Κάνε το το τελευταίο βήμα»
//     — the doubled «το το» reads as a typo; rephrased as «Βάλ’ το ως τελευταίο βήμα».
//
// The patches live in ./0001-fix-typos/<table>.ts, one module per bundled table loader (perf,
// 2026-10-06 — ./by-table/ re-exports each table's slice); this module assembles the overlay.

import type { Overlay } from './types.ts'
import { HEALTH_TIPS } from './0001-fix-typos/health_tips.ts'
import { SKINCARE_TIPS } from './0001-fix-typos/skincare_tips.ts'

export const OVERLAY: Overlay = {
  id: '0001-fix-typos',
  summary:
    'two copy corrections: a pronoun (EN health tip) and a doubled «το το» (EL skincare tip)',
  patches: {
    health_tips: HEALTH_TIPS,
    skincare_tips: SKINCARE_TIPS,
  },
}
