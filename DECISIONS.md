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
