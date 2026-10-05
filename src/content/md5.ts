// MD5 — pure TypeScript, dependency-free (RFC 1321). Exists for ONE reason: every seeded content
// row's id is `md5('hygieia:<table>:<slug>')::uuid` (PLAN.md §1.6), computed by the seed generator
// with node `crypto` and asserted by the PGlite gate. The bundled ContentSource must produce the
// SAME ids in the browser, and the Web Crypto API has no MD5 digest. So the formula lives here,
// and md5.test.ts pins it to node's `createHash('md5')` on fixed vectors.
//
// MD5 is NOT used for anything security-related — it is a stable, Postgres-compatible id derivation.

const S = [
  7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14,
  20, 5, 9, 14, 20, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 6, 10, 15, 21, 6,
  10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21,
] as const

// K[i] = floor(2^32 * |sin(i + 1)|), tabulated (RFC 1321 §3.4) rather than computed from Math.sin.
const K = [
  0xd76aa478, 0xe8c7b756, 0x242070db, 0xc1bdceee, 0xf57c0faf, 0x4787c62a, 0xa8304613, 0xfd469501,
  0x698098d8, 0x8b44f7af, 0xffff5bb1, 0x895cd7be, 0x6b901122, 0xfd987193, 0xa679438e, 0x49b40821,
  0xf61e2562, 0xc040b340, 0x265e5a51, 0xe9b6c7aa, 0xd62f105d, 0x02441453, 0xd8a1e681, 0xe7d3fbc8,
  0x21e1cde6, 0xc33707d6, 0xf4d50d87, 0x455a14ed, 0xa9e3e905, 0xfcefa3f8, 0x676f02d9, 0x8d2a4c8a,
  0xfffa3942, 0x8771f681, 0x6d9d6122, 0xfde5380c, 0xa4beea44, 0x4bdecfa9, 0xf6bb4b60, 0xbebfbc70,
  0x289b7ec6, 0xeaa127fa, 0xd4ef3085, 0x04881d05, 0xd9d4d039, 0xe6db99e5, 0x1fa27cf8, 0xc4ac5665,
  0xf4292244, 0x432aff97, 0xab9423a7, 0xfc93a039, 0x655b59c3, 0x8f0ccc92, 0xffeff47d, 0x85845dd1,
  0x6fa87e4f, 0xfe2ce6e0, 0xa3014314, 0x4e0811a1, 0xf7537e82, 0xbd3af235, 0x2ad7d2bb, 0xeb86d391,
] as const

function rotl(x: number, c: number): number {
  return ((x << c) | (x >>> (32 - c))) >>> 0
}

/** Pad per RFC 1321 §3.1–3.2: 0x80, zeros to 56 mod 64, then the bit length as 64-bit little-endian. */
function pad(bytes: Uint8Array): Uint8Array {
  const bitLength = bytes.length * 8
  const total = (((bytes.length + 8) >> 6) + 1) << 6
  const out = new Uint8Array(total)
  out.set(bytes)
  out[bytes.length] = 0x80
  const view = new DataView(out.buffer)
  // Lengths above 2^32 bits (512 MiB) never occur for a slug; the high word still follows the spec.
  view.setUint32(total - 8, bitLength >>> 0, true)
  view.setUint32(total - 4, Math.floor(bitLength / 0x100000000), true)
  return out
}

function hex32le(word: number): string {
  let s = ''
  for (let i = 0; i < 4; i++) s += ((word >>> (8 * i)) & 0xff).toString(16).padStart(2, '0')
  return s
}

/** MD5 of a byte array as 32 lower-case hex characters. */
export function md5Bytes(input: Uint8Array): string {
  const data = pad(input)
  const view = new DataView(data.buffer)
  let a0 = 0x67452301
  let b0 = 0xefcdab89
  let c0 = 0x98badcfe
  let d0 = 0x10325476
  const m = new Array<number>(16)

  for (let offset = 0; offset < data.length; offset += 64) {
    for (let j = 0; j < 16; j++) m[j] = view.getUint32(offset + j * 4, true)
    let a = a0
    let b = b0
    let c = c0
    let d = d0
    for (let i = 0; i < 64; i++) {
      let f: number
      let g: number
      if (i < 16) {
        f = (b & c) | (~b & d)
        g = i
      } else if (i < 32) {
        f = (d & b) | (~d & c)
        g = (5 * i + 1) % 16
      } else if (i < 48) {
        f = b ^ c ^ d
        g = (3 * i + 5) % 16
      } else {
        f = c ^ (b | ~d)
        g = (7 * i) % 16
      }
      const sum = ((f >>> 0) + a + K[i] + (m[g] ?? 0)) >>> 0
      a = d
      d = c
      c = b
      b = (b + rotl(sum, S[i])) >>> 0
    }
    a0 = (a0 + a) >>> 0
    b0 = (b0 + b) >>> 0
    c0 = (c0 + c) >>> 0
    d0 = (d0 + d) >>> 0
  }
  return hex32le(a0) + hex32le(b0) + hex32le(c0) + hex32le(d0)
}

/** MD5 of a string's UTF-8 encoding, as 32 lower-case hex characters — what Postgres `md5(text)` returns. */
export function md5(input: string): string {
  return md5Bytes(new TextEncoder().encode(input))
}

/** Format 32 hex characters as a UUID string the way Postgres `::uuid` renders `md5(...)`. */
export function hexToUuid(hex: string): string {
  if (!/^[0-9a-f]{32}$/.test(hex))
    throw new Error(`hexToUuid: expected 32 hex characters, got "${hex}"`)
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}
