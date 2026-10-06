import {
  containsPlaceholderMarkers,
  hasGreek,
  leaves,
  looksUntranslated,
} from '../../test/bilingual'
import {
  AUDIENCES,
  CARE_AREAS,
  PRICE_BANDS,
  REGIONS,
  ROUTINE_TIMES,
  SKINCARE_CATEGORIES,
  SKIN_CONCERNS,
  SKIN_TYPES,
  SLUG_RE,
  STEP_TIMES,
} from '../enums'
import type { Region } from '../enums'
import { SKINCARE_PRODUCT_TYPES, SKINCARE_ROUTINES, SKINCARE_TIPS } from './skincare'

/**
 * Domains a skincare tip may cite. The guard against an invented source: a URL whose host is not
 * one of these (or a subdomain of one) fails the suite, whatever else looks right about it.
 */
const ALLOWED_SOURCE_DOMAINS = [
  'who.int',
  'nhs.uk',
  'cdc.gov',
  'fda.gov',
  'nih.gov',
  'medlineplus.gov',
  'mayoclinic.org',
  'aad.org',
  'europa.eu',
] as const

const FAKE_URL_MARKERS = ['example.com', 'placeholder', 'TODO', 'xxx']
const GREEK_RE = /\p{Script=Greek}/u

/** Loanwords and labels that legitimately read the same in both languages. */
const SAME_IN_BOTH = ['SPF', 'PA++++']

function hostAllowed(host: string): boolean {
  return ALLOWED_SOURCE_DOMAINS.some((d) => host === d || host.endsWith(`.${d}`))
}

const includesAll = (haystack: readonly string[], needles: readonly string[]) =>
  needles.every((n) => haystack.includes(n))

const productSlugs = new Set(SKINCARE_PRODUCT_TYPES.map((p) => p.slug))

// Sentence terminators: . ! ? … and the Greek question mark (;). Decimal points inside numbers
// are not followed by whitespace, so they do not count.
const sentenceCount = (s: string) => (s.match(/[.!?;…][»”"')]?(\s|$)/gu) ?? []).length

describe('skincare seed — product types (PLAN.md §P7 skincare_product_types)', () => {
  it('has at least 36 product types (30 face + 6 nail), with counts logged', () => {
    const nails = SKINCARE_PRODUCT_TYPES.filter((p) => p.concerns.includes('nails'))
    console.log(
      `skincare_product_types: ${SKINCARE_PRODUCT_TYPES.length} total · ${nails.length} nail-related · ` +
        `per category ${JSON.stringify(
          Object.fromEntries(
            SKINCARE_CATEGORIES.map((c) => [
              c,
              SKINCARE_PRODUCT_TYPES.filter((p) => p.category === c).length,
            ]),
          ),
        )}`,
    )
    expect(SKINCARE_PRODUCT_TYPES.length).toBeGreaterThanOrEqual(36)
    expect(nails.length).toBeGreaterThanOrEqual(6)
  })

  it('covers the nail categories the operator asked for', () => {
    for (const category of [
      'cuticle_oil',
      'nail_treatment',
      'hand_cream',
      'base_coat',
      'nail_file',
    ])
      expect(
        SKINCARE_PRODUCT_TYPES.some((p) => p.category === category),
        category,
      ).toBe(true)
  })

  it('has unique, well-formed slugs', () => {
    const slugs = SKINCARE_PRODUCT_TYPES.map((p) => p.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
    for (const slug of slugs) expect(slug, slug).toMatch(SLUG_RE)
  })

  it('every enum-valued column holds only known literals and arrays are non-empty', () => {
    for (const p of SKINCARE_PRODUCT_TYPES) {
      expect(SKINCARE_CATEGORIES, p.slug).toContain(p.category)
      expect(STEP_TIMES, p.slug).toContain(p.time)
      expect(PRICE_BANDS, p.slug).toContain(p.price_band_eur)
      for (const [name, values, allowed] of [
        ['regions', p.regions, REGIONS],
        ['audiences', p.audiences, AUDIENCES],
        ['skin_types', p.skin_types, SKIN_TYPES],
        ['concerns', p.concerns, SKIN_CONCERNS],
      ] as const) {
        expect(values.length, `${p.slug} ${name}`).toBeGreaterThan(0)
        expect(new Set(values).size, `${p.slug} ${name} duplicates`).toBe(values.length)
        expect(includesAll(allowed, values), `${p.slug} ${name}: ${values.join(',')}`).toBe(true)
      }
    }
  })

  it('ingredient lists are lower-case English and never a brand-looking token', () => {
    for (const p of SKINCARE_PRODUCT_TYPES)
      for (const item of [...p.key_ingredients, ...p.avoid_with]) {
        expect(item.trim().length, p.slug).toBeGreaterThan(0)
        expect(item, `${p.slug}: "${item}"`).toBe(item.toLowerCase())
        expect(hasGreek(item), `${p.slug}: "${item}"`).toBe(false)
        expect(item, `${p.slug}: "${item}" looks like a trademark`).not.toMatch(/[®™]/)
      }
  })

  it('spreads regional styles: at least one type typical of each of kr, eu, us, jp', () => {
    for (const region of ['kr', 'eu', 'us', 'jp'] as const)
      expect(
        SKINCARE_PRODUCT_TYPES.filter((p) => p.regions.includes(region)).length,
        region,
      ).toBeGreaterThanOrEqual(3)
  })

  it('every locale pair is non-blank, Greek in Greek script, names short', () => {
    for (const p of SKINCARE_PRODUCT_TYPES) {
      for (const field of [
        p.name_el,
        p.name_en,
        p.description_el,
        p.description_en,
        p.notes_el,
        p.notes_en,
      ])
        expect(field.trim().length, p.slug).toBeGreaterThan(0)
      expect(p.name_el, p.slug).toMatch(GREEK_RE)
      expect(p.description_el, p.slug).toMatch(GREEK_RE)
      expect(p.notes_el, p.slug).toMatch(GREEK_RE)
      expect(p.name_el.length, `${p.slug} name_el`).toBeLessThanOrEqual(80)
      expect(p.name_en.length, `${p.slug} name_en`).toBeLessThanOrEqual(80)
    }
  })

  it('has no duplicate names in either language', () => {
    const el = SKINCARE_PRODUCT_TYPES.map((p) => p.name_el.trim().toLowerCase())
    const en = SKINCARE_PRODUCT_TYPES.map((p) => p.name_en.trim().toLowerCase())
    expect(new Set(el).size).toBe(el.length)
    expect(new Set(en).size).toBe(en.length)
  })
})

describe('skincare seed — routines (PLAN.md §P7 skincare_routines)', () => {
  const face = SKINCARE_ROUTINES.filter((r) => r.area === 'face')
  const nails = SKINCARE_ROUTINES.filter((r) => r.area === 'nails')
  const byRegion = (region: Region) => face.filter((r) => r.region === region).length

  it('has at least 24 face routines and 4 nail routines, with counts logged', () => {
    console.log(
      `skincare_routines: ${SKINCARE_ROUTINES.length} total · face ${face.length} · nails ${nails.length} · ` +
        `face by region ${JSON.stringify(Object.fromEntries(REGIONS.map((r) => [r, byRegion(r)])))}`,
    )
    expect(face.length).toBeGreaterThanOrEqual(24)
    expect(nails.length).toBeGreaterThanOrEqual(4)
  })

  it('spreads face routines across regional styles: ≥ 6 kr, ≥ 6 eu, ≥ 6 us, ≥ 4 jp', () => {
    expect(byRegion('kr')).toBeGreaterThanOrEqual(6)
    expect(byRegion('eu')).toBeGreaterThanOrEqual(6)
    expect(byRegion('us')).toBeGreaterThanOrEqual(6)
    expect(byRegion('jp')).toBeGreaterThanOrEqual(4)
  })

  it('covers every (men|women) × skin type × (am|pm) face cell', () => {
    for (const audience of ['men', 'women'] as const)
      for (const skin of ['normal', 'dry', 'oily', 'combination', 'sensitive'] as const)
        for (const time of ['am', 'pm'] as const)
          expect(
            face.some((r) => r.audience === audience && r.skin_type === skin && r.time === time),
            `${audience} ${skin} ${time}`,
          ).toBe(true)
  })

  it('covers the four nail routines the operator asked for (men weekly, women weekly, brittle, post-gel)', () => {
    expect(nails.some((r) => r.audience === 'men' && r.time === 'weekly')).toBe(true)
    expect(nails.some((r) => r.audience === 'women' && r.time === 'weekly')).toBe(true)
    expect(nails.some((r) => r.slug.includes('brittle'))).toBe(true)
    expect(nails.some((r) => r.slug.includes('gel'))).toBe(true)
    for (const r of nails) expect(r.slug.startsWith('nails-'), r.slug).toBe(true)
    for (const r of face) expect(r.slug.startsWith('face-'), r.slug).toBe(true)
  })

  it('has unique, well-formed slugs and only known enum literals', () => {
    const slugs = SKINCARE_ROUTINES.map((r) => r.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
    for (const r of SKINCARE_ROUTINES) {
      expect(r.slug, r.slug).toMatch(SLUG_RE)
      expect(CARE_AREAS, r.slug).toContain(r.area)
      expect(AUDIENCES, r.slug).toContain(r.audience)
      expect(SKIN_TYPES, r.slug).toContain(r.skin_type)
      expect(REGIONS, r.slug).toContain(r.region)
      expect(ROUTINE_TIMES, r.slug).toContain(r.time)
      expect(Number.isInteger(r.duration_min) && r.duration_min > 0, r.slug).toBe(true)
    }
  })

  it('every step references an existing product type slug, in order, with bilingual notes', () => {
    for (const r of SKINCARE_ROUTINES) {
      expect(r.steps.length, r.slug).toBeGreaterThanOrEqual(r.area === 'nails' ? 3 : 4)
      expect(r.steps.length, r.slug).toBeLessThanOrEqual(10)
      const seen = new Set<string>()
      r.steps.forEach((step, i) => {
        expect(step.order, `${r.slug} step ${i}`).toBe(i + 1)
        expect(
          productSlugs.has(step.product_type_slug),
          `${r.slug}: ${step.product_type_slug}`,
        ).toBe(true)
        expect(
          seen.has(step.product_type_slug),
          `${r.slug} repeats ${step.product_type_slug}`,
        ).toBe(false)
        seen.add(step.product_type_slug)
        expect(step.note_el.trim().length, `${r.slug} step ${i} note_el`).toBeGreaterThan(0)
        expect(step.note_en.trim().length, `${r.slug} step ${i} note_en`).toBeGreaterThan(0)
        expect(step.note_el, `${r.slug} step ${i}`).toMatch(GREEK_RE)
        expect(typeof step.optional).toBe('boolean')
      })
      // A routine is not all optional: at least two mandatory steps.
      expect(r.steps.filter((s) => !s.optional).length, r.slug).toBeGreaterThanOrEqual(2)
    }
  })

  it('a face routine’s steps match its time of day (no sunscreen at night, no sleeping mask in the morning)', () => {
    const byslug = new Map(SKINCARE_PRODUCT_TYPES.map((p) => [p.slug, p]))
    for (const r of face)
      for (const step of r.steps) {
        const type = byslug.get(step.product_type_slug)
        expect(type, step.product_type_slug).toBeDefined()
        if (type!.time === 'both') continue
        expect(
          type!.time,
          `${r.slug} (${r.time}) uses ${step.product_type_slug} (${type!.time})`,
        ).toBe(r.time)
      }
  })

  it('every locale pair is non-blank and Greek in Greek script', () => {
    for (const r of SKINCARE_ROUTINES) {
      for (const field of [r.name_el, r.name_en, r.intro_el, r.intro_en])
        expect(field.trim().length, r.slug).toBeGreaterThan(0)
      expect(r.name_el, r.slug).toMatch(GREEK_RE)
      expect(r.intro_el, r.slug).toMatch(GREEK_RE)
    }
  })
})

describe('skincare seed — tips (PLAN.md §P7 skincare_tips)', () => {
  const face = SKINCARE_TIPS.filter((t) => t.area === 'face')
  const nails = SKINCARE_TIPS.filter((t) => t.area === 'nails')

  it('has at least 45 face tips and 10 nail tips, with counts logged', () => {
    const sourced = SKINCARE_TIPS.filter((t) => t.sources.length > 0).length
    console.log(
      `skincare_tips: ${SKINCARE_TIPS.length} total · face ${face.length} · nails ${nails.length} · ` +
        `${sourced} sourced · ${SKINCARE_TIPS.length - sourced} needs_source`,
    )
    expect(face.length).toBeGreaterThanOrEqual(45)
    expect(nails.length).toBeGreaterThanOrEqual(10)
  })

  it('covers the briefed themes: men (shaving, beard, post-gym), women (make-up, double cleanse, hormonal acne, pregnancy), everyone (SPF, retinol, patch test, barrier, sun, humidity, heating, dermatologist)', () => {
    const slugs = SKINCARE_TIPS.map((t) => t.slug).join(' ')
    for (const needle of [
      'shave',
      'razor-burn',
      'beard',
      'gym',
      'makeup',
      'double-cleanse',
      'hormonal',
      'pregnancy',
      'sunscreen-every-day',
      'retinol',
      'patch-test',
      'barrier',
      'mediterranean',
      'humidity',
      'heating',
      'dermatologist',
      'nails-file',
      'cuticles',
      'biting',
      'hangnails',
      'brittle',
      'gel',
      'acetone',
      'gloves',
      'fungal',
      'nails-men',
      'salon',
    ])
      expect(slugs, needle).toContain(needle)
  })

  it('has unique, well-formed, area-prefixed slugs', () => {
    const slugs = SKINCARE_TIPS.map((t) => t.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
    for (const t of SKINCARE_TIPS) {
      expect(t.slug, t.slug).toMatch(SLUG_RE)
      expect(t.slug.startsWith(`${t.area}-`), t.slug).toBe(true)
    }
  })

  it('every enum-valued array holds only known literals and is non-empty', () => {
    for (const t of SKINCARE_TIPS) {
      expect(CARE_AREAS, t.slug).toContain(t.area)
      for (const [name, values, allowed] of [
        ['audiences', t.audiences, AUDIENCES],
        ['skin_types', t.skin_types, SKIN_TYPES],
        ['concerns', t.concerns, SKIN_CONCERNS],
        ['regions', t.regions, REGIONS],
      ] as const) {
        expect(values.length, `${t.slug} ${name}`).toBeGreaterThan(0)
        expect(new Set(values).size, `${t.slug} ${name} duplicates`).toBe(values.length)
        expect(includesAll(allowed, values), `${t.slug} ${name}: ${values.join(',')}`).toBe(true)
      }
      if (t.area === 'nails') expect(t.concerns, t.slug).toContain('nails')
    }
  })

  it('every locale pair is non-blank, titles are short, Greek is Greek', () => {
    for (const t of SKINCARE_TIPS) {
      for (const field of [t.title_el, t.title_en, t.body_el, t.body_en])
        expect(field.trim().length, t.slug).toBeGreaterThan(0)
      expect(t.title_el.length, `${t.slug} title_el`).toBeLessThanOrEqual(90)
      expect(t.title_en.length, `${t.slug} title_en`).toBeLessThanOrEqual(90)
      expect(t.title_el, t.slug).toMatch(GREEK_RE)
      expect(t.body_el, t.slug).toMatch(GREEK_RE)
    }
  })

  it('bodies are 2–5 sentences in both languages', () => {
    for (const t of SKINCARE_TIPS)
      for (const [label, body] of [
        ['body_el', t.body_el],
        ['body_en', t.body_en],
      ] as const) {
        const n = sentenceCount(body)
        expect(n, `${t.slug} ${label}: ${n} sentences`).toBeGreaterThanOrEqual(2)
        expect(n, `${t.slug} ${label}: ${n} sentences`).toBeLessThanOrEqual(5)
      }
  })

  it('has no duplicate titles in either language', () => {
    const el = SKINCARE_TIPS.map((t) => t.title_el.trim().toLowerCase())
    const en = SKINCARE_TIPS.map((t) => t.title_en.trim().toLowerCase())
    expect(new Set(el).size).toBe(el.length)
    expect(new Set(en).size).toBe(en.length)
  })

  it('sources are real-looking http(s) URLs on the allow-list, with no placeholder markers', () => {
    for (const t of SKINCARE_TIPS)
      for (const url of t.sources) {
        expect(url, t.slug).toMatch(/^https?:\/\//)
        for (const marker of FAKE_URL_MARKERS)
          expect(url.toLowerCase(), `${t.slug} contains ${marker}`).not.toContain(
            marker.toLowerCase(),
          )
        expect(() => new URL(url), t.slug).not.toThrow()
        const { hostname } = new URL(url)
        expect(hostAllowed(hostname), `${t.slug} → ${hostname}`).toBe(true)
      }
  })

  it('needs_source is exactly (sources is empty) on every row', () => {
    for (const t of SKINCARE_TIPS) expect(t.needs_source, t.slug).toBe(t.sources.length === 0)
  })

  it('at least half of the tips are sourced, and both areas have sourced tips', () => {
    const sourced = SKINCARE_TIPS.filter((t) => !t.needs_source).length
    expect(sourced * 2).toBeGreaterThanOrEqual(SKINCARE_TIPS.length)
    expect(face.some((t) => !t.needs_source)).toBe(true)
    expect(nails.some((t) => !t.needs_source)).toBe(true)
  })

  it('never gives medical advice without pointing to a professional: every acne / redness / nails tip that names a condition says to see a doctor or dermatologist', () => {
    const conditionWords = /ροδόχρου|μυκητ|σμηγματορροϊκ|μέλασμα|(^|[\s(])ουλές|είσφρυ|παρωνυχ/u
    const refersToProfessional = /δερματολόγ|γιατρ|γυναικολόγ/u
    for (const t of SKINCARE_TIPS)
      if (conditionWords.test(t.body_el))
        expect(refersToProfessional.test(t.body_el), `${t.slug} names a condition`).toBe(true)
  })
})

describe('skincare seed — bilingual completeness sweep (PLAN.md P5.5)', () => {
  it('English columns carry no Greek script', () => {
    for (const p of SKINCARE_PRODUCT_TYPES)
      for (const [k, v] of [
        ['name_en', p.name_en],
        ['description_en', p.description_en],
        ['notes_en', p.notes_en],
      ] as const)
        expect(hasGreek(v), `${p.slug} ${k}`).toBe(false)
    for (const r of SKINCARE_ROUTINES) {
      expect(hasGreek(r.name_en), `${r.slug} name_en`).toBe(false)
      expect(hasGreek(r.intro_en), `${r.slug} intro_en`).toBe(false)
      for (const s of r.steps) expect(hasGreek(s.note_en), `${r.slug} step ${s.order}`).toBe(false)
    }
    for (const t of SKINCARE_TIPS) {
      expect(hasGreek(t.title_en), `${t.slug} title_en`).toBe(false)
      expect(hasGreek(t.body_en), `${t.slug} body_en`).toBe(false)
    }
  })

  it('the Greek column never repeats the English one', () => {
    for (const p of SKINCARE_PRODUCT_TYPES) {
      expect(looksUntranslated(p.name_el, p.name_en, SAME_IN_BOTH), `${p.slug} name`).toBe(false)
      expect(looksUntranslated(p.description_el, p.description_en), `${p.slug} description`).toBe(
        false,
      )
      expect(looksUntranslated(p.notes_el, p.notes_en), `${p.slug} notes`).toBe(false)
    }
    for (const r of SKINCARE_ROUTINES) {
      expect(looksUntranslated(r.name_el, r.name_en), `${r.slug} name`).toBe(false)
      expect(looksUntranslated(r.intro_el, r.intro_en), `${r.slug} intro`).toBe(false)
      for (const s of r.steps)
        expect(looksUntranslated(s.note_el, s.note_en), `${r.slug} step ${s.order}`).toBe(false)
    }
    for (const t of SKINCARE_TIPS) {
      expect(looksUntranslated(t.title_el, t.title_en), `${t.slug} title`).toBe(false)
      expect(looksUntranslated(t.body_el, t.body_en), `${t.slug} body`).toBe(false)
    }
  })

  it('no leaf carries a placeholder marker', () => {
    for (const row of [...SKINCARE_PRODUCT_TYPES, ...SKINCARE_ROUTINES, ...SKINCARE_TIPS])
      for (const [path, value] of leaves(row))
        expect(containsPlaceholderMarkers(value), `${row.slug} ${path} "${value}"`).toBe(false)
  })
})
