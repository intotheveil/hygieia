import { describe, expect, it } from 'vitest'
import { ENTRY_KINDS, GOAL_KINDS } from '../user/source'
import {
  GOAL_UNIT,
  NOTE_MAX,
  UNIT_FOR_KIND,
  VALUE_RANGE,
  emptyForm,
  parseNumber,
  takesValue,
  validateEntry,
  type EntryFormValues,
} from './entryForm'

const TODAY = '2026-10-06'
const form = (patch: Partial<EntryFormValues>): EntryFormValues => ({
  ...emptyForm(TODAY),
  ...patch,
})

describe('unit per kind', () => {
  it('maps every kind to exactly the agreed unit; skincare and nails take no value', () => {
    expect(UNIT_FOR_KIND).toEqual({
      weight: 'kg',
      meal: 'kcal',
      workout: 'min',
      water: 'ml',
      sleep: 'h',
      steps: 'steps',
      mood: 'score',
      skincare: null,
      nails: null,
    })
    for (const kind of ENTRY_KINDS) {
      expect(takesValue(kind)).toBe(UNIT_FOR_KIND[kind] !== null)
      expect(VALUE_RANGE[kind] === null).toBe(UNIT_FOR_KIND[kind] === null)
    }
    for (const kind of GOAL_KINDS) expect(GOAL_UNIT[kind]).toBeTruthy()
    expect(GOAL_UNIT.skincare).toBe('sessions')
  })

  it('emptyForm defaults to water, today, no value, no note', () => {
    expect(emptyForm(TODAY)).toEqual({ kind: 'water', value: '', date: TODAY, note: '' })
    expect(emptyForm(TODAY, 'mood').kind).toBe('mood')
  })
})

describe('parseNumber', () => {
  it('accepts decimal commas and points, trims, rejects junk and empties', () => {
    expect(parseNumber('72,5')).toBe(72.5)
    expect(parseNumber(' 72.5 ')).toBe(72.5)
    expect(parseNumber('500')).toBe(500)
    expect(parseNumber('.5')).toBe(0.5)
    expect(parseNumber('-3')).toBe(-3)
    expect(parseNumber('')).toBeNull()
    expect(parseNumber('abc')).toBeNull()
    expect(parseNumber('1,000.5')).toBeNull()
    expect(parseNumber('1e3')).toBeNull()
  })
})

describe('validateEntry', () => {
  it('builds the EntryInput with the kind’s unit, the date and a trimmed note', () => {
    const result = validateEntry(
      form({ kind: 'weight', value: '72,5', date: '2026-10-05', note: '  after run  ' }),
      TODAY,
    )
    expect(result).toEqual({
      ok: true,
      input: {
        kind: 'weight',
        entry_date: '2026-10-05',
        value: 72.5,
        unit: 'kg',
        note: 'after run',
      },
    })
  })

  it('an empty note becomes null', () => {
    const result = validateEntry(form({ kind: 'water', value: '500', note: '   ' }), TODAY)
    expect(result.ok && result.input.note).toBeNull()
  })

  it('skincare / nails carry no value and no unit, whatever was typed', () => {
    for (const kind of ['skincare', 'nails'] as const) {
      const result = validateEntry(form({ kind, value: 'ignored' }), TODAY)
      expect(result).toEqual({
        ok: true,
        input: { kind, entry_date: TODAY, value: null, unit: null, note: null },
      })
    }
  })

  it('requires a value for valued kinds and reports a non-number', () => {
    expect(validateEntry(form({ kind: 'water', value: '' }), TODAY)).toEqual({
      ok: false,
      errors: { value: 'valueRequired' },
    })
    expect(validateEntry(form({ kind: 'water', value: 'lots' }), TODAY)).toEqual({
      ok: false,
      errors: { value: 'valueNotNumber' },
    })
  })

  it('enforces the per-kind range inclusively', () => {
    expect(validateEntry(form({ kind: 'mood', value: '5' }), TODAY).ok).toBe(true)
    expect(validateEntry(form({ kind: 'mood', value: '6' }), TODAY)).toEqual({
      ok: false,
      errors: { value: 'valueOutOfRange' },
    })
    expect(validateEntry(form({ kind: 'mood', value: '0' }), TODAY).ok).toBe(false)
    expect(validateEntry(form({ kind: 'weight', value: '19.9' }), TODAY).ok).toBe(false)
    expect(validateEntry(form({ kind: 'weight', value: '20' }), TODAY).ok).toBe(true)
    expect(validateEntry(form({ kind: 'sleep', value: '24' }), TODAY).ok).toBe(true)
    expect(validateEntry(form({ kind: 'sleep', value: '24.5' }), TODAY).ok).toBe(false)
    expect(validateEntry(form({ kind: 'workout', value: '0' }), TODAY).ok).toBe(false)
  })

  it('steps and mood must be whole numbers', () => {
    expect(validateEntry(form({ kind: 'steps', value: '3500.5' }), TODAY)).toEqual({
      ok: false,
      errors: { value: 'valueNotWhole' },
    })
    expect(validateEntry(form({ kind: 'mood', value: '2,5' }), TODAY)).toEqual({
      ok: false,
      errors: { value: 'valueNotWhole' },
    })
    expect(validateEntry(form({ kind: 'weight', value: '72.25' }), TODAY).ok).toBe(true)
  })

  it('rejects a future or malformed date; today and the past are fine', () => {
    expect(validateEntry(form({ value: '500', date: '2026-10-07' }), TODAY)).toEqual({
      ok: false,
      errors: { date: 'dateFuture' },
    })
    expect(validateEntry(form({ value: '500', date: '2026-02-30' }), TODAY)).toEqual({
      ok: false,
      errors: { date: 'dateInvalid' },
    })
    expect(validateEntry(form({ value: '500', date: TODAY }), TODAY).ok).toBe(true)
    expect(validateEntry(form({ value: '500', date: '2020-01-01' }), TODAY).ok).toBe(true)
  })

  it(`caps the note at ${NOTE_MAX} characters`, () => {
    expect(validateEntry(form({ value: '500', note: 'x'.repeat(NOTE_MAX) }), TODAY).ok).toBe(true)
    expect(validateEntry(form({ value: '500', note: 'x'.repeat(NOTE_MAX + 1) }), TODAY)).toEqual({
      ok: false,
      errors: { note: 'noteTooLong' },
    })
  })

  it('reports every failing field at once', () => {
    const result = validateEntry(
      form({ kind: 'steps', value: 'x', date: '2999-01-01', note: 'y'.repeat(300) }),
      TODAY,
    )
    expect(result).toEqual({
      ok: false,
      errors: { value: 'valueNotNumber', date: 'dateFuture', note: 'noteTooLong' },
    })
  })
})
