import type { Page } from '@playwright/test'
import { el, en } from '../../src/i18n/dictionary'
import { DEAD_ORIGIN, expect, test } from '../support/dead-backend'

// ERROR STATES EXERCISED, NOT JUST WRITTEN (PLAN P5.1; CLAUDE.md §5). This project runs against
// `dist-dead/` (scripts/build-dead.mjs): the PRODUCTION artifact in CONFIGURED mode, pointed at
// http://127.0.0.1:9/ where nothing listens. Every supabase `ContentSource` read is refused by the
// OS, src/content/supabase.ts classifies the fetch TypeError as `network`, `useAsyncResult` lands in
// `error`, and the page must render the shared ErrorState (src/components/AsyncState.tsx) with ITS
// OWN bilingual copy and a Retry that really re-requests. Nothing from the bundled seed may show:
// configured mode has no draft ribbon and no seed rows.
//
// Two things measured on the artifact, not assumed: Chromium refuses port 9 as an UNSAFE PORT
// (`net::ERR_UNSAFE_PORT`, no socket is even opened — a dead host all the same), and supabase-js
// RETRIES a failed PostgREST request four times with back-off (~7 s) before the `Result` settles,
// so the ErrorState appears late and the project carries a 20 s expect budget (playwright.config.ts).
// Because of those retries, "Retry re-requests" is proven by waiting for the SETTLED alert first
// and only then arming `requestfailed`: a dead-host request after that point can only be ours.
//
// The watchdog (e2e/support/dead-backend.ts) ignores only the dead host's failed requests; any other
// console error still fails the test. Strings are dictionary VALUES; the project runs with
// `locale: 'el-GR'`, so Greek renders first and each test toggles to English for the twin.

const BASE = '/hygieia'

/** A request that FAILED (not just issued) against the dead host — the proof Retry went out. */
const nextDeadFailure = (page: Page) =>
  page.waitForEvent('requestfailed', (req) => req.url().startsWith(`${DEAD_ORIGIN}/`))

const PAGES: ReadonlyArray<{ path: string; messageEl: string; messageEn: string }> = [
  { path: '/recipes', messageEl: el.loadFailed, messageEn: en.loadFailed },
  { path: '/diets', messageEl: el.loadFailed, messageEn: en.loadFailed },
  { path: '/workouts', messageEl: el.workoutsLoadFailed, messageEn: en.workoutsLoadFailed },
  { path: '/tips', messageEl: el.tipsLoadFailed, messageEn: en.tipsLoadFailed },
  { path: '/recipes/carnivore-bacon-and-eggs', messageEl: el.loadFailed, messageEn: en.loadFailed },
  { path: '/diets/keto', messageEl: el.loadFailed, messageEn: en.loadFailed },
  { path: '/fridge', messageEl: el.fridgeLoadFailed, messageEn: en.fridgeLoadFailed },
]

for (const { path, messageEl, messageEn } of PAGES) {
  test(`${path}: bilingual ErrorState, Retry re-requests the dead host and stays in error`, async ({
    page,
  }) => {
    const firstFailure = nextDeadFailure(page)
    await page.goto(`${BASE}${path}`)
    const first = await firstFailure
    expect(first.url()).toMatch(new RegExp(`^${DEAD_ORIGIN}/rest/v1/`))

    // Until supabase-js gives up, the skeleton (busy status) is what shows — never seed content.
    await expect(page.locator('[aria-busy="true"]')).toBeVisible()
    const alert = page.getByRole('alert')
    await expect(alert).toContainText(messageEl)
    const retry = alert.getByRole('button', { name: el.retry })
    await expect(retry).toBeVisible()
    // Configured mode: no seed content, no draft ribbon, no skeleton left behind.
    await expect(page.getByText(el.draftRibbon)).toHaveCount(0)
    await expect(page.locator('[aria-busy="true"]')).toHaveCount(0)

    // Retry: a FURTHER failed request to the dead host (armed only now, after the state settled, so
    // it cannot be one of supabase-js's own retries), and the page is still in the error state.
    const secondFailure = nextDeadFailure(page)
    await retry.click()
    const second = await secondFailure
    expect(second.url()).toMatch(new RegExp(`^${DEAD_ORIGIN}/rest/v1/`))
    await expect(page.getByRole('alert')).toContainText(messageEl)
    await expect(page.getByRole('alert').getByRole('button', { name: el.retry })).toBeVisible()

    // The English twin of the same state.
    await page.getByRole('button', { name: el.switchTo }).click()
    await expect(page.getByRole('alert')).toContainText(messageEn)
    await expect(page.getByRole('alert').getByRole('button', { name: en.retry })).toBeVisible()
  })
}

test('the header and nav still work from an error state: recipes → diets → tips, each in error', async ({
  page,
}) => {
  await page.goto(`${BASE}/recipes`)
  await expect(page.getByRole('alert')).toContainText(el.loadFailed)
  const nav = page.getByRole('banner').getByRole('navigation', { name: el.nav.label })
  await expect(nav.getByRole('link', { name: el.nav.recipes, exact: true })).toHaveAttribute(
    'aria-current',
    'page',
  )

  await nav.getByRole('link', { name: el.nav.diets, exact: true }).click()
  await expect(page).toHaveURL(new RegExp(`${BASE}/diets$`))
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(el.dietsTitle)
  await expect(page.getByRole('alert')).toContainText(el.loadFailed)

  await nav.getByRole('link', { name: el.nav.tips, exact: true }).click()
  await expect(page).toHaveURL(new RegExp(`${BASE}/tips$`))
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(el.tipsTitle)
  await expect(page.getByRole('alert')).toContainText(el.tipsLoadFailed)

  // The brand link goes home; home renders the CONFIGURED status copy (this is not the local build).
  await page
    .getByRole('banner')
    .getByRole('link', { name: /Hygieia/ })
    .click()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(el.heroTitle)
  await expect(page.getByText(el.statusBodyConfigured)).toBeVisible()
})

test('/auth shows the sign-in form (configured mode); a magic-link submit that cannot reach the backend shows signInFailed', async ({
  page,
}) => {
  await page.goto(`${BASE}/auth`)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(el.signIn)
  await expect(page.getByText(el.signInUnavailableBody)).toHaveCount(0)
  await expect(page.getByText(el.signInIntro)).toBeVisible()

  const otpFailure = page.waitForEvent('requestfailed', (req) =>
    req.url().startsWith(`${DEAD_ORIGIN}/auth/v1/`),
  )
  await page.getByLabel(el.signInEmailLabel).fill('someone@example.com')
  await page.getByRole('button', { name: el.signInSendLink }).click()
  await otpFailure
  await expect(page.getByRole('alert')).toHaveText(el.signInFailed)
  // Still on the form: the address can be corrected and resent.
  await expect(page.getByLabel(el.signInEmailLabel)).toHaveValue('someone@example.com')
  await expect(page.getByRole('button', { name: el.signInSendLink })).toBeEnabled()
})
