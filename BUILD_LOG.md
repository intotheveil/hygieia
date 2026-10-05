# BUILD LOG — Hygieia (`hygieia`)

The crew's trail: what was attempted, what passed, what's blocked, what's next. Newest first.
The human reads this first on return (CLAUDE.md §5).

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
