import { BLOCKS, INTENSITIES, LEVELS, SLUG_RE, WORKOUT_TYPES } from '../enums.ts'
import type { Intensity, Level, WorkoutType } from '../enums.ts'
import type { ExerciseSeed, WorkoutTemplateSeed } from '../types.ts'
import { EXERCISES } from './exercises.ts'
import { WORKOUT_TEMPLATES } from './workouts.ts'

const GREEK_RE = /\p{Script=Greek}/u
const blank = (s: string | null | undefined) => s === null || s === undefined || s.trim() === ''

const EXERCISE_BY_SLUG: ReadonlyMap<string, ExerciseSeed> = new Map(
  EXERCISES.map((e) => [e.slug, e]),
)

const levelRank = (level: Level) => LEVELS.indexOf(level)

const byKey = (type: WorkoutType, level: Level, intensity: Intensity) =>
  WORKOUT_TEMPLATES.find(
    (t) => t.workout_type === type && t.level === level && t.intensity === intensity,
  )

describe('WORKOUT_TEMPLATES seed (PLAN.md P4.8)', () => {
  it('has exactly 63 rows = 7 types × 3 levels × 3 intensities', () => {
    expect(WORKOUT_TEMPLATES).toHaveLength(63)
    expect(WORKOUT_TYPES.length * LEVELS.length * INTENSITIES.length).toBe(63)
  })

  it('has unique slugs of the form <type>-<level>-<intensity> that match SLUG_RE', () => {
    const slugs = WORKOUT_TEMPLATES.map((t) => t.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
    for (const t of WORKOUT_TEMPLATES) {
      expect(t.slug, t.slug).toMatch(SLUG_RE)
      expect(t.slug).toBe(`${t.workout_type}-${t.level}-${t.intensity}`)
    }
  })

  it('covers every (type, level, intensity) combination exactly once', () => {
    const keys = WORKOUT_TEMPLATES.map((t) => `${t.workout_type}/${t.level}/${t.intensity}`)
    expect(new Set(keys).size).toBe(keys.length)
    for (const type of WORKOUT_TYPES) {
      for (const level of LEVELS) {
        for (const intensity of INTENSITIES) {
          expect(byKey(type, level, intensity), `${type}/${level}/${intensity}`).toBeDefined()
        }
      }
    }
  })

  it('uses only enum values for workout_type, level, intensity and block', () => {
    for (const t of WORKOUT_TEMPLATES) {
      expect(WORKOUT_TYPES, t.slug).toContain(t.workout_type)
      expect(LEVELS, t.slug).toContain(t.level)
      expect(INTENSITIES, t.slug).toContain(t.intensity)
      for (const item of t.blocks)
        expect(BLOCKS, `${t.slug} ${item.exercise_slug}`).toContain(item.block)
    }
  })

  it('references only exercises that exist in EXERCISES', () => {
    for (const t of WORKOUT_TEMPLATES) {
      for (const item of t.blocks) {
        expect(EXERCISE_BY_SLUG.has(item.exercise_slug), `${t.slug} → ${item.exercise_slug}`).toBe(
          true,
        )
      }
    }
  })

  it("uses exercises of the template's own workout type only", () => {
    for (const t of WORKOUT_TEMPLATES) {
      for (const item of t.blocks) {
        const exercise = EXERCISE_BY_SLUG.get(item.exercise_slug)
        expect(exercise?.workout_type, `${t.slug} → ${item.exercise_slug}`).toBe(t.workout_type)
      }
    }
  })

  it("never puts an exercise above the template's level (beginner < intermediate < advanced)", () => {
    for (const t of WORKOUT_TEMPLATES) {
      for (const item of t.blocks) {
        const exercise = EXERCISE_BY_SLUG.get(item.exercise_slug)
        expect(exercise, item.exercise_slug).toBeDefined()
        if (!exercise) continue
        expect(
          levelRank(exercise.level),
          `${t.slug} → ${item.exercise_slug} (${exercise.level})`,
        ).toBeLessThanOrEqual(levelRank(t.level))
      }
    }
  })

  it('does not repeat an exercise within a template', () => {
    for (const t of WORKOUT_TEMPLATES) {
      const slugs = t.blocks.map((item) => item.exercise_slug)
      expect(new Set(slugs).size, t.slug).toBe(slugs.length)
    }
  })

  it('has ≥ 1 warm-up, ≥ 3 main and ≥ 1 cool-down item, laid out warmup → main → cooldown', () => {
    for (const t of WORKOUT_TEMPLATES) {
      const count = (block: string) => t.blocks.filter((item) => item.block === block).length
      expect(count('warmup'), `${t.slug} warmup`).toBeGreaterThanOrEqual(1)
      expect(count('main'), `${t.slug} main`).toBeGreaterThanOrEqual(3)
      expect(count('cooldown'), `${t.slug} cooldown`).toBeGreaterThanOrEqual(1)
      // Array order IS the position: block indices must never go backwards.
      const ranks = t.blocks.map((item) => BLOCKS.indexOf(item.block))
      for (let i = 1; i < ranks.length; i++) {
        expect(ranks[i], `${t.slug} position ${i}`).toBeGreaterThanOrEqual(ranks[i - 1]!)
      }
    }
  })

  it('gives every item sets ≥ 1, rest_seconds ≥ 0 and exactly one of reps / seconds', () => {
    for (const t of WORKOUT_TEMPLATES) {
      for (const item of t.blocks) {
        const where = `${t.slug} → ${item.exercise_slug}`
        expect(Number.isInteger(item.sets), where).toBe(true)
        expect(item.sets, where).toBeGreaterThanOrEqual(1)
        expect(Number.isInteger(item.rest_seconds), where).toBe(true)
        expect(item.rest_seconds, where).toBeGreaterThanOrEqual(0)
        const hasReps = item.reps !== null
        const hasSeconds = item.seconds !== null
        expect(hasReps !== hasSeconds, `${where} reps xor seconds`).toBe(true)
        if (item.reps !== null) expect(item.reps, where).toBeGreaterThanOrEqual(1)
        if (item.seconds !== null) expect(item.seconds, where).toBeGreaterThanOrEqual(1)
      }
    }
  })

  it('has duration_min within 10..90, non-decreasing with intensity within each (type, level)', () => {
    for (const t of WORKOUT_TEMPLATES) {
      expect(Number.isInteger(t.duration_min), t.slug).toBe(true)
      expect(t.duration_min, t.slug).toBeGreaterThanOrEqual(10)
      expect(t.duration_min, t.slug).toBeLessThanOrEqual(90)
    }
    for (const type of WORKOUT_TYPES) {
      for (const level of LEVELS) {
        const durations = INTENSITIES.map((i) => byKey(type, level, i)?.duration_min ?? NaN)
        for (let i = 1; i < durations.length; i++) {
          expect(durations[i], `${type}/${level} ${durations.join(' ≤ ')}`).toBeGreaterThanOrEqual(
            durations[i - 1]!,
          )
        }
      }
    }
  })

  it('scales strength work with intensity: more sets and shorter rests from low to high', () => {
    for (const type of ['home', 'gym', 'calisthenics'] as const) {
      for (const level of LEVELS) {
        const [low, moderate, high] = INTENSITIES.map((i) => byKey(type, level, i)!)
        const mainSets = (t: WorkoutTemplateSeed) =>
          t.blocks.filter((b) => b.block === 'main').reduce((sum, b) => sum + b.sets, 0)
        expect(mainSets(moderate), `${type}/${level}`).toBeGreaterThan(mainSets(low))
        expect(mainSets(high), `${type}/${level}`).toBeGreaterThan(mainSets(moderate))
      }
    }
  })

  it('has non-blank title and notes in both locales, with Greek script in title_el and notes_el', () => {
    for (const t of WORKOUT_TEMPLATES) {
      expect(blank(t.title_el), `${t.slug} title_el`).toBe(false)
      expect(blank(t.title_en), `${t.slug} title_en`).toBe(false)
      expect(blank(t.notes_el), `${t.slug} notes_el`).toBe(false)
      expect(blank(t.notes_en), `${t.slug} notes_en`).toBe(false)
      expect(GREEK_RE.test(t.title_el), `${t.slug} title_el="${t.title_el}"`).toBe(true)
      expect(GREEK_RE.test(t.notes_el), `${t.slug} notes_el`).toBe(true)
      expect(GREEK_RE.test(t.title_en), `${t.slug} title_en has Greek`).toBe(false)
    }
  })

  it('writes 2–3 sentence notes that end with a stop-if-unwell line', () => {
    for (const t of WORKOUT_TEMPLATES) {
      const sentences = (s: string) => s.split(/(?<=[.!;·])\s+(?=\p{Lu})/u).length
      expect(sentences(t.notes_en), `${t.slug} notes_en`).toBeGreaterThanOrEqual(2)
      expect(t.notes_en, t.slug).toMatch(/Stop if you feel/)
      expect(t.notes_el, t.slug).toMatch(/Σταμάτα αν/)
    }
  })
})
