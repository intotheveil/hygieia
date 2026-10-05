import { BLOCKS, INTENSITIES, LEVELS, WORKOUT_TYPES } from '../content/enums.ts'
import { EXERCISES } from '../content/seed/exercises.ts'
import { WORKOUT_TEMPLATES } from '../content/seed/workouts.ts'
import type { ExerciseSeed, WorkoutTemplateSeed } from '../content/types.ts'
import { resolveSession, templateFor } from './session.ts'

// --- fixtures (small, hand-written; the real seed is exercised separately below) ------------------

function exercise(slug: string, extra: Partial<ExerciseSeed> = {}): ExerciseSeed {
  return {
    slug,
    workout_type: 'home',
    level: 'beginner',
    muscle_groups: ['core'],
    name_el: `ΕΛ ${slug}`,
    name_en: `EN ${slug}`,
    cue_el: 'Ανάπνεε.',
    cue_en: 'Breathe.',
    equipment_el: null,
    equipment_en: null,
    ...extra,
  }
}

const FIXTURE_EXERCISES: ExerciseSeed[] = [
  exercise('warm-a'),
  exercise('main-a'),
  exercise('main-b'),
  exercise('cool-a'),
]

const FIXTURE_TEMPLATE: WorkoutTemplateSeed = {
  slug: 'home-beginner-low',
  workout_type: 'home',
  level: 'beginner',
  intensity: 'low',
  title_el: 'Σπίτι · Αρχάριο · Χαμηλή ένταση',
  title_en: 'Home · Beginner · Low intensity',
  duration_min: 20,
  notes_el: 'Σημειώσεις.',
  notes_en: 'Notes.',
  blocks: [
    // Deliberately interleaved: cool-down listed before a main item, to prove grouping by block.
    { block: 'warmup', exercise_slug: 'warm-a', sets: 1, reps: null, seconds: 60, rest_seconds: 0 },
    { block: 'main', exercise_slug: 'main-a', sets: 2, reps: 10, seconds: null, rest_seconds: 90 },
    {
      block: 'cooldown',
      exercise_slug: 'cool-a',
      sets: 2,
      reps: null,
      seconds: 30,
      rest_seconds: 0,
    },
    { block: 'main', exercise_slug: 'main-b', sets: 2, reps: null, seconds: 30, rest_seconds: 60 },
  ],
}

describe('templateFor', () => {
  it('returns the template matching (type, level, intensity)', () => {
    expect(templateFor([FIXTURE_TEMPLATE], 'home', 'beginner', 'low')).toBe(FIXTURE_TEMPLATE)
  })

  it('returns null for an unknown combination', () => {
    expect(templateFor([FIXTURE_TEMPLATE], 'home', 'beginner', 'high')).toBeNull()
    expect(templateFor([FIXTURE_TEMPLATE], 'gym', 'beginner', 'low')).toBeNull()
    expect(templateFor([], 'home', 'beginner', 'low')).toBeNull()
  })

  it('finds every one of the 63 seeded combinations', () => {
    for (const type of WORKOUT_TYPES) {
      for (const level of LEVELS) {
        for (const intensity of INTENSITIES) {
          const t = templateFor(WORKOUT_TEMPLATES, type, level, intensity)
          expect(t?.slug, `${type}/${level}/${intensity}`).toBe(`${type}-${level}-${intensity}`)
        }
      }
    }
  })
})

describe('resolveSession', () => {
  it('returns the template with its items carrying the resolved exercise objects', () => {
    const session = resolveSession([FIXTURE_TEMPLATE], FIXTURE_EXERCISES, 'home', 'beginner', 'low')
    expect(session).not.toBeNull()
    if (!session) return
    expect(session.template).toBe(FIXTURE_TEMPLATE)
    const main = session.blocks.find((b) => b.block === 'main')
    expect(main?.items.map((i) => i.exercise.slug)).toEqual(['main-a', 'main-b'])
    expect(main?.items[0]?.exercise).toBe(FIXTURE_EXERCISES[1])
    expect(main?.items[0]).toMatchObject({ sets: 2, reps: 10, seconds: null, rest_seconds: 90 })
    expect(main?.items[1]).toMatchObject({ sets: 2, reps: null, seconds: 30, rest_seconds: 60 })
  })

  it('emits all three blocks in warmup → main → cooldown order, grouping items by block', () => {
    const session = resolveSession([FIXTURE_TEMPLATE], FIXTURE_EXERCISES, 'home', 'beginner', 'low')
    expect(session?.blocks.map((b) => b.block)).toEqual([...BLOCKS])
    expect(session?.blocks.map((b) => b.items.length)).toEqual([1, 2, 1])
    expect(session?.blocks[2]?.items[0]?.exercise.slug).toBe('cool-a')
  })

  it('returns null for an unknown combination', () => {
    expect(
      resolveSession([FIXTURE_TEMPLATE], FIXTURE_EXERCISES, 'home', 'advanced', 'low'),
    ).toBeNull()
    expect(resolveSession([], FIXTURE_EXERCISES, 'home', 'beginner', 'low')).toBeNull()
  })

  it('returns null (never a partial session) when any exercise slug does not resolve', () => {
    const missingMainB = FIXTURE_EXERCISES.filter((e) => e.slug !== 'main-b')
    expect(resolveSession([FIXTURE_TEMPLATE], missingMainB, 'home', 'beginner', 'low')).toBeNull()
    expect(resolveSession([FIXTURE_TEMPLATE], [], 'home', 'beginner', 'low')).toBeNull()
  })

  it('does not mutate the template or the exercise list', () => {
    const templateCopy = structuredClone(FIXTURE_TEMPLATE)
    const exercisesCopy = structuredClone(FIXTURE_EXERCISES)
    resolveSession([FIXTURE_TEMPLATE], FIXTURE_EXERCISES, 'home', 'beginner', 'low')
    expect(FIXTURE_TEMPLATE).toEqual(templateCopy)
    expect(FIXTURE_EXERCISES).toEqual(exercisesCopy)
  })

  it('resolves all 63 seeded combinations against EXERCISES with no unresolved slug', () => {
    let resolved = 0
    for (const type of WORKOUT_TYPES) {
      for (const level of LEVELS) {
        for (const intensity of INTENSITIES) {
          const session = resolveSession(WORKOUT_TEMPLATES, EXERCISES, type, level, intensity)
          expect(session, `${type}/${level}/${intensity}`).not.toBeNull()
          if (!session) continue
          resolved++
          expect(session.template.slug).toBe(`${type}-${level}-${intensity}`)
          expect(session.blocks.map((b) => b.block)).toEqual([...BLOCKS])
          const itemCount = session.blocks.reduce((n, b) => n + b.items.length, 0)
          expect(itemCount, session.template.slug).toBe(session.template.blocks.length)
          for (const block of session.blocks) {
            for (const item of block.items) {
              expect(item.exercise.workout_type, session.template.slug).toBe(type)
            }
          }
        }
      }
    }
    expect(resolved).toBe(63)
  })
})
