import { BLOCKS } from '../../src/content/enums'
import { el, en } from '../../src/i18n/dictionary'
import { expect, test } from '../support/fixtures'

// WORKOUTS WORKFLOW on the PRODUCTION build (PLAN P4.12): pick type / level / intensity (three
// radiogroups, the selection lives in the URL) → the one session that cell resolves to, with its
// three blocks (warm-up · main · cool-down) each listing movements; both languages.

const BASE = '/hygieia'

test('select type, level and intensity → a session with three blocks; the URL carries the choice', async ({
  page,
}) => {
  await page.goto(`${BASE}/workouts`)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(el.workoutsTitle)
  await expect(page.getByText(el.workoutsIntro)).toBeVisible()

  // The defaults (home · beginner · moderate) already resolve to a session.
  await expect(page.getByRole('radio', { name: el.types.home, exact: true })).toBeChecked()
  await expect(page.getByRole('article')).toBeVisible()
  const defaultTitle = await page.getByRole('heading', { level: 2 }).first().textContent()

  await page.getByRole('radio', { name: el.types.gym, exact: true }).click()
  await page.getByRole('radio', { name: el.levels.advanced, exact: true }).click()
  await page.getByRole('radio', { name: el.intensities.high, exact: true }).click()
  await expect(page).toHaveURL(/type=gym/)
  await expect(page).toHaveURL(/level=advanced/)
  await expect(page).toHaveURL(/intensity=high/)
  await expect(page.getByRole('radio', { name: el.types.gym, exact: true })).toBeChecked()
  await expect(page.getByRole('radio', { name: el.levels.advanced, exact: true })).toBeChecked()
  await expect(page.getByRole('radio', { name: el.intensities.high, exact: true })).toBeChecked()

  const session = page.getByRole('article')
  await expect(session).toBeVisible()
  await expect(session.getByRole('heading', { level: 2 })).not.toHaveText(defaultTitle ?? '')
  await expect(session.getByText(el.draftRibbon)).toBeVisible()
  await expect(session.getByTestId('session-duration')).toContainText(el.minutesUnit)
  await expect(session.getByTestId('session-equipment')).toBeVisible()

  expect(BLOCKS).toEqual(['warmup', 'main', 'cooldown'])
  for (const block of BLOCKS) {
    const section = session.getByTestId(`block-${block}`)
    await expect(section).toBeVisible()
    await expect(section.getByRole('heading', { level: 3 })).toHaveText(el.blocks[block])
    expect(await section.getByRole('listitem').count()).toBeGreaterThan(0)
    await expect(section.getByTestId('work-figure').first()).toBeVisible()
  }
  // Every movement has a coaching cue behind a disclosure.
  await session.getByText(el.showCue).first().click()
  await expect(session.locator('details[open]')).toHaveCount(1)
  // Two `role="note"` elements: the draft ribbon and the disclaimer.
  await expect(session.getByRole('note').filter({ hasText: el.notMedicalAdvice })).toBeVisible()
})

test('a hard load of a selection URL restores it (404 document); English re-renders labels', async ({
  page,
}) => {
  const response = await page.goto(
    `${BASE}/workouts?type=calisthenics&level=intermediate&intensity=low`,
  )
  expect(response?.status()).toBe(404)
  await expect(page.getByRole('radio', { name: el.types.calisthenics, exact: true })).toBeChecked()
  await expect(page.getByRole('radio', { name: el.levels.intermediate, exact: true })).toBeChecked()
  await expect(page.getByRole('radio', { name: el.intensities.low, exact: true })).toBeChecked()
  await expect(page.getByRole('article')).toBeVisible()

  await page.getByRole('button', { name: el.switchTo }).click()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(en.workoutsTitle)
  await expect(page.getByText(en.pickType, { exact: true })).toBeVisible()
  await expect(page.getByText(en.pickLevel, { exact: true })).toBeVisible()
  await expect(page.getByText(en.pickIntensity, { exact: true })).toBeVisible()
  await expect(page.getByRole('radio', { name: en.types.calisthenics, exact: true })).toBeChecked()
  for (const block of BLOCKS) {
    await expect(page.getByTestId(`block-${block}`).getByRole('heading', { level: 3 })).toHaveText(
      en.blocks[block],
    )
  }
  await expect(page.getByText(en.draftRibbon)).toBeVisible()
})
