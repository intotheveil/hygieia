// @vitest-environment node
//
// CONTENT OVERLAYS in the seed generator (scripts/gen-seed-sql.mjs). What is proven here:
//   * the committed overlay migrations equal a fresh generation, and the base seed files are not
//     touched by overlays (seed:check over both);
//   * file naming `20261007<NNNN>00_hygieia_overlay_<name>.sql`; PATCH_FORMAT covers PATCH_COLUMNS;
//   * END TO END on real Postgres (PGlite, the gate's shim): a test overlay with every patch and
//     addition shape is generated in a temp copy of the seed, the whole archive + that overlay are
//     applied (the overlay twice — idempotent), and the DB then holds exactly what `applyOverlays`
//     (the bundled source's function) says: patched columns changed and nothing else, an APPROVED
//     row stays approved, additions land `pending` with md5 ids, appended children at the next
//     position; the generated SQL passes the static guard and the gate's overlay scan;
//   * generator errors: an unknown slug, an unlisted overlay module; seed:check drift: differs,
//     missing, extra.

import { PGlite } from '@electric-sql/pglite'
import { cpSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { applyOverlays } from '../src/content/seed/overlays/apply.ts'
import { OVERLAYS } from '../src/content/seed/overlays/index.ts'
import { OVERLAY_TABLES, PATCH_COLUMNS, type Overlay } from '../src/content/seed/overlays/types.ts'
import { DIETS } from '../src/content/seed/diets.ts'
import { INGREDIENTS } from '../src/content/seed/ingredients.ts'
import { RECIPES } from '../src/content/seed/recipes.ts'
import { SKINCARE_ROUTINES, SKINCARE_TIPS } from '../src/content/seed/skincare.ts'
import { WORKOUT_TEMPLATES } from '../src/content/seed/workouts.ts'
import { checkMigrationSql } from './check-migrations.mjs'
import { scanOverlaySql } from './db-gate/overlay-scan.mjs'
import { installShim } from './db-gate/shim.mjs'
import {
  DEFAULT_MIGRATIONS_DIR,
  DEFAULT_SEED_DIR,
  PATCH_FORMAT,
  SEED_FILE_RE,
  compareOverlays,
  generateOverlays,
  main,
  normalizeLf,
  overlayFile,
  seedId,
} from './gen-seed-sql.mjs'

const tmpDirs: string[] = []
const tmp = (label: string) => {
  const d = mkdtempSync(path.join(tmpdir(), `hygieia-overlay-${label}-`))
  tmpDirs.push(d)
  return d
}
afterAll(() => {
  for (const d of tmpDirs) rmSync(d, { recursive: true, force: true })
})

/** A temp copy of src/content/seed with `extra` overlays written and listed after the real ones. */
function seedCopy(label: string, extra: Overlay[], opts: { listExtra?: boolean } = {}) {
  // The seed modules import ../enums.ts, so the copy is the whole src/content tree.
  const root = tmp(label)
  cpSync(path.dirname(DEFAULT_SEED_DIR), path.join(root, 'content'), { recursive: true })
  const dir = path.join(root, 'content', 'seed')
  const odir = path.join(dir, 'overlays')
  const real = readdirSync(odir).filter((f) => /^\d{4}-.*\.ts$/.test(f) && !f.endsWith('.test.ts'))
  for (const o of extra)
    writeFileSync(
      path.join(odir, `${o.id}.ts`),
      `export const OVERLAY = ${JSON.stringify(o, null, 2)}\n`,
    )
  const listed = [
    ...real.map((f) => f.replace(/\.ts$/, '')),
    ...(opts.listExtra === false ? [] : extra.map((o) => o.id)),
  ]
  writeFileSync(
    path.join(odir, 'index.ts'),
    listed.map((id, i) => `import { OVERLAY as O${i} } from './${id}.ts'\n`).join('') +
      `export const OVERLAYS = [${listed.map((_, i) => `O${i}`).join(', ')}]\n`,
  )
  return dir
}

const R0 = RECIPES[0]
const T0 = WORKOUT_TEMPLATES[0]
const ROUTINE = SKINCARE_ROUTINES[0]
if (!R0 || !T0 || !ROUTINE) throw new Error('seed is empty')
const ING = INGREDIENTS.find(
  (i) => i.unit === 'g' && !R0.ingredients.some((l) => l.ingredient_slug === i.slug),
)
const NEW_TAG = DIETS.find((d) => !R0.diet_slugs.includes(d.slug))
if (!ING || !NEW_TAG) throw new Error('no free ingredient / diet for the fixture')

/** One overlay exercising every patch and addition shape. */
const TEST_OVERLAY: Overlay = {
  id: '0900-everything',
  summary: 'test overlay: every patch and addition shape',
  patches: {
    recipes: [{ slug: R0.slug, set: { title_en: 'Patched title', image_path: 'recipes/x.webp' } }],
    recipe_ingredients: [
      {
        recipe_slug: R0.slug,
        position: 0,
        set: { quantity: 999, ingredient_slug: ING.slug, unit: 'g' },
      },
    ],
    workout_template_exercises: [{ template_slug: T0.slug, position: 0, set: { sets: 9 } }],
    skincare_routines: [
      {
        slug: ROUTINE.slug,
        set: {
          steps: [
            {
              ...ROUTINE.steps[0],
              order: 1,
              note_en: 'patched step',
            } as (typeof ROUTINE.steps)[number],
          ],
        },
      },
    ],
    skincare_tips: [{ slug: SKINCARE_TIPS[0]?.slug ?? '', set: { title_en: 'O’Brien’s tip' } }],
  },
  additions: {
    ingredients: [{ ...ING, slug: 'zz-test-herb', name_el: 'Βότανο', name_en: "Cook's herb" }],
    recipes: [
      {
        ...R0,
        slug: 'zz-test-dish',
        title_en: 'Test dish',
        ingredients: [{ ingredient_slug: 'zz-test-herb', quantity: 5, unit: 'g' }],
        diet_slugs: [NEW_TAG.slug],
      },
    ],
    recipe_ingredients: [
      {
        recipe_slug: R0.slug,
        ingredient_slug: 'zz-test-herb',
        quantity: 3,
        unit: 'g',
        note_el: 'σ',
        note_en: 'n',
      },
    ],
    recipe_diets: [{ recipe_slug: R0.slug, diet_slug: NEW_TAG.slug }],
    workout_template_exercises: [
      { ...(T0.blocks[0] as (typeof T0.blocks)[number]), template_slug: T0.slug, sets: 1 },
    ],
    health_tips: [
      {
        slug: 'zz-test-tip',
        topic: 'sleep',
        title_el: 'τ',
        title_en: 't',
        body_el: 'σ',
        body_en: 'b',
        source_url: null,
        needs_source: true,
      },
    ],
  },
}

// --- contract -------------------------------------------------------------------------------------

describe('overlay contract in the generator', () => {
  it('names the migration 20261007<NNNN>00_hygieia_overlay_<name>.sql', () => {
    expect(overlayFile('0001-fix-typos')).toBe('20261007000100_hygieia_overlay_fix_typos.sql')
    expect(overlayFile('0042-greek-dishes')).toBe('20261007004200_hygieia_overlay_greek_dishes.sql')
    expect(() => overlayFile('42-x')).toThrow(/NNNN-<slug>/)
    expect(SEED_FILE_RE.test(overlayFile('0001-x'))).toBe(false)
  })
  it.each(OVERLAY_TABLES)('%s: PATCH_FORMAT has a formatter for exactly the PATCH_COLUMNS', (t) => {
    expect(Object.keys(PATCH_FORMAT[t] ?? {})).toEqual([...PATCH_COLUMNS[t]])
  })
})

// --- the committed overlays -----------------------------------------------------------------------

describe('the committed overlay migrations', () => {
  it('equal a fresh generation (what seed:check asserts), and pass the guard and the scan', async () => {
    const gen = await generateOverlays()
    expect(gen.files.size).toBeGreaterThanOrEqual(1)
    const { ok, problems, identical } = compareOverlays(gen, DEFAULT_MIGRATIONS_DIR)
    expect(problems).toEqual([])
    expect(ok).toBe(true)
    expect(identical).toHaveLength(gen.files.size)
    for (const [file, sql] of gen.files) {
      expect(normalizeLf(readFileSync(path.join(DEFAULT_MIGRATIONS_DIR, file), 'utf8'))).toBe(sql)
      expect(checkMigrationSql(file, sql)).toEqual([])
      expect(scanOverlaySql(file, sql)).toEqual([])
      expect(sql).not.toMatch(/\bstatus\s*=/)
    }
  })
  it('seed:check reports base and overlay files separately', async () => {
    const lines: string[] = []
    expect(await main(['--check'], { log: (l) => lines.push(l) })).toBe(0)
    expect(lines.at(-1)).toMatch(
      /^seed:check: OK — \d+ seed migration\(s\) identical .*\(7 base \+ \d+ overlay\)$/,
    )
    expect(lines).toContain(
      'seed:check: 20261007000100_hygieia_overlay_fix_typos.sql — overlay 0001-fix-typos: patches health_tips 1, skincare_tips 1; additions none',
    )
  })
})

// --- end to end -------------------------------------------------------------------------------------

describe('an overlay with every shape, end to end on Postgres', () => {
  let sql: string
  let db: PGlite
  const q = async <T>(text: string) => (await db.query<T>(text)).rows

  beforeAll(async () => {
    const seedDir = seedCopy('e2e', [TEST_OVERLAY])
    const gen = await generateOverlays({ seedDir })
    sql = gen.files.get(overlayFile(TEST_OVERLAY.id)) ?? ''
    db = new PGlite()
    await installShim(db)
    for (const f of readdirSync(DEFAULT_MIGRATIONS_DIR)
      .filter((x) => x.endsWith('.sql'))
      .sort())
      await db.exec(readFileSync(path.join(DEFAULT_MIGRATIONS_DIR, f), 'utf8'))
    // The lead approved R0 live before this overlay: it must stay approved.
    await db.exec(`update hygieia.recipes set status = 'approved' where slug = '${R0.slug}'`)
    await db.exec(sql)
    await db.exec(sql) // idempotent
  }, 120_000)
  afterAll(async () => {
    await db?.close()
  })

  it('generates patches first, then additions, through the base renderer, and passes guard + scan', () => {
    expect(sql).toMatch(/^-- GENERATED by scripts\/gen-seed-sql\.mjs/)
    expect(sql).toContain('-- Overlay: src/content/seed/overlays/0900-everything.ts — test overlay')
    expect(sql.indexOf('update hygieia.')).toBeLessThan(sql.indexOf('insert into hygieia.'))
    expect(sql).toContain(`where slug = '${R0.slug}';`)
    expect(sql).toContain(`and "position" = 0;`)
    expect(sql).toContain(`title_en = 'O’Brien’s tip'`)
    expect(sql).toContain(`name_en, category`) // the base column list
    expect(sql).not.toMatch(/^insert into hygieia\.\w+ \([^)]*\bstatus\b/m)
    expect(checkMigrationSql(overlayFile(TEST_OVERLAY.id), sql)).toEqual([])
    expect(scanOverlaySql('x', sql)).toEqual([])
  })

  it('patched columns change, the rest stays; an approved row stays approved', async () => {
    const [r] = await q<{ title_en: string; title_el: string; image_path: string; status: string }>(
      `select title_en, title_el, image_path, status from hygieia.recipes where slug = '${R0.slug}'`,
    )
    expect(r).toEqual({
      title_en: 'Patched title',
      title_el: R0.title_el,
      image_path: 'recipes/x.webp',
      status: 'approved',
    })
  })

  it('the DB equals applyOverlays (the bundled source) for every touched recipe and template', async () => {
    // The DB holds the REAL overlays first (0003 tags R0 `fasting`), then the test overlay.
    const expected = applyOverlays({ recipes: RECIPES, workout_templates: WORKOUT_TEMPLATES }, [
      ...OVERLAYS,
      TEST_OVERLAY,
    ])
    for (const slug of [R0.slug, 'zz-test-dish']) {
      const want = expected.recipes.find((r) => r.slug === slug)
      const lines = await q<{
        ingredient_id: string
        quantity: string
        unit: string
        note_en: string | null
      }>(
        `select ingredient_id, quantity::text, unit, note_en from hygieia.recipe_ingredients
          where recipe_id = '${seedId('recipes', slug)}' order by position`,
      )
      expect(lines).toEqual(
        want?.ingredients.map((l) => ({
          ingredient_id: seedId('ingredients', l.ingredient_slug),
          quantity: String(l.quantity),
          unit: l.unit,
          note_en: l.note_en ?? null,
        })),
      )
      const tags = await q<{ diet_id: string }>(
        `select diet_id from hygieia.recipe_diets where recipe_id = '${seedId('recipes', slug)}' order by diet_id`,
      )
      expect(tags.map((t) => t.diet_id)).toEqual(
        [...(want?.diet_slugs ?? [])].map((d) => seedId('diets', d)).sort(),
      )
    }
    const slots = await q<{ sets: number }>(
      `select sets from hygieia.workout_template_exercises
        where template_id = '${seedId('workout_templates', T0.slug)}' order by position`,
    )
    expect(slots.map((s) => s.sets)).toEqual(
      expected.workout_templates.find((t) => t.slug === T0.slug)?.blocks.map((b) => b.sets),
    )
    expect(slots[0]?.sets).toBe(9)
  })

  it('additions land pending, with md5 ids', async () => {
    const rows = await q<{ t: string; id: string; slug: string; status: string }>(
      `select 'ingredients' as t, id::text, slug, status from hygieia.ingredients where slug like 'zz-%'
       union all select 'recipes', id::text, slug, status from hygieia.recipes where slug like 'zz-%'
       union all select 'health_tips', id::text, slug, status from hygieia.health_tips where slug like 'zz-%'
       order by 1`,
    )
    expect(rows).toEqual([
      {
        t: 'health_tips',
        id: seedId('health_tips', 'zz-test-tip'),
        slug: 'zz-test-tip',
        status: 'pending',
      },
      {
        t: 'ingredients',
        id: seedId('ingredients', 'zz-test-herb'),
        slug: 'zz-test-herb',
        status: 'pending',
      },
      {
        t: 'recipes',
        id: seedId('recipes', 'zz-test-dish'),
        slug: 'zz-test-dish',
        status: 'pending',
      },
    ])
  })

  it('a jsonb steps patch is normalised like the base seed', async () => {
    const [r] = await q<{ steps: unknown }>(
      `select steps from hygieia.skincare_routines where slug = '${ROUTINE.slug}'`,
    )
    expect(r?.steps).toEqual([
      {
        order: 1,
        product_type_slug: ROUTINE.steps[0]?.product_type_slug,
        note_el: ROUTINE.steps[0]?.note_el,
        note_en: 'patched step',
        optional: ROUTINE.steps[0]?.optional,
      },
    ])
  })
})

// --- errors and drift ---------------------------------------------------------------------------------

describe('generator errors and seed:check drift', () => {
  it('an unknown slug is a generator error naming the overlay', async () => {
    const bad: Overlay = {
      id: '0901-bad',
      summary: 'bad',
      patches: { health_tips: [{ slug: 'no-such-tip', set: { body_en: 'x' } }] },
    }
    await expect(generateOverlays({ seedDir: seedCopy('unknown', [bad]) })).rejects.toThrow(
      /overlay 0901-bad: patch health_tips\/no-such-tip: unknown slug/,
    )
  })
  it('a reference that does not resolve is a generator error', async () => {
    const bad: Overlay = {
      id: '0901-bad',
      summary: 'bad',
      additions: { recipe_diets: [{ recipe_slug: R0.slug, diet_slug: 'no-such-diet' }] },
    }
    await expect(generateOverlays({ seedDir: seedCopy('fk', [bad]) })).rejects.toThrow(
      /diets slug "no-such-diet" does not resolve/,
    )
  })
  it('an overlay module index.ts does not list is an error', async () => {
    const o: Overlay = { id: '0901-x', summary: 'x', patches: TEST_OVERLAY.patches }
    await expect(
      generateOverlays({ seedDir: seedCopy('unlisted', [o], { listExtra: false }) }),
    ).rejects.toThrow(
      // the real list grows with every overlay; what must hold is that the unlisted module is named
      /overlays\/index\.ts lists \[0001-fix-typos\.ts[^\]]*\] but the directory holds \[[^\]]*0901-x\.ts\]/,
    )
  })
  it('differs / missing / extra overlay files are named', async () => {
    const gen = await generateOverlays()
    const dir = tmp('drift')
    cpSync(DEFAULT_MIGRATIONS_DIR, dir, { recursive: true })
    const file = overlayFile('0001-fix-typos')
    writeFileSync(path.join(dir, file), readFileSync(path.join(dir, file), 'utf8') + '-- edited\n')
    writeFileSync(path.join(dir, '20261007099900_hygieia_overlay_stray.sql'), '-- stray\n')
    expect(compareOverlays(gen, dir).problems).toEqual([
      `differs  ${file} (run npm run seed:gen)`,
      'extra    20261007099900_hygieia_overlay_stray.sql (no overlay module generates it)',
    ])
    rmSync(path.join(dir, file))
    expect(compareOverlays(gen, dir).problems).toContain(`missing  ${file} (run npm run seed:gen)`)
    const lines: string[] = []
    expect(await main(['--check'], { migrationsDir: dir, log: (l) => lines.push(l) })).toBe(1)
    expect(lines.at(-1)).toMatch(/^seed:check: FAIL — 2 file\(s\) out of step/)
  })
})
