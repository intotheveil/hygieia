// THE BUNDLE SECRET SCAN — `npm run check:bundle` (run AFTER `npm run build`; PLAN P6.2; CLAUDE.md §3 #1)
//
// Hygieia is a static site: every byte in dist/ is public the moment Pages serves it. The ESLint
// rule in eslint.config.js stops src/** from READING a server-only env name, but it cannot see a
// secret VALUE that arrives another way: a service-role JWT pasted into VITE_SUPABASE_ANON_KEY, a
// personal access token hardcoded in a string, a dependency that inlines one. This scan reads the
// real build output (every TEXT file: html, js, css, json, webmanifest, svg, map, …) and fails on:
//
//   secret-value   a secret-looking prefix followed by key characters: sk-ant- (Anthropic),
//                  sk_live_ / sk_test_ (Stripe secret), whsec_ (webhook secret), sbp_ (Supabase
//                  personal access token), sb_secret_ (Supabase secret API key)
//   aws-key-id     an AWS access key id (AKIA… / ASIA…, 20 chars)
//   private-key    a PEM block header: -----BEGIN … PRIVATE KEY-----
//   service-role   the literal `service_role`
//   service-jwt    a JWT whose decoded payload has "role":"service_role" (base64 hides the literal,
//                  so the plain grep above would miss exactly the key that bypasses RLS)
//   forbidden-name a server-only env NAME (the lint rule's SERVER_SECRET list, bare and HYGIEIA_-
//                  prefixed, plus the db:apply names): a name in the bundle means server-side code
//                  or config leaked into browser code
//
// Publishable values are NOT findings: the anon JWT ("role":"anon") and `sb_publishable_…` keys are
// meant to be public, and a bare prefix with nothing after it (supabase-js ships a
// `startsWith('sb_secret_')` check) is not a key. Findings print a MASKED excerpt only — the first
// 6 characters and `…`, never the full value — as `file:line:col (offset N) [rule] excerpt`.
//
// Exit codes: 0 clean · 1 one or more findings · 2 nothing to scan (dist/ missing, or no text file
// in it — run `npm run build` first; a scan of nothing must not pass). The CLI sets
// `process.exitCode` and never calls `process.exit()`.
//
// Usage: node scripts/check-bundle-secrets.mjs [dir]   (dir defaults to dist/). Import `scanText` /
// `scanDir` to use it in-process (P6.3's live smoke reuses `scanText` on the served bundle).

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

/**
 * @typedef {'secret-value' | 'aws-key-id' | 'private-key' | 'service-role' | 'service-jwt' | 'forbidden-name'} Rule
 *
 * @typedef {object} Finding
 * @property {string} file    path relative to the scanned dir, forward slashes (or the caller's label)
 * @property {number} offset  0-based character offset of the match in the text
 * @property {number} line    1-based
 * @property {number} column  1-based
 * @property {Rule}   rule
 * @property {string} excerpt masked: the first 6 characters and `…`, never the full value
 *                            (a forbidden NAME is not a secret and is shown in full)
 * @property {number} length  length of the matched text
 */

export const DEFAULT_DIR = fileURLToPath(new URL('../dist', import.meta.url))

/** Text files worth scanning. Images and fonts are skipped (and counted nowhere). */
export const TEXT_EXTENSIONS = [
  '.html',
  '.htm',
  '.js',
  '.mjs',
  '.cjs',
  '.css',
  '.json',
  '.webmanifest',
  '.map',
  '.svg',
  '.txt',
  '.xml',
]

/** Secret-looking value prefixes. A prefix followed by at least one key character is a finding. */
export const SECRET_PREFIXES = ['sk-ant-', 'sk_live_', 'sk_test_', 'whsec_', 'sbp_', 'sb_secret_']

/**
 * Server-only env names: eslint.config.js SERVER_SECRET (bare and HYGIEIA_-prefixed) plus the two
 * names db:apply reads. None of them may appear in the public bundle.
 */
export const FORBIDDEN_NAMES = [
  'ANTHROPIC_API_KEY',
  'OPENAI_API_KEY',
  'HYGIEIA_ANTHROPIC_API_KEY',
  'HYGIEIA_OPENAI_API_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'SUPABASE_ACCESS_TOKEN',
  'HYGIEIA_SUPABASE_PROJECT_REF',
]

/** How many leading characters of a matched value the excerpt keeps. */
export const MASK_KEEP = 6

const escape = (/** @type {string} */ s) => s.replace(/[.*+?^${}()|[\]\\-]/g, '\\$&')

// A prefix must not be glued to a preceding identifier character (so `task_test_x` is not `sk_test_`)
// and must be followed by at least one key character (a bare prefix in a startsWith() is not a key).
const PREFIX_RE = new RegExp(
  `(?<![A-Za-z0-9])(?:${SECRET_PREFIXES.map(escape).join('|')})[A-Za-z0-9_-]+`,
  'g',
)
const AWS_KEY_ID_RE = /(?<![A-Za-z0-9])(?:AKIA|ASIA)[0-9A-Z]{16}(?![A-Za-z0-9])/g
const PRIVATE_KEY_RE = /-----BEGIN [A-Z0-9 ]*PRIVATE KEY-----/g
const SERVICE_ROLE_RE = /service_role/g
// The shortest names are suffixes of the prefixed ones, so match whole words and report once.
const NAME_RE = new RegExp(
  `(?<![A-Za-z0-9_])(?:${FORBIDDEN_NAMES.map(escape).join('|')})(?![A-Za-z0-9_])`,
  'g',
)
const JWT_RE = /eyJ[A-Za-z0-9_-]{5,}\.eyJ[A-Za-z0-9_-]{5,}\.[A-Za-z0-9_-]+/g

/** @param {string} s */
export function mask(s) {
  return `${s.slice(0, MASK_KEEP)}…`
}

/** @param {string} text @param {number} index */
function position(text, index) {
  let line = 1
  let lineStart = 0
  for (let i = text.indexOf('\n'); i !== -1 && i < index; i = text.indexOf('\n', i + 1)) {
    line++
    lineStart = i + 1
  }
  return { line, column: index - lineStart + 1 }
}

/** @param {string} segment base64url JWT segment @returns {unknown} */
function decodeJwtPart(segment) {
  try {
    return JSON.parse(Buffer.from(segment, 'base64url').toString('utf8'))
  } catch {
    return undefined
  }
}

/** @param {string} jwt */
function isServiceRoleJwt(jwt) {
  const payload = decodeJwtPart(jwt.split('.')[1])
  return (
    typeof payload === 'object' &&
    payload !== null &&
    /** @type {{ role?: unknown }} */ (payload).role === 'service_role'
  )
}

/**
 * Scan one text. Pure: no I/O, no process state.
 * @param {string} text
 * @param {{ file?: string }} [options] `file` labels the findings (defaults to `<text>`)
 * @returns {Finding[]} sorted by offset
 */
export function scanText(text, { file = '<text>' } = {}) {
  /** @type {Finding[]} */
  const out = []
  /** @param {RegExp} re @param {Rule} rule @param {(m: string) => boolean} [keep] */
  const run = (re, rule, keep) => {
    re.lastIndex = 0
    for (let m = re.exec(text); m; m = re.exec(text)) {
      if (keep && !keep(m[0])) continue
      // A forbidden NAME is not a secret, so it is shown in full; every value is masked.
      const excerpt = rule === 'forbidden-name' ? m[0] : mask(m[0])
      out.push({
        file,
        offset: m.index,
        ...position(text, m.index),
        rule,
        excerpt,
        length: m[0].length,
      })
    }
  }
  run(PREFIX_RE, 'secret-value')
  run(AWS_KEY_ID_RE, 'aws-key-id')
  run(PRIVATE_KEY_RE, 'private-key')
  run(SERVICE_ROLE_RE, 'service-role')
  run(NAME_RE, 'forbidden-name')
  run(JWT_RE, 'service-jwt', isServiceRoleJwt)
  return out.sort((a, b) => a.offset - b.offset)
}

/** @param {string} file */
export function isTextFile(file) {
  return TEXT_EXTENSIONS.includes(path.extname(file).toLowerCase())
}

/** @param {string} dir @returns {string[]} absolute paths of every file under dir, sorted */
function walk(dir) {
  /** @type {string[]} */
  const files = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) files.push(...walk(full))
    else if (entry.isFile()) files.push(full)
  }
  return files.sort()
}

/**
 * Scan every text file under `dir`.
 * @param {string} dir
 * @returns {{ files: number, bytes: number, findings: Finding[] }} files/bytes count TEXT files only
 * @throws {Error} when dir is missing, not a directory, or holds no text file (the CLI → exit 2)
 */
export function scanDir(dir) {
  if (!existsSync(dir) || !statSync(dir).isDirectory()) {
    throw new Error(`${dir} does not exist. Run \`npm run build\` first.`)
  }
  const paths = walk(dir).filter(isTextFile)
  if (paths.length === 0) {
    throw new Error(`${dir} has no text file to scan (empty build?). Run \`npm run build\` first.`)
  }
  let bytes = 0
  /** @type {Finding[]} */
  const findings = []
  for (const p of paths) {
    const buf = readFileSync(p)
    bytes += buf.length
    const rel = path.relative(dir, p).split(path.sep).join('/')
    findings.push(...scanText(buf.toString('utf8'), { file: rel }))
  }
  return { files: paths.length, bytes, findings }
}

/** @param {Finding} f */
export function formatFinding(f) {
  return `${f.file}:${f.line}:${f.column} (offset ${f.offset})  [${f.rule}]  ${f.excerpt} (${f.length} chars)`
}

/**
 * The CLI body. Writes to the given streams, returns the exit code; never exits the process.
 * @param {string[]} argv            arguments after the script path
 * @param {{ log: (s: string) => void, error: (s: string) => void }} io
 * @returns {0 | 1 | 2}
 */
export function main(argv, io = { log: console.log, error: console.error }) {
  const dir = path.resolve(argv[0] ?? DEFAULT_DIR)
  /** @type {ReturnType<typeof scanDir>} */
  let result
  try {
    result = scanDir(dir)
  } catch (err) {
    io.error(`check:bundle: ${err instanceof Error ? err.message : String(err)}`)
    return 2
  }
  for (const f of result.findings) io.error(formatFinding(f))
  const where = path.relative(process.cwd(), dir).split(path.sep).join('/') || '.'
  const summary = `${result.files} files (${result.bytes} bytes) in ${where}`
  if (result.findings.length > 0) {
    io.error(
      `check:bundle: FAIL: ${result.findings.length} finding(s) in the public bundle, ${summary}.`,
    )
    io.error(
      'Every byte in dist/ is public. Move the secret server-side (Edge Function secret) and rebuild.',
    )
    return 1
  }
  io.log(`check:bundle: OK, no secret-looking value or server-only name in ${summary}`)
  return 0
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  process.exitCode = main(process.argv.slice(2))
}
