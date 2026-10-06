// Test fixtures for the P8.3 workout-plan modules: a small hand-built template (two rep-based
// exercises in the main block, one seconds-based cool-down) and session / plan builders. Imported
// by tests only; never by app code.

import type { Exercise, WorkoutTemplate } from '../../content/source.ts'
import type { WorkoutPlan, WorkoutSession, WorkoutSet } from '../../user/source'

export function exercise(id: string, en: string, el: string): Exercise {
  return {
    id,
    slug: id,
    status: 'approved',
    name_en: en,
    name_el: el,
    cue_en: `${en} cue`,
    cue_el: `${el} οδηγία`,
    equipment_en: null,
    equipment_el: null,
    workout_type: 'gym',
    level: 'beginner',
    muscle_groups: [],
  }
}

export const SQUAT = exercise('ex-squat', 'Back squat', 'Καθίσματα με μπάρα')
export const PRESS = exercise('ex-press', 'Bench press', 'Πιέσεις πάγκου')
export const STRETCH = exercise('ex-stretch', 'Hamstring stretch', 'Διάταση οπίσθιων μηριαίων')

export const TEMPLATE: WorkoutTemplate = {
  id: 'tpl-gym',
  slug: 'gym-beginner-moderate',
  status: 'approved',
  workout_type: 'gym',
  level: 'beginner',
  intensity: 'moderate',
  duration_min: 45,
  title_en: 'Gym strength basics',
  title_el: 'Βασική δύναμη στο γυμναστήριο',
  notes_en: 'Notes',
  notes_el: 'Σημειώσεις',
  blocks: [],
  slots: [
    {
      block: {
        block: 'main',
        exercise_slug: 'ex-squat',
        sets: 3,
        reps: 8,
        seconds: null,
        rest_seconds: 90,
      },
      exercise: SQUAT,
    },
    {
      block: {
        block: 'main',
        exercise_slug: 'ex-press',
        sets: 2,
        reps: 10,
        seconds: null,
        rest_seconds: 0,
      },
      exercise: PRESS,
    },
    {
      block: {
        block: 'cooldown',
        exercise_slug: 'ex-stretch',
        sets: 1,
        reps: null,
        seconds: 40,
        rest_seconds: 0,
      },
      exercise: STRETCH,
    },
  ],
}

export function set(reps: number, weight_kg: number | null = null, done = true): WorkoutSet {
  return { reps, weight_kg, rpe: null, done }
}

let seq = 0
export function session(
  performed_at: string,
  exercises: WorkoutSession['exercises'],
  extra: Partial<WorkoutSession> = {},
): WorkoutSession {
  seq += 1
  return {
    id: `s${seq}`,
    plan_id: null,
    template_id: TEMPLATE.id,
    performed_at,
    duration_min: 45,
    exercises,
    note: null,
    created_at: `${performed_at}T10:00:${String(seq % 60).padStart(2, '0')}.000Z`,
    ...extra,
  }
}

export function plan(extra: Partial<WorkoutPlan> = {}): WorkoutPlan {
  return {
    id: 'plan-1',
    template_id: TEMPLATE.id,
    name: 'Autumn strength',
    weeks: 4,
    days_per_week: 3,
    start_date: '2026-10-01',
    status: 'active',
    created_at: '2026-10-01T08:00:00.000Z',
    updated_at: '2026-10-01T08:00:00.000Z',
    ...extra,
  }
}
