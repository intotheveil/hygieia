// OVERLAY 0001 — the skincare_tips patch (see ../0001-fix-typos.ts for the overlay header). One
// module per table so each bundled table loader downloads only its own rows (../by-table/, perf
// 2026-10-06). Erasable syntax only, explicit `.ts` imports.

import type { SlugPatch } from '../types.ts'

export const SKINCARE_TIPS: readonly SlugPatch<'skincare_tips'>[] = [
  {
    slug: 'face-all-sunscreen-every-day-clouds-included',
    set: {
      body_el:
        'Έως και το 80 % της υπεριώδους ακτινοβολίας περνά μέσα από τα σύννεφα, και η UVA, που γερνά το δέρμα, περνά και από τα τζάμια του αυτοκινήτου και του γραφείου. Το αντηλιακό είναι το μόνο «αντιγηραντικό» με αδιαμφισβήτητα στοιχεία. Βάλ’ το ως τελευταίο βήμα της πρωινής ρουτίνας, όπως το βούρτσισμα των δοντιών.',
    },
  },
]
