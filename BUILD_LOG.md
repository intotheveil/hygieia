# BUILD LOG — Hygieia (`hygieia`)

The crew's trail: what was attempted, what passed, what's blocked, what's next. Newest first.
The human reads this first on return (CLAUDE.md §5).

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

## 2026-10-05 — P1 Data spine (in progress; PLAN.md §P1)

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
