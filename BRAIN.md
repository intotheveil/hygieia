# 🧠 BRAIN — Hygieia (`hygieia`)

> The product's living memory. Read it in full before doing ANY work here (CLAUDE.md §0);
> write it before the session ends. Seeded 2026-10-05 by Zeus (NEW PRODUCT) from the operator's
> intent; rewritten 2026-10-06 to the P1–P6 state (P1/P2 review item 1). Genuine unknowns are
> marked **❓ needs human input**.

**Last updated:** 2026-10-06 (morning after) by the lead (Claude Code, Fable 5.1) — **CONFIGURED MODE LIVE**: O1 verified, content
approved, OP2.c variables set, deploy run 37436089418 green, `smoke:live` 16/16 incl. backend probes; previous: same day (night), P5/P6 PASS + CHECKPOINT.
**Status:** built — P1–P6 + four cosmetic themes on `main` (`b18f56d`, CI run 37441451272 green + deployed); P1/P2 and P3/P4 QA VALIDATED + REVIEW PASS;
P5/P6 QA VALIDATED (cold gate, re-run) + REVIEW PASS (flip, 2026-10-06). **Every §9 phase is claimed; the crew is stopped at CHECKPOINT P5/P6
(BUILD_LOG top) waiting for the operator chain O1 → OP2 → OP4.b → OP2.c/OP6.a.** **The full app is live on Pages in CONFIGURED mode** since run 37436089418 (2026-10-06): approved content from
schema `hygieia`, sign-in in the account menu, no draft ribbon; `smoke:live` 16/16 incl. backend probes (earlier: local-only from
`a9efff9`/37416889242 and `b82d024`/37420337752).
**Repo:** `intotheveil/hygieia` (public) · `D:\projects\hygieia` (lane worktrees `D:\projects\hygieia-wt\a..g`, branches `wt/a..g`) ·
**Deployed:** https://intotheveil.github.io/hygieia/ (GitHub Pages, from `main` via CI — the FULL APP since 2026-10-06, local-only mode until the operator steps in §3)

---

## 1. WHAT THIS IS (never-changes context — read first, every time)

**Hygieia (Υγίεια) is a bilingual Greek/English health, diet, recipe and workout tool.** The
operator's intent, verbatim: _"A greek/english bilingual tool about: Health Tips; Diets (giving
info of every type of diet — Atkins, paleo, low carb, keto, carnivore etc) and plan meals;
Recipes with tags per diet and also a function 'What's in my fridge' to propose you meals you can
make based on ingredients; price estimation of a meal; calories estimation of a meal; Work out
Types; recommend work out per type e.g. home – gym – calisthenics etc plus 3 different levels and
intensities."_ Named for the goddess of health and preventive wellbeing (source of "hygiene").

- **Product ⇄ repo:** Hygieia ⇄ `intotheveil/hygieia` (**public**, operator's choice, because
  GitHub Pages on this plan requires it).
- **Users:** Greek- and English-speaking people wanting practical food and training guidance.
- **Six modules** (`src/i18n/dictionary.ts` `MODULE_IDS`): tips · diets (+ meal plans) ·
  recipes (+ fridge) · cost · calories · workouts.
- **Working means:** both languages complete, informational (not medical advice), deployed.
- **What works today (built on `main`, DEPLOYED in local-only mode):** every module has a route — `/recipes` (filter by diet/meal/search,
  detail with steps, nutrition + cost panels), `/fridge` (ingredient picker → ranked recipes with substitutions and staples),
  `/diets` (16 diets, each with a seeded 7-day plan, reshuffle, shopping list), `/workouts` (7 types × 3 levels × 3 intensities →
  a three-block session), `/tips` (75 tips by topic). In **local-only** mode (no Supabase env) all of it runs on the bundled seed
  under a "Draft — awaiting review" ribbon with sign-in unavailable. In **configured** mode the same pages read `approved` rows from
  schema `hygieia`, and sign-in (magic link + Google), favourites, saved fridge lists, saved plans, `/account` and the `/admin`
  review workbench switch on. Configured mode is not reachable live yet (§3).

## 2. ARCHITECTURE (the canonical technical truth — investigate ONCE, record here)

- **Stack:** React 19 + Vite 8 + TypeScript 6 (strict) + Tailwind 4 (`@tailwindcss/vite`; tokens in `src/index.css`: cream paper /
  olive ink / sage accent / clay; `clay-700` is the only clay TEXT shade); react-router-dom 7 declarative `BrowserRouter`; Vitest 5
  (jsdom; `scripts/*.test.ts` run `// @vitest-environment node`) + Testing Library; Playwright (e2e, `@axe-core/playwright`);
  `@electric-sql/pglite` (DB gate); Lighthouse 12 + chrome-launcher; ESLint 10 flat + Prettier. Fonts self-hosted
  (`@fontsource-variable/inter`, `literata`, Greek subsets, imported in `src/index.css`). Configs lifted from Themis's P0.
- **Code map:** `src/{auth,user,content,recipes,fridge,diets,plans,nutrition,cost,workouts,tips,admin,account,components,routes,i18n,lib}`
  + `src/telemetry.ts` · `scripts/` (db toolchain, gates, `db-gate/{catalogue,shim}.mjs`, `lib/mgmt-api.mjs`) · `e2e/{local,dead-backend,support}` ·
  `supabase/migrations/` (10 files) · `docs/ops/{migrations,admin}.md` (operator runbooks) · `PLAN.md` (the task list, §2 = schema contract).
- **DB toolchain (ADR-0003; runbook `docs/ops/migrations.md`):** `npm run db:check` (static guard: filename `_hygieia_`, every object
  inside schema `hygieia`, nothing in `public`/`auth`/`storage`/`supabase_migrations`) → `db:gate` (PGlite, throwaway; `scripts/db-gate/shim.mjs`
  dresses it as the shared project — roles, `auth.users`, Alyssos-shaped `public`; applies the archive TWICE; `catalogue.mjs` = the check
  list, **227 checks**: structural sweep, orphan scan, per-table isolation + role matrix, seed-id formula, seed floors, `workout_templates = 63`)
  → `db:gate:prove-red` (25 sabotages of a copy, each must go RED on its pinned FAIL line; `RED ok` = exit code exactly 1) → `db:apply`
  (Management API, `SUPABASE_ACCESS_TOKEN` + `HYGIEIA_SUPABASE_PROJECT_REF` from the shell only; **dry-run default**, `-- --apply` commits
  one transaction per file + ledger row with sha256 into **`hygieia.schema_migrations`**; refuses CHECKSUM CHANGED / OUT OF ORDER /
  TRANSACTION CONTROL; redacts the token) → `db:live-check` (read-only: ledger == archive, anon sees 0 pending recipes and 0 profiles;
  classifies PGRST106 "schema not exposed" vs PGRST205 "table missing"; SKIPPED without env). Seeds: `seed:gen` writes the six seed
  migrations from `src/content/seed/*.ts` (ids `md5('hygieia:<table>:<slug>')::uuid`, `on conflict do nothing`); `seed:check` diffs
  byte-for-byte and is in CI. Live application is an OPERATOR step, never a crew task; never `supabase db push|link|db reset`.
- **Schema `hygieia` (PLAN §2; 14 tables):** `schema_migrations` (service-only) · `profiles` (`user_id` → `auth.users`, `is_admin`
  settable only by operator SQL, `docs/ops/admin.md`) · content: `ingredients`, `diets`, `recipes` (+ `recipe_ingredients`, `recipe_diets`),
  `exercises`, `workout_templates` (+ `workout_template_exercises`), `health_tips` — same-row `*_el`/`*_en` both `not null`, `status
pending|approved|rejected` stamped by `stamp_review()` BEFORE UPDATE · per-user: `fridge_lists`, `saved_plans`, `favourites`
  (`user_id default auth.uid()`, RLS on every verb). **Policies per role** (`<t>_select_anon` `status = 'approved'`; `<t>_select_auth`
  `… or hygieia.is_admin()`), **column-limited grants** (no client grant on `is_admin`, `user_id`, `id`, `slug`, `reviewed_*`; no client
  INSERT/DELETE on content), **every function revokes EXECUTE from public/anon explicitly** (per-schema defaults cannot). Children have
  no `status`: visible iff the parent is approved. Functions: `touch_updated_at()`, `is_admin()`, `stamp_review()`, all `search_path` pinned.
- **ContentSource (`src/content/`):** `index.ts` exports `contentSource` = `bundled` when `appEnv.mode === 'local'`, `supabase` when
  `configured`. `bundled.ts` loads each seed table lazily (`() => import('./seed/<table>.ts')`, memoised; Vite emits one chunk per table),
  stamps rows `status: 'pending'`, computes ids with the pure-TS `md5.ts` (same formula as the generator). `supabase.ts` reads through the
  client pinned `db: { schema: 'hygieia' }` (`src/lib/supabase.ts`, typed `Database` from `db-types.ts` — `type` aliases, never
  `interface`), adds `status = approved` to every read (defence in depth over RLS), parses rows with per-table `Spec<T>`; a hidden child
  arrives as `ingredient: null` / `exercise: null`. `listRecipes({ dietSlugs })` is a UNION, applied client-side. Every method returns a
  promise and never throws (`Result`-style failures). `components/DraftRibbon.tsx` renders on every content page in bundled mode.
- **Auth (`src/auth/`, P2):** `AuthProvider` wraps the router in `main.tsx`; `useAuth()` (throws outside), `useOptionalAuth()` (null
  outside — `AccountMenu` uses it). `AuthState = unavailable | loading | anonymous | signed-in` (`session.ts`, pure reducer).
  `/auth` = `SignInPage` (magic link `signInWithOtp`, Google `signInWithOAuth`, redirect `origin + BASE_URL + 'auth/callback'`);
  `/auth/callback` = `CallbackPage` (PKCE; supabase-js exchanges `?code=` itself; failure = URL `error`, no client, or 15 s timeout).
  `?next=` is parked in `sessionStorage` `hygieia.auth.next`, in-app paths only (`safeNextPath`). `profile.ts` `ensureProfile` creates the
  profile row client-side on first session (no trigger on `auth.users`); `useProfile()` → `isAdmin` from the DB row. Guards:
  `RequireAuth` (anonymous → `/auth?next=…`; unavailable → in-place copy), `RequireAdmin` (profile error = not admin, never fail open).
- **User data (`src/user/`, P2.4):** `useUserData()` → `UserDataSource` `kind: 'supabase' | 'disabled'` with `fridgeLists`, `favourites`,
  `savedPlans` `{ list, save, remove }` returning `Result<T>`. Payload types have NO `user_id`; it is never sent or filtered on — the
  column default + RLS own it (DECISIONS 2026-10-05). `disabled.ts` answers empty lists and `error: 'disabled'` writes.
- **Engines (pure, unrounded):** `fridge/match.ts` (coverage desc → fewer missing → fewer lines → title → slug; substitutes and pantry
  staples), `nutrition/compute.ts` (Atwater; `unitMismatch` warnings), `cost/compute.ts` (EUR range, oldest `price_as_of`),
  `plans/generate.ts` (seeded `mulberry32`, 21 slots, repeat rule; reshuffle derives the next seed), `workouts/session.ts` (whole-or-nothing
  blocks). Invariant both food engines rest on: `line.unit ∈ {g, ml, ingredient.unit}` (pinned by `seed/recipes.test.ts`).
  `recipes/panelFormat.ts` is the ONE place numbers become strings (`Intl`, `el-GR`/`en-GB`, UTC dates).
- **Pages + frame:** `routes/routes.tsx` — `/` `App` (eager), `/recipes`, `/recipes/:slug`, `/fridge`, `/diets`, `/diets/:slug`,
  `/workouts`, `/tips`, `/auth`, `/auth/callback`, `/account` (RequireAuth), `/admin` (RequireAdmin), `*` `NotFound` (eager); every other
  page is `React.lazy` under the ONE `<Suspense>` in `components/Layout.tsx` (layout route: `SiteHeader` nav + `<Outlet />` + disclaimer
  footer; pages own their `<main>`, Layout does not render one). **Rule: a new route goes in `routes.tsx` AND `e2e/support/routes.ts`**
  (the shared list the Lighthouse and a11y gates audit). Selection state lives in the URL (`?diet=`, `?q=`, `?type=&level=&intensity=`,
  `?topic=`). Admin (`src/admin/`): `AdminContentSource` has `listPending / listAll / update / setStatus` only; writes are column-exact
  (`EDITABLE_COLUMNS` literally equals the migration's `grant update` lists); approve = `{ status }` and the trigger stamps.
- **i18n (ADR-0002):** base `Dictionary` in `src/i18n/dictionary.ts` (`en`/`el` literals, `LANGS = ['el','en']`, `LangProvider`/`useLang`,
  stored key `hygieia.lang`, Greek browser → `el`) + feature modules `src/i18n/features/{admin,diets,fridge,plans,recipes,tips,workouts}.ts`
  composed in `features/index.ts` (interface `extends` one parent per line under `// prettier-ignore`). **One owner per key**
  (`dictionary.test.ts` enforces it); shared copy (`loadFailed`, `retry`) is owned by plans and reused. Counted strings are
  `PluralForms { one, other }` + `fill('{n}')` (`fill.ts`); unit labels `units.<Unit>`. A key in one language only is a TYPE error.
- **Async:** `src/lib/useAsync.ts` — `useAsync(run, deps?)` stores only the SETTLED outcome tagged by `run` identity, derives
  `loading`, exposes `{ status, data, error, reload }`; callers memoise `run` (`useCallback`). `useAsyncResult` unwraps `Result`
  (`ok: false` → `status: 'error'`, code as `error`). `components/AsyncState.tsx` — the ONE `Loading` (skeleton with RESERVED height,
  `role="status" aria-busy`), `ErrorState` (`role="alert"`, Retry wired to `reload`, `text-clay-700`), `EmptyState`; pages pass their own copy.
- **e2e (`npm run e2e`, Playwright):** `e2e/support/pages-server.mjs` serves `dist/` with GitHub Pages semantics (`404.html` as the
  deep-link document, status 404; `/hygieia` → 301). Two projects: `local` (local-only build, port 4173, locale `el-GR`; specs: smoke 9,
  recipes 5, fridge 3, recipe-panels 2, diets 3, workouts 2, tips 3, admin-local-only 3, empty-states 2, offline 1, **a11y-matrix 24 cells**
  = 12 routes × 2 languages, axe `wcag2a/2aa/21a/21aa`, gate 0 serious/critical) and `dead-backend` (`npm run build:dead` → `dist-dead/`
  configured against `http://127.0.0.1:9/`, port 4174, 9 error-state specs, `expect 20 s`). `fixtures.ts` console watchdog fails any test
  that logged a console/page error. `E2E_PREBUILT=1` skips the builds. Total today: **66**.
- **Gates (all in CI):** `G0` = lint + typecheck + test + build + `check:pwa`; `check:bundle` (dist secret scan; prefix + ≥ 1 key char);
  `check:lighthouse` (mobile, 12 routes, **cold first visit by construction** — the SW is blocked for every audit and each LHR is
  checked for it — performance ≥ 85 / accessibility ≥ 90 / best-practices ≥ 90, the SAME locally and in CI, no tolerance; 90 performance
  is the target, not the gate — ADR-0006; own gzip server; one Chrome per route); `smoke:live` (HTTP, read-only probes of the deployed site; backend probes when the anon env is in the shell).
  `db:check`, `db:gate`, `db:gate:prove-red`, `seed:check` as above.
- **Telemetry (P6.1):** `src/telemetry.ts` `startTelemetry()` reads `VITE_FLEET_URL`, `VITE_FLEET_KEY`, `VITE_FLEET_PRODUCT_ID`; any blank →
  no-op disposer, zero side effects. On: Enodia's `src/lib/telemetry/*` byte-identical (scrub → `fingerprint` over scrubbed message + top
  frame → storm batcher → bulk POST `/rest/v1/fleet_errors`). Golden fingerprints pinned (`fingerprint.golden.test.ts`; separator `\u0000`,
  a fleet-wide STORED KEY — never "update" that test). `getContext()` sends `page` (and `lang`, which the fleet scrubber drops).
- **CI/deploy (`.github/workflows/deploy.yml`, P6.4):** `verify` = lint → typecheck → test → `db:check` → `db:gate` → `prove-red` →
  `seed:check` → **build local-only** (all five `VITE_*` blanked) → `check:bundle` → `check:pwa` → `build:dead` → e2e (both projects, full
  Chromium `--with-deps`) → `check:lighthouse` → **build configured** from repository VARIABLES `${{ vars.VITE_* }}` → `check:bundle` →
  `check:pwa` → upload; `deploy` = `actions/deploy-pages` on `main`. Variables unset → the deploy is local-only mode (bundled drafts,
  ribbon). Variables, not secrets: every value is public by design (README "Deploy").
- **PWA (ADR-0004):** `vite-plugin-pwa` (manifest + Workbox SW, `autoUpdate`, `injectRegister: 'script-defer'`, `clientsClaim`
  explicit), `spaFallback` copies `index.html` → `404.html`; plugin order react → tailwind → spaFallback → VitePWA; `check:pwa` gates the artifact.
- **Env NAMES (`.env.example`; `src/lib/env.ts` is the only reader of the Supabase pair, `src/telemetry.ts` of the fleet trio):**
  browser `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (→ `appEnv.mode` `configured | local`), `VITE_FLEET_URL`, `VITE_FLEET_KEY`,
  `VITE_FLEET_PRODUCT_ID`; operator shell only `SUPABASE_ACCESS_TOKEN`, `HYGIEIA_SUPABASE_PROJECT_REF`. ESLint blocks server-only names
  and non-allow-listed `VITE_*` reads in `src/**`. Values live in the Zeus Vault; no `.env` is read by any script.
- **Records:** `BUILD_LOG.md` and `DECISIONS.md` are `merge=union` and in `.prettierignore` (with `BRAIN.md`); lanes append, the lead
  reconciles `BRAIN.md`. Crew kit: 7 hooks + 7 agents from `zeus/.zeus/kit/`; `.claude/.no-greek-scan` present (Greek copy is content).
  Brand: `public/favicon.svg`, `public/brand/*` (ComfyUI renders; hero as `<picture>` WebP 800w/1216w + JPEG).

- **Themes (2026-10-06, operator request):** four cosmetic skins — `default` (kitchen), `dark`, `athletic`, `gamer` — in
  `src/theme/` (`themes.ts`, `ThemeProvider.tsx`) + `html[data-theme]` blocks in `src/index.css` that RE-MAP the same colour
  variables; switcher in the header (`ThemeSwitch`, native select); localStorage `hygieia:theme`, pre-paint script in `index.html`;
  per-theme hero set in `public/brand/hero-<theme>*` picked by `src/App.tsx`; a11y matrix has a theme axis (home + recipes × 4).
  Adding a theme = one CSS block + one `THEME_COLOR` entry + one dictionary row + one hero set (`npm run brand`).

## 3. CURRENT STATE (what's true RIGHT NOW — the thing a resuming session reads)

- **Built on `main` `b18f56d` (2026-10-06, themes merged; CI run 37441451272 green + deployed), every local gate green:** lint 0 errors
  (23 pre-existing `react-refresh` warnings) · typecheck clean · **tests 3246** (66 files) · **e2e 74** (65 local incl. 24 a11y language
  cells + 8 theme cells; 9 dead-backend) · `db:check` 10 files ·
  **`db:gate` 227** · **prove-red 25/25** · `seed:check` OK · `check:bundle` OK · `check:pwa` OK · **`check:lighthouse` cold
  85/90/90 (ADR-0006) deterministic: three consecutive runs 36/36 cells within ±1**, perf 87–94 locally, 86–94 on the GitHub runner
  (1-point margin on `recipes` / `recipe` / `diet`; 90 stays the recorded target). Entry chunk 235 kB / 74 kB gzip.
- **DEPLOYED — the FULL APP is live at https://intotheveil.github.io/hygieia/ in CONFIGURED mode** (run 37436089418, both jobs green,
  entry `index-CamdacCW.js`; `smoke:live` 16/16 with the backend probes: approved rows 1+, pending `[]`, profiles `[]`). Repository
  variables `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` are set (OP2.c); the fleet trio is not (OP6.a) so telemetry is still silent.
  Content: everything approved except 17 unsourced tips (pending, operator's call in `/admin`). Note: the local-only build of the same
  commit hashes `index-w_FjhxYD.js`, Windows `index-BfBCudBw.js` — same build is proven by the CI log chain, not by hash equality.
- **Live DB (shared project, schema `hygieia`) — COMPLETE 2026-10-06:** ledger `hygieia.schema_migrations` = **10/10** rows
  (000100–001000), every checksum equal to the sha256 of the LF-normalised archive file; rows 322 ingredients · 16 diets · 152 recipes ·
  1173 recipe_ingredients · 740 recipe_diets · 136 exercises · 63 workout_templates · 579 slots · 75 health_tips; **approved: everything except 17 unsourced tips (OP4.b, night)**
  (all `pending`, by design). `supabase_migrations.schema_migrations` still 8 rows (Alyssos untouched). Schema files went through
  `db:apply -- --apply`; the six seed files through the MCP SQL tool in ≤23 KB pieces inside the same batch shape, per-column md5/sum
  verified against the files (BUILD_LOG `OPERATOR-P1 / OP4`). **Data API exposure of schema `hygieia` is DONE and verified (O1 closed 2026-10-06):** anon REST with `Accept-Profile: hygieia` returns
  approved rows, pending `[]`, profiles `[]`, blind write 401. It was a Dashboard toggle (Settings → Data API → Exposed schemas) that
  needed its Save click; the `authenticator` role still carries no `pgrst.db_schemas` GUC — platform state, never SQL.
- **Gates (ADR-0005 cadence):** P1/P2 QA **VALIDATED** · P1/P2 REVIEW **PASS** · P3/P4 QA **VALIDATED** · P3/P4 REVIEW **PASS** ·
  P5/P6 QA **VALIDATED (re-run 2026-10-06 on the cold gate)** · **P5/P6 REVIEW: running at the time of writing — read the top of
  BUILD_LOG for the verdict.** Operator-side QA items (P2.QA.3b/4b/5/6, P4.QA.5, P6.QA.2 backend probes, P6.QA.3, P6.QA.4) are NOT RUN,
  never claimed.
- **Next, in order:** (1) ~~O1~~ DONE (verified by anon REST + `smoke:live` backend probes; `db:live-check` still wants `SUPABASE_ACCESS_TOKEN`, not available in this shell). (2) **OP2.a** Google OAuth client + redirect URLs (`https://intotheveil.github.io/hygieia/auth/callback`,
  localhost) · first sign-in · **OP2.b** admin flag per `docs/ops/admin.md` · **OP4.b** approve content in `/admin`. (3) **OP2.c** repo
  variables `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` and **OP6.a** the fleet trio → next `main` deploy is configured →
  `smoke:live` reports rows. (4) P6.5 DONE (`dea5730`); P5/P6 review PASS (flip); **CHECKPOINT P5/P6 written — crew stopped; operator chain next**, then the operator-side QA items (need OP6.a). Backlog: cold perf 87 → 90 on content routes (render the
  above-the-fold frame before the seed `import()`), RecipeCard chips as links, cross-OS byte-identical dist, seed-floor constants,
  `db-types.ts` profiles.Insert tightening, bundle-secret test under `NODE_ENV=production`.

## 4. OUTSTANDING (bugs · feedback · requests · known issues — the triage queue)

| id         | sev | type     | summary                                                                                                                                                                                                 | status          | added      |
| ---------- | --- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- | ---------- |
| O1         | ✅  | operator | ~~Expose schema `hygieia`~~ **DONE + VERIFIED 2026-10-06** (the first attempt was selected but not saved — Save button lit in the screenshot). Anon probes: approved rows, pending `[]`, profiles `[]`, blind write 401 | closed          | 2026-10-05 |
| O2         | 🟡  | note     | Supabase advisory seen while inspecting the shared project: Alyssos's PostGIS reference table `public.spatial_ref_sys` has RLS disabled. Alyssos's call — flagged, not touched; the gate asserts we never change it | open (operator) | 2026-10-05 |
| PERF       | 🟡  | perf     | ~~CI Lighthouse below 85 on content routes~~ **CLOSED 2026-10-06** by code splitting + lazy seeds/supabase-js + fallback fonts + ADR-0006 cold gate (QA re-run: 36/36 cells within ±1, runner 86–94). Remaining: cold perf 87 vs target 90 on `recipes`/`recipe`/`fridge`/`diet`; CI margin 1 point | backlog         | 2026-10-06 |
| REVIEW-P12 | ✅  | gate     | ~~P1/P2 REVIEW REVISE on records~~ **PASS 2026-10-06** (BUILD_LOG `P1/P2 + P3/P4 re-review — PASS`)                                                                                                    | closed          | 2026-10-06 |
| REVIEW-P34 | ✅  | gate     | ~~P3/P4 REVIEW REVISE~~ **PASS 2026-10-06** on `fecacfa`+ (same entry)                                                                                                                                  | closed          | 2026-10-06 |
| OP2        | 🟠  | operator | **OP2.c DONE** (`VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` set; configured deploy run 37436089418) · **redirect URL `https://intotheveil.github.io/hygieia/auth/callback` ADDED by the operator** · still open: **OP2.b admin flag** after the operator's first magic-link sign-in (`docs/ops/admin.md`); Google provider deferred by the operator ("later, not needed now") — when done, set repo variable `VITE_AUTH_GOOGLE=1`, the button is hidden until then | open (OP2.b)    | 2026-10-06 |
| OP4        | ✅  | operator | OP4.a seeds live ✅ · **OP4.b content APPROVED 2026-10-06 (night) by SQL on the operator's instruction** — all tables approved except 17 `health_tips` with `needs_source = true`, left pending for the operator to source/reject in `/admin` (BUILD_LOG `OPERATOR-P4 / OP4.b`) | closed (17 tips pending) | 2026-10-06 |
| OP6        | 🟡  | operator | Register Hygieia on the Zeus dashboard, then repo variables `VITE_FLEET_URL`, `VITE_FLEET_KEY`, `VITE_FLEET_PRODUCT_ID` (OP6.a); telemetry client is wired (P6.1) and off until then                   | open (operator) | 2026-10-06 |

Closed since the P0 brain (detail in §6): Q1, Q2 (operator interview 2026-10-05) · F3 brand imagery · F1 e2e runner (P3.6) ·
F2 fleet telemetry client (P6.1; the live half is OP6) · the `offline.spec.ts` red on `main` (P1/P2 QA out-of-gate finding; fixed by an
explicit `clientsClaim`, green since).

## 5. GOTCHAS (hard-won "don't do X, it breaks Y" — the knowledge that dies in old chats)

- **`spaFallback` and `vite-plugin-pwa` both write into `dist/` at `writeBundle`.** Keep the plugin order
  react → tailwind → spaFallback → VitePWA and check `dist/404.html` still equals `index.html` after a
  build (the copy must carry the manifest link and SW registration).
- **A string added to `en` and not `el` (or vice versa) is a TYPE error** — on purpose (ADR-0002).
  Do not "fix" it by widening the type; add the translation.
- **Greek loanwords stay Latin:** keto, paleo, Atkins, calisthenics are written as-is in `el`.
  The dictionary test checks Greek SCRIPT is present in `el.heroTitle`, not in every string.
- **`@testing-library/react` `renderHook` is used for the provider tests** — a bare `useLang()`
  outside the provider must THROW; that test pins the error message (`within <LangProvider>`).
- **GitHub Pages serves `404.html` with status 404** for deep links; browsers render it normally.
  Do not replace the byte-copy fallback with a redirect — a future Supabase PKCE `?code=` would be lost.
- **The kit guard blocks Greek script by default.** `.claude/.no-greek-scan` disables only that
  rule. If a commit is refused for Greek, check the marker is present and tracked.
- **`npm test` takes ~30 s here** (jsdom environment start dominates). Not a hang.
- **Zeus-side (recorded in zeus BRAIN too):** the Vite react-ts template no longer matches the
  house stack (oxlint, no `strict`) — this repo's configs come from Themis instead.
- **`alter default privileges in schema hygieia revoke execute … from public` does NOT stop PUBLIC/anon
  EXECUTE on later functions** (per-schema defaults are ADDED to the hardwired global default; proven in
  PGlite 2026-10-05). Every function a migration creates must end with `revoke execute on function … from
public, anon` (trigger fns: also `authenticated`). `npm run db:gate` sweeps for it; a missing revoke is
  RED on `anon has EXECUTE on no hygieia function`. A global revoke is forbidden (ADR-0003).
- **A policy evaluated as `anon` must never call a `hygieia` function** (anon has no EXECUTE on any).
  Write policies per role: `<t>_select_anon` (`status = 'approved'`) and `<t>_select_auth`
  (`… or hygieia.is_admin()`), never one shared `to anon, authenticated` policy.
- **PGlite is ONE connection: never run two `actAs` sessions concurrently** (`Promise.all`) — the
  savepoints interleave and the gate throws `savepoint "sp_N" does not exist`. Sequential `await` only.
- **`pg_get_constraintdef` quotes keyword columns:** `PRIMARY KEY (recipe_id, "position")`. Assert the
  quoted form.
- **Gate fixture rows use `fx-*` slugs and are inserted AFTER the archive**; a seed-count check (P1.12)
  must count before `seedFixture` or exclude `slug like 'fx-%'`, or the fixture inflates the count.
- **PLAN §2 has 14 tables (the ledger counts), not 13** — the gate's `RLS is enabled on every hygieia
table (14)` is right; P1.QA.2's `(13)` is the typo.
- **A filtered write probe cannot see an open write policy (gate gap found by prove-red, 2026-10-05).**
  `update … where user_id = A` reads a column, so Postgres ANDs the SELECT policy into the UPDATE/DELETE;
  with a correct SELECT policy the probe affects 0 rows even when the UPDATE/DELETE policy is `using (true)`
  — `saved_plans` UPDATE and `favourites` DELETE `using (true)` left the gate GREEN. A blind statement
  (`update t set …` / `delete from t`, no WHERE) is gated by the write policy ALONE and is what an attacker
  sends. Every write-policy check in `scripts/db-gate/catalogue.mjs` now runs a blind probe too; any NEW
  check of a write policy must do the same. `npm run db:gate:prove-red` keeps it red (`saved-plans-update-true`,
  `favourites-delete-true`).
- **Check names in `catalogue.mjs` are pinned by `scripts/db-isolation.test.ts`** (`user` + `profiles`
  kinds): add a check → add its case there too, or strengthen an existing check in place (P1.14 did).
- **A fixture must not fight a unique constraint that real data saturates (P1.12 follow-up, 2026-10-05).** `workout_templates` is `unique (workout_type, level, intensity)` and the P4.8 seed fills ALL 63 cells, so the gate's `fx-home-beginner-low` / `fx-gym-intermediate-moderate` fixture INSERTs collided (`fixture seeded` red on `workout_templates_cell_key`). There is no free cell to move to. `scripts/db-gate/catalogue.mjs` now ADOPTS the two lowest-slug seeded templates (`ADOPTED_TEMPLATE_SLUGS`, read from `src/content/seed/workouts.ts`): the first is flipped to `approved` with the fixture stamp, the second stays `pending`; both keep seeded slugs so the `= 63` seed count still binds. The flip runs with `set local session_replication_role = replica` — a plain superuser UPDATE would let `touch_updated_at` set `now()` and `stamp_review` set `reviewed_by = auth.uid()` (null), breaking the stamp checks. Any future saturated-unique content table needs the same adopt-not-insert pattern; the child `insert` probe must also use a position above every seeded slot (99; seeded max is 12).
- **`scripts/db-gate-prove-red.mjs` pins STRUCTURAL counts in its expected FAIL lines** (reviewer, 2026-10-06): `RLS is enabled on every hygieia table (14)`, `anon has EXECUTE on no hygieia function (3)`, `every status-bearing table has a BEFORE UPDATE stamp_review trigger (6)`, `every hygieia table has a catalogue entry (15)` (the orphan-table sabotage), `approved parents: 2`. Adding a table, a function or a status-bearing table turns several sabotages into `WRONG LINE` (exit 1, but the pinned line is gone) until those regexes are updated — the signature is exact on purpose (a FAIL for the wrong reason is not proof). Update the counts in the same commit as the schema change; only seed-dependent totals are allowed to float (`(\d+)`).
- **The nutrition and cost engines assume `line.unit ∈ {g, ml, ingredient.unit}` (reviewer, 2026-10-06).** `gramsFor` multiplies any non-g/ml line by the ingredient's `grams_per_unit` whatever the line's unit says, and `computeNutrition` only records a `unitMismatch` string in `warnings` — which no panel rendered at P3/P4 review time. The seed is clean today (152 recipes, 1 173 lines, 0 mismatches), but an `/admin` edit of an ingredient's `unit` or `grams_per_unit` ripples into every recipe using it. Keep the seed assertion (P3/P4 review fix 4) and never add a recipe line in a unit the ingredient does not declare unless it is g/ml.
- **Feature-dictionary keys with the SAME type collide silently (last spread in `src/i18n/features/index.ts` wins); only DIFFERENT types are a TS error** (reviewer, 2026-10-06; found live: `sourcePending` in both diets and tips). One owner per key; the one-owner test in `dictionary.test.ts` (P3/P4 review fix 3) is what makes the rule bind — a key you want to share is reused from its owner, never re-declared.
- **`useAsync(run)` keys its outcome on `run`'s identity: pass a `useCallback`-memoised function (or `deps`), or every render creates a new loader and the page sits on `loading` forever** (reviewer, 2026-10-06). Module-level loaders are fine; inline arrows are not. `useAsyncResult` unwraps `{ ok, data | error }`, so `ok: false` is `status: 'error'` with the code as `error`.
- **This checkout is CRLF (`core.autocrlf=true`); git stores LF.** `prettier --check` on a working-copy file can warn on line endings
  alone (`endOfLine: lf`) — check the LF content (`git show HEAD:<file> | npx prettier --check --stdin-filepath <file>`), never "fix" it by
  rewriting the file. `kit.mjs` parses CRLF since the 2026-10 fix; older scratch scripts may not.
- **After a merge that adds a dependency, run `npm ci` in EVERY worktree before `npm run e2e` or `npm run build`.** Symptoms seen:
  `TS7006` ×4 in `a11y-matrix.spec.ts` (missing `@axe-core/playwright`), `@fontsource-variable/inter` unresolved → `vite build` red →
  `check-bundle-secrets.test.ts` red too (it runs the real build). Environment staleness, not code.
- **Git Bash mangles `--base /hygieia` into `C:/Program Files/Git/hygieia`** for `pages-server.mjs` (every URL 404s). Prefix
  `MSYS_NO_PATHCONV=1`. Also: `pages-server`'s `root` must be a native absolute path (a forward-slash root 404s every asset on Windows),
  and a stray server on 4173/4174 survives a failed run on Windows — kill it or Playwright refuses to start ("already used").
- **vitest 5.0.3's v8 `text` coverage reporter silently drops a fully-covered pure-TS file when two `--coverage.include` flags are
  given** (`filter.ts` vanished). Read figures from `--coverage.reporter=json-summary`. `@vitest/coverage-v8` is NOT a devDependency:
  `npm i -D @vitest/coverage-v8 --no-save` first (leaves `package-lock.json` untouched).
- **The seed files use extensionless relative imports, so plain node type-stripping cannot run a scratch script that imports them.**
  Bundle it first: `npx esbuild <script>.ts --bundle --platform=node --format=esm --outfile=<out>.mjs`. `e2e/support/routes.ts` is the
  exception by design (erasable syntax, explicit `.ts` extensions) because `check-lighthouse.mjs` imports it.
- **supabase-js 2.117 RETRIES a failed PostgREST request 4× with 1/2/4 s back-off before the `Result` settles (~7.2 s).** A dead backend
  shows the ErrorState ~7 s after navigation; the `dead-backend` project carries `expect: 20 s` / `timeout: 90 s` on purpose — never cut
  them, and arm a `requestfailed` proof only AFTER the alert has settled or the retries are mistaken for the click.
- **Chromium refuses port 9 as an UNSAFE PORT (`net::ERR_UNSAFE_PORT`, no socket).** `build:dead` points at `http://127.0.0.1:9/` on
  purpose — dead all the same and faster than a refused connection; the watchdog filter keys on `net::ERR_*`, so either text passes.
- **`baseURL` ends in `/hygieia/`, but `page.goto('/x')` resolves against the ORIGIN** → `http://127.0.0.1:4173/x`, outside the site.
  Specs spell the base: `page.goto('/hygieia/recipes')`. Client-side `<Link to="/">` under `basename="/hygieia"` lands on `/hygieia` (no
  slash); assert the home route with `/hygieia/?$`. Playwright's default locale is `en-US` and `LangProvider` reads `navigator.language`,
  so the project sets `locale: 'el-GR'` — a spec that expects the Greek shell elsewhere must set it too.
- **The 63-combination `/workouts` render test has a 30 s budget on purpose** (1 s alone, ~5 s under load — it proves the UI path for
  every cell). Do not shorten it when the machine is busy; a cheaper non-render twin over `blocksOf(listWorkoutTemplates())` is backlog.
- **A `background-image` gradient on an ancestor makes axe `color-contrast` INCOMPLETE on every text node under it — the gate passes
  because it cannot measure, not because contrast is fine** (2 491 nodes site-wide before P5.2). The body wash is a `body::before`
  pseudo-element for that reason. Rule: no `background-image` on an element containing text unless the text sits on its own opaque box.
  `clay-500` (3.0:1) is never TEXT; `clay-700` (5.0:1) is the text shade.
- **`Intl` puts an NBSP before "€" in `el-GR`.** jest-dom's `toHaveTextContent` collapses the element's NBSP to a space but does NOT
  normalise the expected string — compare after `s.replace(/\s+/g, ' ')`, or two "identical" strings fail. The same applies to any Greek
  currency assertion in e2e.
- **chrome-launcher cannot drive Playwright's `--only-shell` headless shell on ubuntu-latest** (`waiting for dynamic debugging port`,
  exit 2). CI installs the FULL Chromium (`npx playwright install --with-deps chromium`, cache key `chromium-full`); under `CI` the launch
  adds `--no-sandbox --disable-dev-shm-usage`, never locally. `check-lighthouse.mjs` prints the resolved binary + flags and the tail of
  `chrome-err.log` on a launch failure — read the job log before guessing.
- **Never run two Lighthouse jobs on one machine at once.** A concurrent run produced 93/79 and `NO_FCP`/`metrics` errors, and the two
  audit servers collide on port 4175 (`EADDRINUSE`, exit 2, no harm). Lighthouse also feeds OBSERVED per-origin latency into its simulated
  FCP, so any third-party render-blocking resource makes the score depend on DNS/TLS luck — that is why fonts are self-hosted.
- **`injectRegister: 'script-defer'` silently turns OFF vite-plugin-pwa's implicit `clientsClaim`** (only `auto`/unset + `autoUpdate`
  sets it); `offline.spec.ts` step 1 ("a SW controls the page on the FIRST load") went red on `main` for exactly this. `workbox.clientsClaim:
  true` is now explicit in `vite.config.ts` — keep it; a PWA option change must be followed by `npm run e2e` including `offline.spec.ts`.
- **The crew's format hook used to reflow `BUILD_LOG.md` / `DECISIONS.md` whole-file** (and once collapsed a heredoc). Both are in
  `.prettierignore` with `BRAIN.md` since `fecacfa`; append-only records are never reformatted. If a hook rewrites one, revert to HEAD
  formatting and append again.
- **Database `Row`/`Insert` types must be `type` aliases, never `interface`s:** supabase-js constrains them to `Record<string, unknown>`,
  which interfaces do not satisfy, and `Insert` silently collapses to `never` so every `.insert()` fails to compile. A direct structural
  assignment of the real client to a small interface hits TS2589 — use the thin typed adapters (`profileClientFor`, `userDataClientFor`,
  `contentClientFor`) instead of a cast.
- **`src/**` Vitest tests run in jsdom with no node types** — no `node:crypto` in them; pin vectors instead (`md5.test.ts` has 24).
  `scripts/*.test.ts` run under `// @vitest-environment node`.
- **The crew `secret-scan.sh` PostToolUse hook blocks any COMPLETE `-----BEGIN … PRIVATE KEY-----` literal in a written file, fixtures
  included** — assemble such headers at runtime (`pemHeader(kind)`). Likewise supabase-js ships the bare literal `` startsWith(`sb_secret_`) ``
  in the real bundle: only the "prefix + ≥ 1 key character" rule in `check:bundle` keeps the build green; a naive grep is a permanent false positive.
- **Pages are `React.lazy` since the P5.3 follow-up:** a test that renders the route table must `await findByRole(...)` (not `getByRole`),
  and a page's "ready" signal is its rendered list/section, not the h1 (the h1 paints before the lazily-imported seed resolves).
  `routes.tsx` keeps `/`, `NotFound` and the two guards eager on purpose — do not lazy-load them (offline `*` route, local-only copy).
- **The PGlite gate script must never call `process.exit()` on Windows** (Themis donor rule): PGlite dies with 0xC0000409 before flushing.
  Return an exit code from `main()` and set `process.exitCode`. prove-red treats any non-1 code as `CRASH`, never as proof.
- **`lang` is supplied by `getContext()` but is NOT an allow-listed fleet context key** — the scrubber drops it on the wire; only `page`
  reaches the dashboard. Extending `ALLOWED_CONTEXT_KEYS` is a fleet contract change made in Zeus first, not here.
- **`npm test` overwrites `dist/` with a DEVELOPMENT React build** (2026-10-06): `scripts/check-bundle-secrets.test.ts`
  spawns `npm run build` with vitest's `NODE_ENV=test` inherited, so the entry chunk comes out 431 kB instead of
  235 kB. Always `npm run build` again after `npm test` before `check:lighthouse`; the real fix is `NODE_ENV:
  'production'` in that spawn (or a temp outDir) — open.
- **The diet-page CLS 0.13 was never a font swap**: `<main class="mx-auto max-w-*">` is a flex item with auto
  margins, so during the skeleton it shrank to a 128 px centred column and snapped to full width when seeds
  arrived. Fixed in `Layout.tsx` with `[&>main]:w-full`; the lesson: measure a shift's SOURCE element with a
  `PerformanceObserver` before blaming fonts.
- **A cold first visit of a content route scores ~87–88; the 90 is met when the service worker serves the
  seed chunks** (20 of 21 audits). Lighthouse charges the network round-trip of the seed chunk to LCP;
  pre-warming the chunks was measured and rejected (it moves the cost into FCP).
  **→ Superseded conclusion (ADR-0006, 2026-10-06):** whether the SW "wins" is a race INSIDE the audit (it installs ~300 ms in;
  chunks requested after that come from its precache at `transferSize 0`), so a gate that lets the SW register is red on an
  unchanged artifact ~40 % of the time (P5/P6 QA: 3 of 7). The gate now BLOCKS the SW (`blockedUrlPatterns`), measures the cold
  visit, proves it per LHR (`verifyColdVisit`) and gates at 85. Never re-enable the SW in the audit to "get the 90 back" — that is
  the race, not a score. Lighthouse 12 has no `service-worker` audit and no `fromServiceWorker` on `network-requests` items;
  `transferSize 0` with status 200 on an `/assets/*.js` request is the SW signature; a blocked request shows `statusCode -1`.
- **Record files and the `format.sh` hook (2026-10-06):** this repo's `.prettierignore` lists `BRAIN.md`/`BUILD_LOG.md`/`DECISIONS.md`,
  but a session whose project dir is ANOTHER repo (Zeus dispatching into a worktree here) runs prettier from that cwd, so the ignore
  file is not consulted and an `Edit` of a record file reformats it (list markers, table padding, indents). Also: several `Edit`s of
  ONE file in a single turn race the formatter and can silently lose an edit. Rule: edit record files with a script (`node -e`) or one
  `Edit` per turn, and `git diff -U0 | grep ^@@` afterwards to confirm only your hunks exist.
- **Git Bash mangles `/hygieia/...` CLI arguments into Windows paths** for scratch scripts and
  `pages-server --base`; prefix the command with `MSYS_NO_PATHCONV=1`.

- **`page.route('**/sw.js', r => r.abort())` does NOT block a service worker in Playwright/Chromium (2026-10-06, review fix 2).** The SW script is fetched outside page interception, so that sabotage stays GREEN and proves nothing. The only valid "no SW" sabotage is `test.use({ serviceWorkers: 'block' })` — then the offline spec fails at step 1 (no controller), as it should. Treat any earlier "blocked sw.js → test went red" claim with suspicion unless it says how.

## 6. CHANGELOG (append-only — what happened, newest first)

### 2026-10-06 (afternoon) — Google button gated behind `VITE_AUTH_GOOGLE` (lane `wt/d`; BUILD_LOG `OP2.a FOLLOW-UP`)

- Did: the live "Continue with Google" sent the operator to Supabase's `Unsupported provider: provider is not enabled` JSON. The button now
  renders only when `VITE_AUTH_GOOGLE` is `1`/`true` (pure helper + module const in `src/lib/env.ts`, seam on `SignInPage`), CI passes the
  variable to the configured build, README/`.env.example`/CLAUDE §8 documented, lint allow-list admits the name. +17 tests (3246).
- Decided: providers that need operator setup are feature-flagged, never shown on hope (DECISIONS 2026-10-06). Operator deferred Google.

### 2026-10-06 (day) — four cosmetic themes + per-theme hero images (lane `wt/b`; BUILD_LOG `P4.x THEMES`)

- Did: Dark / Athletic / Gamer skins re-mapping the colour variables, header switcher, persistence + pre-paint, per-theme hero sets
  rendered on the operator's ComfyUI, a11y theme axis (zero axe violations on all four), unit + e2e green. Builder lane was cut by the usage
  limit mid-verification; the lead finished (CSS-read fix in its test, CRLF regex, fridge locator scope, hero wiring, brand pipeline).
- Decided: variables re-mapped, not parallel palettes (DECISIONS 2026-10-06 Themes); precache growth accepted for offline parity.

### 2026-10-06 (late) — seeds LIVE (10/10), P5/P6 QA VALIDATED on the cold gate, full app DEPLOYED local-only (lead, Fable 5.1)

- Did: merged `wt/g` (ADR-0006) → `a9efff9`; CI run 37416889242 green on both jobs (Lighthouse cold on all 12 routes) → Pages now
  serves the FULL app in local-only mode (`smoke:live` 13/13). QA re-ran the P5/P6 failed criterion in a fresh clone: 3× identical
  cold scores, RED-verified the determinism guard (empty block list → `not a cold visit`, exit 2), 56 gate tests, 3206 unit tests,
  runner scores 86–94 → **VALIDATED**. Seed agent applied 000500–001000 to the shared project via the MCP SQL tool in 54 pieces
  (statement-split by row where a file exceeded the payload cap, identical headers and `on conflict … do nothing` tails); every
  table verified by per-column md5/sum against the files; ledger 10/10 with checksums equal to the archive (re-verified by the lead
  with an independent sha256 pass); `supabase_migrations` still 8. Launched the P5/P6 reviewer.
- Decided: the two Supabase repository variables stay UNSET until O1 + OP4.b, so the deploy keeps serving drafts rather than an
  empty configured catalogue. Did NOT set `pgrst.db_schemas` on `authenticator`: no existing value to extend, and an in-DB value
  would override whatever Alyssos exposes from the Dashboard.
- Resolved: PERF (closed → backlog 87 vs 90), REVIEW-P12 and REVIEW-P34 (PASS), OP4.a. Reopened nothing.
- Then (same night, `dea5730` → `b0307e1` → `b82d024`): P5/P6 REVIEW came back REVISE (P6.5 not done; offline spec never visited a
  content route; BRAIN stale). Landed: P6.5 release notes + README/CLAUDE §8 (`gates:`/`smoke:`/`telemetry:`) + constitution recompose
  (`verify-kit`: hygieia PASS on CHECK 1 + CHECK 3; CHECK 2 lists hygieia with enodia/themis/mnemosyne on the newer-kit hook/agent variant —
  fleet-wide, pre-existing, zeus B9); DECISIONS P5.3 → superseded-by-ADR-0006 pointer; lane `wt/d` rewrote `offline.spec.ts` to click the
  real recipes nav link (152 items) and hard-load `/diets` from the SW (16 diets), green ×3 + RED ×3, and found that `page.route` cannot
  block a SW (§5). **G6 at `b82d024`:** lint 0 errors · typecheck clean · 3206 tests · build 235 kB entry / precache 69 · check:pwa OK ·
  db:check 10 · gate 227 · seed:check OK · e2e 66 passed · check:bundle OK (37 files). Pushed → CI run 37420337752 green, deployed, smoke 13/13.
  Scoped re-review: REVISE on records only → fixed by the records commit after this line (status, next, this entry, FLEET row).
- Left off: P5/P6 PASS (flip) → CHECKPOINT P5/P6 written at the top of BUILD_LOG; every phase claimed; crew stopped at the human gate. Operator: O1 → OP2.a/b → OP4.b → OP2.c + OP6.a.

### 2026-10-06 — Lighthouse gate correctness: cold first visit, deterministic, 85/90/90 (builder, Fable 5.1, worktree `wt/g`; detail: BUILD_LOG entry of the same name, DECISIONS ADR-0006)

- Did: answered P5/P6 QA's one red criterion. `scripts/check-lighthouse.mjs` blocks `*/registerSW.js` and `*/sw.js` in every
  audit (`BLOCKED_URL_PATTERNS`, `lighthouseFlags`), proves the cold property from each LHR (`verifyColdVisit`; a SW-served chunk
  → exit 2), prints `mode: cold first visit (service worker blocked …)`, thresholds 85/90/90 with the CI tolerance code path,
  header and workflow text removed; `PERFORMANCE_TARGET = 90` exported and printed. Test file rewritten for the new contract
  (56 tests). `deploy.yml` step comment, PLAN §1 item 10 amended, BRAIN §2/§3/§5/§7. Three consecutive runs on one fresh build:
  identical tables, all exit 0 (content routes 87 cold; the rest 90–94).
- Decided: ADR-0006 (gate = function of the artifact alone; cold floor 85; 90 is the target; Enodia 96–97 not comparable).
- Resolved: P5/P6 QA failure 1 (non-deterministic gate). Not resolved: the artifact's cold 87 vs the 90 target (backlog).
- Left off: this change is uncommitted in `wt/g` for the lead → test-writer / reviewer → merge → CI (the gate's first CI run on
  the one 85 bar is the honest runner reading) → P5/P6 re-QA. Operator items unchanged (O1, OP2, OP4, OP6).

### 2026-10-06 — Phase gates, review fixes, records, first live apply (lead, Fable 5.1; detail: BUILD_LOG top ~500 lines)

- Did: P1/P2 QA (fresh clone `fb171c7`: G1+ green, gate 227, prove-red 25/25, 3123 tests; found `offline.spec.ts` red on `main` →
  fixed with explicit `clientsClaim`) → **VALIDATED**. P1/P2 REVIEW → **REVISE on records only**; items 2–3 done (DECISIONS +4 dated
  entries for P1.9, P1.10, P2.1–P2.3, P2.6 + **ADR-0005** build cadence; `CLAUDE.project.md` §2 names it); item 1 = **this BRAIN rewrite**.
  P3/P4 QA (fresh clone `c67aafc`/`89e4d42`: 3166 tests, 31→55 e2e, ribbon in the bundle once per language, content-rule audit, nutrition
  sanity, RED-verify) → **VALIDATED** (P4.QA.5 live admin NOT RUN — operator). P3/P4 REVIEW → **REVISE**; the four fixes landed
  (`229b974`: chips → `/diets/<slug>`, `typicalValuesNote` under plan totals, one owner per dictionary key + test, unit invariant +
  `unitMismatchNote` footnote + generic `MatchResult`) → merged `be016e1`; `fecacfa` puts the record files in `.prettierignore`.
  **Operator applied `000100–000400` live** (`db:apply -- --apply`, ledger `hygieia.schema_migrations`); seeds applying (OPERATOR-P1 entry owed).
- Decided: ADR-0005 (lanes, gates after merge, binds for this build only); one owner per key is test-enforced; record files are never reformatted.
- Resolved: F1 (e2e), F2 (telemetry client), the offline red; REVIEW-P12 closes with this file.
- Left off: PERF lane (CI Lighthouse 77–84 on content routes) blocks the deploy; P3/P4 re-review owed; P5/P6 QA + review owed; O1, OP2, OP4, OP6 operator.

### 2026-10-05/06 — P6 Deploy: telemetry, bundle scan, live smoke, configured-mode CI (lanes `wt/d`, `wt/e`)

- Did: P6.1 fleet telemetry (Enodia modules byte-identical; `startTelemetry()` no-op without the three names; golden fingerprints) ·
  P6.2 `check:bundle` (dist text-file secret scan, exit 2 on a hit, real-build test) · P6.3 `smoke:live` (HTTP read-only probes of the
  deployed PWA + anon backend probes when the env is present; reuses `db:live-check`'s classification) · P6.4 CI builds twice (local-only for
  the browser gates, configured from `${{ vars.* }}` for the Pages artifact), README "Deploy", `.env.example` annotated.
- Decided: variables not secrets (all five values public by design); CI never reaches the live backend. (DECISIONS 2026-10-06 P6.4.)
- Left off: OP2.c + OP6.a flip the live site to configured mode; P6.5 release notes; P6.QA needs OP6.a.

### 2026-10-05/06 — P5 Hardening: Lighthouse, offline, bilingual sweep, a11y matrix, async states, dead backend, code splitting (lanes `wt/b`, `wt/d`, `wt/g`)

- Did: P5.3 `check:lighthouse` (fonts self-hosted, hero WebP `<picture>`, own gzip audit server, thresholds 90/90/90, CI −5 perf) ·
  P5.4 `offline.spec.ts` (SW installs, client-side nav + hard loads offline) · P5.5 bilingual completeness sweep (dictionary + seed tests,
  allow-lists for Latin units) · P5.2 a11y matrix (24 cells, axe WCAG 2.0/2.1 A+AA, gradient wash → `body::before`, `clay-700`, tips eyebrow)
  · P5.1 `AsyncState` kit adopted on every page, reserved-height skeletons (CLS 0.876 → 0.130 on `diet`), **dead-backend e2e project**
  (9 specs) · P5.3 follow-up route-level `React.lazy` + per-table lazy seeds (entry 1,264 → 235 kB), full Chromium in CI, launch diagnostics.
- Decided: gate on serious/critical only; language seeded via localStorage in e2e; no seed pre-warming (measured, reverted); no hero preload.
- Left off: content routes 81–87 locally / 77–84 in CI vs bar 85 → **PERF** item; levers lazy supabase-js + Layout footer CLS.

### 2026-10-05/06 — P4 Breadth: engines, diets + plans, panels, workouts, tips, admin (lanes `wt/b`, `wt/d`, `wt/f`)

- Did: P4.1 nutrition + P4.2 cost engines (hand-computed tests) · P4.3 panels on the recipe page (one scope toggle, energy-share macro
  bar, `Intl` formatting, USDA footnote) · P4.4 `/diets` + `/diets/:slug` (16 cards) · P4.5 seeded weekly plan generator · P4.6 plan UI,
  reshuffle, shopping list, save plan (`{ diet_id, week_start, plan }` with slugs), `/account` tabs · P4.7 exercises seed (136) · P4.8
  workout templates seed (63 = 7×3×3) + `session.ts` + `/workouts` · P4.9 tips seed (75) + `/tips` · P4.10 `/admin` review workbench
  (status-only, column-exact writes, no insert/delete) · P4.11 price table editor · P4.12 e2e specs. Reconciliation: one `useAsync`
  + `useAsyncResult`, one `fill`, seven-module dictionary barrel; `useSettled` retired.
- Decided: see §7 (P4.3, P4.4/P4.6, P4.8/P4.9, P4.10/P4.11, reconciliation).
- Left off: P4.QA.5 live admin is operator; gate fixture adopts two seeded templates (saturated unique).

### 2026-10-05/06 — P3 Core slice: recipes, fridge, navigation, e2e harness (lanes `wt/b`, `wt/c`, `wt/e`, `wt/f`)

- Did: P3.1 `/recipes` list (filter by diet/meal/search, URL state) + `filterRecipes` · P3.2 `/recipes/:slug` (steps, chips, favourites
  note, not-found) · P3.3 fridge matcher (deterministic total order, substitutes, staples) · P3.4 `/fridge` (typeahead picker, localStorage
  via one `commit()`, saved lists) · P3.5 `Layout` + `SiteHeader` nav, home cards live, `NotFound` lifted · P3.6 **Playwright harness on
  the PRODUCTION build with Pages semantics** (`pages-server.mjs`, console watchdog) · P3.7 workflow specs.
- Decided: `useAsync` keyed on loader identity; `PluralForms` + `fill`; Layout renders no `<main>`; `/account` in-place copy in local-only mode.
- Left off: chips retargeted to `/diets/<slug>` by the P3/P4 review fix (2026-10-06).

### 2026-10-05 — P2 Auth & tenancy (lane `wt/e`, pulled forward ∥ P1)

- Did: P2.1 `AuthProvider` + `session.ts` reducer · P2.2 `/auth` (magic link + Google) + `/auth/callback` (PKCE, timeout failure) ·
  P2.3 client-side profile bootstrap, `useProfile()`, `docs/ops/admin.md` · P2.4 `UserDataSource` (supabase | disabled; `user_id` never
  sent) · P2.5 `RequireAuth` / `RequireAdmin` / `AccountMenu` / `/admin` placeholder · P2.6 `db:live-check`.
- Decided: `?next=` in `sessionStorage`, in-app only; callback failure is a timeout; PGRST106 ≠ PGRST205. (DECISIONS 2026-10-05.)
- Left off: live round trips (sign-in, favourites) are OPERATOR-P2 QA items, not run.

### 2026-10-05 — P1 Data spine: toolchain, migrations, catalogue, seeds, ContentSource (lanes `wt/a`, `wt/b`, `wt/c`, `wt/g`)

- Did: P1.1–P1.3 `db:check`, PGlite gate + Alyssos shim, `db:apply` (Management API, dry-run default) · P1.4 content types/enums ·
  P1.5–P1.7 migrations `000100–000400` (schema + ledger, profiles + `is_admin()` + `stamp_review()`, 9 content tables, 3 per-user tables)
  · P1.8 gate catalogue (isolation + role matrix; Vitest twin `db-isolation.test.ts`) · P1.9 322 ingredients · P1.10 16 diets · P1.11
  152 recipes in three groups · P1.12 seed generator + 6 seed migrations + `seed:check`, md5 ids · P1.13 `ContentSource` bundled/supabase,
  schema-pinned typed client, draft ribbon · P1.14 prove-red (25 sabotages; found and closed the filtered-write-probe gap) · P1.15 CI
  steps, README, `docs/ops/migrations.md`.
- Decided: see §7 (per-role policies, column grants, explicit EXECUTE revokes, seed snapshot vs living DB, floors not counts).
- Left off: live apply is the operator's (done 2026-10-06 for 000100–000400; seeds in progress).

### 2026-10-05 (later) — decisions interview, shared-DB ruling, installable PWA

- Did: operator interview (8 decisions, spec §5a); ADR-0003 shared project, schema `hygieia`;
  ADR-0004 installable PWA (`vite-plugin-pwa`, icons via sharp, `check:pwa` CI gate); constitution
  §2/§8/§11 updated and recomposed; `.env.example` annotated.
- Decided: see ADR-0003/0004 and §7.
- Resolved: Q1, Q2. Opened O1, O2 (operator).
- Left off: planner can start from spec v0.2; P1 = applier + gate + schema tracking + catalogue.

### 2026-10-05 — NEW PRODUCT: Hygieia created greenfield (Zeus, Fable 5.1)

- Did: name proposed (Hygieia; alternatives Demeter, Hestia, Asclepius) and confirmed by the
  operator; repo `intotheveil/hygieia` created **public**; house-stack scaffold (Themis configs);
  bilingual P0 shell + 19 tests; CI + Pages workflow; crew kit from named sources (one-row sync,
  hooks + agents `all match`, `kit.mjs init → fill → apply`); `BRAIN.md`, `DECISIONS.md`
  (ADR-0001 Pages/no Supabase, ADR-0002 typed bilingual dictionary), `BUILD_LOG.md`, `README.md`.
- Decided: Greek is the default language; six modules as the product map; no i18n library in P0.
- Resolved: F3 (brand imagery) the same session.
- Left off: deployed and verified; operator answers the spec questions (Q1, Q2) next.

## 7. DECISIONS (dated ADR-lite — the "why", so it's never re-litigated; full text in `DECISIONS.md`, one line each here)

- **2026-10-05 ADR-0001:** public repo + GitHub Pages; "no Supabase" clause superseded by ADR-0003, hosting part stands.
- **2026-10-05 ADR-0002:** bilingual by type — one `Dictionary`, two literals; a missing translation is a compile error.
- **2026-10-05:** no `BRAIN_DISCIPLINE.md` append — the kit installs that text as CORE §0.
- **2026-10-05:** `.claude/.no-greek-scan` present on purpose — Greek copy is product content.
- **2026-10-05 ADR-0003:** DB = Alyssos's shared project, schema `hygieia` only; Themis rulebook (own ledger, Management-API applier, PGlite gate, pinned client, shared auth).
- **2026-10-05 ADR-0004:** installable PWA on Pages; `check:pwa` gates the built artifact.
- **2026-10-05 (P2.4):** per-user writes never send `user_id`; the column default + RLS supply it; types forbid it.
- **2026-10-05:** every `hygieia` function revokes EXECUTE explicitly — per-schema default privileges cannot; a global revoke is forbidden.
- **2026-10-05 (P1.5–P1.8):** policies per role; column-limited client grants; nullability follows `types.ts`; fixtures obey the seed-id rule; gate and `npm test` share one check list.
- **2026-10-05 (P1.14):** write-policy probes are filtered AND blind, strengthened in place; `RED ok` = exit code exactly 1.
- **2026-10-05 (P1.12):** bundled = seed snapshot, DB = living truth; md5 ids by formula; gate floors not counts (except templates = 63); generator forward-compatible.
- **2026-10-05 (P1.13):** md5 in pure TS; `type` aliases for `Database`; typed adapter with `data: unknown` + per-table `Spec`; diet filter is a UNION; hidden child → `null`, not dropped.
- **2026-10-06 (P4.8/P4.9):** pages read the `ContentSource`, not the seed resolver; optional `source` prop; selection in the URL; per-feature error keys; `prettier-ignore` on the `extends` list.
- **2026-10-06 (P3.4):** identity-keyed `useAsync`; fridge persists through one `commit()`; honest failure copy; `savedLists` always calls `list()`.
- **2026-10-06 (P4.4/P4.6):** saved plans persist recipe SLUGS + totals + seed; reshuffle derives the next seed deterministically; plans owns `loadFailed`/`retry`.
- **2026-10-06 (P3.1/P3.2):** `useAsync(fn)` keys on `fn` identity; `PluralForms` + `fill`; unit labels in the dictionary; `?q=` kept verbatim; generic `filterRecipes`.
- **2026-10-06 (P5.3):** fonts self-hosted, Lighthouse bar 90 kept; audit server gzips and serves `404.html` as 200; no hero preload.
- **2026-10-06 (P4.10/P4.11):** admin never inserts/deletes; approve = status update stamped by the DB; column-exact writes refused twice (type + runtime); price group saved as one fact.
- **2026-10-06 (Reconciliation):** one `useAsync` (`status/data/error/reload`) + `useAsyncResult`; `deps` via previous-render pattern; one owner per dictionary key; `fill.ts` = recipes lane's.
- **2026-10-06 (P4.3):** one scope toggle owned by `RecipeView`; macro bar splits ENERGY; rounding only in `panelFormat.ts`; `pricesAsOf` in UTC; no €0 range.
- **2026-10-06 (P6.4):** CI builds twice (local-only for browser gates, configured for the artifact); repository VARIABLES, not secrets.
- **2026-10-06:** `useSettled` retired — admin on the canonical `useAsync`; a rejected read renders `adminLoadFailed`.
- **2026-10-06 (P3.5):** `NotFound` in `routes/NotFound.tsx`; `Layout` renders no `<main>`; nav without `<ul>`; cost/calories cards → `/recipes`; home copy branches on `appEnv.mode`; `/account` in-place copy when unavailable.
- **2026-10-05 (P1.9):** `kcal_100g` capped at 900 (lard/tallow); bunch/head/cube/sheet-sold rows priced `per piece` with the basis in `price_note`.
- **2026-10-05 (P1.10):** 16 diets ship, not "exactly 8" — operator: "as many as you can"; tests assert floors + the eight named slugs.
- **2026-10-05 (P2.1–P2.3):** `?next=` in `sessionStorage` `hygieia.auth.next`, in-app paths only; callback failure is a 15 s timeout; `profileClientFor` adapter.
- **2026-10-05 (P2.6):** `db:live-check` redacts the anon key too; three independent probes; PGRST106 (schema not exposed) ≠ PGRST205 (table missing).
- **2026-10-06 ADR-0005:** P1–P6 built in parallel worktree lanes with G0 per lane, QA + review after merge, checkpoints waived — binds for this build only; §9 gates still must pass before a phase is claimed.
- **2026-10-06 ADR-0006:** `check:lighthouse` measures the COLD first visit by construction (SW blocked per audit, proven per LHR) at 85/90/90, one bar locally and in CI, no tolerance; 90 performance is the target, not the gate; a score that depends on a race inside the audit is not a gate.
- **2026-10-06 (P5.2):** axe WCAG 2.0/2.1 A+AA, gate on serious/critical only; language seeded via localStorage; `routes.ts` carries `h1`/`ready`; body wash is `body::before`; `clay-700` is the text shade.
- **2026-10-06 (P5.1):** one shared `Loading`/`ErrorState`/`EmptyState`, pages keep their keys; skeletons with reserved height; `dead-backend` Playwright project against port 9.
- **2026-10-06 (P5.3 follow-up):** every page but home is a lazy chunk under one `Suspense`; seeds lazy per table; full Chromium in CI; no seed pre-warming (measured); footer CLS left as a design call.
- **2026-10-06 (P3/P4 review fixes):** recipe diet chips link to `/diets/<slug>`; one owner per key is test-enforced; `unitMismatch` warnings surface as a footnote.
- **2026-10-05 (interview):** AI-drafted + admin-reviewed content; accounts from day one (magic link + Google); curated EUR price table; 7 workout types; metric/EUR; keep P0 brand.
- **2026-10-05:** Greek is the default language (`lang="el"`), English for everyone else; a stored choice wins — the operator and first users are Greek-speaking.

## 8. TELEMETRY FIX LEDGER (every production error we've closed — keyed by fingerprint)

> On ANY new error, grep this table for its `fingerprint` FIRST. Status: `watching (until <date>)`
> → `solved (<date>)` after 7 silent days post-deploy. The client is wired (P6.1, `src/telemetry.ts`) but OFF until the operator sets
> the `VITE_FLEET_*` repository variables (OP6.a) — no rows yet. Fingerprints are the fleet's `fingerprint()` over the scrubbed message +
> top frame (golden vectors in `src/lib/telemetry/fingerprint.golden.test.ts`).

| fingerprint | error (short) + URL/count | first seen | root cause | fix commit | deployed | status | if it recurs → start here |
| ----------- | ------------------------- | ---------- | ---------- | ---------- | -------- | ------ | ------------------------- |
