import { describe, expect, it } from 'vitest'
import type { Entry } from '../user/source'
import { buildSparkline, weightPoints, type ChartPoint } from './chart'

const TODAY = '2026-10-06'

let seq = 0
function weight(entry_date: string, value: number | null, created = '08:00'): Entry {
  seq += 1
  return {
    id: `w${seq}`,
    kind: 'weight',
    entry_date,
    value,
    unit: 'kg',
    payload: null,
    note: null,
    created_at: `${entry_date}T${created}:00.000Z`,
  }
}

describe('weightPoints', () => {
  it('keeps weight entries of the last 90 days up to today, ascending by date', () => {
    const entries = [
      weight('2026-10-06', 78),
      weight('2026-09-01', 80),
      weight('2026-07-09', 82), // 89 days back: the oldest day of the 90-day window, in
      weight('2026-07-08', 83), // 90 days back: just outside the window, out
      weight('2026-10-07', 70), // future: out
      { ...weight('2026-10-05', 500), kind: 'water' as const }, // not weight: out
      weight('2026-10-04', null), // no value: out
    ]
    expect(weightPoints(entries, TODAY)).toEqual([
      { date: '2026-07-09', value: 82 },
      { date: '2026-09-01', value: 80 },
      { date: '2026-10-06', value: 78 },
    ])
  })

  it('two weights on one day: the first in list order (newest created) wins', () => {
    const entries = [weight('2026-10-06', 77.5, '20:00'), weight('2026-10-06', 78, '07:00')]
    expect(weightPoints(entries, TODAY)).toEqual([{ date: '2026-10-06', value: 77.5 }])
  })

  it('honours a custom window and an invalid today', () => {
    const entries = [weight('2026-10-06', 78), weight('2026-09-30', 79), weight('2026-09-29', 80)]
    expect(weightPoints(entries, TODAY, 7).map((p) => p.date)).toEqual(['2026-09-30', '2026-10-06'])
    expect(weightPoints(entries, 'bad')).toEqual([])
  })
})

describe('buildSparkline', () => {
  const opts = { width: 100, height: 50, padding: 10 }

  it('is null with fewer than two valid points', () => {
    expect(buildSparkline([], opts)).toBeNull()
    expect(buildSparkline([{ date: '2026-10-01', value: 80 }], opts)).toBeNull()
    expect(
      buildSparkline(
        [
          { date: '2026-10-01', value: 80 },
          { date: 'junk', value: 81 },
        ],
        opts,
      ),
    ).toBeNull()
  })

  it('spaces x by TIME, not by index, and spans the inner width', () => {
    const points: ChartPoint[] = [
      { date: '2026-10-01', value: 80 },
      { date: '2026-10-02', value: 81 },
      { date: '2026-10-04', value: 82 },
    ]
    const chart = buildSparkline(points, opts)
    expect(chart).not.toBeNull()
    const xs = chart!.dots.map((d) => d.x)
    // inner width 80: day 0 → 10, day 1 → 10 + 80/3, day 3 → 90
    expect(xs[0]).toBe(10)
    expect(xs[1]).toBeCloseTo(10 + 80 / 3, 1)
    expect(xs[2]).toBe(90)
  })

  it('puts the maximum near the top and the minimum near the bottom, inside a 10 % margin', () => {
    const chart = buildSparkline(
      [
        { date: '2026-10-01', value: 70 },
        { date: '2026-10-02', value: 80 },
      ],
      opts,
    )!
    // spread 10 → y range 69..81 (12), inner height 30: 80 → 10 + (1 - 11/12) * 30 = 12.5; 70 → 37.5
    expect(chart.dots[0].y).toBe(37.5)
    expect(chart.dots[1].y).toBe(12.5)
    expect(chart.min).toBe(70)
    expect(chart.max).toBe(80)
  })

  it('draws a flat series through the middle', () => {
    const chart = buildSparkline(
      [
        { date: '2026-10-01', value: 75 },
        { date: '2026-10-03', value: 75 },
      ],
      opts,
    )!
    expect(chart.dots.map((d) => d.y)).toEqual([25, 25])
    expect(chart.delta).toBe(0)
  })

  it('builds one M and n-1 L segments, sorts by date, and reports first/last/delta rounded', () => {
    const chart = buildSparkline(
      [
        { date: '2026-10-05', value: 78.123 },
        { date: '2026-10-01', value: 80.5 },
        { date: '2026-10-03', value: 79 },
      ],
      opts,
    )!
    expect(chart.path).toMatch(/^M[\d.]+ [\d.]+ L[\d.]+ [\d.]+ L[\d.]+ [\d.]+$/)
    expect(chart.first).toEqual({ date: '2026-10-01', value: 80.5 })
    expect(chart.last).toEqual({ date: '2026-10-05', value: 78.123 })
    expect(chart.delta).toBe(-2.38)
    expect(chart.dots.map((d) => d.date)).toEqual(['2026-10-01', '2026-10-03', '2026-10-05'])
  })

  it('defaults the padding to 4 and never divides by zero on a 1-day span', () => {
    const chart = buildSparkline(
      [
        { date: '2026-10-01', value: 1 },
        { date: '2026-10-02', value: 2 },
      ],
      { width: 20, height: 20 },
    )!
    expect(chart.dots[0].x).toBe(4)
    expect(chart.dots[1].x).toBe(16)
    for (const dot of chart.dots) expect(Number.isFinite(dot.y)).toBe(true)
  })
})
