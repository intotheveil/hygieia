// TASKS ADVISOR — compact authoring helpers for the topic files (P9). Content reads as one line per
// task: `weekly('bathroom', 20, 4, ['Clean the bathroom', 'Καθάρισε το μπάνιο'], { day: 'sat' })`.
// English first, Greek second in every pair. Pure constructors: no validation here — the content
// test (`content.test.ts`) checks ids, `when` references, minutes and both languages.

import type {
  Bi,
  Cadence,
  Day,
  Question,
  QuestionOption,
  Task,
  Topic,
  TopicMeta,
  When,
} from '../types.ts'

/** `[english, greek]`. */
export type Pair = readonly [string, string]

export function bi([en, el]: Pair): Bi {
  return { en, el }
}

export function opt(
  id: string,
  label: Pair,
  extra: { minutes?: number; gentle?: boolean } = {},
): QuestionOption {
  return { id, label: bi(label), ...extra }
}

export function question(
  id: string,
  kind: 'single' | 'multi',
  title: Pair,
  options: readonly QuestionOption[],
  help?: Pair,
): Question {
  return help
    ? { id, kind, title: bi(title), help: bi(help), options }
    : { id, kind, title: bi(title), options }
}

export interface TaskOptions {
  when?: When
  day?: Day
  times?: number
  kickoff?: boolean
  detail?: Pair
}

function make(
  cadence: Cadence,
  id: string,
  minutes: number,
  weight: number,
  title: Pair,
  o: TaskOptions,
): Task {
  return {
    id,
    title: bi(title),
    minutes,
    cadence,
    weight,
    when: o.when ?? {},
    ...(o.detail ? { detail: bi(o.detail) } : {}),
    ...(o.day ? { day: o.day } : {}),
    ...(o.times ? { times: o.times } : {}),
    ...(o.kickoff ? { kickoff: true } : {}),
  }
}

export function daily(
  id: string,
  minutes: number,
  weight: number,
  title: Pair,
  o: TaskOptions = {},
): Task {
  return make('daily', id, minutes, weight, title, o)
}

export function weekly(
  id: string,
  minutes: number,
  weight: number,
  title: Pair,
  o: TaskOptions = {},
): Task {
  return make('weekly', id, minutes, weight, title, o)
}

export function monthly(
  id: string,
  minutes: number,
  weight: number,
  title: Pair,
  o: TaskOptions = {},
): Task {
  return make('monthly', id, minutes, weight, title, o)
}

/** A first-week, one-off task: weekly cadence, planned only on a gentle start. */
export function kickoff(
  id: string,
  minutes: number,
  weight: number,
  title: Pair,
  o: TaskOptions = {},
): Task {
  return make('weekly', id, minutes, weight, title, { ...o, kickoff: true })
}

export function topic(
  meta: TopicMeta,
  questions: readonly Question[],
  tasks: readonly Task[],
): Topic {
  return { ...meta, questions, tasks }
}
