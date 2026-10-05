import { RECIPES } from '../content/seed/recipes'
import { normalizeForSearch } from './match'
import {
  FRIDGE_STATE_VERSION,
  FRIDGE_STORAGE_KEY,
  defaultFridgeState,
  loadFridgeState,
  parseFridgeState,
  saveFridgeState,
  serializeFridgeState,
  type FridgeState,
} from './storage'

const DEFAULT: FridgeState = { slugs: [], ignoreStaples: true }

/** A minimal in-memory `Storage` stand-in. */
function memoryStorage(initial: Record<string, string> = {}) {
  const map = new Map(Object.entries(initial))
  return {
    map,
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => {
      map.set(key, value)
    },
  }
}

describe('constants', () => {
  it('uses the hygieia.fridge key and version 1', () => {
    expect(FRIDGE_STORAGE_KEY).toBe('hygieia.fridge')
    expect(FRIDGE_STATE_VERSION).toBe(1)
  })

  it('defaultFridgeState is a fresh object each call', () => {
    const a = defaultFridgeState()
    const b = defaultFridgeState()
    expect(a).toEqual(DEFAULT)
    expect(a).not.toBe(b)
    a.slugs.push('x')
    expect(b.slugs).toEqual([])
  })
})

describe('serializeFridgeState / parseFridgeState', () => {
  it('round-trips a state', () => {
    const state: FridgeState = { slugs: ['tomato', 'feta', 'olive-oil'], ignoreStaples: false }
    const raw = serializeFridgeState(state)
    expect(JSON.parse(raw)).toEqual({ v: 1, ...state })
    expect(parseFridgeState(raw)).toEqual(state)
  })

  it('round-trips the default', () => {
    expect(parseFridgeState(serializeFridgeState(defaultFridgeState()))).toEqual(DEFAULT)
  })

  it('dedupes and cleans slugs on serialize so storage never holds duplicates', () => {
    const raw = serializeFridgeState({ slugs: ['a', 'a', ' b ', ''], ignoreStaples: true })
    expect(JSON.parse(raw).slugs).toEqual(['a', 'b'])
  })

  it('accepts an already-parsed object as well as the JSON string', () => {
    expect(parseFridgeState({ v: 1, slugs: ['egg'], ignoreStaples: false })).toEqual({
      slugs: ['egg'],
      ignoreStaples: false,
    })
  })

  it.each([
    ['null', null],
    ['undefined', undefined],
    ['a number', 42],
    ['a boolean', true],
    ['an empty string', ''],
    ['junk JSON', '{not json'],
    ['a JSON array', '[1,2,3]'],
    ['a JSON string literal', '"hello"'],
    ['a JSON number', '7'],
    ['an array object', ['a']],
    ['an object without version', { slugs: ['a'], ignoreStaples: false }],
    ['an unknown version', { v: 2, slugs: ['a'], ignoreStaples: false }],
    ['a string version', { v: '1', slugs: ['a'], ignoreStaples: false }],
  ])('yields the default for %s', (_label, raw) => {
    expect(parseFridgeState(raw)).toEqual(DEFAULT)
  })

  it('validates each field independently on a versioned object', () => {
    expect(parseFridgeState({ v: 1 })).toEqual(DEFAULT)
    expect(parseFridgeState({ v: 1, slugs: 'tomato' })).toEqual(DEFAULT)
    expect(parseFridgeState({ v: 1, slugs: { 0: 'tomato' } })).toEqual(DEFAULT)
    expect(parseFridgeState({ v: 1, ignoreStaples: 'no' })).toEqual(DEFAULT)
    expect(parseFridgeState({ v: 1, ignoreStaples: false })).toEqual({
      slugs: [],
      ignoreStaples: false,
    })
    expect(parseFridgeState({ v: 1, slugs: ['egg'], ignoreStaples: 0 })).toEqual({
      slugs: ['egg'],
      ignoreStaples: true,
    })
  })

  it('drops non-string, blank and duplicate slugs, keeping first-seen order', () => {
    const parsed = parseFridgeState(
      JSON.stringify({
        v: 1,
        slugs: ['tomato', 3, null, 'feta', 'tomato', '', '  ', { slug: 'x' }, ' egg ', 'feta'],
        ignoreStaples: true,
      }),
    )
    expect(parsed.slugs).toEqual(['tomato', 'feta', 'egg'])
  })

  it('ignores extra keys', () => {
    expect(parseFridgeState({ v: 1, slugs: [], ignoreStaples: true, future: 1 })).toEqual(DEFAULT)
  })

  it('never throws on anything', () => {
    for (const raw of [Symbol('s'), () => 1, 1n, new Date(), /x/, '{"v":1,"slugs":[1,2]}'])
      expect(() => parseFridgeState(raw)).not.toThrow()
  })
})

describe('loadFridgeState / saveFridgeState', () => {
  it('saves under the key and loads back the same state', () => {
    const storage = memoryStorage()
    const state: FridgeState = { slugs: ['tomato', 'cucumber'], ignoreStaples: false }
    expect(saveFridgeState(storage, state)).toBe(true)
    expect(storage.map.has(FRIDGE_STORAGE_KEY)).toBe(true)
    expect(storage.map.size).toBe(1)
    expect(loadFridgeState(storage)).toEqual(state)
  })

  it('loads the default from an empty storage', () => {
    expect(loadFridgeState(memoryStorage())).toEqual(DEFAULT)
  })

  it('loads the default from junk under the key', () => {
    expect(loadFridgeState(memoryStorage({ [FRIDGE_STORAGE_KEY]: 'garbage' }))).toEqual(DEFAULT)
  })

  it('does not touch other keys', () => {
    const storage = memoryStorage({ 'hygieia.lang': 'el' })
    saveFridgeState(storage, { slugs: ['a'], ignoreStaples: true })
    expect(storage.getItem('hygieia.lang')).toBe('el')
  })

  it('a throwing getItem yields the default without throwing', () => {
    const storage = {
      getItem: (): string | null => {
        throw new Error('SecurityError')
      },
    }
    expect(() => loadFridgeState(storage)).not.toThrow()
    expect(loadFridgeState(storage)).toEqual(DEFAULT)
  })

  it('a throwing setItem returns false without throwing', () => {
    const storage = {
      setItem: (): void => {
        throw new Error('QuotaExceededError')
      },
    }
    expect(() => saveFridgeState(storage, DEFAULT)).not.toThrow()
    expect(saveFridgeState(storage, DEFAULT)).toBe(false)
  })

  it('works against the real window.localStorage in jsdom', () => {
    window.localStorage.clear()
    const state: FridgeState = { slugs: ['feta'], ignoreStaples: true }
    expect(saveFridgeState(window.localStorage, state)).toBe(true)
    expect(window.localStorage.getItem(FRIDGE_STORAGE_KEY)).toBe(serializeFridgeState(state))
    expect(loadFridgeState(window.localStorage)).toEqual(state)
    window.localStorage.clear()
  })
})

// --- normalizeForSearch on the real recipe titles (the typeahead/search contract P3.4 relies on) ---

describe('normalizeForSearch on real recipe titles', () => {
  const byTitle = (needle: string) =>
    RECIPES.filter((r) => normalizeForSearch(r.title_el).includes(normalizeForSearch(needle)))

  it('a query without accents finds Φασολάδα', () => {
    const hits = byTitle('φασολαδα')
    expect(hits.map((r) => r.slug)).toContain('fasolada-white-bean-soup')
  })

  it('upper-case and final-sigma variants agree', () => {
    expect(normalizeForSearch('ΦΑΣΟΛΆΔΑ')).toBe(normalizeForSearch('φασολαδα'))
    expect(normalizeForSearch('φακές')).toBe(normalizeForSearch('ΦΑΚΕΣ'))
    expect(byTitle('ΣΑΛΑΤΑ').length).toBeGreaterThan(0)
    expect(byTitle('ΣΑΛΑΤΑ')).toEqual(byTitle('σαλάτα'))
  })

  it('every real title is found by its own accent-stripped lower-cased form', () => {
    for (const r of RECIPES) {
      const stripped = r.title_el
        .normalize('NFD')
        .replace(/\p{M}+/gu, '')
        .toLowerCase()
      expect(normalizeForSearch(r.title_el).includes(normalizeForSearch(stripped))).toBe(true)
    }
  })
})
