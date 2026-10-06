import { OVERLAID_SEED } from '../../src/test/overlaidSeed'
import type { Page } from '@playwright/test'
import { el } from '../../src/i18n/dictionary'
import { expect, test, type ConsoleEntry } from '../support/fixtures'

// The seed AS SERVED (base + content overlays, src/content/seed/overlays/): the build is local-only,
// so the bundled seed with every overlay applied IS the content the pages render.
const { diets: DIETS, recipes: RECIPES } = OVERLAID_SEED

// Offline / PWA behaviour on the PRODUCTION build (PLAN P5.4). vite.config.ts registers a Workbox
// service worker (`registerType: 'autoUpdate'`, explicit `clientsClaim` + `skipWaiting`) that
// precaches every built js/css/html/svg/png/jpg/webp/woff2/webmanifest and answers any navigation
// with the precached `/hygieia/index.html` (`navigateFallback`). Since P5.3 every page is a
// `React.lazy` chunk and every seed table is its own lazy chunk (src/content/bundled.ts), so
// "bundled content works offline" is only true if THOSE chunks are in the precache — which is what
// this spec proves the only way that counts: the browser is taken offline, then a content route is
// reached client-side (page chunk + seed chunks fetched offline) and another is hard-loaded
// (document + chunks fetched offline).
//
// One serial flow, not independent tests: a service worker only exists after an ONLINE load has
// installed it, and every later step depends on that state. Each numbered step is a `test.step`.
//
// Fonts are self-hosted and precached (src/index.css, P5.3), so nothing offline may fail to load:
// the house console watchdog (e2e/support/fixtures.ts) runs unnarrowed — a chunk that is NOT in the
// precache fails its request offline, Chromium logs `net::ERR_INTERNET_DISCONNECTED` as a console
// error, and the test fails. That is a real finding about `workbox.globPatterns`, never something
// to filter.
//
// Strings are asserted against dictionary VALUES (src/i18n/dictionary.ts); the project runs with
// `locale: 'el-GR'` so the Greek shell is what renders. Seed counts come from the bundled seed
// modules (the build is local-only, so the seed IS the content).

const BASE = '/hygieia'

/** Resolves once a service worker is active AND controls `page` (clientsClaim on the first load). */
async function waitForControllingServiceWorker(page: Page): Promise<void> {
  await page.evaluate(() => navigator.serviceWorker.ready)
  await expect
    .poll(() => page.evaluate(() => navigator.serviceWorker.controller !== null), {
      message: 'a service worker controls the page',
      timeout: 10_000,
    })
    .toBe(true)
}

/**
 * A page-side fetch that MUST reach the server: `?probe=` misses the precache (Workbox ignores only
 * `utm_*`/`fbclid` parameters), so the service worker passes it through to the network. Only
 * called online: offline it would reject AND log a console error of its own.
 */
function networkProbe(page: Page): Promise<number> {
  return page.evaluate(
    (url) => fetch(url, { cache: 'no-store' }).then((r) => r.status),
    `${BASE}/index.html?probe=${Date.now()}`,
  )
}

const recipeCards = (page: Page) =>
  page.getByRole('list', { name: el.recipesTitle }).getByRole('listitem')
// DietsPage's <ul> has no accessible name; its one link per card does (diets.spec.ts counts the same).
const dietLinks = (page: Page) => page.getByRole('link', { name: new RegExp(`^${el.viewDiet}: `) })

// Recipe photos are runtime-cached, never precached (vite.config.ts, 2026-10-06): offline, a photo
// this browser never viewed cannot load, and Chromium logs that as a console error. That is the
// designed behaviour (the card keeps its reserved 4:3 box), so ONLY those lines are dropped from
// the watchdog; any other failed resource is still an error.
const UNCACHED_PHOTO = /\/recipes\/[a-z0-9-]+-(480|960)\.webp$/
const isUncachedPhoto = (entry: ConsoleEntry) =>
  entry.kind === 'console' &&
  /^Failed to load resource: net::ERR_/.test(entry.text) &&
  UNCACHED_PHOTO.test(entry.url)

test('the app installs a service worker, then serves content offline: recipes client-side, diets hard-loaded, deep link', async ({
  page,
  context,
  consoleErrors,
}) => {
  await test.step('1. online load: a service worker controls the page on the FIRST load (clientsClaim)', async () => {
    const response = await page.goto(`${BASE}/`)
    expect(response?.status()).toBe(200)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(el.heroTitle)

    await waitForControllingServiceWorker(page)
    expect(await networkProbe(page)).toBe(200)
  })

  await test.step('2. go offline', async () => {
    await context.setOffline(true)
    expect(await page.evaluate(() => navigator.onLine)).toBe(false)
    // That the network is really cut is proven by steps 4–5 (`fromServiceWorker()`) and by the
    // RED checks recorded in BUILD_LOG.md (P5.4 follow-up, 2026-10-06): a wrong list count fails on
    // the rendered number, a hard load of an unknown route renders not-found instead of diets, and
    // `test.use({ serviceWorkers: 'block' })` turns step 1 red (`navigator.serviceWorker.ready`
    // never resolves). Note `page.route('**/sw.js')` does NOT block the worker script — Chromium
    // fetches it outside the page's interception — so it is not a valid sabotage.
  })

  await test.step('3. client-side navigation over the REAL header link renders the recipes list from the precache', async () => {
    // The home page was loaded online, but /recipes was never visited: its lazy page chunk and the
    // recipes / ingredients / diets seed chunks are requested NOW, offline. They render only if
    // every one of them was precached by the service worker.
    await page
      .getByRole('navigation', { name: el.nav.label })
      .getByRole('link', { name: el.nav.recipes })
      .click()

    await expect(page.getByRole('heading', { level: 1 })).toHaveText(el.recipesTitle)
    await expect(recipeCards(page)).toHaveCount(RECIPES.length)
    await expect(page.getByText(el.draftRibbon)).toBeVisible()
    expect(new URL(page.url()).pathname).toBe(`${BASE}/recipes`)
  })

  await test.step('4. a HARD load of /diets offline is served by the service worker and renders every diet', async () => {
    const response = await page.goto(`${BASE}/diets`)
    // Offline there is no Pages 404 document for the deep link: the service worker answers the
    // navigation with the precached index.html (status 200, `navigateFallback`), and the page chunk
    // plus the diets seed chunk come from the precache too.
    expect(response?.status()).toBe(200)
    expect(response?.fromServiceWorker()).toBe(true)
    expect(page.url().startsWith('chrome-error://')).toBe(false)
    expect(await page.evaluate(() => navigator.serviceWorker.controller !== null)).toBe(true)

    await expect(page.getByRole('heading', { level: 1 })).toHaveText(el.dietsTitle)
    await expect(dietLinks(page)).toHaveCount(DIETS.length)
    await expect(page.locator('html')).toHaveAttribute('lang', 'el')
    expect(new URL(page.url()).pathname).toBe(`${BASE}/diets`)
  })

  await test.step('5. a HARD load of an unknown deep link offline gets navigateFallback and the in-app not-found', async () => {
    const response = await page.goto(`${BASE}/some/deep/offline`)
    expect(response?.status()).toBe(200)
    expect(response?.fromServiceWorker()).toBe(true)

    await expect(page.getByRole('heading', { level: 1 })).toHaveText(el.notFoundTitle)
    await expect(page.getByText(el.notFoundBody)).toBeVisible()
    expect(new URL(page.url()).pathname).toBe(`${BASE}/some/deep/offline`)
  })

  await test.step('6. client-side /auth offline renders the sign-in-unavailable state; the real backHome link returns home', async () => {
    // No in-app link to /auth exists in local-only mode (AccountMenu renders nothing without an
    // account service), so this navigation is a `history.pushState` + `popstate`, exactly what
    // BrowserRouter listens to.
    await page.evaluate((path) => {
      history.pushState(null, '', path)
      dispatchEvent(new PopStateEvent('popstate'))
    }, `${BASE}/auth`)

    await expect(page.getByRole('heading', { level: 1 })).toHaveText(el.signInUnavailableTitle)
    await expect(page.getByText(el.signInUnavailableBody)).toBeVisible()
    expect(new URL(page.url()).pathname).toBe(`${BASE}/auth`)

    await page.getByRole('link', { name: el.backHome }).click()
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(el.heroTitle)
    await expect(page.getByText(el.notMedicalAdvice)).toBeVisible()
  })

  await test.step('7. back online: the network is reachable again and the page still works', async () => {
    await context.setOffline(false)
    expect(await page.evaluate(() => navigator.onLine)).toBe(true)
    expect(await networkProbe(page)).toBe(200)

    await page.reload()
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(el.heroTitle)
    await expect(page.getByRole('button', { name: el.switchTo })).toBeVisible()
  })

  // In place: the fixture asserts on this same array after the test body.
  const kept = consoleErrors.filter((entry) => !isUncachedPhoto(entry))
  consoleErrors.splice(0, consoleErrors.length, ...kept)
})
