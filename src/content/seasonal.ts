// SEASONAL PRODUCE — what is in season in Greece, month by month (operator request, 2026-10-06:
// "make it Greek, not just in Greek"). A small BUNDLED module, not a DB table: it is reference
// data, the same for every user, and it changes with the climate, not with review.
//
// SOURCE. The month windows are the open-field harvest seasons of Greek produce as listed in the
// seasonal fruit-and-vegetable guidance of the Greek national dietary guidelines for adults
// (Υπουργείο Υγείας / Ινστιτούτο Προληπτικής, Περιβαλλοντικής και Εργασιακής Ιατρικής «Πρόληψις»,
// «Εθνικοί Διατροφικοί Οδηγοί για Ενήλικες», 2014 — http://www.diatrofikoi-odigoi.gr/), read
// against the market calendar of Greek laiki (street markets). Greenhouse and imported produce is
// on sale all year; a window here is when the Greek field crop is at the market.
//
// DELIBERATELY LEFT OUT: year-round staples (onion, garlic, potato, carrot, lemon, herbs). They are
// in almost every recipe, so counting them would make the `?season=now` boost (≥ 2 in-season
// ingredients, recipes/filter.ts) match nearly everything and mean nothing.
//
// `slug` is the ingredient slug when the catalogue has the item (chips link to recipes that use
// it); `null` for produce the catalogue does not carry (loquats, persimmons, purslane), shown as a
// plain chip. Pure data + pure helpers, erasable syntax; loaded lazily after the first paint
// (content/seasonalLoader.ts), never from the entry chunk.

/** A calendar month, 1 = January … 12 = December. */
export type Month = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12

export const MONTHS: readonly Month[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]

export type ProduceKind = 'vegetable' | 'fruit'

export interface SeasonalProduce {
  /** Stable key, unique: the ingredient slug when there is one. */
  key: string
  /** The ingredient slug, or null when the catalogue has no such ingredient. */
  slug: string | null
  name_el: string
  name_en: string
  kind: ProduceKind
  /** The months it is in season, ascending. */
  months: readonly Month[]
}

/** Months `from`…`to` inclusive, wrapping over the new year (`span(11, 2)` = Nov, Dec, Jan, Feb). */
export function span(from: Month, to: Month): Month[] {
  const out: Month[] = []
  let m = from
  for (;;) {
    out.push(m)
    if (m === to) break
    m = ((m % 12) + 1) as Month
  }
  return out.sort((a, b) => a - b)
}

const item = (
  slug: string | null,
  key: string,
  name_el: string,
  name_en: string,
  kind: ProduceKind,
  months: Month[],
): SeasonalProduce => ({ key, slug, name_el, name_en, kind, months })
const veg = (slug: string, el: string, en: string, from: Month, to: Month) =>
  item(slug, slug, el, en, 'vegetable', span(from, to))
const fruit = (slug: string, el: string, en: string, from: Month, to: Month) =>
  item(slug, slug, el, en, 'fruit', span(from, to))

export const SEASONAL_PRODUCE: readonly SeasonalProduce[] = [
  // --- vegetables: summer ---
  veg('tomato', 'Ντομάτες', 'Tomatoes', 6, 10),
  veg('cucumber', 'Αγγούρια', 'Cucumbers', 5, 9),
  veg('zucchini', 'Κολοκυθάκια', 'Courgettes', 5, 9),
  veg('eggplant', 'Μελιτζάνες', 'Aubergines', 6, 10),
  veg('bell-pepper', 'Πιπεριές', 'Peppers', 6, 10),
  veg('horn-pepper', 'Πιπεριές κέρατο', 'Horn peppers', 6, 10),
  veg('okra', 'Μπάμιες', 'Okra', 6, 9),
  veg('green-beans', 'Φασολάκια', 'Green beans', 5, 10),
  veg('corn', 'Καλαμπόκι', 'Sweet corn', 7, 9),
  veg('vlita', 'Βλίτα', 'Amaranth greens', 6, 9),
  item(null, 'purslane', 'Γλιστρίδα', 'Purslane', 'vegetable', span(6, 9)),
  // --- vegetables: spring ---
  veg('peas', 'Αρακάς', 'Peas', 3, 5),
  veg('broad-beans', 'Κουκιά', 'Broad beans', 3, 5),
  veg('artichoke', 'Αγκινάρες', 'Artichokes', 2, 5),
  veg('asparagus', 'Σπαράγγια', 'Asparagus', 3, 5),
  // --- vegetables: autumn and winter ---
  veg('pumpkin', 'Κολοκύθα', 'Pumpkin', 9, 12),
  veg('sweet-potato', 'Γλυκοπατάτες', 'Sweet potatoes', 10, 12),
  veg('mushrooms', 'Μανιτάρια', 'Mushrooms', 10, 11),
  veg('cabbage', 'Λάχανο', 'Cabbage', 10, 3),
  veg('red-cabbage', 'Κόκκινο λάχανο', 'Red cabbage', 10, 3),
  veg('cauliflower', 'Κουνουπίδι', 'Cauliflower', 10, 3),
  veg('broccoli', 'Μπρόκολο', 'Broccoli', 10, 3),
  veg('brussels-sprouts', 'Λαχανάκια Βρυξελλών', 'Brussels sprouts', 11, 2),
  veg('leek', 'Πράσα', 'Leeks', 10, 3),
  veg('celery', 'Σέλινο', 'Celery', 10, 4),
  veg('celeriac', 'Σελινόριζα', 'Celeriac', 11, 3),
  veg('turnip', 'Γογγύλια', 'Turnips', 11, 2),
  veg('spinach', 'Σπανάκι', 'Spinach', 10, 4),
  veg('chard', 'Σέσκουλα', 'Swiss chard', 10, 5),
  veg('horta', 'Άγρια χόρτα', 'Wild greens', 11, 4),
  veg('endive', 'Αντίδια', 'Endive', 11, 3),
  veg('lettuce', 'Μαρούλι', 'Lettuce', 11, 4),
  veg('rocket', 'Ρόκα', 'Rocket', 10, 5),
  veg('fennel', 'Μάραθος', 'Fennel', 11, 4),
  veg('radish', 'Ραπανάκια', 'Radishes', 11, 4),
  veg('beetroot', 'Παντζάρια', 'Beetroot', 11, 5),
  // --- fruit ---
  fruit('strawberry', 'Φράουλες', 'Strawberries', 2, 5),
  item(null, 'loquat', 'Μούσμουλα', 'Loquats', 'fruit', span(4, 5)),
  fruit('cherry', 'Κεράσια', 'Cherries', 5, 7),
  fruit('apricot', 'Βερίκοκα', 'Apricots', 5, 7),
  fruit('peach', 'Ροδάκινα', 'Peaches', 6, 9),
  fruit('plum', 'Δαμάσκηνα', 'Plums', 6, 9),
  fruit('watermelon', 'Καρπούζι', 'Watermelon', 6, 9),
  fruit('melon', 'Πεπόνι', 'Melon', 6, 9),
  fruit('fig', 'Σύκα', 'Figs', 7, 9),
  fruit('grapes', 'Σταφύλια', 'Grapes', 7, 10),
  fruit('pear', 'Αχλάδια', 'Pears', 8, 11),
  fruit('apple', 'Μήλα', 'Apples', 9, 3),
  fruit('pomegranate', 'Ρόδια', 'Pomegranates', 9, 12),
  fruit('quince', 'Κυδώνια', 'Quinces', 9, 12),
  item(null, 'persimmon', 'Λωτοί', 'Persimmons', 'fruit', span(10, 12)),
  fruit('chestnuts', 'Κάστανα', 'Chestnuts', 10, 12),
  fruit('kiwi', 'Ακτινίδια', 'Kiwis', 11, 3),
  fruit('orange', 'Πορτοκάλια', 'Oranges', 11, 4),
  fruit('mandarin', 'Μανταρίνια', 'Mandarins', 11, 2),
  fruit('grapefruit', 'Γκρέιπφρουτ', 'Grapefruit', 12, 3),
]

/** The calendar month of a date in local time (the user's month, not UTC's). */
export function monthOf(date: Date): Month {
  return (date.getMonth() + 1) as Month
}

/** Produce in season in `month`: vegetables first, then fruit, each in catalogue order. */
export function inSeason(month: Month): SeasonalProduce[] {
  const now = SEASONAL_PRODUCE.filter((p) => p.months.includes(month))
  return [...now.filter((p) => p.kind === 'vegetable'), ...now.filter((p) => p.kind === 'fruit')]
}

/** The ingredient slugs in season in `month` (items without a slug are not ingredients). */
export function inSeasonSlugs(month: Month): ReadonlySet<string> {
  const out = new Set<string>()
  for (const p of inSeason(month)) if (p.slug !== null) out.add(p.slug)
  return out
}

/** The display name in a language. */
export function produceName(p: SeasonalProduce, lang: 'el' | 'en'): string {
  return lang === 'el' ? p.name_el : p.name_en
}
