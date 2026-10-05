// NUTRITION PANEL (P4.3). kcal + protein/carbs/fat for one scope (per portion by default, per
// recipe on toggle), a macro bar by energy share, the "typical values" footnote that names USDA
// FoodData Central, the confidence, and any recipe line the engine could not count. The figures
// come in as a `NutritionResult` (the page runs `computeNutrition`); the panel only formats.
//
// The per-portion / per-recipe toggle is rendered HERE and is the page's only one: the cost panel
// follows the same `scope` through its prop. Pass no `onScopeChange` to render without the toggle.

import { useLang } from '../i18n/LangProvider'
import { fill, pluralForm } from '../i18n/fill.ts'
import type { NutritionResult } from '../nutrition/compute.ts'
import { energyShare, formatWhole, type Scope } from './panelFormat.ts'

export interface NutritionPanelProps {
  result: NutritionResult
  scope: Scope
  onScopeChange?: (scope: Scope) => void
}

const PANEL =
  'flex flex-col gap-4 rounded-2xl border border-olive-900/10 bg-paper-50/80 p-5 text-olive-900'
const FOOTNOTE = 'text-xs leading-relaxed text-olive-700'

export function NutritionPanel({ result, scope, onScopeChange }: NutritionPanelProps) {
  const { lang, t } = useLang()
  const macros = scope === 'portion' ? result.perPortion : result.perRecipe
  const share = energyShare(macros)
  // One label per `confidence` literal: a new literal in the engine is a type error here.
  const confidenceLabel: Record<NutritionResult['confidence'], string> = {
    typical: t.confidenceTypical,
  }
  const grams = (value: number) =>
    `${formatWhole(value, lang)} ${pluralForm(t.units.g, Math.round(value))}`

  return (
    <section aria-labelledby="recipe-nutrition" data-testid="nutrition-panel" className={PANEL}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="recipe-nutrition" className="font-display text-xl font-semibold text-olive-950">
          {t.nutritionTitle}
        </h2>
        {onScopeChange && <ScopeToggle scope={scope} onChange={onScopeChange} />}
      </div>

      <p className="flex items-baseline gap-2">
        <span
          className="font-display text-3xl font-semibold text-olive-950"
          data-testid="nutrition-kcal"
        >
          {formatWhole(macros.kcal, lang)}
        </span>
        <span className="text-olive-700">{t.kcal}</span>
        <span aria-hidden="true" className="text-olive-700">
          ·
        </span>
        <span className="text-sm text-olive-700">
          {scope === 'portion' ? t.perPortion : t.perRecipe}
        </span>
      </p>

      <dl className="grid grid-cols-3 gap-3">
        <div className="flex flex-col">
          <dt className="text-sm text-olive-700">{t.protein}</dt>
          <dd className="font-medium" data-testid="nutrition-protein">
            {grams(macros.protein)}
          </dd>
        </div>
        <div className="flex flex-col">
          <dt className="text-sm text-olive-700">{t.carbs}</dt>
          <dd className="font-medium" data-testid="nutrition-carbs">
            {grams(macros.carbs)}
          </dd>
        </div>
        <div className="flex flex-col">
          <dt className="text-sm text-olive-700">{t.fat}</dt>
          <dd className="font-medium" data-testid="nutrition-fat">
            {grams(macros.fat)}
          </dd>
        </div>
      </dl>

      {share && (
        <div
          role="img"
          aria-label={fill(t.macroBarLabel, { ...share })}
          className="flex h-2 w-full overflow-hidden rounded-full bg-olive-900/10"
        >
          <span className="bg-sage-500" style={{ width: `${share.protein}%` }} />
          <span className="bg-olive-700" style={{ width: `${share.carbs}%` }} />
          <span className="bg-clay-500" style={{ width: `${share.fat}%` }} />
        </div>
      )}

      {result.unknown.length > 0 && (
        <p className={FOOTNOTE} data-testid="nutrition-not-counted">
          {fill(t.notCounted, { items: result.unknown.join(', ') })}
        </p>
      )}
      <p className={FOOTNOTE}>{confidenceLabel[result.confidence]}</p>
      <p className={FOOTNOTE}>{t.typicalValuesNote}</p>
    </section>
  )
}

/** Two `aria-pressed` buttons; exactly one is pressed. Not a `disabled` control: a pressed button stays clickable. */
function ScopeToggle({ scope, onChange }: { scope: Scope; onChange: (scope: Scope) => void }) {
  const { t } = useLang()
  const options: readonly { value: Scope; label: string }[] = [
    { value: 'portion', label: t.perPortion },
    { value: 'recipe', label: t.perRecipe },
  ]
  return (
    <div className="inline-flex rounded-full border border-olive-900/20 bg-paper-50/70 p-0.5 text-sm">
      {options.map((option) => {
        const pressed = option.value === scope
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={pressed}
            data-testid={`scope-${option.value}`}
            onClick={() => onChange(option.value)}
            className={`rounded-full px-3 py-1 font-medium transition ${
              pressed ? 'bg-olive-900 text-paper-50' : 'text-olive-900 hover:bg-paper-50'
            }`}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
