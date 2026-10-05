import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { INGREDIENTS } from '../content/seed/ingredients.ts'
import { LangProvider } from '../i18n/LangProvider'
import { el, en, type Lang } from '../i18n/dictionary'
import { IngredientPicker, type IngredientPickerProps } from './IngredientPicker'

function renderPicker(lang: Lang, props: Partial<IngredientPickerProps> = {}) {
  const onAdd = vi.fn()
  render(
    <LangProvider initial={lang}>
      <IngredientPicker ingredients={INGREDIENTS} selected={new Set()} onAdd={onAdd} {...props} />
    </LangProvider>,
  )
  return { onAdd, input: screen.getByRole('combobox') }
}

describe('<IngredientPicker>', () => {
  it('offers Ντομάτα for the accent-less Greek prefix ντομ', () => {
    const { input } = renderPicker('el')
    fireEvent.change(input, { target: { value: 'ντομ' } })
    const options = screen.getAllByRole('option')
    expect(options[0]).toHaveTextContent('Ντομάτα')
    expect(input).toHaveAttribute('aria-expanded', 'true')
  })

  it('matches the OTHER language too and is case-insensitive: "TOMA" in Greek UI finds Ντομάτα', () => {
    const { input } = renderPicker('el')
    fireEvent.change(input, { target: { value: 'TOMA' } })
    expect(screen.getAllByRole('option')[0]).toHaveTextContent('Ντομάτα')
  })

  it('shows the current-language name first and the other as a hint', () => {
    const { input } = renderPicker('en')
    fireEvent.change(input, { target: { value: 'ντομάτα' } })
    const first = screen.getAllByRole('option')[0]
    expect(first).toHaveTextContent('Tomato')
    expect(first).toHaveTextContent('Ντομάτα')
  })

  it('offers nothing for a blank query and keeps the listbox collapsed', () => {
    const { input } = renderPicker('en')
    fireEvent.change(input, { target: { value: '   ' } })
    expect(screen.queryAllByRole('option')).toHaveLength(0)
    expect(input).toHaveAttribute('aria-expanded', 'false')
  })

  it('never offers an ingredient that is already selected', () => {
    const { input } = renderPicker('en', { selected: new Set(['tomato']) })
    fireEvent.change(input, { target: { value: 'tomato' } })
    const options = screen.getAllByRole('option')
    expect(options.length).toBeGreaterThan(0) // "Tomato paste" and friends are still offered
    expect(options.some((o) => within(o).queryByText('Tomato') !== null)).toBe(false)
  })

  it('caps the list at `limit`', () => {
    const { input } = renderPicker('en', { limit: 3 })
    fireEvent.change(input, { target: { value: 'a' } })
    expect(screen.getAllByRole('option')).toHaveLength(3)
  })

  it('adds the highlighted option on Enter, clears the query and closes the list', () => {
    const { input, onAdd } = renderPicker('en')
    fireEvent.change(input, { target: { value: 'cucumber' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(onAdd).toHaveBeenCalledWith('cucumber')
    expect(input).toHaveValue('')
    expect(input).toHaveAttribute('aria-expanded', 'false')
  })

  it('moves the highlight with the arrow keys and exposes it through aria-activedescendant', () => {
    const { input, onAdd } = renderPicker('en')
    fireEvent.change(input, { target: { value: 'tomato' } })
    const options = screen.getAllByRole('option')
    expect(options.length).toBeGreaterThan(1)
    expect(options[0]).toHaveAttribute('aria-selected', 'true')
    expect(input).toHaveAttribute('aria-activedescendant', options[0]?.id)

    fireEvent.keyDown(input, { key: 'ArrowDown' })
    expect(screen.getAllByRole('option')[1]).toHaveAttribute('aria-selected', 'true')
    expect(input).toHaveAttribute('aria-activedescendant', options[1]?.id)

    fireEvent.keyDown(input, { key: 'ArrowUp' })
    expect(screen.getAllByRole('option')[0]).toHaveAttribute('aria-selected', 'true')

    // Wraps from the first to the last.
    fireEvent.keyDown(input, { key: 'ArrowUp' })
    expect(screen.getAllByRole('option').at(-1)).toHaveAttribute('aria-selected', 'true')

    fireEvent.keyDown(input, { key: 'Enter' })
    expect(onAdd).toHaveBeenCalledTimes(1)
    expect(onAdd.mock.calls[0]?.[0]).not.toBe('tomato')
  })

  it('closes on Escape without adding, and re-opens on ArrowDown', () => {
    const { input, onAdd } = renderPicker('en')
    fireEvent.change(input, { target: { value: 'feta' } })
    fireEvent.keyDown(input, { key: 'Escape' })
    expect(input).toHaveAttribute('aria-expanded', 'false')
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(onAdd).not.toHaveBeenCalled()
    fireEvent.keyDown(input, { key: 'ArrowDown' })
    expect(input).toHaveAttribute('aria-expanded', 'true')
  })

  it('adds on mouse pick', () => {
    const { input, onAdd } = renderPicker('en')
    fireEvent.change(input, { target: { value: 'feta' } })
    const feta = screen.getAllByRole('option').find((o) => within(o).queryByText('Feta') !== null)
    expect(feta).toBeDefined()
    fireEvent.mouseDown(feta!)
    expect(onAdd).toHaveBeenCalledWith('feta')
  })

  it.each([
    ['en', en],
    ['el', el],
  ] as const)('labels the field from the %s dictionary', (lang, dict) => {
    renderPicker(lang)
    expect(screen.getByRole('combobox', { name: dict.addIngredient })).toBeInTheDocument()
    // Collapsed, so it has no accessible name yet; the label is wired through aria-label.
    expect(screen.getByRole('listbox', { hidden: true })).toHaveAttribute(
      'aria-label',
      dict.addIngredient,
    )
    expect(screen.getByPlaceholderText(dict.searchIngredientsPlaceholder)).toBeInTheDocument()
  })
})
