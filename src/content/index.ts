// THE APP'S CONTENT SOURCE (PLAN.md §1 item 5, P1.13): `local` mode (no Supabase configured) reads
// the bundled seeds and shows the draft ribbon; `configured` mode reads `approved` rows from
// schema `hygieia`. Screens import `contentSource` from here and never pick an implementation
// themselves; tests build either implementation directly (./bundled.ts, ./supabase.ts).
//
// In configured mode the Supabase client is created lazily (src/lib/supabase.ts, P5.3 perf
// follow-up), so the source is built on first read: `deferredSource` is a `ContentSource` whose
// `kind` is known at once and whose every method awaits the real source, then delegates. A library
// chunk that cannot be loaded resolves to `fail('network')` — the same outcome as a Supabase outage
// or a bundled seed chunk that fails (./bundled.ts) — so the source still never throws.

import { appEnv } from '../lib/env'
import { getSupabase } from '../lib/supabase'
import { bundledSource } from './bundled.ts'
import { fail, type ContentSource } from './source.ts'
import { supabaseSource } from './supabase.ts'

/** A source that is resolved once, on the first read; a failed resolution is retried next time. */
export function deferredSource(
  kind: ContentSource['kind'],
  load: () => Promise<ContentSource>,
): ContentSource {
  let pending: Promise<ContentSource> | undefined
  const source = (): Promise<ContentSource> => {
    if (pending === undefined) {
      const attempt = load()
      pending = attempt
      attempt.catch(() => {
        if (pending === attempt) pending = undefined
      })
    }
    return pending
  }
  const via =
    <A extends unknown[], T>(call: (s: ContentSource, ...args: A) => Promise<T>) =>
    (...args: A): Promise<T | ReturnType<typeof fail<never>>> =>
      source().then(
        (s) => call(s, ...args),
        () => fail('network'),
      )
  return {
    kind,
    listIngredients: via((s) => s.listIngredients()),
    listDiets: via((s) => s.listDiets()),
    listRecipes: via((s, filter) => s.listRecipes(filter)),
    getRecipe: via((s, slug) => s.getRecipe(slug)),
    listExercises: via((s) => s.listExercises()),
    listWorkoutTemplates: via((s) => s.listWorkoutTemplates()),
    getWorkoutTemplate: via((s, type, level, intensity) =>
      s.getWorkoutTemplate(type, level, intensity),
    ),
    listTips: via((s) => s.listTips()),
  }
}

async function loadSupabaseSource(): Promise<ContentSource> {
  const client = await getSupabase()
  // Unreachable in configured mode (`clientFor` is null only for local mode); typed as a failure
  // rather than a non-null assertion so a future mode cannot crash a read.
  if (client === null) throw new Error('content: configured mode without a Supabase client')
  return supabaseSource(client)
}

export const contentSource: ContentSource =
  appEnv.mode === 'configured' ? deferredSource('supabase', loadSupabaseSource) : bundledSource

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
