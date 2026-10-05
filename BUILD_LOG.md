# BUILD LOG — Hygieia (`hygieia`)

The crew's trail: what was attempted, what passed, what's blocked, what's next. Newest first.
The human reads this first on return (CLAUDE.md §5).

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
