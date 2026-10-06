// SKINCARE SEED — the aggregate (P7.1, operator request 2026-10-06: "skin care for men / women …
// from EU, US, Korea etc" + "and nails"). Three tables drafted in ./skincare/: generic product
// TYPES (never brands), routines whose ordered jsonb steps reference those types by slug, and
// bilingual tips. This module is the single import every consumer uses — the seed generator
// (`kind: 'skincare'` → 20261006001200_hygieia_seed_skincare.sql), the bundled ContentSource (one
// lazy chunk for all three) and the tests.
//
// Plain data on purpose: scripts/gen-seed-sql.mjs imports it under node's type stripping.

export { SKINCARE_PRODUCT_TYPES } from './skincare/product-types.ts'
export { SKINCARE_ROUTINES } from './skincare/routines.ts'
export { SKINCARE_TIPS } from './skincare/tips.ts'
