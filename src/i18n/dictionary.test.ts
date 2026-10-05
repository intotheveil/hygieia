import { LANGS, MODULE_IDS, dictionaries, el, en, type Dictionary } from './dictionary'

/** Every leaf string in a dictionary, with its dotted path. */
function leaves(obj: unknown, path = ''): Array<[string, string]> {
  if (typeof obj === 'string') return [[path, obj]]
  if (obj && typeof obj === 'object') {
    return Object.entries(obj).flatMap(([k, v]) => leaves(v, path ? `${path}.${k}` : k))
  }
  return []
}

describe('bilingual dictionary', () => {
  it('has exactly the two languages, Greek first (the default)', () => {
    expect(LANGS).toEqual(['el', 'en'])
    expect(Object.keys(dictionaries).sort()).toEqual(['el', 'en'])
  })

  it('carries the same keys in both languages, and no empty string anywhere', () => {
    const enKeys = leaves(en).map(([k]) => k)
    const elKeys = leaves(el).map(([k]) => k)
    expect(elKeys).toEqual(enKeys)
    for (const dict of [en, el]) {
      for (const [path, value] of leaves(dict)) {
        expect(value.trim(), `${path} is blank`).not.toBe('')
      }
    }
  })

  it('describes all six modules from the intent, in both languages', () => {
    expect(MODULE_IDS).toEqual(['tips', 'diets', 'recipes', 'cost', 'calories', 'workouts'])
    for (const dict of [en, el] as Dictionary[]) {
      for (const id of MODULE_IDS) {
        expect(dict.modules[id].title).not.toBe('')
        expect(dict.modules[id].blurb).not.toBe('')
      }
    }
  })

  it('writes Greek in Greek script and English without it', () => {
    const greek = /[Ͱ-Ͽ]/
    expect(greek.test(el.heroTitle)).toBe(true)
    expect(greek.test(en.heroTitle)).toBe(false)
    // The switcher names the OTHER language in that language's own script.
    expect(en.switchTo).toBe('Ελληνικά')
    expect(el.switchTo).toBe('English')
  })
})
