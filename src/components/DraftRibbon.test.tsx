import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { LangProvider } from '../i18n/LangProvider'
import { dictionaries, type Lang } from '../i18n/dictionary'
import { DraftRibbon, isDraft, type DraftRibbonProps } from './DraftRibbon'

function renderRibbon(lang: Lang, props: DraftRibbonProps) {
  return render(
    <LangProvider initial={lang}>
      <DraftRibbon {...props} />
    </LangProvider>,
  )
}

describe('isDraft', () => {
  it('is true for the bundled source regardless of status, and for any non-approved row', () => {
    expect(isDraft('bundled')).toBe(true)
    expect(isDraft('bundled', 'approved')).toBe(true)
    expect(isDraft('supabase', 'pending')).toBe(true)
    expect(isDraft('supabase', 'rejected')).toBe(true)
  })
  it('is false for the supabase source with no row or an approved row', () => {
    expect(isDraft('supabase')).toBe(false)
    expect(isDraft('supabase', 'approved')).toBe(false)
  })
})

describe('<DraftRibbon>', () => {
  it.each(['el', 'en'] as const)(
    'renders both dictionary strings in %s for the bundled source',
    (lang) => {
      renderRibbon(lang, { kind: 'bundled' })
      const note = screen.getByRole('note')
      expect(note).toHaveTextContent(dictionaries[lang].draftRibbon)
      expect(note).toHaveTextContent(dictionaries[lang].draftRibbonHint)
    },
  )

  it('shows the Greek and English headline verbatim', () => {
    renderRibbon('el', { kind: 'bundled' })
    expect(screen.getByText('Πρόχειρο — εκκρεμεί έλεγχος')).toBeInTheDocument()
  })

  it('renders for a pending row under the supabase source', () => {
    renderRibbon('en', { kind: 'supabase', status: 'pending' })
    expect(screen.getByRole('note')).toHaveTextContent('Draft — awaiting review')
  })

  it('renders nothing for an approved row under the supabase source, or with no row', () => {
    const approved = renderRibbon('en', { kind: 'supabase', status: 'approved' })
    expect(screen.queryByRole('note')).toBeNull()
    expect(approved.container).toBeEmptyDOMElement()
    approved.unmount()
    renderRibbon('el', { kind: 'supabase' })
    expect(screen.queryByRole('note')).toBeNull()
  })
})
