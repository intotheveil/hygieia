// PROFILE STATS (P8.2) — pure date arithmetic and the summary figures: streaks, "this week", and
// today's progress against a goal. Dates are `YYYY-MM-DD` strings throughout (the `entry_date`
// column); arithmetic happens on a UTC day number so DST can never make two neighbouring days
// look 23 or 25 hours apart. Weeks start on Monday (the Greek and ISO convention). Nothing here
// touches `Date.now()`: `today` is always an argument, so every figure is reproducible in tests.

import type { Entry, EntryKind, Goal } from '../user/source'

const DAY_MS = 86_400_000
const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/

/** Days since 1970-01-01 (UTC) for a `YYYY-MM-DD` string; `null` when the string is not a real date. */
export function dayNumber(iso: string): number | null {
  const m = ISO_DATE.exec(iso)
  if (m === null) return null
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])]
  const ms = Date.UTC(y, mo - 1, d)
  const date = new Date(ms)
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== mo - 1 || date.getUTCDate() !== d) {
    return null
  }
  return ms / DAY_MS
}

/** The inverse of `dayNumber`. */
export function isoFromDay(day: number): string {
  return new Date(day * DAY_MS).toISOString().slice(0, 10)
}

/** `YYYY-MM-DD` of a Date in the LOCAL calendar (what "today" means to the person at the screen). */
export function localIsoDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function addDays(iso: string, days: number): string {
  const day = dayNumber(iso)
  return day === null ? iso : isoFromDay(day + days)
}

/** Monday-based week index: two dates share it iff they fall in the same Monday–Sunday week. */
export function weekIndex(day: number): number {
  // Day 0 (1970-01-01) was a Thursday; +3 makes Monday 1969-12-29 the start of week 0.
  return Math.floor((day + 3) / 7)
}

/** The Monday of the week containing `iso`. */
export function weekStart(iso: string): string {
  const day = dayNumber(iso)
  if (day === null) return iso
  return isoFromDay(weekIndex(day) * 7 - 3)
}

/** Distinct, ascending day numbers of the entries (optionally only one kind). */
export function entryDays(entries: readonly Entry[], kind?: EntryKind): number[] {
  const days = new Set<number>()
  for (const entry of entries) {
    if (kind !== undefined && entry.kind !== kind) continue
    const day = dayNumber(entry.entry_date)
    if (day !== null) days.add(day)
  }
  return [...days].sort((a, b) => a - b)
}

export interface Run {
  length: number
  /** The last value (day or week index) of the run. */
  end: number
}

/** The longest run of consecutive integers in an ascending, distinct list (`length 0` when empty). */
export function longestRun(values: readonly number[]): Run {
  let best: Run = { length: 0, end: 0 }
  let current: Run = { length: 0, end: 0 }
  for (const value of values) {
    current =
      current.length > 0 && value === current.end + 1
        ? { length: current.length + 1, end: value }
        : { length: 1, end: value }
    if (current.length > best.length) best = current
  }
  return best
}

/**
 * The value at which a run of consecutive integers FIRST reaches `n` (the n-th member of the
 * earliest qualifying run), or `null` when no run is that long.
 */
export function runReaches(values: readonly number[], n: number): number | null {
  let length = 0
  let prev: number | null = null
  for (const value of values) {
    length = prev !== null && value === prev + 1 ? length + 1 : 1
    prev = value
    if (length >= n) return value
  }
  return null
}

/** Consecutive days with ≥ 1 entry ENDING TODAY; 0 when today has none. */
export function currentStreak(entries: readonly Entry[], today: string): number {
  const todayDay = dayNumber(today)
  if (todayDay === null) return 0
  const days = new Set(entryDays(entries))
  let streak = 0
  while (days.has(todayDay - streak)) streak += 1
  return streak
}

export function longestStreak(entries: readonly Entry[]): number {
  return longestRun(entryDays(entries)).length
}

/** Entries dated in the Monday–Sunday week that contains `today`. */
export function entriesThisWeek(entries: readonly Entry[], today: string): Entry[] {
  const todayDay = dayNumber(today)
  if (todayDay === null) return []
  const week = weekIndex(todayDay)
  return entries.filter((entry) => {
    const day = dayNumber(entry.entry_date)
    return day !== null && weekIndex(day) === week
  })
}

/** The sum of `value` over entries of `kind` dated `iso` (null values count 0). */
export function sumOnDay(entries: readonly Entry[], kind: EntryKind, iso: string): number {
  let total = 0
  for (const entry of entries) {
    if (entry.kind === kind && entry.entry_date === iso) total += entry.value ?? 0
  }
  return total
}

/** `entry_date` desc, then `created_at` desc — the order the source promises, re-applied after a local insert. */
export function sortEntries(entries: readonly Entry[]): Entry[] {
  return [...entries].sort(
    (a, b) => b.entry_date.localeCompare(a.entry_date) || b.created_at.localeCompare(a.created_at),
  )
}

export interface DateGroup {
  date: string
  entries: Entry[]
}

/** Groups in first-seen order, so a desc-sorted list yields desc-sorted groups. */
export function groupByDate(entries: readonly Entry[]): DateGroup[] {
  const groups: DateGroup[] = []
  for (const entry of entries) {
    const last = groups[groups.length - 1]
    if (last !== undefined && last.date === entry.entry_date) last.entries.push(entry)
    else groups.push({ date: entry.entry_date, entries: [entry] })
  }
  return groups
}

export interface GoalProgress {
  goal: Goal
  /** The summed value over the goal's period (today, or this week for a weekly goal). */
  value: number
  /** `value / target`, clamped to 0..1. */
  ratio: number
}

/** Today's (or this week's) progress against one goal; counts values of the SAME kind. */
export function goalProgress(entries: readonly Entry[], goal: Goal, today: string): GoalProgress {
  const period: readonly Entry[] =
    goal.cadence === 'weekly'
      ? entriesThisWeek(entries, today)
      : entries.filter((entry) => entry.entry_date === today)
  // A value-less entry (skincare / nails "done today") counts as one session toward its goal.
  let value = 0
  for (const entry of period) if (entry.kind === goal.kind) value += entry.value ?? 1
  const ratio = goal.target > 0 ? Math.min(1, Math.max(0, value / goal.target)) : 0
  return { goal, value, ratio }
}
