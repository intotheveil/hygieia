-- Hygieia skincare (P7.1, operator request 2026-10-06: "skin care for men / women … from EU, US,
-- Korea etc" + "and nails"): skincare_product_types, skincare_routines, skincare_tips.
--
-- Every object lives in schema `hygieia` (ADR-0003). Idempotent-safe: the gate applies the archive
-- twice (`if not exists`, `create or replace trigger`, `drop policy if exists` before `create policy`).
-- Forward-only: this file is NEW; 20261006000300_hygieia_content.sql is not touched.
--
-- Contract (PLAN.md §1 + P7):
--   * Same shape as the other content tables: `*_el` / `*_en` pairs `not null check (btrim(x) <> '')`,
--     `status pending|approved|rejected` default pending, `reviewed_at` / `reviewed_by` stamped by
--     hygieia.stamp_review(), `updated_at` by hygieia.touch_updated_at(), seeded ids
--     `md5('hygieia:<table>:' || slug)::uuid`.
--   * Every CHECK literal list equals the matching `as const` array in src/content/enums.ts
--     (AUDIENCES, SKIN_TYPES, SKIN_CONCERNS, REGIONS, STEP_TIMES, ROUTINE_TIMES, CARE_AREAS,
--     SKINCARE_CATEGORIES, PRICE_BANDS); scripts/db-schema-contract.test.ts and `npm run db:gate` assert
--     they cannot drift. Array-valued enum columns use `cardinality(x) >= 1 and x <@ array[...]`.
--   * Product TYPES, never brands; `regions` are regulatory / routine STYLES, not shops (DECISIONS P7.1).
--   * A routine's `steps` is an ORDERED jsonb array of
--     { order, product_type_slug, note_el, note_en, optional }; `product_type_slug` references
--     skincare_product_types.slug by VALUE (no FK into jsonb) — the generator, the seed test and the
--     gate's jsonb orphan scan assert every slug resolves.
--   * `area` (face | nails, default face) on routines and tips drives the page's Face / Nails switch.
--   * Policies PER ROLE (§1.4): `<t>_select_anon` reads approved; `<t>_select_auth` reads approved or
--     hygieia.is_admin(); `<t>_update_admin` lets an admin UPDATE. No client INSERT/DELETE; service_role
--     full DML. Grants: authenticated may UPDATE content columns + status only — never id, slug,
--     created_at, reviewed_at, reviewed_by.

-- =================================================================================================
-- skincare_product_types — generic product TYPES (never brands)
-- =================================================================================================

create table if not exists hygieia.skincare_product_types (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name_el text not null check (btrim(name_el) <> ''),
  name_en text not null check (btrim(name_en) <> ''),
  description_el text not null check (btrim(description_el) <> ''),
  description_en text not null check (btrim(description_en) <> ''),
  category text not null check (
    category in (
      'cleanser', 'toner', 'essence', 'serum', 'moisturizer', 'sunscreen', 'exfoliant', 'mask', 'eye',
      'treatment', 'shaving', 'beard', 'lip', 'cuticle_oil', 'nail_treatment', 'hand_cream', 'base_coat',
      'nail_file', 'nail_remover'
    )
  ),
  key_ingredients text[] not null default '{}',
  avoid_with text[] not null default '{}',
  regions text[] not null check (
    cardinality(regions) >= 1 and regions <@ array['eu', 'us', 'kr', 'jp', 'global']
  ),
  audiences text[] not null check (
    cardinality(audiences) >= 1 and audiences <@ array['men', 'women', 'all']
  ),
  skin_types text[] not null check (
    cardinality(skin_types) >= 1
    and skin_types <@ array['normal', 'dry', 'oily', 'combination', 'sensitive', 'all']
  ),
  concerns text[] not null check (
    cardinality(concerns) >= 1
    and concerns <@ array[
      'acne', 'aging', 'hydration', 'sun', 'pigmentation', 'redness', 'shaving', 'beard', 'pores',
      'texture', 'nails', 'hands', 'general'
    ]
  ),
  time text not null check (time in ('am', 'pm', 'both')),
  price_band_eur text not null check (price_band_eur in ('low', 'mid', 'high')),
  notes_el text not null check (btrim(notes_el) <> ''),
  notes_en text not null check (btrim(notes_en) <> ''),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists skincare_product_types_status_idx on hygieia.skincare_product_types (status);
create index if not exists skincare_product_types_reviewed_by_idx
  on hygieia.skincare_product_types (reviewed_by);
create index if not exists skincare_product_types_category_idx on hygieia.skincare_product_types (category);

-- =================================================================================================
-- skincare_routines — ordered steps (jsonb) over product types, per audience / skin type / region / time
-- =================================================================================================

create table if not exists hygieia.skincare_routines (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  area text not null default 'face' check (area in ('face', 'nails')),
  name_el text not null check (btrim(name_el) <> ''),
  name_en text not null check (btrim(name_en) <> ''),
  audience text not null check (audience in ('men', 'women', 'all')),
  skin_type text not null check (
    skin_type in ('normal', 'dry', 'oily', 'combination', 'sensitive', 'all')
  ),
  region text not null check (region in ('eu', 'us', 'kr', 'jp', 'global')),
  time text not null check (time in ('am', 'pm', 'weekly')),
  intro_el text not null check (btrim(intro_el) <> ''),
  intro_en text not null check (btrim(intro_en) <> ''),
  steps jsonb not null,
  duration_min integer not null check (duration_min > 0),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint skincare_routines_steps_array check (
    jsonb_typeof(steps) = 'array' and jsonb_array_length(steps) between 1 and 10
  )
);

create index if not exists skincare_routines_status_idx on hygieia.skincare_routines (status);
create index if not exists skincare_routines_reviewed_by_idx on hygieia.skincare_routines (reviewed_by);
create index if not exists skincare_routines_cell_idx
  on hygieia.skincare_routines (area, audience, skin_type, region, time);

-- =================================================================================================
-- skincare_tips — like health_tips, filterable by area / audience / skin type / concern / region
-- =================================================================================================

-- A tip either cites >= 1 real source or is flagged `needs_source` (PLAN §0 content drafting rule).
create table if not exists hygieia.skincare_tips (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  area text not null default 'face' check (area in ('face', 'nails')),
  title_el text not null check (btrim(title_el) <> ''),
  title_en text not null check (btrim(title_en) <> ''),
  body_el text not null check (btrim(body_el) <> ''),
  body_en text not null check (btrim(body_en) <> ''),
  audiences text[] not null check (
    cardinality(audiences) >= 1 and audiences <@ array['men', 'women', 'all']
  ),
  skin_types text[] not null check (
    cardinality(skin_types) >= 1
    and skin_types <@ array['normal', 'dry', 'oily', 'combination', 'sensitive', 'all']
  ),
  concerns text[] not null check (
    cardinality(concerns) >= 1
    and concerns <@ array[
      'acne', 'aging', 'hydration', 'sun', 'pigmentation', 'redness', 'shaving', 'beard', 'pores',
      'texture', 'nails', 'hands', 'general'
    ]
  ),
  regions text[] not null check (
    cardinality(regions) >= 1 and regions <@ array['eu', 'us', 'kr', 'jp', 'global']
  ),
  sources text[] not null default '{}',
  needs_source boolean not null default false,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint skincare_tips_sourced check (cardinality(sources) >= 1 or needs_source)
);

create index if not exists skincare_tips_status_idx on hygieia.skincare_tips (status);
create index if not exists skincare_tips_reviewed_by_idx on hygieia.skincare_tips (reviewed_by);
create index if not exists skincare_tips_area_idx on hygieia.skincare_tips (area);

-- =================================================================================================
-- triggers: updated_at + the review stamp on every table (all three bear status)
-- =================================================================================================

create or replace trigger skincare_product_types_touch_updated_at
  before update on hygieia.skincare_product_types
  for each row execute function hygieia.touch_updated_at();
create or replace trigger skincare_product_types_stamp_review
  before update on hygieia.skincare_product_types
  for each row execute function hygieia.stamp_review();

create or replace trigger skincare_routines_touch_updated_at before update on hygieia.skincare_routines
  for each row execute function hygieia.touch_updated_at();
create or replace trigger skincare_routines_stamp_review before update on hygieia.skincare_routines
  for each row execute function hygieia.stamp_review();

create or replace trigger skincare_tips_touch_updated_at before update on hygieia.skincare_tips
  for each row execute function hygieia.touch_updated_at();
create or replace trigger skincare_tips_stamp_review before update on hygieia.skincare_tips
  for each row execute function hygieia.stamp_review();

-- =================================================================================================
-- RLS — per-role select, admin update (PLAN §1.4; anon never calls a hygieia function)
-- =================================================================================================

alter table hygieia.skincare_product_types enable row level security;
alter table hygieia.skincare_routines enable row level security;
alter table hygieia.skincare_tips enable row level security;

-- skincare_product_types
drop policy if exists skincare_product_types_select_anon on hygieia.skincare_product_types;
create policy skincare_product_types_select_anon on hygieia.skincare_product_types
  for select to anon using (status = 'approved');
drop policy if exists skincare_product_types_select_auth on hygieia.skincare_product_types;
create policy skincare_product_types_select_auth on hygieia.skincare_product_types
  for select to authenticated using (status = 'approved' or hygieia.is_admin());
drop policy if exists skincare_product_types_update_admin on hygieia.skincare_product_types;
create policy skincare_product_types_update_admin on hygieia.skincare_product_types
  for update to authenticated using (hygieia.is_admin()) with check (hygieia.is_admin());

-- skincare_routines
drop policy if exists skincare_routines_select_anon on hygieia.skincare_routines;
create policy skincare_routines_select_anon on hygieia.skincare_routines
  for select to anon using (status = 'approved');
drop policy if exists skincare_routines_select_auth on hygieia.skincare_routines;
create policy skincare_routines_select_auth on hygieia.skincare_routines
  for select to authenticated using (status = 'approved' or hygieia.is_admin());
drop policy if exists skincare_routines_update_admin on hygieia.skincare_routines;
create policy skincare_routines_update_admin on hygieia.skincare_routines
  for update to authenticated using (hygieia.is_admin()) with check (hygieia.is_admin());

-- skincare_tips
drop policy if exists skincare_tips_select_anon on hygieia.skincare_tips;
create policy skincare_tips_select_anon on hygieia.skincare_tips
  for select to anon using (status = 'approved');
drop policy if exists skincare_tips_select_auth on hygieia.skincare_tips;
create policy skincare_tips_select_auth on hygieia.skincare_tips
  for select to authenticated using (status = 'approved' or hygieia.is_admin());
drop policy if exists skincare_tips_update_admin on hygieia.skincare_tips;
create policy skincare_tips_update_admin on hygieia.skincare_tips
  for update to authenticated using (hygieia.is_admin()) with check (hygieia.is_admin());

-- =================================================================================================
-- grants — reset to exactly what the policies admit (idempotent on re-apply)
-- =================================================================================================

revoke all on table
  hygieia.skincare_product_types, hygieia.skincare_routines, hygieia.skincare_tips
  from public, anon, authenticated;

grant select on table
  hygieia.skincare_product_types, hygieia.skincare_routines, hygieia.skincare_tips
  to anon, authenticated;

grant update (
  name_el, name_en, description_el, description_en, category, key_ingredients, avoid_with, regions,
  audiences, skin_types, concerns, time, price_band_eur, notes_el, notes_en, status
) on table hygieia.skincare_product_types to authenticated;

grant update (
  area, name_el, name_en, audience, skin_type, region, time, intro_el, intro_en, steps, duration_min,
  status
) on table hygieia.skincare_routines to authenticated;

grant update (
  area, title_el, title_en, body_el, body_en, audiences, skin_types, concerns, regions, sources,
  needs_source, status
) on table hygieia.skincare_tips to authenticated;

grant select, insert, update, delete on table
  hygieia.skincare_product_types, hygieia.skincare_routines, hygieia.skincare_tips
  to service_role;
