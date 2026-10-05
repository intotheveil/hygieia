# BUILD LOG — Hygieia (`hygieia`)

The crew's trail: what was attempted, what passed, what's blocked, what's next. Newest first.
The human reads this first on return (CLAUDE.md §5).

## 2026-10-05 — P3.6 Playwright e2e harness on the PRODUCTION build, Pages semantics — DONE (builder, worktree `wt/f`; not yet committed)

**Pulled forward** by the lead (P3.5's header/nav does not exist yet), so the smoke spec asserts the
CURRENT shell: Greek hero on `/hygieia/`, the language toggle, the in-app not-found on a deep link,
`/hygieia/auth`'s sign-in-unavailable state, the PWA manifest/`registerSW.js` links. Every string is
asserted against the dictionary VALUE (`import { el, en } from '../../src/i18n/dictionary'`), never a literal.

**Delivered:** `playwright.config.ts` (one `local` project; `webServer` = `npm run build && node e2e/support/pages-server.mjs --port 4173 --root dist --base /hygieia`,
or just the server when `E2E_PREBUILT=1`; `reuseExistingServer: false`; `baseURL = http://127.0.0.1:4173/hygieia/`; build env blanks
`VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` so the artifact is local-only; `locale: 'el-GR'` so `LangProvider` picks Greek) ·
`e2e/support/pages-server.mjs` (Themis lifted verbatim + `--base`: a request must start with the base, which is stripped and served from
`dist/`; `/hygieia` → 301 `/hygieia/`; OUTSIDE the base → plain-text 404, never this site's `404.html`, because on Pages that URL
belongs to another site, so the app must not boot there; exported `normalizeBase`) · `e2e/support/fixtures.ts` (console/page-error
watchdog, verbatim; filters only the DOCUMENT's own 404) · `e2e/support/tsconfig.json` (verbatim; the spec's dictionary import rides the
import graph) · `e2e/local/smoke.spec.ts` (**7 tests**: Greek shell + `lang="el"`; toggle → `en.heroTitle` + `lang="en"` + survives reload;
`en-US` browser gets English; deep link `/hygieia/no/such/page` is a 404 DOCUMENT rendering `el.notFoundTitle`, URL untouched, `backHome`
works; `/hygieia/auth` 404 document → `el.signInUnavailableTitle`; manifest link + `registerSW.js` + manifest `start_url`/`scope`;
server semantics: `/hygieia/404.html` body === `/hygieia/index.html` body, `/hygieia` 301 → `/hygieia/`, `/no/such/page` 404 without
the app) · `package.json` (`"e2e": "tsc -p e2e/support/tsconfig.json && playwright test --project=local"`, devDep `@playwright/test ^1.63.0`
= Themis; `package-lock.json` follows) · `.github/workflows/deploy.yml` (after `check:pwa`: Playwright version step, `~/.cache/ms-playwright`
cache, `npx playwright install --with-deps --only-shell chromium`, `E2E_PREBUILT=1 npm run e2e` with a 5-min timeout, `test-results/`
upload on failure; job timeout 15 → 20 min) · `.gitignore` (`playwright-report/`, `test-results/`, `blob-report/`) ·
`.claude/CLAUDE.project.md` §2 Tests line + §8 `e2e: npm run e2e` (**NOT recomposed** — the kit manifest resolves the MAIN checkout,
not this worktree; the lead runs `node D:/projects/zeus/.zeus/kit/kit.mjs apply hygieia` after merging).

**Scope deviation (flagged, one line):** `vite.config.ts` `test.exclude` gained `'e2e/**'` — Vitest's default include is
`**/*.spec.ts`, so without it `npm test` collects the Playwright spec and goes red (Themis carries the same exclude). Nothing else in
that file changed (the format hook's whole-file rewrap was reverted to HEAD formatting).

**Gotchas learned (for BRAIN §5, lead to record):** (1) `baseURL` ends in `/hygieia/`, but `page.goto('/x')` resolves against the
ORIGIN (URL semantics) → `http://127.0.0.1:4173/x`, OUTSIDE the site. Specs spell the base: `page.goto('/hygieia/recipes')`.
(2) Client-side `<Link to="/">` under `basename="/hygieia"` lands on `/hygieia` (no trailing slash) — correct router behaviour; a hard
load of it is Pages' 301 to `/hygieia/`. Assert the home route with `/hygieia/?$`. (3) Playwright's default `Desktop Chrome` locale is
`en-US`, and `LangProvider` reads `navigator.language` → the project sets `locale: 'el-GR'` to see the Greek shell first.

**Gates (2026-10-05, worktree `D:/projects/hygieia-wt/f`):** `npm run lint` 0 errors (5 pre-existing react-refresh warnings) ·
`npm run typecheck` clean · `npm test` 16 files / 263 tests green (e2e dir excluded) · `npm run build` green, `cmp dist/404.html dist/index.html`
byte-equal · `check:pwa OK — Hygieia · Υγίεια, 3 icons, sw.js present` · `npm run e2e` → `pages-server: serving …\dist at
http://127.0.0.1:4173/hygieia/ (Pages semantics)`, **7 passed**, 0 console/page errors (the watchdog would have failed the test) ·
workflow YAML parses (js-yaml), prettier-clean.

**RED-verification (the gate seen failing):** `rm dist/404.html; E2E_PREBUILT=1 npm run e2e` → **3 failed / 4 passed**: the not-found
deep link and `/hygieia/auth` (`element(s) not found` — the app never booted on the plain-text 404) and the server-semantics test
(`/hygieia/404.html` no longer equals `index.html`); the three root-document tests still pass, as they should. `npm run e2e` (rebuild) →
7 passed; `404.html` byte-equal again.

**Runnable artifact exercised:** `pages-server.mjs --base /hygieia` observed serving `dist/` at `/hygieia/` (log line above); `/hygieia`
→ 301 `Location: /hygieia/`; `/no/such/page` → 404 plain text; `/hygieia/no/such/page` → 404 + app (`el.notFoundTitle`) — all asserted in spec 7/4/5.

**Next:** lead merges `wt/f`, runs `kit.mjs apply hygieia` (recompose), records gotchas 1–3 in BRAIN §5; CI shows the e2e step on the first
push; P3.7 adds `recipes.spec.ts`/`fridge.spec.ts` on this harness; `G3 = G1 && npm run e2e` is now live.

## 2026-10-05 — P4.9 (content half) health tips seed — DONE (builder, worktree `wt/f`; not yet committed)

**Pulled forward** by the lead: the seed depends only on the P1.4 types (`HealthTipSeed`,
`TIP_TOPICS`, `SLUG_RE`). The `/tips` page, `gen-seed-sql.mjs` kind `health_tips`, the SQL seed
migration, `catalogue.mjs`, routes/header and dictionary keys are the OTHER half of P4.9 and come later.

**Delivered:** `src/content/seed/tips.ts` (`export const HEALTH_TIPS: readonly HealthTipSeed[]`) and
`src/content/seed/tips.test.ts`. Nothing else touched.

**Volume (operator: "as many as you can"; floor 30, target 60+, ≥ 8 per topic):** **75 tips** —
sleep 12 · hydration 12 · nutrition 14 · movement 13 · habits 12 · mental 12. Slugs are
`<topic>-<kebab>` (test enforces the prefix).

**Sources (PLAN.md §0 content drafting rule — the one that matters most here):** **58 with
`source_url`, 17 `needs_source = true`.** URLs were set ONLY for pages the drafter has actually seen
and is confident are stable: WHO fact sheets ×12 (physical-activity, healthy-diet, salt-reduction,
alcohol, depression), NHS ×14 (live-well eat-well / exercise / sleep / quit-smoking / sun safety /
hand-washing / teeth, conditions vitamin-d, mental-health self-help), Mayo Clinic `art-*` ×19,
Harvard Nutrition Source ×6, Sleep Foundation ×5, EFSA topic pages ×2. Anything less than certain
(morning daylight, urine colour, bottle habit, older-adult schedule, alcohol+water, drink with
meals, ultra-processed, enjoyable activity, know-your-numbers, habit stacking, cook at home,
20-20-20, meal planning, nature time, news limits, gratitude, worry list) is `null` + `needs_source`
→ "Source pending review" in the UI. CDC and NIH were deliberately NOT cited: CDC restructured its
paths in 2024 and I was not certain of the new ones, so null beat a guess (CLAUDE.md §5). Each
topic has ≥ 1 sourced tip. All guidance is mainstream public health (WHO 150–300 min/week, strength
2×/week, < 5 g salt, < 10 % free sugars, 400 g fruit/veg, EFSA 2.0/2.5 L water and 400 mg
caffeine, 7–9 h sleep, hand-washing 20 s, SPF 30…); no cures, no supplement claims, no diagnosis.
Greek drafted natively (not literal translation); Greek-local framing where it helps (summer heat,
small oily fish, λαδερά, tap water).

**Test (`tips.test.ts`, 13 cases, logs the actual count):** count ≥ 30 · each topic ≥ 4 · topic ∈
`TIP_TOPICS` · unique `SLUG_RE` slugs with topic prefix · locale pairs non-blank · titles ≤ 80 ·
Greek script in `title_el`/`body_el` · bodies 2–4 sentences in both languages · no duplicate titles ·
`source_url` null or `^https?://`, parses as a URL, never contains `example.com` / `placeholder` /
`TODO` / `xxx` · **every URL host is on the in-test allow-list** (who.int, nhs.uk, cdc.gov,
hsph.harvard.edu, efsa.europa.eu, mayoclinic.org, sleepfoundation.org, nih.gov — suffix match) ·
`needs_source === (source_url === null)` on every row · ≥ 1 sourced tip per topic.

**Gates (in `wt/f`):** `npm run lint` 0 errors (4 pre-existing react-refresh warnings, none in
`src/content`) · `npm run typecheck` clean · `npm test` 9 files / 89 tests green (76 → 89) ·
`npm run build` green (PWA precache 24 entries) · `check:pwa OK — Hygieia · Υγίεια, 3 icons,
sw.js present` · Prettier clean on both files.

**Next (other half of P4.9):** `TipsPage.tsx` grouped by topic, dictionary keys (`tipsTitle`,
`topics.*`, `sourcePending`, `readSource`), `gen-seed-sql.mjs` kind `health_tips` +
`20261006001000_hygieia_seed_tips.sql`, `catalogue.mjs`, `db:gate` `health_tips ≥ 30`,
`e2e/local/tips.spec.ts`. An admin reviewing the 17 `needs_source` rows can attach a URL in P4.10.

## 2026-10-05 — P3.3 / P4.1 / P4.2 pure-domain engines — DONE (builder, worktree `wt/d`; not yet committed)

**Pulled forward from P3/P4** by the lead: the three modules depend only on the P1.4 types
(`IngredientSeed`, `RecipeSeed`, `Unit`), not on the seed data (P1.9–P1.11 still pending), so they
were built in parallel with the rest of P1. Tests use small hand-written fixtures typed as the seed
types; the UI tasks (P3.4, P4.3) wire them to real content. No React, no I/O, no rounding anywhere —
the display rounds.

### P3.3 Fridge matcher — `src/fridge/match.ts` + `match.test.ts`

- `matchRecipes(recipes, ingredients, haveSlugs, { ignorePantryStaples })` → ranked
  `{ recipe, have, missing, coverage, substitutions, unknown }[]`; `matchRecipe` (one recipe, never
  dropped) and `indexBySlug` exported for the UI.
- Covered-by-substitute (a `substitute_slugs` entry the user has AND that resolves in the catalogue)
  counts in the numerator and is REPORTED in `substitutions`; it is NOT put in `have` or `missing`,
  so "you have 4/5 · feta → use ricotta" is honest. Coverage = (have + substitutions) / (have +
  substitutions + missing).
- `ignorePantryStaples`: a staple the user LACKS leaves the denominator and `missing`; a staple the
  user HAS still counts (the literal reading of the task; recorded here so P3.4 copy matches).
- Unknown `ingredient_slug` → ignored for matching, listed in `unknown`. Duplicate lines for one slug
  count once. Coverage 0 dropped; empty fridge → `[]`.
- Order: coverage desc → fewer missing → fewer ingredient lines → `title_en` (code-point compare, not
  `localeCompare`, so every machine agrees) → slug. Total order ⇒ deterministic; test shuffles input.
- `normalizeForSearch(s)`: NFD, strip `\p{M}`, lower-case, fold final sigma `ς→σ`, collapse
  whitespace. `'Ντομάτα'` → `'ντοματα'`; `'σαλάτα'` ≡ `'σαλατα'`; `'Crème Fraîche'` → `'creme fraiche'`.
- 19 tests.

### P4.1 Nutrition engine — `src/nutrition/compute.ts` + `compute.test.ts`

- `computeNutrition(recipe, ingredientsBySlug: ReadonlyMap)` → `{ perRecipe, perPortion, portions,
unknown, warnings, confidence: 'typical', sourceNotes }`; helpers `gramsFor`, `lineGrams`,
  `safePortions` exported.
- Grams per line = `quantity × (1 for g/ml, else grams_per_unit)`; ml is treated as g (density 1).
  Totals = Σ grams/100 × per-100 g. A line unit that is neither g/ml nor the ingredient's own unit
  still uses `grams_per_unit` and adds a `unitMismatch: <slug> …` string to `warnings`.
- `sourceNotes` = distinct `source_note` values in first-seen order (the P4.3 footnote).
- Division guard: `safePortions` = finite ? `max(1, p)` : 1 (portions ≥ 1 by type; guarded anyway).
- 13 tests incl. a hand-computed 2-ingredient recipe to 0.1 kcal, `piece` × `grams_per_unit`, Atwater
  4/4/9 within 10 % on the fixture, no-rounding proof, empty recipe → zeros not NaN.

### P4.2 Cost engine — `src/cost/compute.ts` + `compute.test.ts`

- `computeCost(recipe, ingredientsBySlug)` → `{ perRecipe: {min,max}, perPortion, portions, asOf,
unpriced, lines: {slug,min,max}[] }`; `basisQuantity`, `safePortions` exported.
- Basis: `kg`/`l` → grams (ml 1:1) / 1000; `piece` → the quantity when the line unit is `piece`, else
  grams / `grams_per_unit`. Unpriced (listed, excluded from the range, never zeroed): unknown slug,
  `price_eur_max` not a finite number > 0, or basis underivable (`grams_per_unit` 0, NaN quantity).
- `asOf` = OLDEST `price_as_of` among PRICED lines (ISO dates compare lexicographically); null when
  nothing is priced; an unpriced line's date never leaks in.
- 13 tests incl. the known 3-line recipe (1.59..2.61 €), oldest-date rule, ml→l, weight→pieces.

**Gates (G0, worktree `D:/projects/hygieia-wt/d`):** Prettier clean on the three dirs · lint 0 errors
(4 pre-existing `react-refresh` warnings, none in new files) · typecheck clean · `vitest run`
8 files / 76 tests green (31 → 76) · build green (PWA precache 24 entries) ·
`check:pwa OK — Hygieia · Υγίεια, 3 icons, sw.js present`.

**Deviations from the plan text:** none in behaviour. Additions beyond the stated shape, all additive:
`unknown` (matcher, nutrition), `warnings` (nutrition), `portions` and `lines` (cost), exported
helpers. `ingredientsBySlug` is a `ReadonlyMap` (build it with `indexBySlug`); P3.4/P4.3 decide
whether a shared index lives in `src/content/`.

**Next:** P3.4 Fridge UI and P4.3 panels consume these once P1.9–P1.11 seeds exist.
## 2026-10-05 — P2 Auth & tenancy (in progress; PLAN.md §P2) — lane E, pulled forward ∥ P1

### P2.1 Auth provider + session helpers — DONE (builder, worktree `wt/e`; not yet committed)

**Landed:** one place that knows whether there is a session, who it is, and whether auth exists at all.

- `src/auth/session.ts` — pure: `AuthState` (`unavailable | loading | anonymous | signed-in`),
  `userFromSession`, `stateFromSession`, `reduceAuthEvent(prev, event, session)` (`unavailable` is
  absorbing; `SIGNED_OUT` → anonymous; every other event reads its session), plus the redirect plumbing
  shared with P2.2: `callbackUrl(origin, baseUrl)`, `safeNextPath` (open-redirect guard: in-app paths
  only), `storeNext`/`takeNext` over an injected storage (try/catch, default `/`).
- `src/auth/AuthProvider.tsx` — `AuthProvider({ client? })` defaults to the app client; `null` →
  `unavailable` from the first render with no `window`/storage access. Otherwise subscribes
  `onAuthStateChange` FIRST, then seeds from `getSession()` only while still `loading` (an event that
  lands before the snapshot is never overwritten). Context = `{ state, client, signOut }`;
  `useAuth()` throws `useAuth must be used within <AuthProvider>` outside the provider.
- `src/main.tsx` — `<AuthProvider>` wraps the router inside `<LangProvider>`.
- `src/auth/fake-client.ts` — test double (auth methods + `profiles` table) shared by the auth tests;
  imported only from `*.test.*`, verified absent from `dist/assets/*.js`.
- Tests: `session.test.ts` (9), `AuthProvider.test.tsx` (7): null client → unavailable and
  `Storage.prototype.getItem/setItem` never called; persisted session → signed-in before any event;
  `SIGNED_IN` → signed-in with id; `SIGNED_OUT` → anonymous; early event beats late snapshot; signOut
  delegates + unmount unsubscribes; outside-provider throw pinned; `CLIENT_OPTIONS` still
  `persistSession: true, detectSessionInUrl: true, flowType: 'pkce'`.
- `package.json` NOT touched (no new deps; the plan's reservation was unused). `src/lib/supabase.ts`
  NOT touched (`db.schema` pin is P1.13's).

### P2.2 Sign-in page + PKCE callback route — DONE (builder, `wt/e`; not yet committed)

- `src/auth/SignInPage.tsx` (`/auth`): email magic link via `signInWithOtp({ email, options:
  { emailRedirectTo } })`, "Continue with Google" via `signInWithOAuth({ provider: 'google', options:
  { redirectTo } })`; redirect = `window.location.origin + import.meta.env.BASE_URL + 'auth/callback'`
  (never hardcoded). `?next=` parked in `sessionStorage` (`hygieia.auth.next`) before leaving, off-site
  values dropped. States: form → `sending` → `sent` (`role=status`) or `failed` (`role=alert`);
  `unavailable` renders the bilingual "Sign-in unavailable" state; `signed-in` shows the email + sign-out.
- `src/auth/CallbackPage.tsx` (`/auth/callback`): never touches the URL (the client exchanges `?code=`
  itself via `detectSessionInUrl`; Pages serves this deep link as the 404.html byte copy). Shows
  `callbackWorking`; on `signed-in` → `navigate(takeNext(), { replace: true })`; `callbackFailed` + link
  to `/auth` when the URL carries `error`/`error_description`, when there is no client, or when no
  session arrives within `timeoutMs` (prop, default 15 s; tests use 20 ms).
- `src/routes/routes.tsx` — two routes appended before `*`. `src/i18n/dictionary.ts` — 13 keys appended
  to the interface and BOTH literals under `// auth (P2)`: `signIn, signInIntro, signInEmailLabel,
  signInSendLink, signInLinkSent, signInGoogle, signInUnavailableTitle, signInUnavailableBody,
  signInFailed, signOut, callbackWorking, callbackFailed, backToSignIn` (natural Greek; parity test green).
- Tests: `SignInPage.test.tsx` (12): OTP called with the email and a redirect ending `/auth/callback`,
  then "link sent"; Google → `provider: 'google'` + same redirect; safe `?next=` stored / `//evil.example`
  not; OTP error → `signInFailed`; unavailable copy in `en` and `el`; signed-in → sign-out; callback:
  working → navigates to stored next (storage cleared) / defaults to `/`; URL error → failed immediately
  with link `/auth`; timeout → failed; null client → failed. `App.test.tsx` untouched and green (routes
  without `AuthProvider` still render `/` and `*`).

### P2.3 Profile bootstrap + `useProfile()` + admin runbook — DONE (builder, `wt/e`; not yet committed)

- `src/auth/profile.ts` — `ensureProfile(client, user)`: select `user_id, display_name, is_admin` from
  `profiles` where `user_id = eq(uid)` (`maybeSingle`); when absent, ONE insert `{ user_id, display_name:
  email local-part | 'user' }` — `ProfileInsert` has no `is_admin` member, so sending it is a type error.
  `profileClientFor(HygieiaClient)` is a thin typed adapter: a direct structural assignment of the real
  client to the small `ProfileClient` interface hits TS2589 (Supabase's query-builder generics); the
  adapter pins the exact chain and the compiler still checks it against the real client (no cast).
  `useProfile()` → `{ status: idle | loading | ready | error, profile, isAdmin }`; idle/loading are
  DERIVED (`react-hooks/set-state-in-effect` forbids synchronous setState in the effect body), only the
  async outcome is state, keyed by uid. Table name unqualified (schema pin is P1.13's).
- `docs/ops/admin.md` — operator runbook: grant / revoke / verify SQL for `hygieia.profiles.is_admin` by
  email, SQL editor or Management API only (never a migration), "must have signed in once first", and what
  it does not do. Email grep over `src/` and `docs/` → no real address.
- Tests: `profile.test.ts` (7): `displayNameFor`; existing row → no insert; missing → exactly one payload
  `{ user_id, display_name }` and `not.toHaveProperty('is_admin')`; select error → throws, no insert;
  hook idle without session / in local-only; `isAdmin` true only when the row says so (admin row, plain
  row, fresh insert); DB refusal → `error`.

**Gates (G0, worktree `wt/e`, 2026-10-05):** lint 0 errors (5 warnings: the 4 pre-existing react-refresh
ones + the same warning on `useAuth` in `AuthProvider.tsx`, mirroring `useLang`) · typecheck clean ·
`vitest run` 9 files / 67 tests green (31 → 67) · build green (24 precache entries, `dist/404.html`
byte-equal to `index.html`) · `check:pwa OK — Hygieia · Υγίεια, 3 icons, sw.js present` · Prettier clean on
every touched file. G1 (`db:*`) is not runnable in this lane (P1 scripts land in another worktree).

**Not exercised live (needs OPERATOR-P2):** the real magic-link / Google round trip against the shared
project; `https://intotheveil.github.io/hygieia/auth/callback` must be on the project's redirect
allow-list (ADR-0003 rule 6). P2.QA owns that observable.

**Decision candidates for DECISIONS.md / BRAIN §7 (lead to route — outside this lane's file scope):**
(a) the `?next=` return path lives in `sessionStorage` under `hygieia.auth.next` and accepts in-app paths
only; (b) `profileClientFor` adapter instead of a structural client type or a cast; (c) callback failure
is timeout-based (15 s default, injectable) because the client exposes no "exchange failed" event.

**Next:** P2.4 `UserDataSource` and P2.5 (`RequireAdmin` + header sign-in state) consume `useAuth()`,
`useProfile()` and the `signOut` key. Merge order with P1.13 (schema pin in `src/lib/supabase.ts`) is
free — this lane never touched that file.

## 2026-10-05 — P1 Data spine (in progress; PLAN.md §P1)

### P1.9 Seed content: ingredients — DONE (builder, worktree `wt/b`; not yet committed)

**Landed:** `src/content/seed/ingredients.ts` — `export const INGREDIENTS: readonly IngredientSeed[]`,
**322 ingredients** (floor 160, target 250+), plain data grouped by category with a comment header per
group, Prettier-clean; and `src/content/seed/ingredients.test.ts` (20 Vitest cases).

**Category breakdown (16 categories):** vegetables 44 · fruit 29 · legumes 18 · grains-bread 18 ·
pasta-rice 10 · dairy-eggs 33 · meat 23 · poultry 10 · fish-seafood 23 · nuts-seeds 17 · oils-fats 8 ·
herbs-spices 25 · condiments 15 · sweeteners 11 · beverages 14 · pantry 24. Pantry staples: 25.
Rows with ≥ 1 substitute: 262 (every substitute resolves; none self-referential).

**Content rules applied (PLAN.md §0 drafting rule, §2 `ingredients` row):** `name_el` Greek script on
every row (loanwords transliterated: κινόα, τόφου, κέιλ, σκυρ, τέμπε — the test's Latin allow-list is
empty); nutrition per 100 g edible portion, `source_note` = `'Typical values, USDA FoodData Central
reference ranges'` verbatim on every row; `unit` = natural recipe unit with `grams_per_unit` (egg 50,
lemon 100, onion 150, clove 3, tbsp olive oil 13.5, tsp salt 6, slice bread 30, bunch parsley 60);
prices as typical Greek supermarket ranges, `price_as_of: '2026-10-05'`, `price_note` naming the basis.
Diet coverage asserted by test: Mediterranean (olive oil, feta, Greek yoghurt, Kalamata olives, oregano,
lemon, tahini, halloumi, trahana, fava, horta, octopus, sardines, anchovies), keto/low-carb (butter,
cream, avocado, almond flour, cauliflower, zucchini), carnivore (steak, liver, kidney, heart, bone marrow,
lard, tallow), vegan (tofu, tempeh, seitan, soy mince, lentils, chickpeas, oat milk, nutritional yeast,
pea protein), paleo (sweet potato, nuts, eggs).

**Test (`ingredients.test.ts`):** count ≥ 160 (logs `INGREDIENTS count: 322`); unique `SLUG_RE` slugs;
names non-blank; Greek script unless allow-listed (allow-list entries must exist); no duplicate names
in either language; macros ≥ 0 and sum ≤ 100; kcal 0..900; **Atwater 4/4/9 sanity check** (±25 % or
±20 kcal; explicit, reasoned exemptions: sugar alcohols, alcohol, fibre-dominated spices/cocoa/psyllium,
baking powder); `source_note` exact; `unit ∈ UNITS`, `grams_per_unit > 0`, g/ml rows weigh 1;
`0 ≤ price_min ≤ price_max`, `price_per ∈ PRICE_PER`; `price_as_of` ISO + parses; `price_note` names a
basis; substitutes resolve, non-self, no duplicates, ≥ 100 rows carry one; every category ≥ 3 rows and
≥ 10 categories; ≥ 12 staples including salt/pepper/water/olive-oil/vinegar/oregano; diet-staple
presence; compile-time `readonly IngredientSeed[]`.

**RED proof (§5 "running the real thing"):** sabotaged one substitute (`no-such-slug`) and one macro
sum (sugar carbs 101) → exactly 2 failures naming the rows (`tomato → no-such-slug does not resolve`,
`sugar macro sum 101`); regenerated → 20/20 green. Node type-stripping import (what P1.12's generator
does): `node -e "import('./src/content/seed/ingredients.ts')"` → `node-import OK 322`.

**Non-obvious choices (for DECISIONS.md / BRAIN §7 — lead to record; out of this task's file scope):**

- Lard and tallow are 902 kcal/100 g in USDA; the schema caps `kcal_100g` at 900, so both carry 900
  (documented in the file header). Everything else is unrounded typical values.
- Items sold by the bunch/head/cube/sheet/1 g sachet use `price_per: 'piece'` and the `price_note`
  names the basis ("… per bunch"), since `PRICE_PER` has only kg / l / piece.
- Nutrition is for the state named in `name_en` (dry legumes/grains/pasta, raw meat/fish, drained
  canned goods, brewed beverages). Recipes (P1.11) must scale from these, not cooked weights.
- Seed import path is `'../types.ts'` (explicit extension), matching `types.ts → './enums.ts'`, so
  `scripts/*.mjs` can import the module under node's type stripping without a resolver.

**Gates (G0, in `D:/projects/hygieia-wt/b`):** lint 0 errors (4 pre-existing `react-refresh` warnings
in `App.tsx`/`routes.tsx`, none in `src/content`) · typecheck clean · `vitest run` 6 files / 51 tests
green (31 → 51) · build green (PWA precache 24 entries) · `check:pwa OK — Hygieia · Υγίεια, 3 icons,
sw.js present` · Prettier check clean on `src/content/seed/`.

**Next:** P1.10 diets (∥ B), P1.11 recipes use these slugs; P1.12 generates
`20261006000500_hygieia_seed_ingredients.sql` from this module (gate asserts ≥ 160 → will see 322).

### P1.4 Content domain types, enums and slugs — DONE (builder; not yet committed)

**Landed:** the TS contract for every seed module, migration and UI (PLAN.md §2), front-loaded for
P1.6/P1.9–P1.13.

- `src/content/enums.ts` — every runtime value: `UNITS` (8), `PRICE_PER` (3), `WORKOUT_TYPES` (7),
  `LEVELS`, `INTENSITIES`, `BLOCKS` (3 each), `MEAL_TYPES` (4), `TIP_TOPICS` (6), `CONTENT_STATUSES`
  (3) as `as const` arrays with derived unions; `SLUG_RE`; `CONTENT_TABLES` (6), `CHILD_TABLES` (3),
  `USER_TABLES` (3).
- `src/content/types.ts` — type-only: `Localized<K, T>` (`{ x_el, x_en }` pair), `ReviewColumns`,
  the six `*Seed` types (no `id`/`status`/review/timestamps; children refer by slug) and `*Row` =
  seed + `ReviewColumns`; `RecipeLineSeed`, `WorkoutBlockSeed`.
- `src/content/types.test.ts` — 12 cases: each enum array literal (length + order), no duplicates,
  `SLUG_RE` accept/reject set, table lists disjoint, compile-time `satisfies`/`expectTypeOf` proofs
  that a seed has no `id`/`status` and a row does.

**Why runtime values live in `enums.ts` only:** `scripts/*.mjs` (seed generator, PGlite gate) import
these modules under node's type stripping; `types.ts` erases to zero exports. Verified:
`node -e "import './src/content/enums.ts'"` on node v24.11.1 → `node-import OK 8 true 6`, 0 exports
from `types.ts`. Erasable syntax only (no `enum`/`namespace`/parameter properties).

**Gates (G0):** lint 0 errors (4 pre-existing warnings, none in `src/content`) · typecheck clean ·
`vitest run` 5 files / 31 tests green (19 → 31) · build green (PWA precache 24 entries) ·
`check:pwa OK — Hygieia · Υγίεια, 3 icons, sw.js present` · Prettier clean.

**Next:** P1.6 contract test must assert the migration CHECK literals equal these arrays.
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
