// FIELD MODEL (P4.10): how a content column is edited. The field set of a table is
// `EDITABLE_COLUMNS[table]` (the migration's UPDATE grant), grouped into bilingual pairs
// (`x_el` + `x_en`) and singles; each field has a kind — text, long text, number, boolean, select
// (the CHECK-constrained enums), date, or lines for `string[]`. The draft holds an EDIT
// representation (numbers and dates as text, so a half-typed value is not coerced under the
// reviewer's fingers); `fromEdit` converts back and `diffDraft` yields ONLY the changed columns.
// Pure functions, no React: unit-tested directly and imported by ReviewForm.tsx / PendingList.tsx.

import {
  AUDIENCES,
  CARE_AREAS,
  INTENSITIES,
  LEVELS,
  PRICE_BANDS,
  PRICE_PER,
  REGIONS,
  ROUTINE_TIMES,
  SKINCARE_CATEGORIES,
  SKIN_TYPES,
  STEP_TIMES,
  TIP_TOPICS,
  UNITS,
  WORKOUT_TYPES,
  type ContentTable,
} from '../content/enums.ts'
import { EDITABLE_COLUMNS, type AdminRow } from './adminSource.ts'

// --- field model ------------------------------------------------------------------------------------

export type Kind = 'text' | 'long' | 'number' | 'boolean' | 'lines' | 'date' | 'select' | 'json'

/** What an input holds while editing: text for text/number/date/select, lines, or a flag. */
export type EditValue = string | string[] | boolean

export interface Field {
  column: string
  kind: Kind
  /** Empty text saves as `null` (the nullable text columns); otherwise empty text is invalid. */
  nullable: boolean
  options?: readonly string[]
}

export type FieldGroup =
  { base: string; pair: true; el: Field; en: Field } | { base: string; pair: false; single: Field }

/** Base names whose text is paragraph-length: rendered as a textarea. */
const LONG_TEXT: ReadonlySet<string> = new Set([
  'summary',
  'body',
  'cue',
  'notes',
  'source_note',
  'description',
  'intro',
])

/** The nullable text columns across the content tables (db-types.ts `string | null`). */
const NULLABLE: ReadonlySet<string> = new Set([
  'source_url',
  'image_path',
  'equipment_el',
  'equipment_en',
])

/** The CHECK-constrained enum columns, offered as a select over the enum's literals. */
const SELECT_OPTIONS: Readonly<Record<string, readonly string[]>> = {
  unit: UNITS,
  price_per: PRICE_PER,
  workout_type: WORKOUT_TYPES,
  level: LEVELS,
  intensity: INTENSITIES,
  topic: TIP_TOPICS,
  // P7.1 skincare (scalar enum columns; the array-valued ones — regions, audiences … — are `lines`;
  // `category` is per-table below: free text on ingredients, an enum on skincare_product_types)
  price_band_eur: PRICE_BANDS,
  area: CARE_AREAS,
  audience: AUDIENCES,
  skin_type: SKIN_TYPES,
  region: REGIONS,
  time: STEP_TIMES,
}

/**
 * Columns whose kind depends on the table: `time` is `am | pm | both` on a product type but
 * `am | pm | weekly` on a routine; `category` is an enum on skincare_product_types and free text on
 * ingredients. Looked up before `SELECT_OPTIONS`.
 */
const TABLE_SELECT_OPTIONS: Partial<
  Record<ContentTable, Readonly<Record<string, readonly string[]>>>
> = {
  skincare_product_types: { category: SKINCARE_CATEGORIES },
  skincare_routines: { time: ROUTINE_TIMES },
}

/** jsonb columns edited as JSON text (skincare routine `steps`); saved only when it parses to an array. */
const JSON_COLUMNS: ReadonlySet<string> = new Set(['steps'])

const DATE_COLUMNS: ReadonlySet<string> = new Set(['price_as_of'])

const LANG_SUFFIX = /_(el|en)$/

function baseOf(column: string): string {
  return column.replace(LANG_SUFFIX, '')
}

/** The kind of a column from its name and the loaded value (and the table, for per-table enums). */
export function kindOf(column: string, value: unknown, table?: ContentTable): Kind {
  if (table !== undefined && TABLE_SELECT_OPTIONS[table]?.[column] !== undefined) return 'select'
  if (column in SELECT_OPTIONS) return 'select'
  if (DATE_COLUMNS.has(column)) return 'date'
  if (JSON_COLUMNS.has(column)) return 'json'
  if (Array.isArray(value)) return 'lines'
  if (typeof value === 'number') return 'number'
  if (typeof value === 'boolean') return 'boolean'
  return LONG_TEXT.has(baseOf(column)) ? 'long' : 'text'
}

/** The select literals of `column` on `table` (table override first, then the shared map). */
export function selectOptions(table: ContentTable, column: string): readonly string[] | undefined {
  return TABLE_SELECT_OPTIONS[table]?.[column] ?? SELECT_OPTIONS[column]
}

function fieldFor(table: ContentTable, column: string, value: unknown): Field {
  const kind = kindOf(column, value, table)
  return {
    column,
    kind,
    nullable: NULLABLE.has(column),
    ...(kind === 'select' ? { options: selectOptions(table, column) } : {}),
  }
}

/**
 * The editable columns of `table` grouped into bilingual pairs (`x_el` + `x_en`, in the order of
 * the `_el` column) and singles, in grant order.
 */
export function fieldGroups(table: ContentTable, row: AdminRow): FieldGroup[] {
  const columns = EDITABLE_COLUMNS[table] as ReadonlyArray<string>
  const raw: Record<string, unknown> = row
  const groups: FieldGroup[] = []
  for (const column of columns) {
    const base = baseOf(column)
    if (column.endsWith('_en') && columns.includes(`${base}_el`)) continue
    if (column.endsWith('_el') && columns.includes(`${base}_en`)) {
      groups.push({
        base,
        pair: true,
        el: fieldFor(table, column, raw[column]),
        en: fieldFor(table, `${base}_en`, raw[`${base}_en`]),
      })
    } else {
      groups.push({ base: column, pair: false, single: fieldFor(table, column, raw[column]) })
    }
  }
  return groups
}

export function fieldsOf(groups: readonly FieldGroup[]): Field[] {
  return groups.flatMap((g) => (g.pair ? [g.el, g.en] : [g.single]))
}

/** The edit representation of a loaded value. */
export function toEdit(field: Field, value: unknown): EditValue {
  switch (field.kind) {
    case 'lines':
      return Array.isArray(value) ? value.map(String) : []
    case 'boolean':
      return value === true
    case 'number':
      return typeof value === 'number' ? String(value) : ''
    case 'json':
      return value === undefined ? '' : JSON.stringify(value, null, 2)
    default:
      return typeof value === 'string' ? value : ''
  }
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

export type Converted = { ok: true; value: unknown } | { ok: false }

/** The column value an edit stands for, or `ok: false` when it cannot be saved as it is. */
export function fromEdit(field: Field, edit: EditValue): Converted {
  switch (field.kind) {
    case 'lines':
      return Array.isArray(edit) ? { ok: true, value: edit } : { ok: false }
    case 'boolean':
      return typeof edit === 'boolean' ? { ok: true, value: edit } : { ok: false }
    case 'number': {
      if (typeof edit !== 'string' || edit.trim() === '') return { ok: false }
      const n = Number(edit)
      return Number.isFinite(n) ? { ok: true, value: n } : { ok: false }
    }
    case 'date':
      return typeof edit === 'string' && ISO_DATE.test(edit)
        ? { ok: true, value: edit }
        : { ok: false }
    case 'select':
      return typeof edit === 'string' && (field.options ?? []).includes(edit)
        ? { ok: true, value: edit }
        : { ok: false }
    case 'json': {
      if (typeof edit !== 'string' || edit.trim() === '') return { ok: false }
      try {
        const parsed: unknown = JSON.parse(edit)
        return Array.isArray(parsed) && parsed.length > 0
          ? { ok: true, value: parsed }
          : { ok: false }
      } catch {
        return { ok: false }
      }
    }
    default: {
      if (typeof edit !== 'string') return { ok: false }
      if (edit.trim() === '') return field.nullable ? { ok: true, value: null } : { ok: false }
      return { ok: true, value: edit }
    }
  }
}

function sameValue(a: unknown, b: unknown): boolean {
  if (Array.isArray(a) && Array.isArray(b))
    return a.length === b.length && a.every((v, i) => sameValue(v, b[i]))
  if (typeof a === 'object' && a !== null && typeof b === 'object' && b !== null)
    return JSON.stringify(a) === JSON.stringify(b)
  return a === b
}

export interface Diff {
  /** Only the columns whose converted value differs from the baseline. */
  patch: Record<string, unknown>
  /** Columns whose edit cannot be converted; Save is blocked while any exists. */
  invalid: string[]
}

/** The changed columns of `draft` against `baseline`, and the columns that are not saveable. */
export function diffDraft(
  fields: readonly Field[],
  baseline: Readonly<Record<string, unknown>>,
  draft: Readonly<Record<string, EditValue>>,
): Diff {
  const patch: Record<string, unknown> = {}
  const invalid: string[] = []
  for (const field of fields) {
    const edit = draft[field.column]
    if (edit === undefined) continue
    const converted = fromEdit(field, edit)
    if (!converted.ok) {
      invalid.push(field.column)
      continue
    }
    if (!sameValue(converted.value, baseline[field.column])) patch[field.column] = converted.value
  }
  return { patch, invalid }
}

export function initialDraft(fields: readonly Field[], row: AdminRow): Record<string, EditValue> {
  const raw: Record<string, unknown> = row
  const draft: Record<string, EditValue> = {}
  for (const field of fields) draft[field.column] = toEdit(field, raw[field.column])
  return draft
}

/** Pad the shorter of two line lists so a pair always has equal length (never for seeds). */
export function evenLengths(el: string[], en: string[]): [string[], string[]] {
  const n = Math.max(el.length, en.length)
  const pad = (xs: string[]) => [...xs, ...Array<string>(n - xs.length).fill('')]
  return [pad(el), pad(en)]
}

// --- list headings --------------------------------------------------------------------------------

/** The bilingual heading column pair of a table: `title_*` where it exists, else `name_*`. */
export function headingColumn(table: ContentTable): 'title' | 'name' {
  return table === 'recipes' ||
    table === 'workout_templates' ||
    table === 'health_tips' ||
    table === 'skincare_tips'
    ? 'title'
    : 'name'
}

/** A row's heading in one language; the slug when the column is not a string (never for seeds). */
export function headingOf(table: ContentTable, row: AdminRow, lang: 'el' | 'en'): string {
  const raw: Record<string, unknown> = row
  const value = raw[`${headingColumn(table)}_${lang}`]
  return typeof value === 'string' && value.trim() !== '' ? value : row.slug
}
