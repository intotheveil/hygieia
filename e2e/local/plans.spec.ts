import { el, en } from '../../src/i18n/dictionary'
import { expect, test } from '../support/fixtures'

// /workouts/plans ON THE LOCAL-ONLY PRODUCTION BUILD (P8.3). The e2e build has no Supabase env, so
// user data is `disabled('local-only')`: the page renders its H1, intro and the bilingual note and
// reads nothing — the same state the Lighthouse and a11y gates audit through e2e/support/routes.ts.
// The signed-in page (builder, schedule grid, logger, PRs, history) needs a backend and is proven in
// src/workouts/plans/PlansPage.test.tsx + SessionLogger.test.tsx against the in-memory source.

const BASE = '/hygieia'

test('/workouts/plans deep link: H1, intro and the local-only note; no form, no sections; English twin', async ({
  page,
}) => {
  const response = await page.goto(`${BASE}/workouts/plans`)
  expect(response?.status()).toBe(404) // the Pages fallback document
  expect(new URL(page.url()).pathname).toBe(`${BASE}/workouts/plans`)

  await expect(page.getByRole('heading', { level: 1 })).toHaveText(el.wpTitle)
  await expect(page.getByText(el.wpIntro)).toBeVisible()
  await expect(page.getByRole('note')).toHaveText(el.userDataUnavailableLocal)
  await expect(page.locator('main form')).toHaveCount(0)
  await expect(page.locator('main section')).toHaveCount(0)
  await expect(page.getByRole('navigation', { name: el.nav.label })).toBeVisible()
  await expect(page.getByText(el.notMedicalAdvice)).toBeVisible()

  await page.getByRole('button', { name: el.switchTo }).click()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(en.wpTitle)
  await expect(page.getByRole('note')).toHaveText(en.userDataUnavailableLocal)
})

test('/workouts links to "My plans"; no "Start plan" on the card without an account', async ({
  page,
}) => {
  await page.goto(`${BASE}/workouts`)
  await expect(page.locator('#session-title')).toBeVisible()
  await expect(page.getByRole('link', { name: new RegExp(`^${el.wpStartPlan}`) })).toHaveCount(0)

  await page.getByRole('link', { name: `${el.wpLink} →` }).click()
  await expect(page).toHaveURL(/\/hygieia\/workouts\/plans$/)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(el.wpTitle)
  await expect(page.getByRole('note')).toHaveText(el.userDataUnavailableLocal)
})
