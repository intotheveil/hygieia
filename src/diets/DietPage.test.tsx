import { render, screen, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { bundledSource } from '../content/bundled.ts'
import { DIETS } from '../content/seed/diets.ts'
import { ok, type ContentSource, type Recipe } from '../content/source.ts'
import { LangProvider } from '../i18n/LangProvider'
import { dictionaries, type Lang } from '../i18n/dictionary'
import { DietPage } from './DietPage'

function renderAt(slug: string, lang: Lang, source: ContentSource = bundledSource) {
  return render(
    <LangProvider initial={lang}>
      <MemoryRouter initialEntries={[`/diets/${slug}`]}>
        <Routes>
          <Route path="/diets/:slug" element={<DietPage source={source} />} />
        </Routes>
      </MemoryRouter>
    </LangProvider>,
  )
}

const SECTION_KEYS = ['allowed', 'avoided', 'pros', 'cons', 'whoShouldAvoid'] as const

describe('<DietPage>', () => {
  for (const lang of ['el', 'en'] as const) {
    const t = dictionaries[lang]
    it.each(DIETS.map((d) => d.slug))(`renders every section for %s in ${lang}`, async (slug) => {
      const diet = DIETS.find((d) => d.slug === slug)!
      const view = renderAt(slug, lang)
      const name = lang === 'el' ? diet.name_el : diet.name_en
      expect(await screen.findByRole('heading', { level: 1, name })).toBeInTheDocument()

      // What it is + the five list sections, each with the seeded items.
      expect(screen.getByRole('heading', { level: 2, name: t.whatItIs })).toBeInTheDocument()
      expect(screen.getByText(lang === 'el' ? diet.summary_el : diet.summary_en)).toBeVisible()
      for (const key of SECTION_KEYS) {
        const heading = screen.getByRole('heading', { level: 2, name: t[key] })
        const section = heading.closest('section')!
        expect(within(section).getAllByRole('listitem').length).toBeGreaterThan(0)
      }
      const avoidIf = lang === 'el' ? diet.avoid_if_el : diet.avoid_if_en
      for (const item of avoidIf) expect(screen.getByText(item)).toBeInTheDocument()

      // Disclaimer (the dedicated note; the draft ribbon is another note).
      expect(screen.getByText(t.notMedicalAdvice)).toBeInTheDocument()

      // Source link or the pending copy — never an invented URL.
      if (diet.source_url) {
        expect(screen.getByRole('link', { name: diet.source_url })).toHaveAttribute(
          'href',
          diet.source_url,
        )
      } else {
        expect(screen.getByText(t.sourcePending)).toBeInTheDocument()
      }

      // At least one recipe tagged with the diet, linked to /recipes/:slug.
      const recipesHeading = screen.getByRole('heading', { level: 2, name: t.recipesForDiet })
      const recipeLinks = within(recipesHeading.closest('section')!).getAllByRole('link')
      expect(recipeLinks.length).toBeGreaterThan(0)
      for (const link of recipeLinks) {
        expect(link.getAttribute('href')).toMatch(/^\/recipes\/[a-z0-9-]+$/)
      }

      // The plan generator section is rendered with its 21 slots, and its daily totals carry the
      // engine's "typical values" caveat (the recipes-owned key, reused by plans).
      expect(screen.getByRole('heading', { level: 2, name: t.generatePlan })).toBeInTheDocument()
      expect(screen.getAllByTestId('plan-slot')).toHaveLength(21)
      expect(screen.getByText(t.typicalValuesNote)).toBeInTheDocument()
      view.unmount()
    })
  }

  it('renders NotFound for an unknown slug', async () => {
    renderAt('no-such-diet', 'en')
    expect(
      await screen.findByRole('heading', { level: 1, name: dictionaries.en.notFoundTitle }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: dictionaries.en.backHome })).toHaveAttribute(
      'href',
      '/',
    )
  })

  it('links back to the diets list and shows the draft ribbon for the bundled source', async () => {
    renderAt('mediterranean', 'el')
    await screen.findByRole('heading', { level: 1 })
    expect(screen.getByRole('link', { name: `← ${dictionaries.el.dietsTitle}` })).toHaveAttribute(
      'href',
      '/diets',
    )
    expect(screen.getByText(dictionaries.el.draftRibbon)).toBeInTheDocument()
  })
})

describe('<DietPage> async states (P5.1)', () => {
  it('renders the detail skeleton first while a slow source has not answered', () => {
    const slow: ContentSource = { ...bundledSource, listDiets: () => new Promise(() => {}) }
    renderAt('keto', 'el', slow)
    const status = screen.getByRole('status')
    expect(status).toHaveAttribute('aria-busy', 'true')
    expect(status).toHaveAttribute('data-skeleton', 'detail')
    expect(status).toHaveTextContent(dictionaries.el.loading)
    expect(screen.queryByRole('heading', { level: 1 })).toBeNull()
  })

  it('renders the empty state in the recipes section when no visible recipe carries the diet', async () => {
    const none: ContentSource = { ...bundledSource, listRecipes: async () => ok<Recipe[]>([]) }
    renderAt('keto', 'en', none)
    await screen.findByRole('heading', { level: 1 })
    const section = screen
      .getByRole('heading', { level: 2, name: dictionaries.en.recipesForDiet })
      .closest('section')!
    expect(within(section).getByText(dictionaries.en.noRecipesForDiet)).toBeInTheDocument()
    expect(within(section).queryByRole('link')).toBeNull()
    // The rest of the page is unaffected by the empty section.
    expect(
      screen.getByRole('heading', { level: 2, name: dictionaries.en.generatePlan }),
    ).toBeInTheDocument()
  })
})
