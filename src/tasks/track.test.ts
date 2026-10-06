import { describe, expect, it } from 'vitest'
import type { Entry, JsonValue } from '../user/source'
import { loadTopic } from './content/index'
import { TOPIC_IDS } from './content/topics'
import {
  NAIL_TASKS,
  SLEEP_LOG_TASK,
  WATER_TASKS,
  WEEKLY_SKINCARE_TASKS,
  WORKOUT_TASKS,
  anyTrackable,
  entryInputFor,
  isDayPeriod,
  isEntryOf,
  isTasksEntry,
  taskPayloadOf,
  trackFor,
} from './track'
import type { Task } from './types'

// The tasks → profile mapping (connect the features, 2026-10-06), checked against the REAL task
// banks, so a renamed task id cannot silently stop logging.

const task = (over: Partial<Task> & { id: string }): Task => ({
  title: { el: 'x', en: 'x' },
  minutes: 10,
  cadence: 'weekly',
  when: {},
  weight: 3,
  ...over,
})

const entry = (payload: Entry['payload'], over: Partial<Entry> = {}): Entry => ({
  id: 'e1',
  kind: 'workout',
  entry_date: '2026-10-06',
  value: null,
  unit: null,
  payload,
  note: null,
  created_at: '2026-10-06T09:00:00.000Z',
  ...over,
})

describe('the explicit task lists name real tasks', () => {
  it.each([
    ['workout-routine', WORKOUT_TASKS],
    ['drink-water', WATER_TASKS],
    ['skincare-habit', NAIL_TASKS],
    ['skincare-habit', WEEKLY_SKINCARE_TASKS],
    ['better-sleep', new Set([SLEEP_LOG_TASK])],
  ] as const)('%s', async (topicId, ids) => {
    const topic = await loadTopic(topicId)
    const known = new Set(topic.tasks.map((t) => t.id))
    for (const id of ids) expect(known.has(id), `${topicId}/${id}`).toBe(true)
  })
})

describe('trackFor — by topic', () => {
  it('workout-routine: every session and the movement tasks log a workout of the task minutes', async () => {
    const topic = await loadTopic('workout-routine')
    const sessions = topic.tasks.filter((t) => t.id.startsWith('session-'))
    expect(sessions.length).toBeGreaterThan(0)
    for (const t of sessions) {
      expect(trackFor('workout-routine', t)).toEqual({
        kind: 'workout',
        value: t.minutes,
        unit: 'min',
      })
    }
    const core = topic.tasks.find((t) => t.id === 'core')!
    expect(trackFor('workout-routine', core)).toEqual({ kind: 'workout', value: 10, unit: 'min' })
    for (const id of ['plan-week', 'clothes-ready', 'pack-bag', 'stairs', 'water', 'check-in']) {
      const t = topic.tasks.find((x) => x.id === id)!
      expect(trackFor('workout-routine', t), id).toBeNull()
    }
  })

  it('drink-water: a glass logs its ml; a drink without an amount logs no value; chores log nothing', async () => {
    const topic = await loadTopic('drink-water')
    const byId = (id: string) => topic.tasks.find((t) => t.id === id)!
    expect(trackFor('drink-water', byId('wake-glass'))).toEqual({
      kind: 'water',
      value: 250,
      unit: 'ml',
    })
    expect(trackFor('drink-water', byId('desk-glass'))).toEqual({
      kind: 'water',
      value: 250,
      unit: 'ml',
    })
    expect(trackFor('drink-water', byId('herbal'))).toEqual({
      kind: 'water',
      value: null,
      unit: null,
    })
    expect(trackFor('drink-water', byId('reminders'))).toBeNull()
    expect(trackFor('drink-water', byId('jug-filter'))).toBeNull()
  })

  it('better-sleep: only the sleep log task logs (sleep, no value)', async () => {
    const topic = await loadTopic('better-sleep')
    const logged = topic.tasks.filter((t) => trackFor('better-sleep', t) !== null)
    expect(logged.map((t) => t.id)).toEqual([SLEEP_LOG_TASK])
    expect(trackFor('better-sleep', logged[0]!)).toEqual({ kind: 'sleep', value: null, unit: null })
  })

  it('skincare-habit: nail care → nails, daily care and weekly face care → skincare, chores → nothing', async () => {
    const topic = await loadTopic('skincare-habit')
    const byId = (id: string) => topic.tasks.find((t) => t.id === id)!
    for (const id of NAIL_TASKS) expect(trackFor('skincare-habit', byId(id))?.kind).toBe('nails')
    for (const id of ['am-cleanse', 'spf', 'pm-moist', 'exfoliate', 'mask']) {
      expect(trackFor('skincare-habit', byId(id))).toEqual({
        kind: 'skincare',
        value: null,
        unit: null,
      })
    }
    for (const id of ['brushes', 'razor', 'pillowcase', 'derm', 'ko-basics']) {
      expect(trackFor('skincare-habit', byId(id)), id).toBeNull()
    }
  })

  it('skincare-habit: routine steps log skincare (face) or nails', () => {
    expect(trackFor('skincare-habit', task({ id: 'routine-face-1', cadence: 'daily' }))?.kind).toBe(
      'skincare',
    )
    expect(trackFor('skincare-habit', task({ id: 'routine-nails-2' }))?.kind).toBe('nails')
  })

  it('every other topic logs nothing, whatever the task', async () => {
    const others = TOPIC_IDS.filter(
      (id) => !['workout-routine', 'drink-water', 'better-sleep', 'skincare-habit'].includes(id),
    )
    expect(others).toHaveLength(TOPIC_IDS.length - 4)
    for (const id of others) {
      const topic = await loadTopic(id)
      expect(anyTrackable(id, topic.tasks), id).toBe(false)
    }
  })

  it('monthly tasks and kick-offs never log, except the kick-off walk', () => {
    expect(trackFor('workout-routine', task({ id: 'core', cadence: 'monthly' }))).toBeNull()
    expect(trackFor('skincare-habit', task({ id: 'am-cleanse', kickoff: true }))).toBeNull()
    expect(trackFor('workout-routine', task({ id: 'ko-walk', kickoff: true }))?.kind).toBe(
      'workout',
    )
  })
})

describe('entryInputFor / payload identity', () => {
  const core = task({ id: 'core', minutes: 10 })

  it('builds the addEntry input with the tasks payload on the tick date', () => {
    expect(entryInputFor('workout-routine', core, '2026-10-06')).toEqual({
      kind: 'workout',
      entry_date: '2026-10-06',
      value: 10,
      unit: 'min',
      payload: { source: 'tasks', topic: 'workout-routine', task_id: 'core', date: '2026-10-06' },
    })
  })

  it('a month period or an untrackable task gives no input', () => {
    expect(isDayPeriod('2026-10')).toBe(false)
    expect(isDayPeriod('2026-10-06')).toBe(true)
    expect(entryInputFor('workout-routine', core, '2026-10')).toBeNull()
    expect(entryInputFor('clean-home', core, '2026-10-06')).toBeNull()
  })

  it('reads a task payload back; anything else is not a task entry', () => {
    const p = { source: 'tasks', topic: 'drink-water', task_id: 'herbal', date: '2026-10-06' }
    expect(taskPayloadOf(entry(p))).toEqual(p)
    expect(isTasksEntry(entry(p))).toBe(true)
    for (const other of <JsonValue[]>[
      null,
      'tasks',
      ['tasks'],
      { source: 'quick-add' },
      { source: 'tasks', topic: 'x', task_id: 1, date: '2026-10-06' },
      { source: 'tasks', topic: 'x', task_id: 'y' },
    ]) {
      expect(isTasksEntry(entry(other)), JSON.stringify(other)).toBe(false)
    }
  })

  it('isEntryOf matches topic, task and date exactly', () => {
    const e = entry({
      source: 'tasks',
      topic: 'workout-routine',
      task_id: 'core',
      date: '2026-10-06',
    })
    expect(isEntryOf(e, 'workout-routine', 'core', '2026-10-06')).toBe(true)
    expect(isEntryOf(e, 'workout-routine', 'core', '2026-10-07')).toBe(false)
    expect(isEntryOf(e, 'workout-routine', 'balance', '2026-10-06')).toBe(false)
    expect(isEntryOf(e, 'drink-water', 'core', '2026-10-06')).toBe(false)
  })
})
