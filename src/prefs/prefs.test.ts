import { MODULE_IDS } from '../i18n/app'
import {
  GOALS,
  GOAL_MODULE,
  NO_PREFS,
  PREFS_STORAGE_KEY,
  applyPrefsToModules,
  parsePrefs,
  readPrefs,
  writePrefs,
  type Prefs,
} from './prefs'

/** An in-memory Storage double. */
function memory(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial))
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => {
      data.set(key, value)
    },
    data,
  }
}

const throwing = {
  getItem: (): string | null => {
    throw new Error('SecurityError')
  },
  setItem: (): void => {
    throw new Error('QuotaExceededError')
  },
}

const ANSWERED: Prefs = { goal: 'build-strength', diet: 'keto', activity: 'high', skipped: false }

describe('parsePrefs', () => {
  it('returns null for nothing stored, junk JSON and non-objects (a first visit)', () => {
    expect(parsePrefs(null)).toBeNull()
    expect(parsePrefs('{nope')).toBeNull()
    expect(parsePrefs('"keto"')).toBeNull()
    expect(parsePrefs('[1,2]')).toBeNull()
    expect(parsePrefs('null')).toBeNull()
  })

  it('reads a full record and drops unknown values field by field', () => {
    expect(parsePrefs(JSON.stringify(ANSWERED))).toEqual(ANSWERED)
    expect(
      parsePrefs(JSON.stringify({ goal: 'fly', diet: 'carnivore', activity: 3, skipped: 'yes' })),
    ).toEqual(NO_PREFS)
  })

  it('keeps a skipped record as skipped with no answers', () => {
    expect(parsePrefs('{"skipped":true}')).toEqual({ ...NO_PREFS, skipped: true })
  })
})

describe('readPrefs / writePrefs', () => {
  it('round-trips through the hygieia:prefs key', () => {
    const storage = memory()
    expect(PREFS_STORAGE_KEY).toBe('hygieia:prefs')
    expect(readPrefs(storage)).toBeNull()
    expect(writePrefs(ANSWERED, storage)).toBe(true)
    expect(storage.data.has(PREFS_STORAGE_KEY)).toBe(true)
    expect(readPrefs(storage)).toEqual(ANSWERED)
  })

  it('stores only the four known fields', () => {
    const storage = memory()
    const withExtra = { ...ANSWERED, extra: 'x' }
    writePrefs(withExtra, storage)
    expect(Object.keys(JSON.parse(storage.data.get(PREFS_STORAGE_KEY) ?? '{}'))).toEqual([
      'goal',
      'diet',
      'activity',
      'skipped',
    ])
  })

  it('never throws when storage is blocked or missing', () => {
    expect(readPrefs(throwing)).toBeNull()
    expect(writePrefs(ANSWERED, throwing)).toBe(false)
    expect(readPrefs(null)).toBeNull()
    expect(writePrefs(ANSWERED, null)).toBe(false)
  })

  it('defaults to window.localStorage', () => {
    window.localStorage.clear()
    expect(readPrefs()).toBeNull()
    writePrefs(ANSWERED)
    expect(window.localStorage.getItem(PREFS_STORAGE_KEY)).not.toBeNull()
    expect(readPrefs()).toEqual(ANSWERED)
    window.localStorage.clear()
  })
})

describe('applyPrefsToModules', () => {
  it('keeps the usual order without a goal (first visit, skipped, or no answer)', () => {
    expect(applyPrefsToModules(MODULE_IDS, null)).toEqual(MODULE_IDS)
    expect(applyPrefsToModules(MODULE_IDS, { ...NO_PREFS, skipped: true })).toEqual(MODULE_IDS)
    expect(applyPrefsToModules(MODULE_IDS, { ...NO_PREFS, diet: 'vegan' })).toEqual(MODULE_IDS)
  })

  it.each(GOALS)('puts the module of goal %s first and keeps the rest in order', (goal) => {
    const ordered = applyPrefsToModules(MODULE_IDS, { ...NO_PREFS, goal })
    const first = GOAL_MODULE[goal]
    expect(ordered[0]).toBe(first)
    expect(ordered.slice(1)).toEqual(MODULE_IDS.filter((id) => id !== first))
    expect([...ordered].sort()).toEqual([...MODULE_IDS].sort())
  })

  it('maps every goal to a distinct, existing module', () => {
    const modules = GOALS.map((goal) => GOAL_MODULE[goal])
    expect(new Set(modules).size).toBe(GOALS.length)
    for (const id of modules) expect(MODULE_IDS).toContain(id)
  })
})
