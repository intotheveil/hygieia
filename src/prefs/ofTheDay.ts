// "OF THE DAY" (2026-10-06): the recipe and the tip the home page features today. Pure and
// deterministic — no randomness, no server: the same calendar day in Athens (the product's home
// time zone) gives every visitor the same pick, and the pick moves on at Athens midnight.
//
// How: the candidates (after the caller's filter, e.g. the diet preference) are sorted by slug, so
// the input order — which may differ between the bundled seeds and the database — does not matter.
// Days are grouped into cycles of `n` days; each cycle walks a seeded permutation of the list, so
// within a cycle nothing repeats and consecutive days always differ (the cycle boundary is patched
// so the last pick of one cycle is never the first of the next). `seed` separates independent
// streams ("recipe" and "tip" do not move in lock-step).

const DAY_MS = 86_400_000

const athensParts = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Europe/Athens',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

/** Days since 1970-01-01 of the CALENDAR DATE `date` falls on in Europe/Athens. */
export function athensDayNumber(date: Date): number {
  let y = 0
  let m = 0
  let d = 0
  for (const part of athensParts.formatToParts(date)) {
    if (part.type === 'year') y = Number(part.value)
    else if (part.type === 'month') m = Number(part.value)
    else if (part.type === 'day') d = Number(part.value)
  }
  return Math.round(Date.UTC(y, m - 1, d) / DAY_MS)
}

/** FNV-1a, 32-bit: a stable string hash. */
function hash(text: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

/** mulberry32: a small seeded PRNG (the same family plans/generate.ts uses). */
function rng(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** A seeded Fisher–Yates permutation of 0..n-1. */
function permutation(n: number, seed: number): number[] {
  const out = Array.from({ length: n }, (_, i) => i)
  const next = rng(seed)
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(next() * (i + 1))
    const tmp = out[i] as number
    out[i] = out[j] as number
    out[j] = tmp
  }
  return out
}

/** Cycle `cycle`'s order, patched so it never starts with the previous cycle's last pick (n ≥ 3). */
function cycleOrder(n: number, seed: string, cycle: number): number[] {
  const order = permutation(n, hash(`${seed}:${cycle}`))
  if (n > 1) {
    const previous = permutation(n, hash(`${seed}:${cycle - 1}`))
    if (order[0] === previous[n - 1]) {
      const tmp = order[0] as number
      order[0] = order[1] as number
      order[1] = tmp
    }
  }
  return order
}

const bySlug = (a: { slug: string }, b: { slug: string }) =>
  a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0

/**
 * Today's item: deterministic for (`items` as a set, the Athens day of `date`, `seed`, `keep`).
 * `keep` narrows the candidates (the diet preference); null when nothing is left.
 */
export function pickOfTheDay<T extends { slug: string }>(
  items: readonly T[],
  date: Date,
  seed: string,
  keep?: (item: T) => boolean,
): T | null {
  const candidates = (keep ? items.filter(keep) : [...items]).sort(bySlug)
  const n = candidates.length
  if (n === 0) return null
  const day = athensDayNumber(date)
  // Two candidates simply alternate (the boundary patch below swaps positions 0 and 1, which for
  // n = 2 would also move the previous cycle's LAST pick).
  if (n === 2) return candidates[(day + hash(seed)) % 2] ?? null
  const cycle = Math.floor(day / n)
  const index = cycleOrder(n, seed, cycle)[day - cycle * n] as number
  return candidates[index] ?? null
}
