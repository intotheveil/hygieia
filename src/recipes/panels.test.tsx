import { fireEvent, render, screen, within } from '@testing-library/react'
import { useState } from 'react'
import type { IngredientSeed, RecipeSeed } from '../content/types'
import { computeCost, type CostResult } from '../cost/compute'
import { LangProvider } from '../i18n/LangProvider'
import { el, en, type Lang } from '../i18n/dictionary'
import { fill } from '../i18n/fill'
import { indexBySlug } from '../fridge/match'
import { computeNutrition, type NutritionResult } from '../nutrition/compute'
import { CostPanel } from './CostPanel'
import { NutritionPanel } from './NutritionPanel'
import { energyShare, formatEuro, formatIsoDate, formatWhole, type Scope } from './panelFormat'

// A synthetic catalogue with hand-checkable figures (per 100 g; prices per kg).
function ingredient(
  overrides: Partial<IngredientSeed> & Pick<IngredientSeed, 'slug'>,
): IngredientSeed {
  return {
    name_el: `ΕΛ ${overrides.slug}`,
    name_en: `EN ${overrides.slug}`,
    category: 'test',
    unit: 'g',
    grams_per_unit: 1,
    kcal_100g: 0,
    protein_100g: 0,
    carbs_100g: 0,
    fat_100g: 0,
    source_note: 'Typical values, USDA FoodData Central reference ranges',
    price_eur_min: 0,
    price_eur_max: 0,
    price_per: 'kg',
    price_as_of: '2026-10-05',
    price_note: '',
    substitute_slugs: [],
    is_pantry_staple: false,
    ...overrides,
  }
}

const CATALOGUE = indexBySlug([
  // 200 g → 720 kcal, 14 g protein, 160 g carbs, 2 g fat; €0.40–€0.60; the OLDEST price date.
  ingredient({
    slug: 'rice',
    kcal_100g: 360,
    protein_100g: 7,
    carbs_100g: 80,
    fat_100g: 1,
    price_eur_min: 2,
    price_eur_max: 3,
    price_as_of: '2026-09-01',
  }),
  // 50 g → 442 kcal, 50 g fat; €0.40–€0.60.
  ingredient({ slug: 'oil', kcal_100g: 884, fat_100g: 100, price_eur_min: 8, price_eur_max: 12 }),
  // 1 g → 3.1 kcal, 0.11 / 0.65 / 0.06 g; NO usable price → unpriced but counted in nutrition.
  ingredient({ slug: 'saffron', kcal_100g: 310, protein_100g: 11, carbs_100g: 65, fat_100g: 6 }),
])

const RECIPE: RecipeSeed = {
  slug: 'test-pilaf',
  title_el: 'Πιλάφι',
  title_en: 'Pilaf',
  portions: 2,
  prep_min: 20,
  meal_types: ['lunch'],
  image_path: null,
  steps_el: ['Βράσε.'],
  steps_en: ['Boil.'],
  ingredients: [
    { ingredient_slug: 'rice', quantity: 200, unit: 'g' },
    { ingredient_slug: 'oil', quantity: 50, unit: 'ml' },
    { ingredient_slug: 'saffron', quantity: 1, unit: 'g' },
    // Not in the catalogue at all: `unknown` for nutrition, `unpriced` for cost.
    { ingredient_slug: 'mystery-spice', quantity: 5, unit: 'g' },
  ],
  diet_slugs: [],
}

const NUTRITION = computeNutrition(RECIPE, CATALOGUE)
const COST = computeCost(RECIPE, CATALOGUE)

/** Both panels under ONE scope state, exactly as RecipePage wires them. */
function Harness({
  lang,
  nutrition = NUTRITION,
  cost = COST,
}: {
  lang: Lang
  nutrition?: NutritionResult
  cost?: CostResult
}) {
  const [scope, setScope] = useState<Scope>('portion')
  return (
    <LangProvider initial={lang}>
      <NutritionPanel result={nutrition} scope={scope} onScopeChange={setScope} />
      <CostPanel result={cost} scope={scope} ingredientsBySlug={CATALOGUE} />
    </LangProvider>
  )
}

const dictFor = (lang: Lang) => (lang === 'el' ? el : en)

/** jest-dom collapses an element's NBSP (Intl puts one before "€") to a space; do the same to an expected string. */
const ws = (s: string) => s.replace(/\s+/g, ' ')

describe('panel figures (sanity of the fixture, hand-computed)', () => {
  it('the engines agree with the arithmetic the panel tests assert against', () => {
    expect(NUTRITION.perRecipe.kcal).toBeCloseTo(1165.1, 5)
    expect(NUTRITION.perPortion.kcal).toBeCloseTo(582.55, 5)
    expect(NUTRITION.unknown).toEqual(['mystery-spice'])
    expect(COST.perRecipe.min).toBeCloseTo(0.8, 10)
    expect(COST.perRecipe.max).toBeCloseTo(1.2, 10)
    expect(COST.perPortion.min).toBeCloseTo(0.4, 10)
    expect(COST.perPortion.max).toBeCloseTo(0.6, 10)
    expect(COST.asOf).toBe('2026-09-01')
    expect(COST.unpriced).toEqual(['saffron', 'mystery-spice'])
  })
})

describe('<NutritionPanel>', () => {
  it.each(['en', 'el'] as const)(
    'shows per-portion whole-number figures by default, with the macro bar and footnotes (%s)',
    (lang) => {
      const t = dictFor(lang)
      render(<Harness lang={lang} />)
      const panel = screen.getByTestId('nutrition-panel')
      expect(screen.getByRole('region', { name: t.nutritionTitle })).toBe(panel)

      // 582.55 → 583; 7.055 → 7; 80.325 → 80; 26.03 → 26.
      expect(within(panel).getByTestId('nutrition-kcal')).toHaveTextContent(/^583$/)
      expect(within(panel).getByTestId('nutrition-protein')).toHaveTextContent(
        `7 ${t.units.g.other}`,
      )
      expect(within(panel).getByTestId('nutrition-carbs')).toHaveTextContent(
        `80 ${t.units.g.other}`,
      )
      expect(within(panel).getByTestId('nutrition-fat')).toHaveTextContent(`26 ${t.units.g.other}`)
      expect(within(panel).getByText(t.kcal)).toBeInTheDocument()
      expect(within(panel).getByText(t.perPortion, { selector: 'span' })).toBeInTheDocument()

      // Toggle: per-portion pressed, per-recipe not.
      expect(within(panel).getByRole('button', { name: t.perPortion })).toHaveAttribute(
        'aria-pressed',
        'true',
      )
      expect(within(panel).getByRole('button', { name: t.perRecipe })).toHaveAttribute(
        'aria-pressed',
        'false',
      )

      // Macro bar by energy share: protein 28.22 / carbs 321.3 / fat 234.27 kcal → 5 / 55 / 40 %.
      const share = energyShare(NUTRITION.perPortion)
      expect(share).toEqual({ protein: 5, carbs: 55, fat: 40 })
      const bar = within(panel).getByRole('img')
      expect(bar).toHaveAttribute('aria-label', fill(t.macroBarLabel, { ...share }))
      expect(bar.getAttribute('aria-label')).toContain('5%')

      // Footnotes: typical values naming USDA FoodData Central; confidence; the uncounted line.
      expect(within(panel).getByText(t.typicalValuesNote)).toHaveTextContent(
        'USDA FoodData Central',
      )
      expect(within(panel).getByText(t.confidenceTypical)).toBeInTheDocument()
      expect(within(panel).getByTestId('nutrition-not-counted')).toHaveTextContent(
        fill(t.notCounted, { items: 'mystery-spice' }),
      )
    },
  )

  it('toggling to per-recipe recomputes the figures and the pressed state, in both panels', () => {
    render(<Harness lang="en" />)
    const panel = screen.getByTestId('nutrition-panel')
    fireEvent.click(within(panel).getByRole('button', { name: en.perRecipe }))

    // 1165.1 → 1165; 14.11 → 14; 160.65 → 161; 52.06 → 52.
    expect(within(panel).getByTestId('nutrition-kcal')).toHaveTextContent(/^1,165$/)
    expect(within(panel).getByTestId('nutrition-protein')).toHaveTextContent('14 g')
    expect(within(panel).getByTestId('nutrition-carbs')).toHaveTextContent('161 g')
    expect(within(panel).getByTestId('nutrition-fat')).toHaveTextContent('52 g')
    expect(within(panel).getByRole('button', { name: en.perRecipe })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(within(panel).getByRole('button', { name: en.perPortion })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
    // The cost panel follows the same state (one toggle on the page).
    const cost = screen.getByTestId('cost-panel')
    expect(within(cost).getByTestId('cost-range')).toHaveTextContent('About €0.80–€1.20')
    expect(within(cost).getByTestId('cost-scope')).toHaveTextContent(en.perRecipe)

    // And back.
    fireEvent.click(within(panel).getByRole('button', { name: en.perPortion }))
    expect(within(panel).getByTestId('nutrition-kcal')).toHaveTextContent(/^583$/)
    expect(within(cost).getByTestId('cost-range')).toHaveTextContent('About €0.40–€0.60')
  })

  it('omits the uncounted note and the macro bar when there is nothing to report', () => {
    const empty: NutritionResult = {
      ...NUTRITION,
      perPortion: { kcal: 0, protein: 0, carbs: 0, fat: 0 },
      unknown: [],
    }
    render(
      <LangProvider initial="en">
        <NutritionPanel result={empty} scope="portion" />
      </LangProvider>,
    )
    expect(screen.queryByTestId('nutrition-not-counted')).not.toBeInTheDocument()
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    // No `onScopeChange` → no toggle rendered.
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
    // The fixture's lines are all in g/ml → no engine warning → no unit-mismatch footnote.
    expect(NUTRITION.warnings).toEqual([])
    expect(screen.queryByTestId('nutrition-unit-mismatch')).not.toBeInTheDocument()
  })

  it.each(['en', 'el'] as const)(
    'surfaces the engine warnings as the unit-mismatch footnote when a line is not in g/ml or the ingredient unit (%s)',
    (lang) => {
      const t = dictFor(lang)
      // `onion` is sold by the piece (150 g each); the line asks for 2 TABLESPOONS of it, so the
      // engine falls back to grams_per_unit (2 × 150 g) and says so — exactly what an admin edit of
      // `unit` / `grams_per_unit` produces on a live catalogue.
      const catalogue = indexBySlug([
        ingredient({ slug: 'onion', unit: 'piece', grams_per_unit: 150, kcal_100g: 40 }),
      ])
      const mismatched: RecipeSeed = {
        ...RECIPE,
        slug: 'test-mismatch',
        ingredients: [{ ingredient_slug: 'onion', quantity: 2, unit: 'tbsp' }],
      }
      const result = computeNutrition(mismatched, catalogue)
      expect(result.warnings).toHaveLength(1)
      expect(result.warnings[0]).toMatch(/^unitMismatch: onion /)
      expect(result.unknown).toEqual([])

      render(
        <LangProvider initial={lang}>
          <NutritionPanel result={result} scope="portion" />
        </LangProvider>,
      )
      const note = screen.getByTestId('nutrition-unit-mismatch')
      expect(note).toHaveTextContent(t.unitMismatchNote)
      expect(screen.getAllByText(t.unitMismatchNote)).toHaveLength(1)
      // The regular footnotes are still there; the engine's raw warning string is NOT shown.
      expect(screen.getByText(t.typicalValuesNote)).toBeInTheDocument()
      expect(screen.queryByText(/unitMismatch:/)).not.toBeInTheDocument()
      expect(screen.queryByTestId('nutrition-not-counted')).not.toBeInTheDocument()
    },
  )
})

describe('<CostPanel>', () => {
  it.each(['en', 'el'] as const)(
    'shows the per-portion range as €a–€b, the as-of date localised, the unpriced lines and the basis note (%s)',
    (lang) => {
      const t = dictFor(lang)
      render(<Harness lang={lang} />)
      const panel = screen.getByTestId('cost-panel')
      expect(screen.getByRole('region', { name: t.costTitle })).toBe(panel)

      const range = within(panel).getByTestId('cost-range')
      expect(range).toHaveTextContent(
        ws(fill(t.costRange, { min: formatEuro(0.4, lang), max: formatEuro(0.6, lang) })),
      )
      if (lang === 'en') expect(range).toHaveTextContent('€0.40–€0.60')
      // Greek: comma decimals, € after the amount.
      else expect(range.textContent).toMatch(/0,40\s?€–0,60\s?€/)
      expect(within(panel).getByTestId('cost-scope')).toHaveTextContent(t.perPortion)

      const asOf = within(panel).getByTestId('cost-as-of')
      expect(asOf).toHaveTextContent(
        fill(t.pricesAsOf, { date: formatIsoDate('2026-09-01', lang) }),
      )
      expect(asOf).toHaveTextContent(lang === 'el' ? '1 Σεπτεμβρίου 2026' : '1 September 2026')

      // Unpriced: the known ingredient by its name in `lang`, the unknown slug as written.
      expect(within(panel).getByTestId('cost-unpriced')).toHaveTextContent(
        fill(t.unpriced, { items: `${lang === 'el' ? 'ΕΛ' : 'EN'} saffron, mystery-spice` }),
      )
      expect(within(panel).getByText(t.priceBasisNote)).toBeInTheDocument()
    },
  )

  it('omits the range (never €0.00–€0.00) when nothing could be priced, but still lists the lines', () => {
    const nothing = computeCost(
      { ...RECIPE, ingredients: [{ ingredient_slug: 'saffron', quantity: 1, unit: 'g' }] },
      CATALOGUE,
    )
    expect(nothing.lines).toHaveLength(0)
    render(
      <LangProvider initial="en">
        <CostPanel result={nothing} scope="portion" />
      </LangProvider>,
    )
    expect(screen.queryByTestId('cost-range')).not.toBeInTheDocument()
    expect(screen.queryByTestId('cost-as-of')).not.toBeInTheDocument()
    // No map passed → the slug is shown.
    expect(screen.getByTestId('cost-unpriced')).toHaveTextContent('saffron')
    expect(screen.getByText(en.priceBasisNote)).toBeInTheDocument()
  })
})

describe('panelFormat', () => {
  it('formats whole numbers, euros and dates per language', () => {
    expect(formatWhole(582.55, 'en')).toBe('583')
    expect(formatWhole(1165.1, 'en')).toBe('1,165')
    expect(formatWhole(1165.1, 'el')).toBe('1.165')
    expect(formatEuro(2.1, 'en')).toBe('€2.10')
    expect(formatEuro(2.1, 'el')).toMatch(/^2,10\s?€$/)
    expect(formatIsoDate('2026-10-05', 'en')).toBe('5 October 2026')
    expect(formatIsoDate('2026-10-05', 'el')).toBe('5 Οκτωβρίου 2026')
    expect(formatIsoDate('not-a-date', 'en')).toBe('not-a-date')
  })

  it('energy share uses 4/4/9 and is null with no energy', () => {
    expect(energyShare({ kcal: 0, protein: 0, carbs: 0, fat: 0 })).toBeNull()
    expect(energyShare({ kcal: 170, protein: 10, carbs: 10, fat: 10 })).toEqual({
      protein: 24,
      carbs: 24,
      fat: 53,
    })
  })
})
