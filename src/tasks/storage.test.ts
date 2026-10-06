import { dateKey, dayOf, monthKey, weekDates } from './dates'
import {
  MAX_PERIODS,
  defaultTasksState,
  isTicked,
  loadTasksState,
  logsToProfile,
  parseTasksState,
  saveTasksState,
  serializeTasksState,
  tasksStorageKey,
  toggleTick,
} from './storage'

describe('tasks storage codec', () => {
  it('uses one key per topic', () => {
    expect(tasksStorageKey('clean-home')).toBe('hygieia:tasks:clean-home')
  })

  it('round-trips answers and ticks', () => {
    const state = {
      answers: { size: ['small'], household: [] },
      ticks: { '2026-10-06': ['dishes'] },
    }
    expect(parseTasksState(serializeTasksState(state))).toEqual(state)
  })

  it('degrades junk to the default, never throws', () => {
    for (const raw of [
      null,
      '',
      'not json',
      '[]',
      '{"v":2}',
      42,
      { v: 1, answers: 'x', ticks: 3 },
    ]) {
      const parsed = parseTasksState(raw)
      expect(parsed.ticks).toEqual({})
      expect(parsed.answers).toBeNull()
    }
  })

  it('drops bad periods and ids, keeps only the newest periods', () => {
    const ticks: Record<string, unknown> = { nope: ['a'], '2026-10-01': ['a', 'a', 7, ' '] }
    for (let i = 0; i < MAX_PERIODS + 5; i++)
      ticks[`2025-01-${String(i + 1).padStart(2, '0')}x`] = ['z']
    const parsed = parseTasksState({ v: 1, answers: null, ticks })
    expect(parsed.ticks).toEqual({ '2026-10-01': ['a'] })

    const many: Record<string, string[]> = {}
    for (let i = 0; i < MAX_PERIODS + 10; i++) {
      many[dateKey(new Date(2026, 0, 1 + i))] = ['t']
    }
    const kept = Object.keys(parseTasksState({ v: 1, answers: null, ticks: many }).ticks)
    expect(kept).toHaveLength(MAX_PERIODS)
    expect(kept[0]).toBe(dateKey(new Date(2026, 0, 11)))
  })

  it('toggles a tick on and off, removing an empty period', () => {
    const on = toggleTick(defaultTasksState(), '2026-10-06', 'dishes')
    expect(isTicked(on, '2026-10-06', 'dishes')).toBe(true)
    expect(isTicked(on, '2026-10-07', 'dishes')).toBe(false)
    const off = toggleTick(on, '2026-10-06', 'dishes')
    expect(off.ticks).toEqual({})
  })

  it('load/save swallow storage failures', () => {
    const throwing = {
      getItem: () => {
        throw new Error('denied')
      },
      setItem: () => {
        throw new Error('quota')
      },
    }
    expect(loadTasksState(throwing, 'x')).toEqual(defaultTasksState())
    expect(saveTasksState(throwing, 'x', defaultTasksState())).toBe(false)

    const map = new Map<string, string>()
    const memory = {
      getItem: (k: string) => map.get(k) ?? null,
      setItem: (k: string, v: string) => void map.set(k, v),
    }
    const state = toggleTick({ answers: { a: ['b'] }, ticks: {} }, '2026-10', 'oven')
    expect(saveTasksState(memory, 'clean-home', state)).toBe(true)
    expect(loadTasksState(memory, 'clean-home')).toEqual(state)
  })
})

describe('local calendar helpers', () => {
  it('formats local date and month keys', () => {
    expect(dateKey(new Date(2026, 9, 6, 23, 30))).toBe('2026-10-06')
    expect(monthKey(new Date(2026, 0, 31))).toBe('2026-01')
  })

  it('weeks start on Monday', () => {
    // 2026-10-06 is a Tuesday; 2026-10-11 a Sunday.
    expect(dayOf(new Date(2026, 9, 6))).toBe('tue')
    expect(dayOf(new Date(2026, 9, 11))).toBe('sun')
    const week = weekDates(new Date(2026, 9, 11, 18))
    expect(dateKey(week.mon)).toBe('2026-10-05')
    expect(dateKey(week.sun)).toBe('2026-10-11')
    // across a month boundary
    const edge = weekDates(new Date(2026, 9, 1))
    expect(dateKey(edge.mon)).toBe('2026-09-28')
    expect(dateKey(edge.sun)).toBe('2026-10-04')
  })
})

describe('tasks storage — routine + log extras (connect the features, 2026-10-06)', () => {
  it('round-trips a routine slug and logging switched off', () => {
    const state = { answers: { skin: ['dry'] }, ticks: {}, routine: 'face-dry-pm', log: false }
    expect(parseTasksState(serializeTasksState(state))).toEqual(state)
  })

  it('omits unset extras, so v1 data reads back unchanged', () => {
    const raw = serializeTasksState({
      answers: null,
      ticks: {},
      routine: undefined,
      log: undefined,
    })
    expect(JSON.parse(raw)).toEqual({ v: 1, answers: null, ticks: {} })
    expect(parseTasksState(raw)).toEqual(defaultTasksState())
  })

  it('drops a malformed slug and any log value but false', () => {
    const parsed = parseTasksState({ v: 1, answers: null, ticks: {}, routine: '../x', log: 'no' })
    expect(parsed).toEqual(defaultTasksState())
    expect(parseTasksState({ v: 1, answers: null, ticks: {}, log: true })).toEqual(
      defaultTasksState(),
    )
  })

  it('logsToProfile defaults on; toggling a tick keeps the extras', () => {
    expect(logsToProfile(defaultTasksState())).toBe(true)
    const off = { ...defaultTasksState(), log: false, routine: 'r1' }
    expect(logsToProfile(off)).toBe(false)
    expect(toggleTick(off, '2026-10-06', 'a')).toMatchObject({ log: false, routine: 'r1' })
  })
})
