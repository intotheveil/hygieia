import {
  containsPlaceholderMarkers,
  hasGreek,
  leaves,
  looksUntranslated,
} from '../../test/bilingual'
import { SLUG_RE } from '../enums'
import type { DietSeed } from '../types'
import { ASK_DOCTOR_EL, ASK_DOCTOR_EN, DIETS } from './diets'

// The eight diets PLAN.md P1.10 names, by their exact slugs; more may ship on top.
const MANDATORY = [
  'mediterranean',
  'atkins',
  'paleo',
  'low-carb',
  'keto',
  'carnivore',
  'vegetarian',
  'vegan',
] as const

/** Minimum entries per `*_el`/`*_en` array pair (the P1.10 content brief). */
const MIN_ITEMS: Record<ArrayPair, number> = {
  allowed: 6,
  avoided: 6,
  pros: 3,
  cons: 3,
  avoid_if: 2,
}

type ArrayPair = 'allowed' | 'avoided' | 'pros' | 'cons' | 'avoid_if'
type StringPair = 'name' | 'summary'

const ARRAY_PAIRS: readonly ArrayPair[] = ['allowed', 'avoided', 'pros', 'cons', 'avoid_if']
const STRING_PAIRS: readonly StringPair[] = ['name', 'summary']

/** Diet names that are brand names or acronyms and legitimately carry no Greek script. */
const GREEK_NAME_ALLOWLIST: readonly string[] = ['whole30']

const GREEK_SCRIPT = /\p{Script=Greek}/u
const DOCTOR_PHRASE_EL = 'ρωτήστε πρώτα γιατρό ή διαιτολόγο'
const DOCTOR_PHRASE_EN = 'ask a doctor or dietitian'
const FORBIDDEN_URL_FRAGMENTS = ['example.com', 'placeholder', 'TODO']

const pair = <K extends StringPair | ArrayPair>(d: DietSeed, key: K) => ({
  el: d[`${key}_el` as const],
  en: d[`${key}_en` as const],
})

const isBlank = (s: string) => s.trim() === ''

describe('DIETS seed (PLAN.md P1.10)', () => {
  it('ships the eight mandatory diets and at least eight in total', () => {
    const slugs = DIETS.map((d) => d.slug)
    expect(DIETS.length).toBeGreaterThanOrEqual(8)
    for (const slug of MANDATORY) expect(slugs).toContain(slug)
  })

  it('has unique slugs that all match SLUG_RE', () => {
    const slugs = DIETS.map((d) => d.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
    for (const slug of slugs) expect(slug).toMatch(SLUG_RE)
  })

  it('exports the doctor caution in both languages, each carrying its key phrase', () => {
    expect(ASK_DOCTOR_EL).toContain(DOCTOR_PHRASE_EL)
    expect(ASK_DOCTOR_EN).toContain(DOCTOR_PHRASE_EN)
  })

  describe.each(DIETS.map((d) => [d.slug, d] as const))('%s', (_slug, diet) => {
    it('has non-blank name and summary in both languages', () => {
      for (const key of STRING_PAIRS) {
        const { el, en } = pair(diet, key)
        expect(isBlank(el), `${key}_el blank`).toBe(false)
        expect(isBlank(en), `${key}_en blank`).toBe(false)
      }
    })

    it('has equal-length array pairs above the minimums, with no blank entries', () => {
      for (const key of ARRAY_PAIRS) {
        const { el, en } = pair(diet, key)
        expect(el.length, `${key}_el length`).toBeGreaterThanOrEqual(MIN_ITEMS[key])
        expect(en.length, `${key}: el ${el.length} vs en ${en.length}`).toBe(el.length)
        for (const s of [...el, ...en]) expect(isBlank(s), `${key} has a blank entry`).toBe(false)
      }
    })

    it('includes the doctor/dietitian caution in both languages', () => {
      expect(diet.avoid_if_el.some((s) => s.includes(DOCTOR_PHRASE_EL))).toBe(true)
      expect(diet.avoid_if_en.some((s) => s.includes(DOCTOR_PHRASE_EN))).toBe(true)
    })

    it('has a null or real-looking https?:// source_url', () => {
      const url = diet.source_url
      if (url === null) return
      expect(url).toMatch(/^https?:\/\//)
      for (const fragment of FORBIDDEN_URL_FRAGMENTS) expect(url).not.toContain(fragment)
    })

    it('has a Greek-script name_el unless allow-listed', () => {
      if (GREEK_NAME_ALLOWLIST.includes(diet.slug)) return
      expect(diet.name_el).toMatch(GREEK_SCRIPT)
    })
  })
})

describe('DIETS seed — bilingual completeness sweep (PLAN.md P5.5)', () => {
  const asList = (v: string | string[]) => (Array.isArray(v) ? v : [v])
  const PAIRS = [...STRING_PAIRS, ...ARRAY_PAIRS] as const

  describe.each(DIETS.map((d) => [d.slug, d] as const))('%s', (_slug, diet) => {
    it('writes every *_en leaf without Greek script', () => {
      for (const key of PAIRS) {
        asList(pair(diet, key).en).forEach((s, i) => {
          expect(hasGreek(s), `${key}_en[${i}] "${s}" contains Greek script`).toBe(false)
        })
      }
    })

    it('writes every *_el leaf in Greek script (name_el allow-listed by slug for brand names)', () => {
      for (const key of PAIRS) {
        if (key === 'name' && GREEK_NAME_ALLOWLIST.includes(diet.slug)) continue
        asList(pair(diet, key).el).forEach((s, i) => {
          expect(hasGreek(s), `${key}_el[${i}] "${s}" has no Greek script`).toBe(true)
        })
      }
    })

    it('never repeats the English in the Greek column, except the allow-listed brand name', () => {
      const nameAllow = GREEK_NAME_ALLOWLIST.includes(diet.slug) ? [diet.name_en] : []
      for (const key of PAIRS) {
        const el = asList(pair(diet, key).el)
        const en = asList(pair(diet, key).en)
        el.forEach((s, i) => {
          const allow = key === 'name' ? nameAllow : []
          expect(
            looksUntranslated(s, en[i] ?? '', allow),
            `${key}[${i}] el repeats en "${s}"`,
          ).toBe(false)
        })
      }
    })

    it('carries no placeholder marker in any leaf', () => {
      for (const [path, value] of leaves(diet)) {
        expect(containsPlaceholderMarkers(value), `${path} "${value}"`).toBe(false)
      }
    })
  })
})
