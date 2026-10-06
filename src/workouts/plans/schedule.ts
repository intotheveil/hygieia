// PLAN SCHEDULE — pure (P8.3). A plan is `weeks` × `days_per_week` training slots starting on
// `start_date`; plan week N covers start + 7N … start + 7N + 6 (plan weeks, not calendar weeks, so a
// plan started on a Thursday has Thursday-to-Wednesday weeks). The sessions logged ON the plan fill
// that week's cells in order; extra sessions in a week beyond `days_per_week` are counted but cannot
// fill more cells than the week has. A session dated before the start counts in week 1, after the
// end in the last week (a late log still belongs to the plan it was logged on).

import { addDays, dayNumber } from '../../profile/stats'
import type { WorkoutPlan, WorkoutSession } from '../../user/source'

export interface PlanWeek {
  /** 0-based. */
  index: number
  start: string
  end: string
  /** Sessions of the plan in this week, oldest first. */
  sessions: WorkoutSession[]
  /** Cells filled: min(sessions, days_per_week). */
  filled: number
  current: boolean
}

export interface PlanSchedule {
  weeks: PlanWeek[]
  /** Σ filled over all weeks. */
  done: number
  /** weeks × days_per_week. */
  total: number
  /** 0..100, whole number. */
  percent: number
  /** 0-based index of the week containing `today`, or null before the start / after the end. */
  currentWeek: number | null
  /** The last day of the plan. */
  endDate: string
  /** Sessions logged in the current plan week (0 outside the plan's dates). */
  thisWeek: number
}

export function planSchedule(
  plan: WorkoutPlan,
  sessions: readonly WorkoutSession[],
  today: string,
): PlanSchedule {
  const startDay = dayNumber(plan.start_date) ?? 0
  const todayDay = dayNumber(today)
  const weekCount = Math.max(1, plan.weeks)
  const perWeek = Math.max(1, plan.days_per_week)
  const offset = todayDay === null ? -1 : todayDay - startDay
  const currentWeek =
    offset >= 0 && Math.floor(offset / 7) < weekCount ? Math.floor(offset / 7) : null

  const weeks: PlanWeek[] = Array.from({ length: weekCount }, (_, index) => ({
    index,
    start: addDays(plan.start_date, index * 7),
    end: addDays(plan.start_date, index * 7 + 6),
    sessions: [],
    filled: 0,
    current: index === currentWeek,
  }))

  const own = sessions
    .filter((s) => s.plan_id === plan.id)
    .sort(
      (a, b) =>
        a.performed_at.localeCompare(b.performed_at) || a.created_at.localeCompare(b.created_at),
    )
  for (const session of own) {
    const day = dayNumber(session.performed_at) ?? startDay
    const index = Math.min(weekCount - 1, Math.max(0, Math.floor((day - startDay) / 7)))
    weeks[index]?.sessions.push(session)
  }

  let done = 0
  for (const week of weeks) {
    week.filled = Math.min(perWeek, week.sessions.length)
    done += week.filled
  }
  const total = weekCount * perWeek
  return {
    weeks,
    done,
    total,
    percent: Math.round((done / total) * 100),
    currentWeek,
    endDate: addDays(plan.start_date, weekCount * 7 - 1),
    thisWeek: currentWeek === null ? 0 : (weeks[currentWeek]?.sessions.length ?? 0),
  }
}
