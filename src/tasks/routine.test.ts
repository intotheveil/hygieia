import { describe, expect, it } from 'vitest'
import { bundledSource } from '../content/bundled'
import type { SkincareProductType, SkincareRoutine } from '../content/source'
import { loadTopic } from './content/index'
import { normalizeAnswers } from './generate'
import {
  HABIT_TOPIC,
  answersFromParams,
  fromSkincareRoutine,
  habitLink,
  routineSlugFrom,
} from './routine'
import { trackFor } from './track'

// A /skincare routine → the skincare-habit task plan (connect the features, 2026-10-06): the deep
// link, the pre-filled answers and the "Your routine" section, over the REAL bundled seed.

async function seed(): Promise<{ routines: SkincareRoutine[]; types: SkincareProductType[] }> {
  const [r, t] = await Promise.all([
    bundledSource.listSkincareRoutines(),
    bundledSource.listSkincareProductTypes(),
  ])
  if (!r.ok || !t.ok) throw new Error('seed failed to load')
  return { routines: r.data, types: t.data }
}

const paramsOf = (link: string) => new URLSearchParams(link.split('?')[1] ?? '')

describe('habitLink / routineSlugFrom / answersFromParams', () => {
  it('links to the skincare-habit topic with slug, skin, time and area', () => {
    const link = habitLink({ slug: 'face-dry-pm', skin_type: 'dry', time: 'pm', area: 'face' })
    expect(link).toBe(`/tasks/${HABIT_TOPIC}?routine=face-dry-pm&skin=dry&time=pm&area=face`)
    const p = paramsOf(link)
    expect(routineSlugFrom(p)).toBe('face-dry-pm')
    expect(answersFromParams(p)).toEqual({ skin: ['dry'] })
  })

  it('a routine for every skin type sends no skin; a nail routine pre-selects nail care', () => {
    const link = habitLink({ slug: 'nails-basic', skin_type: 'all', time: 'weekly', area: 'nails' })
    expect(link).not.toContain('skin=')
    expect(answersFromParams(paramsOf(link))).toEqual({ extras: ['nails'] })
  })

  it('ignores malformed slugs and unknown skin types', () => {
    expect(routineSlugFrom(new URLSearchParams('routine=../../x'))).toBeNull()
    expect(routineSlugFrom(new URLSearchParams(''))).toBeNull()
    expect(answersFromParams(new URLSearchParams('skin=all&area=face'))).toEqual({})
    expect(answersFromParams(new URLSearchParams('skin=scaly'))).toEqual({})
  })

  it('every bundled routine links to answers the questionnaire accepts unchanged', async () => {
    const { routines } = await seed()
    const topic = await loadTopic(HABIT_TOPIC)
    expect(routines.length).toBeGreaterThan(0)
    for (const routine of routines) {
      const answers = answersFromParams(paramsOf(habitLink(routine)))
      expect(normalizeAnswers(topic, answers), routine.slug).toEqual(answers)
    }
  })
})

describe('fromSkincareRoutine', () => {
  it('turns every step into a task, in order, titled by the product type and noted by the step', async () => {
    const { routines, types } = await seed()
    const routine = routines.find((r) => r.area === 'face' && r.time === 'am')!
    const section = fromSkincareRoutine(routine, types)
    expect(section.slug).toBe(routine.slug)
    expect(section.time).toBe('am')
    expect(section.title).toEqual({ el: routine.name_el, en: routine.name_en })
    const steps = [...routine.steps].sort((a, b) => a.order - b.order)
    expect(section.tasks.map((t) => t.id)).toEqual(steps.map((s) => `routine-face-${s.order}`))
    steps.forEach((step, i) => {
      const type = types.find((t) => t.slug === step.product_type_slug)!
      const t = section.tasks[i]!
      expect(t.title).toEqual({ el: type.name_el, en: type.name_en })
      expect(t.detail).toEqual({ el: step.note_el, en: step.note_en })
      expect(t.cadence).toBe('daily')
      expect(t.minutes).toBeGreaterThanOrEqual(1)
      expect(trackFor(HABIT_TOPIC, t)?.kind).toBe('skincare')
    })
    expect(section.optional).toEqual(
      steps.filter((s) => s.optional).map((s) => `routine-face-${s.order}`),
    )
  })

  it('a weekly nail routine gives weekly nail tasks; an unknown type falls back to the slug', async () => {
    const { routines } = await seed()
    const nails = routines.find((r) => r.area === 'nails')!
    const section = fromSkincareRoutine({ ...nails, time: 'weekly' }, [])
    for (const t of section.tasks) {
      expect(t.id).toMatch(/^routine-nails-\d+$/)
      expect(t.cadence).toBe('weekly')
      expect(trackFor(HABIT_TOPIC, t)?.kind).toBe('nails')
    }
    const first = [...nails.steps].sort((a, b) => a.order - b.order)[0]!
    expect(section.tasks[0]!.title).toEqual({
      el: first.product_type_slug,
      en: first.product_type_slug,
    })
  })

  it('splits the duration evenly over the steps, at least a minute each', async () => {
    const { routines } = await seed()
    const r = routines[0]!
    const section = fromSkincareRoutine({ ...r, duration_min: 1 })
    for (const t of section.tasks) expect(t.minutes).toBe(1)
    const ten = fromSkincareRoutine({ ...r, duration_min: r.steps.length * 3 })
    for (const t of ten.tasks) expect(t.minutes).toBe(3)
  })
})
