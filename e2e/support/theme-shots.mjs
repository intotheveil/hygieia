// Four screenshots of the home page, one per theme, from the production build in dist/ served with
// GitHub Pages semantics (same server the e2e `local` project uses). Not a test: evidence for the
// operator and the BUILD_LOG. Run after `npm run build`:
//   node e2e/support/theme-shots.mjs [outDir] [route]
import { chromium } from '@playwright/test'
import { mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { startPagesServer } from './pages-server.mjs'

const outDir = resolve(process.argv[2] ?? 'theme-shots')
const route = process.argv[3] ?? '/'
const THEMES = ['default', 'dark', 'athletic', 'gamer']
mkdirSync(outDir, { recursive: true })

const PORT = 4299
const server = await startPagesServer({ root: resolve('dist'), base: '/hygieia', port: PORT })
const origin = `http://127.0.0.1:${PORT}`
const browser = await chromium.launch()
try {
  for (const theme of THEMES) {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 900 },
      locale: 'el',
    })
    await context.addInitScript((t) => window.localStorage.setItem('hygieia:theme', t), theme)
    const page = await context.newPage()
    await page.goto(`${origin}/hygieia${route}`)
    await page.getByRole('heading', { level: 1 }).waitFor()
    await page.waitForTimeout(400)
    const file = resolve(outDir, `${theme}${route === '/' ? '' : route.replace(/\//g, '-')}.png`)
    await page.screenshot({ path: file, fullPage: false })
    console.log('shot', theme, file)
    await context.close()
  }
} finally {
  await browser.close()
  await new Promise((done) => server.close(done))
}
