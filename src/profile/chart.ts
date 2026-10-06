// SPARKLINE (P8.2) — pure SVG path building for the weight trend. No chart library: a 90-day line
// of weights is one `<path d>` and a summary sentence (DECISIONS 2026-10-06 P8.2). X is proportional
// to TIME (a gap of three weeks shows as a gap, not as one step), Y is the value range with a small
// margin so a flat line does not hug the top edge. Numbers are rounded to 2 decimals so the path
// string is stable in tests and small in the DOM.

import type { Entry } from '../user/source'
import { dayNumber } from './stats'

export interface ChartPoint {
  /** `YYYY-MM-DD` */
  date: string
  value: number
}

export interface SparklineOptions {
  width: number
  height: number
  /** Inner margin in px, all sides. */
  padding?: number
}

export interface Sparkline {
  /** `M x y L x y …` — one segment per point in date order. */
  path: string
  /** The projected points, same order as `points` sorted by date. */
  dots: ReadonlyArray<{ x: number; y: number; date: string; value: number }>
  first: ChartPoint
  last: ChartPoint
  /** `last.value - first.value`. */
  delta: number
  min: number
  max: number
}

const round = (n: number) => Math.round(n * 100) / 100

/** Weight entries within the last `days` days up to and including `today`, as chart points (ascending). */
export function weightPoints(entries: readonly Entry[], today: string, days = 90): ChartPoint[] {
  const todayDay = dayNumber(today)
  if (todayDay === null) return []
  const byDate = new Map<string, number>()
  // Entries arrive newest first (`entry_date` desc, then `created_at` desc): the LATEST weight of a day wins.
  for (const entry of entries) {
    if (entry.kind !== 'weight' || entry.value === null) continue
    const day = dayNumber(entry.entry_date)
    if (day === null || day > todayDay || day <= todayDay - days) continue
    if (!byDate.has(entry.entry_date)) byDate.set(entry.entry_date, entry.value)
  }
  return [...byDate.entries()]
    .map(([date, value]) => ({ date, value }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

/** `null` with fewer than two points: a single weight is a number, not a trend. */
export function buildSparkline(
  points: readonly ChartPoint[],
  { width, height, padding = 4 }: SparklineOptions,
): Sparkline | null {
  const sorted = [...points]
    .filter((p) => dayNumber(p.date) !== null && Number.isFinite(p.value))
    .sort((a, b) => a.date.localeCompare(b.date))
  if (sorted.length < 2) return null

  const days = sorted.map((p) => dayNumber(p.date) as number)
  const values = sorted.map((p) => p.value)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const dayMin = days[0]
  const daySpan = Math.max(1, days[days.length - 1] - dayMin)
  const spread = max - min
  // A flat line gets a symbolic ±1 range so it draws through the middle.
  const yMin = spread === 0 ? min - 1 : min - spread * 0.1
  const yMax = spread === 0 ? max + 1 : max + spread * 0.1
  const innerW = Math.max(1, width - padding * 2)
  const innerH = Math.max(1, height - padding * 2)

  const dots = sorted.map((p, i) => ({
    x: round(padding + ((days[i] - dayMin) / daySpan) * innerW),
    y: round(padding + (1 - (p.value - yMin) / (yMax - yMin)) * innerH),
    date: p.date,
    value: p.value,
  }))
  const path = dots.map((d, i) => `${i === 0 ? 'M' : 'L'}${d.x} ${d.y}`).join(' ')
  const first = sorted[0]
  const last = sorted[sorted.length - 1]
  return { path, dots, first, last, delta: round(last.value - first.value), min, max }
}
