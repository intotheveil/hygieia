import { OVERLAID_SEED } from '../../src/test/overlaidSeed'
import { el, en } from '../../src/i18n/dictionary'
import { plural } from '../../src/i18n/fill'
import { dietName } from '../../src/recipes/format'
import { expect, test } from '../support/fixtures'

// The seed AS SERVED (base + content overlays, src/content/seed/overlays/): the build is local-only,
// so the bundled seed with every overlay applied IS the content the pages render.
const { diets: DIETS, recipes: RECIPES } = OVERLAID_SEED

// RECIPES WORKFLOW on the PRODUCTION build (PLAN P3.7): list → keto filter → a card → the detail
// page (steps + draft ribbon); a deep link to a recipe is a 404 DOCUMENT that renders the recipe;
// an unknown slug renders the in-app not-found; a query with no match shows `noRecipesMatch`; the
// language toggle re-renders the headings in English. Every string is a dictionary VALUE and every
// slug/title comes from the bundled seed (the build is local-only, so the seed IS the content).
// Assertions are on the rendered app, never on response.ok() (PLAN §4).

const BASE = '/hygieia'

const keto = DIETS.find((d) => d.slug === 'keto')
if (!keto) throw new Error('seed: diet "keto" missing')
const KETO_RECIPES = RECIPES.filter((r) => r.diet_slugs.includes('keto'))
const bacon = RECIPES.find((r) => r.slug === 'carnivore-bacon-and-eggs')
if (!bacon) throw new Error('seed: recipe "carnivore-bacon-and-eggs" missing')

const cards = (page: import('@playwright/test').Page, title: string) =>
  page.getByRole('list', { name: title }).getByRole('listitem')

test('list → filter keto → open a card → steps and the draft ribbon', async ({ page }) => {
  await page.goto(`${BASE}/recipes`)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(el.recipesTitle)
  await expect(page.getByText(el.draftRibbon)).toBeVisible()
  await expect(cards(page, el.recipesTitle)).toHaveCount(RECIPES.length)

  const ketoChip = page.getByRole('button', { name: dietName(keto, 'el'), exact: true })
  await ketoChip.click()
  await expect(ketoChip).toHaveAttribute('aria-pressed', 'true')
  await expect(page).toHaveURL(/[?&]diet=keto(&|$)/)
  await expect(page.getByText(plural(el.resultsCount, KETO_RECIPES.length))).toBeVisible()
  await expect(cards(page, el.recipesTitle)).toHaveCount(KETO_RECIPES.length)

  // Every card shown is a keto recipe (chip text from the diet catalogue, not the slug).
  for (const card of await cards(page, el.recipesTitle).all()) {
    await expect(card.getByText(dietName(keto, 'el'), { exact: true })).toBeVisible()
  }

  const first = cards(page, el.recipesTitle).first().getByRole('link')
  const title = (await first.textContent()) ?? ''
  await first.click()

  await expect(page).toHaveURL(new RegExp(`${BASE}/recipes/[a-z0-9-]+$`))
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(title)
  await expect(page.getByRole('heading', { level: 2, name: el.steps })).toBeVisible()
  await expect(page.getByRole('heading', { level: 2, name: el.ingredients })).toBeVisible()
  await expect(page.locator('ol > li').first()).toBeVisible()
  await expect(page.getByText(el.draftRibbon)).toBeVisible()
  // The header nav marks Recipes current on the detail page too (prefix match).
  await expect(
    page
      .getByRole('navigation', { name: el.nav.label })
      .getByRole('link', { name: el.nav.recipes }),
  ).toHaveAttribute('aria-current', 'page')
})

test('a hard load of /recipes/<slug> is a 404 DOCUMENT that renders the recipe', async ({
  page,
}) => {
  const response = await page.goto(`${BASE}/recipes/${bacon.slug}`)
  expect(response?.status()).toBe(404)

  await expect(page.getByRole('heading', { level: 1 })).toHaveText(bacon.title_el)
  await expect(page.getByRole('heading', { level: 2, name: el.steps })).toBeVisible()
  await expect(page.getByText(el.draftRibbon)).toBeVisible()
  expect(new URL(page.url()).pathname).toBe(`${BASE}/recipes/${bacon.slug}`)
  // The favourite button explains itself in local-only mode instead of failing silently.
  await page.getByRole('button', { name: el.addToFavourites }).click()
  await expect(page.getByText(el.userDataUnavailableLocal)).toBeVisible()
})

test('an unknown slug renders the in-app not-found inside the frame', async ({ page }) => {
  await page.goto(`${BASE}/recipes/no-such-recipe-xyz`)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(el.notFoundTitle)
  await expect(page.getByText(el.notFoundBody)).toBeVisible()
  await expect(page.getByRole('navigation', { name: el.nav.label })).toBeVisible()
  await page.getByRole('link', { name: el.backHome }).click()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(el.heroTitle)
})

test('a search with no match shows the empty copy, clearing restores the list', async ({
  page,
}) => {
  await page.goto(`${BASE}/recipes`)
  await page.getByLabel(el.searchRecipes).fill('zzqqxxvv')
  await expect(page).toHaveURL(/[?&]q=zzqqxxvv/)
  await expect(page.getByText(el.noRecipesMatch)).toBeVisible()
  await expect(page.getByText(plural(el.resultsCount, 0))).toBeVisible()

  await page.getByRole('button', { name: el.clearFilters }).click()
  await expect(cards(page, el.recipesTitle)).toHaveCount(RECIPES.length)
})

test('switching to English re-renders the list headings, chips and cards', async ({ page }) => {
  await page.goto(`${BASE}/recipes?diet=keto`)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(el.recipesTitle)

  await page.getByRole('button', { name: el.switchTo }).click()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(en.recipesTitle)
  await expect(page.getByText(en.filterByDiet)).toBeVisible()
  await expect(page.getByText(en.filterByMeal)).toBeVisible()
  await expect(
    page.getByRole('button', { name: dietName(keto, 'en'), exact: true }),
  ).toHaveAttribute('aria-pressed', 'true')
  await expect(cards(page, en.recipesTitle)).toHaveCount(KETO_RECIPES.length)
  await expect(page.getByText(en.draftRibbon)).toBeVisible()
  // The filter survived the language switch: it lives in the URL.
  await expect(page).toHaveURL(/[?&]diet=keto/)
})
