// TASKS → PROFILE ENTRIES (connect the features, 2026-10-06) — the pure half. Which ticked task
// becomes which profile entry, and how a task's entry is recognised again (to stay idempotent and to
// delete it on un-tick). The async half — talking to the `UserDataSource` — is ./sync.ts.
//
// The mapping is by TOPIC, then by an explicit task list, so a chore never pretends to be a workout:
//   - workout-routine → `workout`, value = the task's minutes, unit `min` — the sessions (every
//     `session-*` id) and the weekly movement tasks below; planning chores (lay out clothes, pack the
//     bag, pick next week's days) and the tiny daily nudges (stairs, stand up hourly) log nothing.
//   - drink-water     → `water`, value = the task's `ml` when the content states one (a glass), else
//     none — only the tasks that ARE a drink (not "set reminders" or "wash the bottle").
//   - better-sleep    → `sleep`, no value — only the weekly sleep log (`sleep-log`).
//   - skincare-habit  → `nails` for the hand and nail tasks; `skincare` for the daily care steps and
//     the weekly face care below; and the steps of a routine brought in from /skincare
//     (`routine-face-*` → `skincare`, `routine-nails-*` → `nails`, ./routine.ts).
//   - every other topic → no entry (a NEW generic path is deliberately not invented: an entry kind
//     exists only for what the profile can chart).
// Monthly tasks and first-week kick-offs never log (a monthly tick has no single day; a kick-off is
// set-up, not the habit) — except the kick-off walk, which is a real walk.
//
// The payload is the entry's identity: `{ source: 'tasks', topic, task_id, date }`. One entry per
// task per date; `date` equals the entry's `entry_date` (the tick's local day).

import type { Entry, EntryInput, EntryKind, EntryUnit, JsonValue } from '../user/source'
import type { Task } from './types'

export const TASKS_SOURCE = 'tasks'

/** workout-routine: weekly movement that is a workout in its own right. */
export const WORKOUT_TASKS: ReadonlySet<string> = new Set([
  'walk-meal',
  'core',
  'brisk-walk',
  'mobility-flow',
  'mobility-short',
  'phone-free-walk',
  'long-walk',
  'rest-stretch',
  'balance',
  'ko-walk',
])

/** drink-water: the tasks that are themselves a drink. */
export const WATER_TASKS: ReadonlySet<string> = new Set([
  'wake-glass',
  'meal-glass',
  'refill-2',
  'refill-3',
  'anchor',
  'herbal',
  'coffee-water',
  'desk-glass',
  'train-sip',
])

/** better-sleep: the one task that is a sleep log. */
export const SLEEP_LOG_TASK = 'sleep-log'

/** skincare-habit: hand and nail care. */
export const NAIL_TASKS: ReadonlySet<string> = new Set(['hand-cream', 'cuticle', 'nails-file'])

/** skincare-habit: the weekly tasks that are face care (not chores like washing brushes). */
export const WEEKLY_SKINCARE_TASKS: ReadonlySet<string> = new Set([
  'exfoliate',
  'exfoliate-soft',
  'mask',
  'neck',
])

export interface TrackSpec {
  kind: EntryKind
  value: number | null
  unit: EntryUnit | null
}

const none = (kind: EntryKind): TrackSpec => ({ kind, value: null, unit: null })

/** The entry a ticked task becomes, or null when the task is not trackable. */
export function trackFor(topicId: string, task: Task): TrackSpec | null {
  if (task.cadence === 'monthly') return null
  if (task.kickoff === true && task.id !== 'ko-walk') return null
  switch (topicId) {
    case 'workout-routine':
      return task.id.startsWith('session-') || WORKOUT_TASKS.has(task.id)
        ? { kind: 'workout', value: task.minutes, unit: 'min' }
        : null
    case 'drink-water':
      if (!WATER_TASKS.has(task.id)) return null
      return task.ml !== undefined && task.ml > 0
        ? { kind: 'water', value: task.ml, unit: 'ml' }
        : none('water')
    case 'better-sleep':
      return task.id === SLEEP_LOG_TASK ? none('sleep') : null
    case 'skincare-habit':
      if (task.id.startsWith('routine-nails-')) return none('nails')
      if (task.id.startsWith('routine-face-')) return none('skincare')
      if (NAIL_TASKS.has(task.id)) return none('nails')
      if (task.cadence === 'daily' || WEEKLY_SKINCARE_TASKS.has(task.id)) return none('skincare')
      return null
    default:
      return null
  }
}

/** True when the topic has at least one trackable task among `tasks`. */
export function anyTrackable(topicId: string, tasks: readonly Task[]): boolean {
  return tasks.some((task) => trackFor(topicId, task) !== null)
}

const DATE = /^\d{4}-\d{2}-\d{2}$/

/** A tick period that is a single day (`YYYY-MM-DD`); monthly periods (`YYYY-MM`) never log. */
export function isDayPeriod(period: string): boolean {
  return DATE.test(period)
}

export interface TaskPayload {
  source: typeof TASKS_SOURCE
  topic: string
  task_id: string
  date: string
}

/** The `addEntry` input for a ticked task on `date`, or null when it is not trackable. */
export function entryInputFor(topicId: string, task: Task, date: string): EntryInput | null {
  if (!isDayPeriod(date)) return null
  const spec = trackFor(topicId, task)
  if (spec === null) return null
  const payload: { [key: string]: JsonValue } = {
    source: TASKS_SOURCE,
    topic: topicId,
    task_id: task.id,
    date,
  }
  return { kind: spec.kind, entry_date: date, value: spec.value, unit: spec.unit, payload }
}

function isObject(value: JsonValue | null): value is { [key: string]: JsonValue } {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** The payload of an entry written by a task plan, or null for any other entry. */
export function taskPayloadOf(entry: Pick<Entry, 'payload'>): TaskPayload | null {
  const p = entry.payload
  if (!isObject(p) || p.source !== TASKS_SOURCE) return null
  const { topic, task_id, date } = p
  if (typeof topic !== 'string' || typeof task_id !== 'string' || typeof date !== 'string') {
    return null
  }
  return { source: TASKS_SOURCE, topic, task_id, date }
}

/** True for an entry written by any task plan (`payload.source === 'tasks'`). */
export function isTasksEntry(entry: Pick<Entry, 'payload'>): boolean {
  return taskPayloadOf(entry) !== null
}

/** True when `entry` is THE entry of `taskId` in `topicId` on `date`. */
export function isEntryOf(entry: Entry, topicId: string, taskId: string, date: string): boolean {
  const p = taskPayloadOf(entry)
  return p !== null && p.topic === topicId && p.task_id === taskId && p.date === date
}
