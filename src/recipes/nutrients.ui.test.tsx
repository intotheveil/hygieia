// NUTRIENT UI (women's nutrition layer, 2026-10-11): the URL-driven "Good source of" chips on
// /recipes and the badge row under the nutrition panel on /recipes/:slug, in both languages.

import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { contentSource } from '../content/index'
import type { Recipe } from '../content/source'
import { indexBySlug } from '../fridge/match'
import { LangProvider } from '../i18n/LangProvider'
import { el, en, type Lang } from '../i18n/dictionary'
import { fill, plural } from '../i18n/fill'
import { computeNutrients, nutrientClaims, type NutrientResult } from '../nutrition/nutrients'
import { OVERLAID_SEED } from '../test/overlaidSeed'
import { filterRecipes } from './filter'
import { NutrientBadges } from './NutrientBadges'
import { RecipePage } from './RecipePage'
import { RecipesPage } from './RecipesPage'

const BY_SLUG = indexBySlug(OVERLAID_SEED.ingredients)
const expectedCount = (nutrients: ('iron' | 'calcium' | 'vitamin-d' | 'folate')[]) =>
  filterRecipes(OVERLAID_SEED.recipes, { lang: 'en', nutrients, ingredientsBySlug: BY_SLUG }).length

function LocationProbe() {
  const location = useLocation()
  return <span data-testid="search">{location.search}</span>
}

function renderList(path: string, lang: Lang = 'en') {
  return render(
    <LangProvider initial={lang}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route
            path="/recipes"
            element={
              <>
                <RecipesPage />
                <LocationProbe />
              </>
            }
          />
        </Routes>
      </MemoryRouter>
    </LangProvider>,
  )
}

const nutrientGroup = (t: typeof en) => screen.getByRole('group', { name: t.filterByNutrient })

describe('/recipes ?nutrient= chips', () => {
  it('reads the filter from the URL: chip pressed, list narrowed, note shown', async () => {
    renderList('/recipes?nutrient=iron')
    await screen.findByRole('list', { name: en.recipesTitle })
    const group = nutrientGroup(en)
    expect(within(group).getByRole('button', { name: en.nutrientNames.iron })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(within(group).getByRole('button', { name: en.nutrientNames.calcium })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
    const n = expectedCount(['iron'])
    expect(n).toBeGreaterThanOrEqual(8)
    expect(n).toBeLessThan(OVERLAID_SEED.recipes.length)
    expect(screen.getByText(plural(en.resultsCount, n))).toBeInTheDocument()
    expect(screen.getByText(en.nutrientFilterNote)).toBeInTheDocument()
  })

  it('a click adds the nutrient to the URL (any-of), keeps the other criteria, and Clear drops it', async () => {
    renderList('/recipes?diet=vegan&nutrient=iron')
    await screen.findByRole('list', { name: en.recipesTitle })
    fireEvent.click(
      within(nutrientGroup(en)).getByRole('button', { name: en.nutrientNames.calcium }),
    )
    expect(screen.getByTestId('search')).toHaveTextContent('?diet=vegan&nutrient=iron%2Ccalcium')
    const vegan = OVERLAID_SEED.recipes.filter((r) => r.diet_slugs.includes('vegan'))
    const n = filterRecipes(vegan, {
      lang: 'en',
      nutrients: ['iron', 'calcium'],
      ingredientsBySlug: BY_SLUG,
    }).length
    expect(screen.getByText(plural(en.resultsCount, n))).toBeInTheDocument()

    // Unpressing the last nutrient chip removes the key.
    fireEvent.click(within(nutrientGroup(en)).getByRole('button', { name: en.nutrientNames.iron }))
    fireEvent.click(
      within(nutrientGroup(en)).getByRole('button', { name: en.nutrientNames.calcium }),
    )
    expect(screen.getByTestId('search')).toHaveTextContent(/^\?diet=vegan$/)
    expect(screen.queryByText(en.nutrientFilterNote)).not.toBeInTheDocument()
  })

  it('labels the chips in Greek', async () => {
    renderList('/recipes?nutrient=vitamin-d', 'el')
    await screen.findByRole('list', { name: el.recipesTitle })
    const group = nutrientGroup(el)
    for (const name of ['Σίδηρος', 'Ασβέστιο', 'Βιταμίνη D', 'Φυλλικό οξύ']) {
      expect(within(group).getByRole('button', { name })).toBeInTheDocument()
    }
    expect(within(group).getByRole('button', { name: 'Βιταμίνη D' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(
      screen.getByText(plural(el.resultsCount, expectedCount(['vitamin-d']))),
    ).toBeInTheDocument()
  })
})

// --- badges ---------------------------------------------------------------------------------------

function renderBadges(result: NutrientResult, lang: Lang) {
  return render(
    <LangProvider initial={lang}>
      <NutrientBadges result={result} />
    </LangProvider>,
  )
}

const amounts = (iron: number, calcium: number, d: number, folate: number) => ({
  iron,
  calcium,
  'vitamin-d': d,
  folate,
})

describe('<NutrientBadges>', () => {
  it('shows "High in" / "Source of" per nutrient with amount and % of the NRV, then the note', () => {
    // Per portion: iron 4.9 mg = 35 % (high); calcium 130 mg = 16.25 % (source); D 0; folate 20 µg = 10 %.
    const perPortion = amounts(4.9, 130, 0, 20)
    renderBadges({ perRecipe: perPortion, perPortion, portions: 1 }, 'en')
    const items = within(screen.getByRole('region', { name: en.nutrientsTitle })).getAllByRole(
      'listitem',
    )
    expect(items).toHaveLength(2)
    expect(items[0]).toHaveTextContent('High in iron')
    expect(items[0]).toHaveTextContent('4.9 mg')
    expect(items[0]).toHaveTextContent(fill(en.nutrientShareOfNrv, { pct: '35' }))
    expect(items[1]).toHaveTextContent('Source of calcium')
    expect(items[1]).toHaveTextContent('130 mg')
    expect(items[1]).toHaveTextContent('16% of the EU reference intake')
    expect(screen.getByText(en.nutrientsNote)).toBeInTheDocument()
  })

  it('speaks Greek with Greek number formatting', () => {
    const perPortion = amounts(0, 300, 1.25, 0)
    renderBadges({ perRecipe: perPortion, perPortion, portions: 1 }, 'el')
    const items = within(screen.getByRole('region', { name: el.nutrientsTitle })).getAllByRole(
      'listitem',
    )
    expect(items[0]).toHaveTextContent('Υψηλή περιεκτικότητα σε ασβέστιο')
    // D 1.25 µg = 25 %: a source, written with a decimal comma.
    expect(items[1]).toHaveTextContent('Πηγή βιταμίνης D')
    expect(items[1]).toHaveTextContent('1,3 μg')
    expect(items[1]).toHaveTextContent('25% της τιμής αναφοράς της ΕΕ')
    expect(screen.getByText(el.nutrientsNote)).toBeInTheDocument()
  })

  it('renders nothing when no nutrient reaches 15 % of the NRV', () => {
    const perPortion = amounts(1, 50, 0.1, 10)
    const { container } = renderBadges({ perRecipe: perPortion, perPortion, portions: 1 }, 'en')
    expect(container).toBeEmptyDOMElement()
  })
})

describe('<RecipePage> nutrient badges', () => {
  it('shows the seeded fasolada claims under the nutrition panel', async () => {
    const result = await contentSource.getRecipe('fasolada-white-bean-soup')
    if (!result.ok || result.data === null) throw new Error('no fasolada')
    const recipe: Recipe = result.data
    const ingredients = indexBySlug(
      recipe.lines.flatMap((l) => (l.ingredient === null ? [] : [l.ingredient])),
    )
    const claims = nutrientClaims(computeNutrients(recipe, ingredients))
    expect(claims.map((c) => c.nutrient)).toEqual(expect.arrayContaining(['iron', 'folate']))

    render(
      <LangProvider initial="en">
        <MemoryRouter initialEntries={['/recipes/fasolada-white-bean-soup']}>
          <Routes>
            <Route path="/recipes/:slug" element={<RecipePage />} />
          </Routes>
        </MemoryRouter>
      </LangProvider>,
    )
    const region = await screen.findByRole('region', { name: en.nutrientsTitle })
    const items = within(region).getAllByRole('listitem')
    expect(items).toHaveLength(claims.length)
    claims.forEach((claim, i) => {
      const label =
        claim.level === 'high'
          ? en.nutrientHighIn[claim.nutrient]
          : en.nutrientSourceOf[claim.nutrient]
      expect(items[i]).toHaveTextContent(label)
    })
    // Placed right after the nutrition panel.
    expect(screen.getByTestId('nutrition-panel').nextElementSibling).toBe(
      screen.getByTestId('nutrient-badges'),
    )
  })
})
