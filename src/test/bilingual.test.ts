import {
  GREEK_SCRIPT,
  PLACEHOLDER_MARKERS,
  containsPlaceholderMarkers,
  hasGreek,
  leaves,
  looksUntranslated,
} from './bilingual'

describe('bilingual test helpers (src/test/bilingual.ts)', () => {
  describe('leaves', () => {
    it('returns a single root leaf for a bare string', () => {
      expect(leaves('hello')).toEqual([['', 'hello']])
    })

    it('walks nested objects depth-first in insertion order with dotted paths', () => {
      const obj = { a: 'A', b: { c: 'C', d: { e: 'E' } }, f: 'F' }
      expect(leaves(obj)).toEqual([
        ['a', 'A'],
        ['b.c', 'C'],
        ['b.d.e', 'E'],
        ['f', 'F'],
      ])
    })

    it('indexes array entries by position', () => {
      expect(leaves({ steps_el: ['ένα', 'δύο'], n: 3 })).toEqual([
        ['steps_el.0', 'ένα'],
        ['steps_el.1', 'δύο'],
      ])
    })

    it('skips numbers, booleans, null and undefined, and returns [] for an empty object', () => {
      expect(leaves({ n: 1, b: true, z: null, u: undefined, nested: { m: 2 } })).toEqual([])
      expect(leaves({})).toEqual([])
      expect(leaves(null)).toEqual([])
      expect(leaves(42)).toEqual([])
    })

    it('keeps blank strings so a blankness rule can see them', () => {
      expect(leaves({ a: '', b: '  ' })).toEqual([
        ['a', ''],
        ['b', '  '],
      ])
    })
  })

  describe('hasGreek / GREEK_SCRIPT', () => {
    it('detects Greek script, accented or not, anywhere in the string', () => {
      expect(hasGreek('Υγεία')).toBe(true)
      expect(hasGreek('Αιωρήσεις με kettlebell')).toBe(true)
      expect(hasGreek('ς')).toBe(true)
      expect(GREEK_SCRIPT.test('ΰ')).toBe(true)
    })

    it('is false for Latin, digits, punctuation and the empty string', () => {
      expect(hasGreek('Hygieia')).toBe(false)
      expect(hasGreek('30/30 — 2x15min')).toBe(false)
      expect(hasGreek('')).toBe(false)
    })

    it('does not mistake Cyrillic or Latin look-alikes for Greek', () => {
      expect(hasGreek('Москва')).toBe(false)
      expect(hasGreek('ABEHKMNOPTXYZ')).toBe(false)
    })
  })

  describe('looksUntranslated', () => {
    it('flags an el value identical to its en twin', () => {
      expect(looksUntranslated('Sign in', 'Sign in')).toBe(true)
    })

    it('compares trimmed and case-insensitively', () => {
      expect(looksUntranslated('  sign in', 'SIGN IN ')).toBe(true)
    })

    it('does not flag a real translation', () => {
      expect(looksUntranslated('Σύνδεση', 'Sign in')).toBe(false)
    })

    it('does not flag two blank strings (blankness is a separate rule)', () => {
      expect(looksUntranslated('', '')).toBe(false)
      expect(looksUntranslated('   ', '')).toBe(false)
    })

    it('lets an allow-listed brand or loanword through, case-insensitively', () => {
      const allow = ['Hygieia', 'Whole30', 'keto']
      expect(looksUntranslated('Whole30', 'Whole30', allow)).toBe(false)
      expect(looksUntranslated('Keto', 'keto', allow)).toBe(false)
      expect(looksUntranslated('Atkins', 'Atkins', allow)).toBe(true)
    })

    it('treats a missing allow-list as empty', () => {
      expect(looksUntranslated('DASH', 'DASH')).toBe(true)
      expect(looksUntranslated('DASH', 'DASH', [])).toBe(true)
    })
  })

  describe('containsPlaceholderMarkers / PLACEHOLDER_MARKERS', () => {
    it('exposes the six markers the P5.5 sweep bans', () => {
      expect([...PLACEHOLDER_MARKERS].sort()).toEqual(
        ['???', 'FIXME', 'TODO', 'lorem', 'placeholder', 'xxx'].sort(),
      )
    })

    it.each(PLACEHOLDER_MARKERS)('flags "%s" embedded in copy', (marker) => {
      expect(containsPlaceholderMarkers(`Some copy ${marker} here`)).toBe(true)
    })

    it('is case-insensitive', () => {
      expect(containsPlaceholderMarkers('todo: write this')).toBe(true)
      expect(containsPlaceholderMarkers('Lorem ipsum dolor')).toBe(true)
      expect(containsPlaceholderMarkers('XXX')).toBe(true)
      expect(containsPlaceholderMarkers('fixme later')).toBe(true)
    })

    it('does not flag ordinary copy, a lone question mark or the Greek question mark', () => {
      expect(containsPlaceholderMarkers('Τι έχω στο ψυγείο;')).toBe(false)
      expect(containsPlaceholderMarkers('What is in my fridge?')).toBe(false)
      expect(containsPlaceholderMarkers('Really??')).toBe(false)
      expect(containsPlaceholderMarkers('')).toBe(false)
    })
  })
})
