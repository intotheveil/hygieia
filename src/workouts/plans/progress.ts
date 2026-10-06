// WORKOUT PROGRESS — pure figures over logged sessions (P8.3). Per exercise: how many sessions it
// was trained in, the best set, the estimated one-rep max (Epley), total volume, and the trend of
// the last eight sessions; across sessions: personal records (PRs) and weekly volume. Computed on
// every render from `listWorkoutSessions()`, never stored (DECISIONS 2026-10-06 P8.3).
//
// Conventions:
//   - Only sets marked DONE count. A set that was planned but not ticked was not performed.
//   - Volume = Σ reps × weight_kg over done sets with a weight (bodyweight sets add 0 kg).
//   - Estimated 1RM (Epley) = w × (1 + reps / 30), only for a set with weight > 0 and reps ≥ 1.
//   - "Chronological" = `performed_at` ascending, then `created_at` ascending.
//   - A PR needs history: the first session of an exercise sets the baseline and is never a PR.
//     Ties are not records (strictly greater only).

import { addDays, weekStart } from '../../profile/stats'
import type { WorkoutSession, WorkoutSet } from '../../user/source'

/** Epley's estimated one-rep max; null when the set has no load or no reps. */
export function epley(weightKg: number | null, reps: number): number | null {
  if (weightKg === null || weightKg <= 0 || reps < 1) return null
  return weightKg * (1 + reps / 30)
}

export function chronological(sessions: readonly WorkoutSession[]): WorkoutSession[] {
  return [...sessions].sort(
    (a, b) =>
      a.performed_at.localeCompare(b.performed_at) || a.created_at.localeCompare(b.created_at),
  )
}

/** The DONE sets of one exercise in one session (an exercise may appear in several slots). */
export function doneSets(session: WorkoutSession, exerciseId: string): WorkoutSet[] {
  return session.exercises
    .filter((e) => e.exercise_id === exerciseId)
    .flatMap((e) => e.sets.filter((s) => s.done))
}

export function setVolume(set: WorkoutSet): number {
  return set.done && set.weight_kg !== null ? set.reps * set.weight_kg : 0
}

export interface SessionSummary {
  exercises: number
  doneSets: number
  totalSets: number
  volume: number
}

export function summarizeSession(session: WorkoutSession): SessionSummary {
  const ids = new Set(session.exercises.map((e) => e.exercise_id))
  let done = 0
  let total = 0
  let volume = 0
  for (const exercise of session.exercises) {
    for (const set of exercise.sets) {
      total += 1
      if (set.done) done += 1
      volume += setVolume(set)
    }
  }
  return { exercises: ids.size, doneSets: done, totalSets: total, volume }
}

export interface BestSet {
  reps: number
  weight_kg: number | null
  e1rm: number | null
  performed_at: string
}

export interface TrendPoint {
  session_id: string
  date: string
  /** The session's best estimated 1RM for the exercise. */
  e1rm: number | null
  topWeight: number | null
  bestReps: number
  volume: number
}

export interface ExerciseProgress {
  exercise_id: string
  /** Sessions with at least one done set of the exercise. */
  sessions: number
  bestSet: BestSet | null
  bestE1rm: number | null
  totalVolume: number
  /** The last `trendSize` sessions of the exercise, oldest first. */
  trend: TrendPoint[]
}

/** Heavier wins; at the same weight (bodyweight = 0) more reps win. */
function better(a: { reps: number; weight_kg: number | null }, b: BestSet | null): boolean {
  if (b === null) return true
  const wa = a.weight_kg ?? 0
  const wb = b.weight_kg ?? 0
  return wa > wb || (wa === wb && a.reps > b.reps)
}

export function exerciseProgress(
  sessions: readonly WorkoutSession[],
  exerciseId: string,
  trendSize = 8,
): ExerciseProgress {
  let bestSet: BestSet | null = null
  let bestE1rm: number | null = null
  let totalVolume = 0
  const points: TrendPoint[] = []

  for (const session of chronological(sessions)) {
    const sets = doneSets(session, exerciseId)
    if (sets.length === 0) continue
    let e1rm: number | null = null
    let topWeight: number | null = null
    let bestReps = 0
    let volume = 0
    for (const set of sets) {
      volume += setVolume(set)
      bestReps = Math.max(bestReps, set.reps)
      if (set.weight_kg !== null) topWeight = Math.max(topWeight ?? 0, set.weight_kg)
      const est = epley(set.weight_kg, set.reps)
      if (est !== null) e1rm = Math.max(e1rm ?? 0, est)
      if (better(set, bestSet)) {
        bestSet = {
          reps: set.reps,
          weight_kg: set.weight_kg,
          e1rm: est,
          performed_at: session.performed_at,
        }
      }
    }
    if (e1rm !== null) bestE1rm = Math.max(bestE1rm ?? 0, e1rm)
    totalVolume += volume
    points.push({
      session_id: session.id,
      date: session.performed_at,
      e1rm,
      topWeight,
      bestReps,
      volume,
    })
  }

  return {
    exercise_id: exerciseId,
    sessions: points.length,
    bestSet,
    bestE1rm,
    totalVolume,
    trend: points.slice(-trendSize),
  }
}

export type PersonalRecordKind = 'weight' | 'e1rm' | 'reps'

export interface PersonalRecord {
  exercise_id: string
  kind: PersonalRecordKind
  /** kg for `weight` / `e1rm`, a rep count for `reps`. */
  value: number
  /** For `reps`: the weight the reps were done at (null = bodyweight). */
  weight_kg: number | null
}

interface RunningBest {
  weight: number
  e1rm: number
  /** Most reps ever done at a weight, keyed by `String(weight_kg)` ("null" = bodyweight). */
  repsAt: Map<string, number>
}

/**
 * The PRs each session set, keyed by session id (sessions with none are absent). Per exercise and
 * session at most one record of each kind: a new heaviest weight, a new best estimated 1RM, and
 * more reps than ever before at a weight already done (the heaviest such weight is reported).
 */
export function detectPRs(sessions: readonly WorkoutSession[]): Map<string, PersonalRecord[]> {
  const best = new Map<string, RunningBest>()
  const out = new Map<string, PersonalRecord[]>()

  for (const session of chronological(sessions)) {
    const ids = [...new Set(session.exercises.map((e) => e.exercise_id))]
    const records: PersonalRecord[] = []
    for (const id of ids) {
      const sets = doneSets(session, id)
      if (sets.length === 0) continue
      let maxWeight = 0
      let maxE1rm = 0
      const repsAt = new Map<string, { reps: number; weight: number | null }>()
      for (const set of sets) {
        maxWeight = Math.max(maxWeight, set.weight_kg ?? 0)
        maxE1rm = Math.max(maxE1rm, epley(set.weight_kg, set.reps) ?? 0)
        const key = String(set.weight_kg)
        const seen = repsAt.get(key)
        if (seen === undefined || set.reps > seen.reps) {
          repsAt.set(key, { reps: set.reps, weight: set.weight_kg })
        }
      }

      const prior = best.get(id)
      if (prior !== undefined) {
        if (maxWeight > prior.weight) {
          records.push({ exercise_id: id, kind: 'weight', value: maxWeight, weight_kg: maxWeight })
        }
        if (maxE1rm > prior.e1rm) {
          records.push({ exercise_id: id, kind: 'e1rm', value: maxE1rm, weight_kg: null })
        }
        let repsRecord: PersonalRecord | null = null
        for (const [key, { reps, weight }] of repsAt) {
          const before = prior.repsAt.get(key)
          if (before === undefined || reps <= before) continue
          if (repsRecord === null || (weight ?? 0) > (repsRecord.weight_kg ?? 0)) {
            repsRecord = { exercise_id: id, kind: 'reps', value: reps, weight_kg: weight }
          }
        }
        if (repsRecord !== null) records.push(repsRecord)
      }

      const next: RunningBest = prior ?? { weight: 0, e1rm: 0, repsAt: new Map() }
      next.weight = Math.max(next.weight, maxWeight)
      next.e1rm = Math.max(next.e1rm, maxE1rm)
      for (const [key, { reps }] of repsAt) {
        next.repsAt.set(key, Math.max(next.repsAt.get(key) ?? 0, reps))
      }
      best.set(id, next)
    }
    if (records.length > 0) out.set(session.id, records)
  }
  return out
}

export interface WeekVolume {
  /** Monday `YYYY-MM-DD`. */
  weekStart: string
  volume: number
  sessions: number
}

/** Total volume per Monday-week for the `weeks` weeks ending with the week of `today`, oldest first. */
export function weeklyVolume(
  sessions: readonly WorkoutSession[],
  today: string,
  weeks = 8,
): WeekVolume[] {
  const current = weekStart(today)
  const buckets: WeekVolume[] = Array.from({ length: weeks }, (_, i) => ({
    weekStart: addDays(current, -7 * (weeks - 1 - i)),
    volume: 0,
    sessions: 0,
  }))
  const byStart = new Map(buckets.map((b) => [b.weekStart, b]))
  for (const session of sessions) {
    const bucket = byStart.get(weekStart(session.performed_at))
    if (bucket === undefined) continue
    bucket.sessions += 1
    bucket.volume += summarizeSession(session).volume
  }
  return buckets
}

/** Exercise ids with at least one done set, most-trained first (ties: first seen first). */
export function trainedExercises(sessions: readonly WorkoutSession[]): string[] {
  const counts = new Map<string, number>()
  for (const session of chronological(sessions)) {
    const ids = new Set(
      session.exercises.filter((e) => e.sets.some((s) => s.done)).map((e) => e.exercise_id),
    )
    for (const id of ids) counts.set(id, (counts.get(id) ?? 0) + 1)
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([id]) => id)
}
