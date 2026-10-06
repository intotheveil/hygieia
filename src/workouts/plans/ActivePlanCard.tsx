// ACTIVE PLAN CARD (P8.3): one active plan — a progress ring (sessions done / weeks × days, as a
// `role="progressbar"` with the count as `aria-valuetext`), the week-by-week grid (one row per plan
// week, one cell per planned day; filled cells = sessions logged on the plan that week; the current
// week highlighted), "Log today's session", and Mark completed / Abandon. Abandon is two-click
// (the /profile delete pattern: first click asks "Sure?"), completion is one click — it is the
// happy ending and can be undone by nothing worse than starting a new plan.

import { useState } from 'react'
import type { WorkoutTemplate } from '../../content'
import { useLang } from '../../i18n/LangProvider'
import { fill } from '../../i18n/fill'
import { formatDate } from '../../profile/format'
import { DANGER, ERR, PILL, PILL_PRIMARY } from '../../profile/styles'
import type { PlanStatus, Result, WorkoutPlan, WorkoutSession } from '../../user/source'
import { planSchedule } from './schedule'

export interface ActivePlanCardProps {
  plan: WorkoutPlan
  template: WorkoutTemplate | null
  sessions: readonly WorkoutSession[]
  today: string
  onLog: (plan: WorkoutPlan) => void
  onStatus: (plan: WorkoutPlan, status: PlanStatus) => Promise<Result<WorkoutPlan>>
}

const RING = 2 * Math.PI * 26

export function ActivePlanCard({
  plan,
  template,
  sessions,
  today,
  onLog,
  onStatus,
}: ActivePlanCardProps) {
  const { t, lang } = useLang()
  const [confirmAbandon, setConfirmAbandon] = useState(false)
  const [failed, setFailed] = useState(false)
  const [busy, setBusy] = useState(false)
  const schedule = planSchedule(plan, sessions, today)
  const templateTitle =
    template === null ? null : lang === 'el' ? template.title_el : template.title_en
  const headingId = `plan-${plan.id}`
  const beforeStart = today < plan.start_date
  const afterEnd = today > schedule.endDate

  async function change(status: PlanStatus) {
    if (status === 'abandoned' && !confirmAbandon) {
      setConfirmAbandon(true)
      return
    }
    setConfirmAbandon(false)
    setFailed(false)
    setBusy(true)
    const result = await onStatus(plan, status)
    setBusy(false)
    if (!result.ok) setFailed(true)
  }

  const progressText = fill(t.wpProgressValue, { done: schedule.done, total: schedule.total })

  return (
    <article
      aria-labelledby={headingId}
      data-testid="active-plan"
      className="flex flex-col gap-4 rounded-2xl border border-olive-900/10 bg-paper-50/80 p-5 shadow-sm"
    >
      <div className="flex items-start gap-4">
        <div
          role="progressbar"
          aria-label={plan.name}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={schedule.percent}
          aria-valuetext={progressText}
          className="relative h-16 w-16 shrink-0"
        >
          <svg viewBox="0 0 64 64" className="h-16 w-16 -rotate-90" aria-hidden="true">
            <circle
              cx="32"
              cy="32"
              r="26"
              fill="none"
              strokeWidth="7"
              className="stroke-olive-900/10"
            />
            <circle
              cx="32"
              cy="32"
              r="26"
              fill="none"
              strokeWidth="7"
              strokeLinecap="round"
              strokeDasharray={RING}
              strokeDashoffset={RING * (1 - schedule.percent / 100)}
              className="stroke-sage-700"
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-olive-950">
            {schedule.percent}%
          </span>
        </div>
        <div className="flex min-w-0 flex-col gap-1">
          <h3 id={headingId} className="font-display text-lg font-semibold text-olive-950">
            {plan.name}
          </h3>
          {templateTitle !== null && <p className="text-sm text-olive-700">{templateTitle}</p>}
          <p className="text-sm text-olive-700" data-testid="plan-progress">
            {progressText}
          </p>
          <p className="text-xs text-olive-700">
            {fill(t.wpDates, {
              start: formatDate(plan.start_date, lang),
              end: formatDate(schedule.endDate, lang),
            })}
          </p>
        </div>
      </div>

      {beforeStart && (
        <p className="text-sm text-olive-700">
          {fill(t.wpNotStarted, { date: formatDate(plan.start_date, lang) })}
        </p>
      )}
      {afterEnd && <p className="text-sm text-olive-700">{t.wpFinished}</p>}
      {schedule.currentWeek !== null && (
        <p className="text-sm font-medium text-olive-900">
          {fill(t.wpThisWeek, { n: schedule.thisWeek, days: plan.days_per_week })}
        </p>
      )}

      <ol aria-label={t.wpScheduleLabel} className="flex flex-col gap-1.5" data-testid="plan-grid">
        {schedule.weeks.map((week) => (
          <li
            key={week.index}
            data-current={week.current ? 'true' : undefined}
            className={`flex items-center gap-2 rounded-lg px-2 py-1 ${
              week.current ? 'bg-sage-700/10 ring-1 ring-sage-700/40' : ''
            }`}
          >
            <span className="w-20 shrink-0 text-xs font-medium text-olive-700">
              {fill(t.wpWeek, { n: week.index + 1 })}
            </span>
            <span className="flex flex-wrap gap-1.5">
              {Array.from({ length: plan.days_per_week }, (_, day) => {
                const filled = day < week.filled
                const label = fill(filled ? t.wpCellDone : t.wpCellOpen, {
                  week: week.index + 1,
                  day: day + 1,
                })
                return (
                  <span
                    key={day}
                    role="img"
                    aria-label={label}
                    data-filled={filled ? 'true' : 'false'}
                    className={`h-6 w-6 rounded-md ${
                      filled ? 'bg-sage-700' : 'border border-olive-900/20 bg-paper-50'
                    }`}
                  />
                )
              })}
            </span>
            {week.current && (
              <span className="ml-auto text-xs font-medium text-sage-700">{t.wpThisWeekBadge}</span>
            )}
          </li>
        ))}
      </ol>

      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => onLog(plan)} className={PILL_PRIMARY}>
          {t.wpLogToday}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => void change('completed')}
          className={PILL}
        >
          {t.wpComplete}
        </button>
        <button
          type="button"
          disabled={busy}
          aria-label={`${confirmAbandon ? t.wpConfirm : t.wpAbandon}: ${plan.name}`}
          onClick={() => void change('abandoned')}
          className={DANGER}
        >
          {confirmAbandon ? t.wpConfirm : t.wpAbandon}
        </button>
        {failed && (
          <span role="alert" className={ERR}>
            {t.wpStatusFailed}
          </span>
        )}
      </div>
    </article>
  )
}
