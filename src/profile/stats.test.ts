import { describe, expect, it } from 'vitest'
import type { Entry, EntryKind, Goal } from '../user/source'
import {
  addDays,
  currentStreak,
  dayNumber,
  entriesThisWeek,
  entryDays,
  goalProgress,
  isoFromDay,
  localIsoDate,
  longestRun,
  longestStreak,
  runReaches,
  sumOnDay,
  weekIndex,
  weekStart,
} from './stats'

let seq = 0
export function entry(kind: EntryKind, entry_date: string, value: number | null = 1): Entry {
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

const goal = (kind: Goal['kind'], target: number, cadence: Goal['cadence'] = 'daily'): Goal => ({
  kind,
  target,
  unit: 'x',
  cadence,
  updated_at: '',
})

// 2026-10-06 is a Tuesday.
const TODAY = '2026-10-06'

describe('dayNumber / isoFromDay', () => {
  it('round-trips real dates and rejects impossible or malformed ones', () => {
    expect(dayNumber('1970-01-01')).toBe(0)
    expect(dayNumber('1970-01-02')).toBe(1)
    expect(isoFromDay(dayNumber(TODAY) as number)).toBe(TODAY)
    expect(dayNumber('2026-02-30')).toBeNull()
    expect(dayNumber('2026-13-01')).toBeNull()
    expect(dayNumber('06/10/2026')).toBeNull()
    expect(dayNumber('')).toBeNull()
    expect(dayNumber('2024-02-29')).not.toBeNull()
    expect(dayNumber('2023-02-29')).toBeNull()
  })

  it('addDays crosses month and year ends; an invalid date is returned as written', () => {
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01')
    expect(addDays('2026-01-01', -1)).toBe('2025-12-31')
    expect(addDays('nope', 3)).toBe('nope')
  })

  it('localIsoDate uses the LOCAL calendar, zero-padded', () => {
    expect(localIsoDate(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05')
    expect(localIsoDate(new Date(2026, 9, 6, 0, 0))).toBe('2026-10-06')
  })
})

describe('weeks start on Monday', () => {
  it('weekStart returns the Monday of the week; Sunday belongs to the week before Monday', () => {
    expect(weekStart('2026-10-06')).toBe('2026-10-05') // Tue → Mon
    expect(weekStart('2026-10-05')).toBe('2026-10-05') // Mon → itself
    expect(weekStart('2026-10-11')).toBe('2026-10-05') // Sun → the Monday before
    expect(weekStart('2026-10-12')).toBe('2026-10-12') // next Mon
    expect(weekStart('bad')).toBe('bad')
  })

  it('weekIndex is equal across Mon..Sun and increments at the next Monday', () => {
    const mon = dayNumber('2026-10-05') as number
    const sun = dayNumber('2026-10-11') as number
    const nextMon = dayNumber('2026-10-12') as number
    expect(weekIndex(mon)).toBe(weekIndex(sun))
    expect(weekIndex(nextMon)).toBe(weekIndex(mon) + 1)
  })
})

describe('runs', () => {
  it('longestRun finds the longest consecutive stretch and where it ends', () => {
    expect(longestRun([])).toEqual({ length: 0, end: 0 })
    expect(longestRun([5])).toEqual({ length: 1, end: 5 })
    expect(longestRun([1, 2, 3, 7, 8])).toEqual({ length: 3, end: 3 })
    expect(longestRun([1, 2, 5, 6, 7, 9])).toEqual({ length: 3, end: 7 })
  })

  it('runReaches gives the member at which a run first reaches n, or null', () => {
    expect(runReaches([1, 2, 3, 4], 3)).toBe(3)
    expect(runReaches([1, 2, 4, 5, 6], 3)).toBe(6)
    expect(runReaches([1, 3, 5], 2)).toBeNull()
    expect(runReaches([], 1)).toBeNull()
    expect(runReaches([9], 1)).toBe(9)
  })

  it('entryDays is distinct, ascending, optionally one kind, ignoring invalid dates', () => {
    const entries = [
      entry('water', '2026-10-06'),
      entry('water', '2026-10-06'),
      entry('sleep', '2026-10-04'),
      entry('water', 'junk'),
    ]
    expect(entryDays(entries)).toEqual([dayNumber('2026-10-04'), dayNumber('2026-10-06')])
    expect(entryDays(entries, 'sleep')).toEqual([dayNumber('2026-10-04')])
    expect(entryDays(entries, 'mood')).toEqual([])
  })
})

describe('streaks', () => {
  it('currentStreak counts consecutive days ENDING TODAY and is 0 when today is empty', () => {
    const three = [
      entry('water', '2026-10-04'),
      entry('meal', '2026-10-05'),
      entry('sleep', '2026-10-06'),
    ]
    expect(currentStreak(three, TODAY)).toBe(3)
    expect(currentStreak(three.slice(0, 2), TODAY)).toBe(0)
    expect(currentStreak([entry('water', '2026-10-06')], TODAY)).toBe(1)
    expect(currentStreak([], TODAY)).toBe(0)
    expect(currentStreak(three, 'bad')).toBe(0)
  })

  it('a gap breaks the current streak but not the longest one', () => {
    const entries = [
      entry('water', '2026-09-20'),
      entry('water', '2026-09-21'),
      entry('water', '2026-09-22'),
      entry('water', '2026-09-23'),
      entry('water', '2026-10-05'),
      entry('water', '2026-10-06'),
    ]
    expect(currentStreak(entries, TODAY)).toBe(2)
    expect(longestStreak(entries)).toBe(4)
  })
})

describe('this week and goals', () => {
  it('entriesThisWeek keeps Monday..today of the current week and nothing from last Sunday', () => {
    const entries = [
      entry('water', '2026-10-04'), // Sunday before
      entry('water', '2026-10-05'), // Monday
      entry('water', '2026-10-06'), // today
      entry('water', '2026-10-11'), // Sunday of this week (future, still this week)
    ]
    expect(entriesThisWeek(entries, TODAY).map((e) => e.entry_date)).toEqual([
      '2026-10-05',
      '2026-10-06',
      '2026-10-11',
    ])
    expect(entriesThisWeek(entries, 'bad')).toEqual([])
  })

  it('sumOnDay adds the values of one kind on one date', () => {
    const entries = [
      entry('water', TODAY, 500),
      entry('water', TODAY, 250),
      entry('water', '2026-10-05', 1000),
      entry('steps', TODAY, 4000),
      entry('water', TODAY, null),
    ]
    expect(sumOnDay(entries, 'water', TODAY)).toBe(750)
    expect(sumOnDay(entries, 'steps', TODAY)).toBe(4000)
    expect(sumOnDay(entries, 'sleep', TODAY)).toBe(0)
  })

  it('goalProgress: daily sums today only; weekly sums the week; ratio clamps to 1', () => {
    const entries = [
      entry('water', TODAY, 1500),
      entry('water', TODAY, 1000),
      entry('water', '2026-10-05', 800),
      entry('water', '2026-10-04', 999),
    ]
    const daily = goalProgress(entries, goal('water', 2000), TODAY)
    expect(daily.value).toBe(2500)
    expect(daily.ratio).toBe(1)
    const weekly = goalProgress(entries, goal('water', 10000, 'weekly'), TODAY)
    expect(weekly.value).toBe(3300)
    expect(weekly.ratio).toBeCloseTo(0.33)
    expect(goalProgress([], goal('water', 2000), TODAY)).toMatchObject({ value: 0, ratio: 0 })
    expect(goalProgress(entries, goal('water', 0), TODAY).ratio).toBe(0)
  })

  it('a value-less entry (skincare "done today") counts as one session', () => {
    const entries = [entry('skincare', TODAY, null), entry('skincare', TODAY, null)]
    expect(goalProgress(entries, goal('skincare', 2), TODAY)).toMatchObject({
      value: 2,
      ratio: 1,
    })
  })
})
