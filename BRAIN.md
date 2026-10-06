# 🧠 BRAIN — Hygieia (`hygieia`)

> The product's living memory. Read it in full before doing ANY work here (CLAUDE.md §0);
> write it before the session ends. Seeded 2026-10-05 by Zeus (NEW PRODUCT) from the operator's
> intent — there was no code to investigate yet beyond the P0 scaffold. Genuine unknowns are
> marked **❓ needs human input**.

**Last updated:** 2026-10-06 by Claude Code (Fable 5.1, builder, worktree `wt/g`) — P5.3 perf follow-up (last): Lighthouse gate green on all 12 routes locally.
**Status:** in-development (P0 Foundation done; P1 decisions taken 2026-10-05).
**Repo:** `intotheveil/hygieia` (public) · `D:\projects\hygieia` · **Deployed:** https://intotheveil.github.io/hygieia/ (GitHub Pages, from `main` via CI)

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

## 2. ARCHITECTURE (the canonical technical truth — investigate ONCE, record here)

- **Stack:** React 19 + Vite 8 + TypeScript 6 (strict) + Tailwind 4 (`@tailwindcss/vite`, theme
  tokens in `src/index.css`: cream paper / olive ink / sage accent, light scheme); react-router-dom 7
  declarative `BrowserRouter`; Vitest 5 (jsdom) + Testing Library; ESLint 10 flat + Prettier.
  Configs lifted from Themis's P0 (the fleet reference), not the Vite template (zeus BRAIN §5).
- **i18n (ADR-0002):** `src/i18n/dictionary.ts` — `Dictionary` interface, `en` and `el` literals,
  `LANGS = ['el','en']`. `src/i18n/LangProvider.tsx` — context + `useLang()`; start language =
  stored (`localStorage` key `hygieia.lang`) else Greek browser → `el` else `en`; sets
  `document.documentElement.lang`. Pure helpers `initialLang` / `toLang` are unit-tested.
- **Routing:** `src/routes/routes.tsx` — `/` → `App`, `*` → `NotFound`; `basenameFrom(BASE_URL)`.
  Vite `base: '/hygieia/'`. SPA fallback: `vite.config.ts` `spaFallback` copies `index.html` →
  `404.html` at build (GitHub Pages has no rewrites).
- **Env / backend:** `src/lib/env.ts` is the ONLY reader of `VITE_SUPABASE_URL` /
  `VITE_SUPABASE_ANON_KEY`; `resolveAppEnv` never throws → `configured | local`. `src/lib/supabase.ts`
  `getSupabase(): Promise<HygieiaClient | null>` resolves **null** in local-only mode WITHOUT loading
  `@supabase/supabase-js` (reached only via `import()`, its own chunk — P5.3 follow-up, 2026-10-06); the
  `AuthProvider` and `content/index.ts` await it, every other module is handed a `HygieiaClient`. **DB = Alyssos's shared Supabase project, own schema `hygieia`, shared auth — see DECISIONS.md ADR-0003** (supersedes ADR-0001's no-Supabase clause). Nothing provisioned yet. The
  eslint config blocks server-only names and non-allow-listed `VITE_*` reads in `src/**`.
- **Env var NAMES** (`.env.example`): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`,
  `VITE_FLEET_URL`, `VITE_FLEET_KEY`, `VITE_FLEET_PRODUCT_ID` (telemetry, not wired yet).
- **PWA (ADR-0004):** `vite-plugin-pwa` in `vite.config.ts` (manifest + Workbox SW, autoUpdate, fonts
  runtime-cached); icons `public/icons/` (SVG source → `npm run icons` via sharp); `npm run check:pwa`
  gates CI on the BUILT artifact.
- **CI/deploy:** `.github/workflows/deploy.yml` — `verify` (npm ci → lint → typecheck → test →
  build → upload-pages-artifact, Node 24) then `deploy` (actions/deploy-pages, main only).
  Pages `build_type=workflow`.
- **Commands:** `npm run dev | lint | typecheck | test | build | preview | format`.
- **Crew kit:** 7 hooks + 7 agents from `zeus/.zeus/kit/` via one-row manifest sync (row in
  `fleet.repos`); constitution composed by `kit.mjs`; `.claude/settings.json` from
  `settings.template.json`; `.claude/.no-greek-scan` present (Greek copy is product content).
- **Brand assets:** `public/favicon.svg` (hand-drawn heart-leaf mark). `public/brand/*.jpg` from the operator's local ComfyUI (RealVisXL V5, portable install `F:/AI/ComfyUI`); see §3.

## 3. CURRENT STATE (what's true RIGHT NOW — the thing a resuming session reads)

- **Lighthouse mobile gate GREEN locally (2026-10-06, `wt/g`, not yet merged):** `npm run check:lighthouse` → all 12 routes
  performance 91–97 in three consecutive runs, a11y/bp/seo 100, CLS ≤ 0.020 (baseline on main: 82–91, 8 routes failing).
  Levers: Layout slot `min-h-dvh` + `[&>main]:w-full`, lazy supabase-js (`getSupabase()`), fallback `@font-face` metrics.
  Cold first visit of a content route (seeds from the network, not the SW) still measures ~87–88 — see BUILD_LOG entry.
  (§3 below this line is the P0 snapshot; P1–P5 state lives in BUILD_LOG.md — the lead consolidates at the phase gate.)
- **P0 scaffold built and proven locally (2026-10-05):** lint ✅ (0 errors, 4 fast-refresh
  warnings) · typecheck ✅ · **19 tests ✅** (4 files) · build ✅ (267 kB JS / 86 kB gzip,
  `404.html` byte-equal to `index.html`).
- **What's live:** the P0 SHELL — bilingual home page with six module cards each labelled
  "Coming / Έρχεται", a status box saying no module has content, language switch, not-found
  route. **No product content exists yet**; the page says so honestly (the Argus/Themis rule).
- **DEPLOYED 2026-10-05:** Pages enabled (`build_type=workflow`), CI run 37353201541 green; live URL 200
  with the Greek title, favicon 200, deep link served as `404.html`, bundle 200. Verified by HTTP only (no
  browser screenshot — the Chrome extension was not connected). Gate run directly:
  `SUBAGENT GATE (builder) scope: ran[secret-scan typecheck lint test] skipped[none]`; `verify-kit` → PASS.
- **Brand imagery landed (F3 closed):** `public/brand/og-hygieia.jpg` (Greek-salad table, `og:image`,
  1216×640) and `hero-plate(-sm).jpg` (salmon plate, hero `<img>` with `srcSet`), rendered on the operator's
  ComfyUI with RealVisXL V5. A workout render was rejected (merged objects).
- **Installable PWA landed (2026-10-05):** manifest + SW generated at build, `check:pwa` green, in CI.
- **Operator decisions taken 2026-10-05 (interview; closes Q1, Q2):** content AI-drafted + human-reviewed
  (nutrition from USDA FoodData Central); **accounts from the start**; curated EUR price table edited by
  the operator; **all seven workout types** (home, gym, calisthenics, running, swimming, cycling,
  mobility); auth = email magic link + Google; metric + EUR only; keep the P0 brand; **review flow =
  operator approves in an admin page**. DB = Alyssos's shared project (ADR-0003) because a dedicated
  project could not be created through the permission UI. Full table: zeus `specs/HYGIEIA_SPEC.md` §5a.
- **In progress:** nothing. P0 is the handover point.
- **Next, in order:** (1) spec v0.2 is decided — planner may start; (2) `planner` turns it into PLAN.md on the §9 arc — P3 core slice is likely
  **Diets + Recipes with diet tags** (the data model everything else hangs off), with "What's in
  my fridge" as the first interactive feature; (3) P1 begins with the applier + PGlite gate lifted from Themis, then
  the ingredient catalogue and profiles (ADR-0003 rules); operator items O1/O2 below.

## 4. OUTSTANDING (bugs · feedback · requests · known issues — the triage queue)

| id  | sev | type     | summary                                                                                                                                                      | status          | added      |
| --- | --- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------- | ---------- |
| Q1  | 🟠  | question | ~~Content source~~ **CLOSED 2026-10-05:** AI-drafted + operator-reviewed in an admin page; nutrition from USDA FoodData Central; curated EUR price table     | closed          | 2026-10-05 |
| Q2  | 🟠  | question | ~~Accounts~~ **CLOSED 2026-10-05:** accounts from the start, email magic link + Google, on the shared project (ADR-0003)                                     | closed          | 2026-10-05 |
| O1  | 🟠  | operator | Before P2: expose schema `hygieia` in the shared project's API settings and register the Google OAuth app with both apps' redirect URLs (ADR-0003 rules 5–6) | open (operator) | 2026-10-05 |
| O2  | 🟡  | note     | Supabase advisory seen while inspecting the shared project: Alyssos's PostGIS reference table has RLS disabled. Alyssos's call — flagged, not touched        | open (operator) | 2026-10-05 |
| F1  | 🔵  | feature  | e2e runner (Playwright against the production build, Themis pattern) — "not defined yet" in §8; first milestone after P0                                     | open            | 2026-10-05 |
| F2  | 🔵  | feature  | Fleet telemetry (`VITE_FLEET_*`) — names reserved, client not wired                                                                                          | open            | 2026-10-05 |

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

- **`npm test` OVERWRITES `dist/` with a development React build** (P5.3 follow-up, 2026-10-06): `scripts/check-bundle-secrets.test.ts`
  spawns `npm run build` into `dist/` with `{ ...process.env }`, which under vitest carries `NODE_ENV=test` → entry 431 kB raw instead of
  235 kB. Any `check:lighthouse` (or e2e timing) after `npm test` without a fresh `npm run build` measures that artifact (home 88, admin 85
  on an otherwise green tree). Build after test; fix belongs to that test (`NODE_ENV: 'production'` or a temp `--outDir`).
- **A `<main class="mx-auto max-w-*">` inside Layout's flex column SHRINKS TO ITS CONTENT while loading** (auto horizontal margins on a
  flex item do not stretch). A skeleton narrower than the page (the `detail` variant's widest bone is `w-24`) rendered `main` as a 128 px
  centred column that snapped to full width when the data arrived — CLS 0.126 on `/diets/:slug`, misread by P5.1 as a font swap. Layout
  now forces `[&>main]:w-full`; do not remove it, and attribute CLS with a layout-shift `PerformanceObserver` (`sources` → rects), not by
  what else happens in the same frame.
- **The Lighthouse gate's content-route scores are partly a repeat-visit number:** in 20 of 21 audits the seed chunks were served by the
  just-installed service worker (`transferSize 0`); the one network-served audit (`fridge`, run 1) scored 87 with simulated LCP 3.5 s. A
  single sub-90 content route with LCP ≈3.5 s and seed chunks > 0 kB in the LHR request list is that race, not a regression.
- **Scratch Playwright probes under Git Bash need `MSYS_NO_PATHCONV=1`**, or a `/hygieia/...` argument becomes `C:/Program Files/Git/hygieia/...`.

## 6. CHANGELOG (append-only — what happened, newest first)

### 2026-10-06 — P5.3 perf follow-up (last): footer below the fold, lazy supabase-js, fallback font metrics (builder, `wt/g`)

- Did: Layout slot `min-h-dvh` + `[&>main]:w-full`; `@supabase/supabase-js` behind `import()` with `getSupabase()`; `AuthProvider` and
  `content/index.ts` (`deferredSource`) await it; three fallback `@font-face` aliases with metrics read from the font files. Tests 3192 green.
- Decided: see §7 (2026-10-06, three entries) and DECISIONS.md.
- Resolved: the Lighthouse gate — 12/12 routes ≥ 90 in three consecutive local runs (91–97), CLS ≤ 0.020. Found the real cause of the `diet`
  shift (skeleton width, not fonts) and the `npm test` → dev `dist/` trap (§5).
- Left off: not committed (the loop commits after test-writer + reviewer). For the lead: `TipsPage` chip counts (CLS 0.02), the supabase
  chunk's `dist-*.js` name (cosmetic), the `check-bundle-secrets.test.ts` fix — all out of this task's scope.

### 2026-10-05 (later) — decisions interview, shared-DB ruling, installable PWA

- Did: operator interview (8 decisions, §3 / spec §5a); ADR-0003 shared project, schema `hygieia`;
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
- Left off: deployed and verified (§3); operator answers the spec questions (Q1, Q2) next.

## 7. DECISIONS (dated ADR-lite — the "why", so it's never re-litigated)

- **2026-10-05 ADR-0001:** public repo + GitHub Pages, no Supabase project yet — P0 persists
  nothing; create an EU project when a phase needs it. (`DECISIONS.md`)
- **2026-10-05 ADR-0002:** bilingual by type (one `Dictionary`, two literals), no i18n library in
  P0 — a missing translation must be a compile error. (`DECISIONS.md`)
- **2026-10-05 ADR-0003:** DB = Alyssos's shared Supabase project, own schema `hygieia`, the Themis
  rulebook (no `db push`, own schema_migrations, Management-API applier, PGlite gate). Operator ruling.
- **2026-10-05 ADR-0004:** installable PWA on Pages; `check:pwa` gates the built artifact.
- **2026-10-05 (interview):** AI-drafted + admin-reviewed content; accounts from day one (magic link +
  Google); curated EUR price table; 7 workout types; metric/EUR; keep P0 brand.
- **2026-10-05:** Greek is the default language (`lang="el"`), English for everyone else; a
  stored choice wins — the operator and first users are Greek-speaking.

- **2026-10-06 (P5.3 follow-up, last):** the disclaimer footer lives BELOW the first viewport on every route (Layout slot `min-h-dvh`;
  short pages scroll to it) and the slot sizes `<main>` (`w-full`) — one shift of 0.099–0.126 per content route was the price of the
  old "footer visible on short pages" rule. (`DECISIONS.md`)
- **2026-10-06:** supabase-js is lazy — `getSupabase()` + `import()`; local-only builds never load it. (`DECISIONS.md`)
- **2026-10-06:** fallback fonts carry the webfonts' metrics (`size-adjust` from measured Greek/English advance widths) rather than
  `font-display: optional`, which would drop the Greek webfont on slow first visits. (`DECISIONS.md`)

## 8. TELEMETRY FIX LEDGER (every production error we've closed — keyed by fingerprint)

> On ANY new error, grep this table for its `fingerprint` FIRST. Status: `watching (until <date>)`
> → `solved (<date>)` after 7 silent days post-deploy. Telemetry is not wired yet (F2).

| fingerprint | error (short) + URL/count | first seen | root cause | fix commit | deployed | status | if it recurs → start here |
| ----------- | ------------------------- | ---------- | ---------- | ---------- | -------- | ------ | ------------------------- |
