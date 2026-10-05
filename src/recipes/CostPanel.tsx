// COST PANEL (P4.3). `€a–€b` for one scope (per portion / per recipe, following the toggle in
// NutritionPanel through `scope`), the as-of date of the oldest price used, localised, the lines
// the engine could not price, and the "typical Greek supermarket range" note. The figures come in
// as a `CostResult` (the page runs `computeCost`); the panel only formats. When NOTHING is priced
// the range is omitted rather than shown as €0.00–€0.00 — the unpriced list says why.

import type { IngredientSeed } from '../content/types.ts'
import { useLang } from '../i18n/LangProvider'
import { fill } from '../i18n/fill.ts'
import type { CostResult } from '../cost/compute.ts'
import { formatEuro, formatIsoDate, type Scope } from './panelFormat.ts'

export interface CostPanelProps {
  result: CostResult
  scope: Scope
  /** Names the unpriced lines in the page's language; a slug not in the map is shown as the slug. */
  ingredientsBySlug?: ReadonlyMap<string, IngredientSeed>
}

const EMPTY: ReadonlyMap<string, IngredientSeed> = new Map()

const PANEL =
  'flex flex-col gap-4 rounded-2xl border border-olive-900/10 bg-paper-50/80 p-5 text-olive-900'
const FOOTNOTE = 'text-xs leading-relaxed text-olive-700'

export function CostPanel({ result, scope, ingredientsBySlug = EMPTY }: CostPanelProps) {
  const { lang, t } = useLang()
  const range = scope === 'portion' ? result.perPortion : result.perRecipe
  const priced = result.lines.length > 0
  const unpricedNames = result.unpriced.map((slug) => {
    const ingredient = ingredientsBySlug.get(slug)
    if (!ingredient) return slug
    return lang === 'el' ? ingredient.name_el : ingredient.name_en
  })

  return (
    <section aria-labelledby="recipe-cost" data-testid="cost-panel" className={PANEL}>
      <h2 id="recipe-cost" className="font-display text-xl font-semibold text-olive-950">
        {t.costTitle}
      </h2>

      {priced && (
        <p className="flex flex-wrap items-baseline gap-2">
          <span
            className="font-display text-3xl font-semibold text-olive-950"
            data-testid="cost-range"
          >
            {fill(t.costRange, {
              min: formatEuro(range.min, lang),
              max: formatEuro(range.max, lang),
            })}
          </span>
          <span aria-hidden="true" className="text-olive-700">
            ·
          </span>
          <span className="text-sm text-olive-700" data-testid="cost-scope">
            {scope === 'portion' ? t.perPortion : t.perRecipe}
          </span>
        </p>
      )}

      {result.asOf !== null && (
        <p className="text-sm text-olive-700" data-testid="cost-as-of">
          {fill(t.pricesAsOf, { date: formatIsoDate(result.asOf, lang) })}
        </p>
      )}
      {unpricedNames.length > 0 && (
        <p className={FOOTNOTE} data-testid="cost-unpriced">
          {fill(t.unpriced, { items: unpricedNames.join(', ') })}
        </p>
      )}
      <p className={FOOTNOTE}>{t.priceBasisNote}</p>
    </section>
  )
}
