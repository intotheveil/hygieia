import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { LangProvider } from '../i18n/LangProvider'
import { el, en, type Lang } from '../i18n/dictionary'
import { disabledSource } from '../user/disabled'
import { memorySource } from '../user/memory'
import type { UserDataSource } from '../user/source'
import { SaveButton, SavedItemsScope } from './SaveButton'

function renderIn(source: UserDataSource, ui: React.ReactNode, lang: Lang = 'en') {
  return render(
    <LangProvider initial={lang}>
      <SavedItemsScope source={source}>{ui}</SavedItemsScope>
    </LangProvider>,
  )
}

describe('<SaveButton>', () => {
  it.each(['local-only', 'signed-out'] as const)(
    'renders NOTHING when user data is disabled (%s) — the cards stay as they were',
    (reason) => {
      const { container } = renderIn(
        disabledSource(reason),
        <SaveButton kind="diet" itemId="d1" label="Keto" />,
      )
      expect(container.querySelector('button')).toBeNull()
    },
  )

  it('renders nothing without any scope or auth provider (useUserData → local-only)', () => {
    const { container } = render(
      <LangProvider initial="en">
        <SaveButton kind="diet" itemId="d1" label="Keto" />
      </LangProvider>,
    )
    expect(container.querySelector('button')).toBeNull()
  })

  it.each([
    ['en', en],
    ['el', el],
  ] as const)(
    'toggles saved ↔ unsaved with aria-pressed and the item name in the label (%s)',
    async (lang, t) => {
      const mem = memorySource()
      renderIn(mem.source, <SaveButton kind="workout" itemId="w1" label="Full body" />, lang)
      const button = await screen.findByRole('button', { name: `${t.saveItemAdd}: Full body` })
      await waitFor(() => expect(button).toBeEnabled())
      expect(button).toHaveAttribute('aria-pressed', 'false')

      fireEvent.click(button)
      await waitFor(() => expect(button).toHaveAttribute('aria-pressed', 'true'))
      expect(button).toHaveAccessibleName(`${t.saveItemRemove}: Full body`)
      expect(mem.store.savedItems).toEqual([
        expect.objectContaining({ kind: 'workout', item_id: 'w1' }),
      ])

      fireEvent.click(button)
      await waitFor(() => expect(button).toHaveAttribute('aria-pressed', 'false'))
      expect(mem.store.savedItems).toEqual([])
    },
  )

  it('starts pressed when the item is already saved', async () => {
    const mem = memorySource({
      store: { savedItems: [{ kind: 'health_tip', item_id: 't1', created_at: '' }] },
    })
    renderIn(mem.source, <SaveButton kind="health_tip" itemId="t1" label="Sleep" />)
    await waitFor(() => expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true'))
    // A different kind with the same id is NOT saved.
    const { unmount } = renderIn(
      mem.source,
      <SaveButton kind="skincare_tip" itemId="t1" label="Other" />,
    )
    await waitFor(() => expect(screen.getAllByRole('button')[1]).toBeEnabled())
    expect(screen.getAllByRole('button')[1]).toHaveAttribute('aria-pressed', 'false')
    unmount()
  })

  it('reverts the optimistic state and shows the alert when the write fails', async () => {
    const mem = memorySource({ failing: new Set(['saveItem']) })
    renderIn(mem.source, <SaveButton kind="diet" itemId="d1" label="Keto" />)
    const button = await screen.findByRole('button')
    await waitFor(() => expect(button).toBeEnabled())
    fireEvent.click(button)
    expect(await screen.findByRole('alert')).toHaveTextContent(en.saveItemFailed)
    expect(button).toHaveAttribute('aria-pressed', 'false')
    expect(mem.store.savedItems).toEqual([])
  })

  it('many buttons in one scope share ONE list read', async () => {
    const mem = memorySource()
    const spy = vi.spyOn(mem.source, 'listSavedItems')
    renderIn(
      mem.source,
      <>
        <SaveButton kind="diet" itemId="d1" label="A" />
        <SaveButton kind="diet" itemId="d2" label="B" />
        <SaveButton kind="diet" itemId="d3" label="C" />
      </>,
    )
    const buttons = await screen.findAllByRole('button')
    await waitFor(() => expect(buttons[0]).toBeEnabled())
    expect(spy).toHaveBeenCalledTimes(1)

    fireEvent.click(buttons[1])
    await waitFor(() => expect(buttons[1]).toHaveAttribute('aria-pressed', 'true'))
    expect(buttons[0]).toHaveAttribute('aria-pressed', 'false')
    expect(buttons[2]).toHaveAttribute('aria-pressed', 'false')
    // A write does not re-read the list; the overlay carries the change.
    expect(spy).toHaveBeenCalledTimes(1)
  })
})
