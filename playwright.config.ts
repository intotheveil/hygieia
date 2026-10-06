import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright e2e (PLAN P3.6 + P5.1). Two projects, each with its own production build and server:
 *
 * - `local` (e2e/local): the PRODUCTION build (`dist/`) served by e2e/support/pages-server.mjs,
 *   a static server with GitHub Pages semantics (a file, else dist/404.html WITH status 404), at
 *   the project-site base `/hygieia/` (Vite `base`). Not `vite preview`: its SPA rewrite answers
 *   every deep link with index.html + 200, which would hide a missing 404.html (PLAN §4). No
 *   backend: the build has no Supabase env, so the app runs in local-only mode and no request
 *   leaves the machine (apart from the Google Fonts stylesheet index.html links).
 *
 * - `dead-backend` (e2e/dead-backend): a SECOND build (`dist-dead/`, `npm run build:dead`,
 *   scripts/build-dead.mjs) in CONFIGURED mode against `http://127.0.0.1:9/`, where nothing
 *   listens, served the same way on port 4174. Every Supabase read fails for real on the production
 *   artifact, so the error states and Retry are EXERCISED, not just written (CLAUDE.md §5). Its
 *   console watchdog (e2e/support/dead-backend.ts) ignores only the dead host's failed requests.
 *
 * The web servers build first (`npm run build`, `npm run build:dead`; Playwright starts the entries
 * one after the other) so a local run never tests a stale directory. CI has just built both and
 * `check:pwa`-scanned dist/ and sets E2E_PREBUILT=1, so the suite tests the exact artifacts,
 * without a rebuild.
 *
 * `reuseExistingServer: false`, and pages-server fails if the port is taken: a stray server from an
 * earlier run would otherwise answer for code that is not under test.
 *
 * `baseURL` ENDS IN `/hygieia/`, but an absolute path such as `page.goto('/x')` resolves against
 * the ORIGIN (URL semantics), i.e. to `http://127.0.0.1:4173/x`, OUTSIDE the site. Specs therefore
 * spell the base out: `page.goto('/hygieia/recipes')`.
 */
const PORT = Number(process.env.E2E_PORT ?? 4173)
const DEAD_PORT = Number(process.env.E2E_DEAD_PORT ?? 4174)
const BASE = '/hygieia'
const ORIGIN = `http://127.0.0.1:${PORT}`
const DEAD_ORIGIN = `http://127.0.0.1:${DEAD_PORT}`
const LOCAL_URL = `${ORIGIN}${BASE}/`
const DEAD_URL = `${DEAD_ORIGIN}${BASE}/`
const SERVE = `node e2e/support/pages-server.mjs --port ${PORT} --root dist --base ${BASE}`
const SERVE_DEAD = `node e2e/support/pages-server.mjs --port ${DEAD_PORT} --root dist-dead --base ${BASE}`
const PREBUILT = process.env.E2E_PREBUILT === '1'

// A Greek browser: LangProvider picks Greek from `navigator.language` when nothing is stored, so
// the specs see the Greek shell first and toggle to English (a spec that needs an English browser
// overrides `locale` with `test.use`).
const BROWSER = { ...devices['Desktop Chrome'], locale: 'el-GR' }

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
      use: { ...BROWSER, baseURL: LOCAL_URL },
    },
    {
      name: 'dead-backend',
      testDir: './e2e/dead-backend',
      use: { ...BROWSER, baseURL: DEAD_URL },
      // supabase-js RETRIES a failed PostgREST request (4 attempts with back-off, ~7 s measured)
      // before it answers, so a page settles into its error state well after the 5 s house
      // expect budget; each test also clicks Retry once (another round). Budgets sized for that.
      timeout: 90_000,
      expect: { timeout: 20_000 },
    },
  ],
  webServer: [
    {
      command: PREBUILT ? SERVE : `npm run build && ${SERVE}`,
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
    {
      // scripts/build-dead.mjs sets the dead Supabase pair itself (and blanks the fleet names), so
      // no env is needed here and a developer's .env cannot leak into this build either.
      command: PREBUILT ? SERVE_DEAD : `npm run build:dead && ${SERVE_DEAD}`,
      url: DEAD_URL,
      reuseExistingServer: false,
      timeout: 180_000,
      stdout: 'pipe',
      stderr: 'pipe',
    },
  ],
})
