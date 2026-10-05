/**
 * GOLDEN FINGERPRINT VALUES — the guard the property tests cannot provide.
 *
 * Fingerprints group production errors on the fleet dashboard, and every `fingerprint` quoted
 * in a BRAIN.md §8 telemetry ledger is one of these strings. They are therefore a STORED KEY,
 * not an implementation detail.
 *
 * Property tests — "same inputs group, different inputs don't" — are blind to the failure that
 * matters, because both sides of the comparison move together. Changing the separator's value
 * re-keys every existing row while every such test stays green. MEASURED on 2026-09-13 in
 * zeus-dashboard: mutating the separator failed 7 golden assertions and ZERO of the 14
 * pre-existing ones.
 *
 * These literals were captured immediately before the separator was respelled from a raw NUL
 * byte to '\u0000' (identical value, printable source) and re-verified byte-for-byte after.
 * If one of these fails, the fingerprint space has MOVED — that is a data-migration decision,
 * never a test to update.
 */

import { describe, it, expect } from 'vitest'
import { fingerprint, type FingerprintInput } from './fingerprint'

describe('fingerprint — golden values (changing these re-keys production)', () => {
  const GOLDEN: ReadonlyArray<[FingerprintInput, string]> = [
    [{ product_id: 'ab', error_message: 'c', stack: '' }, '2ms8kdh0a0y6d'],
    [{ product_id: 'a', error_message: 'bc', stack: '' }, 'z371mcjwee0p'],
    [
      {
        product_id: '92864d31',
        error_message: 'TypeError: x is not a function',
        stack: '    at foo (/a/b.ts:1:2)',
      },
      '15n3u2i5k5rxn',
    ],
    [{ product_id: '', error_message: '', stack: '' }, '4hk40ymxlq0d'],
    [
      {
        product_id: 'p',
        error_message: "Cannot read properties of undefined (reading 'id')",
        stack: 'at R (/x.js:9:1)',
      },
      'xrbxwyc9qpv2',
    ],
    [
      {
        product_id: 'unicode',
        error_message: 'h\u00e9llo \u2014 \u2713',
        stack: 'at \u03a9 (/u.ts:3:3)',
      },
      '2axw4kq0vfxo3',
    ],
    [
      {
        product_id: 'nums',
        error_message: 'failed after 1234ms at 0x7ff',
        stack: 'at n (/n.ts:1:1)',
      },
      '1jumjk618j1vf',
    ],
  ]

  for (const [input, expected] of GOLDEN) {
    it(`pins ${JSON.stringify(input.product_id)}`, () => {
      expect(fingerprint(input)).toBe(expected)
    })
  }

  // The separator exists so field BOUNDARIES cannot collide. These two concatenate identically
  // without one, so if it were ever dropped or emptied they would converge.
  it('field boundaries cannot collide — the separator is load-bearing', () => {
    expect(fingerprint({ product_id: 'ab', error_message: 'c', stack: '' })).not.toBe(
      fingerprint({ product_id: 'a', error_message: 'bc', stack: '' }),
    )
  })
})
