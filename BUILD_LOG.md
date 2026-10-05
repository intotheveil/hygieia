# BUILD LOG — Hygieia (`hygieia`)

The crew's trail: what was attempted, what passed, what's blocked, what's next. Newest first.
The human reads this first on return (CLAUDE.md §5).

## 2026-10-05 — P5.5 bilingual completeness sweep (dictionary + seed tests; pulled forward) — DONE (builder, worktree `wt/b`; not yet committed)

**Scope:** the test-hardening half of P5.5 only (PLAN.md §0 bilingual rule, ADR-0002). UI copy review and the P5.2 a11y-matrix H1
assertions stay with P5.2/P5.5-UI; no component, route or dictionary KEY was touched. Seed SQL is still the P1.12 stub, so a seed
copy fix drifts no tracked artifact.

**`src/test/bilingual.ts` (new, pure, never bundled):** `leaves(obj)` (every string leaf with its dotted path, arrays indexed, non-strings
skipped), `hasGreek(s)` / `GREEK_SCRIPT` (`\p{Script=Greek}`), `looksUntranslated(el, en, allow)` (el repeats en, trimmed + case-insensitive,
unless en is an allow-listed brand/loanword; two blanks do NOT count — blankness is its own rule), `containsPlaceholderMarkers(s)` /
`PLACEHOLDER_MARKERS` (`TODO ??? xxx lorem placeholder FIXME`, case-insensitive). Own suite `src/test/bilingual.test.ts` (23 tests,
incl. Cyrillic/Latin look-alikes, lone `?`/Greek `;` not flagged).

**Rules added (every existing `it` kept verbatim; nothing loosened):**
- `src/i18n/dictionary.test.ts` (+6): (a) no `el` leaf repeats its `en` twin except `SAME_VALUE_ALLOWLIST` (Hygieia, Atkins, Whole30, DASH,
  calisthenics, keto, paleo); (b) no leaf carries a placeholder marker; (c) every `el` leaf ≥ 12 chars has Greek script unless key-allow-listed
  (`switchTo`); (d) no `en` leaf has Greek script unless key-allow-listed (`switchTo` = Ελληνικά); allow-list hygiene (keys exist and still need
  the exception); (e) `Object.keys` order identical in `en`/`el` at every nesting level (`keyOrder`). The local `leaves` was replaced by the shared one.
- Seeds (f)/(g): `diets` (+4 per diet × 16): `*_en` Latin, `*_el` Greek (name allow-listed by slug via the existing `GREEK_NAME_ALLOWLIST`), no
  el=en repeat except the allow-listed brand, no markers in any leaf. `tips` (+3): `title_en`/`body_en` Latin, no repeats, no markers. `exercises`
  (+6): `name_en`/`cue_en`/`equipment_en` Latin; `equipment_el` Greek unless on the NEW `LATIN_EQUIPMENT_EL_ALLOWLIST` (`kettlebell-swing`,
  `pull-buoy-freestyle` — loanwords the same rows already use in their Greek names/cues) with a stale-entry guard; repeats only where allow-listed
  (name via the existing `LATIN_NAME_EL_ALLOWLIST`); no markers; `muscle_groups` no blanks. `workouts` (+3): `notes_en` Latin, no repeats, no
  markers. `ingredients` (+4): `name_en` Latin, no repeats except the (empty) loanword list, no markers in any leaf, `substitute_slugs` no blanks.
  `recipes` (+4 per recipe × 152): `title_en`/`steps_en` Latin, no repeats (title allow-listed by slug via the existing `LATIN_TITLE_EL_ALLOWLIST`,
  steps never), line notes Greek in `note_el` / Latin in `note_en` / never identical, no markers in any leaf.

**Copy fixes found by the sweep (the only two real defects in 764 seed rows + the dictionary):** `src/content/seed/recipes/group2.ts` —
`keto-avocado-egg-feta-bowl` line `spinach` `note_el: 'baby'` → `'τρυφερά φύλλα'` (en `baby leaves`); `keto-pork-chops-mustard-cream-sauce`
line `mustard` `note_el: 'Dijon'` → `'Ντιζόν'` (en `Dijon`). Everything else the sweep surfaced is a legitimate loanword/brand already
allow-listed (`Whole30`, the exercise names list, the two equipment rows).

**Red-proof:** reintroducing `note_el: 'Dijon'` and setting `el.loading = 'Loading… TODO'` → exactly 3 failures (`placeholder marker`,
`el leaf ≥ 12 chars … no Greek script`, `note_el "Dijon"`), restored afterwards.

**Gates (2026-10-05, `D:/projects/hygieia-wt/b`):** `npm run lint` 0 errors (6 react-refresh warnings, identical to the baseline) ·
`npm run typecheck` clean · `npm test` **37 files / 2745 tests** green (baseline on the same tree before this task: 36 / 2028 → **+717 tests**:
23 helper + 6 dictionary + 64 diets + 3 tips + 6 exercises + 3 workouts + 4 ingredients + 608 recipes) · `npm run build` green,
`dist/404.html` byte-equal to `index.html` · `check:pwa OK — Hygieia · Υγίεια, 3 icons, sw.js present`.

**Not done / next:** nothing committed (the lead merges `wt/b`). `BRAIN.md` §3/§6 not touched by this lane (lead's merge step). The
H1-per-route language assertions of P5.5 remain with P5.2's a11y matrix; the UI copy review half of P5.5 waits for the pages.
## 2026-10-05 — P1.12 follow-up: seeds regenerated (152 recipes, 63 workouts) + gate fixture off the saturated unique cell — DONE (builder, worktree `wt/a`; not yet committed)

**Why:** `recipes/group2.ts` (61 recipes → 152) and `src/content/seed/workouts.ts` (63 templates) reached main after P1.12 generated
the seed files, so `…000700_hygieia_seed_recipes.sql` was stale and `…000900_hygieia_seed_workouts.sql` did not exist. And the P1.12
"Landmine for P4.8" went off: with all 63 (type, level, intensity) cells seeded, the gate fixture's `fx-home-beginner-low` /
`fx-gym-intermediate-moderate` INSERTs collided — observed BEFORE the fix: `FAIL  fixture seeded (…) — duplicate key value violates
unique constraint "workout_templates_cell_key"` → `GATE FAILED — 1 check(s) red`.

**Seeds:** `npm run seed:gen` → `…000700_…_recipes.sql` — recipes **152**, recipe_ingredients **1173**, recipe_diets **740** (was 91 / 728 /
513); NEW `…000900_…_workouts.sql` — workout_templates **63**, workout_template_exercises **579**. Other four files byte-identical.
`npm run seed:check` → `OK — 6 seed migration(s) identical`. `npm run db:check` → `PASS migration guard: 10 migration(s)`.

**Fixture (`scripts/db-gate/catalogue.mjs`) — adopt, don't insert:** there is NO free unique cell, so the fixture no longer inserts
templates or their children. New `ADOPTED_TEMPLATE_SLUGS` = the two lowest slugs of `WORKOUT_TEMPLATES` (imported from
`src/content/seed/workouts.ts`, code-unit sort): `calisthenics-advanced-high` (flipped to `approved`, `reviewed_at = OLD`,
`reviewed_by = ADMIN`, `updated_at = OLD`) and `calisthenics-advanced-low` (stays `pending`, stamps nulled, `updated_at = OLD`).
`FX.workout_templates` and `ID.tplApproved` / `ID.tplPending` (renamed from `homeTemplate` / `gymTemplate`) derive from them. The two
UPDATEs run in their own transaction under `set local session_replication_role = replica` — without it `touch_updated_at` sets `now()` and
`stamp_review` sets `reviewed_by = auth.uid()` (null as superuser), which would break "ADMIN's content edit … without re-stamping" and
make the `touched`/`later` proofs trivial. Each UPDATE must affect exactly 1 row or the fixture THROWS (an archive without the workouts
seed → `fixture seeded` red with "is the P4.8 seed in the archive?"). The `workout_template_exercises` child `insert` probe now targets
`ID.tplApproved` at position **99** (seeded max is 12; was 9, which a seeded template could occupy). `SEED_COUNTS.workout_templates` and
`SEED_CHILD_COUNTS.workout_template_exercises` lost their `pendingTask` — the counts now BIND (0 rows is red, no longer a "not seeded
yet" pass). No check was weakened or removed; all expected counts are read from the DB (approved 1 / pending 62 / total 63 / children 12
under approved, 567 under pending). Header comment documents the exception.

**Gate (worktree, 2026-10-05):** `npm run db:gate` → **GATE PASSED — 227 checks green** (fixture seeded PASS); `workout_templates: fixture
holds >= 1 approved and >= 1 pending row — approved 1, pending 62` · `anon reads exactly N approved rows and 0 pending — N = 1 approved of
63; read 1, pending 0` · `ADMIN reads all rows — 63/63` · `ADMIN's status update takes effect and is stamped — later:true, touched:true` ·
`ADMIN's content edit … without re-stamping — kept:true` · `every row id = md5(…) — 63 rows checked, 0 off-formula` · **`seeded rows (slug
not like 'fx-%') = 63 — 63 seeded rows`** · `workout_template_exercises: fixture holds children … — under approved 12, under pending 567` ·
`anon reads only children of approved parents — 12/579 (approved parents: 12)` · `ADMIN's INSERT, UPDATE and DELETE take effect — made 1,
left 0` · **`seeded child rows … >= 1 — 579 seeded rows`**. Recipes: `154` total rows checked, 0 off-formula; `152` seeded.

**prove-red:** `npm run db:gate:prove-red` → **PROVE-RED PASSED — 25/25 sabotages RED on the expected line; control GREEN (228 PASS)**, wall
19.5 s. **Zero regex changes** — the four P1.12 floating-total regexes already absorb the new totals (`recipes-select-true-anon` now sees
`of 154; read 154, pending 153`, `recipe-ingredients-select-true` `1177/1177 (approved parents: 2)`, `seed-random-id` `77 rows checked, 1
off-formula`); `table-dropped-stale-entry` still red on `fixture seeded ` (favourites gone).

**RED evidence for the adopted fixture path** (temp copies of the archive + one appended sabotage file, gate pointed at them via
`DB_GATE_MIGRATIONS`; copies deleted): (1) `workout_templates_select_anon … using (true)` → `FAIL  hygieia.workout_templates: anon reads
exactly N approved rows and 0 pending — N = 1 approved of 63; read 63, pending 62` / `GATE FAILED — 1 check(s) red, 227 green`, exit 1.
(2) `workout_template_exercises_select_anon … using (true)` → `FAIL  hygieia.workout_template_exercises: anon reads only children of approved
parents — 579/579 (approved parents: 12)` / `GATE FAILED — 1 check(s) red, 227 green`, exit 1. Both red on exactly ONE line (the leak), so
the adopted-row fixture discriminates.

**Acceptance chain (one run, exit 0):** `seed:check` OK (6 identical) · `db:check` PASS 10 migrations · `db:gate` GATE PASSED 227 ·
`db:gate:prove-red` PASSED 25/25 · `lint` `0 errors, 6 warnings` (pre-existing `react-refresh/only-export-components` in `AuthProvider.tsx`,
`LangProvider.tsx`, `routes.tsx`) · `typecheck` clean · `npm test` **37 files / 2063 tests green** · `build` `✓ built`, `precache 24 entries`,
`dist/sw.js` · `check:pwa OK — Hygieia · Υγίεια, 3 icons, sw.js present`. `npx vitest run scripts/` alone: 8 files / 388 tests.
`db-isolation.test.ts` needed NO change (it runs only `user` + `profiles` kinds; the fixture still seeds). Prettier clean on `catalogue.mjs`.

**Files:** `supabase/migrations/20261006000700_hygieia_seed_recipes.sql` (regenerated), `supabase/migrations/20261006000900_hygieia_seed_workouts.sql`
(new), `scripts/db-gate/catalogue.mjs`, `BUILD_LOG.md`, `BRAIN.md` (§5 gotcha). Not committed (the lead merges `wt/a`).

**Decision (for DECISIONS.md if the lead keeps it):** the gate fixture ADOPTS seeded rows for any content table whose unique key real data
saturates, flipping status under `session_replication_role = replica`; it never inserts into such a table. Adopted rows are chosen by the
seed module's lowest slugs so the choice is deterministic and travels with the content.
## 2026-10-06 — P4.8 `/workouts` page + P4.9 `/tips` page (UI halves) — DONE (builder, worktree `wt/d`; not yet committed)

**Scope:** the React halves of P4.8 and P4.9 only. No seed, script, migration, route or header edits — `routes.tsx` /
`App.tsx` / `SiteHeader.tsx` are P3.5's; `dictionary.ts` is never touched (feature dictionaries compose through
`src/i18n/features/index.ts`).

**Files:** `src/workouts/WorkoutsPage.tsx` + `.test.tsx`, `src/tips/TipsPage.tsx` + `.test.tsx`,
`src/i18n/features/workouts.ts`, `src/i18n/features/tips.ts`, `src/i18n/features/index.ts` (two imports, two `extends`
parents one-per-line under `// prettier-ignore` so `merge=union` merges concurrent lanes, two spreads), NEW
`src/i18n/fill.ts` (`fill('{n} tips', { n })`), NEW `src/lib/useAsync.ts` (loading/ready/error over a `Result` promise;
the settled outcome is stored WITH the `run` identity that produced it, so "loading" is derived and no setState runs
synchronously in an effect — callers `useCallback` their `run`). Neither helper existed in any sibling worktree; duplicates
reconcile at merge.

**`/workouts`:** three `role="radiogroup"` chip groups (type ×7, level ×3, intensity ×3; chips are `role="radio"` +
`aria-checked`), URL state `?type=&level=&intensity=` (always all three keys; junk → defaults home/beginner/moderate), one
session card: title, `duration_min`, notes, equipment line (distinct localized `equipment_*` across the session, or
`bodyweight`), warm-up → main → cool-down as `<ol>` of `name · sets × reps-or-seconds · rest N s` (rest omitted when 0),
each with the coaching cue in `<details>`, `DraftRibbon` (kind + row status), the `notMedicalAdvice` disclaimer,
loading / error (`workoutsLoadFailed`) / empty (`noSession`) states. Content comes from
**`contentSource.getWorkoutTemplate(type, level, intensity)`** — NOT `workouts/session.ts` over seed arrays — so supabase
mode works unchanged; `blocksOf(template)` groups the source's `slots` in `BLOCKS` order and applies the same
whole-or-nothing rule as `resolveSession` (a hidden exercise → `noSession`). Pages take an optional `source` prop
(default `contentSource`) so tests inject fakes for the states.

**`/tips`:** topic filter chips ("all" + 6 `TIP_TOPICS`, each with its count) as a `radiogroup`, URL state `?topic=`
(absent/unknown → all), tips grouped under one `<h2>` per topic in `TIP_TOPICS` order with `tipsCount`, cards
(`<article>`: title, body, `source_url` link with `target="_blank" rel="noopener noreferrer"` or the `sourcePending`
label when `needs_source`), `DraftRibbon`, loading / error (`tipsLoadFailed`) / empty (`tipsEmpty`).

**Dictionary keys added** (en + el, both pass the parity test): workouts — `workoutsTitle workoutsIntro pickType pickLevel
pickIntensity types.* levels.* intensities.* blocks.* sets reps seconds rest duration minutes equipment bodyweight showCue
noSession workoutsLoadFailed`; tips — `tipsTitle tipsIntro allTopics topics.* readSource sourcePending tipsCount tipsEmpty
tipsLoadFailed`. Beyond the brief's list: `minutes` (duration unit), `workoutsLoadFailed` / `tipsLoadFailed` (error
states), `tipsEmpty` (empty state) — named per-feature to avoid union-merge collisions with other lanes.

**Tests (41 new):** workouts — URL parse/serialize/junk, `workFigure` both languages, default session has all three
blocks with ≥ 1 item and a cue per item, intensity → `high` changes the work figures AND the duration and writes the URL,
type change keeps the other keys, all 63 combinations render a session (loop, `unmount` each), headings + all 13 selector
labels + block headings in both languages, Greek-script exercise names in `el`, loading / error / empty / hidden-exercise
states. tips — parse/group helpers, 75 cards under 6 headings with per-topic counts, `sleep` filter shows only sleep tips
and writes `?topic=sleep`, deep link `?topic=hydration`, `needs_source` → `sourcePending` with no link, sourced tip →
link with `rel="noopener noreferrer"` + `target="_blank"`, every link safe, both languages, loading / error / empty.

**Gates (worktree `wt/d`):** `npm run lint` 0 errors (15 warnings, all `react-refresh/only-export-components`, the
pattern `routes.tsx`/`LangProvider.tsx` already carry) · `npm run typecheck` clean · `npm test` **2148 passed, 3 failed —
all three in `scripts/gen-seed-sql.test.ts` and PRE-EXISTING on this worktree's base (reproduced with every change of
this task stashed): `seed:check` reports `missing 20261006000900_hygieia_seed_workouts.sql` and `differs
…000700_hygieia_seed_recipes.sql` — the P4.8/P4.9 DATA lane's generated SQL has not landed in `wt/d`; `scripts/` and
`supabase/migrations/` are out of this task's scope** · `npm run build` green (PWA precache 24 entries) · `npm run
check:pwa` OK.

**Next:** P3.5 wires `/workouts` and `/tips` into `routes.tsx` + `SiteHeader`; the data lane lands the regenerated seed
SQL (clears the 3 red tests); `e2e/local/workouts.spec.ts` / `tips.spec.ts` once the routes exist.

## 2026-10-05 — P3.1 `filterRecipes` + P3.4 `fridge/storage.ts` (PURE halves, pulled forward) — DONE (builder, worktree `wt/b`; not yet committed)

**Scope:** the React-free halves of P3.1 and P3.4 only — `src/recipes/filter.ts` + `filter.test.ts`, `src/fridge/storage.ts` +
`storage.test.ts`. No page, no dictionary keys, no routes (those remain the UI halves of P3.1/P3.4). `normalizeForSearch` is
REUSED from `src/fridge/match.ts` (P3.3), not duplicated.

**`src/recipes/filter.ts`:** `filterRecipes(recipes, { dietSlugs?, mealTypes?, query?, lang })` — any-of within each criterion,
all-of across them; empty/undefined criterion = match all; title match on the CURRENT language only (not ingredients — predictable
from what the card shows), accent- and case-insensitive via `normalizeForSearch` (`σαλατα` finds `Σαλάτα`, `GREEK` finds `greek`);
preserves input order; never mutates. `sortRecipes(recipes, lang)` — new array, code-point compare on the normalized localized
title, tie → slug (total order). URL state: `parseRecipeFilterParams(URLSearchParams, { knownDietSlugs? })` ↔
`serializeRecipeFilterParams(params): URLSearchParams` over `?diet=a,b&meal=lunch&q=…`; parse accepts commas AND repeated keys,
trims, dedupes, drops blanks, non-slug diet tokens (`/^[a-z0-9][a-z0-9-]*$/`), diets outside `knownDietSlugs` when supplied, and
non-`MealType` meals; serialize omits empty criteria (clean filter → `''`). Also `recipeTitle(recipe, lang)`, `isEmptyRecipeFilter`,
`RECIPE_FILTER_PARAM_KEYS`.

**`src/fridge/storage.ts`:** `FRIDGE_STORAGE_KEY = 'hygieia.fridge'`, `FRIDGE_STATE_VERSION = 1`, `FridgeState = { slugs, ignoreStaples }`,
`defaultFridgeState()` (fresh object; `{ slugs: [], ignoreStaples: true }`). Wire shape `{ v: 1, slugs, ignoreStaples }`.
`parseFridgeState(raw: unknown)` never throws: accepts the JSON string or an already-parsed value; junk JSON / non-object / `v !== 1`
→ default; otherwise each field validated independently (non-array slugs → `[]`, non-boolean `ignoreStaples` → `true`); slugs keep
non-blank strings, trimmed, first-seen order, duplicates dropped. `serializeFridgeState` dedupes too. `loadFridgeState(Pick<Storage,'getItem'>)`
→ default on throw; `saveFridgeState(Pick<Storage,'setItem'>, state)` → `false` on throw, `true` otherwise.

**Tests (62 new; suite 33 → 35 files, 1990 tests):** `filter.test.ts` (31) — fixtures + the REAL 152-recipe seed: any-of/all-of
semantics, Greek accent/case (`σαλατα`, `ΣΑΛΆΤΑ`, `φασολαδα` → `fasolada-white-bean-soup`), English case, language-exclusivity of
the match, whitespace collapse, no mutation, keto subset check on the seed, union ≥ each + corpus order preserved, every real
recipe found by its own full title in both languages; sort order EL/EN, slug tie-break, deterministic permutation on the seed;
parse (commas + repeated keys, dedupe, trim, unknown meal/diet drop, `knownDietSlugs`, junk never throws), serialize (empty → `''`,
dedupe), round-trip both directions incl. a Greek query and `a&b=c,d`. `storage.test.ts` (31) — constants, fresh default,
round-trip, 13-case junk table (null/undefined/number/boolean/empty string/junk JSON/JSON array/string literal/number literal/
array/no version/unknown version/string version → default), per-field validation, slug cleaning, extra keys, never-throws sweep
(Symbol/function/bigint/Date/RegExp), load/save through an in-memory storage, other keys untouched, throwing `getItem` → default,
throwing `setItem` → `false`, real jsdom `window.localStorage`; `normalizeForSearch` on the real titles (unaccented `φασολαδα`
finds `Φασολάδα`, upper/final-sigma agree, every title found by its stripped form).

**Gates (worktree, 2026-10-05):** `npm run lint` → `0 errors, 6 warnings` (all pre-existing `react-refresh/only-export-components`
in `AuthProvider.tsx` / `LangProvider.tsx` / `routes.tsx`; none in the new files), exit 0 · `npm run typecheck` clean, exit 0 ·
`npm test` → `Test Files 35 passed (35) · Tests 1990 passed (1990)`, exit 0 · `npm run build` green (`precache 24 entries`,
`dist/sw.js`), exit 0 · `npm run check:pwa` → `check:pwa OK — Hygieia · Υγίεια, 3 icons, sw.js present`, exit 0. Prettier
clean (`--write` reported all four files unchanged).

**Decisions (non-obvious, also for DECISIONS.md if the lead keeps them):** title-only search (ingredient names deliberately NOT
searched — PLAN §P3.1 wording + predictability); `parseFridgeState` is STRICT on version (`v !== 1` → default, no legacy
unversioned branch — no shipped data exists yet, so leniency buys nothing and a future bump gets an explicit migration branch);
`knownDietSlugs` is optional so the pure parser needs no catalogue and the page can tighten it once `contentSource` has loaded.

**Not done / next:** nothing committed (the lead merges `wt/b`). UI halves — `RecipesPage.tsx`, `RecipeCard.tsx`, `FridgePage.tsx`,
`IngredientPicker.tsx`, their page tests and the P3.1/P3.4 dictionary keys — are still open and consume these modules.

## 2026-10-05 — P5.4 Offline / PWA behaviour e2e — DONE (builder, worktree `wt/d`; not yet committed)

**Pulled forward** by the lead (depends only on the P3.6 Playwright harness, on main). Delivered ONLY
`e2e/local/offline.spec.ts` (+ this entry). PLAN's `/hygieia/recipes` + `/hygieia/diets` routes do not exist yet, so the
lead's substitute routes were used: `/hygieia/auth` (client-side) and a deep not-found link (hard load).

**The spec (1 test, 6 `test.step`s, serial by nature — a SW exists only after an online load installed it):**
(1) online `page.goto('/hygieia/')` 200 → `el.heroTitle`; `await navigator.serviceWorker.ready`, then `expect.poll` on
`navigator.serviceWorker.controller !== null` → **TRUE ON THE FIRST LOAD, no reload needed**: the generated `dist/sw.js`
calls `skipWaiting()` + `clientsClaim()` (vite-plugin-pwa `registerType: 'autoUpdate'`); a page-side `fetch('/hygieia/index.html?probe=…')`
returns 200 (the query misses the precache, so the SW passes it to the network — the probe proves the server is reachable).
(2) `context.setOffline(true)`; `navigator.onLine === false`. (3) client-side nav to `/hygieia/auth` via `history.pushState` +
`dispatchEvent(new PopStateEvent('popstate'))` (BrowserRouter listens to popstate) → `el.signInUnavailableTitle` + body, pathname
`/hygieia/auth`; back home over the REAL `el.backHome` link, still offline → hero. **No in-app link to `/auth` exists on the home
page in local-only mode** (`AccountMenu` renders nothing without an account service), hence pushState, as the task allowed.
(4) HARD `page.goto('/hygieia/')` offline → `response.status() === 200`, **`response.fromServiceWorker() === true`**, Greek hero,
`lang="el"`, `el.notMedicalAdvice`. (5) HARD `page.goto('/hygieia/some/deep/offline')` offline → 200 **from the service worker**
(`navigateFallback` = precached `index.html`; offline there is no Pages 404 document), `el.notFoundTitle` + `el.notFoundBody`, URL
untouched. (6) `context.setOffline(false)`; `navigator.onLine === true`; the probe fetch is 200 again; `backHome` click → hero;
`page.reload()` → hero + `el.switchTo` visible. Every string is a dictionary VALUE; the house `fixtures.ts` watchdog is in force.

**Fonts (documented deviation, as the task foresaw):** on the first run the watchdog recorded `Failed to load resource: net::ERR_FAILED`
for `https://fonts.googleapis.com/css2?family=Inter…&family=Literata…` on BOTH offline hard loads (steps 4 and 5). Root cause: the
runtime cache (`StaleWhileRevalidate` on fonts.googleapis.com) only fills when the SW CONTROLS the page, and on the first visit the
stylesheet is fetched before that — so it was never cached, the offline request hit the network, failed, and Chromium logged it. A
system-font fallback, not an app error. The spec therefore OVERRIDES the `consoleErrors` fixture (`base.extend` depending on the
original; Playwright inherits the original's `auto` — `node_modules/playwright/lib/common/index.js:1576`) and, after the test body
and BEFORE the house `toEqual([])`, splices out ONLY entries with `kind === 'console'`, text `/^Failed to load resource: net::ERR_/`
and url `^https://fonts.(googleapis|gstatic).com/`. Everything else (any other failed resource, any page error) still fails the test.
`e2e/support/fixtures.ts` was NOT touched. **Product observation for the lead (BRAIN §5 candidate):** the vite.config.ts comment
"renders Greek text offline after the first visit" is true only from the SECOND online page load onward; the first visit does not
prime the font caches. Not a P5.4 defect; noted, not fixed.

**Two false starts, both fixed without disables:** `{ auto: true }` on a fixture OVERRIDE is a TS2322 (the option is only legal on a
first registration) → dropped, `auto` is inherited; `react-hooks/rules-of-hooks` flagged Playwright's `use` callback as React's `use`
hook because the arrow is the named property `consoleErrors` → the callback parameter is named `provide`.

**RED-verification (the gate seen failing):** a scratch copy `e2e/local/offline-red.scratch.spec.ts` added
`await context.route('**/sw.js', (r) => r.abort())` before the first load and removed the controller wait → `E2E_PREBUILT=1 npx
playwright test … offline-red.scratch.spec.ts` → **1 failed**: steps 1–3 pass (client-side navigation needs no network), step 4
fails `Error: page.goto: net::ERR_INTERNET_DISCONNECTED at http://127.0.0.1:4173/hygieia/` (`offline-red.scratch.spec.ts:113`), and the
watchdog additionally reports the pageerror `TypeError: Failed to register a ServiceWorker for scope ('http://127.0.0.1:4173/hygieia/')
… An unknown error occurred when fetching the script.` Scratch deleted; `ls e2e/local` → `offline.spec.ts smoke.spec.ts`.

**Gates (2026-10-05, `D:/projects/hygieia-wt/d`):** `npm run build` green (`PWA v2.0.0 · generateSW · precache 24 entries (839.54 KiB)`),
`cmp dist/404.html dist/index.html` byte-equal · `E2E_PREBUILT=1 npm run e2e` → `tsc -p e2e/support/tsconfig.json` clean, `pages-server:
serving …\dist at http://127.0.0.1:4173/hygieia/ (Pages semantics)`, **8 passed (2.9s)**: smoke 1–7 + `offline.spec.ts:74 › the app
installs a service worker, then works offline: client-side nav, hard load, deep link (1.9s)` · `npm run lint` 0 errors (6 pre-existing
react-refresh warnings, none in e2e) · `npm run typecheck` clean · `npm test` **1966 passed** · `npx eslint` + `prettier --check` on the
spec clean. `git status` → only `?? e2e/local/offline.spec.ts`.

**Next:** lead merges `wt/d`; P5.QA.2 can tick "`offline.spec.ts` passes"; when `/hygieia/recipes` and `/hygieia/diets` exist (P3/P4),
extend step 3/5 to PLAN's original routes (one-line change each); consider recording the first-visit font-cache observation in BRAIN §5.

## 2026-10-05 — P6.1 Fleet telemetry behind `VITE_FLEET_*` (no-op without env) — DONE (builder, worktree `wt/e`; not yet committed)

**Pulled forward** by the lead (independent of P5). Donor is **Enodia** (`D:/projects/enodia-transit/src/lib/telemetry/*` +
`src/telemetry.ts`). The six modules were copied with `cp` and proven **byte-identical** with `cmp`: `types.ts`, `fingerprint.ts`,
`scrub.ts`, `rate-limit.ts`, `fleet-telemetry-server.ts`, `fleet-telemetry.ts`. Only the env NAMES changed, and only in the entry file
(PLAN §1.11): Enodia's `VITE_FLEET_TELEMETRY_URL/KEY` → Hygieia's `VITE_FLEET_URL`, `VITE_FLEET_KEY`, `VITE_FLEET_PRODUCT_ID`.
The donor's `index.ts` barrel was NOT lifted (not in scope; `src/telemetry.ts` imports `./lib/telemetry/fleet-telemetry` directly).
The `?__fleet_test=1` production hook floated in P6.QA.4 was NOT added (lead rejected it; QA throws from DevTools).

**Contract delivered (`src/telemetry.ts`):** `startTelemetry()` reads the three names each by full literal `import.meta.env.<NAME>`
(declared in `src/lib/env.ts` `ImportMetaEnv`; already allow-listed in `eslint.config.js`), via a pure `resolveFleetEnv(raw)`
(any name unset/blank after trim → `null`). Off → returns a no-op disposer with ZERO side effects: `window.onerror` /
`onunhandledrejection` untouched, no fetch. On → `initFleetTelemetry` installs both hooks CHAINING the previous handler, scrubs
(donor scrubber: JWT / PEM / Bearer / provider keys / `key=value` / email / IPv4 / CC / phone), computes the `fingerprint` over the
SCRUBBED message + top stack frame BEFORE any network call, routes through the storm batcher (coalesce same fingerprint 10 s, flush
1.5 s or 50 rows, queue cap 500 with counted drops) and bulk-POSTs `<VITE_FLEET_URL>/rest/v1/fleet_errors` with headers `apikey` +
`Authorization: Bearer <write-only key>` + `Prefer: return=minimal`, `keepalive`. `getContext()` supplies ONLY `{ page: location.pathname,
lang: document.documentElement.lang }`; the scrubber's allow-list (`role`/`page`/`action`) keeps `page` and drops `lang` on the wire
(fleet contract; `lang` stays supplied as the lead specified). Init failure never escapes (`try` around resolve + init; a window whose
`onerror` setter throws is tested). `src/main.tsx` calls `startTelemetry()` once, before `createRoot(...).render`.

**Tests (new, 66 across 5 files; suite now 30 files / 681 tests):** `src/telemetry.test.ts` (15): all three blank via `vi.stubEnv` → both
hooks stay `null`, zero fetch; each single name blank → same; pre-existing `onerror` untouched when off; all set via `vi.stubEnv` +
`startTelemetry()` → both hooks installed; a thrown `Error` carrying a planted email + a planted `sk-…` token (assembled at runtime, the
repo secret scan rejects the literal) → after the 1.5 s fake-timer flush EXACTLY ONE `fetch` to
`https://fleet.example.supabase.co/rest/v1/fleet_errors`, `POST`, correct headers, body = 1-row array with `product_id`, `source: client`,
`severity: error`, `environment`, base36 `fingerprint` equal to `fingerprint({product_id, scrubbed message, scrubbed stack})`,
`user_context_json = { page }`; the wire body contains neither planted value, matches no email regex and no `sk-` token regex, and shows
`[REDACTED_EMAIL]` + `token=[REDACTED]`; the previous `onerror` is still called with the same `Error`; the disposer restores it; `fetch`
undefined → neither init nor capture+flush throws; a throwing `onerror` setter → init does not throw. Lifted donor tests verbatim:
`fingerprint.golden.test.ts` (8), `fingerprint.test.ts` (14), `rate-limit.test.ts` (12), `scrub.test.ts` (17; the donor's real operator
email/phone fixtures replaced by `someone@example.com` / `+30 210 000 0000` — Hygieia is a PUBLIC repo; assertions unchanged).

**Golden fingerprints pinned (fleet-wide STORED KEY — the separator is `\u0000`; a change here re-keys every BRAIN §8 ledger row, it is
never a test to update):** `{ab, c, ''}` → `2ms8kdh0a0y6d` · `{a, bc, ''}` → `z371mcjwee0p` · `{92864d31, "TypeError: x is not a function",
"    at foo (/a/b.ts:1:2)"}` → `15n3u2i5k5rxn` · `{'', '', ''}` → `4hk40ymxlq0d` · `{p, "Cannot read properties of undefined (reading
'id')", "at R (/x.js:9:1)"}` → `xrbxwyc9qpv2` · `{unicode, "héllo — ✓", "at Ω (/u.ts:3:3)"}` → `2axw4kq0vfxo3` · `{nums, "failed after
1234ms at 0x7ff", "at n (/n.ts:1:1)"}` → `1jumjk618j1vf`. All seven are the donor's own vectors and pass against the byte-identical copy.

**Gates (2026-10-05, worktree `D:/projects/hygieia-wt/e`):** `npm run lint` 0 errors (6 pre-existing react-refresh warnings in
`AuthProvider.tsx`, `LangProvider.tsx`, `routes.tsx`; none in the new files) · `npm run typecheck` clean · `npm test` **30 files / 681
tests green** · `npm run build` green · `check:bundle: OK, no secret-looking value or server-only name in 10 files (566540 bytes) in dist` ·
`check:pwa OK — Hygieia · Υγίεια, 3 icons, sw.js present`. Prettier clean on every touched file (`src/lib/env.ts` is checked out CRLF by
autocrlf — index is LF — so `prettier --check` on the working copy warns on line endings only; LF-normalised content passes).

**Real artifact exercised:** the production bundle `dist/assets/index-*.js` ships the catcher (`rest/v1/fleet_errors` ×1,
`onunhandledrejection` ×4, the `[REDACTED_*]` markers). Built with no env, `import.meta.env.VITE_FLEET_*` inlined to `void 0` and the
three `VITE_FLEET_*` strings appear ONLY as property names (`RawFleetEnv` keys, same as the pre-existing `VITE_SUPABASE_*` names) — no
value, so the deployed site runs telemetry OFF until OP6.a sets the repository variables and P6.4 wires them into the build.

**For the lead → DECISIONS.md / BRAIN (out of this task's file scope):** (1) `lang` is supplied by `getContext()` as specified but is
NOT an allow-listed context key in the fleet scrubber, so it never reaches the dashboard — either accept (page only) or extend
`ALLOWED_CONTEXT_KEYS` fleet-wide in Zeus first (it is a fleet contract, not a Hygieia choice). (2) `startTelemetry()` returns a
disposer (no-op when off) so tests restore handlers; `main.tsx` ignores it. (3) The BRAIN §8 ledger header can be created at P6.5.

**Not done / next:** nothing committed (the lead merges `wt/e`). P6.QA.4 uses DevTools `throw new Error('fleet-smoke')` on the deployed
site once OP6.a + P6.4 land; the first ledger row goes to BRAIN §8 then.

## 2026-10-05 — P6.3 Live smoke `npm run smoke:live` — DONE (builder, worktree `wt/d`; not yet committed)

**Pulled forward** by the lead (independent). HTTP only, no browser: `scripts/smoke-live.mjs` exercises the DEPLOYED
artifact at `SMOKE_BASE_URL` (default `https://intotheveil.github.io/hygieia/`, trailing slash normalised; a positional
arg overrides) and, when `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` are in the shell, the real backing service as anon.
Reuses `scanText`/`formatFinding` (P6.2) on every served script and stylesheet, and `REST_PROBES`/`restProbe`/
`classifyRestAnswer`/`parseRestBody` (P2.6) for the backend; `redact` (mgmt-api) scrubs the anon key from every line.

**Probes** (one `PASS`/`WARN`/`FAIL` line each; all run, the summary names the FIRST failure): `GET /` 200 with
`<html lang="el"`, `<title>Hygieia · Υγίεια</title>`, `<div id="root">`, `rel="manifest"` · `manifest.webmanifest` 200 JSON
with `start_url`+`scope` `/hygieia/`, `display standalone`, ≥ 3 icons, each icon → 200 `image/png` (resolved relative to the
manifest URL) · `sw.js` 200 JavaScript · `registerSW.js` 200 · `recipes/deep-link-probe-<random>` → 404 AND the SPA document
(200 = "server is NOT Pages-like"; bare 404 = "404.html missing or not index.html") · `favicon.svg` 200 `image/svg+xml` ·
every `<script src>` / `<link rel="stylesheet">` index.html references (either attribute order, external ones included)
→ 200 and zero `scanText` findings · `brand/og-hygieia.jpg` 200. Backend: approved recipes → 200 array, ≥ 1 row PASS
`approved rows: N`, 0 rows **WARN not FAIL** (approval is OP4.b) · pending → `200 []` · profiles → `200 []`; without the env
exactly `SKIPPED (backend) — set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY`. Per-request timeout 15 s via AbortController
(`request to <url> timed out after 15000 ms (no response)`). Ends `SMOKE PASSED — N probes against <base> (<ms> ms)` exit 0
(`· k WARN` appended when any), or `SMOKE FAILED — <first failing probe> (+n more) (k of N probes ok, ms)` exit 1 on stderr;
usage / malformed base URL → exit 2, nothing sent. Exported `runSmoke({ baseUrl, env, fetch, log, error, timeoutMs,
probeToken })` + `main(argv, opts)`; the CLI sets `process.exitCode`, never `process.exit()`. No .env is read.

**Files:** `scripts/smoke-live.mjs` (new), `scripts/smoke-live.test.ts` (new, 38 tests, node env, fake Pages-like site +
fake PostgREST, no network: every probe's pass AND fail path — wrong lang, missing title/root/manifest link, non-200 home,
wrong `start_url`/`scope`/`display`, < 3 icons, icon 404 / wrong type, relative+absolute icon paths, sw.js 404 / wrong type
(`text/javascript` accepted), registerSW 404, deep link 200 → NOT Pages-like, deep link bare 404, 404 without manifest link,
302, favicon 404 / wrong type, og 404, planted `service_role` / `sbp_…` PAT / `SUPABASE_SERVICE_ROLE_KEY` in served chunk → FAIL
with masked excerpt and the value absent from output, asset 404 (incl. the external stylesheet), no-asset document, backend
skipped without env (zero backend requests), 17 probes with env + headers `apikey`/`Authorization: Bearer`/`Accept-Profile:
hygieia` only on backend calls, 0 approved → WARN exit 0, pending rows → FAIL, profiles rows → FAIL, PGRST106 classified,
anon key redacted from an echoed error, malformed `VITE_SUPABASE_URL`, timeout, network error, first-failure summary,
base URL normalisation, `SMOKE_BASE_URL` env, usage exit 2 in-process and via a real `spawnSync` of the CLI),
`package.json` (`"smoke:live": "node scripts/smoke-live.mjs"`). Nothing else touched.

**Decisions (small, recorded here):** the external Google Fonts stylesheet index.html references IS probed (200 + scan) —
the site depends on it, so its absence is a real user-facing failure; the pending/profiles probes reuse `REST_PROBES`
verbatim (`select=id` for pending, as P2.6 defined) rather than restating the paths; the deep-link token is random per run
(injectable `probeToken` for the tests) so a CDN cache can never answer it from a prior run.

**Live run (`npm run smoke:live`, no backend env, 2026-10-05T20:43:23Z, worktree `wt/d`):**

```
smoke:live — HTTP only · https://intotheveil.github.io/hygieia/ · timeout 15000 ms per request
PASS  GET / → 200, lang="el", title "Hygieia · Υγίεια", #root, manifest linked
PASS  GET manifest.webmanifest → 200, start_url + scope /hygieia/, display standalone, 3 icons
PASS  GET icon icons/pwa-192.png → 200 image/png
PASS  GET icon icons/pwa-512.png → 200 image/png
PASS  GET icon icons/maskable-512.png → 200 image/png
PASS  GET sw.js → 200 application/javascript
PASS  GET registerSW.js → 200 application/javascript
PASS  GET recipes/deep-link-probe-p0ebzyen → 404 with the SPA fallback document (#root + manifest link)
PASS  GET favicon.svg → 200 image/svg+xml
PASS  GET script /hygieia/assets/index-BCspQXd6.js → 200, 490609 chars, no secret-looking value or server-only name
PASS  GET script /hygieia/registerSW.js → 200, 150 chars, no secret-looking value or server-only name
PASS  GET stylesheet https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Literata:opsz,wght@7..72,500;7..72,600;7..72,700&display=swap → 200, 1633 chars, no secret-looking value or server-only name
PASS  GET stylesheet /hygieia/assets/index-41Tt-kr4.css → 200, 18681 chars, no secret-looking value or server-only name
PASS  GET brand/og-hygieia.jpg → 200 image/jpeg
SKIPPED (backend) — set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
SMOKE PASSED — 14 probes against https://intotheveil.github.io/hygieia/ (2308 ms)
```

exit 0. This is the current deployed P0/PWA artifact (bundle `index-BCspQXd6.js`); the backend probes have not yet been run
live — they need the anon env (OP2.c) and are P6.4's / P6.QA step 2's observable.

**Gates (2026-10-05, `wt/d`):** `npm run lint` 0 errors (6 pre-existing react-refresh warnings) · `npm run typecheck` clean ·
`npm test` 29 files / 1412 tests green (38 new) · `npm run build` green · `check:pwa OK — Hygieia · Υγίεια, 3 icons, sw.js present` ·
`npm run smoke:live` → `SMOKE PASSED — 14 probes` exit 0 (above).

**Not done / next:** nothing committed (the lead merges `wt/d`). P6.4 wires the `VITE_*` repository variables into the
Pages build; after it, `smoke:live` with the anon env is the proof that the deploy is in configured mode (approved rows ≥ 1,
pending `[]`, profiles `[]`). `DECISIONS.md`/`BRAIN.md` were out of this task's declared scope — the three small decisions above
are for the lead to lift if judged durable.

## 2026-10-05 — P1.12 Seed generator + generated seed migrations + `seed:check` — DONE (builder, worktree `wt/a`; not yet committed)

**What:** `scripts/gen-seed-sql.mjs` replaces the P1.1 stub. It imports the TS seed modules by `.ts` path (node 24 type
stripping) and renders ONE seed migration per kind — all six kinds now (P4.8/P4.9's generator notes are pre-implemented):
`ingredients` → `20261006000500_hygieia_seed_ingredients.sql`, `diets` → `…000600_…_diets.sql`, `recipes` (+ `recipe_ingredients`,
`recipe_diets`) → `…000700_…_recipes.sql`, `exercises` → `…000800_…_exercises.sql`, `workouts` (+ `workout_template_exercises`) →
`…000900_…_workouts.sql`, `tips` → `…001000_…_tips.sql`. `workouts.ts` does not exist yet, so that kind is **skipped** with a printed
`skipped: workouts.ts not present yet` line and `seed:check` ignores its missing file (a PRESENT file for an absent module is `stale`).
`npm run seed:gen` writes; `npm run seed:check` regenerates to memory and exits 1 naming any file that `differs` / is `missing` /
`extra` (LF-normalised byte compare), 0 when identical. `--only kind,kind` restricts both. Exit code via `process.exitCode`, never
`process.exit()`. In-process API: `generate`, `compare`, `renderKind`, `main(argv, io)`.

**Contract honoured:** `id = md5('hygieia:<table>:<slug>')::uuid` from `crypto.createHash('md5')` formatted 8-4-4-4-12 (test proves it
equals PGlite's `md5(...)::uuid` and the catalogue's `sid`); children resolve `recipe_id` / `ingredient_id` / `diet_id` / `template_id` /
`exercise_id` by the same formula, and an unresolvable slug THROWS at generation (never a runtime FK violation); `status` omitted →
`pending`; rows sorted by slug (code-unit), children by parent slug then position (recipe diet tags by diet slug); integers as-is,
decimals `toFixed(6)` stripped; `array['a','b']::text[]` / `'{}'::text[]`; `null`; `'YYYY-MM-DD'::date`; `'` doubled; batches ≤ 200 rows;
`on conflict (<pk>) do nothing` on every statement (idempotent-safe — the gate applies the archive twice); header names generator,
source module and row counts, no timestamp.

**Generated (this run):** ingredients **322** · diets **16** · recipes **91** (+ recipe_ingredients **728**, recipe_diets **513**;
`recipes/group2.ts` is still the empty stub — regenerate when that lane lands) · exercises **136** · health_tips **75** · workouts
skipped. 5 files, 613 KB, all pass `npm run db:check` (9 migrations).

**Gate (`scripts/db-gate/catalogue.mjs`):** new `SEED_COUNTS` (ingredients ≥ 160, diets ≥ 8, recipes ≥ 40, exercises ≥ 60,
health_tips ≥ 30, workout_templates **= 63**) and `SEED_CHILD_COUNTS` (recipe_ingredients, recipe_diets, workout_template_exercises
≥ 1), asserted per table as `seeded rows (slug not like 'fx-%') >= N` / `seeded child rows (under non-fixture parents) >= 1` — the
`fx-` fixture rows (inserted AFTER the archive) are excluded. The two workout tables carry `pendingTask: 'P4.8'`: ZERO seeded rows
PASS with an explicit "not seeded yet … binds once seeded" note; any non-zero count is asserted (= 63 / ≥ 1). The existing md5-id
check (one `count(*) where id <> md5(...)::uuid` query per table, no loop) now bites on every seeded row.

**Tests:** `scripts/gen-seed-sql.test.ts` (**35 tests**, `// @vitest-environment node`): `O'Brien` → `O''Brien`; number / int / array /
date / bool literals incl. `'{}'::text[]`; batching (450 rows → 3 statements); id formula vs known vector (`md5('hygieia:recipes:x')` =
`a64ec8c3-d20e-c1a2-eeb8-7acf55785a09`), vs `sid`, vs PGlite for 5 slugs; child FK literal = parent id / referenced id; diet tags sorted;
unresolvable slug / half note pair / duplicate slug / malformed slug / dose-less workout slot all throw; input-order independence;
two full `generate()` runs byte-equal; every generated file passes `checkMigrationSql`; committed archive identical to a fresh
generation; `main(['--check'])` → 0; `--check` → 1 naming `…seed_tips.sql` after a one-character change in a TEMP copy of `tips.ts`;
missing / extra / stale file cases; a kind whose `needs` module is absent is an error, not a skip.

**Observables (worktree, 2026-10-05):** `npm run seed:gen` → 5 files written, `git status --short supabase/migrations` shows the 5 new
`??` files · `npm run seed:check` → `OK — 5 seed migration(s) identical`, exit 0 · one-word edit to `tips.ts` → `differs
20261006001000_hygieia_seed_tips.sql`, `FAIL — 1 file(s) out of step`, exit 1; `git checkout` restore → exit 0 · `npm run db:check` →
`PASS migration guard: 9 migration(s)`, exit 0 · **`npm run db:gate` → GATE PASSED — 226 checks green, 3 s wall** (was 217 before the
floors; seeds applied twice), with `… 325 rows checked, 0 off-formula` / 18 / 93 / 138 / 77 and every `(P1.12 reference count)` line PASS
· **`npm run db:gate:prove-red` → PROVE-RED PASSED 25/25, control GREEN 227 PASS, wall 23.9 s** (`seed-random-id` still RED on its
expected line) · lint 0 errors (6 pre-existing react-refresh warnings in `src/auth`, `src/i18n`, `src/routes` — not this task) ·
typecheck clean · `npm test` **27 files / 1386 tests green** (9 s) · build green · `check:pwa OK`.

**Deviation (out of declared scope, flagged for the lead):** `scripts/db-gate-prove-red.mjs` — four `expect` regexes pinned
fixture-only row totals (`of 2; read 2, pending 1`, `4/4`, `pending 1`, `3 rows checked`) that are false once the seeds are in the
archive; without the change the lead's own acceptance ("prove-red still PASSED") is unreachable. Each regex now keeps the
sabotage's SIGNATURE exact and lets only the seed-dependent total float: `of (\d+); read \1, pending [1-9]\d*`, `(\d+)\/\1 (approved
parents: 2)`, `pending [1-9]\d*`, `\d+ rows checked, 1 off-formula`. Nothing else in that file changed. Revert = 4 lines.

**Landmine for P4.8 (not fixed here):** the gate fixture inserts `fx-home-beginner-low` (home/beginner/low) and
`fx-gym-intermediate-moderate` (gym/intermediate/moderate) into `workout_templates`, which has `unique (workout_type, level,
intensity)`. When `workouts.ts` ships all 63 cells, the fixture insert will collide and `fixture seeded` goes red. P4.8 must move the
fixture rows off real cells (e.g. a fixture-only combination is impossible — all 63 are real) or make the fixture skip/upsert them.

**Next:** lead merges `wt/a` (do not commit here). When `recipes/group2.ts` or `workouts.ts` lands: `npm run seed:gen && npm run
seed:check` — the generated files change and must be re-committed with the content. P1.13 (`ContentSource`) and P1.14 are independent.

## 2026-10-05 — P1.13 `ContentSource` layer: bundled + supabase, schema-pinned client, draft ribbon — DONE (builder, worktree `wt/c`; not yet committed)

**Delivered** (PLAN §1 item 5, task P1.13):

- `src/content/source.ts` — the contract: `ContentSource { kind; listIngredients; listDiets; listRecipes(filter?);
getRecipe(slug); listExercises; listWorkoutTemplates; getWorkoutTemplate(type, level, intensity); listTips }`, every
  method `Promise<Result<T>>` (`{ ok, data } | { ok: false, error: 'network' | 'unknown' }`), never throws. Row types =
  seed + `{ id, status }` (`Ingredient`, `Diet`, `Exercise`, `HealthTip`); `Recipe` adds `lines: { line, ingredient | null }[]`,
  `WorkoutTemplate` adds `slots: { block, exercise | null }[]`. Because a `Recipe` IS a `RecipeSeed`, the pure engines
  (fridge matcher, nutrition, cost) take rows unchanged. `filterRecipes` / `matchesRecipeFilter` shared by both impls
  (`dietSlugs` = union; empty/absent = all).
- `src/content/bundled.ts` — `createBundledSource(seeds)` + `bundledSource` over the real seed modules; every row
  `status: 'pending'`, `id = seedId(table, slug) = hexToUuid(md5('hygieia:<table>:<slug>'))` — byte-equal to the
  migration's `md5(...)::uuid`. Lines/slots resolved by slug once, lazily. Imports `./seed/workouts.ts`, which did NOT
  exist: added as a `// STUB — replaced at merge` module exporting `WORKOUT_TEMPLATES: readonly WorkoutTemplateSeed[] = []`
  (same pattern as the recipes group stubs; the P4.8 lane's file replaces it).
- `src/content/md5.ts` — pure-TS RFC 1321 MD5 (`md5`, `md5Bytes`, `hexToUuid`), no dependency (Web Crypto has no MD5).
- `src/content/supabase.ts` — `supabaseSource(client)` / `supabaseSourceFor(adapter)`; every query carries
  `.eq('status', 'approved')` (defence in depth over RLS), embeds `recipe_ingredients(*, ingredient:ingredients(*))`,
  `recipe_diets(diet:diets(slug))`, `workout_template_exercises(*, exercise:exercises(*))`; `getRecipe`/`getWorkoutTemplate`
  via `maybeSingle()`. Typed adapter `contentClientFor` (same TS2589 avoidance as `profileClientFor`). Rows parsed
  defensively by `Spec<T>` (a `Kind` per key; `numeric` accepted as number or numeric string); a bad row → `unknown`;
  thrown `TypeError` / code-less error → `network`; children sorted by `position`; hidden child embed → `null`.
- `src/content/db-types.ts` — `Database` for schema `hygieia`: Row/Insert/Update + Relationships for all 13 §2 tables
  (content, children, profiles, per-user, `schema_migrations`), columns transcribed from the four migrations.
- `src/content/index.ts` — `contentSource = appEnv.mode === 'configured' && supabase ? supabaseSource(supabase) : bundledSource`.
- `src/lib/supabase.ts` — `CLIENT_OPTIONS.db = { schema: 'hygieia' }`; `createClient<Database, 'hygieia'>(…)`. **The fully
  typed client compiles against `auth/profile.ts` and `user/supabase.ts` unchanged** — no fallback to an untyped client.
- `src/components/DraftRibbon.tsx` — `<DraftRibbon kind status?>` + `isDraft()`; renders `role="note"` with `draftRibbon`
  - `draftRibbonHint` when `kind === 'bundled'` or `status !== 'approved'`; nothing for an approved row / no row under supabase.
- `src/i18n/dictionary.ts` — `draftRibbon` ("Draft — awaiting review" / "Πρόχειρο — εκκρεμεί έλεγχος"), `draftRibbonHint`,
  appended at the end under `// content source (P1.13)`.
- Tests: `src/content/md5.test.ts` (24 node-crypto vectors incl. padding boundaries + UTF-8), `src/content/source.test.ts`
  (bundled ≥ 160/8/40, EVERY recipe line resolves, ids match the formula with a hand-computed vector, vegan filter, unknown
  slug → `ok(null)`, fixture source for workouts/unresolved slugs/union filter; supabase fake recording the exact
  `from().select().eq()…maybeSingle()` chain: approved on every list, embed strings, key filters, row mapping incl. hidden
  ingredient, TypeError → `network`, coded error → `unknown`, malformed row → `unknown`; contract "never rejects" for both),
  `src/components/DraftRibbon.test.tsx` (both strings per language; nothing for approved/supabase), `src/lib/supabase.test.ts`
  (`CLIENT_OPTIONS.db.schema === 'hygieia'`, PKCE kept, `clientFor` local → null).

**Gates (2026-10-05, in `wt/c`):** `npm run lint` 0 errors (7 pre-existing-pattern react-refresh warnings, one new for `isDraft`
exported beside the component — same pattern as `LangProvider`) · `npm run typecheck` clean · `npm test` **30 files, 1414 tests
green** · `npm run build` green (chunk-size warning is pre-existing; seed data is NOT in the bundle — nothing imports
`contentSource` yet) · `npm run check:pwa` OK.

**Notes for the lead:** (1) `src/content/seed/workouts.ts` is a stub to be REPLACED by the P4.8 file at merge, like the recipes
group stubs. (2) BRAIN.md §5 candidates (not edited — out of this task's scope): "Database Row/Insert types must be `type`
aliases, not `interface`s, or supabase-js collapses `Insert` to `never`"; "`src/**` tests have no node types — no `node:crypto`
in Vitest jsdom tests, pin vectors instead". (3) `listRecipes` diet filter is a UNION (DECISIONS.md) — P3.1 should match.

## 2026-10-05 — P6.2 Bundle secret scan `npm run check:bundle` — DONE (builder, worktree `wt/e`; not yet committed)

**Pulled forward** by the lead (independent of P5). Lifted from Themis `scripts/check-bundle-secrets.mjs`, reshaped to the
lead's contract: `scanText(text, { file })` (pure, exported for P6.3's live smoke), findings carry `offset` + `line:col`,
values are masked to the FIRST 6 CHARS + `…` (a forbidden NAME is not a secret and prints in full), the CLI sets
`process.exitCode` and never calls `process.exit()` (`main(argv, io)` is exported and tested in-process).

**Rules (on every TEXT file in `dist/` — `.html .htm .js .mjs .cjs .css .json .webmanifest .map .svg .txt .xml`; images skipped):**
`secret-value` = `sk-ant-` `sk_live_` `sk_test_` `whsec_` `sbp_` `sb_secret_` followed by ≥ 1 key char, not glued to a preceding
identifier char · `aws-key-id` = `AKIA|ASIA` + 16 `[0-9A-Z]` · `private-key` = `-----BEGIN [A-Z0-9 ]*PRIVATE KEY-----` ·
`service-role` = the literal · `service-jwt` = a JWT whose decoded payload has `"role":"service_role"` · `forbidden-name` =
`ANTHROPIC_API_KEY` `OPENAI_API_KEY` `HYGIEIA_ANTHROPIC_API_KEY` `HYGIEIA_OPENAI_API_KEY` `SUPABASE_SERVICE_ROLE_KEY`
`SUPABASE_ACCESS_TOKEN` `HYGIEIA_SUPABASE_PROJECT_REF` (whole word; = `eslint.config.js` `SERVER_SECRET` bare + `HYGIEIA_` +
the two `db:apply` names). NOT findings, each asserted by a test: an anon-role JWT, an authenticated-role JWT, `sb_publishable_…`,
`pk_live_/pk_test_`, every allowed `VITE_*` name, a bare prefix with nothing after it. Exit 0 `check:bundle: OK, no secret-looking
value or server-only name in <N> files (<bytes>) in dist` · exit 1 on any finding (each as `file:line:col (offset N)  [rule]  excerpt
(len chars)` then `FAIL: n finding(s)`) · exit 2 when `dist/` is missing or holds no text file, message says run `npm run build` first.

**Delivered:** `scripts/check-bundle-secrets.mjs` · `scripts/check-bundle-secrets.test.ts` (`// @vitest-environment node`, **60 tests**:
every prefix RED + masked; planted `sbp_` token masked to `sbp_PL…`; service-role JWT found by decoding (precondition: the literal is
absent from the text) and neither the token nor its payload segment leaks; anon / authenticated / role-less / non-JSON JWTs clean;
AWS id RED + look-alikes GREEN; four PEM kinds RED, PUBLIC KEY / CERTIFICATE GREEN; all 7 names RED once + whole-word + the 5 public
names GREEN; `scanDir` on a dist-shaped temp fixture: clean → 3 text files counted (PNG not), planted `.js`/`.map`/`.json` found with
forward-slash relative paths, a secret inside a PNG is NOT scanned, missing / file / empty / images-only → throws; `main` in-process
returns 2 / 0 / 1 with the exact lines; CLI via `spawnSync` exits 2 / 2 / 0 / 1; **the REAL build**: `beforeAll` runs
`npm run build` (local-only env), `scanDir(dist)` → ≥ 5 files, zero findings, and `node scripts/check-bundle-secrets.mjs` with no
argument prints exactly the OK line) · `package.json` (`"check:bundle": "node scripts/check-bundle-secrets.mjs"`) ·
`.github/workflows/deploy.yml` (one step after `npm run build`, before `npm run check:pwa`, with a 3-line comment).

**Gates (2026-10-05, `D:/projects/hygieia-wt/e`):** `npm run lint` 0 errors (6 pre-existing react-refresh warnings in
`src/i18n/LangProvider.tsx`, `src/routes/routes.tsx`; none in scripts/) · `npm run typecheck` clean · `npm test` **24 files / 605 tests**
green (545 before + 60) · `npm run build` green (`precache 24 entries (830.17 KiB)`) · `npm run check:bundle` →
`check:bundle: OK, no secret-looking value or server-only name in 10 files (556961 bytes) in dist`, exit 0 ·
`check:pwa OK — Hygieia · Υγίεια, 3 icons, sw.js present` · `prettier --check` clean on the 4 touched files.

**Ran the real thing (§5), red paths on a scratch COPY of `dist/` with one planted chunk, then deleted:**
`assets/leak-chunk.js:1:10 (offset 9)  [secret-value]  sbp_PL… (25 chars)` ·
`assets/leak-chunk.js:2:10 (offset 46)  [service-jwt]  eyJhbG… (73 chars)` ·
`assets/leak-chunk.js:3:10 (offset 131)  [forbidden-name]  SUPABASE_ACCESS_TOKEN (21 chars)` ·
`check:bundle: FAIL: 3 finding(s) in the public bundle, 11 files (557115 bytes) in …/leak.` → **exit 1**; empty dir →
`… has no text file to scan (empty build?). Run \`npm run build\` first.`→ **exit 2**; missing dir →`… does not exist. Run \`npm run
build\` first.` → **exit 2**. The planted value never appeared unmasked in any output line.

**Decisions / notes (for the lead → DECISIONS.md / BRAIN §5; both files out of this task's scope):**

- `sb_secret_` (Supabase secret API key) is in the prefix list though the lead's list omitted it: it is the server twin of
  `sb_publishable_`, exactly the key the anon-key allow-list must not let through. `rk_live_/rk_test_` (Stripe restricted) dropped —
  Hygieia has no Stripe.
- **supabase-js ships the bare literal ``startsWith(`sb_secret_`)`` in the real bundle** (`dist/assets/index-*.js`). Only the
  "prefix + ≥ 1 key character" rule keeps the real build green; a naive `grep sb_secret_` would be a permanent false positive.
  Asserted by a test on that exact snippet.
- **Gotcha:** the crew's `secret-scan.sh` PostToolUse hook blocks any COMPLETE `-----BEGIN … PRIVATE KEY-----` literal in a
  written file, test fixtures included. The test assembles the header at runtime (`pemHeader(kind)`); the scanner's regex passes
  because `[A-Z0-9 ]*` sits where the hook expects `[A-Z ]*`.
- Text-only scan (extension allow-list) per the lead's contract, so `files`/`bytes` in the OK line count text files only; Themis
  scans every byte as latin1. A secret inside a PNG is therefore NOT a finding here — asserted, so nobody mistakes it for a bug.
- The real-build test spawns `npm run build` (~5 s) inside `npm test`; the suite went 7.4 s total. Acceptable; if it ever hurts,
  gate it on `E2E_PREBUILT`-style env rather than removing it — the scan is only worth anything against the real artifact.

**Not done / next:** nothing committed (the lead merges `wt/e`). P6.3 imports `scanText` from `./check-bundle-secrets.mjs`
(signature `scanText(text, { file })` → `Finding[]`, pure). `G6` = `G3 && npm run check:bundle` is now runnable.

## 2026-10-05 — P4.8 (data + domain half) workout templates seed + session resolver — DONE (builder, worktree `wt/d`; not yet committed)

The DATA + DOMAIN half of P4.8: the 63 templates and the resolver with their tests. The `/workouts`
page, `gen-seed-sql.mjs` kinds, migration `…000900_hygieia_seed_workouts.sql`, `catalogue.mjs`
counts, dictionary keys and `e2e/local/workouts.spec.ts` are NOT in this entry — they belong to the
UI lane that follows.

- `src/content/seed/workouts.ts` — `export const WORKOUT_TEMPLATES: readonly WorkoutTemplateSeed[]`,
  **exactly 63 rows**, one per `WORKOUT_TYPES × LEVELS × INTENSITIES`, ordered as the enums list
  them; `slug = <type>-<level>-<intensity>`. **579 block items** in total, every `exercise_slug`
  from the P4.7 library (131 of the 136 exercises appear; unused: `threshold-run-2x15min`,
  `long-run-easy`, `over-under-intervals`, `threshold-ride-2x20min`, `long-endurance-ride` — the
  long/threshold efforts that do not fit beside intervals in one session), always of the template's own type and at
  or below its level; no exercise repeats inside a template. Authored from a per-(type, level)
  design table (`DESIGN`) of warm-up / main / cool-down `ItemSpec`s whose numbers are either fixed
  or `[low, moderate, high]` tuples: strength (`home`/`gym`/`calisthenics`) = sets 2/3/4, lifts 8/10/12
  reps, bodyweight 10/12/15, skills (pull-ups, dips, pistols) 5/6/8, holds 30/40/50 s, rest 90/60/45 s;
  endurance (`running`/`swimming`/`cycling`) = more and longer efforts with shorter recoveries
  (all `seconds`-based); mobility = 1/1/2 rounds × 30/40/50 s. Warm-ups are `seconds`-based
  (gym/calisthenics add one light `activate` reps set), stretches are 2 sides × 30 s at every
  intensity. `duration_min` is ESTIMATED from the blocks (sets × (seconds | reps × 3 s) + rest, plus
  30 s transition per movement) rounded up to 5 min: home 25→55, gym 30→55, calisthenics 20→45,
  running 35→65, swimming 20→65, cycling 40→80, mobility 10→30 — monotone with intensity in every
  (type, level). Titles `"Home · Intermediate · High intensity"` / `"Σπίτι · Μεσαίο · Υψηλή ένταση"`
  (`Calisthenics` stays Latin in `el` per PLAN §0; the rest of the title is Greek). Notes = 3
  sentences composed per template: WHO (21 type×level pairs, EN+EL), SCALE (3 families × 3
  intensities) and the common STOP line (sharp pain / dizziness / chest discomfort → stop; see a
  doctor first if you have a condition). Erasable syntax; imports verified under plain
  `node --input-type=module` (type stripping).
- `src/content/seed/workouts.test.ts` (**14 tests**): exactly 63 · unique slugs = `<type>-<level>-<intensity>`
  and `SLUG_RE` · every combination exactly once · enum values only · every slug resolves in `EXERCISES` ·
  exercise type = template type · exercise level ≤ template level · no repeat within a template · ≥ 1
  warm-up / ≥ 3 main / ≥ 1 cool-down with block index never decreasing along the array · sets ≥ 1,
  rest ≥ 0, reps XOR seconds (both ≥ 1 when set) · `duration_min` ∈ [10, 90] and non-decreasing
  low → moderate → high per (type, level) · strength main-block set totals strictly increase with
  intensity · locale pairs non-blank, Greek script in `title_el`/`notes_el`, none in `title_en` ·
  notes ≥ 2 sentences ending in the stop line in both languages.
- `src/workouts/session.ts` — pure domain. `templateFor(templates, type, level, intensity)` → the
  matching template or `null`; `resolveSession(templates, exercises, type, level, intensity)` →
  `{ template, blocks: { block, items: { exercise, sets, reps, seconds, rest_seconds }[] }[] } | null`.
  Always emits all three blocks in `BLOCKS` order (warm-up → main → cool-down), items grouped by block
  in template array order (= `position`). Returns `null` when the template is missing OR any slug is
  unknown — a session renders whole or not at all, never with a hole. No mutation of inputs.
- `src/workouts/session.test.ts` (**9 tests**): fixture template with deliberately interleaved blocks
  → grouped correctly, items carry the resolved exercise OBJECTS (identity) and verbatim numbers ·
  unknown combination / empty catalogue → `null` · one missing slug → `null`, not a partial · inputs
  not mutated · `templateFor` finds all 63 seeded slugs · `resolveSession` resolves all 63 against
  `EXERCISES` with item count = template block count and every exercise of the selected type.

**Deviations from the brief (library-bound, recorded for the reviewer):** the brief asked for 2–3
warm-up and 2–3 cool-down items per template; eight (type, level) cells have fewer because the P4.7
library has no more suitable same-type, level-eligible movements: `cycling/beginner` has 1 warm-up
(`easy-spin`), and `home/beginner`, `gym/beginner`, `gym/intermediate`, `calisthenics/beginner`,
`running/beginner`, `swimming/beginner`, `mobility/beginner` have 1 cool-down item (gym has no
stretch below `advanced`; home/beginner's only stretch is `standing-quad-stretch`). Tests assert the
PLAN's floor (≥ 1 / ≥ 3 / ≥ 1). `mobility/beginner` has 4 main items (brief said 5–8; the cell has 7
exercises in total); `cycling/advanced` has 3 main efforts (brief said 3–5). `cycling/intermediate/high` (80 min) runs longer than `cycling/advanced/high`
(75): monotonicity is only required within a (type, level), and the intermediate tempo + climb set is
long by design.

**Environment note:** the worktree's `node_modules` predated the merge that brought the P1
`scripts/db-*.test.ts` suites, so `@electric-sql/pglite` (already in `package.json` + lockfile) was
missing: typecheck showed 13 errors and 3 test files failed to import, none in `src/`. Fixed with
`npm install` (added 4 packages; `package-lock.json` unchanged, no tracked file touched). Writing this entry triggered the worktree's format-on-write hook, which also
normalised whitespace in older entries (P2 lane: de-indented continuation lines, one `+` list marker → `-`,
blank lines after headings); content unchanged, and `prettier --check BUILD_LOG.md` now passes.

**Gates (G0, in `wt/d`):** `npm run lint` 0 errors (6 pre-existing react-refresh warnings, none in
`src/content` or `src/workouts`) · `npm run typecheck` clean · `npm test` **26 files / 578 tests
green** (555 → 578) · `npm run build` green (PWA precache 24 entries) · `check:pwa OK — Hygieia ·
Υγίεια, 3 icons, sw.js present` · Prettier clean on the four new files. G3/`seed:check`/`db:gate`
are the UI lane's gates once the seed migration exists.

**Next (UI lane of P4.8):** `WorkoutsPage.tsx` three selectors → `resolveSession(...)` card with the
disclaimer; `gen-seed-sql.mjs` kinds `exercises` + `workout_templates` (`position` = block array
index); migrations `…000800` / `…000900`; `catalogue.mjs` `workout_templates = 63`; dictionary keys;
`e2e/local/workouts.spec.ts`.

## 2026-10-05 — P3.6 Playwright e2e harness on the PRODUCTION build, Pages semantics — DONE (builder, worktree `wt/f`; not yet committed)

**Pulled forward** by the lead (P3.5's header/nav does not exist yet), so the smoke spec asserts the
CURRENT shell: Greek hero on `/hygieia/`, the language toggle, the in-app not-found on a deep link,
`/hygieia/auth`'s sign-in-unavailable state, the PWA manifest/`registerSW.js` links. Every string is
asserted against the dictionary VALUE (`import { el, en } from '../../src/i18n/dictionary'`), never a literal.

**Delivered:** `playwright.config.ts` (one `local` project; `webServer` = `npm run build && node e2e/support/pages-server.mjs --port 4173 --root dist --base /hygieia`,
or just the server when `E2E_PREBUILT=1`; `reuseExistingServer: false`; `baseURL = http://127.0.0.1:4173/hygieia/`; build env blanks
`VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` so the artifact is local-only; `locale: 'el-GR'` so `LangProvider` picks Greek) ·
`e2e/support/pages-server.mjs` (Themis lifted verbatim + `--base`: a request must start with the base, which is stripped and served from
`dist/`; `/hygieia` → 301 `/hygieia/`; OUTSIDE the base → plain-text 404, never this site's `404.html`, because on Pages that URL
belongs to another site, so the app must not boot there; exported `normalizeBase`) · `e2e/support/fixtures.ts` (console/page-error
watchdog, verbatim; filters only the DOCUMENT's own 404) · `e2e/support/tsconfig.json` (verbatim; the spec's dictionary import rides the
import graph) · `e2e/local/smoke.spec.ts` (**7 tests**: Greek shell + `lang="el"`; toggle → `en.heroTitle` + `lang="en"` + survives reload;
`en-US` browser gets English; deep link `/hygieia/no/such/page` is a 404 DOCUMENT rendering `el.notFoundTitle`, URL untouched, `backHome`
works; `/hygieia/auth` 404 document → `el.signInUnavailableTitle`; manifest link + `registerSW.js` + manifest `start_url`/`scope`;
server semantics: `/hygieia/404.html` body === `/hygieia/index.html` body, `/hygieia` 301 → `/hygieia/`, `/no/such/page` 404 without
the app) · `package.json` (`"e2e": "tsc -p e2e/support/tsconfig.json && playwright test --project=local"`, devDep `@playwright/test ^1.63.0`
= Themis; `package-lock.json` follows) · `.github/workflows/deploy.yml` (after `check:pwa`: Playwright version step, `~/.cache/ms-playwright`
cache, `npx playwright install --with-deps --only-shell chromium`, `E2E_PREBUILT=1 npm run e2e` with a 5-min timeout, `test-results/`
upload on failure; job timeout 15 → 20 min) · `.gitignore` (`playwright-report/`, `test-results/`, `blob-report/`) ·
`.claude/CLAUDE.project.md` §2 Tests line + §8 `e2e: npm run e2e` (**NOT recomposed** — the kit manifest resolves the MAIN checkout,
not this worktree; the lead runs `node D:/projects/zeus/.zeus/kit/kit.mjs apply hygieia` after merging).

**Scope deviation (flagged, one line):** `vite.config.ts` `test.exclude` gained `'e2e/**'` — Vitest's default include is
`**/*.spec.ts`, so without it `npm test` collects the Playwright spec and goes red (Themis carries the same exclude). Nothing else in
that file changed (the format hook's whole-file rewrap was reverted to HEAD formatting).

**Gotchas learned (for BRAIN §5, lead to record):** (1) `baseURL` ends in `/hygieia/`, but `page.goto('/x')` resolves against the
ORIGIN (URL semantics) → `http://127.0.0.1:4173/x`, OUTSIDE the site. Specs spell the base: `page.goto('/hygieia/recipes')`.
(2) Client-side `<Link to="/">` under `basename="/hygieia"` lands on `/hygieia` (no trailing slash) — correct router behaviour; a hard
load of it is Pages' 301 to `/hygieia/`. Assert the home route with `/hygieia/?$`. (3) Playwright's default `Desktop Chrome` locale is
`en-US`, and `LangProvider` reads `navigator.language` → the project sets `locale: 'el-GR'` to see the Greek shell first.

**Gates (2026-10-05, worktree `D:/projects/hygieia-wt/f`):** `npm run lint` 0 errors (5 pre-existing react-refresh warnings) ·
`npm run typecheck` clean · `npm test` 16 files / 263 tests green (e2e dir excluded) · `npm run build` green, `cmp dist/404.html dist/index.html`
byte-equal · `check:pwa OK — Hygieia · Υγίεια, 3 icons, sw.js present` · `npm run e2e` → `pages-server: serving …\dist at
http://127.0.0.1:4173/hygieia/ (Pages semantics)`, **7 passed**, 0 console/page errors (the watchdog would have failed the test) ·
workflow YAML parses (js-yaml), prettier-clean.

**RED-verification (the gate seen failing):** `rm dist/404.html; E2E_PREBUILT=1 npm run e2e` → **3 failed / 4 passed**: the not-found
deep link and `/hygieia/auth` (`element(s) not found` — the app never booted on the plain-text 404) and the server-semantics test
(`/hygieia/404.html` no longer equals `index.html`); the three root-document tests still pass, as they should. `npm run e2e` (rebuild) →
7 passed; `404.html` byte-equal again.

**Runnable artifact exercised:** `pages-server.mjs --base /hygieia` observed serving `dist/` at `/hygieia/` (log line above); `/hygieia`
→ 301 `Location: /hygieia/`; `/no/such/page` → 404 plain text; `/hygieia/no/such/page` → 404 + app (`el.notFoundTitle`) — all asserted in spec 7/4/5.

**Next:** lead merges `wt/f`, runs `kit.mjs apply hygieia` (recompose), records gotchas 1–3 in BRAIN §5; CI shows the e2e step on the first
push; P3.7 adds `recipes.spec.ts`/`fridge.spec.ts` on this harness; `G3 = G1 && npm run e2e` is now live.

## 2026-10-05 — P1.11 group 1 recipes seed (Mediterranean & plant-forward) — DONE (builder, worktree `wt/c`; not yet committed)

**Scope:** one of three parallel P1.11 builders. Group 1 = diets `mediterranean`, `dash`, `flexitarian`,
`pescatarian`, `vegetarian`, `vegan`. Delivered ONLY `src/content/seed/recipes/group1.ts`
(`export const RECIPES_GROUP1: readonly RecipeSeed[]`). The aggregate `recipes.ts` + `recipes.test.ts`
come from the index builder; groups 2 (carnivore/keto/paleo/atkins/high-protein) and 3 (gluten-free /
low-FODMAP / Whole30 / fasting) are the other builders' files — no meat-centric mains or GF/FODMAP specials here.

**Delivered:** 53 recipes, 318 ingredient lines, all `image_path: null`. Families: breakfasts (14),
legume classics (7: fasolada, fakes, revithada, gigantes plaki, fava, hummus, pumpkin red-lentil soup),
ladera & stuffed vegetables (8: gemista, briam, spanakorizo, lahanorizo, imam bayildi, arakas, fasolakia,
bamies), salads/mezze/vegetarian plates (11: horiatiki, dakos, tzatziki, chickpea & lentil salads, quinoa
tabbouleh, kolokithokeftedes, spanakopita, halloumi salad, roasted cauliflower tahini, tofu souvlaki),
pasta (2), fish & seafood (9: grilled sardines, sea bream, psari plaki, shrimp saganaki, octopus xydato,
mydopilafo, salmon bowl, tuna-bean salad, mackerel with horta), snacks (2). Steps 3–5 each, EL plural
imperative, EQUAL EL/EN counts. Legumes/grains/pasta quantified DRY (P1.9 raw-state nutrition rule).

**Diet tagging rules applied (so every tag complies with the P1.10 allowed/avoided lists):** `vegan` =
no animal product and no honey (petimezi used instead); `dash` = no added salt, no feta/olives/capers/
tinned or smoked fish/halloumi/full-fat yoghurt, modest olive oil; `pescatarian` and `flexitarian` on
every vegetarian + fish dish; `mediterranean` on all 53 (no red meat, no added sugar).

**Coverage matrix (diet × meal type; requirement ≥ 5 total and ≥ 2 each for breakfast/lunch/dinner):**

| diet          | total | breakfast | lunch | dinner | snack |
| ------------- | ----: | --------: | ----: | -----: | ----: |
| mediterranean |    53 |        14 |    38 |     34 |    15 |
| dash          |    39 |         9 |    29 |     28 |     9 |
| flexitarian   |    53 |        14 |    38 |     34 |    15 |
| pescatarian   |    53 |        14 |    38 |     34 |    15 |
| vegetarian    |    43 |        13 |    29 |     26 |    14 |
| vegan         |    31 |         7 |    23 |     21 |     8 |

**Self-check (scratchpad script, not in repo):** every `ingredient_slug` resolves to a P1.9 slug and every
`diet_slug` to a P1.10 slug; 53 unique `SLUG_RE` slugs; equal step counts; line units are the ingredient's
own unit or g/ml (zero `unitMismatch` warnings from `computeNutrition`); notes come in EL/EN pairs; per-portion
kcal for ALL 53 within 150–900 (min 163 date-oat energy balls, max 753 baked sea bream with potatoes).
Random-5 sample via `src/nutrition/compute.ts`: pumpkin-red-lentil-soup 351 kcal (P17/C55/F8) ·
fasolakia-ladera 352 (P7/C38/F21) · oat-porridge-banana-walnuts 518 (P15/C80/F17) · roasted-chickpeas
222 (P10/C32/F7) · fakes-lentil-soup 539 (P26/C71/F18).

**Gates (worktree `wt/c`):** `npm run lint` 0 errors · `npm run typecheck` clean · `npm run build` green
(PWA precache 24 entries) · `npm test` 20 files / 408 tests green. Environment note: this worktree's
`node_modules` lacked `@electric-sql/pglite` (in the lockfile, not installed), which made `tsc -b` and
`scripts/db-apply.test.ts` fail BEFORE this task; fixed with `npm ci` (gitignored, no tracked change). The
`tsconfig.app.json` project containing this file was clean throughout. `git status`: only the new file.

**Not done / next:** aggregate `src/content/seed/recipes.ts` (spread of the three groups) and
`recipes.test.ts` (index builder); P1.12 generator consumes the aggregate. No commit (lead merges `wt/c`).

## 2026-10-05 — P1.14 `npm run db:gate:prove-red` — the gate proven RED — DONE (builder, worktree `wt/a`; not yet committed)

**Delivered:** `scripts/db-gate-prove-red.mjs` (replaces the P1.1 stub; harness lifted from Themis:
temp copies of the archive under `os.tmpdir()`, a control run, `RED_LINE`, a worker pool —
`PROVE_RED_JOBS` / `--jobs`, default `min(4, cores)`; `--only id,…`; `--verbose` prints every red line
the gate produced). Two sabotage shapes: `sql` appended as `29991231235959_hygieia_zz_sabotage.sql`
(sorted last, guard-legal name, runs twice like the archive) and `mutate` (an exactly-once string
replacement in a COPIED migration — a deletion; 0 or 2+ hits stops prove-red at startup with exit 2).
Verdict per sabotage: `RED ok` (exit 1 AND every expected line present) · `NOT RED` (gate passed) ·
`WRONG LINE` (exit 1 but the expected line missing) · `CRASH` (exit ≠ 0, 1). Control must be exit 0 +
`GATE PASSED` + zero `FAIL` lines. `process.exitCode` only — nothing calls `process.exit()`; SIGINT/SIGTERM
kill the children, drain the pool, clean the temp root and exit 130. Committed migrations are only read.

**GATE GAP found and closed (also `scripts/db-gate/catalogue.mjs`, pre-authorised by the lead):**
`saved_plans` UPDATE `using (true) with check (true)` and `favourites` DELETE `using (true)` both left the
gate **GREEN** (exit 0, 213 PASS; reproduced manually before any harness code). Cause: the per-user probes
were `update … where user_id = A` / `delete … where user_id = A`; a WHERE that reads a column makes
Postgres AND the (still correct) SELECT policy into the write, so an open write policy is invisible to a
filtered probe — while an unfiltered `update hygieia.saved_plans set …` by UB would hit A's rows live.
Fix: the existing checks now ALSO run a **blind** statement (no WHERE) and assert A's rows are
byte-identical afterwards — `UB's UPDATE of A's rows has no effect` (blind UPDATE, `affected ≤ B's own`),
`UB's DELETE of A's rows has no effect` (blind DELETE, A's rows still there), the profiles twin
`UB's UPDATE and DELETE of UA's row have no effect`, and the content `UA's status update has no effect`
(blind `set status = 'approved'`). Check NAMES are unchanged on purpose: `scripts/db-isolation.test.ts`
pins the name set for `user`/`profiles` and is outside this task's scope — strengthening in place keeps
the Vitest twin green and makes it stronger for free (DECISIONS.md). Child-kind probes were already blind.

**The 25 sabotages (all RED on the expected line; times from the final 4-job run, wall 15.6 s;
first run 21.8 s):**

| id                               | sabotage                                                                                             | expected FAIL line (gate's real output)                                                                                                                                                                                                                                           | s   |
| -------------------------------- | ---------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --- |
| `recipes-select-true-anon`       | recipes anon SELECT `using (true)`                                                                   | `hygieia.recipes: anon reads exactly N approved rows and 0 pending — N = 1 approved of 2; read 2, pending 1`                                                                                                                                                                      | 2.7 |
| `fridge-lists-select-true`       | fridge_lists SELECT `using (true)`                                                                   | `hygieia.fridge_lists: UB reads ZERO rows of A — 1 rows`                                                                                                                                                                                                                          | 2.7 |
| `saved-plans-update-true`        | saved_plans UPDATE `using (true)` (was the gap)                                                      | `hygieia.saved_plans: UB's UPDATE of A's rows has no effect — {"o":{"ok":true,"affected":0},"blind":{"ok":true,"affected":2},"own":1}`                                                                                                                                            | 2.7 |
| `favourites-delete-true`         | favourites DELETE `using (true)` (was the gap)                                                       | `hygieia.favourites: UB's DELETE of A's rows has no effect — {…"blind":{"ok":true,"affected":2},"left":0}`                                                                                                                                                                        | 2.6 |
| `recipe-ingredients-select-true` | recipe_ingredients anon SELECT `using (true)`                                                        | `hygieia.recipe_ingredients: anon reads only children of approved parents — 4/4 (approved parents: 2)`                                                                                                                                                                            | 2.6 |
| `favourites-rls-disabled`        | `disable row level security`                                                                         | `RLS is enabled on every hygieia table (14) — favourites` + `hygieia.favourites: UB reads ZERO rows of A — 1 rows` (4 FAIL)                                                                                                                                                       | 2.6 |
| `is-admin-update-grant`          | `grant update (is_admin) … to authenticated`                                                         | `hygieia.profiles: UA's update of is_admin is refused (no column grant) — {"ok":true,"affected":1}` + `… authenticated holds no INSERT or UPDATE privilege on is_admin — … UPDATE on: display_name, is_admin`                                                                     | 2.6 |
| `is-admin-returns-true`          | `is_admin()` body → `select true`                                                                    | `hygieia.profiles: hygieia.is_admin() is true for ADMIN, false for UA, false without a profile (NEW) — [true,true,true]` + `hygieia.recipes: UA (signed in, not admin) reads exactly N approved rows … pending 1` + `hygieia.recipes: UA's status update has no effect` (25 FAIL) | 2.8 |
| `execute-is-admin-to-anon`       | `grant execute on function hygieia.is_admin() to anon`                                               | `anon has EXECUTE on no hygieia function (3) — hygieia.is_admin()` + `hygieia.profiles: anon cannot execute hygieia.is_admin() — {"ok":true,"affected":0}`                                                                                                                        | 2.8 |
| `is-admin-revoke-deleted`        | MUTATION: the `revoke execute … from public, anon;` line removed from `…000200_hygieia_profiles.sql` | the two lines above + `PUBLIC has EXECUTE on no hygieia function (3) — hygieia.is_admin()`                                                                                                                                                                                        | 2.8 |
| `drop-stamp-review-trigger`      | `drop trigger recipes_stamp_review`                                                                  | `every status-bearing table has a BEFORE UPDATE stamp_review trigger (6) — recipes` + `hygieia.recipes: ADMIN's status update takes effect and is stamped (…) — {… "reviewed_by":null,"later":null …}`                                                                            | 2.8 |
| `definer-no-search-path`         | definer fn, no `search_path`, default EXECUTE                                                        | `search_path is pinned on every hygieia function (4) — hygieia.leak_fn()` + anon/PUBLIC EXECUTE lines `(4) — hygieia.leak_fn()`                                                                                                                                                   | 2.5 |
| `definer-search-path-public`     | definer fn `set search_path = public`                                                                | GUARD: `29991231235959_hygieia_zz_sabotage.sql:2  [forbidden-schema]  search_path includes public — pin it to '' and qualify names` + `GATE FAILED — the static migration guard is red`                                                                                           | 0.1 |
| `definer-search-path-pg-temp`    | definer fn `set search_path = pg_temp, hygieia`                                                      | `no SECURITY DEFINER function has public/$user/pg_temp on its search_path — hygieia.leak_fn() search_path=pg_temp, hygieia`                                                                                                                                                       | 2.5 |
| `anon-insert-recipes`            | `grant insert on hygieia.recipes to anon`                                                            | `anon holds exactly SELECT on content and child tables and nothing else — recipes: SELECT, INSERT` + `hygieia.recipes: anon and authenticated hold no INSERT or DELETE privilege — anon:INSERT`                                                                                   | 2.5 |
| `ledger-select-to-authenticated` | `grant select on hygieia.schema_migrations to authenticated`                                         | `authenticated holds no privilege on hygieia.schema_migrations — SELECT` + `hygieia.schema_migrations: service-only — … — authenticated:SELECT`                                                                                                                                   | 2.5 |
| `public-table`                   | `create table public.x`                                                                              | GUARD: `…sabotage.sql:1  [forbidden-schema]  reference to public.x — Hygieia may touch schema hygieia only (ADR-0003)` + `GATE FAILED — the static migration guard is red`                                                                                                        | 0.1 |
| `auth-users-trigger`             | `create trigger … on auth.users`                                                                     | GUARD: `…sabotage.sql:1  [auth-users-trigger]  trigger on auth.users — it would fire on every Alyssos sign-up (ADR-0003 rule 6)` (+ forbidden-schema) + `GATE FAILED — the static migration guard is red`                                                                         | 0.1 |
| `orphan-table-no-catalogue`      | `create table hygieia.orphan_table (id int)`                                                         | `every hygieia table has a catalogue entry (15) — NO ENTRY: orphan_table — add it to scripts/db-gate/catalogue.mjs` + `RLS is enabled on every hygieia table (15) — orphan_table` (5 FAIL)                                                                                        | 2.7 |
| `table-dropped-stale-entry`      | `drop table hygieia.favourites cascade`                                                              | `every catalogue entry names an existing hygieia table — favourites` + `fixture seeded (…) — relation "hygieia.favourites" does not exist`                                                                                                                                        | 2.3 |
| `view-owner-rights`              | a view without `security_invoker`                                                                    | `no hygieia view bypasses RLS (views are security_invoker, no materialized views) — v_recipes`                                                                                                                                                                                    | 2.8 |
| `enum-mismatch`                  | `exercises.level` CHECK + `'elite'`                                                                  | `exercises.level CHECK admits exactly enums.ts LEVELS — db beginner\|intermediate\|advanced\|elite vs ts beginner\|intermediate\|advanced`                                                                                                                                        | 2.8 |
| `seed-random-id`                 | a health_tips row with `gen_random_uuid()` id                                                        | `hygieia.health_tips: every row id = md5('hygieia:health_tips:' \|\| slug)::uuid (seed-id rule) — 3 rows checked, 1 off-formula`                                                                                                                                                  | 2.3 |
| `not-idempotent`                 | `create table hygieia.twice (id int)` (no IF NOT EXISTS)                                             | `re-apply 29991231235959_hygieia_zz_sabotage.sql (idempotent-safe) — relation "twice" already exists` (6 FAIL)                                                                                                                                                                    | 2.2 |
| `apply-error`                    | `alter table hygieia.no_such add column x int`                                                       | `apply 29991231235959_hygieia_zz_sabotage.sql — relation "hygieia.no_such" does not exist` + `APPLY FAILED — stopping.`                                                                                                                                                           | 1.8 |

Control: `GREEN  control — the untouched archive copy: exit 0, GATE PASSED, 213 PASS (2.7s)`. Final line:
**`PROVE-RED PASSED — 25/25 sabotages went RED on the expected FAIL line; control GREEN. Wall 15.6s (4 jobs).`**,
exit 0. Harness self-test (scratch copies outside the repo): a no-op sabotage → `NOT RED  apply-error — the
gate PASSED (exit 0): the sabotage was not caught` + `PROVE-RED FAILED — 2/3 …; offenders: apply-error`,
exit 1; a wrong expectation → `WRONG LINE  not-idempotent — exit 1 but the expected FAIL line is missing`

- `PROVE-RED FAILED — 0/1 …`, exit 1; `--only no-such-id` → exit 2.

**Gates (`G1` minus `seed:check`, still the P1.12 stub):** `npm run lint` 0 errors (6 pre-existing
react-refresh warnings) · `npm run typecheck` clean · `npm test` 22 files / 523 tests green (the isolation
twin runs the strengthened checks) · `npm run build` green · `check:pwa OK — Hygieia · Υγίεια, 3 icons,
sw.js present` · `npm run db:check` → `PASS  migration guard: 4 migration(s) stay inside schema hygieia` ·
`npm run db:gate` → `GATE PASSED — 212 checks green` · Prettier clean on both files.

**Notes for the lead:** (1) A guard-level sabotage runs in 0.1 s (nothing applied); a DB-level one ~2.5 s;
25 + control at 4 jobs ≈ 16–22 s — far under the 2–3 min budget, so P1.15 can run it in CI without a
timeout bump. (2) The gap is recorded in BRAIN §5; the rule for future catalogue checks: a write-policy
probe must include a blind (no-WHERE) statement, or a correct SELECT policy will mask an open write policy.
(3) `RED ok` requires exit code exactly 1 (not merely ≠ 0): a crash code (e.g. Windows 0xC0000409) is
reported as `CRASH`, so a gate that dies before its verdict can never count as proof.

## 2026-10-05 — P1.11 recipes seed, GROUP 3 (special patterns) + aggregate + test — DONE (builder, worktree `wt/g`; not yet committed)

**Scope (one of three parallel builders):** diets `intermittent-fasting`, `whole30`, `gluten-free`, `low-fodmap`,
plus ownership of the aggregate module and the P1.11 acceptance test. Groups 1 (Greek/Mediterranean classics)
and 2 (meat/egg low-carb, keto) are written in other worktrees.

**Delivered:**

- `src/content/seed/recipes/group3.ts` — `RECIPES_GROUP3`, **40 recipes** (target 30+): GF baking (buckwheat
  pancakes, almond-buckwheat banana bread, buckwheat-chia seeded bread, socca), polenta ×2, risottos ×2, quinoa /
  rice / rice-noodle bowls, low-FODMAP soup and bowls, Whole30 sheet-pan dinners, egg bake, breakfast patties,
  break-the-fast plate, fruit-and-nut snacks. 3–5 steps each, natural Greek; `image_path: null` everywhere.
- `src/content/seed/recipes.ts` — the aggregate `RECIPES = [...GROUP1, ...GROUP2, ...GROUP3]`.
- `src/content/seed/recipes/group1.ts`, `group2.ts` — **TEMPORARY STUBS** (empty typed arrays, header
  `// STUB — replaced by the group builder's file at merge; do not edit`). The lead replaces them at merge.
- `src/content/seed/recipes.test.ts` — the P1.11 acceptance test (328 tests on stubs + group 3): count ≥
  `MIN_RECIPES`; unique `SLUG_RE` slugs; every ingredient/diet slug resolves; steps ≥ 3, equal EL/EN, Greek
  script in `steps_el`/`title_el`; portions 1..12; `prep_min` ≥ 1; `meal_types` non-empty, no dups; lines 1..20,
  qty > 0, unit ∈ `UNITS`, notes both-or-neither, no duplicate slug per recipe; `computeNutrition` per-portion
  kcal 100..1200 with no unknown slugs; mechanical diet compliance (vegan / vegetarian / pescatarian / carnivore
  by ingredient `category`; gluten-free / low-fodmap / whole30 by auditable slug lists at the top of the file);
  coverage matrix logged, B/L/D ≥ 1 for every diet with ≥ 1 recipe, plus the strict all-16-diets check.

**Constants the lead flips after merge (all in `recipes.test.ts`):** `MIN_RECIPES = 30` → `40` (PLAN floor);
`REQUIRE_FULL_COVERAGE = false` → `true` (every diet ≥ `FULL_COVERAGE_MIN_PER_MEAL = 2` for B/L/D).

**Coverage now (group 3 alone):** gluten-free B13/L25/D22 (39) · low-fodmap B10/L11/D9 (20) · whole30 B4/L9/D6
(11) · intermittent-fasting B2/L15/D14 (16). "Suitable-for" tagging also lands: flexitarian 40, pescatarian 32,
vegetarian 27, mediterranean 16, high-protein 15, vegan 15, dash 11, paleo 10, low-carb 4. Keto/atkins/carnivore
0 (groups 2's). kcal/portion range **158–740** (energy balls … chicken coconut curry).

**Content decisions (recorded here; P1.11 has no DECISIONS.md entry of its own):**

- `oats` is plain rolled oats (not certified GF) → never tagged `gluten-free`, allowed in `low-fodmap` (Monash and
  the P1.10 row both allow oats). `tortilla` is a WHEAT tortilla → no corn-tortilla tacos; fish tacos became rice
  "fish taco bowls". No garlic-infused oil ingredient exists → low-FODMAP recipes use plain olive oil and spring
  onion "green parts only" (noted on every line). `buckwheat`, `lentil-pasta`, `rice-noodles` and the
  almond/coconut/chickpea flours are exempt from the gluten name-match (gluten-free by nature).
- Diet tags follow "suitable for" semantics (every compliant diet is tagged) so a diet filter shows everything a
  follower can eat; `paleo` is not tagged on white-potato dishes; `keto`/`atkins`/`carnivore` left to group 2.
- Whole30 check is category-based (grains-bread, pasta-rice, legumes, sweeteners, dairy-eggs except egg/ghee) plus
  explicit slugs (peanuts, alcohol, cured meats, mayonnaise, ketchup, stock cube, corn products, flours).

**Gates (2026-10-05, `D:/projects/hygieia-wt/g`):** `npm run lint` 0 errors (6 pre-existing react-refresh warnings
in `src/auth/AuthProvider.tsx`, `src/i18n/LangProvider.tsx`, `src/routes/routes.tsx`) · `npm run typecheck` clean ·
`npm test` 21 files / 736 tests green (`recipes.test.ts` 328, logs `RECIPES count: 40` + matrix + kcal table) ·
`npm run build` green (PWA precache 24 entries) · `check:pwa OK — Hygieia · Υγίεια, 3 icons, sw.js present`.

**Not done / next:** nothing committed (the lead merges `wt/g` and replaces the two stubs with the real group
files, then flips the two constants and re-runs the test). P1.12 (seed generator) consumes `RECIPES`.

## 2026-10-05 — P1.11 group 2 recipes seed (low-carb & protein-centric) — DONE (builder, worktree `wt/b`; not yet committed)

**Scope:** one of three parallel builders for P1.11. Delivered ONLY
`src/content/seed/recipes/group2.ts` (`export const RECIPES_GROUP2: readonly RecipeSeed[]`) for the diets
`paleo`, `low-carb`, `keto`, `atkins`, `carnivore`, `high-protein`. The aggregate `recipes.ts` and
`recipes.test.ts` are another builder's. Nothing else touched.

**Volume (operator: "as many as you can"; target 40+):** **61 recipes**, 445 ingredient lines over 120 distinct P1.9
slugs, every line in the ingredient's own unit or g/ml, raw weights. 278 steps (3–6 per recipe), EL/EN counts equal,
Greek in plural imperative; loanwords (keto, paleo, Atkins, Cobb, Meatza) Latin-script.

**Coverage matrix (diet × meal type; requirement ≥ 5 total and ≥ 2 each for breakfast/lunch/dinner):**

| diet         | total | breakfast | lunch | dinner | snack |
| ------------ | ----- | --------- | ----- | ------ | ----- |
| paleo        | 27    | 7         | 20    | 20     | 4     |
| low-carb     | 59    | 18        | 39    | 37     | 12    |
| keto         | 48    | 14        | 32    | 31     | 8     |
| atkins       | 44    | 12        | 31    | 30     | 6     |
| carnivore    | 10    | 3         | 6     | 7      | 1     |
| high-protein | 39    | 6         | 32    | 33     | 4     |

**Compliance rules applied (checked by a throwaway script against every tag, 0 violations):** `carnivore` =
meat/poultry/fish categories + egg, butter, ghee, hard cheese, tallow, lard, bone broth/marrow, salt, water
— no spices (black pepper excluded from all 10 carnivore recipes). `keto`/`atkins` ≤ 15.5 g TOTAL carbs per
portion, no grains/legumes/sugar/starchy veg/fruit beyond berries+avocado; Atkins additionally no nuts,
almond flour, berries or yoghurt (induction). `paleo` no dairy except eggs (butter/ghee excluded; tallow and
lard used instead), no grains/legumes/soy/peanut/seed oils/processed meat/mayonnaise/mustard/erythritol.
`low-carb` ≤ 32 g carbs. `high-protein` ≥ 30 g protein per portion and no bacon/sausage/pork belly.
Per-portion kcal 155–833 for all 61 (via `computeNutrition`; no `unknown`, no unit-mismatch warnings).

**Keto sample (per portion; total carbs — the catalogue has no fibre column, so this is an upper bound on net):**
chicken caesar no croutons 466 kcal / 7.9 g · tuna steak avocado salsa 559 / 14.5 · roast goat 383 / 6.2 ·
Cobb salad 833 / 13.3 · avocado egg feta bowl 506 / 12.2. Highest keto carbs in the group: cauliflower-rice
chicken bowl 14.8 g.

**Decision (non-obvious):** `mustard` was removed from the one paleo-tagged recipe that used it (turkey steak,
now with thyme) rather than dropping the tag — prepared mustard is contested in paleo. `pork-belly` is tagged
carnivore/keto/atkins/paleo but NOT high-protein (14 g). Chia pudding and almond porridge are `paleo`+`low-carb`,
not keto (16–26 g total carbs).

**Gates (worktree `wt/b`):** `npm run lint` → `✖ 6 problems (0 errors, 6 warnings)` — all six are pre-existing
`react-refresh/only-export-components` warnings in `AuthProvider.tsx`, `LangProvider.tsx`, `routes.tsx`;
`group2.ts` lints with 0 problems · `npm run typecheck` clean · `npm run build` → PWA `precache 24 entries`,
exit 0 · `npm test` → `Test Files 20 passed (20)`, `Tests 408 passed (408)` · Prettier check passes.

**Next:** the aggregate builder concatenates `RECIPES_GROUP2` into `recipes.ts`; cross-group slug collisions
are theirs to check (all 61 slugs here are prefixed `carnivore-`/`keto-`/`paleo-`/`low-carb-`/`high-protein-`).

## 2026-10-05 — P4.9 (content half) health tips seed — DONE (builder, worktree `wt/f`; not yet committed)

**Pulled forward** by the lead: the seed depends only on the P1.4 types (`HealthTipSeed`,
`TIP_TOPICS`, `SLUG_RE`). The `/tips` page, `gen-seed-sql.mjs` kind `health_tips`, the SQL seed
migration, `catalogue.mjs`, routes/header and dictionary keys are the OTHER half of P4.9 and come later.

**Delivered:** `src/content/seed/tips.ts` (`export const HEALTH_TIPS: readonly HealthTipSeed[]`) and
`src/content/seed/tips.test.ts`. Nothing else touched.

**Volume (operator: "as many as you can"; floor 30, target 60+, ≥ 8 per topic):** **75 tips** —
sleep 12 · hydration 12 · nutrition 14 · movement 13 · habits 12 · mental 12. Slugs are
`<topic>-<kebab>` (test enforces the prefix).

**Sources (PLAN.md §0 content drafting rule — the one that matters most here):** **58 with
`source_url`, 17 `needs_source = true`.** URLs were set ONLY for pages the drafter has actually seen
and is confident are stable: WHO fact sheets ×12 (physical-activity, healthy-diet, salt-reduction,
alcohol, depression), NHS ×14 (live-well eat-well / exercise / sleep / quit-smoking / sun safety /
hand-washing / teeth, conditions vitamin-d, mental-health self-help), Mayo Clinic `art-*` ×19,
Harvard Nutrition Source ×6, Sleep Foundation ×5, EFSA topic pages ×2. Anything less than certain
(morning daylight, urine colour, bottle habit, older-adult schedule, alcohol+water, drink with
meals, ultra-processed, enjoyable activity, know-your-numbers, habit stacking, cook at home,
20-20-20, meal planning, nature time, news limits, gratitude, worry list) is `null` + `needs_source`
→ "Source pending review" in the UI. CDC and NIH were deliberately NOT cited: CDC restructured its
paths in 2024 and I was not certain of the new ones, so null beat a guess (CLAUDE.md §5). Each
topic has ≥ 1 sourced tip. All guidance is mainstream public health (WHO 150–300 min/week, strength
2×/week, < 5 g salt, < 10 % free sugars, 400 g fruit/veg, EFSA 2.0/2.5 L water and 400 mg
caffeine, 7–9 h sleep, hand-washing 20 s, SPF 30…); no cures, no supplement claims, no diagnosis.
Greek drafted natively (not literal translation); Greek-local framing where it helps (summer heat,
small oily fish, λαδερά, tap water).

**Test (`tips.test.ts`, 13 cases, logs the actual count):** count ≥ 30 · each topic ≥ 4 · topic ∈
`TIP_TOPICS` · unique `SLUG_RE` slugs with topic prefix · locale pairs non-blank · titles ≤ 80 ·
Greek script in `title_el`/`body_el` · bodies 2–4 sentences in both languages · no duplicate titles ·
`source_url` null or `^https?://`, parses as a URL, never contains `example.com` / `placeholder` /
`TODO` / `xxx` · **every URL host is on the in-test allow-list** (who.int, nhs.uk, cdc.gov,
hsph.harvard.edu, efsa.europa.eu, mayoclinic.org, sleepfoundation.org, nih.gov — suffix match) ·
`needs_source === (source_url === null)` on every row · ≥ 1 sourced tip per topic.

**Gates (in `wt/f`):** `npm run lint` 0 errors (4 pre-existing react-refresh warnings, none in
`src/content`) · `npm run typecheck` clean · `npm test` 9 files / 89 tests green (76 → 89) ·
`npm run build` green (PWA precache 24 entries) · `check:pwa OK — Hygieia · Υγίεια, 3 icons,
sw.js present` · Prettier clean on both files.

**Next (other half of P4.9):** `TipsPage.tsx` grouped by topic, dictionary keys (`tipsTitle`,
`topics.*`, `sourcePending`, `readSource`), `gen-seed-sql.mjs` kind `health_tips` +
`20261006001000_hygieia_seed_tips.sql`, `catalogue.mjs`, `db:gate` `health_tips ≥ 30`,
`e2e/local/tips.spec.ts`. An admin reviewing the 17 `needs_source` rows can attach a URL in P4.10.

## 2026-10-05 — P4.5 Weekly meal-plan generator (pure domain) — DONE (builder, worktree `wt/b`; not yet committed)

**Pulled forward from P4** by the lead: the generator depends only on the P1.4 types, P4.1's
`computeNutrition` and P3.3's `indexBySlug` — not on the recipes seed (P1.11 still pending), so it
was built now with small typed recipe fixtures. P4.6 (plan UI + save) consumes it. No React, no I/O,
no rounding.

### Files

- `src/plans/generate.ts` — `generateWeekPlan(dietSlug, recipes, ingredients, { seed, days?, weekStart? })`
  → `WeekPlan { dietSlug, weekStart, days, shoppingList, warnings, seed }`; also exports
  `shoppingListFor(plan, ingredientsBySlug)`, `poolFor`, `mulberry32`, `nextMonday`, `PLAN_MEALS`,
  `REPEAT_WINDOW_DAYS` (3), `MIN_POOL_FOR_NO_REPEAT` (4) and the types (`DayPlan`, `DaySlots`,
  `ShoppingLine`, `PlanWarning`, `PlanMeal`, `GenerateOptions`).
- `src/plans/generate.test.ts` — 18 tests.

### Behaviour (what P4.6 can rely on)

- Pool per meal = recipes tagged with `dietSlug` whose `meal_types` include the meal, **sorted by
  slug** before sampling; `snack` is never scheduled. `ingredients` may be an array or a
  `ReadonlyMap` (same output).
- One mulberry32 stream seeded from `opts.seed`, consumed day-major (day 0 breakfast, lunch,
  dinner, day 1 …). Same inputs + seed ⇒ deep-equal plan **regardless of recipe input order**.
- **Repeat rule:** a recipe picked for a meal is excluded from that meal for the next
  `min(3, pool − 1)` days. Pool ≥ 4 ⇒ full 3-day window, never a repeat within 3 days (asserted
  for 25 seeds × 14 days on pools of 4 and 6). Smaller pools rotate as far as they can (3 → gap 2,
  2 → alternate, 1 → daily) and emit **one** `{ day: null, meal, reason: 'pool-too-small' }` per
  meal. "Within 3 days" was read as the strict form (gap ≥ 4), because that is exactly what the
  stated threshold `pool ≥ 4` guarantees.
- **Empty pool:** `null` slot every day plus one `{ day: <index>, meal, reason: 'no-recipe-for-meal' }`
  **per day** (so the UI can mark each empty cell); `pool-too-small` is week-level (`day: null`).
  Never a throw; no recipes at all ⇒ 21 nulls, 21 warnings, zero totals, empty list.
- `totals` per day = Σ `computeNutrition(recipe).perPortion` over filled slots (one portion each).
- Shopping list: `line.quantity / safePortions(recipe.portions)` summed per `ingredient_slug` +
  `unit` (same slug in two units = two lines); `name_el/name_en` from the catalogue, unknown slug
  keeps the slug as its name; sorted by slug then unit.
- `weekStart` is carried through verbatim (default `null`); `nextMonday(date)` (UTC) is provided
  for P4.6's `saved_plans.week_start`. `days` defaults to 7; `NaN` → 7, negative → 0.

### Gates (2026-10-05, in `wt/b`)

`npm run lint` → 0 errors, 5 pre-existing react-refresh warnings (AuthProvider/LangProvider/routes) ·
`npm run typecheck` → clean · `npm test` → 16 files, 268 tests passed · `npm run build` → built, PWA
precache 24 entries · `npm run check:pwa` → `check:pwa OK — Hygieia · Υγίεια, 3 icons, sw.js present`.
Exercised directly under node type-stripping against the real 322-row ingredients seed with four
fixture recipes (pools 2/1/2): breakfasts alternate, lunch repeats daily, three `pool-too-small`
warnings, shopping list `chicken-breast 2000 g · egg 6 piece · feta 150 g · olive-oil 10 tbsp ·
salmon 1200 g`, day totals ≈ 983/994 kcal.

**Environment note:** the worktree's `node_modules` lacked `@electric-sql/pglite` (typecheck failed
in `scripts/db-apply.test.ts`, untouched since P1.1); `npm ci` fixed it — no lockfile change.

**Not done / next:** nothing committed (the lead merges `wt/b`). Cross-meal de-duplication (the same
recipe at lunch AND dinner on one day) is deliberately not enforced — the contract is per meal;
revisit in P4.6 if the UI wants it. The recipes seed (P1.11) must give every diet ≥ 1 recipe per
breakfast/lunch/dinner for the "every slot filled" acceptance to hold on real content.

## 2026-10-05 — P1.5 + P1.6 + P1.7 + P1.8 — profiles/admin primitives, content tables, per-user tables, gate catalogue (builder, worktree `wt/a`; not yet committed)

**Done (P1.5 — `supabase/migrations/20261006000200_hygieia_profiles.sql`):** `hygieia.profiles`
(`user_id` pk → `auth.users` cascade, `display_name ≤ 120`, `is_admin boolean not null default false`,
`created_at`, `updated_at`); RLS; `profiles_select_self` / `profiles_insert_self` (`with check (user_id =
auth.uid() and is_admin = false)`) / `profiles_update_self`; grants: `revoke all … from public, anon,
authenticated`, `grant select`, `grant insert (user_id, display_name)`, `grant update (display_name)` to
authenticated — **`is_admin` has no client grant** — service_role full. `hygieia.is_admin()` (sql, stable,
security definer, `set search_path = ''`, EXECUTE revoked from public+anon, granted to authenticated);
`hygieia.stamp_review()` (plpgsql, pinned; when `new.status is distinct from old.status` sets
`reviewed_at = now()`, `reviewed_by = auth.uid()`; EXECUTE revoked from public, anon, authenticated);
`profiles_touch_updated_at` trigger.

**Done (P1.6 — `…000300_hygieia_content.sql`):** the nine tables exactly per PLAN §2 — `ingredients`,
`diets`, `recipes`, `recipe_ingredients` (pk `(recipe_id, position)`), `recipe_diets` (pk `(recipe_id,
diet_id)`), `exercises`, `workout_templates` (unique `(workout_type, level, intensity)`),
`workout_template_exercises` (pk `(template_id, position)`, `check (reps is not null or seconds is not
null)`), `health_tips` (`check (source_url is not null or needs_source)`, `~ '^https?://'`). Locale columns
`not null check (btrim(x) <> '')`; array pairs equal cardinality; `recipes` steps `cardinality ≥ 1` and
equal, `meal_types ⊆ (…)` and `≥ 1`; `ingredients` macros `≤ 100`, `price_eur_max ≥ price_eur_min`; CHECK
literals equal `src/content/enums.ts` verbatim. Every table has `created_at`/`updated_at` + touch trigger;
every status-bearing table has `stamp_review` BEFORE UPDATE. Policies per role (PLAN §1.4):
`<t>_select_anon` (anon, `status = 'approved'`), `<t>_select_auth` (authenticated, `… or
hygieia.is_admin()`), `<t>_update_admin`; children: select via parent `status = 'approved'` (+ admin),
admin insert/update/delete. Grants: select to anon+authenticated; `grant update (<content cols>, status)`
to authenticated (never id, slug, created_at, reviewed_*); children column-limited insert/update + delete
to authenticated (policy-gated to admins); no client INSERT/DELETE on content; service_role full. Indexes on
every FK and on `(status)`. Nullability follows `types.ts` (price fields `not null`, `category not null`,
`equipment_*`/`note_*` nullable as a pair, `image_path`/`source_url` nullable).

**Done (P1.7 — `…000400_hygieia_user_data.sql`):** `fridge_lists`, `saved_plans` (`diet_id → diets
restrict`), `favourites` (pk `(user_id, recipe_id)`), each `user_id uuid not null default auth.uid() →
auth.users cascade`; RLS; one policy per verb to authenticated with `user_id = auth.uid()`; grants
`select, delete` + `insert (…)`/`update (…)` **excluding `user_id`**; nothing to anon/public; service_role
full; touch triggers; indexes on `user_id` (and `diet_id`, `recipe_id`).

**Done (P1.8 — `scripts/db-gate.mjs` extended, `scripts/db-gate/catalogue.mjs` new,
`scripts/db-isolation.test.ts` new, plus the P1.6 `scripts/db-schema-contract.test.ts`):**

- Structural sweep: RLS on every table (14); no view bypasses RLS; every table has a policy except
  service-only (and service-only has none); `created_at`/`updated_at` + touch trigger on every table;
  `stamp_review` + `default 'pending'` + `reviewed_*` on every status-bearing table (6); every function
  pinned, no definer on a loose path, anon/PUBLIC EXECUTE on none (3); no policy TO PUBLIC; no write policy
  admits anon/PUBLIC; every anon policy is TO anon alone; anon holds exactly SELECT on content+child and
  nothing else; authenticated no INSERT/DELETE/TRUNCATE on content; no client TRUNCATE/REFERENCES/TRIGGER
  anywhere; service_role full DML; 18 FKs validated **and indexed**; 17 enum CHECKs equal `enums.ts`.
- Coverage: every table has a catalogue entry / every entry a table / no dupes / kind matches shape
  (status, parent FK, `user_id default auth.uid()`) / kinds agree with `CONTENT_TABLES`/`CHILD_TABLES`/
  `USER_TABLES`.
- Fixture (superuser, committed): users UA, UB (profiles, non-admin), ADMIN (`is_admin = true`), NEW (no
  profile); per content table ≥ 1 approved (stamped `reviewed_at = OLD`, `reviewed_by = ADMIN`) and ≥ 1
  pending row, slugs `fx-*`, ids by the seed-id formula (`sid()` = node md5 → uuid); children under an
  approved and a pending parent; user rows of A and B. Orphan scan over all 18 FKs.
- Matrix per kind (`checksFor`): content ×11 (anon/UA read exactly N approved + 0 pending; ADMIN all; UA
  status/content edits no effect; anon refused; ADMIN status update stamped `reviewed_by = ADMIN`,
  `reviewed_at > fixture`, `updated_at` bumped; ADMIN content edit does NOT re-stamp; no client
  INSERT/DELETE privilege; authenticated may UPDATE status but never id/slug/created_at/reviewed_*;
  every row id = md5 formula); child ×7; user ×12 (incl. control INSERT without `user_id` lands as the
  caller's row; `user_id` has no INSERT/UPDATE grant); profiles ×13 (incl. `is_admin()` true/false/false
  for ADMIN/UA/NEW; anon cannot execute it); service-only ×1.
- `db-isolation.test.ts`: one PGlite, archive ×2, same fixture, the `user` (3 × 12) + `profiles` (13)
  checks as Vitest cases with the names pinned (so a check added to the catalogue without a case here
  fails), + policy-per-verb / anon-refused / RLS-on cases. `db-schema-contract.test.ts`: exact ordered
  column lists for all 14 tables, locale NOT NULL + btrim checks, 17 enum CHECKs = `enums.ts`, unique
  cell key, unique slug + pending default, composite PKs, `auth.uid()` defaults, row-level CHECKs.

**Gates (2026-10-05, worktree `D:/projects/hygieia-wt/a`):** `npm run lint` 0 errors (4 pre-existing
react-refresh warnings) · `npm run typecheck` clean · `npm test` 12 files / 309 tests green (137 → 309) ·
`npm run build` green · `check:pwa OK — Hygieia · Υγίεια, 3 icons, sw.js present` · `npm run db:check` →
`PASS  migration guard: 4 migration(s) stay inside schema hygieia` · `npm run db:gate` → **`GATE PASSED —
212 checks green`**, 0 FAIL (214 PASS lines incl. the guard's), every PLAN P1.QA.2 line present verbatim:
`RLS is enabled on every hygieia table (14)`, per user table `UB reads ZERO rows of A` / `UB's INSERT of a
row of A is refused` / `UA reads all of A's rows`, `UA's update of is_admin is refused`, per content table
`anon reads exactly N approved rows and 0 pending — N = …` / `ADMIN's status update takes effect and is
stamped`, `orphan scan: zero dangling references over every hygieia foreign key — 18 FKs clean`, `zero
objects in public/auth/supabase_migrations changed`, `no trigger on auth.users` · `npx vitest run scripts/`
4 files green (schema-contract 54 cases, isolation 61 cases).

**RED-verified (temp copies via `DB_GATE_MIGRATIONS`, committed files untouched):** (1) `fridge_lists`
select policy `using (true)` → `FAIL  hygieia.fridge_lists: UB reads ZERO rows of A — 1 rows`, exit 1; the
Vitest twin goes red on the same case. (2) the `revoke execute on function hygieia.is_admin() from public,
anon` line deleted → `FAIL  anon has EXECUTE on no hygieia function (3) — hygieia.is_admin()`, `FAIL
PUBLIC has EXECUTE …`, `FAIL  hygieia.profiles: anon cannot execute hygieia.is_admin()`. (3) `grant update
(is_admin) … to authenticated` → `FAIL  hygieia.profiles: UA's update of is_admin is refused`, `FAIL …
authenticated holds no INSERT or UPDATE privilege on is_admin`.

**Deviations / notes for the lead:** PLAN P1.QA.2 says `RLS is enabled on every hygieia table (13)`; §2
lists **14** tables (the ledger counts), so the gate prints `(14)` — the QA text needs the number fixed,
not the gate. The content check name keeps the literal `N` (`anon reads exactly N approved rows and 0
pending`) with the number in the detail, so the QA grep matches and the count is still visible. Child
tables carry `created_at`/`updated_at` (uniform with the §2 header). P1.12 must add fixture-aware seed
counts (the `fx-*` rows are added AFTER the archive, so seed counts are archive-only; count before
`seedFixture` or exclude `slug like 'fx-%'`).

**Next:** P1.9–P1.11 seeds, P1.12 generator (catalogue reference counts), P1.14 prove-red (the three
sabotages above are ready-made entries).

## 2026-10-05 — P4.7 Seed content: exercises — DONE (builder, worktree `wt/d`; not yet committed)

**Pulled forward from P4** by the lead: depends only on the P1.4 types. Delivers the bilingual
exercise library P4.8 draws its 63 workout templates from.

- `src/content/seed/exercises.ts` — `export const EXERCISES: readonly ExerciseSeed[]` (**136 rows**,
  target was 120+, floor 60) plus `export const MUSCLE_GROUPS` (15-term fixed vocabulary: quads,
  hamstrings, glutes, calves, chest, back, shoulders, biceps, triceps, forearms, core, hip-flexors,
  adductors, full-body, cardio) and the `MuscleGroup` type. Rows are built by a small typed `ex(...)`
  helper (bodyweight = both `equipment_*` null; otherwise a shared `[en, el]` pair constant, e.g.
  `DUMBBELLS = ['Dumbbells', 'Αλτήρες']`). Erasable syntax only (type imports + plain functions) so
  `scripts/gen-seed-sql.mjs` can import it under node type stripping — verified with
  `node --experimental-strip-types`.
- Type × level matrix (beginner / intermediate / advanced = total):
  home 7/7/6 = 20 · gym 7/7/7 = 21 · calisthenics 7/7/7 = 21 · running 6/6/6 = 18 ·
  swimming 6/6/6 = 18 · cycling 6/6/6 = 18 · mobility 7/7/6 = 20. Every cell ≥ 6 (requirement ≥ 3).
  67 bodyweight rows, 69 with equipment.
- Each type has warm-up-suitable (`arm-circles`, `treadmill-walk-5min`, `wrist-circles`,
  `brisk-walk-5min`/`leg-swings`, `easy-swim-100m`, `easy-spin`, `cat-cow`…) and cool-down/stretch
  movements (`*-stretch`, `stationary-bike-cooldown`, `spin-down-5min`, `easy-swim-cooldown-200m`,
  `foam-roll-*`, `legs-up-the-wall`…) so P4.8 can compose warmup/main/cooldown blocks at every level.
  Endurance types are drills/intervals/efforts (`strides-100m`, `tempo-run-20min`, `intervals-400m`,
  `pull-buoy-freestyle`, `drill-kick-board`, `cadence-drill-100rpm`, `vo2-intervals-3min`…).
- Content rule: mainstream exercises only; cues are 1–2 sentences on form + breathing in both
  languages; Greek names use everyday gym vocabulary (Καθίσματα, Κάμψεις, Σανίδα, Έλξεις, Προβολές,
  Άρσεις θανάτου); established loanwords stay Latin (burpees, jumping jacks, goblet squat, hollow
  hold, L-sit, fartlek, tempo/threshold, VO2, pull buoy, kettlebell, streamline).
- `src/content/seed/exercises.test.ts` (10 tests): count ≥ 60 (logs actual) · unique slugs ·
  `SLUG_RE` · types/levels ∈ enums · every type × level cell ≥ 3 · name/cue pairs non-blank ·
  Greek script in `name_el` except a 22-slug loanword allow-list (allow-list itself checked for
  stale entries) and ALWAYS Greek in `cue_el` · `muscle_groups` non-empty, unique, ⊆ `MUSCLE_GROUPS`
  · `equipment_*` both null or both non-blank · each type has a warm-up- and a cool-down-named slug.

**Gates (G0, in `wt/d`):** lint 0 errors (4 pre-existing react-refresh warnings, none in
`src/content`) · typecheck clean · `vitest run` 9 files / 86 tests green (76 → 86) · build green
(PWA precache 24 entries) · `check:pwa OK — Hygieia · Υγίεια, 3 icons, sw.js present` · Prettier clean.
G3 (`npm run e2e`) is not yet wired in this worktree (P3.6), so the task's acceptance ran at G0.

**Next:** P4.8 consumes these slugs for the 63 templates and adds the `exercises` kind to
`gen-seed-sql.mjs` + migration `…000800_hygieia_seed_exercises.sql`.

## 2026-10-05 — P3.3 / P4.1 / P4.2 pure-domain engines — DONE (builder, worktree `wt/d`; not yet committed)

**Pulled forward from P3/P4** by the lead: the three modules depend only on the P1.4 types
(`IngredientSeed`, `RecipeSeed`, `Unit`), not on the seed data (P1.9–P1.11 still pending), so they
were built in parallel with the rest of P1. Tests use small hand-written fixtures typed as the seed
types; the UI tasks (P3.4, P4.3) wire them to real content. No React, no I/O, no rounding anywhere —
the display rounds.

### P3.3 Fridge matcher — `src/fridge/match.ts` + `match.test.ts`

- `matchRecipes(recipes, ingredients, haveSlugs, { ignorePantryStaples })` → ranked
  `{ recipe, have, missing, coverage, substitutions, unknown }[]`; `matchRecipe` (one recipe, never
  dropped) and `indexBySlug` exported for the UI.
- Covered-by-substitute (a `substitute_slugs` entry the user has AND that resolves in the catalogue)
  counts in the numerator and is REPORTED in `substitutions`; it is NOT put in `have` or `missing`,
  so "you have 4/5 · feta → use ricotta" is honest. Coverage = (have + substitutions) / (have +
  substitutions + missing).
- `ignorePantryStaples`: a staple the user LACKS leaves the denominator and `missing`; a staple the
  user HAS still counts (the literal reading of the task; recorded here so P3.4 copy matches).
- Unknown `ingredient_slug` → ignored for matching, listed in `unknown`. Duplicate lines for one slug
  count once. Coverage 0 dropped; empty fridge → `[]`.
- Order: coverage desc → fewer missing → fewer ingredient lines → `title_en` (code-point compare, not
  `localeCompare`, so every machine agrees) → slug. Total order ⇒ deterministic; test shuffles input.
- `normalizeForSearch(s)`: NFD, strip `\p{M}`, lower-case, fold final sigma `ς→σ`, collapse
  whitespace. `'Ντομάτα'` → `'ντοματα'`; `'σαλάτα'` ≡ `'σαλατα'`; `'Crème Fraîche'` → `'creme fraiche'`.
- 19 tests.

### P4.1 Nutrition engine — `src/nutrition/compute.ts` + `compute.test.ts`

- `computeNutrition(recipe, ingredientsBySlug: ReadonlyMap)` → `{ perRecipe, perPortion, portions,
unknown, warnings, confidence: 'typical', sourceNotes }`; helpers `gramsFor`, `lineGrams`,
  `safePortions` exported.
- Grams per line = `quantity × (1 for g/ml, else grams_per_unit)`; ml is treated as g (density 1).
  Totals = Σ grams/100 × per-100 g. A line unit that is neither g/ml nor the ingredient's own unit
  still uses `grams_per_unit` and adds a `unitMismatch: <slug> …` string to `warnings`.
- `sourceNotes` = distinct `source_note` values in first-seen order (the P4.3 footnote).
- Division guard: `safePortions` = finite ? `max(1, p)` : 1 (portions ≥ 1 by type; guarded anyway).
- 13 tests incl. a hand-computed 2-ingredient recipe to 0.1 kcal, `piece` × `grams_per_unit`, Atwater
  4/4/9 within 10 % on the fixture, no-rounding proof, empty recipe → zeros not NaN.

### P4.2 Cost engine — `src/cost/compute.ts` + `compute.test.ts`

- `computeCost(recipe, ingredientsBySlug)` → `{ perRecipe: {min,max}, perPortion, portions, asOf,
unpriced, lines: {slug,min,max}[] }`; `basisQuantity`, `safePortions` exported.
- Basis: `kg`/`l` → grams (ml 1:1) / 1000; `piece` → the quantity when the line unit is `piece`, else
  grams / `grams_per_unit`. Unpriced (listed, excluded from the range, never zeroed): unknown slug,
  `price_eur_max` not a finite number > 0, or basis underivable (`grams_per_unit` 0, NaN quantity).
- `asOf` = OLDEST `price_as_of` among PRICED lines (ISO dates compare lexicographically); null when
  nothing is priced; an unpriced line's date never leaks in.
- 13 tests incl. the known 3-line recipe (1.59..2.61 €), oldest-date rule, ml→l, weight→pieces.

**Gates (G0, worktree `D:/projects/hygieia-wt/d`):** Prettier clean on the three dirs · lint 0 errors
(4 pre-existing `react-refresh` warnings, none in new files) · typecheck clean · `vitest run`
8 files / 76 tests green (31 → 76) · build green (PWA precache 24 entries) ·
`check:pwa OK — Hygieia · Υγίεια, 3 icons, sw.js present`.

**Deviations from the plan text:** none in behaviour. Additions beyond the stated shape, all additive:
`unknown` (matcher, nutrition), `warnings` (nutrition), `portions` and `lines` (cost), exported
helpers. `ingredientsBySlug` is a `ReadonlyMap` (build it with `indexBySlug`); P3.4/P4.3 decide
whether a shared index lives in `src/content/`.

**Next:** P3.4 Fridge UI and P4.3 panels consume these once P1.9–P1.11 seeds exist.

## 2026-10-05 — P2 Auth & tenancy (in progress; PLAN.md §P2) — lane E, pulled forward ∥ P1

### P2.1 Auth provider + session helpers — DONE (builder, worktree `wt/e`; not yet committed)

**Landed:** one place that knows whether there is a session, who it is, and whether auth exists at all.

- `src/auth/session.ts` — pure: `AuthState` (`unavailable | loading | anonymous | signed-in`),
  `userFromSession`, `stateFromSession`, `reduceAuthEvent(prev, event, session)` (`unavailable` is
  absorbing; `SIGNED_OUT` → anonymous; every other event reads its session), plus the redirect plumbing
  shared with P2.2: `callbackUrl(origin, baseUrl)`, `safeNextPath` (open-redirect guard: in-app paths
  only), `storeNext`/`takeNext` over an injected storage (try/catch, default `/`).
- `src/auth/AuthProvider.tsx` — `AuthProvider({ client? })` defaults to the app client; `null` →
  `unavailable` from the first render with no `window`/storage access. Otherwise subscribes
  `onAuthStateChange` FIRST, then seeds from `getSession()` only while still `loading` (an event that
  lands before the snapshot is never overwritten). Context = `{ state, client, signOut }`;
  `useAuth()` throws `useAuth must be used within <AuthProvider>` outside the provider.
- `src/main.tsx` — `<AuthProvider>` wraps the router inside `<LangProvider>`.
- `src/auth/fake-client.ts` — test double (auth methods + `profiles` table) shared by the auth tests;
  imported only from `*.test.*`, verified absent from `dist/assets/*.js`.
- Tests: `session.test.ts` (9), `AuthProvider.test.tsx` (7): null client → unavailable and
  `Storage.prototype.getItem/setItem` never called; persisted session → signed-in before any event;
  `SIGNED_IN` → signed-in with id; `SIGNED_OUT` → anonymous; early event beats late snapshot; signOut
  delegates + unmount unsubscribes; outside-provider throw pinned; `CLIENT_OPTIONS` still
  `persistSession: true, detectSessionInUrl: true, flowType: 'pkce'`.
- `package.json` NOT touched (no new deps; the plan's reservation was unused). `src/lib/supabase.ts`
  NOT touched (`db.schema` pin is P1.13's).

### P2.2 Sign-in page + PKCE callback route — DONE (builder, `wt/e`; not yet committed)

- `src/auth/SignInPage.tsx` (`/auth`): email magic link via `signInWithOtp({ email, options:
{ emailRedirectTo } })`, "Continue with Google" via `signInWithOAuth({ provider: 'google', options:
{ redirectTo } })`; redirect = `window.location.origin + import.meta.env.BASE_URL + 'auth/callback'`
  (never hardcoded). `?next=` parked in `sessionStorage` (`hygieia.auth.next`) before leaving, off-site
  values dropped. States: form → `sending` → `sent` (`role=status`) or `failed` (`role=alert`);
  `unavailable` renders the bilingual "Sign-in unavailable" state; `signed-in` shows the email + sign-out.
- `src/auth/CallbackPage.tsx` (`/auth/callback`): never touches the URL (the client exchanges `?code=`
  itself via `detectSessionInUrl`; Pages serves this deep link as the 404.html byte copy). Shows
  `callbackWorking`; on `signed-in` → `navigate(takeNext(), { replace: true })`; `callbackFailed` + link
  to `/auth` when the URL carries `error`/`error_description`, when there is no client, or when no
  session arrives within `timeoutMs` (prop, default 15 s; tests use 20 ms).
- `src/routes/routes.tsx` — two routes appended before `*`. `src/i18n/dictionary.ts` — 13 keys appended
  to the interface and BOTH literals under `// auth (P2)`: `signIn, signInIntro, signInEmailLabel,
signInSendLink, signInLinkSent, signInGoogle, signInUnavailableTitle, signInUnavailableBody,
signInFailed, signOut, callbackWorking, callbackFailed, backToSignIn` (natural Greek; parity test green).
- Tests: `SignInPage.test.tsx` (12): OTP called with the email and a redirect ending `/auth/callback`,
  then "link sent"; Google → `provider: 'google'` + same redirect; safe `?next=` stored / `//evil.example`
  not; OTP error → `signInFailed`; unavailable copy in `en` and `el`; signed-in → sign-out; callback:
  working → navigates to stored next (storage cleared) / defaults to `/`; URL error → failed immediately
  with link `/auth`; timeout → failed; null client → failed. `App.test.tsx` untouched and green (routes
  without `AuthProvider` still render `/` and `*`).

### P2.3 Profile bootstrap + `useProfile()` + admin runbook — DONE (builder, `wt/e`; not yet committed)

- `src/auth/profile.ts` — `ensureProfile(client, user)`: select `user_id, display_name, is_admin` from
  `profiles` where `user_id = eq(uid)` (`maybeSingle`); when absent, ONE insert `{ user_id, display_name:
email local-part | 'user' }` — `ProfileInsert` has no `is_admin` member, so sending it is a type error.
  `profileClientFor(HygieiaClient)` is a thin typed adapter: a direct structural assignment of the real
  client to the small `ProfileClient` interface hits TS2589 (Supabase's query-builder generics); the
  adapter pins the exact chain and the compiler still checks it against the real client (no cast).
  `useProfile()` → `{ status: idle | loading | ready | error, profile, isAdmin }`; idle/loading are
  DERIVED (`react-hooks/set-state-in-effect` forbids synchronous setState in the effect body), only the
  async outcome is state, keyed by uid. Table name unqualified (schema pin is P1.13's).
- `docs/ops/admin.md` — operator runbook: grant / revoke / verify SQL for `hygieia.profiles.is_admin` by
  email, SQL editor or Management API only (never a migration), "must have signed in once first", and what
  it does not do. Email grep over `src/` and `docs/` → no real address.
- Tests: `profile.test.ts` (7): `displayNameFor`; existing row → no insert; missing → exactly one payload
  `{ user_id, display_name }` and `not.toHaveProperty('is_admin')`; select error → throws, no insert;
  hook idle without session / in local-only; `isAdmin` true only when the row says so (admin row, plain
  row, fresh insert); DB refusal → `error`.

**Gates (G0, worktree `wt/e`, 2026-10-05):** lint 0 errors (5 warnings: the 4 pre-existing react-refresh
ones + the same warning on `useAuth` in `AuthProvider.tsx`, mirroring `useLang`) · typecheck clean ·
`vitest run` 9 files / 67 tests green (31 → 67) · build green (24 precache entries, `dist/404.html`
byte-equal to `index.html`) · `check:pwa OK — Hygieia · Υγίεια, 3 icons, sw.js present` · Prettier clean on
every touched file. G1 (`db:*`) is not runnable in this lane (P1 scripts land in another worktree).

**Not exercised live (needs OPERATOR-P2):** the real magic-link / Google round trip against the shared
project; `https://intotheveil.github.io/hygieia/auth/callback` must be on the project's redirect
allow-list (ADR-0003 rule 6). P2.QA owns that observable.

**Decision candidates for DECISIONS.md / BRAIN §7 (lead to route — outside this lane's file scope):**
(a) the `?next=` return path lives in `sessionStorage` under `hygieia.auth.next` and accepts in-app paths
only; (b) `profileClientFor` adapter instead of a structural client type or a cast; (c) callback failure
is timeout-based (15 s default, injectable) because the client exposes no "exchange failed" event.

**Next:** P2.4 `UserDataSource` and P2.5 (`RequireAdmin` + header sign-in state) consume `useAuth()`,
`useProfile()` and the `signOut` key. Merge order with P1.13 (schema pin in `src/lib/supabase.ts`) is
free — this lane never touched that file.

### P2.4 `UserDataSource`: fridge lists, saved plans, favourites — DONE (builder, `wt/e`; not yet committed)

- `src/user/source.ts` — the contract: `UserDataSource { kind: 'supabase' | 'disabled'; reason?;
userId?; fridgeLists { list, save, remove }; favourites { list, add, remove }; savedPlans { list, save,
remove } }`, `Result<T> = { ok: true; data } | { ok: false; error: 'disabled' | 'network' | 'unknown' }`
  (nothing throws), row types (`FridgeList`, `SavedPlan`, `Favourite`) and WRITE payload types
  (`FridgeListInput { id?, name, ingredient_slugs }`, `SavedPlanInput { diet_id, week_start, plan }`,
  `FavouriteInput { recipe_id }`) — none has a `user_id` member, so sending it is a type error.
  `USER_TABLES` pins the three table names; `JsonValue` types the `plan jsonb`.
- `src/user/disabled.ts` — `disabledSource(reason)`: every list `{ ok: true, data: [] }`, every write
  `{ ok: false, error: 'disabled' }`.
- `src/user/supabase.ts` — `userDataClientFor(HygieiaClient)` typed adapter (the P2.3 pattern; a direct
  structural assignment hits TS2589) pinning exactly: `fridge_lists` `select(…).order('updated_at')` /
  `upsert(values).select(…).single()` / `delete().eq('id', id)`; `saved_plans` `select(…).order('week_start')`
  / `insert(values).select(…).single()` / `delete().eq('id', id)`; `favourites` `select(…).order('created_at')`
  / bare `insert({ recipe_id })` / `delete().eq('recipe_id', …)`. `supabaseSource(client, uid)` wraps each
  call in `run()`: PostgREST error → `classifyError` (`TypeError` or code-less error = `network`; a
  SQLSTATE/`PGRST…` code or any other thrown `Error` = `unknown`), rows parsed defensively (a malformed
  row → `unknown`, never a crash). **`user_id` is never sent and never filtered on** — the column default
  `auth.uid()` supplies it and RLS scopes every verb (DECISIONS.md 2026-10-05). `uid` is recorded as
  `userId` for consumers and so the hook re-binds on session change; it is in no payload or filter.
  Column lists are explicit (no `*`, no `user_id`). Table names unqualified (schema pin is P1.13's).
- `src/user/useUserData.ts` — `useOptionalAuth()` (new in `AuthProvider.tsx`: the context or null, so
  components on `/` degrade without a provider) → `disabled('local-only')` when the client is null (or no
  provider), `disabled('signed-out')` while loading/anonymous, else the supabase source bound to the uid;
  memoised on `(client, uid)` so effects may depend on the instance.
- `src/components/SignedOutNote.tsx` — `local-only` → `userDataUnavailableLocal`; `signed-out` →
  `userDataSignInToSave` + link to `/auth?next=<pathname+search>` (URL-encoded; `safeNextPath` screens it on
  return).
- `src/auth/fake-client.ts` — EXTENDED (not a second fake): `from(table)` keeps the `profiles` behaviour
  and gives every other table a thenable builder (`select/order/single/maybeSingle/eq/insert/upsert/delete`)
  that RECORDS `{ table, op, payload, filters }` into `fake.calls`; options `userTables: { rows, error,
reject }`. A written row comes back WITH `user_id` (simulating the DB default).
- Dictionary: 5 keys under `// user data (P2.4)`: `userDataUnavailableLocal, userDataSignInToSave, saved,
save, remove` (both languages; parity test green).
- Tests `src/user/source.test.ts` (14): disabled impl for both reasons (7 writes refused, 3 lists empty);
  supabase impl targets exactly `{fridge_lists, saved_plans, favourites}` and never `profiles`; sweep over
  10+ recorded calls: no `user_id` in any payload, no `user_id` filter, uid absent from the serialised calls,
  column lists carry neither `*` nor `user_id`; favourites add/remove shapes; fridge upsert with/without `id`;
  plans insert shape; list parsing; malformed row → `unknown`; `42501` → `unknown` for every op; rejected
  `TypeError` → `network` for every op; code-less error → `network`; `classifyError` table; hook: null client
  and no provider → `local-only`; loading and anonymous → `signed-out` (no table call made); signed-in →
  `supabase` with `userId`, referentially stable across re-renders; `SIGNED_OUT` → back to `signed-out`.

### P2.5 Route guards, account menu, `/admin` placeholder — DONE (builder, `wt/e`; not yet committed)

- `src/auth/RequireAuth.tsx` — `loading` → one `role=status` line (`loading`); `unavailable` → the sign-in
  page's unavailable copy + home link; `anonymous` → `<Navigate replace to="/auth?next=<pathname+search>">`;
  `signed-in` → children.
- `src/auth/RequireAdmin.tsx` — `RequireAuth` around an `AdminGate` that reads `useProfile()`: `idle`/`loading`
  → loading line; `!isAdmin` (including a profile read ERROR — never fail open) → bilingual 403
  (`notAllowedTitle`/`notAllowedBody` + home link); admin → children.
- `src/components/AccountMenu.tsx` — `useOptionalAuth()`: no provider / `unavailable` / `loading` → renders
  nothing (so `App.test.tsx`, which mounts `/` without `AuthProvider`, is untouched and green); `anonymous` →
  "Sign in" link to `/auth`; `signed-in` → `<nav aria-label=account>` with a link to `/account` showing the
  email (id when the provider gave none) and a sign-out button calling `signOut()`. Shows the EMAIL, not the
  profile display name, on purpose: `useProfile()` would start a second `ensureProfile` bootstrap from the
  header on every page (and P2.3's display name is the email local-part anyway).
- `src/account/AccountPage.tsx` — placeholder: `h1 = account`, three `role=tab` buttons (`savedPlans`,
  `savedFridgeLists`, `favourites`), one `tabpanel` listing rows from `useUserData()` (`week_start · diet_id`,
  `name (n)`, `recipe_id`) or `nothingSavedYet`; loading derived from "outcome is for this source instance"
  (no synchronous setState in the effect). A disabled source renders `SignedOutNote`. A failed list shows as
  empty — P4.6 owns the error state and editing (no key was added for it).
- `src/admin/AdminPage.tsx` — placeholder: `adminTitle` + `adminPlaceholder` ("review tools arrive in P4")
  - home link. P4.10 replaces the file.
- `src/App.tsx` — header right side is now `<div class="flex items-center gap-2"><AccountMenu/><LangSwitch/></div>`;
  nothing else changed. `src/routes/routes.tsx` — `/account` → `<RequireAuth><AccountPage/></RequireAuth>`,
  `/admin` → `<RequireAdmin><AdminPage/></RequireAdmin>`, appended before `*`.
- Dictionary: 10 keys under `// guards (P2.5)`: `account, notAllowedTitle, notAllowedBody, adminTitle,
adminPlaceholder, savedPlans, savedFridgeLists, favourites, nothingSavedYet, loading`. `adminTitle` is ONE
  key beyond the lead's list — the admin page needed an `h1` and the bilingual rule forbids a literal.
- Tests `src/auth/guards.test.tsx` (29, through the real `AppRoutes` + a `LocationProbe`): anonymous at
  `/account` → location `/auth?next=%2Faccount` and the sign-in page renders; query string preserved
  (`%2Faccount%3Ftab%3Dfavourites`); local-only → unavailable copy, stays on `/account` (en+el); loading →
  `loading` line (en+el); signed-in → account page with three tabs and `nothingSavedYet` (en+el); seeded
  rows listed per tab, reads only, three tables; `/admin`: anonymous → `/auth?next=%2Fadmin`; non-admin →
  403 (en+el) and no placeholder; first-time user (no row) → 403 with ONE insert without `is_admin`; profile
  read failure → 403; admin → placeholder (en+el) and no 403; profile pending → loading line and neither
  outcome (en+el); local-only → unavailable copy (en+el). `AccountMenu`: signed-in → email + `/account`
  link + sign-out calling `signOut` (en+el); id fallback; anonymous → `/auth` link (en+el); nothing in
  local-only, while loading, and without any provider; sits in the home `banner` beside the language switch.

**Gates (G0, worktree `D:/projects/hygieia-wt/e`, 2026-10-05):** `npm run lint` 0 errors (6 warnings: the 5
pre-existing `react-refresh/only-export-components` + the same on `useOptionalAuth`) · `npm run typecheck`
clean · `npm test` **16 files / 274 tests green** (231 → 274: +14 `source.test.ts`, +29 `guards.test.tsx`;
`App.test.tsx` untouched and green) · `npm run build` green (24 precache entries, `dist/404.html` byte-equal
to `index.html`; `fakeClient` absent from `dist/assets/*.js`) · `check:pwa OK — Hygieia · Υγίεια, 3 icons,
sw.js present` · Prettier clean on every touched file. `npm ci` was run once in the worktree (pglite missing).

**Not exercised live (OPERATOR-P2 / P2.QA):** a real favourite/fridge-list round trip against the shared
project (needs the P1.7 tables applied live and the P1.13 schema pin) and the admin flag flip. Everything
here is proven against the fake only.

**For the lead to route (outside this lane's file scope):** BRAIN.md §3/§6/§7 for P2.4/P2.5 (per CLAUDE.md
§0; `BRAIN.md` was not in the task's file list); DECISIONS.md has the `user_id` rule (appended by this task).

### P2.6 `npm run db:live-check` — read-only live probe, skips without env — DONE (builder, `wt/e`; not yet committed)

- `scripts/db-live-check.mjs` — exports `runLiveCheck({ env, fetch, archiveDir, log, error })` → exit code (the CLI
  sets `process.exitCode`; no `process.exit()`). READ-ONLY: the only Management-API statements it sends are the
  applier's two `select`s (`readApplied` from `db-apply.mjs`: `to_regclass` first, then the ledger rows); the
  only PostgREST calls are two anon `GET`s. Required env (names only, never read from a file): `SUPABASE_ACCESS_TOKEN`,
  `HYGIEIA_SUPABASE_PROJECT_REF`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`. ANY unset/blank →
  `LIVE-CHECK SKIPPED — missing: <names>. Needs every one of: <all four>. Skipped is NOT passed; … Nothing was sent.`
  and exit 0 with zero requests (the Themis `e2e:live` pattern). Three probes, each printed as one `PASS`/`FAIL`
  line, all three run even when an earlier one fails (they are independent reads):
  1. `ledger` — `compareLedger(local, applied)` (pure, reused helpers `loadMigrations`/`readApplied`/`LEDGER`):
     ledger table absent → `ledger absent — nothing applied yet (hygieia.schema_migrations does not exist …)`;
     then per archive file `MISSING:` / `CHECKSUM MISMATCH: <file> was applied with sha256 A but the file now hashes
to B`; then `EXTRA: live ledger holds version X (name) which has no file in this archive`. First problem is
     THE mismatch; the rest are listed indented under it.
  2. `GET /rest/v1/recipes?select=id&status=eq.pending` and 3. `GET /rest/v1/profiles?select=user_id`, headers
     `apikey` + `Authorization: Bearer <anon>` + `Accept-Profile: hygieia` → must be HTTP 200 and `[]`. Rows →
     `anon can see pending recipe row(s) live …` / `anon can see profile row(s) live …` (`N row(s) returned`).
     404/406 with PostgREST `code PGRST106` or a message about the schema (not "schema cache") →
     `schema hygieia is not exposed in the Data API (ADR-0003 rule 5 / BRAIN O1) — HTTP 406: …`. A `PGRST205` 404
     (schema exposed, TABLE missing) is reported as "its migration is not applied (or the schema cache is stale)".
     Anything else → `HTTP <status>: <message>`; a thrown fetch → `network error calling PostgREST: …`.
  - Ends `LIVE-CHECK PASSED — 3 read-only probe(s) against project <ref>` (exit 0) or, on stderr,
    `LIVE-CHECK FAILED — <first mismatch> (+N more)` (exit 1). Exit 2 = malformed ref/URL, nothing sent.
  - Every line goes through `redact(s, [token, anonKey])` from `lib/mgmt-api.mjs` — the anon key is public by
    design but there is no reason to print it either. `REST_PROBES`, `restProbe`, `classifyRestAnswer`,
    `parseRestBody` are exported for P6.3's `smoke:live` to reuse.
- `scripts/db-live-check.test.ts` (`@vitest-environment node`, 22 tests, one fake fetch playing both endpoints
  by URL): the four names pinned; no env → SKIPPED, all four names, exit 0, zero calls; partial env → only the
  missing ones listed as missing; blank = missing; happy path against the REAL archive's checksums →
  3 PASS lines + `LIVE-CHECK PASSED`; every mgmt query is `^select ` and never insert/update/delete/create/alter/
  drop/begin/commit/truncate, every REST call is GET with `Accept-Profile: hygieia` + the anon key, exact URLs in
  order; trailing-slash URL tolerated; mismatches: changed checksum (edited copy of the real file vs the original
  ledger row), extra version, missing version (2-file fixture), absent ledger (only `to_regclass` sent),
  `compareLedger` purity/ordering, Management API 500 (ledger FAIL, anon probes still run); pending rows visible,
  profiles visible, 406 PGRST106 on both probes → the ADR-0003 rule 5 message, 404 "Invalid schema" vs PGRST205 vs
  401/502/200-non-array classification, network error on a probe; redaction: token echoed by the API → `[REDACTED]`,
  anon key echoed by PostgREST → `[REDACTED]`, bad ref / bad URL → exit 2 with no request. `runIt` asserts on
  EVERY run that neither the token nor the anon key appears in any captured stdout/stderr line.
- `package.json` — one line: `"db:live-check": "node scripts/db-live-check.mjs"` (the phase's second
  package.json edit, as PLAN P2.6 reserves).

**Gates (worktree `D:/projects/hygieia-wt/e`, 2026-10-05):** `npm run lint` 0 errors (the 6 pre-existing
react-refresh warnings in `AuthProvider.tsx`/`LangProvider.tsx`/`routes.tsx`; `.mjs` is outside eslint's `files`) ·
`npm run typecheck` clean (`tsconfig.scripts.json` covers the new test; the `.mjs` JSDoc types check through it) ·
`npm test` **20 files / 347 tests green** (325 → 347) · `npm run build` green (24 precache entries) ·
`check:pwa OK — Hygieia · Υγίεια, 3 icons, sw.js present` · `npm run db:live-check` with no env →
`LIVE-CHECK SKIPPED — missing: SUPABASE_ACCESS_TOKEN, HYGIEIA_SUPABASE_PROJECT_REF, VITE_SUPABASE_URL,
VITE_SUPABASE_ANON_KEY. …`, exit 0 · Prettier clean on the three touched files. No live request was made by
anything in this task.

**Not exercised live (P2.QA item 5, operator machine):** `LIVE-CHECK PASSED` against the real project. Note for
QA: until the P1 content/profile migrations are applied live, probes 2–3 will legitimately FAIL with the
`PGRST205` "table … not in the live Data API" line (or the PGRST106 line until `hygieia` is added to the exposed
schemas — BRAIN O1); that is the check doing its job, not a bug. `HYGIEIA_SUPABASE_PROJECT_REF` must be the
20-char ref (`createMgmtClient` refuses anything else, exit 2).

**For the lead to route (outside this lane's file scope):** BRAIN.md §3/§6 for P2.6; DECISIONS.md one-liner
candidate: "db:live-check redacts the anon key too, runs all three probes independently, and classifies
PGRST106 (schema not exposed) separately from PGRST205 (table missing)".

## 2026-10-05 — P1 Data spine (in progress; PLAN.md §P1)

### P1.9 Seed content: ingredients — DONE (builder, worktree `wt/b`; not yet committed)

**Landed:** `src/content/seed/ingredients.ts` — `export const INGREDIENTS: readonly IngredientSeed[]`,
**322 ingredients** (floor 160, target 250+), plain data grouped by category with a comment header per
group, Prettier-clean; and `src/content/seed/ingredients.test.ts` (20 Vitest cases).

**Category breakdown (16 categories):** vegetables 44 · fruit 29 · legumes 18 · grains-bread 18 ·
pasta-rice 10 · dairy-eggs 33 · meat 23 · poultry 10 · fish-seafood 23 · nuts-seeds 17 · oils-fats 8 ·
herbs-spices 25 · condiments 15 · sweeteners 11 · beverages 14 · pantry 24. Pantry staples: 25.
Rows with ≥ 1 substitute: 262 (every substitute resolves; none self-referential).

**Content rules applied (PLAN.md §0 drafting rule, §2 `ingredients` row):** `name_el` Greek script on
every row (loanwords transliterated: κινόα, τόφου, κέιλ, σκυρ, τέμπε — the test's Latin allow-list is
empty); nutrition per 100 g edible portion, `source_note` = `'Typical values, USDA FoodData Central
reference ranges'` verbatim on every row; `unit` = natural recipe unit with `grams_per_unit` (egg 50,
lemon 100, onion 150, clove 3, tbsp olive oil 13.5, tsp salt 6, slice bread 30, bunch parsley 60);
prices as typical Greek supermarket ranges, `price_as_of: '2026-10-05'`, `price_note` naming the basis.
Diet coverage asserted by test: Mediterranean (olive oil, feta, Greek yoghurt, Kalamata olives, oregano,
lemon, tahini, halloumi, trahana, fava, horta, octopus, sardines, anchovies), keto/low-carb (butter,
cream, avocado, almond flour, cauliflower, zucchini), carnivore (steak, liver, kidney, heart, bone marrow,
lard, tallow), vegan (tofu, tempeh, seitan, soy mince, lentils, chickpeas, oat milk, nutritional yeast,
pea protein), paleo (sweet potato, nuts, eggs).

**Test (`ingredients.test.ts`):** count ≥ 160 (logs `INGREDIENTS count: 322`); unique `SLUG_RE` slugs;
names non-blank; Greek script unless allow-listed (allow-list entries must exist); no duplicate names
in either language; macros ≥ 0 and sum ≤ 100; kcal 0..900; **Atwater 4/4/9 sanity check** (±25 % or
±20 kcal; explicit, reasoned exemptions: sugar alcohols, alcohol, fibre-dominated spices/cocoa/psyllium,
baking powder); `source_note` exact; `unit ∈ UNITS`, `grams_per_unit > 0`, g/ml rows weigh 1;
`0 ≤ price_min ≤ price_max`, `price_per ∈ PRICE_PER`; `price_as_of` ISO + parses; `price_note` names a
basis; substitutes resolve, non-self, no duplicates, ≥ 100 rows carry one; every category ≥ 3 rows and
≥ 10 categories; ≥ 12 staples including salt/pepper/water/olive-oil/vinegar/oregano; diet-staple
presence; compile-time `readonly IngredientSeed[]`.

**RED proof (§5 "running the real thing"):** sabotaged one substitute (`no-such-slug`) and one macro
sum (sugar carbs 101) → exactly 2 failures naming the rows (`tomato → no-such-slug does not resolve`,
`sugar macro sum 101`); regenerated → 20/20 green. Node type-stripping import (what P1.12's generator
does): `node -e "import('./src/content/seed/ingredients.ts')"` → `node-import OK 322`.

**Non-obvious choices (for DECISIONS.md / BRAIN §7 — lead to record; out of this task's file scope):**

- Lard and tallow are 902 kcal/100 g in USDA; the schema caps `kcal_100g` at 900, so both carry 900
  (documented in the file header). Everything else is unrounded typical values.
- Items sold by the bunch/head/cube/sheet/1 g sachet use `price_per: 'piece'` and the `price_note`
  names the basis ("… per bunch"), since `PRICE_PER` has only kg / l / piece.
- Nutrition is for the state named in `name_en` (dry legumes/grains/pasta, raw meat/fish, drained
  canned goods, brewed beverages). Recipes (P1.11) must scale from these, not cooked weights.
- Seed import path is `'../types.ts'` (explicit extension), matching `types.ts → './enums.ts'`, so
  `scripts/*.mjs` can import the module under node's type stripping without a resolver.

**Gates (G0, in `D:/projects/hygieia-wt/b`):** lint 0 errors (4 pre-existing `react-refresh` warnings
in `App.tsx`/`routes.tsx`, none in `src/content`) · typecheck clean · `vitest run` 6 files / 51 tests
green (31 → 51) · build green (PWA precache 24 entries) · `check:pwa OK — Hygieia · Υγίεια, 3 icons,
sw.js present` · Prettier check clean on `src/content/seed/`.

**Next:** P1.10 diets (∥ B), P1.11 recipes use these slugs; P1.12 generates
`20261006000500_hygieia_seed_ingredients.sql` from this module (gate asserts ≥ 160 → will see 322).

### P1.10 Seed content: diets (16, EL+EN) — DONE (builder, worktree `wt/c`; not yet committed)

**Landed:** `src/content/seed/diets.ts` exporting `DIETS: readonly DietSeed[]` (plus the shared
caution strings `ASK_DOCTOR_EL` / `ASK_DOCTOR_EN`) and `src/content/seed/diets.test.ts`. Operator
asked for "as many as you can" over the plan's eight; 16 shipped. Every entry has both languages on
the same row (PLAN.md §1.2), equal-length `*_el`/`*_en` arrays, 6–9 allowed/avoided, 3–5 pros/cons
(evidence quality and practicality stated honestly), and ≥ 2 `avoid_if` entries, the first always the
pregnant/breastfeeding · medical treatment · diagnosed condition → ask a doctor or dietitian sentence,
followed by diet-specific cautions (kidney disease for high-protein/Atkins/paleo, T1D + SGLT2 for
keto, eating-disorder history for fasting/Whole30/carnivore/vegan, "do not cut gluten before testing"
for gluten-free, "needs an IBS diagnosis, short-term, dietitian-guided" for low-FODMAP).

| slug                   | source_url                                                    |
| ---------------------- | ------------------------------------------------------------- |
| `mediterranean`        | Harvard T.H. Chan Nutrition Source — diet review              |
| `dash`                 | NIH/NHLBI — DASH eating plan                                  |
| `flexitarian`          | null                                                          |
| `pescatarian`          | null                                                          |
| `vegetarian`           | NHS — the vegetarian diet                                     |
| `vegan`                | NHS — the vegan diet                                          |
| `paleo`                | Harvard T.H. Chan Nutrition Source — diet review              |
| `low-carb`             | Mayo Clinic — low-carb diet                                   |
| `keto`                 | Harvard T.H. Chan Nutrition Source — diet review              |
| `atkins`               | null                                                          |
| `carnivore`            | null                                                          |
| `intermittent-fasting` | Harvard T.H. Chan Nutrition Source — diet review              |
| `whole30`              | null                                                          |
| `gluten-free`          | Harvard T.H. Chan Nutrition Source — gluten                   |
| `high-protein`         | null                                                          |
| `low-fodmap`           | Monash University FODMAP (the diet's originating institution) |

10 of 16 carry a URL; the six nulls are patterns with no single authoritative page I was certain of
(PLAN.md §0: never invent a source — null over a guess). Nordic and Zone were considered and skipped
to keep the set at diets I could describe accurately and even-handedly. Greek loanwords (keto,
paleo, Atkins, Whole30, DASH, FODMAP, flexitarian, pescatarian, vegan) stay Latin-script in `el`;
`whole30` is the one `name_el` without Greek script (brand name) and is allow-listed in the test.

**Test (83 cases):** count ≥ 8 and the eight mandatory slugs present; unique slugs matching
`SLUG_RE`; per diet: `name`/`summary` non-blank both languages; every array pair equal length and
≥ minimums (6/6/3/3/2) with no blank entry; both `avoid_if` arrays contain the doctor/dietitian key
phrase; `source_url` null or `^https?://` without `example.com`/`placeholder`/`TODO`; `name_el`
Greek-script unless allow-listed. **Mutation proof:** deleting one diet's `ASK_DOCTOR_EN` turned
exactly two cases red (`avoid_if: el 2 vs en 1` and the caution check); restored → 83/83.

**Gates (G0, in `D:/projects/hygieia-wt/c`):** lint 0 errors (same 4 pre-existing warnings, none in
`src/content`) · typecheck clean · `vitest run` 6 files / 114 tests green (31 → 114) · build green
(PWA precache 24 entries) · `check:pwa OK — Hygieia · Υγίεια, 3 icons, sw.js present` · Prettier
unchanged on both files.

**Deviation from PLAN.md P1.10 acceptance, by the operator's instruction:** the plan says "exactly 8";
the test asserts ≥ 8 plus the eight named slugs. P1.12's gate line `diets = 8` and P1.13's
`listDiets` ≥ 8 should read **16** when those tasks land (lead to adjust).

**Next:** P1.11 recipes tag `diet_slugs` against these 16; P1.12 generates `…000600_hygieia_seed_diets.sql`.

### P1.4 Content domain types, enums and slugs — DONE (builder; not yet committed)

**Landed:** the TS contract for every seed module, migration and UI (PLAN.md §2), front-loaded for
P1.6/P1.9–P1.13.

- `src/content/enums.ts` — every runtime value: `UNITS` (8), `PRICE_PER` (3), `WORKOUT_TYPES` (7),
  `LEVELS`, `INTENSITIES`, `BLOCKS` (3 each), `MEAL_TYPES` (4), `TIP_TOPICS` (6), `CONTENT_STATUSES`
  (3) as `as const` arrays with derived unions; `SLUG_RE`; `CONTENT_TABLES` (6), `CHILD_TABLES` (3),
  `USER_TABLES` (3).
- `src/content/types.ts` — type-only: `Localized<K, T>` (`{ x_el, x_en }` pair), `ReviewColumns`,
  the six `*Seed` types (no `id`/`status`/review/timestamps; children refer by slug) and `*Row` =
  seed + `ReviewColumns`; `RecipeLineSeed`, `WorkoutBlockSeed`.
- `src/content/types.test.ts` — 12 cases: each enum array literal (length + order), no duplicates,
  `SLUG_RE` accept/reject set, table lists disjoint, compile-time `satisfies`/`expectTypeOf` proofs
  that a seed has no `id`/`status` and a row does.

**Why runtime values live in `enums.ts` only:** `scripts/*.mjs` (seed generator, PGlite gate) import
these modules under node's type stripping; `types.ts` erases to zero exports. Verified:
`node -e "import './src/content/enums.ts'"` on node v24.11.1 → `node-import OK 8 true 6`, 0 exports
from `types.ts`. Erasable syntax only (no `enum`/`namespace`/parameter properties).

**Gates (G0):** lint 0 errors (4 pre-existing warnings, none in `src/content`) · typecheck clean ·
`vitest run` 5 files / 31 tests green (19 → 31) · build green (PWA precache 24 entries) ·
`check:pwa OK — Hygieia · Υγίεια, 3 icons, sw.js present` · Prettier clean.

**Next:** P1.6 contract test must assert the migration CHECK literals equal these arrays.

## 2026-10-05 — P1.1 + P1.2 + P1.3 — migration toolchain, PGlite gate, live applier (builder, worktree `wt/a`)

**Done (P1.1 — scaffold):** `package.json` scripts `db:check`, `db:gate`, `db:gate:prove-red`, `db:apply`,
`seed:gen`, `seed:check`; devDep `@electric-sql/pglite ^0.5.8` (lock updated). `scripts/check-migrations.mjs`
lifted from Themis with `themis → hygieia`: `FILENAME_RE = /^\d{14}_hygieia_[a-z0-9_]+\.sql$/`, rule
`target-outside-hygieia`, `FORBIDDEN_SCHEMAS = public, auth, storage, supabase_migrations, extensions`
(`extensions` added per ADR-0003; `gen_random_uuid()`/`md5()` are core so no extension schema is ever needed),
allow `references auth.users`, `auth.uid()`, a read `from`/`join auth.users`; forbid triggers on `auth.users`,
`create extension`, `alter system`, `drop schema`, `alter role`, default privileges outside `in schema hygieia`.
`scripts/check-migrations.test.ts` (84 cases, `// @vitest-environment node`), `scripts/lib/mgmt-api.mjs`
(verbatim), `supabase/migrations/.gitkeep`. Stubs so CI never breaks on a reserved script:
`scripts/db-gate-prove-red.mjs` (prints `not implemented yet (P1.14)`, exit 0; P1.14 replaces it) and
`scripts/gen-seed-sql.mjs` (`seed:gen` / `seed:check --check`, prints `not implemented yet (P1.12)`, exit 0;
P1.12 replaces it). `tsconfig.scripts.json` (Themis shape, `include: scripts/**/*.test.ts`) referenced from
`tsconfig.json` so the script tests are typechecked under `tsc -b`; `tsconfig.app.json` stays `include: ["src"]`;
`vite.config.ts` untouched (its `test.exclude` never excluded `scripts/**`).

**Done (P1.2 — gate):** `supabase/migrations/20261006000100_hygieia_schema.sql` (schema, USAGE grants,
per-schema default-privileges revoke, `hygieia.schema_migrations` RLS on / no policy / revoked from
anon+authenticated, `hygieia.touch_updated_at()` with `search_path = ''` and EXECUTE revoked from public, anon,
authenticated). `scripts/db-gate/shim.mjs`: roles `anon`/`authenticated`/`service_role bypassrls`, `auth.users`
(`email_confirmed_at default now()`), `auth.uid()`, `public` default privileges, Alyssos-shaped `public.profiles`
(RLS on, the name-collision proof) and `public.spatial_ref_sys` with RLS OFF as live, `supabase_migrations.schema_migrations`
with `ALYSSOS_MIGRATION_ROWS = 12` (constant — the check is invariance, not the number), plus `foreignSnapshot()`
(object counts in public/auth/supabase_migrations + the spatial_ref_sys RLS state). Nothing pre-granted on schema
`hygieia`. `scripts/db-gate.mjs`: guard first, shim, apply, re-apply, bootstrap contract, Alyssos invariance,
`no trigger on auth.users`; never `process.exit()` — `process.exitCode = await main()`.

**Done (P1.3 — applier):** `scripts/db-apply.mjs` (`ENV_TOKEN = SUPABASE_ACCESS_TOKEN`,
`ENV_REF = HYGIEIA_SUPABASE_PROJECT_REF`, `LEDGER = hygieia.schema_migrations`, `PAIRED = []`, usage
`npm run db:apply [-- --apply]`; dry-run default with every batch ending `rollback;`; `--apply` commits one batch
per unit; refusals CHECKSUM CHANGED / OUT OF ORDER / TRANSACTION CONTROL / applied-without-file / guard red;
missing env → exit 2 naming both vars; token redacted from every line). `scripts/db-apply.test.ts` (34 cases):
fake-fetch API, synthetic four-file archive for every multi-file scenario (no hard-coded real-archive sizes),
and a PGlite-backed fake endpoint proving the batches run on real Postgres (dry-run leaves no `hygieia` schema;
`--apply` records the sha256 row; re-run is a no-op; Alyssos ledger untouched; an erroring later file leaves its
transaction uncommitted while the earlier files stand).

**Finding (recorded here for the lead → DECISIONS.md / BRAIN §5; out of this task's file scope):**
`alter default privileges in schema hygieia revoke execute on functions from public` does NOT stop anon/PUBLIC
EXECUTE on functions created afterwards. Postgres ADDS per-schema default privileges to the global ones, and the
hardwired global default grants EXECUTE to PUBLIC; proven in PGlite (`proacl` stays NULL, `has_function_privilege('anon', …)`
= true; only a GLOBAL `alter default privileges revoke …` flips it, and that would be project-wide → forbidden by
ADR-0003 and the guard). Consequence: every function a Hygieia migration creates MUST `revoke execute … from
public, anon` explicitly, and `db:gate` now sweeps every function in schema `hygieia` for anon/PUBLIC EXECUTE
and a pinned `search_path` (3 PASS lines, grows with the schema). The per-schema line stays in the bootstrap as
PLAN P1.2 specifies, with an honest comment. Themis's bootstrap carries the same line with the optimistic
comment; its P1.8 sweep covers it functionally — worth a note to Themis.

**Gates (2026-10-05, worktree `D:/projects/hygieia-wt/a`):**
`npm run lint` 0 errors (4 pre-existing react-refresh warnings in `src/i18n/LangProvider.tsx`, `src/routes/routes.tsx`) ·
`npm run typecheck` clean (app + node + scripts projects) · `npm test` 6 files / 137 tests green (19 app + 118 scripts) ·
`npm run build` green, `dist/404.html` byte-equal to `index.html` · `check:pwa OK — Hygieia · Υγίεια, 3 icons, sw.js present` ·
`npm run db:check` → `PASS  migration guard: 1 migration(s) stay inside schema hygieia`, exit 0 (on the empty
archive before P1.2: `FAIL  migration guard: no migrations found in …`, exit 1) ·
`npm run db:gate` → `applied  20261006000100_hygieia_schema.sql`, `PASS  re-apply … (idempotent-safe)`, every
PLAN P1.2 contract line PASS (schema exists; ledger columns; PK version; RLS enabled; NO policies; anon/authenticated
hold no privilege; anon/authenticated/service_role USAGE; touch_updated_at returns trigger, search_path pinned,
anon + PUBLIC no EXECUTE, bumps updated_at; function sweep ×3; `supabase_migrations.schema_migrations still holds
12 rows`; zero foreign objects changed; no trigger on auth.users), ends `GATE PASSED — …`, exit 0 ·
`npm run seed:check` / `npm run db:gate:prove-red` → stub lines, exit 0 ·
`npm run db:apply` with no env → `db:apply: missing env SUPABASE_ACCESS_TOKEN and HYGIEIA_SUPABASE_PROJECT_REF. …`,
exit 2; `-- --commit` → usage line, exit 2. No live request was made by anything in this task.

**Not done / next:** nothing committed (the lead merges `wt/a`). Live application of the bootstrap is OPERATOR-P1,
never a crew step. P1.4 (content types) is independent; P1.5+ build on the bootstrap. The P1.14 and P1.12 stubs
must be replaced, not kept.

## 2026-10-05 — P0 Foundation (NEW PRODUCT scaffold, run from Zeus)

**Intent (operator, via zeus-hq):** a Greek/English bilingual tool — health tips; diets (every
type, with meal plans); recipes tagged per diet plus "What's in my fridge"; meal price estimate;
meal calorie estimate; workout types with recommendations per type (home / gym / calisthenics) at
three levels and intensities.

**Name:** Hygieia (goddess of health; unused in FLEET.md, `fleet.repos`, all intotheveil repos).
Operator confirmed. Repo `intotheveil/hygieia`, **public** (operator's choice).

**Done:**

- Repo created and scaffolded on the house stack: React 19 + Vite 8 + TypeScript strict +
  Tailwind 4, Vitest + Testing Library, ESLint 10 flat + Prettier, CI + Pages deploy workflow,
  `.env.example` (names only). Configs lifted from Themis's P0 (the fleet's current reference).
- P0 shell: bilingual home page (six module cards, honest "no content yet" status), language
  switch with persistence, not-found route, Supabase client in local-only mode.
- Tests: dictionary parity + Greek-script check, language detection/persistence, env resolution,
  App rendering/switching/not-found, basename mapping.
- Crew kit installed from `zeus/.zeus/kit/` named sources (one-row manifest sync), constitution
  composed by `kit.mjs`, `BRAIN.md` seeded from the fleet template.

**Gates (2026-10-05):** lint 0 errors · typecheck clean · 19 tests green · build green (404 fallback
byte-equal) · SubagentStop gate `ran[secret-scan typecheck lint test] skipped[none]` · verify-kit PASS ·
CI green · live URL verified by HTTP (200, title, favicon, deep-link fallback, bundle).

**Next:** operator approves `zeus/specs/HYGIEIA_SPEC.md` (open questions) → planner → P1/P3.
