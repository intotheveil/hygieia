// ORTHODOX FASTING RULE (overlay 0003, diet `fasting`) — test helper shared by the recipe seed
// test (every `fasting` tag must comply) and the overlay test (the tags on base recipes are
// exactly the recipes that comply). Not imported by application code; never reaches the bundle.
//
// The tag means an ordinary fasting day WITH oil and wine. No meat, poultry, dairy or eggs; from
// the sea only invertebrates and roe; and none of the products that hide an animal ingredient or
// may contain milk/egg. Strict on purpose: `pita` (shop pitas may contain milk) and
// `dark-chocolate` (may contain milk fat) are out.

import type { IngredientSeed } from '../content/types'

export const FASTING_FORBIDDEN_CATEGORIES = ['meat', 'poultry', 'dairy-eggs'] as const
export const FASTING_ALLOWED_SEAFOOD = [
  'octopus',
  'squid',
  'cuttlefish',
  'shrimp',
  'mussels',
  'tarama',
] as const
export const FASTING_FORBIDDEN_SLUGS = [
  'lard',
  'tallow',
  'gelatin',
  'mayonnaise',
  'stock-cube',
  'hilopites',
  'pesto',
  'dark-chocolate',
  'pita',
] as const

/** True when an ingredient breaks the fast. */
export const isFastingForbidden = (row: IngredientSeed): boolean =>
  (FASTING_FORBIDDEN_CATEGORIES as readonly string[]).includes(row.category) ||
  (row.category === 'fish-seafood' &&
    !(FASTING_ALLOWED_SEAFOOD as readonly string[]).includes(row.slug)) ||
  (FASTING_FORBIDDEN_SLUGS as readonly string[]).includes(row.slug)
