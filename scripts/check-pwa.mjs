// PWA installability gate (runs in CI after `npm run build`). A manifest that is missing a field,
// or an icon the manifest names but dist/ does not contain, makes the install prompt silently
// never appear: nothing errors in the browser. So this checks the BUILT artifact, not the source.
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const dist = resolve(import.meta.dirname, '..', 'dist')
const fail = (msg) => {
  console.error('check:pwa FAILED —', msg)
  process.exit(1)
}

const manifestPath = resolve(dist, 'manifest.webmanifest')
if (!existsSync(manifestPath)) fail('dist/manifest.webmanifest missing')
const m = JSON.parse(readFileSync(manifestPath, 'utf8'))

for (const k of ['name', 'short_name', 'start_url', 'scope', 'display', 'theme_color', 'background_color', 'icons']) {
  if (!m[k]) fail(`manifest.${k} missing`)
}
if (m.start_url !== '/hygieia/') fail(`start_url is ${m.start_url}, want /hygieia/ (Vite base)`)
if (m.scope !== '/hygieia/') fail(`scope is ${m.scope}, want /hygieia/`)
if (m.display !== 'standalone') fail(`display is ${m.display}, want standalone`)

const sizes = new Set(m.icons.map((i) => `${i.sizes}${i.purpose === 'maskable' ? '/maskable' : ''}`))
for (const want of ['192x192', '512x512', '512x512/maskable']) {
  if (!sizes.has(want)) fail(`manifest has no ${want} icon`)
}
for (const icon of m.icons) {
  const p = resolve(dist, icon.src.replace(/^\/hygieia\//, '').replace(/^\//, ''))
  if (!existsSync(p)) fail(`icon ${icon.src} not in dist/`)
}

if (!existsSync(resolve(dist, 'sw.js'))) fail('dist/sw.js (service worker) missing')
const html = readFileSync(resolve(dist, 'index.html'), 'utf8')
if (!/rel="manifest"/.test(html)) fail('index.html does not link the manifest')
if (!/apple-touch-icon/.test(html)) fail('index.html has no apple-touch-icon')
if (!/registerSW|serviceWorker/.test(html + readFileSync(resolve(dist, 'sw.js'), 'utf8'))) {
  fail('no service-worker registration found')
}

console.log(`check:pwa OK — ${m.name}, ${m.icons.length} icons, sw.js present`)
