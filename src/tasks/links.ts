// TASK PLAN → WORKOUT PLAN (connect the features, 2026-10-06) — pure. The workout-routine topic's
// plan offers "Turn this into a workout plan →": `/workouts/plans?type=&level=&intensity=` from the
// questionnaire answers, which the plan builder there pre-selects (signed in; signed out the page
// shows its sign-in note). The mapping:
//   place    home → home · gym → gym · outdoors → running (the outdoor session is a walk/jog)
//   level    new / returning → beginner · regular → intermediate
//   intensity a gentle start (new / returning) → low · regular → moderate

import type { Intensity, Level, WorkoutType } from '../content/enums.ts'
import type { Answers } from './types'

export const WORKOUT_TOPIC = 'workout-routine'

const PLACE_TYPE: Readonly<Record<string, WorkoutType>> = {
  home: 'home',
  gym: 'gym',
  outdoors: 'running',
}

export interface WorkoutCell {
  type: WorkoutType
  level: Level
  intensity: Intensity
}

export function workoutCellFor(answers: Answers): WorkoutCell {
  const place = answers.place?.[0] ?? 'home'
  const level = answers.level?.[0] ?? 'new'
  const regular = level === 'regular'
  return {
    type: PLACE_TYPE[place] ?? 'home',
    level: regular ? 'intermediate' : 'beginner',
    intensity: regular ? 'moderate' : 'low',
  }
}

export function workoutPlanLink(answers: Answers): string {
  const cell = workoutCellFor(answers)
  const params = new URLSearchParams({
    type: cell.type,
    level: cell.level,
    intensity: cell.intensity,
  })
  return `/workouts/plans?${params.toString()}`
}
