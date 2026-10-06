// TASKS ADVISOR — the plan generator (P9). Pure and deterministic: the same topic and answers give
// the same plan, byte for byte (no clock, no randomness, every tie broken by id). Steps:
//
// 1. ELIGIBLE — keep the tasks whose `when` matches the answers (every listed question has at least
//    one selected option in the list; empty `when` = always). Kick-off tasks only on a gentle start.
// 2. BUDGET — the minutes a day from the one question whose options carry `minutes` (default 30).
//    A GENTLE start (any chosen option flagged `gentle`, e.g. a chaotic home or a beginner) plans
//    week 1 at ~70 % of it, rounded to 5 minutes, never under 10.
// 3. ANCHORS — tasks of weight >= 6 are the topic's core (a workout session, a study block) and
//    are placed first, daily or weekly, with the whole budget available to them.
// 4. DAILY — highest weight first (then shorter, then id) into at most a THIRD of the budget, so
//    the weekly jobs keep room.
// 5. THE REST — remaining daily and weekly tasks in ONE pass by weight (weekly first among equals),
//    so a weight-4 habit beats a weight-2 chore. Weekly: kick-off first, then longer first; a task
//    that repeats `times` a week takes a spaced pattern (Mon/Thu, Mon/Wed/Fri…) rotated onto the
//    least-loaded days that still fit; a `day` hint wins when it fits; if no rotation fits, it
//    tries one time fewer, down to once; at most MAX_WEEKLY_PER_DAY jobs (anchors aside) a day.
//    A daily task joins only if it still fits on the busiest day.
// 6. MONTHLY — by weight, each ≤ the user's full budget (it takes a day's slot), at most 6.
//
// Invariant: every day's load (daily + that day's weekly minutes) is ≤ the plan budget; a task that
// fits nowhere is left out rather than squeezed in.

import { DAYS, type Answers, type Day, type Task, type Topic, type When } from './types'

export const DEFAULT_BUDGET = 30
export const GENTLE_FACTOR = 0.7
export const MAX_DAILY = 8
export const MAX_MONTHLY = 6
/** Tasks at or above this weight are the topic's core (a workout session, a study block): placed first. */
export const ANCHOR_WEIGHT = 6
/** The share of the budget daily habits may take before the weekly jobs are placed. */
export const DAILY_SHARE = 1 / 3
/** At most this many weekly jobs (anchors aside) on one day, so a day is never a wall of chores. */
export const MAX_WEEKLY_PER_DAY = 2

export interface Plan {
  readonly topicId: string
  /** Week 1 is lighter and carries the kick-off tasks. */
  readonly gentle: boolean
  /** The minutes a day the user chose. */
  readonly fullBudget: number
  /** The minutes a day this plan fits into (= fullBudget unless gentle). */
  readonly budget: number
  readonly daily: readonly Task[]
  readonly weekly: Readonly<Record<Day, readonly Task[]>>
  readonly monthly: readonly Task[]
  /** Minutes planned per day: daily tasks + that day's weekly tasks. */
  readonly load: Readonly<Record<Day, number>>
}

export function matches(when: When, answers: Answers): boolean {
  return Object.entries(when).every(([questionId, optionIds]) => {
    const chosen = answers[questionId] ?? []
    return chosen.some((id) => optionIds.includes(id))
  })
}

/** Drop unknown questions/options, keep at most one answer for a single-choice question. */
export function normalizeAnswers(topic: Topic, raw: Answers): Record<string, string[]> {
  const out: Record<string, string[]> = {}
  for (const q of topic.questions) {
    const given = raw[q.id]
    if (!Array.isArray(given)) continue
    const valid = q.options.map((o) => o.id).filter((id) => given.includes(id))
    out[q.id] = q.kind === 'single' ? valid.slice(0, 1) : valid
  }
  return out
}

/** Every single-choice question answered (multi-choice may be empty). */
export function isComplete(topic: Topic, answers: Answers): boolean {
  return topic.questions.every((q) => q.kind === 'multi' || (answers[q.id]?.length ?? 0) === 1)
}

export function budgetOf(topic: Topic, answers: Answers): number {
  for (const q of topic.questions) {
    if (!q.options.some((o) => o.minutes !== undefined)) continue
    const chosen = q.options.find((o) => (answers[q.id] ?? []).includes(o.id))
    if (chosen?.minutes !== undefined) return chosen.minutes
  }
  return DEFAULT_BUDGET
}

export function isGentle(topic: Topic, answers: Answers): boolean {
  return topic.questions.some((q) =>
    q.options.some((o) => o.gentle === true && (answers[q.id] ?? []).includes(o.id)),
  )
}

/** ~70 % of the budget, rounded to 5 minutes, never under 10 (or the full budget if that is less). */
export function gentleBudget(full: number): number {
  return Math.min(full, Math.max(10, Math.round((full * GENTLE_FACTOR) / 5) * 5))
}

function byId(a: Task, b: Task): number {
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0
}

/** Weight desc, then shorter first, then id — a total order, so the plan is deterministic. */
export function byRank(a: Task, b: Task): number {
  if (a.weight !== b.weight) return b.weight - a.weight
  if (a.minutes !== b.minutes) return a.minutes - b.minutes
  return byId(a, b)
}

/**
 * Weekly order: weight desc, kick-off first among equals, then LONGER first ("big rocks first": a
 * 25-minute bathroom clean placed after five 5-minute jobs would find every day already full),
 * then id.
 */
export function byWeeklyRank(a: Task, b: Task): number {
  if (a.weight !== b.weight) return b.weight - a.weight
  const ka = a.kickoff === true ? 0 : 1
  const kb = b.kickoff === true ? 0 : 1
  if (ka !== kb) return ka - kb
  if (a.minutes !== b.minutes) return b.minutes - a.minutes
  return byId(a, b)
}

/** Day indexes for a task repeated `times` a week, before rotation: spread as evenly as possible. */
export function spacedPattern(times: number): number[] {
  const n = Math.min(7, Math.max(1, Math.floor(times)))
  return Array.from({ length: n }, (_, i) => Math.floor((i * 7) / n))
}

function emptyWeek<T>(make: () => T): Record<Day, T> {
  return {
    mon: make(),
    tue: make(),
    wed: make(),
    thu: make(),
    fri: make(),
    sat: make(),
    sun: make(),
  }
}

interface Slot {
  days: number[]
  worst: number
  sum: number
}

/** The best rotation of `pattern` for a task of `minutes`, or null if none fits the budget. */
function bestSlot(
  pattern: readonly number[],
  minutes: number,
  hint: number,
  load: Readonly<Record<Day, number>>,
  budget: number,
  open: (day: Day) => boolean,
): Slot | null {
  let best: Slot | null = null
  for (let r = 0; r < 7; r++) {
    const days = pattern.map((i) => (i + r) % 7)
    if (!days.every((d) => open(DAYS[d]!))) continue
    const after = days.map((d) => load[DAYS[d]!] + minutes)
    if (after.some((m) => m > budget)) continue
    const candidate = { days, worst: Math.max(...after), sum: after.reduce((s, m) => s + m, 0) }
    if (hint >= 0 && days[0] === hint) return candidate
    if (
      best === null ||
      candidate.worst < best.worst ||
      (candidate.worst === best.worst && candidate.sum < best.sum)
    ) {
      best = candidate
    }
  }
  return best
}

export function generatePlan(topic: Topic, rawAnswers: Answers): Plan {
  const answers = normalizeAnswers(topic, rawAnswers)
  const gentle = isGentle(topic, answers)
  const fullBudget = budgetOf(topic, answers)
  const budget = gentle ? gentleBudget(fullBudget) : fullBudget

  const eligible = topic.tasks.filter(
    (t) => matches(t.when, answers) && (t.kickoff !== true || gentle),
  )
  const isAnchor = (t: Task) => t.weight >= ANCHOR_WEIGHT && t.cadence !== 'monthly'
  const anchors = eligible.filter(isAnchor).sort(byWeeklyRank)
  const dailyPool = eligible.filter((t) => t.cadence === 'daily' && !isAnchor(t)).sort(byRank)
  const weeklyPool = eligible
    .filter((t) => t.cadence === 'weekly' && !isAnchor(t))
    .sort(byWeeklyRank)
  const monthlyPool = eligible.filter((t) => t.cadence === 'monthly').sort(byRank)

  const daily: Task[] = []
  const weekly = emptyWeek<Task[]>(() => [])
  const load = emptyWeek<number>(() => 0)
  const busiest = () => Math.max(...DAYS.map((d) => load[d]))
  const dailySum = () => daily.reduce((s, t) => s + t.minutes, 0)

  const addDaily = (t: Task, cap: number): void => {
    if (daily.length >= MAX_DAILY) return
    if (dailySum() + t.minutes > cap || busiest() + t.minutes > budget) return
    daily.push(t)
    for (const d of DAYS) load[d] += t.minutes
  }
  const jobs = emptyWeek<number>(() => 0)
  const addWeekly = (t: Task, capped: boolean): void => {
    const hint = t.day ? DAYS.indexOf(t.day) : -1
    const open = (day: Day) => !capped || jobs[day] < MAX_WEEKLY_PER_DAY
    let slot: Slot | null = null
    for (let n = Math.min(7, Math.max(1, t.times ?? 1)); n >= 1 && slot === null; n--) {
      slot = bestSlot(spacedPattern(n), t.minutes, hint, load, budget, open)
    }
    if (slot === null) return
    for (const d of slot.days) {
      const day = DAYS[d]!
      weekly[day].push(t)
      load[day] += t.minutes
      if (capped) jobs[day] += 1
    }
  }

  // 3. anchors: the topic's core tasks, before anything else
  for (const t of anchors) {
    if (t.cadence === 'daily') addDaily(t, budget)
    else addWeekly(t, false)
  }
  // 4. daily habits into a third of the budget, so the weekly jobs keep room
  const share = Math.floor(budget * DAILY_SHARE)
  for (const t of dailyPool) addDaily(t, share)
  // 5. everything else by weight, whatever its cadence (weekly first among equals: the daily
  //    habits of that weight already had their turn in step 4)
  const rest = [...weeklyPool, ...dailyPool.filter((t) => !daily.includes(t))].sort((a, b) =>
    a.weight !== b.weight
      ? b.weight - a.weight
      : a.cadence !== b.cadence
        ? a.cadence === 'weekly'
          ? -1
          : 1
        : a.cadence === 'weekly'
          ? byWeeklyRank(a, b)
          : byRank(a, b),
  )
  for (const t of rest) {
    if (t.cadence === 'daily') addDaily(t, budget)
    else addWeekly(t, true)
  }
  daily.sort(byRank)

  // 6. monthly
  const monthly = monthlyPool.filter((t) => t.minutes <= fullBudget).slice(0, MAX_MONTHLY)

  return { topicId: topic.id, gentle, fullBudget, budget, daily, weekly, monthly, load }
}

/** True when the plan has something to do on at least one day. */
export function hasWork(plan: Plan): boolean {
  return plan.daily.length > 0 || DAYS.some((d) => plan.weekly[d].length > 0)
}

/** How many times a week a task landed in the plan (0 if dropped). */
export function timesPlanned(plan: Plan, taskId: string): number {
  return DAYS.filter((d) => plan.weekly[d].some((t) => t.id === taskId)).length
}
