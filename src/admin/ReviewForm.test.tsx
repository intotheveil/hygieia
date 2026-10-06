import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { ROUTINE_TIMES } from '../content/enums.ts'
import { LangProvider } from '../i18n/LangProvider'
import { el, en, type Lang } from '../i18n/dictionary'
import type { AdminContentSource, AdminRow } from './adminSource.ts'
import { ReviewForm } from './ReviewForm'

// The P7.1 `json` kind end to end in the form: a skincare routine's jsonb `steps` is a monospace
// textarea, Save is blocked (disabled AND the submit path refuses) until the text parses to a
// non-empty array, and a valid edit is sent as the parsed array — only `steps`, nothing else.

const ROUTINE_ID = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee'

const steps = [
  {
    order: 1,
    product_type_slug: 'nail-file',
    note_el: 'Λίμαρε προς μία κατεύθυνση.',
    note_en: 'File in one direction.',
    optional: false,
  },
  {
    order: 2,
    product_type_slug: 'cuticle-oil',
    note_el: 'Μια σταγόνα ανά νύχι.',
    note_en: 'One drop per nail.',
    optional: false,
  },
]

const routine: AdminRow<'skincare_routines'> = {
  id: ROUTINE_ID,
  status: 'pending',
  reviewed_at: null,
  reviewed_by: null,
  created_at: '2026-10-06T00:00:00Z',
  updated_at: '2026-10-06T00:00:00Z',
  slug: 'nails-weekly-women',
  area: 'nails',
  name_el: 'Εβδομαδιαία φροντίδα νυχιών',
  name_en: 'Weekly nail care',
  audience: 'women',
  skin_type: 'all',
  region: 'global',
  time: 'weekly',
  intro_el: 'Δέκα λεπτά την εβδομάδα.',
  intro_en: 'Ten minutes a week.',
  steps,
  duration_min: 10,
}

function stubSource(): AdminContentSource & { update: ReturnType<typeof vi.fn> } {
  return {
    listPending: vi.fn(async () => ({ ok: true as const, data: [] })),
    listAll: vi.fn(async () => ({ ok: true as const, data: [] })),
    update: vi.fn(async () => ({ ok: true as const, data: undefined })),
    setStatus: vi.fn(async () => ({ ok: true as const, data: undefined })),
  }
}

function renderForm(lang: Lang = 'en') {
  const source = stubSource()
  const onSaved = vi.fn()
  render(
    <LangProvider initial={lang}>
      <ReviewForm
        table="skincare_routines"
        row={routine}
        source={source}
        onBack={vi.fn()}
        onReviewed={vi.fn()}
        onSaved={onSaved}
      />
    </LangProvider>,
  )
  const t = lang === 'el' ? el : en
  return {
    source,
    onSaved,
    t,
    stepsBox: () => screen.getByLabelText('steps') as HTMLTextAreaElement,
    save: () => screen.getByRole('button', { name: t.saveChanges }),
  }
}

describe('ReviewForm — a skincare routine (json steps, routine times)', () => {
  it('renders `steps` as a monospace textarea whose text parses back to the row steps', () => {
    const { stepsBox, save } = renderForm()
    const box = stepsBox()
    expect(box.tagName).toBe('TEXTAREA')
    expect(box).toHaveAttribute('spellcheck', 'false')
    expect(box.className).toMatch(/font-mono/)
    expect(JSON.parse(box.value)).toEqual(steps)
    expect(box.value).toBe(JSON.stringify(steps, null, 2))
    expect(box).toHaveAttribute('aria-invalid', 'false')
    // Nothing changed yet.
    expect(save()).toBeDisabled()
    // It is NOT the paired line editor: no per-line inputs for steps.
    expect(screen.queryByLabelText(/^steps line/)).not.toBeInTheDocument()
  })

  it('offers am | pm | weekly for `time` (the routine enum, not the product-type one)', () => {
    renderForm()
    const time = screen.getByLabelText('time') as HTMLSelectElement
    expect(time.tagName).toBe('SELECT')
    expect(time.value).toBe('weekly')
    expect(Array.from(time.options, (o) => o.value)).toEqual([...ROUTINE_TIMES])
    expect(Array.from(time.options, (o) => o.value)).not.toContain('both')
  })

  it('broken JSON marks the textarea invalid and blocks Save — the button AND the submit path', async () => {
    const { stepsBox, save, source } = renderForm()
    fireEvent.change(stepsBox(), { target: { value: '[{"order": 1,' } })
    expect(stepsBox()).toHaveAttribute('aria-invalid', 'true')
    expect(save()).toBeDisabled()
    // Enter in a field submits the form regardless of the disabled button: still refused.
    fireEvent.submit(screen.getByRole('form'))
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent(''))
    expect(source.update).not.toHaveBeenCalled()
  })

  it.each([
    ['empty', ''],
    ['whitespace', '   \n'],
    ['an empty array', '[]'],
    ['an object', '{"order": 1}'],
    ['a string', '"steps"'],
  ])('%s is unsaveable (%j)', (_label, text) => {
    const { stepsBox, save } = renderForm()
    fireEvent.change(stepsBox(), { target: { value: text } })
    expect(stepsBox()).toHaveAttribute('aria-invalid', 'true')
    expect(save()).toBeDisabled()
  })

  it('re-serialised identical steps are not a change: Save stays disabled', () => {
    const { stepsBox, save } = renderForm()
    fireEvent.change(stepsBox(), { target: { value: JSON.stringify(steps) } })
    expect(stepsBox()).toHaveAttribute('aria-invalid', 'false')
    expect(save()).toBeDisabled()
  })

  it('a valid edited array enables Save and is sent as the parsed array — only `steps`', async () => {
    const { stepsBox, save, source, onSaved } = renderForm()
    const edited = [
      ...steps,
      {
        order: 3,
        product_type_slug: 'hand-cream',
        note_el: 'Κρέμα χεριών στο τέλος.',
        note_en: 'Hand cream to finish.',
        optional: true,
      },
    ]
    fireEvent.change(stepsBox(), { target: { value: JSON.stringify(edited, null, 2) } })
    expect(stepsBox()).toHaveAttribute('aria-invalid', 'false')
    expect(save()).toBeEnabled()
    fireEvent.click(save())
    await waitFor(() => expect(source.update).toHaveBeenCalledTimes(1))
    expect(source.update).toHaveBeenCalledWith('skincare_routines', ROUTINE_ID, { steps: edited })
    expect(await screen.findByRole('status')).toHaveTextContent(en.adminSaved)
    expect(onSaved).toHaveBeenCalledTimes(1)
    // The saved array is the new baseline: nothing left to save, the text is still the edit.
    expect(save()).toBeDisabled()
    expect(JSON.parse(stepsBox().value)).toEqual(edited)
  })

  it('an invalid steps edit blocks Save even when another field has a valid change', () => {
    const { stepsBox, save } = renderForm()
    fireEvent.change(screen.getByLabelText('duration_min'), { target: { value: '12' } })
    expect(save()).toBeEnabled()
    fireEvent.change(stepsBox(), { target: { value: '[]' } })
    expect(save()).toBeDisabled()
    fireEvent.change(stepsBox(), { target: { value: JSON.stringify(steps) } })
    expect(save()).toBeEnabled()
  })

  it.each([
    ['en', en],
    ['el', el],
  ] as const)(
    'the form chrome is in the UI language (%s) while column labels stay literal',
    (lang, t) => {
      renderForm(lang)
      expect(screen.getByRole('button', { name: t.saveChanges })).toBeInTheDocument()
      expect(screen.getByText(t.sideBySideHint)).toBeInTheDocument()
      expect(screen.getByLabelText('steps')).toBeInTheDocument()
      expect(screen.getByLabelText('name_el')).toHaveValue('Εβδομαδιαία φροντίδα νυχιών')
      expect(screen.getByLabelText('name_en')).toHaveValue('Weekly nail care')
    },
  )
})
