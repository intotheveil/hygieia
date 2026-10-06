import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { bundledSource, seedId } from '../content/bundled.ts'
import { DIETS } from '../content/seed/diets.ts'
import { LangProvider } from '../i18n/LangProvider'
import { dictionaries, type Lang } from '../i18n/dictionary'
import { unusedProfileMethods } from '../auth/fake-client'
import { disabledSource } from '../user/disabled'
import {
  fail,
  ok,
  type Favourite,
  type FridgeList,
  type SavedPlan,
  type UserDataSource,
} from '../user/source'
import { AccountPage } from './AccountPage'

const MED_ID = seedId('diets', 'mediterranean')
const MED_NAME = DIETS.find((d) => d.slug === 'mediterranean')!.name_en
const KETO_ID = seedId('diets', 'keto')

interface Store {
  plans: SavedPlan[]
  lists: FridgeList[]
  favourites: Favourite[]
}

/** A UserDataSource over an in-memory store: list reads it, remove mutates it. */
function fakeSource(store: Store) {
  const removePlan = vi.fn(async (id: string) => {
    store.plans = store.plans.filter((p) => p.id !== id)
    return ok(undefined)
  })
  const removeList = vi.fn(async (id: string) => {
    store.lists = store.lists.filter((l) => l.id !== id)
    return ok(undefined)
  })
  const removeFavourite = vi.fn(async (recipeId: string) => {
    store.favourites = store.favourites.filter((f) => f.recipe_id !== recipeId)
    return ok(undefined)
  })
  const refuse = async <T,>() => fail<T>('unknown')
  const source: UserDataSource = {
    kind: 'supabase',
    userId: 'user-1',
    savedPlans: { list: async () => ok([...store.plans]), save: refuse, remove: removePlan },
    fridgeLists: { list: async () => ok([...store.lists]), save: refuse, remove: removeList },
    favourites: {
      list: async () => ok([...store.favourites]),
      add: refuse,
      remove: removeFavourite,
    },
    ...unusedProfileMethods(),
  }
  return { source, removePlan, removeList, removeFavourite }
}

async function someRecipeId(): Promise<{ id: string; slug: string; title_en: string }> {
  const recipes = await bundledSource.listRecipes()
  if (!recipes.ok) throw new Error('bundled failed')
  const r = recipes.data[0]
  return { id: r.id, slug: r.slug, title_en: r.title_en }
}

function renderPage(source: UserDataSource, lang: Lang = 'en') {
  return render(
    <LangProvider initial={lang}>
      <MemoryRouter initialEntries={['/account']}>
        <AccountPage source={source} content={bundledSource} />
      </MemoryRouter>
    </LangProvider>,
  )
}

describe('<AccountPage>', () => {
  it('lists saved plans with the diet name, week start and an Open link, and removes one', async () => {
    const store: Store = {
      plans: [
        { id: 'p1', diet_id: MED_ID, week_start: '2026-10-12', plan: null, created_at: '' },
        { id: 'p2', diet_id: KETO_ID, week_start: '2026-10-19', plan: null, created_at: '' },
      ],
      lists: [],
      favourites: [],
    }
    const fake = fakeSource(store)
    renderPage(fake.source)
    expect(screen.getByRole('tablist')).toBeInTheDocument()
    expect(screen.getAllByRole('tab')).toHaveLength(3)

    const panel = await screen.findByRole('tabpanel')
    expect(await within(panel).findAllByRole('listitem')).toHaveLength(2)
    expect(within(panel).getByText(MED_NAME)).toBeInTheDocument()
    expect(within(panel).getByText(/Week of 12 October 2026/)).toBeInTheDocument()
    expect(within(panel).getByRole('link', { name: `Open: ${MED_NAME}` })).toHaveAttribute(
      'href',
      '/diets/mediterranean',
    )

    fireEvent.click(within(panel).getByRole('button', { name: `Remove: ${MED_NAME}` }))
    await waitFor(() => expect(fake.removePlan).toHaveBeenCalledWith('p1'))
    // The page reloads after a successful remove (a loading flash, then the shorter list).
    await waitFor(() => expect(within(panel).getAllByRole('listitem')).toHaveLength(1))
    expect(within(panel).queryByText(MED_NAME)).toBeNull()
  })

  it('switches tabs: fridge lists show name + count; favourites link to the recipe', async () => {
    const recipe = await someRecipeId()
    const store: Store = {
      plans: [],
      lists: [{ id: 'l1', name: 'Weekend', ingredient_slugs: ['feta', 'tomato'], updated_at: '' }],
      favourites: [{ recipe_id: recipe.id, created_at: '' }],
    }
    const fake = fakeSource(store)
    renderPage(fake.source)
    const panel = await screen.findByRole('tabpanel')
    expect(await within(panel).findByText(dictionaries.en.nothingSavedYet)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('tab', { name: dictionaries.en.savedFridgeLists }))
    expect(screen.getByRole('tab', { name: dictionaries.en.savedFridgeLists })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    expect(await screen.findByText('Weekend')).toBeInTheDocument()
    expect(screen.getByText('2 items')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('tab', { name: dictionaries.en.favourites }))
    expect(await screen.findByText(recipe.title_en)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: `Open: ${recipe.title_en}` })).toHaveAttribute(
      'href',
      `/recipes/${recipe.slug}`,
    )
    fireEvent.click(screen.getByRole('button', { name: `Remove: ${recipe.title_en}` }))
    await waitFor(() => expect(fake.removeFavourite).toHaveBeenCalledWith(recipe.id))
    expect(await screen.findByText(dictionaries.en.nothingSavedYet)).toBeInTheDocument()
  })

  it('shows the error copy with retry when a list fails, in Greek', async () => {
    const fake = fakeSource({ plans: [], lists: [], favourites: [] })
    const failing: UserDataSource = {
      ...fake.source,
      savedPlans: { ...fake.source.savedPlans, list: async () => fail('network') },
    }
    renderPage(failing, 'el')
    expect(await screen.findByRole('alert')).toHaveTextContent(dictionaries.el.loadFailed)
    expect(screen.getByRole('button', { name: dictionaries.el.retry })).toBeInTheDocument()
  })

  it('shows the remove-failed copy when a remove is refused and keeps the item', async () => {
    const store: Store = {
      plans: [{ id: 'p1', diet_id: MED_ID, week_start: '2026-10-12', plan: null, created_at: '' }],
      lists: [],
      favourites: [],
    }
    const fake = fakeSource(store)
    const refusing: UserDataSource = {
      ...fake.source,
      savedPlans: { ...fake.source.savedPlans, remove: async () => fail('network') },
    }
    renderPage(refusing)
    fireEvent.click(await screen.findByRole('button', { name: `Remove: ${MED_NAME}` }))
    expect(await screen.findByRole('alert')).toHaveTextContent(dictionaries.en.removeFailed)
    expect(screen.getByText(MED_NAME)).toBeInTheDocument()
  })

  it('renders the bilingual note when the source is disabled', () => {
    renderPage(disabledSource('local-only'), 'el')
    expect(screen.getByRole('note')).toHaveTextContent(dictionaries.el.userDataUnavailableLocal)
    expect(screen.queryByRole('tablist')).toBeNull()
  })
})

describe('<AccountPage> async states (P5.1)', () => {
  it('renders the panel skeleton first while a slow source has not answered', () => {
    const fake = fakeSource({ plans: [], lists: [], favourites: [] })
    const slow: UserDataSource = {
      ...fake.source,
      savedPlans: { ...fake.source.savedPlans, list: () => new Promise(() => {}) },
    }
    renderPage(slow, 'el')
    const status = screen.getByRole('status')
    expect(status).toHaveAttribute('aria-busy', 'true')
    expect(status).toHaveAttribute('data-skeleton', 'panel')
    expect(status).toHaveTextContent(dictionaries.el.loading)
    expect(screen.queryByRole('alert')).toBeNull()
    expect(screen.getByRole('tablist')).toBeInTheDocument()
  })

  it('renders the empty tab through the shared EmptyState', async () => {
    const fake = fakeSource({ plans: [], lists: [], favourites: [] })
    renderPage(fake.source)
    const title = await screen.findByText(dictionaries.en.nothingSavedYet)
    expect(title.closest('[data-empty-state]')).not.toBeNull()
  })
})
