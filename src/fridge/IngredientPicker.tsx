// INGREDIENT PICKER (P3.4): a typeahead over the ingredient catalogue in BOTH languages at once —
// typing `ντομ` or `tom` both offer Ντομάτα / Tomato — accent- and case-insensitive through
// `normalizeForSearch`. WAI-ARIA combobox: the input is `role="combobox"` with
// `aria-activedescendant` pointing at the highlighted `option` in the `listbox`; ArrowDown/ArrowUp
// move, Enter adds, Escape closes. Already-selected ingredients are not offered again. Picking
// clears the query and keeps focus in the input, so several ingredients can be added in a row.

import { useId, useState } from 'react'
import type { KeyboardEvent } from 'react'
import type { IngredientSeed } from '../content/types.ts'
import { useLang } from '../i18n/LangProvider'
import type { Lang } from '../i18n/dictionary'
import { normalizeForSearch } from './match.ts'

export interface IngredientPickerProps {
  ingredients: readonly IngredientSeed[]
  /** Slugs already in the fridge; never offered. */
  selected: ReadonlySet<string>
  onAdd: (slug: string) => void
  /** How many suggestions to show at most. */
  limit?: number
}

export function ingredientName(ingredient: IngredientSeed, lang: Lang): string {
  return lang === 'el' ? ingredient.name_el : ingredient.name_en
}

/**
 * The suggestions for `query`: ingredients whose Greek OR English name contains the folded
 * query, excluding `selected`; names that START with the query come first, then code-point
 * order on the current language's name (a total, machine-independent order). Blank query → none.
 */
function suggest(
  ingredients: readonly IngredientSeed[],
  query: string,
  selected: ReadonlySet<string>,
  lang: Lang,
  limit: number,
): IngredientSeed[] {
  const q = normalizeForSearch(query)
  if (q === '') return []
  const scored: Array<{ ingredient: IngredientSeed; starts: boolean; name: string }> = []
  for (const ingredient of ingredients) {
    if (selected.has(ingredient.slug)) continue
    const el = normalizeForSearch(ingredient.name_el)
    const en = normalizeForSearch(ingredient.name_en)
    if (!el.includes(q) && !en.includes(q)) continue
    scored.push({
      ingredient,
      starts: el.startsWith(q) || en.startsWith(q),
      name: normalizeForSearch(ingredientName(ingredient, lang)),
    })
  }
  scored.sort(
    (a, b) =>
      Number(b.starts) - Number(a.starts) || (a.name < b.name ? -1 : a.name > b.name ? 1 : 0),
  )
  return scored.slice(0, limit).map((s) => s.ingredient)
}

export function IngredientPicker({
  ingredients,
  selected,
  onAdd,
  limit = 8,
}: IngredientPickerProps) {
  const { t, lang } = useLang()
  const inputId = useId()
  const listId = useId()
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const [open, setOpen] = useState(false)

  const options = suggest(ingredients, query, selected, lang, limit)
  const expanded = open && options.length > 0
  // Clamp rather than store: the list shrinks as the user types and the highlight must follow.
  const activeIndex = options.length === 0 ? -1 : Math.min(active, options.length - 1)
  const optionId = (index: number) => `${listId}-${index}`

  function pick(ingredient: IngredientSeed) {
    onAdd(ingredient.slug)
    setQuery('')
    setActive(0)
    setOpen(false)
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    switch (event.key) {
      case 'ArrowDown':
        if (options.length === 0) return
        event.preventDefault()
        setOpen(true)
        setActive(expanded ? (activeIndex + 1) % options.length : 0)
        return
      case 'ArrowUp':
        if (options.length === 0) return
        event.preventDefault()
        setOpen(true)
        setActive(
          expanded ? (activeIndex - 1 + options.length) % options.length : options.length - 1,
        )
        return
      case 'Enter': {
        if (!expanded || activeIndex < 0) return
        event.preventDefault()
        const chosen = options[activeIndex]
        if (chosen) pick(chosen)
        return
      }
      case 'Escape':
        if (!expanded) return
        event.preventDefault()
        setOpen(false)
        return
      default:
        return
    }
  }

  return (
    <div className="relative flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-sm font-medium text-olive-900">
        {t.addIngredient}
      </label>
      <input
        id={inputId}
        type="text"
        role="combobox"
        autoComplete="off"
        spellCheck={false}
        aria-autocomplete="list"
        aria-expanded={expanded}
        aria-controls={listId}
        aria-activedescendant={expanded && activeIndex >= 0 ? optionId(activeIndex) : undefined}
        placeholder={t.searchIngredientsPlaceholder}
        value={query}
        onChange={(event) => {
          setQuery(event.target.value)
          setActive(0)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={onKeyDown}
        className="w-full rounded-xl border border-olive-900/20 bg-paper-50 px-4 py-2.5 text-olive-950 shadow-sm placeholder:text-olive-700/60 focus:border-sage-600 focus:ring-2 focus:ring-sage-500/40 focus:outline-none"
      />
      <ul
        id={listId}
        role="listbox"
        aria-label={t.addIngredient}
        hidden={!expanded}
        className="absolute top-full right-0 left-0 z-10 mt-1 max-h-72 overflow-y-auto rounded-xl border border-olive-900/10 bg-paper-50 p-1 shadow-md"
      >
        {options.map((ingredient, index) => {
          const isActive = index === activeIndex
          const primary = ingredientName(ingredient, lang)
          const secondary = ingredientName(ingredient, lang === 'el' ? 'en' : 'el')
          return (
            <li
              key={ingredient.slug}
              id={optionId(index)}
              role="option"
              aria-selected={isActive}
              // mousedown, not click: the input blurs (and the list closes) before a click lands.
              onMouseDown={(event) => {
                event.preventDefault()
                pick(ingredient)
              }}
              onMouseEnter={() => setActive(index)}
              className={`flex cursor-pointer items-baseline justify-between gap-3 rounded-lg px-3 py-2 text-sm ${
                isActive ? 'bg-sage-500/15 text-olive-950' : 'text-olive-900'
              }`}
            >
              <span>{primary}</span>
              <span className="text-xs text-olive-700/80">{secondary}</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
