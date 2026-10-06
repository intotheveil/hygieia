import { describe, expect, it } from 'vitest'
import { cleanHome } from './content/clean-home'
import { dateKey } from './dates'
import { generatePlan } from './generate'
import { todayProgress, topicsWithPlans } from './progress'
import { tasksStorageKey, type TasksState } from './storage'

// The /profile "Your task plans" figures (connect the features, 2026-10-06).

const NOW = new Date(2026, 9, 6, 9, 0) // Tuesday
const ANSWERS = { size: ['small'], household: [], time: ['t30'], style: ['daily'], state: ['tidy'] }

function storageWith(map: Record<string, string>): Pick<Storage, 'getItem'> {
  return { getItem: (k) => map[k] ?? null }
}

describe('topicsWithPlans', () => {
  it('lists the topics with saved answers, in topic order', () => {
    const saved = (answers: unknown) => JSON.stringify({ v: 1, answers, ticks: {} })
    const storage = storageWith({
      [tasksStorageKey('study-focus')]: saved({ a: ['b'] }),
      [tasksStorageKey('clean-home')]: saved(ANSWERS),
      [tasksStorageKey('declutter')]: saved(null),
      [tasksStorageKey('drink-water')]: 'not json',
    })
    expect(topicsWithPlans(storage)).toEqual(['clean-home', 'study-focus'])
  })

  it('no storage, or a throwing one, means no plans', () => {
    expect(topicsWithPlans(null)).toEqual([])
    expect(
      topicsWithPlans({
        getItem: () => {
          throw new Error('denied')
        },
      }),
    ).toEqual([])
  })
})

describe('todayProgress', () => {
  it("counts today's ticked tasks against today's checklist (daily + today's weekly jobs)", () => {
    const plan = generatePlan(cleanHome, ANSWERS)
    const today = [...plan.daily, ...plan.weekly.tue]
    expect(today.length).toBeGreaterThan(1)
    const state: TasksState = {
      answers: ANSWERS,
      ticks: {
        [dateKey(NOW)]: [today[0]!.id, 'not-in-plan'],
        '2026-10-05': [today[1]!.id],
      },
    }
    expect(todayProgress(cleanHome, state, NOW)).toEqual({ done: 1, total: today.length })
  })

  it('null without answers or with incomplete answers', () => {
    expect(todayProgress(cleanHome, { answers: null, ticks: {} }, NOW)).toBeNull()
    expect(todayProgress(cleanHome, { answers: { size: ['small'] }, ticks: {} }, NOW)).toBeNull()
  })
})
