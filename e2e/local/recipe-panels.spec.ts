import { RECIPES } from '../../src/content/seed/recipes'
import { el, en } from '../../src/i18n/dictionary'
import { expect, test } from '../support/fixtures'

// NUTRITION + COST PANELS on a recipe page, PRODUCTION build (PLAN P4.12 / P4.3): both panels are
// visible on a seeded recipe; the shared per-portion / per-recipe toggle (`aria-pressed`) changes
// the kcal figure AND the cost range; the prices as-of date is present; the panel headings are the
// dictionary values in both languages.
//
// Whitespace is normalised before comparing: `Intl.NumberFormat('el-GR', { style: 'currency' })`
// puts a NO-BREAK SPACE before "€", and a text assertion that compares raw strings fails on it.

const BASE = '/hygieia'
const norm = (s: string | null) => (s ?? '').replace(/\s+/g, ' ').trim()

// A 2-portion recipe, so per-recipe figures differ from per-portion ones.
const recipe = RECIPES.find((r) => r.slug === 'carnivore-bacon-and-eggs')
if (!recipe) throw new Error('seed: recipe "carnivore-bacon-and-eggs" missing')
if (recipe.portions < 2) throw new Error('the scenario needs a recipe with ≥ 2 portions')

test('both panels render; the scope toggle changes kcal and the cost range; as-of date present', async ({
  page,
}) => {
  await page.goto(`${BASE}/recipes/${recipe.slug}`)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(recipe.title_el)

  const nutrition = page.getByTestId('nutrition-panel')
  const cost = page.getByTestId('cost-panel')
  await expect(nutrition).toBeVisible()
  await expect(cost).toBeVisible()
  await expect(page.locator('h2#recipe-nutrition')).toHaveText(el.nutritionTitle)
  await expect(page.locator('h2#recipe-cost')).toHaveText(el.costTitle)
  await expect(page.getByText(el.typicalValuesNote)).toBeVisible()
  await expect(page.getByText(el.priceBasisNote)).toBeVisible()

  const asOf = page.getByTestId('cost-as-of')
  await expect(asOf).toBeVisible()
  // `pricesAsOf` is "Prices as of {date}": the literal part before the placeholder must be there.
  expect(norm(await asOf.textContent())).toContain(norm(el.pricesAsOf.split('{date}')[0] ?? ''))

  const portion = page.getByTestId('scope-portion')
  const whole = page.getByTestId('scope-recipe')
  await expect(portion).toHaveAttribute('aria-pressed', 'true')
  await expect(whole).toHaveAttribute('aria-pressed', 'false')
  await expect(portion).toHaveText(el.perPortion)
  await expect(whole).toHaveText(el.perRecipe)

  const kcalPerPortion = norm(await page.getByTestId('nutrition-kcal').textContent())
  const costPerPortion = norm(await page.getByTestId('cost-range').textContent())
  expect(kcalPerPortion).toMatch(/\d/)
  expect(costPerPortion).toContain('€')

  await whole.click()
  await expect(whole).toHaveAttribute('aria-pressed', 'true')
  await expect(portion).toHaveAttribute('aria-pressed', 'false')
  await expect
    .poll(async () => norm(await page.getByTestId('nutrition-kcal').textContent()))
    .not.toBe(kcalPerPortion)
  await expect
    .poll(async () => norm(await page.getByTestId('cost-range').textContent()))
    .not.toBe(costPerPortion)

  // Per recipe = portions × per portion for the kcal figure (integers, rounding tolerance 1 per portion).
  const perPortionKcal = Number(kcalPerPortion.replace(/[^\d]/g, ''))
  const perRecipeKcal = Number(
    norm(await page.getByTestId('nutrition-kcal').textContent()).replace(/[^\d]/g, ''),
  )
  expect(Math.abs(perRecipeKcal - perPortionKcal * recipe.portions)).toBeLessThanOrEqual(
    recipe.portions,
  )

  // Back to per portion restores the figures.
  await portion.click()
  await expect(portion).toHaveAttribute('aria-pressed', 'true')
  await expect
    .poll(async () => norm(await page.getByTestId('nutrition-kcal').textContent()))
    .toBe(kcalPerPortion)
  await expect
    .poll(async () => norm(await page.getByTestId('cost-range').textContent()))
    .toBe(costPerPortion)
})

test('the panel headings and toggle labels follow the language', async ({ page }) => {
  await page.goto(`${BASE}/recipes/${recipe.slug}`)
  await expect(page.locator('h2#recipe-nutrition')).toHaveText(el.nutritionTitle)
  await expect(page.locator('h2#recipe-cost')).toHaveText(el.costTitle)

  await page.getByRole('button', { name: el.switchTo }).click()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(recipe.title_en)
  await expect(page.locator('h2#recipe-nutrition')).toHaveText(en.nutritionTitle)
  await expect(page.locator('h2#recipe-cost')).toHaveText(en.costTitle)
  await expect(page.getByTestId('scope-portion')).toHaveText(en.perPortion)
  await expect(page.getByTestId('scope-recipe')).toHaveText(en.perRecipe)
  await expect(page.getByText(en.typicalValuesNote)).toBeVisible()
  await expect(page.getByText(en.priceBasisNote)).toBeVisible()
  await expect(page.getByTestId('cost-range')).toContainText('€')
  expect(norm(await page.getByTestId('cost-as-of').textContent())).toContain(
    norm(en.pricesAsOf.split('{date}')[0] ?? ''),
  )
})
