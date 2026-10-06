// INGREDIENT-LINE FORMATTING (P3.2) — pure. Turns a recipe line into the string the detail page
// prints: `200 g Feta`, `2 pieces Egg`, `½ bunch Fresh parsley (dry)`; in Greek `200 γρ. Φέτα`,
// `2 τεμάχια Αυγό`. Unit labels come from the dictionary (`units.<Unit>`), never from the enum
// literal, so the UI shows "τεμάχια" and not "piece" in Greek. No React, no I/O.

import type { Unit } from '../content/enums.ts'
import type { Diet, Ingredient, RecipeLine } from '../content/source.ts'
import type { RecipeLineSeed } from '../content/types.ts'
import type { AppDictionary, Lang } from '../i18n/app.ts'
import { pluralForm } from '../i18n/fill.ts'

/** The dictionary slice this module reads — a page passes its full `t`. */
export type UnitLabels = Pick<AppDictionary, 'units'>

/** The common cooking fractions, shown as glyphs: 0.25 → ¼, 0.5 → ½, 0.75 → ¾ (also 1.5 → 1½). */
const FRACTION_GLYPHS: Record<string, string> = { '0.25': '¼', '0.50': '½', '0.75': '¾' }

const LOCALES: Record<Lang, string> = { el: 'el-GR', en: 'en-GB' }

/**
 * A quantity for display: cooking fractions as glyphs (`½`, `1½`), everything else with at most
 * two decimals in the language's number format (`0.1` / `0,1`). Trailing zeros are dropped.
 */
export function formatQuantity(quantity: number, lang: Lang = 'en'): string {
  if (!Number.isFinite(quantity)) return String(quantity)
  const whole = Math.trunc(quantity)
  const glyph = FRACTION_GLYPHS[Math.abs(quantity - whole).toFixed(2)]
  if (glyph !== undefined) return whole === 0 ? glyph : `${whole}${glyph}`
  return new Intl.NumberFormat(LOCALES[lang], { maximumFractionDigits: 2 }).format(quantity)
}

/** The unit's label for `quantity` — singular for `0 < q <= 1`, plural otherwise (see `pluralForm`). */
export function formatUnit(unit: Unit, quantity: number, t: UnitLabels): string {
  return pluralForm(t.units[unit], quantity)
}

/** The diet's name in `lang` (chip labels on the list and detail pages). */
export function dietName(diet: Pick<Diet, 'name_el' | 'name_en'>, lang: Lang): string {
  return lang === 'el' ? diet.name_el : diet.name_en
}

/** The ingredient's name in `lang`, or the line's slug when the ingredient is not visible. */
export function ingredientName(
  line: RecipeLineSeed,
  ingredient: Pick<Ingredient, 'name_el' | 'name_en'> | null,
  lang: Lang,
): string {
  if (ingredient === null) return line.ingredient_slug
  return lang === 'el' ? ingredient.name_el : ingredient.name_en
}

/** The line's note in `lang`, or null when the line has none. */
export function lineNote(line: RecipeLineSeed, lang: Lang): string | null {
  const note = lang === 'el' ? line.note_el : line.note_en
  return note === undefined || note.trim() === '' ? null : note
}

/**
 * The full line: `<quantity> <unit> <ingredient>` plus ` (<note>)` when the line has a note.
 * `ingredient` null (hidden parent row, see `RecipeLine`) falls back to the slug so the line is
 * still legible rather than blank.
 */
export function formatLine(
  line: RecipeLineSeed,
  ingredient: Pick<Ingredient, 'name_el' | 'name_en'> | null,
  lang: Lang,
  t: UnitLabels,
): string {
  const head = `${formatQuantity(line.quantity, lang)} ${formatUnit(line.unit, line.quantity, t)} ${ingredientName(line, ingredient, lang)}`
  const note = lineNote(line, lang)
  return note === null ? head : `${head} (${note})`
}

/** `formatLine` over a resolved `RecipeLine` from the content source. */
export function formatRecipeLine(recipeLine: RecipeLine, lang: Lang, t: UnitLabels): string {
  return formatLine(recipeLine.line, recipeLine.ingredient, lang, t)
}
