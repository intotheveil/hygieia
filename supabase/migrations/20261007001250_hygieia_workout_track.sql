-- Hygieia workout tracks (2026-10-11, women's strength track — docs/research/women-audience-content.md
-- proposal 1). Until now `workout_templates` was keyed by its CELL alone — unique (workout_type, level,
-- intensity) — and the P4.8 seed fills all 63 cells, so no second programme could ever be added: an
-- extra template in an occupied cell fails the unique key. A TRACK names the programme a template
-- belongs to: every existing row is `general` (the column default), the women's strength-training
-- templates of overlay 0013 are `women-strength`, and the cell key becomes (track, workout_type, level,
-- intensity) — one template per cell PER TRACK. The track list mirrors src/content/enums.ts
-- WORKOUT_TRACKS (the gate's enum check pins the equality).
--
-- `track` is an editable content column like `workout_type`: the admin's UPDATE grant is re-stated
-- with it (column grants are additive; `status` stays last, as src/admin/adminSource.test.ts reads the
-- newest grant). Nothing is granted to anon; no client INSERT/DELETE on content.
--
-- Every object lives in schema `hygieia` (ADR-0003). Idempotent-safe (the gate applies the archive
-- twice; live it is applied once): `add column if not exists`, and every constraint is dropped
-- `if exists` before it is (re)added. Forward-only: this file is NEW; no shipped migration is touched.

alter table hygieia.workout_templates
  add column if not exists track text not null default 'general';

alter table hygieia.workout_templates drop constraint if exists workout_templates_track_check;
alter table hygieia.workout_templates
  add constraint workout_templates_track_check check (track in ('general', 'women-strength'));

alter table hygieia.workout_templates drop constraint if exists workout_templates_cell_key;
alter table hygieia.workout_templates
  add constraint workout_templates_cell_key unique (track, workout_type, level, intensity);

grant update (
  workout_type, level, intensity, title_el, title_en, duration_min, notes_el, notes_en, track, status
) on table hygieia.workout_templates to authenticated;
