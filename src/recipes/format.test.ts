import { UNITS } from '../content/enums'
import type { RecipeLineSeed } from '../content/types'
import { el, en } from '../i18n/dictionary'
import {
  dietName,
  formatLine,
  formatQuantity,
  formatRecipeLine,
  formatUnit,
  ingredientName,
  lineNote,
} from './format'

const feta = { name_el: 'Φέτα', name_en: 'Feta' }
const egg = { name_el: 'Αυγό', name_en: 'Egg' }
const garlic = { name_el: 'Σκόρδο', name_en: 'Garlic' }
const parsley = { name_el: 'Μαϊντανός', name_en: 'Fresh parsley' }

const line = (quantity: number, unit: RecipeLineSeed['unit'], slug = 'x'): RecipeLineSeed => ({
  ingredient_slug: slug,
  quantity,
  unit,
})

describe('formatQuantity', () => {
  it('prints whole numbers plainly', () => {
    expect(formatQuantity(2)).toBe('2')
    expect(formatQuantity(200, 'el')).toBe('200')
    expect(formatQuantity(1500, 'en')).toBe('1,500')
  })

  it('shows the cooking fractions as glyphs, alone or after a whole number', () => {
    expect(formatQuantity(0.25)).toBe('¼')
    expect(formatQuantity(0.5)).toBe('½')
    expect(formatQuantity(0.75)).toBe('¾')
    expect(formatQuantity(1.5)).toBe('1½')
    expect(formatQuantity(2.25, 'el')).toBe('2¼')
  })

  it('falls back to at most two decimals in the language number format', () => {
    expect(formatQuantity(0.1, 'en')).toBe('0.1')
    expect(formatQuantity(0.1, 'el')).toBe('0,1')
    expect(formatQuantity(1.333, 'en')).toBe('1.33')
  })

  it('does not blow up on a non-finite value', () => {
    expect(formatQuantity(Number.NaN)).toBe('NaN')
  })
})

describe('formatUnit', () => {
  it('takes every unit label from the dictionary in both languages', () => {
    for (const unit of UNITS) {
      expect(formatUnit(unit, 2, en)).toBe(en.units[unit].other)
      expect(formatUnit(unit, 1, en)).toBe(en.units[unit].one)
      expect(formatUnit(unit, 2, el)).toBe(el.units[unit].other)
      expect(formatUnit(unit, 1, el)).toBe(el.units[unit].one)
    }
  })

  it('pluralises the countable units and keeps the measures invariant', () => {
    expect(formatUnit('piece', 1, en)).toBe('piece')
    expect(formatUnit('piece', 2, en)).toBe('pieces')
    expect(formatUnit('clove', 3, en)).toBe('cloves')
    expect(formatUnit('slice', 2, el)).toBe('φέτες')
    expect(formatUnit('bunch', 1, el)).toBe('ματσάκι')
    expect(formatUnit('bunch', 2, el)).toBe('ματσάκια')
    expect(formatUnit('g', 200, el)).toBe('γρ.')
    expect(formatUnit('tbsp', 6, en)).toBe('tbsp')
  })

  it('treats a fraction below one as singular (½ piece)', () => {
    expect(formatUnit('piece', 0.5, en)).toBe('piece')
    expect(formatUnit('bunch', 0.5, el)).toBe('ματσάκι')
  })
})

describe('ingredientName / lineNote / dietName', () => {
  it('picks the name in the current language and falls back to the slug when hidden', () => {
    expect(ingredientName(line(1, 'g', 'feta'), feta, 'el')).toBe('Φέτα')
    expect(ingredientName(line(1, 'g', 'feta'), feta, 'en')).toBe('Feta')
    expect(ingredientName(line(1, 'g', 'feta'), null, 'en')).toBe('feta')
  })

  it('returns the note in the current language, or null when there is none', () => {
    const withNote: RecipeLineSeed = { ...line(400, 'g'), note_el: 'ξερά', note_en: 'dry' }
    expect(lineNote(withNote, 'el')).toBe('ξερά')
    expect(lineNote(withNote, 'en')).toBe('dry')
    expect(lineNote(line(1, 'g'), 'en')).toBeNull()
    expect(lineNote({ ...line(1, 'g'), note_el: ' ', note_en: ' ' }, 'en')).toBeNull()
  })

  it('names a diet in the current language', () => {
    const keto = { name_el: 'Κετογονική διατροφή (keto)', name_en: 'Ketogenic diet (keto)' }
    expect(dietName(keto, 'el')).toBe('Κετογονική διατροφή (keto)')
    expect(dietName(keto, 'en')).toBe('Ketogenic diet (keto)')
  })
})

describe('formatLine', () => {
  it('formats the examples from the task in both languages', () => {
    expect(formatLine(line(200, 'g'), feta, 'el', el)).toBe('200 γρ. Φέτα')
    expect(formatLine(line(200, 'g'), feta, 'en', en)).toBe('200 g Feta')
    expect(formatLine(line(2, 'piece'), egg, 'en', en)).toBe('2 pieces Egg')
    expect(formatLine(line(2, 'piece'), egg, 'el', el)).toBe('2 τεμάχια Αυγό')
    expect(formatLine(line(1, 'piece'), egg, 'en', en)).toBe('1 piece Egg')
  })

  it('pluralises cloves and bunches and shows fractions as glyphs', () => {
    expect(formatLine(line(1, 'clove'), garlic, 'en', en)).toBe('1 clove Garlic')
    expect(formatLine(line(2, 'clove'), garlic, 'en', en)).toBe('2 cloves Garlic')
    expect(formatLine(line(2, 'clove'), garlic, 'el', el)).toBe('2 σκελίδες Σκόρδο')
    expect(formatLine(line(0.5, 'bunch'), parsley, 'en', en)).toBe('½ bunch Fresh parsley')
    expect(formatLine(line(0.5, 'bunch'), parsley, 'el', el)).toBe('½ ματσάκι Μαϊντανός')
  })

  it('appends the note in parentheses and falls back to the slug for a hidden ingredient', () => {
    const beans: RecipeLineSeed = {
      ingredient_slug: 'white-beans',
      quantity: 400,
      unit: 'g',
      note_el: 'ξερά',
      note_en: 'dry',
    }
    expect(formatLine(beans, { name_el: 'Λευκά φασόλια', name_en: 'White beans' }, 'en', en)).toBe(
      '400 g White beans (dry)',
    )
    expect(formatLine(beans, null, 'el', el)).toBe('400 γρ. white-beans (ξερά)')
  })

  it('formatRecipeLine unwraps a resolved content-source line', () => {
    const resolved = {
      line: line(6, 'tbsp', 'olive-oil'),
      ingredient: null,
    }
    expect(formatRecipeLine(resolved, 'en', en)).toBe('6 tbsp olive-oil')
    expect(formatRecipeLine(resolved, 'el', el)).toBe('6 κ.σ. olive-oil')
  })
})
