import type { Page } from '@playwright/test'
import { INGREDIENTS } from '../../src/content/seed/ingredients'
import { RECIPES } from '../../src/content/seed/recipes'
import { el, en } from '../../src/i18n/dictionary'
import { fill } from '../../src/i18n/fill'
import { expect, test } from '../support/fixtures'

// FRIDGE WORKFLOW on the PRODUCTION build (PLAN P3.7): empty state → three ingredients through the
// combobox → ranked results with a missing list and a substitution line → the staples toggle
// changes a coverage figure → a reload keeps the chips (localStorage) → English re-asserts.
//
// The scenario is pinned to the seed: egg + cherry tomatoes + feta against "Strapatsada" (tomato,
// olive oil, oregano, egg, feta, bread). Tomato is covered by its substitute (cherry tomatoes) and
// REPORTED as such; olive oil and oregano are pantry staples (ignored by default); bread is missing.
// Coverage therefore reads 3/4 = 75 % with staples ignored and 3/6 = 50 % with them counted.

const BASE = '/hygieia'

function ingredient(slug: string) {
  const row = INGREDIENTS.find((i) => i.slug === slug)
  if (!row) throw new Error(`seed: ingredient "${slug}" missing`)
  return row
}
const egg = ingredient('egg')
const cherry = ingredient('cherry-tomato')
const feta = ingredient('feta')
const tomato = ingredient('tomato')
const bread = ingredient('bread')
const strapatsada = RECIPES.find((r) => r.slug === 'strapatsada-tomato-scrambled-eggs')
if (!strapatsada) throw new Error('seed: recipe "strapatsada-tomato-scrambled-eggs" missing')

/**
 * Type the exact Greek name and CLICK the option whose primary label is exactly that name. (Not
 * Enter: the listbox opens under wherever the pointer rests, and a hovered option takes the
 * highlight — after clicking a chip's remove button, Enter would pick "Ασπράδι αυγού" for "Αυγό".)
 */
async function addIngredient(page: Page, name: string) {
  // Scoped to <main>: the header's theme switcher (src/components/SiteHeader.tsx) is a combobox too.
  const box = page.getByRole('main').getByRole('combobox')
  await box.fill(name)
  await expect(page.getByRole('listbox')).toBeVisible()
  await page
    .getByRole('option')
    .filter({ has: page.getByText(name, { exact: true }) })
    .first()
    .click()
  await expect(page.getByRole('list', { name: el.yourIngredients }).getByText(name)).toBeVisible()
}

const chips = (page: Page, label: string) =>
  page.getByRole('list', { name: label }).getByRole('listitem')

const resultCard = (page: Page, title: string) =>
  page.getByRole('article').filter({ has: page.getByRole('link', { name: title, exact: true }) })

test('empty fridge → three ingredients → ranked results, missing list, substitution, staples, reload, English', async ({
  page,
}) => {
  await page.goto(`${BASE}/fridge`)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(el.fridgeTitle)
  await expect(page.getByText(el.fridgeEmpty)).toBeVisible()
  await expect(page.getByText(el.fridgeEmptyHint)).toBeVisible()
  await expect(page.getByText(el.draftRibbon)).toBeVisible()
  // Saving is switched off in local-only mode, and says so.
  await expect(page.getByText(el.userDataUnavailableLocal)).toBeVisible()

  await addIngredient(page, egg.name_el)
  await addIngredient(page, cherry.name_el)
  await addIngredient(page, feta.name_el)
  await expect(chips(page, el.yourIngredients)).toHaveCount(3)
  await expect(page.getByText(el.fridgeEmpty)).toHaveCount(0)

  // Ranked results: an ordered list, coverage descending.
  const results = page.getByRole('list').filter({ has: page.getByRole('article') })
  const bars = results.getByRole('progressbar')
  expect(await bars.count()).toBeGreaterThan(1)
  const values = (await bars.evaluateAll((els) =>
    els.map((e) => Number(e.getAttribute('aria-valuenow'))),
  )) as number[]
  expect(values).toEqual([...values].sort((a, b) => b - a))

  const card = resultCard(page, strapatsada.title_el)
  await expect(card).toBeVisible()
  await expect(card.getByText(fill(el.youHave, { have: 3, total: 4 }))).toBeVisible()
  await expect(card.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '75')
  await expect(card.getByText(`${el.missing}: ${bread.name_el}`)).toBeVisible()
  await expect(
    card.getByText(fill(el.substitute, { missing: tomato.name_el, use: cherry.name_el })),
  ).toBeVisible()

  // Counting the staples (olive oil, oregano) as missing lowers the coverage figure.
  const staples = page.getByRole('checkbox')
  await expect(staples).toBeChecked()
  await staples.uncheck()
  await expect(card.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '50')
  await expect(card.getByText(fill(el.youHave, { have: 3, total: 6 }))).toBeVisible()
  await staples.check()
  await expect(card.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '75')

  // A reload keeps the fridge (localStorage), results re-derive.
  await page.reload()
  await expect(chips(page, el.yourIngredients)).toHaveCount(3)
  await expect(resultCard(page, strapatsada.title_el).getByRole('progressbar')).toHaveAttribute(
    'aria-valuenow',
    '75',
  )

  // English: headings, chips and the card title follow the language.
  await page.getByRole('button', { name: el.switchTo }).click()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(en.fridgeTitle)
  await expect(chips(page, en.yourIngredients)).toHaveCount(3)
  await expect(
    page.getByRole('list', { name: en.yourIngredients }).getByText(egg.name_en),
  ).toBeVisible()
  const cardEn = resultCard(page, strapatsada.title_en)
  await expect(cardEn.getByText(fill(en.youHave, { have: 3, total: 4 }))).toBeVisible()
  await expect(cardEn.getByText(`${en.missing}: ${bread.name_en}`)).toBeVisible()
  await expect(
    cardEn.getByText(fill(en.substitute, { missing: tomato.name_en, use: cherry.name_en })),
  ).toBeVisible()
  await expect(page.getByText(en.draftRibbon)).toBeVisible()
})

test('removing every chip returns to the empty state; "clear all" does too', async ({ page }) => {
  await page.goto(`${BASE}/fridge`)
  await addIngredient(page, egg.name_el)
  await expect(page.getByText(el.fridgeEmpty)).toHaveCount(0)

  await page.getByRole('button', { name: `${el.removeIngredient}: ${egg.name_el}` }).click()
  await expect(page.getByText(el.fridgeEmpty)).toBeVisible()

  await addIngredient(page, egg.name_el)
  await addIngredient(page, feta.name_el)
  await page.getByRole('button', { name: el.clearAll }).click()
  await expect(page.getByText(el.fridgeEmpty)).toBeVisible()
  await page.reload()
  await expect(page.getByText(el.fridgeEmpty)).toBeVisible()
})

test('a result card links to the recipe page', async ({ page }) => {
  await page.goto(`${BASE}/fridge`)
  await addIngredient(page, egg.name_el)
  await addIngredient(page, cherry.name_el)
  await addIngredient(page, feta.name_el)
  await page.getByRole('link', { name: strapatsada.title_el, exact: true }).click()
  await expect(page).toHaveURL(new RegExp(`${BASE}/recipes/${strapatsada.slug}$`))
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(strapatsada.title_el)
})
