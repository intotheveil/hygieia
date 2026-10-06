import { describe, expect, it } from 'vitest'
import { disabledSource } from '../user/disabled'
import { memorySource } from '../user/memory'
import { createQueue, syncTick, type TickChange } from './sync'
import type { Task } from './types'

// Ticks mirrored into profile entries against the in-memory user source: add on tick, idempotent
// per task + date, delete on un-tick, nothing when logging is off or the user is signed out.

const DAY = '2026-10-06'
const core: Task = {
  id: 'core',
  title: { el: 'Κορμός', en: 'Core' },
  minutes: 10,
  cadence: 'weekly',
  when: {},
  weight: 3,
}
const tick = (over: Partial<TickChange> = {}): TickChange => ({
  topicId: 'workout-routine',
  task: core,
  period: DAY,
  ticked: true,
  log: true,
  ...over,
})
const mem = () => memorySource({ now: () => `${DAY}T09:00:00.000Z` })

describe('syncTick', () => {
  it('a tick adds ONE entry with the tasks payload', async () => {
    const m = mem()
    expect(await syncTick(m.source, tick())).toBe('added')
    expect(m.store.entries).toHaveLength(1)
    expect(m.store.entries[0]).toMatchObject({
      kind: 'workout',
      entry_date: DAY,
      value: 10,
      unit: 'min',
      payload: { source: 'tasks', topic: 'workout-routine', task_id: 'core', date: DAY },
    })
  })

  it('is idempotent per task + date: a second tick keeps the one entry', async () => {
    const m = mem()
    await syncTick(m.source, tick())
    expect(await syncTick(m.source, tick())).toBe('exists')
    expect(m.store.entries).toHaveLength(1)
    // another date is another entry
    expect(await syncTick(m.source, tick({ period: '2026-10-07' }))).toBe('added')
    expect(m.store.entries).toHaveLength(2)
  })

  it('an un-tick deletes that entry only (found by payload), leaving other entries alone', async () => {
    const m = mem()
    await m.source.addEntry({ kind: 'workout', entry_date: DAY, value: 30, unit: 'min' })
    await syncTick(m.source, tick())
    await syncTick(m.source, tick({ task: { ...core, id: 'balance', minutes: 5 } }))
    expect(m.store.entries).toHaveLength(3)
    expect(await syncTick(m.source, tick({ ticked: false }))).toBe('deleted')
    expect(m.store.entries).toHaveLength(2)
    expect(m.store.entries.some((e) => JSON.stringify(e.payload).includes('"core"'))).toBe(false)
    expect(m.store.entries.some((e) => e.payload === null)).toBe(true)
    expect(await syncTick(m.source, tick({ ticked: false }))).toBe('absent')
  })

  it('logging off: a tick writes nothing, but an un-tick still removes an earlier entry', async () => {
    const m = mem()
    expect(await syncTick(m.source, tick({ log: false }))).toBe('skipped')
    expect(m.store.entries).toHaveLength(0)
    await syncTick(m.source, tick())
    expect(await syncTick(m.source, tick({ ticked: false, log: false }))).toBe('deleted')
    expect(m.store.entries).toHaveLength(0)
  })

  it('skips signed-out users, untrackable tasks and month periods', async () => {
    expect(await syncTick(disabledSource('signed-out'), tick())).toBe('skipped')
    const m = mem()
    expect(await syncTick(m.source, tick({ topicId: 'clean-home' }))).toBe('skipped')
    expect(await syncTick(m.source, tick({ period: '2026-10' }))).toBe('skipped')
    expect(m.store.entries).toHaveLength(0)
  })

  it('reports a failed read or write as failed and never throws', async () => {
    const m = mem()
    m.failOn('listEntries')
    expect(await syncTick(m.source, tick())).toBe('failed')
    m.failOn('listEntries', false)
    m.failOn('addEntry')
    expect(await syncTick(m.source, tick())).toBe('failed')
    m.failOn('addEntry', false)
    await syncTick(m.source, tick())
    m.failOn('deleteEntry')
    expect(await syncTick(m.source, tick({ ticked: false }))).toBe('failed')
    expect(m.store.entries).toHaveLength(1)
  })
})

describe('createQueue', () => {
  it('runs jobs in call order, one at a time, even after a failure', async () => {
    const enqueue = createQueue()
    const log: string[] = []
    const job =
      (name: string, ms: number, fail = false) =>
      () =>
        new Promise<string>((resolve, reject) =>
          setTimeout(() => {
            log.push(name)
            if (fail) reject(new Error(name))
            else resolve(name)
          }, ms),
        )
    const a = enqueue(job('a', 30))
    const b = enqueue(job('b', 1, true))
    const c = enqueue(job('c', 1))
    await expect(a).resolves.toBe('a')
    await expect(b).rejects.toThrow('b')
    await expect(c).resolves.toBe('c')
    expect(log).toEqual(['a', 'b', 'c'])
  })

  it('a quick tick → un-tick reaches the source as add then delete', async () => {
    const m = mem()
    const enqueue = createQueue()
    const added = enqueue(() => syncTick(m.source, tick()))
    const removed = enqueue(() => syncTick(m.source, tick({ ticked: false })))
    expect(await added).toBe('added')
    expect(await removed).toBe('deleted')
    expect(m.store.entries).toHaveLength(0)
  })
})
