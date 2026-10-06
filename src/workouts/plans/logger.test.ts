import { describe, expect, it } from 'vitest'
import { PRESS, SQUAT, STRETCH, TEMPLATE } from './fixtures'
import {
  MAX_EXERCISES,
  MAX_SETS,
  addSet,
  draftFromTemplate,
  emptySet,
  formatClock,
  isUntouched,
  parseDecimal,
  removeSet,
  setKey,
  updateSet,
  validateDraft,
  validateSet,
  type LoggerDraft,
} from './logger'

const TODAY = '2026-10-06'

describe('draftFromTemplate', () => {
  it('pre-fills every slot in order with its prescribed sets and reps, the template duration and today', () => {
    const draft = draftFromTemplate(TEMPLATE, TODAY)
    expect(draft.performed_at).toBe(TODAY)
    expect(draft.duration).toBe('45')
    expect(draft.note).toBe('')
    expect(draft.exercises.map((e) => e.exercise_id)).toEqual([SQUAT.id, PRESS.id, STRETCH.id])
    expect(draft.exercises[0]?.sets).toEqual([emptySet(8), emptySet(8), emptySet(8)])
    expect(draft.exercises[0]?.sets[0]).toEqual({ reps: '8', weight: '', rpe: '', done: false })
    expect(draft.exercises[1]?.sets).toHaveLength(2)
    expect(draft.exercises[0]?.prescription).toEqual({
      sets: 3,
      reps: 8,
      seconds: null,
      rest_seconds: 90,
    })
  })

  it('leaves reps blank on a seconds-based slot (the visitor types what they did)', () => {
    const stretch = draftFromTemplate(TEMPLATE, TODAY).exercises[2]
    expect(stretch?.sets).toEqual([{ reps: '', weight: '', rpe: '', done: false }])
    expect(stretch?.prescription?.seconds).toBe(40)
  })

  it('skips a slot whose exercise is hidden, and yields an empty draft for no template', () => {
    const hidden = {
      ...TEMPLATE,
      slots: TEMPLATE.slots.map((s, i) => (i === 1 ? { ...s, exercise: null } : s)),
    }
    expect(draftFromTemplate(hidden, TODAY).exercises.map((e) => e.exercise_id)).toEqual([
      SQUAT.id,
      STRETCH.id,
    ])
    expect(draftFromTemplate(null, TODAY)).toEqual({
      performed_at: TODAY,
      duration: '',
      note: '',
      exercises: [],
    })
  })

  it('caps a slot at MAX_SETS sets and gives a zero-set slot one set', () => {
    const big = {
      ...TEMPLATE,
      slots: [
        { ...TEMPLATE.slots[0]!, block: { ...TEMPLATE.slots[0]!.block, sets: 50 } },
        { ...TEMPLATE.slots[1]!, block: { ...TEMPLATE.slots[1]!.block, sets: 0 } },
      ],
    }
    const draft = draftFromTemplate(big, TODAY)
    expect(draft.exercises[0]?.sets).toHaveLength(MAX_SETS)
    expect(draft.exercises[1]?.sets).toHaveLength(1)
  })
})

describe('parseDecimal', () => {
  it('reads a comma or a point, blank as null, junk as NaN', () => {
    expect(parseDecimal('62,5')).toBe(62.5)
    expect(parseDecimal(' 80.25 ')).toBe(80.25)
    expect(parseDecimal('100')).toBe(100)
    expect(parseDecimal('')).toBeNull()
    expect(parseDecimal('   ')).toBeNull()
    expect(parseDecimal('-5')).toBeNaN()
    expect(parseDecimal('1e3')).toBeNaN()
    expect(parseDecimal('abc')).toBeNaN()
  })
})

describe('validateSet', () => {
  it('accepts reps alone, and reps + weight + RPE in half steps', () => {
    expect(validateSet({ reps: '10', weight: '', rpe: '', done: false })).toEqual({
      ok: true,
      set: { reps: 10, weight_kg: null, rpe: null, done: false },
    })
    expect(validateSet({ reps: '5', weight: '102,5', rpe: '8.5', done: true })).toEqual({
      ok: true,
      set: { reps: 5, weight_kg: 102.5, rpe: 8.5, done: true },
    })
    expect(validateSet({ reps: '0', weight: '0', rpe: '1', done: true }).ok).toBe(true)
  })

  it.each([
    [{ reps: '', weight: '', rpe: '', done: true }, ['reps']],
    [{ reps: '8.5', weight: '', rpe: '', done: true }, ['reps']],
    [{ reps: '1000', weight: '', rpe: '', done: true }, ['reps']],
    [{ reps: '8', weight: '1000.5', rpe: '', done: true }, ['weight']],
    [{ reps: '8', weight: 'heavy', rpe: '', done: true }, ['weight']],
    [{ reps: '8', weight: '', rpe: '0', done: true }, ['rpe']],
    [{ reps: '8', weight: '', rpe: '11', done: true }, ['rpe']],
    [{ reps: '8', weight: '', rpe: '7.3', done: true }, ['rpe']],
    [{ reps: 'x', weight: '-1', rpe: '12', done: true }, ['reps', 'weight', 'rpe']],
  ] as const)('rejects %j on %j', (draft, fields) => {
    expect(validateSet({ ...draft })).toEqual({ ok: false, fields: [...fields] })
  })
})

describe('validateDraft', () => {
  const base = (): LoggerDraft => draftFromTemplate(TEMPLATE, TODAY)

  it('turns the pre-filled draft into the session payload, skipping the untouched stretch', () => {
    let draft = base()
    draft = updateSet(draft, 0, 0, { weight: '60', done: true, rpe: '7' })
    const result = validateDraft(draft, TODAY)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.input).toEqual({
      performed_at: TODAY,
      duration_min: 45,
      note: null,
      exercises: [
        {
          exercise_id: SQUAT.id,
          sets: [
            { reps: 8, weight_kg: 60, rpe: 7, done: true },
            { reps: 8, weight_kg: null, rpe: null, done: false },
            { reps: 8, weight_kg: null, rpe: null, done: false },
          ],
        },
        {
          exercise_id: PRESS.id,
          sets: [
            { reps: 10, weight_kg: null, rpe: null, done: false },
            { reps: 10, weight_kg: null, rpe: null, done: false },
          ],
        },
      ],
    })
    // No user_id, plan or template id: the page adds the ids, the DB the owner.
    expect(Object.keys(result.input).sort()).toEqual([
      'duration_min',
      'exercises',
      'note',
      'performed_at',
    ])
  })

  it('keeps a seconds slot once the visitor fills it, and trims the note', () => {
    const draft = { ...updateSet(base(), 2, 0, { reps: '1', done: true }), note: '  felt strong  ' }
    const result = validateDraft(draft, TODAY)
    expect(result.ok && result.input.exercises.map((e) => e.exercise_id)).toEqual([
      SQUAT.id,
      PRESS.id,
      STRETCH.id,
    ])
    expect(result.ok && result.input.note).toBe('felt strong')
  })

  it('maps a blank duration to null', () => {
    const result = validateDraft({ ...base(), duration: '' }, TODAY)
    expect(result.ok && result.input.duration_min).toBeNull()
  })

  it('reports field errors keyed by exercise and set', () => {
    let draft = base()
    draft = updateSet(draft, 1, 1, { reps: 'ten', rpe: '15' })
    const result = validateDraft(
      { ...draft, duration: '0', note: 'x'.repeat(501), performed_at: '2026-10-07' },
      TODAY,
    )
    expect(result).toEqual({
      ok: false,
      errors: {
        date: 'dateFuture',
        duration: 'durationRange',
        note: 'noteTooLong',
        sets: { [setKey(1, 1)]: ['reps', 'rpe'] },
      },
    })
  })

  it.each([
    ['2026-02-30', 'dateInvalid'],
    ['yesterday', 'dateInvalid'],
  ] as const)('rejects the date %s as %s', (performed_at, error) => {
    const result = validateDraft({ ...base(), performed_at }, TODAY)
    expect(result.ok === false && result.errors.date).toBe(error)
  })

  it.each(['601', '12.5', 'abc'])('rejects the duration %s', (duration) => {
    const result = validateDraft({ ...base(), duration }, TODAY)
    expect(result.ok === false && result.errors.duration).toBe('durationRange')
  })

  it('accepts today and a past date, a 600-minute session and a 500-character note', () => {
    expect(validateDraft({ ...base(), performed_at: '2026-01-01' }, TODAY).ok).toBe(true)
    expect(validateDraft({ ...base(), duration: '600', note: 'n'.repeat(500) }, TODAY).ok).toBe(
      true,
    )
  })

  it('needs at least one set: an empty draft or all sets removed is "noSets"', () => {
    expect(validateDraft(draftFromTemplate(null, TODAY), TODAY)).toEqual({
      ok: false,
      errors: { form: 'noSets', sets: {} },
    })
    let draft = base()
    draft = removeSet(removeSet(removeSet(draft, 0, 0), 0, 0), 0, 0)
    draft = removeSet(removeSet(draft, 1, 0), 1, 0)
    const result = validateDraft(draft, TODAY)
    expect(result.ok === false && result.errors.form).toBe('noSets')
  })

  it('does not add "noSets" on top of a set error', () => {
    const draft = {
      ...base(),
      exercises: [
        { ...base().exercises[0]!, sets: [{ reps: 'x', weight: '', rpe: '', done: true }] },
      ],
    }
    const result = validateDraft(draft, TODAY)
    expect(result).toEqual({ ok: false, errors: { sets: { [setKey(0, 0)]: ['reps'] } } })
  })

  it('refuses more than MAX_EXERCISES exercises', () => {
    const one = base().exercises[0]!
    const draft = { ...base(), exercises: Array.from({ length: MAX_EXERCISES + 1 }, () => one) }
    const result = validateDraft(draft, TODAY)
    expect(result.ok === false && result.errors.form).toBe('tooManyExercises')
    expect(validateDraft({ ...draft, exercises: draft.exercises.slice(1) }, TODAY).ok).toBe(true)
  })
})

describe('draft edits', () => {
  it('updateSet patches one set immutably', () => {
    const draft = draftFromTemplate(TEMPLATE, TODAY)
    const next = updateSet(draft, 0, 1, { weight: '70', done: true })
    expect(next.exercises[0]?.sets[1]).toEqual({ reps: '8', weight: '70', rpe: '', done: true })
    expect(draft.exercises[0]?.sets[1]?.weight).toBe('')
    expect(next.exercises[1]).toBe(draft.exercises[1])
  })

  it('addSet copies the last set reps and weight, not RPE or done; stops at MAX_SETS', () => {
    let draft = updateSet(draftFromTemplate(TEMPLATE, TODAY), 0, 2, {
      reps: '6',
      weight: '80',
      rpe: '9',
      done: true,
    })
    draft = addSet(draft, 0)
    expect(draft.exercises[0]?.sets[3]).toEqual({ reps: '6', weight: '80', rpe: '', done: false })
    for (let i = 0; i < 30; i += 1) draft = addSet(draft, 0)
    expect(draft.exercises[0]?.sets).toHaveLength(MAX_SETS)
  })

  it('addSet on an exercise with no sets adds a blank one; removeSet removes by index', () => {
    let draft = removeSet(draftFromTemplate(TEMPLATE, TODAY), 2, 0)
    expect(draft.exercises[2]?.sets).toEqual([])
    draft = addSet(draft, 2)
    expect(draft.exercises[2]?.sets).toEqual([emptySet()])
  })

  it('isUntouched is true only for a blank, unticked set', () => {
    expect(isUntouched(emptySet())).toBe(true)
    expect(isUntouched({ ...emptySet(), done: true })).toBe(false)
    expect(isUntouched(emptySet(8))).toBe(false)
    expect(isUntouched({ ...emptySet(), weight: '5' })).toBe(false)
  })
})

describe('formatClock', () => {
  it('renders m:ss and clamps below zero', () => {
    expect(formatClock(90)).toBe('1:30')
    expect(formatClock(5)).toBe('0:05')
    expect(formatClock(0)).toBe('0:00')
    expect(formatClock(-3)).toBe('0:00')
  })
})
