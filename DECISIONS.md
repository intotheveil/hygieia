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
