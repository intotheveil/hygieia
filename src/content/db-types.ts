// DATABASE TYPE for schema `hygieia` — what `createClient<Database, 'hygieia'>` is pinned with
// (src/lib/supabase.ts, P1.13). Column lists are transcribed from the committed migrations
// (supabase/migrations/20261006000100 … 000400) and PLAN.md §2; the content tables' columns are
// the seed types (src/content/types.ts) plus the review columns, so a drift between the two is
// visible here. Hand-maintained: a new migration that adds or renames a column edits this file.
//
// Postgres → JSON as PostgREST serialises it: uuid/text/date/timestamptz → string, numeric/integer
// → number, text[] → string[], jsonb → Json. `Insert` marks defaulted and server-owned columns
// optional; `Update` is every column optional (what a client may actually change is the column
// grant's business, not the type's).

import type {
  Block,
  ContentStatus,
  Intensity,
  Level,
  MealType,
  PricePer,
  TipTopic,
  Unit,
  WorkoutType,
} from './enums.ts'

export type Json = string | number | boolean | null | Json[] | { [key: string]: Json }

/** The review columns every content table carries (PLAN.md §1.3, §1.6). */
type ReviewRow = {
  id: string
  status: ContentStatus
  reviewed_at: string | null
  reviewed_by: string | null
  created_at: string
  updated_at: string
}

/** The server-owned part of a content insert: all defaulted, so all optional. */
type ReviewInsert = {
  id?: string
  status?: ContentStatus
  reviewed_at?: string | null
  reviewed_by?: string | null
  created_at?: string
  updated_at?: string
}

type Timestamps = {
  created_at: string
  updated_at: string
}

type TimestampsInsert = {
  created_at?: string
  updated_at?: string
}

// --- content tables -----------------------------------------------------------------------------

type IngredientColumns = {
  slug: string
  name_el: string
  name_en: string
  category: string
  unit: Unit
  grams_per_unit: number
  kcal_100g: number
  protein_100g: number
  carbs_100g: number
  fat_100g: number
  source_note: string
  price_eur_min: number
  price_eur_max: number
  price_per: PricePer
  price_as_of: string
  price_note: string
  substitute_slugs: string[]
  is_pantry_staple: boolean
}

type DietColumns = {
  slug: string
  name_el: string
  name_en: string
  summary_el: string
  summary_en: string
  allowed_el: string[]
  allowed_en: string[]
  avoided_el: string[]
  avoided_en: string[]
  pros_el: string[]
  pros_en: string[]
  cons_el: string[]
  cons_en: string[]
  avoid_if_el: string[]
  avoid_if_en: string[]
  source_url: string | null
}

type RecipeColumns = {
  slug: string
  title_el: string
  title_en: string
  steps_el: string[]
  steps_en: string[]
  portions: number
  prep_min: number
  meal_types: MealType[]
  image_path: string | null
}

type ExerciseColumns = {
  slug: string
  name_el: string
  name_en: string
  cue_el: string
  cue_en: string
  workout_type: WorkoutType
  level: Level
  muscle_groups: string[]
  equipment_el: string | null
  equipment_en: string | null
}

type WorkoutTemplateColumns = {
  slug: string
  workout_type: WorkoutType
  level: Level
  intensity: Intensity
  title_el: string
  title_en: string
  duration_min: number
  notes_el: string
  notes_en: string
}

type HealthTipColumns = {
  slug: string
  topic: TipTopic
  title_el: string
  title_en: string
  body_el: string
  body_en: string
  source_url: string | null
  needs_source: boolean
}

// --- child tables -------------------------------------------------------------------------------

export type RecipeIngredientRow = Timestamps & {
  recipe_id: string
  ingredient_id: string
  position: number
  quantity: number
  unit: Unit
  note_el: string | null
  note_en: string | null
}

export type RecipeDietRow = Timestamps & {
  recipe_id: string
  diet_id: string
}

export type WorkoutTemplateExerciseRow = Timestamps & {
  template_id: string
  exercise_id: string
  position: number
  block: Block
  sets: number
  reps: number | null
  seconds: number | null
  rest_seconds: number
}

// --- per-user and service tables ----------------------------------------------------------------

export type ProfileRow = Timestamps & {
  user_id: string
  display_name: string | null
  is_admin: boolean
}

export type FridgeListRow = Timestamps & {
  id: string
  user_id: string
  name: string
  ingredient_slugs: string[]
}

export type SavedPlanRow = Timestamps & {
  id: string
  user_id: string
  diet_id: string
  week_start: string
  plan: Json
}

export type FavouriteRow = Timestamps & {
  user_id: string
  recipe_id: string
}

export type SchemaMigrationRow = {
  version: string
  name: string
  checksum: string
  applied_at: string
}

// --- the Database -------------------------------------------------------------------------------

type Relationship = {
  foreignKeyName: string
  columns: string[]
  isOneToOne?: boolean
  referencedRelation: string
  referencedColumns: string[]
}

type Table<Row, Insert, Rel extends Relationship[] = Relationship[]> = {
  Row: Row
  Insert: Insert
  Update: Partial<Row>
  Relationships: Rel
}

type ContentTable<Columns> = Table<Columns & ReviewRow, Columns & ReviewInsert>

export type Database = {
  hygieia: {
    Tables: {
      schema_migrations: Table<
        SchemaMigrationRow,
        Omit<SchemaMigrationRow, 'applied_at'> & { applied_at?: string },
        []
      >
      profiles: Table<
        ProfileRow,
        { user_id: string; display_name?: string | null; is_admin?: boolean } & TimestampsInsert,
        []
      >
      ingredients: ContentTable<IngredientColumns>
      diets: ContentTable<DietColumns>
      recipes: ContentTable<RecipeColumns>
      recipe_ingredients: Table<
        RecipeIngredientRow,
        Omit<RecipeIngredientRow, 'note_el' | 'note_en' | 'created_at' | 'updated_at'> & {
          note_el?: string | null
          note_en?: string | null
        } & TimestampsInsert,
        [
          {
            foreignKeyName: 'recipe_ingredients_recipe_id_fkey'
            columns: ['recipe_id']
            referencedRelation: 'recipes'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'recipe_ingredients_ingredient_id_fkey'
            columns: ['ingredient_id']
            referencedRelation: 'ingredients'
            referencedColumns: ['id']
          },
        ]
      >
      recipe_diets: Table<
        RecipeDietRow,
        Omit<RecipeDietRow, 'created_at' | 'updated_at'> & TimestampsInsert,
        [
          {
            foreignKeyName: 'recipe_diets_recipe_id_fkey'
            columns: ['recipe_id']
            referencedRelation: 'recipes'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'recipe_diets_diet_id_fkey'
            columns: ['diet_id']
            referencedRelation: 'diets'
            referencedColumns: ['id']
          },
        ]
      >
      exercises: ContentTable<ExerciseColumns>
      workout_templates: ContentTable<WorkoutTemplateColumns>
      workout_template_exercises: Table<
        WorkoutTemplateExerciseRow,
        Omit<
          WorkoutTemplateExerciseRow,
          'reps' | 'seconds' | 'rest_seconds' | 'created_at' | 'updated_at'
        > & {
          reps?: number | null
          seconds?: number | null
          rest_seconds?: number
        } & TimestampsInsert,
        [
          {
            foreignKeyName: 'workout_template_exercises_template_id_fkey'
            columns: ['template_id']
            referencedRelation: 'workout_templates'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'workout_template_exercises_exercise_id_fkey'
            columns: ['exercise_id']
            referencedRelation: 'exercises'
            referencedColumns: ['id']
          },
        ]
      >
      health_tips: ContentTable<HealthTipColumns>
      fridge_lists: Table<
        FridgeListRow,
        {
          id?: string
          user_id?: string
          name: string
          ingredient_slugs?: string[]
        } & TimestampsInsert,
        []
      >
      saved_plans: Table<
        SavedPlanRow,
        {
          id?: string
          user_id?: string
          diet_id: string
          week_start: string
          plan: Json
        } & TimestampsInsert,
        [
          {
            foreignKeyName: 'saved_plans_diet_id_fkey'
            columns: ['diet_id']
            referencedRelation: 'diets'
            referencedColumns: ['id']
          },
        ]
      >
      favourites: Table<
        FavouriteRow,
        { user_id?: string; recipe_id: string } & TimestampsInsert,
        [
          {
            foreignKeyName: 'favourites_recipe_id_fkey'
            columns: ['recipe_id']
            referencedRelation: 'recipes'
            referencedColumns: ['id']
          },
        ]
      >
    }
    Views: Record<string, never>
    Functions: {
      is_admin: { Args: Record<PropertyKey, never>; Returns: boolean }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

export type Tables = Database['hygieia']['Tables']
export type TableName = keyof Tables
export type Row<T extends TableName> = Tables[T]['Row']
