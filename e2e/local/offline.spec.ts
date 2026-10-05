import type { Page } from '@playwright/test'
import { el } from '../../src/i18n/dictionary'
import { type ConsoleEntry, expect, test as base } from '../support/fixtures'

// Offline / PWA behaviour on the PRODUCTION build (PLAN P5.4, pulled forward onto the P3.6 harness).
// vite.config.ts registers a Workbox service worker (`registerType: 'autoUpdate'`, so the generated
// sw.js calls skipWaiting() + clientsClaim()) that precaches every built js/css/html/svg/png/jpg/
// webmanifest and answers any navigation with the precached `/hygieia/index.html`
// (`navigateFallback`). Bundled content therefore works offline by construction, and this spec
// proves it the only way that counts: the browser is taken offline and the app is hard-loaded.
//
// One serial flow, not independent tests: a service worker only exists after an ONLINE load has
// installed it, and every later step depends on that state. Each numbered step is a `test.step`.
//
// No in-app link to /auth exists on the home page in local-only mode (AccountMenu renders nothing
// without an account service), so the client-side navigation in step 3 is a `history.pushState` +
// `popstate`, which is exactly what BrowserRouter listens to. Returning home uses the real
// `backHome` link.
//
// Strings are asserted against dictionary VALUES (src/i18n/dictionary.ts); the project runs with
// `locale: 'el-GR'` so the Greek shell is what renders.
//
// Google Fonts offline: index.html links the fonts.googleapis.com stylesheet, which Workbox caches
// at runtime (StaleWhileRevalidate) — but only once the service worker CONTROLS the page, and on
// the first visit the stylesheet is fetched before that. The two offline hard loads below therefore
// ask the network for it, get `net::ERR_FAILED`, and Chromium logs that as a console error. That is
// a cosmetic fallback (system font), not an app error, so THIS spec narrows the house watchdog by
// exactly that: a network failure (`net::ERR_*`) of fonts.googleapis.com / fonts.gstatic.com. Every
// other console error, page error or failed resource still fails the test.

const BASE = '/hygieia'

const isOfflineGoogleFontsFailure = (e: ConsoleEntry): boolean =>
  e.kind === 'console' &&
  /^Failed to load resource: net::ERR_/.test(e.text) &&
  /^https:\/\/fonts\.(googleapis|gstatic)\.com\//.test(e.url)

// An OVERRIDE of the house fixture that depends on the original (Playwright keeps the original's
// `auto`, so it still runs for every test here without being requested).
const test = base.extend<{ consoleErrors: ConsoleEntry[] }>({
  // (`provide` is Playwright's `use`; named so react-hooks/rules-of-hooks does not read it as React's.)
  consoleErrors: async ({ consoleErrors }, provide) => {
    await provide(consoleErrors)
    // Runs after the test body and BEFORE the house fixture's `toEqual([])` (a dependency tears
    // down after its dependents), so only the font failures are removed from what it judges.
    const kept = consoleErrors.filter((e) => !isOfflineGoogleFontsFailure(e))
    consoleErrors.splice(0, consoleErrors.length, ...kept)
  },
})

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

test('the app installs a service worker, then works offline: client-side nav, hard load, deep link', async ({
  page,
  context,
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
    // RED check recorded in BUILD_LOG.md P5.4: with sw.js blocked, step 4 fails with
    // net::ERR_INTERNET_DISCONNECTED.
  })

  await test.step('3. client-side navigation to /auth renders the sign-in-unavailable state offline', async () => {
    await page.evaluate((path) => {
      history.pushState(null, '', path)
      dispatchEvent(new PopStateEvent('popstate'))
    }, `${BASE}/auth`)

    await expect(page.getByRole('heading', { level: 1 })).toHaveText(el.signInUnavailableTitle)
    await expect(page.getByText(el.signInUnavailableBody)).toBeVisible()
    expect(new URL(page.url()).pathname).toBe(`${BASE}/auth`)

    // And back home over the real link, still offline.
    await page.getByRole('link', { name: el.backHome }).click()
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(el.heroTitle)
  })

  await test.step('4. a HARD load of / offline is served by the service worker and renders the Greek hero', async () => {
    const response = await page.goto(`${BASE}/`)
    expect(response?.status()).toBe(200)
    expect(response?.fromServiceWorker()).toBe(true)

    await expect(page.getByRole('heading', { level: 1 })).toHaveText(el.heroTitle)
    await expect(page.locator('html')).toHaveAttribute('lang', 'el')
    await expect(page.getByText(el.notMedicalAdvice)).toBeVisible()
  })

  await test.step('5. a HARD load of a deep link offline gets navigateFallback (index.html) and the in-app not-found', async () => {
    const response = await page.goto(`${BASE}/some/deep/offline`)
    // Offline there is no Pages 404 document: the service worker answers with the precached
    // index.html (status 200) and the router reads the route from the untouched URL.
    expect(response?.status()).toBe(200)
    expect(response?.fromServiceWorker()).toBe(true)

    await expect(page.getByRole('heading', { level: 1 })).toHaveText(el.notFoundTitle)
    await expect(page.getByText(el.notFoundBody)).toBeVisible()
    expect(new URL(page.url()).pathname).toBe(`${BASE}/some/deep/offline`)
  })

  await test.step('6. back online: the network is reachable again and the page still works', async () => {
    await context.setOffline(false)
    expect(await page.evaluate(() => navigator.onLine)).toBe(true)
    expect(await networkProbe(page)).toBe(200)

    await page.getByRole('link', { name: el.backHome }).click()
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(el.heroTitle)

    await page.reload()
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(el.heroTitle)
    await expect(page.getByRole('button', { name: el.switchTo })).toBeVisible()
  })
})
