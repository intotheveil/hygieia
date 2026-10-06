import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { LangProvider } from '../i18n/LangProvider'
import { NAV_IDS, el, en, type Lang } from '../i18n/dictionary'
import { THEME_STORAGE_KEY, ThemeProvider } from '../theme/ThemeProvider'
import { THEMES } from '../theme/themes'
import { SiteHeader } from './SiteHeader'

function renderAt(path: string, lang: Lang = 'el') {
  return render(
    <LangProvider initial={lang}>
      <ThemeProvider>
        <MemoryRouter initialEntries={[path]}>
          <Routes>
            <Route path="*" element={<SiteHeader />} />
          </Routes>
        </MemoryRouter>
      </ThemeProvider>
    </LangProvider>,
  )
}

const EXPECTED_HREFS: Record<(typeof NAV_IDS)[number], string> = {
  recipes: '/recipes',
  fridge: '/fridge',
  diets: '/diets',
  workouts: '/workouts',
  tips: '/tips',
}

const LANGS: ReadonlyArray<[Lang, typeof en]> = [
  ['el', el],
  ['en', en],
]

describe('SiteHeader', () => {
  beforeEach(() => window.localStorage.clear())

  it.each(LANGS)(
    'is the banner with a brand link home and the five module links (%s)',
    (lang, t) => {
      renderAt('/', lang)
      const header = screen.getByRole('banner')
      expect(within(header).getByRole('link', { name: /Hygieia/ })).toHaveAttribute('href', '/')

      const nav = within(header).getByRole('navigation', { name: t.nav.label })
      const links = within(nav).getAllByRole('link')
      expect(links.map((a) => a.textContent)).toEqual(NAV_IDS.map((id) => t.nav[id]))
      for (const id of NAV_IDS) {
        expect(within(nav).getByRole('link', { name: t.nav[id] })).toHaveAttribute(
          'href',
          EXPECTED_HREFS[id],
        )
      }
      // No heading in the header: each page owns the single h1.
      expect(within(header).queryByRole('heading')).toBeNull()
    },
  )

  it.each([
    ['/', null],
    ['/recipes', 'recipes'],
    ['/recipes/some-slug?diet=keto', 'recipes'],
    ['/fridge', 'fridge'],
    ['/diets', 'diets'],
    ['/diets/keto', 'diets'],
    ['/workouts?type=gym', 'workouts'],
    ['/tips', 'tips'],
    ['/auth', null],
    ['/nothing-here', null],
  ] as const)('at %s marks %s with aria-current="page" and nothing else', (path, active) => {
    renderAt(path, 'en')
    const nav = screen.getByRole('navigation', { name: en.nav.label })
    for (const id of NAV_IDS) {
      const link = within(nav).getByRole('link', { name: en.nav[id] })
      if (id === active) expect(link).toHaveAttribute('aria-current', 'page')
      else expect(link).not.toHaveAttribute('aria-current')
    }
  })

  it('carries the language switch, which flips the nav labels too', () => {
    renderAt('/recipes', 'el')
    const header = screen.getByRole('banner')
    fireEvent.click(within(header).getByRole('button', { name: el.switchTo }))
    expect(within(header).getByRole('link', { name: en.nav.recipes })).toHaveAttribute(
      'aria-current',
      'page',
    )
    expect(within(header).getByRole('button', { name: en.switchTo })).toBeInTheDocument()
    expect(within(header).getByRole('navigation', { name: en.nav.label })).toBeInTheDocument()
  })

  it.each(LANGS)(
    'carries the theme switch: a labelled select with the four themes in order (%s)',
    (lang, t) => {
      renderAt('/', lang)
      const header = screen.getByRole('banner')
      const select = within(header).getByRole('combobox', { name: t.theme.label })
      const options = within(select).getAllByRole('option')
      expect(options.map((o) => o.textContent)).toEqual(THEMES.map((id) => t.theme[id]))
      expect(options.map((o) => (o as HTMLOptionElement).value)).toEqual([...THEMES])
      expect(select).toHaveValue('default')
    },
  )

  it('choosing a theme applies it to <html data-theme>, persists it, and the label follows the language', () => {
    renderAt('/', 'el')
    const header = screen.getByRole('banner')
    const select = within(header).getByRole('combobox', { name: el.theme.label })
    fireEvent.change(select, { target: { value: 'athletic' } })
    expect(select).toHaveValue('athletic')
    expect(document.documentElement.dataset.theme).toBe('athletic')
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('athletic')

    fireEvent.click(within(header).getByRole('button', { name: el.switchTo }))
    const after = within(header).getByRole('combobox', { name: en.theme.label })
    expect(after).toHaveValue('athletic')
    expect(within(after).getByRole('option', { name: en.theme.athletic })).toBeInTheDocument()
  })

  it('renders no account link without an account service (AccountMenu is silent)', () => {
    renderAt('/', 'en')
    expect(screen.queryByRole('link', { name: en.signIn })).toBeNull()
    expect(screen.queryByRole('link', { name: new RegExp(en.account) })).toBeNull()
  })
})
