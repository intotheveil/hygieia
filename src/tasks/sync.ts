// TASKS → PROFILE ENTRIES — the async half (connect the features, 2026-10-06). The local ticks
// (./storage.ts) stay the source of truth for the checklist; this only MIRRORS a tick into the
// signed-in user's `entries` when the plan's "Log to profile" toggle is on. Never throws: every
// outcome is a value, and a failed write leaves the tick in place (the page shows a short note).
//
// Idempotent per task + date: before adding, the day's entries are read and an entry already
// carrying this task's payload (./track.ts `isEntryOf`) is kept as is. Un-ticking deletes every
// entry of that task on that date — whatever the toggle says now, so turning logging off later
// never strands an entry the user can no longer remove from here.

import type { UserDataSource } from '../user/source'
import { entryInputFor, isEntryOf } from './track'
import type { Task } from './types'

export type SyncOutcome =
  | 'skipped' // nothing to do: no user data, not trackable, or logging is off
  | 'added'
  | 'exists' // already logged for this task + date
  | 'deleted'
  | 'absent' // un-ticked, and there was nothing to delete
  | 'failed'

export interface TickChange {
  topicId: string
  task: Task
  /** The tick period: `YYYY-MM-DD` (logged) or `YYYY-MM` (monthly, never logged). */
  period: string
  /** The tick's state AFTER the change. */
  ticked: boolean
  /** The plan's "Log to profile" toggle. */
  log: boolean
}

export async function syncTick(source: UserDataSource, change: TickChange): Promise<SyncOutcome> {
  if (source.kind === 'disabled') return 'skipped'
  const { topicId, task, period, ticked, log } = change
  if (ticked && !log) return 'skipped'
  const input = entryInputFor(topicId, task, period)
  if (input === null) return 'skipped'

  const day = await source.listEntries({ from: period, to: period })
  if (!day.ok) return 'failed'
  const mine = day.data.filter((entry) => isEntryOf(entry, topicId, task.id, period))

  if (ticked) {
    if (mine.length > 0) return 'exists'
    const added = await source.addEntry(input)
    return added.ok ? 'added' : 'failed'
  }
  if (mine.length === 0) return 'absent'
  let failed = false
  for (const entry of mine) {
    const removed = await source.deleteEntry(entry.id)
    if (!removed.ok) failed = true
  }
  return failed ? 'failed' : 'deleted'
}

/**
 * Runs jobs one after another, in call order: a quick tick → un-tick must reach the server as add
 * then delete, never interleaved (the delete would read the day before the add landed).
 */
export function createQueue() {
  let tail: Promise<unknown> = Promise.resolve()
  return function enqueue<T>(job: () => Promise<T>): Promise<T> {
    const run = tail.then(job, job)
    tail = run.catch(() => undefined)
    return run
  }
}
