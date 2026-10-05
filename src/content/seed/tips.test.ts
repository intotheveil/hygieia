import { SLUG_RE, TIP_TOPICS } from '../enums'
import type { TipTopic } from '../enums'
import { HEALTH_TIPS } from './tips'

/**
 * Domains a tip may cite. This is the guard against an invented source: a URL whose host is not
 * one of these (or a subdomain of one) fails the suite, whatever else looks right about it.
 */
const ALLOWED_SOURCE_DOMAINS = [
  'who.int',
  'nhs.uk',
  'cdc.gov',
  'hsph.harvard.edu',
  'efsa.europa.eu',
  'mayoclinic.org',
  'sleepfoundation.org',
  'nih.gov',
] as const

/** Substrings that mark a placeholder rather than a real reference. */
const FAKE_URL_MARKERS = ['example.com', 'placeholder', 'TODO', 'xxx']

const GREEK_RE = /\p{Script=Greek}/u

function hostAllowed(host: string): boolean {
  return ALLOWED_SOURCE_DOMAINS.some((d) => host === d || host.endsWith(`.${d}`))
}

const byTopic = new Map<TipTopic, number>(TIP_TOPICS.map((t) => [t, 0]))
for (const tip of HEALTH_TIPS) byTopic.set(tip.topic, (byTopic.get(tip.topic) ?? 0) + 1)

describe('health tips seed (PLAN.md §2 health_tips, P4.9)', () => {
  it('has at least 30 tips (target 60+)', () => {
    const sourced = HEALTH_TIPS.filter((t) => t.source_url !== null).length
    console.log(
      `health_tips: ${HEALTH_TIPS.length} total · ${sourced} with source_url · ` +
        `${HEALTH_TIPS.length - sourced} needs_source · per topic ${JSON.stringify(
          Object.fromEntries(byTopic),
        )}`,
    )
    expect(HEALTH_TIPS.length).toBeGreaterThanOrEqual(30)
  })

  it('covers every topic with at least 4 tips', () => {
    for (const topic of TIP_TOPICS) {
      expect(byTopic.get(topic), topic).toBeGreaterThanOrEqual(4)
    }
  })

  it('uses only known topics', () => {
    for (const tip of HEALTH_TIPS) {
      expect(TIP_TOPICS, tip.slug).toContain(tip.topic)
    }
  })

  it('has unique, well-formed slugs', () => {
    const slugs = HEALTH_TIPS.map((t) => t.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
    for (const slug of slugs) expect(slug, slug).toMatch(SLUG_RE)
  })

  it('slugs are prefixed with their topic', () => {
    for (const tip of HEALTH_TIPS) {
      expect(tip.slug.startsWith(`${tip.topic}-`), tip.slug).toBe(true)
    }
  })

  it('every locale pair is non-blank and titles are short', () => {
    for (const tip of HEALTH_TIPS) {
      for (const field of [tip.title_el, tip.title_en, tip.body_el, tip.body_en]) {
        expect(field.trim().length, tip.slug).toBeGreaterThan(0)
      }
      expect(tip.title_el.length, `${tip.slug} title_el`).toBeLessThanOrEqual(80)
      expect(tip.title_en.length, `${tip.slug} title_en`).toBeLessThanOrEqual(80)
    }
  })

  it('Greek fields are written in Greek script', () => {
    for (const tip of HEALTH_TIPS) {
      expect(tip.title_el, tip.slug).toMatch(GREEK_RE)
      expect(tip.body_el, tip.slug).toMatch(GREEK_RE)
    }
  })

  it('bodies are 2–4 sentences in both languages', () => {
    // Sentence terminators: . ! ? and the Greek question mark (;). Decimal points inside numbers
    // ("2.5 litres", "22,5 g") are not followed by whitespace, so they do not count.
    const sentenceCount = (s: string) => (s.match(/[.!?;…](\s|$)/gu) ?? []).length
    for (const tip of HEALTH_TIPS) {
      for (const [label, body] of [
        ['body_el', tip.body_el],
        ['body_en', tip.body_en],
      ] as const) {
        const n = sentenceCount(body)
        expect(n, `${tip.slug} ${label}: ${n} sentences`).toBeGreaterThanOrEqual(2)
        expect(n, `${tip.slug} ${label}: ${n} sentences`).toBeLessThanOrEqual(4)
      }
    }
  })

  it('has no duplicate titles in either language', () => {
    const el = HEALTH_TIPS.map((t) => t.title_el.trim().toLowerCase())
    const en = HEALTH_TIPS.map((t) => t.title_en.trim().toLowerCase())
    expect(new Set(el).size).toBe(el.length)
    expect(new Set(en).size).toBe(en.length)
  })

  it('source_url is null or a real-looking http(s) URL with no placeholder markers', () => {
    for (const tip of HEALTH_TIPS) {
      if (tip.source_url === null) continue
      expect(tip.source_url, tip.slug).toMatch(/^https?:\/\//)
      for (const marker of FAKE_URL_MARKERS) {
        expect(tip.source_url.toLowerCase(), `${tip.slug} contains ${marker}`).not.toContain(
          marker.toLowerCase(),
        )
      }
      expect(() => new URL(tip.source_url as string), tip.slug).not.toThrow()
    }
  })

  it('every source_url host is on the reputable-domain allow-list', () => {
    for (const tip of HEALTH_TIPS) {
      if (tip.source_url === null) continue
      const { hostname } = new URL(tip.source_url)
      expect(hostAllowed(hostname), `${tip.slug} → ${hostname}`).toBe(true)
    }
  })

  it('needs_source is exactly (source_url === null) on every row', () => {
    for (const tip of HEALTH_TIPS) {
      expect(tip.needs_source, tip.slug).toBe(tip.source_url === null)
    }
  })

  it('has at least one sourced tip per topic', () => {
    for (const topic of TIP_TOPICS) {
      const sourced = HEALTH_TIPS.filter((t) => t.topic === topic && t.source_url !== null)
      expect(sourced.length, topic).toBeGreaterThanOrEqual(1)
    }
  })
})
