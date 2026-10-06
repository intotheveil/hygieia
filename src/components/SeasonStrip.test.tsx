// SEASON STRIP (./SeasonStrip.tsx) and its pages: the heading paints at once with the month name,
// the chips arrive after the calendar loads, slugged produce links to /recipes?ingredient=<slug>,
// unslugged produce is a plain chip, the first chip opens ?season=now, the current filter is marked
// with aria-current, and /recipes?season=now narrows to recipes with ≥ 2 in-season ingredients.

import { render, screen, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { inSeasonCount } from '../recipes/filter'
import { inSeason, inSeasonSlugs } from '../content/seasonal'
import { FridgePage } from '../fridge/FridgePage'
import { el, en, type Lang } from '../i18n/dictionary'
import { LangProvider } from '../i18n/LangProvider'
import { fill } from '../i18n/fill'
import { RecipesPage } from '../recipes/RecipesPage'
import { OVERLAID_SEED } from '../test/overlaidSeed'
import { SeasonStrip, type SeasonStripProps } from './SeasonStrip'

function renderStrip(props: SeasonStripProps, lang: Lang = 'en') {
  return render(
    <LangProvider initial={lang}>
      <MemoryRouter>
        <SeasonStrip {...props} />
      </MemoryRouter>
    </LangProvider>,
  )
}

const chipList = (t: typeof en = en) => screen.getByRole('list', { name: t.seasonChipsLabel })

describe('<SeasonStrip>', () => {
  it.each([
    ['en', en, 'October'],
    ['el', el, 'Οκτώβριος'],
  ] as const)('heads the strip with the month in %s at once', (lang, t, month) => {
    renderStrip({ month: 10 }, lang)
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(
      fill(t.seasonTitle, { month }),
    )
  })

  it('reserves the chip row while loading, then lists every in-season item', async () => {
    renderStrip({ month: 10 })
    expect(chipList()).toHaveAttribute('aria-busy', 'true')
    await screen.findByRole('link', { name: en.seasonRecipesLink })
    expect(chipList()).toHaveAttribute('aria-busy', 'false')
    // the season link + one chip per item
    expect(within(chipList()).getAllByRole('listitem')).toHaveLength(inSeason(10).length + 1)
  })

  it('links slugged produce to /recipes?ingredient=<slug>; others are plain chips', async () => {
    renderStrip({ month: 10 })
    expect(await screen.findByRole('link', { name: 'Pumpkin' })).toHaveAttribute(
      'href',
      '/recipes?ingredient=pumpkin',
    )
    expect(screen.getByText('Persimmons')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Persimmons' })).toBeNull()
    expect(screen.getByRole('link', { name: en.seasonRecipesLink })).toHaveAttribute(
      'href',
      '/recipes?season=now',
    )
  })

  it('names the chips in Greek in Greek', async () => {
    renderStrip({ month: 7 }, 'el')
    expect(await screen.findByRole('link', { name: 'Μπάμιες' })).toHaveAttribute(
      'href',
      '/recipes?ingredient=okra',
    )
  })

  it('marks the current ingredient and season filters with aria-current', async () => {
    renderStrip({ month: 10, activeIngredients: ['pumpkin'], seasonActive: true })
    expect(await screen.findByRole('link', { name: 'Pumpkin' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    expect(screen.getByRole('link', { name: 'Quinces' })).not.toHaveAttribute('aria-current')
    expect(screen.getByRole('link', { name: en.seasonRecipesLink })).toHaveAttribute(
      'aria-current',
      'page',
    )
  })
})

function renderRecipes(path: string) {
  return render(
    <LangProvider initial="en">
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/recipes" element={<RecipesPage month={10} />} />
        </Routes>
      </MemoryRouter>
    </LangProvider>,
  )
}

const recipeCards = () =>
  within(screen.getByRole('list', { name: en.recipesTitle })).getAllByRole('listitem')

describe('/recipes with the season criteria', () => {
  it('?season=now keeps recipes with ≥ 2 in-season ingredients, most seasonal first', async () => {
    renderRecipes('/recipes?season=now')
    await screen.findByRole('list', { name: en.recipesTitle })
    expect(screen.getByText(en.seasonFilterNote)).toBeInTheDocument()
    const oct = inSeasonSlugs(10)
    const expected = OVERLAID_SEED.recipes.filter((r) => inSeasonCount(r, oct) >= 2)
    const cards = recipeCards()
    expect(cards).toHaveLength(expected.length)
    const max = Math.max(...expected.map((r) => inSeasonCount(r, oct)))
    const first = expected.find(
      (r) =>
        inSeasonCount(r, oct) === max &&
        within(cards[0] as HTMLElement).queryByRole('link', { name: r.title_en }) !== null,
    )
    expect(first, 'the first card is one of the most seasonal recipes').toBeDefined()
    expect(screen.getByRole('link', { name: en.seasonRecipesLink })).toHaveAttribute(
      'aria-current',
      'page',
    )
  })

  it('?ingredient=okra keeps exactly the recipes that use okra', async () => {
    renderRecipes('/recipes?ingredient=okra')
    await screen.findByRole('list', { name: en.recipesTitle })
    const expected = OVERLAID_SEED.recipes.filter((r) =>
      r.ingredients.some((l) => l.ingredient_slug === 'okra'),
    )
    expect(expected.length).toBeGreaterThan(0)
    expect(recipeCards()).toHaveLength(expected.length)
    expect(screen.getByRole('button', { name: en.clearFilters })).toBeInTheDocument()
  })
})

describe('/fridge shows the strip', () => {
  it('renders the season heading and its chips', async () => {
    render(
      <LangProvider initial="en">
        <MemoryRouter initialEntries={['/fridge']}>
          <FridgePage />
        </MemoryRouter>
      </LangProvider>,
    )
    expect(await screen.findByRole('link', { name: en.seasonRecipesLink })).toBeInTheDocument()
    expect(screen.getByRole('list', { name: en.seasonChipsLabel })).toBeInTheDocument()
  })
})
