# Hygieia · Υγίεια

A bilingual (Greek / English) health, diet, recipe and workout tool.

Named for Hygieia, the Greek goddess of health and preventive wellbeing, whose name gave English the
word "hygiene". Fleet product of `intotheveil`; the product name is Hygieia, the repo is `hygieia`.

**Live:** https://intotheveil.github.io/hygieia/ (GitHub Pages, deployed from `main` by CI).

## What it does

- **Health tips** — short, sourced everyday guidance.
- **Diets and meal plans** — what each diet is (Mediterranean, Atkins, paleo, low-carb, keto,
  carnivore, …) and weekly plans built on it.
- **Recipes** tagged by diet, plus **"What's in my fridge?"** — meals you can make from the
  ingredients you already have.
- **Meal cost** and **calories / macros** estimates per recipe.
- **Workouts** — home, gym or calisthenics; beginner / intermediate / advanced; three intensities.

The deployed build is the full P1–P6 app. Until the operator sets the repository variables (see Deploy) it runs in
local-only mode: the bundled draft content with a draft ribbon, no sign-in, nothing sent anywhere.

## Stack

React 19 · Vite 8 · TypeScript (strict) · Tailwind 4 · Vitest + Testing Library · Playwright (e2e) ·
ESLint + Prettier. Supabase (shared project, own schema — see Database). Hosting: GitHub Pages, as an
installable PWA (`DECISIONS.md` ADR-0001, ADR-0004).

## Commands

```
npm install
npm run dev                # local dev server
npm run lint               # eslint
npm run typecheck          # tsc -b
npm test                   # vitest
npm run e2e                # Playwright against a local-only production build (E2E_PREBUILT=1 skips the build)
npm run build              # tsc -b && vite build → dist/
npm run check:bundle       # dist/ secret scan (every text file in dist/ is public)
npm run check:pwa          # manifest fields, every icon it names, the service worker
npm run smoke:live         # read-only probes of the deployed site (needs the live env names)

npm run db:check           # static guard: every migration stays inside schema `hygieia`
npm run db:gate            # apply the archive to a throwaway PGlite Postgres, prove RLS/isolation
npm run db:gate:prove-red  # sabotage a copy of the archive 25 ways; the gate must go RED each time
npm run seed:gen           # regenerate the seed migrations from src/content/seed
npm run seed:check         # fail if a seed migration drifted from src/content/seed
npm run db:apply           # DRY-RUN against the live project (rolled back); `-- --apply` commits
npm run db:live-check      # read-only: live ledger == archive, anon sees nothing it should not
```

CI (`.github/workflows/deploy.yml`) runs lint → typecheck → test → `db:check` → `db:gate` →
`db:gate:prove-red` → `seed:check` → build (local-only) → `check:bundle` → `check:pwa` → e2e →
`check:lighthouse` → build (configured, see Deploy) → `check:bundle` → `check:pwa`, then deploys
`main` to Pages. Nothing in CI reaches the live database or holds a credential: the browser-driven
gates run against a local-only build, and the only values the configured build inlines are public.

## Deploy

`main` deploys to GitHub Pages at https://intotheveil.github.io/hygieia/ (the `deploy` job of the
workflow above; a pull request runs every gate and stops before the upload).

**How the site becomes "configured".** The browser reads six `VITE_*` names, inlined at build time
(`src/lib/env.ts`, `src/telemetry.ts`; `.env.example` lists them). CI's Pages build takes them from
GitHub Actions **repository variables** (Settings → Secrets and variables → Actions → Variables):

| Variable                                                    | Set by                          | Effect when set                                                                                                               |
| ----------------------------------------------------------- | ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`               | operator, OPERATOR-P2 **OP2.c** | the app runs in **configured** mode: approved content from the `hygieia` schema, no draft ribbon, sign-in in the account menu |
| `VITE_AUTH_GOOGLE` (`1`)                                    | operator, OPERATOR-P2 **OP2.a** | shows "Continue with Google" on `/auth` once the Google provider is enabled in Supabase; unset = magic link only              |
| `VITE_FLEET_URL`, `VITE_FLEET_KEY`, `VITE_FLEET_PRODUCT_ID` | operator, OPERATOR-P6 **OP6.a** | runtime errors are reported to the fleet dashboard (`src/telemetry.ts`)                                                       |

They are **variables, not secrets**, because every one of them is public by design: Vite writes them
into the bundle Pages serves, the anon key is bound by RLS, the fleet key is write-only. A secret
would only hide the value from the workflow log while it sits in plain text in `dist/`. Nothing
server-side (`service_role`, access tokens) is ever a browser name; `check:bundle` fails the build if
such a value reaches `dist/`, and the lint allow-list stops `src/**` from reading it.

**Until the operator sets the variables** the expressions resolve to empty strings and the deploy
runs in **local-only** mode: the site serves the bundled draft content with the draft ribbon, offers
no sign-in and sends nothing anywhere. Same for a pull request from a fork, which sees no variables.
That is the correct behaviour, not a failure — the next `main` push after the variables exist is
what flips the live site to configured mode; no code change is needed.

**Two builds in CI, on purpose.** e2e and Lighthouse drive a real browser; they must not reach the
live backend from a CI runner (no traffic against production tables, no telemetry rows from CI
runs, no backend latency in the performance score). So CI builds once with the six names blanked
for those gates, then builds again from the variables for the artifact it uploads, and runs
`check:bundle` + `check:pwa` on that artifact too. Same commit; only the inlined env differs
(`DECISIONS.md`, 2026-10-06).

**What `npm run smoke:live` proves** (`scripts/smoke-live.mjs`, HTTP only, read-only): that the
deployed site is the installable, deep-linkable PWA `check:pwa` verified — home page, manifest and
icons, service worker, `404.html` fallback with status 404, no secret-looking value in the served
bundle — and, when `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` are in the shell environment,
that the live backend exposes schema `hygieia` to anon exactly as the policies promise (approved
recipes readable, pending ones and profiles invisible). After OP2.c, a `SMOKE PASSED` with the
backend probes reporting rows is the evidence that the deploy is in configured mode.

## Database

Hygieia has no Supabase project of its own. It lives in Alyssos's shared project, in schema
**`hygieia`** and nowhere else (`DECISIONS.md` ADR-0003): nothing is created, altered or granted in
`public`, `auth`, `storage` or `supabase_migrations`. Migrations are plain timestamped SQL files
under `supabase/migrations/`, forward-only, tracked in Hygieia's own ledger
`hygieia.schema_migrations`.

The flow, in three commands:

```
npm run db:gate               # 1. rehearse: the whole archive on a fresh throwaway Postgres, twice
npm run db:apply              # 2. dry-run against the live project — every batch is rolled back
npm run db:apply -- --apply   # 3. commit, only with the operator's go
```

**Never `supabase db push`, `supabase link` or `supabase db reset` against this project.** Alyssos
owns the CLI's migration ledger; a Hygieia version recorded there would break Alyssos's next push.
Live application is an operator task, never a crew task. The runbook, with env names, expected
verdict lines and what to do when something refuses: [`docs/ops/migrations.md`](docs/ops/migrations.md).

## Working here

Read `BRAIN.md` first, every session (`.claude/CLAUDE.md` §0). Env var NAMES only in tracked
files; `.env.example` lists them. Never commit a value.
