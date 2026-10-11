// OVERLAY 0013 — the women's strength track (./0013-women-strength.ts). The track column itself is
// proven by scripts/db-schema-contract.test.ts and the gate; what is proven HERE is the content:
//   * it is registered after 0012 and only ADDS exercises and workout templates;
//   * exactly the six contract slugs, all on track `women-strength`, each in its own cell of the track
//     (the DB key is unique (track, workout_type, level, intensity)) and none on `general`;
//   * the blocks are well formed (warm-up → main → cool-down, ≥ 1 / ≥ 3 / ≥ 1, reps xor seconds) and
//     every exercise resolves in the served seed, of a type the template's setting can use;
//   * the new exercises are new slugs with valid enums and full el/en copy;
//   * both languages are present everywhere, and no copy uses weight-loss or "toning" framing;
//   * the bundled source serves each template on its track, and the general cells are untouched.

import { describe, expect, it } from 'vitest'
import { hasGreek } from '../../../test/bilingual'
import { OVERLAID_SEED } from '../../../test/overlaidSeed'
import { bundledSource } from '../../bundled'
import { BLOCKS, INTENSITIES, LEVELS, SLUG_RE, WORKOUT_TYPES } from '../../enums'
import type { WorkoutType } from '../../enums'
import { EXERCISES } from '../exercises'
import { MUSCLE_GROUPS } from '../exercises'
import { WORKOUT_TEMPLATES } from '../workouts'
import { OVERLAY } from './0013-women-strength'
import { OVERLAYS } from './index'

const CONTRACT_SLUGS = [
  'women-strength-gym-beginner-full-body-a',
  'women-strength-gym-beginner-full-body-b',
  'women-strength-home-beginner-dumbbell',
  'women-strength-gym-intermediate-lower',
  'women-strength-gym-intermediate-upper',
  'women-strength-home-intermediate-glutes-core',
]

const newTemplates = OVERLAY.additions?.workout_templates ?? []
const newExercises = OVERLAY.additions?.exercises ?? []
const exerciseBySlug = new Map(OVERLAID_SEED.exercises.map((e) => [e.slug, e]))

/** Exercise types a template's setting can use: a gym also has floor space for bodyweight work. */
const USABLE: Partial<Record<WorkoutType, readonly WorkoutType[]>> = {
  gym: ['gym', 'home', 'mobility'],
  home: ['home', 'mobility'],
}

/** Weight-loss and "toning" framing the track must never use (EN + EL). */
const BANNED = [
  /\btone\b/i,
  /\btoned\b/i,
  /\btoning\b/i,
  /lose weight/i,
  /weight loss/i,
  /burn fat/i,
  /fat[- ]burning/i,
  /slim/i,
  /σμίλευση/i,
  /αδυνάτισμα/i,
  /αδυνατ/i,
  /καύση λίπους/i,
  /σύσφιξη/i,
]

const copyOf = (row: object): string[] =>
  Object.values(row).filter((v): v is string => typeof v === 'string')

describe('overlay 0013-women-strength', () => {
  it('is registered after 0012 and only adds exercises and workout templates', () => {
    expect(OVERLAYS).toContain(OVERLAY)
    expect(OVERLAY.id).toBe('0013-women-strength')
    expect(OVERLAYS.indexOf(OVERLAY)).toBeGreaterThan(
      OVERLAYS.findIndex((o) => o.id === '0012-fix-aad-links'),
    )
    expect(OVERLAY.patches).toBeUndefined()
    expect(Object.keys(OVERLAY.additions ?? {}).sort()).toEqual(['exercises', 'workout_templates'])
  })

  it('adds exactly the six contract slugs, all on track women-strength', () => {
    expect(newTemplates.map((t) => t.slug).sort()).toEqual([...CONTRACT_SLUGS].sort())
    for (const t of newTemplates) {
      expect(t.slug, t.slug).toMatch(SLUG_RE)
      expect(t.track, t.slug).toBe('women-strength')
      expect(WORKOUT_TYPES, t.slug).toContain(t.workout_type)
      expect(LEVELS, t.slug).toContain(t.level)
      expect(INTENSITIES, t.slug).toContain(t.intensity)
      expect(t.slug.includes(`-${t.workout_type}-${t.level}-`), t.slug).toBe(true)
    }
    expect(OVERLAID_SEED.workout_templates).toHaveLength(WORKOUT_TEMPLATES.length + 6)
    // The base seed is the general track: 63 rows, none naming a track.
    expect(WORKOUT_TEMPLATES.every((t) => t.track === undefined)).toBe(true)
  })

  it('puts every template in its own cell of the track (the DB key: track + cell)', () => {
    const cells = newTemplates.map((t) => `${t.workout_type}/${t.level}/${t.intensity}`)
    expect(new Set(cells).size).toBe(cells.length)
    // The contract links by type + level with the page's default intensity (moderate): every
    // (type, level) of the track must have a moderate session.
    for (const t of newTemplates)
      expect(
        newTemplates.some(
          (o) =>
            o.workout_type === t.workout_type && o.level === t.level && o.intensity === 'moderate',
        ),
        `${t.workout_type}/${t.level} has a moderate template`,
      ).toBe(true)
  })

  it('lays out warm-up → main → cool-down with sane sets, reps xor seconds and durations', () => {
    for (const t of newTemplates) {
      const count = (b: string) => t.blocks.filter((s) => s.block === b).length
      expect(count('warmup'), t.slug).toBeGreaterThanOrEqual(1)
      expect(count('main'), t.slug).toBeGreaterThanOrEqual(3)
      expect(count('cooldown'), t.slug).toBeGreaterThanOrEqual(1)
      const ranks = t.blocks.map((s) => BLOCKS.indexOf(s.block))
      expect(
        [...ranks].sort((a, b) => a - b),
        `${t.slug} block order`,
      ).toEqual(ranks)
      expect(t.blocks.length, t.slug).toBeLessThanOrEqual(12)
      const slugs = t.blocks.map((s) => s.exercise_slug)
      expect(new Set(slugs).size, `${t.slug} repeats an exercise`).toBe(slugs.length)
      for (const s of t.blocks) {
        const where = `${t.slug} ${s.exercise_slug}`
        expect((s.reps === null) !== (s.seconds === null), `${where} reps xor seconds`).toBe(true)
        expect(s.sets, where).toBeGreaterThanOrEqual(1)
        expect(s.sets, where).toBeLessThanOrEqual(5)
        expect(s.rest_seconds, where).toBeGreaterThanOrEqual(0)
      }
      // Strength work: the main block is loaded, 6–15 reps, 45–150 s rest.
      for (const s of t.blocks.filter((b) => b.block === 'main' && b.reps !== null)) {
        expect(s.reps, `${t.slug} ${s.exercise_slug}`).toBeGreaterThanOrEqual(6)
        expect(s.reps, `${t.slug} ${s.exercise_slug}`).toBeLessThanOrEqual(15)
        expect(s.rest_seconds, `${t.slug} ${s.exercise_slug}`).toBeGreaterThanOrEqual(45)
      }
      expect(t.duration_min, t.slug).toBeGreaterThanOrEqual(20)
      expect(t.duration_min, t.slug).toBeLessThanOrEqual(90)
    }
  })

  it('resolves every exercise in the served seed, of a type the setting can use', () => {
    for (const t of newTemplates) {
      for (const s of t.blocks) {
        const e = exerciseBySlug.get(s.exercise_slug)
        expect(e, `${t.slug} → ${s.exercise_slug}`).toBeDefined()
        expect(
          USABLE[t.workout_type],
          `${t.slug} → ${s.exercise_slug} (${e?.workout_type})`,
        ).toContain(e?.workout_type)
      }
    }
  })

  it('covers the compound patterns: squat, hinge, hip thrust or bridge, row or pull, press, carry or core', () => {
    const PATTERNS: Record<string, RegExp> = {
      squat: /squat|leg-press|lunge|step-up/,
      hinge: /deadlift|good-morning|leg-curl/,
      glutes: /hip-thrust|glute-bridge/,
      pull: /row|pull/,
      press: /press/,
      carryOrCore: /carry|plank|dead-bug/,
    }
    const total = Object.keys(PATTERNS).length
    for (const t of newTemplates) {
      const main = t.blocks.filter((s) => s.block === 'main').map((s) => s.exercise_slug)
      const missing = Object.entries(PATTERNS)
        .filter(([, re]) => !main.some((slug) => re.test(slug)))
        .map(([name]) => name)
      // An upper-body day has no lower patterns; a lower day no pull or press. Each covers ≥ 3.
      expect(
        total - missing.length,
        `${t.slug} lacks ${missing.join(', ')}`,
      ).toBeGreaterThanOrEqual(3)
    }
    const all = newTemplates.flatMap((t) => t.blocks.map((s) => s.exercise_slug))
    for (const slug of ['hip-thrust', 'romanian-deadlift', 'goblet-squat', 'farmer-carry'])
      expect(all, slug).toContain(slug)
  })

  it('adds new exercise slugs only, with valid enums, muscle groups and equipment pairs', () => {
    const base = new Set(EXERCISES.map((e) => e.slug))
    const slugs = newExercises.map((e) => e.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
    for (const e of newExercises) {
      expect(e.slug, e.slug).toMatch(SLUG_RE)
      expect(base.has(e.slug), `${e.slug} already exists`).toBe(false)
      expect(WORKOUT_TYPES, e.slug).toContain(e.workout_type)
      expect(LEVELS, e.slug).toContain(e.level)
      expect(e.muscle_groups.length, e.slug).toBeGreaterThan(0)
      for (const m of e.muscle_groups) expect(MUSCLE_GROUPS, `${e.slug} ${m}`).toContain(m)
      expect(e.equipment_el === null, `${e.slug} equipment pair`).toBe(e.equipment_en === null)
    }
    // Every new exercise is used by the track (no orphans).
    const used = new Set(newTemplates.flatMap((t) => t.blocks.map((s) => s.exercise_slug)))
    for (const e of newExercises) expect(used.has(e.slug), `${e.slug} unused`).toBe(true)
  })

  it('has non-empty copy in both languages: Greek in every el field, none in any en field', () => {
    for (const t of newTemplates) {
      for (const [el, en] of [
        [t.title_el, t.title_en],
        [t.notes_el, t.notes_en],
      ] as const) {
        expect(el.trim(), t.slug).not.toBe('')
        expect(en.trim(), t.slug).not.toBe('')
        expect(hasGreek(el), `${t.slug} el`).toBe(true)
        expect(hasGreek(en), `${t.slug} en`).toBe(false)
      }
      expect(t.notes_en, t.slug).toMatch(/Stop if you feel/)
      expect(t.notes_el, t.slug).toMatch(/Σταμάτα αν/)
    }
    for (const e of newExercises) {
      for (const [el, en] of [
        [e.name_el, e.name_en],
        [e.cue_el, e.cue_en],
        [e.equipment_el ?? 'Ελ', e.equipment_en ?? 'En'],
      ] as const) {
        expect(el.trim(), e.slug).not.toBe('')
        expect(en.trim(), e.slug).not.toBe('')
        expect(hasGreek(el), `${e.slug} el "${el}"`).toBe(true)
        expect(hasGreek(en), `${e.slug} en "${en}"`).toBe(false)
      }
    }
  })

  it('never uses weight-loss or "toning" framing', () => {
    for (const row of [...newTemplates, ...newExercises])
      for (const text of copyOf(row))
        for (const re of BANNED)
          expect(re.test(text), `${row.slug}: ${re} in "${text}"`).toBe(false)
  })

  it('the bundled source serves each template on its track, and the general cell is unchanged', async () => {
    for (const t of newTemplates) {
      const onTrack = await bundledSource.getWorkoutTemplate(
        t.workout_type,
        t.level,
        t.intensity,
        'women-strength',
      )
      expect(onTrack.ok && onTrack.data?.slug, t.slug).toBe(t.slug)
      expect(onTrack.ok && onTrack.data?.slots.every((s) => s.exercise !== null), t.slug).toBe(true)
      const general = await bundledSource.getWorkoutTemplate(t.workout_type, t.level, t.intensity)
      expect(general.ok && general.data?.slug, `${t.slug} general cell`).toBe(
        `${t.workout_type}-${t.level}-${t.intensity}`,
      )
      expect(general.ok && general.data?.track).toBe('general')
    }
  })
})
