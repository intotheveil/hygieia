import { describe, expect, it } from 'vitest'
import { fill, plural, pluralForm } from './fill'

describe('fill', () => {
  it('replaces every placeholder with the stringified value, numbers included', () => {
    expect(fill('{n} recipes for {who}', { n: 12, who: 'you' })).toBe('12 recipes for you')
    expect(fill('You have {have}/{total}', { have: 5, total: 6 })).toBe('You have 5/6')
    expect(fill('{missing} → use {use}', { missing: 'Feta', use: 'Ricotta' })).toBe(
      'Feta → use Ricotta',
    )
  })

  it('replaces a repeated placeholder everywhere', () => {
    expect(fill('{n} + {n}', { n: 2 })).toBe('2 + 2')
    expect(fill('{a}{a}', { a: 'x' })).toBe('xx')
  })

  it('leaves an unknown placeholder visible instead of blanking it, and ignores extras', () => {
    expect(fill('{n} of {total}', { n: 1 })).toBe('1 of {total}')
    expect(fill('{n} recipes match', {})).toBe('{n} recipes match')
    expect(fill('plain text', { n: 1 })).toBe('plain text')
  })

  it('does not read inherited properties as values', () => {
    expect(fill('{toString}', {})).toBe('{toString}')
  })
})

describe('pluralForm / plural', () => {
  const forms = { one: '{n} recipe', other: '{n} recipes' }

  it('uses `one` for exactly 1 and for fractions below 1 (½ piece)', () => {
    expect(pluralForm(forms, 1)).toBe(forms.one)
    expect(pluralForm(forms, 0.5)).toBe(forms.one)
  })

  it('uses `other` for 0, for 1.5 and above, and for negatives', () => {
    expect(pluralForm(forms, 0)).toBe(forms.other)
    expect(pluralForm(forms, 1.5)).toBe(forms.other)
    expect(pluralForm(forms, 2)).toBe(forms.other)
    expect(pluralForm(forms, -1)).toBe(forms.other)
  })

  it('fills {n} with the count, or with a supplied display string', () => {
    expect(plural(forms, 1)).toBe('1 recipe')
    expect(plural(forms, 152)).toBe('152 recipes')
    expect(plural(forms, 0.5, '½')).toBe('½ recipe')
  })
})
