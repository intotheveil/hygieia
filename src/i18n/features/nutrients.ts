// NUTRIENTS DICTIONARY (women's nutrition layer, 2026-10-11) — the `?nutrient=` chips on /recipes
// and the "Source of iron · High in calcium" badge row on /recipes/:slug (nutrition/nutrients.ts).
// Nutrient names follow the EU labelling terms in each language (Reg. 1169/2011 Annex XIII):
// Σίδηρος, Ασβέστιο, Βιταμίνη D, Φυλλικό οξύ.
//
// ROUTE FEATURE: read only by the lazily-loaded /recipes and /recipes/:slug routes, so it is NOT in
// the dictionary every page gets from `useLang()`; their components call `useLang(nutrientsCopy)`
// and the strings ship in their chunks (./routeFeatures.ts).

import type { Nutrient } from '../../nutrition/nutrients.ts'
import type { FeatureCopy } from '../app.ts'

export interface NutrientsDictionary {
  /** Legend of the chip group on /recipes. */
  filterByNutrient: string
  /** Chip label per nutrient. */
  nutrientNames: Record<Nutrient, string>
  /** Shown on /recipes while a `?nutrient=` filter is on. */
  nutrientFilterNote: string
  /** Heading of the badge row on a recipe. */
  nutrientsTitle: string
  /** Badge text when one portion gives ≥ 15 % of the NRV. */
  nutrientSourceOf: Record<Nutrient, string>
  /** Badge text when one portion gives ≥ 30 % of the NRV. */
  nutrientHighIn: Record<Nutrient, string>
  /** Unit after the amount, per nutrient. */
  nutrientUnits: Record<Nutrient, string>
  /** After the amount: `{pct}` = whole percent of the NRV. */
  nutrientShareOfNrv: string
  /** The one-line honesty note under the badges. */
  nutrientsNote: string
}

export const nutrientsEn: NutrientsDictionary = {
  filterByNutrient: 'Good source of',
  nutrientNames: {
    iron: 'Iron',
    calcium: 'Calcium',
    'vitamin-d': 'Vitamin D',
    folate: 'Folate',
  },
  nutrientFilterNote:
    'Showing recipes where one portion gives at least 15% of the EU reference intake of the chosen nutrient.',
  nutrientsTitle: 'Vitamins and minerals per portion',
  nutrientSourceOf: {
    iron: 'Source of iron',
    calcium: 'Source of calcium',
    'vitamin-d': 'Source of vitamin D',
    folate: 'Source of folate',
  },
  nutrientHighIn: {
    iron: 'High in iron',
    calcium: 'High in calcium',
    'vitamin-d': 'High in vitamin D',
    folate: 'High in folate',
  },
  nutrientUnits: { iron: 'mg', calcium: 'mg', 'vitamin-d': 'µg', folate: 'µg' },
  nutrientShareOfNrv: '{pct}% of the EU reference intake',
  nutrientsNote:
    'Estimates from food-composition tables (USDA FoodData Central), not medical advice.',
}

export const nutrientsEl: NutrientsDictionary = {
  filterByNutrient: 'Καλή πηγή',
  nutrientNames: {
    iron: 'Σίδηρος',
    calcium: 'Ασβέστιο',
    'vitamin-d': 'Βιταμίνη D',
    folate: 'Φυλλικό οξύ',
  },
  nutrientFilterNote:
    'Συνταγές όπου μία μερίδα δίνει τουλάχιστον το 15% της τιμής αναφοράς της ΕΕ για το θρεπτικό συστατικό που επιλέξατε.',
  nutrientsTitle: 'Βιταμίνες και μέταλλα ανά μερίδα',
  nutrientSourceOf: {
    iron: 'Πηγή σιδήρου',
    calcium: 'Πηγή ασβεστίου',
    'vitamin-d': 'Πηγή βιταμίνης D',
    folate: 'Πηγή φυλλικού οξέος',
  },
  nutrientHighIn: {
    iron: 'Υψηλή περιεκτικότητα σε σίδηρο',
    calcium: 'Υψηλή περιεκτικότητα σε ασβέστιο',
    'vitamin-d': 'Υψηλή περιεκτικότητα σε βιταμίνη D',
    folate: 'Υψηλή περιεκτικότητα σε φυλλικό οξύ',
  },
  nutrientUnits: { iron: 'mg', calcium: 'mg', 'vitamin-d': 'μg', folate: 'μg' },
  nutrientShareOfNrv: '{pct}% της τιμής αναφοράς της ΕΕ',
  nutrientsNote:
    'Εκτιμήσεις από πίνακες σύστασης τροφίμων (USDA FoodData Central), όχι ιατρική συμβουλή.',
}

/** Both literals, for `useLang(nutrientsCopy)` on /recipes and /recipes/:slug. */
export const nutrientsCopy: FeatureCopy<NutrientsDictionary> = { el: nutrientsEl, en: nutrientsEn }
