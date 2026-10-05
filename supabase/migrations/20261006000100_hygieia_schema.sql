-- Hygieia bootstrap: schema `hygieia`, its migration ledger, the shared updated_at trigger function.
--
-- Hygieia lives in Alyssos's LIVE Supabase project (ADR-0003). Everything here is created in
-- schema `hygieia` only; nothing in `public`, `auth`, `storage`, `extensions` or
-- `supabase_migrations` is touched. Idempotent-safe: every statement can run twice on the same
-- database without error or change (the gate applies the archive twice to prove it).

create schema if not exists hygieia;

-- The API roles may resolve names in the schema. This grants NO table or function access by
-- itself; every table and RPC grants its own privileges in the migration that creates it.
grant usage on schema hygieia to anon, authenticated, service_role;

-- Postgres grants EXECUTE on every new function to PUBLIC, which would hand anon every Hygieia
-- function. This line states the intent for schema `hygieia` — but it is NOT sufficient on its
-- own: per-schema default privileges are ADDED to the global defaults, so a per-schema REVOKE
-- cannot take away the hardwired global EXECUTE-to-PUBLIC (Postgres docs, ALTER DEFAULT
-- PRIVILEGES; proven in PGlite by the gate, 2026-10-05). A global revoke would be project-wide
-- and touch Alyssos's future functions, so it is forbidden here (ADR-0003). Therefore EVERY
-- function a Hygieia migration creates must `revoke execute … from public, anon` explicitly
-- (an RPC for signed-in users then grants `authenticated`), and `npm run db:gate` asserts that
-- no function in schema `hygieia` is executable by anon or PUBLIC. A policy evaluated as `anon`
-- must never call a `hygieia` function (PLAN §1.4).
alter default privileges in schema hygieia revoke execute on functions from public;

-- Hygieia's own migration ledger. Alyssos owns supabase_migrations.schema_migrations, so a
-- Hygieia version is recorded HERE, by `npm run db:apply`, never there.
create table if not exists hygieia.schema_migrations (
  version text primary key,
  name text not null,
  checksum text not null,
  applied_at timestamptz not null default now()
);

-- RLS on and NO policy: invisible to anon and authenticated even if a grant ever slipped in.
alter table hygieia.schema_migrations enable row level security;
revoke all on table hygieia.schema_migrations from anon, authenticated;

-- Shared BEFORE UPDATE trigger function for every `updated_at` column.
-- search_path is pinned empty: now() resolves from pg_catalog, which is always searched.
create or replace function hygieia.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $fn$
begin
  new.updated_at := now();
  return new;
end
$fn$;

-- A trigger function is never called directly. Default privileges are per creating role, so
-- revoke explicitly as well rather than rely on the line above alone.
revoke execute on function hygieia.touch_updated_at() from public, anon, authenticated;
