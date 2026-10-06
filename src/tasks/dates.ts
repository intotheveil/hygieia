// TASKS ADVISOR — local calendar helpers (P9). Pure; the page passes `now`. Weeks start on Monday
// (`DAYS` order), dates are LOCAL (a tick made at 23:30 belongs to that evening, not to UTC).

import { DAYS, type Day } from './types'

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

/** `YYYY-MM-DD` in local time. */
export function dateKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** `YYYY-MM` in local time. */
export function monthKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`
}

/** The weekday of a date as a `Day` (Monday = 'mon'). */
export function dayOf(d: Date): Day {
  return DAYS[(d.getDay() + 6) % 7]!
}

/** The seven dates of the Monday-first week containing `now`, at local midnight. */
export function weekDates(now: Date): Record<Day, Date> {
  const offset = (now.getDay() + 6) % 7
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - offset)
  const out = {} as Record<Day, Date>
  DAYS.forEach((day, i) => {
    out[day] = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i)
  })
  return out
}
