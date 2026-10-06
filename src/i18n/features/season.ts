// SEASON DICTIONARY (overlay 0003 follow-up, 2026-10-06: "make it Greek, not just in Greek") — the
// "What's in season" strip on /recipes and /fridge and the `?season=now` recipe filter. Month names
// are written out here (nominative, as a heading reads them) instead of asking `Intl`, whose Greek
// month forms differ between engines (genitive vs nominative).
//
// ROUTE FEATURE: read only by the lazily-loaded /recipes and /fridge routes, so it is NOT in the
// dictionary every page gets from `useLang()`; their components call `useLang(seasonCopy)` and the
// strings ship in their chunks (./routeFeatures.ts).

import type { Month } from '../../content/seasonal.ts'
import type { FeatureCopy } from '../app.ts'

export interface SeasonDictionary {
  /** Strip heading; `{month}` = a `seasonMonths` entry. */
  seasonTitle: string
  seasonMonths: Record<Month, string>
  /** Accessible name of the chip list. */
  seasonChipsLabel: string
  /** The chip that opens /recipes?season=now. */
  seasonRecipesLink: string
  /** Shown on /recipes while `?season=now` is on. */
  seasonFilterNote: string
}

export const seasonEn: SeasonDictionary = {
  seasonTitle: 'What’s in season — {month}',
  seasonMonths: {
    1: 'January',
    2: 'February',
    3: 'March',
    4: 'April',
    5: 'May',
    6: 'June',
    7: 'July',
    8: 'August',
    9: 'September',
    10: 'October',
    11: 'November',
    12: 'December',
  },
  seasonChipsLabel: 'Greek fruit and vegetables in season this month',
  seasonRecipesLink: 'Recipes with seasonal produce',
  seasonFilterNote:
    'Showing recipes with at least two ingredients in season this month, the most seasonal first.',
}

export const seasonEl: SeasonDictionary = {
  seasonTitle: 'Φρούτα και λαχανικά εποχής — {month}',
  seasonMonths: {
    1: 'Ιανουάριος',
    2: 'Φεβρουάριος',
    3: 'Μάρτιος',
    4: 'Απρίλιος',
    5: 'Μάιος',
    6: 'Ιούνιος',
    7: 'Ιούλιος',
    8: 'Αύγουστος',
    9: 'Σεπτέμβριος',
    10: 'Οκτώβριος',
    11: 'Νοέμβριος',
    12: 'Δεκέμβριος',
  },
  seasonChipsLabel: 'Ελληνικά φρούτα και λαχανικά της εποχής αυτόν τον μήνα',
  seasonRecipesLink: 'Συνταγές με προϊόντα εποχής',
  seasonFilterNote: 'Συνταγές με τουλάχιστον δύο υλικά της εποχής, πρώτα οι πιο εποχικές.',
}

/** Both literals, for `useLang(seasonCopy)` on /recipes and /fridge. */
export const seasonCopy: FeatureCopy<SeasonDictionary> = { el: seasonEl, en: seasonEn }
