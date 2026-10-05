import { TIP_TOPICS } from '../../src/content/enums'
import { HEALTH_TIPS } from '../../src/content/seed/tips'
import { el, en } from '../../src/i18n/dictionary'
import { expect, test } from '../support/fixtures'

// HEALTH TIPS on the PRODUCTION build (PLAN P4.12): every tip grouped by topic; the topic filter
// lives in the URL; a sourced tip links its source in a new tab with `rel="noopener noreferrer"`;
// a tip without a real source shows the "source pending" label instead of pretending (PLAN §0
// content drafting rule). Both languages.

const BASE = '/hygieia'

const topicSections = (page: import('@playwright/test').Page) =>
  page.locator('section[aria-labelledby^="topic-"]')

const sleepTips = HEALTH_TIPS.filter((t) => t.topic === 'sleep')
const sourced = sleepTips.find((t) => t.source_url !== null && !t.needs_source)
const pending = sleepTips.find((t) => t.needs_source)
if (!sourced || !pending)
  throw new Error('seed: the sleep topic needs one sourced and one pending tip')
const topicsWithTips = TIP_TOPICS.filter((topic) => HEALTH_TIPS.some((t) => t.topic === topic))

test('all topics → the sleep filter → a sourced link with rel and a source-pending label', async ({
  page,
}) => {
  await page.goto(`${BASE}/tips`)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(el.tipsTitle)
  await expect(page.getByText(el.draftRibbon)).toBeVisible()
  await expect(page.getByRole('radio', { name: el.allTopics })).toBeChecked()
  await expect(topicSections(page)).toHaveCount(topicsWithTips.length)

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

  const pendingCard = page.getByRole('article').filter({ hasText: pending.title_el })
  await expect(pendingCard.getByText(el.sourcePending)).toBeVisible()
  await expect(pendingCard.getByRole('link')).toHaveCount(0)

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
  await expect(page.getByText(en.sourcePending).first()).toBeVisible()
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
