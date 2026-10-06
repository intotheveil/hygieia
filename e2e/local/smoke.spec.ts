import { NAV_IDS, el, en } from '../../src/i18n/dictionary'
import { expect, test } from '../support/fixtures'

// Smoke of the shell on the PRODUCTION build (PLAN P3.6; header/nav from P3.5), served by
// e2e/support/pages-server.mjs with GitHub Pages semantics at the project-site base `/hygieia/`:
// a file, else dist/404.html WITH status 404. A deep link is therefore EXPECTED to be a 404
// DOCUMENT; the assertions are on the rendered app, never on response.ok() (PLAN §4). If
// dist/404.html is missing, the server answers plain text, the app never boots and the deep-link
// tests go red.
//
// Every string is asserted against the dictionary VALUE (src/i18n/dictionary.ts), so a copy change
// in one place cannot leave a stale literal here. The project runs with `locale: 'el-GR'`
// (playwright.config.ts): LangProvider picks Greek from navigator.language when nothing is stored.

const BASE = '/hygieia'

test('/ renders the Greek shell: hero H1, lang="el", the toggle offers English', async ({
  page,
}) => {
  const response = await page.goto(`${BASE}/`)
  expect(response?.status()).toBe(200)

  await expect(page.getByRole('heading', { level: 1 })).toHaveText(el.heroTitle)
  await expect(page.locator('html')).toHaveAttribute('lang', 'el')
  await expect(page.getByRole('button', { name: el.switchTo })).toBeVisible()
  await expect(page.getByText(el.notMedicalAdvice)).toBeVisible()
  await expect(page.getByText(el.statusTitle)).toBeVisible()
  await expect(page.getByText(el.statusBody)).toBeVisible()
})

test('the header nav lists the six modules on every route and marks the current one', async ({
  page,
}) => {
  await page.goto(`${BASE}/`)
  const nav = page.getByRole('banner').getByRole('navigation', { name: el.nav.label })
  await expect(nav.getByRole('link')).toHaveText(NAV_IDS.map((id) => el.nav[id]))
  await expect(nav.getByRole('link', { name: el.nav.recipes, exact: true })).toHaveAttribute(
    'href',
    `${BASE}/recipes`,
  )
  await expect(nav.locator('[aria-current="page"]')).toHaveCount(0)

  // Client-side navigation through the nav: the URL moves, the page renders, the item is current.
  await nav.getByRole('link', { name: el.nav.fridge, exact: true }).click()
  await expect(page).toHaveURL(new RegExp(`${BASE}/fridge$`))
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(el.fridgeTitle)
  await expect(nav.getByRole('link', { name: el.nav.fridge, exact: true })).toHaveAttribute(
    'aria-current',
    'page',
  )
  await expect(nav.locator('[aria-current="page"]')).toHaveCount(1)

  // The brand link goes home.
  await page
    .getByRole('banner')
    .getByRole('link', { name: /Hygieia/ })
    .click()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(el.heroTitle)

  // The nav is on the not-found page too (Layout wraps the `*` route).
  await page.goto(`${BASE}/no/such/page`)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(el.notFoundTitle)
  await expect(
    page.getByRole('banner').getByRole('navigation', { name: el.nav.label }),
  ).toBeVisible()
})

test('the home module cards link into their modules', async ({ page }) => {
  await page.goto(`${BASE}/`)
  const modules = page.getByRole('region', { name: 'modules' })
  await expect(modules.getByRole('listitem')).toHaveCount(8)
  const expected: Record<string, string> = {
    [el.modules.tips.title]: '/tips',
    [el.modules.diets.title]: '/diets',
    [el.modules.recipes.title]: '/recipes',
    [el.modules.cost.title]: '/recipes',
    [el.modules.calories.title]: '/recipes',
    [el.modules.workouts.title]: '/workouts',
    [el.modules.skincare.title]: '/skincare',
    [el.modules.tasks.title]: '/tasks',
  }
  for (const [title, path] of Object.entries(expected)) {
    await expect(modules.getByRole('link', { name: title, exact: true })).toHaveAttribute(
      'href',
      `${BASE}${path}`,
    )
  }
  await expect(modules.getByRole('link', { name: new RegExp(el.fridgeLink) })).toHaveAttribute(
    'href',
    `${BASE}/fridge`,
  )
  await expect(modules.getByText(el.roadmap)).toHaveCount(0)

  await modules.getByRole('link', { name: el.modules.workouts.title, exact: true }).click()
  await expect(page).toHaveURL(new RegExp(`${BASE}/workouts$`))
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(el.workoutsTitle)
})

test('the language toggle switches to English, sets <html lang="en"> and survives a reload', async ({
  page,
}) => {
  await page.goto(`${BASE}/`)
  await page.getByRole('button', { name: el.switchTo }).click()

  await expect(page.getByRole('heading', { level: 1 })).toHaveText(en.heroTitle)
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  await expect(page.getByRole('button', { name: en.switchTo })).toBeVisible()
  await expect(
    page.getByRole('banner').getByRole('navigation', { name: en.nav.label }).getByRole('link'),
  ).toHaveText(NAV_IDS.map((id) => en.nav[id]))

  // The choice is persisted (localStorage), so a reload stays in English.
  await page.reload()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(en.heroTitle)
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')
})

test.describe('an English browser', () => {
  test.use({ locale: 'en-US' })
  test('gets the English shell by default', async ({ page }) => {
    await page.goto(`${BASE}/`)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(en.heroTitle)
    await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  })
})

test('a hard load of an unknown deep link is a 404 DOCUMENT that renders the in-app not-found', async ({
  page,
}) => {
  const response = await page.goto(`${BASE}/no/such/page`)
  // The fallback path, not a rewrite: the document itself is the 404.html copy of the app.
  expect(response?.status()).toBe(404)

  await expect(page.getByRole('heading', { level: 1 })).toHaveText(el.notFoundTitle)
  await expect(page.getByText(el.notFoundBody)).toBeVisible()
  // The URL is untouched: the router read the route from it, nothing rewrote it.
  expect(new URL(page.url()).pathname).toBe(`${BASE}/no/such/page`)

  // The app shell booted (a way home works), not a bare server error page.
  await page.getByRole('link', { name: el.backHome }).click()
  // Client-side `<Link to="/">` under basename `/hygieia` lands on `/hygieia` (no trailing slash);
  // a hard load of that URL is the 301 to `/hygieia/`. Both spell the home route.
  await expect(page).toHaveURL(new RegExp(`${BASE}/?$`))
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(el.heroTitle)
})

test('/auth on the local-only build shows the sign-in-unavailable state (deep link, 404 document)', async ({
  page,
}) => {
  const response = await page.goto(`${BASE}/auth`)
  expect(response?.status()).toBe(404)

  await expect(page.getByRole('heading', { level: 1 })).toHaveText(el.signInUnavailableTitle)
  await expect(page.getByText(el.signInUnavailableBody)).toBeVisible()
  await expect(page.getByRole('link', { name: el.backHome })).toBeVisible()
})

test('the document links the PWA manifest and the service-worker registration', async ({
  page,
}) => {
  await page.goto(`${BASE}/`)

  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute(
    'href',
    `${BASE}/manifest.webmanifest`,
  )
  await expect(page.locator(`script[src="${BASE}/registerSW.js"]`)).toHaveCount(1)

  const manifest = await page.request.get(`${BASE}/manifest.webmanifest`)
  expect(manifest.status()).toBe(200)
  const body = (await manifest.json()) as { start_url?: string; scope?: string }
  expect(body.start_url).toBe(`${BASE}/`)
  expect(body.scope).toBe(`${BASE}/`)
})

test('the server has Pages semantics: 404.html = index.html, /hygieia -> /hygieia/, outside the base no app', async ({
  page,
}) => {
  // dist/404.html must be a byte copy of index.html (vite.config.ts spaFallback): both served as
  // files, so compare the bodies.
  const [index, notFound] = await Promise.all([
    page.request.get(`${BASE}/index.html`),
    page.request.get(`${BASE}/404.html`),
  ])
  expect(index.status()).toBe(200)
  expect(notFound.status()).toBe(200)
  expect(await notFound.text()).toBe(await index.text())

  // A directory without the trailing slash redirects, as Pages does.
  const bare = await page.request.get(BASE, { maxRedirects: 0 })
  expect(bare.status()).toBe(301)
  expect(bare.headers()['location']).toBe(`${BASE}/`)

  // Outside the project-site base nothing of this app is served: no 404.html fallback, no boot.
  const outside = await page.request.get('/no/such/page')
  expect(outside.status()).toBe(404)
  expect(await outside.text()).not.toContain('<div id="root">')
})
