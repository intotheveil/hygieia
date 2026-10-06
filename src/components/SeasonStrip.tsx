// WHAT'S IN SEASON — a strip of this month's Greek fruit and vegetables (operator request,
// 2026-10-06), shown on /recipes and /fridge. The heading (month name) paints with the page; the
// chips arrive after the first paint (`loadSeasonal`, content/seasonalLoader.ts) into a row whose
// height is reserved and which scrolls sideways, so their arrival shifts nothing below it.
//
// A chip whose produce is a catalogue ingredient links to `/recipes?ingredient=<slug>`; produce the
// catalogue does not carry is a plain chip. The first chip opens `/recipes?season=now` (recipes
// with ≥ 2 in-season ingredients, the most seasonal first — recipes/filter.ts). On /recipes the
// page passes its current `ingredient` / `season` params so the matching chip reads as current.

import { useId } from 'react'
import { Link } from 'react-router-dom'
import type { Month } from '../content/seasonal.ts'
import { loadSeasonal } from '../content/seasonalLoader.ts'
import { fill } from '../i18n/fill.ts'
import { seasonCopy } from '../i18n/features/season.ts'
import { useLang } from '../i18n/LangProvider'
import { useAsync } from '../lib/useAsync.ts'

export interface SeasonStripProps {
  /** The month to show; default: the current month on the user's clock. */
  month?: Month
  /** Ingredient slugs of the current `/recipes?ingredient=` filter (marks those chips current). */
  activeIngredients?: readonly string[]
  /** True on `/recipes?season=now` (marks the seasonal-recipes chip current). */
  seasonActive?: boolean
}

const CHIP = 'shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium transition'
const CHIP_LINK = `${CHIP} border border-olive-900/20 bg-paper-50/70 text-olive-900 hover:bg-paper-50`
const CHIP_CURRENT = `${CHIP} bg-olive-900 text-paper-50`
const CHIP_PLAIN = `${CHIP} border border-dashed border-olive-900/20 text-olive-700`

export function SeasonStrip({
  month,
  activeIngredients = [],
  seasonActive = false,
}: SeasonStripProps) {
  const { t, lang } = useLang(seasonCopy)
  const headingId = useId()
  const seasonal = useAsync(loadSeasonal)
  const current: Month = month ?? ((new Date().getMonth() + 1) as Month)
  const items = seasonal.status === 'ready' ? seasonal.data.inSeason(current) : null

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-2">
      <h2 id={headingId} className="text-sm font-medium tracking-wide text-sage-700 uppercase">
        {fill(t.seasonTitle, { month: t.seasonMonths[current] })}
      </h2>
      <ul
        aria-label={t.seasonChipsLabel}
        aria-busy={items === null}
        className="flex h-11 items-start gap-2 overflow-x-auto overflow-y-hidden"
      >
        {items && (
          <li className="shrink-0">
            <Link
              to="/recipes?season=now"
              aria-current={seasonActive ? 'page' : undefined}
              className={`${seasonActive ? CHIP_CURRENT : CHIP_LINK} inline-block`}
            >
              {t.seasonRecipesLink}
            </Link>
          </li>
        )}
        {items?.map((p) => {
          const name = lang === 'el' ? p.name_el : p.name_en
          if (p.slug === null)
            return (
              <li key={p.key} className={CHIP_PLAIN}>
                {name}
              </li>
            )
          const isCurrent = activeIngredients.includes(p.slug)
          return (
            <li key={p.key} className="shrink-0">
              <Link
                to={`/recipes?ingredient=${encodeURIComponent(p.slug)}`}
                aria-current={isCurrent ? 'page' : undefined}
                className={`${isCurrent ? CHIP_CURRENT : CHIP_LINK} inline-block`}
              >
                {name}
              </Link>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
