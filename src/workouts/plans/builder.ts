// PLAN BUILDER — pure form validation (P8.3). The form's strings → the `WorkoutPlanInput` the
// contract (src/user/source.ts) and the migration's CHECKs accept: name 1–80 characters (trimmed),
// weeks 1–12, days per week 1–7, a real start date (any date: a plan may be back-dated to cover
// sessions already done, or start next Monday).

import { dayNumber } from '../../profile/stats'
import type { WorkoutPlanInput } from '../../user/source'

export const MAX_PLAN_NAME = 80
export const MAX_WEEKS = 12
export const MAX_DAYS = 7

export type PlanFormError = 'name' | 'weeks' | 'days' | 'date' | 'template'

export interface PlanForm {
  template_id: string | null
  name: string
  weeks: string
  days_per_week: string
  start_date: string
}

export type PlanFormResult =
  { ok: true; input: WorkoutPlanInput } | { ok: false; errors: PlanFormError[] }

function wholeIn(raw: string, min: number, max: number): number | null {
  const s = raw.trim()
  if (!/^\d+$/.test(s)) return null
  const n = Number(s)
  return n >= min && n <= max ? n : null
}

export function validatePlanForm(form: PlanForm): PlanFormResult {
  const errors: PlanFormError[] = []
  if (form.template_id === null || form.template_id === '') errors.push('template')
  const name = form.name.trim()
  if (name.length < 1 || name.length > MAX_PLAN_NAME) errors.push('name')
  const weeks = wholeIn(form.weeks, 1, MAX_WEEKS)
  if (weeks === null) errors.push('weeks')
  const days = wholeIn(form.days_per_week, 1, MAX_DAYS)
  if (days === null) errors.push('days')
  if (dayNumber(form.start_date) === null) errors.push('date')
  if (errors.length > 0 || form.template_id === null || weeks === null || days === null) {
    return { ok: false, errors }
  }
  return {
    ok: true,
    input: {
      template_id: form.template_id,
      name,
      weeks,
      days_per_week: days,
      start_date: form.start_date,
    },
  }
}
