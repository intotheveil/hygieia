// OVERLAY 0012 — three base-seed skincare tips cite aad.org pages that moved (2026-10-11). Each
// replacement was opened on 2026-10-11 (HTTP 200) and read against the tip it backs:
//   * face-all-patch-test-every-new-product
//       …/skin-care-basics/care/how-to-test-skin-care-products            404
//     → …/skin-care-secrets/prevent-skin-problems/test-skin-care-products  (AAD: quarter-sized spot,
//       underside of the arm or bend of the elbow, twice a day for 7–10 days, watch for redness,
//       itching or swelling)
//   * face-women-makeup-with-spf-is-not-enough
//       …/sun-protection/sunscreen-patients/sunscreen-faqs                 302 → /media/stats-sunscreen
//     → https://www.aad.org/media/stats-sunscreen  (the same AAD "Sunscreen FAQs" page at its new
//       address: cosmetics with SPF, most people apply 20–50 % of the needed amount, 1 tsp for the face)
//   * nails-gel-and-acrylic-take-breaks
//       …/nail-care-secrets/basics/artificial-nails                        404
//     → …/nail-care-secrets/basics/pedicures/reduce-artificial-nail-damage  (AAD: soak-off rather than
//       filed-off gels, filing thins the natural nail, time without artificial nails lets nails repair)
// Patches set ONLY `sources`; no wording changes. Only one table is touched, so the by-table index
// imports this module whole.

import type { Overlay, SlugPatch } from './types.ts'

const AAD = 'https://www.aad.org'

const SKINCARE_TIPS: readonly SlugPatch<'skincare_tips'>[] = [
  {
    slug: 'face-all-patch-test-every-new-product',
    set: {
      sources: [
        `${AAD}/public/everyday-care/skin-care-secrets/prevent-skin-problems/test-skin-care-products`,
      ],
    },
  },
  {
    slug: 'face-women-makeup-with-spf-is-not-enough',
    set: { sources: [`${AAD}/media/stats-sunscreen`] },
  },
  {
    slug: 'nails-gel-and-acrylic-take-breaks',
    set: {
      sources: [
        `${AAD}/public/everyday-care/nail-care-secrets/basics/pedicures/reduce-artificial-nail-damage`,
      ],
    },
  },
]

export const OVERLAY: Overlay = {
  id: '0012-fix-aad-links',
  summary:
    'three skincare tips cite aad.org pages that moved (two 404, one redirect); sources only, checked 2026-10-11',
  patches: { skincare_tips: SKINCARE_TIPS },
}
