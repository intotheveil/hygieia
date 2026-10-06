import { describe, expect, it } from 'vitest'
import { bundledSource } from '../content/bundled'
import { cellFromParams, templateIdForCell } from '../workouts/plans/builder'
import { loadTopic } from './content/index'
import { WORKOUT_TOPIC, workoutCellFor, workoutPlanLink } from './links'

// workout-routine answers → /workouts/plans?type=&level=&intensity= (connect the features,
// 2026-10-06), and the plans page's reading of it.

describe('workoutPlanLink', () => {
  it('maps place, level and a gentle start onto a template cell', () => {
    expect(workoutPlanLink({ level: ['new'], place: ['home'] })).toBe(
      '/workouts/plans?type=home&level=beginner&intensity=low',
    )
    expect(workoutPlanLink({ level: ['regular'], place: ['gym'] })).toBe(
      '/workouts/plans?type=gym&level=intermediate&intensity=moderate',
    )
    expect(workoutCellFor({ level: ['returning'], place: ['outdoors'] })).toEqual({
      type: 'running',
      level: 'beginner',
      intensity: 'low',
    })
    expect(workoutCellFor({})).toEqual({ type: 'home', level: 'beginner', intensity: 'low' })
  })

  it('every level × place of the questionnaire lands on a bundled template', async () => {
    const topic = await loadTopic(WORKOUT_TOPIC)
    const templates = await bundledSource.listWorkoutTemplates()
    if (!templates.ok) throw new Error('templates')
    const levels = topic.questions.find((q) => q.id === 'level')!.options
    const places = topic.questions.find((q) => q.id === 'place')!.options
    expect(levels.length * places.length).toBe(9)
    for (const level of levels) {
      for (const place of places) {
        const link = workoutPlanLink({ level: [level.id], place: [place.id] })
        const cell = cellFromParams(new URLSearchParams(link.split('?')[1]))
        expect(cell, link).not.toBeNull()
        expect(templateIdForCell(templates.data, cell!), link).not.toBeNull()
      }
    }
  })
})

describe('cellFromParams', () => {
  it('needs a valid type and level; intensity defaults to moderate', () => {
    expect(cellFromParams(new URLSearchParams('type=gym&level=advanced&intensity=high'))).toEqual({
      type: 'gym',
      level: 'advanced',
      intensity: 'high',
    })
    expect(cellFromParams(new URLSearchParams('type=gym&level=advanced'))).toEqual({
      type: 'gym',
      level: 'advanced',
      intensity: 'moderate',
    })
    expect(cellFromParams(new URLSearchParams('type=gym&level=expert'))).toBeNull()
    expect(cellFromParams(new URLSearchParams('level=beginner'))).toBeNull()
    expect(cellFromParams(new URLSearchParams('template=abc'))).toBeNull()
  })
})
