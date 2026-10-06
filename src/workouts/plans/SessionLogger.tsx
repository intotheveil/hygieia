// SESSION LOGGER (P8.3): log one training session — pre-filled from the template's exercises with
// their prescribed sets and reps; per set reps, weight (kg, optional), effort (RPE 1–10, optional)
// and a done tick; add / remove sets; duration, date and a note; an optional rest countdown (no
// audio). Validation is pure (./logger.ts). Save writes the session (`addWorkoutSession`) and then a
// `workout` ENTRY (`addEntry`, value = minutes, payload `{ session_id }`) so the /profile summary,
// streaks and achievements count it like any other workout (DECISIONS 2026-10-06 P8.3). The entry
// is best-effort: the session is the record, a refused entry does not undo it.

import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import type { Exercise, WorkoutTemplate } from '../../content'
import { useLang } from '../../i18n/LangProvider'
import { workoutPlansCopy } from '../../i18n/features/workoutPlans.ts'
import { fill } from '../../i18n/fill'
import { ERR, H2, INPUT, LABEL, PILL, PILL_PRIMARY, SECTION } from '../../profile/styles'
import type { UserDataSource, WorkoutPlan, WorkoutSession } from '../../user/source'
import {
  MAX_SETS,
  addSet,
  draftFromTemplate,
  formatClock,
  removeSet,
  setKey,
  updateSet,
  validateDraft,
  type LoggerDraft,
  type LoggerErrors,
  type Prescription,
} from './logger'

export interface SessionLoggerProps {
  source: UserDataSource
  template: WorkoutTemplate | null
  plan: WorkoutPlan | null
  today: string
  onSaved: (session: WorkoutSession) => void
  onCancel: () => void
}

const DEFAULT_REST = 60

/** The wall clock, read only from the rest timer's click handler and interval — never in render. */
const wallClock = (): number => Date.now()

function exerciseMap(template: WorkoutTemplate | null): Map<string, Exercise> {
  const map = new Map<string, Exercise>()
  for (const slot of template?.slots ?? []) {
    if (slot.exercise !== null) map.set(slot.exercise.id, slot.exercise)
  }
  return map
}

export function SessionLogger({
  source,
  template,
  plan,
  today,
  onSaved,
  onCancel,
}: SessionLoggerProps) {
  const { t, lang } = useLang(workoutPlansCopy)
  const id = useId()
  const headingRef = useRef<HTMLHeadingElement>(null)
  const [draft, setDraft] = useState<LoggerDraft>(() => draftFromTemplate(template, today))
  const [errors, setErrors] = useState<LoggerErrors | null>(null)
  const [saving, setSaving] = useState(false)
  const [failed, setFailed] = useState(false)
  // Rest countdown: a wall-clock end time + a ticking `now`, so a throttled background tab still
  // shows the right time when it wakes. `null` = no timer.
  const [restEnd, setRestEnd] = useState<number | null>(null)
  const [now, setNow] = useState(0)
  const rest = restEnd === null ? null : Math.max(0, Math.ceil((restEnd - now) / 1000))
  const exercises = exerciseMap(template)

  useEffect(() => {
    headingRef.current?.focus()
  }, [])

  useEffect(() => {
    if (restEnd === null) return
    const timer = setInterval(() => {
      const t0 = wallClock()
      setNow(t0)
      if (t0 >= restEnd) clearInterval(timer)
    }, 250)
    return () => clearInterval(timer)
  }, [restEnd])

  const startRest = (seconds: number) => {
    const t0 = wallClock()
    setNow(t0)
    setRestEnd(t0 + seconds * 1000)
  }

  const nameOf = (exerciseId: string) => {
    const exercise = exercises.get(exerciseId)
    if (exercise === undefined) return t.wpUnknownExercise
    return lang === 'el' ? exercise.name_el : exercise.name_en
  }

  const figure = (p: Prescription) =>
    p.reps !== null ? `${p.sets} × ${p.reps}` : `${p.sets} × ${p.seconds ?? 0} ${t.wpSecondsShort}`

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (saving) return
    const result = validateDraft(draft, today)
    if (!result.ok) {
      setErrors(result.errors)
      return
    }
    setErrors(null)
    setFailed(false)
    setSaving(true)
    const saved = await source.addWorkoutSession({
      ...result.input,
      plan_id: plan?.id ?? null,
      template_id: template?.id ?? plan?.template_id ?? null,
    })
    if (!saved.ok) {
      setSaving(false)
      setFailed(true)
      return
    }
    const minutes = saved.data.duration_min
    await source.addEntry({
      kind: 'workout',
      entry_date: saved.data.performed_at,
      value: minutes,
      unit: minutes === null ? null : 'min',
      payload: { session_id: saved.data.id },
    })
    setSaving(false)
    onSaved(saved.data)
  }

  const title =
    template === null ? (plan?.name ?? '') : lang === 'el' ? template.title_el : template.title_en
  const dateId = `${id}-date`
  const durationId = `${id}-duration`
  const noteId = `${id}-note`

  return (
    <section aria-labelledby={`${id}-heading`} className={SECTION} data-testid="session-logger">
      <header className="flex flex-col gap-1">
        <h2 id={`${id}-heading`} ref={headingRef} tabIndex={-1} className={H2}>
          {t.wpLoggerHeading}
        </h2>
        {title !== '' && (
          <p className="text-sm text-olive-700">{fill(t.wpLoggerFor, { name: title })}</p>
        )}
      </header>

      <form noValidate onSubmit={(e) => void submit(e)} className="flex flex-col gap-5">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <label className="flex flex-col gap-1" htmlFor={dateId}>
            <span className={LABEL}>{t.wpDate}</span>
            <input
              id={dateId}
              type="date"
              max={today}
              value={draft.performed_at}
              onChange={(e) => setDraft({ ...draft, performed_at: e.target.value })}
              aria-invalid={errors?.date !== undefined}
              aria-describedby={errors?.date !== undefined ? `${dateId}-err` : undefined}
              className={INPUT}
            />
            {errors?.date !== undefined && (
              <span id={`${dateId}-err`} className={ERR}>
                {t.wpErrors[errors.date]}
              </span>
            )}
          </label>
          <label className="flex flex-col gap-1" htmlFor={durationId}>
            <span className={LABEL}>{t.wpDuration}</span>
            <input
              id={durationId}
              type="text"
              inputMode="numeric"
              value={draft.duration}
              onChange={(e) => setDraft({ ...draft, duration: e.target.value })}
              aria-invalid={errors?.duration !== undefined}
              aria-describedby={errors?.duration !== undefined ? `${durationId}-err` : undefined}
              className={INPUT}
            />
            {errors?.duration !== undefined && (
              <span id={`${durationId}-err`} className={ERR}>
                {t.wpErrors[errors.duration]}
              </span>
            )}
          </label>
        </div>

        {template === null && <p className="text-sm text-olive-700">{t.wpNoTemplate}</p>}

        {draft.exercises.map((exercise, ei) => {
          const name = nameOf(exercise.exercise_id)
          const restFor = exercise.prescription?.rest_seconds || DEFAULT_REST
          return (
            <fieldset
              key={`${exercise.exercise_id}-${ei}`}
              className="flex flex-col gap-2 rounded-xl bg-paper-200/60 p-3"
              data-testid="logger-exercise"
            >
              <legend className="px-1 font-medium text-olive-950">{name}</legend>
              {exercise.prescription !== null && (
                <p className="text-xs text-olive-700">
                  {fill(t.wpPrescribed, { figure: figure(exercise.prescription) })}
                </p>
              )}
              <ol className="flex flex-col gap-2">
                {exercise.sets.map((set, si) => {
                  const setLabel = fill(t.wpSet, { n: si + 1 })
                  const bad = errors?.sets[setKey(ei, si)] ?? []
                  const errId = `${id}-set-${ei}-${si}-err`
                  const field = (label: string) => `${label} · ${setLabel} · ${name}`
                  return (
                    <li key={si} className="flex flex-col gap-1">
                      <div className="grid grid-cols-[3.5rem_1fr_1fr_1fr_auto_auto] items-center gap-1.5 sm:gap-2">
                        <span className="text-xs font-medium text-olive-700">{setLabel}</span>
                        <input
                          type="text"
                          inputMode="numeric"
                          placeholder={t.wpReps}
                          aria-label={field(t.wpReps)}
                          value={set.reps}
                          onChange={(e) =>
                            setDraft(updateSet(draft, ei, si, { reps: e.target.value }))
                          }
                          aria-invalid={bad.includes('reps')}
                          aria-describedby={bad.length > 0 ? errId : undefined}
                          className={`${INPUT} px-2`}
                        />
                        <input
                          type="text"
                          inputMode="decimal"
                          placeholder={t.profileUnit.kg}
                          aria-label={field(t.wpWeight)}
                          value={set.weight}
                          onChange={(e) =>
                            setDraft(updateSet(draft, ei, si, { weight: e.target.value }))
                          }
                          aria-invalid={bad.includes('weight')}
                          aria-describedby={bad.length > 0 ? errId : undefined}
                          className={`${INPUT} px-2`}
                        />
                        <input
                          type="text"
                          inputMode="decimal"
                          placeholder={t.wpRpeShort}
                          aria-label={field(t.wpRpe)}
                          value={set.rpe}
                          onChange={(e) =>
                            setDraft(updateSet(draft, ei, si, { rpe: e.target.value }))
                          }
                          aria-invalid={bad.includes('rpe')}
                          aria-describedby={bad.length > 0 ? errId : undefined}
                          className={`${INPUT} px-2`}
                        />
                        <label className="flex min-h-11 min-w-11 items-center justify-center">
                          <input
                            type="checkbox"
                            checked={set.done}
                            aria-label={field(t.wpDone)}
                            onChange={(e) =>
                              setDraft(updateSet(draft, ei, si, { done: e.target.checked }))
                            }
                            className="h-5 w-5 accent-olive-900"
                          />
                        </label>
                        <button
                          type="button"
                          aria-label={fill(t.wpRemoveSet, { n: si + 1, name })}
                          onClick={() => setDraft(removeSet(draft, ei, si))}
                          className="min-h-11 min-w-11 rounded-full text-lg text-clay-700 hover:bg-clay-500/10"
                        >
                          <span aria-hidden="true">×</span>
                        </button>
                      </div>
                      {bad.length > 0 && (
                        <p id={errId} className={ERR}>
                          {bad.map((f) => t.wpSetErrors[f]).join(' ')}
                        </p>
                      )}
                    </li>
                  )
                })}
              </ol>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  aria-label={`${t.wpAddSet} · ${name}`}
                  onClick={() => setDraft(addSet(draft, ei))}
                  disabled={exercise.sets.length >= MAX_SETS}
                  className={PILL}
                >
                  {t.wpAddSet}
                </button>
                <button
                  type="button"
                  aria-label={`${fill(t.wpRestStart, { n: restFor })} · ${name}`}
                  onClick={() => startRest(restFor)}
                  className={PILL}
                >
                  {fill(t.wpRestStart, { n: restFor })}
                </button>
              </div>
            </fieldset>
          )
        })}

        {rest !== null && (
          <div
            className="sticky bottom-3 flex items-center justify-between gap-3 rounded-xl bg-olive-900 px-4 py-3 text-paper-50 shadow-md"
            data-testid="rest-timer"
          >
            <span
              role="timer"
              aria-label={t.wpRestTimer}
              className="font-display text-xl tabular-nums"
            >
              {rest > 0 ? fill(t.wpRestLeft, { clock: formatClock(rest) }) : t.wpRestOver}
            </span>
            {rest <= 0 && (
              <span role="status" className="sr-only">
                {t.wpRestOver}
              </span>
            )}
            <button
              type="button"
              onClick={() => setRestEnd(null)}
              className="rounded-full border border-paper-50/40 px-3 py-1 text-sm"
            >
              {t.wpRestStop}
            </button>
          </div>
        )}

        <label className="flex flex-col gap-1" htmlFor={noteId}>
          <span className={LABEL}>{t.wpNote}</span>
          <textarea
            id={noteId}
            rows={2}
            value={draft.note}
            onChange={(e) => setDraft({ ...draft, note: e.target.value })}
            aria-invalid={errors?.note !== undefined}
            aria-describedby={errors?.note !== undefined ? `${noteId}-err` : undefined}
            className={INPUT}
          />
          {errors?.note !== undefined && (
            <span id={`${noteId}-err`} className={ERR}>
              {t.wpErrors[errors.note]}
            </span>
          )}
        </label>

        {errors?.form !== undefined && (
          <p role="alert" className={ERR}>
            {t.wpErrors[errors.form]}
          </p>
        )}
        {failed && (
          <p role="alert" className={ERR}>
            {t.wpSaveFailed}
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          <button type="submit" disabled={saving} className={PILL_PRIMARY}>
            {saving ? t.wpSaving : t.wpSave}
          </button>
          <button type="button" onClick={onCancel} className={PILL}>
            {t.wpCancel}
          </button>
        </div>
      </form>
    </section>
  )
}
