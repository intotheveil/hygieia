# PLAN — Hygieia (`hygieia`) · spec v0.2 → CLAUDE.md §9 arc

Written 2026-10-05 by `planner` from `D:/projects/zeus/specs/HYGIEIA_SPEC.md` v0.2, `BRAIN.md` §3 (the
eight operator decisions), `DECISIONS.md` ADR-0001..0004 and the P0 code. **P0 Foundation is DONE and
deployed** (installable PWA at https://intotheveil.github.io/hygieia/); this plan starts at **P1**.
Phases P1–P6 follow §9 exactly; only P3/P4 content comes from the spec. Every phase ends with a `qa`
task, a `reviewer` task and a human CHECKPOINT. No phase is skipped.

## 0. Conventions used below

- **Repo root:** `D:/projects/hygieia`. Every path is absolute. Donor repos: `D:/projects/themis`
  (migration toolchain, Playwright harness, bundle scan) and `D:/projects/enodia-transit` (fleet telemetry).
- **Standing gate `G0`** (every task, already wired): `npm run lint && npm run typecheck && npm test && npm run build && npm run check:pwa`
- **`G1`** (from P1.1 on) = `G0 && npm run db:check && npm run db:gate && npm run seed:check`
- **`G1+`** (phase QA from P1) = `G1 && npm run db:gate:prove-red`
- **`G3`** (from P3.6 on) = `G1 && npm run e2e`
- **`G6`** (from P6.2 on) = `G3 && npm run check:bundle`
- **Parallel groups:** tasks tagged `∥ <letter>` share a letter when they touch DISJOINT files and may be
  dispatched to separate worktrees at the same time. Tasks with no tag, or that share a file with another
  task, run sequentially. `package.json` is edited ONLY in the first task of each phase that needs it
  (front-loaded), so later tasks in the phase never collide on it.
- **Migrations:** `D:/projects/hygieia/supabase/migrations/YYYYMMDDHHMMSS_hygieia_<name>.sql`, forward-only,
  idempotent-safe (gate applies the archive twice), `hygieia.`-qualified everywhere, nothing in
  `public`/`auth`/`storage`/`supabase_migrations` (ADR-0003). Live application is an OPERATOR task, never a crew task.
- **Bilingual rule:** every UI string is a `Dictionary` key present in both `en` and `el`
  (`D:/projects/hygieia/src/i18n/dictionary.ts`, ADR-0002). Every content row carries both languages (see §1).
- **Content drafting rule (applies to P1.9–P1.11, P4.7–P4.9):** draft from well-established reference
  values; label nutrition as _typical values from USDA FoodData Central reference ranges_
  (`source_note`); never invent a source URL — if a tip has no real source, leave `source_url` null and set
  `needs_source = true`. Greek loanwords (keto, paleo, Atkins, calisthenics) stay Latin-script in `el`.
- **Records:** every task ends by updating `D:/projects/hygieia/BUILD_LOG.md`; a non-obvious choice also goes to
  `D:/projects/hygieia/DECISIONS.md` and `D:/projects/hygieia/BRAIN.md` §7; a hard-won lesson to BRAIN §5 (rubric §6, last line).

## 1. Decisions the plan encodes (lead-decided; planner's picks marked ★)

1. **DB = Alyssos's shared project, schema `hygieia` only** (ADR-0003). Ledger `hygieia.schema_migrations`;
   `npm run db:gate` (PGlite) rehearses; `npm run db:apply` (Management API, `SUPABASE_ACCESS_TOKEN` +
   `HYGIEIA_SUPABASE_PROJECT_REF`, dry-run default) applies with the operator's go. Never `supabase db push`.
2. ★ **Locale columns: same-row `*_el` / `*_en`, both `not null` with `check (btrim(x) <> '')`.** Why: it is
   ADR-0002 at the database layer — a missing translation is a constraint violation, the DB analogue of the
   type error; one row = one TS seed object = one admin form (both languages side by side); PostgREST selects
   stay flat (no join, no "which locale rows exist" query); Hygieia has exactly two fixed languages, so an
   i18n side table would pay for N languages that do not exist. Reopen (DECISIONS.md) if a third language ships.
3. **Every content row has `status text not null default 'pending' check (status in ('pending','approved','rejected'))`**
   plus `reviewed_at timestamptz`, `reviewed_by uuid references auth.users (id) on delete set null`, stamped by a
   BEFORE UPDATE trigger when `status` changes. Anon/authenticated read `approved` only; an admin
   (`hygieia.profiles.is_admin`) reads everything and may UPDATE. No client role may INSERT or DELETE content
   (seeds arrive by migration; `service_role` keeps full DML).
4. ★ **Policies are written per role, not with `or hygieia.is_admin()` in a shared policy.** `for select to anon
using (status = 'approved')` and `for select to authenticated using (status = 'approved' or hygieia.is_admin())`.
   Why: a policy evaluated as `anon` that calls a function `anon` cannot EXECUTE errors out; the split keeps
   `anon` with zero EXECUTE on any `hygieia` function (the gate asserts that).
5. **`ContentSource` interface, two implementations** (`D:/projects/hygieia/src/content/`): `bundled` (typed seed
   data under `src/content/seed/**`, shown with the bilingual "Draft — awaiting review / Πρόχειρο — εκκρεμεί
   έλεγχος" ribbon) and `supabase` (reads `approved` rows from schema `hygieia` through the client pinned with
   `db: { schema: 'hygieia' }`). Chosen by `appEnv.mode` (`local` → bundled, `configured` → supabase).
6. ★ **One source of truth for seed content:** the TS seed modules. `scripts/gen-seed-sql.mjs` generates the seed
   migrations from them (deterministic order and number formatting); `npm run seed:check` regenerates and diffs
   byte-for-byte (LF-normalised) against the committed files, so bundled and DB seeds cannot diverge.
   ★ **Stable ids:** every content row's `id = md5('hygieia:<table>:<slug>')::uuid`, computed by the generator
   (node `crypto`) and asserted by the gate for every seeded row; the APP keys content by `slug`, so bundled mode
   never needs ids. After a seed migration is live, content changes happen in the DB through the admin page;
   the bundled snapshot is the no-backend fallback at seed-time quality (recorded in DECISIONS.md by P1.12).
7. **Per-user data only in Supabase** (`fridge_lists`, `saved_plans`, `favourites`), RLS `user_id = auth.uid()`
   on every verb, cross-user isolation proven in `db:gate` and in `npm test`. In local-only mode these features
   are visible but disabled with a bilingual explanatory note.
8. **Auth (P2):** shared Supabase Auth — email magic link + Google. `hygieia.profiles` keyed on `auth.users.id`,
   `is_admin boolean not null default false`, settable ONLY by the operator via SQL (snippet in
   `docs/ops/admin.md`; never a hardcoded email, never a migration). No trigger on `auth.users`; the profile row
   is created client-side on first session (RLS self-insert, column-limited grant so `is_admin` cannot be set).
   Admin gating both client-side (`RequireAdmin`) and in RLS (admin UPDATE policy).
9. ★ **Playwright harness lands in P3 (P3.6), not P5.** §9's P3 exit gate reads "e2e covers the workflow", and
   §9 binds. P5 extends the suite (axe, error states, offline, Lighthouse). The lead's note "e2e from P5" is
   therefore interpreted as "e2e is a _standing gate_ from P5"; `npm run e2e` exists from P3.6.
10. **Lighthouse (P5.3):** Lighthouse 12 removed the PWA category, so "PWA/perf ≥ 90" is encoded as
    mobile **performance ≥ 90 and accessibility ≥ 90 and best-practices ≥ 90**; installability stays `check:pwa`.
    **Amended 2026-10-06 (ADR-0006, after P5/P6 QA):** the gate is a **cold-visit gate 85/90/90** — every
    audit blocks the service worker so the measurement is deterministic and a function of the artifact
    alone; performance ≥ 85 locally AND in CI (no CI tolerance), accessibility ≥ 90, best-practices ≥ 90.
    **90 performance is the target**, not the gate (backlog; levers: seed bytes behind LCP on content
    routes, server-side content once configured mode ships).
11. **Fleet telemetry env names** stay as reserved in `.env.example`: `VITE_FLEET_URL`, `VITE_FLEET_KEY`,
    `VITE_FLEET_PRODUCT_ID` (Enodia's donor uses `VITE_FLEET_TELEMETRY_*`; names are remapped at init, nothing else).

## 2. Schema `hygieia` (the contract P1 builds; column lists are the acceptance criteria of P1.5–P1.7)

| table                        | kind               | key columns (besides `id uuid pk`, `created_at`, `updated_at`)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ---------------------------- | ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `schema_migrations`          | service-only       | `version text pk, name text, checksum text, applied_at timestamptz` (RLS on, no policy, no client grant)                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `profiles`                   | per-user           | `user_id uuid pk → auth.users on delete cascade, display_name text ≤120, is_admin boolean not null default false`                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `ingredients`                | content            | `slug text unique, name_el, name_en, category text, unit text check in ('g','ml','piece','tbsp','tsp','slice','clove','bunch'), grams_per_unit numeric >0 default 1, kcal_100g, protein_100g, carbs_100g, fat_100g numeric ≥0 (check protein+carbs+fat ≤ 100), source_note text not null, price_eur_min numeric ≥0, price_eur_max numeric ≥ price_eur_min, price_per text check in ('kg','l','piece'), price_as_of date, price_note text, substitute_slugs text[] not null default '{}', is_pantry_staple boolean not null default false, status, reviewed_at, reviewed_by` |
| `diets`                      | content            | `slug unique, name_el/en, summary_el/en, allowed_el/en text[], avoided_el/en text[], pros_el/en text[], cons_el/en text[], avoid_if_el/en text[], source_url text null check (~ '^https?://'), status…`                                                                                                                                                                                                                                                                                                                                                                     |
| `recipes`                    | content            | `slug unique, title_el/en, steps_el text[] / steps_en text[] (check cardinality ≥ 1 and equal), portions int ≥1, prep_min int ≥0, meal_types text[] check (⊆ breakfast,lunch,dinner,snack and ≥1), image_path text null, status…`                                                                                                                                                                                                                                                                                                                                           |
| `recipe_ingredients`         | child of recipes   | `recipe_id → recipes cascade, ingredient_id → ingredients restrict, position int, quantity numeric ≥0, unit (same check), note_el/en text null (both or neither), pk (recipe_id, position)`                                                                                                                                                                                                                                                                                                                                                                                 |
| `recipe_diets`               | child of recipes   | `recipe_id → recipes cascade, diet_id → diets cascade, pk (recipe_id, diet_id)`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `exercises`                  | content            | `slug unique, name_el/en, cue_el/en, workout_type check in ('home','gym','calisthenics','running','swimming','cycling','mobility'), level check in ('beginner','intermediate','advanced'), muscle_groups text[], equipment_el/en text null, status…`                                                                                                                                                                                                                                                                                                                        |
| `workout_templates`          | content            | `slug unique, workout_type, level, intensity check in ('low','moderate','high'), unique (workout_type, level, intensity), title_el/en, duration_min int, notes_el/en, status…`                                                                                                                                                                                                                                                                                                                                                                                              |
| `workout_template_exercises` | child of templates | `template_id → templates cascade, exercise_id → exercises restrict, position, block check in ('warmup','main','cooldown'), sets int ≥1, reps int null, seconds int null, rest_seconds int ≥0, check (reps is not null or seconds is not null), pk (template_id, position)`                                                                                                                                                                                                                                                                                                  |
| `health_tips`                | content            | `slug unique, topic check in ('sleep','hydration','nutrition','movement','habits','mental'), title_el/en, body_el/en, source_url text null check (~ '^https?://'), needs_source boolean not null default false, check (source_url is not null or needs_source), status…`                                                                                                                                                                                                                                                                                                    |
| `fridge_lists`               | per-user           | `user_id uuid not null default auth.uid() → auth.users cascade, name text ≤80, ingredient_slugs text[] not null default '{}'`                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `saved_plans`                | per-user           | `user_id … , diet_id → diets restrict, week_start date, plan jsonb not null`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `favourites`                 | per-user           | `user_id …, recipe_id → recipes cascade, pk (user_id, recipe_id)`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |

Child tables have no `status`: a child row is visible iff its parent is `approved` (or the caller is admin).

---

## Phase P1: Data spine

Schema `hygieia` committed as migrations, RLS on every table, the toolchain that proves and applies them, the
typed content model, the first content seed (ingredients, diets, recipes) and the `ContentSource` layer.

### P1.1 Migration toolchain scaffold: scripts, deps, static guard, Management-API client

- **Goal:** everything P1.2–P1.3 share lands first: npm scripts, devDeps, the static guard and the API client.
- **Files:** `D:/projects/hygieia/package.json` (scripts `db:check`, `db:gate`, `db:gate:prove-red`, `db:apply`,
  `seed:gen`, `seed:check`; devDep `@electric-sql/pglite` ^0.5.8), `D:/projects/hygieia/scripts/check-migrations.mjs`,
  `D:/projects/hygieia/scripts/check-migrations.test.ts`, `D:/projects/hygieia/scripts/lib/mgmt-api.mjs`,
  `D:/projects/hygieia/supabase/migrations/.gitkeep`, `D:/projects/hygieia/vite.config.ts` (test `exclude` unchanged; add
  `// @vitest-environment node` convention note in `D:/projects/hygieia/src/test/setup.ts` header only if needed — no logic change).
- **Approach:** lift `D:/projects/themis/scripts/check-migrations.mjs` verbatim, then: `FILENAME_RE = /^\d{14}_hygieia_[a-z0-9_]+\.sql$/`,
  the `target-outside-themis` rule becomes `target-outside-hygieia` (schema literal `hygieia`), `alter default privileges … in schema hygieia`,
  messages cite ADR-0003. Lift `D:/projects/themis/scripts/lib/mgmt-api.mjs` verbatim (no project-specific text).
  Lift `D:/projects/themis/scripts/check-migrations.test.ts` and rename fixtures. Script tests run under Vitest with
  `// @vitest-environment node` at the top of each `scripts/*.test.ts` (the default is jsdom).
- **Acceptance (runnable):** `G0` green; `npm run db:check` on the empty dir exits 1 with `no migrations found`;
  `npx vitest run scripts/check-migrations.test.ts` green with cases: good name passes; `_themis_` name fails `[filename]`;
  `create table x` fails `[target-outside-hygieia]`; `create table public.x` fails `[forbidden-schema]`;
  `references auth.users`, `auth.uid()`, `from auth.users` (read) pass; `create trigger … on auth.users` fails;
  `create extension` fails.
- **Depends on:** P0. **Migration:** none. **Tenant data:** no.

### P1.2 PGlite gate harness + Alyssos shim + bootstrap migration ∥ A

- **Goal:** `npm run db:gate` applies the archive twice on a throwaway Postgres dressed as the shared project and proves the bootstrap contract.
- **Files:** `D:/projects/hygieia/scripts/db-gate.mjs`, `D:/projects/hygieia/scripts/db-gate/shim.mjs`,
  `D:/projects/hygieia/supabase/migrations/20261006000100_hygieia_schema.sql`.
- **Approach:** lift `D:/projects/themis/supabase/migrations/20260928200000_themis_schema.sql` with `themis → hygieia`
  (schema, `grant usage … to anon, authenticated, service_role`, `alter default privileges in schema hygieia revoke execute on functions from public`,
  `hygieia.schema_migrations` with RLS on + no policy + `revoke all … from anon, authenticated`, `hygieia.touch_updated_at()` pinned `search_path = ''`).
  Lift `D:/projects/themis/scripts/db-gate.mjs` lines 1–260 (guard-first, apply, re-apply, bootstrap contract, exit-code-not-process.exit
  pattern — BRAIN Themis §5: never `process.exit()` in a PGlite script on Windows) with `themis → hygieia`; drop the Themis
  leak-matrix imports (P1.8 adds Hygieia's catalogue). Shim from `D:/projects/themis/scripts/db-gate/shim.mjs`: roles
  `anon/authenticated/service_role (bypassrls)`, `auth.users (id, email, email_confirmed_at default now())`, `auth.uid()`,
  `public` default privileges, `supabase_migrations.schema_migrations` with `ALYSSOS_MIGRATION_ROWS` rows (constant; the live
  count is unknown and irrelevant — the check is invariance), plus an Alyssos-shaped `public`: `public.profiles` (name-collision
  proof) and `public.spatial_ref_sys` with RLS OFF (as live, BRAIN §4 O2). Nothing pre-granted on schema `hygieia`.
- **Acceptance:** `npm run db:gate` prints `applied 20261006000100_hygieia_schema.sql`, `re-apply … (idempotent-safe)` PASS,
  `schema hygieia exists`, `hygieia.schema_migrations has (version text, name text, checksum text, applied_at timestamptz)`,
  `… RLS enabled`, `… NO policies`, `anon/authenticated holds no privilege on hygieia.schema_migrations`,
  `anon/authenticated/service_role has USAGE on schema hygieia`, `hygieia.touch_updated_at() … search_path pinned`,
  `anon holds no EXECUTE on hygieia.touch_updated_at()`, `supabase_migrations.schema_migrations still holds N rows`,
  ends `GATE PASSED`, exit 0; `npm run db:check` exits 0 (1 file); `G0` green.
- **Depends on:** P1.1. **Migration:** yes (bootstrap). **Tenant data:** no.

### P1.3 Live applier `npm run db:apply` (dry-run default) ∥ A

- **Goal:** the only path by which a migration reaches the shared project; refuses drift, out-of-order, transaction control; dry-run rolls back.
- **Files:** `D:/projects/hygieia/scripts/db-apply.mjs`, `D:/projects/hygieia/scripts/db-apply.test.ts`.
- **Approach:** lift `D:/projects/themis/scripts/db-apply.mjs` with `ENV_REF = 'HYGIEIA_SUPABASE_PROJECT_REF'`,
  `LEDGER = 'hygieia.schema_migrations'`, filename regex `_hygieia_`, `PAIRED = []`, usage text `npm run db:apply [-- --apply]`.
  Lift `D:/projects/themis/scripts/db-apply.test.ts` (fake `fetch`; no network) and adapt names.
- **Acceptance:** `npx vitest run scripts/db-apply.test.ts` green: missing env → exit 2 and names both vars; guard red → exit 1,
  no request; ledger absent → plan = all files; checksum changed → `CHECKSUM CHANGED` refusal; pending older than newest applied →
  `OUT OF ORDER`; a file containing `commit;` → `TRANSACTION CONTROL`; dry-run sends batches ending `rollback;`, `--apply` sends
  `commit;` and inserts the ledger row with the sha256; token never appears in any log line (redaction test). `G0` green.
- **Depends on:** P1.1. **Migration:** none. **Tenant data:** no.

### P1.4 Content domain types, enums and slugs ∥ A

- **Goal:** the TS contract every seed module, migration and UI depends on (front-loaded).
- **Files:** `D:/projects/hygieia/src/content/types.ts`, `D:/projects/hygieia/src/content/enums.ts`,
  `D:/projects/hygieia/src/content/types.test.ts`.
- **Approach:** erasable-syntax TS only (no `enum`, no parameter properties — node's type stripping must import these from
  `scripts/*.mjs`): `as const` arrays + derived unions for `Unit`, `PricePer`, `WorkoutType` (7), `Level` (3), `Intensity` (3),
  `Block`, `MealType`, `TipTopic`, `ContentStatus`; `Localized<T>` helper producing `{ x_el: T; x_en: T }` pairs; seed types
  `IngredientSeed`, `DietSeed`, `RecipeSeed` (ingredient lines by `ingredient_slug`, diet tags by `diet_slug`), `ExerciseSeed`,
  `WorkoutTemplateSeed`, `HealthTipSeed` — WITHOUT `id`/`status`/review columns; row types = seed + `id`, `status`, `reviewed_*`.
  Export `SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/` and `CONTENT_TABLES` (names in §2) for the gate and generator.
- **Acceptance:** `G0` green; `types.test.ts` asserts the enum arrays match §2 literally (7 types, 3 levels, 3 intensities,
  4 meal types, 6 topics, 8 units, 3 price units) and `SLUG_RE` accepts `greek-salad`, rejects `Greek_Salad`.
- **Depends on:** P0. **Migration:** none. **Tenant data:** no.

### P1.5 Migration: `profiles` + `hygieia.is_admin()` + review-stamp trigger

- **Goal:** the identity and admin primitives every content policy needs.
- **Files:** `D:/projects/hygieia/supabase/migrations/20261006000200_hygieia_profiles.sql`.
- **Approach:** pattern `D:/projects/themis/supabase/migrations/20260928210000_themis_tenancy.sql` (profiles part): table per §2;
  RLS on; policies `profiles_select_self` (select to authenticated `user_id = auth.uid()`), `profiles_insert_self`
  (with check `user_id = auth.uid() and is_admin = false`), `profiles_update_self` (using/with check self); grants:
  `revoke all from public, anon`; `grant select on hygieia.profiles to authenticated`; `grant insert (user_id, display_name)`,
  `grant update (display_name)` — `is_admin` has NO client grant; `service_role` full DML. Helper
  `hygieia.is_admin() returns boolean language sql stable security definer set search_path = ''` →
  `select coalesce((select p.is_admin from hygieia.profiles p where p.user_id = auth.uid()), false)`; `revoke execute … from public, anon`;
  `grant execute … to authenticated`. Trigger fn `hygieia.stamp_review()` (plpgsql, pinned): when `new.status is distinct from old.status`
  set `new.reviewed_at = now(), new.reviewed_by = auth.uid()`; revoke execute from public/anon/authenticated. `updated_at` trigger on profiles.
- **Acceptance:** `npm run db:check` 0; `npm run db:gate` GATE PASSED with the archive applied twice; `G0` green. (Role proofs come in P1.8.)
- **Depends on:** P1.2. **Migration:** yes. **Tenant data:** yes (profiles; isolation proven in P1.8).

### P1.6 Migration: content tables + RLS + grants

- **Goal:** `ingredients`, `diets`, `recipes`, `recipe_ingredients`, `recipe_diets`, `exercises`, `workout_templates`,
  `workout_template_exercises`, `health_tips` exactly as §2.
- **Files:** `D:/projects/hygieia/supabase/migrations/20261006000300_hygieia_content.sql`.
- **Approach:** per content table: columns per §2 (both locale columns `not null check (btrim(x) <> '')`), `updated_at` trigger,
  `stamp_review` BEFORE UPDATE trigger, RLS on, policies per §1.4: `<t>_select_anon` (to anon, `status = 'approved'`),
  `<t>_select_auth` (to authenticated, `status = 'approved' or hygieia.is_admin()`), `<t>_update_admin` (to authenticated,
  using/with check `hygieia.is_admin()`); grants: `revoke all from public`; `grant select to anon, authenticated`;
  `grant update (<all content columns>, status) to authenticated` (never `id`, `slug`, `created_at`, `reviewed_*`); no INSERT/DELETE
  to client roles; `service_role` full. Child tables: `<c>_select_anon` `exists (select 1 from hygieia.recipes r where r.id = recipe_id and r.status = 'approved')`,
  `<c>_select_auth` the same `or hygieia.is_admin()`, admin update/insert/delete policies + grants (admins edit ingredient lines);
  indexes on every FK column and on `(status)`.
- **Acceptance:** `npm run db:check` 0; `npm run db:gate` GATE PASSED (3 files, applied twice); a Vitest
  `D:/projects/hygieia/scripts/db-schema-contract.test.ts` (new, PGlite, node env) applies the archive and asserts for every table in §2
  the exact ordered column list and the CHECK literals (enums) equal `src/content/enums.ts` arrays — the DB and TS enums cannot drift. `G0` green.
- **Depends on:** P1.4, P1.5. **Migration:** yes. **Tenant data:** no (content is public-by-status; per-user data is P1.7).

### P1.7 Migration: per-user tables (`fridge_lists`, `saved_plans`, `favourites`)

- **Goal:** the three tenant tables with `auth.uid()` RLS on every verb.
- **Files:** `D:/projects/hygieia/supabase/migrations/20261006000400_hygieia_user_data.sql`.
- **Approach:** columns per §2; RLS on; one policy per verb `to authenticated` with `user_id = auth.uid()` (insert `with check`,
  update using+with check, delete using); grants `select, insert, update, delete` to authenticated (column-limited insert/update
  excluding `user_id` so it always comes from the default `auth.uid()`), nothing to anon/public, full to service_role;
  `updated_at` triggers; indexes on `user_id`.
- **Acceptance:** `npm run db:check` 0; `npm run db:gate` GATE PASSED (4 files, twice); `G0` green. Isolation proofs: P1.8.
- **Depends on:** P1.6 (FKs to recipes/diets). **Migration:** yes. **Tenant data:** yes.

### P1.8 Gate catalogue: structural sweep, fixture, isolation + role matrix, orphan scan, Vitest twin

- **Goal:** the gate proves §9's P1 gate and §3.2 for THIS schema and fails on any new table without an entry.
- **Files:** `D:/projects/hygieia/scripts/db-gate.mjs` (extend), `D:/projects/hygieia/scripts/db-gate/catalogue.mjs` (new),
  `D:/projects/hygieia/scripts/db-isolation.test.ts` (new).
- **Approach:** lift the structural sweep from `D:/projects/themis/scripts/db-gate.mjs` lines 260–500 (RLS on every table; views
  `security_invoker`; every function `search_path` pinned; no definer on `public/$user/pg_temp`; anon and PUBLIC EXECUTE on no
  function; no write policy admits anon/PUBLIC; FKs validated; foreign snapshot of `public/auth/supabase_migrations` unchanged;
  no trigger on `auth.users`). Replace the Themis leak matrix with `catalogue.mjs`: one entry per `hygieia` table, kinds
  `content` | `child` | `user` | `profiles` | `service-only`; harness `createHarness(db).actAs(who, fn)` (rolled-back transaction,
  `request.jwt.claim.sub` set, `s.attempt` savepoints) lifted from `D:/projects/themis/scripts/db-gate/leak-matrix.mjs`. Fixture
  (superuser, committed): users `UA`, `UB` (profiles, `is_admin=false`), `ADMIN` (`is_admin=true`); per content table ≥1 `approved`
  and ≥1 `pending` row (seed rows are pending; the fixture flips named rows approved) and children under both; per user table rows
  of A and B. Checks per kind — `content`: anon reads exactly the approved count and 0 pending; UA the same; ADMIN reads all; UA's
  `update … set status='approved'` has no effect; ADMIN's takes effect AND `reviewed_by = ADMIN`, `reviewed_at > fixture`;
  anon/authenticated hold no INSERT/DELETE privilege; `id = md5('hygieia:<table>:' || slug)::uuid` for every row (seed-id rule).
  `child`: anon reads only children of approved parents; ADMIN reads all. `user`: fixture non-vacuous; UB reads ZERO of A; UB reads
  all of B; UB's UPDATE/DELETE of A no effect; UB's INSERT as A refused; control INSERT as UA succeeds; anon reads nothing; UA reads
  all of A. `profiles`: UB reads 0 of UA's row; UA's `update … set is_admin = true` refused (no column grant); UA's insert with
  `is_admin = true` refused. Coverage: every table has an entry, every entry names a table, no dupes. Orphan scan over every FK.
  `db-isolation.test.ts`: one PGlite, archive applied, the `user` + `profiles` checks as Vitest cases (so `npm test` carries §3.2).
- **Acceptance:** `npm run db:gate` → `GATE PASSED`, ≥ 80 PASS lines, 0 FAIL, exit 0; `npx vitest run scripts/db-isolation.test.ts` green
  (≥ 3 tables × 6 checks); `G0` green.
- **Depends on:** P1.5–P1.7. **Migration:** none. **Tenant data:** yes (proves it).

### P1.9 Seed content: ingredients (~160, EL+EN, nutrition + EUR price) ∥ B

- **Goal:** the shared spine the spec says to build first.
- **Files:** `D:/projects/hygieia/src/content/seed/ingredients.ts`, `D:/projects/hygieia/src/content/seed/ingredients.test.ts`.
- **Approach:** `export const INGREDIENTS: readonly IngredientSeed[]` covering Greek staples (vegetables, fruit, legumes, grains, dairy,
  meat, fish, oils, herbs/spices, pantry) with categories; `source_note = 'Typical values, USDA FoodData Central reference ranges'`;
  prices as typical Greek supermarket ranges with `price_as_of` = drafting date and `price_note` naming the basis; `substitute_slugs`
  where sensible (feta → ricotta, …); `is_pantry_staple` for salt, pepper, water, olive oil, vinegar. Content drafting rule (§0).
- **Acceptance:** `G0` green; the test asserts: count ≥ 160; unique slugs matching `SLUG_RE`; every `*_el`/`*_en` non-blank;
  `el` names contain Greek script except an allow-list of loanwords; macros each ≥ 0 and sum ≤ 100; kcal within 0..900;
  `price_eur_min ≤ price_eur_max`; every `substitute_slugs` entry resolves; every `price_as_of` parses as a date.
- **Depends on:** P1.4. **Migration:** none (P1.12 generates it). **Tenant data:** no.

### P1.10 Seed content: diets (8, EL+EN) ∥ B

- **Goal:** the eight diet pages' data.
- **Files:** `D:/projects/hygieia/src/content/seed/diets.ts`, `D:/projects/hygieia/src/content/seed/diets.test.ts`.
- **Approach:** Mediterranean, Atkins, paleo, low-carb, keto, carnivore, vegetarian, vegan — each with summary, allowed/avoided,
  pros/cons, who should avoid (always including "pregnant, under medical treatment, or with a diagnosed condition: ask a doctor");
  `source_url` only when a real, stable reference exists (else null). Content drafting rule (§0).
- **Acceptance:** `G0` green; test: exactly 8; unique slugs; every locale pair non-blank with equal array lengths per pair;
  each `avoid_if_*` has ≥ 1 entry; `source_url` null or `https?://`.
- **Depends on:** P1.4. **Migration:** none. **Tenant data:** no.

### P1.11 Seed content: recipes (~40, EL+EN, lines by ingredient slug, diet tags, meal types)

- **Goal:** the P3 slice's corpus; every diet gets recipes for every meal type.
- **Files:** `D:/projects/hygieia/src/content/seed/recipes.ts`, `D:/projects/hygieia/src/content/seed/recipes.test.ts`.
- **Approach:** ≥ 40 recipes, each ≥ 3 steps (equal step counts EL/EN), portions, prep time, `meal_types`, ingredient lines
  `{ ingredient_slug, quantity, unit, note_el?, note_en? }` using only P1.9 slugs, `diet_slugs` using only P1.10 slugs.
  Coverage target: each diet ≥ 5 tagged recipes and ≥ 1 per meal type (breakfast/lunch/dinner) so P4.5 can fill a week.
- **Acceptance:** `G0` green; test: count ≥ 40; unique slugs; every `ingredient_slug` and `diet_slug` resolves; steps ≥ 3 and equal
  lengths; portions ≥ 1; `meal_types` non-empty subset; coverage matrix (diet × meal type) has no empty cell for breakfast/lunch/dinner.
- **Depends on:** P1.9, P1.10. **Migration:** none. **Tenant data:** no.

### P1.12 Seed generator + generated seed migrations + `seed:check`

- **Goal:** one source of truth: TS seed → SQL seed migrations, verified by diff.
- **Files:** `D:/projects/hygieia/scripts/gen-seed-sql.mjs`, `D:/projects/hygieia/scripts/gen-seed-sql.test.ts`,
  `D:/projects/hygieia/supabase/migrations/20261006000500_hygieia_seed_ingredients.sql`, `…000600_hygieia_seed_diets.sql`,
  `…000700_hygieia_seed_recipes.sql`, `D:/projects/hygieia/scripts/db-gate/catalogue.mjs` (reference counts), `D:/projects/hygieia/DECISIONS.md` (§1.6 entry).
- **Approach:** node ESM importing the seed modules by `.ts` path (type stripping; the pattern `D:/projects/themis/scripts/db-gate.mjs`
  line 58 uses). Per kind emits `insert into hygieia.<table> (id, slug, …) values (…) on conflict (id) do nothing;` (idempotent-safe),
  `id = md5('hygieia:<table>:<slug>')::uuid` via `crypto.createHash('md5')`, child rows resolve FKs by the same formula; `status`
  omitted (default pending); deterministic ordering (by slug) and formatting (`toFixed` where numeric); SQL literal escaping via `''`;
  header comment names the generator and source file. `seed:gen` writes the files; `seed:check` regenerates to memory and exits 1 on
  any byte difference (LF-normalised), naming the file. Record the "bundled = seed snapshot; DB = living truth" decision.
- **Acceptance:** `npm run seed:gen && git diff --exit-code supabase/migrations` clean; `npm run seed:check` exits 0, and exits 1 after
  editing one `name_en` in TS (restore); `npm run db:check` 0; `npm run db:gate` GATE PASSED with seed counts asserted
  (ingredients ≥ 160, diets = 8, recipes ≥ 40, recipe_ingredients > 0, recipe_diets > 0) and the md5-id check PASS for every row;
  `gen-seed-sql.test.ts` covers escaping (`O'Brien`), determinism (two runs equal), and the id formula against a known vector; `G0` green.
- **Depends on:** P1.6, P1.8, P1.9–P1.11. **Migration:** yes (3 generated). **Tenant data:** no.

### P1.13 `ContentSource` layer: bundled + supabase, schema-pinned client, draft ribbon ∥ C

- **Goal:** the data access contract the UI will consume; works with no backend.
- **Files:** `D:/projects/hygieia/src/content/source.ts`, `D:/projects/hygieia/src/content/bundled.ts`,
  `D:/projects/hygieia/src/content/supabase.ts`, `D:/projects/hygieia/src/content/index.ts`, `D:/projects/hygieia/src/content/db-types.ts`,
  `D:/projects/hygieia/src/content/source.test.ts`, `D:/projects/hygieia/src/lib/supabase.ts` (add `db: { schema: 'hygieia' }` to
  `CLIENT_OPTIONS`; typed `createClient<Database>`), `D:/projects/hygieia/src/lib/supabase.test.ts`,
  `D:/projects/hygieia/src/components/DraftRibbon.tsx`, `D:/projects/hygieia/src/i18n/dictionary.ts` (keys `draftRibbon`, `draftRibbonHint`).
- **Approach:** `interface ContentSource { kind: 'bundled' | 'supabase'; listIngredients(); listDiets(); listRecipes(filter?); getRecipe(slug);
listExercises(); listWorkoutTemplates(); getWorkoutTemplate(type, level, intensity); listTips() }` returning `Promise<Result<T>>`
  (`{ ok: true, data } | { ok: false, error: 'network' | 'unknown' }`, never throws). `bundled` wraps the seed arrays with `status: 'pending'`
  and resolves ingredient lines by slug; `supabase` selects with `.eq('status','approved')` (defence in depth; RLS already filters) and
  embeds children via PostgREST (`recipe_ingredients(*, ingredient:ingredients(*))`). `index.ts`: `contentSource = appEnv.mode === 'configured' ? supabaseSource(supabase) : bundledSource`.
  `DraftRibbon` renders when `source.kind === 'bundled'` or a row is not approved.
- **Acceptance:** `G0` green; tests: bundled returns ≥ 160/8/40 and resolves every recipe line; filter by diet slug returns only tagged
  recipes; unknown slug → `null`; supabase source (fake client) passes `status = approved` and the schema option; `CLIENT_OPTIONS.db.schema === 'hygieia'`
  asserted; `DraftRibbon` renders both dictionary strings per language.
- **Depends on:** P1.4, P1.9–P1.11 (data), P1.6 (column names for `db-types.ts`). **Migration:** none. **Tenant data:** no.

### P1.14 `npm run db:gate:prove-red` — the gate proven RED ∥ C

- **Goal:** a gate nobody has seen fail is not a gate.
- **Files:** `D:/projects/hygieia/scripts/db-gate-prove-red.mjs`.
- **Approach:** lift `D:/projects/themis/scripts/db-gate-prove-red.mjs` harness (temp copies, control run, `RED_LINE`, pool), sabotage file
  `29991231235959_hygieia_zz_sabotage.sql`, and replace `SABOTAGES` with ≥ 16 Hygieia ones, each with its expected FAIL line:
  recipes SELECT policy `using (true)` to anon (pending leaks) · RLS disabled on `favourites` · new table without catalogue entry ·
  `create table public.x` (guard) · trigger on `auth.users` (guard) · `fridge_lists` select policy `using (true)` (UB reads A) ·
  `saved_plans` update policy `using (true)` · `grant update (is_admin) on hygieia.profiles to authenticated` · `hygieia.is_admin()`
  replaced by `select true` (UA flips status) · definer without `search_path` · `grant execute … to anon` · `grant insert on hygieia.recipes to anon` ·
  `recipe_ingredients` select policy `using (true)` (children of pending parents leak) · `drop trigger … stamp_review` on recipes
  (`reviewed_by` not set) · a seeded row re-inserted with a random id (md5-id check) · `create table hygieia.twice (id int)` (not idempotent) ·
  `alter table hygieia.no_such add column x int` (apply error).
- **Acceptance:** `npm run db:gate:prove-red` → `PROVE-RED PASSED — N/N sabotages went RED on the expected FAIL line; control GREEN`, exit 0; `G1` green.
- **Depends on:** P1.8, P1.12. **Migration:** none. **Tenant data:** no.

### P1.15 CI + docs: gate steps in the workflow, commands in the constitution/README

- **Goal:** CI runs the data-spine gates on every push; §8 names the migrate commands.
- **Files:** `D:/projects/hygieia/.github/workflows/deploy.yml` (after `npm test`: `npm run db:check`, `npm run db:gate` (timeout 5 min),
  `npm run db:gate:prove-red` with `PROVE_RED_JOBS=4`, `npm run seed:check`; before `npm run build`), `D:/projects/hygieia/README.md`,
  `D:/projects/hygieia/.claude/CLAUDE.project.md` (§8: `migrate: npm run db:gate (rehearse) → npm run db:apply (dry-run) → npm run db:apply -- --apply (operator's go); never supabase db push`;
  §2 e2e line unchanged until P3.6), `D:/projects/hygieia/docs/ops/migrations.md` (the operator runbook: env names, dry-run, apply, what to paste in BUILD_LOG).
- **Approach:** CI step order from Themis BRAIN (`db:check` → `db:gate` → `prove-red` → `build`). After editing `CLAUDE.project.md`, recompose
  with the kit: `node D:/projects/zeus/.zeus/kit/kit.mjs compose hygieia --fleet-root D:/projects` (the lead confirms FLEET_ROOT) and run
  `bash D:/projects/zeus/.zeus/kit/verify-kit.sh D:/projects` — the composed `.claude/CLAUDE.md` is generated, never hand-edited.
- **Acceptance:** workflow YAML parses; a push to a branch shows the four new steps green in Actions; `verify-kit` PASS; `G1` green.
- **Depends on:** P1.14. **Migration:** none.

### P1.QA — QA & Validation (agent: qa)

- **QA exit gate (§9 P1: migrations apply on a FRESH db with zero errors; RLS isolation test passes; no orphaned FKs):**
  1. Fresh clone to a temp dir, `npm ci`, then `G1+` end-to-end green (`lint`, `typecheck`, `test`, `build`, `check:pwa`, `db:check`, `db:gate`, `seed:check`, `db:gate:prove-red`).
  2. `npm run db:gate` output contains, verbatim: `GATE PASSED`; `RLS is enabled on every hygieia table (13)`; for each of `fridge_lists`,
     `saved_plans`, `favourites`: `UB reads ZERO rows of A`, `UB's INSERT of a row of A is refused`, `UA reads all of A's rows`; for `profiles`:
     `UA's update of is_admin is refused`; for every content table: `anon reads exactly N approved rows`, `ADMIN's status update takes effect and is stamped`;
     `orphan scan: zero dangling references … FKs clean`; `zero objects in public/auth/supabase_migrations changed`; `no trigger on auth.users`;
     seed counts ≥ 160 / 8 / 40; `every seeded row id = md5(...)`.
  3. `npm run db:gate:prove-red` → `PROVE-RED PASSED`, every sabotage RED, control GREEN.
  4. `npm run db:apply` with env UNSET exits 2 and names `SUPABASE_ACCESS_TOKEN` and `HYGIEIA_SUPABASE_PROJECT_REF`; no network call (assert via the test's fake fetch count = 0).
  5. `npm run seed:check` exits 0; mutate one seed string, exits 1 naming the file; restore.
  6. `git grep -n "supabase db push\|supabase link\|supabase db reset"` in scripts/ and workflows returns nothing but prose in comments/docs.
  7. The dev app (`npm run dev`) still renders the P0 shell in both languages with 0 console errors (bundled source import does not break boot).
- **Depends on:** P1.1–P1.15.

### P1.REVIEW — Quality review (agent: reviewer)

- **Depends on:** P1.QA (VALIDATED). **Rubric:** CLAUDE.md §6 (every migration applied on a fresh DB; isolation covered; BUILD_LOG/DECISIONS/BRAIN updated — BRAIN §2 must now name the toolchain and §1.2/§1.6 decisions).

### CHECKPOINT P1 — surface summary to human, wait for gate approval

Summary in `BUILD_LOG.md`: gate counts, prove-red count, seed volumes, the §1 decisions. The human approves.

### OPERATOR-P1 (not crew tasks; after the P1 gate)

- **OP1.a** Export `SUPABASE_ACCESS_TOKEN` and `HYGIEIA_SUPABASE_PROJECT_REF=jenbakghoiaiwceyrshz` in the shell; run `npm run db:apply`
  (dry-run) → expect `DRY-RUN PASSED — 10 pending file(s)` (4 schema + 6 generated seed files; lead-corrected from 7 on 2026-10-06); then `npm run db:apply -- --apply` → `APPLY PASSED — 10 file(s) committed`.
  Paste both verdict lines into `BUILD_LOG.md`.
- **OP1.b** Supabase Dashboard → Project Settings → Data API → Exposed schemas: add `hygieia` (ADR-0003 rule 5; BRAIN §4 O1).
- **OP1.c** Verify read: `curl -H "apikey: <anon>" -H "Accept-Profile: hygieia" "<VITE_SUPABASE_URL>/rest/v1/recipes?select=slug&limit=1"` → `200 []`
  (everything is pending, so anon sees nothing — the expected observable).

---

## Phase P2: Auth & tenancy

Sign-in (magic link + Google) on the shared Auth, a Hygieia profile per user, session persistence, admin gating, and the
per-user data layer (saved plans, fridge lists, favourites) — disabled with a note in local-only mode.
**§9 "org/workspace" does not apply:** spec v0.2 has no organisations; the tenant is the user (`auth.uid()`). Stated here, not skipped silently.

### P2.1 Auth provider + session helpers

- **Goal:** one place that knows whether there is a session, who it is, and whether auth is available at all.
- **Files:** `D:/projects/hygieia/src/auth/AuthProvider.tsx`, `D:/projects/hygieia/src/auth/session.ts`, `D:/projects/hygieia/src/auth/AuthProvider.test.tsx`,
  `D:/projects/hygieia/src/auth/session.test.ts`, `D:/projects/hygieia/src/main.tsx` (wrap in `AuthProvider`), `D:/projects/hygieia/package.json`
  (no new deps expected; reserve the edit here for the phase).
- **Approach:** `AuthState = { status: 'unavailable' } | { status: 'loading' } | { status: 'anonymous' } | { status: 'signed-in'; user: { id, email } }`.
  `supabase === null` → `unavailable`. Subscribe `supabase.auth.onAuthStateChange`, seed from `getSession()`. Pure `reduceAuthEvent(prev, event, session)` tested.
  `persistSession: true` is already in `CLIENT_OPTIONS`; a test asserts it remains.
- **Acceptance:** `G1` green; tests: null client → `unavailable` without touching `window`; fake client emits `SIGNED_IN` → `signed-in` with id; `SIGNED_OUT` → `anonymous`;
  a bare `useAuth()` outside the provider throws (pin the message, the P0 `useLang` pattern).
- **Depends on:** P1.13. **Migration:** none. **Tenant data:** no.

### P2.2 Sign-in page + PKCE callback route ∥ D

- **Goal:** `/auth` (email magic link form + "Continue with Google") and `/auth/callback` (lands the PKCE code; redirects to the stored return path).
- **Files:** `D:/projects/hygieia/src/auth/SignInPage.tsx`, `D:/projects/hygieia/src/auth/CallbackPage.tsx`, `D:/projects/hygieia/src/auth/SignInPage.test.tsx`,
  `D:/projects/hygieia/src/routes/routes.tsx` (add routes), `D:/projects/hygieia/src/i18n/dictionary.ts` (keys: `signIn`, `signInEmailLabel`, `signInSendLink`,
  `signInLinkSent`, `signInGoogle`, `signInUnavailableTitle`, `signInUnavailableBody`, `signOut`, `callbackWorking`, `callbackFailed`).
- **Approach:** `signInWithOtp({ email, options: { emailRedirectTo: <origin>/hygieia/auth/callback } })`; `signInWithOAuth({ provider: 'google', options: { redirectTo: … } })`.
  Redirect URL built from `import.meta.env.BASE_URL` + `window.location.origin` (never hardcoded). In `unavailable` mode render the bilingual "Sign-in unavailable" state
  (Themis `deep-links.spec.ts` asserts this exact pattern). The callback page must not strip `?code=` (BRAIN §5: the `404.html` byte-copy keeps it).
- **Acceptance:** `G1` green; tests: form submits → fake `signInWithOtp` called with the email and a redirect ending `/auth/callback`; Google button calls `signInWithOAuth` with `provider: 'google'`;
  `unavailable` renders the unavailable copy in both languages; callback shows `callbackFailed` when the fake returns an error.
- **Depends on:** P2.1. **Migration:** none.

### P2.3 Profile bootstrap + `useProfile()` + admin runbook ∥ D

- **Goal:** first sign-in creates `hygieia.profiles` (self row); the app learns `isAdmin` from the DB, never from a hardcoded email.
- **Files:** `D:/projects/hygieia/src/auth/profile.ts`, `D:/projects/hygieia/src/auth/profile.test.ts`, `D:/projects/hygieia/docs/ops/admin.md`.
- **Approach:** on `signed-in`: `select user_id, display_name, is_admin from profiles where user_id = eq(uid)`; if none, `insert { user_id, display_name: email local-part }`
  (RLS self-insert; `is_admin` not sent — the column grant forbids it). `docs/ops/admin.md` documents the operator snippet (run via the SQL editor or the Management API, never a migration):
  `update hygieia.profiles set is_admin = true where user_id = (select id from auth.users where email = '<operator email>');` and the reverse.
- **Acceptance:** `G1` green; tests with a fake client: existing row → no insert; missing → exactly one insert payload WITHOUT `is_admin`; `isAdmin` true only when the row says so.
  `git grep -n "@gmail\|@.*\.com" src/` returns no operator email.
- **Depends on:** P2.1. **Migration:** none. **Tenant data:** yes (profiles; RLS proven P1.8).

### P2.4 `UserDataSource`: fridge lists, saved plans, favourites (supabase + disabled) ∥ D

- **Goal:** per-user persistence behind one interface; disabled-with-note when there is no backend or no session.
- **Files:** `D:/projects/hygieia/src/user/source.ts`, `D:/projects/hygieia/src/user/supabase.ts`, `D:/projects/hygieia/src/user/disabled.ts`,
  `D:/projects/hygieia/src/user/useUserData.ts`, `D:/projects/hygieia/src/user/source.test.ts`, `D:/projects/hygieia/src/components/SignedOutNote.tsx`,
  `D:/projects/hygieia/src/i18n/dictionary.ts` (keys `userDataUnavailableLocal`, `userDataSignInToSave`, `saved`, `remove`).
- **Approach:** `UserDataSource { kind: 'supabase' | 'disabled'; reason?: 'local-only' | 'signed-out'; fridgeLists: { list, save, remove }; favourites: { list, add, remove }; savedPlans: { list, save, remove } }`,
  `Result<T>` like P1.13. `useUserData()` picks `disabled('local-only')` when `supabase === null`, `disabled('signed-out')` when anonymous, else the supabase impl bound to the uid.
  `SignedOutNote` renders the matching bilingual note.
- **Acceptance:** `G1` green; tests: disabled impl returns `{ ok: false, error: 'disabled' }` for every write and `[]` for lists; supabase impl (fake client) never sends `user_id`
  (the DB default supplies it) and targets the three table names; the hook picks the right impl for the three states.
- **Depends on:** P2.1. **Migration:** none. **Tenant data:** yes (RLS proven P1.8).

### P2.5 Route guards, account menu, `/admin` placeholder

- **Goal:** client-side gating to match RLS; a visible way in and out.
- **Files:** `D:/projects/hygieia/src/auth/RequireAuth.tsx`, `D:/projects/hygieia/src/auth/RequireAdmin.tsx`, `D:/projects/hygieia/src/auth/guards.test.tsx`,
  `D:/projects/hygieia/src/components/AccountMenu.tsx`, `D:/projects/hygieia/src/App.tsx` (header: `AccountMenu` beside `LangSwitch`), `D:/projects/hygieia/src/routes/routes.tsx`
  (`/account` → RequireAuth, `/admin` → RequireAdmin → placeholder `AdminPage` saying "review tools arrive in P4" bilingually), `D:/projects/hygieia/src/i18n/dictionary.ts`.
- **Approach:** `RequireAuth` redirects anonymous to `/auth?next=<path>`; shows unavailable copy when `unavailable`. `RequireAdmin` additionally renders a bilingual 403 (`notAllowedTitle/Body`) when `!isAdmin`.
- **Acceptance:** `G1` green; tests: anonymous at `/account` → navigates to `/auth?next=%2Faccount`; signed-in non-admin at `/admin` → 403 copy; admin → placeholder; both languages.
- **Depends on:** P2.2, P2.3, P2.4. **Migration:** none.

### P2.6 Live read-only check `npm run db:live-check` (skips without env)

- **Goal:** a runnable proof that the LIVE project matches the archive and exposes `hygieia`, without credentials in the repo.
- **Files:** `D:/projects/hygieia/scripts/db-live-check.mjs`, `D:/projects/hygieia/scripts/db-live-check.test.ts`, `D:/projects/hygieia/package.json` (script; this is the phase's second package.json edit — sequential after P2.1).
- **Approach:** pattern `D:/projects/themis/e2e/support/run-live.mjs` (skip with a list of missing names, exit 0 = skipped not passed). Needs `SUPABASE_ACCESS_TOKEN`, `HYGIEIA_SUPABASE_PROJECT_REF`
  (ledger via `mgmt-api.mjs`: every archive version present with matching checksum, no extra) and `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (PostgREST: `GET /rest/v1/recipes?select=id&status=eq.pending`
  with `Accept-Profile: hygieia` → 200 and `[]`, proving anon cannot see pending rows live; `GET /rest/v1/profiles?select=user_id` → `[]`). Read-only; prints `LIVE-CHECK PASSED` or the first mismatch.
- **Acceptance:** without env: exits 0 printing `SKIPPED` and all four names; with env (operator machine): `LIVE-CHECK PASSED`. Tests cover the skip path and the mismatch path with a fake fetch. `G1` green.
- **Depends on:** P1.3. **Migration:** none.

### P2.QA — QA & Validation (agent: qa)

- **QA exit gate (§9 P2: cross-tenant leak test passes; session persists; role gating proven):**
  1. `G1+` green on a fresh clone.
  2. Cross-tenant: `npm run db:gate` lines for `fridge_lists`, `saved_plans`, `favourites`, `profiles` all PASS (as listed in P1.QA.2); `npx vitest run scripts/db-isolation.test.ts` green.
  3. Session persists: unit test proves `CLIENT_OPTIONS.auth.persistSession === true` and `AuthProvider` restores `signed-in` from a fake `getSession()` before any event; in the built app
     (`npm run build && npm run preview` with VITE_SUPABASE_* set on the QA machine) sign in once via magic link, reload → still signed in (observable recorded with the URL and timestamp).
  4. Role gating proven: gate lines `UA's update of status has no effect` and `ADMIN's status update takes effect and is stamped`; guards tests (P2.5) green; live: with the operator's admin flag
     set (OP2.b), `/admin` renders for the operator and the 403 for a second test account.
  5. `npm run db:live-check` → `LIVE-CHECK PASSED` on the operator machine (recorded), `SKIPPED` listing names on a machine without env.
  6. Both sign-in methods exercised live once (magic link, Google) with the observable recorded (redirect lands on `/hygieia/auth/callback`, session appears, 0 console errors).
  7. `git grep` for any email literal, `service_role`, `sbp_` in `src/` and `dist/` returns nothing.
- **Depends on:** P2.1–P2.6 and OPERATOR-P2 (for items 3b, 4, 5, 6).

### P2.REVIEW — Quality review (agent: reviewer)

- **Depends on:** P2.QA (VALIDATED). **Rubric:** CLAUDE.md §6.

### CHECKPOINT P2 — surface summary to human, wait for gate approval

### OPERATOR-P2 (dashboard/console steps; required before P2.QA items 3–6)

- **OP2.a** Google OAuth: Google Cloud Console → OAuth client (web) with authorised redirect `https://jenbakghoiaiwceyrshz.supabase.co/auth/v1/callback`;
  Supabase Dashboard → Authentication → Providers → Google: client id + secret. Authentication → URL Configuration → Redirect URLs: ADD
  `https://intotheveil.github.io/hygieia/auth/callback` and `http://localhost:5173/hygieia/auth/callback` (keep Alyssos's entries; ADR-0003 rule 6).
- **OP2.b** Run the `docs/ops/admin.md` snippet for the operator's account (the account must have signed in once so the profile row exists).
- **OP2.c** Set GitHub Actions repository **variables** `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (the anon key is public by design; still never in a tracked file). The build step reads them in P6.4; until then the deploy stays local-only.

---

## Phase P3: Core slice — Recipes by diet tag + "What's in my fridge" (FROM SPEC §3 M3/M3b)

Browse and filter recipes by diet, open a recipe, and get recipes ranked by what you have, with missing ingredients and
substitutions — on the bundled seed, EL/EN, with the draft ribbon, e2e-covered on the production build.

### P3.1 Recipes list `/recipes` with diet-tag filter and title search ∥ E

- **Files:** `D:/projects/hygieia/src/recipes/RecipesPage.tsx`, `D:/projects/hygieia/src/recipes/RecipeCard.tsx`, `D:/projects/hygieia/src/recipes/filter.ts`,
  `D:/projects/hygieia/src/recipes/filter.test.ts`, `D:/projects/hygieia/src/recipes/RecipesPage.test.tsx`, `D:/projects/hygieia/src/i18n/dictionary.ts` (keys: `recipesTitle`, `filterByDiet`, `searchRecipes`,
  `noRecipesMatch`, `clearFilters`, `portions`, `minutes`, `loading`, `loadFailed`, `retry`).
- **Approach:** pure `filterRecipes(recipes, { dietSlugs: string[], query: string, lang })` — any-of on diets, case/accents-insensitive title match (`normalize('NFD')` strip diacritics,
  so "σαλατα" finds "σαλάτα"); URL state `?diet=a,b&q=` via `useSearchParams`. Loading / error / empty states from day one (P5 hardens). Uses `contentSource` from P1.13.
- **Acceptance:** `G1` green; `filter.test.ts`: any-of semantics, accent-insensitive Greek and English, empty query returns all; page test: renders ≥ 40 cards, selecting `keto` leaves only keto-tagged,
  URL reflects state, empty state copy in both languages, ribbon visible in bundled mode.
- **Depends on:** P1.13, P2.5 (header). **Tenant data:** no.

### P3.2 Recipe detail `/recipes/:slug` ∥ E

- **Files:** `D:/projects/hygieia/src/recipes/RecipePage.tsx`, `D:/projects/hygieia/src/recipes/RecipePage.test.tsx`, `D:/projects/hygieia/src/recipes/format.ts` (quantity/unit formatting EL/EN),
  `D:/projects/hygieia/src/recipes/format.test.ts`, `D:/projects/hygieia/src/i18n/dictionary.ts` (keys: `ingredients`, `steps`, `dietTags`, `units.*` per `Unit`, `addToFavourites`).
- **Approach:** localized title/steps; ingredient lines resolve names in the current language; diet chips link to `/diets/:slug` (page arrives P4.4 — until then chips link to `/recipes?diet=`);
  favourite button via `useUserData()` (disabled note in local-only); unknown slug → `NotFound`.
- **Acceptance:** `G1` green; tests: renders `greek-salad` (or any seeded slug) with all lines in both languages; unit labels come from the dictionary; unknown slug renders the not-found copy;
  favourite click in local-only shows `userDataUnavailableLocal`.
- **Depends on:** P1.13, P2.4. **Tenant data:** favourites (through P2.4).

### P3.3 Fridge matcher — pure domain ∥ E

- **Files:** `D:/projects/hygieia/src/fridge/match.ts`, `D:/projects/hygieia/src/fridge/match.test.ts`.
- **Approach:** `matchRecipes(recipes, ingredients, haveSlugs: Set<string>, opts: { ignorePantryStaples: boolean })` → ranked `{ recipe, have, missing: Ingredient[], coverage: number,
substitutions: Array<{ missing: Ingredient; use: Ingredient }> }[]`; a missing ingredient counts as covered-by-substitute when one of its `substitute_slugs` is in `haveSlugs`
  (shown separately, not silently). Rank: coverage desc, then fewer missing, then fewer lines, then title. Recipes with coverage 0 are dropped. Pantry staples excluded from the denominator when `ignorePantryStaples`.
- **Acceptance:** `G1` green; tests: full coverage ranks first; tie broken by fewer missing; substitute counted and reported; empty fridge → `[]`; unknown slug ignored; staples toggle changes coverage as expected; deterministic order.
- **Depends on:** P1.4, P1.9–P1.11.

### P3.4 Fridge UI `/fridge`

- **Files:** `D:/projects/hygieia/src/fridge/FridgePage.tsx`, `D:/projects/hygieia/src/fridge/IngredientPicker.tsx`, `D:/projects/hygieia/src/fridge/storage.ts` (`hygieia.fridge` localStorage, pure parse/serialize),
  `D:/projects/hygieia/src/fridge/FridgePage.test.tsx`, `D:/projects/hygieia/src/fridge/storage.test.ts`, `D:/projects/hygieia/src/i18n/dictionary.ts` (keys: `fridgeTitle`, `fridgeIntro`, `addIngredient`,
  `yourIngredients`, `ignoreStaples`, `youHave`, `missing`, `substitute`, `fridgeEmpty`, `saveList`, `savedLists`).
- **Approach:** typeahead over both-language names (accent-insensitive), chips with remove, staples toggle, results from P3.3 with "you have 5/6 · missing: feta → use ricotta"; selection persisted locally;
  "Save list" through `useUserData().fridgeLists` (disabled note otherwise).
- **Acceptance:** `G1` green; tests: typing `ντομ` offers `Ντομάτα`; adding 3 ingredients produces ranked results with a missing list; reload restores chips (storage mocked); empty state copy; both languages.
- **Depends on:** P3.3, P2.4.

### P3.5 Navigation + home wiring for live modules

- **Files:** `D:/projects/hygieia/src/App.tsx` (module cards become `<Link>`s for `recipes` (→ `/recipes`, secondary → `/fridge`); status box text updated; "Coming" badge only on modules without a route),
  `D:/projects/hygieia/src/components/SiteHeader.tsx` (extracted header with nav: Recipes · Fridge · [Diets · Workouts · Tips arrive P4] · language · account), `D:/projects/hygieia/src/routes/routes.tsx`,
  `D:/projects/hygieia/src/App.test.tsx`, `D:/projects/hygieia/src/i18n/dictionary.ts` (`nav.*`, `statusBody` rewritten honestly: "Recipes and the fridge are live as drafts; the rest is coming").
- **Acceptance:** `G1` green; App test: recipes card links to `/recipes`, other cards still show `roadmap`; header nav present on every route; both languages.
- **Depends on:** P3.1, P3.2, P3.4.

### P3.6 Playwright harness on the PRODUCTION build with Pages semantics (lift Themis)

- **Files:** `D:/projects/hygieia/playwright.config.ts`, `D:/projects/hygieia/e2e/support/pages-server.mjs`, `D:/projects/hygieia/e2e/support/fixtures.ts`, `D:/projects/hygieia/e2e/support/tsconfig.json`,
  `D:/projects/hygieia/e2e/local/smoke.spec.ts`, `D:/projects/hygieia/package.json` (`"e2e": "tsc -p e2e/support/tsconfig.json && playwright test --project=local"`, devDep `@playwright/test`),
  `D:/projects/hygieia/.github/workflows/deploy.yml` (`npx playwright install --with-deps chromium` cached; `E2E_PREBUILT=1 npm run e2e` after `check:pwa`), `D:/projects/hygieia/.gitignore` (`playwright-report/`, `test-results/`),
  `D:/projects/hygieia/.claude/CLAUDE.project.md` §2/§8 (`e2e: npm run e2e`) + kit recompose as in P1.15.
- **Approach:** lift `D:/projects/themis/playwright.config.ts` (drop the `live` project for now), `D:/projects/themis/e2e/support/pages-server.mjs` verbatim, `fixtures.ts` verbatim (console watchdog with the
  document-404 filter), `tsconfig.json` verbatim. **Base path:** the site lives under `/hygieia/`, so `baseURL = http://127.0.0.1:4173/hygieia/` and the server root must serve `dist/` AT `/hygieia/` — add a
  `--base /hygieia` option to pages-server (strip the prefix, else 404) so deep links behave exactly as Pages. Web server env blanks `VITE_SUPABASE_URL`/`ANON_KEY` so the build is bundled-mode.
  `smoke.spec.ts`: `/` renders the Greek hero; language toggle switches to English; `/no/such/page` is a 404 document that renders the in-app not-found (Themis `deep-links.spec.ts` pattern — assert the rendered app, never `response.ok()`).
- **Acceptance:** `npm run e2e` → 3/3 passed with 0 console errors; a deliberately deleted `dist/404.html` makes the deep-link spec fail (restore); CI job green with the e2e step; `G3` green.
- **Depends on:** P3.5 (the header the smoke asserts).

### P3.7 e2e: recipes + fridge workflow, both languages

- **Files:** `D:/projects/hygieia/e2e/local/recipes.spec.ts`, `D:/projects/hygieia/e2e/local/fridge.spec.ts`.
- **Approach:** recipes: open `/hygieia/recipes`, filter `keto`, open a card, see steps and ribbon, deep-load `/hygieia/recipes/<slug>` (404 document renders the recipe), unknown slug → not-found. Fridge: add 3
  ingredients, assert ranked results with a missing list and a substitution line, toggle staples changes a coverage figure, reload keeps chips, switch to English and re-assert the headings.
  Edge case: empty fridge shows the empty copy; a query with no match shows `noRecipesMatch`.
- **Acceptance:** `npm run e2e` all passed, 0 console errors; `G3` green.
- **Depends on:** P3.6.

### P3.QA — QA & Validation (agent: qa)

- **QA exit gate (§9 P3: happy path + edge case tested; e2e covers the workflow; no console errors):**
  1. Fresh clone: `G3` + `npm run db:gate:prove-red` green.
  2. `npm run e2e` passes every spec in `e2e/local/` with the console watchdog (0 console/page errors); the report lists recipes happy path, recipes edge (unknown slug, no match), fridge happy path, fridge edge (empty, staples toggle), deep links, both languages.
  3. Manual on the built artifact (`npm run build` then `node e2e/support/pages-server.mjs --base /hygieia`): the draft ribbon appears on every content page in both languages; the ribbon text is from the dictionary (grep).
  4. `npx vitest run src/fridge src/recipes` green; coverage of `match.ts` and `filter.ts` statements ≥ 90 % (`vitest run --coverage` for those files).
  5. Lighthouse not yet required (P5) — but `npm run check:pwa` still green and `dist/404.html` byte-equals `dist/index.html` (`cmp`).
- **Depends on:** P3.1–P3.7.

### P3.REVIEW — Quality review (agent: reviewer)

- **Depends on:** P3.QA (VALIDATED). **Rubric:** CLAUDE.md §6.

### CHECKPOINT P3 — surface summary to human, wait for gate approval

Also ask the human: deploy now? The site would show recipes/fridge as drafts (bundled) — honest, and the Pages deploy is already wired.

---

## Phase P4: Feature breadth (FROM SPEC §3: M2 diets + plans, M5 calories, M4 cost, M6 workouts, M1 tips, admin review)

Every remaining module on the P3 pattern (pure domain module + page + tests + e2e), plus the admin page that turns `pending` into `approved`.

### P4.1 Nutrition engine (kcal + macros per recipe and per portion) ∥ F

- **Files:** `D:/projects/hygieia/src/nutrition/compute.ts`, `D:/projects/hygieia/src/nutrition/compute.test.ts`.
- **Approach:** grams per line = `quantity × grams_per_unit(ingredient, unit)` (unit `g`/`ml` → 1; others → the ingredient's `grams_per_unit`); totals = Σ grams/100 × per-100g values; per portion = total / portions;
  rounding only at display. Returns also `confidence: 'typical'` and the `source_note` set for the footnote.
- **Acceptance:** `G3` green; tests: a hand-computed 2-ingredient recipe matches to 0.1 kcal; per-portion division; a `piece` unit uses `grams_per_unit`; zero-portion guard (never divides by 0: portions ≥ 1 by type).
- **Depends on:** P1.4, P1.9.

### P4.2 Cost engine (EUR range per recipe and per portion, as-of) ∥ F

- **Files:** `D:/projects/hygieia/src/cost/compute.ts`, `D:/projects/hygieia/src/cost/compute.test.ts`.
- **Approach:** line cost min/max = grams (or pieces) converted to the ingredient's `price_per` basis × `price_eur_min/max`; recipe range = Σ; `asOf` = the OLDEST `price_as_of` among used ingredients (the honest date);
  lines with no price are listed as `unpriced` and excluded from the range (shown in the UI).
- **Acceptance:** `G3` green; tests: known 3-line recipe gives the expected min/max; `asOf` is the oldest; unpriced line reported, not silently zero; per-portion division.
- **Depends on:** P1.4, P1.9.

### P4.3 Recipe page: nutrition + cost panels

- **Files:** `D:/projects/hygieia/src/recipes/RecipePage.tsx`, `D:/projects/hygieia/src/recipes/NutritionPanel.tsx`, `D:/projects/hygieia/src/recipes/CostPanel.tsx`, tests for both panels,
  `D:/projects/hygieia/src/i18n/dictionary.ts` (`kcal`, `protein`, `carbs`, `fat`, `perPortion`, `perRecipe`, `typicalValuesNote`, `costRange`, `pricesAsOf`, `unpriced`).
- **Acceptance:** `G3` green; tests: panels show per-portion by default and toggle to per-recipe; footnote names USDA FDC typical values; cost shows `€a–€b` and the as-of date localised (`el-GR`/`en-GB`); `e2e/local/recipes.spec.ts` extended with the two panels.
- **Depends on:** P4.1, P4.2, P3.2.

### P4.4 Diets pages `/diets`, `/diets/:slug` ∥ G

- **Files:** `D:/projects/hygieia/src/diets/DietsPage.tsx`, `D:/projects/hygieia/src/diets/DietPage.tsx`, `D:/projects/hygieia/src/diets/DietsPage.test.tsx`, `D:/projects/hygieia/src/routes/routes.tsx`,
  `D:/projects/hygieia/src/components/SiteHeader.tsx` (nav item), `D:/projects/hygieia/src/i18n/dictionary.ts` (`dietsTitle`, `whatItIs`, `allowed`, `avoided`, `pros`, `cons`, `whoShouldAvoid`, `recipesForDiet`, `source`).
- **Approach:** list of 16 cards (the seed shipped 16 diets, operator: "as many as you can"); detail with the five sections, the medical disclaimer, and the recipes tagged with the diet (reuse `RecipeCard`). Diet chips on recipes now link here.
- **Acceptance:** `G3` green; tests: 16 cards; detail renders all sections in both languages; `avoid_if` list present; recipes list non-empty for every seeded diet.
- **Depends on:** P1.13, P3.1.

### P4.5 Weekly meal-plan generator — pure domain ∥ F

- **Files:** `D:/projects/hygieia/src/plans/generate.ts`, `D:/projects/hygieia/src/plans/generate.test.ts`.
- **Approach:** `generateWeekPlan(dietSlug, recipes, { seed: number, days: 7 })` → 7 × {breakfast, lunch, dinner} from the diet's APPROVED (or, bundled, all) recipes by `meal_types`; seeded PRNG (mulberry32)
  for determinism; avoid repeating a recipe within 3 days when the pool allows; `dailyTotals` via P4.1; `shoppingList` aggregated by ingredient (quantities summed per unit). Returns `warnings` when a slot could not be filled.
- **Acceptance:** `G3` green; tests: same seed → same plan; every slot filled for every seeded diet (P1.11 coverage guarantee); no repeat within 3 days when pool ≥ 4; shopping list sums quantities; a diet with no breakfast recipes yields a warning, not a throw.
- **Depends on:** P1.11, P4.1.

### P4.6 Meal-plan UI on the diet page + save plan

- **Files:** `D:/projects/hygieia/src/plans/PlanView.tsx`, `D:/projects/hygieia/src/plans/PlanView.test.tsx`, `D:/projects/hygieia/src/diets/DietPage.tsx` ("Generate a weekly plan" → `PlanView`), `D:/projects/hygieia/src/account/AccountPage.tsx`
  (saved plans + saved fridge lists + favourites tabs), `D:/projects/hygieia/src/i18n/dictionary.ts` (`generatePlan`, `reshuffle`, `dayNames.*`, `mealNames.*`, `shoppingList`, `savePlan`, `savedPlans`, `dailyTotal`).
- **Acceptance:** `G3` green; tests: generate shows 21 slots and a shopping list; reshuffle changes the seed; save → `savedPlans.save` called with `{ diet_id|slug, week_start, plan }` or disabled note; account page lists saved items from a fake source.
- **Depends on:** P4.5, P4.4, P2.4, P2.5.

### P4.7 Seed content: exercises (~60, EL+EN) ∥ G

- **Files:** `D:/projects/hygieia/src/content/seed/exercises.ts`, `D:/projects/hygieia/src/content/seed/exercises.test.ts`.
- **Approach:** ≥ 60 exercises across all 7 `workout_type`s and 3 levels (≥ 6 per type; each type has ≥ 1 per level), with coaching cue EL/EN, muscle groups, equipment (null for bodyweight/home where true). Content drafting rule (§0).
- **Acceptance:** `G3` green; test: count ≥ 60; unique slugs; every type × level cell non-empty; locale pairs non-blank.
- **Depends on:** P1.4.

### P4.8 Workout templates (63 = 7 × 3 × 3) + session generator + `/workouts` page

- **Files:** `D:/projects/hygieia/src/content/seed/workouts.ts`, `D:/projects/hygieia/src/content/seed/workouts.test.ts`, `D:/projects/hygieia/src/workouts/session.ts`, `D:/projects/hygieia/src/workouts/session.test.ts`,
  `D:/projects/hygieia/src/workouts/WorkoutsPage.tsx`, `D:/projects/hygieia/src/workouts/WorkoutsPage.test.tsx`, `D:/projects/hygieia/src/routes/routes.tsx`, `D:/projects/hygieia/src/components/SiteHeader.tsx`,
  `D:/projects/hygieia/scripts/gen-seed-sql.mjs` (add kinds `exercises`, `workout_templates`), `D:/projects/hygieia/supabase/migrations/20261006000800_hygieia_seed_exercises.sql`, `…000900_hygieia_seed_workouts.sql`,
  `D:/projects/hygieia/scripts/db-gate/catalogue.mjs` (counts), `D:/projects/hygieia/src/i18n/dictionary.ts` (`workoutsTitle`, `pickType`, `pickLevel`, `pickIntensity`, `types.*`, `levels.*`, `intensities.*`, `warmup`, `main`, `cooldown`, `sets`, `reps`, `seconds`, `rest`).
- **Approach:** `WORKOUT_TEMPLATES` = exactly 63 rows (one per type × level × intensity) with blocks of exercise slugs from P4.7 (sets/reps-or-seconds/rest scaled by intensity: low/moderate/high); an authoring helper may draft them but the
  committed data is the truth (admin-editable later). `resolveSession(templates, exercises, type, level, intensity)` → ordered blocks with resolved exercises; UI = three selectors → session card with the disclaimer. Seeds generated by `seed:gen`.
- **Acceptance:** `G3` green; tests: exactly 63 templates, unique `(type, level, intensity)`, every exercise slug resolves, each template has warmup+main+cooldown; `resolveSession` finds every one of the 63 combinations; page renders a session for a selection in both languages;
  `npm run seed:check` 0; `npm run db:gate` PASS with `exercises ≥ 60`, `workout_templates = 63`, md5-id checks; `e2e/local/workouts.spec.ts` added (select → session visible).
- **Depends on:** P4.7, P1.12, P1.13.

### P4.9 Health tips (~30, EL+EN, sourced) + `/tips` page ∥ G

- **Files:** `D:/projects/hygieia/src/content/seed/tips.ts`, `D:/projects/hygieia/src/content/seed/tips.test.ts`, `D:/projects/hygieia/src/tips/TipsPage.tsx`, `D:/projects/hygieia/src/tips/TipsPage.test.tsx`,
  `D:/projects/hygieia/src/routes/routes.tsx`, `D:/projects/hygieia/src/components/SiteHeader.tsx`, `D:/projects/hygieia/scripts/gen-seed-sql.mjs` (kind `health_tips`), `D:/projects/hygieia/supabase/migrations/20261006001000_hygieia_seed_tips.sql`,
  `D:/projects/hygieia/scripts/db-gate/catalogue.mjs`, `D:/projects/hygieia/src/i18n/dictionary.ts` (`tipsTitle`, `topics.*`, `sourcePending`, `readSource`).
- **Approach:** ≥ 30 tips across the 6 topics (≥ 4 each); `source_url` ONLY when real (WHO, EFSA, NHS, CDC pages the drafter has actually seen); otherwise null + `needs_source = true`, rendered as "Source pending review". Content drafting rule (§0) — the one that matters most here.
- **Acceptance:** `G3` green; tests: count ≥ 30; each topic ≥ 4; `source_url` null or `https?://` and never a made-up domain pattern (`example.com`, `placeholder`); `needs_source` ⇔ `source_url === null`; page groups by topic, both languages; `seed:check` 0; gate PASS with `health_tips ≥ 30`; `e2e/local/tips.spec.ts`.
- **Depends on:** P1.12, P1.13.
- **Note (ordering):** P4.8 and P4.9 both edit `gen-seed-sql.mjs`, `catalogue.mjs`, `routes.tsx`, `SiteHeader.tsx` → sequential (P4.8 then P4.9), each ∥ with the F-group.

### P4.10 Admin review page `/admin` (pending list · side-by-side EL/EN · approve / edit / reject)

- **Files:** `D:/projects/hygieia/src/admin/AdminPage.tsx`, `D:/projects/hygieia/src/admin/PendingList.tsx`, `D:/projects/hygieia/src/admin/ReviewForm.tsx`, `D:/projects/hygieia/src/admin/adminSource.ts`, `D:/projects/hygieia/src/admin/adminSource.test.ts`,
  `D:/projects/hygieia/src/admin/AdminPage.test.tsx`, `D:/projects/hygieia/src/i18n/dictionary.ts` (`adminTitle`, `pending`, `approved`, `rejected`, `approve`, `reject`, `saveChanges`, `kinds.*`, `reviewedBy`, `adminUnavailable`).
- **Approach:** `AdminContentSource` (supabase only; reads ALL statuses — RLS lets an admin) with `update(table, id, patch)` and `setStatus(table, id, status)`; per kind a tab with the pending count; the form shows every `*_el` field beside its `*_en`
  twin, arrays as line-editors; approve/reject = status update (the DB trigger stamps reviewer/time); in local-only or non-admin → `adminUnavailable` / 403 (P2.5 guard). Nothing here may INSERT or DELETE (no grant exists; the UI offers neither).
- **Acceptance:** `G3` green; tests (fake client): pending list queries `status = pending` per table; approve sends `{ status: 'approved' }` only; edit sends only changed columns and never `id`/`slug`/`reviewed_*`; both-language fields rendered side by side; 403 for non-admin; unavailable in local-only.
  Live (operator machine, after OP1/OP2): approve one recipe → `npm run db:live-check` extended to assert `recipes?status=eq.approved` count ≥ 1 and the deployed site in configured mode shows it WITHOUT the ribbon (recorded).
- **Depends on:** P2.5, P1.13, P4.4–P4.9 (all kinds exist).

### P4.11 Admin: price table editor (ingredient prices + as-of)

- **Files:** `D:/projects/hygieia/src/admin/PriceTable.tsx`, `D:/projects/hygieia/src/admin/PriceTable.test.tsx`, `D:/projects/hygieia/src/admin/AdminPage.tsx` (tab), `D:/projects/hygieia/src/i18n/dictionary.ts` (`prices`, `priceMin`, `priceMax`, `pricePer`, `asOf`, `priceNote`).
- **Approach:** table of ingredients with inline-editable `price_eur_min/max/per/as_of/note`; validation min ≤ max; one row saved at a time through `AdminContentSource.update`.
- **Acceptance:** `G3` green; tests: edit + save sends only price columns; min > max blocked with a bilingual message; sorts by name in the current language.
- **Depends on:** P4.10.

### P4.12 e2e breadth specs ∥ H (each spec file disjoint)

- **Files:** `D:/projects/hygieia/e2e/local/diets.spec.ts` (list → detail → generate plan → 21 slots → shopping list; both languages), `D:/projects/hygieia/e2e/local/recipe-panels.spec.ts` (nutrition + cost visible, per-portion toggle),
  `D:/projects/hygieia/e2e/local/workouts.spec.ts` and `tips.spec.ts` (if not already added in P4.8/P4.9, extend), `D:/projects/hygieia/e2e/local/admin-local-only.spec.ts` (`/admin` deep link renders the unavailable copy; `/account` redirects to `/auth`).
- **Acceptance:** `npm run e2e` all passed, 0 console errors; `G3` green.
- **Depends on:** P4.3, P4.6, P4.8, P4.9, P4.10.

### P4.QA — QA & Validation (agent: qa)

- **QA exit gate (§9 P4: each feature tested + isolation-checked; regression suite still green):**
  1. Fresh clone: `G3` + `npm run db:gate:prove-red` green; `npm run e2e` lists specs for recipes, fridge, diets+plan, recipe panels, workouts, tips, admin-local-only — all passed, 0 console errors.
  2. Isolation re-check: `npm run db:gate` still `GATE PASSED` with the new seed tables counted (`exercises ≥ 60`, `workout_templates = 63`, `health_tips ≥ 30`), every child table's "children of pending parents are invisible to anon" line PASS, and all P1.QA.2 lines unchanged.
  3. Content rule audit: `node -e` script (qa writes it in the scratchpad, not the repo) listing every `source_url` in `src/content/seed/**` — qa opens a random sample of 5 and confirms they resolve (HTTP 200) and are on-topic; every tip with null URL has `needs_source = true`; every ingredient `source_note` names USDA FDC typical values.
  4. Nutrition sanity: for 5 random recipes, per-portion kcal is within 150–1200 and macros sum (×4/4/9) within 15 % of kcal (a unit-mix bug would break this).
  5. Admin live (operator machine): approve 1 recipe + 1 tip; `db:live-check` extended assertion passes; the configured-mode build shows them without ribbon; a non-admin test account gets the 403 (recorded with timestamps).
  6. Regression: `npm test` count ≥ P3 count + the new suites; nothing skipped (`grep -rn "\.skip(" src e2e scripts` empty).
- **Depends on:** P4.1–P4.12 and the operator's admin flag (OP2.b).

### P4.REVIEW — Quality review (agent: reviewer)

- **Depends on:** P4.QA (VALIDATED). **Rubric:** CLAUDE.md §6.

### CHECKPOINT P4 — surface summary to human, wait for gate approval

### OPERATOR-P4

- **OP4.a** `npm run db:apply` dry-run → `--apply` for the 3 new seed migrations (`…000800`, `…000900`, `…001000`); paste verdicts into `BUILD_LOG.md`.
- **OP4.b** Review content in `/admin` (the real work this phase unlocks): approve what should ship.

---

## Phase P5: Hardening

Error / loading / empty states exercised against the production build (including a dead-backend build), axe a11y pass on every route in both languages, offline behaviour of the PWA, Lighthouse mobile thresholds.

### P5.1 Error, loading and empty states — exercised, not just written

- **Files:** `D:/projects/hygieia/src/components/AsyncState.tsx` (shared Loading / ErrorState(retry) / EmptyState), tests, every page in `src/recipes`, `src/fridge`, `src/diets`, `src/workouts`, `src/tips`, `src/admin`, `src/account` adopting it;
  `D:/projects/hygieia/playwright.config.ts` (second local project `dead-backend`: `webServer` array — a second build to `dist-dead/` with `VITE_SUPABASE_URL=http://127.0.0.1:9/` and a dummy anon key, served on port 4174 with `--base /hygieia`),
  `D:/projects/hygieia/e2e/dead-backend/error-states.spec.ts`, `D:/projects/hygieia/package.json` (`build:dead`, `e2e` runs both projects), `D:/projects/hygieia/.gitignore` (`dist-dead/`).
- **Approach:** the `configured`-but-unreachable build makes the supabase `ContentSource` fail for real on the production artifact → every list/detail page must show the bilingual error state with a working Retry and no console error other than the
  expected failed fetch (filter it in a dead-backend fixture variant, by URL = the dead host only). Empty states: `/recipes?diet=keto&q=zzzz`, an empty fridge, a diet with no plan slot (synthetic). Loading: a slow-source unit test asserts the skeleton renders first.
- **Acceptance:** `npm run e2e` runs both projects; `error-states.spec.ts` proves error copy + retry on recipes, diets, workouts, tips; unit tests prove loading and empty for every page; `G3` green.
- **Depends on:** P4 complete.

### P5.2 a11y: axe on every route × both languages + fixes ∥ I

- **Files:** `D:/projects/hygieia/e2e/local/a11y-matrix.spec.ts`, `D:/projects/hygieia/e2e/support/routes.ts` (the route list with a representative slug each), `D:/projects/hygieia/package.json` (devDep `@axe-core/playwright`), fixes wherever found
  (labels, focus order, contrast of the ribbon and chips, `aria-live` on results, `lang` attribute follows the switch — already set by `LangProvider`).
- **Acceptance:** the matrix spec visits every route in `el` and `en`, runs `AxeBuilder` with tags `wcag2a, wcag2aa`, asserts 0 `serious`/`critical` violations, asserts `<html lang>` equals the chosen language and the H1 text equals the dictionary value for that language; `npm run e2e` green; `G3` green.
- **Depends on:** P5.1 (shared states must be accessible too).

### P5.3 Lighthouse mobile gate `npm run check:lighthouse` ∥ I

- **Files:** `D:/projects/hygieia/scripts/check-lighthouse.mjs`, `D:/projects/hygieia/package.json` (devDep `lighthouse`; script), `D:/projects/hygieia/.github/workflows/deploy.yml` (step after e2e; artifact upload of the HTML report).
- **Approach:** start `pages-server --base /hygieia`, run Lighthouse (mobile preset, Chrome from Playwright's chromium) on `/hygieia/`, `/hygieia/recipes`, `/hygieia/fridge`, `/hygieia/diets`, `/hygieia/workouts`; thresholds performance ≥ 90, accessibility ≥ 90, best-practices ≥ 90; print the four scores per URL; exit 1 below threshold. Fix what fails (image `srcSet`/`loading="lazy"`, font `display=swap`, code-split routes with `React.lazy` if the main chunk exceeds ~200 kB gzip).
- **Acceptance:** `npm run check:lighthouse` passes locally and in CI (CI may apply a −5 tolerance on performance only, documented in the script header); scores recorded in `BUILD_LOG.md`.
- **Depends on:** P4 complete.

### P5.4 Offline / PWA behaviour e2e ∥ I

- **Files:** `D:/projects/hygieia/e2e/local/offline.spec.ts`.
- **Approach:** load `/hygieia/`, wait for the SW to control the page, `context.setOffline(true)`, navigate client-side to `/hygieia/recipes` and hard-load `/hygieia/diets` → both render (precache + `navigateFallback`); bundled content works offline by construction.
- **Acceptance:** spec passes; `npm run e2e` green.
- **Depends on:** P3.6.

### P5.5 Bilingual completeness sweep + copy review

- **Files:** `D:/projects/hygieia/src/i18n/dictionary.test.ts` (extend: no `en` value equals its `el` twin except an allow-list of brand/loanwords; no value contains `TODO`/`???`), `D:/projects/hygieia/src/content/seed/*.test.ts` (same rule for seeds), any copy fixes.
- **Acceptance:** `npm test` green with the extended assertions; the a11y matrix (P5.2) H1 assertions prove every route renders the right language.
- **Depends on:** P5.2.

### P5.QA — QA & Validation (agent: qa)

- **QA exit gate (§9 P5: full e2e green; a11y pass; error states exercised, not just written):**
  1. Fresh clone: `G3` + `npm run db:gate:prove-red` + `npm run check:lighthouse` green.
  2. `npm run e2e` runs the `local` AND `dead-backend` projects; the report shows `error-states.spec.ts` passing with the error copy asserted on ≥ 4 pages and Retry exercised; `a11y-matrix.spec.ts` covers every route × 2 languages with 0 serious/critical; `offline.spec.ts` passes.
  3. qa manually kills the network mid-session in the preview (DevTools offline) on `/hygieia/fridge` and records that results still compute (bundled) and no unhandled rejection appears in the console.
  4. Lighthouse scores per URL pasted into `BUILD_LOG.md`, all ≥ 90 mobile (performance, accessibility, best-practices).
  5. `grep -rn "\.skip(\|test\.fixme" e2e src` empty; `npm test` count ≥ P4 count.
- **Depends on:** P5.1–P5.5.

### P5.REVIEW — Quality review (agent: reviewer)

- **Depends on:** P5.QA (VALIDATED). **Rubric:** CLAUDE.md §6.

### CHECKPOINT P5 — surface summary to human, wait for gate approval

---

## Phase P6: Deploy

The site already deploys from `main` as an installable PWA (ADR-0004). P6 = production env wiring (configured mode on Pages), fleet telemetry, bundle secret scan, a live smoke against the deployed URL and the real backing service, clean-checkout proof.

### P6.1 Fleet telemetry behind `VITE_FLEET_*` (no-op without env) ∥ J

- **Files:** `D:/projects/hygieia/src/lib/telemetry/fleet-telemetry.ts`, `D:/projects/hygieia/src/lib/telemetry/fleet-telemetry-server.ts`, `D:/projects/hygieia/src/lib/telemetry/rate-limit.ts`, `D:/projects/hygieia/src/lib/telemetry/types.ts`,
  `D:/projects/hygieia/src/telemetry.ts`, `D:/projects/hygieia/src/telemetry.test.ts`, `D:/projects/hygieia/src/main.tsx` (`startTelemetry()` first), `D:/projects/hygieia/src/lib/env.ts` (declare the three `VITE_FLEET_*` names in `ImportMetaEnv`; read them by full literal name — the lint allow-list already permits `VITE_FLEET_*`).
- **Approach:** lift `D:/projects/enodia-transit/src/lib/telemetry/{fleet-telemetry.ts,fleet-telemetry-server.ts,rate-limit.ts,types.ts}` verbatim and `D:/projects/enodia-transit/src/telemetry.ts` with the env names remapped to `VITE_FLEET_URL`, `VITE_FLEET_KEY`, `VITE_FLEET_PRODUCT_ID` (§1.11).
  Contract (from the donor): hooks `window.onerror`/`onunhandledrejection` chaining existing handlers, scrubs, computes the `fingerprint` BEFORE the network call, POSTs `fleet_errors` rows with the write-only key via plain `fetch`, batched. `getContext` supplies `{ page: route, lang }` only.
- **Acceptance:** `G3` green; tests: with any of the three names blank `initFleetTelemetry` is never called and `window.onerror` stays `null`; with all set, a thrown error produces exactly one POST to `<VITE_FLEET_URL>/rest/v1/fleet_errors` whose body has `product_id`, `fingerprint`, `error_message`, `source: 'client'` and no email/token-looking string; init failure never throws out of `startTelemetry()`.
- **Depends on:** P5 complete.

### P6.2 Bundle secret scan `npm run check:bundle` (lift Themis) ∥ J

- **Files:** `D:/projects/hygieia/scripts/check-bundle-secrets.mjs`, `D:/projects/hygieia/scripts/check-bundle-secrets.test.ts`, `D:/projects/hygieia/package.json` (script), `D:/projects/hygieia/.github/workflows/deploy.yml` (after `build`, before `check:pwa`).
- **Approach:** lift `D:/projects/themis/scripts/check-bundle-secrets.mjs`; `FORBIDDEN_NAMES` = `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `HYGIEIA_ANTHROPIC_API_KEY`, `HYGIEIA_OPENAI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ACCESS_TOKEN` (mirror `eslint.config.js` `SERVER_SECRET`); keep the `service_role`, service-JWT and prefix rules.
- **Acceptance:** after `npm run build`, `npm run check:bundle` → `OK, no secret-looking value or server-only name`; the test proves a planted `sbp_…` and a `role: service_role` JWT are found and masked; on an empty dir exit 2; `G6` green.
- **Depends on:** P5 complete.

### P6.3 Live smoke `npm run smoke:live` against the deployed URL and the real backing service

- **Files:** `D:/projects/hygieia/scripts/smoke-live.mjs`, `D:/projects/hygieia/scripts/smoke-live.test.ts`, `D:/projects/hygieia/package.json` (script; `SMOKE_BASE_URL` default `https://intotheveil.github.io/hygieia/`).
- **Approach:** HTTP-only, no browser: `GET /` 200 with `<html lang="el"` and the Greek title; `GET /manifest.webmanifest` 200 with `start_url` `/hygieia/`; `GET /sw.js` 200; `GET /recipes/deep-link-probe` → 404 whose body contains `<div id="root">` and the manifest link (the fallback works);
  `GET /favicon.svg` 200; the bundle referenced by `index.html` 200 and contains no `service_role` (reuse `scanText` from P6.2). Backing service (needs `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` in env, else prints `SKIPPED (backend)`):
  `GET /rest/v1/recipes?select=slug&status=eq.approved&limit=1` with `Accept-Profile: hygieia` → 200 and ≥ 1 row (after OP4.b), `…&status=eq.pending` → `[]`; `GET /rest/v1/profiles?select=user_id` → `[]`. Prints `SMOKE PASSED` or the first failing probe.
- **Acceptance:** tests with a fake fetch cover every probe's pass and fail path; run against the live URL → `SMOKE PASSED` recorded in `BUILD_LOG.md` with timestamp.
- **Depends on:** P6.2.

### P6.4 Production env wiring: configured mode on Pages

- **Files:** `D:/projects/hygieia/.github/workflows/deploy.yml` (build step `env: VITE_SUPABASE_URL: ${{ vars.VITE_SUPABASE_URL }}`, `VITE_SUPABASE_ANON_KEY: ${{ vars.VITE_SUPABASE_ANON_KEY }}`, `VITE_FLEET_URL/KEY/PRODUCT_ID: ${{ vars.… }}` — repository VARIABLES, not secrets, because every value is public by design; PR builds from forks get blanks → local-only, which is correct),
  `D:/projects/hygieia/README.md` (deploy section), `D:/projects/hygieia/.env.example` (comment: which names CI reads from `vars`).
- **Acceptance:** after the operator sets the variables (OP2.c, OP6.a), the next `main` deploy serves a bundle whose `env` resolves to `configured` (verify: `smoke:live` backend probes return rows; the site shows approved content WITHOUT the ribbon and the account menu offers sign-in); `check:bundle` in CI still OK (anon key is not a finding); `check:pwa` OK.
- **Depends on:** P6.2, OP2.c.

### P6.5 Release notes + brain/fleet records

- **Files:** `D:/projects/hygieia/BRAIN.md` (§2: telemetry, smoke, env wiring, e2e; §3 current state = "live in configured mode"; §4: close F1, F2, O1; §8 ledger header), `D:/projects/hygieia/BUILD_LOG.md`, `D:/projects/hygieia/README.md`, `D:/projects/hygieia/.claude/CLAUDE.project.md` §8 (`smoke: npm run smoke:live`, `telemetry: VITE_FLEET_*`) + kit recompose.
  (The `FLEET.md` row and Zeus BRAIN pointer are Zeus-side: the lead updates them from `D:/projects/zeus`.)
- **Acceptance:** `verify-kit` PASS; BRAIN "Last updated" current; `G6` green.
- **Depends on:** P6.1–P6.4.

### P6.QA — QA & Validation (agent: qa)

- **QA exit gate (§9 P6: clean-checkout build succeeds; the artifact §2 describes is smoke-tested against the real backing service):**
  1. `git clone https://github.com/intotheveil/hygieia <tmp>` (fresh, no `.env`), `npm ci`, `G6` end-to-end green, plus `npm run check:lighthouse`.
  2. `npm run smoke:live` against `https://intotheveil.github.io/hygieia/` → `SMOKE PASSED` including the backend probes (approved rows ≥ 1, pending `[]`, profiles `[]`); record the output.
  3. In a real browser on the deployed URL: install prompt available (Chrome "Install app"), sign in via magic link, favourite a recipe, reload → still favourited; sign out → favourites gone from view; a second account cannot see the first's saved fridge list (record both user ids' observable, not the emails).
  4. Telemetry: with `VITE_FLEET_*` set in the deploy, trigger a deliberate error in the deployed app via `/hygieia/?__fleet_test=1` (a dev-only hook P6.1 adds that throws once when the flag is present AND `import.meta.env.DEV` is false only for this QA — if the lead rejects the hook, use DevTools `throw new Error('fleet-smoke')` instead) and the operator confirms the fingerprint on the Zeus dashboard; record it in BRAIN §8 as the ledger's first row (status `solved` immediately, as a synthetic).
  5. CI run for the release commit green on every step: lint, typecheck, test, db:check, db:gate, prove-red, seed:check, build, check:bundle, check:pwa, e2e (both projects), lighthouse, deploy.
- **Depends on:** P6.1–P6.5 and OPERATOR-P6.

### P6.REVIEW — Quality review (agent: reviewer)

- **Depends on:** P6.QA (VALIDATED). **Rubric:** CLAUDE.md §6.

### CHECKPOINT P6 — surface summary to human, wait for gate approval (release)

### OPERATOR-P6

- **OP6.a** Set repository variables `VITE_FLEET_URL`, `VITE_FLEET_KEY` (the fleet's write-only key), `VITE_FLEET_PRODUCT_ID` (register Hygieia on the Zeus dashboard first — Zeus-side).
- **OP6.b** Approve the release deploy; after 7 silent days flip any P6.QA.4 ledger row to `solved` (CLAUDE.md §10).

---

## 3. Dependency summary (critical path) and parallel lanes

```
P1.1 → { P1.2 ∥ P1.3 ∥ P1.4 } → P1.5 → P1.6 → P1.7 → P1.8 → P1.12 → P1.14 → P1.15 → P1.QA → P1.REVIEW → CHECKPOINT P1 → OP1
          P1.4 → { P1.9 ∥ P1.10 } → P1.11 → P1.12 ;  P1.13 ∥ P1.14 (after P1.12)
P2.1 → { P2.2 ∥ P2.3 ∥ P2.4 } → P2.5 ; P2.6 (after P1.3, any time) → P2.QA (needs OP2.a/b) → P2.REVIEW → CHECKPOINT P2
P3: { P3.1 ∥ P3.2 ∥ P3.3 } → P3.4 → P3.5 → P3.6 → P3.7 → P3.QA → P3.REVIEW → CHECKPOINT P3
P4: { P4.1 ∥ P4.2 ∥ P4.5(after P4.1) } ∥ { P4.4 ∥ P4.7 } → P4.3, P4.6, P4.8 → P4.9 → P4.10 → P4.11 → P4.12 → P4.QA → P4.REVIEW → CHECKPOINT P4 → OP4
P5: P5.1 → { P5.2 ∥ P5.3 ∥ P5.4 } → P5.5 → P5.QA → P5.REVIEW → CHECKPOINT P5
P6: { P6.1 ∥ P6.2 } → P6.3 → P6.4 → P6.5 → P6.QA (needs OP6.a) → P6.REVIEW → CHECKPOINT P6
```

Parallel lanes are safe only in separate worktrees (CLAUDE.md §4 "one writer per checkout"). QA and REVIEW are never parallel with anything.

## 4. Gotchas pre-loaded from the donors (builders read these before P1.2 / P3.6)

- Never `process.exit()` in a PGlite script; return the exit code and set `process.exitCode` once (Windows 0xC0000409 crash — Themis BRAIN §5).
- PGlite has no contrib extensions unless passed to the constructor; the schema here needs none (`gen_random_uuid()` and `md5()` are core).
- Node type-stripping imports of `.ts` from `.mjs` require erasable syntax (no `enum`, no parameter properties) and explicit `.ts` extensions; seed modules must not import React or `import.meta.env`.
- A policy evaluated as `anon` must not call a function `anon` cannot EXECUTE — hence per-role policies (§1.4).
- On Pages (and `pages-server`) a deep link is a 404 DOCUMENT; assert the rendered app, never `response.ok()`; the console watchdog filters only the document's own 404.
- `spaFallback` and `VitePWA` both write `dist/` at `writeBundle`; keep the plugin order and check `404.html` equals `index.html` after every build-affecting change (BRAIN §5).
- `vite preview` rewrites every path to `index.html` with 200 — never use it for e2e; use `pages-server --base /hygieia`.

---

## P7 Skincare (operator request 2026-10-06)

Operator, verbatim: _"Add also skin care for men / women category with tips products and whatever from EU, US,
Korea etc etc."_ — and, mid-task: _"And nails xD"_. A seventh module on the proven P3/P4 pattern (schema →
seed → ContentSource → page), gated like every other phase (ADR-0005 cadence: QA + review after merge).

**Data model (schema `hygieia`, migration `20261006001100_hygieia_skincare.sql`, forward-only; enums mirrored in
`src/content/enums.ts`):**

- Enums (text + CHECK, asserted by the gate and `db-schema-contract.test.ts`): `AUDIENCES` men | women | all ·
  `SKIN_TYPES` normal | dry | oily | combination | sensitive | all · `SKIN_CONCERNS` acne | aging | hydration | sun |
  pigmentation | redness | shaving | beard | pores | texture | nails | hands | general · `REGIONS` eu | us | kr | jp |
  global (regulatory / routine STYLE, never a shop) · `STEP_TIMES` am | pm | both (product types) · `ROUTINE_TIMES`
  am | pm | weekly (routines; nail routines are weekly) · `CARE_AREAS` face | nails · `SKINCARE_CATEGORIES`
  cleanser | toner | essence | serum | moisturizer | sunscreen | exfoliant | mask | eye | treatment | shaving | beard |
  lip | cuticle_oil | nail_treatment | hand_cream | base_coat | nail_file | nail_remover · `PRICE_BANDS` low | mid | high.
- `skincare_product_types` — generic product TYPES, never brands: `slug`, `name_el/en`, `description_el/en`,
  `category`, `key_ingredients text[]`, `avoid_with text[]`, `regions text[]`, `audiences text[]`, `skin_types text[]`,
  `concerns text[]` (array enums: `cardinality ≥ 1 and x <@ array[…]`), `time` (step time), `price_band_eur`,
  `notes_el/en` (regulatory notes), review columns.
- `skincare_routines` — `slug`, `area` (default `face`), `name_el/en`, `audience`, `skin_type`, `region`, `time`
  (routine time), `intro_el/en`, `steps jsonb` = ordered array of `{ order, product_type_slug, note_el, note_en,
  optional }` (CHECK `jsonb_typeof = 'array'`, 1–10 elements; the gate's jsonb scan proves every
  `product_type_slug` resolves and `order` = position), `duration_min`, review columns.
- `skincare_tips` — `slug`, `area` (default `face`), `title_el/en`, `body_el/en`, `audiences[]`, `skin_types[]`,
  `concerns[]`, `regions[]`, `sources text[]`, `needs_source` (CHECK `cardinality(sources) ≥ 1 or needs_source`),
  review columns.
- Same RLS / grant / revoke discipline as `health_tips`: per-role policies (`_select_anon` approved, `_select_auth`
  approved or `is_admin()`, `_update_admin`), column-limited UPDATE grants (= `EDITABLE_COLUMNS`), no client
  INSERT/DELETE, service_role full DML, `touch_updated_at` + `stamp_review` triggers.

### P7.1 Data spine + seed content — DONE 2026-10-06 (lane `wt/a`)

- **Files:** `supabase/migrations/20261006001100_hygieia_skincare.sql`, `20261006001200_hygieia_seed_skincare.sql`
  (generated), `src/content/{enums,types,db-types,source,bundled,supabase,index}.ts`, `src/content/seed/skincare.ts`
  (+ `seed/skincare/{product-types,routines,tips}.ts`, one lazy chunk) + `skincare.test.ts`, `scripts/gen-seed-sql.mjs`
  (`kind: 'skincare'`, multi-export, jsonb), `scripts/db-gate/catalogue.mjs` (3 content entries, fixture, enum
  columns, floors 36 / 28 / 55), `scripts/db-gate.mjs` (jsonb step scan), `scripts/db-gate-prove-red.mjs` (2 new
  sabotages, pinned counts 17 / 9 / 18), `scripts/db-schema-contract.test.ts`, `src/admin/{adminSource,fields}.ts` +
  `ReviewForm.tsx` (`json` kind for `steps`), `src/i18n/features/admin.ts`, `docs/ops/migrations.md`.
- **Contract for P7.2:** `ContentSource.listSkincareProductTypes() / listSkincareRoutines() / listSkincareTips()` →
  `Result<SkincareProductType[] | SkincareRoutine[] | SkincareTip[]>` (types exported from `src/content`), approved-only
  in supabase mode; seed exports `SKINCARE_PRODUCT_TYPES`, `SKINCARE_ROUTINES`, `SKINCARE_TIPS`.
- **Acceptance (met):** lint 0 errors · typecheck · `npm test` green · `db:check` 12 · `db:gate` 289 · prove-red 27/27 ·
  `seed:check` OK · build code-split (skincare seed = its own chunk) · `check:bundle` OK.

### P7.2 `/skincare` page — DONE 2026-10-06 (lane `wt/c`)

- **Files:** `src/skincare/{SkincarePage.tsx, filter.ts, …}` + tests, `src/routes/routes.tsx` (lazy `/skincare`),
  `e2e/support/routes.ts` (a11y matrix + Lighthouse cell), `src/i18n/features/skincare.ts` (+ `features/index.ts`),
  `src/components/SiteHeader.tsx` (nav), `src/App.tsx` (home card), `src/i18n/dictionary.ts` (`MODULE_IDS` + card copy),
  `e2e/local/skincare.spec.ts`.
- **Approach:** read the three lists through `contentSource` (P4.8/P4.9 pattern, `useAsync` + `AsyncState`); a Face /
  Nails switch on `area`; filters audience / skin type / concern / region in the URL (`?area=&audience=&skin=&concern=
  &region=`); routines grouped AM / PM (and Weekly for nails) with their steps resolved against the product-type list
  (a step whose type is not visible renders its slug muted, like a hidden `RecipeLine`); a product-type guide grouped by
  category with key ingredients / avoid-with / regions chips and the regulatory note; tips as cards with "Source pending
  review" when `needs_source`. Disclaimer line: informational, not dermatological advice. Bundled mode shows the draft ribbon.
- **Acceptance:** route in `routes.tsx` AND `e2e/support/routes.ts`; both languages complete (type-checked); unit tests
  for the filter + page states (loading / error / empty / hidden step); e2e: switch Face → Nails, filter by region = kr
  shows only kr routines; a11y matrix cells green; Lighthouse cold ≥ 85 / 90 / 90 on `/skincare`; `G0` green.
- **Depends on:** P7.1 (types + seed exports).

### P7.3 Live apply + approval (OPERATOR)

- `npm run db:apply` (dry-run, then `-- --apply`) for `20261006001100` + `20261006001200` from the operator's shell
  (`docs/ops/migrations.md`); `db:live-check` ledger 12/12; review and approve the three skincare tables in `/admin`
  (every row lands `pending`; unsourced tips stay the operator's call). Not a crew task.

### P7.QA — QA & Validation (agent: qa)

- Fresh clone: `G0` + `db:check` + `db:gate` (289, every skincare check present) + `prove-red` (27/27 incl.
  `skincare-step-dangling-slug`, `skincare-area-enum-mismatch`) + `seed:check` + e2e both projects + `check:lighthouse`
  with `/skincare`; isolation: anon reads 0 pending skincare rows through the gate AND (after P7.3) through the live
  REST (`Accept-Profile: hygieia`); content audit: no brand names in product types, every tip with a condition word
  points to a professional, Greek natural (spot-check 10 rows per table).

### P7.REVIEW — Quality review (agent: reviewer)

- **Depends on:** P7.QA (VALIDATED). **Rubric:** CLAUDE.md §6.

### CHECKPOINT P7 — surface summary to human, wait for gate approval

## P8 Profile (operator request 2026-10-06)

Operator, verbatim: _"profile page, which tracks our data and achievements / entries … like save favorites"_ — and, mid-task:
_"Set up workout plans - register progress etc. Modern"_. Per-user data on the proven P2.4 pattern (user-data spine → page), gated
like every other phase (ADR-0005 cadence: QA + review after merge).

**Data model (schema `hygieia`, migration `20261006001300_hygieia_profile.sql`, forward-only; enums + types in `src/user/source.ts`,
the VERBATIM contract P8.2 / P8.3 build against):**

- `entries` — `id`, `kind` ∈ `ENTRY_KINDS` weight | meal | workout | water | sleep | steps | skincare | nails | mood, `entry_date` (default
  today), `value numeric ≥ 0 | null`, `unit` ∈ `ENTRY_UNITS` kg | kcal | min | ml | h | steps | score | null, `payload jsonb | null` (free
  detail: `{ recipe_id }`, `{ workout_template_id }`, `{ routine_slug }`), `note ≤ 500 | null`. Index `(user_id, entry_date desc,
  created_at desc)`. **Achievements and streaks are computed client-side from entries, never stored.**
- `goals` — PK `(user_id, kind)`, `kind` ∈ `GOAL_KINDS` water | sleep | workout | steps | weight | skincare, `target > 0`, `unit`,
  `cadence` daily | weekly. Upserted (`onConflict: 'user_id,kind'`).
- `saved_items` — PK `(user_id, kind, item_id)`, `kind` ∈ `SAVED_ITEM_KINDS` workout | skincare_routine | health_tip | skincare_tip |
  diet. **Polymorphic on purpose (no FK)**; recipes keep the existing `favourites` table.
- `workout_plans` — `template_id` → `workout_templates` (RESTRICT), `name` 1–80, `weeks` 1–12, `days_per_week` 1–7, `start_date`
  (default today), `status` active | completed | abandoned (default active). Index `(user_id, status)`.
- `workout_sessions` — `plan_id` → `workout_plans` (SET NULL), `template_id` → `workout_templates` (SET NULL), `performed_at` (default
  today), `duration_min` 1–600 | null, `exercises jsonb` = array of 1–40 `{ exercise_id: uuid, sets: [{ reps: int ≥ 0, weight_kg:
  number | null ≥ 0, rpe: number | null 1..10, done: boolean }] }` (validated client-side on read; the gate's jsonb scan proves
  `exercise_id` resolves), `note ≤ 500 | null`. Index `(user_id, performed_at desc)`.
- Same RLS / grant discipline as `fridge_lists`: `user_id default auth.uid()`, one policy per verb `to authenticated` with
  `user_id = auth.uid()`, INSERT/UPDATE column grants exclude `user_id`, nothing to anon, service_role DML, touch triggers.
- `UserDataSource` (`src/user/source.ts`): `listEntries(range?) / addEntry / deleteEntry / listGoals / upsertGoal / listSavedItems /
  saveItem / unsaveItem / listWorkoutPlans / createWorkoutPlan / setWorkoutPlanStatus / listWorkoutSessions(range?) / addWorkoutSession /
  deleteWorkoutSession`, all `Result<T>`; `disabledSource` answers `fail('disabled')`; the test double is `fakeClient()`
  (`src/auth/fake-client.ts`, records `range` / `order` / `options`, simulates the column defaults).

### P8.1 User-data spine — DONE 2026-10-06 (lane `wt/a`)

- **Files:** `supabase/migrations/20261006001300_hygieia_profile.sql`, `src/user/{source,supabase,disabled}.ts` + `source.test.ts`,
  `src/content/{enums,db-types}.ts` (+ `types.test.ts` pin), `src/auth/fake-client.ts` (+ `unusedProfileMethods` spread in the
  `AccountPage` / `FridgePage` / `PlanView` tests), `scripts/db-gate/catalogue.mjs` (5 user entries, fixture, 6 enum rows from
  `source.ts`), `scripts/db-gate.mjs` (sessions jsonb scan; review-shape predicate), `scripts/db-gate-prove-red.mjs` (counts 22 / 23,
  +1 sabotage), `scripts/db-schema-contract.test.ts`, `scripts/db-isolation.test.ts` (wording), `docs/ops/migrations.md`.
- **Acceptance (met):** lint 0 errors · typecheck · `npm test` 3456 / 69 · `db:check` 13 · `db:gate` 357 · prove-red 28/28 · build +
  `check:bundle` OK. BUILD_LOG entry of the same date has the detail and the two gate-forced deviations.

### P8.2 `/profile` page (agent: builder) ∥ with P8.1 review

- **Files:** `src/profile/{ProfilePage.tsx, …}` + tests, `src/routes/routes.tsx` (lazy `/profile` under `RequireAuth`),
  `e2e/support/routes.ts` (a11y matrix + Lighthouse cell), `src/i18n/features/profile.ts` (+ `features/index.ts`), account menu /
  header link, `e2e/local/profile.spec.ts`.
- **Approach:** read through `useUserData()` (P2.4 pattern, `useAsync` + `AsyncState`); sections — quick log (water, weight, sleep,
  steps, mood → `addEntry`) + today's entries, goals with progress against entries per cadence (`upsertGoal`), achievements / streaks
  as pure functions over `listEntries()` (never stored), saved items resolved against `contentSource` by kind ("no longer available"
  when the row is hidden / rejected), favourites (recipes, existing table), recent workout sessions summary. Disabled source →
  `SignedOutNote`. Both languages, type-checked.
- **Acceptance:** route in `routes.tsx` AND `e2e/support/routes.ts`; unit tests for the pure computations (streaks, goal progress,
  achievement rules) and the page states (loading / error / empty / disabled); e2e: signed-out note, a11y cells green; Lighthouse cold
  ≥ 85 / 90 / 90 on `/profile`; `G0` green. **Depends on:** P8.1.

### P8.3 Workout plans UI (agent: builder)

- **Route under `/workouts`** (e.g. `/workouts/plans`, lazy, `RequireAuth`): plan builder from a `workout_templates` row (name, weeks
  1–12, days / week 1–7, start date → `createWorkoutPlan`); session logger with sets / reps / weight / RPE / done per exercise, pre-filled
  from the template's `workout_template_exercises` (→ `addWorkoutSession`); progress (sessions this week vs `days_per_week`, completion
  %, mark completed / abandoned → `setWorkoutPlanStatus`); PRs (best weight × reps per exercise) computed client-side from
  `listWorkoutSessions()`. Modern, touch-first controls; both languages.
- **Acceptance:** unit tests through `fakeClient()` (payload shapes, no `user_id`); e2e both languages; a11y + Lighthouse cells; the
  route in both lists; `G0` green. **Depends on:** P8.1.

### P8.4 Live apply (OPERATOR)

- `npm run db:apply` (dry-run, then `-- --apply`) for `20261006001300` from the operator's shell (`docs/ops/migrations.md`);
  `db:live-check` ledger 13/13. Not a crew task.

### P8.QA — QA & Validation (agent: qa)

- Fresh clone: `G0` + `db:check` (13) + `db:gate` (357, every P8.1 check present) + `prove-red` (28/28 incl.
  `entries-policy-missing-user-filter`) + e2e both projects + `check:lighthouse` with `/profile`; isolation: two users through the gate
  AND (after P8.4) through the live REST (`Accept-Profile: hygieia`) — user B reads 0 rows of A on all five tables, a write naming
  `user_id` is `permission denied`; the `/profile` page shows the sign-in note when signed out and never a spinner.

### P8.REVIEW — Quality review (agent: reviewer)

- **Depends on:** P8.QA (VALIDATED). **Rubric:** CLAUDE.md §6.

### CHECKPOINT P8 — surface summary to human, wait for gate approval

## P9 Tasks Advisor (operator + spouse request 2026-10-06)

Operator, verbatim: _"We place some topics which open a questionnaire, and it creates weekly or daily task lists. E.g. to clean house
and keep it clean, to start a workout routine, etc. Not AI powered — pre-prepare the task lists."_ Bundled content only — **no database,
no migration**; works for everyone, signed in or not.

**Model (`src/tasks/types.ts`):** a TOPIC = `{ id, icon, title, blurb, questions, tasks }` (bilingual `{ el, en }` on every string). A
QUESTION is `single` (radios) or `multi` (checkboxes) with stable option ids; the one question whose options carry `minutes` is the
daily time budget; an option flagged `gentle` (a chaotic home, a beginner, "hardly any water") switches on the start-gently week. A
TASK = `{ id, title, detail?, minutes, cadence daily | weekly | monthly, day?, times?, when, weight, kickoff? }`; `when` = every listed
question has one of the listed options selected (empty = always).

### P9.1 Tasks Advisor — topics, questionnaires, generated daily/weekly plans — DONE 2026-10-06 (lane `wt/d`)

- **Files:** `src/tasks/{types,generate,storage,dates,text}.ts`, `src/tasks/{TasksPage,Questionnaire,PlanView}.tsx`,
  `src/tasks/content/{topics,build,index}.ts` + eleven topic files (one lazy chunk each), tests `src/tasks/{generate,storage,text}.test.ts`,
  `src/tasks/TasksPage.test.tsx`, `src/tasks/content/content.test.ts`, `e2e/local/tasks.spec.ts`; wiring `src/routes/routes.tsx` (lazy
  `/tasks` + `/tasks/:topic`), `src/i18n/features/tasks.ts` (+ `features/index.ts`), `src/i18n/dictionary.ts` (`MODULE_IDS` +
  `NAV_IDS` gain `tasks`, `modules.tasks`, `nav.tasks`, status copy "eight modules"), `src/App.tsx` (eighth card), `src/components/SiteHeader.tsx`
  (nav link + `print:hidden`), `e2e/support/routes.ts` + `scripts/check-lighthouse.test.ts` (`tasks`, `task-topic`), count updates in
  `src/App.test.tsx`, `src/components/SiteHeader.test.tsx`, `src/i18n/dictionary.test.ts`, `e2e/local/smoke.spec.ts`.
- **Generator (`generate.ts`, pure, deterministic):** eligible by `when` (kick-offs only when gentle) → budget (gentle = ~70 %, rounded
  to 5, ≥ 10) → ANCHORS (weight ≥ 6: a workout session, a study block) placed first → daily habits into a third of the budget → the
  rest in one pass by weight (weekly first among equals; weekly longer-first; `times` repeats on a spaced, rotated pattern; `day` hint
  wins when it fits; ≤ 2 non-anchor jobs a day) → monthly (≤ the full budget, ≤ 6). Invariant: every day's minutes ≤ the plan budget.
- **Acceptance (met — BUILD_LOG entry of the same date has the numbers):** ≥ 10 topics (11), 3–6 questions each, ≥ 25 tasks per topic and
  ≥ 40 on average; every topic × EVERY answer combination (17 424 plans) yields a non-empty plan within budget and every task is
  reachable; `/tasks` + `/tasks/clean-home` in both route lists; a11y cells green both languages; Lighthouse cold ≥ 85 / 90 / 90; e2e
  questionnaire → tick → reload keeps it, both languages; `G0` green. Dead-backend spec: not applicable (no backend read).

### P9.QA — QA & Validation (agent: qa)

- Fresh clone: `G0` + e2e both projects + `check:lighthouse` incl. `tasks` / `task-topic`; open `/tasks/<topic>` for three topics in
  both languages, answer, tick, reload; confirm nothing is sent over the network on tick (local only); print preview hides the header.

### P9.REVIEW — Quality review (agent: reviewer)

- **Depends on:** P9.QA (VALIDATED). **Rubric:** CLAUDE.md §6.

### CHECKPOINT P9 — surface summary to human, wait for gate approval
