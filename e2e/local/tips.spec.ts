import { TIP_TOPICS } from '../../src/content/enums'
import { el, en } from '../../src/i18n/dictionary'
import { OVERLAID_SEED } from '../../src/test/overlaidSeed'
import { expect, test } from '../support/fixtures'

// HEALTH TIPS on the PRODUCTION build (PLAN P4.12): every tip grouped by topic; the topic filter
// lives in the URL; a sourced tip links its source in a new tab with `rel="noopener noreferrer"`.
// Overlay 0002 sourced EVERY served tip, so no card may show the "source pending" label and every
// card links its own source (the pending branch itself is unit-tested with a fake source in
// src/tips/TipsPage.test.tsx). Both languages.

// The seed AS SERVED (base + content overlays, src/content/seed/overlays/): the build is local-only,
// so the bundled seed with every overlay applied IS the content the pages render.
const { health_tips: HEALTH_TIPS } = OVERLAID_SEED

const BASE = '/hygieia'

const topicSections = (page: import('@playwright/test').Page) =>
  page.locator('section[aria-labelledby^="topic-"]')

const sleepTips = HEALTH_TIPS.filter((t) => t.topic === 'sleep')
const isSourced = (t: (typeof HEALTH_TIPS)[number]) => t.source_url !== null && !t.needs_source
const sourced = sleepTips.find(isSourced)
if (!sourced) throw new Error('seed: the sleep topic needs a sourced tip')
const topicsWithTips = TIP_TOPICS.filter((topic) => HEALTH_TIPS.some((t) => t.topic === topic))

test('all topics → the sleep filter → every tip links its source with rel; none is pending', async ({
  page,
}) => {
  await page.goto(`${BASE}/tips`)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(el.tipsTitle)
  await expect(page.getByText(el.draftRibbon)).toBeVisible()
  await expect(page.getByRole('radio', { name: el.allTopics })).toBeChecked()
  await expect(topicSections(page)).toHaveCount(topicsWithTips.length)
  // Every served tip is sourced (overlay 0002): one source link per tip, no pending label anywhere.
  expect(HEALTH_TIPS.filter((t) => !isSourced(t)), 'served tips without a source').toEqual([])
  await expect(page.getByRole('article')).toHaveCount(HEALTH_TIPS.length)
  await expect(page.getByRole('link', { name: el.readSource })).toHaveCount(HEALTH_TIPS.length)
  await expect(page.getByText(el.sourcePending)).toHaveCount(0)

  await page.getByRole('radio', { name: el.topics.sleep }).click()
  await expect(page).toHaveURL(/[?&]topic=sleep$/)
  await expect(page.getByRole('radio', { name: el.topics.sleep })).toBeChecked()
  await expect(topicSections(page)).toHaveCount(1)
  await expect(page.getByRole('heading', { level: 2 })).toContainText(el.topics.sleep)
  await expect(topicSections(page).getByRole('listitem')).toHaveCount(sleepTips.length)

  const sourcedCard = page.getByRole('article').filter({ hasText: sourced.title_el })
  const link = sourcedCard.getByRole('link', { name: el.readSource })
  await expect(link).toHaveAttribute('href', sourced.source_url ?? '')
  await expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  await expect(link).toHaveAttribute('target', '_blank')

  // Each sleep card links ITS OWN source (not just some link somewhere on the page).
  for (const tip of sleepTips) {
    const tipLink = page
      .getByRole('article')
      .filter({ hasText: tip.title_el })
      .getByRole('link', { name: el.readSource })
    await expect(tipLink).toHaveAttribute('href', tip.source_url ?? '')
    await expect(tipLink).toHaveAttribute('rel', 'noopener noreferrer')
  }
  await expect(page.getByText(el.sourcePending)).toHaveCount(0)

  // Back to all topics clears the URL.
  await page.getByRole('radio', { name: el.allTopics }).click()
  await expect(page).toHaveURL(new RegExp(`${BASE}/tips$`))
  await expect(topicSections(page)).toHaveCount(topicsWithTips.length)
})

test('a hard load of ?topic= restores the filter (404 document); English re-renders the headings', async ({
  page,
}) => {
  const response = await page.goto(`${BASE}/tips?topic=sleep`)
  expect(response?.status()).toBe(404)
  await expect(page.getByRole('radio', { name: el.topics.sleep })).toBeChecked()
  await expect(topicSections(page)).toHaveCount(1)

  await page.getByRole('button', { name: el.switchTo }).click()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(en.tipsTitle)
  await expect(page.getByText(en.tipsIntro)).toBeVisible()
  await expect(page.getByRole('radio', { name: en.topics.sleep })).toBeChecked()
  await expect(page.getByRole('heading', { level: 2 })).toContainText(en.topics.sleep)
  await expect(page.getByRole('article').filter({ hasText: sourced.title_en })).toBeVisible()
  await expect(topicSections(page).getByRole('listitem')).toHaveCount(sleepTips.length)
  await expect(page.getByRole('link', { name: en.readSource })).toHaveCount(sleepTips.length)
  await expect(page.getByText(en.sourcePending)).toHaveCount(0)
  await expect(page.getByRole('link', { name: en.readSource }).first()).toHaveAttribute(
    'rel',
    'noopener noreferrer',
  )
})

test('an unknown topic value means "all"', async ({ page }) => {
  await page.goto(`${BASE}/tips?topic=nonsense`)
  await expect(page.getByRole('radio', { name: el.allTopics })).toBeChecked()
  await expect(topicSections(page)).toHaveCount(topicsWithTips.length)
})
