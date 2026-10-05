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
