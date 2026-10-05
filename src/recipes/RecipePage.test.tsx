import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { contentSource } from '../content/index'
import { fail, type ContentSource, type Recipe } from '../content/source'
import { LangProvider } from '../i18n/LangProvider'
import { el, en, type Lang } from '../i18n/dictionary'
import { plural } from '../i18n/fill'
import { formatRecipeLine } from './format'
import { RecipePage } from './RecipePage'

const SLUG = 'fasolada-white-bean-soup'

function renderAt(slug: string, lang: Lang = 'en', source?: ContentSource) {
  return render(
    <LangProvider initial={lang}>
      <MemoryRouter initialEntries={[`/recipes/${slug}`]}>
        <Routes>
          <Route path="/recipes/:slug" element={<RecipePage source={source} />} />
          <Route path="/recipes" element={<p>list</p>} />
        </Routes>
      </MemoryRouter>
    </LangProvider>,
  )
}

async function seeded(slug: string): Promise<Recipe> {
  const result = await contentSource.getRecipe(slug)
  if (!result.ok || result.data === null) throw new Error(`no seeded recipe ${slug}`)
  return result.data
}

describe('<RecipePage>', () => {
  it.each([
    ['en', en],
    ['el', el],
  ] as const)(
    'renders a seeded recipe in %s: title, meta, every ingredient line formatted, steps in order',
    async (lang, dict) => {
      const recipe = await seeded(SLUG)
      renderAt(SLUG, lang)

      expect(screen.getByRole('status')).toHaveTextContent(dict.loading)
      const heading = await screen.findByRole('heading', { level: 1 })
      expect(heading).toHaveTextContent(lang === 'el' ? recipe.title_el : recipe.title_en)

      // Meta line.
      expect(screen.getByText(plural(dict.portions, recipe.portions))).toBeInTheDocument()
      expect(screen.getByText(plural(dict.minutes, recipe.prep_min))).toBeInTheDocument()
      for (const meal of recipe.meal_types) {
        expect(screen.getByText(new RegExp(dict.meals[meal]))).toBeInTheDocument()
      }

      // Every ingredient line, exactly as format.ts prints it, and nothing unresolved.
      const ingredients = within(
        screen.getByRole('region', { name: dict.ingredients }),
      ).getAllByRole('listitem')
      expect(recipe.lines.length).toBeGreaterThan(0)
      expect(ingredients.map((li) => li.textContent)).toEqual(
        recipe.lines.map((line) => formatRecipeLine(line, lang, dict)),
      )
      expect(recipe.lines.every((line) => line.ingredient !== null)).toBe(true)
      // The unit label is the dictionary's, not the enum literal.
      expect(ingredients[0]).toHaveTextContent(lang === 'el' ? '400 γρ.' : '400 g')

      // Steps, in order.
      const steps = within(screen.getByRole('region', { name: dict.steps })).getAllByRole(
        'listitem',
      )
      expect(steps.map((li) => li.textContent)).toEqual(
        lang === 'el' ? recipe.steps_el : recipe.steps_en,
      )

      // Diet chips link back to the filtered list.
      const diets = within(screen.getByRole('region', { name: dict.dietTags }))
      expect(diets.getAllByRole('link')).toHaveLength(recipe.diet_slugs.length)
      expect(
        diets.getByRole('link', {
          name: lang === 'el' ? 'Μεσογειακή διατροφή' : 'Mediterranean diet',
        }),
      ).toHaveAttribute('href', '/recipes?diet=mediterranean')

      // Bundled source ⇒ draft ribbon.
      expect(screen.getByRole('note')).toHaveTextContent(dict.draftRibbon)
      expect(screen.getByRole('link', { name: `← ${dict.recipesTitle}` })).toHaveAttribute(
        'href',
        '/recipes',
      )
    },
  )

  it.each(['en', 'el'] as const)(
    'renders the not-found copy for an unknown slug in %s',
    async (lang) => {
      const dict = lang === 'el' ? el : en
      renderAt('no-such-recipe', lang)
      expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent(dict.notFoundTitle)
      expect(screen.getByText(dict.notFoundBody)).toBeInTheDocument()
      expect(screen.getByRole('link', { name: dict.backHome })).toHaveAttribute('href', '/')
    },
  )

  it('favourite click with no account service shows the local-only note (both languages)', async () => {
    const { unmount } = renderAt(SLUG, 'en')
    const button = await screen.findByRole('button', { name: en.addToFavourites })
    expect(button).toHaveAttribute('aria-pressed', 'false')
    expect(screen.queryByText(en.userDataUnavailableLocal)).not.toBeInTheDocument()
    fireEvent.click(button)
    expect(screen.getByText(en.userDataUnavailableLocal)).toBeInTheDocument()
    // Still not marked as a favourite: nothing was saved.
    expect(screen.getByRole('button', { name: en.addToFavourites })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
    unmount()

    renderAt(SLUG, 'el')
    fireEvent.click(await screen.findByRole('button', { name: el.addToFavourites }))
    expect(screen.getByText(el.userDataUnavailableLocal)).toBeInTheDocument()
  })

  it('shows the error state when the source fails, and retry calls the source again', async () => {
    const getRecipe = vi
      .fn<ContentSource['getRecipe']>()
      .mockResolvedValueOnce(fail('network'))
      .mockImplementation(contentSource.getRecipe)
    const failing: ContentSource = { ...contentSource, getRecipe }

    renderAt(SLUG, 'el', failing)
    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent(el.loadFailed)
    expect(getRecipe).toHaveBeenCalledTimes(1)

    fireEvent.click(within(alert).getByRole('button', { name: el.retry }))
    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent('Φασολάδα')
    expect(getRecipe).toHaveBeenCalledTimes(2)
  })

  it('shows a hidden ingredient by its slug rather than dropping the line', async () => {
    const recipe = await seeded(SLUG)
    const withHidden: Recipe = {
      ...recipe,
      lines: [{ line: recipe.lines[0].line, ingredient: null }, ...recipe.lines.slice(1)],
    }
    const source: ContentSource = {
      ...contentSource,
      getRecipe: async () => ({ ok: true, data: withHidden }),
    }
    renderAt(SLUG, 'en', source)
    const ingredients = within(
      await screen.findByRole('region', { name: en.ingredients }),
    ).getAllByRole('listitem')
    expect(ingredients[0]).toHaveTextContent('400 g white-beans (dry)')
    expect(ingredients).toHaveLength(recipe.lines.length)
  })
})
