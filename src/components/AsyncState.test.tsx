import { fireEvent, render, screen, within } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { LangProvider } from '../i18n/LangProvider'
import { dictionaries, type Lang } from '../i18n/dictionary'
import { EmptyState, ErrorState, Loading, type SkeletonVariant } from './AsyncState'

function wrap(lang: Lang, ui: ReactNode) {
  return render(<LangProvider initial={lang}>{ui}</LangProvider>)
}

describe('<Loading>', () => {
  it.each(['el', 'en'] as const)(
    'is a busy, polite status whose accessible text is the dictionary loading copy (%s)',
    (lang) => {
      wrap(lang, <Loading />)
      const status = screen.getByRole('status')
      expect(status).toHaveAttribute('aria-busy', 'true')
      expect(status).toHaveAttribute('aria-live', 'polite')
      expect(status).toHaveTextContent(dictionaries[lang].loading)
    },
  )

  it('accepts a custom label', () => {
    wrap('en', <Loading label="Fetching…" />)
    expect(screen.getByRole('status')).toHaveTextContent('Fetching…')
  })

  it.each<[SkeletonVariant, number]>([
    ['list', 6],
    ['detail', 6],
    ['panel', 3],
  ])('reserves space with an aria-hidden %s skeleton of %i boxes', (variant, boxes) => {
    const { container } = wrap('en', <Loading variant={variant} />)
    const status = screen.getByRole('status')
    expect(status).toHaveAttribute('data-skeleton', variant)
    const hidden = container.querySelector('[aria-hidden="true"]')
    expect(hidden).not.toBeNull()
    // Every visual bone is inside the hidden subtree, and there is a fixed-height box per slot.
    expect(hidden!.querySelectorAll('[class*="h-"]')).toHaveLength(boxes)
    expect(hidden!.textContent).toBe('')
  })

  it('defaults to the list skeleton', () => {
    wrap('en', <Loading />)
    expect(screen.getByRole('status')).toHaveAttribute('data-skeleton', 'list')
  })
})

describe('<ErrorState>', () => {
  it.each(['el', 'en'] as const)(
    'is an alert with the given message and a Retry button labelled from the dictionary (%s)',
    (lang) => {
      const onRetry = vi.fn()
      wrap(lang, <ErrorState message="boom" onRetry={onRetry} />)
      const alert = screen.getByRole('alert')
      expect(alert).toHaveTextContent('boom')
      const button = within(alert).getByRole('button', { name: dictionaries[lang].retry })
      fireEvent.click(button)
      expect(onRetry).toHaveBeenCalledTimes(1)
    },
  )

  it('renders no button when there is nothing to retry', () => {
    wrap('en', <ErrorState message="boom" />)
    expect(screen.getByRole('alert')).toHaveTextContent('boom')
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('shows the page-specific dictionary copy verbatim', () => {
    wrap('el', <ErrorState message={dictionaries.el.fridgeLoadFailed} onRetry={() => {}} />)
    expect(screen.getByRole('alert')).toHaveTextContent(dictionaries.el.fridgeLoadFailed)
    expect(screen.getByRole('button')).toHaveTextContent('Δοκίμασε ξανά')
  })
})

describe('<EmptyState>', () => {
  it('renders title, optional hint and optional action; the icon is decorative', () => {
    const { container } = wrap(
      'en',
      <EmptyState
        title="Nothing here"
        hint="Add something above."
        icon="✿"
        action={<button type="button">Do it</button>}
      />,
    )
    expect(screen.getByText('Nothing here')).toBeInTheDocument()
    expect(screen.getByText('Add something above.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Do it' })).toBeInTheDocument()
    const icon = container.querySelector('[aria-hidden="true"]')
    expect(icon).toHaveTextContent('✿')
    // Content, not an announcement: no live-region role of its own.
    expect(screen.queryByRole('status')).toBeNull()
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('renders only the title when hint and action are absent', () => {
    const { container } = wrap('el', <EmptyState title={dictionaries.el.fridgeEmpty} />)
    expect(screen.getByText(dictionaries.el.fridgeEmpty)).toBeInTheDocument()
    expect(container.querySelectorAll('p')).toHaveLength(1)
    expect(screen.queryByRole('button')).toBeNull()
  })
})
