# Operator runbook — applying Hygieia migrations to the live project

Hygieia persists to Alyssos's LIVE shared Supabase project, in schema **`hygieia`** only
(`DECISIONS.md` ADR-0003). Nothing here is a crew task: applying to the live database is done by the
operator, from the operator's shell, after the phase gate. The crew's job ends at a green `db:gate`
and a committed archive.

**Never `supabase db push`, `supabase link`, `supabase db reset` or `supabase migration *` against
this project** (ADR-0003 rule 1). Alyssos owns `supabase_migrations.schema_migrations`; a Hygieia
version recorded there would break Alyssos's next push. Hygieia's ledger is
`hygieia.schema_migrations`, and the only thing that writes it is `npm run db:apply`.

## What is in the archive today

`supabase/migrations/` holds **13 files**: 6 schema + 7 seed.

| #    | file                                                   | what                                                                                                                                                                                    |
| ---- | ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | `20261006000100_hygieia_schema.sql`                    | `create schema hygieia`, the ledger table `schema_migrations`, `touch_updated_at`, the schema grants                                                                                    |
| 2    | `20261006000200_hygieia_profiles.sql`                  | `profiles` (keyed on `auth.users.id`, no trigger on `auth.users`), `is_admin()`, `stamp_review()`                                                                                       |
| 3    | `20261006000300_hygieia_content.sql`                   | the content tables (ingredients, diets, recipes + children, exercises, workout templates + children, health tips) with status + RLS                                                     |
| 4    | `20261006000400_hygieia_user_data.sql`                 | the per-user tables (`fridge_lists`, `saved_plans`, `favourites`) with RLS                                                                                                              |
| 5–10 | `20261006000500` … `20261006001000_hygieia_seed_*.sql` | generated seeds: ingredients, diets, recipes, exercises, workouts, tips                                                                                                                 |
| 11   | `20261006001100_hygieia_skincare.sql`                  | P7.1 skincare: `skincare_product_types`, `skincare_routines` (jsonb steps), `skincare_tips` — same status + RLS discipline, `area` face/nails                                           |
| 12   | `20261006001200_hygieia_seed_skincare.sql`             | generated seed: skincare product types, routines, tips (one file, three tables)                                                                                                         |
| 13   | `20261006001300_hygieia_profile.sql`                   | P8.1 profile: per-user `entries`, `goals`, `saved_items` (polymorphic, no FK), `workout_plans`, `workout_sessions` (jsonb exercises) — one policy per verb, `user_id` from `auth.uid()` |

The seed files are **generated** (`npm run seed:gen` from `src/content/seed/`; `npm run seed:check`
fails CI if one drifted). Every seeded content row lands with `status = pending`: anon sees none of
it until an admin approves it on the admin page (`src/admin/AdminPage.tsx`; admin grant in
[`admin.md`](admin.md)). So right after a first apply the public site, in configured mode, shows
**no** DB content — that is the expected observable, not a fault.

## Environment — names only

| name                           | what                                              | where the value comes from         |
| ------------------------------ | ------------------------------------------------- | ---------------------------------- |
| `SUPABASE_ACCESS_TOKEN`        | a Supabase personal access token (Management API) | the **Zeus Vault**                 |
| `HYGIEIA_SUPABASE_PROJECT_REF` | the shared project's ref                          | the Zeus Vault (ADR-0003 names it) |
| `VITE_SUPABASE_URL`            | the project's API URL — `db:live-check` only      | the Zeus Vault                     |
| `VITE_SUPABASE_ANON_KEY`       | the anon (publishable) key — `db:live-check` only | the Zeus Vault                     |

Export them in the shell for the session (`export NAME=…` in bash, `$env:NAME = '…'` in
PowerShell). **Never put a value in a `.env` file and never in any tracked file** — the scripts do
not read `.env`, and `.env.example` lists names only. The scripts never print a value; every output
line is redacted of the token and the anon key. Close the shell when you are done.

Missing `SUPABASE_ACCESS_TOKEN` or `HYGIEIA_SUPABASE_PROJECT_REF` → `db:apply` exits **2** naming
them and sends nothing. Missing any of the four → `db:live-check` prints `LIVE-CHECK SKIPPED —
missing: …` and exits 0 (a skip, not a pass).

## The sequence

Run every step from a clean checkout of `main` at the commit you intend to apply (the ledger
records each file's sha256; a worktree with uncommitted migration edits would apply something
`main` does not have).

### 1. `npm run db:check` — the static guard

Reads the SQL text only. Expected:

```
PASS  migration guard: 13 migration(s) stay inside schema hygieia
```

Any `FAIL  file:line  [rule]  message` → stop; the archive reaches outside schema `hygieia` and
must be fixed by the crew with a NEW migration (never by editing a shipped file).

### 2. `npm run db:gate` — rehearse on a throwaway Postgres

Applies the whole archive twice (idempotency) to an in-memory PGlite database dressed as the
shared project, then runs the structural sweep, the orphan scan and the per-table isolation matrix.
No credential, no network. Expected last line:

```
GATE PASSED — 357 checks green
```

(The count grows as tables and checks are added; what matters is `GATE PASSED` and exit 0.)
Optionally `npm run db:gate:prove-red` → `PROVE-RED PASSED — 28/28 sabotages RED on the expected
line; control GREEN` (about 20 s with 4 jobs). CI runs both on every push, so on a green `main`
this step is confirmation, not discovery.

### 3. `npm run db:apply` — DRY-RUN against the live project

The default. Reads the live ledger, prints the plan, then sends each pending unit in a transaction
that ends in **ROLLBACK**. Nothing is committed. Expected tail (first apply, empty ledger):

```
PASS  migration guard: 13 migration(s) stay inside schema hygieia
PLAN  10 pending file(s) in 10 transaction(s):
  …
DRY-RUN PASSED — 10 pending file(s) apply cleanly; everything was rolled back. Commit with: npm run db:apply -- --apply (operator's go only).
```

The verdict line is `DRY-RUN PASSED — N pending file(s) …`, N = what the live ledger lacks.
`PLAN  nothing pending — the live ledger matches all N file(s).` means there is nothing to do.
Anything starting `REFUSED` or `DRY-RUN FAILED` → see the table below; nothing was committed.

### 4. `npm run db:apply -- --apply` — commit

Only now, and only with the operator's go. One committed transaction per unit (file + its ledger
row), stopping at the first error. Expected tail:

```
APPLIED 20261006000100_hygieia_schema.sql — committed with its ledger row(s)
  …
APPLY PASSED — 10 file(s) committed and recorded in hygieia.schema_migrations.
```

`APPLY FAILED at <file> — its transaction was not committed. K file(s) committed before it; M later
file(s) not attempted.` is safe to re-run after the cause is fixed with a NEW migration: the K
committed files are in the ledger and will not be re-sent.

### 5. Supabase Dashboard — expose the schema (first time only)

Project Settings → **Data API** → **Exposed schemas** → add `hygieia` → Save. Without this
PostgREST does not know the schema and every client read fails (ADR-0003 rule 5; BRAIN §4 O1). This
is a dashboard setting, not SQL, and it is project-wide: do not remove anything already listed.

### 6. `npm run db:live-check` — prove it, read-only

Needs all four names. Three probes, nothing written: the live ledger must hold every archive
version with the same sha256 and nothing extra; anon must get `200 []` for pending recipes and for
profiles. Expected:

```
PASS  ledger: 10 version(s) applied — every one of the 10 archive file(s) present with its sha256, no extra version
PASS  anon GET /rest/v1/recipes?select=id&status=eq.pending (Accept-Profile: hygieia) → 200 []
PASS  anon GET /rest/v1/profiles?select=user_id (Accept-Profile: hygieia) → 200 []
LIVE-CHECK PASSED — 3 read-only probe(s) against project <ref>
```

### 7. curl check (PLAN OP1.c)

```
curl -i -H "apikey: <anon key>" -H "Accept-Profile: hygieia" \
  "<VITE_SUPABASE_URL>/rest/v1/recipes?select=slug&limit=1"
```

Expected `HTTP/2 200` with body `[]` — everything is pending, so anon sees nothing. That empty
array IS the pass. A `406`/`404` whose message says "schema must be one of" → step 5 was not done.

### 8. Record it

Paste the verdict lines — `DRY-RUN PASSED — …`, `APPLY PASSED — …`, `LIVE-CHECK PASSED — …` and the
curl status — into `BUILD_LOG.md` under an `OPERATOR-P1` entry with the date and the `main` commit
they were run from, and close `O1` in `BRAIN.md` §4. Verdict lines carry no secret; the full output
may (it never should, but do not paste more than the verdicts).

## Content overlays

The seven base seed migrations (`20261006000500`–`001000`, `001200`) are applied live, so their
source modules under `src/content/seed/*.ts` are **frozen**: `seed:check` pins every byte and an
applied migration is never edited. Every later content change — a typo, a source added to a tip, a
recipe `image_path`, a corrected price or nutrition figure, a new dish, diet or ingredient — is an
**overlay**: an ordered module in `src/content/seed/overlays/` that the bundled source applies on
top of the base seed and that the generator turns into ONE new forward-only migration.

### Adding an overlay (crew)

1. Create `src/content/seed/overlays/NNNN-<name>.ts` (next free four-digit number, kebab-case name)
   exporting `OVERLAY: Overlay` (`./types.ts`):

   ```ts
   import type { Overlay } from './types.ts'

   export const OVERLAY: Overlay = {
     id: '0002-tip-sources', // = the file name minus .ts
     summary: 'real sources for three sleep tips', // goes into the migration header
     patches: {
       health_tips: [
         { slug: 'sleep-regular-schedule', set: { source_url: 'https://…', needs_source: false } },
       ],
       recipe_ingredients: [{ recipe_slug: 'greek-salad', position: 0, set: { quantity: 150 } }],
     },
     additions: {
       recipes: [/* full RecipeSeed rows: slug, both languages, ingredients, diet_slugs … */],
       recipe_diets: [{ recipe_slug: 'greek-salad', diet_slug: 'fasting' }],
     },
   }
   ```

   - **Patches** address a row by `slug` (child tables by natural key: `recipe_slug` + `position`,
     `template_slug` + `position`) and `set` only that table's editable content columns
     (`PATCH_COLUMNS` = the admin's `EDITABLE_COLUMNS` = the UPDATE grant minus `status`). Never
     `id`, `slug`, `status` or the review stamp — a type error, an applier error and a gate FAIL.
     A patch targets rows that exist BEFORE its overlay (base or an earlier overlay).
   - **Additions** are base-seed-shaped rows (`IngredientSeed`, `RecipeSeed` with nested lines and
     diet tags, …) with ids by the same `md5('hygieia:<table>:<slug>')` rule, or children appended
     to an existing parent (`recipe_ingredients`, `recipe_diets`, `workout_template_exercises`). A
     slug that already exists is an error. Additions carry no `status`.
   - The seed rules still bind: `needs_source` follows `source_url` (tips) / `sources` (skincare
     tips); recipe-line notes come as a pair; every slug reference resolves.

2. Add ONE line to `src/content/seed/overlays/index.ts` (`OVERLAYS`, in NNNN order). A module the
   list does not name, or a list out of order, is a generator error.
   **Then register it per table** (perf, 2026-10-06): the bundled source does NOT import
   `index.ts`; each seed table loader imports `overlays/by-table/<key>.ts` (key = `ingredients`,
   `diets`, `recipes` — with `recipe_ingredients` + `recipe_diets` —, `exercises`,
   `workout_templates` — with `workout_template_exercises` —, `health_tips`,
   `skincare_product_types`, `skincare_routines`, `skincare_tips`; `SEED_OVERLAY_TABLES` in
   `types.ts`), so a page downloads only the overlay rows of the tables it reads. Add the overlay's
   slice to the index of every key it touches, in NNNN order:
   - an overlay touching ONE key stays a single file and is imported whole:
     `...sliceOverlays([O0005], SEED_OVERLAY_TABLES.recipes)` (see `by-table/ingredients.ts`, 0004);
   - an overlay touching SEVERAL keys keeps each key's rows in its own module
     `overlays/NNNN-<name>/<key>.ts` (type-only imports), the `NNNN-<name>.ts` file assembles
     `OVERLAY` from them, and each index imports only its key's part
     (`{ id: '0003-greek-kitchen', additions: { recipes: R0003, recipe_diets: RD0003 } }`).
     Rolldown assigns whole modules to chunks, so importing a multi-table overlay whole would put
     every table's rows in every loader's download.
   `overlays/by-table.test.ts` is red if an index misses an overlay, slices it wrongly, or breaks
   the import rule; the generator, `seed:check` and the migration are unaffected by the layout.
3. `npm run seed:gen` writes `supabase/migrations/20261007<NNNN>00_hygieia_overlay_<name>.sql`:
   every patch as `update hygieia.<t> set … where slug = '…'`, then every addition as the base
   generator's `insert … on conflict (…) do nothing`. Nothing else in `supabase/migrations/` may
   change (`git diff --stat` shows the one new file). `npm run seed:check` covers it from then on.
4. `npm run db:gate`: the overlay is scanned (`overlay patches only touch editable content columns`),
   applied twice, and every patch must match exactly one row (`every overlay patch hits exactly one
row`). `npm test` proves the overlay applies to the full base seed.
5. Never edit or delete a shipped overlay: like its migration it is applied live. Correct it with
   the next overlay.

### Applying it live (lead / operator)

Steps 1–4 and 6 above: `db:check` → `db:gate` → `db:apply` (dry-run) → `db:apply -- --apply` →
`db:live-check`. The overlay file is an ordinary migration with a ledger row and a checksum.
Patches never touch `status`, so **an approved row stays approved** with the new text. **Additions
land `pending`**: the operator approves everything, so after the apply the LEAD approves the new
rows (the admin page, or by SQL on the operator's instruction, as with OP4.b). Until then the public
site does not show them, while the local-only build already does (as drafts).

**Ordering caveat.** Overlay migrations are numbered `20261007…`. Once one is applied live,
`db:apply` refuses any later migration with an OLDER version (`OUT OF ORDER`): a new schema
migration must then be numbered after the newest applied overlay (e.g. `20261008000100_…`), not
`2026100600xxxx`.

## What if

| the line says                                                                                                   | it means                                                                                                              | do this                                                                                                                                                                                                                                                                         |
| --------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `REFUSED — … CHECKSUM CHANGED: <file> was applied with sha256 … but the file now hashes to …`                   | a file already in the live ledger was edited after it was applied                                                     | never edit a shipped migration. `git log -p` the file, revert the edit, and put the intended change in a NEW timestamped file. If the change was a seed regeneration, that is a NEW seed migration too (`seed:gen` writes in place — the crew must version it; stop and report) |
| `REFUSED — … OUT OF ORDER: <file> is pending but older than the newest applied version …`                       | a file with an older timestamp was added after a newer one went live                                                  | rename the pending file to a timestamp newer than the newest applied version (its content is untouched, it has never been applied), re-run `db:gate`, re-run from step 3                                                                                                        |
| `REFUSED — … applied version … has no file in the archive`                                                      | the checkout is behind, or on the wrong branch, relative to what was applied                                          | `git checkout main && git pull`; if the ledger still names a version the archive lacks, stop — someone applied from an uncommitted file; find it, commit it, do not "fix" the ledger by hand                                                                                    |
| `REFUSED — … TRANSACTION CONTROL in <file>`                                                                     | a file contains `begin`/`commit`/`rollback`                                                                           | the applier owns the transaction; the crew removes the statements in a NEW file (if not yet applied, fix the pending file — it has no checksum on record)                                                                                                                       |
| `REFUSED — the static migration guard (db:check) is red`                                                        | the archive reaches outside schema `hygieia`                                                                          | crew fix, NEW migration; nothing was sent                                                                                                                                                                                                                                       |
| `DRY-RUN FAILED at <file> …`                                                                                    | Postgres rejected the SQL (live state differs from the rehearsal, e.g. an object Alyssos has that PGlite did not)     | read the error; nothing was committed; the crew fixes the pending file (never a shipped one) and re-rehearses                                                                                                                                                                   |
| `db:live-check` / curl → `406` or `404` with code **`PGRST106`** ("The schema must be one of the following: …") | schema `hygieia` is not in the Data API's exposed schemas                                                             | step 5. Then re-run step 6                                                                                                                                                                                                                                                      |
| `db:live-check` / curl → `404` with code **`PGRST205`** ("Could not find the table … in the schema cache")      | the schema IS exposed but the table is not there — its migration is not applied, or PostgREST's schema cache is stale | if `APPLY PASSED` listed that file: Dashboard → Data API → reload schema (or wait ~1 min) and retry; if not: step 3–4                                                                                                                                                           |
| `db:live-check` → `FAIL  ledger: ledger absent — nothing applied yet`                                           | `hygieia.schema_migrations` does not exist on the live project                                                        | step 3–4 have not been run on this project                                                                                                                                                                                                                                      |
| `db:live-check` → `FAIL  recipes: anon can see pending recipe row(s) live`                                      | a policy leak — anon reads a pending row                                                                              | stop and report to the crew immediately; this is what the gate exists to prevent, and `db:gate` on the same archive must be re-examined (`prove-red` too)                                                                                                                       |
| exit **2**, `SUPABASE_ACCESS_TOKEN` / `HYGIEIA_SUPABASE_PROJECT_REF` named                                      | env not exported in THIS shell                                                                                        | export them (values from the Zeus Vault) and re-run; nothing was sent                                                                                                                                                                                                           |

## Rules worth repeating

- Dry-run first, every time, even for one file.
- One shipped file is never edited; the fix is always a NEW file.
- No `.env`, no value in a tracked file, no value in a BUILD_LOG paste.
- The seeds arrive `pending`. Approving content is the admin's job on the admin page, not a
  migration's.
