import { fill, plural, pluralForm } from './fill'

describe('fill', () => {
  it('replaces every placeholder with the stringified value', () => {
    expect(fill('{n} recipes for {who}', { n: 12, who: 'you' })).toBe('12 recipes for you')
    expect(fill('{a}{a}', { a: 'x' })).toBe('xx')
  })

  it('leaves an unknown placeholder visible instead of blanking it', () => {
    expect(fill('{n} of {total}', { n: 1 })).toBe('1 of {total}')
  })

  it('does not read inherited properties as values', () => {
    expect(fill('{toString}', {})).toBe('{toString}')
  })

  it('is a no-op on a template without placeholders', () => {
    expect(fill('plain', { n: 1 })).toBe('plain')
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
