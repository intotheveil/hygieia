import { athensDayNumber, pickOfTheDay } from './ofTheDay'

interface Item {
  slug: string
  even: boolean
}

const items = (n: number): Item[] =>
  Array.from({ length: n }, (_, i) => ({
    slug: `item-${String(i).padStart(3, '0')}`,
    even: i % 2 === 0,
  }))
const LIST = items(37)
const DAY_MS = 86_400_000

/** Noon UTC on the given day (well inside the same Athens calendar day). */
const day = (iso: string) => new Date(`${iso}T12:00:00Z`)
const plusDays = (date: Date, n: number) => new Date(date.getTime() + n * DAY_MS)

describe('athensDayNumber', () => {
  it('counts calendar days in Europe/Athens, not UTC', () => {
    expect(athensDayNumber(new Date('1970-01-01T12:00:00Z'))).toBe(0)
    // 22:30 UTC on 5 Oct is 01:30 on 6 Oct in Athens (UTC+3, summer time).
    expect(athensDayNumber(new Date('2026-10-05T22:30:00Z'))).toBe(
      athensDayNumber(day('2026-10-06')),
    )
    // 20:30 UTC on 5 Oct is still 23:30 on 5 Oct in Athens.
    expect(athensDayNumber(new Date('2026-10-05T20:30:00Z'))).toBe(
      athensDayNumber(day('2026-10-05')),
    )
    // Winter (UTC+2): 22:30 UTC on 5 Jan is 00:30 on 6 Jan in Athens.
    expect(athensDayNumber(new Date('2026-01-05T22:30:00Z'))).toBe(
      athensDayNumber(day('2026-01-06')),
    )
    expect(athensDayNumber(day('2026-10-07')) - athensDayNumber(day('2026-10-06'))).toBe(1)
  })
})

describe('pickOfTheDay', () => {
  it('returns null for an empty list, or when the filter leaves nothing', () => {
    expect(pickOfTheDay<Item>([], day('2026-10-06'), 'recipe')).toBeNull()
    expect(pickOfTheDay(LIST, day('2026-10-06'), 'recipe', () => false)).toBeNull()
  })

  it('is stable within an Athens day (any hour, any input order)', () => {
    const justAfterMidnight = new Date('2026-10-05T21:05:00Z') // 00:05 on 6 Oct in Athens
    const justBeforeMidnight = new Date('2026-10-06T20:55:00Z') // 23:55 on 6 Oct in Athens
    const pick = pickOfTheDay(LIST, justAfterMidnight, 'recipe')
    expect(pick).not.toBeNull()
    expect(pickOfTheDay(LIST, justBeforeMidnight, 'recipe')).toBe(pick)
    expect(pickOfTheDay([...LIST].reverse(), justBeforeMidnight, 'recipe')).toBe(pick)
    expect(pickOfTheDay(LIST, day('2026-10-06'), 'recipe')).toBe(pick)
  })

  it('moves on at Athens midnight, not UTC midnight', () => {
    const before = new Date('2026-10-06T20:59:00Z') // 23:59 Athens, 6 Oct
    const after = new Date('2026-10-06T21:01:00Z') // 00:01 Athens, 7 Oct (still 6 Oct in UTC)
    expect(pickOfTheDay(LIST, after, 'recipe')).not.toBe(pickOfTheDay(LIST, before, 'recipe'))
    expect(pickOfTheDay(LIST, after, 'recipe')).toBe(
      pickOfTheDay(LIST, day('2026-10-07'), 'recipe'),
    )
  })

  it('changes from one day to the next, every day for two years, for list sizes 2 to 40', () => {
    for (let n = 2; n <= 40; n++) {
      const list = items(n)
      let previous = pickOfTheDay(list, day('2026-01-01'), 'tip')
      for (let d = 1; d < 730; d++) {
        const pick = pickOfTheDay(list, plusDays(day('2026-01-01'), d), 'tip')
        if (pick === previous) expect.fail(`n=${n}: day +${d} repeats ${pick?.slug}`)
        previous = pick
      }
    }
  })

  it('visits every item once per cycle of n days (no favourites)', () => {
    const n = LIST.length
    const cycleStart = Math.ceil(athensDayNumber(day('2026-10-06')) / n) * n
    const seen = new Set<string>()
    for (let d = 0; d < n; d++) {
      const date = new Date((cycleStart + d) * DAY_MS + 12 * 3_600_000)
      seen.add(pickOfTheDay(LIST, date, 'recipe')?.slug ?? '')
    }
    expect(seen.size).toBe(n)
  })

  it('respects the filter', () => {
    const seen = new Set<string>()
    for (let d = 0; d < 60; d++) {
      const pick = pickOfTheDay(LIST, plusDays(day('2026-10-06'), d), 'recipe', (i) => i.even)
      expect(pick?.even).toBe(true)
      seen.add(pick?.slug ?? '')
    }
    expect(seen.size).toBe(LIST.filter((i) => i.even).length)
  })

  it('separates streams by seed (recipe and tip do not move in lock-step)', () => {
    let same = 0
    for (let d = 0; d < 60; d++) {
      const date = plusDays(day('2026-10-06'), d)
      if (pickOfTheDay(LIST, date, 'recipe') === pickOfTheDay(LIST, date, 'tip')) same++
    }
    expect(same).toBeLessThan(10)
  })

  it('picks the only item every day', () => {
    const one = items(1)
    expect(pickOfTheDay(one, day('2026-10-06'), 'x')).toBe(one[0])
    expect(pickOfTheDay(one, day('2026-10-07'), 'x')).toBe(one[0])
  })
})
