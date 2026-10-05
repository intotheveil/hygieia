// PRICE MODEL (P4.11): the inline price draft, its validation and the name sort. Pure functions,
// no React: unit-tested directly and imported by PriceTable.tsx. Validation is the DB CHECK's twin
// (`price_eur_min <= price_eur_max`, both ≥ 0) plus an ISO date, surfaced in the reviewer's
// language BEFORE the request. A valid draft converts to exactly the five price columns.

import type { PricePer } from '../content/enums.ts'
import type { AdminRow, PricePatch } from './adminSource.ts'

export type IngredientRow = AdminRow<'ingredients'>

/** The inputs' text while a row is being edited. */
export interface PriceDraft {
  min: string
  max: string
  per: PricePer
  asOf: string
  note: string
}

export function draftOf(row: IngredientRow): PriceDraft {
  return {
    min: String(row.price_eur_min),
    max: String(row.price_eur_max),
    per: row.price_per,
    asOf: row.price_as_of,
    note: row.price_note,
  }
}

export type PriceProblem = 'number' | 'order'

export type PriceCheck = { ok: true; patch: PricePatch } | { ok: false; problem: PriceProblem }

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

/** The patch a draft stands for, or the first problem that blocks it. Pure, so it is unit-tested. */
export function checkDraft(draft: PriceDraft): PriceCheck {
  const min = draft.min.trim() === '' ? NaN : Number(draft.min)
  const max = draft.max.trim() === '' ? NaN : Number(draft.max)
  if (!Number.isFinite(min) || !Number.isFinite(max) || min < 0 || max < 0)
    return { ok: false, problem: 'number' }
  if (min > max) return { ok: false, problem: 'order' }
  if (!ISO_DATE.test(draft.asOf)) return { ok: false, problem: 'number' }
  return {
    ok: true,
    patch: {
      price_eur_min: min,
      price_eur_max: max,
      price_per: draft.per,
      price_as_of: draft.asOf,
      price_note: draft.note,
    },
  }
}

/** Rows sorted by `name_<lang>` with the language's collation. */
export function sortByName(rows: readonly IngredientRow[], lang: 'el' | 'en'): IngredientRow[] {
  const key = lang === 'el' ? 'name_el' : 'name_en'
  return [...rows].sort((a, b) => a[key].localeCompare(b[key], lang))
}
