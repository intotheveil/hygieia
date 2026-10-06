import { describe, expect, it } from 'vitest'
import type { Entry } from '../user/source'
import { BADGE_IDS, computeAchievements, type Achievement } from './achievements'
import { addDays } from './stats'

// The task-plan badges (connect the features, 2026-10-06): driven ONLY by entries a task plan
// wrote (`payload.source === 'tasks'`), whatever their kind.

let seq = 0
function e(date: string, fromTasks: boolean, kind: Entry['kind'] = 'workout'): Entry {
  seq += 1
  return {
    id: `e${seq}`,
    kind,
    entry_date: date,
    value: null,
    unit: null,
    payload: fromTasks
      ? { source: 'tasks', topic: 'workout-routine', task_id: `t${seq}`, date }
      : { source: 'quick-add' },
    note: null,
    created_at: `${date}T09:00:00.000Z`,
  }
}

function badges(entries: Entry[]): Record<string, Achievement> {
  const list = computeAchievements({
    entries,
    goals: [],
    favouritesCount: 0,
    savedItems: [],
    today: '2026-10-06',
  })
  return Object.fromEntries(list.map((a) => [a.id, a]))
}

const days = (from: string, n: number) => Array.from({ length: n }, (_, i) => addDays(from, i))

describe('task-plan badges', () => {
  it('are registered (three of them)', () => {
    expect(BADGE_IDS).toEqual(expect.arrayContaining(['tasks-first', 'tasks-streak-7', 'tasks-50']))
  })

  it('hand-typed entries earn none of them', () => {
    const b = badges(days('2026-09-01', 60).map((d) => e(d, false)))
    expect(b['tasks-first']).toMatchObject({ earned: false, progress: 0 })
    expect(b['tasks-streak-7']).toMatchObject({ earned: false, progress: 0 })
    expect(b['tasks-50']).toMatchObject({ earned: false, progress: 0 })
    expect(b['workouts-50']?.earned).toBe(true)
  })

  it('first task logged: earned on the earliest task entry, any kind', () => {
    const b = badges([
      e('2026-10-03', true, 'water'),
      e('2026-10-01', false),
      e('2026-10-05', true),
    ])
    expect(b['tasks-first']).toEqual({
      id: 'tasks-first',
      earned: true,
      progress: 1,
      earnedOn: '2026-10-03',
    })
  })

  it('7-day task streak: consecutive days with a task entry; a gap restarts it', () => {
    const six = days('2026-09-01', 6).map((d) => e(d, true))
    expect(badges(six)['tasks-streak-7']).toMatchObject({ earned: false })
    expect(badges(six)['tasks-streak-7']!.progress).toBeCloseTo(6 / 7)
    // a hand-typed entry does not bridge the gap
    const bridged = [...six, e('2026-09-07', false), e('2026-09-08', true)]
    expect(badges(bridged)['tasks-streak-7']?.earned).toBe(false)
    const seven = [...six, e('2026-09-07', true, 'skincare')]
    expect(badges(seven)['tasks-streak-7']).toMatchObject({
      earned: true,
      progress: 1,
      earnedOn: '2026-09-07',
    })
  })

  it('50 tasks logged: counts entries (several a day), earned on the 50th', () => {
    const many = days('2026-08-01', 25).flatMap((d) => [e(d, true), e(d, true, 'water')])
    expect(many).toHaveLength(50)
    expect(badges(many.slice(0, 49))['tasks-50']).toMatchObject({ earned: false })
    expect(badges(many.slice(0, 49))['tasks-50']!.progress).toBeCloseTo(49 / 50)
    expect(badges(many)['tasks-50']).toMatchObject({
      earned: true,
      earnedOn: '2026-08-25',
    })
  })
})
