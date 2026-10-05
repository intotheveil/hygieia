import { LEVELS, SLUG_RE, WORKOUT_TYPES } from '../enums'
import { EXERCISES, MUSCLE_GROUPS } from './exercises'

/** Latin-script loanwords Greeks write as-is in the gym (PLAN.md §0 content drafting rule). */
const LATIN_NAME_EL_ALLOWLIST: ReadonlySet<string> = new Set([
  'jumping-jacks',
  'burpees',
  'goblet-squat',
  'hollow-hold',
  'l-sit',
  'fartlek-30-30',
  'a-skips',
  'strides-100m',
  'tempo-run-20min',
  'threshold-run-2x15min',
  'threshold-ride-2x20min',
  'tempo-ride-20min',
  'over-under-intervals',
  'vo2-intervals-3min',
  'jefferson-curl',
  'couch-stretch',
  'streamline-glide-stretch',
  'drill-sculling',
  'drill-catch-up-freestyle',
  'pull-buoy-freestyle',
  'cable-face-pull',
  'hollow-hold-tuck',
])

const GREEK_RE = /\p{Script=Greek}/u
const blank = (s: string | null | undefined) => s === null || s === undefined || s.trim() === ''

describe('EXERCISES seed (PLAN.md P4.7)', () => {
  it('has at least 60 rows (floor) — actual count logged', () => {
    console.log(`EXERCISES count: ${EXERCISES.length}`)
    expect(EXERCISES.length).toBeGreaterThanOrEqual(60)
  })

  it('has unique slugs that match SLUG_RE', () => {
    const slugs = EXERCISES.map((e) => e.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
    for (const slug of slugs) expect(slug, slug).toMatch(SLUG_RE)
  })

  it('uses only the enum workout types and levels', () => {
    for (const e of EXERCISES) {
      expect(WORKOUT_TYPES, e.slug).toContain(e.workout_type)
      expect(LEVELS, e.slug).toContain(e.level)
    }
  })

  it('fills every workout_type × level cell with at least 3 exercises', () => {
    const matrix: Record<string, number> = {}
    for (const e of EXERCISES) {
      const key = `${e.workout_type}/${e.level}`
      matrix[key] = (matrix[key] ?? 0) + 1
    }
    for (const type of WORKOUT_TYPES) {
      for (const level of LEVELS) {
        expect(matrix[`${type}/${level}`] ?? 0, `${type}/${level}`).toBeGreaterThanOrEqual(3)
      }
    }
  })

  it('has non-blank name and cue in both locales', () => {
    for (const e of EXERCISES) {
      expect(blank(e.name_el), `${e.slug} name_el`).toBe(false)
      expect(blank(e.name_en), `${e.slug} name_en`).toBe(false)
      expect(blank(e.cue_el), `${e.slug} cue_el`).toBe(false)
      expect(blank(e.cue_en), `${e.slug} cue_en`).toBe(false)
    }
  })

  it('writes name_el in Greek script except for the loanword allow-list; cue_el is always Greek', () => {
    for (const e of EXERCISES) {
      if (!LATIN_NAME_EL_ALLOWLIST.has(e.slug)) {
        expect(GREEK_RE.test(e.name_el), `${e.slug} name_el="${e.name_el}"`).toBe(true)
      }
      expect(GREEK_RE.test(e.cue_el), `${e.slug} cue_el`).toBe(true)
    }
  })

  it('names in the allow-list actually exist (no stale entries)', () => {
    const slugs = new Set(EXERCISES.map((e) => e.slug))
    for (const slug of LATIN_NAME_EL_ALLOWLIST) expect(slugs.has(slug), slug).toBe(true)
  })

  it('has non-empty muscle_groups drawn from MUSCLE_GROUPS, without duplicates', () => {
    const vocab: ReadonlySet<string> = new Set(MUSCLE_GROUPS)
    expect(new Set(MUSCLE_GROUPS).size).toBe(MUSCLE_GROUPS.length)
    for (const e of EXERCISES) {
      expect(e.muscle_groups.length, e.slug).toBeGreaterThan(0)
      expect(new Set(e.muscle_groups).size, e.slug).toBe(e.muscle_groups.length)
      for (const g of e.muscle_groups) expect(vocab.has(g), `${e.slug}: ${g}`).toBe(true)
    }
  })

  it('has equipment_el / equipment_en both null (bodyweight) or both non-blank', () => {
    for (const e of EXERCISES) {
      if (e.equipment_en === null || e.equipment_el === null) {
        expect(e.equipment_en, e.slug).toBeNull()
        expect(e.equipment_el, e.slug).toBeNull()
      } else {
        expect(blank(e.equipment_en), e.slug).toBe(false)
        expect(blank(e.equipment_el), e.slug).toBe(false)
      }
    }
  })

  it('provides warm-up and cool-down suitable movements for every workout type', () => {
    // Slug fragments the P4.8 template author relies on to find block-appropriate movements.
    const WARMUP_HINTS =
      /circles|march|walk|easy|spin|rolls|swings|jacks|cat-cow|hang|bobbing|wrist|scapular|knees/
    const COOLDOWN_HINTS =
      /stretch|cooldown|cool|foam|pose|wall|hug|childs|spin-down|streamline|pigeon|roll/
    for (const type of WORKOUT_TYPES) {
      const slugs = EXERCISES.filter((e) => e.workout_type === type).map((e) => e.slug)
      expect(
        slugs.some((s) => WARMUP_HINTS.test(s)),
        `${type} warm-up`,
      ).toBe(true)
      expect(
        slugs.some((s) => COOLDOWN_HINTS.test(s)),
        `${type} cool-down`,
      ).toBe(true)
    }
  })
})
