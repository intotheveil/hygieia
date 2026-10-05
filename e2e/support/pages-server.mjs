// A tiny static server that behaves like GitHub Pages (PLAN P3.6), for the e2e suite only.
//
// Why not `vite preview`: its default `appType: 'spa'` answers ANY html request with index.html
// and status 200, so a deep link passes there even when dist/404.html is missing (PLAN §4). Pages
// has no rewrites. It serves a file if one exists at the path and otherwise serves the site's
// 404.html WITH HTTP STATUS 404, leaving the URL (and a PKCE `?code=`) untouched. This server does
// exactly that and nothing more, so a broken SPA fallback turns the e2e suite red:
//
//   GET /path           -> dist/path when it is a file                         (200)
//   GET /dir/           -> dist/dir/index.html when it exists                  (200)
//   GET /dir            -> 301 to /dir/ when dist/dir/index.html exists (Pages does the same)
//   anything else       -> dist/404.html with status 404, or a plain-text 404 when there is no
//                          404.html (Pages' own error page), so the app does NOT boot
//
// `--base /hygieia` (Hygieia is a PROJECT site, served at https://intotheveil.github.io/hygieia/):
// every request must start with the base; the base is stripped and the rest is served from the
// site root as above, so `GET /hygieia/assets/x.js` -> dist/assets/x.js and
// `GET /hygieia/no/such/page` -> dist/404.html (404). `GET /hygieia` (no trailing slash) is a 301
// to `/hygieia/`, as Pages answers for a directory. A request OUTSIDE the base (`GET /other`)
// is answered with a plain-text 404 and never with this site's 404.html: on Pages that URL
// belongs to another site (or to GitHub's own 404 page), so the app must not boot there.
//
// Usage: node e2e/support/pages-server.mjs [--port 4173] [--root dist] [--base /hygieia]
// It binds 127.0.0.1 only and fails loudly if the port is taken (a stray server from an earlier run
// would otherwise answer for code that is not under test).

import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { extname, join, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

/** @type {Record<string, string>} */
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.woff2': 'font/woff2',
  '.webmanifest': 'application/manifest+json',
}

/** @param {string} file */
const contentType = (file) => TYPES[extname(file).toLowerCase()] ?? 'application/octet-stream'

/** @param {string} file @returns {Promise<boolean>} */
async function isFile(file) {
  try {
    return (await stat(file)).isFile()
  } catch {
    return false
  }
}

/**
 * Normalise a `--base` value: '' or '/' means "served at the root"; otherwise a leading slash and
 * no trailing slash, so `/hygieia/`, `hygieia` and `/hygieia` all mean `/hygieia`.
 * @param {string | undefined} raw
 * @returns {string}
 */
export function normalizeBase(raw) {
  const trimmed = (raw ?? '').trim().replace(/\/+$/, '')
  if (trimmed === '') return ''
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`
}

/**
 * Resolve a request path to the response Pages would give. Pure apart from reading `root`.
 * @param {string} root absolute path of the site directory
 * @param {string} rawPath the request path (no query)
 * @param {string} [base] the site's base path ('' for a root site, '/hygieia' for the project site)
 * @returns {Promise<{ status: number, file?: string, location?: string, outsideBase?: true }>}
 */
export async function resolveRequest(root, rawPath, base = '') {
  let sitePath = rawPath
  if (base !== '') {
    if (rawPath === base) return { status: 301, location: `${base}/` }
    if (!rawPath.startsWith(`${base}/`)) return { status: 404, outsideBase: true }
    sitePath = rawPath.slice(base.length)
  }
  /** @type {string | null} */
  let path
  try {
    path = decodeURIComponent(sitePath)
  } catch {
    path = null
  }
  if (path !== null && !path.includes('\0')) {
    const target = resolve(root, '.' + path)
    // Never serve outside the site root (`/../x`).
    if (target === root || target.startsWith(root + sep)) {
      if (path.endsWith('/')) {
        const index = join(target, 'index.html')
        if (await isFile(index)) return { status: 200, file: index }
      } else if (await isFile(target)) {
        return { status: 200, file: target }
      } else if (await isFile(join(target, 'index.html'))) {
        return { status: 301, location: `${rawPath}/` }
      }
    }
  }
  const fallback = join(root, '404.html')
  return (await isFile(fallback)) ? { status: 404, file: fallback } : { status: 404 }
}

/**
 * @param {{ root: string, port: number, host?: string, base?: string }} opts
 * @returns {Promise<import('node:http').Server>}
 */
export function startPagesServer({ root, port, host = '127.0.0.1', base = '' }) {
  const server = createServer((req, res) => {
    const url = new URL(req.url ?? '/', 'http://localhost')
    resolveRequest(root, url.pathname, base)
      .then(async (r) => {
        if (r.location) {
          res.writeHead(r.status, { Location: r.location + url.search })
          res.end()
          return
        }
        if (!r.file) {
          res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
          res.end(
            r.outsideBase
              ? `404 Not found (outside the site base ${base}; Pages serves another site here)\n`
              : '404 File not found (no 404.html in the site)\n',
          )
          return
        }
        const body = await readFile(r.file)
        res.writeHead(r.status, {
          'Content-Type': contentType(r.file),
          'Content-Length': body.length,
          'Cache-Control': 'no-store',
        })
        res.end(req.method === 'HEAD' ? undefined : body)
      })
      .catch((err) => {
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' })
        res.end(`500 ${String(err)}\n`)
      })
  })
  return new Promise((resolvePromise, reject) => {
    server.once('error', reject)
    server.listen(port, host, () => resolvePromise(server))
  })
}

/** @param {string[]} argv @param {string} name @param {string} fallback */
function arg(argv, name, fallback) {
  const i = argv.indexOf(name)
  return i >= 0 && argv[i + 1] ? argv[i + 1] : fallback
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const argv = process.argv.slice(2)
  const root = resolve(arg(argv, '--root', 'dist'))
  const port = Number(arg(argv, '--port', '4173'))
  const base = normalizeBase(arg(argv, '--base', ''))
  if (!(await isFile(join(root, 'index.html')))) {
    console.error(`pages-server: ${root} has no index.html. Run \`npm run build\` first.`)
    process.exitCode = 1
  } else {
    try {
      await startPagesServer({ root, port, base })
      console.log(
        `pages-server: serving ${root} at http://127.0.0.1:${port}${base}/ (Pages semantics)`,
      )
    } catch (err) {
      console.error(`pages-server: cannot listen on 127.0.0.1:${port}: ${String(err)}`)
      process.exitCode = 1
    }
  }
}
