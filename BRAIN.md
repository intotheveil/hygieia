# 🧠 BRAIN — Hygieia (`hygieia`)

> The product's living memory. Read it in full before doing ANY work here (CLAUDE.md §0);
> write it before the session ends. Seeded 2026-10-05 by Zeus (NEW PRODUCT) from the operator's
> intent; rewritten 2026-10-06 to the P1–P6 state (P1/P2 review item 1). Genuine unknowns are
> marked **❓ needs human input**.

**Last updated:** 2026-10-06 by the lead (Claude Code, Fable 5.1, Zeus session) — consolidated rewrite after P1–P6.
**Status:** in-development — P1–P6 built on `main` (`fecacfa`); P1/P2 and P3/P4 QA VALIDATED; deploy of the full app
pending the perf gate (the live site still serves the P0 shell).
**Repo:** `intotheveil/hygieia` (public) · `D:\projects\hygieia` (lane worktrees `D:\projects\hygieia-wt\a..g`, branches `wt/a..g`) ·
**Deployed:** https://intotheveil.github.io/hygieia/ (GitHub Pages, from `main` via CI — today the P0 shell, see §3)

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
- **What works today (built, on `main`, not yet deployed):** every module has a route — `/recipes` (filter by diet/meal/search,
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
  `check:lighthouse` (mobile, 12 routes, performance/accessibility/best-practices ≥ 90, CI −5 on performance only; own gzip server;
  one Chrome per route); `smoke:live` (HTTP, read-only probes of the deployed site; backend probes when the anon env is in the shell).
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

## 3. CURRENT STATE (what's true RIGHT NOW — the thing a resuming session reads)

- **Built on `main` `fecacfa` (2026-10-06), all local gates green:** lint 0 errors (21 pre-existing `react-refresh` warnings) ·
  typecheck clean · **tests 3196** (63 files) · **e2e 66** (57 local incl. 24 a11y cells + 9 dead-backend) · `db:check` 10 files ·
  **`db:gate` 227** · **prove-red 25/25** · `seed:check` OK · `check:bundle` OK · `check:pwa` OK · entry chunk 235 kB / 74 kB gzip
  (was 1,264 / 319 before route splitting). Archive: 10 migrations (4 schema + 6 seed). Seed rows: 322 ingredients · 16 diets ·
  152 recipes · 136 exercises · 63 workout templates · 75 tips, all `pending`.
- **`check:lighthouse` is RED** — performance only (a11y / best-practices / SEO 100 on all 12 routes): content routes 77–84 on GitHub
  runners vs the CI bar 85 (locally 85–91; `diet` lowest). Remaining levers (BUILD_LOG P5.3 follow-up): lazy-load supabase-js
  (`src/lib/supabase.ts` + consumers; ~40 kB gzip off every first paint) and the Layout footer CLS 0.102. **A perf lane is on it.**
- **Deployed:** the live Pages site **still serves the P0 shell** — no push of the full app has passed CI because of the Lighthouse step.
  When CI goes green the deploy will be in **local-only mode** (bundled drafts + ribbon, no sign-in) until OP2.c sets the variables.
- **Live DB (shared project, schema `hygieia`) — 2026-10-06, operator's go:** ledger `hygieia.schema_migrations` holds versions
  **000100–000400** (schema, profiles, content, user_data) applied by `db:apply -- --apply`. **The six seed files (000500–001000) are
  being applied as this is written** — verdict lines go to the BUILD_LOG `OPERATOR-P1` entry; do not assert live row counts until it
  exists. **Data API exposure of schema `hygieia` not yet confirmed** (O1 open) — until then `db:live-check` probes 2–3 and every
  configured-mode read legitimately FAIL with PGRST106.
- **Gates run (ADR-0005 cadence — after merge, phase by phase):** P1/P2 QA **VALIDATED** · P1/P2 REVIEW **REVISE on records only**
  (items 2–3 done: DECISIONS +5 incl. ADR-0005; item 1 = this rewrite) · P3/P4 QA **VALIDATED** (P4.QA.5 live admin NOT RUN — operator) ·
  P3/P4 REVIEW **REVISE** → the four required fixes LANDED on `main` (`229b974`, merged `be016e1`); re-review owed. P5 and P6 QA + review
  not yet run. Operator-side QA items (P2.QA.3b/4b/5/6, P4.QA.5, P6.QA.4) are NOT RUN, never claimed.
- **In flight:** perf lane (Lighthouse); operator seed apply; this BRAIN rewrite (closes REVIEW-P12); P3/P4 re-review pending.
- **Next, in order:** (1) perf gate green locally with `CI=1` → push → CI green → Pages deploy (local-only mode). (2) seeds live →
  operator exposes schema `hygieia` (O1 / OP1.b) → `npm run db:live-check` PASSED → operator approves content in `/admin` (OP4.b; needs the
  admin flag OP2.b, which needs one signed-in session first). (3) OP2.a Google OAuth + redirect URLs, OP2.b admin flag, OP2.c repo
  variables (Supabase pair) and OP6.a (fleet trio) → next `main` deploy is configured → `smoke:live` reports rows. (4) re-reviews:
  P1/P2 → PASS on this rewrite; P3/P4 → PASS on `fecacfa`. (5) P5 QA + review; P6 QA + review (P6.QA needs OP6.a). (6) P6.5 release notes.

## 4. OUTSTANDING (bugs · feedback · requests · known issues — the triage queue)

| id         | sev | type     | summary                                                                                                                                                                                                 | status          | added      |
| ---------- | --- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- | ---------- |
| O1         | 🟠  | operator | Expose schema `hygieia` in the shared project's Data API settings (ADR-0003 rule 5; OP1.b). Until done every configured-mode read and `db:live-check` probes 2–3 fail with PGRST106                     | open (operator) | 2026-10-05 |
| O2         | 🟡  | note     | Supabase advisory seen while inspecting the shared project: Alyssos's PostGIS reference table `public.spatial_ref_sys` has RLS disabled. Alyssos's call — flagged, not touched; the gate asserts we never change it | open (operator) | 2026-10-05 |
| PERF       | 🟠  | bug      | CI `check:lighthouse` below the 85 bar on content routes on GitHub runners (77–84; local 85–91). Blocks every deploy of the full app. Levers: lazy supabase-js, Layout footer CLS. Perf lane working      | in progress     | 2026-10-06 |
| REVIEW-P12 | 🟠  | gate     | P1/P2 REVIEW REVISE on records: item 1 = BRAIN.md rewrite (this file, 2026-10-06); items 2–3 landed. Reviewer flips to PASS without re-reading code                                                      | fix landed      | 2026-10-06 |
| REVIEW-P34 | 🟠  | gate     | P3/P4 REVIEW REVISE: four required fixes landed on `main` `fecacfa`; re-review owed before P3/P4 are claimed                                                                                            | fix landed      | 2026-10-06 |
| OP2        | 🟠  | operator | OP2.a Google OAuth client + both apps' redirect URLs on the shared project; OP2.b admin flag via `docs/ops/admin.md` after a first sign-in; OP2.c repo variables `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` | open (operator) | 2026-10-06 |
| OP4        | 🟠  | operator | After O1 and OP2.b: review and approve seeded content in `/admin` (OP4.b) — until then the configured site shows no DB content, by design                                                             | open (operator) | 2026-10-06 |
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

## 6. CHANGELOG (append-only — what happened, newest first)

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
