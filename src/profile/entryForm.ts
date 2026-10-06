// QUICK-ADD VALIDATION (P8.2) — pure. The form keeps strings; this module turns them into an
// `EntryInput` or a field-keyed error list. The unit is a function of the kind (one unit per kind,
// DECISIONS 2026-10-06 P8.2): weight kg, meal kcal, workout min, water ml, sleep h, steps steps,
// mood a 1–5 score; skincare and nails carry no value — the entry itself means "done today".
// Decimal commas are accepted (Greek keyboards), dates may not be in the future, notes ≤ 280 chars.

import type { EntryInput, EntryKind, EntryUnit, GoalKind } from '../user/source'
import { dayNumber } from './stats'

export const UNIT_FOR_KIND: Readonly<Record<EntryKind, EntryUnit | null>> = {
  weight: 'kg',
  meal: 'kcal',
  workout: 'min',
  water: 'ml',
  sleep: 'h',
  steps: 'steps',
  mood: 'score',
  skincare: null,
  nails: null,
}

/** Inclusive sane ranges per kind, for the value a person would type (not a medical limit). */
export const VALUE_RANGE: Readonly<Record<EntryKind, readonly [min: number, max: number] | null>> =
  {
    weight: [20, 400],
    meal: [0, 5000],
    workout: [1, 600],
    water: [1, 10000],
    sleep: [0, 24],
    steps: [0, 100000],
    mood: [1, 5],
    skincare: null,
    nails: null,
  }

/** The unit a goal of each kind is stored in (`goals.unit`); skincare goals count sessions. */
export const GOAL_UNIT: Readonly<Record<GoalKind, string>> = {
  water: 'ml',
  sleep: 'h',
  workout: 'min',
  steps: 'steps',
  weight: 'kg',
  skincare: 'sessions',
}

/** Kinds whose value must be a whole number. */
const INTEGER_KINDS: ReadonlySet<EntryKind> = new Set(['steps', 'mood'])

export const NOTE_MAX = 280

export interface EntryFormValues {
  kind: EntryKind
  /** As typed; empty when the kind takes no value. */
  value: string
  /** `YYYY-MM-DD`. */
  date: string
  note: string
}

export type EntryFormError =
  | 'valueRequired'
  | 'valueNotNumber'
  | 'valueOutOfRange'
  | 'valueNotWhole'
  | 'dateInvalid'
  | 'dateFuture'
  | 'noteTooLong'

export type EntryFormField = 'value' | 'date' | 'note'

export type EntryValidation =
  | { ok: true; input: EntryInput }
  | { ok: false; errors: Partial<Record<EntryFormField, EntryFormError>> }

export function takesValue(kind: EntryKind): boolean {
  return UNIT_FOR_KIND[kind] !== null
}

/** `'72,5'` → 72.5; `''` / junk → null. */
export function parseNumber(raw: string): number | null {
  const text = raw.trim().replace(',', '.')
  if (text === '' || !/^[+-]?(\d+\.?\d*|\.\d+)$/.test(text)) return null
  const n = Number(text)
  return Number.isFinite(n) ? n : null
}

export function emptyForm(today: string, kind: EntryKind = 'water'): EntryFormValues {
  return { kind, value: '', date: today, note: '' }
}

export function validateEntry(values: EntryFormValues, today: string): EntryValidation {
  const errors: Partial<Record<EntryFormField, EntryFormError>> = {}
  const unit = UNIT_FOR_KIND[values.kind]
  let value: number | null = null

  if (unit !== null) {
    if (values.value.trim() === '') errors.value = 'valueRequired'
    else {
      const parsed = parseNumber(values.value)
      const range = VALUE_RANGE[values.kind]
      if (parsed === null) errors.value = 'valueNotNumber'
      else if (INTEGER_KINDS.has(values.kind) && !Number.isInteger(parsed)) {
        errors.value = 'valueNotWhole'
      } else if (range !== null && (parsed < range[0] || parsed > range[1])) {
        errors.value = 'valueOutOfRange'
      } else value = parsed
    }
  }

  const day = dayNumber(values.date)
  const todayDay = dayNumber(today)
  if (day === null) errors.date = 'dateInvalid'
  else if (todayDay !== null && day > todayDay) errors.date = 'dateFuture'

  const note = values.note.trim()
  if (note.length > NOTE_MAX) errors.note = 'noteTooLong'

  if (Object.keys(errors).length > 0) return { ok: false, errors }
  return {
    ok: true,
    input: {
      kind: values.kind,
      entry_date: values.date,
      value: unit === null ? null : value,
      unit,
      note: note === '' ? null : note,
    },
  }
}
