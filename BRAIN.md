# 🧠 BRAIN — Hygieia (`hygieia`)

> The product's living memory. Read it in full before doing ANY work here (CLAUDE.md §0);
> write it before the session ends. Seeded 2026-10-05 by Zeus (NEW PRODUCT) from the operator's
> intent — there was no code to investigate yet beyond the P0 scaffold. Genuine unknowns are
> marked **❓ needs human input**.

**Last updated:** 2026-10-05 by Claude Code (Fable 5.1, Windows desktop, run from zeus) — P0 scaffold.
**Status:** in-development (P0 Foundation).
**Repo:** `intotheveil/hygieia` (public) · `D:\projects\hygieia` · **Deployed:** https://intotheveil.github.io/hygieia/ (GitHub Pages, from `main` via CI)

---

## 1. WHAT THIS IS (never-changes context — read first, every time)

**Hygieia (Υγίεια) is a bilingual Greek/English health, diet, recipe and workout tool.** The
operator's intent, verbatim: _"A greek/english bilingual tool about: Health Tips; Diets (giving
info of every type of diet — Atkins, paleo, low carb, keto, carnivore etc) and plan meals;
Recipes with tags per diet and also a function 'What's in my fridge' to propose you meals you can
make based on ingredients; price estimation of a meal; calories estimation of a meal; Work out
Types; recommend work out per type e.g. home – gym – calisthenics etc plus 3 different levels and
intensities."_ Named for the goddess of health and preventive wellbeing (source of "hygiene").

- **Product ⇄ repo:** Hygieia ⇄ `intotheveil/hygieia` (**public**, operator's choice, because
  GitHub Pages on this plan requires it).
- **Users:** Greek- and English-speaking people wanting practical food and training guidance.
- **Six modules** (`src/i18n/dictionary.ts` `MODULE_IDS`): tips · diets (+ meal plans) ·
  recipes (+ fridge) · cost · calories · workouts.
- **Working means:** both languages complete, informational (not medical advice), deployed.

## 2. ARCHITECTURE (the canonical technical truth — investigate ONCE, record here)

- **Stack:** React 19 + Vite 8 + TypeScript 6 (strict) + Tailwind 4 (`@tailwindcss/vite`, theme
  tokens in `src/index.css`: cream paper / olive ink / sage accent, light scheme); react-router-dom 7
  declarative `BrowserRouter`; Vitest 5 (jsdom) + Testing Library; ESLint 10 flat + Prettier.
  Configs lifted from Themis's P0 (the fleet reference), not the Vite template (zeus BRAIN §5).
- **i18n (ADR-0002):** `src/i18n/dictionary.ts` — `Dictionary` interface, `en` and `el` literals,
  `LANGS = ['el','en']`. `src/i18n/LangProvider.tsx` — context + `useLang()`; start language =
  stored (`localStorage` key `hygieia.lang`) else Greek browser → `el` else `en`; sets
  `document.documentElement.lang`. Pure helpers `initialLang` / `toLang` are unit-tested.
- **Routing:** `src/routes/routes.tsx` — `/` → `App`, `*` → `NotFound`; `basenameFrom(BASE_URL)`.
  Vite `base: '/hygieia/'`. SPA fallback: `vite.config.ts` `spaFallback` copies `index.html` →
  `404.html` at build (GitHub Pages has no rewrites).
- **Env / backend:** `src/lib/env.ts` is the ONLY reader of `VITE_SUPABASE_URL` /
  `VITE_SUPABASE_ANON_KEY`; `resolveAppEnv` never throws → `configured | local`. `src/lib/supabase.ts`
  `supabase` is **null** in local-only mode. **No Supabase project exists** (ADR-0001). The
  eslint config blocks server-only names and non-allow-listed `VITE_*` reads in `src/**`.
- **Env var NAMES** (`.env.example`): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`,
  `VITE_FLEET_URL`, `VITE_FLEET_KEY`, `VITE_FLEET_PRODUCT_ID` (telemetry, not wired yet).
- **CI/deploy:** `.github/workflows/deploy.yml` — `verify` (npm ci → lint → typecheck → test →
  build → upload-pages-artifact, Node 24) then `deploy` (actions/deploy-pages, main only).
  Pages `build_type=workflow`.
- **Commands:** `npm run dev | lint | typecheck | test | build | preview | format`.
- **Crew kit:** 7 hooks + 7 agents from `zeus/.zeus/kit/` via one-row manifest sync (row in
  `fleet.repos`); constitution composed by `kit.mjs`; `.claude/settings.json` from
  `settings.template.json`; `.claude/.no-greek-scan` present (Greek copy is product content).
- **Brand assets:** `public/favicon.svg` (hand-drawn heart-leaf mark). `public/brand/*.jpg` from the operator's local ComfyUI (RealVisXL V5, portable install `F:/AI/ComfyUI`); see §3.

## 3. CURRENT STATE (what's true RIGHT NOW — the thing a resuming session reads)

- **P0 scaffold built and proven locally (2026-10-05):** lint ✅ (0 errors, 4 fast-refresh
  warnings) · typecheck ✅ · **19 tests ✅** (4 files) · build ✅ (267 kB JS / 86 kB gzip,
  `404.html` byte-equal to `index.html`).
- **What's live:** the P0 SHELL — bilingual home page with six module cards each labelled
  "Coming / Έρχεται", a status box saying no module has content, language switch, not-found
  route. **No product content exists yet**; the page says so honestly (the Argus/Themis rule).
- **DEPLOYED 2026-10-05:** Pages enabled (`build_type=workflow`), CI run 37353201541 green; live URL 200
  with the Greek title, favicon 200, deep link served as `404.html`, bundle 200. Verified by HTTP only (no
  browser screenshot — the Chrome extension was not connected). Gate run directly:
  `SUBAGENT GATE (builder) scope: ran[secret-scan typecheck lint test] skipped[none]`; `verify-kit` → PASS.
- **Brand imagery landed (F3 closed):** `public/brand/og-hygieia.jpg` (Greek-salad table, `og:image`,
  1216×640) and `hero-plate(-sm).jpg` (salmon plate, hero `<img>` with `srcSet`), rendered on the operator's
  ComfyUI with RealVisXL V5. A workout render was rejected (merged objects).
- **In progress:** nothing. P0 is the handover point.
- **Next, in order:** (1) operator reviews `zeus/specs/HYGIEIA_SPEC.md` and answers its open
  questions; (2) `planner` turns it into PLAN.md on the §9 arc — P3 core slice is likely
  **Diets + Recipes with diet tags** (the data model everything else hangs off), with "What's in
  my fridge" as the first interactive feature; (3) decide when persistence starts (supersedes
  ADR-0001 → EU Supabase project).

## 4. OUTSTANDING (bugs · feedback · requests · known issues — the triage queue)

| id  | sev | type     | summary                                                                                                                                                                                      | status          | added      |
| --- | --- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- | ---------- |
| Q1  | 🟠  | question | ❓ Content source for diets, recipes, calories and prices: curated by hand, licensed dataset, or AI-generated with human review? Price estimation needs a Greek grocery price basis — which? | open (operator) | 2026-10-05 |
| Q2  | 🟠  | question | ❓ Accounts needed in v1 (saved plans, fridge lists) or anonymous/local-first? Decides when ADR-0001 is superseded                                                                           | open (operator) | 2026-10-05 |
| F1  | 🔵  | feature  | e2e runner (Playwright against the production build, Themis pattern) — "not defined yet" in §8; first milestone after P0                                                                     | open            | 2026-10-05 |
| F2  | 🔵  | feature  | Fleet telemetry (`VITE_FLEET_*`) — names reserved, client not wired                                                                                                                          | open            | 2026-10-05 |

## 5. GOTCHAS (hard-won "don't do X, it breaks Y" — the knowledge that dies in old chats)

- **A string added to `en` and not `el` (or vice versa) is a TYPE error** — on purpose (ADR-0002).
  Do not "fix" it by widening the type; add the translation.
- **Greek loanwords stay Latin:** keto, paleo, Atkins, calisthenics are written as-is in `el`.
  The dictionary test checks Greek SCRIPT is present in `el.heroTitle`, not in every string.
- **`@testing-library/react` `renderHook` is used for the provider tests** — a bare `useLang()`
  outside the provider must THROW; that test pins the error message (`within <LangProvider>`).
- **GitHub Pages serves `404.html` with status 404** for deep links; browsers render it normally.
  Do not replace the byte-copy fallback with a redirect — a future Supabase PKCE `?code=` would be lost.
- **The kit guard blocks Greek script by default.** `.claude/.no-greek-scan` disables only that
  rule. If a commit is refused for Greek, check the marker is present and tracked.
- **`npm test` takes ~30 s here** (jsdom environment start dominates). Not a hang.
- **Zeus-side (recorded in zeus BRAIN too):** the Vite react-ts template no longer matches the
  house stack (oxlint, no `strict`) — this repo's configs come from Themis instead.

## 6. CHANGELOG (append-only — what happened, newest first)

### 2026-10-05 — NEW PRODUCT: Hygieia created greenfield (Zeus, Fable 5.1)

- Did: name proposed (Hygieia; alternatives Demeter, Hestia, Asclepius) and confirmed by the
  operator; repo `intotheveil/hygieia` created **public**; house-stack scaffold (Themis configs);
  bilingual P0 shell + 19 tests; CI + Pages workflow; crew kit from named sources (one-row sync,
  hooks + agents `all match`, `kit.mjs init → fill → apply`); `BRAIN.md`, `DECISIONS.md`
  (ADR-0001 Pages/no Supabase, ADR-0002 typed bilingual dictionary), `BUILD_LOG.md`, `README.md`.
- Decided: Greek is the default language; six modules as the product map; no i18n library in P0.
- Resolved: F3 (brand imagery) the same session.
- Left off: deployed and verified (§3); operator answers the spec questions (Q1, Q2) next.

## 7. DECISIONS (dated ADR-lite — the "why", so it's never re-litigated)

- **2026-10-05 ADR-0001:** public repo + GitHub Pages, no Supabase project yet — P0 persists
  nothing; create an EU project when a phase needs it. (`DECISIONS.md`)
- **2026-10-05 ADR-0002:** bilingual by type (one `Dictionary`, two literals), no i18n library in
  P0 — a missing translation must be a compile error. (`DECISIONS.md`)
- **2026-10-05:** Greek is the default language (`lang="el"`), English for everyone else; a
  stored choice wins — the operator and first users are Greek-speaking.

## 8. TELEMETRY FIX LEDGER (every production error we've closed — keyed by fingerprint)

> On ANY new error, grep this table for its `fingerprint` FIRST. Status: `watching (until <date>)`
> → `solved (<date>)` after 7 silent days post-deploy. Telemetry is not wired yet (F2).

| fingerprint | error (short) + URL/count | first seen | root cause | fix commit | deployed | status | if it recurs → start here |
| ----------- | ------------------------- | ---------- | ---------- | ---------- | -------- | ------ | ------------------------- |
