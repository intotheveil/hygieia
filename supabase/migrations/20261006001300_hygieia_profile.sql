-- Hygieia profile data (P8.1, operator request 2026-10-06: "profile page, which tracks our data and
-- achievements / entries … like save favorites" + "set up workout plans - register progress etc"):
-- entries, goals, saved_items, workout_plans, workout_sessions.
--
-- The tenant is the user (`auth.uid()`), exactly as in 20261006000400_hygieia_user_data.sql: every
-- table carries `user_id uuid not null default auth.uid()` and ONE policy per verb `to authenticated`
-- with `user_id = auth.uid()`. The client never sends `user_id` — the INSERT/UPDATE column grants
-- exclude it, so it can only come from the default. Nothing is granted to anon or PUBLIC;
-- service_role (BYPASSRLS, server-side only) keeps full DML. Cross-user isolation is proven by
-- `npm run db:gate` and scripts/db-isolation.test.ts.
--
-- Every object lives in schema `hygieia` (ADR-0003). Idempotent-safe (the gate applies twice).
-- Forward-only: this file is NEW; no shipped migration is touched.
--
-- Shape decisions (DECISIONS.md 2026-10-06 P8.1):
--   * `entries` is ONE table: `kind` + an optional numeric `value`/`unit` + a free jsonb `payload`
--     (e.g. { recipe_id }, { workout_template_id }, { routine_slug }) + a note. Achievements and
--     streaks are COMPUTED client-side from entries; nothing derived is stored.
--   * `goals` is keyed per kind (`primary key (user_id, kind)`): one target per kind per user, upserted.
--   * `saved_items` is POLYMORPHIC on purpose: `kind` names the content table and `item_id` the row,
--     with NO foreign key — one FK cannot point at five tables, and a saved reference to a row an
--     admin later rejects or deletes must not block that admin action (the page shows "no longer
--     available"). Recipes keep the existing `favourites` table (FK to recipes) untouched.
--   * `workout_plans` is a user's commitment to a `workout_templates` row for N weeks x days/week,
--     with a status lifecycle active -> completed | abandoned; `on delete restrict` on the template so
--     a template with live plans cannot vanish from under them.
--   * `workout_sessions.exercises` is an ORDERED jsonb array of
--       { exercise_id: uuid, sets: [{ reps: int >= 0, weight_kg: number|null >= 0, rpe: number|null 1..10, done: boolean }] }
--     validated client-side (src/user/supabase.ts parsers) and, for every row the gate sees, by the
--     gate's jsonb scan (`exercise_id` resolves to hygieia.exercises.id). 1-40 exercises per session
--     is a DB CHECK. `plan_id` / `template_id` are `on delete set null`: a logged session outlives
--     the plan it was part of.
--   * Every CHECK literal list below equals the matching `as const` array in src/user/source.ts
--     (ENTRY_KINDS, ENTRY_UNITS, GOAL_KINDS, SAVED_ITEM_KINDS; cadence and plan status are unions);
--     scripts/db-schema-contract.test.ts asserts they cannot drift.
--   * Every table carries created_at + updated_at with the touch trigger (the gate's structural sweep
--     requires both on every table); the client row types expose only what the page needs.

-- === tables ======================================================================================

create table if not exists hygieia.entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  kind text not null check (
    kind in ('weight', 'meal', 'workout', 'water', 'sleep', 'steps', 'skincare', 'nails', 'mood')
  ),
  entry_date date not null default current_date,
  value numeric null check (value is null or value >= 0),
  unit text null check (unit is null or unit in ('kg', 'kcal', 'min', 'ml', 'h', 'steps', 'score')),
  payload jsonb null,
  note text null check (note is null or length(note) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists entries_user_id_entry_date_idx
  on hygieia.entries (user_id, entry_date desc, created_at desc);

create table if not exists hygieia.goals (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  kind text not null check (kind in ('water', 'sleep', 'workout', 'steps', 'weight', 'skincare')),
  target numeric not null check (target > 0),
  unit text not null check (btrim(unit) <> ''),
  cadence text not null check (cadence in ('daily', 'weekly')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint goals_pkey primary key (user_id, kind)
);

create index if not exists goals_user_id_idx on hygieia.goals (user_id);

-- Polymorphic by design (header): no FK on item_id.
create table if not exists hygieia.saved_items (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  kind text not null check (
    kind in ('workout', 'skincare_routine', 'health_tip', 'skincare_tip', 'diet')
  ),
  item_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint saved_items_pkey primary key (user_id, kind, item_id)
);

create index if not exists saved_items_user_id_idx on hygieia.saved_items (user_id);

create table if not exists hygieia.workout_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  template_id uuid not null references hygieia.workout_templates (id) on delete restrict,
  name text not null check (length(name) between 1 and 80),
  weeks int not null check (weeks between 1 and 12),
  days_per_week int not null check (days_per_week between 1 and 7),
  start_date date not null default current_date,
  status text not null default 'active' check (status in ('active', 'completed', 'abandoned')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists workout_plans_user_id_status_idx on hygieia.workout_plans (user_id, status);
create index if not exists workout_plans_template_id_idx on hygieia.workout_plans (template_id);

create table if not exists hygieia.workout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  plan_id uuid null references hygieia.workout_plans (id) on delete set null,
  template_id uuid null references hygieia.workout_templates (id) on delete set null,
  performed_at date not null default current_date,
  duration_min int null check (duration_min is null or duration_min between 1 and 600),
  exercises jsonb not null check (
    jsonb_typeof(exercises) = 'array' and jsonb_array_length(exercises) between 1 and 40
  ),
  note text null check (note is null or length(note) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists workout_sessions_user_id_performed_at_idx
  on hygieia.workout_sessions (user_id, performed_at desc);
create index if not exists workout_sessions_plan_id_idx on hygieia.workout_sessions (plan_id);
create index if not exists workout_sessions_template_id_idx on hygieia.workout_sessions (template_id);

-- === updated_at ==================================================================================

create or replace trigger entries_touch_updated_at before update on hygieia.entries
  for each row execute function hygieia.touch_updated_at();
create or replace trigger goals_touch_updated_at before update on hygieia.goals
  for each row execute function hygieia.touch_updated_at();
create or replace trigger saved_items_touch_updated_at before update on hygieia.saved_items
  for each row execute function hygieia.touch_updated_at();
create or replace trigger workout_plans_touch_updated_at before update on hygieia.workout_plans
  for each row execute function hygieia.touch_updated_at();
create or replace trigger workout_sessions_touch_updated_at before update on hygieia.workout_sessions
  for each row execute function hygieia.touch_updated_at();

-- === RLS: one policy per verb, owner only ========================================================

alter table hygieia.entries enable row level security;
alter table hygieia.goals enable row level security;
alter table hygieia.saved_items enable row level security;
alter table hygieia.workout_plans enable row level security;
alter table hygieia.workout_sessions enable row level security;

-- entries
drop policy if exists entries_select_own on hygieia.entries;
create policy entries_select_own on hygieia.entries
  for select to authenticated using (user_id = auth.uid());
drop policy if exists entries_insert_own on hygieia.entries;
create policy entries_insert_own on hygieia.entries
  for insert to authenticated with check (user_id = auth.uid());
drop policy if exists entries_update_own on hygieia.entries;
create policy entries_update_own on hygieia.entries
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists entries_delete_own on hygieia.entries;
create policy entries_delete_own on hygieia.entries
  for delete to authenticated using (user_id = auth.uid());

-- goals
drop policy if exists goals_select_own on hygieia.goals;
create policy goals_select_own on hygieia.goals
  for select to authenticated using (user_id = auth.uid());
drop policy if exists goals_insert_own on hygieia.goals;
create policy goals_insert_own on hygieia.goals
  for insert to authenticated with check (user_id = auth.uid());
drop policy if exists goals_update_own on hygieia.goals;
create policy goals_update_own on hygieia.goals
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists goals_delete_own on hygieia.goals;
create policy goals_delete_own on hygieia.goals
  for delete to authenticated using (user_id = auth.uid());

-- saved_items
drop policy if exists saved_items_select_own on hygieia.saved_items;
create policy saved_items_select_own on hygieia.saved_items
  for select to authenticated using (user_id = auth.uid());
drop policy if exists saved_items_insert_own on hygieia.saved_items;
create policy saved_items_insert_own on hygieia.saved_items
  for insert to authenticated with check (user_id = auth.uid());
drop policy if exists saved_items_update_own on hygieia.saved_items;
create policy saved_items_update_own on hygieia.saved_items
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists saved_items_delete_own on hygieia.saved_items;
create policy saved_items_delete_own on hygieia.saved_items
  for delete to authenticated using (user_id = auth.uid());

-- workout_plans
drop policy if exists workout_plans_select_own on hygieia.workout_plans;
create policy workout_plans_select_own on hygieia.workout_plans
  for select to authenticated using (user_id = auth.uid());
drop policy if exists workout_plans_insert_own on hygieia.workout_plans;
create policy workout_plans_insert_own on hygieia.workout_plans
  for insert to authenticated with check (user_id = auth.uid());
drop policy if exists workout_plans_update_own on hygieia.workout_plans;
create policy workout_plans_update_own on hygieia.workout_plans
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists workout_plans_delete_own on hygieia.workout_plans;
create policy workout_plans_delete_own on hygieia.workout_plans
  for delete to authenticated using (user_id = auth.uid());

-- workout_sessions
drop policy if exists workout_sessions_select_own on hygieia.workout_sessions;
create policy workout_sessions_select_own on hygieia.workout_sessions
  for select to authenticated using (user_id = auth.uid());
drop policy if exists workout_sessions_insert_own on hygieia.workout_sessions;
create policy workout_sessions_insert_own on hygieia.workout_sessions
  for insert to authenticated with check (user_id = auth.uid());
drop policy if exists workout_sessions_update_own on hygieia.workout_sessions;
create policy workout_sessions_update_own on hygieia.workout_sessions
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists workout_sessions_delete_own on hygieia.workout_sessions;
create policy workout_sessions_delete_own on hygieia.workout_sessions
  for delete to authenticated using (user_id = auth.uid());

-- === grants ======================================================================================
-- Nothing to anon or PUBLIC. authenticated: select, delete, and column-limited insert/update that
-- EXCLUDE user_id (it always comes from `default auth.uid()`), id and the timestamps. `goals.kind`
-- is in the UPDATE grant because PostgREST's upsert (`on conflict (user_id, kind) do update`) sets
-- every payload column, the conflict key included.

revoke all on table hygieia.entries, hygieia.goals, hygieia.saved_items, hygieia.workout_plans,
  hygieia.workout_sessions
  from public, anon, authenticated;

grant select, delete on table hygieia.entries, hygieia.goals, hygieia.saved_items,
  hygieia.workout_plans, hygieia.workout_sessions
  to authenticated;
grant insert (kind, entry_date, value, unit, payload, note),
      update (kind, entry_date, value, unit, payload, note)
  on table hygieia.entries to authenticated;
grant insert (kind, target, unit, cadence), update (kind, target, unit, cadence)
  on table hygieia.goals to authenticated;
grant insert (kind, item_id), update (kind, item_id)
  on table hygieia.saved_items to authenticated;
grant insert (template_id, name, weeks, days_per_week, start_date),
      update (name, weeks, days_per_week, start_date, status)
  on table hygieia.workout_plans to authenticated;
grant insert (plan_id, template_id, performed_at, duration_min, exercises, note),
      update (plan_id, template_id, performed_at, duration_min, exercises, note)
  on table hygieia.workout_sessions to authenticated;

grant select, insert, update, delete on table hygieia.entries, hygieia.goals, hygieia.saved_items,
  hygieia.workout_plans, hygieia.workout_sessions
  to service_role;
