import { describe, expect, it } from 'vitest'
import { bundledSource } from '../../content/bundled'
import { OVERLAID_SEED } from '../../test/overlaidSeed'
import { templateFor } from '../session'
import { cellFromParams, templateIdForCell } from './builder'

// Workout tracks (20261007001250): a cell may hold one template PER track. The pure pickers default
// to `general`, so every existing caller keeps its template; a track is chosen only when named.

describe('templateFor / templateIdForCell — tracks', () => {
  it('templateFor defaults to the general track and picks the named one', () => {
    const all = OVERLAID_SEED.workout_templates
    expect(templateFor(all, 'gym', 'beginner', 'moderate')?.slug).toBe('gym-beginner-moderate')
    expect(templateFor(all, 'gym', 'beginner', 'moderate', 'women-strength')?.slug).toBe(
      'women-strength-gym-beginner-full-body-a',
    )
    // a cell the track does not fill is null, never a general template
    expect(templateFor(all, 'swimming', 'advanced', 'high', 'women-strength')).toBeNull()
  })

  it('cellFromParams carries a known ?track= only; templateIdForCell honours it', async () => {
    expect(
      cellFromParams(new URLSearchParams('track=women-strength&type=home&level=intermediate')),
    ).toEqual({
      type: 'home',
      level: 'intermediate',
      intensity: 'moderate',
      track: 'women-strength',
    })
    expect(cellFromParams(new URLSearchParams('track=bogus&type=home&level=beginner'))).toEqual({
      type: 'home',
      level: 'beginner',
      intensity: 'moderate',
    })

    const res = await bundledSource.listWorkoutTemplates()
    if (!res.ok) throw new Error(res.error)
    const bySlug = new Map(res.data.map((t) => [t.slug, t]))
    const cell = { type: 'home', level: 'intermediate', intensity: 'moderate' } as const
    expect(templateIdForCell(res.data, cell)).toBe(bySlug.get('home-intermediate-moderate')?.id)
    expect(templateIdForCell(res.data, { ...cell, track: 'women-strength' })).toBe(
      bySlug.get('women-strength-home-intermediate-glutes-core')?.id,
    )
  })
})
