import {
  CARE_AREAS,
  CONTENT_TABLES,
  ROUTINE_TIMES,
  SKINCARE_CATEGORIES,
  STEP_TIMES,
  UNITS,
} from '../content/enums.ts'
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
  selectOptions,
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

// --- P7.1 skincare: the json kind, per-table select options, deep sameValue, heading columns ------

const steps = [
  {
    order: 1,
    product_type_slug: 'gel-cleanser',
    note_el: 'Καθάρισε με χλιαρό νερό.',
    note_en: 'Cleanse with lukewarm water.',
    optional: false,
  },
  {
    order: 2,
    product_type_slug: 'light-moisturiser',
    note_el: 'Λεπτό στρώμα.',
    note_en: 'A thin layer.',
    optional: false,
  },
  {
    order: 3,
    product_type_slug: 'spf-fluid',
    note_el: 'Δύο δάχτυλα SPF.',
    note_en: 'Two fingers of SPF.',
    optional: true,
  },
]

const routine: AdminRow<'skincare_routines'> = {
  ...review,
  slug: 'men-oily-am-eu',
  area: 'face',
  name_el: 'Πρωινή ρουτίνα για λιπαρό δέρμα',
  name_en: 'Morning routine for oily skin',
  audience: 'men',
  skin_type: 'oily',
  region: 'eu',
  time: 'am',
  intro_el: 'Τρία βήματα, πέντε λεπτά.',
  intro_en: 'Three steps, five minutes.',
  steps,
  duration_min: 5,
}

describe('field model — P7.1 kinds: json steps and the per-table enums', () => {
  const json: Field = { column: 'steps', kind: 'json', nullable: false }

  it('`steps` is json by column NAME — with or without the table, whatever the loaded value', () => {
    expect(kindOf('steps', steps, 'skincare_routines')).toBe('json')
    expect(kindOf('steps', steps)).toBe('json')
    // Name wins over the value: a string-typed jsonb (as a fake or a bad row might hand over) is
    // still edited as JSON, not as a text input.
    expect(kindOf('steps', '[{"order":1}]')).toBe('json')
    expect(kindOf('steps_el', ['a'], 'recipes')).toBe('lines')
  })

  it('`time` and `category` are table-aware: enums where the CHECK says so, free text elsewhere', () => {
    expect(kindOf('time', 'am', 'skincare_routines')).toBe('select')
    expect(kindOf('time', 'both', 'skincare_product_types')).toBe('select')
    expect(kindOf('category', 'cleanser', 'skincare_product_types')).toBe('select')
    expect(kindOf('category', 'dairy', 'ingredients')).toBe('text')
    // Without a table the shared map still applies to `time`; `category` has no shared entry.
    expect(kindOf('time', 'am')).toBe('select')
    expect(kindOf('category', 'dairy')).toBe('text')
  })

  it('selectOptions: the table override first, then the shared enum map, else undefined', () => {
    const routineTime = selectOptions('skincare_routines', 'time')
    const typeTime = selectOptions('skincare_product_types', 'time')
    expect(routineTime).toEqual(ROUTINE_TIMES)
    expect(routineTime).toContain('weekly')
    expect(routineTime).not.toContain('both')
    expect(typeTime).toEqual(STEP_TIMES)
    expect(typeTime).toContain('both')
    expect(typeTime).not.toContain('weekly')
    expect(selectOptions('skincare_product_types', 'category')).toEqual(SKINCARE_CATEGORIES)
    expect(selectOptions('ingredients', 'category')).toBeUndefined()
    expect(selectOptions('ingredients', 'unit')).toEqual(UNITS)
    expect(selectOptions('skincare_routines', 'name_el')).toBeUndefined()
  })

  it('the routine form offers am | pm | weekly for `time`, so a nail routine can be saved as weekly', () => {
    const fields = fieldsOf(fieldGroups('skincare_routines', routine))
    const time = fields.find((f) => f.column === 'time')
    expect(time).toEqual({ column: 'time', kind: 'select', nullable: false, options: ROUTINE_TIMES })
    expect(fromEdit(time as Field, 'weekly')).toEqual({ ok: true, value: 'weekly' })
    expect(fromEdit(time as Field, 'both')).toEqual({ ok: false })
    expect(fields.find((f) => f.column === 'steps')).toEqual({
      column: 'steps',
      kind: 'json',
      nullable: false,
    })
    expect(fields.find((f) => f.column === 'area')?.options).toEqual(CARE_AREAS)
  })

  it('the product-type form offers the category enum (the DB CHECK) instead of free text', () => {
    const raw: Record<string, unknown> = { ...review, slug: 's' }
    for (const column of EDITABLE_COLUMNS.skincare_product_types) raw[column] = ''
    raw.category = 'serum'
    raw.time = 'pm'
    // reason: a synthetic row for the kind detector; only `category` and `time` matter here.
    const fields = fieldsOf(fieldGroups('skincare_product_types', raw as AdminRow))
    expect(fields.find((f) => f.column === 'category')).toEqual({
      column: 'category',
      kind: 'select',
      nullable: false,
      options: SKINCARE_CATEGORIES,
    })
    expect(fields.find((f) => f.column === 'time')?.options).toEqual(STEP_TIMES)
  })

  it('toEdit renders json as pretty-printed text; undefined is an empty editor', () => {
    expect(toEdit(json, steps)).toBe(JSON.stringify(steps, null, 2))
    expect(toEdit(json, undefined)).toBe('')
    // `steps` is NOT NULL in the DB, so null never arrives; if it did, the editor would show the
    // literal `null` and fromEdit would refuse to save it back (not an array) — pinned as a pair.
    expect(toEdit(json, null)).toBe('null')
    expect(fromEdit(json, 'null')).toEqual({ ok: false })
  })

  it('fromEdit json: a non-empty array round-trips; everything else is unsaveable', () => {
    const pretty = JSON.stringify(steps, null, 2)
    const converted = fromEdit(json, pretty)
    expect(converted).toEqual({ ok: true, value: steps })
    expect(converted.ok && converted.value).not.toBe(steps) // parsed, not the same reference
    expect(fromEdit(json, '[{"order": 1}]')).toEqual({ ok: true, value: [{ order: 1 }] })

    expect(fromEdit(json, '')).toEqual({ ok: false })
    expect(fromEdit(json, '   \n\t')).toEqual({ ok: false })
    expect(fromEdit(json, '[{"order": 1,')).toEqual({ ok: false })
    expect(fromEdit(json, 'not json')).toEqual({ ok: false })
    expect(fromEdit(json, '{}')).toEqual({ ok: false })
    expect(fromEdit(json, '{"order": 1}')).toEqual({ ok: false })
    expect(fromEdit(json, '[]')).toEqual({ ok: false })
    expect(fromEdit(json, '"[]"')).toEqual({ ok: false })
    expect(fromEdit(json, '1')).toEqual({ ok: false })
    expect(fromEdit(json, ['a', 'b'])).toEqual({ ok: false })
    expect(fromEdit(json, true)).toEqual({ ok: false })
  })

  it('headingColumn: title_* for skincare_tips, name_* for routines and product types', () => {
    expect(headingColumn('skincare_tips')).toBe('title')
    expect(headingColumn('skincare_routines')).toBe('name')
    expect(headingColumn('skincare_product_types')).toBe('name')
    expect(headingOf('skincare_routines', routine, 'el')).toBe('Πρωινή ρουτίνα για λιπαρό δέρμα')
    expect(headingOf('skincare_routines', routine, 'en')).toBe('Morning routine for oily skin')
  })
})

describe('field model — diff over json (deep sameValue)', () => {
  const fields = fieldsOf(fieldGroups('skincare_routines', routine))

  it('the initial draft of a routine is no change and nothing is invalid', () => {
    expect(diffDraft(fields, { ...routine }, initialDraft(fields, routine))).toEqual({
      patch: {},
      invalid: [],
    })
  })

  it('re-serialised identical steps (compact, re-indented) are NOT a change', () => {
    const base = initialDraft(fields, routine)
    expect(base.steps).toBe(JSON.stringify(steps, null, 2))
    for (const text of [
      JSON.stringify(steps),
      JSON.stringify(steps, null, 8),
      `\n  ${JSON.stringify(steps, null, 2).replace(/\n/g, '\n  ')}\n`,
    ])
      expect(diffDraft(fields, { ...routine }, { ...base, steps: text })).toEqual({
        patch: {},
        invalid: [],
      })
  })

  it('a one-note edit inside a step is a change carrying the WHOLE parsed array', () => {
    const edited = steps.map((s, i) =>
      i === 1 ? { ...s, note_en: 'A thin layer, neck included.' } : s,
    )
    const draft = { ...initialDraft(fields, routine), steps: JSON.stringify(edited, null, 2) }
    const { patch, invalid } = diffDraft(fields, { ...routine }, draft)
    expect(invalid).toEqual([])
    expect(patch).toEqual({ steps: edited })
    expect(Object.keys(patch)).toEqual(['steps'])
  })

  it('a removed or re-ordered step is a change; broken JSON is invalid, not a patch', () => {
    const base = initialDraft(fields, routine)
    const dropped = diffDraft(fields, { ...routine }, {
      ...base,
      steps: JSON.stringify(steps.slice(0, 2)),
    })
    expect(dropped.patch).toEqual({ steps: steps.slice(0, 2) })
    const reordered = diffDraft(fields, { ...routine }, {
      ...base,
      steps: JSON.stringify([steps[1], steps[0], steps[2]]),
    })
    expect(reordered.patch).toEqual({ steps: [steps[1], steps[0], steps[2]] })

    const broken = diffDraft(fields, { ...routine }, {
      ...base,
      steps: '[{"order": 1,',
      duration_min: '7',
    })
    expect(broken.invalid).toEqual(['steps'])
    expect(broken.patch).toEqual({ duration_min: 7 })
    expect(diffDraft(fields, { ...routine }, { ...base, steps: '[]' }).invalid).toEqual(['steps'])
  })
})
