-- Hygieia per-user data: fridge_lists, saved_plans, favourites. (PLAN.md P1.7, §1.7, §2.)
--
-- The tenant is the user (`auth.uid()`): every table carries `user_id uuid not null default auth.uid()`
-- and ONE policy per verb `to authenticated` with `user_id = auth.uid()`. The client never sends
-- `user_id` — the INSERT/UPDATE column grants exclude it, so it can only come from the default.
-- Nothing is granted to anon or PUBLIC; service_role (BYPASSRLS, server-side only) keeps full DML.
-- Cross-user isolation is proven by `npm run db:gate` and scripts/db-isolation.test.ts (P1.8).
--
-- Every object lives in schema `hygieia` (ADR-0003). Idempotent-safe (the gate applies twice).

-- === tables ======================================================================================

create table if not exists hygieia.fridge_lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 80),
  ingredient_slugs text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists fridge_lists_user_id_idx on hygieia.fridge_lists (user_id);

-- A week plan on a diet. A diet with saved plans cannot be deleted (restrict).
create table if not exists hygieia.saved_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  diet_id uuid not null references hygieia.diets (id) on delete restrict,
  week_start date not null,
  plan jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists saved_plans_user_id_idx on hygieia.saved_plans (user_id);
create index if not exists saved_plans_diet_id_idx on hygieia.saved_plans (diet_id);

create table if not exists hygieia.favourites (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  recipe_id uuid not null references hygieia.recipes (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint favourites_pkey primary key (user_id, recipe_id)
);

create index if not exists favourites_user_id_idx on hygieia.favourites (user_id);
create index if not exists favourites_recipe_id_idx on hygieia.favourites (recipe_id);

-- === updated_at ==================================================================================

create or replace trigger fridge_lists_touch_updated_at before update on hygieia.fridge_lists
  for each row execute function hygieia.touch_updated_at();
create or replace trigger saved_plans_touch_updated_at before update on hygieia.saved_plans
  for each row execute function hygieia.touch_updated_at();
create or replace trigger favourites_touch_updated_at before update on hygieia.favourites
  for each row execute function hygieia.touch_updated_at();

-- === RLS: one policy per verb, owner only ========================================================

alter table hygieia.fridge_lists enable row level security;
alter table hygieia.saved_plans enable row level security;
alter table hygieia.favourites enable row level security;

-- fridge_lists
drop policy if exists fridge_lists_select_own on hygieia.fridge_lists;
create policy fridge_lists_select_own on hygieia.fridge_lists
  for select to authenticated using (user_id = auth.uid());
drop policy if exists fridge_lists_insert_own on hygieia.fridge_lists;
create policy fridge_lists_insert_own on hygieia.fridge_lists
  for insert to authenticated with check (user_id = auth.uid());
drop policy if exists fridge_lists_update_own on hygieia.fridge_lists;
create policy fridge_lists_update_own on hygieia.fridge_lists
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists fridge_lists_delete_own on hygieia.fridge_lists;
create policy fridge_lists_delete_own on hygieia.fridge_lists
  for delete to authenticated using (user_id = auth.uid());

-- saved_plans
drop policy if exists saved_plans_select_own on hygieia.saved_plans;
create policy saved_plans_select_own on hygieia.saved_plans
  for select to authenticated using (user_id = auth.uid());
drop policy if exists saved_plans_insert_own on hygieia.saved_plans;
create policy saved_plans_insert_own on hygieia.saved_plans
  for insert to authenticated with check (user_id = auth.uid());
drop policy if exists saved_plans_update_own on hygieia.saved_plans;
create policy saved_plans_update_own on hygieia.saved_plans
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists saved_plans_delete_own on hygieia.saved_plans;
create policy saved_plans_delete_own on hygieia.saved_plans
  for delete to authenticated using (user_id = auth.uid());

-- favourites
drop policy if exists favourites_select_own on hygieia.favourites;
create policy favourites_select_own on hygieia.favourites
  for select to authenticated using (user_id = auth.uid());
drop policy if exists favourites_insert_own on hygieia.favourites;
create policy favourites_insert_own on hygieia.favourites
  for insert to authenticated with check (user_id = auth.uid());
drop policy if exists favourites_update_own on hygieia.favourites;
create policy favourites_update_own on hygieia.favourites
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists favourites_delete_own on hygieia.favourites;
create policy favourites_delete_own on hygieia.favourites
  for delete to authenticated using (user_id = auth.uid());

-- === grants ======================================================================================
-- Nothing to anon or PUBLIC. authenticated: select, delete, and column-limited insert/update that
-- EXCLUDE user_id (it always comes from `default auth.uid()`), id and the timestamps.

revoke all on table hygieia.fridge_lists, hygieia.saved_plans, hygieia.favourites
  from public, anon, authenticated;

grant select, delete on table hygieia.fridge_lists, hygieia.saved_plans, hygieia.favourites
  to authenticated;
grant insert (name, ingredient_slugs), update (name, ingredient_slugs)
  on table hygieia.fridge_lists to authenticated;
grant insert (diet_id, week_start, plan), update (diet_id, week_start, plan)
  on table hygieia.saved_plans to authenticated;
grant insert (recipe_id), update (recipe_id)
  on table hygieia.favourites to authenticated;

grant select, insert, update, delete on table hygieia.fridge_lists, hygieia.saved_plans, hygieia.favourites
  to service_role;
