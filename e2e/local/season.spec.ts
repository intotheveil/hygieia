import { inSeasonSlugs } from '../../src/content/seasonal'
import { el } from '../../src/i18n/dictionary'
import { fill, plural } from '../../src/i18n/fill'
import { inSeasonCount } from '../../src/recipes/filter'
import { OVERLAID_SEED } from '../../src/test/overlaidSeed'
import { expect, test } from '../support/fixtures'

// SEASONAL PRODUCE on the PRODUCTION build (overlay 0003 follow-up, 2026-10-06): the "What's in
// season" strip on /recipes and /fridge, its chips (→ /recipes?ingredient=<slug>) and the
// `?season=now` filter (≥ 2 in-season ingredients, most seasonal first). The clock is pinned to
// mid-October so the month, the chips and the counts are deterministic.

const BASE = '/hygieia'
const OCTOBER = new Date('2026-10-15T12:00:00')
const oct = inSeasonSlugs(10)
const SEASONAL = OVERLAID_SEED.recipes.filter((r) => inSeasonCount(r, oct) >= 2)
const WITH_PUMPKIN = OVERLAID_SEED.recipes.filter((r) =>
  r.ingredients.some((l) => l.ingredient_slug === 'pumpkin'),
)

const strip = (page: import('@playwright/test').Page) =>
  page.getByRole('list', { name: el.seasonChipsLabel })

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(OCTOBER)
})

test('/recipes: the October strip, then ?season=now narrows to seasonal recipes', async ({
  page,
}) => {
  await page.goto(`${BASE}/recipes`)
  await expect(
    page.getByRole('heading', { level: 2, name: fill(el.seasonTitle, { month: 'Οκτώβριος' }) }),
  ).toBeVisible()
  await expect(strip(page).getByRole('link', { name: 'Κολοκύθα' })).toHaveAttribute(
    'href',
    `${BASE}/recipes?ingredient=pumpkin`,
  )

  expect(SEASONAL.length).toBeGreaterThan(0)
  await strip(page).getByRole('link', { name: el.seasonRecipesLink }).click()
  await expect(page).toHaveURL(/[?&]season=now(&|$)/)
  await expect(page.getByText(el.seasonFilterNote)).toBeVisible()
  await expect(page.getByText(plural(el.resultsCount, SEASONAL.length))).toBeVisible()
  await expect(page.getByRole('list', { name: el.recipesTitle }).getByRole('listitem')).toHaveCount(
    SEASONAL.length,
  )
})

test('/fridge: a strip chip opens the recipes that use that ingredient', async ({ page }) => {
  await page.goto(`${BASE}/fridge`)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(el.fridgeTitle)
  expect(WITH_PUMPKIN.length).toBeGreaterThan(0)
  await strip(page).getByRole('link', { name: 'Κολοκύθα' }).click()
  await expect(page).toHaveURL(/\/recipes\?ingredient=pumpkin$/)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(el.recipesTitle)
  await expect(page.getByRole('list', { name: el.recipesTitle }).getByRole('listitem')).toHaveCount(
    WITH_PUMPKIN.length,
  )
  await expect(strip(page).getByRole('link', { name: 'Κολοκύθα' })).toHaveAttribute(
    'aria-current',
    'page',
  )
})
