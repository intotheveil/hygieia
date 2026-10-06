import { DIETS } from '../content/seed/diets'
import { RECIPES } from '../content/seed/recipes'
import { TOPIC_IDS } from '../tasks/content/topics'
import {
  ACTIVITY_WORKOUT_LEVEL,
  GOAL_TASK_TOPICS,
  applyPrefsToRecipeParams,
  applyPrefsToWorkoutParams,
  isPreferredDiet,
  prefersSkincare,
  suggestedTaskTopics,
} from './apply'
import { ACTIVITY_LEVELS, GOALS, NO_PREFS, PREF_DIETS, type Prefs } from './prefs'

const p = (patch: Partial<Prefs>): Prefs => ({ ...NO_PREFS, ...patch })

describe('PREF_DIETS', () => {
  it('is a subset of the diet catalogue, and every one has recipes to filter to', () => {
    const slugs = new Set(DIETS.map((d) => d.slug))
    for (const diet of PREF_DIETS) {
      expect(slugs.has(diet), diet).toBe(true)
      expect(
        RECIPES.some((r) => r.diet_slugs.includes(diet)),
        diet,
      ).toBe(true)
    }
  })
})

describe('applyPrefsToRecipeParams', () => {
  it('fills an empty filter with the preferred diet, keeping other params', () => {
    const out = applyPrefsToRecipeParams(new URLSearchParams('utm=x'), p({ diet: 'vegan' }))
    expect(out?.get('diet')).toBe('vegan')
    expect(out?.get('utm')).toBe('x')
  })

  it.each(['diet=keto', 'meal=lunch', 'q=soup', 'diet='])(
    'leaves an explicit filter alone (%s) — the URL wins',
    (search) => {
      expect(applyPrefsToRecipeParams(new URLSearchParams(search), p({ diet: 'vegan' }))).toBeNull()
    },
  )

  it('does nothing without a diet preference', () => {
    expect(applyPrefsToRecipeParams(new URLSearchParams(), null)).toBeNull()
    expect(applyPrefsToRecipeParams(new URLSearchParams(), p({ goal: 'skin' }))).toBeNull()
  })

  it('does not mutate its input', () => {
    const search = new URLSearchParams()
    applyPrefsToRecipeParams(search, p({ diet: 'keto' }))
    expect(search.toString()).toBe('')
  })
})

describe('applyPrefsToWorkoutParams', () => {
  it.each(ACTIVITY_LEVELS)('activity %s sets the default level', (activity) => {
    const out = applyPrefsToWorkoutParams(new URLSearchParams('type=gym'), p({ activity }))
    expect(out.get('level')).toBe(ACTIVITY_WORKOUT_LEVEL[activity])
    expect(out.get('type')).toBe('gym')
  })

  it('maps low → beginner, moderate → intermediate, high → advanced', () => {
    expect(ACTIVITY_WORKOUT_LEVEL).toEqual({
      low: 'beginner',
      moderate: 'intermediate',
      high: 'advanced',
    })
  })

  it('an explicit ?level= wins', () => {
    const search = new URLSearchParams('level=beginner')
    expect(applyPrefsToWorkoutParams(search, p({ activity: 'high' })).get('level')).toBe('beginner')
  })

  it('returns the same params without an activity preference, never mutating', () => {
    const search = new URLSearchParams('type=home')
    expect(applyPrefsToWorkoutParams(search, null)).toBe(search)
    applyPrefsToWorkoutParams(search, p({ activity: 'low' }))
    expect(search.has('level')).toBe(false)
  })
})

describe('isPreferredDiet / suggestedTaskTopics / prefersSkincare', () => {
  it('matches only the chosen diet', () => {
    expect(isPreferredDiet(p({ diet: 'keto' }), 'keto')).toBe(true)
    expect(isPreferredDiet(p({ diet: 'keto' }), 'vegan')).toBe(false)
    expect(isPreferredDiet(null, 'keto')).toBe(false)
  })

  it('suggests real task topics for every goal and none without one', () => {
    expect(suggestedTaskTopics(null)).toEqual([])
    expect(suggestedTaskTopics(p({ diet: 'keto' }))).toEqual([])
    for (const goal of GOALS) {
      const topics = suggestedTaskTopics(p({ goal }))
      expect(topics.length).toBeGreaterThan(0)
      for (const id of topics) expect(TOPIC_IDS).toContain(id)
      expect(topics).toBe(GOAL_TASK_TOPICS[goal])
    }
    expect(suggestedTaskTopics(p({ goal: 'skin' }))[0]).toBe('skincare-habit')
  })

  it('points to skincare only for the skin goal', () => {
    expect(prefersSkincare(p({ goal: 'skin' }))).toBe(true)
    for (const goal of GOALS.filter((g) => g !== 'skin')) {
      expect(prefersSkincare(p({ goal }))).toBe(false)
    }
    expect(prefersSkincare(null)).toBe(false)
  })
})
