import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { LangProvider } from '../../i18n/LangProvider'
import { el, en, type Lang } from '../../i18n/dictionary'
import { memorySource, type MemorySource } from '../../user/memory'
import type { WorkoutPlan } from '../../user/source'
import { SessionLogger } from './SessionLogger'
import { PRESS, SQUAT, STRETCH, TEMPLATE, plan } from './fixtures'

const TODAY = '2026-10-06'

function setup(
  options: {
    lang?: Lang
    mem?: MemorySource
    planRow?: WorkoutPlan | null
    template?: typeof TEMPLATE | null
  } = {},
) {
  const mem = options.mem ?? memorySource({ now: () => `${TODAY}T12:00:00.000Z` })
  const onSaved = vi.fn()
  const onCancel = vi.fn()
  render(
    <LangProvider initial={options.lang ?? 'en'}>
      <SessionLogger
        source={mem.source}
        template={options.template === undefined ? TEMPLATE : options.template}
        plan={options.planRow === undefined ? plan() : options.planRow}
        today={TODAY}
        onSaved={onSaved}
        onCancel={onCancel}
      />
    </LangProvider>,
  )
  return { mem, onSaved, onCancel }
}

const input = (label: string) => screen.getByRole('textbox', { name: label })
const field = (what: string, n: number, name: string) => `${what} · Set ${n} · ${name}`

afterEach(() => {
  vi.useRealTimers()
})

describe('<SessionLogger>', () => {
  it('pre-fills the template exercises with their prescribed sets and reps', () => {
    setup()
    const groups = screen.getAllByRole('group')
    expect(groups.map((g) => g.querySelector('legend')?.textContent)).toEqual([
      SQUAT.name_en,
      PRESS.name_en,
      STRETCH.name_en,
    ])
    expect(within(groups[0]!).getByText('Plan: 3 × 8')).toBeInTheDocument()
    expect(within(groups[2]!).getByText('Plan: 1 × 40 s')).toBeInTheDocument()
    expect(within(groups[0]!).getAllByRole('textbox', { name: /^Reps/ })).toHaveLength(3)
    expect(input(field('Reps', 1, SQUAT.name_en))).toHaveValue('8')
    expect(input(field('Reps', 2, PRESS.name_en))).toHaveValue('10')
    expect(input(field('Reps', 1, STRETCH.name_en))).toHaveValue('')
    expect(screen.getByLabelText(en.wpDuration)).toHaveValue('45')
    expect(screen.getByLabelText(en.wpDate)).toHaveValue(TODAY)
    expect(screen.getByRole('heading', { name: en.wpLoggerHeading })).toHaveFocus()
  })

  it('saves the session on the plan AND a workout entry carrying its id, then reports it', async () => {
    const { mem, onSaved } = setup()
    fireEvent.change(input(field('Weight (kg)', 1, SQUAT.name_en)), { target: { value: '62,5' } })
    fireEvent.change(input(field(en.wpRpe, 1, SQUAT.name_en)), { target: { value: '8' } })
    fireEvent.click(screen.getByRole('checkbox', { name: field('Done', 1, SQUAT.name_en) }))
    fireEvent.change(screen.getByLabelText(en.wpNote), { target: { value: 'Good day' } })
    fireEvent.click(screen.getByRole('button', { name: en.wpSave }))

    await waitFor(() => expect(onSaved).toHaveBeenCalledTimes(1))
    expect(mem.store.workoutSessions).toHaveLength(1)
    const saved = mem.store.workoutSessions[0]!
    expect(saved).toMatchObject({
      plan_id: 'plan-1',
      template_id: TEMPLATE.id,
      performed_at: TODAY,
      duration_min: 45,
      note: 'Good day',
    })
    expect(saved.exercises.map((e) => e.exercise_id)).toEqual([SQUAT.id, PRESS.id])
    expect(saved.exercises[0]?.sets[0]).toEqual({ reps: 8, weight_kg: 62.5, rpe: 8, done: true })
    expect(saved).not.toHaveProperty('user_id')
    expect(onSaved).toHaveBeenCalledWith(saved)

    expect(mem.store.entries).toEqual([
      expect.objectContaining({
        kind: 'workout',
        entry_date: TODAY,
        value: 45,
        unit: 'min',
        payload: { session_id: saved.id },
      }),
    ])
  })

  it('writes a value-less workout entry when the duration is blank', async () => {
    const { mem, onSaved } = setup()
    fireEvent.change(screen.getByLabelText(en.wpDuration), { target: { value: '' } })
    fireEvent.click(screen.getByRole('button', { name: en.wpSave }))
    await waitFor(() => expect(onSaved).toHaveBeenCalled())
    expect(mem.store.workoutSessions[0]?.duration_min).toBeNull()
    expect(mem.store.entries[0]).toMatchObject({ kind: 'workout', value: null, unit: null })
  })

  it('adds a set copying the last one and removes a set', () => {
    setup()
    const squat = screen.getAllByRole('group')[0]!
    fireEvent.change(input(field('Weight (kg)', 3, SQUAT.name_en)), { target: { value: '70' } })
    fireEvent.click(
      within(squat).getByRole('button', { name: `${en.wpAddSet} · ${SQUAT.name_en}` }),
    )
    expect(within(squat).getAllByRole('textbox', { name: /^Reps/ })).toHaveLength(4)
    expect(input(field('Weight (kg)', 4, SQUAT.name_en))).toHaveValue('70')
    expect(input(field('Reps', 4, SQUAT.name_en))).toHaveValue('8')

    fireEvent.click(screen.getByRole('button', { name: `Remove set 1 of ${SQUAT.name_en}` }))
    expect(within(squat).getAllByRole('textbox', { name: /^Reps/ })).toHaveLength(3)
    expect(input(field('Weight (kg)', 3, SQUAT.name_en))).toHaveValue('70')
  })

  it('shows field errors and writes nothing when a set is invalid', async () => {
    const { mem, onSaved } = setup()
    const reps = input(field('Reps', 2, SQUAT.name_en))
    fireEvent.change(reps, { target: { value: 'lots' } })
    fireEvent.change(screen.getByLabelText(en.wpDuration), { target: { value: '0' } })
    fireEvent.click(screen.getByRole('button', { name: en.wpSave }))

    expect(await screen.findByText(en.wpSetErrors.reps)).toBeInTheDocument()
    expect(reps).toHaveAttribute('aria-invalid', 'true')
    expect(reps).toHaveAccessibleDescription(en.wpSetErrors.reps)
    expect(screen.getByText(en.wpErrors.durationRange)).toBeInTheDocument()
    expect(mem.store.workoutSessions).toEqual([])
    expect(mem.store.entries).toEqual([])
    expect(onSaved).not.toHaveBeenCalled()
  })

  it('refuses to save with no sets at all (template hidden)', async () => {
    const { mem } = setup({ template: null, planRow: plan() })
    expect(screen.getByText(en.wpNoTemplate)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: en.wpSave }))
    expect(await screen.findByRole('alert')).toHaveTextContent(en.wpErrors.noSets)
    expect(mem.store.workoutSessions).toEqual([])
  })

  it('keeps the form and shows an alert when the session write is refused; no entry is written', async () => {
    const mem = memorySource({ failing: new Set(['addWorkoutSession'] as const) })
    const { onSaved } = setup({ mem })
    fireEvent.click(screen.getByRole('button', { name: en.wpSave }))
    expect(await screen.findByRole('alert')).toHaveTextContent(en.wpSaveFailed)
    expect(onSaved).not.toHaveBeenCalled()
    expect(mem.store.entries).toEqual([])
    expect(screen.getByRole('button', { name: en.wpSave })).toBeEnabled()
  })

  it('still reports the session when only the profile entry write fails (best-effort)', async () => {
    const mem = memorySource({ failing: new Set(['addEntry'] as const) })
    const { onSaved } = setup({ mem })
    fireEvent.click(screen.getByRole('button', { name: en.wpSave }))
    await waitFor(() => expect(onSaved).toHaveBeenCalled())
    expect(mem.store.workoutSessions).toHaveLength(1)
  })

  it('logs a session without a plan (plan_id null, template kept)', async () => {
    const { mem, onSaved } = setup({ planRow: null })
    fireEvent.click(screen.getByRole('button', { name: en.wpSave }))
    await waitFor(() => expect(onSaved).toHaveBeenCalled())
    expect(mem.store.workoutSessions[0]).toMatchObject({ plan_id: null, template_id: TEMPLATE.id })
  })

  it('Cancel calls back without writing', () => {
    const { mem, onCancel } = setup()
    fireEvent.click(screen.getByRole('button', { name: en.wpCancel }))
    expect(onCancel).toHaveBeenCalled()
    expect(mem.store.workoutSessions).toEqual([])
  })

  it('runs a rest countdown from the slot rest time and can stop it', () => {
    vi.useFakeTimers()
    setup()
    fireEvent.click(screen.getByRole('button', { name: `Rest 90 s · ${SQUAT.name_en}` }))
    const timer = screen.getByRole('timer', { name: en.wpRestTimer })
    expect(timer).toHaveTextContent('Rest: 1:30')
    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(timer).toHaveTextContent('Rest: 1:29')
    act(() => {
      vi.advanceTimersByTime(89_000)
    })
    expect(screen.getByRole('timer')).toHaveTextContent(en.wpRestOver)
    fireEvent.click(screen.getByRole('button', { name: en.wpRestStop }))
    expect(screen.queryByRole('timer')).toBeNull()
  })

  it('falls back to a 60 s rest when the slot has none', () => {
    setup()
    expect(screen.getByRole('button', { name: `Rest 60 s · ${PRESS.name_en}` })).toBeInTheDocument()
  })

  it('speaks Greek', () => {
    setup({ lang: 'el' })
    expect(screen.getByRole('heading', { name: el.wpLoggerHeading })).toBeInTheDocument()
    expect(screen.getByRole('group', { name: SQUAT.name_el })).toBeInTheDocument()
    expect(
      screen.getByRole('textbox', { name: `${el.wpReps} · Σετ 1 · ${SQUAT.name_el}` }),
    ).toHaveValue('8')
    expect(screen.getByRole('button', { name: el.wpSave })).toBeInTheDocument()
  })
})
