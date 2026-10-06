import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { INGREDIENTS } from '../content/seed/ingredients.ts'
import { RECIPES } from '../content/seed/recipes.ts'
import type { IngredientSeed, RecipeSeed } from '../content/types.ts'
import { LangProvider } from '../i18n/LangProvider'
import { el, en, type Lang } from '../i18n/dictionary'
import { fill } from '../i18n/fill'
import { unusedProfileMethods } from '../auth/fake-client'
import { disabledSource } from '../user/disabled'
import { memorySource } from '../user/memory'
import { ok, type FridgeList, type UserDataSource } from '../user/source'
import { bundledSource } from '../content/bundled.ts'
import { fail, type ContentSource } from '../content/source.ts'
import { FridgePage } from './FridgePage'
import { indexBySlug, matchRecipes } from './match'
import { FRIDGE_STORAGE_KEY, serializeFridgeState } from './storage'

// The page reads `useUserData()`; default to the real local-only answer, override per test.
const userData = vi.hoisted(() => ({ current: null as UserDataSource | null }))
vi.mock('../user/useUserData', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../user/useUserData')>()
  return {
    useUserData: () => userData.current ?? actual.useUserData(),
  }
})

const bySlug = indexBySlug(INGREDIENTS)
const ingredient = (slug: string): IngredientSeed => {
  const found = bySlug.get(slug)
  if (!found) throw new Error(`seed has no ingredient ${slug}`)
  return found
}
const name = (slug: string, lang: Lang) =>
  lang === 'el' ? ingredient(slug).name_el : ingredient(slug).name_en

function renderPage(lang: Lang = 'en') {
  return render(
    <LangProvider initial={lang}>
      <MemoryRouter initialEntries={['/fridge']}>
        <FridgePage />
      </MemoryRouter>
    </LangProvider>,
  )
}

async function ready() {
  await waitFor(() => expect(screen.getByRole('combobox')).toBeInTheDocument())
  return screen.getByRole('combobox')
}

/** Type `query`, then pick the option whose PRIMARY name is exactly `exact` (not "Tomato paste"). */
function addByTyping(input: HTMLElement, query: string, exact: string) {
  fireEvent.change(input, { target: { value: query } })
  const option = screen
    .getAllByRole('option')
    .find((candidate) => within(candidate).queryByText(exact) !== null)
  if (!option) throw new Error(`no option named exactly ${exact}`)
  fireEvent.mouseDown(option)
}

function chips(lang: Lang = 'en') {
  const dict = lang === 'el' ? el : en
  return within(screen.getByRole('list', { name: dict.yourIngredients })).getAllByRole('listitem')
}

function progressValues(): number[] {
  return screen.getAllByRole('progressbar').map((bar) => Number(bar.getAttribute('aria-valuenow')))
}

beforeEach(() => {
  window.localStorage.clear()
  userData.current = null
})

describe('<FridgePage> — ingredients', () => {
  it('shows the empty state until an ingredient is added, in both languages', async () => {
    for (const [lang, dict] of [
      ['en', en],
      ['el', el],
    ] as const) {
      const view = renderPage(lang)
      await ready()
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(dict.fridgeTitle)
      expect(screen.getByText(dict.fridgeIntro)).toBeInTheDocument()
      expect(screen.getByText(dict.fridgeEmpty)).toBeInTheDocument()
      expect(screen.getByText(dict.fridgeEmptyHint)).toBeInTheDocument()
      expect(screen.queryByRole('progressbar')).toBeNull()
      view.unmount()
    }
  })

  it('typing ντομ offers Ντομάτα and picking it makes a chip', async () => {
    renderPage('el')
    const input = await ready()
    fireEvent.change(input, { target: { value: 'ντομ' } })
    expect(screen.getAllByRole('option')[0]).toHaveTextContent('Ντομάτα')
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(chips('el')).toHaveLength(1)
    expect(chips('el')[0]).toHaveTextContent('Ντομάτα')
    expect(screen.queryByText(el.fridgeEmpty)).toBeNull()
  })

  it('removes a chip with its button and clears all with clearAll', async () => {
    renderPage('en')
    const input = await ready()
    addByTyping(input, 'tomato', 'Tomato')
    addByTyping(input, 'cucumber', 'Cucumber')
    addByTyping(input, 'feta', 'Feta')
    expect(chips()).toHaveLength(3)

    fireEvent.click(screen.getByRole('button', { name: `${en.removeIngredient}: Cucumber` }))
    expect(chips().map((c) => c.textContent)).toEqual(['Tomato×', 'Feta×'])

    fireEvent.click(screen.getByRole('button', { name: en.clearAll }))
    expect(screen.queryByRole('list', { name: en.yourIngredients })).toBeNull()
    expect(screen.getByText(en.fridgeEmpty)).toBeInTheDocument()
  })

  it('persists on every change and a reload restores the chips and the staples switch', async () => {
    const first = renderPage('en')
    const input = await ready()
    addByTyping(input, 'tomato', 'Tomato')
    addByTyping(input, 'feta', 'Feta')
    fireEvent.click(screen.getByRole('checkbox'))
    expect(JSON.parse(window.localStorage.getItem(FRIDGE_STORAGE_KEY) ?? 'null')).toEqual({
      v: 1,
      slugs: ['tomato', 'feta'],
      ignoreStaples: false,
    })
    first.unmount()

    renderPage('en')
    await ready()
    expect(chips().map((c) => c.textContent)).toEqual(['Tomato×', 'Feta×'])
    expect(screen.getByRole('checkbox')).not.toBeChecked()
  })

  it('restores a stored list written by another session (storage mocked)', async () => {
    window.localStorage.setItem(
      FRIDGE_STORAGE_KEY,
      serializeFridgeState({ slugs: ['cucumber', 'tomato'], ignoreStaples: true }),
    )
    renderPage('el')
    await ready()
    expect(chips('el').map((c) => c.textContent)).toEqual(['Αγγούρι×', 'Ντομάτα×'])
  })

  it('still works when localStorage throws (only persistence is lost)', async () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota')
    })
    try {
      renderPage('en')
      const input = await ready()
      addByTyping(input, 'tomato', 'Tomato')
      expect(chips()).toHaveLength(1)
    } finally {
      setItem.mockRestore()
    }
  })
})

describe('<FridgePage> — results', () => {
  it('adding tomato, cucumber and feta ranks recipes; the first card has youHave and a missing list', async () => {
    renderPage('en')
    const input = await ready()
    addByTyping(input, 'tomato', 'Tomato')
    addByTyping(input, 'cucumber', 'Cucumber')
    addByTyping(input, 'feta', 'Feta')

    const expected = matchRecipes(RECIPES, INGREDIENTS, new Set(['tomato', 'cucumber', 'feta']), {
      ignorePantryStaples: true,
    })
    expect(expected.length).toBeGreaterThan(1)
    expect(screen.getByRole('status')).toHaveTextContent(
      fill(en.matchesCount, { n: expected.length }),
    )
    expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite')

    const cards = screen.getAllByRole('article')
    expect(cards).toHaveLength(expected.length)
    // Rendered in the matcher's order (ranked), and the first is at least as covered as the last.
    const titles = cards.map((c) => within(c).getByRole('heading', { level: 3 }).textContent)
    expect(titles).toEqual(expected.map((r) => r.recipe.title_en))
    const values = progressValues()
    expect(values[0]).toBeGreaterThanOrEqual(values.at(-1) ?? 0)

    const top = expected[0]!
    const first = cards[0]!
    const covered = top.have.length + top.substitutions.length
    expect(first).toHaveTextContent(
      fill(en.youHave, { have: covered, total: covered + top.missing.length }),
    )
    expect(within(first).getByRole('link')).toHaveAttribute('href', `/recipes/${top.recipe.slug}`)
    // Some card in the list is missing something and names it.
    const withMissing = expected.findIndex((r) => r.missing.length > 0)
    expect(withMissing).toBeGreaterThanOrEqual(0)
    const card = cards[withMissing]!
    expect(card).toHaveTextContent(`${en.missing}:`)
    expect(card).toHaveTextContent(expected[withMissing]!.missing[0]!.name_en)
  })

  it('shows a substitution line "X → use Y" for a recipe missing X when Y is in the fridge', async () => {
    // Found in the real seed: a recipe line whose ingredient has a substitute; the fridge holds
    // ONLY that substitute, so the recipe appears with exactly that substitution.
    let found: { recipe: RecipeSeed; missing: IngredientSeed; use: IngredientSeed } | null = null
    for (const recipe of RECIPES) {
      for (const line of recipe.ingredients) {
        const missing = bySlug.get(line.ingredient_slug)
        const useSlug = missing?.substitute_slugs.find(
          (s) => bySlug.has(s) && !recipe.ingredients.some((l) => l.ingredient_slug === s),
        )
        if (missing && useSlug) {
          found = { recipe, missing, use: ingredient(useSlug) }
          break
        }
      }
      if (found) break
    }
    expect(found).not.toBeNull()
    const { recipe, missing, use } = found!

    renderPage('en')
    const input = await ready()
    addByTyping(input, use.name_en, use.name_en)
    expect(chips()).toHaveLength(1)

    const line = fill(en.substitute, { missing: missing.name_en, use: use.name_en })
    const card = screen
      .getAllByRole('article')
      .find((c) => within(c).getByRole('heading', { level: 3 }).textContent === recipe.title_en)
    expect(card).toBeDefined()
    expect(card).toHaveTextContent(line)
  })

  it('toggling "ignore pantry staples" changes a coverage figure and persists', async () => {
    renderPage('en')
    const input = await ready()
    addByTyping(input, 'tomato', 'Tomato')
    addByTyping(input, 'cucumber', 'Cucumber')
    addByTyping(input, 'feta', 'Feta')

    const have = new Set(['tomato', 'cucumber', 'feta'])
    const withStaples = matchRecipes(RECIPES, INGREDIENTS, have, { ignorePantryStaples: true })
    const without = matchRecipes(RECIPES, INGREDIENTS, have, { ignorePantryStaples: false })
    const pct = (rs: typeof withStaples) => rs.map((r) => Math.round(r.coverage * 100))
    expect(pct(withStaples)).not.toEqual(pct(without))

    const checkbox = screen.getByRole('checkbox', { name: en.ignoreStaples })
    expect(checkbox).toBeChecked()
    expect(checkbox).toHaveAccessibleDescription(en.ignoreStaplesHint)
    const before = progressValues()
    expect(before).toEqual(pct(withStaples))

    fireEvent.click(checkbox)
    expect(checkbox).not.toBeChecked()
    const after = progressValues()
    expect(after).toEqual(pct(without))
    expect(after).not.toEqual(before)
    expect(JSON.parse(window.localStorage.getItem(FRIDGE_STORAGE_KEY) ?? '{}')).toMatchObject({
      ignoreStaples: false,
    })
  })

  it('shows noMatches for an ingredient no recipe uses', async () => {
    const unused = INGREDIENTS.find(
      (i) =>
        !RECIPES.some((r) => r.ingredients.some((l) => l.ingredient_slug === i.slug)) &&
        !INGREDIENTS.some((o) => o.substitute_slugs.includes(i.slug)),
    )
    if (!unused) return // every seed ingredient is used somewhere: nothing to assert here
    window.localStorage.setItem(
      FRIDGE_STORAGE_KEY,
      serializeFridgeState({ slugs: [unused.slug], ignoreStaples: true }),
    )
    renderPage('en')
    await ready()
    expect(screen.getByRole('status')).toHaveTextContent(en.noMatches)
    expect(screen.queryByRole('article')).toBeNull()
  })

  it('shows the draft ribbon over bundled content', async () => {
    renderPage('el')
    await ready()
    // Two notes may be on the page (ribbon + signed-out note); find the ribbon by its headline.
    expect(screen.getByText(el.draftRibbon).closest('[role="note"]')).toHaveTextContent(
      el.draftRibbonHint,
    )
  })
})

describe('<FridgePage> — save list', () => {
  it('in local-only mode explains why saving is off and keeps the button disabled', async () => {
    for (const [lang, dict] of [
      ['en', en],
      ['el', el],
    ] as const) {
      window.localStorage.clear() // the previous language's fridge must not carry over
      const view = renderPage(lang)
      const input = await ready()
      addByTyping(input, 'tomato', name('tomato', lang))
      expect(screen.getByText(dict.userDataUnavailableLocal)).toBeInTheDocument()
      fireEvent.change(screen.getByLabelText(dict.listName), { target: { value: 'x' } })
      expect(screen.getByRole('button', { name: dict.saveList })).toBeDisabled()
      view.unmount()
    }
  })

  it('signed out with a backend: offers sign-in instead', async () => {
    userData.current = disabledSource('signed-out')
    renderPage('en')
    await ready()
    expect(screen.getByText(en.userDataSignInToSave)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: en.signIn })).toHaveAttribute(
      'href',
      '/auth?next=%2Ffridge',
    )
  })

  it('signed in: saves { name, ingredient_slugs }, shows listSaved and lists the saved list', async () => {
    const saved: FridgeList[] = []
    const save = vi.fn(async (input: { name: string; ingredient_slugs: string[] }) => {
      const list: FridgeList = {
        id: `id-${saved.length + 1}`,
        name: input.name,
        ingredient_slugs: input.ingredient_slugs,
        updated_at: '2026-10-05T00:00:00Z',
      }
      saved.push(list)
      return ok(list)
    })
    userData.current = {
      // P8 members (entries, goals, saved items) come from the in-memory double; unused here.
      ...memorySource().source,
      kind: 'supabase',
      userId: 'u1',
      fridgeLists: { list: async () => ok([...saved]), save, remove: async () => ok(undefined) },
      favourites: {
        list: async () => ok([]),
        add: async () => ok(undefined),
        remove: async () => ok(undefined),
      },
      savedPlans: {
        list: async () => ok([]),
        save: async () => {
          throw new Error('unused')
        },
        remove: async () => ok(undefined),
      },
      ...unusedProfileMethods(),
    }
    renderPage('en')
    const input = await ready()
    addByTyping(input, 'tomato', 'Tomato')
    addByTyping(input, 'feta', 'Feta')
    expect(screen.queryByText(en.userDataUnavailableLocal)).toBeNull()
    expect(screen.queryByText(en.userDataSignInToSave)).toBeNull()

    const button = screen.getByRole('button', { name: en.saveList })
    expect(button).toBeDisabled() // no name yet
    fireEvent.change(screen.getByLabelText(en.listName), { target: { value: '  Salad night ' } })
    expect(button).toBeEnabled()
    fireEvent.click(button)

    await waitFor(() => expect(screen.getByText(en.listSaved)).toBeInTheDocument())
    expect(save).toHaveBeenCalledWith({ name: 'Salad night', ingredient_slugs: ['tomato', 'feta'] })
    expect(screen.getByText(en.savedLists)).toBeInTheDocument()
    expect(screen.getByText('Salad night (2)')).toBeInTheDocument()

    // Loading a saved list replaces the fridge.
    fireEvent.click(screen.getByRole('button', { name: en.clearAll }))
    expect(screen.getByText(en.fridgeEmpty)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: en.loadList }))
    expect(chips().map((c) => c.textContent)).toEqual(['Tomato×', 'Feta×'])
  })
})

describe('<FridgePage> async states (P5.1)', () => {
  function renderWithSource(source: ContentSource, lang: Lang = 'en') {
    return render(
      <LangProvider initial={lang}>
        <MemoryRouter initialEntries={['/fridge']}>
          <FridgePage source={source} />
        </MemoryRouter>
      </LangProvider>,
    )
  }

  it('renders the skeleton first while a slow source has not answered', () => {
    const slow: ContentSource = { ...bundledSource, listIngredients: () => new Promise(() => {}) }
    renderWithSource(slow, 'el')
    const status = screen.getByRole('status')
    expect(status).toHaveAttribute('aria-busy', 'true')
    expect(status).toHaveTextContent(el.loading)
    expect(screen.queryByRole('combobox')).toBeNull()
    expect(screen.queryByRole('alert')).toBeNull()
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(el.fridgeTitle)
  })

  it('shows the fridge error copy with a Retry that re-reads the catalogue', async () => {
    const listRecipes = vi
      .fn<ContentSource['listRecipes']>()
      .mockResolvedValueOnce(fail('network'))
      .mockImplementation(bundledSource.listRecipes)
    renderWithSource({ ...bundledSource, listRecipes }, 'el')
    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent(el.fridgeLoadFailed)
    expect(screen.queryByRole('combobox')).toBeNull()
    expect(listRecipes).toHaveBeenCalledTimes(1)

    fireEvent.click(within(alert).getByRole('button', { name: el.retry }))
    await ready()
    expect(listRecipes).toHaveBeenCalledTimes(2)
    expect(screen.queryByRole('alert')).toBeNull()
    expect(screen.getByText(el.fridgeEmpty)).toBeInTheDocument()
  })

  it('renders the empty fridge through the shared EmptyState with its hint', async () => {
    renderWithSource(bundledSource, 'en')
    await ready()
    const title = screen.getByText(en.fridgeEmpty)
    const box = title.closest('[data-empty-state]')
    expect(box).not.toBeNull()
    expect(box).toHaveTextContent(en.fridgeEmptyHint)
  })
})
