import { el, en } from '../../src/i18n/dictionary'
import { expect, test } from '../support/fixtures'

// THE GUARDED ROUTES IN LOCAL-ONLY MODE on the PRODUCTION build (PLAN P4.12). The e2e build has no
// Supabase env, so AuthProvider's state is `unavailable`, and RequireAuth renders the
// sign-in-unavailable copy IN PLACE for both /account and /admin — it does not redirect. The
// redirect to `/auth?next=%2Faccount` belongs to the `anonymous` state, which needs a configured
// client and no session; that path is proven in src/auth/guards.test.tsx with a fake client
// (PLAN's "/account redirects to /auth" reads as that case). Here the URL is asserted to stay put.
// Every deep link is a 404 DOCUMENT (PLAN §4); assertions are on the rendered app.

const BASE = '/hygieia'

test('/admin deep link renders the sign-in-unavailable copy inside the frame, no redirect', async ({
  page,
}) => {
  const response = await page.goto(`${BASE}/admin`)
  expect(response?.status()).toBe(404)

  await expect(page.getByRole('heading', { level: 1 })).toHaveText(el.signInUnavailableTitle)
  await expect(page.getByText(el.signInUnavailableBody)).toBeVisible()
  expect(new URL(page.url()).pathname).toBe(`${BASE}/admin`)
  // Nothing of the review UI leaks through the gate.
  await expect(page.getByText(el.adminTitle)).toHaveCount(0)
  await expect(page.getByRole('tablist')).toHaveCount(0)
  // Still inside Layout: nav + disclaimer; the way home works.
  await expect(page.getByRole('navigation', { name: el.nav.label })).toBeVisible()
  await expect(page.getByText(el.notMedicalAdvice)).toBeVisible()
  await page.getByRole('link', { name: el.backHome }).click()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(el.heroTitle)
})

test('/account deep link renders the same copy, stays on /account (no account service → nothing to redirect to)', async ({
  page,
}) => {
  const response = await page.goto(`${BASE}/account`)
  expect(response?.status()).toBe(404)

  await expect(page.getByRole('heading', { level: 1 })).toHaveText(el.signInUnavailableTitle)
  await expect(page.getByText(el.signInUnavailableBody)).toBeVisible()
  expect(new URL(page.url()).pathname).toBe(`${BASE}/account`)
  expect(new URL(page.url()).search).toBe('')
  await expect(page.getByText(el.account, { exact: true })).toHaveCount(0)

  // English.
  await page.getByRole('button', { name: el.switchTo }).click()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(en.signInUnavailableTitle)
  await expect(page.getByText(en.signInUnavailableBody)).toBeVisible()
})

test('the header shows no account entry in local-only mode (AccountMenu is silent)', async ({
  page,
}) => {
  await page.goto(`${BASE}/`)
  const header = page.getByRole('banner')
  await expect(header.getByRole('navigation', { name: el.nav.label })).toBeVisible()
  await expect(header.getByRole('link', { name: el.signIn })).toHaveCount(0)
  await expect(header.getByRole('link', { name: el.account })).toHaveCount(0)
})
