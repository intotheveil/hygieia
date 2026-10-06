import { SKINCARE_ROUTINES } from '../../src/content/seed/skincare'
import { el } from '../../src/i18n/dictionary'
import { skincareHabit } from '../../src/tasks/content/skincare-habit'
import { expect, test } from '../support/fixtures'

// CONNECTED FEATURES on the PRODUCTION build (2026-10-06), local-only (no sign-in flows): the
// workout-routine plan's "Turn this into a workout plan →" link, and a /skincare routine card's
// "Make it a daily habit" deep link with its parameters → the pre-filled skincare-habit
// questionnaire → the routine's steps as "Your routine" above the plan. The project runs
// `locale: 'el-GR'`, so the strings are the Greek dictionary values.

const BASE = '/hygieia'

const ROUTINE = SKINCARE_ROUTINES.find(
  (r) => r.area === 'face' && r.time === 'pm' && r.skin_type === 'dry',
)
if (!ROUTINE) throw new Error('seed: no evening routine for dry skin')

const optionLabel = (q: string, o: string) => {
  const option = skincareHabit.questions.find((x) => x.id === q)?.options.find((x) => x.id === o)
  if (!option) throw new Error(`content: skincare-habit has no ${q}/${o}`)
  return option.label.el
}

test('workout-routine plan → "Turn this into a workout plan" opens /workouts/plans with the cell', async ({
  page,
}) => {
  await page.addInitScript(() => {
    window.localStorage.setItem(
      'hygieia:tasks:workout-routine',
      JSON.stringify({
        v: 1,
        answers: { level: ['new'], place: ['home'], days: ['d3'], time: ['t30'], goal: [] },
        ticks: {},
      }),
    )
  })
  await page.goto(`${BASE}/tasks/workout-routine`)
  await expect(page.locator('#tasks-plan')).toBeVisible()
  const link = page.getByRole('link', { name: el.tasksToWorkoutPlan })
  await expect(link).toHaveAttribute(
    'href',
    `${BASE}/workouts/plans?type=home&level=beginner&intensity=low`,
  )
  await link.click()
  await expect(page).toHaveURL(
    new RegExp(`${BASE}/workouts/plans\\?type=home&level=beginner&intensity=low$`),
  )
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(el.wpTitle)
})

test('a skincare routine → "Make it a daily habit" → pre-filled questionnaire → "Your routine" above the plan', async ({
  page,
}) => {
  await page.goto(`${BASE}/skincare`)
  const card = page.locator(`[data-routine="${ROUTINE.slug}"]`)
  await card.getByRole('link', { name: el.skincareMakeHabit }).click()

  await expect(page).toHaveURL(
    new RegExp(
      `${BASE}/tasks/skincare-habit\\?routine=${ROUTINE.slug}&skin=dry&time=pm&area=face$`,
    ),
  )
  await expect(page.getByText(el.tasksPrefilled)).toBeVisible()
  const main = page.getByRole('main')
  await expect(main.getByRole('radio', { name: optionLabel('skin', 'dry') })).toBeChecked()

  await main.getByRole('button', { name: el.tasksNext }).click()
  await main.getByRole('radio', { name: optionLabel('now', 'basic') }).check()
  await main.getByRole('button', { name: el.tasksNext }).click()
  await main.getByRole('radio', { name: optionLabel('time', 't10') }).check()
  await main.getByRole('button', { name: el.tasksNext }).click()
  await main.getByRole('button', { name: el.tasksSeePlan }).click()

  const routine = page.locator('#tasks-routine')
  await expect(routine.getByRole('heading', { level: 2 })).toContainText(el.tasksRoutineHeading)
  await expect(routine.getByRole('heading', { level: 2 })).toContainText(ROUTINE.name_el)
  await expect(routine.getByRole('checkbox')).toHaveCount(ROUTINE.steps.length)
  await expect(page.locator('#tasks-plan')).toBeVisible()

  // the routine is kept: a plain visit to the topic (no parameters) still shows it, ticks persist
  const first = routine.getByRole('checkbox').first()
  await first.check()
  await page.goto(`${BASE}/tasks/skincare-habit`)
  await expect(page.locator('#tasks-routine').getByRole('checkbox').first()).toBeChecked()
})
