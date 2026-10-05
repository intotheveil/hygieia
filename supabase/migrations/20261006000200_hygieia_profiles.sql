-- Hygieia identity and admin primitives: hygieia.profiles, hygieia.is_admin(), hygieia.stamp_review().
-- (PLAN.md P1.5, §1.3, §1.8, §2.)
--
-- Every object lives in schema `hygieia` (ADR-0003). `auth.users` is shared with Alyssos: it is only
-- REFERENCED here, never written, and no trigger is added on it; the profile row is created by the
-- client on first session (RLS self-insert, column-limited grant). Idempotent-safe: the gate applies
-- the archive twice, so tables use `if not exists`, functions `create or replace`, every policy is
-- dropped before it is created, and triggers use `create or replace trigger`.
--
-- Pattern: Themis 20260928210000_themis_tenancy.sql (profiles part).

-- === table =======================================================================================

-- Hygieia's own profile per shared auth user. Alyssos's public.profiles is never touched.
-- `is_admin` is settable ONLY by the operator via SQL (docs/ops/admin.md): no client role holds a
-- column privilege on it (see grants), so neither INSERT nor UPDATE from the API can set it.
create table if not exists hygieia.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  display_name text check (display_name is null or char_length(display_name) <= 120),
  is_admin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace trigger profiles_touch_updated_at before update on hygieia.profiles
  for each row execute function hygieia.touch_updated_at();

-- === helpers =====================================================================================

-- Is the caller an admin? SECURITY DEFINER so the lookup reads profiles as the owner (no RLS
-- re-entry from the profiles policies that could otherwise recurse); auth.uid() is evaluated
-- inside, so a caller cannot ask about someone else. search_path pinned empty, names qualified.
-- Only `authenticated` may execute it: a policy evaluated as `anon` never calls it (PLAN §1.4).
create or replace function hygieia.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $fn$
  select coalesce(
    (select p.is_admin from hygieia.profiles p where p.user_id = auth.uid()),
    false
  )
$fn$;

-- Postgres grants EXECUTE on a new function to PUBLIC and the bootstrap's per-schema default
-- privileges cannot undo that (see 20261006000100); every function revokes explicitly.
revoke execute on function hygieia.is_admin() from public, anon;
grant execute on function hygieia.is_admin() to authenticated;

-- Review stamp: a BEFORE UPDATE trigger on every status-bearing content table. When `status`
-- changes, the row records who changed it and when. Column privileges do not apply to a trigger's
-- assignments, so the admin needs no grant on reviewed_* (and the client cannot forge them).
create or replace function hygieia.stamp_review()
returns trigger
language plpgsql
set search_path = ''
as $fn$
begin
  if new.status is distinct from old.status then
    new.reviewed_at := now();
    new.reviewed_by := auth.uid();
  end if;
  return new;
end
$fn$;

-- A trigger function is never called directly.
revoke execute on function hygieia.stamp_review() from public, anon, authenticated;

-- === RLS =========================================================================================

alter table hygieia.profiles enable row level security;

drop policy if exists profiles_select_self on hygieia.profiles;
create policy profiles_select_self on hygieia.profiles
  for select to authenticated
  using (user_id = auth.uid());

-- Self-insert only, and never as an admin (belt: the column grant below is the braces).
drop policy if exists profiles_insert_self on hygieia.profiles;
create policy profiles_insert_self on hygieia.profiles
  for insert to authenticated
  with check (user_id = auth.uid() and is_admin = false);

drop policy if exists profiles_update_self on hygieia.profiles;
create policy profiles_update_self on hygieia.profiles
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- === grants ======================================================================================
-- Nothing to anon, nothing to PUBLIC. authenticated gets exactly the verbs its policies admit,
-- column-limited so `is_admin` has NO client grant; service_role (BYPASSRLS, server-side only)
-- gets full DML.

revoke all on table hygieia.profiles from public, anon, authenticated;
grant select on table hygieia.profiles to authenticated;
grant insert (user_id, display_name) on table hygieia.profiles to authenticated;
grant update (display_name) on table hygieia.profiles to authenticated;
grant select, insert, update, delete on table hygieia.profiles to service_role;
