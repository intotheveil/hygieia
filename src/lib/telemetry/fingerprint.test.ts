import { describe, expect, it } from 'vitest'
import { fingerprint } from './fingerprint'

const base = { product_id: 'ares', error_message: 'boom', stack: 'at f (a.js:1:1)' }
const fp = (error_message: string): string => fingerprint({ product_id: 'ares', error_message })

describe('fingerprint — deterministic error grouping', () => {
  it('is deterministic: identical input → identical fingerprint', () => {
    expect(fingerprint(base)).toBe(fingerprint({ ...base }))
  })

  it('returns a non-empty base36 string', () => {
    expect(fingerprint(base)).toMatch(/^[0-9a-z]+$/)
  })
})

describe('groups trivially-different duplicates to ONE fingerprint', () => {
  it('long numeric ids (4+ digits) collapse', () => {
    expect(fp('user 4821 not found')).toBe(fp('user 9999 not found'))
  })

  it('UUIDs collapse', () => {
    expect(fp('missing 550e8400-e29b-41d4-a716-446655440000')).toBe(
      fp('missing 3f2504e0-4f89-41d3-9a0c-0305e82c3301'),
    )
  })

  it('hex addresses collapse', () => {
    expect(fp('segfault at 0x1a2b3c')).toBe(fp('segfault at 0xdeadbeef'))
  })

  it('quoted string literals collapse', () => {
    expect(fp('cannot read "userName"')).toBe(fp('cannot read "email"'))
    expect(fp("bad value 'x'")).toBe(fp("bad value 'yz'"))
  })

  it('whitespace differences collapse', () => {
    expect(fp('foo\n\n   bar')).toBe(fp('foo bar'))
  })
})

describe('keeps meaningful differences DISTINCT', () => {
  it('3-digit codes stay distinct (404 vs 500)', () => {
    expect(fp('code 404')).not.toBe(fp('code 500'))
  })

  it('different product_id → different fingerprint', () => {
    expect(fingerprint({ product_id: 'ares', error_message: 'x' })).not.toBe(
      fingerprint({ product_id: 'cicada', error_message: 'x' }),
    )
  })

  it('different top stack frame → different fingerprint', () => {
    expect(
      fingerprint({ product_id: 'ares', error_message: 'x', stack: 'at a (a.js:1:1)' }),
    ).not.toBe(fingerprint({ product_id: 'ares', error_message: 'x', stack: 'at b (b.js:2:2)' }))
  })
})

describe('top stack frame extraction', () => {
  it('uses the first "at …" frame, skipping the "Error:" header', () => {
    const withHeader = {
      product_id: 'ares',
      error_message: 'x',
      stack: 'Error: boom\n    at f (a.js:1:1)\n    at g (b.js:2:2)',
    }
    const frameOnly = { product_id: 'ares', error_message: 'x', stack: 'at f (a.js:1:1)' }
    expect(fingerprint(withHeader)).toBe(fingerprint(frameOnly))
  })

  it('supports Firefox/Safari "fn@file:line" frames deterministically', () => {
    const ff = { product_id: 'ares', error_message: 'x', stack: 'f@a.js:1:1\ng@b.js:2:2' }
    expect(fingerprint(ff)).toBe(fingerprint({ ...ff }))
    expect(fingerprint(ff)).not.toBe(
      fingerprint({ product_id: 'ares', error_message: 'x', stack: 'z@c.js:9:9' }),
    )
  })
})

describe('never throws on missing / odd input', () => {
  it('handles a missing stack and empty fields', () => {
    expect(() => fingerprint({ product_id: 'ares', error_message: 'x' })).not.toThrow()
    expect(fingerprint({ product_id: '', error_message: '' })).toMatch(/^[0-9a-z]+$/)
  })

  it('coerces null-ish input without throwing', () => {
    // @ts-expect-error — untrusted caller may pass null
    expect(() => fingerprint(null)).not.toThrow()
    // @ts-expect-error — untrusted caller may pass an empty object
    expect(() => fingerprint({})).not.toThrow()
  })
})
