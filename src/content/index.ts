// THE APP'S CONTENT SOURCE (PLAN.md §1 item 5, P1.13): `local` mode (no Supabase configured) reads
// the bundled seeds and shows the draft ribbon; `configured` mode reads `approved` rows from
// schema `hygieia`. Screens import `contentSource` from here and never pick an implementation
// themselves; tests build either implementation directly (./bundled.ts, ./supabase.ts).

import { appEnv } from '../lib/env'
import { supabase } from '../lib/supabase'
import { bundledSource } from './bundled.ts'
import type { ContentSource } from './source.ts'
import { supabaseSource } from './supabase.ts'

export const contentSource: ContentSource =
  appEnv.mode === 'configured' && supabase !== null ? supabaseSource(supabase) : bundledSource

export type {
  ContentError,
  ContentMeta,
  ContentSource,
  Diet,
  Exercise,
  HealthTip,
  Ingredient,
  Recipe,
  RecipeFilter,
  RecipeLine,
  Result,
  WorkoutSlot,
  WorkoutTemplate,
} from './source.ts'
