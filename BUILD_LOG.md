# BUILD LOG — Hygieia (`hygieia`)

The crew's trail: what was attempted, what passed, what's blocked, what's next. Newest first.
The human reads this first on return (CLAUDE.md §5).

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
