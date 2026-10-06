// TASKS ADVISOR — the questionnaire (P9). One question per step: a `<fieldset>` whose `<legend>`
// holds the question as an h2, native radios (single choice) or checkboxes (multi choice), a
// progress bar, Back / Next. It is a `<form>`, so Enter on a focused option submits the step; Next
// stays disabled until a single-choice question has its answer (multi-choice may stay empty =
// "none of these"). After Back/Next, focus moves to the new question's heading so keyboard and
// screen-reader users land on it instead of on a button that may have changed.

import { useEffect, useRef, useState, type FormEvent } from 'react'
import { fill } from '../i18n/fill'
import { useLang } from '../i18n/LangProvider'
import { tasksCopy } from '../i18n/features/tasks.ts'
import type { Answers, Topic } from './types'

export interface QuestionnaireProps {
  topic: Topic
  onDone: (answers: Answers) => void
}

const BTN =
  'rounded-full border border-olive-900/20 bg-paper-50 px-5 py-2 text-sm font-medium text-olive-900 hover:border-olive-900/40 disabled:cursor-not-allowed disabled:opacity-50'
const BTN_PRIMARY =
  'rounded-full bg-olive-900 px-5 py-2 text-sm font-medium text-paper-50 hover:bg-olive-950 disabled:cursor-not-allowed disabled:opacity-50'

export function Questionnaire({ topic, onDone }: QuestionnaireProps) {
  const { t, lang } = useLang(tasksCopy)
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string[]>>({})
  const heading = useRef<HTMLHeadingElement>(null)
  const moved = useRef(false)

  useEffect(() => {
    if (moved.current) heading.current?.focus()
  }, [step])

  const total = topic.questions.length
  const q = topic.questions[step]
  if (!q) return null
  const chosen = answers[q.id] ?? []
  const last = step === total - 1
  const canGoOn = q.kind === 'multi' || chosen.length === 1
  const help = q.help?.[lang] ?? (q.kind === 'multi' ? t.tasksMultiHint : null)
  const progress = fill(t.tasksQuestionProgress, { n: step + 1, total })

  const choose = (optionId: string, on: boolean) => {
    setAnswers((prev) => {
      const current = prev[q.id] ?? []
      const next =
        q.kind === 'single'
          ? [optionId]
          : on
            ? q.options.map((o) => o.id).filter((id) => id === optionId || current.includes(id))
            : current.filter((id) => id !== optionId)
      return { ...prev, [q.id]: next }
    })
  }

  const go = (to: number) => {
    moved.current = true
    setStep(to)
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!canGoOn) return
    if (last) onDone(answers)
    else go(step + 1)
  }

  return (
    <form
      onSubmit={submit}
      className="flex max-w-2xl flex-col gap-6"
      aria-label={topic.title[lang]}
    >
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-sage-700">{progress}</p>
        <div
          role="progressbar"
          aria-label={t.tasksQuestionnaireProgress}
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={step + 1}
          aria-valuetext={progress}
          className="h-2 overflow-hidden rounded-full bg-paper-200"
        >
          <div
            className="h-full rounded-full bg-sage-500 transition-[width]"
            style={{ width: `${Math.round(((step + 1) / total) * 100)}%` }}
          />
        </div>
      </div>

      <fieldset
        id="tasks-question"
        aria-describedby={help ? 'tasks-question-help' : undefined}
        className="flex flex-col gap-4 rounded-2xl border border-olive-900/10 bg-paper-50/80 p-6 shadow-sm"
      >
        <legend className="mb-1 p-0">
          <h2
            ref={heading}
            tabIndex={-1}
            className="font-display text-2xl font-semibold text-olive-950 outline-none"
          >
            {q.title[lang]}
          </h2>
        </legend>
        {help && (
          <p id="tasks-question-help" className="text-sm text-olive-700">
            {help}
          </p>
        )}
        <ul className="flex flex-col gap-2">
          {q.options.map((o) => {
            const id = `tasks-q-${q.id}-${o.id}`
            const checked = chosen.includes(o.id)
            return (
              <li key={o.id}>
                <label
                  htmlFor={id}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-olive-900 ${
                    checked
                      ? 'border-sage-700 bg-sage-500/10'
                      : 'border-olive-900/15 hover:border-olive-900/40'
                  }`}
                >
                  <input
                    id={id}
                    type={q.kind === 'single' ? 'radio' : 'checkbox'}
                    name={q.id}
                    value={o.id}
                    checked={checked}
                    onChange={(e) => choose(o.id, e.target.checked)}
                    className="size-4 accent-sage-700"
                  />
                  <span>{o.label[lang]}</span>
                </label>
              </li>
            )
          })}
        </ul>
      </fieldset>

      <div className="flex flex-wrap gap-3">
        <button type="button" className={BTN} disabled={step === 0} onClick={() => go(step - 1)}>
          {t.tasksBack}
        </button>
        <button type="submit" className={BTN_PRIMARY} disabled={!canGoOn}>
          {last ? t.tasksSeePlan : t.tasksNext}
        </button>
      </div>
    </form>
  )
}
