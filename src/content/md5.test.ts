import { describe, expect, it } from 'vitest'
import { hexToUuid, md5, md5Bytes } from './md5'

// Reference digests computed ONCE with node `crypto.createHash('md5')` (the seed generator's
// implementation) and pinned here: src/** tests have no node types, and a vector table is as
// strong a cross-check as a live call. Covers RFC 1321 §A.5, multi-byte UTF-8, astral code points
// and every padding boundary (54–57, 63–65, 119–120, 127–128 bytes, and 200 = multi-block).
const VECTORS: ReadonlyArray<readonly [input: string, hex: string]> = [
  ['', 'd41d8cd98f00b204e9800998ecf8427e'],
  ['a', '0cc175b9c0f1b6a831c399e269772661'],
  ['abc', '900150983cd24fb0d6963f7d28e17f72'],
  ['message digest', 'f96b697d7cb7938d525a2f31aaf161d0'],
  ['abcdefghijklmnopqrstuvwxyz', 'c3fcd3d76192e4007dfb496cca67e13b'],
  [
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
    'd174ab98d277d9f5a5611c2c9f419d9f',
  ],
  [
    '12345678901234567890123456789012345678901234567890123456789012345678901234567890',
    '57edf4a22be3c955ac49da2e2107b67a',
  ],
  ['The quick brown fox jumps over the lazy dog', '9e107d9d372bb6826bd81d3542a419d6'],
  ['hygieia:ingredients:feta', 'f7d7ea29f7f1d64ebf23e2ea533608d2'],
  ['hygieia:recipes:greek-salad', 'da7d02c74bea76bbe40d22f33bcf3206'],
  ['Υγίεια — πρόχειρο, εκκρεμεί έλεγχος', '4c6d5eef96e4d45fd0da59c36c8f45e7'],
  ['🍅🥒🧀', 'd337cf6103275f353e0991ac0992075a'],
  ['x'.repeat(54), '61ea0974c662328da964d977a8253873'],
  ['x'.repeat(55), '04364420e25c512fd958a70738aa8f72'],
  ['x'.repeat(56), '668a72d5ba17f08e62dabcafad6db14b'],
  ['x'.repeat(57), '693037871c4a9d3d8685018905cb530a'],
  ['x'.repeat(63), '7dc2ca208106a2f703567bdff99d8981'],
  ['x'.repeat(64), 'c1bb4f81d892b2d57947682aeb252456'],
  ['x'.repeat(65), '1bc932052302d074bdec39795fe00cf6'],
  ['x'.repeat(119), 'ab347a5f68c8a443cfcddc633f12c24f'],
  ['x'.repeat(120), 'fb98667f98096de92620b64f46e1c5b5'],
  ['x'.repeat(127), 'a0b28c1da68705c2ff883fe279b72753'],
  ['x'.repeat(128), 'd69cb61a6ee87200676eb0d4b90edbcb'],
  ['x'.repeat(200), '30a83621ce5422fbdfdd539777458c78'],
]

describe('md5', () => {
  it.each(VECTORS)('md5(%j) matches node crypto', (input, hex) => {
    expect(md5(input)).toBe(hex)
  })

  it('hashes raw bytes identically to the string form', () => {
    expect(md5Bytes(new TextEncoder().encode('abc'))).toBe(md5('abc'))
  })

  it('always returns 32 lower-case hex characters', () => {
    for (const [input] of VECTORS) expect(md5(input)).toMatch(/^[0-9a-f]{32}$/)
  })
})

describe('hexToUuid', () => {
  it('formats 32 hex characters as 8-4-4-4-12, the way Postgres ::uuid does', () => {
    expect(hexToUuid('d41d8cd98f00b204e9800998ecf8427e')).toBe(
      'd41d8cd9-8f00-b204-e980-0998ecf8427e',
    )
  })

  it('rejects anything that is not 32 lower-case hex characters', () => {
    expect(() => hexToUuid('abc')).toThrow(/32 hex/)
    expect(() => hexToUuid('D41D8CD98F00B204E9800998ECF8427E')).toThrow(/32 hex/)
  })
})
