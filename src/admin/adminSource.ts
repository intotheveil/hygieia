// ADMIN CONTENT SOURCE (P4.10): what the review page reads and writes. Unlike the app's
// ContentSource (src/content/supabase.ts) it does NOT filter `status = 'approved'`: an admin reads
// every status (the `authenticated` SELECT policy admits `hygieia.is_admin()`, PLAN.md §1 item 4)
// and may UPDATE the content columns plus `status` (the column grant in
// supabase/migrations/20261006000300_hygieia_content.sql). Nothing here can INSERT or DELETE —
// there is no method for it, just as there is no grant. Approve/reject is a status update; the
// DB's BEFORE UPDATE trigger stamps `reviewed_at` / `reviewed_by`, never the client.
//
// Writes are column-exact. `update` sends ONLY the keys it is given, refuses the server-owned
// columns twice (the `AdminPatch` type forbids them; the runtime check catches a spread that
// carried one anyway) and refuses an empty patch. `setStatus` sends `{ status }` and nothing else.
//
// Like the other sources the module talks to the client through a small typed adapter
// (`adminClientFor`): a direct structural assignment of the real client to a narrow interface
// makes TypeScript walk Supabase's query-builder generics until it gives up (TS2589).

import type { Tables } from '../content/db-types.ts'
import {
  CONTENT_STATUSES,
  CONTENT_TABLES,
  type ContentStatus,
  type ContentTable,
} from '../content/enums.ts'
import { classifyError, type Filter, type QueryResult } from '../content/supabase.ts'
import type { HygieiaClient } from '../lib/supabase'

// --- rows and patches -----------------------------------------------------------------------------

/** A content row as the DB returns it to an admin: content columns plus the review columns. */
export type AdminRow<T extends ContentTable = ContentTable> = Tables[T]['Row']

/**
 * Columns no client may change: server-owned (`id`, `created_at`, `updated_at`), stamped by the
 * review trigger (`reviewed_at`, `reviewed_by`) or the content's identity (`slug`, PLAN.md §1.6).
 * None of them is in the UPDATE grant; sending one would fail at the DB — this refuses it earlier.
 */
export const LOCKED_COLUMNS = [
  'id',
  'slug',
  'created_at',
  'updated_at',
  'reviewed_at',
  'reviewed_by',
] as const
export type LockedColumn = (typeof LOCKED_COLUMNS)[number]

/** `status` has its own path (`setStatus`); `update` is for content columns only. */
export type ContentColumn<T extends ContentTable> = Exclude<
  keyof AdminRow<T> & string,
  LockedColumn | 'status'
>

/**
 * What `update` accepts: any subset of the content columns, with the locked columns and `status`
 * forbidden at the type level (`never`), so `{ ...row }` does not compile either.
 */
export type AdminPatch<T extends ContentTable> = {
  [K in ContentColumn<T>]?: AdminRow<T>[K]
} & { [K in LockedColumn | 'status']?: never }

/**
 * The content columns of each table, in the order of the migration's UPDATE grant. The review form
 * renders exactly these; `update` sends nothing outside them. `Record<ContentTable, …>` plus the
 * per-table key type make a missing or misspelled column a compile error.
 */
export const EDITABLE_COLUMNS: { readonly [T in ContentTable]: ReadonlyArray<ContentColumn<T>> } = {
  ingredients: [
    'name_el',
    'name_en',
    'category',
    'unit',
    'grams_per_unit',
    'kcal_100g',
    'protein_100g',
    'carbs_100g',
    'fat_100g',
    'source_note',
    'price_eur_min',
    'price_eur_max',
    'price_per',
    'price_as_of',
    'price_note',
    'substitute_slugs',
    'is_pantry_staple',
  ],
  diets: [
    'name_el',
    'name_en',
    'summary_el',
    'summary_en',
    'allowed_el',
    'allowed_en',
    'avoided_el',
    'avoided_en',
    'pros_el',
    'pros_en',
    'cons_el',
    'cons_en',
    'avoid_if_el',
    'avoid_if_en',
    'source_url',
  ],
  recipes: [
    'title_el',
    'title_en',
    'steps_el',
    'steps_en',
    'portions',
    'prep_min',
    'meal_types',
    'image_path',
  ],
  exercises: [
    'name_el',
    'name_en',
    'cue_el',
    'cue_en',
    'workout_type',
    'level',
    'muscle_groups',
    'equipment_el',
    'equipment_en',
  ],
  workout_templates: [
    'workout_type',
    'level',
    'intensity',
    'title_el',
    'title_en',
    'duration_min',
    'notes_el',
    'notes_en',
  ],
  health_tips: [
    'topic',
    'title_el',
    'title_en',
    'body_el',
    'body_en',
    'source_url',
    'needs_source',
  ],
  // P7.1 skincare (20261006001100_hygieia_skincare.sql grant lists, in order)
  skincare_product_types: [
    'name_el',
    'name_en',
    'description_el',
    'description_en',
    'category',
    'key_ingredients',
    'avoid_with',
    'regions',
    'audiences',
    'skin_types',
    'concerns',
    'time',
    'price_band_eur',
    'notes_el',
    'notes_en',
  ],
  skincare_routines: [
    'area',
    'name_el',
    'name_en',
    'audience',
    'skin_type',
    'region',
    'time',
    'intro_el',
    'intro_en',
    'steps',
    'duration_min',
  ],
  skincare_tips: [
    'area',
    'title_el',
    'title_en',
    'body_el',
    'body_en',
    'audiences',
    'skin_types',
    'concerns',
    'regions',
    'sources',
    'needs_source',
  ],
}

/** The five columns the price table (P4.11) edits — a subset of `EDITABLE_COLUMNS.ingredients`. */
export const PRICE_COLUMNS = [
  'price_eur_min',
  'price_eur_max',
  'price_per',
  'price_as_of',
  'price_note',
] as const satisfies ReadonlyArray<ContentColumn<'ingredients'>>
export type PriceColumn = (typeof PRICE_COLUMNS)[number]
export type PricePatch = Pick<AdminRow<'ingredients'>, PriceColumn>

// --- results --------------------------------------------------------------------------------------

/**
 * `network`: the request never reached the server. `locked`: the patch named a column no client may
 * change (nothing was sent). `empty`: the patch had no column (nothing was sent). `unknown`:
 * anything the server said, or a row that did not parse.
 */
export type AdminError = 'network' | 'locked' | 'empty' | 'unknown'

export type AdminResult<T> = { ok: true; data: T } | { ok: false; error: AdminError }

export const ok = <T>(data: T): AdminResult<T> => ({ ok: true, data })
export const fail = <T>(error: AdminError): AdminResult<T> => ({ ok: false, error })

// --- the adapter ----------------------------------------------------------------------------------

/** The slice of the client this module uses: a filtered list, or an update of one row by id. */
export interface AdminClient {
  list(table: ContentTable, filters: readonly Filter[]): PromiseLike<QueryResult>
  update(table: ContentTable, id: string, values: Record<string, unknown>): PromiseLike<QueryResult>
}

export const ADMIN_SELECT = '*'

export function adminClientFor(client: HygieiaClient): AdminClient {
  return {
    list: (table, filters) => {
      let q = client.from(table).select(ADMIN_SELECT)
      for (const [column, value] of filters) q = q.eq(column, value)
      return q.order('slug')
    },
    // reason: `values` is the runtime-checked subset of THIS table's content columns
    // (`pickContentColumns`); the client's parameter is the union of the nine `Update` types with
    // excess-property rejection, which a generic `Record` cannot satisfy without naming the table.
    update: (table, id, values) =>
      client
        .from(table)
        .update(values as Tables[ContentTable]['Update'])
        .eq('id', id),
  }
}

// --- parsing --------------------------------------------------------------------------------------

type Raw = Record<string, unknown>

function isStatus(value: unknown): value is ContentStatus {
  return typeof value === 'string' && (CONTENT_STATUSES as readonly string[]).includes(value)
}

/**
 * The review page renders each column by its runtime kind, so a row needs only its identity and
 * review columns verified; a malformed one makes the whole read `unknown`.
 */
export function toAdminRow<T extends ContentTable>(data: unknown): AdminRow<T> | null {
  if (typeof data !== 'object' || data === null || Array.isArray(data)) return null
  const raw = data as Raw
  if (typeof raw.id !== 'string' || typeof raw.slug !== 'string' || !isStatus(raw.status))
    return null
  if (raw.reviewed_at !== null && typeof raw.reviewed_at !== 'string') return null
  if (raw.reviewed_by !== null && typeof raw.reviewed_by !== 'string') return null
  // reason: the identity and review columns were checked above; the content columns are typed by
  // the table's CHECK / NOT NULL constraints and rendered by their runtime kind (ReviewForm.tsx).
  return raw as AdminRow<T>
}

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

async function run<T>(
  call: () => PromiseLike<QueryResult>,
  parse: (data: unknown) => T | null,
): Promise<AdminResult<T>> {
  try {
    const { data, error } = await call()
    if (error) return fail(classifyError(error))
    const parsed = parse(data)
    return parsed === null ? fail('unknown') : ok(parsed)
  } catch (error) {
    return fail(classifyError(error))
  }
}

const nothing = (): undefined => undefined

// --- the source -----------------------------------------------------------------------------------

export interface AdminContentSource {
  /** Rows awaiting review (`status = 'pending'`), by slug. */
  listPending<T extends ContentTable>(table: T): Promise<AdminResult<AdminRow<T>[]>>
  /** Every row the admin can see, optionally narrowed to one status, by slug. */
  listAll<T extends ContentTable>(
    table: T,
    status?: ContentStatus,
  ): Promise<AdminResult<AdminRow<T>[]>>
  /** Send exactly the given content columns for one row. Locked columns and `status` are refused. */
  update<T extends ContentTable>(
    table: T,
    id: string,
    patch: AdminPatch<T>,
  ): Promise<AdminResult<void>>
  /** Send `{ status }` and nothing else; the DB trigger stamps the reviewer and time. */
  setStatus(table: ContentTable, id: string, status: ContentStatus): Promise<AdminResult<void>>
}

export function isContentTable(value: unknown): value is ContentTable {
  return typeof value === 'string' && (CONTENT_TABLES as readonly string[]).includes(value)
}

/**
 * The runtime twin of `AdminPatch`'s type-level refusal: the keys actually present, or `null` when
 * one of them is locked, is `status`, or is not a content column of this table at all.
 */
export function pickContentColumns<T extends ContentTable>(
  table: T,
  patch: AdminPatch<T>,
): Record<string, unknown> | null {
  const allowed = EDITABLE_COLUMNS[table] as ReadonlyArray<string>
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(patch)) {
    if (value === undefined) continue
    if (!allowed.includes(key)) return null
    out[key] = value
  }
  return out
}

/** An admin source over an already-adapted client (tests pass a fake `AdminClient` here). */
export function adminSourceFor(client: AdminClient): AdminContentSource {
  const list = <T extends ContentTable>(table: T, filters: readonly Filter[]) =>
    run(() => client.list(table, filters), listOf(toAdminRow<T>))
  return {
    listPending: (table) => list(table, [['status', 'pending']]),
    listAll: (table, status) => list(table, status === undefined ? [] : [['status', status]]),
    update: (table, id, patch) => {
      const values = pickContentColumns(table, patch)
      if (values === null) return Promise.resolve(fail('locked'))
      if (Object.keys(values).length === 0) return Promise.resolve(fail('empty'))
      return run(() => client.update(table, id, values), nothing)
    },
    setStatus: (table, id, status) => run(() => client.update(table, id, { status }), nothing),
  }
}

/** The admin source over the real client. */
export function adminSource(client: HygieiaClient): AdminContentSource {
  return adminSourceFor(adminClientFor(client))
}
