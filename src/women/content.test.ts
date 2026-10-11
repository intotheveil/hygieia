import { describe, expect, it } from 'vitest'
import { containsPlaceholderMarkers, hasGreek, leaves } from '../test/bilingual'
import {
  NUTRIENT_SLUGS,
  WOMEN_SECTIONS,
  WOMEN_SECTION_IDS,
  WOMEN_TEMPLATE_SLUGS,
  recipesHref,
  sectionSources,
  sourceHost,
  trackHref,
} from './content'

// /women content rules (./content.ts header): bilingual parity, every card sourced over https, and
// the research report's limits — no weight-loss framing, no diagnose / treat / cure / "balance
// hormones", no supplement doses, no hormone-therapy recommendation.

const BANNED_EN: readonly RegExp[] = [
  /\bdiagnos/i,
  /\btreat(s|ed|ing)?\b/i,
  /\bcures?\b/i,
  /balanc\w* (your )?hormones?/i,
  /hormon\w* balance/i,
  /weight[- ]loss/i,
  /lose weight/i,
  /burn(ing)? fat/i,
  /\bton(e|ing)\b/i,
  /\bdetox/i,
  /\bHRT\b/,
  /hormone (replacement )?therapy/i,
  /\d+\s*(mg|mcg|µg|microgram|iu)\b/i,
]

const BANNED_EL: readonly RegExp[] = [
  /διάγνω|διαγνώ/i,
  /θεραπεύ/i,
  /ορμονικ\S* ισορροπ/i,
  /ισορροπ\S* (τις |των )?ορμον/i,
  /απώλεια βάρους|αδυνάτισμα|χάσε κιλά|χάσεις κιλά/i,
  /ορμονοθεραπεία|ορμονική θεραπεία|θεραπεία ορμονικής υποκατάστασης/i,
  /\d+\s*(mg|mcg|µg|μικρογραμμάρια|IU)\b/i,
]

const allCards = WOMEN_SECTIONS.flatMap((s) => s.cards)

describe('women content', () => {
  it('has the four sections in table-of-contents order, each with 3–6 cards', () => {
    expect(WOMEN_SECTIONS.map((s) => s.id)).toEqual([...WOMEN_SECTION_IDS])
    for (const section of WOMEN_SECTIONS) {
      expect(section.cards.length, section.id).toBeGreaterThanOrEqual(3)
      expect(section.cards.length, section.id).toBeLessThanOrEqual(6)
    }
  })

  it('gives every section and card non-empty el and en text, Greek script in el', () => {
    for (const section of WOMEN_SECTIONS) {
      for (const field of [section.title, section.intro]) {
        expect(field.en.trim(), section.id).not.toBe('')
        expect(field.el.trim(), section.id).not.toBe('')
        expect(hasGreek(field.el), `${section.id}: ${field.el}`).toBe(true)
      }
    }
    for (const card of allCards) {
      for (const field of [card.title, card.body]) {
        expect(field.en.trim(), card.id).not.toBe('')
        expect(field.el.trim(), card.id).not.toBe('')
        expect(hasGreek(field.el), `${card.id}: ${field.el}`).toBe(true)
        expect(field.el, card.id).not.toBe(field.en)
      }
    }
  })

  it('cites at least one https source on every card and on the doctor box', () => {
    for (const card of allCards) {
      expect(card.sources.length, card.id).toBeGreaterThan(0)
      for (const url of card.sources) expect(url, card.id).toMatch(/^https:\/\/[^\s]+\.[a-z]+\//)
    }
    const doctor = WOMEN_SECTIONS.find((s) => s.id === 'menopause')?.doctor
    expect(doctor?.items.length).toBeGreaterThanOrEqual(3)
    expect(doctor?.sources.length).toBeGreaterThan(0)
    for (const item of doctor?.items ?? []) {
      expect(item.en.trim()).not.toBe('')
      expect(hasGreek(item.el)).toBe(true)
    }
    for (const section of WOMEN_SECTIONS) {
      expect(sectionSources(section).length, section.id).toBeGreaterThan(0)
    }
  })

  it('uses unique card ids (they are anchor and heading ids on the page)', () => {
    const ids = allCards.map((c) => c.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('contains no banned claim, dose or drafting marker, in either language', () => {
    const texts = leaves(WOMEN_SECTIONS).filter(([path]) => !/sources/.test(path))
    expect(texts.length).toBeGreaterThan(40)
    for (const [path, value] of texts) {
      expect(containsPlaceholderMarkers(value), path).toBe(false)
      const banned = /\.el$/.test(path) ? BANNED_EL : BANNED_EN
      for (const rule of banned) expect(value, `${path} ~ ${rule}`).not.toMatch(rule)
    }
  })

  it('links exactly the four nutrients, each to its /recipes?nutrient= filter', () => {
    const nutrition = WOMEN_SECTIONS.find((s) => s.id === 'nutrition')
    const slugs = nutrition?.cards.flatMap((c) => (c.nutrient ? [c.nutrient.slug] : []))
    expect(slugs).toEqual([...NUTRIENT_SLUGS])
    expect(recipesHref('vitamin-d')).toBe('/recipes?nutrient=vitamin-d')
  })

  it('names the six women-strength template slugs and builds the track links', () => {
    expect(WOMEN_TEMPLATE_SLUGS).toHaveLength(6)
    expect(trackHref()).toBe('/workouts?track=women-strength')
    expect(trackHref({ type: 'gym', level: 'beginner' })).toBe(
      '/workouts?track=women-strength&type=gym&level=beginner',
    )
  })

  it('labels a source link by its host', () => {
    expect(sourceHost('https://www.nhs.uk/conditions/menopause/')).toBe('nhs.uk')
    expect(sourceHost('not a url')).toBe('not a url')
  })
})
