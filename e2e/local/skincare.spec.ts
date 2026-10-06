import type { Page } from '@playwright/test'
import {
  SKINCARE_PRODUCT_TYPES,
  SKINCARE_ROUTINES,
  SKINCARE_TIPS,
} from '../../src/content/seed/skincare'
import { el, en } from '../../src/i18n/dictionary'
import { plural } from '../../src/i18n/fill'
import { NAIL_CATEGORIES } from '../../src/skincare/select'
import { expect, test } from '../support/fixtures'

// SKINCARE on the PRODUCTION build (PLAN P7.2): the Face / Nails switch, the audience / skin-type /
// concern / regional-style filters in the URL, the three section counts, a routine's ordered steps
// behind its disclosure button, and a deep link with parameters (a 404 DOCUMENT on Pages). Counts
// come from the bundled seed (the build is local-only, so the seed IS the content) and strings are
// dictionary VALUES. The project runs with `locale: 'el-GR'`: Greek first, English on the toggle.

const BASE = '/hygieia'

const FACE_ROUTINES = SKINCARE_ROUTINES.filter((r) => r.area === 'face')
const NAIL_ROUTINES = SKINCARE_ROUTINES.filter((r) => r.area === 'nails')
const FACE_TIPS = SKINCARE_TIPS.filter((t) => t.area === 'face')
const NAIL_TIPS = SKINCARE_TIPS.filter((t) => t.area === 'nails')
const FACE_TYPES = SKINCARE_PRODUCT_TYPES.filter((p) => !NAIL_CATEGORIES.has(p.category))
const NAIL_TYPES = SKINCARE_PRODUCT_TYPES.filter((p) => NAIL_CATEGORIES.has(p.category))
const KR_FACE_ROUTINES = FACE_ROUTINES.filter((r) => r.region === 'kr')
if (KR_FACE_ROUTINES.length === 0) throw new Error('seed: no Korean-style face routine')

const count = (page: Page, section: 'routines' | 'guide' | 'tips') =>
  page.getByTestId(`skincare-${section}-count`)
const routineCards = (page: Page) => page.locator('[data-routine]')

test('face by default: three sections with seed counts, kr filter shows only Korean-style routines, Nails switch', async ({
  page,
}) => {
  await page.goto(`${BASE}/skincare`)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(el.skincareTitle)
  await expect(page.getByText(el.skincareDisclaimer)).toBeVisible()
  await expect(page.getByText(el.draftRibbon)).toBeVisible()
  await expect(page.getByRole('button', { name: el.skincareArea.face })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await expect(count(page, 'routines')).toHaveText(
    plural(el.skincareRoutinesCount, FACE_ROUTINES.length),
  )
  await expect(count(page, 'guide')).toHaveText(plural(el.skincareGuideCount, FACE_TYPES.length))
  await expect(count(page, 'tips')).toHaveText(plural(el.skincareTipsCount, FACE_TIPS.length))
  await expect(routineCards(page)).toHaveCount(FACE_ROUTINES.length)

  // Regional style = Korean → only kr routines (routines carry ONE style), URL carries it.
  await page.getByLabel(el.skincareRegionLabel).selectOption('kr')
  await expect(page).toHaveURL(/[?&]region=kr$/)
  await expect(count(page, 'routines')).toHaveText(
    plural(el.skincareRoutinesCount, KR_FACE_ROUTINES.length),
  )
  for (const slug of await routineCards(page).evaluateAll((cards) =>
    cards.map((c) => c.getAttribute('data-routine')),
  )) {
    expect(KR_FACE_ROUTINES.map((r) => r.slug)).toContain(slug)
  }

  // Men narrows further and the URL keeps both.
  await page.getByRole('button', { name: el.skincareAudience.men }).click()
  await expect(page).toHaveURL(/[?&]audience=men/)
  await expect(page).toHaveURL(/[?&]region=kr/)
  const menKr = KR_FACE_ROUTINES.filter((r) => r.audience !== 'women')
  await expect(count(page, 'routines')).toHaveText(plural(el.skincareRoutinesCount, menKr.length))

  // Nails: the skin-type select disappears, the style label changes, the counts are the nail ones,
  // the region filter is kept (every nail routine is global, so kr still shows them all).
  await page.getByRole('button', { name: el.skincareArea.nails }).click()
  await expect(page).toHaveURL(/[?&]area=nails/)
  await expect(page.getByLabel(el.skincareSkinTypeLabel)).toHaveCount(0)
  await expect(page.getByLabel(el.skincareRegionLabelNails)).toHaveValue('kr')
  const menNails = NAIL_ROUTINES.filter((r) => r.audience !== 'women')
  await expect(count(page, 'routines')).toHaveText(
    plural(el.skincareRoutinesCount, menNails.length),
  )
  await expect(count(page, 'guide')).toHaveText(
    plural(
      el.skincareGuideCount,
      NAIL_TYPES.filter((p) => p.audiences.includes('men') || p.audiences.includes('all')).length,
    ),
  )
  await expect(count(page, 'tips')).toHaveText(
    plural(
      el.skincareTipsCount,
      NAIL_TIPS.filter((t) => t.audiences.includes('men') || t.audiences.includes('all')).length,
    ),
  )
})

test('expanding a routine lists its steps in order with product-type names; the English twin', async ({
  page,
}) => {
  await page.goto(`${BASE}/skincare`)
  const routine = FACE_ROUTINES[0]
  if (!routine) throw new Error('empty seed')
  const card = page.locator(`[data-routine="${routine.slug}"]`)
  await expect(card.getByRole('heading', { level: 3 })).toHaveText(routine.name_el)
  await expect(card.getByTestId('routine-duration')).toHaveText(
    `${routine.duration_min} ${el.minutesUnit}`,
  )
  // The card's one button; its name flips Show → Hide on click, so it is located by role alone.
  const toggle = card.getByRole('button')
  await expect(toggle).toHaveText(el.skincareShowSteps)
  await expect(toggle).toHaveAttribute('aria-expanded', 'false')
  await expect(card.getByRole('list', { name: el.skincareSteps })).toHaveCount(0)

  await toggle.click()
  await expect(toggle).toHaveAttribute('aria-expanded', 'true')
  await expect(toggle).toHaveText(el.skincareHideSteps)
  const items = card.getByRole('list', { name: el.skincareSteps }).getByRole('listitem')
  await expect(items).toHaveCount(routine.steps.length)
  for (const [i, step] of routine.steps.entries()) {
    const type = SKINCARE_PRODUCT_TYPES.find((p) => p.slug === step.product_type_slug)
    if (!type) throw new Error(`dangling ${step.product_type_slug}`)
    await expect(items.nth(i)).toHaveAttribute('data-step-order', String(step.order))
    await expect(items.nth(i)).toContainText(type.name_el)
    await expect(items.nth(i)).toContainText(step.note_el)
    if (step.optional) await expect(items.nth(i)).toContainText(el.skincareOptionalStep)
  }
  await expect(card.locator('[data-step-unavailable]')).toHaveCount(0)

  // English: headings, the expanded steps, the first type name.
  await page.getByRole('button', { name: el.switchTo }).click()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(en.skincareTitle)
  await expect(page.getByText(en.skincareIntro)).toBeVisible()
  await expect(card.getByRole('heading', { level: 3 })).toHaveText(routine.name_en)
  await expect(card.getByRole('button', { name: en.skincareHideSteps })).toHaveAttribute(
    'aria-expanded',
    'true',
  )
  const firstType = SKINCARE_PRODUCT_TYPES.find(
    (p) => p.slug === routine.steps[0]?.product_type_slug,
  )
  // The list's accessible name followed the language too.
  const enItems = card.getByRole('list', { name: en.skincareSteps }).getByRole('listitem')
  await expect(enItems).toHaveCount(routine.steps.length)
  await expect(enItems.first()).toContainText(firstType?.name_en ?? '')
  await expect(count(page, 'routines')).toHaveText(
    plural(en.skincareRoutinesCount, FACE_ROUTINES.length),
  )
  // Tips: a sourced tip links its sources safely; a pending one says so.
  const pending = FACE_TIPS.find((t) => t.needs_source)
  const sourced = FACE_TIPS.find((t) => !t.needs_source)
  if (!pending || !sourced) throw new Error('seed needs a pending and a sourced face tip')
  await expect(
    page.locator(`[data-tip="${pending.slug}"]`).getByText(en.sourcePending),
  ).toBeVisible()
  const link = page.locator(`[data-tip="${sourced.slug}"]`).getByRole('link').first()
  await expect(link).toHaveAttribute('href', sourced.sources[0] ?? '')
  await expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  await expect(link).toHaveAttribute('target', '_blank')
})

test('a hard load of a deep link with parameters (404 document) restores every control and filters', async ({
  page,
}) => {
  const response = await page.goto(
    `${BASE}/skincare?area=nails&audience=women&concern=nails&region=eu`,
  )
  expect(response?.status()).toBe(404)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(el.skincareTitle)
  await expect(page.getByRole('button', { name: el.skincareArea.nails })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await expect(page.getByRole('button', { name: el.skincareAudience.women })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await expect(page.getByLabel(el.skincareSkinTypeLabel)).toHaveCount(0)
  await expect(page.getByLabel(el.skincareConcernLabel)).toHaveValue('nails')
  await expect(page.getByLabel(el.skincareRegionLabelNails)).toHaveValue('eu')

  const routines = NAIL_ROUTINES.filter((r) => r.audience !== 'men')
  await expect(count(page, 'routines')).toHaveText(
    plural(el.skincareRoutinesCount, routines.length),
  )
  const types = NAIL_TYPES.filter(
    (p) =>
      (p.audiences.includes('women') || p.audiences.includes('all')) &&
      p.concerns.includes('nails') &&
      (p.regions.includes('eu') || p.regions.includes('global')),
  )
  await expect(count(page, 'guide')).toHaveText(plural(el.skincareGuideCount, types.length))
  await expect(page.locator('[data-product-type]')).toHaveCount(types.length)

  // Unknown values read as "everything"; a stale skin value under nails is ignored.
  await page.goto(`${BASE}/skincare?area=nails&skin=dry&audience=kids&region=mars`)
  await expect(count(page, 'routines')).toHaveText(
    plural(el.skincareRoutinesCount, NAIL_ROUTINES.length),
  )
  await expect(page.getByRole('button', { name: el.skincareAudience.all })).toHaveAttribute(
    'aria-pressed',
    'true',
  )

  // The nav marks Skincare current and the home card leads here.
  const nav = page.getByRole('banner').getByRole('navigation', { name: el.nav.label })
  await expect(nav.getByRole('link', { name: el.nav.skincare, exact: true })).toHaveAttribute(
    'aria-current',
    'page',
  )
  await page.goto(`${BASE}/`)
  await page
    .getByRole('region', { name: 'modules' })
    .getByRole('link', { name: el.modules.skincare.title, exact: true })
    .click()
  await expect(page).toHaveURL(new RegExp(`${BASE}/skincare$`))
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(el.skincareTitle)
})
