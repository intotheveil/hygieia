// THE DEAD-BACKEND TEST BUILD — `npm run build:dead` (PLAN P5.1).
//
// The same source as `npm run build`, built into `dist-dead/` in CONFIGURED mode against an address
// nothing listens on: `VITE_SUPABASE_URL=http://127.0.0.1:9/` (port 9 is the discard port; on a
// developer machine and on a CI runner the connection is refused at once) and a dummy anon key.
// src/lib/env.ts therefore selects `configured` mode, src/content/index.ts picks the supabase
// `ContentSource`, and every read fails FOR REAL on the production artifact — a fetch `TypeError`,
// classified `network` — which is what the e2e `dead-backend` project (playwright.config.ts,
// e2e/dead-backend/*.spec.ts) needs to prove the error states and Retry on every page.
//
// Nothing here is a secret: both values are public dummies, set HERE rather than through a `.env.*`
// file (gitignored by policy) or a CI variable, so the build is reproducible from the checkout alone.
// The fleet-telemetry names are blanked so the dead build never posts anywhere either. The two
// Supabase values WIN over a developer's `.env` (Vite never lets a file override an existing
// environment variable).
//
// No `tsc -b` here: `npm run build` / `npm run typecheck` already type-check the identical source
// in the same gate (G0); this script only produces the second artifact. Vite's `--outDir` is
// honoured by the `spaFallback` plugin (it reads the resolved `build.outDir`) and by VitePWA, so
// `dist-dead/404.html` and the service worker land next to the bundle exactly as in `dist/`.
//
// Exit code: Vite's. The CLI sets `process.exitCode` and never calls `process.exit()`.

import { spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

export const DEAD_SUPABASE_URL = 'http://127.0.0.1:9/'
export const DEAD_ANON_KEY = 'dead-anon'
export const DEAD_OUT_DIR = 'dist-dead'

/** The env Vite inlines into the dead build, on top of the current process env. */
export function deadBuildEnv(base = process.env) {
  return {
    ...base,
    VITE_SUPABASE_URL: DEAD_SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY: DEAD_ANON_KEY,
    VITE_FLEET_URL: '',
    VITE_FLEET_KEY: '',
    VITE_FLEET_PRODUCT_ID: '',
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  // Vite's `exports` map hides `bin/vite.js` from `require.resolve`; `./package.json` is exported.
  const vitePkg = createRequire(import.meta.url).resolve('vite/package.json')
  const vite = join(dirname(vitePkg), 'bin', 'vite.js')
  console.log(
    `build:dead → ${DEAD_OUT_DIR}/ (VITE_SUPABASE_URL=${DEAD_SUPABASE_URL}, anon key "${DEAD_ANON_KEY}")`,
  )
  const r = spawnSync(process.execPath, [vite, 'build', '--outDir', DEAD_OUT_DIR], {
    stdio: 'inherit',
    env: deadBuildEnv(),
  })
  process.exitCode = r.status ?? 1
}
