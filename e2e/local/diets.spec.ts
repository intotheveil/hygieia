import { DIETS } from '../../src/content/seed/diets'
import { el, en } from '../../src/i18n/dictionary'
import { expect, test } from '../support/fixtures'

// DIETS + PLAN WORKFLOW on the PRODUCTION build (PLAN P4.12): list → detail → the week plan
// (generated on load: 7 days × 3 meals = 21 slots; "reshuffle" regenerates it) → shopping list;
// both languages. A deep link to a diet is a 404 DOCUMENT that renders the diet (PLAN §4).

const BASE = '/hygieia'
const keto = DIETS.find((d) => d.slug === 'keto')
if (!keto) throw new Error('seed: diet "keto" missing')

test('list → keto detail → 21 plan slots → reshuffle → shopping list', async ({ page }) => {
  await page.goto(`${BASE}/diets`)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(el.dietsTitle)
  await expect(page.getByText(el.dietsIntro)).toBeVisible()
  await expect(page.getByRole('heading', { level: 2, name: keto.name_el })).toBeVisible()
  expect(await page.getByRole('link', { name: new RegExp(`^${el.viewDiet}: `) }).count()).toBe(
    DIETS.length,
  )

  await page.getByRole('link', { name: `${el.viewDiet}: ${keto.name_el}`, exact: true }).click()
  await expect(page).toHaveURL(new RegExp(`${BASE}/diets/keto$`))
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(keto.name_el)
  await expect(page.getByText(el.draftRibbon)).toBeVisible()
  await expect(page.getByRole('heading', { level: 2, name: el.whatItIs })).toBeVisible()
  await expect(page.getByRole('heading', { level: 2, name: el.recipesForDiet })).toBeVisible()
  await expect(
    page.getByRole('navigation', { name: el.nav.label }).getByRole('link', { name: el.nav.diets }),
  ).toHaveAttribute('aria-current', 'page')

  // The plan: generated on load, 21 slots, a table with 7 day rows.
  await expect(page.getByRole('heading', { level: 2, name: el.generatePlan })).toBeVisible()
  await expect(page.getByTestId('plan-slot')).toHaveCount(21)
  await expect(page.getByRole('table').getByRole('rowheader')).toHaveCount(7)
  for (const day of el.dayNames) {
    await expect(page.getByRole('rowheader', { name: day, exact: true })).toBeVisible()
  }
  // Saving is off in local-only mode, and says so; reshuffling regenerates (the seed changes).
  await expect(page.getByText(el.userDataUnavailableLocal)).toBeVisible()
  const plan = page.locator('[data-seed]')
  const seedBefore = await plan.getAttribute('data-seed')
  await page.getByRole('button', { name: el.reshuffle }).click()
  await expect(plan).not.toHaveAttribute('data-seed', seedBefore ?? '')
  await expect(page.getByTestId('plan-slot')).toHaveCount(21)

  // Shopping list: a heading and at least one quantity line.
  await expect(page.getByRole('heading', { level: 3, name: el.shoppingList })).toBeVisible()
  const shopping = page.locator('section[aria-labelledby="plan-shopping"]').getByRole('listitem')
  expect(await shopping.count()).toBeGreaterThan(0)
})

test('a hard load of /diets/<slug> is a 404 DOCUMENT that renders the diet; English re-renders it', async ({
  page,
}) => {
  const response = await page.goto(`${BASE}/diets/${keto.slug}`)
  expect(response?.status()).toBe(404)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(keto.name_el)
  await expect(page.getByTestId('plan-slot')).toHaveCount(21)

  await page.getByRole('button', { name: el.switchTo }).click()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(keto.name_en)
  await expect(page.getByRole('heading', { level: 2, name: en.whatItIs })).toBeVisible()
  await expect(page.getByRole('heading', { level: 2, name: en.generatePlan })).toBeVisible()
  await expect(page.getByRole('heading', { level: 3, name: en.shoppingList })).toBeVisible()
  await expect(page.getByRole('button', { name: en.reshuffle })).toBeVisible()
  for (const day of en.dayNames) {
    await expect(page.getByRole('rowheader', { name: day, exact: true })).toBeVisible()
  }
  await expect(page.getByText(en.draftRibbon)).toBeVisible()
  await expect(page.getByText(en.notMedicalAdvice).first()).toBeVisible()
})

test('an unknown diet slug renders the in-app not-found', async ({ page }) => {
  await page.goto(`${BASE}/diets/no-such-diet`)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(el.notFoundTitle)
  await expect(page.getByRole('link', { name: el.backHome })).toBeVisible()
})
