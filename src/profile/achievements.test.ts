import { describe, expect, it } from 'vitest'
import type { Entry, EntryKind, Goal, SavedItem } from '../user/source'
import { BADGE_IDS, computeAchievements, type Achievement, type BadgeId } from './achievements'
import { addDays } from './stats'

// 2026-10-06 is a Tuesday.
const TODAY = '2026-10-06'

let seq = 0
function entry(kind: EntryKind, entry_date: string, value: number | null = 1): Entry {
  seq += 1
  return {
    id: `e${seq}`,
    kind,
    entry_date,
    value,
    unit: null,
    payload: null,
    note: null,
    created_at: `${entry_date}T08:00:00.000Z`,
  }
}

/** `n` entries of `kind` on consecutive days ENDING on `end` (default today). */
function daily(kind: EntryKind, n: number, end = TODAY, value: number | null = 1): Entry[] {
  return Array.from({ length: n }, (_, i) => entry(kind, addDays(end, -(n - 1 - i)), value))
}

/** One entry of `kind` per week, on consecutive Mondays ending with the Monday of `end`'s week. */
function weekly(kind: EntryKind, n: number, lastMonday = '2026-10-05'): Entry[] {
  return Array.from({ length: n }, (_, i) => entry(kind, addDays(lastMonday, -7 * (n - 1 - i))))
}

const goal = (kind: Goal['kind'], target: number, cadence: Goal['cadence'] = 'daily'): Goal => ({
  kind,
  target,
  unit: 'x',
  cadence,
  updated_at: '',
})

const saved = (n: number): SavedItem[] =>
  Array.from({ length: n }, (_, i) => ({ kind: 'diet', item_id: `d${i}`, created_at: '' }))

function compute(
  entries: Entry[],
  extra: { goals?: Goal[]; favouritesCount?: number; savedItems?: SavedItem[] } = {},
) {
  const list = computeAchievements({
    entries,
    goals: extra.goals ?? [],
    favouritesCount: extra.favouritesCount ?? 0,
    savedItems: extra.savedItems ?? [],
    today: TODAY,
  })
  const byId = new Map(list.map((a) => [a.id, a]))
  return { list, get: (id: BadgeId): Achievement => byId.get(id) as Achievement }
}

describe('computeAchievements — shape', () => {
  it('returns every badge in BADGE_IDS order, ≥ 14 of them, progress in 0..1, earned ⇔ progress 1', () => {
    expect(BADGE_IDS.length).toBeGreaterThanOrEqual(14)
    for (const entries of [[], daily('water', 40, TODAY, 2000)]) {
      const { list } = compute(entries, { goals: [goal('water', 2000)] })
      expect(list.map((a) => a.id)).toEqual([...BADGE_IDS])
      for (const a of list) {
        expect(a.progress).toBeGreaterThanOrEqual(0)
        expect(a.progress).toBeLessThanOrEqual(1)
        expect(a.earned).toBe(a.progress === 1)
        if (!a.earned) expect(a.earnedOn).toBeUndefined()
      }
    }
  })

  it('with no data nothing is earned and every progress is 0', () => {
    const { list } = compute([])
    expect(list.every((a) => !a.earned && a.progress === 0)).toBe(true)
  })

  it('ignores entries with an invalid date', () => {
    const { get } = compute([entry('water', 'junk'), entry('water', '2026-02-30')])
    expect(get('first-entry')).toEqual({ id: 'first-entry', earned: false, progress: 0 })
  })
})

describe('first-entry', () => {
  it('is earned by one entry, dated to the earliest one', () => {
    const { get } = compute([entry('meal', '2026-10-03'), entry('water', '2026-09-30')])
    expect(get('first-entry')).toEqual({
      id: 'first-entry',
      earned: true,
      progress: 1,
      earnedOn: '2026-09-30',
    })
  })
})

describe('streaks of any kind', () => {
  it('streak-3: two days is 2/3, three consecutive days earns it on the third', () => {
    expect(compute(daily('water', 2)).get('streak-3')).toMatchObject({
      earned: false,
      progress: 2 / 3,
    })
    expect(compute(daily('water', 3)).get('streak-3')).toEqual({
      id: 'streak-3',
      earned: true,
      progress: 1,
      earnedOn: TODAY,
    })
  })

  it('a streak may mix kinds and need not end today; a gap resets it', () => {
    const mixed = [
      entry('water', '2026-09-01'),
      entry('meal', '2026-09-02'),
      entry('mood', '2026-09-03'),
    ]
    expect(compute(mixed).get('streak-3')).toMatchObject({ earned: true, earnedOn: '2026-09-03' })
    const gap = [
      entry('water', '2026-09-01'),
      entry('water', '2026-09-02'),
      entry('water', '2026-09-04'),
    ]
    expect(compute(gap).get('streak-3')).toMatchObject({ earned: false, progress: 2 / 3 })
  })

  it('streak-7 and streak-30 scale the same way', () => {
    const six = compute(daily('steps', 6))
    expect(six.get('streak-7')).toMatchObject({ earned: false, progress: 6 / 7 })
    expect(six.get('streak-30')).toMatchObject({ earned: false, progress: 6 / 30 })
    const thirty = compute(daily('steps', 30))
    expect(thirty.get('streak-7')).toMatchObject({ earned: true, earnedOn: addDays(TODAY, -23) })
    expect(thirty.get('streak-30')).toMatchObject({ earned: true, earnedOn: TODAY })
  })
})

describe('counts', () => {
  it('workouts-10 / workouts-50 count workout entries (several per day allowed), dated to the n-th', () => {
    const nine = compute(daily('workout', 9))
    expect(nine.get('workouts-10')).toMatchObject({ earned: false, progress: 0.9 })
    expect(nine.get('workouts-50')).toMatchObject({ earned: false, progress: 9 / 50 })
    const twoADay = [...daily('workout', 5), ...daily('workout', 5)]
    expect(compute(twoADay).get('workouts-10')).toMatchObject({ earned: true, earnedOn: TODAY })
    const fifty = compute(daily('workout', 50))
    expect(fifty.get('workouts-50')).toMatchObject({ earned: true, earnedOn: TODAY })
    // The 10th workout in date order was 41 days ago.
    expect(fifty.get('workouts-10').earnedOn).toBe(addDays(TODAY, -40))
  })

  it('meals-30 counts meals', () => {
    expect(compute(daily('meal', 15)).get('meals-30')).toMatchObject({
      earned: false,
      progress: 0.5,
    })
    expect(compute(daily('meal', 30)).get('meals-30')).toMatchObject({
      earned: true,
      earnedOn: TODAY,
    })
  })

  it('collector-10 adds favourites and saved items', () => {
    expect(compute([], { favouritesCount: 3, savedItems: saved(2) }).get('collector-10')).toEqual({
      id: 'collector-10',
      earned: false,
      progress: 0.5,
    })
    expect(compute([], { favouritesCount: 6, savedItems: saved(4) }).get('collector-10')).toEqual({
      id: 'collector-10',
      earned: true,
      progress: 1,
    })
  })

  it('all-rounder needs every one of the nine kinds at least once', () => {
    const three = [entry('water', TODAY), entry('meal', TODAY), entry('mood', TODAY)]
    expect(compute(three).get('all-rounder')).toMatchObject({ earned: false, progress: 3 / 9 })
    const kinds: EntryKind[] = [
      'weight',
      'meal',
      'workout',
      'water',
      'sleep',
      'steps',
      'skincare',
      'nails',
      'mood',
    ]
    expect(compute(kinds.map((k) => entry(k, TODAY))).get('all-rounder')).toEqual({
      id: 'all-rounder',
      earned: true,
      progress: 1,
    })
  })
})

describe('goal weeks (daily goal met seven days running)', () => {
  it('hydration-week needs a DAILY water goal and the daily SUM to reach it', () => {
    // Two 1000 ml entries a day for 7 days against a 2000 ml goal.
    const entries = [...daily('water', 7, TODAY, 1000), ...daily('water', 7, TODAY, 1000)]
    expect(compute(entries).get('hydration-week')).toMatchObject({ earned: false, progress: 0 })
    expect(
      compute(entries, { goals: [goal('water', 2000, 'weekly')] }).get('hydration-week'),
    ).toMatchObject({
      earned: false,
      progress: 0,
    })
    expect(compute(entries, { goals: [goal('water', 2000)] }).get('hydration-week')).toEqual({
      id: 'hydration-week',
      earned: true,
      progress: 1,
      earnedOn: TODAY,
    })
    expect(compute(entries, { goals: [goal('water', 2001)] }).get('hydration-week')).toMatchObject({
      earned: false,
      progress: 0,
    })
  })

  it('a day under target breaks the run; six good days is 6/7', () => {
    const six = daily('water', 6, TODAY, 2000)
    expect(compute(six, { goals: [goal('water', 2000)] }).get('hydration-week')).toMatchObject({
      earned: false,
      progress: 6 / 7,
    })
    const broken = [
      ...daily('water', 3, addDays(TODAY, -4), 2000),
      entry('water', addDays(TODAY, -3), 100),
      ...daily('water', 3, TODAY, 2000),
    ]
    expect(compute(broken, { goals: [goal('water', 2000)] }).get('hydration-week')).toMatchObject({
      earned: false,
      progress: 3 / 7,
    })
  })

  it('sleep-week and steps-week use their own goals', () => {
    const entries = [...daily('sleep', 7, TODAY, 8), ...daily('steps', 7, TODAY, 8000)]
    const { get } = compute(entries, { goals: [goal('sleep', 7.5), goal('steps', 10000)] })
    expect(get('sleep-week')).toMatchObject({ earned: true, earnedOn: TODAY })
    expect(get('steps-week')).toMatchObject({ earned: false, progress: 0 })
    expect(get('hydration-week')).toMatchObject({ earned: false, progress: 0 })
  })
})

describe('weekly habits', () => {
  it('weight-4-weeks: a weight in four consecutive Monday-weeks, dated to that fourth week’s Sunday', () => {
    expect(compute(weekly('weight', 3)).get('weight-4-weeks')).toMatchObject({
      earned: false,
      progress: 0.75,
    })
    expect(compute(weekly('weight', 4)).get('weight-4-weeks')).toEqual({
      id: 'weight-4-weeks',
      earned: true,
      progress: 1,
      earnedOn: '2026-10-11',
    })
  })

  it('a skipped week breaks the weekly run; several entries in one week count once', () => {
    const skipped = [...weekly('weight', 2, '2026-09-21'), ...weekly('weight', 2, '2026-10-12')]
    expect(compute(skipped).get('weight-4-weeks')).toMatchObject({ earned: false, progress: 0.5 })
    const sameWeek = [
      entry('nails', '2026-10-05'),
      entry('nails', '2026-10-06'),
      entry('nails', '2026-10-07'),
    ]
    expect(compute(sameWeek).get('nails-4-weeks')).toMatchObject({ earned: false, progress: 0.25 })
  })

  it('nails-4-weeks mirrors weight-4-weeks for nail entries', () => {
    expect(compute(weekly('nails', 4)).get('nails-4-weeks')).toMatchObject({
      earned: true,
      earnedOn: '2026-10-11',
    })
    expect(compute(weekly('weight', 4)).get('nails-4-weeks')).toMatchObject({
      earned: false,
      progress: 0,
    })
  })
})

describe('daily habits of one kind', () => {
  it('skincare-14 needs fourteen consecutive skincare days', () => {
    expect(compute(daily('skincare', 13, TODAY, null)).get('skincare-14')).toMatchObject({
      earned: false,
      progress: 13 / 14,
    })
    expect(compute(daily('skincare', 14, TODAY, null)).get('skincare-14')).toMatchObject({
      earned: true,
      earnedOn: TODAY,
    })
    // Other kinds do not count toward it.
    expect(compute(daily('water', 14)).get('skincare-14')).toMatchObject({
      earned: false,
      progress: 0,
    })
  })

  it('mood-7 needs seven consecutive mood check-ins', () => {
    expect(compute(daily('mood', 4, TODAY, 3)).get('mood-7')).toMatchObject({
      earned: false,
      progress: 4 / 7,
    })
    expect(compute(daily('mood', 7, TODAY, 3)).get('mood-7')).toMatchObject({
      earned: true,
      earnedOn: TODAY,
    })
  })
})
