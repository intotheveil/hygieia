// OVERLAY SCAN — the static half of the content-overlay contract, run by `npm run db:gate`
// (scripts/db-gate.mjs) before the archive is applied, and unit-tested by scripts/overlay-scan.test.ts.
//
// An overlay migration (`*_hygieia_overlay_*.sql`, generated from src/content/seed/overlays/ by
// scripts/gen-seed-sql.mjs) may hold exactly two kinds of statement:
//   * `update hygieia.<t> set <col> = …, … where …;`  — <t> an overlay table, every <col> one of its
//     EDITABLE content columns (PATCH_COLUMNS in src/content/seed/overlays/types.ts, i.e. the admin's
//     EDITABLE_COLUMNS = the UPDATE grant minus `status`; child `*_slug` keys as their `*_id`
//     column). Never id, slug, status, created_at, updated_at, reviewed_at, reviewed_by. A WHERE
//     is required (a blind UPDATE would rewrite the whole table).
//   * `insert into hygieia.<t> (<cols>) values … on conflict (…) do nothing;` — <cols> never name
//     status or the review / timestamp columns: an addition enters `pending` and the lead approves.
// Anything else (delete, alter, grant, a DO block …) is refused: an overlay is content, not schema.
//
// The SQL is read with string literals and comments MASKED (same length, contents blanked), so a
// `;`, `,`, `where` or `status` inside a Greek or English text literal cannot fool the scan.

import { readFileSync, readdirSync, existsSync } from 'node:fs'
import path from 'node:path'
import {
  OVERLAY_TABLES,
  PATCH_COLUMNS,
  PATCH_SLUG_COLUMNS,
} from '../../src/content/seed/overlays/types.ts'

export const OVERLAY_FILE_RE = /^\d{14}_hygieia_overlay_[a-z0-9_]+\.sql$/

/** Columns an overlay INSERT must never name (the row enters pending; the server owns the rest). */
export const FORBIDDEN_INSERT_COLUMNS = Object.freeze([
  'status',
  'reviewed_at',
  'reviewed_by',
  'created_at',
  'updated_at',
])

/**
 * The DB columns an overlay UPDATE may set on `table` (child `*_slug` keys → their `*_id` column).
 * @param {string} table @returns {string[] | null}  null = not an overlay table
 */
export function editableDbColumns(table) {
  if (!(/** @type {readonly string[]} */ (OVERLAY_TABLES).includes(table))) return null
  const cols = /** @type {Record<string, readonly string[]>} */ (PATCH_COLUMNS)[table] ?? []
  const slugCols =
    /** @type {Record<string, Record<string, string>>} */ (PATCH_SLUG_COLUMNS)[table] ?? {}
  return cols.map((c) => slugCols[c] ?? c)
}

/**
 * The SQL with every string literal's contents and every comment replaced by spaces — same length,
 * so an index into the mask is an index into the original.
 * @param {string} sql @returns {string}
 */
export function maskSql(sql) {
  let out = ''
  let i = 0
  while (i < sql.length) {
    const c = sql[i]
    if (c === "'") {
      let j = i + 1
      while (j < sql.length) {
        if (sql[j] === "'") {
          if (sql[j + 1] === "'") {
            j += 2
            continue
          }
          break
        }
        j++
      }
      const end = Math.min(j, sql.length)
      out += "'" + sql.slice(i + 1, end).replace(/[^\n]/g, ' ') + (j < sql.length ? "'" : '')
      i = j + 1
      continue
    }
    if (c === '-' && sql[i + 1] === '-') {
      let j = sql.indexOf('\n', i)
      if (j < 0) j = sql.length
      out += ' '.repeat(j - i)
      i = j
      continue
    }
    if (c === '/' && sql[i + 1] === '*') {
      let j = sql.indexOf('*/', i + 2)
      j = j < 0 ? sql.length : j + 2
      out += sql.slice(i, j).replace(/[^\n]/g, ' ')
      i = j
      continue
    }
    out += c
    i++
  }
  return out
}

/**
 * Split a MASKED string at top-level `sep` (outside (), []).
 * @param {string} masked @param {string} sep @returns {string[]}
 */
function splitTop(masked, sep) {
  const parts = []
  let depth = 0
  let start = 0
  for (let i = 0; i < masked.length; i++) {
    const c = masked[i]
    if (c === '(' || c === '[') depth++
    else if (c === ')' || c === ']') depth--
    else if (c === sep && depth === 0) {
      parts.push(masked.slice(start, i))
      start = i + 1
    }
  }
  parts.push(masked.slice(start))
  return parts
}

/** `"position"` → `position`, lower case. @param {string} s */
const ident = (s) =>
  s
    .trim()
    .replace(/^"(.*)"$/, '$1')
    .toLowerCase()

/**
 * Every problem in one overlay migration; [] when it only patches editable columns and inserts
 * pending rows.
 * @param {string} file @param {string} sql @returns {string[]}
 */
export function scanOverlaySql(file, sql) {
  /** @type {string[]} */
  const problems = []
  const statements = splitTop(maskSql(sql), ';')
    .map((s) => s.trim())
    .filter((s) => s !== '')
  for (const m of statements) {
    const head = m.replace(/\s+/g, ' ').slice(0, 60)
    const upd = /^update\s+hygieia\.("?)(\w+)\1\s+set\s/i.exec(m)
    if (upd) {
      const table = upd[2].toLowerCase()
      const allowed = editableDbColumns(table)
      if (!allowed) {
        problems.push(`${file}: update of hygieia.${table} — not an overlay content table`)
        continue
      }
      const rest = m.slice(upd[0].length)
      // the first top-level WHERE (literals are masked, so only SQL words remain)
      let depth = 0
      let whereAt = -1
      for (let i = 0; i < rest.length && whereAt < 0; i++) {
        const c = rest[i]
        if (c === '(' || c === '[') depth++
        else if (c === ')' || c === ']') depth--
        else if (depth === 0 && /\swhere\s/i.test(rest.slice(i, i + 7))) whereAt = i
      }
      if (whereAt < 0) {
        problems.push(`${file}: update hygieia.${table} has no WHERE (a blind update)`)
        continue
      }
      for (const assignment of splitTop(rest.slice(0, whereAt), ',')) {
        const eq = assignment.indexOf('=')
        const col = ident(eq < 0 ? assignment : assignment.slice(0, eq))
        if (!allowed.includes(col))
          problems.push(
            `${file}: update hygieia.${table} sets "${col}" — not an editable content column`,
          )
      }
      continue
    }
    const ins = /^insert\s+into\s+hygieia\.("?)(\w+)\1\s*\(([^)]*)\)/i.exec(m)
    if (ins) {
      const table = ins[2].toLowerCase()
      if (!editableDbColumns(table)) {
        problems.push(`${file}: insert into hygieia.${table} — not an overlay content table`)
        continue
      }
      for (const col of ins[3].split(',').map(ident))
        if (FORBIDDEN_INSERT_COLUMNS.includes(col))
          problems.push(
            `${file}: insert into hygieia.${table} names "${col}" — additions enter pending`,
          )
      if (!/on\s+conflict\s*\([^)]*\)\s*do\s+nothing$/i.test(m))
        problems.push(`${file}: insert into hygieia.${table} is not \`on conflict (…) do nothing\``)
      continue
    }
    problems.push(`${file}: "${head}…" — an overlay holds only UPDATE and INSERT statements`)
  }
  return problems
}

/**
 * The target of every UPDATE in an overlay migration: its table and its WHERE clause (original
 * text, literals intact) — the gate counts the rows each one matches after the apply, so a patch
 * whose slug / natural key matches nothing (a silent no-op) is red.
 * @param {string} sql @returns {{ table: string, where: string }[]}
 */
export function overlayPatchTargets(sql) {
  const masked = maskSql(sql)
  /** @type {{ table: string, where: string }[]} */
  const out = []
  let start = 0
  for (const part of splitTop(masked, ';')) {
    const end = start + part.length
    const original = sql.slice(start, end)
    start = end + 1
    const m = part.trim()
    const lead = part.length - part.trimStart().length
    const upd = /^update\s+hygieia\.("?)(\w+)\1\s+set\s/i.exec(m)
    if (!upd) continue
    const w = /\swhere\s/i.exec(m)
    if (!w) continue
    out.push({
      table: upd[2].toLowerCase(),
      where: original.slice(lead + w.index + w[0].length, lead + m.length).trim(),
    })
  }
  return out
}

/**
 * Scan every overlay migration in `dir`.
 * @param {string} dir
 * @returns {{ files: string[], problems: string[], targets: { file: string, table: string, where: string }[] }}
 */
export function scanOverlayDir(dir) {
  const files = existsSync(dir)
    ? readdirSync(dir)
        .filter((f) => OVERLAY_FILE_RE.test(f))
        .sort()
    : []
  const texts = files.map((f) => [f, readFileSync(path.join(dir, f), 'utf8')])
  const problems = texts.flatMap(([f, sql]) => scanOverlaySql(f, sql))
  const targets = texts.flatMap(([f, sql]) =>
    overlayPatchTargets(sql).map((t) => ({ file: f, ...t })),
  )
  return { files, problems, targets }
}
