// WORKOUT SESSION RESOLVER — pure domain (PLAN.md §P4.8). Picks the one template for a
// (type, level, intensity) selection and resolves every `exercise_slug` in its blocks to the
// exercise row, grouped warm-up → main → cool-down in `BLOCKS` order. No React, no I/O.
//
// Rules the UI (`/workouts`) relies on:
//   - `templateFor` returns null when no template matches the selection (the seed guarantees one
//     per combination, but a filtered or partially-approved catalogue may not).
//   - `resolveSession` returns null when the template is missing OR any of its slugs does not
//     resolve: a session is rendered whole or not at all, never with a hole in a block.
//   - Every one of the three blocks is present in the result (possibly with zero items), in
//     `BLOCKS` order; within a block the items keep the template's array order (= `position`).

import { BLOCKS } from '../content/enums.ts'
import type { Block, Intensity, Level, WorkoutType } from '../content/enums.ts'
import type { ExerciseSeed, WorkoutTemplateSeed } from '../content/types.ts'

/** One exercise slot with its exercise resolved; the numbers are the template's verbatim. */
export interface SessionItem {
  exercise: ExerciseSeed
  sets: number
  reps: number | null
  seconds: number | null
  rest_seconds: number
}

export interface SessionBlock {
  block: Block
  items: SessionItem[]
}

export interface Session {
  template: WorkoutTemplateSeed
  /** Always `BLOCKS.length` entries, in `BLOCKS` order. */
  blocks: SessionBlock[]
}

/** The template for a selection, or null when the catalogue has none (first match wins). */
export function templateFor(
  templates: readonly WorkoutTemplateSeed[],
  type: WorkoutType,
  level: Level,
  intensity: Intensity,
): WorkoutTemplateSeed | null {
  return (
    templates.find(
      (t) => t.workout_type === type && t.level === level && t.intensity === intensity,
    ) ?? null
  )
}

/**
 * Resolve the session for a selection: the template plus its blocks with every exercise slug
 * replaced by the exercise row. Null when there is no template or any slug is unknown.
 */
export function resolveSession(
  templates: readonly WorkoutTemplateSeed[],
  exercises: readonly ExerciseSeed[],
  type: WorkoutType,
  level: Level,
  intensity: Intensity,
): Session | null {
  const template = templateFor(templates, type, level, intensity)
  if (template === null) return null

  const bySlug = new Map(exercises.map((exercise) => [exercise.slug, exercise]))
  const blocks: SessionBlock[] = BLOCKS.map((block) => ({ block, items: [] }))

  for (const item of template.blocks) {
    const exercise = bySlug.get(item.exercise_slug)
    if (exercise === undefined) return null
    const target = blocks[BLOCKS.indexOf(item.block)]
    if (target === undefined) return null
    target.items.push({
      exercise,
      sets: item.sets,
      reps: item.reps,
      seconds: item.seconds,
      rest_seconds: item.rest_seconds,
    })
  }

  return { template, blocks }
}
