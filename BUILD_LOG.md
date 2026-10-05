# BUILD LOG — Hygieia (`hygieia`)

The crew's trail: what was attempted, what passed, what's blocked, what's next. Newest first.
The human reads this first on return (CLAUDE.md §5).

## 2026-10-05 — P1 Data spine (in progress; PLAN.md §P1)

### P1.10 Seed content: diets (16, EL+EN) — DONE (builder, worktree `wt/c`; not yet committed)

**Landed:** `src/content/seed/diets.ts` exporting `DIETS: readonly DietSeed[]` (plus the shared
caution strings `ASK_DOCTOR_EL` / `ASK_DOCTOR_EN`) and `src/content/seed/diets.test.ts`. Operator
asked for "as many as you can" over the plan's eight; 16 shipped. Every entry has both languages on
the same row (PLAN.md §1.2), equal-length `*_el`/`*_en` arrays, 6–9 allowed/avoided, 3–5 pros/cons
(evidence quality and practicality stated honestly), and ≥ 2 `avoid_if` entries, the first always the
pregnant/breastfeeding · medical treatment · diagnosed condition → ask a doctor or dietitian sentence,
followed by diet-specific cautions (kidney disease for high-protein/Atkins/paleo, T1D + SGLT2 for
keto, eating-disorder history for fasting/Whole30/carnivore/vegan, "do not cut gluten before testing"
for gluten-free, "needs an IBS diagnosis, short-term, dietitian-guided" for low-FODMAP).

| slug                   | source_url                                                    |
| ---------------------- | ------------------------------------------------------------- |
| `mediterranean`        | Harvard T.H. Chan Nutrition Source — diet review              |
| `dash`                 | NIH/NHLBI — DASH eating plan                                  |
| `flexitarian`          | null                                                          |
| `pescatarian`          | null                                                          |
| `vegetarian`           | NHS — the vegetarian diet                                     |
| `vegan`                | NHS — the vegan diet                                          |
| `paleo`                | Harvard T.H. Chan Nutrition Source — diet review              |
| `low-carb`             | Mayo Clinic — low-carb diet                                   |
| `keto`                 | Harvard T.H. Chan Nutrition Source — diet review              |
| `atkins`               | null                                                          |
| `carnivore`            | null                                                          |
| `intermittent-fasting` | Harvard T.H. Chan Nutrition Source — diet review              |
| `whole30`              | null                                                          |
| `gluten-free`          | Harvard T.H. Chan Nutrition Source — gluten                   |
| `high-protein`         | null                                                          |
| `low-fodmap`           | Monash University FODMAP (the diet's originating institution) |

10 of 16 carry a URL; the six nulls are patterns with no single authoritative page I was certain of
(PLAN.md §0: never invent a source — null over a guess). Nordic and Zone were considered and skipped
to keep the set at diets I could describe accurately and even-handedly. Greek loanwords (keto,
paleo, Atkins, Whole30, DASH, FODMAP, flexitarian, pescatarian, vegan) stay Latin-script in `el`;
`whole30` is the one `name_el` without Greek script (brand name) and is allow-listed in the test.

**Test (83 cases):** count ≥ 8 and the eight mandatory slugs present; unique slugs matching
`SLUG_RE`; per diet: `name`/`summary` non-blank both languages; every array pair equal length and
≥ minimums (6/6/3/3/2) with no blank entry; both `avoid_if` arrays contain the doctor/dietitian key
phrase; `source_url` null or `^https?://` without `example.com`/`placeholder`/`TODO`; `name_el`
Greek-script unless allow-listed. **Mutation proof:** deleting one diet's `ASK_DOCTOR_EN` turned
exactly two cases red (`avoid_if: el 2 vs en 1` and the caution check); restored → 83/83.

**Gates (G0, in `D:/projects/hygieia-wt/c`):** lint 0 errors (same 4 pre-existing warnings, none in
`src/content`) · typecheck clean · `vitest run` 6 files / 114 tests green (31 → 114) · build green
(PWA precache 24 entries) · `check:pwa OK — Hygieia · Υγίεια, 3 icons, sw.js present` · Prettier
unchanged on both files.

**Deviation from PLAN.md P1.10 acceptance, by the operator's instruction:** the plan says "exactly 8";
the test asserts ≥ 8 plus the eight named slugs. P1.12's gate line `diets = 8` and P1.13's
`listDiets` ≥ 8 should read **16** when those tasks land (lead to adjust).

**Next:** P1.11 recipes tag `diet_slugs` against these 16; P1.12 generates `…000600_hygieia_seed_diets.sql`.

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
