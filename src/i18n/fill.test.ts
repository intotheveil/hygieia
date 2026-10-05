import { describe, expect, it } from 'vitest'
import { fill } from './fill'

describe('fill', () => {
  it('replaces every {token} with its value, numbers included', () => {
    expect(fill('You have {have}/{total}', { have: 5, total: 6 })).toBe('You have 5/6')
    expect(fill('{missing} → use {use}', { missing: 'Feta', use: 'Ricotta' })).toBe(
      'Feta → use Ricotta',
    )
  })

  it('replaces a repeated token everywhere', () => {
    expect(fill('{n} + {n}', { n: 2 })).toBe('2 + 2')
  })

  it('leaves an unknown token as written so a missing variable is visible, and ignores extras', () => {
    expect(fill('{n} recipes match', {})).toBe('{n} recipes match')
    expect(fill('plain text', { n: 1 })).toBe('plain text')
  })

  it('does not read inherited properties as values', () => {
    expect(fill('{toString}', {})).toBe('{toString}')
  })
})
