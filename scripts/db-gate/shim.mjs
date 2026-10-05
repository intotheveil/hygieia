// THE SHARED-PROJECT SHIM for `npm run db:gate`.
//
// Hygieia does not own its database. It lives in schema `hygieia` inside Alyssos's LIVE Supabase
// project `alyssos` (ADR-0003). So a rehearsal on an empty Postgres proves too little: it would
// pass a migration that collides with, or quietly edits, the tenant next door. This shim rebuilds
// the parts of that project a Hygieia migration can touch or depend on:
//
//   1. What Supabase provides and no migration restates: the API roles, the `auth` schema with
//      auth.uid() and auth.users, and Supabase's DEFAULT PRIVILEGES in `public` (which is why,
//      in `public`, the policies are the only boundary).
//   2. An Alyssos-shaped `public`: `public.profiles` (the one name Hygieia reuses inside its own
//      schema — a migration that forgets the `hygieia.` prefix must collide here, not pass) and
//      `public.spatial_ref_sys` with RLS OFF, exactly as live (PostGIS's reference table; the
//      Supabase advisory noted in ADR-0003 — Alyssos's concern, not ours, and a Hygieia migration
//      must not "fix" it either), plus Alyssos's migration ledger
//      `supabase_migrations.schema_migrations` holding ALYSSOS_MIGRATION_ROWS rows. The live
//      count is unknown and irrelevant: the gate checks INVARIANCE, not the number.
//
// What it deliberately does NOT do: grant anything on schema `hygieia`. Live Supabase has no
// default privileges on a custom schema, so every grant Hygieia needs must come from Hygieia's
// own migrations. If the shim pre-granted, a migration that forgot a grant would pass here and
// break on the live project; instead it must show up as a failing positive-path check.
//
// Lifted from Themis (scripts/db-gate/shim.mjs) with Hephaestus's `public` replaced by Alyssos's.

export const ALYSSOS_PUBLIC_TABLES = ['profiles', 'spatial_ref_sys']
export const ALYSSOS_MIGRATION_ROWS = 12

/** @param {import('@electric-sql/pglite').PGlite} db */
export async function installShim(db) {
  // --- Supabase roles, auth schema, default privileges --------------------------------------
  // service_role bypasses RLS on the real platform; mirror it so a service-only table behaves
  // the same here as live.
  await db.exec(`
    create role anon nologin noinherit;
    create role authenticated nologin noinherit;
    create role service_role nologin noinherit bypassrls;

    create schema auth;
    create table auth.users (
      id uuid primary key,
      email text,
      -- Real Supabase has this column (nullable, no default). The shim defaults it to now() so
      -- every user a fixture creates with (id, email) is CONFIRMED, as a magic-link or OAuth
      -- user is; a test that needs an unconfirmed user sets it to null explicitly.
      email_confirmed_at timestamptz default now(),
      created_at timestamptz not null default now()
    );
    create or replace function auth.uid() returns uuid language sql stable
      as $fn$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $fn$;

    grant usage on schema public to anon, authenticated, service_role;
    grant usage on schema auth to anon, authenticated, service_role;
    alter default privileges in schema public
      grant all on tables to anon, authenticated, service_role;
    alter default privileges in schema public
      grant all on sequences to anon, authenticated, service_role;
    alter default privileges in schema public
      grant all on functions to anon, authenticated, service_role;
  `)

  // --- Alyssos's `public` (shape only; the names and the RLS state are what matter) ----------
  await db.exec(`
    create table public.profiles (
      id uuid primary key references auth.users (id) on delete cascade,
      username text unique,
      full_name text,
      avatar_url text,
      updated_at timestamptz not null default now()
    );
    alter table public.profiles enable row level security;
    create policy profiles_public_read on public.profiles for select using (true);
    create policy profiles_self_write on public.profiles
      for all to authenticated using (id = auth.uid()) with check (id = auth.uid());

    -- PostGIS's reference table as Alyssos has it: in public, RLS OFF (ADR-0003 consequence 3).
    create table public.spatial_ref_sys (
      srid integer primary key check (srid > 0 and srid <= 998999),
      auth_name varchar(256),
      auth_srid integer,
      srtext varchar(2048),
      proj4text varchar(2048)
    );
    insert into public.spatial_ref_sys (srid, auth_name, auth_srid, srtext, proj4text)
    values (4326, 'EPSG', 4326, 'GEOGCS["WGS 84",…]', '+proj=longlat +datum=WGS84 +no_defs');
  `)

  // --- Alyssos's migration ledger (owned by the Supabase CLI; Hygieia never writes it) --------
  await db.exec(`
    create schema supabase_migrations;
    create table supabase_migrations.schema_migrations (
      version text primary key,
      statements text[],
      name text
    );
  `)
  await db.query(
    `insert into supabase_migrations.schema_migrations (version, statements, name)
     select to_char(timestamp '2026-01-01' + (g || ' days')::interval, 'YYYYMMDDHH24MISS'),
            array['-- alyssos migration ' || g],
            'alyssos_' || lpad(g::text, 2, '0')
       from generate_series(1, $1::int) as g`,
    [ALYSSOS_MIGRATION_ROWS],
  )
}

/**
 * Counts of everything in the schemas Hygieia must not touch, taken before and after the archive
 * runs: zero change is the proof that a migration stayed inside `hygieia`. `spatial_rls` is the
 * RLS state of Alyssos's PostGIS table (OFF live): a Hygieia migration must not flip it.
 * @param {import('@electric-sql/pglite').PGlite} db
 */
export async function foreignSnapshot(db) {
  const r = await db.query(`
    select
      (select count(*) from pg_class c join pg_namespace n on n.oid = c.relnamespace
        where n.nspname in ('public', 'auth', 'supabase_migrations'))::int as relations,
      (select count(*) from pg_policy p join pg_class c on c.oid = p.polrelid
        join pg_namespace n on n.oid = c.relnamespace
        where n.nspname in ('public', 'auth', 'supabase_migrations'))::int as policies,
      (select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
        where n.nspname in ('public', 'auth', 'supabase_migrations'))::int as functions,
      (select count(*) from pg_trigger t join pg_class c on c.oid = t.tgrelid
        join pg_namespace n on n.oid = c.relnamespace
        where n.nspname in ('public', 'auth', 'supabase_migrations') and not t.tgisinternal)::int as triggers,
      (select count(*) from supabase_migrations.schema_migrations)::int as alyssos_ledger_rows,
      (select c.relrowsecurity from pg_class c
        where c.oid = to_regclass('public.spatial_ref_sys')) as spatial_rls
  `)
  return /** @type {{ relations: number, policies: number, functions: number, triggers: number, alyssos_ledger_rows: number, spatial_rls: boolean }} */ (
    r.rows[0]
  )
}
