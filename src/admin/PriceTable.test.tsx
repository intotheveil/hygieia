import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { fakeClient, type FakeClient } from '../auth/fake-client'
import { LangProvider } from '../i18n/LangProvider'
import { el, en, type Lang } from '../i18n/dictionary'
import { PRICE_COLUMNS, adminSource, type AdminContentSource } from './adminSource.ts'
import { checkDraft, draftOf, sortByName, type IngredientRow } from './prices.ts'
import { PriceTable } from './PriceTable'

const LANGS: ReadonlyArray<[Lang, typeof en]> = [
  ['en', en],
  ['el', el],
]

const review = {
  status: 'pending' as const,
  reviewed_at: null,
  reviewed_by: null,
  created_at: '2026-10-06T00:00:00Z',
  updated_at: '2026-10-06T00:00:00Z',
}

const FETA_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'

function ingredient(
  over: Partial<IngredientRow> & Pick<IngredientRow, 'id' | 'slug' | 'name_el' | 'name_en'>,
): IngredientRow {
  return {
    ...review,
    category: 'dairy',
    unit: 'g',
    grams_per_unit: 1,
    kcal_100g: 100,
    protein_100g: 10,
    carbs_100g: 5,
    fat_100g: 5,
    source_note: 'Typical values, USDA FoodData Central reference ranges',
    price_eur_min: 1,
    price_eur_max: 2,
    price_per: 'kg',
    price_as_of: '2026-10-01',
    price_note: '',
    substitute_slugs: [],
    is_pantry_staple: false,
    ...over,
  }
}

// Alphabetical order differs between the languages on purpose: Feta / Φέτα, Tomato / Ντομάτα,
// Olive oil / Ελαιόλαδο → en: Feta, Olive oil, Tomato · el: Ελαιόλαδο, Ντομάτα, Φέτα.
function rows(): IngredientRow[] {
  return [
    ingredient({
      id: FETA_ID,
      slug: 'feta',
      name_el: 'Φέτα',
      name_en: 'Feta',
      price_eur_min: 9,
      price_eur_max: 14,
      price_note: 'PDO',
    }),
    ingredient({
      id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      slug: 'tomato',
      name_el: 'Ντομάτα',
      name_en: 'Tomato',
      status: 'approved',
      price_eur_min: 1.5,
      price_eur_max: 3,
    }),
    ingredient({
      id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
      slug: 'olive-oil',
      name_el: 'Ελαιόλαδο',
      name_en: 'Olive oil',
      unit: 'ml',
      price_per: 'l',
      price_eur_min: 8,
      price_eur_max: 15,
    }),
  ]
}

function renderTable(lang: Lang = 'en', updateError?: { message: string; code: string }) {
  const fake: FakeClient = fakeClient({
    contentTables: {
      rows: { ingredients: rows() as unknown as Array<Record<string, unknown>> },
      updateError,
    },
  })
  render(
    <LangProvider initial={lang}>
      <PriceTable source={adminSource(fake.client)} />
    </LangProvider>,
  )
  return { fake }
}

const rowHeaders = () =>
  within(screen.getByRole('table'))
    .getAllByRole('rowheader')
    .map((th) => th.textContent)

describe('price model', () => {
  it('converts a valid draft to exactly the five price columns', () => {
    const draft = { ...draftOf(rows()[0] as IngredientRow), max: '15', note: 'PDO, 2026' }
    const check = checkDraft(draft)
    expect(check.ok && Object.keys(check.patch).sort()).toEqual([...PRICE_COLUMNS].sort())
    expect(check.ok && check.patch).toEqual({
      price_eur_min: 9,
      price_eur_max: 15,
      price_per: 'kg',
      price_as_of: '2026-10-01',
      price_note: 'PDO, 2026',
    })
  })

  it('blocks min > max, negative or non-numeric prices and a non-ISO date', () => {
    const base = draftOf(rows()[0] as IngredientRow)
    expect(checkDraft({ ...base, min: '20' })).toEqual({ ok: false, problem: 'order' })
    expect(checkDraft({ ...base, min: '-1' })).toEqual({ ok: false, problem: 'number' })
    expect(checkDraft({ ...base, max: '' })).toEqual({ ok: false, problem: 'number' })
    expect(checkDraft({ ...base, max: 'abc' })).toEqual({ ok: false, problem: 'number' })
    expect(checkDraft({ ...base, asOf: '1/10/2026' })).toEqual({ ok: false, problem: 'number' })
    expect(checkDraft({ ...base, min: '14', max: '14' }).ok).toBe(true)
  })

  it('sorts by the name of the given language with that language’s collation', () => {
    expect(sortByName(rows(), 'en').map((r) => r.slug)).toEqual(['feta', 'olive-oil', 'tomato'])
    expect(sortByName(rows(), 'el').map((r) => r.slug)).toEqual(['olive-oil', 'tomato', 'feta'])
  })
})

describe('PriceTable', () => {
  it('reads every ingredient regardless of status (no status filter) and sorts by English name', async () => {
    const { fake } = renderTable('en')
    expect(await screen.findByRole('table')).toBeInTheDocument()
    expect(rowHeaders()).toEqual(['Feta', 'Olive oil', 'Tomato'])
    expect(fake.calls[0]).toMatchObject({ table: 'ingredients', op: 'select', filters: [] })
  })

  it('sorts by Greek name in Greek', async () => {
    renderTable('el')
    expect(await screen.findByRole('table')).toBeInTheDocument()
    expect(rowHeaders()).toEqual(['Ελαιόλαδο', 'Ντομάτα', 'Φέτα'])
  })

  it.each(LANGS)('labels the columns in the UI language (%s)', async (lang, t) => {
    renderTable(lang)
    await screen.findByRole('table')
    for (const label of [
      t.kinds.ingredients,
      t.priceMin,
      t.priceMax,
      t.pricePer,
      t.asOf,
      t.priceNote,
    ])
      expect(screen.getByRole('columnheader', { name: label })).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: new RegExp(`^${t.editRow}:`) })).toHaveLength(3)
  })

  it.each(LANGS)(
    'blocks min > max with the message in the UI language, sending nothing (%s)',
    async (lang, t) => {
      const { fake } = renderTable(lang)
      await screen.findByRole('table')
      fireEvent.click(
        screen.getByRole('button', { name: `${t.editRow}: ${lang === 'el' ? 'Φέτα' : 'Feta'}` }),
      )
      const min = screen.getByLabelText(t.priceMin)
      const max = screen.getByLabelText(t.priceMax)
      expect(min).toHaveValue(9)
      expect(max).toHaveValue(14)
      fireEvent.change(min, { target: { value: '20' } })
      expect(screen.getByRole('alert')).toHaveTextContent(t.priceMinMaxError)
      expect(min).toHaveAttribute('aria-invalid', 'true')
      expect(max).toHaveAttribute('aria-invalid', 'true')
      const save = screen.getByRole('button', { name: t.saveChanges })
      expect(save).toBeDisabled()
      fireEvent.click(save)
      expect(fake.calls.filter((c) => c.op === 'update')).toHaveLength(0)
    },
  )

  it('a valid save sends only the five price columns, by id, and the row shows the new values', async () => {
    const { fake } = renderTable('en')
    await screen.findByRole('table')
    fireEvent.click(screen.getByRole('button', { name: 'Edit: Feta' }))
    fireEvent.change(screen.getByLabelText(en.priceMax), { target: { value: '15' } })
    fireEvent.change(screen.getByLabelText(en.asOf), { target: { value: '2026-10-06' } })
    fireEvent.change(screen.getByLabelText(en.priceNote), { target: { value: 'PDO, autumn' } })
    fireEvent.change(screen.getByLabelText(en.pricePer), { target: { value: 'piece' } })
    fireEvent.click(screen.getByRole('button', { name: en.saveChanges }))

    await waitFor(() => expect(fake.calls.filter((c) => c.op === 'update')).toHaveLength(1))
    const call = fake.calls.find((c) => c.op === 'update')
    expect(call).toEqual({
      table: 'ingredients',
      op: 'update',
      payload: {
        price_eur_min: 9,
        price_eur_max: 15,
        price_per: 'piece',
        price_as_of: '2026-10-06',
        price_note: 'PDO, autumn',
      },
      filters: [['id', FETA_ID]],
    })
    expect(Object.keys(call?.payload as object).sort()).toEqual([...PRICE_COLUMNS].sort())

    expect(await screen.findByRole('status')).toHaveTextContent(en.adminSaved)
    const feta = screen
      .getByRole('rowheader', { name: 'Feta' })
      .closest('tr') as HTMLTableRowElement
    expect(feta).toHaveTextContent('15')
    expect(feta).toHaveTextContent('piece')
    expect(feta).toHaveTextContent('2026-10-06')
    expect(feta).toHaveTextContent('PDO, autumn')
    // Only one row edits at a time: the Edit buttons are back for all three rows.
    expect(screen.getAllByRole('button', { name: /^Edit:/ })).toHaveLength(3)
  })

  it('edits one row at a time: the other rows’ Edit buttons are disabled meanwhile; Cancel restores', async () => {
    const { fake } = renderTable('en')
    await screen.findByRole('table')
    fireEvent.click(screen.getByRole('button', { name: 'Edit: Tomato' }))
    expect(screen.getByRole('button', { name: 'Edit: Feta' })).toBeDisabled()
    fireEvent.change(screen.getByLabelText(en.priceMax), { target: { value: '99' } })
    fireEvent.click(screen.getByRole('button', { name: en.cancel }))
    expect(screen.getByRole('button', { name: 'Edit: Feta' })).toBeEnabled()
    expect(screen.getByRole('rowheader', { name: 'Tomato' }).closest('tr')).toHaveTextContent('3')
    expect(screen.getByRole('rowheader', { name: 'Tomato' }).closest('tr')).not.toHaveTextContent(
      '99',
    )
    expect(fake.calls.filter((c) => c.op === 'update')).toHaveLength(0)
  })

  it('a refused save shows the failure line and keeps the row in edit mode', async () => {
    renderTable('en', { message: 'denied', code: '42501' })
    await screen.findByRole('table')
    fireEvent.click(screen.getByRole('button', { name: 'Edit: Feta' }))
    fireEvent.change(screen.getByLabelText(en.priceMax), { target: { value: '15' } })
    fireEvent.click(screen.getByRole('button', { name: en.saveChanges }))
    expect(await screen.findByText(en.adminSaveFailed)).toBeInTheDocument()
    expect(screen.getByLabelText(en.priceMax)).toBeInTheDocument()
  })

  it('shows the load-failed line when the read is refused', async () => {
    const fake = fakeClient({ contentTables: { error: { message: 'denied', code: '42501' } } })
    render(
      <LangProvider initial="en">
        <PriceTable source={adminSource(fake.client)} />
      </LangProvider>,
    )
    expect(await screen.findByRole('alert')).toHaveTextContent(en.adminLoadFailed)
  })

  it('shows the load-failed line when the read REJECTS, instead of loading forever', async () => {
    // The real adapter catches every throw (`ok: false`), so a rejection needs a source of its own.
    const source: AdminContentSource = {
      ...adminSource(fakeClient().client),
      listAll: () => Promise.reject(new Error('transport')),
    }
    render(
      <LangProvider initial="en">
        <PriceTable source={source} />
      </LangProvider>,
    )
    expect(await screen.findByRole('alert')).toHaveTextContent(en.adminLoadFailed)
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })
})
