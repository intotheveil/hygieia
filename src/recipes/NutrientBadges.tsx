// NUTRIENT BADGES (women's nutrition layer, 2026-10-11). Under the nutrition panel on a recipe: one
// badge per nutrient one portion is at least a source of ("Source of iron", "High in calcium"),
// each with the amount and its share of the EU reference intake, then a one-line note that these are
// food-composition-table estimates, not medical advice. The figures come in as a `NutrientResult`
// (the page runs `computeNutrients`); this component only formats. No claim → renders nothing.

import { useLang } from '../i18n/LangProvider'
import { nutrientsCopy } from '../i18n/features/nutrients.ts'
import { fill } from '../i18n/fill.ts'
import { nutrientClaims, type NutrientResult } from '../nutrition/nutrients.ts'
import { formatOneDecimal, formatWhole } from './panelFormat.ts'

export interface NutrientBadgesProps {
  result: NutrientResult
}

export function NutrientBadges({ result }: NutrientBadgesProps) {
  const { lang, t } = useLang(nutrientsCopy)
  const claims = nutrientClaims(result)
  if (claims.length === 0) return null

  return (
    <section
      aria-labelledby="recipe-nutrients"
      data-testid="nutrient-badges"
      className="flex flex-col gap-3"
    >
      <h2 id="recipe-nutrients" className="font-display text-lg font-semibold text-olive-950">
        {t.nutrientsTitle}
      </h2>
      <ul className="flex flex-wrap gap-2">
        {claims.map((claim) => (
          <li
            key={claim.nutrient}
            data-level={claim.level}
            className="flex flex-col rounded-2xl bg-sage-500/15 px-3.5 py-2 text-sage-700"
          >
            <span className="text-sm font-semibold">
              {claim.level === 'high'
                ? t.nutrientHighIn[claim.nutrient]
                : t.nutrientSourceOf[claim.nutrient]}
            </span>
            <span className="text-xs text-olive-700">
              {formatOneDecimal(claim.amount, lang)} {t.nutrientUnits[claim.nutrient]}
              <span aria-hidden="true"> · </span>
              {fill(t.nutrientShareOfNrv, { pct: formatWhole(claim.share * 100, lang) })}
            </span>
          </li>
        ))}
      </ul>
      <p className="text-xs leading-relaxed text-olive-700">{t.nutrientsNote}</p>
    </section>
  )
}
