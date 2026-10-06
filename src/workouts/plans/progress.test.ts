import { describe, expect, it } from 'vitest'
import { PRESS, SQUAT, session, set } from './fixtures'
import {
  chronological,
  detectPRs,
  doneSets,
  epley,
  exerciseProgress,
  setVolume,
  summarizeSession,
  trainedExercises,
  weeklyVolume,
} from './progress'

const sq = (sets: ReturnType<typeof set>[]) => ({ exercise_id: SQUAT.id, sets })
const bp = (sets: ReturnType<typeof set>[]) => ({ exercise_id: PRESS.id, sets })

describe('epley', () => {
  it('is w × (1 + reps / 30)', () => {
    expect(epley(100, 10)).toBeCloseTo(133.333, 3)
    expect(epley(60, 5)).toBeCloseTo(70, 10)
    expect(epley(100, 1)).toBeCloseTo(103.333, 3)
    expect(epley(80, 30)).toBe(160)
  })
  it('is null without a load or without a rep', () => {
    expect(epley(null, 10)).toBeNull()
    expect(epley(0, 10)).toBeNull()
    expect(epley(100, 0)).toBeNull()
  })
})

describe('session helpers', () => {
  const s = session('2026-10-01', [
    sq([set(5, 100), set(5, 100, false)]),
    bp([set(10, 40), set(8, null)]),
    sq([set(3, 110)]),
  ])

  it('doneSets gathers the done sets of an exercise across its slots', () => {
    expect(doneSets(s, SQUAT.id)).toEqual([set(5, 100), set(3, 110)])
    expect(doneSets(s, 'nope')).toEqual([])
  })

  it('setVolume is reps × weight for a done set with a weight, else 0', () => {
    expect(setVolume(set(5, 100))).toBe(500)
    expect(setVolume(set(5, 100, false))).toBe(0)
    expect(setVolume(set(12, null))).toBe(0)
  })

  it('summarizeSession counts distinct exercises, done / total sets and volume', () => {
    expect(summarizeSession(s)).toEqual({
      exercises: 2,
      doneSets: 4,
      totalSets: 5,
      volume: 500 + 400 + 330,
    })
  })

  it('chronological sorts by date then created_at without mutating', () => {
    const a = session('2026-10-02', [])
    const b = session('2026-10-01', [])
    const c = session('2026-10-02', [], { created_at: '2026-10-02T06:00:00.000Z' })
    const input = [a, b, c]
    expect(chronological(input).map((x) => x.id)).toEqual([b.id, c.id, a.id])
    expect(input).toEqual([a, b, c])
  })
})

describe('exerciseProgress', () => {
  it('is empty for no sessions', () => {
    expect(exerciseProgress([], SQUAT.id)).toEqual({
      exercise_id: SQUAT.id,
      sessions: 0,
      bestSet: null,
      bestE1rm: null,
      totalVolume: 0,
      trend: [],
    })
  })

  it('reads a single session', () => {
    const one = session('2026-10-01', [sq([set(5, 100), set(8, 90)])])
    const p = exerciseProgress([one], SQUAT.id)
    expect(p.sessions).toBe(1)
    expect(p.bestSet).toEqual({
      reps: 5,
      weight_kg: 100,
      e1rm: epley(100, 5),
      performed_at: '2026-10-01',
    })
    // 100 × (1 + 5/30) = 116.67 beats 90 × (1 + 8/30) = 114.
    expect(p.bestE1rm).toBeCloseTo(116.667, 3)
    expect(p.totalVolume).toBe(500 + 720)
    expect(p.trend).toEqual([
      {
        session_id: one.id,
        date: '2026-10-01',
        e1rm: epley(100, 5),
        topWeight: 100,
        bestReps: 8,
        volume: 1220,
      },
    ])
  })

  it('takes the heavier set as best, more reps breaking a tie; counts only done sets', () => {
    const s1 = session('2026-10-01', [sq([set(5, 100), set(12, 120, false)])])
    const s2 = session('2026-10-03', [sq([set(6, 100)])])
    const p = exerciseProgress([s2, s1], SQUAT.id)
    expect(p.bestSet).toMatchObject({ reps: 6, weight_kg: 100, performed_at: '2026-10-03' })
    expect(p.sessions).toBe(2)
    expect(p.totalVolume).toBe(1100)
  })

  it('handles bodyweight sets: best by reps, no e1rm', () => {
    const p = exerciseProgress(
      [session('2026-10-01', [bp([set(12, null), set(15, null)])])],
      PRESS.id,
    )
    expect(p.bestSet).toMatchObject({ reps: 15, weight_kg: null, e1rm: null })
    expect(p.bestE1rm).toBeNull()
    expect(p.trend[0]).toMatchObject({ e1rm: null, topWeight: null, bestReps: 15, volume: 0 })
  })

  it('ignores sessions with no done set of the exercise and keeps the LAST 8, oldest first', () => {
    const sessions = Array.from({ length: 10 }, (_, i) =>
      session(`2026-09-${String(10 + i).padStart(2, '0')}`, [sq([set(5, 60 + i)])]),
    )
    sessions.push(session('2026-09-30', [sq([set(5, 200, false)])]))
    sessions.push(session('2026-09-29', [bp([set(5, 50)])]))
    const p = exerciseProgress(sessions, SQUAT.id)
    expect(p.sessions).toBe(10)
    expect(p.trend.map((t) => t.date)).toEqual([
      '2026-09-12',
      '2026-09-13',
      '2026-09-14',
      '2026-09-15',
      '2026-09-16',
      '2026-09-17',
      '2026-09-18',
      '2026-09-19',
    ])
    expect(p.trend.map((t) => t.topWeight)).toEqual([62, 63, 64, 65, 66, 67, 68, 69])
    expect(p.bestSet?.weight_kg).toBe(69)
    expect(exerciseProgress(sessions, SQUAT.id, 3).trend).toHaveLength(3)
  })
})

describe('detectPRs', () => {
  it('never marks the first session of an exercise', () => {
    expect(detectPRs([session('2026-10-01', [sq([set(5, 100)])])]).size).toBe(0)
    expect(detectPRs([])).toEqual(new Map())
  })

  it('marks a heavier set as a weight and an est-1RM record', () => {
    const s1 = session('2026-10-01', [sq([set(5, 100)])])
    const s2 = session('2026-10-03', [sq([set(5, 105)])])
    const prs = detectPRs([s2, s1])
    expect(prs.has(s1.id)).toBe(false)
    expect(prs.get(s2.id)).toEqual([
      { exercise_id: SQUAT.id, kind: 'weight', value: 105, weight_kg: 105 },
      { exercise_id: SQUAT.id, kind: 'e1rm', value: epley(105, 5), weight_kg: null },
    ])
  })

  it('marks more reps at a weight already done (and the e1rm it implies), not a weight PR', () => {
    const s1 = session('2026-10-01', [sq([set(5, 100), set(8, 80)])])
    const s2 = session('2026-10-02', [sq([set(10, 80)])])
    expect(detectPRs([s1, s2]).get(s2.id)).toEqual([
      { exercise_id: SQUAT.id, kind: 'reps', value: 10, weight_kg: 80 },
    ])
    // 80 × (1 + 10/30) = 106.67 < 100 × (1 + 5/30) = 116.67 → no e1rm record.
    const s3 = session('2026-10-03', [sq([set(12, 100)])])
    const prs = detectPRs([s1, s2, s3]).get(s3.id)
    expect(prs?.map((p) => p.kind)).toEqual(['e1rm', 'reps'])
  })

  it('reports the heaviest weight with a rep record when several improve', () => {
    const s1 = session('2026-10-01', [bp([set(8, 40), set(6, 50)])])
    const s2 = session('2026-10-02', [bp([set(10, 40), set(7, 50)])])
    const reps = detectPRs([s1, s2])
      .get(s2.id)
      ?.filter((p) => p.kind === 'reps')
    expect(reps).toEqual([{ exercise_id: PRESS.id, kind: 'reps', value: 7, weight_kg: 50 }])
  })

  it('tracks bodyweight reps as their own weight', () => {
    const s1 = session('2026-10-01', [bp([set(12, null)])])
    const s2 = session('2026-10-02', [bp([set(15, null)])])
    expect(detectPRs([s1, s2]).get(s2.id)).toEqual([
      { exercise_id: PRESS.id, kind: 'reps', value: 15, weight_kg: null },
    ])
  })

  it('ties are not records; sets not done never count', () => {
    const s1 = session('2026-10-01', [sq([set(5, 100)])])
    const tie = session('2026-10-02', [sq([set(5, 100)])])
    const undone = session('2026-10-03', [sq([set(5, 150, false)])])
    const prs = detectPRs([s1, tie, undone])
    expect(prs.size).toBe(0)
  })

  it('judges in date order regardless of input order, and per exercise', () => {
    const late = session('2026-10-09', [sq([set(5, 90)]), bp([set(5, 60)])])
    const early = session('2026-10-01', [sq([set(5, 100)])])
    const prs = detectPRs([late, early])
    // late: squat lighter (no record); press first time (baseline, no record).
    expect(prs.size).toBe(0)
    const later = session('2026-10-12', [bp([set(5, 62.5)])])
    expect(
      detectPRs([late, early, later])
        .get(later.id)
        ?.map((p) => p.exercise_id),
    ).toEqual([PRESS.id, PRESS.id])
  })
})

describe('weeklyVolume', () => {
  it('returns 8 Monday weeks ending with the current one, zero-filled', () => {
    const weeks = weeklyVolume([], '2026-10-08')
    expect(weeks).toHaveLength(8)
    expect(weeks[7]).toEqual({ weekStart: '2026-10-05', volume: 0, sessions: 0 })
    expect(weeks[0]?.weekStart).toBe('2026-08-17')
  })

  it('sums done volume per week and ignores sessions outside the window', () => {
    const weeks = weeklyVolume(
      [
        session('2026-10-05', [sq([set(5, 100)])]),
        session('2026-10-11', [sq([set(5, 100, false), set(2, 50)])]),
        session('2026-09-30', [bp([set(10, 40)])]),
        session('2026-06-01', [bp([set(10, 40)])]),
      ],
      '2026-10-08',
    )
    expect(weeks[7]).toEqual({ weekStart: '2026-10-05', volume: 600, sessions: 2 })
    expect(weeks[6]).toEqual({ weekStart: '2026-09-28', volume: 400, sessions: 1 })
    expect(weeks.slice(0, 6).every((w) => w.volume === 0 && w.sessions === 0)).toBe(true)
  })

  it('honours a custom window', () => {
    expect(weeklyVolume([], '2026-10-08', 3).map((w) => w.weekStart)).toEqual([
      '2026-09-21',
      '2026-09-28',
      '2026-10-05',
    ])
  })
})

describe('trainedExercises', () => {
  it('lists exercises with a done set, most-trained first, ties by first seen', () => {
    const sessions = [
      session('2026-10-01', [bp([set(5, 40)]), sq([set(5, 100)])]),
      session('2026-10-02', [sq([set(5, 100)])]),
      session('2026-10-03', [bp([set(5, 40, false)]), { exercise_id: 'other', sets: [set(1)] }]),
    ]
    expect(trainedExercises(sessions)).toEqual([SQUAT.id, PRESS.id, 'other'])
    expect(trainedExercises([])).toEqual([])
  })
})
