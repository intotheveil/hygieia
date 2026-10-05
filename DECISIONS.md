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
