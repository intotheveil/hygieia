// PANEL FORMATTING (P4.3) — pure helpers shared by NutritionPanel and CostPanel. The engines
// (`src/nutrition/compute.ts`, `src/cost/compute.ts`) do no rounding; this is where a figure
// becomes a string in the page's language: whole numbers for kcal and grams, EUR currency for
// cost, a long date for the price as-of. Greek uses comma decimals and puts the € after the
// amount ("2,10 €"); English puts it before ("€2.10") — both come from `Intl`, never hand-built.

import type { Lang } from '../i18n/app.ts'
import type { Macros } from '../nutrition/compute.ts'

/** Which figures the panels show; one state shared by both (the toggle lives in NutritionPanel). */
export type Scope = 'portion' | 'recipe'

const LOCALES: Record<Lang, string> = { el: 'el-GR', en: 'en-GB' }

export function localeFor(lang: Lang): string {
  return LOCALES[lang]
}

/** `Math.round` then the language's integer format (`1.234` grouping differs: `1,234` / `1.234`). */
export function formatWhole(value: number, lang: Lang): string {
  if (!Number.isFinite(value)) return String(value)
  return new Intl.NumberFormat(LOCALES[lang], { maximumFractionDigits: 0 }).format(
    Math.round(value),
  )
}

/** EUR with two decimals in the language's currency format (`€2.10` / `2,10 €`). */
export function formatEuro(value: number, lang: Lang): string {
  if (!Number.isFinite(value)) return String(value)
  return new Intl.NumberFormat(LOCALES[lang], { style: 'currency', currency: 'EUR' }).format(value)
}

/**
 * An ISO `YYYY-MM-DD` as a long date in the language (`5 October 2026` / `5 Οκτωβρίου 2026`).
 * Date-only ISO strings parse as UTC midnight, so the formatter is pinned to UTC: the day never
 * shifts with the viewer's time zone. An unparseable string is returned as written.
 */
export function formatIsoDate(iso: string, lang: Lang): string {
  const ms = Date.parse(iso)
  if (!Number.isFinite(ms)) return iso
  return new Intl.DateTimeFormat(LOCALES[lang], { dateStyle: 'long', timeZone: 'UTC' }).format(ms)
}

export interface EnergyShare {
  protein: number
  carbs: number
  fat: number
}

/**
 * The share of energy each macro contributes, as whole percentages (Atwater factors: 4 kcal/g
 * protein and carbs, 9 kcal/g fat). Null when there is no energy to split (an empty or fully
 * unknown recipe), so the bar is not drawn for nothing. Shares may sum to 99 or 101 after rounding.
 */
export function energyShare(macros: Macros): EnergyShare | null {
  const protein = Math.max(0, macros.protein) * 4
  const carbs = Math.max(0, macros.carbs) * 4
  const fat = Math.max(0, macros.fat) * 9
  const total = protein + carbs + fat
  if (!Number.isFinite(total) || total <= 0) return null
  return {
    protein: Math.round((protein / total) * 100),
    carbs: Math.round((carbs / total) * 100),
    fat: Math.round((fat / total) * 100),
  }
}
