// SESSION LOGGER — pure draft state + validation (P8.3, operator: "Set up workout plans - register
// progress etc."). The form keeps every number as the STRING the visitor typed (so "62,5" and an
// empty optional field survive re-renders); `validateDraft` turns a draft into the exact
// `WorkoutSessionInput` the contract (src/user/source.ts) and the migration's CHECKs accept, or a
// map of field errors. No React, no I/O.
//
// Rules (= 20261006001300_hygieia_profile.sql CHECKs, plus sane UI ceilings):
//   - reps: whole number 0..999 (required; the CHECK is `int ≥ 0`).
//   - weight: optional, decimal comma or point, 0..1000 kg.
//   - RPE: optional, 1..10 in half steps.
//   - duration: optional whole minutes 1..600.
//   - note ≤ 500 characters; date a real `YYYY-MM-DD` and never in the future.
//   - an UNTOUCHED set (reps, weight and RPE blank, not done) is skipped, not an error — a
//     seconds-based slot ("hold 40 s") starts that way; an exercise left with no sets is dropped; at least ONE exercise with a set must remain, and at most
//     40 (the jsonb CHECK's ceiling).

import type { WorkoutTemplate } from '../../content/source.ts'
import { dayNumber } from '../../profile/stats'
import type { WorkoutSessionExercise, WorkoutSet } from '../../user/source'

export const MAX_EXERCISES = 40
export const MAX_SETS = 20
export const MAX_NOTE = 500
export const MAX_DURATION = 600
export const MAX_REPS = 999
export const MAX_WEIGHT = 1000

export interface SetDraft {
  reps: string
  weight: string
  rpe: string
  done: boolean
}

export interface Prescription {
  sets: number
  reps: number | null
  seconds: number | null
  rest_seconds: number
}

export interface ExerciseDraft {
  exercise_id: string
  /** The template's prescription, shown as a hint ("3 × 12", "2 × 40 s"); null for none. */
  prescription: Prescription | null
  sets: SetDraft[]
}

export interface LoggerDraft {
  performed_at: string
  duration: string
  note: string
  exercises: ExerciseDraft[]
}

export type SetFieldError = 'reps' | 'weight' | 'rpe'
export type LoggerError =
  'durationRange' | 'noteTooLong' | 'dateInvalid' | 'dateFuture' | 'noSets' | 'tooManyExercises'

export interface LoggerErrors {
  duration?: LoggerError
  note?: LoggerError
  date?: LoggerError
  form?: LoggerError
  /** Keyed `"<exerciseIndex>:<setIndex>"`; the value lists the bad fields of that set. */
  sets: Record<string, SetFieldError[]>
}

/** The validated payload: everything of `WorkoutSessionInput` but the plan / template ids. */
export interface LoggedSession {
  performed_at: string
  duration_min: number | null
  note: string | null
  exercises: WorkoutSessionExercise[]
}

export type ValidationResult =
  { ok: true; input: LoggedSession } | { ok: false; errors: LoggerErrors }

export const setKey = (exerciseIndex: number, setIndex: number) => `${exerciseIndex}:${setIndex}`

/** A blank set; `reps` pre-filled when a prescription is known. */
export function emptySet(reps: number | null = null): SetDraft {
  return { reps: reps === null ? '' : String(reps), weight: '', rpe: '', done: false }
}

/**
 * The draft for a template: one exercise per slot in session order (warm-up → main → cool-down,
 * the template's `position` order), each with the prescribed number of sets and reps. A slot whose
 * exercise is not visible is skipped. A seconds-based slot gets blank reps: the visitor types what
 * they did (the hint keeps the "40 s" prescription on screen).
 */
export function draftFromTemplate(template: WorkoutTemplate | null, today: string): LoggerDraft {
  const exercises: ExerciseDraft[] = []
  for (const slot of template?.slots ?? []) {
    if (slot.exercise === null) continue
    const { sets, reps, seconds, rest_seconds } = slot.block
    const count = Math.max(1, Math.min(MAX_SETS, sets))
    exercises.push({
      exercise_id: slot.exercise.id,
      prescription: { sets, reps, seconds, rest_seconds },
      sets: Array.from({ length: count }, () => emptySet(reps)),
    })
  }
  return {
    performed_at: today,
    duration: template === null ? '' : String(template.duration_min),
    note: '',
    exercises: exercises.slice(0, MAX_EXERCISES),
  }
}

/** Parse a decimal typed with a comma or a point; `null` for blank, `NaN` for junk. */
export function parseDecimal(raw: string): number | null {
  const s = raw.trim().replace(',', '.')
  if (s === '') return null
  if (!/^\d+(\.\d+)?$/.test(s)) return Number.NaN
  return Number(s)
}

function parseWhole(raw: string): number | null {
  const s = raw.trim()
  if (s === '') return null
  if (!/^\d+$/.test(s)) return Number.NaN
  return Number(s)
}

/** Nothing typed and not ticked: the visitor skipped this set. */
export function isUntouched(set: SetDraft): boolean {
  return !set.done && set.reps.trim() === '' && set.weight.trim() === '' && set.rpe.trim() === ''
}

/** One set's numbers, or the list of fields that are wrong. */
export function validateSet(
  draft: SetDraft,
): { ok: true; set: WorkoutSet } | { ok: false; fields: SetFieldError[] } {
  const fields: SetFieldError[] = []
  const reps = parseWhole(draft.reps)
  if (reps === null || Number.isNaN(reps) || reps > MAX_REPS) fields.push('reps')
  const weight = parseDecimal(draft.weight)
  if (weight !== null && (Number.isNaN(weight) || weight > MAX_WEIGHT)) fields.push('weight')
  const rpe = parseDecimal(draft.rpe)
  if (rpe !== null && (Number.isNaN(rpe) || rpe < 1 || rpe > 10 || (rpe * 2) % 1 !== 0)) {
    fields.push('rpe')
  }
  if (fields.length > 0 || reps === null) return { ok: false, fields }
  return { ok: true, set: { reps, weight_kg: weight, rpe, done: draft.done } }
}

/** The whole draft → the session payload (minus `plan_id` / `template_id`, which the page adds). */
export function validateDraft(draft: LoggerDraft, today: string): ValidationResult {
  const errors: LoggerErrors = { sets: {} }

  const day = dayNumber(draft.performed_at)
  const todayDay = dayNumber(today)
  if (day === null) errors.date = 'dateInvalid'
  else if (todayDay !== null && day > todayDay) errors.date = 'dateFuture'

  const duration = parseWhole(draft.duration)
  if (duration !== null && (Number.isNaN(duration) || duration < 1 || duration > MAX_DURATION)) {
    errors.duration = 'durationRange'
  }

  const note = draft.note.trim()
  if (note.length > MAX_NOTE) errors.note = 'noteTooLong'

  const exercises: WorkoutSessionExercise[] = []
  draft.exercises.forEach((exercise, ei) => {
    const sets: WorkoutSet[] = []
    exercise.sets.forEach((set, si) => {
      if (isUntouched(set)) return
      const result = validateSet(set)
      if (result.ok) sets.push(result.set)
      else errors.sets[setKey(ei, si)] = result.fields
    })
    if (sets.length > 0) exercises.push({ exercise_id: exercise.exercise_id, sets })
  })
  if (exercises.length === 0) {
    if (Object.keys(errors.sets).length === 0) errors.form = 'noSets'
  } else if (exercises.length > MAX_EXERCISES) errors.form = 'tooManyExercises'

  const failed =
    errors.date !== undefined ||
    errors.duration !== undefined ||
    errors.note !== undefined ||
    errors.form !== undefined ||
    Object.keys(errors.sets).length > 0
  if (failed) return { ok: false, errors }

  return {
    ok: true,
    input: {
      performed_at: draft.performed_at,
      duration_min: duration,
      note: note === '' ? null : note,
      exercises,
    },
  }
}

// --- immutable draft edits (the component's helpers) --------------------------------------------

export function updateSet(
  draft: LoggerDraft,
  exerciseIndex: number,
  setIndex: number,
  patch: Partial<SetDraft>,
): LoggerDraft {
  return {
    ...draft,
    exercises: draft.exercises.map((exercise, ei) =>
      ei !== exerciseIndex
        ? exercise
        : {
            ...exercise,
            sets: exercise.sets.map((set, si) => (si === setIndex ? { ...set, ...patch } : set)),
          },
    ),
  }
}

/** Append a set copying the last one's reps and weight (how people actually log), not done. */
export function addSet(draft: LoggerDraft, exerciseIndex: number): LoggerDraft {
  return {
    ...draft,
    exercises: draft.exercises.map((exercise, ei) => {
      if (ei !== exerciseIndex || exercise.sets.length >= MAX_SETS) return exercise
      const last = exercise.sets[exercise.sets.length - 1]
      const next: SetDraft =
        last === undefined
          ? emptySet()
          : { reps: last.reps, weight: last.weight, rpe: '', done: false }
      return { ...exercise, sets: [...exercise.sets, next] }
    }),
  }
}

export function removeSet(
  draft: LoggerDraft,
  exerciseIndex: number,
  setIndex: number,
): LoggerDraft {
  return {
    ...draft,
    exercises: draft.exercises.map((exercise, ei) =>
      ei !== exerciseIndex
        ? exercise
        : { ...exercise, sets: exercise.sets.filter((_, si) => si !== setIndex) },
    ),
  }
}

/** Seconds as `m:ss` for the rest timer. */
export function formatClock(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}
