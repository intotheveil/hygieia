// @vitest-environment node
//
// P6.2 — the bundle secret scan (`npm run check:bundle`). Every rule gets a RED fixture (asserting
// the rule id and, for values, that the full secret never appears in any output) and every
// publishable look-alike gets a GREEN fixture. JWTs are minted here at runtime, unsigned, so no
// token-shaped literal lives in the source. Directory tests write into an OS temp dir, never dist/.
// The last block builds the REAL app and proves the real dist/ is clean.
//
// Lifted from Themis (scripts/check-bundle-secrets.test.ts) with the Hygieia name list; the
// private-key, AWS key id and `sb_publishable_` cases and the real-build block are Hygieia's.

import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import {
  DEFAULT_DIR,
  FORBIDDEN_NAMES,
  MASK_KEEP,
  SECRET_PREFIXES,
  TEXT_EXTENSIONS,
  formatFinding,
  isTextFile,
  main,
  mask,
  scanDir,
  scanText,
} from './check-bundle-secrets.mjs'

const SCRIPT = fileURLToPath(new URL('./check-bundle-secrets.mjs', import.meta.url))
const ROOT = fileURLToPath(new URL('..', import.meta.url))

/** An unsigned JWT-shaped token. The signature segment is a placeholder: nothing here is a real key. */
const mintJwt = (payload: Record<string, unknown>) => {
  const seg = (o: unknown) => Buffer.from(JSON.stringify(o)).toString('base64url')
  return `${seg({ alg: 'HS256', typ: 'JWT' })}.${seg(payload)}.not-a-real-signature`
}

const rules = (text: string) => scanText(text).map((f) => f.rule)

/** A PEM block header, assembled at runtime so no complete header literal lives in this source. */
const pemHeader = (kind: string, end = false) =>
  [`-----${end ? 'END' : 'BEGIN'}`, kind, 'KEY-----'].join(' ')

/** The value never leaks: not in the excerpt, not anywhere in the serialised findings. */
const assertMasked = (findings: ReturnType<typeof scanText>, secret: string) => {
  expect(findings.length).toBeGreaterThan(0)
  for (const f of findings) {
    expect(f.excerpt).not.toBe(secret)
    expect(f.excerpt).toBe(`${secret.slice(0, MASK_KEEP)}…`)
    expect(f.excerpt.length).toBe(MASK_KEEP + 1)
  }
  expect(JSON.stringify(findings)).not.toContain(secret)
}

describe('mask', () => {
  it('keeps the first 6 characters and an ellipsis, nothing else', () => {
    expect(mask('sbp_0123456789abcdef')).toBe('sbp_01…')
    expect(mask('abc')).toBe('abc…')
  })
})

describe('scanText: secret-value prefixes', () => {
  it.each(['sk-ant-', 'sk_live_', 'sk_test_', 'whsec_', 'sbp_', 'sb_secret_'])(
    'flags %s followed by key characters, masked',
    (prefix) => {
      const secret = `${prefix}FAKEfake0123456789abcdefXYZ`
      const findings = scanText(`const k = "${secret}";`)
      expect(findings).toHaveLength(1)
      expect(findings[0]).toMatchObject({
        rule: 'secret-value',
        line: 1,
        column: 12,
        offset: 11,
        length: secret.length,
      })
      assertMasked(findings, secret)
    },
  )

  it('covers every exported prefix (the list above is not stale)', () => {
    expect([...SECRET_PREFIXES].sort()).toEqual(
      ['sk-ant-', 'sk_live_', 'sk_test_', 'whsec_', 'sbp_', 'sb_secret_'].sort(),
    )
  })

  it('a planted Supabase personal access token (sbp_) is found and masked', () => {
    const token = 'sbp_PLANTEDfakeaccesstoken0123456789abcdef'
    const findings = scanText(`fetch(u, { headers: { Authorization: "Bearer ${token}" } })`)
    expect(findings.map((f) => f.rule)).toEqual(['secret-value'])
    expect(findings[0].excerpt).toBe('sbp_PL…')
    assertMasked(findings, token)
  })

  it('does NOT flag a bare prefix with no key characters after it (supabase-js ships startsWith(`sb_secret_`))', () => {
    expect(scanText('kc=e=>e.startsWith(`sb_publishable_`)||e.startsWith(`sb_secret_`)')).toEqual(
      [],
    )
    expect(scanText('const doc = "keys start with sk_live_";')).toEqual([])
  })

  it('does NOT flag a prefix glued to a preceding identifier (task_test_ is not sk_test_)', () => {
    expect(scanText('const task_test_alpha = 1; const mask_live_x = 2; const absbp_y = 3')).toEqual(
      [],
    )
  })

  it('does NOT flag a Supabase publishable key (sb_publishable_…): it is meant to be public', () => {
    expect(scanText('const key = "sb_publishable_FAKEfake0123456789abcdefXYZ";')).toEqual([])
  })

  it('does NOT flag Stripe publishable keys', () => {
    expect(scanText('const pk = "pk_live_FAKE0123"; const pt = "pk_test_FAKE0123";')).toEqual([])
  })

  it('reports offset, line and column across lines', () => {
    const text = ['// header', 'const a = 1', '  x = "whsec_FAKEabc123"'].join('\n')
    expect(scanText(text)).toMatchObject([
      { rule: 'secret-value', line: 3, column: 8, offset: text.indexOf('whsec_') },
    ])
  })

  it('reports every hit in one text, in offset order', () => {
    const text = 'a="sk_test_AAAA1111" b="sbp_BBBB2222"\nc="sk-ant-CCCC3333"'
    expect(scanText(text).map(({ line, column }) => [line, column])).toEqual([
      [1, 4],
      [1, 25],
      [2, 4],
    ])
  })
})

describe('scanText: AWS access key ids', () => {
  it('flags AKIA… and ASIA… 20-char ids, masked', () => {
    const id = 'AKIAFAKEFAKEFAKEFAKE'
    const findings = scanText(`aws.accessKeyId = "${id}"`)
    expect(findings.map((f) => f.rule)).toEqual(['aws-key-id'])
    assertMasked(findings, id)
    expect(rules('x="ASIAFAKEFAKEFAKEFAKE"')).toEqual(['aws-key-id'])
  })

  it('does NOT flag a 20-char uppercase word that is not an access key id, or a longer run', () => {
    expect(scanText('BKIAFAKEFAKEFAKEFAKE AKIAFAKEFAKEFAKEFAKEFAKE AKIAshort')).toEqual([])
  })
})

describe('scanText: PEM private keys', () => {
  it.each(['PRIVATE', 'RSA PRIVATE', 'EC PRIVATE', 'OPENSSH PRIVATE'])(
    'flags -----BEGIN %s KEY-----, masked',
    (kind) => {
      const header = pemHeader(kind)
      const text = `${header}\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC\n${pemHeader(kind, true)}`
      const findings = scanText(text)
      expect(findings.map((f) => f.rule)).toEqual(['private-key'])
      expect(findings[0]).toMatchObject({ line: 1, column: 1, offset: 0 })
      assertMasked(findings, header)
    },
  )

  it('does NOT flag a PUBLIC KEY or a CERTIFICATE block', () => {
    expect(scanText(`${pemHeader('PUBLIC')}\n-----BEGIN CERTIFICATE-----`)).toEqual([])
  })
})

describe('scanText: service_role', () => {
  it('flags the literal service_role', () => {
    const findings = scanText('fetch(u, { headers: { role: "service_role" } })')
    expect(findings.map((f) => f.rule)).toEqual(['service-role'])
    expect(findings[0].excerpt).toBe('servic…')
  })

  it('flags a JWT whose decoded payload has role service_role (base64 hides the literal)', () => {
    const jwt = mintJwt({ iss: 'supabase', ref: 'fakeref', role: 'service_role', iat: 1, exp: 2 })
    // Precondition: the literal is NOT in the text, so only the decoding rule can catch it.
    expect(jwt).not.toContain('service_role')
    const findings = scanText(`const key = "${jwt}"`)
    expect(findings.map((f) => f.rule)).toEqual(['service-jwt'])
    expect(findings[0]).toMatchObject({ line: 1, column: 14, offset: 13, length: jwt.length })
    assertMasked(findings, jwt)
    expect(JSON.stringify(findings)).not.toContain(jwt.split('.')[1])
  })

  it('does NOT flag an anon-role JWT (the anon key is meant to be public)', () => {
    const jwt = mintJwt({ iss: 'supabase', ref: 'fakeref', role: 'anon', iat: 1, exp: 2 })
    expect(scanText(`const anon = "${jwt}"`)).toEqual([])
  })

  it('does NOT flag an authenticated-role JWT (a user session token) or a JWT with no role', () => {
    expect(scanText(mintJwt({ role: 'authenticated', sub: 'u1' }))).toEqual([])
    expect(scanText(mintJwt({ sub: 'u1' }))).toEqual([])
  })

  it('does NOT flag a JWT-shaped string whose payload is not JSON', () => {
    const junk = `${Buffer.from('{"alg":"x"}').toString('base64url')}.eyJnotjsonatall.sig`
    expect(scanText(junk)).toEqual([])
  })
})

describe('scanText: server-only env names', () => {
  it.each(FORBIDDEN_NAMES)('flags %s, reported once, excerpt is the name', (name) => {
    const findings = scanText(`console.log("${name}")`)
    expect(findings).toEqual([
      {
        file: '<text>',
        offset: 13,
        line: 1,
        column: 14,
        rule: 'forbidden-name',
        excerpt: name,
        length: name.length,
      },
    ])
  })

  it('covers the lint rule SERVER_SECRET (bare and HYGIEIA_-prefixed) plus the db:apply names', () => {
    for (const n of ['ANTHROPIC_API_KEY', 'OPENAI_API_KEY']) {
      expect(FORBIDDEN_NAMES).toContain(n)
      expect(FORBIDDEN_NAMES).toContain(`HYGIEIA_${n}`)
    }
    expect(FORBIDDEN_NAMES).toContain('SUPABASE_SERVICE_ROLE_KEY')
    expect(FORBIDDEN_NAMES).toContain('SUPABASE_ACCESS_TOKEN')
    expect(FORBIDDEN_NAMES).toContain('HYGIEIA_SUPABASE_PROJECT_REF')
    expect(FORBIDDEN_NAMES).toHaveLength(7)
  })

  it.each([
    'VITE_SUPABASE_ANON_KEY',
    'VITE_SUPABASE_URL',
    'VITE_FLEET_URL',
    'VITE_FLEET_KEY',
    'VITE_FLEET_PRODUCT_ID',
  ])('does NOT flag the allowed public name %s', (name) => {
    expect(scanText(`const v = "${name}"`)).toEqual([])
  })

  it('matches whole words only (a longer identifier containing a name is not a hit)', () => {
    expect(
      scanText('HYGIEIA_ANTHROPIC_API_KEY_HINT MY_SUPABASE_ACCESS_TOKEN XOPENAI_API_KEY'),
    ).toEqual([])
  })

  it('labels findings with the given file', () => {
    expect(scanText('OPENAI_API_KEY', { file: 'assets/x.js' })[0].file).toBe('assets/x.js')
  })
})

describe('formatFinding', () => {
  it('prints file:line:col (offset) [rule] masked excerpt (length)', () => {
    const [f] = scanText('\nk="sbp_FAKE0123456789"', { file: 'a.js' })
    expect(formatFinding(f)).toBe('a.js:2:4 (offset 4)  [secret-value]  sbp_FA… (18 chars)')
  })
})

describe('isTextFile', () => {
  it('accepts the text extensions the build emits and rejects images', () => {
    for (const ext of ['.html', '.js', '.css', '.json', '.webmanifest', '.svg', '.map']) {
      expect(TEXT_EXTENSIONS).toContain(ext)
      expect(isTextFile(`x${ext}`)).toBe(true)
    }
    expect(isTextFile('X.JS')).toBe(true)
    for (const f of ['a.png', 'b.jpg', 'c.woff2', 'd.ico', 'noext'])
      expect(isTextFile(f)).toBe(false)
  })
})

describe('scanDir', () => {
  let dir: string
  beforeEach(() => {
    dir = mkdtempSync(path.join(tmpdir(), 'hygieia-bundle-scan-'))
  })
  afterEach(() => {
    rmSync(dir, { recursive: true, force: true })
  })

  /** A dist-shaped clean fixture: public names, the anon JWT, a publishable key, a PNG. */
  const plantCleanBuild = () => {
    mkdirSync(path.join(dir, 'assets'))
    writeFileSync(
      path.join(dir, 'index.html'),
      '<!doctype html><script src="/assets/i.js"></script>',
    )
    writeFileSync(
      path.join(dir, 'assets', 'i.js'),
      `const u="VITE_SUPABASE_URL";const pk="sb_publishable_FAKE123";const a="${mintJwt({ role: 'anon' })}";`,
    )
    writeFileSync(path.join(dir, 'manifest.webmanifest'), '{"start_url":"/hygieia/"}')
    writeFileSync(path.join(dir, 'icon.png'), Buffer.from([0x89, 0x50, 0x4e, 0x47]))
  }

  it('a clean build is ok: text files and bytes counted (the PNG is not), no findings', () => {
    plantCleanBuild()
    const result = scanDir(dir)
    expect(result.files).toBe(3)
    expect(result.bytes).toBeGreaterThan(0)
    expect(result.findings).toEqual([])
  })

  it('one planted file yields a finding with its relative, forward-slash path', () => {
    plantCleanBuild()
    mkdirSync(path.join(dir, 'assets', 'chunks'))
    const secret = 'sk_live_PLANTEDfake9876543210'
    writeFileSync(path.join(dir, 'assets', 'chunks', 'leak.js'), `\nlet k="${secret}"`)
    const { findings } = scanDir(dir)
    expect(findings).toHaveLength(1)
    expect(findings[0]).toMatchObject({
      file: 'assets/chunks/leak.js',
      line: 2,
      column: 8,
      offset: 8,
      rule: 'secret-value',
    })
    expect(JSON.stringify(findings)).not.toContain(secret)
  })

  it('a service-role JWT in a .map and a private key in a .json are found', () => {
    plantCleanBuild()
    writeFileSync(
      path.join(dir, 'assets', 'i.js.map'),
      `{"mappings":"${mintJwt({ role: 'service_role' })}"}`,
    )
    writeFileSync(path.join(dir, 'cfg.json'), JSON.stringify({ k: `${pemHeader('PRIVATE')}\nabc` }))
    expect(scanDir(dir).findings).toMatchObject([
      { file: 'assets/i.js.map', rule: 'service-jwt' },
      { file: 'cfg.json', rule: 'private-key' },
    ])
  })

  it('a secret in a non-text file (image) is NOT scanned: the rules are for text output', () => {
    plantCleanBuild()
    writeFileSync(path.join(dir, 'blob.png'), 'SUPABASE_ACCESS_TOKEN')
    expect(scanDir(dir).findings).toEqual([])
  })

  it('a missing dir throws (the CLI turns this into exit 2)', () => {
    expect(() => scanDir(path.join(dir, 'no-such-dist'))).toThrow(/does not exist/)
  })

  it('a path that is a file, not a dir, throws', () => {
    const f = path.join(dir, 'file.txt')
    writeFileSync(f, 'x')
    expect(() => scanDir(f)).toThrow(/does not exist/)
  })

  it('an empty dir, or one with no text file, throws: a scan of nothing must not pass', () => {
    expect(() => scanDir(dir)).toThrow(/npm run build/)
    mkdirSync(path.join(dir, 'assets'))
    writeFileSync(path.join(dir, 'assets', 'a.png'), 'x')
    expect(() => scanDir(dir)).toThrow(/no text file/)
  })
})

describe('main (in-process CLI body: returns the exit code, never exits)', () => {
  let dir: string
  let out: string[]
  let err: string[]
  const io = { log: (s: string) => out.push(s), error: (s: string) => err.push(s) }
  beforeEach(() => {
    dir = mkdtempSync(path.join(tmpdir(), 'hygieia-bundle-main-'))
    out = []
    err = []
  })
  afterEach(() => {
    rmSync(dir, { recursive: true, force: true })
  })

  it('returns 2 on an empty dir with a message naming npm run build', () => {
    expect(main([dir], io)).toBe(2)
    expect(err.join('\n')).toMatch(/check:bundle: .*npm run build/)
    expect(out).toEqual([])
  })

  it('returns 0 on a clean dir and prints the OK line with files and bytes', () => {
    writeFileSync(
      path.join(dir, 'index.html'),
      '<p>sb_publishable_FAKE1 VITE_SUPABASE_ANON_KEY</p>',
    )
    expect(main([dir], io)).toBe(0)
    expect(out).toHaveLength(1)
    expect(out[0]).toMatch(
      /^check:bundle: OK, no secret-looking value or server-only name in 1 files \(\d+ bytes\) in /,
    )
    expect(err).toEqual([])
  })

  it('returns 1 on findings, each printed masked, then the FAIL summary', () => {
    const secret = 'whsec_PLANTEDfake0123456789'
    writeFileSync(path.join(dir, 'a.js'), `x="${secret}";y="OPENAI_API_KEY"`)
    expect(main([dir], io)).toBe(1)
    expect(err[0]).toMatch(/^a\.js:1:4 \(offset 3\)\s+\[secret-value\]\s+whsec_… \(27 chars\)$/)
    expect(err[1]).toMatch(/^a\.js:1:\d+ \(offset \d+\)\s+\[forbidden-name\]\s+OPENAI_API_KEY/)
    expect(err.join('\n')).toMatch(/check:bundle: FAIL: 2 finding\(s\)/)
    expect(err.join('\n') + out.join('\n')).not.toContain(secret)
    expect(out).toEqual([])
  })
})

describe('CLI exit codes (node scripts/check-bundle-secrets.mjs <dir>)', () => {
  const run = (dir: string) => spawnSync(process.execPath, [SCRIPT, dir], { encoding: 'utf8' })
  let dir: string
  beforeEach(() => {
    dir = mkdtempSync(path.join(tmpdir(), 'hygieia-bundle-cli-'))
  })
  afterEach(() => {
    rmSync(dir, { recursive: true, force: true })
  })

  it('exits 2 on a missing dir', () => {
    const r = run(path.join(dir, 'dist'))
    expect(r.status).toBe(2)
    expect(r.stderr).toMatch(/does not exist.*npm run build/)
  })

  it('exits 2 on an empty dir', () => {
    const r = run(dir)
    expect(r.status).toBe(2)
    expect(r.stderr).toMatch(/npm run build/)
  })

  it('exits 0 on a clean dir', () => {
    writeFileSync(
      path.join(dir, 'index.html'),
      '<p>sb_publishable_FAKE1 VITE_SUPABASE_ANON_KEY</p>',
    )
    const r = run(dir)
    expect(r.status).toBe(0)
    expect(r.stdout).toMatch(/check:bundle: OK, no secret-looking value or server-only name/)
  })

  it('exits 1 on a planted sbp_ token and prints it masked (exit code via process.exitCode)', () => {
    const secret = 'sbp_PLANTEDfake0123456789abcdef'
    writeFileSync(path.join(dir, 'a.js'), `x="${secret}"`)
    const r = run(dir)
    expect(r.status).toBe(1)
    expect(r.stderr).toMatch(/a\.js:1:4 \(offset 3\)\s+\[secret-value\]\s+sbp_PL…/)
    expect(r.stderr + r.stdout).not.toContain(secret)
  })
})

describe('the REAL build: npm run build, then scan dist/', () => {
  // The scan is only worth anything against the artifact CI uploads. Build it here (the same
  // command the workflow runs, local-only mode) and prove it is clean. Windows needs a shell for npm;
  // one command string (no args array) keeps Node's DEP0190 warning quiet.
  beforeAll(() => {
    const r = spawnSync('npm run build', {
      cwd: ROOT,
      encoding: 'utf8',
      shell: true,
      env: { ...process.env, VITE_SUPABASE_URL: '', VITE_SUPABASE_ANON_KEY: '' },
    })
    if (r.status !== 0) {
      throw new Error(`npm run build failed (${r.status}):\n${r.stdout}\n${r.stderr}`)
    }
  }, 180_000)

  it('scanDir(dist) → OK: text files counted, zero findings', () => {
    const result = scanDir(DEFAULT_DIR)
    expect(result.files).toBeGreaterThanOrEqual(5) // index.html, 404.html, js, css, manifest, …
    expect(result.bytes).toBeGreaterThan(10_000)
    expect(result.findings).toEqual([])
  })

  it('the CLI with no argument (npm run check:bundle) exits 0 with the OK line', () => {
    const r = spawnSync(process.execPath, [SCRIPT], { cwd: ROOT, encoding: 'utf8' })
    expect(r.status).toBe(0)
    expect(r.stdout).toMatch(
      /^check:bundle: OK, no secret-looking value or server-only name in \d+ files \(\d+ bytes\) in dist\n$/,
    )
    expect(r.stderr).toBe('')
  })
})
