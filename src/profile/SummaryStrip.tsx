// SUMMARY STRIP (P8.2): four figures (entries this week, current streak, longest streak,
// favourites + saved) and today's progress against the four daily-habit goals. Every number comes
// from ./stats.ts; the bars are real `role="progressbar"` elements with the figure as text too.

import { useLang } from '../i18n/LangProvider'
import { fill, plural } from '../i18n/fill'
import type { Entry, Goal, GoalKind } from '../user/source'
import { formatNumber } from './format'
import { currentStreak, entriesThisWeek, goalProgress, longestStreak } from './stats'
import { CARD, H2, SECTION } from './styles'

/** The goals that make sense as "today's progress" (weight is a trend, skincare a habit count). */
const PROGRESS_KINDS: readonly GoalKind[] = ['water', 'steps', 'sleep', 'workout']

export interface SummaryStripProps {
  entries: readonly Entry[]
  goals: readonly Goal[]
  favouritesCount: number
  savedCount: number
  /** `YYYY-MM-DD` */
  today: string
}

export function SummaryStrip({
  entries,
  goals,
  favouritesCount,
  savedCount,
  today,
}: SummaryStripProps) {
  const { t, lang } = useLang()
  const week = entriesThisWeek(entries, today).length
  const streak = currentStreak(entries, today)
  const longest = longestStreak(entries)
  const figures: ReadonlyArray<[string, string]> = [
    [t.profileEntriesThisWeek, formatNumber(week, lang)],
    [t.profileCurrentStreak, plural(t.profileDays, streak, formatNumber(streak, lang))],
    [t.profileLongestStreak, plural(t.profileDays, longest, formatNumber(longest, lang))],
    [t.profileCollection, formatNumber(favouritesCount + savedCount, lang)],
  ]

  return (
    <section aria-labelledby="profile-summary" className={SECTION}>
      <h2 id="profile-summary" className={H2}>
        {t.profileSummaryHeading}
      </h2>
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {figures.map(([label, value]) => (
          <div key={label} className={CARD}>
            <dt className="text-xs tracking-wide text-olive-700 uppercase">{label}</dt>
            <dd className="font-display text-2xl font-semibold text-olive-950">{value}</dd>
          </div>
        ))}
      </dl>
      <h3 className="text-sm font-medium text-olive-900">{t.profileTodayGoals}</h3>
      <ul className="grid gap-3 sm:grid-cols-2">
        {PROGRESS_KINDS.map((kind) => {
          const label = t.profileKind[kind]
          const goal = goals.find((g) => g.kind === kind)
          if (goal === undefined) {
            return (
              <li key={kind} className="flex justify-between gap-2 text-sm">
                <span className="font-medium text-olive-900">{label}</span>
                <span className="text-olive-700">{t.profileNoGoal}</span>
              </li>
            )
          }
          const progress = goalProgress(entries, goal, today)
          const text = fill(t.profileGoalBar, {
            value: formatNumber(progress.value, lang),
            target: formatNumber(goal.target, lang),
            unit: t.profileGoalUnit[kind],
          })
          return (
            <li key={kind} className="flex flex-col gap-1 text-sm">
              <div className="flex justify-between gap-2">
                <span className="font-medium text-olive-900">{label}</span>
                <span className="text-olive-700">{text}</span>
              </div>
              <div
                role="progressbar"
                aria-label={label}
                aria-valuemin={0}
                aria-valuemax={goal.target}
                aria-valuenow={Math.min(progress.value, goal.target)}
                aria-valuetext={text}
                className="h-2 overflow-hidden rounded-full bg-paper-200"
              >
                <div
                  className="h-full rounded-full bg-sage-500"
                  style={{ width: `${Math.round(progress.ratio * 100)}%` }}
                />
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
