// TASKS ADVISOR — local persistence (P9). One localStorage key per topic, `hygieia:tasks:<topic>`,
// holding the completed questionnaire answers and the ticks. Local only, signed in or not (no
// database, no migration — DECISIONS 2026-10-06). Same discipline as src/fridge/storage.ts: a pure
// codec plus `load`/`save` that swallow every storage failure (private mode, quota, disabled), so
// the page never sees a throw from here — only the default state.
//
// Wire shape (versioned):
//   { "v": 1, "answers": { "size": ["small"], … } | null,
//     "ticks": { "2026-10-06": ["dishes", "make-bed"], "2026-10": ["oven"] } }
// Tick periods are a local DATE (`YYYY-MM-DD`) for daily and weekly tasks and a MONTH (`YYYY-MM`)
// for monthly ones. Only the most recent MAX_PERIODS periods are kept.

import type { Answers } from './types'

export const TASKS_STATE_VERSION = 1
/** Periods kept in storage; older ticks are dropped on save (about two months of days). */
export const MAX_PERIODS = 70

export function tasksStorageKey(topicId: string): string {
  return `hygieia:tasks:${topicId}`
}

export interface TasksState {
  /** The completed questionnaire, or null before it is finished (or after "Retake"). */
  answers: Answers | null
  /** period (`YYYY-MM-DD` or `YYYY-MM`) → ticked task ids. */
  ticks: Record<string, string[]>
}

export function defaultTasksState(): TasksState {
  return { answers: null, ticks: {} }
}

const PERIOD = /^\d{4}-\d{2}(-\d{2})?$/

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function cleanIds(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  const seen = new Set<string>()
  for (const item of value)
    if (typeof item === 'string' && item.trim() !== '') seen.add(item.trim())
  return [...seen]
}

function cleanAnswers(value: unknown): Answers | null {
  if (!isRecord(value)) return null
  const out: Record<string, string[]> = {}
  for (const [k, v] of Object.entries(value)) out[k] = cleanIds(v)
  return out
}

function cleanTicks(value: unknown): Record<string, string[]> {
  if (!isRecord(value)) return {}
  const periods = Object.keys(value)
    .filter((k) => PERIOD.test(k))
    .sort()
    .slice(-MAX_PERIODS)
  const out: Record<string, string[]> = {}
  for (const p of periods) {
    const ids = cleanIds(value[p])
    if (ids.length > 0) out[p] = ids
  }
  return out
}

/** Decode what came out of storage; anything unusable degrades to the default, never throws. */
export function parseTasksState(raw: unknown): TasksState {
  let value: unknown = raw
  if (typeof raw === 'string') {
    try {
      value = JSON.parse(raw)
    } catch {
      return defaultTasksState()
    }
  }
  if (!isRecord(value) || value.v !== TASKS_STATE_VERSION) return defaultTasksState()
  return { answers: cleanAnswers(value.answers), ticks: cleanTicks(value.ticks) }
}

export function serializeTasksState(state: TasksState): string {
  return JSON.stringify({
    v: TASKS_STATE_VERSION,
    answers: state.answers === null ? null : cleanAnswers(state.answers),
    ticks: cleanTicks(state.ticks),
  })
}

export function loadTasksState(storage: Pick<Storage, 'getItem'>, topicId: string): TasksState {
  try {
    return parseTasksState(storage.getItem(tasksStorageKey(topicId)))
  } catch {
    return defaultTasksState()
  }
}

/** Returns false (and nothing else) when the storage throws. */
export function saveTasksState(
  storage: Pick<Storage, 'setItem'>,
  topicId: string,
  state: TasksState,
): boolean {
  try {
    storage.setItem(tasksStorageKey(topicId), serializeTasksState(state))
    return true
  } catch {
    return false
  }
}

/** A new state with `taskId` ticked or unticked for `period`. */
export function toggleTick(state: TasksState, period: string, taskId: string): TasksState {
  const current = state.ticks[period] ?? []
  const next = current.includes(taskId)
    ? current.filter((id) => id !== taskId)
    : [...current, taskId]
  const ticks = { ...state.ticks }
  if (next.length === 0) delete ticks[period]
  else ticks[period] = next
  return { ...state, ticks }
}

export function isTicked(state: TasksState, period: string, taskId: string): boolean {
  return (state.ticks[period] ?? []).includes(taskId)
}
