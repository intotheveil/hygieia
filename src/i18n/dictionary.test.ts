import { containsPlaceholderMarkers, hasGreek, leaves, looksUntranslated } from '../test/bilingual'
import { LANGS, MODULE_IDS, dictionaries, el, en, type Dictionary } from './dictionary'
import { adminEn } from './features/admin.ts'
import { dietsEn } from './features/diets.ts'
import { fridgeEn } from './features/fridge.ts'
import { featuresEn } from './features/index.ts'
import { plansEn } from './features/plans.ts'
import { profileEn } from './features/profile.ts'
import { recipesEn } from './features/recipes.ts'
import { skincareEn } from './features/skincare.ts'
import { tasksEn } from './features/tasks.ts'
import { themeEn } from './features/theme.ts'
import { tipsEn } from './features/tips.ts'
import { workoutPlansEn } from './features/workoutPlans.ts'
import { workoutsEn } from './features/workouts.ts'

/** The eleven feature modules composed by `features/index.ts`, by name, over their `en` literal. */
const FEATURE_MODULES: Readonly<Record<string, object>> = {
  admin: adminEn,
  diets: dietsEn,
  fridge: fridgeEn,
  plans: plansEn,
  profile: profileEn,
  recipes: recipesEn,
  skincare: skincareEn,
  tasks: tasksEn,
  theme: themeEn,
  tips: tipsEn,
  workoutPlans: workoutPlansEn,
  workouts: workoutsEn,
}

/**
 * Brand names and loanwords an `el` leaf may legitimately share with its `en` twin (PLAN.md §0:
 * keto, paleo, Atkins, calisthenics stay Latin-script in Greek). Compared case-insensitively.
 * The switcher pair (`en.switchTo` = Ελληνικά, `el.switchTo` = English) is naturally different.
 */
const SAME_VALUE_ALLOWLIST: readonly string[] = [
  'Hygieia',
  'Atkins',
  'Whole30',
  'DASH',
  'calisthenics',
  'keto',
  'paleo',
  // The gamer theme's name is the same loanword in Greek gaming culture.
  'Gamer',
  // A Korean-style "essence" is sold under that word in Greek pharmacies too (skincare category).
  'Essence',
  // Units are written Latin-script in Greek too ("320 kcal").
  'kcal',
  'ml',
]

/** Keys whose `en` leaf may carry Greek script: the switcher names the other language in its own script. */
const GREEK_IN_EN_ALLOWLIST_KEYS: readonly string[] = [
  'switchTo',
  // The fridge search hint shows one example in each script, in both languages.
  'searchIngredientsPlaceholder',
]

/** Keys whose `el` leaf may carry no Greek script at all (the mirror of the rule above). */
const LATIN_IN_EL_ALLOWLIST_KEYS: readonly string[] = ['switchTo', 'types.calisthenics']

/** Below this length an `el` leaf may be a bare loanword (`Google`, `email`); at or above it, Greek is required. */
const MIN_EL_LENGTH_FOR_GREEK = 12

/** `Object.keys` at every object level, depth-first, so two literals can be compared for key ORDER. */
function keyOrder(obj: object, path = ''): string[] {
  const keys = Object.keys(obj)
  const here = `${path || '<root>'}: ${keys.join(',')}`
  const nested = Object.entries(obj).flatMap(([key, value]) =>
    value !== null && typeof value === 'object'
      ? keyOrder(value as object, path ? `${path}.${key}` : key)
      : [],
  )
  return [here, ...nested]
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

  it('describes all eight modules (six from the intent + skincare + tasks), in both languages', () => {
    expect(MODULE_IDS).toEqual([
      'tips',
      'diets',
      'recipes',
      'cost',
      'calories',
      'workouts',
      'skincare',
      'tasks',
    ])
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

describe('bilingual dictionary — completeness sweep (PLAN.md P5.5)', () => {
  const enByPath = new Map<string, string>(leaves(en))
  const elByPath = new Map<string, string>(leaves(el))

  it('never repeats the English in the Greek leaf, except allow-listed brands and loanwords', () => {
    for (const [path, elValue] of elByPath) {
      const enValue = enByPath.get(path) ?? ''
      expect(
        looksUntranslated(elValue, enValue, SAME_VALUE_ALLOWLIST),
        `${path}: el repeats en "${enValue}"`,
      ).toBe(false)
    }
  })

  it('carries no placeholder marker (TODO, ???, xxx, lorem, placeholder, FIXME) in any leaf', () => {
    for (const [lang, dict] of [
      ['en', en],
      ['el', el],
    ] as const) {
      for (const [path, value] of leaves(dict)) {
        expect(containsPlaceholderMarkers(value), `${lang}.${path} "${value}"`).toBe(false)
      }
    }
  })

  it(`writes every el leaf of ≥ ${MIN_EL_LENGTH_FOR_GREEK} characters in Greek script unless the key is allow-listed`, () => {
    for (const [path, value] of elByPath) {
      if (LATIN_IN_EL_ALLOWLIST_KEYS.includes(path)) continue
      if (value.length < MIN_EL_LENGTH_FOR_GREEK) continue
      expect(hasGreek(value), `el.${path} "${value}" has no Greek script`).toBe(true)
    }
  })

  it('writes every en leaf without Greek script unless the key is allow-listed', () => {
    for (const [path, value] of enByPath) {
      if (GREEK_IN_EN_ALLOWLIST_KEYS.includes(path)) continue
      expect(hasGreek(value), `en.${path} "${value}" contains Greek script`).toBe(false)
    }
  })

  it('the key allow-lists only name keys that exist and actually need the exception', () => {
    for (const path of GREEK_IN_EN_ALLOWLIST_KEYS) {
      const value = enByPath.get(path)
      expect(value, `${path} missing from en`).toBeDefined()
      expect(hasGreek(value ?? ''), `${path} no longer needs the Greek-in-en exception`).toBe(true)
    }
    for (const path of LATIN_IN_EL_ALLOWLIST_KEYS) {
      const value = elByPath.get(path)
      expect(value, `${path} missing from el`).toBeDefined()
      expect(hasGreek(value ?? ''), `${path} no longer needs the Latin-in-el exception`).toBe(false)
    }
  })

  it('declares the keys in the same order in the en and el literals, at every nesting level', () => {
    expect(keyOrder(el)).toEqual(keyOrder(en))
    expect(Object.keys(el)).toEqual(Object.keys(en))
    expect(Object.keys(el.modules)).toEqual(Object.keys(en.modules))
  })
})

describe('bilingual dictionary — one owner per key (features/index.ts rule; P3/P4 review fix 3)', () => {
  // Spreading the feature literals means a key declared by two modules is NOT a type error when the
  // types agree — the last spread silently wins (`sourcePending` was declared by diets AND tips until
  // 2026-10-06). This map makes the rule a failing test instead of a comment.
  const owners = new Map<string, string[]>()
  for (const [module, literal] of Object.entries(FEATURE_MODULES)) {
    for (const key of Object.keys(literal)) {
      owners.set(key, [...(owners.get(key) ?? []), module])
    }
  }

  it('composes exactly the eleven feature modules and nothing else', () => {
    const union = new Set(Object.values(FEATURE_MODULES).flatMap((literal) => Object.keys(literal)))
    expect([...union].sort()).toEqual(Object.keys(featuresEn).sort())
  })

  it('gives every feature key exactly one owning module (no key declared by two features)', () => {
    const shared = [...owners].filter(([, modules]) => modules.length !== 1)
    expect(shared, `keys with ≠ 1 owner: ${JSON.stringify(shared)}`).toEqual([])
    expect(owners.size).toBeGreaterThan(0)
  })

  it('declares no feature key that the base dictionary already owns', () => {
    // `en = { ...baseEn, ...featuresEn }` and the base literal is module-private, so read the overlap
    // off the composed object's INSERTION ORDER: a key first inserted by `baseEn` keeps its base
    // position even when a feature re-declares it, so the feature-owned keys must form exactly the
    // tail of `Object.keys(en)` (base keys first, then every feature key, nothing interleaved).
    const keys = Object.keys(en)
    const featureKeys = Object.keys(featuresEn)
    const firstFeature = keys.findIndex((key) => owners.has(key))
    expect(firstFeature).toBeGreaterThan(0) // the base owns at least one key, and it comes first
    const head = keys.slice(0, firstFeature)
    const tail = keys.slice(firstFeature)
    expect(head.filter((key) => owners.has(key))).toEqual([])
    expect(tail).toEqual(featureKeys)
    expect(keys.length).toBe(head.length + featureKeys.length)
  })
})
