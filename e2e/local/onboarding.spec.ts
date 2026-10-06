import { el } from '../../src/i18n/dictionary'
import { plural } from '../../src/i18n/fill'
import { pickOfTheDay } from '../../src/prefs/ofTheDay'
import { dietName } from '../../src/recipes/format'
import { OVERLAID_SEED } from '../../src/test/overlaidSeed'
import { expect, test } from '../support/fixtures'

// FIRST-VISIT PREFERENCES + RECIPE / TIP OF THE DAY on the PRODUCTION build (2026-10-06): the
// onboarding card appears on a first visit, its answers pre-filter /recipes, they survive a reload
// (localStorage `hygieia:prefs`), Skip keeps the card away, the footer reopens it, an explicit URL
// filter wins, and the two "of the day" cards render today's deterministic picks without moving
// the page (layout shift measured in the browser). Greek is the project locale.

// The seed AS SERVED (base + content overlays, src/content/seed/overlays/): the build is local-only,
// so the bundled seed with every overlay applied IS the content the pages render — and what the
// home page picks the recipe / tip of the day from (182 recipes since overlay 0003, not the 152 base).
const { diets: DIETS, recipes: RECIPES, health_tips: HEALTH_TIPS } = OVERLAID_SEED

const BASE = '/hygieia'
/** 6 Oct 2026, noon in Athens: the picks are computed for this day in node and in the page. */
const NOW = new Date('2026-10-06T09:00:00Z')

const vegetarian = DIETS.find((d) => d.slug === 'vegetarian')
const vegan = DIETS.find((d) => d.slug === 'vegan')
const keto = DIETS.find((d) => d.slug === 'keto')
if (!vegetarian || !vegan || !keto) throw new Error('seed: diets vegetarian / vegan / keto missing')
const VEGETARIAN_RECIPES = RECIPES.filter((r) => r.diet_slugs.includes('vegetarian'))

const onboarding = (page: import('@playwright/test').Page) =>
  page.getByRole('region', { name: el.prefsTitle })
const modules = (page: import('@playwright/test').Page) =>
  page.getByRole('region', { name: 'modules' }).getByRole('listitem')

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(NOW)
})

test('onboarding → the recipes page arrives pre-filtered; a reload keeps the preferences', async ({
  page,
}) => {
  await page.goto(`${BASE}/`)
  const card = onboarding(page)
  await expect(card).toBeVisible()
  await card.getByLabel(el.prefsGoalLabel).selectOption('build-strength')
  await card.getByLabel(el.prefsDietLabel).selectOption('vegetarian')
  await card.getByLabel(el.prefsActivityLabel).selectOption('high')
  await card.getByRole('button', { name: el.prefsSave }).click()
  await expect(card).toHaveCount(0)
  // The goal's module leads the grid at once.
  await expect(modules(page).first()).toContainText(el.modules.workouts.title)

  await page
    .getByRole('navigation', { name: el.nav.label })
    .getByRole('link', { name: el.nav.recipes })
    .click()
  await expect(page).toHaveURL(/\/recipes\?diet=vegetarian$/)
  await expect(
    page.getByRole('button', { name: dietName(vegetarian, 'el'), exact: true }),
  ).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByText(plural(el.resultsCount, VEGETARIAN_RECIPES.length))).toBeVisible()

  // Workouts open at the level the activity answer maps to.
  await page
    .getByRole('navigation', { name: el.nav.label })
    .getByRole('link', { name: el.nav.workouts })
    .click()
  await expect(
    page.getByRole('radiogroup', { name: el.pickLevel }).getByRole('radio', { checked: true }),
  ).toHaveText(el.levels.advanced)

  // Reload the home page: no onboarding, same order, preferences still stored.
  await page.goto(`${BASE}/`)
  await expect(page.getByTestId('recipe-of-the-day')).toBeVisible()
  await page.reload()
  await expect(page.getByTestId('tip-of-the-day')).toBeVisible()
  await expect(onboarding(page)).toHaveCount(0)
  await expect(modules(page).first()).toContainText(el.modules.workouts.title)
  const stored = await page.evaluate(() => window.localStorage.getItem('hygieia:prefs'))
  expect(JSON.parse(stored ?? 'null')).toEqual({
    goal: 'build-strength',
    diet: 'vegetarian',
    activity: 'high',
    skipped: false,
  })
})

test('Skip persists across a reload; "Change preferences" in the footer reopens the card', async ({
  page,
}) => {
  await page.goto(`${BASE}/`)
  await onboarding(page).getByRole('button', { name: el.prefsSkip }).click()
  await expect(onboarding(page)).toHaveCount(0)
  await page.reload()
  await expect(page.getByTestId('recipe-of-the-day')).toBeVisible()
  await expect(onboarding(page)).toHaveCount(0)
  // Nothing was chosen: the usual module order.
  await expect(modules(page).first()).toContainText(el.modules.tips.title)

  await page.goto(`${BASE}/tips`)
  await page.getByRole('link', { name: el.changePrefs }).click()
  // `<Link to="/?prefs=edit">` under basename /hygieia lands on /hygieia?prefs=edit (no slash).
  await expect(page).toHaveURL(/\/hygieia\/?\?prefs=edit$/)
  const card = onboarding(page)
  await expect(card).toBeVisible()
  await expect(card.getByLabel(el.prefsGoalLabel)).toBeFocused()
  await card.getByLabel(el.prefsGoalLabel).selectOption('skin')
  await card.getByRole('button', { name: el.prefsSave }).click()
  await expect(card).toHaveCount(0)
  await expect(page).toHaveURL(/\/hygieia\/?$/)
  await expect(modules(page).first()).toContainText(el.modules.skincare.title)
})

test('an explicit URL filter wins over the stored diet', async ({ page }) => {
  await page.goto(`${BASE}/`)
  await page.evaluate(() =>
    window.localStorage.setItem(
      'hygieia:prefs',
      JSON.stringify({ goal: null, diet: 'vegan', activity: null, skipped: false }),
    ),
  )
  await page.goto(`${BASE}/recipes?diet=keto`)
  await expect(
    page.getByRole('button', { name: dietName(keto, 'el'), exact: true }),
  ).toHaveAttribute('aria-pressed', 'true')
  await expect(
    page.getByRole('button', { name: dietName(vegan, 'el'), exact: true }),
  ).toHaveAttribute('aria-pressed', 'false')
  await expect(page).toHaveURL(/\/recipes\?diet=keto$/)
})

for (const [width, height] of [
  [1280, 720],
  [360, 740],
] as const) {
  test(`the recipe and tip of the day render today's picks without shifting the page (${width} px)`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height })
    // Every layout shift from the first byte (buffered), as Lighthouse's CLS would see it — keeping
    // only those that move something in the extras slot or the module grid below it (the webfont
    // swap reflows the header and the hero on its own; that is not this feature's to prove).
    await page.addInitScript(() => {
      const w = window as unknown as { __shift: number }
      w.__shift = 0
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const shift = entry as PerformanceEntry & {
            value: number
            hadRecentInput: boolean
            sources?: { node?: Node | null }[]
          }
          const ours = (shift.sources ?? []).some((source) => {
            const node = source.node
            const element = node instanceof Element ? node : (node?.parentElement ?? null)
            return element?.closest('[data-home-extras], section[aria-label="modules"]') != null
          })
          if (!shift.hadRecentInput && ours) w.__shift += shift.value
        }
      }).observe({ type: 'layout-shift', buffered: true })
    })
    await page.goto(`${BASE}/`)

    const recipe = pickOfTheDay(RECIPES, NOW, 'recipe')
    const tip = pickOfTheDay(HEALTH_TIPS, NOW, 'tip')
    if (recipe === null || tip === null) throw new Error('seed lists are not empty')

    const recipeCard = page.getByTestId('recipe-of-the-day')
    await expect(recipeCard.getByText(el.recipeOfTheDay)).toBeVisible()
    const recipeLink = recipeCard.getByRole('link', { name: recipe.title_el })
    await expect(recipeLink).toBeVisible()
    const tipCard = page.getByTestId('tip-of-the-day')
    await expect(tipCard.getByText(tip.title_el)).toBeVisible()
    await expect(tipCard.getByRole('link')).toHaveAttribute(
      'href',
      `${BASE}/tips?topic=${tip.topic}`,
    )
    await expect(onboarding(page)).toBeVisible()

    const shift = await page.evaluate(() => (window as unknown as { __shift: number }).__shift)
    expect(shift, 'layout shift of the extras slot and the module grid').toBe(0)

    await recipeLink.click()
    await expect(page).toHaveURL(new RegExp(`/recipes/${recipe.slug}$`))
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(recipe.title_el)
  })
}
