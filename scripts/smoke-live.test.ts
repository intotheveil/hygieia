// @vitest-environment node
//
// P6.3 — `npm run smoke:live`, the HTTP-only smoke of the deployed PWA and its backing service.
// Everything runs against a FAKE site: a map of paths → answers that mimics GitHub Pages (a
// missing file answers 404 with the 404.html copy of index.html) plus a fake PostgREST. Every
// probe has a pass and a fail path here. No network, no live site, no real credential: the anon
// key below is a made-up marker and every test asserts it reaches no output line.

import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { ENV_ANON_KEY, ENV_URL, REST_PROBES } from './db-live-check.mjs'
import { REDACTED } from './lib/mgmt-api.mjs'
import {
  APPROVED_PATH,
  BACKEND_SKIPPED,
  DEFAULT_BASE_URL,
  ENV_BASE_URL,
  HTML_MARKERS,
  MANIFEST_EXPECT,
  REQUEST_TIMEOUT_MS,
  USAGE,
  extractAssets,
  main,
  normaliseBaseUrl,
  runSmoke,
} from './smoke-live.mjs'

const SCRIPT = fileURLToPath(new URL('./smoke-live.mjs', import.meta.url))
const BASE = 'https://example.test/hygieia/'
const ANON = 'eyJ_FAKE_ANON_KEY_never_real_0123456789'
const SUPA = 'https://abcdefghijklmnopqrst.supabase.co'
const BACKEND_ENV = { [ENV_URL]: SUPA, [ENV_ANON_KEY]: ANON }
const TOKEN = 'fixed00'
const DEEP = `recipes/deep-link-probe-${TOKEN}`

type Answer = { status: number; type?: string; body: string }
type Call = { url: string; headers: Record<string, string> }

const INDEX_HTML = `<!doctype html>
<html lang="el">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/hygieia/favicon.svg" />
    <title>Hygieia · Υγίεια</title>
    <link
      href="https://fonts.example.test/css2?family=Inter&display=swap"
      rel="stylesheet"
    />
    <script type="module" crossorigin src="/hygieia/assets/index-AAAA.js"></script>
    <link rel="stylesheet" crossorigin href="/hygieia/assets/index-BBBB.css">
  <link rel="manifest" href="/hygieia/manifest.webmanifest"><script id="vite-plugin-pwa:register-sw" src="/hygieia/registerSW.js"></script></head>
  <body>
    <div id="root"></div>
  </body>
</html>
`

const MANIFEST = {
  name: 'Hygieia · Υγίεια',
  short_name: 'Hygieia',
  start_url: '/hygieia/',
  scope: '/hygieia/',
  display: 'standalone',
  icons: [
    { src: 'icons/pwa-192.png', sizes: '192x192', type: 'image/png' },
    { src: 'icons/pwa-512.png', sizes: '512x512', type: 'image/png' },
    { src: 'icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
  ],
}

const PNG: Answer = { status: 200, type: 'image/png', body: 'PNG' }
const JS = (body: string): Answer => ({ status: 200, type: 'application/javascript', body })

/** The site as Pages serves it, keyed by URL. Override any entry (or add one) per test. */
function pagesSite(over: Record<string, Answer | undefined> = {}, manifest: unknown = MANIFEST) {
  const site: Record<string, Answer | undefined> = {
    [BASE]: { status: 200, type: 'text/html; charset=utf-8', body: INDEX_HTML },
    [`${BASE}manifest.webmanifest`]: {
      status: 200,
      type: 'application/manifest+json',
      body: JSON.stringify(manifest),
    },
    [`${BASE}icons/pwa-192.png`]: PNG,
    [`${BASE}icons/pwa-512.png`]: PNG,
    [`${BASE}icons/maskable-512.png`]: PNG,
    [`${BASE}sw.js`]: JS('self.addEventListener("fetch", () => {})'),
    [`${BASE}registerSW.js`]: JS('navigator.serviceWorker.register("/hygieia/sw.js")'),
    [`${BASE}favicon.svg`]: { status: 200, type: 'image/svg+xml', body: '<svg/>' },
    [`${BASE}assets/index-AAAA.js`]: JS('console.log("hygieia", "eyJ.anon.ok")'),
    [`${BASE}assets/index-BBBB.css`]: { status: 200, type: 'text/css', body: 'body{margin:0}' },
    'https://fonts.example.test/css2?family=Inter&display=swap': {
      status: 200,
      type: 'text/css',
      body: '@font-face{font-family:Inter}',
    },
    [`${BASE}brand/og-hygieia.jpg`]: { status: 200, type: 'image/jpeg', body: 'JPG' },
    ...over,
  }
  return site
}

type RestAnswers = { approved?: Answer; pending?: Answer; profiles?: Answer }
const rows = (n: number, key = 'slug'): Answer => ({
  status: 200,
  type: 'application/json',
  body: JSON.stringify(Array.from({ length: n }, (_, i) => ({ [key]: `r${i}` }))),
})
const EMPTY = rows(0)

/**
 * A fake fetch for the site and PostgREST. Any URL not in the site answers like Pages: 404 with
 * the fallback document (a byte copy of index.html) unless `bare404` is set. `hang` makes the
 * matching URL wait for the abort signal (the timeout path).
 */
function fakeFetch(o: {
  site?: Record<string, Answer | undefined>
  rest?: RestAnswers
  bare404?: boolean
  hang?: RegExp
  throwOn?: RegExp
}) {
  const site = o.site ?? pagesSite()
  const calls: Call[] = []
  const answer = (a: Answer) =>
    new Response(a.body, {
      status: a.status,
      headers: a.type ? { 'content-type': a.type } : {},
    })
  const fetchImpl: typeof fetch = async (input, init) => {
    const url = String(input)
    const headers = { ...(init?.headers as Record<string, string>) }
    calls.push({ url, headers })
    if (o.throwOn?.test(url)) throw new Error(`connect ECONNREFUSED (apikey ${ANON})`)
    if (o.hang?.test(url)) {
      await new Promise<void>((_, reject) => {
        init?.signal?.addEventListener('abort', () => reject(new Error('aborted')))
      })
    }
    if (url.startsWith(SUPA)) {
      const path = url.slice(SUPA.length)
      if (path === APPROVED_PATH) return answer(o.rest?.approved ?? rows(1))
      if (path === REST_PROBES[0].path) return answer(o.rest?.pending ?? EMPTY)
      if (path === REST_PROBES[1].path) return answer(o.rest?.profiles ?? EMPTY)
      return answer({ status: 404, body: JSON.stringify({ message: `unexpected: ${path}` }) })
    }
    const hit = site[url]
    if (hit) return answer(hit)
    if (o.bare404) return answer({ status: 404, type: 'text/html', body: 'Not Found' })
    return answer({ status: 404, type: 'text/html; charset=utf-8', body: INDEX_HTML })
  }
  return { fetch: fetchImpl, calls }
}

async function runIt(o: {
  fake?: ReturnType<typeof fakeFetch>
  env?: Record<string, string | undefined>
  baseUrl?: string
  timeoutMs?: number
}) {
  const out: string[] = []
  const err: string[] = []
  const fake = o.fake ?? fakeFetch({})
  const code = await runSmoke({
    baseUrl: o.baseUrl ?? BASE,
    env: o.env ?? {},
    fetch: fake.fetch,
    log: (s) => out.push(s),
    error: (s) => err.push(s),
    probeToken: () => TOKEN,
    ...(o.timeoutMs !== undefined ? { timeoutMs: o.timeoutMs } : {}),
  })
  const all = [...out, ...err].join('\n')
  expect(all).not.toContain(ANON) // the anon key never surfaces, whatever happened
  const fails = out.filter((l) => l.startsWith('FAIL'))
  const passes = out.filter((l) => l.startsWith('PASS'))
  const warns = out.filter((l) => l.startsWith('WARN'))
  return { code, out, err, all, fake, fails, passes, warns }
}

describe('base URL', () => {
  it('defaults to the Pages URL with a trailing slash and normalises', () => {
    expect(DEFAULT_BASE_URL).toBe('https://intotheveil.github.io/hygieia/')
    expect(normaliseBaseUrl(undefined)).toBeNull()
    expect(normaliseBaseUrl('  ')).toBeNull()
    expect(normaliseBaseUrl('https://intotheveil.github.io/hygieia')).toBe(DEFAULT_BASE_URL)
    expect(normaliseBaseUrl(' https://intotheveil.github.io/hygieia/ ')).toBe(DEFAULT_BASE_URL)
    expect(normaliseBaseUrl('http://localhost:4173/hygieia')).toBe('http://localhost:4173/hygieia/')
    expect(normaliseBaseUrl('intotheveil.github.io/hygieia')).toBeNull()
    expect(normaliseBaseUrl('ftp://x/y')).toBeNull()
    expect(normaliseBaseUrl('https://x/y?z=1')).toBeNull()
  })

  it('reads SMOKE_BASE_URL when no explicit base is given, else the default', async () => {
    const seen: string[] = []
    const probeOnly: typeof fetch = async (input) => {
      seen.push(String(input))
      return new Response('', { status: 500 })
    }
    await runSmoke({
      env: { [ENV_BASE_URL]: 'https://alt.test/h' },
      fetch: probeOnly,
      log() {},
      error() {},
    })
    expect(seen[0]).toBe('https://alt.test/h/')
    seen.length = 0
    await runSmoke({ env: {}, fetch: probeOnly, log() {}, error() {} })
    expect(seen[0]).toBe(DEFAULT_BASE_URL)
  })

  it('a malformed base URL is exit 2 with nothing sent', async () => {
    const r = await runIt({ baseUrl: 'example.test/hygieia' })
    expect(r.code).toBe(2)
    expect(r.fake.calls).toHaveLength(0)
    expect(r.err[0]).toMatch(/base URL must be an absolute http\(s\) URL/)
    expect(r.err[1]).toBe(USAGE)
  })

  it('main(): a flag or a second argument is a usage error (exit 2, nothing sent)', async () => {
    const err: string[] = []
    const fake = fakeFetch({})
    const io = { fetch: fake.fetch, log() {}, error: (s: string) => err.push(s) }
    expect(await main(['--help'], io)).toBe(2)
    expect(await main(['a', 'b'], io)).toBe(2)
    expect(err).toEqual([USAGE, USAGE])
    expect(fake.calls).toHaveLength(0)
    // a positional base URL is used as-is (normalised)
    expect(await main([BASE.slice(0, -1)], { ...io, probeToken: () => TOKEN })).toBe(0)
    expect(fake.calls[0].url).toBe(BASE)
  })

  it('the CLI refuses a bad URL with exit 2 and no network', () => {
    const r = spawnSync(process.execPath, [SCRIPT, 'not-a-url'], { encoding: 'utf8' })
    expect(r.status).toBe(2)
    expect(r.stderr).toMatch(/base URL must be an absolute http\(s\) URL/)
    expect(r.stdout).toBe('')
  })
})

describe('the happy path (Pages-like site, no backend env)', () => {
  it('every static probe passes, backend SKIPPED, SMOKE PASSED, exit 0', async () => {
    const r = await runIt({})
    expect(r.code).toBe(0)
    expect(r.err).toEqual([])
    expect(r.fails).toEqual([])
    expect(r.out[0]).toMatch(
      /^smoke:live — HTTP only · https:\/\/example\.test\/hygieia\/ · timeout 15000 ms/,
    )
    expect(r.passes).toEqual([
      'PASS  GET / → 200, lang="el", title "Hygieia · Υγίεια", #root, manifest linked',
      'PASS  GET manifest.webmanifest → 200, start_url + scope /hygieia/, display standalone, 3 icons',
      'PASS  GET icon icons/pwa-192.png → 200 image/png',
      'PASS  GET icon icons/pwa-512.png → 200 image/png',
      'PASS  GET icon icons/maskable-512.png → 200 image/png',
      'PASS  GET sw.js → 200 application/javascript',
      'PASS  GET registerSW.js → 200 application/javascript',
      `PASS  GET ${DEEP} → 404 with the SPA fallback document (#root + manifest link)`,
      'PASS  GET favicon.svg → 200 image/svg+xml',
      'PASS  GET script /hygieia/assets/index-AAAA.js → 200, 37 chars, no secret-looking value or server-only name',
      'PASS  GET script /hygieia/registerSW.js → 200, 50 chars, no secret-looking value or server-only name',
      'PASS  GET stylesheet https://fonts.example.test/css2?family=Inter&display=swap → 200, 29 chars, no secret-looking value or server-only name',
      'PASS  GET stylesheet /hygieia/assets/index-BBBB.css → 200, 14 chars, no secret-looking value or server-only name',
      'PASS  GET brand/og-hygieia.jpg → 200 image/jpeg',
    ])
    expect(r.out.at(-2)).toBe(BACKEND_SKIPPED)
    expect(BACKEND_SKIPPED).toBe(
      'SKIPPED (backend) — set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY',
    )
    expect(r.out.at(-1)).toMatch(
      /^SMOKE PASSED — 14 probes against https:\/\/example\.test\/hygieia\/ \(\d+ ms\)$/,
    )
    // nothing went to the backing service
    expect(r.fake.calls.some((c) => c.url.startsWith(SUPA))).toBe(false)
    // only GETs, every URL under the base or an index.html-referenced origin
    for (const c of r.fake.calls)
      expect(c.url).toMatch(/^https:\/\/(example|fonts\.example)\.test\//)
  })

  it('the deep-link probe carries a random suffix when none is pinned', async () => {
    const fake = fakeFetch({})
    await runSmoke({ baseUrl: BASE, env: {}, fetch: fake.fetch, log() {}, error() {} })
    const deep = fake.calls.map((c) => c.url).filter((u) => u.includes('deep-link-probe-'))
    expect(deep).toHaveLength(1)
    expect(deep[0]).toMatch(
      /^https:\/\/example\.test\/hygieia\/recipes\/deep-link-probe-[a-z0-9]{6,}$/,
    )
  })

  it('extractAssets() finds scripts and stylesheets in either attribute order, resolved against the base', () => {
    expect(extractAssets(INDEX_HTML, BASE)).toEqual([
      {
        kind: 'script',
        src: '/hygieia/assets/index-AAAA.js',
        url: 'https://example.test/hygieia/assets/index-AAAA.js',
      },
      {
        kind: 'script',
        src: '/hygieia/registerSW.js',
        url: 'https://example.test/hygieia/registerSW.js',
      },
      {
        kind: 'stylesheet',
        src: 'https://fonts.example.test/css2?family=Inter&display=swap',
        url: 'https://fonts.example.test/css2?family=Inter&display=swap',
      },
      {
        kind: 'stylesheet',
        src: '/hygieia/assets/index-BBBB.css',
        url: 'https://example.test/hygieia/assets/index-BBBB.css',
      },
    ])
    // rel="icon" / rel="manifest" / preconnect are not stylesheets; inline scripts have no src
    expect(
      extractAssets(
        '<link rel="icon" href="a.svg"><script>1</script><link rel="preconnect" href="https://x">',
        BASE,
      ),
    ).toEqual([])
    expect(extractAssets("<link rel='stylesheet' href='s.css'>", BASE)).toEqual([
      { kind: 'stylesheet', src: 's.css', url: `${BASE}s.css` },
    ])
  })
})

describe('probe 1 — the home document', () => {
  const home = (body: string, status = 200) =>
    fakeFetch({ site: pagesSite({ [BASE]: { status, type: 'text/html', body } }) })

  it('wrong lang fails and names the marker', async () => {
    const r = await runIt({ fake: home(INDEX_HTML.replace('<html lang="el"', '<html lang="en"')) })
    expect(r.code).toBe(1)
    expect(r.fails[0]).toBe(`FAIL  GET /: 200 but the document lacks: lang ${HTML_MARKERS.lang}`)
    expect(r.err.at(-1)).toMatch(
      /^SMOKE FAILED — GET \/: 200 but the document lacks: lang <html lang="el"/,
    )
  })

  it('missing title / root / manifest link each fail', async () => {
    const r = await runIt({
      fake: home(
        INDEX_HTML.replace(HTML_MARKERS.title, '<title>x</title>').replace(
          '<div id="root"></div>',
          '',
        ),
      ),
    })
    expect(r.fails[0]).toContain('title <title>Hygieia · Υγίεια</title>; root <div id="root">')
    const r2 = await runIt({ fake: home(INDEX_HTML.replace('rel="manifest"', 'rel="other"')) })
    expect(r2.fails[0]).toContain('manifest rel="manifest"')
  })

  it('a non-200 home fails and the asset probes are skipped with their own FAIL', async () => {
    const r = await runIt({ fake: home('<html>maintenance</html>', 503) })
    expect(r.code).toBe(1)
    expect(r.fails[0]).toBe('FAIL  GET /: HTTP 503 (text/html)')
    expect(r.fails).toContain('FAIL  index.html assets: skipped — the home document did not load')
    expect(r.err.at(-1)).toMatch(/^SMOKE FAILED — GET \/: HTTP 503 .*\(\+\d+ more\)/)
  })
})

describe('probe 2 — the manifest and its icons', () => {
  const withManifest = (m: unknown, over: Record<string, Answer | undefined> = {}) =>
    fakeFetch({ site: pagesSite(over, m) })

  it('a wrong start_url / scope / display is reported field by field', async () => {
    const r = await runIt({
      fake: withManifest({ ...MANIFEST, start_url: '/', display: 'browser' }),
    })
    expect(r.code).toBe(1)
    expect(r.fails[0]).toBe(
      'FAIL  GET manifest.webmanifest: start_url is "/", want "/hygieia/"; display is "browser", want "standalone"',
    )
    expect(MANIFEST_EXPECT).toEqual({
      start_url: '/hygieia/',
      scope: '/hygieia/',
      display: 'standalone',
      minIcons: 3,
    })
    const r2 = await runIt({ fake: withManifest({ ...MANIFEST, scope: undefined }) })
    expect(r2.fails[0]).toBe('FAIL  GET manifest.webmanifest: scope is null, want "/hygieia/"')
  })

  it('fewer than 3 icons fails; a missing icons array too', async () => {
    const r = await runIt({
      fake: withManifest({ ...MANIFEST, icons: MANIFEST.icons.slice(0, 2) }),
    })
    expect(r.fails[0]).toBe('FAIL  GET manifest.webmanifest: 2 icon(s), want ≥ 3')
    const r2 = await runIt({ fake: withManifest({ ...MANIFEST, icons: undefined }) })
    expect(r2.fails[0]).toBe('FAIL  GET manifest.webmanifest: 0 icon(s), want ≥ 3')
    // no icon probes were attempted when the manifest itself failed
    expect(r2.out.some((l) => l.includes('GET icon'))).toBe(false)
  })

  it('a 404 manifest, or one that is not JSON, fails', async () => {
    const r = await runIt({
      fake: withManifest(MANIFEST, { [`${BASE}manifest.webmanifest`]: undefined }),
    })
    expect(r.fails[0]).toBe('FAIL  GET manifest.webmanifest: HTTP 404')
    const r2 = await runIt({
      fake: withManifest(MANIFEST, {
        [`${BASE}manifest.webmanifest`]: { status: 200, type: 'text/html', body: '<html>' },
      }),
    })
    expect(r2.fails[0]).toBe(
      'FAIL  GET manifest.webmanifest: 200 but the body is not JSON (text/html)',
    )
  })

  it('an icon that 404s (Pages serves the HTML fallback) fails; a wrong content-type fails', async () => {
    const r = await runIt({
      fake: withManifest(MANIFEST, { [`${BASE}icons/pwa-512.png`]: undefined }),
    })
    expect(r.code).toBe(1)
    expect(r.fails).toEqual(['FAIL  GET icon icons/pwa-512.png: HTTP 404'])
    expect(r.passes).toContain('PASS  GET icon icons/pwa-192.png → 200 image/png')
    const r2 = await runIt({
      fake: withManifest(MANIFEST, {
        [`${BASE}icons/maskable-512.png`]: { status: 200, type: 'text/html', body: '<html>' },
      }),
    })
    expect(r2.fails).toEqual([
      'FAIL  GET icon icons/maskable-512.png: 200 but content-type text/html, want image/png',
    ])
  })

  it('icon URLs resolve relative to the manifest (and absolute paths are honoured)', async () => {
    const m = {
      ...MANIFEST,
      icons: [
        { src: 'icons/pwa-192.png', sizes: '192x192', type: 'image/png' },
        { src: '/hygieia/icons/pwa-512.png', sizes: '512x512', type: 'image/png' },
        {
          src: './icons/maskable-512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'maskable',
        },
      ],
    }
    const r = await runIt({ fake: withManifest(m) })
    expect(r.code).toBe(0)
    const iconCalls = r.fake.calls.map((c) => c.url).filter((u) => u.includes('/icons/'))
    expect(iconCalls).toEqual([
      `${BASE}icons/pwa-192.png`,
      `${BASE}icons/pwa-512.png`,
      `${BASE}icons/maskable-512.png`,
    ])
  })
})

describe('probes 3, 4, 6, 8 — sw.js, registerSW.js, favicon, og image', () => {
  it('sw.js: 404 fails; a non-JavaScript content-type fails', async () => {
    const r = await runIt({ fake: fakeFetch({ site: pagesSite({ [`${BASE}sw.js`]: undefined }) }) })
    expect(r.fails).toEqual(['FAIL  GET sw.js: HTTP 404'])
    const r2 = await runIt({
      fake: fakeFetch({
        site: pagesSite({ [`${BASE}sw.js`]: { status: 200, type: 'text/plain', body: 'x' } }),
      }),
    })
    expect(r2.fails).toEqual(['FAIL  GET sw.js: 200 but content-type text/plain, want JavaScript'])
    // text/javascript is JavaScript too
    const r3 = await runIt({
      fake: fakeFetch({
        site: pagesSite({
          [`${BASE}sw.js`]: { status: 200, type: 'text/javascript; charset=utf-8', body: 'x' },
        }),
      }),
    })
    expect(r3.passes).toContain('PASS  GET sw.js → 200 text/javascript')
  })

  it('registerSW.js 404 fails (twice: as probe 4 and as an index.html script)', async () => {
    const r = await runIt({
      fake: fakeFetch({ site: pagesSite({ [`${BASE}registerSW.js`]: undefined }) }),
    })
    expect(r.code).toBe(1)
    expect(r.fails).toEqual([
      'FAIL  GET registerSW.js: HTTP 404',
      'FAIL  GET script /hygieia/registerSW.js: HTTP 404',
    ])
  })

  it('favicon.svg: 404 fails; a wrong content-type fails', async () => {
    const r = await runIt({
      fake: fakeFetch({ site: pagesSite({ [`${BASE}favicon.svg`]: undefined }) }),
    })
    expect(r.fails).toEqual(['FAIL  GET favicon.svg: HTTP 404'])
    const r2 = await runIt({
      fake: fakeFetch({
        site: pagesSite({
          [`${BASE}favicon.svg`]: { status: 200, type: 'text/plain', body: '<svg/>' },
        }),
      }),
    })
    expect(r2.fails).toEqual([
      'FAIL  GET favicon.svg: 200 but content-type text/plain, want image/svg+xml',
    ])
  })

  it('the og:image 404 fails', async () => {
    const r = await runIt({
      fake: fakeFetch({ site: pagesSite({ [`${BASE}brand/og-hygieia.jpg`]: undefined }) }),
    })
    expect(r.fails).toEqual(['FAIL  GET brand/og-hygieia.jpg: HTTP 404'])
  })
})

describe('probe 5 — the deep-link fallback', () => {
  it('a deep link answering 200 means the server is not Pages-like → FAIL', async () => {
    const r = await runIt({
      fake: fakeFetch({
        site: pagesSite({
          [`${BASE}${DEEP}`]: { status: 200, type: 'text/html', body: INDEX_HTML },
        }),
      }),
    })
    expect(r.code).toBe(1)
    expect(r.fails).toHaveLength(1)
    expect(r.fails[0]).toMatch(
      new RegExp(`^FAIL {2}GET ${DEEP}: HTTP 200 — the server is NOT Pages-like`),
    )
  })

  it('a bare 404 without the SPA document → FAIL (404.html missing or not index.html)', async () => {
    const r = await runIt({ fake: fakeFetch({ bare404: true }) })
    expect(r.code).toBe(1)
    expect(r.fails).toEqual([
      `FAIL  GET ${DEEP}: 404 but the body is not the SPA fallback document (404.html missing or not a copy of index.html) — deep links will not boot the app`,
    ])
  })

  it('a 404 document with #root but no manifest link is not the fallback either; other statuses fail', async () => {
    const r = await runIt({
      fake: fakeFetch({
        site: pagesSite({
          [`${BASE}${DEEP}`]: { status: 404, type: 'text/html', body: '<div id="root"></div>' },
        }),
      }),
    })
    expect(r.fails[0]).toMatch(/404 but the body is not the SPA fallback document/)
    const r2 = await runIt({
      fake: fakeFetch({
        site: pagesSite({ [`${BASE}${DEEP}`]: { status: 302, type: 'text/html', body: '' } }),
      }),
    })
    expect(r2.fails).toEqual([`FAIL  GET ${DEEP}: HTTP 302, want 404 + the SPA document`])
  })
})

describe('probe 7 — the served bundle is reachable and secret-free (scanText)', () => {
  it('a planted service_role in the JS chunk fails with a masked excerpt', async () => {
    const r = await runIt({
      fake: fakeFetch({
        site: pagesSite({
          [`${BASE}assets/index-AAAA.js`]: JS('const k = "service_role"; const u = "x"'),
        }),
      }),
    })
    expect(r.code).toBe(1)
    expect(r.fails).toEqual([
      'FAIL  GET script /hygieia/assets/index-AAAA.js: 200 but the served script contains 1 secret-looking finding(s): /hygieia/assets/index-AAAA.js:1:12 (offset 11)  [service-role]  servic… (12 chars)',
    ])
    expect(r.err.at(-1)).toMatch(
      /^SMOKE FAILED — GET script \/hygieia\/assets\/index-AAAA\.js: .*\[service-role\]/,
    )
  })

  it('a server-only env NAME in the stylesheet or a Supabase PAT fails too; the value is masked', async () => {
    // Assembled at runtime: a literal token-shaped string trips GitHub push protection (and the crew secret-scan hook).
    const pat = ['sbp', '0123456789abcdef0123456789abcdef01234567'].join('_')
    const r = await runIt({
      fake: fakeFetch({
        site: pagesSite({
          [`${BASE}assets/index-BBBB.css`]: {
            status: 200,
            type: 'text/css',
            body: `/* SUPABASE_SERVICE_ROLE_KEY */`,
          },
          [`${BASE}assets/index-AAAA.js`]: JS(`fetch(u, { headers: { t: "${pat}" } })`),
        }),
      }),
    })
    expect(r.code).toBe(1)
    expect(r.fails).toHaveLength(2)
    expect(r.fails[0]).toMatch(/\[secret-value\] {2}sbp_01… \(44 chars\)/)
    expect(r.fails[1]).toMatch(/\[forbidden-name\] {2}SUPABASE_SERVICE_ROLE_KEY/)
    expect(r.all).not.toContain(pat)
  })

  it('an asset that 404s fails; the external stylesheet is checked as well', async () => {
    const r = await runIt({
      fake: fakeFetch({
        site: pagesSite({
          [`${BASE}assets/index-BBBB.css`]: undefined,
          'https://fonts.example.test/css2?family=Inter&display=swap': { status: 503, body: '' },
        }),
      }),
    })
    expect(r.fails).toEqual([
      'FAIL  GET stylesheet https://fonts.example.test/css2?family=Inter&display=swap: HTTP 503',
      'FAIL  GET stylesheet /hygieia/assets/index-BBBB.css: HTTP 404',
    ])
  })

  it('a home document that references no asset at all fails', async () => {
    const body = INDEX_HTML.replace(/<script[^>]*src=[^>]*><\/script>/g, '').replace(
      /<link[^>]*stylesheet[^>]*>/g,
      '',
    )
    const r = await runIt({
      fake: fakeFetch({ site: pagesSite({ [BASE]: { status: 200, type: 'text/html', body } }) }),
    })
    expect(r.fails).toContain(
      'FAIL  index.html assets: the home document references no <script src> or stylesheet',
    )
  })
})

describe('the backend probes (anon through PostgREST)', () => {
  it('without the env: one SKIPPED line, no request to the backing service, still exit 0', async () => {
    const r = await runIt({ env: { [ENV_URL]: SUPA } }) // only one of the two names
    expect(r.code).toBe(0)
    expect(r.out).toContain(BACKEND_SKIPPED)
    expect(r.fake.calls.some((c) => c.url.startsWith(SUPA))).toBe(false)
    expect(r.out.at(-1)).toMatch(/^SMOKE PASSED — 14 probes/)
  })

  it('with the env: approved rows ≥ 1 PASS, pending [] and profiles [] PASS, 17 probes', async () => {
    const r = await runIt({ env: BACKEND_ENV, fake: fakeFetch({ rest: { approved: rows(1) } }) })
    expect(r.code).toBe(0)
    expect(r.out).not.toContain(BACKEND_SKIPPED)
    expect(r.passes.slice(-3)).toEqual([
      `PASS  anon GET ${APPROVED_PATH} (Accept-Profile: hygieia) → 200, approved rows: 1`,
      `PASS  anon GET ${REST_PROBES[0].path} (Accept-Profile: hygieia) → 200 []`,
      `PASS  anon GET ${REST_PROBES[1].path} (Accept-Profile: hygieia) → 200 []`,
    ])
    expect(r.out.at(-1)).toMatch(/^SMOKE PASSED — 17 probes against/)
    const rest = r.fake.calls.filter((c) => c.url.startsWith(SUPA))
    expect(rest.map((c) => c.url)).toEqual([
      `${SUPA}${APPROVED_PATH}`,
      `${SUPA}${REST_PROBES[0].path}`,
      `${SUPA}${REST_PROBES[1].path}`,
    ])
    for (const c of rest) {
      expect(c.headers.apikey).toBe(ANON)
      expect(c.headers.Authorization).toBe(`Bearer ${ANON}`)
      expect(c.headers['Accept-Profile']).toBe('hygieia')
    }
    // the static probes carry no credential
    for (const c of r.fake.calls.filter((c) => !c.url.startsWith(SUPA))) {
      expect(c.headers.apikey).toBeUndefined()
      expect(c.headers.Authorization).toBeUndefined()
    }
  })

  it('0 approved rows is a WARN, not a FAIL: exit 0, the summary counts the WARN', async () => {
    const r = await runIt({ env: BACKEND_ENV, fake: fakeFetch({ rest: { approved: EMPTY } }) })
    expect(r.code).toBe(0)
    expect(r.fails).toEqual([])
    expect(r.warns).toEqual([
      `WARN  anon GET ${APPROVED_PATH} (Accept-Profile: hygieia) → 200 [] — approved rows: 0 (no recipe approved yet; approval is the operator step OP4.b, not a deploy defect)`,
    ])
    expect(r.out.at(-1)).toMatch(/^SMOKE PASSED — 17 probes against .* \(\d+ ms\) · 1 WARN$/)
  })

  it('pending rows visible to anon → FAIL, exit 1', async () => {
    const r = await runIt({
      env: BACKEND_ENV,
      fake: fakeFetch({ rest: { pending: rows(2, 'id') } }),
    })
    expect(r.code).toBe(1)
    expect(r.fails).toEqual([
      `FAIL  anon GET ${REST_PROBES[0].path} (Accept-Profile: hygieia): anon can see pending recipe row(s) live — the select policy must hide status <> approved (2 row(s) returned)`,
    ])
    expect(r.err.at(-1)).toMatch(
      /^SMOKE FAILED — anon GET \/rest\/v1\/recipes\?select=id&status=eq\.pending/,
    )
  })

  it('profile rows visible to anon → FAIL', async () => {
    const r = await runIt({
      env: BACKEND_ENV,
      fake: fakeFetch({ rest: { profiles: rows(1, 'user_id') } }),
    })
    expect(r.code).toBe(1)
    expect(r.fails[0]).toMatch(/anon can see profile row\(s\) live/)
  })

  it('a schema-not-exposed answer on the approved probe is classified like db:live-check', async () => {
    const pgrst106: Answer = {
      status: 406,
      type: 'application/json',
      body: JSON.stringify({
        code: 'PGRST106',
        message: 'The schema must be one of the following: public',
      }),
    }
    const r = await runIt({ env: BACKEND_ENV, fake: fakeFetch({ rest: { approved: pgrst106 } }) })
    expect(r.code).toBe(1)
    expect(r.fails[0]).toContain('schema hygieia is not exposed in the Data API')
    expect(r.fails[0]).toContain('HTTP 406: The schema must be one of the following')
  })

  it('a PostgREST error that echoes the anon key is redacted', async () => {
    const r = await runIt({
      env: BACKEND_ENV,
      fake: fakeFetch({
        rest: {
          approved: {
            status: 401,
            type: 'application/json',
            body: JSON.stringify({ message: `Invalid API key ${ANON}` }),
          },
        },
      }),
    })
    expect(r.code).toBe(1)
    expect(r.fails[0]).toContain(`HTTP 401: Invalid API key ${REDACTED}`)
  })

  it('a malformed VITE_SUPABASE_URL is a backend FAIL with nothing sent to it', async () => {
    const r = await runIt({ env: { ...BACKEND_ENV, [ENV_URL]: 'supabase.co' } })
    expect(r.code).toBe(1)
    expect(r.fails).toEqual([
      'FAIL  backend: VITE_SUPABASE_URL must be an origin like https://<ref>.supabase.co',
    ])
    expect(r.fake.calls.some((c) => c.url.includes('supabase.co'))).toBe(false)
  })
})

describe('timeouts, network errors and the summary', () => {
  it('a request that never answers fails with a clear timeout message, the rest still run', async () => {
    const r = await runIt({ fake: fakeFetch({ hang: /favicon\.svg$/ }), timeoutMs: 20 })
    expect(r.code).toBe(1)
    expect(r.fails).toEqual([
      `FAIL  GET favicon.svg: request to ${BASE}favicon.svg timed out after 20 ms (no response)`,
    ])
    expect(r.passes.length).toBe(13)
    expect(REQUEST_TIMEOUT_MS).toBe(15_000)
  })

  it('a network error on a probe is a FAIL; the error text is redacted', async () => {
    const r = await runIt({ env: BACKEND_ENV, fake: fakeFetch({ throwOn: /profiles/ }) })
    expect(r.code).toBe(1)
    expect(r.fails).toHaveLength(1)
    expect(r.fails[0]).toMatch(
      /^FAIL {2}anon GET \/rest\/v1\/profiles.*network error calling PostgREST: connect ECONNREFUSED/,
    )
    expect(r.fails[0]).toContain(`(apikey ${REDACTED})`)
  })

  it('SMOKE FAILED names the FIRST failing probe and the count of the others; all probes still ran', async () => {
    const r = await runIt({
      fake: fakeFetch({
        site: pagesSite({
          [`${BASE}sw.js`]: undefined,
          [`${BASE}favicon.svg`]: undefined,
          [`${BASE}brand/og-hygieia.jpg`]: undefined,
        }),
      }),
    })
    expect(r.code).toBe(1)
    expect(r.fails).toHaveLength(3)
    expect(r.err).toHaveLength(1)
    expect(r.err[0]).toMatch(
      /^SMOKE FAILED — GET sw\.js: HTTP 404 \(\+2 more\) \(11 of 14 probes ok, \d+ ms\)$/,
    )
    expect(r.all).not.toContain('SMOKE PASSED')
  })
})
