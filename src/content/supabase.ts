// SUPABASE CONTENT SOURCE — `approved` rows from schema `hygieia` (PLAN.md §1 items 3–5, P1.13).
// Table names are unqualified: the client is pinned with `db: { schema: 'hygieia' }`
// (src/lib/supabase.ts). RLS already hides anything not approved from anon/authenticated, but an
// admin reads everything, so every query ALSO filters `status = 'approved'` — defence in depth
// and one behaviour for every caller. Children (ingredient lines, diet tags, exercise slots) are
// embedded by PostgREST in the same request; a child whose own parent-side row is hidden arrives
// as null and is kept as such (see `RecipeLine` in ./source.ts).
//
// Like auth/profile.ts and user/supabase.ts, the module talks to the client through a small typed
// adapter (`contentClientFor`): a direct structural assignment of the real client to a narrow
// interface makes TypeScript walk Supabase's query-builder generics until it gives up (TS2589).
// The adapter pins the exact chains, so the compiler still checks them against the real client.
//
// Rows are parsed defensively: a column of the wrong kind makes the read `unknown`, never a crash.

import type { HygieiaClient } from '../lib/supabase'
import {
  CONTENT_STATUSES,
  type ContentTable,
  type Intensity,
  type Level,
  type WorkoutType,
} from './enums.ts'
import {
  fail,
  filterRecipes,
  ok,
  type ContentError,
  type ContentSource,
  type Diet,
  type Exercise,
  type HealthTip,
  type Ingredient,
  type Recipe,
  type RecipeFilter,
  type RecipeLine,
  type Result,
  type WorkoutSlot,
  type WorkoutTemplate,
} from './source.ts'
import type { RecipeLineSeed, WorkoutBlockSeed } from './types.ts'

// --- the select strings (exported so tests assert them rather than re-type them) -----------------

export const APPROVED_FILTER: readonly [column: 'status', value: 'approved'] = [
  'status',
  CONTENT_STATUSES[1],
]

export const PLAIN_SELECT = '*'
export const RECIPE_SELECT =
  '*, recipe_ingredients(*, ingredient:ingredients(*)), recipe_diets(diet:diets(slug))'
export const WORKOUT_SELECT = '*, workout_template_exercises(*, exercise:exercises(*))'

// --- the adapter ----------------------------------------------------------------------------------

export interface QueryError {
  message: string
  code?: string
}

export interface QueryResult {
  data: unknown
  error: QueryError | null
}

export type Filter = readonly [column: string, value: string]

/** The slice of the client this module uses: a filtered list, or a filtered single row. */
export interface ContentClient {
  list(table: ContentTable, columns: string, filters: readonly Filter[]): PromiseLike<QueryResult>
  one(table: ContentTable, columns: string, filters: readonly Filter[]): PromiseLike<QueryResult>
}

export function contentClientFor(client: HygieiaClient): ContentClient {
  const query = (table: ContentTable, columns: string, filters: readonly Filter[]) => {
    let q = client.from(table).select(columns)
    for (const [column, value] of filters) q = q.eq(column, value)
    return q
  }
  return {
    list: (table, columns, filters) => query(table, columns, filters),
    one: (table, columns, filters) => query(table, columns, filters).maybeSingle(),
  }
}

// --- error classification (twin of user/supabase.ts `classifyError`) ------------------------------

/**
 * A transport failure surfaces as a thrown `TypeError` or an error object with no PostgREST
 * `code`: that is `network` (worth a retry). Anything the server actually said is `unknown`.
 */
export function classifyError(error: unknown): ContentError {
  if (error instanceof Error) return error instanceof TypeError ? 'network' : 'unknown'
  if (typeof error === 'object' && error !== null) {
    const code = (error as { code?: unknown }).code
    if (typeof code !== 'string' || code === '') return 'network'
  }
  return 'unknown'
}

async function run<T>(
  call: () => PromiseLike<QueryResult>,
  parse: (data: unknown) => T | null,
): Promise<Result<T>> {
  try {
    const { data, error } = await call()
    if (error) return fail(classifyError(error))
    const parsed = parse(data)
    return parsed === null ? fail('unknown') : ok(parsed)
  } catch (error) {
    return fail(classifyError(error))
  }
}

// --- row parsing ----------------------------------------------------------------------------------

type Raw = Record<string, unknown>

/** The JSON kinds a column may arrive as; `number` also accepts a numeric string (Postgres `numeric`). */
type Kind = 'string' | 'number' | 'boolean' | 'string[]' | 'string|null' | 'number|null' | 'status'

/** One `Kind` per key of `T` — `Spec<Ingredient>` cannot miss or misspell a column. */
type Spec<T> = { readonly [K in keyof T]-?: Kind }

const INVALID: unique symbol = Symbol('invalid')

function asRaw(data: unknown): Raw | null {
  return typeof data === 'object' && data !== null && !Array.isArray(data) ? (data as Raw) : null
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((v) => typeof v === 'string')
}

function asNumber(value: unknown): number | typeof INVALID {
  if (typeof value === 'number') return Number.isFinite(value) ? value : INVALID
  if (typeof value === 'string' && value.trim() !== '') {
    const n = Number(value)
    return Number.isFinite(n) ? n : INVALID
  }
  return INVALID
}

function coerce(value: unknown, kind: Kind): unknown {
  switch (kind) {
    case 'string':
      return typeof value === 'string' ? value : INVALID
    case 'number':
      return asNumber(value)
    case 'boolean':
      return typeof value === 'boolean' ? value : INVALID
    case 'string[]':
      return isStringArray(value) ? value : INVALID
    case 'string|null':
      return value === null || value === undefined
        ? null
        : typeof value === 'string'
          ? value
          : INVALID
    case 'number|null':
      return value === null || value === undefined ? null : asNumber(value)
    case 'status':
      return typeof value === 'string' && (CONTENT_STATUSES as readonly string[]).includes(value)
        ? value
        : INVALID
  }
}

/** Check every key of `spec` against its kind; any mismatch makes the whole row null. */
function parseRow<T>(data: unknown, spec: Spec<T>): T | null {
  const raw = asRaw(data)
  if (!raw) return null
  const out: Raw = {}
  for (const key of Object.keys(spec)) {
    const value = coerce(raw[key], spec[key as keyof T])
    if (value === INVALID) return null
    out[key] = value
  }
  // reason: every key of T was checked against its declared Kind just above; the enum-valued
  // columns (unit, level, meal_types, …) are narrowed by the DB CHECK constraints the migration
  // carries, which `Kind` does not re-encode.
  return out as T
}

/** Every element must parse; one bad row makes the whole read `unknown`. */
function listOf<T>(parse: (data: unknown) => T | null): (data: unknown) => T[] | null {
  return (data) => {
    if (!Array.isArray(data)) return null
    const out: T[] = []
    for (const item of data) {
      const parsed = parse(item)
      if (parsed === null) return null
      out.push(parsed)
    }
    return out
  }
}

/** `maybeSingle()` answers `null` for no row; a present row must parse. */
function oneOf<T>(parse: (data: unknown) => T | null): (data: unknown) => T | null | typeof NONE {
  return (data) => (data === null ? NONE : parse(data))
}

/** Sentinel so `run` can tell "no row" (ok, null) from "unparseable row" (unknown). */
const NONE: unique symbol = Symbol('none')

async function runOne<T>(
  call: () => PromiseLike<QueryResult>,
  parse: (data: unknown) => T | null,
): Promise<Result<T | null>> {
  const result = await run(call, oneOf(parse))
  if (!result.ok) return result
  return ok(result.data === NONE ? null : result.data)
}

const INGREDIENT_SPEC: Spec<Ingredient> = {
  id: 'string',
  status: 'status',
  slug: 'string',
  name_el: 'string',
  name_en: 'string',
  category: 'string',
  unit: 'string',
  grams_per_unit: 'number',
  kcal_100g: 'number',
  protein_100g: 'number',
  carbs_100g: 'number',
  fat_100g: 'number',
  source_note: 'string',
  price_eur_min: 'number',
  price_eur_max: 'number',
  price_per: 'string',
  price_as_of: 'string',
  price_note: 'string',
  substitute_slugs: 'string[]',
  is_pantry_staple: 'boolean',
}

const DIET_SPEC: Spec<Diet> = {
  id: 'string',
  status: 'status',
  slug: 'string',
  name_el: 'string',
  name_en: 'string',
  summary_el: 'string',
  summary_en: 'string',
  allowed_el: 'string[]',
  allowed_en: 'string[]',
  avoided_el: 'string[]',
  avoided_en: 'string[]',
  pros_el: 'string[]',
  pros_en: 'string[]',
  cons_el: 'string[]',
  cons_en: 'string[]',
  avoid_if_el: 'string[]',
  avoid_if_en: 'string[]',
  source_url: 'string|null',
}

const EXERCISE_SPEC: Spec<Exercise> = {
  id: 'string',
  status: 'status',
  slug: 'string',
  name_el: 'string',
  name_en: 'string',
  cue_el: 'string',
  cue_en: 'string',
  workout_type: 'string',
  level: 'string',
  muscle_groups: 'string[]',
  equipment_el: 'string|null',
  equipment_en: 'string|null',
}

const TIP_SPEC: Spec<HealthTip> = {
  id: 'string',
  status: 'status',
  slug: 'string',
  topic: 'string',
  title_el: 'string',
  title_en: 'string',
  body_el: 'string',
  body_en: 'string',
  source_url: 'string|null',
  needs_source: 'boolean',
}

type RecipeBase = Omit<Recipe, 'ingredients' | 'diet_slugs' | 'lines'>
const RECIPE_SPEC: Spec<RecipeBase> = {
  id: 'string',
  status: 'status',
  slug: 'string',
  title_el: 'string',
  title_en: 'string',
  steps_el: 'string[]',
  steps_en: 'string[]',
  portions: 'number',
  prep_min: 'number',
  meal_types: 'string[]',
  image_path: 'string|null',
}

type TemplateBase = Omit<WorkoutTemplate, 'blocks' | 'slots'>
const TEMPLATE_SPEC: Spec<TemplateBase> = {
  id: 'string',
  status: 'status',
  slug: 'string',
  workout_type: 'string',
  level: 'string',
  intensity: 'string',
  title_el: 'string',
  title_en: 'string',
  duration_min: 'number',
  notes_el: 'string',
  notes_en: 'string',
}

/** Embedded children, sorted by `position` so the order is the recipe's, not PostgREST's. */
function childrenOf(raw: Raw, key: string): Raw[] | null {
  const value = raw[key]
  if (value === null || value === undefined) return []
  if (!Array.isArray(value)) return null
  const rows: Raw[] = []
  for (const item of value) {
    const row = asRaw(item)
    if (!row) return null
    rows.push(row)
  }
  return rows
}

function byPosition(a: Raw, b: Raw): number {
  const pa = asNumber(a.position)
  const pb = asNumber(b.position)
  return (pa === INVALID ? 0 : pa) - (pb === INVALID ? 0 : pb)
}

interface LineChild {
  ingredient_id: string
  quantity: number
  unit: string
  note_el: string | null
  note_en: string | null
}
const LINE_CHILD_SPEC: Spec<LineChild> = {
  ingredient_id: 'string',
  quantity: 'number',
  unit: 'string',
  note_el: 'string|null',
  note_en: 'string|null',
}

/**
 * One `recipe_ingredients` row with its `ingredient` embed. When the ingredient is hidden (not
 * approved) the embed is null; the line is then keyed by the ingredient's id so it stays unique
 * and visibly unresolved (the fridge matcher reports such slugs under `unknown`).
 */
function toRecipeLine(data: unknown): RecipeLine | null {
  const raw = asRaw(data)
  if (!raw) return null
  const child = parseRow(raw, LINE_CHILD_SPEC)
  if (!child) return null
  const ingredient = raw.ingredient == null ? null : parseRow(raw.ingredient, INGREDIENT_SPEC)
  if (raw.ingredient != null && ingredient === null) return null
  const line: RecipeLineSeed = {
    ingredient_slug: ingredient?.slug ?? child.ingredient_id,
    quantity: child.quantity,
    // reason: `unit` is CHECK-constrained to the Unit literals in the DB; the Spec checks it is a string.
    unit: child.unit as RecipeLineSeed['unit'],
  }
  if (child.note_el !== null && child.note_en !== null) {
    line.note_el = child.note_el
    line.note_en = child.note_en
  }
  return { line, ingredient }
}

/** One `recipe_diets` row's `diet` embed → slug; a hidden diet contributes nothing. */
function toDietSlug(data: unknown): string | null | undefined {
  const raw = asRaw(data)
  if (!raw) return null
  if (raw.diet == null) return undefined
  const diet = asRaw(raw.diet)
  return diet && typeof diet.slug === 'string' ? diet.slug : null
}

export function toRecipe(data: unknown): Recipe | null {
  const raw = asRaw(data)
  if (!raw) return null
  const base = parseRow(raw, RECIPE_SPEC)
  if (!base) return null
  const lineRows = childrenOf(raw, 'recipe_ingredients')
  const dietRows = childrenOf(raw, 'recipe_diets')
  if (!lineRows || !dietRows) return null
  const lines: RecipeLine[] = []
  for (const row of lineRows.sort(byPosition)) {
    const line = toRecipeLine(row)
    if (!line) return null
    lines.push(line)
  }
  const diet_slugs: string[] = []
  for (const row of dietRows) {
    const slug = toDietSlug(row)
    if (slug === null) return null
    if (slug !== undefined) diet_slugs.push(slug)
  }
  diet_slugs.sort()
  return { ...base, ingredients: lines.map((l) => l.line), diet_slugs, lines }
}

interface SlotChild {
  exercise_id: string
  block: string
  sets: number
  reps: number | null
  seconds: number | null
  rest_seconds: number
}
const SLOT_CHILD_SPEC: Spec<SlotChild> = {
  exercise_id: 'string',
  block: 'string',
  sets: 'number',
  reps: 'number|null',
  seconds: 'number|null',
  rest_seconds: 'number',
}

function toWorkoutSlot(data: unknown): WorkoutSlot | null {
  const raw = asRaw(data)
  if (!raw) return null
  const child = parseRow(raw, SLOT_CHILD_SPEC)
  if (!child) return null
  const exercise = raw.exercise == null ? null : parseRow(raw.exercise, EXERCISE_SPEC)
  if (raw.exercise != null && exercise === null) return null
  const block: WorkoutBlockSeed = {
    // reason: `block` is CHECK-constrained to the Block literals in the DB; the Spec checks it is a string.
    block: child.block as WorkoutBlockSeed['block'],
    exercise_slug: exercise?.slug ?? child.exercise_id,
    sets: child.sets,
    reps: child.reps,
    seconds: child.seconds,
    rest_seconds: child.rest_seconds,
  }
  return { block, exercise }
}

export function toWorkoutTemplate(data: unknown): WorkoutTemplate | null {
  const raw = asRaw(data)
  if (!raw) return null
  const base = parseRow(raw, TEMPLATE_SPEC)
  if (!base) return null
  const slotRows = childrenOf(raw, 'workout_template_exercises')
  if (!slotRows) return null
  const slots: WorkoutSlot[] = []
  for (const row of slotRows.sort(byPosition)) {
    const slot = toWorkoutSlot(row)
    if (!slot) return null
    slots.push(slot)
  }
  return { ...base, blocks: slots.map((s) => s.block), slots }
}

export const toIngredient = (data: unknown): Ingredient | null => parseRow(data, INGREDIENT_SPEC)
export const toDiet = (data: unknown): Diet | null => parseRow(data, DIET_SPEC)
export const toExercise = (data: unknown): Exercise | null => parseRow(data, EXERCISE_SPEC)
export const toHealthTip = (data: unknown): HealthTip | null => parseRow(data, TIP_SPEC)

// --- the source -----------------------------------------------------------------------------------

/** A content source over an already-adapted client (tests pass a fake `ContentClient` here). */
export function supabaseSourceFor(client: ContentClient): ContentSource {
  const approved: readonly Filter[] = [APPROVED_FILTER]
  return {
    kind: 'supabase',
    listIngredients: () =>
      run(() => client.list('ingredients', PLAIN_SELECT, approved), listOf(toIngredient)),
    listDiets: () => run(() => client.list('diets', PLAIN_SELECT, approved), listOf(toDiet)),
    listRecipes: async (filter?: RecipeFilter) => {
      const result = await run(
        () => client.list('recipes', RECIPE_SELECT, approved),
        listOf(toRecipe),
      )
      return result.ok ? ok(filterRecipes(result.data, filter)) : result
    },
    getRecipe: (slug: string) =>
      runOne(() => client.one('recipes', RECIPE_SELECT, [...approved, ['slug', slug]]), toRecipe),
    listExercises: () =>
      run(() => client.list('exercises', PLAIN_SELECT, approved), listOf(toExercise)),
    listWorkoutTemplates: () =>
      run(
        () => client.list('workout_templates', WORKOUT_SELECT, approved),
        listOf(toWorkoutTemplate),
      ),
    getWorkoutTemplate: (type: WorkoutType, level: Level, intensity: Intensity) =>
      runOne(
        () =>
          client.one('workout_templates', WORKOUT_SELECT, [
            ...approved,
            ['workout_type', type],
            ['level', level],
            ['intensity', intensity],
          ]),
        toWorkoutTemplate,
      ),
    listTips: () =>
      run(() => client.list('health_tips', PLAIN_SELECT, approved), listOf(toHealthTip)),
  }
}

/** The supabase content source over the real client. */
export function supabaseSource(client: HygieiaClient): ContentSource {
  return supabaseSourceFor(contentClientFor(client))
}
