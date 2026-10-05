# BUILD LOG — Hygieia (`hygieia`)

The crew's trail: what was attempted, what passed, what's blocked, what's next. Newest first.
The human reads this first on return (CLAUDE.md §5).

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
