// @vitest-environment node
//
// P5.3 — the Lighthouse mobile gate (`npm run check:lighthouse`): the PURE parts. Threshold
// evaluation (pass / fail / the CI tolerance applies to performance only and only under CI), the
// shared route list and its validation, the LHR summariser (scores + top failing audits), the
// table and failure formatting, the headless-shell path derivation, and the audit server's
// Pages-like behaviour on a temp dist (gzip for text, the deep-link fallback as 200). Lighthouse
// itself is NOT run here (that is the gate; it needs Chrome, a build and ~1 min).

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { get as httpGet, type Server } from 'node:http'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { gunzipSync } from 'node:zlib'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { ROUTES, ROUTE_BASE } from '../e2e/support/routes.ts'
import {
  BASE,
  CATEGORIES,
  CI_PERFORMANCE_TOLERANCE,
  THRESHOLDS,
  TOP_AUDITS,
  auditStatus,
  contentTypeOf,
  effectiveThresholds,
  evaluate,
  formatFailure,
  formatTable,
  headlessShellDir,
  isCompressible,
  isFailingAudit,
  parseRoutes,
  startAuditServer,
  summarise,
} from './check-lighthouse.mjs'

type Category = 'performance' | 'accessibility' | 'best-practices' | 'seo'
type Scores = Record<Category, number | null>
type Audit = {
  title: string
  score: number | null
  scoreDisplayMode?: string
  displayValue?: string
}
type Lhr = Parameters<typeof summarise>[0]

const route = (p: string, name: string) => ({ path: p, name })
const scores = (
  perf: number | null,
  a11y: number | null,
  bp: number | null,
  seo: number | null,
): Scores => ({
  performance: perf,
  accessibility: a11y,
  'best-practices': bp,
  seo,
})
const allGreen = scores(90, 90, 90, 90)
const home = route('/hygieia/', 'home')
const auth = route('/hygieia/auth', 'auth')

/** A minimal LHR: a category per entry with its 0–1 score and audit refs, plus the audits map. */
const fakeLhr = (
  categories: Partial<
    Record<Category, { score: number | null; auditRefs: Array<{ id: string; weight: number }> }>
  >,
  audits: Record<string, Audit>,
): Lhr => ({ categories, audits }) as Lhr

describe('e2e/support/routes.ts — the shared route list', () => {
  it('lists the home and auth pages, every path under the Pages base', () => {
    expect(ROUTE_BASE).toBe('/hygieia')
    expect(BASE).toBe(ROUTE_BASE)
    expect(ROUTES.map((r) => r.name)).toEqual(['home', 'auth'])
    expect(ROUTES.map((r) => r.path)).toEqual(['/hygieia/', '/hygieia/auth'])
    for (const r of ROUTES) expect(r.path.startsWith(`${ROUTE_BASE}/`)).toBe(true)
  })

  it('passes the gate validation unchanged', () => {
    expect(parseRoutes(ROUTES)).toEqual(ROUTES.map((r) => ({ path: r.path, name: r.name })))
  })
})

describe('parseRoutes', () => {
  it('rejects a non-array or an empty list', () => {
    expect(() => parseRoutes(undefined)).toThrow(/non-empty array/)
    expect(() => parseRoutes({})).toThrow(/non-empty array/)
    expect(() => parseRoutes([])).toThrow(/non-empty array/)
  })

  it('rejects an entry that is not an object', () => {
    expect(() => parseRoutes(['/hygieia/'])).toThrow(/routes\[0\]: not an object/)
    expect(() => parseRoutes([home, null])).toThrow(/routes\[1\]: not an object/)
  })

  it('rejects a path outside the base, or without the base slash', () => {
    expect(() => parseRoutes([route('/other/', 'other')])).toThrow(
      /routes\[0\]\.path: "\/other\/" must start with \/hygieia\//,
    )
    expect(() => parseRoutes([route('/hygieiax', 'x')])).toThrow(/must start with \/hygieia\//)
    expect(() => parseRoutes([route('hygieia/', 'x')])).toThrow(/must start with/)
    expect(() => parseRoutes([{ path: 12, name: 'x' }])).toThrow(
      /routes\[0\]\.path: 12 must start with/,
    )
  })

  it('rejects a name that is not kebab-case (it becomes the report file name)', () => {
    for (const bad of ['Home', 'home page', '1x', '-x', 'a_b', '', undefined]) {
      expect(() => parseRoutes([{ path: '/hygieia/', name: bad }])).toThrow(/routes\[0\]\.name/)
    }
    expect(parseRoutes([route('/hygieia/recipes/greek-salad', 'recipe-detail-2')])).toHaveLength(1)
  })

  it('rejects duplicate names and duplicate paths', () => {
    expect(() => parseRoutes([home, route('/hygieia/x', 'home')])).toThrow(
      /routes\[1\]\.name: duplicate "home"/,
    )
    expect(() => parseRoutes([home, route('/hygieia/', 'again')])).toThrow(
      /routes\[1\]\.path: duplicate "\/hygieia\/"/,
    )
  })

  it('honours a custom base', () => {
    expect(parseRoutes([route('/', 'home')], '')).toEqual([{ path: '/', name: 'home' }])
    expect(() => parseRoutes([home], '/other')).toThrow(/must start with \/other\//)
  })
})

describe('thresholds and evaluate', () => {
  it('gates performance, accessibility and best-practices at 90; seo is informational', () => {
    expect(THRESHOLDS).toEqual({ performance: 90, accessibility: 90, 'best-practices': 90 })
    expect('seo' in THRESHOLDS).toBe(false)
    expect(CATEGORIES).toEqual(['performance', 'accessibility', 'best-practices', 'seo'])
    expect(CI_PERFORMANCE_TOLERANCE).toBe(5)
  })

  it('local: exactly the thresholds; CI: performance lowered by the tolerance, nothing else', () => {
    expect(effectiveThresholds({ ci: false })).toEqual({
      performance: 90,
      accessibility: 90,
      'best-practices': 90,
    })
    expect(effectiveThresholds({ ci: true })).toEqual({
      performance: 85,
      accessibility: 90,
      'best-practices': 90,
    })
  })

  it('passes when every gating score is at or above its threshold, whatever seo says', () => {
    expect(evaluate([{ route: home, scores: allGreen }], { ci: false })).toEqual([])
    expect(evaluate([{ route: home, scores: scores(100, 100, 100, 0) }], { ci: false })).toEqual([])
    expect(evaluate([{ route: home, scores: scores(90, 90, 90, null) }], { ci: false })).toEqual([])
  })

  it('fails one point below threshold, naming the route, the category, the score and the threshold', () => {
    expect(evaluate([{ route: home, scores: scores(89, 100, 100, 100) }], { ci: false })).toEqual([
      { route: home, category: 'performance', score: 89, threshold: 90 },
    ])
    expect(evaluate([{ route: auth, scores: scores(100, 89, 100, 100) }], { ci: false })).toEqual([
      { route: auth, category: 'accessibility', score: 89, threshold: 90 },
    ])
    expect(evaluate([{ route: auth, scores: scores(100, 100, 89, 100) }], { ci: false })).toEqual([
      { route: auth, category: 'best-practices', score: 89, threshold: 90 },
    ])
  })

  it('in CI tolerates performance down to 85 — and not 84', () => {
    expect(evaluate([{ route: home, scores: scores(85, 90, 90, 90) }], { ci: true })).toEqual([])
    expect(evaluate([{ route: home, scores: scores(84, 90, 90, 90) }], { ci: true })).toEqual([
      { route: home, category: 'performance', score: 84, threshold: 85 },
    ])
  })

  it('in CI gives NO tolerance to accessibility or best-practices', () => {
    expect(evaluate([{ route: home, scores: scores(90, 89, 90, 90) }], { ci: true })).toEqual([
      { route: home, category: 'accessibility', score: 89, threshold: 90 },
    ])
    expect(evaluate([{ route: home, scores: scores(90, 90, 89, 90) }], { ci: true })).toEqual([
      { route: home, category: 'best-practices', score: 89, threshold: 90 },
    ])
  })

  it('outside CI, 85 on performance is a failure (the tolerance never leaks locally)', () => {
    expect(evaluate([{ route: home, scores: scores(85, 90, 90, 90) }], { ci: false })).toEqual([
      { route: home, category: 'performance', score: 85, threshold: 90 },
    ])
  })

  it('treats a missing (null) gating score as a failure — a category that produced nothing must not pass', () => {
    expect(
      evaluate([{ route: auth, scores: scores(null, null, null, null) }], { ci: true }),
    ).toEqual([
      { route: auth, category: 'performance', score: null, threshold: 85 },
      { route: auth, category: 'accessibility', score: null, threshold: 90 },
      { route: auth, category: 'best-practices', score: null, threshold: 90 },
    ])
  })

  it('reports every failing pair across routes, route order then category order', () => {
    const failures = evaluate(
      [
        { route: home, scores: scores(70, 100, 80, 100) },
        { route: auth, scores: allGreen },
        { route: route('/hygieia/x', 'x'), scores: scores(100, 50, 100, 100) },
      ],
      { ci: false },
    )
    expect(failures.map((f) => `${f.route.name}:${f.category}:${f.score}`)).toEqual([
      'home:performance:70',
      'home:best-practices:80',
      'x:accessibility:50',
    ])
  })
})

describe('isFailingAudit (Lighthouse "passed" = numeric >= 0.9, binary == 1)', () => {
  it.each([
    [{ score: 0, scoreDisplayMode: 'binary' }, true],
    [{ score: 1, scoreDisplayMode: 'binary' }, false],
    [{ score: 0.89, scoreDisplayMode: 'numeric' }, true],
    [{ score: 0.9, scoreDisplayMode: 'numeric' }, false],
    [{ score: 0.5, scoreDisplayMode: 'metricSavings' }, true],
    [{ score: 0.95, scoreDisplayMode: 'metricSavings' }, false],
    [{ score: 0, scoreDisplayMode: 'informative' }, false],
    [{ score: null, scoreDisplayMode: 'manual' }, false],
    [{ score: null, scoreDisplayMode: 'notApplicable' }, false],
    [{ score: null, scoreDisplayMode: 'error' }, false],
    [{ score: null }, false],
    [{ score: 0.2 }, false],
  ])('%j → %s', (audit, failing) => {
    expect(isFailingAudit(audit)).toBe(failing)
  })
})

describe('summarise (LHR → scores + top failing audits)', () => {
  const lhr = fakeLhr(
    {
      performance: {
        score: 0.785,
        auditRefs: [
          { id: 'largest-contentful-paint', weight: 25 },
          { id: 'total-blocking-time', weight: 30 },
          { id: 'first-contentful-paint', weight: 10 },
          { id: 'speed-index', weight: 10 },
          { id: 'cumulative-layout-shift', weight: 25 },
          { id: 'bf-cache', weight: 0 },
          { id: 'unused-javascript', weight: 0 },
          { id: 'metrics', weight: 0 },
          { id: 'not-in-audits', weight: 99 },
        ],
      },
      accessibility: { score: 1, auditRefs: [{ id: 'color-contrast', weight: 7 }] },
      'best-practices': { score: null, auditRefs: [] },
      seo: { score: 0.904, auditRefs: [] },
    },
    {
      'largest-contentful-paint': {
        title: 'Largest Contentful Paint',
        score: 0.45,
        scoreDisplayMode: 'numeric',
        displayValue: '4.2 s',
      },
      'total-blocking-time': {
        title: 'Total Blocking Time',
        score: 1,
        scoreDisplayMode: 'numeric',
        displayValue: '0 ms',
      },
      'first-contentful-paint': {
        title: 'First Contentful Paint',
        score: 0.37,
        scoreDisplayMode: 'numeric',
        displayValue: '3.4 s',
      },
      'speed-index': {
        title: 'Speed Index',
        score: 0.89,
        scoreDisplayMode: 'numeric',
        displayValue: '3.4 s',
      },
      'cumulative-layout-shift': {
        title: 'Cumulative Layout Shift',
        score: 1,
        scoreDisplayMode: 'numeric',
        displayValue: '0',
      },
      'bf-cache': {
        title: 'Page prevented back/forward cache restoration',
        score: 0,
        scoreDisplayMode: 'binary',
      },
      'unused-javascript': {
        title: 'Reduce unused JavaScript',
        score: 0,
        scoreDisplayMode: 'metricSavings',
        displayValue: 'Est savings of 104 KiB',
      },
      metrics: { title: 'Metrics', score: null, scoreDisplayMode: 'informative' },
      'color-contrast': { title: 'Contrast', score: 1, scoreDisplayMode: 'binary' },
    },
  )

  it('rounds category scores to 0–100 and keeps a missing category score null', () => {
    expect(summarise(lhr).scores).toEqual({
      performance: 79,
      accessibility: 100,
      'best-practices': null,
      seo: 90,
    })
  })

  it(`names the top ${TOP_AUDITS} failing audits, highest weight first, then lowest score, skipping passed / informative / unknown refs`, () => {
    const top = summarise(lhr).failingAudits.performance
    expect(top).toHaveLength(TOP_AUDITS)
    expect(top.map((a) => a.id)).toEqual([
      'largest-contentful-paint',
      'first-contentful-paint',
      'speed-index',
    ])
    expect(top[0]).toEqual({
      id: 'largest-contentful-paint',
      title: 'Largest Contentful Paint',
      score: 0.45,
      weight: 25,
      displayValue: '4.2 s',
    })
    // first-contentful-paint (0.37) sorts before speed-index (0.89) at equal weight 10.
    expect(top[1].score).toBeLessThan(top[2].score)
  })

  it('reports no failing audit for a category that passes, and empty lists for categories absent from the LHR', () => {
    expect(summarise(lhr).failingAudits.accessibility).toEqual([])
    const partial = summarise(fakeLhr({ performance: { score: 0.5, auditRefs: [] } }, {}))
    expect(partial.scores).toEqual({
      performance: 50,
      accessibility: null,
      'best-practices': null,
      seo: null,
    })
    expect(partial.failingAudits).toEqual({
      performance: [],
      accessibility: [],
      'best-practices': [],
      seo: [],
    })
  })

  it('a weight-0 failing audit is still listed when nothing heavier fails', () => {
    const only = fakeLhr(
      {
        performance: {
          score: 0.99,
          auditRefs: [
            { id: 'bf-cache', weight: 0 },
            { id: 'lcp', weight: 25 },
          ],
        },
      },
      {
        'bf-cache': { title: 'bf', score: 0, scoreDisplayMode: 'binary' },
        lcp: { title: 'LCP', score: 1, scoreDisplayMode: 'numeric' },
      },
    )
    expect(summarise(only).failingAudits.performance.map((a) => a.id)).toEqual(['bf-cache'])
  })
})

describe('formatTable', () => {
  it('prints the header `route · perf · a11y · bp · seo` and one padded row per route', () => {
    const lines = formatTable([{ route: home, scores: scores(96, 100, 100, 100) }])
    expect(lines).toEqual([
      'route            · perf · a11y ·  bp · seo',
      '/hygieia/ (home) ·   96 ·  100 · 100 · 100',
    ])
  })

  it('a fake LHR fixture ends up as the expected table line', () => {
    const lhr = fakeLhr(
      {
        performance: { score: 0.97, auditRefs: [] },
        accessibility: { score: 1, auditRefs: [] },
        'best-practices': { score: 1, auditRefs: [] },
        seo: { score: 1, auditRefs: [] },
      },
      {},
    )
    const lines = formatTable([{ route: auth, scores: summarise(lhr).scores }])
    expect(lines[1]).toBe('/hygieia/auth (auth) ·   97 ·  100 · 100 · 100')
  })

  it('renders a missing score as an en dash and aligns mixed rows', () => {
    const lines = formatTable([
      { route: home, scores: scores(79, 100, 100, 100) },
      { route: auth, scores: scores(null, null, null, null) },
    ])
    expect(lines).toEqual([
      'route                · perf · a11y ·  bp · seo',
      '/hygieia/ (home)     ·   79 ·  100 · 100 · 100',
      '/hygieia/auth (auth) ·    – ·    – ·   – ·   –',
    ])
  })
})

describe('formatFailure', () => {
  const failure = { route: home, category: 'performance' as const, score: 79, threshold: 90 }
  const audits = [
    {
      id: 'largest-contentful-paint',
      title: 'Largest Contentful Paint',
      score: 0.45,
      weight: 25,
      displayValue: '4.2 s',
    },
    {
      id: 'first-contentful-paint',
      title: 'First Contentful Paint',
      score: 0.37,
      weight: 10,
      displayValue: '3.4 s',
    },
    {
      id: 'bf-cache',
      title: 'Page prevented back/forward cache restoration',
      score: 0,
      weight: 0,
      displayValue: '',
    },
  ]

  it('names the route, the category, the score vs threshold and each failing audit', () => {
    const lines = formatFailure(failure, audits)
    expect(lines[0]).toBe('FAIL  /hygieia/ (home): performance 79 < 90')
    expect(lines[1]).toBe('      top 3 failing audit(s):')
    expect(lines[2]).toBe(
      '      - largest-contentful-paint (score 0.45, weight 25): Largest Contentful Paint — 4.2 s',
    )
    expect(lines[3]).toBe(
      '      - first-contentful-paint (score 0.37, weight 10): First Contentful Paint — 3.4 s',
    )
    // No display value → no dash suffix.
    expect(lines[4]).toBe(
      '      - bf-cache (score 0.00, weight 0): Page prevented back/forward cache restoration',
    )
    expect(lines).toHaveLength(5)
  })

  it('says so when a category produced no score, and when no failing audit was recorded', () => {
    const lines = formatFailure(
      { route: auth, category: 'accessibility', score: null, threshold: 90 },
      [],
    )
    expect(lines).toEqual([
      'FAIL  /hygieia/auth (auth): accessibility produced no score (want >= 90)',
      '      (no failing audit recorded for this category)',
    ])
  })
})

describe('headlessShellDir (CI installs only the headless shell)', () => {
  it('maps the full Chromium path to its headless-shell sibling, Windows and POSIX', () => {
    expect(
      headlessShellDir(
        'C:\\Users\\x\\AppData\\Local\\ms-playwright\\chromium-1243\\chrome-win64\\chrome.exe',
      ),
    ).toBe('C:\\Users\\x\\AppData\\Local\\ms-playwright\\chromium_headless_shell-1243')
    expect(
      headlessShellDir('/home/runner/.cache/ms-playwright/chromium-1243/chrome-linux/chrome'),
    ).toBe('/home/runner/.cache/ms-playwright/chromium_headless_shell-1243')
  })

  it('returns null when the path has no chromium-<rev> segment', () => {
    expect(headlessShellDir('/usr/bin/google-chrome')).toBeNull()
    expect(
      headlessShellDir('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'),
    ).toBeNull()
    expect(
      headlessShellDir(
        '/x/chromium_headless_shell-1243/chrome-headless-shell-linux/chrome-headless-shell',
      ),
    ).toBeNull()
  })
})

describe('audit server helpers', () => {
  it('content types and what Pages gzips', () => {
    expect(contentTypeOf('a/index.html')).toBe('text/html; charset=utf-8')
    expect(contentTypeOf('x.JS')).toBe('text/javascript; charset=utf-8')
    expect(contentTypeOf('f.woff2')).toBe('font/woff2')
    expect(contentTypeOf('m.webmanifest')).toBe('application/manifest+json')
    expect(contentTypeOf('blob.bin')).toBe('application/octet-stream')
    for (const t of [
      'text/html; charset=utf-8',
      'text/css; charset=utf-8',
      'text/javascript; charset=utf-8',
      'application/json; charset=utf-8',
      'application/manifest+json',
      'image/svg+xml',
    ]) {
      expect(isCompressible(t), t).toBe(true)
    }
    for (const t of [
      'image/jpeg',
      'image/png',
      'image/webp',
      'font/woff2',
      'application/octet-stream',
    ]) {
      expect(isCompressible(t), t).toBe(false)
    }
  })

  it('serves the deep-link fallback (404 + 404.html) as 200 and leaves every other status alone', () => {
    expect(auditStatus({ status: 404, file: '/dist/404.html' })).toBe(200)
    expect(auditStatus({ status: 404 })).toBe(404)
    expect(auditStatus({ status: 200, file: '/dist/index.html' })).toBe(200)
    expect(auditStatus({ status: 301 })).toBe(301)
  })
})

describe('startAuditServer on a temp dist (Pages semantics + gzip + fallback-as-200)', () => {
  let root: string
  let server: Server
  let origin: string
  const INDEX = '<!doctype html><title>fixture</title><div id="root"></div>'

  type Res = {
    status: number
    headers: Record<string, string | string[] | undefined>
    body: Buffer
  }
  const get = (p: string, headers: Record<string, string> = {}): Promise<Res> =>
    new Promise((resolve, reject) => {
      httpGet(`${origin}${p}`, { headers }, (res) => {
        const chunks: Buffer[] = []
        res.on('data', (c: Buffer) => chunks.push(c))
        res.on('end', () =>
          resolve({
            status: res.statusCode ?? 0,
            headers: res.headers,
            body: Buffer.concat(chunks),
          }),
        )
        res.on('error', reject)
      }).on('error', reject)
    })

  beforeAll(async () => {
    root = mkdtempSync(path.join(tmpdir(), 'hygieia-lh-'))
    mkdirSync(path.join(root, 'assets'))
    writeFileSync(path.join(root, 'index.html'), INDEX)
    writeFileSync(path.join(root, '404.html'), INDEX)
    writeFileSync(path.join(root, 'assets', 'app.js'), 'console.log("x".repeat(2000))')
    writeFileSync(path.join(root, 'img.png'), Buffer.from([0x89, 0x50, 0x4e, 0x47, 0, 0, 0, 0]))
    server = await startAuditServer({ root, port: 0, base: '/hygieia' })
    const address = server.address()
    if (!address || typeof address === 'string') throw new Error('no port')
    origin = `http://127.0.0.1:${address.port}`
  })

  afterAll(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()))
    rmSync(root, { recursive: true, force: true })
  })

  it('serves the home document gzipped when the browser accepts gzip, with Vary', async () => {
    const r = await get('/hygieia/', { 'accept-encoding': 'gzip, deflate, br' })
    expect(r.status).toBe(200)
    expect(r.headers['content-type']).toBe('text/html; charset=utf-8')
    expect(r.headers['content-encoding']).toBe('gzip')
    expect(r.headers['vary']).toBe('Accept-Encoding')
    expect(gunzipSync(r.body).toString()).toBe(INDEX)
    expect(Number(r.headers['content-length'])).toBe(r.body.length)
  })

  it('serves identity when gzip is not accepted', async () => {
    const r = await get('/hygieia/assets/app.js')
    expect(r.status).toBe(200)
    expect(r.headers['content-encoding']).toBeUndefined()
    expect(r.body.toString()).toContain('console.log')
  })

  it('never gzips an image', async () => {
    const r = await get('/hygieia/img.png', { 'accept-encoding': 'gzip' })
    expect(r.status).toBe(200)
    expect(r.headers['content-type']).toBe('image/png')
    expect(r.headers['content-encoding']).toBeUndefined()
    expect(r.body.length).toBe(8)
  })

  it('answers a deep link with the 404.html bytes and STATUS 200 (so Lighthouse audits it)', async () => {
    const r = await get('/hygieia/auth')
    expect(r.status).toBe(200)
    expect(r.body.toString()).toBe(INDEX)
  })

  it('keeps the other Pages semantics: 301 for the bare base, plain 404 outside the base', async () => {
    const dir = await get('/hygieia')
    expect(dir.status).toBe(301)
    expect(dir.headers['location']).toBe('/hygieia/')
    const outside = await get('/other')
    expect(outside.status).toBe(404)
    expect(outside.headers['content-type']).toBe('text/plain; charset=utf-8')
  })
})
