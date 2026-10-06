import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { contentSource } from '../content/index'
import { RECIPES } from '../content/seed/recipes'
import { fail, type ContentSource } from '../content/source'
import { normalizeForSearch } from '../fridge/match'
import { LangProvider } from '../i18n/LangProvider'
import { el, en, type Lang } from '../i18n/dictionary'
import { plural } from '../i18n/fill'
import { RecipesPage } from './RecipesPage'

/** The current URL search string, so a test can assert what the address bar carries. */
function LocationProbe() {
  const location = useLocation()
  return <span data-testid="search">{location.search}</span>
}

function renderPage(path = '/recipes', lang: Lang = 'en', source?: ContentSource) {
  return render(
    <LangProvider initial={lang}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route
            path="/recipes"
            element={
              <>
                <RecipesPage source={source} />
                <LocationProbe />
              </>
            }
          />
          <Route path="/recipes/:slug" element={<p>detail</p>} />
        </Routes>
      </MemoryRouter>
    </LangProvider>,
  )
}

const cards = () =>
  within(screen.getByRole('list', { name: en.recipesTitle })).getAllByRole('listitem')
const cardsEl = () =>
  within(screen.getByRole('list', { name: el.recipesTitle })).getAllByRole('listitem')

const KETO = RECIPES.filter((r) => r.diet_slugs.includes('keto'))

describe('<RecipesPage>', () => {
  it('renders every bundled recipe as a card linking to its detail page, with the draft ribbon', async () => {
    renderPage()
    expect(screen.getByRole('status')).toHaveTextContent(en.loading)
    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent(en.recipesTitle)
    expect(contentSource.kind).toBe('bundled')
    expect(screen.getByRole('note')).toHaveTextContent(en.draftRibbon)

    const items = cards()
    expect(items.length).toBe(RECIPES.length)
    expect(items.length).toBeGreaterThanOrEqual(120)
    expect(screen.getByText(plural(en.resultsCount, RECIPES.length))).toBeInTheDocument()

    const fasolada = screen.getByRole('link', { name: 'Fasolada — Greek white bean soup' })
    expect(fasolada).toHaveAttribute('href', '/recipes/fasolada-white-bean-soup')
    // Nothing to clear on a clean filter.
    expect(screen.queryByRole('button', { name: en.clearFilters })).not.toBeInTheDocument()
  })

  it('shows portions, minutes, meal types and diet names on a card', async () => {
    renderPage('/recipes', 'el')
    await screen.findByRole('heading', { level: 1 })
    const link = screen.getByRole('link', { name: 'Φασολάδα' })
    const card = link.closest('li')
    expect(card).not.toBeNull()
    const seed = RECIPES.find((r) => r.slug === 'fasolada-white-bean-soup')!
    expect(card).toHaveTextContent(plural(el.portions, seed.portions))
    expect(card).toHaveTextContent(plural(el.minutes, seed.prep_min))
    for (const meal of seed.meal_types) expect(card).toHaveTextContent(el.meals[meal])
    expect(card).toHaveTextContent('Μεσογειακή διατροφή')
  })

  it('selecting the keto chip leaves only keto-tagged cards and puts ?diet=keto in the URL', async () => {
    renderPage()
    await screen.findByRole('heading', { level: 1 })
    const chip = screen.getByRole('button', { name: 'Ketogenic diet (keto)', pressed: false })
    fireEvent.click(chip)

    expect(screen.getByRole('button', { name: 'Ketogenic diet (keto)' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(screen.getByTestId('search')).toHaveTextContent('?diet=keto')
    const items = cards()
    expect(items).toHaveLength(KETO.length)
    expect(KETO.length).toBeGreaterThan(0)
    const titles = new Set(KETO.map((r) => r.title_en))
    for (const item of items) {
      expect(titles.has(within(item).getByRole('link').textContent ?? '')).toBe(true)
    }
    expect(screen.getByText(plural(en.resultsCount, KETO.length))).toBeInTheDocument()

    // Clicking again removes the tag and clears the URL.
    fireEvent.click(screen.getByRole('button', { name: 'Ketogenic diet (keto)' }))
    expect(screen.getByTestId('search')).toHaveTextContent('')
    expect(cards()).toHaveLength(RECIPES.length)
  })

  it('reads the filter from the URL on arrival (diet + meal + query)', async () => {
    renderPage('/recipes?diet=keto,vegan&meal=breakfast&q=egg')
    await screen.findByRole('heading', { level: 1 })
    expect(screen.getByRole('button', { name: 'Ketogenic diet (keto)' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(screen.getByRole('button', { name: 'Vegan diet' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(screen.getByRole('button', { name: en.meals.breakfast })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(screen.getByRole('searchbox', { name: en.searchRecipes })).toHaveValue('egg')
    const expected = RECIPES.filter(
      (r) =>
        (r.diet_slugs.includes('keto') || r.diet_slugs.includes('vegan')) &&
        r.meal_types.includes('breakfast') &&
        r.title_en.toLowerCase().includes('egg'),
    )
    expect(expected.length).toBeGreaterThan(0)
    expect(cards()).toHaveLength(expected.length)
  })

  it('typing φασολ in Greek finds Φασολάδα, accent-insensitively, and writes ?q=', async () => {
    renderPage('/recipes', 'el')
    await screen.findByRole('heading', { level: 1 })
    const box = screen.getByRole('searchbox', { name: el.searchRecipes })
    fireEvent.change(box, { target: { value: 'φασολ' } })
    expect(box).toHaveValue('φασολ')
    expect(decodeURIComponent(screen.getByTestId('search').textContent ?? '')).toBe('?q=φασολ')
    const items = cardsEl()
    const expected = RECIPES.filter((r) => normalizeForSearch(r.title_el).includes('φασολ'))
    expect(expected.length).toBeGreaterThan(1)
    expect(items).toHaveLength(expected.length)
    expect(screen.getByRole('link', { name: 'Φασολάδα' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: el.clearFilters })).toBeInTheDocument()
  })

  it('keeps a trailing space while typing a phrase', async () => {
    renderPage()
    await screen.findByRole('heading', { level: 1 })
    const box = screen.getByRole('searchbox', { name: en.searchRecipes })
    fireEvent.change(box, { target: { value: 'greek ' } })
    expect(box).toHaveValue('greek ')
  })

  it.each([
    ['en', en],
    ['el', el],
  ] as const)(
    'shows the empty state for a nonsense query in %s, and clear filters restores all',
    async (lang, dict) => {
      renderPage('/recipes', lang)
      await screen.findByRole('heading', { level: 1 })
      fireEvent.change(screen.getByRole('searchbox', { name: dict.searchRecipes }), {
        target: { value: 'zzzxqv' },
      })
      expect(screen.getByText(dict.noRecipesMatch)).toBeInTheDocument()
      expect(screen.getByText(plural(dict.resultsCount, 0))).toBeInTheDocument()
      expect(screen.queryByRole('list', { name: dict.recipesTitle })).not.toBeInTheDocument()

      fireEvent.click(screen.getByRole('button', { name: dict.clearFilters }))
      expect(screen.getByTestId('search')).toHaveTextContent('')
      expect(screen.getByRole('searchbox', { name: dict.searchRecipes })).toHaveValue('')
      expect(
        within(screen.getByRole('list', { name: dict.recipesTitle })).getAllByRole('listitem'),
      ).toHaveLength(RECIPES.length)
    },
  )

  it('shows the error state when the source fails, and retry calls the source again', async () => {
    const listRecipes = vi
      .fn<ContentSource['listRecipes']>()
      .mockResolvedValueOnce(fail('network'))
      .mockImplementation(contentSource.listRecipes)
    const failing: ContentSource = { ...contentSource, listRecipes }

    renderPage('/recipes', 'el', failing)
    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent(el.loadFailed)
    expect(listRecipes).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('list', { name: el.recipesTitle })).not.toBeInTheDocument()

    fireEvent.click(within(alert).getByRole('button', { name: el.retry }))
    await screen.findByRole('list', { name: el.recipesTitle })
    expect(listRecipes).toHaveBeenCalledTimes(2)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('drops a diet slug the catalogue does not know and junk meal tokens from the URL', async () => {
    renderPage('/recipes?diet=unicorn&meal=brunch')
    await screen.findByRole('heading', { level: 1 })
    expect(cards()).toHaveLength(RECIPES.length)
    expect(screen.queryByRole('button', { pressed: true })).not.toBeInTheDocument()
  })
})

describe('<RecipesPage> async states (P5.1)', () => {
  it('renders the list skeleton first while a slow source has not answered', () => {
    const slow: ContentSource = { ...contentSource, listRecipes: () => new Promise(() => {}) }
    renderPage('/recipes', 'el', slow)
    const status = screen.getByRole('status')
    expect(status).toHaveAttribute('aria-busy', 'true')
    expect(status).toHaveAttribute('data-skeleton', 'list')
    expect(status).toHaveTextContent(el.loading)
    expect(screen.queryByRole('list', { name: el.recipesTitle })).toBeNull()
    expect(screen.queryByRole('alert')).toBeNull()
    // The header (title, intro, ribbon) is there from the first paint; only the catalogue waits.
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(el.recipesTitle)
  })

  it('renders the shared empty state for a filter nothing matches, keeping the results count line', async () => {
    renderPage('/recipes?diet=keto&q=zzzz', 'en')
    expect(await screen.findByText(en.noRecipesMatch)).toBeInTheDocument()
    expect(screen.getByText(en.noRecipesMatch).closest('[data-empty-state]')).not.toBeNull()
    expect(screen.getByRole('status')).toHaveTextContent(plural(en.resultsCount, 0))
    expect(screen.queryByRole('list', { name: en.recipesTitle })).toBeNull()
  })
})
