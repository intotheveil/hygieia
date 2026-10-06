import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { bundledSource } from '../content/bundled.ts'
import { DIETS } from '../content/seed/diets.ts'
import { fail, ok, type ContentSource, type Diet } from '../content/source.ts'
import { LangProvider } from '../i18n/LangProvider'
import { dictionaries, type Lang } from '../i18n/dictionary'
import { DietsPage } from './DietsPage'

function renderPage(lang: Lang, source: ContentSource = bundledSource) {
  return render(
    <LangProvider initial={lang}>
      <MemoryRouter initialEntries={['/diets']}>
        <DietsPage source={source} />
      </MemoryRouter>
    </LangProvider>,
  )
}

describe('<DietsPage>', () => {
  it.each(['el', 'en'] as const)('renders one card per seeded diet (16) in %s', async (lang) => {
    renderPage(lang)
    const t = dictionaries[lang]
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(t.dietsTitle)
    const links = await screen.findAllByRole('link', { name: new RegExp(`^${t.viewDiet}: `) })
    expect(DIETS).toHaveLength(16)
    expect(links).toHaveLength(16)
    for (const diet of DIETS) {
      const name = lang === 'el' ? diet.name_el : diet.name_en
      expect(screen.getByRole('heading', { level: 2, name })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: `${t.viewDiet}: ${name}` })).toHaveAttribute(
        'href',
        `/diets/${diet.slug}`,
      )
    }
    expect(screen.getByText(t.dietsIntro)).toBeInTheDocument()
  })

  it('shows the draft ribbon once for the bundled source', async () => {
    renderPage('en')
    await screen.findAllByRole('link', { name: /^View diet: / })
    expect(screen.getAllByRole('note')).toHaveLength(1)
    expect(screen.getByRole('note')).toHaveTextContent(dictionaries.en.draftRibbon)
  })

  it('renders the bilingual error copy with a retry when the source fails', async () => {
    const failing: ContentSource = { ...bundledSource, listDiets: async () => fail('network') }
    renderPage('el', failing)
    expect(await screen.findByRole('alert')).toHaveTextContent(dictionaries.el.loadFailed)
    expect(screen.getByRole('button', { name: dictionaries.el.retry })).toBeInTheDocument()
  })

  it('renders the list skeleton first while a slow source has not answered', () => {
    const slow: ContentSource = { ...bundledSource, listDiets: () => new Promise(() => {}) }
    renderPage('el', slow)
    const status = screen.getByRole('status')
    expect(status).toHaveAttribute('aria-busy', 'true')
    expect(status).toHaveAttribute('data-skeleton', 'list')
    expect(status).toHaveTextContent(dictionaries.el.loading)
    expect(screen.queryByRole('link', { name: /^Δες τη δίαιτα: / })).toBeNull()
  })

  it('renders the empty state when no diet is visible', async () => {
    const none: ContentSource = { ...bundledSource, listDiets: async () => ok<Diet[]>([]) }
    renderPage('en', none)
    expect(await screen.findByText(dictionaries.en.dietsEmpty)).toBeInTheDocument()
    expect(screen.queryByRole('list')).toBeNull()
    expect(screen.queryByRole('alert')).toBeNull()
  })
})
