import { el, en } from '../../src/i18n/dictionary'
import { expect, test } from '../support/fixtures'

// /profile ON THE LOCAL-ONLY PRODUCTION BUILD (P8.2). The e2e build has no Supabase env, so user
// data is `disabled('local-only')` and the page renders its H1, intro and the bilingual note — the
// same state the Lighthouse and a11y gates audit through e2e/support/routes.ts. The route is NOT
// behind RequireAuth (unlike /account), so there is no sign-in-unavailable copy here; the page
// explains itself. The signed-in page (entries, goals, badges, saved items) needs a backend and is
// covered by src/profile/ProfilePage.test.tsx against the in-memory UserDataSource; it cannot be
// driven end-to-end without one. In local-only mode AccountMenu renders nothing, so the "profile
// in the account menu, not the main nav" rule is proven here only on its nav half; the menu half
// is src/auth/guards.test.tsx (fake signed-in client).

const BASE = '/hygieia'

test('/profile deep link: H1, intro and the local-only note; no form, no sections; English twin', async ({
  page,
}) => {
  const response = await page.goto(`${BASE}/profile`)
  expect(response?.status()).toBe(404) // the Pages fallback document
  expect(new URL(page.url()).pathname).toBe(`${BASE}/profile`)

  await expect(page.getByRole('heading', { level: 1 })).toHaveText(el.profileTitle)
  await expect(page.getByText(el.profileIntro)).toBeVisible()
  const note = page.getByRole('note')
  await expect(note).toHaveText(el.userDataUnavailableLocal)
  // Nothing of the signed-in page leaks: no quick-add form, no sections, no sign-in link.
  await expect(page.locator('main form')).toHaveCount(0)
  await expect(page.locator('main section')).toHaveCount(0)
  await expect(page.getByRole('link', { name: el.signIn })).toHaveCount(0)
  // Still inside the frame.
  await expect(page.getByRole('navigation', { name: el.nav.label })).toBeVisible()
  await expect(page.getByText(el.notMedicalAdvice)).toBeVisible()

  await page.getByRole('button', { name: el.switchTo }).click()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(en.profileTitle)
  await expect(page.getByRole('note')).toHaveText(en.userDataUnavailableLocal)
})

test('the profile is reached from the account menu, not the main nav (nav half, local-only)', async ({
  page,
}) => {
  await page.goto(`${BASE}/`)
  const nav = page.getByRole('navigation', { name: el.nav.label })
  await expect(nav).toBeVisible()
  await expect(nav.getByRole('link', { name: el.profileLink })).toHaveCount(0)
  // No account service → the account menu (and its profile link) is silent.
  await expect(page.getByRole('banner').getByRole('link', { name: el.profileLink })).toHaveCount(0)
  // The route itself answers.
  await page.goto(`${BASE}/profile`)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(el.profileTitle)
})
