import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright e2e (PLAN P3.6). One project for now:
 *
 * - `local` (`npm run e2e`): the PRODUCTION build (`dist/`) served by e2e/support/pages-server.mjs,
 *   a static server with GitHub Pages semantics (a file, else dist/404.html WITH status 404), at
 *   the project-site base `/hygieia/` (Vite `base`). Not `vite preview`: its SPA rewrite answers
 *   every deep link with index.html + 200, which would hide a missing 404.html (PLAN §4). No
 *   backend: the build has no Supabase env, so the app runs in local-only mode and no request
 *   leaves the machine (apart from the Google Fonts stylesheet index.html links).
 *
 * The web server builds first (`npm run build`) so a local run never tests a stale dist/. CI has
 * just built and `check:pwa`-scanned dist/ and sets E2E_PREBUILT=1, so the suite tests the exact
 * artifact that is uploaded to Pages, without a second build.
 *
 * `reuseExistingServer: false`, and pages-server fails if the port is taken: a stray server from an
 * earlier run would otherwise answer for code that is not under test.
 *
 * `baseURL` ENDS IN `/hygieia/`, but an absolute path such as `page.goto('/x')` resolves against
 * the ORIGIN (URL semantics), i.e. to `http://127.0.0.1:4173/x`, OUTSIDE the site. Specs therefore
 * spell the base out: `page.goto('/hygieia/recipes')`.
 */
const PORT = Number(process.env.E2E_PORT ?? 4173)
const BASE = '/hygieia'
const ORIGIN = `http://127.0.0.1:${PORT}`
const LOCAL_URL = `${ORIGIN}${BASE}/`
const SERVE = `node e2e/support/pages-server.mjs --port ${PORT} --root dist --base ${BASE}`

export default defineConfig({
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: process.env.CI ? [['github'], ['list']] : [['list']],
  use: {
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'local',
      testDir: './e2e/local',
      // A Greek browser: LangProvider picks Greek from `navigator.language` when nothing is stored,
      // so the smoke spec sees the Greek shell first and toggles to English (a spec that needs an
      // English browser overrides `locale` with `test.use`).
      use: { ...devices['Desktop Chrome'], baseURL: LOCAL_URL, locale: 'el-GR' },
    },
  ],
  webServer: {
    command: process.env.E2E_PREBUILT === '1' ? SERVE : `npm run build && ${SERVE}`,
    url: LOCAL_URL,
    reuseExistingServer: false,
    timeout: 180_000,
    stdout: 'pipe',
    stderr: 'pipe',
    // Blank the Supabase names so the build is local-only even when a developer's .env sets them
    // (Vite never lets a .env file override a variable that already exists in the environment).
    env: {
      VITE_SUPABASE_URL: '',
      VITE_SUPABASE_ANON_KEY: '',
    },
  },
})
