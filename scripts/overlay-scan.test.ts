// @vitest-environment node
//
// The gate's static overlay scan (scripts/db-gate/overlay-scan.mjs). What is proven here:
//   * the committed overlay migrations scan clean, and every one of their patches is found as a
//     target (table + WHERE with literals intact) for the gate's "hits exactly one row" check;
//   * an UPDATE that sets status / id / slug / reviewed_by / an unknown column is a problem, also
//     when it hides behind an editable column in the same statement;
//   * text INSIDE a literal (`status = 'x'; delete …`, `where`, commas) never fools the scan;
//   * a blind UPDATE (no WHERE), an INSERT naming status, an INSERT without `on conflict do
//     nothing`, and any other statement (delete, alter, grant, DO) are problems;
//   * child tables take their DB `*_id` column, never the overlay's `*_slug` key.

import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import {
  OVERLAY_FILE_RE,
  editableDbColumns,
  maskSql,
  overlayPatchTargets,
  scanOverlayDir,
  scanOverlaySql,
} from './db-gate/overlay-scan.mjs'

const ARCHIVE = fileURLToPath(new URL('../supabase/migrations', import.meta.url))
const F = '29991231235959_hygieia_overlay_t.sql'

describe('the committed archive', () => {
  it('every overlay migration scans clean and each patch is a target', () => {
    const { files, problems, targets } = scanOverlayDir(ARCHIVE)
    expect(files.length).toBeGreaterThanOrEqual(1)
    expect(files).toContain('20261007000100_hygieia_overlay_fix_typos.sql')
    expect(problems).toEqual([])
    for (const f of files) {
      const sql = readFileSync(path.join(ARCHIVE, f), 'utf8')
      const updates = sql.match(/^update hygieia\./gm) ?? []
      expect(targets.filter((t) => t.file === f)).toHaveLength(updates.length)
    }
    expect(targets).toContainEqual({
      file: '20261007000100_hygieia_overlay_fix_typos.sql',
      table: 'health_tips',
      where: "slug = 'nutrition-fish-twice-a-week'",
    })
  })
  it('names overlay files by the rule', () => {
    expect(OVERLAY_FILE_RE.test('20261007000100_hygieia_overlay_fix_typos.sql')).toBe(true)
    expect(OVERLAY_FILE_RE.test('20261006001000_hygieia_seed_tips.sql')).toBe(false)
  })
})

describe('maskSql', () => {
  it('blanks literal contents and comments, keeping the length', () => {
    const sql = "update t set a = 'x; status = ''y''' -- status\nwhere b = 1; /* id */"
    const m = maskSql(sql)
    expect(m).toHaveLength(sql.length)
    expect(m).not.toContain('status')
    expect(m).not.toContain('id')
    expect(m).toContain("a = '")
    expect(m).toContain('where b = 1;')
  })
})

describe('scanOverlaySql', () => {
  const upd = (set: string, where = "where slug = 'a'") =>
    `update hygieia.health_tips set\n  ${set}\n${where};\n`

  it('passes an UPDATE of editable columns', () => {
    expect(
      scanOverlaySql(F, upd("body_en = 'x', title_el = 'Τίτλος, με κόμμα', needs_source = false")),
    ).toEqual([])
  })
  it.each([
    'status',
    'id',
    'slug',
    'reviewed_by',
    'reviewed_at',
    'created_at',
    'updated_at',
    'nope',
  ])('refuses SET %s, also next to an editable column', (col) => {
    const want = [`${F}: update hygieia.health_tips sets "${col}" — not an editable content column`]
    expect(scanOverlaySql(F, upd(`${col} = 'x'`))).toEqual(want)
    expect(scanOverlaySql(F, upd(`body_en = 'ok',\n  ${col} = 'x'`))).toEqual(want)
    expect(scanOverlaySql(F, upd(`"${col.toUpperCase()}" = 'x'`))).toEqual([
      `${F}: update hygieia.health_tips sets "${col}" — not an editable content column`,
    ])
  })
  it('is not fooled by SQL inside a literal', () => {
    expect(
      scanOverlaySql(
        F,
        upd("body_en = 'status = approved; delete from hygieia.health_tips; where id'"),
      ),
    ).toEqual([])
    expect(scanOverlaySql(F, upd("body_en = 'it''s fine', title_en = 'a, b; c'"))).toEqual([])
  })
  it('refuses a blind UPDATE (no WHERE) and an update of a non-overlay table', () => {
    expect(scanOverlaySql(F, "update hygieia.health_tips set body_en = 'x';")).toEqual([
      `${F}: update hygieia.health_tips has no WHERE (a blind update)`,
    ])
    expect(scanOverlaySql(F, 'update hygieia.profiles set is_admin = true where true;')).toEqual([
      `${F}: update of hygieia.profiles — not an overlay content table`,
    ])
  })
  it('child tables: the DB id column is editable, the overlay slug key and the parent key are not', () => {
    expect(editableDbColumns('recipe_ingredients')).toContain('ingredient_id')
    expect(editableDbColumns('recipe_ingredients')).not.toContain('ingredient_slug')
    expect(editableDbColumns('workout_template_exercises')).toContain('exercise_id')
    expect(editableDbColumns('recipe_diets')).toEqual([])
    expect(editableDbColumns('profiles')).toBeNull()
    const child = (set: string) =>
      `update hygieia.recipe_ingredients set ${set} where recipe_id = 'x'::uuid and "position" = 0;`
    expect(scanOverlaySql(F, child("quantity = 2, ingredient_id = 'y'::uuid"))).toEqual([])
    expect(scanOverlaySql(F, child("recipe_id = 'y'::uuid"))).toEqual([
      `${F}: update hygieia.recipe_ingredients sets "recipe_id" — not an editable content column`,
    ])
    expect(scanOverlaySql(F, child('"position" = 3'))).toEqual([
      `${F}: update hygieia.recipe_ingredients sets "position" — not an editable content column`,
    ])
  })
  it('passes a pending INSERT … on conflict do nothing; refuses status and a missing conflict clause', () => {
    const ok = `insert into hygieia.health_tips (id, slug, topic) values\n  ('x'::uuid, 'a', 'sleep')\non conflict (id) do nothing;`
    expect(scanOverlaySql(F, ok)).toEqual([])
    expect(scanOverlaySql(F, ok.replace('topic)', 'topic, status)'))).toEqual([
      `${F}: insert into hygieia.health_tips names "status" — additions enter pending`,
    ])
    expect(
      scanOverlaySql(F, ok.replace(' do nothing', ' do update set slug = excluded.slug')),
    ).toEqual([`${F}: insert into hygieia.health_tips is not \`on conflict (…) do nothing\``])
  })
  it('refuses every other statement', () => {
    for (const s of [
      'delete from hygieia.health_tips where true;',
      'alter table hygieia.health_tips add column x int;',
      'grant update (status) on hygieia.health_tips to anon;',
      'select 1;',
    ])
      expect(scanOverlaySql(F, s)).toHaveLength(1)
    expect(scanOverlaySql(F, 'delete from hygieia.health_tips where true;')[0]).toMatch(
      /an overlay holds only UPDATE and INSERT statements$/,
    )
  })
})

describe('overlayPatchTargets', () => {
  it('returns each UPDATE’s table and WHERE with literals intact', () => {
    const sql =
      "-- head; where\nupdate hygieia.health_tips set\n  body_en = 'a; where b'\nwhere slug = 'x-y';\n\n" +
      `update hygieia.recipe_ingredients set\n  quantity = 2\nwhere recipe_id = 'u'::uuid and "position" = 3;\n`
    expect(overlayPatchTargets(sql)).toEqual([
      { table: 'health_tips', where: "slug = 'x-y'" },
      { table: 'recipe_ingredients', where: `recipe_id = 'u'::uuid and "position" = 3` },
    ])
  })
})
