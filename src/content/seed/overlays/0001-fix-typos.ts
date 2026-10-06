// OVERLAY 0001 — two small copy corrections found by reading the seed (2026-10-06). Proves the
// overlay path end to end: bundled source, generated migration, gate.
//   * health_tips/nutrition-fish-twice-a-week (EN): "Small fish are … Grilled or baked …, it is a
//     ten-minute meal" — the pronoun did not agree with its plural subject.
//   * skincare_tips/face-all-sunscreen-every-day-clouds-included (EL): «Κάνε το το τελευταίο βήμα»
//     — the doubled «το το» reads as a typo; rephrased as «Βάλ’ το ως τελευταίο βήμα».

import type { Overlay } from './types.ts'

export const OVERLAY: Overlay = {
  id: '0001-fix-typos',
  summary:
    'two copy corrections: a pronoun (EN health tip) and a doubled «το το» (EL skincare tip)',
  patches: {
    health_tips: [
      {
        slug: 'nutrition-fish-twice-a-week',
        set: {
          body_en:
            'Two portions of fish a week, one of them oily — sardines, anchovies, mackerel, salmon — supply omega-3 fats and vitamin D. Small fish are cheap, local and lower in mercury than large ones. Grilled or baked with lemon and oregano, they make a ten-minute meal.',
        },
      },
    ],
    skincare_tips: [
      {
        slug: 'face-all-sunscreen-every-day-clouds-included',
        set: {
          body_el:
            'Έως και το 80 % της υπεριώδους ακτινοβολίας περνά μέσα από τα σύννεφα, και η UVA, που γερνά το δέρμα, περνά και από τα τζάμια του αυτοκινήτου και του γραφείου. Το αντηλιακό είναι το μόνο «αντιγηραντικό» με αδιαμφισβήτητα στοιχεία. Βάλ’ το ως τελευταίο βήμα της πρωινής ρουτίνας, όπως το βούρτσισμα των δοντιών.',
        },
      },
    ],
  },
}
