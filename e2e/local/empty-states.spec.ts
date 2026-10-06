import { OVERLAID_SEED } from '../../src/test/overlaidSeed'
import { el } from '../../src/i18n/dictionary'
import { plural } from '../../src/i18n/fill'
import { expect, test } from '../support/fixtures'

// The seed AS SERVED (base + content overlays, src/content/seed/overlays/): the build is local-only,
// so the bundled seed with every overlay applied IS the content the pages render.
const { recipes: RECIPES } = OVERLAID_SEED

// EMPTY STATES on the PRODUCTION build (PLAN P5.1), through the shared EmptyState
// (src/components/AsyncState.tsx): a DEEP LINK into a filter nothing matches renders
// `noRecipesMatch` with the filter intact in the URL and the chips, and an empty fridge renders
// `fridgeEmpty` + its hint with no result list. (recipes.spec.ts reaches the same recipes state by
// typing; this is the hard-load path.) Strings are dictionary VALUES; the project is Greek-first.

const BASE = '/hygieia'

test('/recipes?diet=keto&q=zzzz (deep link) renders noRecipesMatch with the filter kept', async ({
  page,
}) => {
  await page.goto(`${BASE}/recipes?diet=keto&q=zzzz`)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(el.recipesTitle)
  await expect(page.getByText(el.noRecipesMatch)).toBeVisible()
  await expect(page.getByText(plural(el.resultsCount, 0))).toBeVisible()
  await expect(page.getByRole('list', { name: el.recipesTitle })).toHaveCount(0)
  // The filter survived the hard load: URL, search box, pressed chip.
  await expect(page).toHaveURL(/[?&]diet=keto/)
  await expect(page.getByLabel(el.searchRecipes)).toHaveValue('zzzz')
  await expect(page.getByRole('button', { pressed: true })).toHaveCount(1)

  await page.getByRole('button', { name: el.clearFilters }).click()
  await expect(page.getByText(el.noRecipesMatch)).toHaveCount(0)
  await expect(page.getByRole('list', { name: el.recipesTitle }).getByRole('listitem')).toHaveCount(
    RECIPES.length,
  )
})

test('an empty fridge renders fridgeEmpty + hint and no result', async ({ page }) => {
  await page.goto(`${BASE}/fridge`)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(el.fridgeTitle)
  await expect(page.getByText(el.fridgeEmpty)).toBeVisible()
  await expect(page.getByText(el.fridgeEmptyHint)).toBeVisible()
  await expect(page.getByRole('progressbar')).toHaveCount(0)
  await expect(page.getByRole('list', { name: el.yourIngredients })).toHaveCount(0)
})
