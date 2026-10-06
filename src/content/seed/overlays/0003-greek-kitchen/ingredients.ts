// OVERLAY 0003 — the two new ingredients (see ../0003-greek-kitchen.ts for the overlay header).
// One module per table so each bundled table loader downloads only its own rows
// (../by-table/, perf 2026-10-06). Erasable syntax only, explicit `.ts` imports.

import type { IngredientSeed } from '../../../types.ts'

const SOURCE_NOTE = 'Typical values, USDA FoodData Central reference ranges'
const PRICE_AS_OF = '2026-10-06'
const PER_KG = 'Typical Greek supermarket range, Oct 2026, per kg'

export const INGREDIENTS: IngredientSeed[] = [
  {
    slug: 'tarama',
    name_el: 'Ταραμάς',
    name_en: 'Tarama (salted fish roe)',
    category: 'fish-seafood',
    unit: 'g',
    grams_per_unit: 1,
    kcal_100g: 143,
    protein_100g: 22.3,
    carbs_100g: 1.5,
    fat_100g: 6.4,
    source_note: SOURCE_NOTE,
    price_eur_min: 18,
    price_eur_max: 35,
    price_per: 'kg',
    price_as_of: PRICE_AS_OF,
    price_note: PER_KG,
    substitute_slugs: [],
    is_pantry_staple: false,
  },
  {
    slug: 'pearl-onions',
    name_el: 'Κρεμμυδάκια στιφάδου',
    name_en: 'Pearl onions',
    category: 'vegetables',
    unit: 'g',
    grams_per_unit: 1,
    kcal_100g: 40,
    protein_100g: 1.1,
    carbs_100g: 9.3,
    fat_100g: 0.1,
    source_note: SOURCE_NOTE,
    price_eur_min: 2.5,
    price_eur_max: 4.5,
    price_per: 'kg',
    price_as_of: PRICE_AS_OF,
    price_note: PER_KG,
    substitute_slugs: ['onion', 'red-onion'],
    is_pantry_staple: false,
  },
]
