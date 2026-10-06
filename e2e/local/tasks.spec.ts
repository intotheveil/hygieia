import type { Page } from '@playwright/test'
import { el, en, type Dictionary, type Lang } from '../../src/i18n/dictionary'
import { fill } from '../../src/i18n/fill'
import { cleanHome } from '../../src/tasks/content/clean-home'
import { TOPICS } from '../../src/tasks/content/topics'
import { expect, test } from '../support/fixtures'

// TASKS ADVISOR on the PRODUCTION build (P9): the topic grid → the clean-home questionnaire, one
// question per step (radios, then checkboxes, Back/Next) → the plan (Today checklist, the week,
// the month) → a tick → a reload keeps it (localStorage `hygieia:tasks:clean-home`) → Retake. The
// strings are dictionary and content VALUES; the project runs `locale: 'el-GR'`, the English twin
// flips the header switch first. No backend is involved (bundled content), so the dead-backend
// project has nothing to prove here.

const BASE = '/hygieia'

const label = (lang: Lang, q: string, o: string) => {
  const question = cleanHome.questions.find((x) => x.id === q)
  const option = question?.options.find((x) => x.id === o)
  if (!question || !option) throw new Error(`content: clean-home has no ${q}/${o}`)
  return option.label[lang]
}

async function answer(page: Page, lang: Lang, t: Dictionary) {
  const main = page.getByRole('main')
  const next = main.getByRole('button', { name: t.tasksNext })

  await expect(main.getByText(fill(t.tasksQuestionProgress, { n: 1, total: 5 }))).toBeVisible()
  await expect(next).toBeDisabled()
  await main.getByRole('radio', { name: label(lang, 'size', 'small') }).check()
  await next.click()

  await main.getByRole('checkbox', { name: label(lang, 'household', 'kids') }).check()
  await main.getByRole('checkbox', { name: label(lang, 'household', 'pets') }).check()
  await next.click()

  // keyboard only: Space selects the focused radio, Enter on Next submits the step
  const t30 = main.getByRole('radio', { name: label(lang, 'time', 't30') })
  await t30.focus()
  await page.keyboard.press('Space')
  await expect(t30).toBeChecked()
  await next.focus()
  await page.keyboard.press('Enter')
  await expect(main.getByText(fill(t.tasksQuestionProgress, { n: 4, total: 5 }))).toBeVisible()

  await main.getByRole('radio', { name: label(lang, 'style', 'daily') }).check()
  await next.click()
  await main.getByRole('radio', { name: label(lang, 'state', 'messy') }).check()
  await main.getByRole('button', { name: t.tasksSeePlan }).click()
}

for (const lang of ['el', 'en'] as const) {
  const t = lang === 'el' ? el : en
  test(`clean-home: questionnaire → today list → tick → reload keeps it → retake (${lang})`, async ({
    page,
  }) => {
    await page.goto(`${BASE}/tasks`)
    if (lang === 'en') await page.getByRole('button', { name: el.switchTo }).click()
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(t.tasksTitle)
    await expect(page.locator('#tasks-topics li')).toHaveCount(Object.keys(TOPICS).length)

    await page.getByRole('link', { name: TOPICS['clean-home'].title[lang] }).click()
    await expect(page).toHaveURL(new RegExp(`${BASE}/tasks/clean-home$`))
    await expect(page.getByRole('heading', { level: 1 })).toContainText(
      TOPICS['clean-home'].title[lang],
    )

    await answer(page, lang, t)

    const today = page.getByRole('region', { name: new RegExp(`^${t.tasksToday}`) })
    await expect(today).toBeVisible()
    await expect(page.getByRole('note', { name: t.tasksGentleTitle })).toBeVisible()
    const boxes = today.getByRole('checkbox')
    expect(await boxes.count()).toBeGreaterThan(0)
    const first = boxes.first()
    const name = await first.getAttribute('id')
    await first.check()
    await expect(first).toBeChecked()

    await page.reload()
    const again = page.locator(`#${name}`)
    await expect(again).toBeChecked()
    await expect(page.getByRole('region', { name: t.tasksThisWeek })).toBeVisible()
    await expect(page.getByRole('region', { name: t.tasksMonthly })).toBeVisible()

    await page.getByRole('button', { name: t.tasksRetake }).click()
    await expect(page.locator('#tasks-question')).toBeVisible()
    await expect(page.getByRole('main').getByRole('radio', { checked: true })).toHaveCount(0)
  })
}

test('a deep link to a topic renders the questionnaire (404 document on Pages)', async ({
  page,
}) => {
  await page.goto(`${BASE}/tasks/workout-routine`)
  await expect(page.getByRole('heading', { level: 1 })).toContainText(
    TOPICS['workout-routine'].title.el,
  )
  await expect(page.locator('#tasks-question')).toBeVisible()
})
