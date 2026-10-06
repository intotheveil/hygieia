# DECISIONS — Hygieia (`hygieia`)

Dated, append-only. Any non-obvious choice lands here (CLAUDE.md §5).

## ADR-0001 — 2026-10-05 — GitHub Pages, public repo, no Supabase project yet

**Decision.** The repo is **public** (operator's choice at NEW PRODUCT time) and the app is hosted on
**GitHub Pages** (`.github/workflows/deploy.yml`, project site at `intotheveil.github.io/hygieia/`,
Vite `base: '/hygieia/'`). **No Supabase project is created yet.** The client is wired
(`src/lib/supabase.ts`) and reads only `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`; with neither
set the app runs in local-only mode and makes no request.

**Why.** The house stack names "Supabase (EU project)", but P0 persists nothing and holds no secret,
so an empty project would be cost and surface with no user. Pages on this plan requires a public
repo, which the operator accepted. When a phase needs persistence (saved plans, fridge lists,
accounts), the project is created **in an EU region** and this ADR is superseded, the way Themis's
ADR-0002 superseded its ADR-0001.

**Consequences.** (1) Everything in the bundle is public; any model call (meal/calorie estimation by
AI) needs a server-side proxy, not a browser key. (2) CLAUDE.md §9 P1 (data spine) and P2 (auth)
are deferred, not skipped. (3) The static-site secret boundary is enforced by `eslint.config.js`
(server-only names and non-allow-listed `VITE_*` names are lint errors in `src/**`).

## ADR-0002 — 2026-10-05 — bilingual by type, no i18n library in P0

**Decision.** Greek and English are peers in one typed `Dictionary` (`src/i18n/dictionary.ts`): two
literals satisfy one interface, so a missing translation is a compile error. Greek is the default
(`index.html lang="el"`, Greek browsers), a stored choice wins, English otherwise. No i18next or
similar in P0.

**Why.** The product is bilingual by definition, and the failure mode to design against is a key
present in one language and blank in the other. The type system catches that for free; a runtime
library would add a dependency and move the check to test time. If content (recipes, diets) grows
to need pluralisation, interpolation or lazy-loaded namespaces, this ADR is reopened.

## 2026-10-05 — NEW PRODUCT step 4: no `BRAIN_DISCIPLINE.md` append

The kit already installs that text as CORE §0 via `kit.mjs apply`; ZEUS.md step 4 says not to
append it (zeus BRAIN §4 B5). Recorded so the absence is not mistaken for a skipped step.

## 2026-10-05 — `.claude/.no-greek-scan` present on purpose

The kit guard blocks Greek script in commits by default (it reads as raw client data). Hygieia ships
Greek copy in `src/i18n/dictionary.ts` by design, so the marker disables that single rule. The other
guard rules still run.

## ADR-0003 — 2026-10-05 — shared Supabase project: Alyssos's `alyssos`, own schema `hygieia`

**Decision.** Hygieia persists to **Alyssos's LIVE Supabase project `alyssos`** (ref
`jenbakghoiaiwceyrshz`, eu-west-1), not a project of its own. Every Hygieia object lives ONLY in schema
**`hygieia`**; nothing is created, altered or granted in `public`, `auth`, `storage`, `extensions` or
`supabase_migrations`. Operator ruling 2026-10-05 ("if you can't create a new one, use Alyssos database
as shared") after three attempts to create a dedicated project were cancelled by the permission UI.
This **supersedes ADR-0001's "no Supabase" clause**; the GitHub Pages hosting part stands.

**Rules that make sharing safe (the Themis ADR-0002 rulebook, applied here).**

1. **No `supabase db push`, `supabase link`, `supabase db reset` or `supabase migration *`** against
   this project. Alyssos owns `supabase_migrations.schema_migrations`; a Hygieia version recorded there
   would break Alyssos's next push.
2. **Tracking in `hygieia.schema_migrations`.** Migrations are plain timestamped files
   `supabase/migrations/YYYYMMDDHHMMSS_hygieia_<name>.sql`, forward-only, checksummed.
3. **Applied only by a Management-API applier** (`npm run db:apply`, to be lifted from Themis/Pluto),
   reading `SUPABASE_ACCESS_TOKEN` and `HYGIEIA_SUPABASE_PROJECT_REF` from the shell env. Dry-run is the
   default; `--apply` commits, and only with the operator's go.
4. **Rehearsed first by `npm run db:gate`** (PGlite, throwaway, no credential), with a RED-proof.
5. **The browser client is pinned to schema `hygieia`** (`db: { schema: 'hygieia' }`), so `.from('x')` can
   never reach Alyssos's `public` tables by accident. `hygieia` must be added to the project's exposed
   schemas (PostgREST `db-schemas`) before the client can read it — an operator dashboard setting.
6. **Shared `auth.users`.** A Hygieia account IS an Alyssos auth user (2 exist today). Hygieia's
   `hygieia.profiles` keys on `auth.users.id`; no trigger on `auth.users`. Email templates and OAuth
   providers (Google) are project-wide and must be configured so both apps' redirect URLs are allowed.
7. **Alyssos's data is never read or written by Hygieia**, and Alyssos's brain gets a §5 warning that
   a second product lives in its project (owed: `alyssos` is not yet a brained fleet repo).

**Why.** The operator's call. It avoids a 14th project's cost and setup for a product whose data is
small (content tables + per-user saved plans). Alyssos is also EU-hosted (eu-west-1), so the house
"EU project" rule holds.

**Consequences.** (1) P1 starts with the applier + gate scaffolding before any table. (2) Exposing the
`hygieia` schema and the Google OAuth app are operator dashboard steps. (3) **Noted during inspection:
`public.spatial_ref_sys` has RLS disabled** — that is PostGIS's reference table in Alyssos's own
schema, not Hygieia's concern, but it is flagged to the operator (Supabase advisory, 2026-10-05).

## ADR-0004 — 2026-10-05 — installable PWA on GitHub Pages

**Decision.** The site is an installable Progressive Web App: `vite-plugin-pwa` (Workbox) generates
`manifest.webmanifest` and `sw.js` (`autoUpdate`), icons live in `public/icons/` (SVG source,
PNGs via `npm run icons` / sharp), Google Fonts are runtime-cached, and `npm run check:pwa` gates CI
on the BUILT artifact (manifest fields, every icon present, service worker, registration).

**Why.** Operator request ("make the GitHub page an installable app"). A phone home-screen app suits
"what's in my fridge" and workout sessions; Pages is static, so a service worker is the only way to
get offline and install behaviour there.

**Consequences.** `start_url`/`scope` are `/hygieia/` and must follow Vite `base` if the site ever moves
to a root domain. The SW precaches the bundle: a deploy is picked up on the next visit (autoUpdate),
never instantly. `navigateFallback` serves `index.html` offline for deep links.

## 2026-10-05 — per-user writes never send `user_id`; the DB default supplies it

**Decision (P2.4).** The client never includes `user_id` in any INSERT/UPSERT payload to `fridge_lists`,
`saved_plans` or `favourites`, and never filters on it: the column is `not null default auth.uid()` and RLS
(`user_id = auth.uid()` on every verb, proven in `db:gate`) scopes every read and write to the caller.
The payload types in `src/user/source.ts` have no `user_id` member, so sending it is a type error, and
`src/user/source.test.ts` sweeps every recorded call for it. **Why:** the server is the single authority on
who owns a row — a client-supplied id is at best redundant and at worst a spoof attempt RLS has to refuse;
a client-side `eq('user_id', …)` would duplicate the policy and invite a false sense of safety when it is
forgotten. Same discipline as P2.3's `is_admin` (never sent; the column grant forbids it).

## 2026-10-05 — every `hygieia` function revokes EXECUTE explicitly (per-schema default privileges cannot)

`alter default privileges in schema hygieia revoke execute on functions from public` does NOT remove the
hardwired PUBLIC EXECUTE on functions created later: per-schema defaults are ADDED to the global default
(Postgres docs; proven in PGlite 2026-10-05 — `proacl` stays NULL, `has_function_privilege('anon', …)` =
true). A global revoke would be project-wide and touch Alyssos (ADR-0003), so it is forbidden. Rule: every
function a Hygieia migration creates ends with `revoke execute on function … from public, anon` (trigger
functions also `authenticated`; an RPC then grants `authenticated`). `npm run db:gate` sweeps every
function for anon/PUBLIC EXECUTE and a pinned `search_path`; the sweep is RED-verified (P1.8).

## 2026-10-05 — P1.5–P1.8 schema choices

- **Policies per role, never `to anon, authenticated` with `or hygieia.is_admin()`** (PLAN §1.4): anon holds
  no EXECUTE on any `hygieia` function, so a shared policy would error for anon. The gate asserts "every anon
  policy is TO anon alone" and "no write policy admits anon or PUBLIC".
- **Client writes are column-limited grants, not only policies:** `profiles.is_admin` and every per-user
  `user_id` have NO INSERT/UPDATE grant (so `user_id` always comes from `default auth.uid()`); content
  `id`, `slug`, `created_at`, `reviewed_*` are never client-updatable; `stamp_review()` writes the review
  stamp as a trigger (column privileges do not apply to trigger assignments).
- **Nullability follows `src/content/types.ts`**, not the looser §2 prose: ingredient price fields and
  `category` are `not null`; `equipment_*`/`note_*` are nullable as a pair (`(a is null) = (b is null)`);
  `image_path`, `source_url` nullable. Every table (children too) carries `created_at`/`updated_at`.
- **Fixture rows obey the seed-id rule** (`id = md5('hygieia:<table>:' || slug)::uuid`, slugs `fx-*`), so
  the "every row id = md5(…)" check is non-vacuous before P1.12 and bites on every seeded row after.
- **Gate and `npm test` share one check list** (`checksFor` in `scripts/db-gate/catalogue.mjs`); the Vitest
  twin pins the check names, so a check added to the catalogue without a case fails the suite.

## 2026-10-05 — P1.14 prove-red: close the write-policy gap in place, keep the check names

- **Write-policy checks probe filtered AND blind.** prove-red showed `saved_plans` UPDATE / `favourites`
  DELETE `using (true)` leave the gate GREEN: `… where user_id = A` makes Postgres AND the SELECT policy in,
  masking the open write policy. The fix adds a blind (no-WHERE) UPDATE/DELETE to the EXISTING checks
  (`UB's UPDATE/DELETE of A's rows has no effect`, the profiles twin, content `UA's status update has no
effect`) and asserts A's rows unchanged — instead of adding new checks — because `db-isolation.test.ts`
  pins the name set and is outside P1.14's scope. Net: the twin stays green and gets the stronger probe.
- **`RED ok` means exit code exactly 1**, not merely ≠ 0: a crash (Windows 0xC0000409) is `CRASH`, never proof.

## 2026-10-05 — P1.12: bundled = seed snapshot; DB = living truth

- **One source of truth at seed time, one at run time.** The TS seed modules (`src/content/seed/*.ts`) are the ONLY authored
  form of seed content; `scripts/gen-seed-sql.mjs` derives the seed migrations from them deterministically and `npm run seed:check`
  (in `G1`) fails on any byte of drift, so the bundled fallback and the DB seed are the same rows on the day they ship. After a
  seed migration is live, content changes happen IN THE DATABASE through the admin page (P4.10): the migration is forward-only and
  `on conflict do nothing`, so a later `seed:gen` never overwrites an edited row. The bundled snapshot is therefore the no-backend
  fallback **at seed-time quality**, not a mirror of the live catalogue; the app keys content by `slug`, so bundled mode never
  needs ids (PLAN §1.6).
- **Stable ids by formula, not by sequence.** `id = md5('hygieia:<table>:<slug>')::uuid`, computed in node and asserted by the gate
  over every row in a single SQL query per table. Children carry the same formula for their FKs, so a child migration never has to
  look a parent up, and a regenerated file is byte-identical whatever the authoring order.
- **Gate floors, not exact counts** (except `workout_templates = 63`, which is a product invariant: 7 × 3 × 3). Content grows by
  lane; an exact count would make every content commit also a gate commit. Floors exclude the `fx-` fixture rows so they read the
  seed, not the gate. A kind whose module does not exist yet (`workouts.ts`, P4.8) passes with zero rows and an explicit
  "not seeded yet" note — the assertion binds the moment the module lands.
- **The generator is forward-compatible on purpose.** All six kinds are implemented now, though P4.8/P4.9 nominally "add" them,
  so those tasks only author content and run `seed:gen`; they do not touch the generator.

## 2026-10-05 — P1.13 ContentSource: md5 in pure TS, same-row types for the client, union diet filter

- **Seed ids are computed in the browser with a ~100-line pure-TS MD5** (`src/content/md5.ts`), not a
  dependency and not Web Crypto (which has no MD5). PLAN §1.6 fixes `id = md5('hygieia:<table>:<slug>')::uuid`
  and the bundled source must hand out the SAME ids as the seed migration so a favourite or saved plan made
  against one source resolves against the other. `md5.test.ts` pins the implementation to 24 vectors computed
  with node `crypto` (RFC §A.5, UTF-8 Greek, astral emoji, every padding boundary). MD5 here is an id
  derivation, never a security primitive.
- **The client is typed with `Database` for schema `hygieia`** (`createClient<Database, 'hygieia'>`,
  `src/content/db-types.ts`, hand-maintained from the migrations). Rows are `type` aliases, NOT `interface`s:
  supabase-js constrains `Row`/`Insert` to `Record<string, unknown>`, which interfaces do not satisfy (no
  implicit index signature) — with interfaces `Insert` silently collapses to `never` and every `.insert(values)`
  fails to compile. P2.3/P2.4's adapters compiled unchanged against the typed client; no fallback needed.
- **The ContentSource talks through a typed adapter (`contentClientFor`) with `data: unknown`** and parses rows
  with a per-table `Spec<T>` (one `Kind` per key, enforced by the type) rather than relying on PostgREST's
  select-string typing: embeds (`recipe_ingredients(*, ingredient:ingredients(*))`) would need `Relationships`
  typing that is fragile and TS2589-prone, and a runtime check catches a drifted column where a type cannot.
- **`listRecipes({ dietSlugs })` is a UNION** (tagged with at least one) and is applied client-side in both
  sources after the approved list is fetched: a PostgREST `!inner` filter on the embed would also truncate the
  recipe's own `diet_slugs` to the matching tags. P3.1's `?diet=a,b` relies on this.
- **A child whose parent-side row is hidden stays visible as `ingredient: null` / `exercise: null`**, keyed by
  the FK id in `ingredient_slug` / `exercise_slug`, rather than being dropped: an approved recipe over a still-
  pending ingredient is an admin-ordering state the UI should show honestly (the fridge matcher already
  reports such slugs under `unknown`).

## 2026-10-06 — P4.8/P4.9 UI: pages read the ContentSource, not the seed resolver; async state keyed by its loader

- **`/workouts` resolves a session with `contentSource.getWorkoutTemplate(type, level, intensity)` and groups the
  returned `slots`, NOT with `workouts/session.ts` `resolveSession` over the seed arrays.** The resolver is the pure
  domain proof over seeds (P4.8 tests); the page must behave identically in `local` (bundled) and `configured`
  (supabase) mode, and only the source knows which rows are visible. `blocksOf(template)` keeps the resolver's
  whole-or-nothing rule: one hidden exercise (pending under RLS) renders `noSession`, never a block with a hole.
- **Content pages accept an optional `source` prop defaulting to `contentSource`.** The module singleton is right for
  the app; tests need to inject a failing / empty / never-resolving source to exercise the error, empty and loading
  states without module mocks. P3.5 renders `<WorkoutsPage />` and `<TipsPage />` with no props.
- **`useAsync(run)` stores the settled outcome TOGETHER with the `run` that produced it and derives "loading" as
  `settled.run !== run`.** No synchronous setState in an effect (the house `react-hooks/set-state-in-effect` rule), a
  new selection shows loading at once, and a stale resolution is dropped. The cost is that callers memoise `run`
  with `useCallback`; the pages do.
- **Selection state lives in the URL (`?type=&level=&intensity=`, `?topic=`), defaults applied on parse** so a
  session or topic is linkable and back/forward walks the choices; junk values fall back to defaults silently
  (a bad link still shows a usable page).
- **Error/empty dictionary keys are per feature (`workoutsLoadFailed`, `tipsLoadFailed`, `tipsEmpty`)**, not a shared
  base key: `dictionary.ts` is off-limits to lanes and a shared key added by two lanes in `features/*` would collide
  at the union merge.
- **`FeatureDictionary` parents stay one per line under `// prettier-ignore`.** Prettier collapses a short `extends`
  list onto one line, which would turn every concurrent lane's addition into a merge conflict; the ignore keeps the
  `merge=union` guarantee the barrel was designed for.

## 2026-10-06 — P3.4 Fridge UI: identity-keyed `useAsync`, one `commit()` for persistence, honest failure copy

- **`useAsync(run)` keys its outcome by the `run` function's identity and DERIVES loading** (`settled.run !== run`)
  instead of setting a loading flag inside the effect: it satisfies react-hooks `set-state-in-effect`, a new `run`
  shows loading on the render it arrives, and a stale resolution after unmount is dropped. Callers memoize `run`
  (module-level for the catalogue; `useCallback([source])` for the user's lists). The recipes lane may land its own;
  reconcile to one at merge — the contract to keep is `{ status: 'loading' | 'ready' | 'error' }`.
- **The fridge persists through a single `commit(next)`** (set state, then `saveFridgeState(localStorage)`), called
  by every mutation (add, remove, clear, staples toggle, load a saved list) rather than a `useEffect` on state: no
  effect-driven write on mount (which would re-save what was just loaded), no set-state-in-effect, and the write
  happens exactly once per user action. `window.localStorage` ACCESS is guarded too (blocked storage throws on
  the getter, not only on `setItem`).
- **Three dictionary keys beyond the plan's list** — `fridgeLoadFailed`, `listSaveFailed`, `loadList`: the content
  source and the user-data source both return `Result` failures, and an outcome the UI can reach must have copy in
  both languages (ADR-0002); `loadList` makes `savedLists` actionable (restore a saved list into the fridge) instead
  of a dead list of names.
- **`FeatureDictionary extends FridgeDictionary {}` carries a `no-empty-object-type` disable** only while it has one
  parent; typescript-eslint stops flagging the interface once a second lane adds its parent. Prettier collapses the
  `extends` onto one line, so "one parent per line" is not enforceable here — the lead reconciles the one-line
  `extends A, B` at merge (the file is `merge=union`).
- **`savedLists` always calls `fridgeLists.list()`** regardless of `kind`: the disabled source answers an honest
  empty list, so the page has one code path and no `kind` branch around the fetch.
- **2026-10-06 (P4.6) — A saved plan persists recipe SLUGS and the per-day totals, never recipe copies** (`serializePlan` in
  `src/plans/PlanView.tsx`: `{ dietSlug, weekStart, seed, days[{ index, slots{breakfast|lunch|dinner: slug|null}, totals }], warnings }`).
  Content is keyed by slug (PLAN §1.6) and recipes are admin-editable; freezing 21 recipe bodies into `saved_plans.plan` would go stale
  and bloat the jsonb. The seed is stored too, so the exact plan is reproducible from the same content.
- **2026-10-06 (P4.4/P4.6) — "Reshuffle" derives the next seed from the current one** (`nextSeed = floor(mulberry32(seed)() × 2³¹)`,
  never equal to its input) instead of `Math.random()`: deterministic, so tests and e2e can predict the second plan, and the UI exposes
  `data-seed` for them.
- **2026-10-06 (P4.6) — `loadFailed` / `retry` live in the plans feature dictionary and macro labels are namespaced (`planMacros`)**:
  the base dictionary has no load-error copy, and P4.3 (another lane) owns `kcal`/`protein`/`carbs`/`fat`. Identical-typed duplicate
  keys across feature modules merge harmlessly (later spread wins); differing types would be a TS error at the composition point.
- **2026-10-06 (P4.6) — `src/lib/useAsync.ts` stores only the SETTLED outcome tagged with (loader, attempt)**; "loading" is derived, so
  no state is set synchronously inside an effect (react-hooks `set-state-in-effect`) and a stale result never shows for a new key.

## 2026-10-06 — P3.1/P3.2 UI: async outcome as state, plural forms in the dictionary, URL keeps the raw query

- **`useAsync(fn)` keys on the `fn` identity, not a `deps` array.** `react-hooks/set-state-in-effect` is an error here, so the
  hook stores only the settled outcome tagged with (`fn`, attempt) and DERIVES "loading"; `fn` runs on a microtask so even a
  synchronous throw is recorded asynchronously. Callers memoise with `useCallback(…, deps)`, which keeps `exhaustive-deps`
  on the caller where the real dependencies are visible (a `deps` passthrough would need a lint disable inside the hook).
- **Counted strings are `PluralForms { one, other }` + `fill('{n}')`, not functions in the dictionary.** Both Greek and English
  have exactly these two CLDR categories, so one rule serves both; dictionary entries stay literals the type checks (ADR-0002)
  and `dictionary.test.ts`'s leaf walk still sees every string. `one` also covers `0 < q < 1` ("½ piece", "½ ματσάκι").
- **Unit labels live in the dictionary (`units.<Unit>`), keyed by the enum.** A new `Unit` literal is a type error in
  `recipes.ts`, not an English abbreviation leaking into Greek. Greek: `γρ.`, `ml`, `τεμάχιο/α`, `κ.σ.`, `κ.γ.`, `φέτα/ες`,
  `σκελίδα/ες`, `ματσάκι/α`.
- **The recipes list writes the typed query to `?q=` verbatim** (after `serializeRecipeFilterParams`, which trims): otherwise a
  trailing space is eaten on every keystroke and a two-word search cannot be typed. `parse` still trims for filtering.
- **Diet chips on the detail page link to `/recipes?diet=<slug>` for now** (built with the codec, not a string template);
  P4.4 retargets them to `/diets/:slug`.
- **`filterRecipes` / `sortRecipes` are generic over `R extends RecipeSeed`** so a `Recipe` row keeps `id`/`status`/`lines`
  through the filter instead of the page re-joining by slug.
- **`FeatureDictionary extends RecipesDictionary {}` keeps a reasoned `no-empty-object-type` disable** until a second feature
  module is spread in: the interface form (one supertype per line) is what lets parallel lanes append under `merge=union`.

## 2026-10-06 — P5.3 Lighthouse mobile gate: fonts self-hosted; gate at 90 kept

- **Fonts self-hosted; Lighthouse gate at 90 kept.** The render-blocking Google Fonts stylesheet in
  `index.html` cost the home page ~15 Lighthouse mobile performance points (79 baseline → 94 with the
  fonts origins blocked, nothing else changed) and made the score bimodal (79 ↔ 93) with the cold
  DNS/TLS latency to a third party. Inter and Literata now ship as `@fontsource-variable/*` (one woff2 per
  script subset selected by `unicode-range`, Greek included, `font-display: swap`), imported at the top of
  `src/index.css`, bundled by Vite and precached by the service worker — the installed app renders Greek
  offline from the first visit, and no third party sits on the first-paint path. The thresholds stay
  performance / accessibility / best-practices ≥ 90 mobile (CI: −5 on performance only, documented in
  `scripts/check-lighthouse.mjs`); a lower bar was rejected in favour of fixing the cause.
- **The Lighthouse audit server differs from the e2e server on purpose** (`scripts/check-lighthouse.mjs`
  reuses `resolveRequest` from `e2e/support/pages-server.mjs`): text is gzipped like Pages does (the e2e
  server serves identity, which inflated the simulated LCP by ~1.9 s), and the deep-link fallback
  (`404.html`) is served with status 200 because Lighthouse refuses to audit an errored document. Bytes
  identical; the 404 contract stays proven by `npm run e2e`. One fresh Chrome per route, so no route
  inherits another's warm connections or storage.
- **No `<link rel="preload">` for the hero.** Measured: it left home's LCP unchanged (render-bound: the
  image waits for React, not for bytes) and made every other route download a 42 kB image it never shows
  (−3 points on `/auth`). The hero is a `<picture>` (WebP 800w/1216w from `npm run brand`, JPEG fallback,
  `fetchPriority="high"`); `registerSW.js` is injected with `defer` (`injectRegister: 'script-defer'`).

## 2026-10-06 — P4.10/P4.11 admin: status-only review, column-exact writes, no insert/delete

- **The admin never inserts or deletes content; approve = a status update stamped by the DB.** `AdminContentSource` has
  `listPending / listAll / update / setStatus` and no other method; `setStatus` sends exactly `{ status }` and the BEFORE UPDATE
  trigger writes `reviewed_at` / `reviewed_by`. Content is born by seed migration (PLAN.md §1.6) and only ever edited or
  re-statused by a reviewer — the client holds no grant for anything else, and the UI offers nothing the grant forbids.
- **Writes are column-exact and refused twice.** `update` sends only the keys given; `id`, `slug`, `created_at`, `updated_at`,
  `reviewed_at`, `reviewed_by` are `never` in `AdminPatch<T>` AND rejected at runtime (`locked`, nothing sent), as is `status`
  (that is `setStatus`'s path) and any column outside `EDITABLE_COLUMNS[table]`, which a test keeps literally equal to the
  migration's `grant update (…)` lists. Reason: the grant is the real guard, but a refused request would surface as an opaque
  PostgREST 42501 — refusing before the request keeps the UI honest and the contract visible in TypeScript.
- **The review form's field set is derived from the grant, rendered by kind, and pairs share one line editor.** `x_el`/`x_en`
  arrays are edited in one component whose add/remove act on both languages, so equal length is structural, not validated.
- **The price table sends the whole five-column price group, the review form sends only the diff.** A price quote
  (`min/max/per/as_of/note`) is one fact — saving it as a unit keeps `as_of` honest even when only `max` moved; a content edit is
  a correction to specific columns and must not re-send the rest.
- **Admin dictionary keys are prefixed where another lane owns the plain name** (`adminSaved`, `adminSaveFailed`; `plans.ts` has a
  plan-specific `saveFailed`): feature modules are spread into one `Dictionary`, so a shared key would silently last-win.
- **`src/admin/useSettled.ts` instead of a shared `src/lib/useAsync.ts`:** four lanes each add their own copy of that path
  concurrently; the admin lane keeps its (smaller) hook local to avoid a fifth conflicting file. The lead may fold it into the
  survivor after merge.

## 2026-10-06 — Reconciliation: one `useAsync` with status/data/error/reload; `useAsyncResult` unwraps `Result`

- **One `useAsync` with `status`/`data`/`error`/`reload`; `useAsyncResult` unwraps `Result`.** Four lanes wrote four hooks with the
  same core idea (settled outcome as the only state, tagged by loader identity, loading derived). The canonical one is the superset so no
  caller lost anything: the fridge lane's data+rejection, the diets lane's `reload`, the recipes lane's microtask start (a synchronous
  throw is an `error`, never an unhandled promise). `Result`-returning reads go through `useAsyncResult` so pages stay one-liners and
  `ok:false` is simply `status: 'error'` with the code as `error`.
- **`deps` is keyed with the "store information from previous renders" pattern, not `useMemo(fn, deps)`.** The compiler-based
  react-hooks rules reject a non-literal dependency array ("Expected the dependency list for useMemo to be an array literal"); a
  comparison-guarded `setState` during render is the React-documented alternative and keeps the hook lint-clean without a disable.
- **A dictionary key has ONE owning feature module.** Same key, different type = type error in the barrel (`minutes` → workouts
  `minutesUnit`); same key, same type = the last spread wins silently (`loadFailed`/`retry` → plans owns them, recipes reuses). The
  rule is written in `features/index.ts` so the next lane reads it before adding a key.
- **`fill.ts` is the recipes lane's version** (`fill` + `PluralForms`/`pluralForm`/`plural`): the only variant other dictionaries
  depend on by TYPE (`resultsCount`, `portions`, `minutes`, `units.*`); `fill` itself is the same contract in every lane.
- **The bilingual sweep's allow-lists are the right place for `kcal`, `ml` and the two-script fridge hint** — the copy is deliberate
  (units are Latin-script in Greek; the hint shows one example per script in both languages), so the test's own exception list grows,
  the strings do not change.

## 2026-10-06 — P4.3 nutrition + cost panels: one toggle, energy-share macro bar, UTC date, no €0 range

- **One scope toggle on the page, owned by `RecipeView`, rendered inside `NutritionPanel`.** Both panels take the same `scope` prop; the
  cost panel shows a caption ("Per portion" / "Per recipe") instead of a second toggle, so there is exactly one control and no way for the
  two figures to disagree. `onScopeChange` is optional so the nutrition panel can be reused read-only (plan day totals later).
- **The macro bar splits ENERGY, not grams** (Atwater 4/4/9 kcal per g). A gram-based bar would make 50 g of oil look like 50 g of rice;
  the energy share is what "how fatty is this" means to a reader. Rounded shares may sum to 99–101; the bar's `aria-label` carries them.
- **Figures round only at the edge.** The engines stay unrounded (P4.1/P4.2); `src/recipes/panelFormat.ts` is the single place a number
  becomes a string, through `Intl` for `el-GR` / `en-GB` — never hand-built decimals or a hard-coded "€" position (Greek puts it after).
- **`pricesAsOf` is formatted in UTC.** A date-only ISO string parses as UTC midnight; a formatter in the viewer's zone would show the
  previous day west of Greenwich. `timeZone: 'UTC'` pins the calendar day the seed meant.
- **A recipe with no priced line shows no range.** `€0.00–€0.00` would read as "free"; the `unpriced` list already explains the gap.
- **`costRange` copy is "About {min}–{max}" / "Περίπου {min}–{max}"**, not a bare `{min}–{max}` template: the bilingual sweep rejects an
  `el` leaf identical to its `en` twin, and "about" is honest copy for a range anyway.

## 2026-10-06 — P6.4: two CI builds (local-only for the browser gates, configured for the Pages artifact), variables not secrets

- **CI builds twice from the same commit; the uploaded artifact is the second build.** e2e and Lighthouse drive a real browser
  against `dist/`. Once the Pages build inlines the Supabase and fleet names (configured mode), a browser-driven gate against
  that artifact would reach the live backend from every CI run — anon traffic against production tables, telemetry rows from CI
  as if from users, live latency in the performance score. So the first `npm run build` blanks all five `VITE_*` names
  explicitly (the e2e and Lighthouse builds already did so locally) and feeds `check:bundle` → `check:pwa` → e2e →
  `check:lighthouse` unchanged (`E2E_PREBUILT=1`, no rebuild, no second dist dir); then a second `npm run build` with
  `${{ vars.* }}` produces the artifact, which gets its own `check:bundle` + `check:pwa` before `upload-pages-artifact`.
  Chosen over the "separate `dist-e2e/` + `E2E_DIST` env" variant because `check-lighthouse.mjs` also hard-codes `dist/` and
  would have kept hitting the live backend; two builds in order need no change to `playwright.config.ts`, `pages-server.mjs`,
  `.gitignore` or the Lighthouse script, and cost one extra `tsc -b && vite build` (~30 s incremental). The e2e'd bytes differ
  from the shipped bytes only by the inlined env; `smoke:live` (P6.3) is the proof against the shipped artifact.
- **Repository VARIABLES, not secrets, for the five browser names.** Every value is public by design (Vite writes it into the
  bundle; the anon key is RLS-bound, the fleet key write-only). A secret would mask the value in the log while it sits in plain
  text in `dist/`, and would hide the exact thing `check:bundle` exists to show. Unset variables resolve to `''` → local-only
  mode, so the deploy is correct before OP2.c/OP6.a and on pull requests from forks; the operator's variables, not a code
  change, flip the live site to configured mode.

## 2026-10-06 — `useSettled` retired: the admin lane joins the canonical `useAsync`

- **`src/admin/useSettled.ts` deleted; AdminPage and PriceTable use `useAsync` / `useAsyncResult`.** The 2026-10-06 admin entry kept
  the hook local only to dodge a fifth concurrent `src/lib/useAsync.ts`; with the reconciliation merged that reason is gone, and one
  codebase gets one async hook. The admin pages' `version` counter went with it — `refresh()` is `pending.reload()` + `filtered.reload()`,
  so the two `exhaustive-deps` disables that the "new identity forces a re-read" trick needed are gone too. The one behaviour change is
  deliberate: a REJECTED read renders `adminLoadFailed` instead of hanging on the loading line (asserted by one new test per page, each
  through a source that bypasses the adapter, because `adminSource`'s `run` catches every throw and a real client can never reject).

## 2026-10-06 — P3.5 navigation + Layout (builder, worktree `wt/c`)

- **`NotFound` lifted to `src/routes/NotFound.tsx`, re-exported from `routes.tsx`.** `RecipePage` and `DietPage` render it for an
  unknown slug and imported it from `routes.tsx`; once the route table imports those pages that is an import cycle. The pages' existing
  import path keeps working through the re-export; new code imports from `routes/NotFound`.
- **`Layout` is a layout route (`<Route element={<Layout />}>` + `<Outlet />`) and does NOT render `<main>`.** Every page already owns a
  `<main>` landmark with its own max-width; a second one in the frame would be a duplicate-main a11y failure (Lighthouse/axe). The pages'
  `min-h-dvh` (written before a frame existed) is neutralised from Layout with Tailwind child variants (`[&>main]:min-h-0 [&>main]:flex-1`)
  so no page needed editing.
- **The header nav is `<nav>` + `NavLink`s, no `<ul>`.** `NavLink` emits `aria-current="page"` itself with a prefix match (`/recipes/<slug>`
  keeps Recipes current). No list so that tests scoping `listitem` (the home cards, the fridge chips) are not polluted by the frame.
- **Cost and calories cards route to `/recipes` with a one-line note** (`panelsNote`): the P4.3 panels live on every recipe page, so there
  is no page of their own. The `roadmap` badge is gone from the home page (every module has a live route); the key stays in the base
  dictionary for a future module.
- **Home status copy branches on `appEnv.mode`** (`statusBody` local-only vs `statusBodyConfigured`): the honest sentence about sign-in
  differs between the two builds, and the build knows which it is.
- **`/account` in local-only mode renders the sign-in-unavailable copy in place; it does not redirect.** `RequireAuth` redirects to
  `/auth?next=…` only for the `anonymous` state (configured client, no session) — proven in `src/auth/guards.test.tsx`. The e2e spec
  `admin-local-only.spec.ts` asserts the in-place copy and an unchanged URL; PLAN P4.12's "/account redirects to /auth" is read as the
  anonymous case.

## 2026-10-05 — P1.9 ingredients: `kcal_100g` capped at 900; bunch/head/cube/sheet-sold items priced as `piece`

**Decision.** Lard and tallow carry `kcal_100g = 900`, not USDA's 902: the column's CHECK caps it at 900
(`ingredients.test.ts` pins the same `0..900` range) and those two rows are the only ones above it; everything
else is the unrounded typical value. Items sold by the bunch, head, cube, sheet or sachet — eight rows today,
seven bunch-sold and one sheet-sold — use `price_per: 'piece'` with the real basis named in `price_note`
("… per bunch"), because `PRICE_PER` is `kg | l | piece` and nothing else. **Why.** Widening the CHECK for two
rows was not worth a schema change inside the seed task, and a per-basis enum would have had eight rows as its
only users. The cost engine (P4.2) agrees with "per piece" only because `grams_per_unit` on those rows IS the
bunch / sheet weight, so both readings compute the same figure. **Consequence.** Extending `PRICE_PER` later is
a migration that moves those ~8 rows to the new literal plus a `seed:gen` regeneration, not a type-only edit;
and nutrition is for the state named in `name_en` (dry legumes/grains, raw meat/fish, drained canned goods),
so recipes scale from those, never from cooked weights. Recorded 2026-10-06 from the builder hand-off
(BUILD_LOG P1.9; P1/P2 REVIEW item 2b).

## 2026-10-05 — P1.10 diets: 16 ship, not the plan's "exactly 8" (operator: "as many as you can")

**Decision.** `src/content/seed/diets.ts` ships 16 diets — the eight PLAN P1.10 names (mediterranean, atkins,
paleo, low-carb, keto, carnivore, vegetarian, vegan) plus dash, flexitarian, pescatarian, intermittent-fasting,
whole30, gluten-free, high-protein and low-fodmap — and `diets.test.ts` asserts `>= 8` AND the presence of the
eight named slugs, not `=== 8`. **Why.** The operator's standing instruction for content during this build was
"as many as you can"; the planner's "exactly 8" predates it. Nordic and Zone were considered and left out so
every shipped diet is described accurately and even-handedly; 6 of the 16 carry `source_url = null` rather than
an invented page (PLAN §0 drafting rule). **Consequence.** Everything the plan wrote as "8" reads 16 downstream
— the gate's `diets >= 8` is a floor so it holds unchanged (P1.12), `listDiets` tests use ≥ 8, `/diets` renders
16 cards (P4.4). The same instruction governed ingredients (322 vs floor 160), recipes (152 vs 40), exercises
(136 vs 60) and tips (75 vs 30); the gate uses floors for every kind except `workout_templates = 63` (see the
P1.12 entry). Recorded 2026-10-06 from the builder hand-off (BUILD_LOG P1.10; P1/P2 REVIEW item 2a).

## 2026-10-05 — P2.1–P2.3 auth: `?next=` parked in `sessionStorage`, in-app paths only; callback failure is a timeout

**Decision.** (a) The post-sign-in return path (`/auth?next=/fridge`) is stored in `sessionStorage` under
`hygieia.auth.next` (`NEXT_STORAGE_KEY`, `src/auth/session.ts`) before the browser leaves for the magic link or
Google, and `/auth/callback` consumes it once (`takeNext`, default `/`). `safeNextPath` accepts only a string
starting with a single `/` — `//evil.example`, `/\evil` and `https://…` are dropped — the open-redirect guard.
(b) `CallbackPage` never reads or rewrites the URL: supabase-js exchanges `?code=` itself (`detectSessionInUrl`,
PKCE). Failure is declared when the URL carries `error` / `error_description`, when there is no client, or when
no session arrives within `timeoutMs` (default 15 s; a prop, so tests use 20 ms). (c) `profileClientFor` is a
thin typed adapter over the real client instead of a structural client type or a cast — a direct assignment
hits TS2589 on Supabase's query-builder generics; the compiler still checks the adapter against the real client.
**Why.** The callback is one fixed address on the project's shared redirect allow-list (ADR-0003 rule 6), so the
return path is kept on the client side rather than threaded through the provider round trip; `sessionStorage`
is per-tab and dies with it, which is what a one-shot return target wants. In-app-only is the classic
open-redirect defence (`?next=https://evil` after a trusted sign-in). The timeout exists because supabase-js
exposes no "exchange failed" event — on a bad code `onAuthStateChange` simply never fires `SIGNED_IN`.
**Consequence.** A genuine failure never hangs the page; a very slow exchange shows `callbackFailed` with a link
to `/auth` after 15 s even if the session then lands (harmless — the next visit is signed in). P1.13 adopted the
adapter pattern for `contentClientFor`. Recorded 2026-10-06 from the builder hand-off (BUILD_LOG P2.1–P2.3;
P1/P2 REVIEW item 2c).

## 2026-10-05 — P2.6 `db:live-check`: redacts the anon key too; three independent probes; PGRST106 ≠ PGRST205

**Decision.** `scripts/db-live-check.mjs` passes every output line through `redact(s, [token, anonKey])` — the
Management-API token AND the public anon key. Its three probes (ledger vs archive; anon
`GET /rest/v1/recipes?select=id&status=eq.pending`; anon `GET /rest/v1/profiles?select=user_id`) each print one
`PASS` / `FAIL` line and ALL run even after an earlier one fails. A PostgREST refusal is classified: `PGRST106`
(or a 404/406 whose message names the schema and is not "schema cache") → "schema `hygieia` is not exposed in
the Data API (ADR-0003 rule 5 / BRAIN O1)", an operator dashboard step; a `PGRST205` 404 → "table … not in the
live Data API — its migration is not applied (or the schema cache is stale)", a `db:apply` matter. **Why.** The
anon key is public by design, but nothing is gained by printing it into CI logs, and one redaction list is
cheaper than a judgement per line (the test asserts on every run that neither value appears in any captured
line). The probes are independent reads, so stopping at the first FAIL would hide the other two answers the
operator needs from the same run. The two codes point at two different next actions by two different people,
and saying which is the tool's one job. **Consequence.** Until OPERATOR-P1 (apply) and OP2 (expose the schema)
are done, probes 2–3 legitimately FAIL with exactly those lines — the check working, not a bug. `smoke:live`
(P6.3) reuses `REST_PROBES` / `classifyRestAnswer` and inherits the classification. Recorded 2026-10-06 from the
builder hand-off (BUILD_LOG P2.6; P1/P2 REVIEW item 2d).

## ADR-0005 — 2026-10-06 — Build cadence actually run for P1–P6: parallel worktree lanes, phase gates after merge

**Decision.** P1–P6 were NOT built on the CLAUDE.md §4 / §7 / §9 cadence (build one phase → `qa` → `reviewer` →
human CHECKPOINT → next phase). They were built on the cadence below, on the operator's instruction ("proceed
till the end phase"; for content, "as many as you can"), and this ADR records it so the departure is a declared
exception and not a skipped gate — §9: _"Deviating from §4, §7 or §9 requires an ADR — and the deviation then
binds … an undocumented departure is indistinguishable from a crew that skipped the gate."_

**Mechanism.** `PLAN.md` (planner, 2026-10-05) fixed the task list, the acceptance criteria and the `∥` parallel
groups (§0, §3). The lead dispatched builders into file-disjoint git worktree lanes `D:/projects/hygieia-wt/a..g`
(branches `wt/a..g`), one writer per checkout (§4). Every lane ran `G0` (`lint && typecheck && test && build &&
check:pwa`; `G1` where the lane held the `db:*` scripts) before the lead merged it into `main`, and later lanes
re-ran `G0` on top of the merged `main`. `BUILD_LOG.md` and `DECISIONS.md` are `merge=union` (`.gitattributes`)
so lanes append without conflicts; `BRAIN.md` and shared code files (the four `useAsync` variants, the feature
dictionary barrel) were reconciled by the lead at merge (2026-10-06 "Reconciliation" entry).

**The deviation.** (1) No phase gate ran between phases: P3, P4, P5 and P6 build tasks landed on `main` before
P1/P2 had been QA'd or reviewed. (2) The human CHECKPOINT after each phase (§7) was waived by the operator for
the duration of this build. (3) QA + Review therefore run on the merged tree, after the fact, phase by phase.

**What still binds.** Every phase's QA task and Review task still run, by agents that built nothing in that
phase, and a phase is CLAIMED only when `qa = VALIDATED` and `reviewer = PASS` — §9's rule is untouched; only its
timing moved. Status at the time of writing: P1 + P2 QA **VALIDATED** 2026-10-06 (fresh clone, `db:gate` 227
PASS, prove-red 25/25, `npm test` 3123 green); P1 + P2 REVIEW **REVISE** on records only (BRAIN/DECISIONS
currency — this entry is part of that fix); P3, P4, P5 and P6 each still owe their own QA + Review gate before
they are claimed. The OPERATOR-P1/P2 steps (live `db:apply`, exposing schema `hygieia`, OAuth redirect
allow-list) are owed and are not crew work.

**Risk accepted.** A late gate finding costs more than an early one: a P1/P2 defect found now may already have
P3–P6 code built on top of it, and a later lane's regression can reach `main` ungated (P1/P2 QA surfaced exactly
one — `e2e/local/offline.spec.ts` red on `main`, P5.4 scope — out of gate). Mitigation was the file-disjoint
lanes and `G0` per lane; the P1/P2 reviewer's finding is that the cadence did not hurt P1/P2 quality. This ADR
binds for the current build only: the next feature cycle returns to the §9 default unless a new ADR says
otherwise. Named in `.claude/CLAUDE.project.md` §2 "Deviations".

## 2026-10-06 — P5.2 a11y matrix: WCAG 2.0/2.1 A+AA tags, gate on serious/critical only, contrast made measurable

- **axe tags `wcag2a, wcag2aa, wcag21a, wcag21aa`; the gate is 0 `serious`/`critical`; `moderate`/`minor` are printed as a table and
  attached, not gated.** The plan named `wcag2a, wcag2aa`; 2.1 adds the mobile-era rules (orientation, reflow, status messages) a PWA
  should meet. Gating every impact would turn best-practice noise into red builds nobody reads; the table keeps the lower impacts visible
  on every run so a regression is seen without blocking a merge.
- **The language is seeded through localStorage (`hygieia.lang`) in `addInitScript`, not by clicking the toggle.** The cell then audits
  the FIRST paint in that language (the returning-visitor path) and 24 cells cost one navigation each; the toggle is proven once in
  `smoke.spec.ts`. The H1 assertion per language is what P5.5 leans on.
- **`e2e/support/routes.ts` carries `h1(t, lang)` and an optional `ready` selector** so the one shared list drives both the Lighthouse and
  the axe gate; detail-page H1s come from the seed row (import-time throw if the slug disappears).
- **The body wash is a `body::before` pseudo-element, not `body { background-image }`.** With a gradient on an ancestor, axe-core files
  every text node under `color-contrast: incomplete` (2 491 nodes site-wide) — a gate that passes because it cannot measure. A fixed,
  `z-index: -1`, `pointer-events: none` pseudo-element is invisible to `elementsFromPoint`, so contrast is computed against the real
  colour. Rule for future styling: no `background-image` on an element that contains text unless the text sits on its own opaque box.
- **`clay-500` is never TEXT; `clay-700` (`#9c5530`, 5.0:1 on cream) is the text shade.** `clay-500` (3.0:1) stays for borders, tints,
  bars and the wash. The tips eyebrow was the one shipped instance in a matrix-visible state; the alert lines still on `text-clay-500`
  are in markup the AsyncState lane owns and are listed in BUILD_LOG for it.

## 2026-10-06 — P5.1 shared async states, dead-backend e2e project, reserved-space skeletons

- **2026-10-06 (P5.1) — ONE shared `Loading` / `ErrorState` / `EmptyState` (`src/components/AsyncState.tsx`) replaces nine
  per-page renderings; each page KEEPS its own dictionary key** (`loadFailed`, `fridgeLoadFailed`, `workoutsLoadFailed`,
  `tipsLoadFailed`, `adminLoadFailed`; `noRecipesMatch`, `fridgeEmpty`, `tipsEmpty`, `noSession`, `noPending`, `nothingSavedYet`,
  new `dietsEmpty` / `noRecipesForDiet`) and passes it in — the component owns markup, role and the Retry label (`t.retry`),
  never the copy. `ErrorState` is `role="alert"` and ALWAYS offers Retry when the state has a `reload` (fridge, workouts, tips
  and admin had none before); `EmptyState` carries no live-region role (an empty result is content; the pages that announce
  counts keep their own `role="status"` line). Error copy is `text-clay-700` (5.0:1), not `clay-500` (3.0:1) — the a11y lane's
  contrast finding, applied to every alert the kit touched and to the seven sites it listed.
- **2026-10-06 (P5.1) — `Loading` is a SKELETON WITH RESERVED HEIGHT, sized to push everything below it off a phone viewport**
  (`list`: 6 × h-44 cards in the page's own grid; `detail`: header lines + 3 × h-40 blocks; `panel`: 3 × h-11 rows). Lighthouse
  measured CLS 0.876 / 0.339 / 0.289 / 0.190 / 0.161 / 0.152 / 0.122 on diet / diets / recipes / tips / workouts / recipe / fridge
  with the one-line "Loading…": the bundled source settles on a macrotask, so the one-liner PAINTS and the content then shoves the
  footer a screen down. The skeleton is `role="status" aria-busy aria-live="polite"` with `t.loading` sr-only (tests and AT read
  the same text as before) and the bones `aria-hidden`.
- **2026-10-06 (P5.1) — A SECOND Playwright project `dead-backend` runs the production artifact CONFIGURED against
  `http://127.0.0.1:9/`** (`npm run build:dead` → `scripts/build-dead.mjs` → `dist-dead/`, served on 4174 with Pages semantics).
  The values are set by the script, not a `.env.*` (gitignored by policy) nor a CI variable: public dummies, reproducible from the
  checkout. The console watchdog variant (`e2e/support/dead-backend.ts`) filters ONLY `Failed to load resource: net::ERR_*` whose
  URL is on the dead origin. Measured, not assumed: Chromium refuses port 9 as an UNSAFE PORT (`net::ERR_UNSAFE_PORT`, no socket —
  dead all the same), and supabase-js 2.117 RETRIES a failed PostgREST request 4× with 1/2/4 s back-off before the `Result`
  settles (~7.2 s), so the project carries `expect: 20 s`, `timeout: 90 s`, and the spec arms `requestfailed` for the Retry proof
  only AFTER the alert has settled (a dead-host request after that can only be the click's). CI builds dist-dead/ once more
  before `npm run e2e` (E2E_PREBUILT=1 serves both directories; the configured Pages build stays LAST).

## 2026-10-06 — P5.3 follow-up: route-level code splitting, per-table lazy seeds, full Chromium in CI

- **Every page but the home is a `React.lazy` chunk, with ONE `Suspense` in `Layout` around `<Outlet />`**
  (`src/routes/routes.tsx`, `src/components/Layout.tsx`). The static route table had put all twelve pages into
  the entry chunk (1.26 MB raw / 319 kB gzip; FCP a flat 3.5 s on every route). `/` stays eager so the home
  first paint pays no extra hop; `NotFound` stays eager (tiny, and the `*` route must render offline from the
  precached `index.html` alone); the guards (`RequireAuth`/`RequireAdmin`) stay eager so the local-only
  "sign-in unavailable" copy never waits on a chunk. The fallback is the bilingual `t.loading` line in a
  `<main>` so Layout's `[&>main]:` sizing applies to it too. Entry is now 246 kB raw / 78 kB gzip (react +
  react-dom) plus a 297 kB / 83 kB shared chunk (supabase-js + react-router + dictionary) that `index.html`
  modulepreloads; every page is its own 1–22 kB chunk.
- **The six seed tables are lazy, per table, behind a cached promise** (`src/content/bundled.ts`:
  `BUNDLED_SEEDS.<table>` is `() => import('./seed/<table>.ts')`, memoised inside `createBundledSource`,
  a rejection forgotten so a later call retries). Vite emits one chunk per table (ingredients 120 kB,
  recipes 256 kB, exercises 84 kB, diets 80 kB, tips 80 kB, workouts 17 kB raw), so `/recipes` downloads
  recipes + ingredients + diets and nothing of exercises/workouts/tips, `/workouts` the reverse, `/tips`
  one. The public `ContentSource` API is unchanged (every method already returned a promise) and
  `bundledSource` is still synchronous to construct; `BundledSeeds` fields accept rows OR a loader
  (`SeedTable<T>`), so the fixture tests pass arrays as before. A chunk that fails to load resolves to
  `fail('network')` like a Supabase outage — the bundled source still never throws. Rejected alternative:
  one lazy "all seeds" chunk — simpler, but `/tips` would still download the 256 kB recipe corpus.
- **CI installs the FULL Chromium for the Lighthouse gate, not `--only-shell`** (`.github/workflows/deploy.yml`:
  `npx playwright install --with-deps chromium`, which brings the headless shell along for the e2e suite;
  cache key suffix `chromium-full`). On ubuntu-latest, chrome-launcher driving the headless shell never saw a
  DevTools port (`run failed — waiting for dynamic debugging port in chrome-err.log`, exit 2).
  `scripts/check-lighthouse.mjs` already preferred `chromium.executablePath()`; the shell stays the local
  fallback. Under `CI` the launch adds `--no-sandbox --disable-dev-shm-usage` (runner kernels can refuse the
  sandbox's user namespaces; `/dev/shm` is tiny on containerised runners) — never locally. The script prints
  the resolved binary + flags before the first launch and, on a launch failure, the last 20 lines of
  chrome-launcher's `chrome-err.log` (the temp profile is created by the script so the path is known), so
  the next CI failure is readable from the job log. Profile cleanup is best-effort (Windows holds the
  directory locked for a moment after Chrome exits — the first run died on EPERM in cleanup after a
  successful audit).

- **No seed pre-warming from the lazy route factories (measured, reverted).** Starting a page's `contentSource.*`
  reads when its chunk is requested put the seed requests before the first paint and Lighthouse's slow-4G model
  charged them to FCP (+0.3 s; content routes 78–84 instead of 85–87); deferring them past the paint
  (`requestAnimationFrame` + timer) still landed them a few ms before observed FCP and left LCP worse. The
  saving on offer was one 2 kB hop (the page chunk), so there was almost nothing to overlap, and the warm map
  couples the route table to what pages read. The seeds load when the page asks (BUILD_LOG P5.3 follow-up).
- **The CLS 0.102 on the content routes is the Layout FOOTER, not page content** (one 0.099 shift of
  `footer.border-t`: it sits in the first viewport behind a one-line loading state and is pushed out when the
  list arrives). Left as found — `Layout.tsx` overrides the pages' `min-h-dvh` on purpose so the disclaimer is
  visible on short pages, and changing that is a design call for the lead (reserve `min-h-dvh` on the content
  slot, or a reserved height for loading states). `diet`'s 0.827 is DietPage content (P5.1 lane).

## 2026-10-06 — P3/P4 review fixes: recipe diet chips target the diet page

- **2026-10-06 (P3/P4 REVIEW fix 1) — A recipe's diet chips link to `/diets/<slug>` (the diet's own page), not to the
  filtered recipe list `/recipes?diet=<slug>`.** PLAN P4.4 said so from the start; P3.2 shipped the filter target because
  `/diets/:slug` did not exist yet, and the header comment promised the retarget "in P4.4" — which landed without doing it.
  The plan and the code now agree (`src/recipes/RecipePage.tsx`, pinned by `RecipePage.test.tsx` in both languages). The
  filtered list remains reachable through the list page's own diet filter and URL state (`RecipesPage` still owns
  `serializeRecipeFilterParams`); `RecipeCard` chips stay plain text because the card is a stretched link (backlog).
  Same entry, two companions: shared dictionary copy has ONE owning feature module (`sourcePending` → tips; a test now
  fails on any duplicate), and the nutrition panel surfaces the engine's `unitMismatch` warnings as a footnote so an
  admin-side `unit` / `grams_per_unit` edit is visible on the page it distorts, with the seed test pinning the invariant
  `line.unit ∈ {g, ml, ingredient.unit}` both engines rest on.

## 2026-10-06 — P5.3 perf follow-up (last): footer below the fold, lazy supabase-js, fallback font metrics

- **The Layout content slot is `min-h-dvh`, so the disclaimer footer starts BELOW the first viewport on every
  route** (`src/components/Layout.tsx`: `flex min-h-dvh flex-1 flex-col [&>main]:min-h-0 [&>main]:flex-1`). The
  previous rule — override the pages' `min-h-dvh` so the footer is visible on short pages — left the footer inside
  the first screen during every loading state (the one-line Suspense fallback, or a skeleton shorter than the
  viewport) and the arriving content pushed it thousands of pixels down: ONE shift of 0.099 on recipes, diets,
  tips (0.080 workouts, 0.017–0.036 recipe/fridge/diet), a quarter of the Lighthouse performance score on each.
  Measured after: CLS 0.000 on every one of those routes. The trade accepted: on a short page (auth, not-found,
  the local-only account/admin) the disclaimer is reached by scrolling one screen. Rejected alternative: a
  reserved height per loading state — the skeletons already reserve height (P5.1) and the shift survived them,
  because the FOOTER's position, not the skeleton's, is what moved.
- **The slot also sets `[&>main]:w-full` — the `diet` residual (CLS 0.126) was the skeleton's WIDTH, not a font swap.**
  Every page's `<main>` is `mx-auto max-w-*`; as a flex item with auto horizontal margins it shrinks to its
  max-content width instead of stretching, so while the `detail` skeleton (widest bone `w-24`) was showing, `<main>`
  on `/diets/:slug` was a 128 px column centred at x=142 that snapped to x=16 / 396 px when the seeds arrived — a
  horizontal shift of the whole box (layout-shift `PerformanceObserver` with `sources`, Moto G viewport:
  `[142,154,128,669] → [16,154,396,669]` at t≈404 ms; no "web font loaded" cause). The P5.1 lane had attributed it to
  the font swap because the header nav re-wraps in the same frame (that one is 0.0004). `w-full` keeps the box in
  place and `max-w-*` still caps it; measured after: `diet` CLS 0.0004. Fixed in Layout rather than in `DietPage`
  because the rule is "the slot decides the size" and any page whose loading state is narrower than its content
  has the same bug.
- **`@supabase/supabase-js` is loaded ONLY through `import()`; the app's client is `getSupabase(): Promise<HygieiaClient | null>`,
  created once on first demand** (`src/lib/supabase.ts`). The old `export const supabase = clientFor(appEnv)` created the
  client at module load, which bundled the library (GoTrue + PostgREST + Realtime + Storage) into the shared eager chunk
  of every route — in local-only mode too, where the client is null; Lighthouse's `unused-javascript` reported 79 % of
  that chunk unused on every audit. Now: `clientFor(env, load?)` resolves null for local mode WITHOUT calling `load`
  (unit-tested with a spy), `createHygieiaClient(library, config)` is the synchronous, request-free constructor,
  `HygieiaClient` is still `ReturnType<typeof createHygieiaClient>` and `SupabaseLibrary` is `Pick<typeof
import('@supabase/supabase-js'), 'createClient'>` — a type query, erased at build. A failed library load is not
  memoised (the next call retries). The two consumers: `AuthProvider` with no `client` prop asks `getSupabase()` once
  mounted — local-only is still `unavailable` on the FIRST render (decided from `appEnv`, nothing loaded); configured
  stays `loading` until the chunk and the persisted session have arrived; a chunk-load failure sets `unavailable`
  rather than loading forever. `content/index.ts` wraps the configured source in `deferredSource('supabase', …)` — every
  `ContentSource` method awaits the real source, a load failure resolves `fail('network')` like a seed chunk failure.
  The user/admin/profile sources are unchanged (they take the client from `useAuth().client`). Result: the shared chunk
  `LangProvider-*.js` fell from 297 kB / 83 kB gzip to 82.6 kB / 28.9 kB gzip; the library is its own
  `dist-*.js` (219 kB / 56.5 kB gzip, named after the package's `dist/` entry) that the local-only build never requests
  (it is still precached by the service worker — harmless, post-load). The `build:dead` artifact and the 9 dead-backend
  e2e specs cover the configured path, where the chunk IS loaded and every read still fails `network`.
- **Fallback `@font-face` aliases with the webfonts' metrics, second in both token stacks** (`src/index.css`:
  `'Literata Fallback'` = local Georgia, `'Literata Fallback Times'` = local Times New Roman / Liberation Serif (the
  Linux runner's metric twin), `'Inter Fallback'` = local Arial / Liberation Sans / Helvetica; each with `size-adjust`,
  `ascent-override`, `descent-override`, `line-gap-override`). With `font-display: swap` the first paint is in the local
  font and the woff2 arrival reflows: P5.1 measured CLS 0.13 on `/diets/:slug` (dense Greek lists re-wrap) and 0.03–0.04
  on `/tips`. The numbers are read from the font files, not copied from a table: `head.unitsPerEm`, OS/2 typo
  ascender/descender (Literata 1177/308 per 1000; Inter 1984/494 per 2048), and the average advance width of a Greek +
  English sample through `cmap`/`hmtx` (scratch parser over the woff2 — brotli via `node:zlib` — and the Windows TTFs).
  `size-adjust` is the webfont/fallback width ratio, weighted a little towards the Greek sample because Greek is the
  default language (Literata/Georgia el 1.055 · en 1.077 → 106 %; Literata/Times 1.159 · 1.165 → 116 %; Inter/Arial
  el 1.104 · en 1.070 → 108 %); the vertical overrides are the webfont's metrics divided by that ratio (they matter
  little here — Tailwind sets explicit line-heights — the width ratio is what fixes the line breaks). Measured
  effect on THIS gate: at the noise floor — the audit server hands the woff2 subsets over in ~3 ms, so they arrive
  (57–65 ms) before the first paint (74 ms) and the only swap left is the header nav's 0.0003–0.0004; the aliases
  earn their keep on a real slow network, where the swap happens after paint and would re-wrap the dense lists.
  The `tips` residual of 0.026 is content, not fonts: the topic filter chips grow when their "(12)" counts render
  after the seeds load (`src/tips/TipsPage.tsx`, out of this task's scope; within the 0.05 target). Rejected:
  `font-display: optional` (drops the Greek webfont on a slow first visit, which for the default-language users is
  the brand font never showing) and `<link rel="preload">` of the woff2 (hashed Vite URLs; the subsets are already
  modulepreload-adjacent and the swap would still happen on a cold cache). Where neither local font exists (Android)
  the alias is skipped and the stack falls through to the generic family exactly as before — no regression, no gain.
- **Known trap, out of this task's scope, for the lead:** `scripts/check-bundle-secrets.test.ts` ("the REAL build")
  spawns `npm run build` INTO `dist/` with `{ ...process.env }` — under vitest that carries `NODE_ENV=test`, so React
  resolves to its development build and the entry becomes 431 kB raw (vs 235 kB production). `npm test` therefore
  overwrites a production `dist/` with a slower artifact; a `check:lighthouse` run after `npm test` without rebuilding
  audits that (measured here: home 88, admin 85 on an otherwise identical tree). Always `npm run build` (or
  `check:lighthouse -- --build`) after `npm test`; the fix belongs to that test (`NODE_ENV: 'production'` in the spawn
  env, or a temp `--outDir`).

## ADR-0006 — 2026-10-06 — The Lighthouse gate measures the COLD first visit, deterministically; bar 85/90/90, no CI tolerance

**Decision.** `npm run check:lighthouse` audits every route with Lighthouse `blockedUrlPatterns: ['*/registerSW.js',
'*/sw.js']`, so the service worker never registers during an audit and every byte the page needs is fetched over the
simulated slow-4G network — a cold first visit **by construction**, and the script proves it from each LHR
(`verifyColdVisit`: `sw.js` never requested, `registerSW.js` never delivered, every `/assets/*.js` request with a
non-zero `transferSize`; a run where the SW got through exits 2 — not a valid measurement, neither pass nor fail). The
gating thresholds become **performance ≥ 85, accessibility ≥ 90, best-practices ≥ 90 — the same locally and in CI**;
the `CI`-only −5 performance tolerance (`CI_PERFORMANCE_TOLERANCE`, `effectiveThresholds`) is removed with its header and
workflow text. **90 performance stays the recorded TARGET** (PLAN §1 item 10, amended), not the gate.

**Why.** P5/P6 QA (BUILD_LOG 2026-10-06 FAILURES) read it from the LHRs: within a single audit the SW installs about
300 ms in, and whichever lazily-imported seed chunks the route requests AFTER that moment are served from its precache
(`transferSize 0`) — LCP 2.9 s, performance 91 — while the same chunks over the network give LCP 3.5 s and 87. Which
side of that race a run lands on is decided inside the audit, not by the artifact: 3 of 7 runs red on an unchanged
build, each time on a different route. A gate must be a function of the artifact alone; a repeat-visit number that
depends on a race is not one. The honest cold first-visit performance of every content route is 87–88 (QA's reading,
confirmed here: `recipes`/`recipe`/`fridge`/`diet` 87, LCP 3.5 s, FCP 2.6 s), so the bar is set at the measured cold
floor with a small margin, 85. The CI tolerance existed to absorb runner CPU noise on top of a number that was itself
noisy; a deterministic measurement needs none — if GitHub's runners measure lower than 85, the gate should say so
honestly rather than hide it behind −5. Accessibility and best-practices are checklists, unaffected by the SW, and keep 90. **Enodia's 96–97** is not the comparable: it is a demo with no content payload — no seed chunk on the LCP path —
so its number says nothing about where a content route with 60–90 kB of gzipped seed data behind its first paint
should land.

**Alternatives rejected.** (a) Warm the SW before each audit and declare the gate a repeat-visit measurement: a stable
number, but the WRONG one for a first-visit product, and it would hide every cold-path regression. (b) Keep 90 and
retry until green: a flaky gate with a loop around it is still a flaky gate. (c) Make the artifact score 90 cold today:
the lever is seed bytes behind LCP on content routes (render the above-the-fold frame before the seed `import()`
resolves) and, later, server-side content once configured mode ships — real work, tracked as the target, not something
to fake with a threshold.

**Consequence.** The three-run determinism proof is a documented command, not part of the script (header of
`scripts/check-lighthouse.mjs`: `for i in 1 2 3; do npm run check:lighthouse || echo "RUN $i FAILED"; done`, tables
within ±1). The SW's offline / repeat-visit behaviour stays proven by `npm run e2e` (`offline.spec.ts`), untouched.
Lighthouse 12 carries no `service-worker` audit and no `fromServiceWorker` field on `network-requests` items (both left
with the PWA category), so `transferSize` is the signal the proof uses. Recorded 2026-10-06 by the gate-correctness
builder (worktree `wt/g`) from the lead's decision; BUILD_LOG entry of the same date has the three tables.
