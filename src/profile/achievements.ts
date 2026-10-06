// ACHIEVEMENTS (P8.2) — pure. Badges are COMPUTED from the entries, goals and saved items every
// time the page renders; nothing is stored, so a deleted entry un-earns a badge honestly and a new
// badge definition applies retroactively (DECISIONS 2026-10-06 P8.2). Every badge reports a
// `progress` in 0..1 so the grid can show how far along an unearned one is, and `earnedOn` (the
// `entry_date` that completed it) when the data says. All badges are positive and health-neutral:
// they reward showing up, never a number on the scale.
//
// Task-plan badges (connect the features, 2026-10-06): `tasks-*` count only the entries a task
// plan wrote (`payload.source === 'tasks'`, src/tasks/track.ts) — whatever their kind — so a
// ticked task earns them and a hand-typed entry does not.

import { isTasksEntry } from '../tasks/track'
import type { Entry, EntryKind, Goal, SavedItem } from '../user/source'
import {
  dayNumber,
  entryDays,
  isoFromDay,
  longestRun,
  runReaches,
  sumOnDay,
  weekIndex,
} from './stats'

export const BADGE_IDS = [
  'first-entry',
  'streak-3',
  'streak-7',
  'streak-30',
  'workouts-10',
  'workouts-50',
  'hydration-week',
  'sleep-week',
  'steps-week',
  'weight-4-weeks',
  'skincare-14',
  'nails-4-weeks',
  'mood-7',
  'meals-30',
  'collector-10',
  'all-rounder',
  'tasks-first',
  'tasks-streak-7',
  'tasks-50',
] as const
export type BadgeId = (typeof BADGE_IDS)[number]

export interface Achievement {
  id: BadgeId
  earned: boolean
  /** 0..1; exactly 1 when earned. */
  progress: number
  /** `YYYY-MM-DD` the badge was completed, when the data says. */
  earnedOn?: string
}

export interface AchievementInput {
  entries: readonly Entry[]
  goals: readonly Goal[]
  favouritesCount: number
  savedItems: readonly SavedItem[]
  today: string
}

function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n))
}

function badge(id: BadgeId, have: number, need: number, earnedOn: string | null): Achievement {
  const earned = have >= need
  const result: Achievement = { id, earned, progress: earned ? 1 : clamp01(have / need) }
  if (earned && earnedOn !== null) result.earnedOn = earnedOn
  return result
}

/** The `entry_date` of the n-th entry of `kind` in date order, or null. */
function nthDate(entries: readonly Entry[], kind: EntryKind, n: number): string | null {
  const dates = entries
    .filter((entry) => entry.kind === kind)
    .map((entry) => entry.entry_date)
    .sort()
  return dates.length >= n ? dates[n - 1] : null
}

function countOf(entries: readonly Entry[], kind: EntryKind): number {
  return entries.filter((entry) => entry.kind === kind).length
}

/** Longest run of consecutive days with an entry of `kind`, and the day the run first hit `need`. */
function dayStreak(entries: readonly Entry[], need: number, kind?: EntryKind) {
  const days = entryDays(entries, kind)
  const reached = runReaches(days, need)
  return { have: longestRun(days).length, on: reached === null ? null : isoFromDay(reached) }
}

/** Longest run of consecutive Monday-weeks with an entry of `kind`; `on` = the Sunday that completed it. */
function weekStreak(entries: readonly Entry[], need: number, kind: EntryKind) {
  const weeks = [...new Set(entryDays(entries, kind).map(weekIndex))].sort((a, b) => a - b)
  const reached = runReaches(weeks, need)
  return {
    have: longestRun(weeks).length,
    on: reached === null ? null : isoFromDay(reached * 7 - 3 + 6),
  }
}

/** Consecutive days on which the daily sum of `kind` met the goal target. Weekly goals never qualify. */
function goalStreak(
  entries: readonly Entry[],
  goals: readonly Goal[],
  kind: EntryKind,
  need: number,
) {
  const goal = goals.find((g) => g.kind === kind && g.cadence === 'daily' && g.target > 0)
  if (goal === undefined) return { have: 0, on: null }
  const metDays = entryDays(entries, kind).filter(
    (day) => sumOnDay(entries, kind, isoFromDay(day)) >= goal.target,
  )
  const reached = runReaches(metDays, need)
  return { have: longestRun(metDays).length, on: reached === null ? null : isoFromDay(reached) }
}

export function computeAchievements(input: AchievementInput): Achievement[] {
  const { entries, goals, favouritesCount, savedItems } = input
  const valid = entries.filter((entry) => dayNumber(entry.entry_date) !== null)
  const firstDate = valid.map((e) => e.entry_date).sort()[0] ?? null

  const any3 = dayStreak(valid, 3)
  const any7 = dayStreak(valid, 7)
  const any30 = dayStreak(valid, 30)
  const water = goalStreak(valid, goals, 'water', 7)
  const sleep = goalStreak(valid, goals, 'sleep', 7)
  const steps = goalStreak(valid, goals, 'steps', 7)
  const weight = weekStreak(valid, 4, 'weight')
  const skincare = dayStreak(valid, 14, 'skincare')
  const nails = weekStreak(valid, 4, 'nails')
  const mood = dayStreak(valid, 7, 'mood')
  const kinds = new Set(valid.map((e) => e.kind))
  const collected = favouritesCount + savedItems.length
  const fromTasks = valid.filter(isTasksEntry)
  const taskDates = fromTasks.map((e) => e.entry_date).sort()
  const tasks7 = dayStreak(fromTasks, 7)

  return [
    badge('first-entry', valid.length, 1, firstDate),
    badge('streak-3', any3.have, 3, any3.on),
    badge('streak-7', any7.have, 7, any7.on),
    badge('streak-30', any30.have, 30, any30.on),
    badge('workouts-10', countOf(valid, 'workout'), 10, nthDate(valid, 'workout', 10)),
    badge('workouts-50', countOf(valid, 'workout'), 50, nthDate(valid, 'workout', 50)),
    badge('hydration-week', water.have, 7, water.on),
    badge('sleep-week', sleep.have, 7, sleep.on),
    badge('steps-week', steps.have, 7, steps.on),
    badge('weight-4-weeks', weight.have, 4, weight.on),
    badge('skincare-14', skincare.have, 14, skincare.on),
    badge('nails-4-weeks', nails.have, 4, nails.on),
    badge('mood-7', mood.have, 7, mood.on),
    badge('meals-30', countOf(valid, 'meal'), 30, nthDate(valid, 'meal', 30)),
    badge('collector-10', collected, 10, null),
    badge('all-rounder', kinds.size, 9, null),
    badge('tasks-first', fromTasks.length, 1, taskDates[0] ?? null),
    badge('tasks-streak-7', tasks7.have, 7, tasks7.on),
    badge('tasks-50', fromTasks.length, 50, taskDates[49] ?? null),
  ]
}
