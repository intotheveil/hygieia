# Hygieia · Υγίεια

A bilingual (Greek / English) health, diet, recipe and workout tool.

Named for Hygieia, the Greek goddess of health and preventive wellbeing, whose name gave English the
word "hygiene". Fleet product of `intotheveil`; the product name is Hygieia, the repo is `hygieia`.

**Live:** https://intotheveil.github.io/hygieia/ (GitHub Pages, deployed from `main` by CI).

## What it will do

- **Health tips** — short, sourced everyday guidance.
- **Diets and meal plans** — what each diet is (Mediterranean, Atkins, paleo, low-carb, keto,
  carnivore, …) and weekly plans built on it.
- **Recipes** tagged by diet, plus **"What's in my fridge?"** — meals you can make from the
  ingredients you already have.
- **Meal cost** and **calories / macros** estimates per recipe.
- **Workouts** — home, gym or calisthenics; beginner / intermediate / advanced; three intensities.

The current build is the foundation (P0): the bilingual shell, the module map and the toolchain.
No module holds content yet, and the page says so.

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
npm run e2e                # Playwright against the production build (E2E_PREBUILT=1 skips the build)
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
`db:gate:prove-red` → `seed:check` → build → `check:bundle` → `check:pwa` → e2e, then deploys `main`
to Pages. Nothing in CI reaches the live database or holds a credential.

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
