import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { bundledSource } from '../content/bundled.ts'
import type { Diet, Ingredient, Recipe } from '../content/source.ts'
import { LangProvider } from '../i18n/LangProvider'
import { dictionaries, type Lang } from '../i18n/dictionary'
import { disabledSource } from '../user/disabled'
import { fail, ok, type SavedPlan, type UserDataSource } from '../user/source'
import { generateWeekPlan, nextMonday } from './generate.ts'
import { PlanView, nextSeed, serializePlan, type PlanViewProps } from './PlanView'

interface Fixture {
  diet: Diet
  recipes: Recipe[]
  ingredients: Ingredient[]
}

async function fixture(slug = 'mediterranean'): Promise<Fixture> {
  const [diets, recipes, ingredients] = await Promise.all([
    bundledSource.listDiets(),
    bundledSource.listRecipes({ dietSlugs: [slug] }),
    bundledSource.listIngredients(),
  ])
  if (!diets.ok || !recipes.ok || !ingredients.ok) throw new Error('bundled source failed')
  const diet = diets.data.find((d) => d.slug === slug)
  if (!diet) throw new Error(`no diet ${slug}`)
  return { diet, recipes: recipes.data, ingredients: ingredients.data }
}

function fakeUserData(save = vi.fn()): UserDataSource & { save: typeof save } {
  const unused = async <T,>() => fail<T>('unknown')
  return {
    kind: 'supabase',
    userId: 'user-1',
    save,
    fridgeLists: { list: unused, save: unused, remove: unused },
    favourites: { list: unused, add: unused, remove: unused },
    savedPlans: { list: unused, save, remove: unused },
  }
}

function renderPlan(props: PlanViewProps, lang: Lang = 'en') {
  return render(
    <LangProvider initial={lang}>
      <MemoryRouter initialEntries={['/diets/mediterranean']}>
        <PlanView {...props} />
      </MemoryRouter>
    </LangProvider>,
  )
}

const TODAY = new Date('2026-10-07T10:00:00Z') // a Wednesday → next Monday is 2026-10-12

describe('<PlanView>', () => {
  it('renders 21 filled slots as recipe links and a non-empty shopping list for mediterranean', async () => {
    const fx = await fixture()
    renderPlan({ ...fx, initialSeed: 1, today: TODAY, source: disabledSource('local-only') })
    const slots = screen.getAllByTestId('plan-slot')
    expect(slots).toHaveLength(21)
    for (const slot of slots) {
      const link = within(slot).getByRole('link')
      expect(link.getAttribute('href')).toMatch(/^\/recipes\/[a-z0-9-]+$/)
    }
    const shopping = screen.getByRole('heading', { level: 3, name: dictionaries.en.shoppingList })
    expect(within(shopping.closest('section')!).getAllByRole('listitem').length).toBeGreaterThan(0)
    // Day and meal names from the dictionary; week-of caption for the computed Monday.
    expect(screen.getByRole('rowheader', { name: 'Monday' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Dinner' })).toBeInTheDocument()
    expect(screen.getByText(/Week of 12 October 2026/)).toBeInTheDocument()
    // Per-day totals are rounded integers.
    expect(screen.getAllByText(/^\d+ kcal$/)).toHaveLength(7)
    // ...and carry the engine's "typical values" caveat, once, under the table.
    expect(screen.getByTestId('plan-totals-note')).toHaveTextContent(
      dictionaries.en.typicalValuesNote,
    )
    expect(screen.getAllByText(dictionaries.en.typicalValuesNote)).toHaveLength(1)
  })

  it('renders day and meal names in Greek', async () => {
    const fx = await fixture()
    renderPlan({ ...fx, initialSeed: 1, today: TODAY, source: disabledSource('local-only') }, 'el')
    expect(screen.getByRole('rowheader', { name: 'Κυριακή' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Πρωινό' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: dictionaries.el.reshuffle })).toBeInTheDocument()
    expect(screen.getByTestId('plan-totals-note')).toHaveTextContent(
      dictionaries.el.typicalValuesNote,
    )
  })

  it('reshuffle moves to a new seed and changes at least one slot', async () => {
    const fx = await fixture()
    const { container } = renderPlan({
      ...fx,
      initialSeed: 1,
      today: TODAY,
      source: disabledSource('local-only'),
    })
    const root = container.querySelector('[data-seed]')!
    const before = screen.getAllByTestId('plan-slot').map((s) => s.textContent)
    fireEvent.click(screen.getByRole('button', { name: dictionaries.en.reshuffle }))
    expect(root.getAttribute('data-seed')).toBe(String(nextSeed(1)))
    const after = screen.getAllByTestId('plan-slot').map((s) => s.textContent)
    expect(after).toHaveLength(21)
    expect(after).not.toEqual(before)
    // The same two seeds produce the same difference through the pure generator.
    const a = generateWeekPlan('mediterranean', fx.recipes, fx.ingredients, { seed: 1 })
    const b = generateWeekPlan('mediterranean', fx.recipes, fx.ingredients, {
      seed: nextSeed(1),
    })
    expect(a.days.map((d) => d.slots.lunch?.slug)).not.toEqual(
      b.days.map((d) => d.slots.lunch?.slug),
    )
  })

  it('save calls savedPlans.save with the diet id, next Monday and the serialised plan', async () => {
    const fx = await fixture()
    const saved: SavedPlan = {
      id: 'p1',
      diet_id: fx.diet.id,
      week_start: '2026-10-12',
      plan: null,
      created_at: '2026-10-07T10:00:00Z',
    }
    const user = fakeUserData(vi.fn(async () => ok(saved)))
    renderPlan({ ...fx, initialSeed: 7, today: TODAY, source: user })
    fireEvent.click(screen.getByRole('button', { name: dictionaries.en.savePlan }))
    await waitFor(() => expect(user.save).toHaveBeenCalledTimes(1))
    const expected = generateWeekPlan('mediterranean', fx.recipes, fx.ingredients, {
      seed: 7,
      weekStart: nextMonday(TODAY),
    })
    expect(user.save).toHaveBeenCalledWith({
      diet_id: fx.diet.id,
      week_start: '2026-10-12',
      plan: serializePlan(expected),
    })
    expect(await screen.findByRole('status')).toHaveTextContent(dictionaries.en.planSaved)
    expect(screen.getByRole('button', { name: dictionaries.en.saved })).toBeDisabled()
  })

  it('shows the failure copy when save is refused', async () => {
    const fx = await fixture()
    const user = fakeUserData(vi.fn(async () => fail<SavedPlan>('network')))
    renderPlan({ ...fx, initialSeed: 7, today: TODAY, source: user }, 'el')
    fireEvent.click(screen.getByRole('button', { name: dictionaries.el.savePlan }))
    expect(await screen.findByRole('alert')).toHaveTextContent(dictionaries.el.saveFailed)
  })

  it('shows the local-only note instead of the save button when user data is disabled', async () => {
    const fx = await fixture()
    renderPlan({ ...fx, initialSeed: 1, today: TODAY, source: disabledSource('local-only') })
    expect(screen.queryByRole('button', { name: dictionaries.en.savePlan })).toBeNull()
    expect(screen.getByRole('note')).toHaveTextContent(dictionaries.en.userDataUnavailableLocal)
  })

  it('offers sign-in when there is a backend but no session', async () => {
    const fx = await fixture()
    renderPlan({ ...fx, initialSeed: 1, today: TODAY, source: disabledSource('signed-out') })
    expect(screen.getByRole('note')).toHaveTextContent(dictionaries.en.userDataSignInToSave)
    expect(screen.getByRole('link', { name: dictionaries.en.signIn }).getAttribute('href')).toMatch(
      /^\/auth\?next=/,
    )
  })

  it('serializePlan stores slugs and totals only, never recipe copies', async () => {
    const fx = await fixture()
    const plan = generateWeekPlan('mediterranean', fx.recipes, fx.ingredients, {
      seed: 3,
      weekStart: '2026-10-12',
    })
    const json = serializePlan(plan)
    expect(JSON.parse(JSON.stringify(json))).toEqual(json)
    expect(json).toMatchObject({ dietSlug: 'mediterranean', weekStart: '2026-10-12', seed: 3 })
    const days = (json as { days: Array<{ slots: Record<string, string | null> }> }).days
    expect(days).toHaveLength(7)
    expect(days[0].slots.breakfast).toBe(plan.days[0].slots.breakfast?.slug)
    expect(JSON.stringify(json)).not.toContain('"steps_en"')
  })

  it('nextSeed never returns its input', () => {
    for (const seed of [0, 1, 42, 0x7ffffffe]) expect(nextSeed(seed)).not.toBe(seed)
  })
})
