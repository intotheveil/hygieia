// TASKS ADVISOR — the content model (P9). Bundled content only: no database, no migration, works
// signed in or not. A TOPIC is a short questionnaire plus a TASK BANK; `generate.ts` turns the
// answers into a daily / weekly / monthly plan by filtering the bank (`when`) and fitting it into
// the chosen time budget. Nothing here is AI: every task is pre-written.
//
// This file is imported by node through `e2e/support/routes.ts` (type-stripping), so it must stay
// erasable syntax only: no enums, no namespaces, no parameter properties.

/** Monday-first, the order the week view renders. */
export const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const
export type Day = (typeof DAYS)[number]

export const CADENCES = ['daily', 'weekly', 'monthly'] as const
export type Cadence = (typeof CADENCES)[number]

/** A bilingual string, same row (ADR-0002 at content scale). */
export interface Bi {
  readonly el: string
  readonly en: string
}

export interface QuestionOption {
  readonly id: string
  readonly label: Bi
  /**
   * Minutes a day this option allows. The ONE question whose options carry `minutes` is the
   * topic's time budget (`generate.ts` `budgetOf`); every other question leaves it out.
   */
  readonly minutes?: number
  /** Choosing this option switches the plan to the "start gently" week (`generate.ts` `isGentle`). */
  readonly gentle?: boolean
}

export interface Question {
  readonly id: string
  /** `single` = radios, exactly one answer; `multi` = checkboxes, zero or more. */
  readonly kind: 'single' | 'multi'
  readonly title: Bi
  readonly help?: Bi
  readonly options: readonly QuestionOption[]
}

/**
 * Include a task only if EVERY listed question has at least one selected option in its list.
 * An empty object = always eligible.
 */
export type When = Readonly<Record<string, readonly string[]>>

export interface Task {
  readonly id: string
  readonly title: Bi
  readonly detail?: Bi
  readonly minutes: number
  readonly cadence: Cadence
  /** Weekly slotting hint (weekly tasks only). */
  readonly day?: Day
  /** How many days a week a weekly task repeats (default 1, at most 7). */
  readonly times?: number
  readonly when: When
  /** Priority inside the time budget: higher first. */
  readonly weight: number
  /** A one-off first-week task, only planned when the start is gentle. */
  readonly kickoff?: boolean
}

export interface TopicMeta {
  readonly id: string
  /** A decorative glyph (rendered `aria-hidden`). */
  readonly icon: string
  readonly title: Bi
  readonly blurb: Bi
}

export interface Topic extends TopicMeta {
  readonly questions: readonly Question[]
  readonly tasks: readonly Task[]
}

/** questionId → selected option ids. A single-choice question holds at most one. */
export type Answers = Readonly<Record<string, readonly string[]>>
