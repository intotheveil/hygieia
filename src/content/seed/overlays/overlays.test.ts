// CONTENT OVERLAYS — the pure applier (./apply.ts), the contract (./types.ts) and the real overlay
// list (./index.ts). What is proven here:
//   * a patch replaces ONLY the columns in its `set`; base arrays and rows are never mutated; a
//     table no overlay touches is returned as the same array;
//   * an addition is appended (content rows, recipe lines, diet tags, template slots);
//   * unknown slug / natural key → throws; duplicate addition slug → throws; a non-editable column
//     (status, id, slug, a child array) → throws (and is a TYPE error); empty set → throws;
//     overlay ids out of order → throws; the cross-column seed rules are re-checked;
//   * PATCH_COLUMNS equals the admin's EDITABLE_COLUMNS for every content table (= the UPDATE grant);
//   * every real overlay applies cleanly to the full base seed, and the bundled source serves it.

import { describe, expect, it } from 'vitest'
import { EDITABLE_COLUMNS } from '../../../admin/adminSource.ts'
import { bundledSource } from '../../bundled.ts'
import { CONTENT_TABLES } from '../../enums.ts'
import type { HealthTipSeed, RecipeSeed, WorkoutTemplateSeed } from '../../types.ts'
import { DIETS } from '../diets.ts'
import { EXERCISES } from '../exercises.ts'
import { INGREDIENTS } from '../ingredients.ts'
import { RECIPES } from '../recipes.ts'
import { SKINCARE_PRODUCT_TYPES, SKINCARE_ROUTINES, SKINCARE_TIPS } from '../skincare.ts'
import { HEALTH_TIPS } from '../tips.ts'
import { WORKOUT_TEMPLATES } from '../workouts.ts'
import { applyOverlays, checkOverlayIds, overlayTable } from './apply.ts'
import { OVERLAY as O0001 } from './0001-fix-typos.ts'
import { OVERLAY as O0002 } from './0002-tip-sources.ts'
import { OVERLAYS } from './index.ts'
import { OVERLAY_ID_RE, PATCH_COLUMNS, type Overlay, type SeedBase } from './types.ts'

// --- fixtures -------------------------------------------------------------------------------------

const tip = (slug: string, over: Partial<HealthTipSeed> = {}): HealthTipSeed => ({
  slug,
  topic: 'sleep',
  title_el: `τ ${slug}`,
  title_en: `t ${slug}`,
  body_el: `σ ${slug}`,
  body_en: `b ${slug}`,
  source_url: null,
  needs_source: true,
  ...over,
})

const recipe = (slug: string): RecipeSeed => ({
  slug,
  title_el: `συνταγή ${slug}`,
  title_en: `recipe ${slug}`,
  steps_el: ['βήμα'],
  steps_en: ['step'],
  portions: 2,
  prep_min: 10,
  meal_types: ['lunch'],
  image_path: null,
  ingredients: [
    { ingredient_slug: 'feta', quantity: 100, unit: 'g' },
    { ingredient_slug: 'olive-oil', quantity: 1, unit: 'tbsp', note_el: 'σ', note_en: 'n' },
  ],
  diet_slugs: ['vegetarian'],
})

const template = (slug: string): WorkoutTemplateSeed => ({
  slug,
  workout_type: 'home',
  level: 'beginner',
  intensity: 'low',
  title_el: 'Σπίτι',
  title_en: 'Home',
  duration_min: 20,
  notes_el: 'σ',
  notes_en: 'n',
  blocks: [
    { block: 'main', exercise_slug: 'squat', sets: 3, reps: 10, seconds: null, rest_seconds: 60 },
  ],
})

const base = (): Pick<SeedBase, 'health_tips' | 'recipes' | 'workout_templates'> => ({
  health_tips: Object.freeze([tip('a'), tip('b')]),
  recipes: Object.freeze([recipe('salad')]),
  workout_templates: Object.freeze([template('home-beginner-low')]),
})

const ov = (id: string, rest: Omit<Overlay, 'id' | 'summary'>): Overlay => ({
  id,
  summary: 'test',
  ...rest,
})

// --- the applier -----------------------------------------------------------------------------------

describe('applyOverlays — patches', () => {
  it('replaces only the columns in `set`; the base array and rows are untouched', () => {
    const b = base()
    const before = JSON.stringify(b)
    const out = applyOverlays(b, [
      ov('0001-x', { patches: { health_tips: [{ slug: 'b', set: { body_en: 'fixed' } }] } }),
    ])
    expect(out.health_tips[1]).toEqual({ ...tip('b'), body_en: 'fixed' })
    expect(out.health_tips[0]).toBe(b.health_tips[0])
    expect(out.health_tips).not.toBe(b.health_tips)
    expect(JSON.stringify(b)).toBe(before)
  })

  it('returns an untouched table as the SAME array', () => {
    const b = base()
    const out = applyOverlays(b, [
      ov('0001-x', { patches: { health_tips: [{ slug: 'a', set: { title_en: 'T' } }] } }),
    ])
    expect(out.recipes).toBe(b.recipes)
    expect(out.workout_templates).toBe(b.workout_templates)
    expect(applyOverlays(b, []).health_tips).toBe(b.health_tips)
  })

  it('later overlays see earlier ones (patch an addition from an earlier overlay)', () => {
    const out = applyOverlays(base(), [
      ov('0001-add', { additions: { health_tips: [tip('c')] } }),
      ov('0002-fix', { patches: { health_tips: [{ slug: 'c', set: { body_en: 'v2' } }] } }),
    ])
    expect(out.health_tips.map((t) => [t.slug, t.body_en])).toEqual([
      ['a', 'b a'],
      ['b', 'b b'],
      ['c', 'v2'],
    ])
  })

  it('patches a recipe line by (recipe_slug, position) and a template slot by (template_slug, position)', () => {
    const b = base()
    const out = applyOverlays(b, [
      ov('0001-x', {
        patches: {
          recipe_ingredients: [{ recipe_slug: 'salad', position: 0, set: { quantity: 150 } }],
          workout_template_exercises: [
            { template_slug: 'home-beginner-low', position: 0, set: { reps: 12 } },
          ],
        },
      }),
    ])
    expect(out.recipes[0]?.ingredients[0]).toEqual({
      ingredient_slug: 'feta',
      quantity: 150,
      unit: 'g',
    })
    // the untouched line is the same object; the patched one is new; the base line is unchanged
    expect(out.recipes[0]?.ingredients[1]).toBe(b.recipes[0]?.ingredients[1])
    expect(b.recipes[0]?.ingredients[0]?.quantity).toBe(100)
    expect(out.workout_templates[0]?.blocks[0]?.reps).toBe(12)
  })

  it('throws on an unknown slug or natural key', () => {
    const b = base()
    expect(() =>
      applyOverlays(b, [
        ov('0001-x', { patches: { health_tips: [{ slug: 'nope', set: { body_en: 'x' } }] } }),
      ]),
    ).toThrow(/overlay 0001-x: patch health_tips\/nope: unknown slug "nope"/)
    expect(() =>
      applyOverlays(b, [
        ov('0001-x', {
          patches: {
            recipe_ingredients: [{ recipe_slug: 'salad', position: 2, set: { quantity: 1 } }],
          },
        }),
      ]),
    ).toThrow(/position must be an integer in \[0, 2\)/)
    expect(() =>
      applyOverlays(b, [
        ov('0001-x', {
          patches: {
            recipe_ingredients: [{ recipe_slug: 'soup', position: 0, set: { quantity: 1 } }],
          },
        }),
      ]),
    ).toThrow(/unknown recipe_slug "soup"/)
  })

  it('a patch targets rows that exist BEFORE its overlay (patches run before additions)', () => {
    expect(() =>
      applyOverlays(base(), [
        ov('0001-x', {
          patches: { health_tips: [{ slug: 'c', set: { body_en: 'x' } }] },
          additions: { health_tips: [tip('c')] },
        }),
      ]),
    ).toThrow(/unknown slug "c"/)
  })

  it('refuses a non-editable column (status, id, slug, a child array) and an empty set', () => {
    const attempt =
      (set: Record<string, unknown>, table = 'health_tips', slug = 'a') =>
      () =>
        applyOverlays(base(), [
          // reason: deliberately bypassing the PatchSet type to prove the runtime guard.
          {
            id: '0001-x',
            summary: 't',
            patches: { [table]: [{ slug, set }] },
          } as unknown as Overlay,
        ])
    expect(attempt({ status: 'approved' })).toThrow(
      /column "status" is not an editable content column of health_tips/,
    )
    expect(attempt({ id: 'x' })).toThrow(/column "id" is not an editable/)
    expect(attempt({ slug: 'z' })).toThrow(/column "slug" is not an editable/)
    expect(attempt({ ingredients: [] }, 'recipes', 'salad')).toThrow(
      /column "ingredients" is not an editable content column of recipes/,
    )
    expect(attempt({})).toThrow(/`set` is empty/)
    expect(attempt({ body_en: undefined })).toThrow(/set\.body_en is undefined/)
  })

  it('the TYPE forbids a non-editable column too', () => {
    const typed: Overlay = {
      id: '0001-x',
      summary: 't',
      patches: {
        // @ts-expect-error reason: status is not an editable content column (the contract under test)
        health_tips: [{ slug: 'a', set: { status: 'approved' } }],
      },
    }
    expect(typed.id).toBe('0001-x')
  })

  it('re-checks the seed rules: needs_source must follow source_url; notes come as a pair', () => {
    expect(() =>
      applyOverlays(base(), [
        ov('0001-x', {
          patches: { health_tips: [{ slug: 'a', set: { source_url: 'https://www.who.int/' } }] },
        }),
      ]),
    ).toThrow(/health_tips\/a: needs_source must equal \(source_url === null\)/)
    const sourced = applyOverlays(base(), [
      ov('0001-x', {
        patches: {
          health_tips: [
            { slug: 'a', set: { source_url: 'https://www.who.int/', needs_source: false } },
          ],
        },
      }),
    ])
    expect(sourced.health_tips[0]?.needs_source).toBe(false)
    expect(() =>
      applyOverlays(base(), [
        ov('0001-x', {
          patches: {
            recipe_ingredients: [{ recipe_slug: 'salad', position: 0, set: { note_el: 'μ' } }],
          },
        }),
      ]),
    ).toThrow(/recipes\/salad line 0: note_el and note_en come as a pair/)
  })
})

describe('applyOverlays — additions', () => {
  it('appends content rows, recipe lines, diet tags and template slots', () => {
    const out = applyOverlays(base(), [
      ov('0001-x', {
        additions: {
          health_tips: [tip('c')],
          recipes: [recipe('soup')],
          recipe_ingredients: [
            { recipe_slug: 'salad', ingredient_slug: 'tomato', quantity: 2, unit: 'piece' },
          ],
          recipe_diets: [{ recipe_slug: 'salad', diet_slug: 'vegan' }],
          workout_template_exercises: [
            {
              template_slug: 'home-beginner-low',
              block: 'cooldown',
              exercise_slug: 'stretch',
              sets: 1,
              reps: null,
              seconds: 60,
              rest_seconds: 0,
            },
          ],
        },
      }),
    ])
    expect(out.health_tips.map((t) => t.slug)).toEqual(['a', 'b', 'c'])
    expect(out.recipes.map((r) => r.slug)).toEqual(['salad', 'soup'])
    expect(out.recipes[0]?.ingredients.at(-1)).toEqual({
      ingredient_slug: 'tomato',
      quantity: 2,
      unit: 'piece',
    })
    expect(out.recipes[0]?.diet_slugs).toEqual(['vegetarian', 'vegan'])
    expect(out.workout_templates[0]?.blocks.map((b) => b.exercise_slug)).toEqual([
      'squat',
      'stretch',
    ])
  })

  it('throws on a duplicate addition slug (base, earlier overlay, same list) and a duplicate tag', () => {
    const b = base()
    const add = (id: string, tips: HealthTipSeed[]) => ov(id, { additions: { health_tips: tips } })
    expect(() => applyOverlays(b, [add('0001-x', [tip('a')])])).toThrow(
      /overlay 0001-x: add health_tips\/a: duplicate slug "a"/,
    )
    expect(() => applyOverlays(b, [add('0001-x', [tip('c')]), add('0002-y', [tip('c')])])).toThrow(
      /overlay 0002-y: add health_tips\/c: duplicate slug "c"/,
    )
    expect(() => applyOverlays(b, [add('0001-x', [tip('c'), tip('c')])])).toThrow(
      /duplicate slug "c"/,
    )
    expect(() =>
      applyOverlays(b, [
        ov('0001-x', {
          additions: { recipe_diets: [{ recipe_slug: 'salad', diet_slug: 'vegetarian' }] },
        }),
      ]),
    ).toThrow(/duplicate diet tag "vegetarian"/)
    expect(() =>
      applyOverlays(b, [add('0001-x', [{ ...tip('c'), status: 'approved' } as HealthTipSeed])]),
    ).toThrow(/an addition carries no id and no status/)
    expect(() => applyOverlays(b, [add('0001-x', [tip('Bad Slug')])])).toThrow(/malformed slug/)
  })
})

describe('overlay ids', () => {
  it('must be NNNN-<slug>, unique and strictly increasing', () => {
    expect(() => checkOverlayIds([ov('0002-a', {}), ov('0001-b', {})])).toThrow(
      /strictly increasing/,
    )
    expect(() => checkOverlayIds([ov('0001-a', {}), ov('0001-b', {})])).toThrow(
      /strictly increasing/,
    )
    expect(() => checkOverlayIds([ov('1-a', {})])).toThrow(/NNNN-<slug>/)
    expect(() => checkOverlayIds([ov('0001-A', {})])).toThrow(/NNNN-<slug>/)
    expect(() => checkOverlayIds([ov('0001-a', {}), ov('0003-b', {})])).not.toThrow()
  })
})

// --- the contract ----------------------------------------------------------------------------------

describe('PATCH_COLUMNS', () => {
  it.each(CONTENT_TABLES)(
    '%s: equals the admin EDITABLE_COLUMNS (the UPDATE grant minus status)',
    (t) => {
      expect([...PATCH_COLUMNS[t]]).toEqual([...EDITABLE_COLUMNS[t]])
    },
  )
  it('never lists id, slug, status, the review stamp or the timestamps', () => {
    const banned = [
      'id',
      'slug',
      'status',
      'reviewed_at',
      'reviewed_by',
      'created_at',
      'updated_at',
    ]
    for (const cols of Object.values(PATCH_COLUMNS))
      for (const c of cols) expect(banned).not.toContain(c)
  })
})

// --- the real overlays -----------------------------------------------------------------------------

const FULL_BASE: SeedBase = {
  ingredients: INGREDIENTS,
  diets: DIETS,
  recipes: RECIPES,
  exercises: EXERCISES,
  workout_templates: WORKOUT_TEMPLATES,
  health_tips: HEALTH_TIPS,
  skincare_product_types: SKINCARE_PRODUCT_TYPES,
  skincare_routines: SKINCARE_ROUTINES,
  skincare_tips: SKINCARE_TIPS,
}

describe('the real overlay list (./index.ts)', () => {
  it('ids are well-formed and in order; 0001-fix-typos is first', () => {
    expect(OVERLAYS.length).toBeGreaterThanOrEqual(1)
    for (const o of OVERLAYS) expect(o.id).toMatch(OVERLAY_ID_RE)
    expect(OVERLAYS[0]).toBe(O0001)
    expect(() => checkOverlayIds(OVERLAYS)).not.toThrow()
  })

  it('applies cleanly to the full base seed; every patched value lands, the rest is untouched', () => {
    const out = applyOverlays(FULL_BASE, OVERLAYS)
    const fish = out.health_tips.find((t) => t.slug === 'nutrition-fish-twice-a-week')
    expect(fish?.body_en).toMatch(/they make a ten-minute meal\.$/)
    expect(fish?.body_el).toBe(
      HEALTH_TIPS.find((t) => t.slug === 'nutrition-fish-twice-a-week')?.body_el,
    )
    const sun = out.skincare_tips.find(
      (t) => t.slug === 'face-all-sunscreen-every-day-clouds-included',
    )
    expect(sun?.body_el).toContain('Βάλ’ το ως τελευταίο βήμα')
    expect(sun?.body_el).not.toContain('το το')
    expect(out.health_tips).toHaveLength(HEALTH_TIPS.length)
    // a table no overlay touches comes back as the SAME array (0003 adds ingredients, diets, recipes;
    // 0004 patches every ingredient in place: base rows keep their order, new values)
    expect(out.exercises).toBe(EXERCISES)
    expect(out.ingredients).toHaveLength(INGREDIENTS.length + 2)
    expect(out.ingredients.slice(0, INGREDIENTS.length).map((r) => r.slug)).toEqual(
      INGREDIENTS.map((r) => r.slug),
    )
    const feta = out.ingredients.find((r) => r.slug === 'feta')
    expect(feta?.source_note).toMatch(/^CIQUAL 2020/)
    expect(feta?.price_as_of).toBe('2026-10-06')
    expect(feta?.name_el).toBe(INGREDIENTS.find((r) => r.slug === 'feta')?.name_el)
  })

  it('overlayTable applies the list to one table (what the bundled loaders call)', () => {
    const tips = overlayTable('health_tips', HEALTH_TIPS, OVERLAYS)
    expect(tips.find((t) => t.slug === 'nutrition-fish-twice-a-week')?.body_en).toMatch(/they make/)
    expect(overlayTable('exercises', EXERCISES, OVERLAYS)).toBe(EXERCISES)
    expect(overlayTable('diets', DIETS, OVERLAYS).map((d) => d.slug)).toContain('fasting')
  })

  it('the bundled source serves the overlaid rows', async () => {
    const res = await bundledSource.listTips()
    if (!res.ok) throw new Error(res.error)
    const fish = res.data.find((t) => t.slug === 'nutrition-fish-twice-a-week')
    expect(fish?.body_en).toMatch(/they make a ten-minute meal\.$/)
    const sk = await bundledSource.listSkincareTips()
    if (!sk.ok) throw new Error(sk.error)
    expect(
      sk.data.find((t) => t.slug === 'face-all-sunscreen-every-day-clouds-included')?.body_el,
    ).toContain('Βάλ’ το ως τελευταίο βήμα')
  })
})

describe('overlay 0002-tip-sources (every unsourced tip gets a checked source)', () => {
  const unsourcedHealth = HEALTH_TIPS.filter((t) => t.needs_source).map((t) => t.slug)
  const unsourcedSkincare = SKINCARE_TIPS.filter((t) => t.needs_source).map((t) => t.slug)
  const healthPatches = O0002.patches?.health_tips ?? []
  const skincarePatches = O0002.patches?.skincare_tips ?? []

  it('is registered second, after 0001', () => {
    expect(OVERLAYS.indexOf(O0002)).toBe(1)
  })

  it('patches exactly the 17 health and 26 skincare tips the base seed left unsourced', () => {
    expect(unsourcedHealth).toHaveLength(17)
    expect(unsourcedSkincare).toHaveLength(26)
    expect(healthPatches.map((p) => p.slug).sort()).toEqual([...unsourcedHealth].sort())
    expect(skincarePatches.map((p) => p.slug).sort()).toEqual([...unsourcedSkincare].sort())
    expect(O0002.additions).toBeUndefined()
  })

  it('every patch sets a real https source and needs_source: false', () => {
    for (const p of healthPatches) {
      expect(p.set.needs_source, p.slug).toBe(false)
      expect(p.set.source_url, p.slug).toMatch(/^https:\/\/[a-z0-9.-]+\//)
    }
    for (const p of skincarePatches) {
      expect(p.set.needs_source, p.slug).toBe(false)
      expect(p.set.sources?.length, p.slug).toBeGreaterThan(0)
      for (const url of p.set.sources ?? []) expect(url, p.slug).toMatch(/^https:\/\/[a-z0-9.-]+\//)
      expect(new Set(p.set.sources).size, `${p.slug} repeats a source`).toBe(p.set.sources?.length)
    }
  })

  it('a wording change always comes as an EL + EN pair', () => {
    for (const p of [...healthPatches, ...skincarePatches]) {
      const set: Record<string, unknown> = p.set
      expect('body_el' in set, `${p.slug} body pair`).toBe('body_en' in set)
      expect('title_el' in set, `${p.slug} title pair`).toBe('title_en' in set)
    }
  })

  it('after the full overlay list no tip is unsourced, and the bundled source serves them sourced', async () => {
    const out = applyOverlays(FULL_BASE, OVERLAYS)
    expect(out.health_tips.filter((t) => t.needs_source)).toEqual([])
    expect(out.skincare_tips.filter((t) => t.needs_source)).toEqual([])
    expect(out.health_tips).toHaveLength(HEALTH_TIPS.length)
    expect(out.skincare_tips).toHaveLength(SKINCARE_TIPS.length)
    const tips = await bundledSource.listTips()
    if (!tips.ok) throw new Error(tips.error)
    expect(tips.data.every((t) => !t.needs_source && t.source_url !== null)).toBe(true)
    const sk = await bundledSource.listSkincareTips()
    if (!sk.ok) throw new Error(sk.error)
    expect(sk.data.every((t) => !t.needs_source && t.sources.length > 0)).toBe(true)
    // 0001's sunscreen fix (a 0002-untouched row) survives the later overlay
    expect(
      sk.data.find((t) => t.slug === 'face-all-sunscreen-every-day-clouds-included')?.body_el,
    ).toContain('Βάλ’ το ως τελευταίο βήμα')
  })
})
