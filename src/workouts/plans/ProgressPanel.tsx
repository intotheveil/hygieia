// PROGRESS PANEL (P8.3): pick an exercise you have trained → sessions, best set, best estimated
// 1RM (Epley) and total volume, plus a line chart of the estimated 1RM over its last 8 sessions
// (the /profile sparkline builder, src/profile/chart.ts); under it, total weekly volume for the last
// 8 weeks as bars. Both charts are `role="img"` with a summary sentence as the name, and the same
// sentence is printed — never image-only. All figures are pure (./progress.ts), from the sessions.

import { useId, useState } from 'react'
import type { Exercise } from '../../content'
import { useLang } from '../../i18n/LangProvider'
import { workoutPlansCopy } from '../../i18n/features/workoutPlans.ts'
import { fill, plural } from '../../i18n/fill'
import { buildSparkline } from '../../profile/chart'
import { formatNumber } from '../../profile/format'
import { CARD, H2, INPUT, LABEL, SECTION } from '../../profile/styles'
import type { WorkoutSession } from '../../user/source'
import { exerciseProgress, trainedExercises, weeklyVolume } from './progress'

const WIDTH = 320
const HEIGHT = 96
const BAR_H = 72

export interface ProgressPanelProps {
  sessions: readonly WorkoutSession[]
  exercises: ReadonlyMap<string, Exercise>
  today: string
}

export function ProgressPanel({ sessions, exercises, today }: ProgressPanelProps) {
  const { t, lang } = useLang(workoutPlansCopy)
  const id = useId()
  const trained = trainedExercises(sessions)
  const [picked, setPicked] = useState<string | null>(null)
  const current = picked !== null && trained.includes(picked) ? picked : (trained[0] ?? null)
  const kg = t.profileUnit.kg
  const nameOf = (exerciseId: string) => {
    const exercise = exercises.get(exerciseId)
    if (exercise === undefined) return t.wpUnknownExercise
    return lang === 'el' ? exercise.name_el : exercise.name_en
  }
  const num = (n: number) => formatNumber(n, lang)

  const weeks = weeklyVolume(sessions, today)
  const maxVolume = Math.max(0, ...weeks.map((w) => w.volume))
  const weeklySummary = fill(t.wpWeeklySummary, {
    last: num(weeks[weeks.length - 1]?.volume ?? 0),
    max: num(maxVolume),
  })

  if (current === null) {
    return (
      <section aria-labelledby={`${id}-heading`} className={SECTION}>
        <h2 id={`${id}-heading`} className={H2}>
          {t.wpProgressHeading}
        </h2>
        <p className="text-sm text-olive-700">{t.wpProgressEmpty}</p>
      </section>
    )
  }

  const progress = exerciseProgress(sessions, current)
  const points = progress.trend.flatMap((p) =>
    p.e1rm === null ? [] : [{ date: p.date, value: p.e1rm }],
  )
  const chart = buildSparkline(points, { width: WIDTH, height: HEIGHT, padding: 6 })
  const trendSummary =
    chart === null
      ? null
      : fill(t.wpTrendSummary, {
          n: points.length,
          first: num(points[0]?.value ?? 0),
          last: num(points[points.length - 1]?.value ?? 0),
        })
  const best = progress.bestSet
  const bestText =
    best === null
      ? '—'
      : fill(t.wpBestSetValue, {
          weight: best.weight_kg === null ? t.wpBodyweight : `${num(best.weight_kg)} ${kg}`,
          reps: best.reps,
        })

  return (
    <section aria-labelledby={`${id}-heading`} className={SECTION} data-testid="progress-panel">
      <h2 id={`${id}-heading`} className={H2}>
        {t.wpProgressHeading}
      </h2>
      <label className="flex max-w-sm flex-col gap-1">
        <span className={LABEL}>{t.wpExercise}</span>
        <select value={current} onChange={(e) => setPicked(e.target.value)} className={INPUT}>
          {trained.map((exerciseId) => (
            <option key={exerciseId} value={exerciseId}>
              {nameOf(exerciseId)}
            </option>
          ))}
        </select>
      </label>

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4" data-testid="progress-stats">
        <div className={CARD}>
          <dt className={LABEL}>{t.wpSessionsLabel}</dt>
          <dd className="font-display text-lg text-olive-950">
            {plural(t.wpSessions, progress.sessions)}
          </dd>
        </div>
        <div className={CARD}>
          <dt className={LABEL}>{t.wpBestSet}</dt>
          <dd className="font-display text-lg text-olive-950">{bestText}</dd>
        </div>
        <div className={CARD}>
          <dt className={LABEL}>{t.wpE1rm}</dt>
          <dd className="font-display text-lg text-olive-950" data-testid="best-e1rm">
            {progress.bestE1rm === null ? '—' : `${num(progress.bestE1rm)} ${kg}`}
          </dd>
        </div>
        <div className={CARD}>
          <dt className={LABEL}>{t.wpVolume}</dt>
          <dd className="font-display text-lg text-olive-950">
            {num(progress.totalVolume)} {kg}
          </dd>
        </div>
      </dl>

      {chart === null || trendSummary === null ? (
        <p className="text-sm text-olive-700">{t.wpTrendEmpty}</p>
      ) : (
        <figure className="flex flex-col gap-1">
          <svg
            role="img"
            aria-label={trendSummary}
            viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
            className="h-24 w-full max-w-md text-sage-700"
          >
            <path
              d={chart.path}
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            {chart.dots.map((dot, i) => (
              <circle key={`${dot.date}-${i}`} cx={dot.x} cy={dot.y} r={3} fill="currentColor" />
            ))}
          </svg>
          <figcaption className="text-sm text-olive-700">{trendSummary}</figcaption>
        </figure>
      )}

      <figure className="flex flex-col gap-2">
        <figcaption className={LABEL}>{t.wpWeeklyVolume}</figcaption>
        <svg
          role="img"
          aria-label={weeklySummary}
          viewBox={`0 0 ${WIDTH} ${BAR_H + 4}`}
          className="h-20 w-full max-w-md"
          data-testid="weekly-volume"
        >
          {weeks.map((week, i) => {
            const slot = WIDTH / weeks.length
            const h = maxVolume === 0 ? 0 : Math.max(2, (week.volume / maxVolume) * BAR_H)
            const isLast = i === weeks.length - 1
            return (
              <rect
                key={week.weekStart}
                x={i * slot + slot * 0.15}
                y={BAR_H - h + 2}
                width={slot * 0.7}
                height={h === 0 ? 2 : h}
                rx={3}
                className={isLast ? 'fill-sage-700' : 'fill-olive-900/25'}
              />
            )
          })}
        </svg>
        <p className="text-sm text-olive-700">{weeklySummary}</p>
      </figure>
    </section>
  )
}
