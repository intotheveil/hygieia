// SESSION HISTORY (P8.3): every logged session, newest first — date, plan name (or "without a
// plan"), the exercises, a one-line summary (exercises · done sets · volume), PR badges with what
// each record was, and Delete with the /profile two-click pattern (first click "Sure?", a click on
// another row's Delete resets the first; no `window.confirm`).

import { useState } from 'react'
import type { Exercise } from '../../content'
import { EmptyState } from '../../components/AsyncState'
import { useLang } from '../../i18n/LangProvider'
import { workoutPlansCopy } from '../../i18n/features/workoutPlans.ts'
import { fill } from '../../i18n/fill'
import { formatDate, formatNumber } from '../../profile/format'
import { DANGER, ERR, H2, SECTION } from '../../profile/styles'
import type { Result, WorkoutPlan, WorkoutSession } from '../../user/source'
import { summarizeSession, type PersonalRecord } from './progress'

export interface SessionHistoryProps {
  sessions: readonly WorkoutSession[]
  plans: ReadonlyMap<string, WorkoutPlan>
  exercises: ReadonlyMap<string, Exercise>
  records: ReadonlyMap<string, PersonalRecord[]>
  onDelete: (session: WorkoutSession) => Promise<Result<void>>
}

export function SessionHistory({
  sessions,
  plans,
  exercises,
  records,
  onDelete,
}: SessionHistoryProps) {
  const { t, lang } = useLang(workoutPlansCopy)
  const [confirming, setConfirming] = useState<string | null>(null)
  const [failed, setFailed] = useState<string | null>(null)
  const kg = t.profileUnit.kg
  const num = (n: number) => formatNumber(n, lang)
  const nameOf = (exerciseId: string) => {
    const exercise = exercises.get(exerciseId)
    if (exercise === undefined) return t.wpUnknownExercise
    return lang === 'el' ? exercise.name_el : exercise.name_en
  }
  const recordText = (record: PersonalRecord) =>
    `${nameOf(record.exercise_id)}: ${fill(t.wpPrKinds[record.kind], {
      value: num(record.value),
      weight: record.weight_kg === null ? t.wpBodyweight : `${num(record.weight_kg)} ${kg}`,
    })}`

  async function click(session: WorkoutSession) {
    if (confirming !== session.id) {
      setConfirming(session.id)
      setFailed(null)
      return
    }
    setConfirming(null)
    const result = await onDelete(session)
    if (!result.ok) setFailed(session.id)
  }

  return (
    <section aria-labelledby="wp-history" className={SECTION}>
      <h2 id="wp-history" className={H2}>
        {t.wpHistoryHeading}
      </h2>
      {sessions.length === 0 ? (
        <EmptyState title={t.wpHistoryEmpty} icon="✎" />
      ) : (
        <ol className="flex flex-col gap-3" aria-label={t.wpHistoryHeading}>
          {sessions.map((session) => {
            const plan = session.plan_id === null ? undefined : plans.get(session.plan_id)
            const summary = summarizeSession(session)
            const prs = records.get(session.id) ?? []
            const date = formatDate(session.performed_at, lang)
            const label = `${plan?.name ?? t.wpFreeSession}, ${date}`
            const confirm = confirming === session.id
            const names = [...new Set(session.exercises.map((e) => e.exercise_id))].map(nameOf)
            return (
              <li
                key={session.id}
                data-testid="session-row"
                className="flex flex-col gap-2 rounded-xl bg-paper-200/60 px-4 py-3"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div className="flex flex-col">
                    <span className="font-medium text-olive-950">
                      {plan?.name ?? t.wpFreeSession}
                    </span>
                    <span className="text-xs text-olive-700">
                      {date}
                      {session.duration_min !== null &&
                        ` · ${session.duration_min} ${t.minutesUnit}`}
                    </span>
                  </div>
                  {prs.length > 0 && (
                    <span
                      data-testid="pr-badge"
                      className="rounded-full bg-olive-900 px-2.5 py-0.5 text-xs font-semibold tracking-wide text-paper-50"
                    >
                      <span aria-hidden="true">★ </span>
                      {t.wpPr}
                    </span>
                  )}
                </div>
                <p className="text-sm text-olive-700">{names.join(', ')}</p>
                <p className="text-xs text-olive-700">
                  {fill(t.wpSessionSummary, {
                    exercises: summary.exercises,
                    sets: summary.doneSets,
                    volume: num(summary.volume),
                  })}
                </p>
                {prs.length > 0 && (
                  <ul className="flex flex-col gap-0.5 text-xs font-medium text-sage-700">
                    {prs.map((record) => (
                      <li key={`${record.exercise_id}-${record.kind}`}>{recordText(record)}</li>
                    ))}
                  </ul>
                )}
                {session.note !== null && session.note !== '' && (
                  <p className="text-sm text-olive-700 italic">{session.note}</p>
                )}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    aria-label={`${confirm ? t.profileConfirmDelete : t.profileDelete}: ${label}`}
                    onClick={() => void click(session)}
                    className={DANGER}
                  >
                    {confirm ? t.profileConfirmDelete : t.profileDelete}
                  </button>
                  {failed === session.id && (
                    <span role="alert" className={ERR}>
                      {t.wpDeleteFailed}
                    </span>
                  )}
                </div>
              </li>
            )
          })}
        </ol>
      )}
    </section>
  )
}
