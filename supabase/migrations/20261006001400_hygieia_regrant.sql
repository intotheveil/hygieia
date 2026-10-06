-- Hygieia regrant (2026-10-06, P8.QA security finding). Exposing schema `hygieia` in the Supabase
-- Dashboard (O1) granted ALL table privileges to anon and authenticated on every table that existed at
-- that moment (the 16 tables of 000100-000400). RLS still applied, but the column-limited grants were
-- the only guard on hygieia.profiles.is_admin: any signed-in user could have set their own flag.
-- Verified unexploited (0 profiles, 0 admins). This file re-asserts EXACTLY the grants those four
-- migrations declare. Idempotent; schema hygieia only; forward-only.

revoke all on table hygieia.profiles from public, anon, authenticated;
grant select on table hygieia.profiles to authenticated;
grant insert (user_id, display_name) on table hygieia.profiles to authenticated;
grant update (display_name) on table hygieia.profiles to authenticated;
grant select, insert, update, delete on table hygieia.profiles to service_role;
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
revoke all on table hygieia.schema_migrations from public, anon, authenticated;
grant select, insert, update, delete on table hygieia.schema_migrations to service_role;
