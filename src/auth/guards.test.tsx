import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { AccountMenu } from '../components/AccountMenu'
import { LangProvider } from '../i18n/LangProvider'
import { el, en, type Lang } from '../i18n/dictionary'
import type { HygieiaClient } from '../lib/supabase'
import { AppRoutes } from '../routes/routes'
import { AuthProvider } from './AuthProvider'
import { fakeClient, fakeSession } from './fake-client'

const UID = '55555555-5555-4555-8555-555555555555'
const LANGS: ReadonlyArray<[Lang, typeof en]> = [
  ['en', en],
  ['el', el],
]

/** Where the router is now, so a redirect can be asserted without caring what renders there. */
function LocationProbe() {
  const location = useLocation()
  return <span data-testid="location">{`${location.pathname}${location.search}`}</span>
}

function renderAt(path: string, client: HygieiaClient | null, lang: Lang = 'en') {
  return render(
    <LangProvider initial={lang}>
      <AuthProvider client={client}>
        <MemoryRouter initialEntries={[path]}>
          <AppRoutes />
          <LocationProbe />
        </MemoryRouter>
      </AuthProvider>
    </LangProvider>,
  )
}

const adminRow = { user_id: UID, display_name: 'op', is_admin: true }
const plainRow = { user_id: UID, display_name: 'someone', is_admin: false }

describe('RequireAuth at /account', () => {
  it('sends an anonymous visitor to /auth?next=%2Faccount (replace)', async () => {
    const fake = fakeClient()
    renderAt('/account', fake.client)
    await waitFor(() =>
      expect(screen.getByTestId('location')).toHaveTextContent('/auth?next=%2Faccount'),
    )
    // The sign-in page is what renders there.
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(en.signIn)
  })

  it('keeps the query string in the return path', async () => {
    const fake = fakeClient()
    renderAt('/account?tab=favourites', fake.client)
    await waitFor(() =>
      expect(screen.getByTestId('location')).toHaveTextContent(
        '/auth?next=%2Faccount%3Ftab%3Dfavourites',
      ),
    )
  })

  it.each(LANGS)('renders the unavailable copy in local-only mode (%s)', (lang, t) => {
    renderAt('/account', null, lang)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(t.signInUnavailableTitle)
    expect(screen.getByText(t.signInUnavailableBody)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: t.backHome })).toHaveAttribute('href', '/')
    expect(screen.getByTestId('location')).toHaveTextContent('/account')
  })

  it.each(LANGS)('shows a loading line while the session is unknown (%s)', (lang, t) => {
    const fake = fakeClient()
    fake.getSession.mockImplementationOnce(() => new Promise(() => {}))
    renderAt('/account', fake.client, lang)
    expect(screen.getByRole('status')).toHaveTextContent(t.loading)
    expect(screen.getByTestId('location')).toHaveTextContent('/account')
  })

  it.each(LANGS)(
    'renders the account page with its three tabs when signed in (%s)',
    async (lang, t) => {
      const fake = fakeClient({ session: fakeSession(UID, 'me@example.test') })
      renderAt('/account', fake.client, lang)
      expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent(t.account)
      expect(screen.getByRole('tab', { name: t.savedPlans })).toHaveAttribute(
        'aria-selected',
        'true',
      )
      expect(screen.getByRole('tab', { name: t.savedFridgeLists })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: t.favourites })).toBeInTheDocument()
      expect(await screen.findByText(t.nothingSavedYet)).toBeInTheDocument()
      expect(screen.getByTestId('location')).toHaveTextContent('/account')
    },
  )

  it('lists what the user has saved, per tab, from the user-data source', async () => {
    const fake = fakeClient({
      session: fakeSession(UID),
      userTables: {
        rows: {
          saved_plans: [{ id: 'p1', diet_id: 'mediterranean', week_start: '2026-10-05', plan: {} }],
          fridge_lists: [{ id: 'f1', name: 'Weekend', ingredient_slugs: ['feta', 'tomato'] }],
          favourites: [{ recipe_id: 'greek-salad', created_at: 't' }],
        },
      },
    })
    renderAt('/account', fake.client)
    // A plan shows the diet's name when its id resolves in the catalogue, else the raw diet_id,
    // over a "Week of <date>" line; a fridge list shows its name over "N items".
    expect(await screen.findByText('mediterranean')).toBeInTheDocument()
    expect(screen.getByText(`${en.weekOf} 5 October 2026`)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('tab', { name: en.savedFridgeLists }))
    expect(screen.getByText('Weekend')).toBeInTheDocument()
    expect(screen.getByText(`2 ${en.itemCount}`)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('tab', { name: en.favourites }))
    expect(screen.getByText('greek-salad')).toBeInTheDocument()
    // Reads only: the page never wrote anything, and nothing carried user_id.
    expect(fake.calls.every((c) => c.op === 'select')).toBe(true)
    expect(fake.calls.map((c) => c.table).sort()).toEqual([
      'favourites',
      'fridge_lists',
      'saved_plans',
    ])
  })
})

describe('RequireAdmin at /admin', () => {
  it('sends an anonymous visitor to /auth?next=%2Fadmin', async () => {
    renderAt('/admin', fakeClient().client)
    await waitFor(() =>
      expect(screen.getByTestId('location')).toHaveTextContent('/auth?next=%2Fadmin'),
    )
  })

  it.each(LANGS)('renders the 403 copy for a signed-in non-admin (%s)', async (lang, t) => {
    const fake = fakeClient({ session: fakeSession(UID), profiles: { rows: [plainRow] } })
    renderAt('/admin', fake.client, lang)
    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent(t.notAllowedTitle)
    expect(screen.getByText(t.notAllowedBody)).toBeInTheDocument()
    expect(screen.queryByText(t.adminPlaceholder)).not.toBeInTheDocument()
    expect(screen.getByTestId('location')).toHaveTextContent('/admin')
  })

  it('a first-time user (no profile row yet) is not an admin either', async () => {
    const fake = fakeClient({ session: fakeSession(UID, 'new@example.test') })
    renderAt('/admin', fake.client)
    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent(en.notAllowedTitle)
    expect(fake.inserts).toHaveLength(1)
    expect(fake.inserts[0]).not.toHaveProperty('is_admin')
  })

  it('a profile read failure is treated as not-admin, never as admin', async () => {
    const fake = fakeClient({ session: fakeSession(UID), profiles: { selectError: 'denied' } })
    renderAt('/admin', fake.client)
    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent(en.notAllowedTitle)
  })

  it.each(LANGS)('renders the placeholder for an admin (%s)', async (lang, t) => {
    const fake = fakeClient({ session: fakeSession(UID), profiles: { rows: [adminRow] } })
    renderAt('/admin', fake.client, lang)
    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent(t.adminTitle)
    expect(screen.getByText(t.adminPlaceholder)).toBeInTheDocument()
    expect(screen.queryByText(t.notAllowedTitle)).not.toBeInTheDocument()
  })

  it.each(LANGS)('shows the loading line while the profile is being read (%s)', async (lang, t) => {
    const fake = fakeClient({ session: fakeSession(UID), profiles: { rows: [adminRow] } })
    // Session known, profile read never answers: the gate must neither allow nor refuse yet.
    fake.from.mockImplementationOnce(() => ({
      select: () => ({ eq: () => ({ maybeSingle: () => new Promise(() => {}) }) }),
    }))
    renderAt('/admin', fake.client, lang)
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent(t.loading))
    expect(screen.queryByText(t.adminPlaceholder)).not.toBeInTheDocument()
    expect(screen.queryByText(t.notAllowedTitle)).not.toBeInTheDocument()
  })

  it.each(LANGS)('renders the unavailable copy in local-only mode (%s)', (lang, t) => {
    renderAt('/admin', null, lang)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(t.signInUnavailableTitle)
  })
})

describe('AccountMenu', () => {
  function renderMenu(client: HygieiaClient | null, lang: Lang = 'en') {
    return render(
      <LangProvider initial={lang}>
        <AuthProvider client={client}>
          <MemoryRouter>
            <AccountMenu />
          </MemoryRouter>
        </AuthProvider>
      </LangProvider>,
    )
  }

  it.each(LANGS)('shows who is signed in, the account link and sign-out (%s)', async (lang, t) => {
    const fake = fakeClient({ session: fakeSession(UID, 'me@example.test') })
    renderMenu(fake.client, lang)
    expect(await screen.findByRole('button', { name: t.signOut })).toBeInTheDocument()
    expect(screen.getByText('me@example.test')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: new RegExp(t.account) })).toHaveAttribute(
      'href',
      '/account',
    )
    expect(screen.queryByRole('link', { name: t.signIn })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: t.signOut }))
    await waitFor(() => expect(fake.signOut).toHaveBeenCalledTimes(1))
  })

  it('falls back to the user id when the provider gave no email', async () => {
    const fake = fakeClient({ session: fakeSession(UID) })
    renderMenu(fake.client)
    expect(await screen.findByText(UID)).toBeInTheDocument()
  })

  it.each(LANGS)('offers the sign-in link when anonymous (%s)', async (lang, t) => {
    const fake = fakeClient()
    renderMenu(fake.client, lang)
    expect(await screen.findByRole('link', { name: t.signIn })).toHaveAttribute('href', '/auth')
    expect(screen.queryByRole('button', { name: t.signOut })).not.toBeInTheDocument()
  })

  it('renders nothing in local-only mode', () => {
    const { container } = renderMenu(null)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders nothing while the session is still loading', () => {
    const fake = fakeClient()
    fake.getSession.mockImplementationOnce(() => new Promise(() => {}))
    const { container } = renderMenu(fake.client)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders nothing without an AuthProvider at all (the home page in App.test)', () => {
    const { container } = render(
      <LangProvider initial="en">
        <MemoryRouter>
          <AccountMenu />
        </MemoryRouter>
      </LangProvider>,
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('sits in the home page header beside the language switch', async () => {
    const fake = fakeClient()
    renderAt('/', fake.client)
    const header = screen.getByRole('banner')
    expect(await screen.findByRole('link', { name: en.signIn })).toBeInTheDocument()
    expect(header).toContainElement(screen.getByRole('link', { name: en.signIn }))
    expect(header).toContainElement(screen.getByRole('button', { name: 'Ελληνικά' }))
  })
})
