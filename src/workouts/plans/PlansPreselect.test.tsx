import { render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { bundledSource } from '../../content/bundled'
import { LangProvider } from '../../i18n/LangProvider'
import { en } from '../../i18n/dictionary'
import { memorySource } from '../../user/memory'
import { PlansPage } from './PlansPage'

// `/workouts/plans?type=&level=&intensity=` — the Tasks Advisor's "Turn this into a workout plan →"
// (connect the features, 2026-10-06) — opens the builder on that cell of the bundled templates.

function LocationProbe() {
  const location = useLocation()
  return <span data-testid="location">{`${location.pathname}${location.search}`}</span>
}

function renderAt(path: string, source = memorySource().source) {
  render(
    <LangProvider initial="en">
      <MemoryRouter initialEntries={[path]}>
        <PlansPage source={source} content={bundledSource} today="2026-10-06" />
        <LocationProbe />
      </MemoryRouter>
    </LangProvider>,
  )
}

async function templateOf(type: string, level: string, intensity: string) {
  const all = await bundledSource.listWorkoutTemplates()
  if (!all.ok) throw new Error('templates')
  return all.data.find(
    (t) => t.workout_type === type && t.level === level && t.intensity === intensity,
  )!
}

describe('<PlansPage> pre-selects a cell from the URL', () => {
  it('type + level + intensity → that template, even with an active plan', async () => {
    const tpl = await templateOf('running', 'beginner', 'low')
    const m = memorySource()
    await m.source.createWorkoutPlan({
      template_id: tpl.id,
      name: 'Existing',
      weeks: 4,
      days_per_week: 3,
    })
    renderAt('/workouts/plans?type=running&level=beginner&intensity=low', m.source)
    const builder = await screen.findByRole('region', { name: en.wpBuilderHeading })
    expect(within(builder).getByRole('radio', { name: en.types.running })).toHaveAttribute(
      'aria-checked',
      'true',
    )
    expect(within(builder).getByRole('radio', { name: en.levels.beginner })).toHaveAttribute(
      'aria-checked',
      'true',
    )
    expect(within(builder).getByRole('radio', { name: en.intensities.low })).toHaveAttribute(
      'aria-checked',
      'true',
    )
    expect(within(builder).getByTestId('builder-template')).toHaveTextContent(tpl.title_en)
    expect(within(builder).getByLabelText(en.wpName)).toHaveValue(tpl.title_en)
  })

  it('a missing intensity means moderate', async () => {
    const tpl = await templateOf('gym', 'intermediate', 'moderate')
    renderAt('/workouts/plans?type=gym&level=intermediate')
    const builder = await screen.findByRole('region', { name: en.wpBuilderHeading })
    expect(within(builder).getByTestId('builder-template')).toHaveTextContent(tpl.title_en)
  })

  it('an invalid cell is ignored (default cell, builder closed when a plan is active)', async () => {
    const m = memorySource()
    const tpl = await templateOf('home', 'beginner', 'moderate')
    await m.source.createWorkoutPlan({
      template_id: tpl.id,
      name: 'Existing',
      weeks: 4,
      days_per_week: 3,
    })
    renderAt('/workouts/plans?type=moon&level=beginner', m.source)
    await screen.findByRole('article', { name: 'Existing' })
    expect(screen.queryByRole('region', { name: en.wpBuilderHeading })).toBeNull()
    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('type=moon'))
  })
})
