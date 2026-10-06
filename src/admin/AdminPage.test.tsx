import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '../auth/AuthProvider'
import { fakeClient, fakeSession, type FakeClient } from '../auth/fake-client'
import { CONTENT_TABLES } from '../content/enums.ts'
import { LangProvider } from '../i18n/LangProvider'
import { el, en, type Lang } from '../i18n/dictionary'
import type { HygieiaClient } from '../lib/supabase'
import { LOCKED_COLUMNS, adminSource, type AdminContentSource } from './adminSource.ts'
import { AdminPage } from './AdminPage'

// The real adapter (`adminSource` → `run`) catches every throw and answers `ok: false`, so a read
// that REJECTS can only come from a source that bypasses it. This seam hands the page such a source
// for the one test that sets it; with `seam.source` null every other test gets the real one.
const seam = vi.hoisted(() => ({ source: null as AdminContentSource | null }))
vi.mock('./adminSource.ts', async (importOriginal) => {
  const mod = await importOriginal<typeof import('./adminSource.ts')>()
  return {
    ...mod,
    adminSource: (client: HygieiaClient) => seam.source ?? mod.adminSource(client),
  }
})

const UID = '55555555-5555-4555-8555-555555555555'
const LANGS: ReadonlyArray<[Lang, typeof en]> = [
  ['en', en],
  ['el', el],
]
const adminRow = { user_id: UID, display_name: 'op', is_admin: true }
const plainRow = { user_id: UID, display_name: 'someone', is_admin: false }

const review = {
  status: 'pending',
  reviewed_at: null,
  reviewed_by: null,
  created_at: '2026-10-06T00:00:00Z',
  updated_at: '2026-10-06T00:00:00Z',
}

const TIP_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const TIP2_ID = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
const DIET_ID = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'
const APPROVED_ID = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd'

function rows() {
  return {
    health_tips: [
      {
        ...review,
        id: TIP_ID,
        slug: 'drink-water',
        topic: 'hydration',
        title_el: 'Πίνε νερό',
        title_en: 'Drink water',
        body_el: 'Κράτα ένα ποτήρι δίπλα σου.',
        body_en: 'Keep a glass nearby.',
        source_url: null,
        needs_source: true,
      },
      {
        ...review,
        id: TIP2_ID,
        slug: 'sleep-early',
        topic: 'sleep',
        title_el: 'Κοιμήσου νωρίς',
        title_en: 'Sleep early',
        body_el: 'Σταθερή ώρα ύπνου.',
        body_en: 'A steady bedtime.',
        source_url: null,
        needs_source: false,
      },
      {
        ...review,
        id: APPROVED_ID,
        status: 'approved',
        reviewed_at: '2026-10-05T10:00:00Z',
        reviewed_by: UID,
        slug: 'walk-daily',
        topic: 'movement',
        title_el: 'Περπάτα καθημερινά',
        title_en: 'Walk daily',
        body_el: 'Τριάντα λεπτά αρκούν.',
        body_en: 'Thirty minutes is enough.',
        source_url: 'https://example.test/walk',
        needs_source: false,
      },
    ],
    diets: [
      {
        ...review,
        id: DIET_ID,
        slug: 'mediterranean',
        name_el: 'Μεσογειακή',
        name_en: 'Mediterranean',
        summary_el: 'Λαχανικά, όσπρια, ελαιόλαδο.',
        summary_en: 'Vegetables, pulses, olive oil.',
        allowed_el: ['Λαχανικά', 'Όσπρια', 'Ελαιόλαδο'],
        allowed_en: ['Vegetables', 'Pulses', 'Olive oil'],
        avoided_el: ['Επεξεργασμένα'],
        avoided_en: ['Processed foods'],
        pros_el: ['Καρδιά'],
        pros_en: ['Heart'],
        cons_el: ['Κόστος'],
        cons_en: ['Cost'],
        avoid_if_el: ['Αλλεργία'],
        avoid_if_en: ['Allergy'],
        source_url: null,
      },
    ],
  }
}

function renderPage(client: HygieiaClient | null, lang: Lang = 'en') {
  return render(
    <LangProvider initial={lang}>
      <AuthProvider client={client}>
        <MemoryRouter initialEntries={['/admin']}>
          <AdminPage />
        </MemoryRouter>
      </AuthProvider>
    </LangProvider>,
  )
}

function adminClient(lang?: Lang): { fake: FakeClient } {
  const fake = fakeClient({
    session: fakeSession(UID, 'op@example.test'),
    profiles: { rows: [adminRow] },
    contentTables: { rows: rows() },
  })
  renderPage(fake.client, lang)
  return { fake }
}

const updates = (fake: FakeClient) => fake.calls.filter((c) => c.op === 'update')

describe('AdminPage — guards', () => {
  it.each(LANGS)('renders adminUnavailable in local-only mode (%s)', (lang, t) => {
    renderPage(null, lang)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(t.adminTitle)
    expect(screen.getByRole('note')).toHaveTextContent(t.adminUnavailable)
    expect(screen.queryByRole('tablist')).not.toBeInTheDocument()
  })

  it.each(LANGS)('renders the 403 copy for a signed-in non-admin (%s)', async (lang, t) => {
    const fake = fakeClient({ session: fakeSession(UID), profiles: { rows: [plainRow] } })
    renderPage(fake.client, lang)
    expect(await screen.findByText(t.notAllowedBody)).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(t.notAllowedTitle)
    expect(screen.queryByRole('tablist')).not.toBeInTheDocument()
    // Nothing was read from any content table.
    expect(fake.calls).toHaveLength(0)
  })

  it.each(LANGS)('shows a loading line while the profile is unknown (%s)', (lang, t) => {
    const fake = fakeClient({ session: fakeSession(UID), profiles: { rows: [adminRow] } })
    fake.from.mockImplementationOnce(() => ({
      select: () => ({ eq: () => ({ maybeSingle: () => new Promise(() => {}) }) }),
    }))
    renderPage(fake.client, lang)
    const status = screen.getByRole('status')
    expect(status).toHaveTextContent(t.loading)
    expect(status).toHaveAttribute('aria-busy', 'true')
    expect(status).toHaveAttribute('data-skeleton', 'panel')
  })
})

describe('AdminPage — tabs and pending lists', () => {
  it('queries every content table with status = pending and shows the counts', async () => {
    const { fake } = adminClient()
    expect(await screen.findByRole('tab', { name: /Health tips\s*2/ })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /Diets\s*1/ })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Recipes' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: en.prices })).toBeInTheDocument()

    const selects = fake.calls.filter((c) => c.op === 'select')
    expect(selects.map((c) => c.table).sort()).toEqual([...CONTENT_TABLES].sort())
    for (const call of selects) expect(call.filters).toEqual([['status', 'pending']])
  })

  it.each(LANGS)(
    'labels every kind and the status filter in the UI language (%s)',
    async (lang, t) => {
      adminClient(lang)
      expect(await screen.findByText(t.adminIntro)).toBeInTheDocument()
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(t.adminTitle)
      for (const table of CONTENT_TABLES)
        expect(
          screen.getByRole('tab', { name: new RegExp(`^${t.kinds[table]}`) }),
        ).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: t.prices })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: t.pendingTab })).toHaveAttribute(
        'aria-pressed',
        'true',
      )
      expect(screen.getByRole('button', { name: t.approvedTab })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: t.rejectedTab })).toBeInTheDocument()
      expect(await screen.findByText(t.noPending)).toBeInTheDocument()
    },
  )

  it('lists pending rows of a kind with slug and both titles; the status filter re-queries', async () => {
    const { fake } = adminClient()
    fireEvent.click(await screen.findByRole('tab', { name: /Health tips/ }))
    const list = await screen.findByRole('list')
    const items = within(list).getAllByRole('listitem')
    expect(items).toHaveLength(2)
    expect(items[0]).toHaveTextContent('drink-water')
    expect(items[0]).toHaveTextContent('Πίνε νερό')
    expect(items[0]).toHaveTextContent('Drink water')
    expect(screen.queryByText('walk-daily')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: en.approvedTab }))
    expect(await screen.findByText('walk-daily')).toBeInTheDocument()
    const approvedQuery = fake.calls.find(
      (c) => c.table === 'health_tips' && c.filters.some(([, v]) => v === 'approved'),
    )
    expect(approvedQuery).toMatchObject({ op: 'select', filters: [['status', 'approved']] })

    fireEvent.click(screen.getByRole('button', { name: en.rejectedTab }))
    expect(await screen.findByText(en.noRowsForStatus)).toBeInTheDocument()
  })
})

describe('AdminPage — review form', () => {
  async function openTip(slug = 'drink-water') {
    const { fake } = adminClient()
    fireEvent.click(await screen.findByRole('tab', { name: /Health tips/ }))
    fireEvent.click(await screen.findByRole('button', { name: new RegExp(slug) }))
    await screen.findByRole('form')
    return { fake }
  }

  it('renders every *_el field beside its *_en twin, slug and id read-only, review stamp', async () => {
    await openTip()
    const titleEl = screen.getByLabelText('title_el')
    const titleEn = screen.getByLabelText('title_en')
    expect(titleEl).toHaveValue('Πίνε νερό')
    expect(titleEn).toHaveValue('Drink water')
    expect(titleEl).toHaveAttribute('lang', 'el')
    expect(titleEn).toHaveAttribute('lang', 'en')
    // Same fieldset → side by side.
    expect(titleEl.closest('fieldset')).toBe(titleEn.closest('fieldset'))
    expect(screen.getByLabelText('body_el').tagName).toBe('TEXTAREA')
    expect(screen.getByLabelText('body_en').tagName).toBe('TEXTAREA')
    expect(screen.getByLabelText('topic').tagName).toBe('SELECT')
    expect(screen.getByLabelText('needs_source')).toBeChecked()
    expect(screen.getByLabelText('slug')).toHaveAttribute('readonly')
    expect(screen.getByLabelText('id')).toHaveAttribute('readonly')
    expect(screen.getByText(en.notReviewedYet)).toBeInTheDocument()
    expect(screen.getByText(en.sideBySideHint)).toBeInTheDocument()
    // Nothing to save yet.
    expect(screen.getByRole('button', { name: en.saveChanges })).toBeDisabled()
  })

  it('approve sends exactly { status: "approved" } and returns to the list without the row', async () => {
    const { fake } = await openTip()
    fireEvent.click(screen.getByRole('button', { name: en.approve }))
    await waitFor(() => expect(updates(fake)).toHaveLength(1))
    expect(updates(fake)[0]).toEqual({
      table: 'health_tips',
      op: 'update',
      payload: { status: 'approved' },
      filters: [['id', TIP_ID]],
    })
    // Back on the list, re-read: the approved tip is gone from pending, the count dropped.
    expect(await screen.findByText('sleep-early')).toBeInTheDocument()
    expect(screen.queryByText('drink-water')).not.toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /Health tips\s*1/ })).toBeInTheDocument()
  })

  it('reject sends exactly { status: "rejected" }', async () => {
    const { fake } = await openTip('sleep-early')
    fireEvent.click(screen.getByRole('button', { name: en.reject }))
    await waitFor(() => expect(updates(fake)).toHaveLength(1))
    expect(updates(fake)[0]).toEqual({
      table: 'health_tips',
      op: 'update',
      payload: { status: 'rejected' },
      filters: [['id', TIP2_ID]],
    })
  })

  it('save sends ONLY the changed columns — never id, slug, status or the review columns', async () => {
    const { fake } = await openTip()
    fireEvent.change(screen.getByLabelText('title_en'), { target: { value: 'Drink more water' } })
    fireEvent.click(screen.getByLabelText('needs_source'))
    const save = screen.getByRole('button', { name: en.saveChanges })
    expect(save).toBeEnabled()
    fireEvent.click(save)
    await waitFor(() => expect(updates(fake)).toHaveLength(1))
    const call = updates(fake)[0]
    expect(call).toMatchObject({ table: 'health_tips', filters: [['id', TIP_ID]] })
    expect(call?.payload).toEqual({ title_en: 'Drink more water', needs_source: false })
    for (const locked of [...LOCKED_COLUMNS, 'status'])
      expect(call?.payload).not.toHaveProperty(locked)
    expect(await screen.findByRole('status')).toHaveTextContent(en.adminSaved)
    // Saved values are the new baseline: nothing left to save.
    expect(screen.getByRole('button', { name: en.saveChanges })).toBeDisabled()
  })

  it('a blank required field blocks Save and is marked invalid', async () => {
    await openTip()
    const titleEl = screen.getByLabelText('title_el')
    fireEvent.change(titleEl, { target: { value: '   ' } })
    expect(titleEl).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByRole('button', { name: en.saveChanges })).toBeDisabled()
  })

  it('a refused save shows the failure line and keeps the form', async () => {
    const fake = fakeClient({
      session: fakeSession(UID),
      profiles: { rows: [adminRow] },
      contentTables: { rows: rows(), updateError: { message: 'denied', code: '42501' } },
    })
    renderPage(fake.client)
    fireEvent.click(await screen.findByRole('tab', { name: /Health tips/ }))
    fireEvent.click(await screen.findByRole('button', { name: /drink-water/ }))
    await screen.findByRole('form')
    fireEvent.change(screen.getByLabelText('title_en'), { target: { value: 'x' } })
    fireEvent.click(screen.getByRole('button', { name: en.saveChanges }))
    expect(await screen.findByText(en.adminSaveFailed)).toBeInTheDocument()
    expect(screen.getByRole('form')).toBeInTheDocument()
  })

  it('shows the review stamp of an approved row and offers Reject but not Approve', async () => {
    adminClient()
    fireEvent.click(await screen.findByRole('tab', { name: /Health tips/ }))
    fireEvent.click(screen.getByRole('button', { name: en.approvedTab }))
    fireEvent.click(await screen.findByRole('button', { name: /walk-daily/ }))
    await screen.findByRole('form')
    expect(screen.getByText(en.reviewedBy)).toBeInTheDocument()
    expect(screen.getByText(UID)).toBeInTheDocument()
    expect(screen.queryByText(en.notReviewedYet)).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: en.approve })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: en.reject })).toBeInTheDocument()
  })

  it('back returns to the list without writing', async () => {
    const { fake } = await openTip()
    fireEvent.click(screen.getByRole('button', { name: en.backToList }))
    expect(await screen.findByRole('list')).toBeInTheDocument()
    expect(updates(fake)).toHaveLength(0)
  })
})

describe('AdminPage — paired line editor', () => {
  async function openDiet() {
    const { fake } = adminClient()
    fireEvent.click(await screen.findByRole('tab', { name: /Diets/ }))
    fireEvent.click(await screen.findByRole('button', { name: /mediterranean/ }))
    await screen.findByRole('form')
    return { fake }
  }

  const lineInputs = (column: string) =>
    screen.getAllByLabelText(new RegExp(`^${column} ${en.lineNumber} \\d+$`))

  it('renders each el line beside its en line', async () => {
    await openDiet()
    expect(lineInputs('allowed_el').map((i) => (i as HTMLInputElement).value)).toEqual([
      'Λαχανικά',
      'Όσπρια',
      'Ελαιόλαδο',
    ])
    expect(lineInputs('allowed_en').map((i) => (i as HTMLInputElement).value)).toEqual([
      'Vegetables',
      'Pulses',
      'Olive oil',
    ])
  })

  it('removing a line removes it from BOTH languages; save carries equal-length arrays', async () => {
    const { fake } = await openDiet()
    fireEvent.click(screen.getByRole('button', { name: `${en.removeLine} 2 (allowed)` }))
    expect(lineInputs('allowed_el').map((i) => (i as HTMLInputElement).value)).toEqual([
      'Λαχανικά',
      'Ελαιόλαδο',
    ])
    expect(lineInputs('allowed_en').map((i) => (i as HTMLInputElement).value)).toEqual([
      'Vegetables',
      'Olive oil',
    ])
    fireEvent.click(screen.getByRole('button', { name: en.saveChanges }))
    await waitFor(() => expect(updates(fake)).toHaveLength(1))
    expect(updates(fake)[0]?.payload).toEqual({
      allowed_el: ['Λαχανικά', 'Ελαιόλαδο'],
      allowed_en: ['Vegetables', 'Olive oil'],
    })
  })

  it('adding a line adds an empty line to both languages', async () => {
    await openDiet()
    fireEvent.click(screen.getByRole('button', { name: `${en.addLine} (pros)` }))
    expect(lineInputs('pros_el')).toHaveLength(2)
    expect(lineInputs('pros_en')).toHaveLength(2)
    fireEvent.change(lineInputs('pros_el')[1] as HTMLInputElement, { target: { value: 'Γεύση' } })
    fireEvent.change(lineInputs('pros_en')[1] as HTMLInputElement, { target: { value: 'Taste' } })
    expect(screen.getByRole('button', { name: en.saveChanges })).toBeEnabled()
  })
})

describe('AdminPage — a rejecting read', () => {
  afterEach(() => {
    seam.source = null
  })

  it('shows the load-failed line (no counts) when the pending read REJECTS, instead of loading forever', async () => {
    const fake = fakeClient({
      session: fakeSession(UID),
      profiles: { rows: [adminRow] },
      contentTables: { rows: rows() },
    })
    // `seam.source` is still null here, so this is the real source; only `listPending` rejects.
    seam.source = {
      ...adminSource(fake.client),
      listPending: () => Promise.reject(new Error('transport')),
    }
    renderPage(fake.client)
    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent(en.adminLoadFailed)
    // The shared ErrorState (P5.1) offers a Retry that re-reads the pending counts.
    expect(within(alert).getByRole('button', { name: en.retry })).toBeInTheDocument()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    for (const table of CONTENT_TABLES)
      expect(screen.getByRole('tab', { name: en.kinds[table] })).toBeInTheDocument()
  })
})
