-- Hygieia content: ingredients, diets, recipes (+ recipe_ingredients, recipe_diets), exercises,
-- workout_templates (+ workout_template_exercises), health_tips. (PLAN.md P1.6, §1.2–§1.4, §2.)
--
-- Every object lives in schema `hygieia` (ADR-0003). Idempotent-safe: the gate applies the archive
-- twice (`if not exists`, `create or replace trigger`, `drop policy if exists` before `create policy`).
--
-- Contract (PLAN §1):
--   * Locale columns are same-row `*_el` / `*_en`, both `not null check (btrim(x) <> '')` — a missing
--     translation is a constraint violation (§1.2). Array pairs have equal cardinality.
--   * Every CHECK literal list equals the matching `as const` array in src/content/enums.ts;
--     scripts/db-schema-contract.test.ts and `npm run db:gate` assert they cannot drift.
--   * Every content row has `status` (pending | approved | rejected, default pending), `reviewed_at`,
--     `reviewed_by`, stamped by hygieia.stamp_review() when `status` changes (§1.3).
--   * Policies are written PER ROLE (§1.4): `<t>_select_anon` to anon reads `approved`; `<t>_select_auth`
--     to authenticated reads `approved or hygieia.is_admin()`; `<t>_update_admin` lets an admin UPDATE.
--     anon never calls a hygieia function. No client role may INSERT or DELETE content (seeds arrive by
--     migration, service_role keeps full DML). Child tables have no status: a child row is visible iff
--     its parent is approved (or the caller is admin); admins may insert/update/delete children.
--   * Grants: authenticated may UPDATE content columns and `status` only — never id, slug, created_at,
--     reviewed_at, reviewed_by (the trigger writes the review stamp; column privileges do not apply to
--     a trigger's assignments).
--   * Seeded ids are `md5('hygieia:<table>:' || slug)::uuid` (§1.6); the default only serves a
--     service-role insert without an explicit id.

-- =================================================================================================
-- ingredients
-- =================================================================================================

create table if not exists hygieia.ingredients (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name_el text not null check (btrim(name_el) <> ''),
  name_en text not null check (btrim(name_en) <> ''),
  category text not null check (btrim(category) <> ''),
  unit text not null check (unit in ('g', 'ml', 'piece', 'tbsp', 'tsp', 'slice', 'clove', 'bunch')),
  grams_per_unit numeric not null default 1 check (grams_per_unit > 0),
  kcal_100g numeric not null check (kcal_100g >= 0),
  protein_100g numeric not null check (protein_100g >= 0),
  carbs_100g numeric not null check (carbs_100g >= 0),
  fat_100g numeric not null check (fat_100g >= 0),
  source_note text not null check (btrim(source_note) <> ''),
  price_eur_min numeric not null check (price_eur_min >= 0),
  price_eur_max numeric not null,
  price_per text not null check (price_per in ('kg', 'l', 'piece')),
  price_as_of date not null,
  price_note text not null check (btrim(price_note) <> ''),
  substitute_slugs text[] not null default '{}',
  is_pantry_staple boolean not null default false,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ingredients_macros_le_100 check (protein_100g + carbs_100g + fat_100g <= 100),
  constraint ingredients_price_range check (price_eur_max >= price_eur_min)
);

create index if not exists ingredients_status_idx on hygieia.ingredients (status);
create index if not exists ingredients_reviewed_by_idx on hygieia.ingredients (reviewed_by);

-- =================================================================================================
-- diets
-- =================================================================================================

create table if not exists hygieia.diets (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name_el text not null check (btrim(name_el) <> ''),
  name_en text not null check (btrim(name_en) <> ''),
  summary_el text not null check (btrim(summary_el) <> ''),
  summary_en text not null check (btrim(summary_en) <> ''),
  allowed_el text[] not null,
  allowed_en text[] not null,
  avoided_el text[] not null,
  avoided_en text[] not null,
  pros_el text[] not null,
  pros_en text[] not null,
  cons_el text[] not null,
  cons_en text[] not null,
  avoid_if_el text[] not null,
  avoid_if_en text[] not null,
  source_url text check (source_url is null or source_url ~ '^https?://'),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint diets_allowed_pair check (cardinality(allowed_el) = cardinality(allowed_en)),
  constraint diets_avoided_pair check (cardinality(avoided_el) = cardinality(avoided_en)),
  constraint diets_pros_pair check (cardinality(pros_el) = cardinality(pros_en)),
  constraint diets_cons_pair check (cardinality(cons_el) = cardinality(cons_en)),
  constraint diets_avoid_if_pair check (
    cardinality(avoid_if_el) >= 1 and cardinality(avoid_if_el) = cardinality(avoid_if_en)
  )
);

create index if not exists diets_status_idx on hygieia.diets (status);
create index if not exists diets_reviewed_by_idx on hygieia.diets (reviewed_by);

-- =================================================================================================
-- recipes + children
-- =================================================================================================

create table if not exists hygieia.recipes (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title_el text not null check (btrim(title_el) <> ''),
  title_en text not null check (btrim(title_en) <> ''),
  steps_el text[] not null,
  steps_en text[] not null,
  portions integer not null check (portions >= 1),
  prep_min integer not null check (prep_min >= 0),
  meal_types text[] not null check (
    cardinality(meal_types) >= 1 and meal_types <@ array['breakfast', 'lunch', 'dinner', 'snack']
  ),
  image_path text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint recipes_steps_pair check (
    cardinality(steps_el) >= 1 and cardinality(steps_el) = cardinality(steps_en)
  )
);

create index if not exists recipes_status_idx on hygieia.recipes (status);
create index if not exists recipes_reviewed_by_idx on hygieia.recipes (reviewed_by);

-- One ingredient line of a recipe. An ingredient in use cannot be deleted (restrict).
create table if not exists hygieia.recipe_ingredients (
  recipe_id uuid not null references hygieia.recipes (id) on delete cascade,
  ingredient_id uuid not null references hygieia.ingredients (id) on delete restrict,
  position integer not null check (position >= 0),
  quantity numeric not null check (quantity >= 0),
  unit text not null check (unit in ('g', 'ml', 'piece', 'tbsp', 'tsp', 'slice', 'clove', 'bunch')),
  note_el text,
  note_en text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint recipe_ingredients_pkey primary key (recipe_id, position),
  constraint recipe_ingredients_note_pair check ((note_el is null) = (note_en is null))
);

create index if not exists recipe_ingredients_ingredient_id_idx
  on hygieia.recipe_ingredients (ingredient_id);

-- Diet tags of a recipe.
create table if not exists hygieia.recipe_diets (
  recipe_id uuid not null references hygieia.recipes (id) on delete cascade,
  diet_id uuid not null references hygieia.diets (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint recipe_diets_pkey primary key (recipe_id, diet_id)
);

create index if not exists recipe_diets_diet_id_idx on hygieia.recipe_diets (diet_id);

-- =================================================================================================
-- exercises, workout templates + children
-- =================================================================================================

create table if not exists hygieia.exercises (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name_el text not null check (btrim(name_el) <> ''),
  name_en text not null check (btrim(name_en) <> ''),
  cue_el text not null check (btrim(cue_el) <> ''),
  cue_en text not null check (btrim(cue_en) <> ''),
  workout_type text not null check (
    workout_type in ('home', 'gym', 'calisthenics', 'running', 'swimming', 'cycling', 'mobility')
  ),
  level text not null check (level in ('beginner', 'intermediate', 'advanced')),
  muscle_groups text[] not null default '{}',
  equipment_el text,
  equipment_en text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint exercises_equipment_pair check ((equipment_el is null) = (equipment_en is null))
);

create index if not exists exercises_status_idx on hygieia.exercises (status);
create index if not exists exercises_reviewed_by_idx on hygieia.exercises (reviewed_by);

-- One template per (type, level, intensity) cell: the recommendation the UI looks up.
create table if not exists hygieia.workout_templates (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  workout_type text not null check (
    workout_type in ('home', 'gym', 'calisthenics', 'running', 'swimming', 'cycling', 'mobility')
  ),
  level text not null check (level in ('beginner', 'intermediate', 'advanced')),
  intensity text not null check (intensity in ('low', 'moderate', 'high')),
  title_el text not null check (btrim(title_el) <> ''),
  title_en text not null check (btrim(title_en) <> ''),
  duration_min integer not null check (duration_min > 0),
  notes_el text not null check (btrim(notes_el) <> ''),
  notes_en text not null check (btrim(notes_en) <> ''),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint workout_templates_cell_key unique (workout_type, level, intensity)
);

create index if not exists workout_templates_status_idx on hygieia.workout_templates (status);
create index if not exists workout_templates_reviewed_by_idx on hygieia.workout_templates (reviewed_by);

-- One exercise slot of a template. An exercise in use cannot be deleted (restrict).
create table if not exists hygieia.workout_template_exercises (
  template_id uuid not null references hygieia.workout_templates (id) on delete cascade,
  exercise_id uuid not null references hygieia.exercises (id) on delete restrict,
  position integer not null check (position >= 0),
  block text not null check (block in ('warmup', 'main', 'cooldown')),
  sets integer not null check (sets >= 1),
  reps integer check (reps is null or reps >= 1),
  seconds integer check (seconds is null or seconds >= 1),
  rest_seconds integer not null default 0 check (rest_seconds >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint workout_template_exercises_pkey primary key (template_id, position),
  constraint workout_template_exercises_dose check (reps is not null or seconds is not null)
);

create index if not exists workout_template_exercises_exercise_id_idx
  on hygieia.workout_template_exercises (exercise_id);

-- =================================================================================================
-- health tips
-- =================================================================================================

-- A tip either cites a real source or is flagged `needs_source` (PLAN §0 content drafting rule).
create table if not exists hygieia.health_tips (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  topic text not null check (
    topic in ('sleep', 'hydration', 'nutrition', 'movement', 'habits', 'mental')
  ),
  title_el text not null check (btrim(title_el) <> ''),
  title_en text not null check (btrim(title_en) <> ''),
  body_el text not null check (btrim(body_el) <> ''),
  body_en text not null check (btrim(body_en) <> ''),
  source_url text check (source_url is null or source_url ~ '^https?://'),
  needs_source boolean not null default false,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint health_tips_sourced check (source_url is not null or needs_source)
);

create index if not exists health_tips_status_idx on hygieia.health_tips (status);
create index if not exists health_tips_reviewed_by_idx on hygieia.health_tips (reviewed_by);

-- =================================================================================================
-- triggers: updated_at on every table, the review stamp on every status-bearing table
-- =================================================================================================

create or replace trigger ingredients_touch_updated_at before update on hygieia.ingredients
  for each row execute function hygieia.touch_updated_at();
create or replace trigger ingredients_stamp_review before update on hygieia.ingredients
  for each row execute function hygieia.stamp_review();

create or replace trigger diets_touch_updated_at before update on hygieia.diets
  for each row execute function hygieia.touch_updated_at();
create or replace trigger diets_stamp_review before update on hygieia.diets
  for each row execute function hygieia.stamp_review();

create or replace trigger recipes_touch_updated_at before update on hygieia.recipes
  for each row execute function hygieia.touch_updated_at();
create or replace trigger recipes_stamp_review before update on hygieia.recipes
  for each row execute function hygieia.stamp_review();

create or replace trigger recipe_ingredients_touch_updated_at before update on hygieia.recipe_ingredients
  for each row execute function hygieia.touch_updated_at();
create or replace trigger recipe_diets_touch_updated_at before update on hygieia.recipe_diets
  for each row execute function hygieia.touch_updated_at();

create or replace trigger exercises_touch_updated_at before update on hygieia.exercises
  for each row execute function hygieia.touch_updated_at();
create or replace trigger exercises_stamp_review before update on hygieia.exercises
  for each row execute function hygieia.stamp_review();

create or replace trigger workout_templates_touch_updated_at before update on hygieia.workout_templates
  for each row execute function hygieia.touch_updated_at();
create or replace trigger workout_templates_stamp_review before update on hygieia.workout_templates
  for each row execute function hygieia.stamp_review();

create or replace trigger workout_template_exercises_touch_updated_at
  before update on hygieia.workout_template_exercises
  for each row execute function hygieia.touch_updated_at();

create or replace trigger health_tips_touch_updated_at before update on hygieia.health_tips
  for each row execute function hygieia.touch_updated_at();
create or replace trigger health_tips_stamp_review before update on hygieia.health_tips
  for each row execute function hygieia.stamp_review();

-- =================================================================================================
-- RLS
-- =================================================================================================

alter table hygieia.ingredients enable row level security;
alter table hygieia.diets enable row level security;
alter table hygieia.recipes enable row level security;
alter table hygieia.recipe_ingredients enable row level security;
alter table hygieia.recipe_diets enable row level security;
alter table hygieia.exercises enable row level security;
alter table hygieia.workout_templates enable row level security;
alter table hygieia.workout_template_exercises enable row level security;
alter table hygieia.health_tips enable row level security;

-- --- content tables: per-role select, admin update ------------------------------------------------

-- ingredients
drop policy if exists ingredients_select_anon on hygieia.ingredients;
create policy ingredients_select_anon on hygieia.ingredients
  for select to anon using (status = 'approved');
drop policy if exists ingredients_select_auth on hygieia.ingredients;
create policy ingredients_select_auth on hygieia.ingredients
  for select to authenticated using (status = 'approved' or hygieia.is_admin());
drop policy if exists ingredients_update_admin on hygieia.ingredients;
create policy ingredients_update_admin on hygieia.ingredients
  for update to authenticated using (hygieia.is_admin()) with check (hygieia.is_admin());

-- diets
drop policy if exists diets_select_anon on hygieia.diets;
create policy diets_select_anon on hygieia.diets
  for select to anon using (status = 'approved');
drop policy if exists diets_select_auth on hygieia.diets;
create policy diets_select_auth on hygieia.diets
  for select to authenticated using (status = 'approved' or hygieia.is_admin());
drop policy if exists diets_update_admin on hygieia.diets;
create policy diets_update_admin on hygieia.diets
  for update to authenticated using (hygieia.is_admin()) with check (hygieia.is_admin());

-- recipes
drop policy if exists recipes_select_anon on hygieia.recipes;
create policy recipes_select_anon on hygieia.recipes
  for select to anon using (status = 'approved');
drop policy if exists recipes_select_auth on hygieia.recipes;
create policy recipes_select_auth on hygieia.recipes
  for select to authenticated using (status = 'approved' or hygieia.is_admin());
drop policy if exists recipes_update_admin on hygieia.recipes;
create policy recipes_update_admin on hygieia.recipes
  for update to authenticated using (hygieia.is_admin()) with check (hygieia.is_admin());

-- exercises
drop policy if exists exercises_select_anon on hygieia.exercises;
create policy exercises_select_anon on hygieia.exercises
  for select to anon using (status = 'approved');
drop policy if exists exercises_select_auth on hygieia.exercises;
create policy exercises_select_auth on hygieia.exercises
  for select to authenticated using (status = 'approved' or hygieia.is_admin());
drop policy if exists exercises_update_admin on hygieia.exercises;
create policy exercises_update_admin on hygieia.exercises
  for update to authenticated using (hygieia.is_admin()) with check (hygieia.is_admin());

-- workout_templates
drop policy if exists workout_templates_select_anon on hygieia.workout_templates;
create policy workout_templates_select_anon on hygieia.workout_templates
  for select to anon using (status = 'approved');
drop policy if exists workout_templates_select_auth on hygieia.workout_templates;
create policy workout_templates_select_auth on hygieia.workout_templates
  for select to authenticated using (status = 'approved' or hygieia.is_admin());
drop policy if exists workout_templates_update_admin on hygieia.workout_templates;
create policy workout_templates_update_admin on hygieia.workout_templates
  for update to authenticated using (hygieia.is_admin()) with check (hygieia.is_admin());

-- health_tips
drop policy if exists health_tips_select_anon on hygieia.health_tips;
create policy health_tips_select_anon on hygieia.health_tips
  for select to anon using (status = 'approved');
drop policy if exists health_tips_select_auth on hygieia.health_tips;
create policy health_tips_select_auth on hygieia.health_tips
  for select to authenticated using (status = 'approved' or hygieia.is_admin());
drop policy if exists health_tips_update_admin on hygieia.health_tips;
create policy health_tips_update_admin on hygieia.health_tips
  for update to authenticated using (hygieia.is_admin()) with check (hygieia.is_admin());

-- --- child tables: visible iff the parent is approved (or admin); admins edit -----------------------

-- recipe_ingredients (parent: recipes)
drop policy if exists recipe_ingredients_select_anon on hygieia.recipe_ingredients;
create policy recipe_ingredients_select_anon on hygieia.recipe_ingredients
  for select to anon using (
    exists (select 1 from hygieia.recipes r where r.id = recipe_id and r.status = 'approved')
  );
drop policy if exists recipe_ingredients_select_auth on hygieia.recipe_ingredients;
create policy recipe_ingredients_select_auth on hygieia.recipe_ingredients
  for select to authenticated using (
    exists (select 1 from hygieia.recipes r where r.id = recipe_id and r.status = 'approved')
    or hygieia.is_admin()
  );
drop policy if exists recipe_ingredients_insert_admin on hygieia.recipe_ingredients;
create policy recipe_ingredients_insert_admin on hygieia.recipe_ingredients
  for insert to authenticated with check (hygieia.is_admin());
drop policy if exists recipe_ingredients_update_admin on hygieia.recipe_ingredients;
create policy recipe_ingredients_update_admin on hygieia.recipe_ingredients
  for update to authenticated using (hygieia.is_admin()) with check (hygieia.is_admin());
drop policy if exists recipe_ingredients_delete_admin on hygieia.recipe_ingredients;
create policy recipe_ingredients_delete_admin on hygieia.recipe_ingredients
  for delete to authenticated using (hygieia.is_admin());

-- recipe_diets (parent: recipes)
drop policy if exists recipe_diets_select_anon on hygieia.recipe_diets;
create policy recipe_diets_select_anon on hygieia.recipe_diets
  for select to anon using (
    exists (select 1 from hygieia.recipes r where r.id = recipe_id and r.status = 'approved')
  );
drop policy if exists recipe_diets_select_auth on hygieia.recipe_diets;
create policy recipe_diets_select_auth on hygieia.recipe_diets
  for select to authenticated using (
    exists (select 1 from hygieia.recipes r where r.id = recipe_id and r.status = 'approved')
    or hygieia.is_admin()
  );
drop policy if exists recipe_diets_insert_admin on hygieia.recipe_diets;
create policy recipe_diets_insert_admin on hygieia.recipe_diets
  for insert to authenticated with check (hygieia.is_admin());
drop policy if exists recipe_diets_update_admin on hygieia.recipe_diets;
create policy recipe_diets_update_admin on hygieia.recipe_diets
  for update to authenticated using (hygieia.is_admin()) with check (hygieia.is_admin());
drop policy if exists recipe_diets_delete_admin on hygieia.recipe_diets;
create policy recipe_diets_delete_admin on hygieia.recipe_diets
  for delete to authenticated using (hygieia.is_admin());

-- workout_template_exercises (parent: workout_templates)
drop policy if exists workout_template_exercises_select_anon on hygieia.workout_template_exercises;
create policy workout_template_exercises_select_anon on hygieia.workout_template_exercises
  for select to anon using (
    exists (select 1 from hygieia.workout_templates t where t.id = template_id and t.status = 'approved')
  );
drop policy if exists workout_template_exercises_select_auth on hygieia.workout_template_exercises;
create policy workout_template_exercises_select_auth on hygieia.workout_template_exercises
  for select to authenticated using (
    exists (select 1 from hygieia.workout_templates t where t.id = template_id and t.status = 'approved')
    or hygieia.is_admin()
  );
drop policy if exists workout_template_exercises_insert_admin on hygieia.workout_template_exercises;
create policy workout_template_exercises_insert_admin on hygieia.workout_template_exercises
  for insert to authenticated with check (hygieia.is_admin());
drop policy if exists workout_template_exercises_update_admin on hygieia.workout_template_exercises;
create policy workout_template_exercises_update_admin on hygieia.workout_template_exercises
  for update to authenticated using (hygieia.is_admin()) with check (hygieia.is_admin());
drop policy if exists workout_template_exercises_delete_admin on hygieia.workout_template_exercises;
create policy workout_template_exercises_delete_admin on hygieia.workout_template_exercises
  for delete to authenticated using (hygieia.is_admin());

-- =================================================================================================
-- grants
-- =================================================================================================
-- Reset to exactly what the policies admit (idempotent on re-apply), then: anon and authenticated
-- SELECT; authenticated UPDATE on content columns + status only (never id, slug, created_at,
-- reviewed_*); no client INSERT/DELETE on content; admins (via policy) insert/update/delete children;
-- service_role full DML.

revoke all on table
  hygieia.ingredients, hygieia.diets, hygieia.recipes, hygieia.recipe_ingredients, hygieia.recipe_diets,
  hygieia.exercises, hygieia.workout_templates, hygieia.workout_template_exercises, hygieia.health_tips
  from public, anon, authenticated;

grant select on table
  hygieia.ingredients, hygieia.diets, hygieia.recipes, hygieia.recipe_ingredients, hygieia.recipe_diets,
  hygieia.exercises, hygieia.workout_templates, hygieia.workout_template_exercises, hygieia.health_tips
  to anon, authenticated;

grant update (
  name_el, name_en, category, unit, grams_per_unit, kcal_100g, protein_100g, carbs_100g, fat_100g,
  source_note, price_eur_min, price_eur_max, price_per, price_as_of, price_note, substitute_slugs,
  is_pantry_staple, status
) on table hygieia.ingredients to authenticated;

grant update (
  name_el, name_en, summary_el, summary_en, allowed_el, allowed_en, avoided_el, avoided_en,
  pros_el, pros_en, cons_el, cons_en, avoid_if_el, avoid_if_en, source_url, status
) on table hygieia.diets to authenticated;

grant update (
  title_el, title_en, steps_el, steps_en, portions, prep_min, meal_types, image_path, status
) on table hygieia.recipes to authenticated;

grant update (
  name_el, name_en, cue_el, cue_en, workout_type, level, muscle_groups, equipment_el, equipment_en, status
) on table hygieia.exercises to authenticated;

grant update (
  workout_type, level, intensity, title_el, title_en, duration_min, notes_el, notes_en, status
) on table hygieia.workout_templates to authenticated;

grant update (
  topic, title_el, title_en, body_el, body_en, source_url, needs_source, status
) on table hygieia.health_tips to authenticated;

-- Children: an admin edits ingredient lines, diet tags and template slots (policy-gated).
grant insert (recipe_id, ingredient_id, position, quantity, unit, note_el, note_en),
      update (recipe_id, ingredient_id, position, quantity, unit, note_el, note_en),
      delete
  on table hygieia.recipe_ingredients to authenticated;
grant insert (recipe_id, diet_id), update (recipe_id, diet_id), delete
  on table hygieia.recipe_diets to authenticated;
grant insert (template_id, exercise_id, position, block, sets, reps, seconds, rest_seconds),
      update (template_id, exercise_id, position, block, sets, reps, seconds, rest_seconds),
      delete
  on table hygieia.workout_template_exercises to authenticated;

grant select, insert, update, delete on table
  hygieia.ingredients, hygieia.diets, hygieia.recipes, hygieia.recipe_ingredients, hygieia.recipe_diets,
  hygieia.exercises, hygieia.workout_templates, hygieia.workout_template_exercises, hygieia.health_tips
  to service_role;
