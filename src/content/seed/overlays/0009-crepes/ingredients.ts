// OVERLAY 0009 — the new ingredients (see ../0009-crepes.ts for the overlay header). One module per
// table so each bundled table loader downloads only its own rows (../by-table/, perf 2026-10-06).
// Erasable syntax only, explicit `.ts` imports.

import type { IngredientSeed } from '../../../types.ts'

export const INGREDIENTS: IngredientSeed[] = [
  {
    slug: 'buckwheat-flour',
    name_el: 'Αλεύρι φαγόπυρου',
    name_en: 'Buckwheat flour',
    category: 'grains-bread',
    unit: 'g',
    grams_per_unit: 1,
    kcal_100g: 335,
    protein_100g: 12.6,
    carbs_100g: 70.6,
    fat_100g: 3.1,
    source_note:
      'Typical values, USDA FoodData Central reference ranges (Buckwheat flour, whole-groat)',
    price_eur_min: 4.5,
    price_eur_max: 8,
    price_per: 'kg',
    price_as_of: '2026-10-11',
    price_note: 'Estimate, Greek supermarket / health-food shop range, Oct 2026, per kg',
    substitute_slugs: ['buckwheat', 'whole-wheat-flour'],
    is_pantry_staple: false,
  },
  {
    slug: 'emmental',
    name_el: 'Έμενταλ',
    name_en: 'Emmental cheese',
    category: 'dairy-eggs',
    unit: 'g',
    grams_per_unit: 1,
    kcal_100g: 393,
    protein_100g: 27,
    carbs_100g: 1.4,
    fat_100g: 31,
    source_note: 'Typical values, USDA FoodData Central reference ranges (Cheese, swiss)',
    price_eur_min: 12,
    price_eur_max: 19,
    price_per: 'kg',
    price_as_of: '2026-10-11',
    price_note: 'Estimate, Greek supermarket deli / pre-packed range, Oct 2026, per kg',
    substitute_slugs: ['gouda', 'graviera'],
    is_pantry_staple: false,
  },
  {
    // Commercial hazelnut-cocoa spreads carry skimmed-milk powder: never vegan, never fasting
    // (src/test/fastingRule.ts lists it).
    slug: 'hazelnut-cocoa-spread',
    name_el: 'Πραλίνα φουντουκιού',
    name_en: 'Hazelnut-cocoa spread',
    category: 'sweeteners',
    unit: 'g',
    grams_per_unit: 1,
    kcal_100g: 539,
    protein_100g: 6.3,
    carbs_100g: 57.5,
    fat_100g: 30.9,
    source_note:
      'USDA FoodData Central branded-food entries, typical values (chocolate hazelnut spread)',
    price_eur_min: 6,
    price_eur_max: 12,
    price_per: 'kg',
    price_as_of: '2026-10-11',
    price_note:
      'Estimate, Greek supermarket range (store brand to market leader), Oct 2026, per kg',
    substitute_slugs: ['dark-chocolate', 'almond-butter'],
    is_pantry_staple: false,
  },
]
