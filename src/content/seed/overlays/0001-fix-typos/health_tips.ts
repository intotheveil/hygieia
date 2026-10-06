// OVERLAY 0001 — the health_tips patch (see ../0001-fix-typos.ts for the overlay header). One module
// per table so each bundled table loader downloads only its own rows (../by-table/, perf
// 2026-10-06). Erasable syntax only, explicit `.ts` imports.

import type { SlugPatch } from '../types.ts'

export const HEALTH_TIPS: readonly SlugPatch<'health_tips'>[] = [
  {
    slug: 'nutrition-fish-twice-a-week',
    set: {
      body_en:
        'Two portions of fish a week, one of them oily — sardines, anchovies, mackerel, salmon — supply omega-3 fats and vitamin D. Small fish are cheap, local and lower in mercury than large ones. Grilled or baked with lemon and oregano, they make a ten-minute meal.',
    },
  },
]
