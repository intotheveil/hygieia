import { el, en } from '../../src/i18n/dictionary'
import { WOMEN_SECTIONS } from '../../src/women/content'
import { expect, test } from '../support/fixtures'

// /women on the PRODUCTION build: reachable from the header nav, the deep link renders (a 404
// DOCUMENT on Pages — assert the app, never response.ok()), the table of contents jumps to each
// section, the nutrient links carry the recipe filter, and the page switches to English.

const BASE = '/hygieia'

test('/women: nav link, deep link, table of contents, nutrient links, both languages', async ({
  page,
}) => {
  await page.goto(`${BASE}/`)
  const nav = page.getByRole('banner').getByRole('navigation', { name: el.nav.label })
  await nav.getByRole('link', { name: el.nav.women, exact: true }).click()
  await expect(page).toHaveURL(new RegExp(`${BASE}/women$`))
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(el.womenTitle)

  await page.goto(`${BASE}/women`)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(el.womenTitle)
  const toc = page.getByRole('navigation', { name: el.womenToc })
  await expect(toc.getByRole('link')).toHaveText(WOMEN_SECTIONS.map((s) => s.title.el))

  const cycle = WOMEN_SECTIONS.find((s) => s.id === 'cycle')
  if (!cycle) throw new Error('content: no cycle section')
  await toc.getByRole('link', { name: cycle.title.el }).click()
  await expect(page).toHaveURL(new RegExp(`${BASE}/women#women-cycle$`))
  await expect(page.getByRole('heading', { level: 2, name: cycle.title.el })).toBeInViewport()

  await expect(page.locator('a[href$="/recipes?nutrient=vitamin-d"]')).toHaveCount(1)
  await expect(page.getByTestId('women-doctor')).toBeVisible()

  await page.getByRole('button', { name: el.switchTo }).click()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(en.womenTitle)
  await expect(page.getByRole('navigation', { name: en.womenToc }).getByRole('link')).toHaveText(
    WOMEN_SECTIONS.map((s) => s.title.en),
  )
})
