import { CONTENT_TABLES } from '../content/enums.ts'
import { EDITABLE_COLUMNS, type AdminRow } from './adminSource.ts'
import {
  diffDraft,
  evenLengths,
  fieldGroups,
  fieldsOf,
  fromEdit,
  headingColumn,
  headingOf,
  initialDraft,
  kindOf,
  toEdit,
  type Field,
} from './fields.ts'

const review = {
  id: '22222222-2222-4222-8222-222222222222',
  status: 'pending' as const,
  reviewed_at: null,
  reviewed_by: null,
  created_at: '2026-10-06T00:00:00Z',
  updated_at: '2026-10-06T00:00:00Z',
}

const diet: AdminRow<'diets'> = {
  ...review,
  slug: 'mediterranean',
  name_el: 'Μεσογειακή',
  name_en: 'Mediterranean',
  summary_el: 'Λαχανικά, όσπρια, ελαιόλαδο.',
  summary_en: 'Vegetables, pulses, olive oil.',
  allowed_el: ['Λαχανικά', 'Όσπρια'],
  allowed_en: ['Vegetables', 'Pulses'],
  avoided_el: ['Επεξεργασμένα'],
  avoided_en: ['Processed foods'],
  pros_el: ['Καρδιά'],
  pros_en: ['Heart'],
  cons_el: ['Κόστος'],
  cons_en: ['Cost'],
  avoid_if_el: ['Αλλεργία στους ξηρούς καρπούς'],
  avoid_if_en: ['Nut allergy'],
  source_url: null,
}

const ingredient: AdminRow<'ingredients'> = {
  ...review,
  slug: 'feta',
  name_el: 'Φέτα',
  name_en: 'Feta',
  category: 'dairy',
  unit: 'g',
  grams_per_unit: 1,
  kcal_100g: 264,
  protein_100g: 14,
  carbs_100g: 4,
  fat_100g: 21,
  source_note: 'Typical values, USDA FoodData Central reference ranges',
  price_eur_min: 9,
  price_eur_max: 14,
  price_per: 'kg',
  price_as_of: '2026-10-01',
  price_note: 'Supermarket PDO feta',
  substitute_slugs: ['halloumi'],
  is_pantry_staple: false,
}

describe('field model — grouping', () => {
  it('pairs every *_el column with its *_en twin and keeps the rest single, in grant order', () => {
    const groups = fieldGroups('diets', diet)
    expect(groups.map((g) => `${g.base}${g.pair ? '*' : ''}`)).toEqual([
      'name*',
      'summary*',
      'allowed*',
      'avoided*',
      'pros*',
      'cons*',
      'avoid_if*',
      'source_url',
    ])
    const pair = groups[0]
    expect(pair?.pair && [pair.el.column, pair.en.column]).toEqual(['name_el', 'name_en'])
  })

  it.each(CONTENT_TABLES)('%s: every editable column appears exactly once', (table) => {
    // A synthetic row: the kind detector only needs SOME value per column.
    const raw: Record<string, unknown> = { ...review, slug: 's' }
    for (const column of EDITABLE_COLUMNS[table]) raw[column] = ''
    // reason: a synthetic row for the grouping test; only the key set matters here.
    const fields = fieldsOf(fieldGroups(table, raw as AdminRow))
    expect(fields.map((f) => f.column)).toEqual([...EDITABLE_COLUMNS[table]])
  })

  it('detects kinds from the column name and the loaded value', () => {
    expect(kindOf('unit', 'g')).toBe('select')
    expect(kindOf('price_per', 'kg')).toBe('select')
    expect(kindOf('topic', 'sleep')).toBe('select')
    expect(kindOf('price_as_of', '2026-10-01')).toBe('date')
    expect(kindOf('steps_el', ['a'])).toBe('lines')
    expect(kindOf('portions', 4)).toBe('number')
    expect(kindOf('needs_source', true)).toBe('boolean')
    expect(kindOf('body_en', 'x')).toBe('long')
    expect(kindOf('summary_el', 'x')).toBe('long')
    expect(kindOf('title_en', 'x')).toBe('text')
    expect(kindOf('source_url', null)).toBe('text')
  })

  it('heading column is title_* for recipes / templates / tips, name_* otherwise', () => {
    expect(headingColumn('recipes')).toBe('title')
    expect(headingColumn('workout_templates')).toBe('title')
    expect(headingColumn('health_tips')).toBe('title')
    expect(headingColumn('ingredients')).toBe('name')
    expect(headingColumn('diets')).toBe('name')
    expect(headingColumn('exercises')).toBe('name')
    expect(headingOf('diets', diet, 'el')).toBe('Μεσογειακή')
    expect(headingOf('diets', diet, 'en')).toBe('Mediterranean')
    expect(headingOf('diets', { ...diet, name_en: '  ' }, 'en')).toBe('mediterranean')
  })
})

describe('field model — edit ⇄ column conversion', () => {
  const number: Field = { column: 'portions', kind: 'number', nullable: false }
  const text: Field = { column: 'title_en', kind: 'text', nullable: false }
  const nullable: Field = { column: 'source_url', kind: 'text', nullable: true }
  const date: Field = { column: 'price_as_of', kind: 'date', nullable: false }
  const select: Field = { column: 'unit', kind: 'select', nullable: false, options: ['g', 'ml'] }
  const lines: Field = { column: 'steps_en', kind: 'lines', nullable: false }

  it('numbers edit as text and convert back; blank or junk is invalid', () => {
    expect(toEdit(number, 4)).toBe('4')
    expect(fromEdit(number, '4.5')).toEqual({ ok: true, value: 4.5 })
    expect(fromEdit(number, '')).toEqual({ ok: false })
    expect(fromEdit(number, 'abc')).toEqual({ ok: false })
  })

  it('required text cannot be blank; nullable text saves blank as null', () => {
    expect(fromEdit(text, '  ')).toEqual({ ok: false })
    expect(fromEdit(text, 'Greek salad')).toEqual({ ok: true, value: 'Greek salad' })
    expect(toEdit(nullable, null)).toBe('')
    expect(fromEdit(nullable, '')).toEqual({ ok: true, value: null })
    expect(fromEdit(nullable, 'https://example.test')).toEqual({
      ok: true,
      value: 'https://example.test',
    })
  })

  it('dates must be ISO; selects must be one of the options', () => {
    expect(fromEdit(date, '2026-10-01')).toEqual({ ok: true, value: '2026-10-01' })
    expect(fromEdit(date, '01/10/2026')).toEqual({ ok: false })
    expect(fromEdit(select, 'ml')).toEqual({ ok: true, value: 'ml' })
    expect(fromEdit(select, 'cup')).toEqual({ ok: false })
  })

  it('lines round-trip as arrays', () => {
    expect(toEdit(lines, ['a', 'b'])).toEqual(['a', 'b'])
    expect(fromEdit(lines, ['a'])).toEqual({ ok: true, value: ['a'] })
  })

  it('evenLengths pads the shorter list so a pair never differs in length', () => {
    expect(evenLengths(['a', 'b'], ['x'])).toEqual([
      ['a', 'b'],
      ['x', ''],
    ])
    expect(evenLengths([], [])).toEqual([[], []])
  })
})

describe('field model — diff', () => {
  it('yields ONLY the changed columns and never identity / review columns', () => {
    const fields = fieldsOf(fieldGroups('ingredients', ingredient))
    const draft = initialDraft(fields, ingredient)
    expect(diffDraft(fields, { ...ingredient }, draft)).toEqual({ patch: {}, invalid: [] })

    const edited = { ...draft, name_en: 'Feta cheese', price_eur_max: '15', substitute_slugs: [] }
    const { patch, invalid } = diffDraft(fields, { ...ingredient }, edited)
    expect(patch).toEqual({ name_en: 'Feta cheese', price_eur_max: 15, substitute_slugs: [] })
    expect(invalid).toEqual([])
    for (const locked of [
      'id',
      'slug',
      'status',
      'created_at',
      'updated_at',
      'reviewed_at',
      'reviewed_by',
    ])
      expect(patch).not.toHaveProperty(locked)
  })

  it('reports an unsaveable edit instead of a patch for that column', () => {
    const fields = fieldsOf(fieldGroups('ingredients', ingredient))
    const draft = { ...initialDraft(fields, ingredient), kcal_100g: '', name_el: 'Φέτα ΠΟΠ' }
    const { patch, invalid } = diffDraft(fields, { ...ingredient }, draft)
    expect(invalid).toEqual(['kcal_100g'])
    expect(patch).toEqual({ name_el: 'Φέτα ΠΟΠ' })
  })

  it('an unchanged array (same elements) is not a change', () => {
    const fields = fieldsOf(fieldGroups('diets', diet))
    const draft = { ...initialDraft(fields, diet), allowed_el: ['Λαχανικά', 'Όσπρια'] }
    expect(diffDraft(fields, { ...diet }, draft).patch).toEqual({})
  })
})
