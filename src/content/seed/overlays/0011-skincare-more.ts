// OVERLAY 0011 — more skincare & nails (operator request 2026-10-11: expand the skincare and
// cosmetics content, with a strong share for women while keeping men covered). Additions only, no
// patches, no schema change: every row stays inside the check constraints of
// supabase/migrations/20261006001100_hygieia_skincare.sql.
//
//   * 27 product types filling the gaps of the base 52: actives (tranexamic acid, bakuchiol,
//     retinal serum, alpha-arbutin / kojic acid within the EU 2024/996 caps, panthenol barrier
//     serum, mandelic acid, 5 % urea face cream, a rich lipid night cream for mature skin),
//     sunscreen formats (tinted iron-oxide mineral, reapplication spray, SPF powder, oil-control
//     fluid, primer with SPF), make-up removal (bi-phase eye remover) and budget (syndet bar,
//     salicylic wash), after-sun gel, thermal water mist, peptide eye cream, hydrogel eye patches,
//     lip repair ointment, men's shaving (clear gel, ingrown-hair lotion), and nails (hydrating
//     nail treatment, gel soak-off kit, hand cream with SPF, ridge-filling base coat).
//   * 20 routines: pregnancy AM/PM (NO retinoid, no bakuchiol), melasma AM/PM, rosacea-prone
//     AM/PM, adult acne AM/PM, perimenopause AM/PM, after-sun, Greek summer beach day, budget
//     AM/PM, men (gentle shave, ingrown hairs, retinol-free anti-ageing), nails (gel soak-off
//     removal, daily cuticle care, a week off gel).
//   * 46 tips, every one sourced (AAD, NHS, NIH/ODS, FDA, EU law on eur-lex, peer-reviewed reviews
//     on PubMed/PMC): adult acne, perimenopause, pregnancy, melasma and dark spots, tinted / powder
//     SPF, rosacea, contact dermatitis, sunburn and heat rash, EU limits on retinol and brightening
//     actives, azelaic acid, bakuchiol, benzoyl peroxide, men's shaving and sun, gel manicures,
//     brittle nails, biotin, nail changes that need a doctor.
//
// Bilingual on the same row; no brand names; nothing prescription-only is recommended without
// "see a dermatologist / doctor". The rows live in ./0011-skincare-more/<table>.ts, one module per
// bundled table loader (perf, 2026-10-06 — ./by-table/ re-exports each table's slice).

import type { Overlay } from './types.ts'
import { SKINCARE_PRODUCT_TYPES } from './0011-skincare-more/skincare_product_types.ts'
import { SKINCARE_ROUTINES } from './0011-skincare-more/skincare_routines.ts'
import { SKINCARE_TIPS } from './0011-skincare-more/skincare_tips.ts'

export const OVERLAY: Overlay = {
  id: '0011-skincare-more',
  summary:
    '27 skincare product types, 20 routines, 46 sourced tips (women-weighted, men and nails covered)',
  additions: {
    skincare_product_types: SKINCARE_PRODUCT_TYPES,
    skincare_routines: SKINCARE_ROUTINES,
    skincare_tips: SKINCARE_TIPS,
  },
}
