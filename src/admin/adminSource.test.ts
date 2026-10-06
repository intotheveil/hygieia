import { fakeClient } from '../auth/fake-client'
import { CONTENT_TABLES, type ContentTable } from '../content/enums.ts'
import type { Filter, QueryResult } from '../content/supabase.ts'
import {
  EDITABLE_COLUMNS,
  LOCKED_COLUMNS,
  PRICE_COLUMNS,
  adminSource,
  adminSourceFor,
  pickContentColumns,
  toAdminRow,
  type AdminClient,
  type AdminPatch,
} from './adminSource.ts'
// The migration is the contract: its UPDATE grant lists are compared literally against
// EDITABLE_COLUMNS below (Vite's `?raw` keeps the test inside the app tsconfig, no node types).
import contentMigration from '../../supabase/migrations/20261006000300_hygieia_content.sql?raw'
import skincareMigration from '../../supabase/migrations/20261006001100_hygieia_skincare.sql?raw'

const ID = '11111111-1111-4111-8111-111111111111'

const tipRow = {
  id: ID,
  slug: 'drink-water',
  status: 'pending',
  reviewed_at: null,
  reviewed_by: null,
  created_at: '2026-10-06T00:00:00Z',
  updated_at: '2026-10-06T00:00:00Z',
  topic: 'hydration',
  title_el: 'Πίνε νερό',
  title_en: 'Drink water',
  body_el: 'Κράτα ένα ποτήρι δίπλα σου.',
  body_en: 'Keep a glass nearby.',
  source_url: null,
  needs_source: true,
}

interface Seen {
  kind: 'list' | 'update'
  table: ContentTable
  filters?: readonly Filter[]
  id?: string
  values?: Record<string, unknown>
}

/** A fake AdminClient that records every call and answers with `rows` / `error`. */
function recorder(rows: unknown = [], error: QueryResult['error'] = null) {
  const seen: Seen[] = []
  const client: AdminClient = {
    list: async (table, filters) => {
      seen.push({ kind: 'list', table, filters })
      return { data: rows, error }
    },
    update: async (table, id, values) => {
      seen.push({ kind: 'update', table, id, values })
      return { data: null, error }
    },
  }
  return { client, seen, source: adminSourceFor(client) }
}

describe('AdminContentSource — reads', () => {
  it('listPending filters status = pending and nothing else, per table', async () => {
    const { source, seen } = recorder([tipRow])
    for (const table of CONTENT_TABLES) {
      const result = await source.listPending(table)
      expect(result.ok).toBe(true)
    }
    expect(seen).toHaveLength(CONTENT_TABLES.length)
    for (const [i, table] of CONTENT_TABLES.entries()) {
      expect(seen[i]).toEqual({ kind: 'list', table, filters: [['status', 'pending']] })
    }
  })

  it('listAll sends NO status filter by default (an admin reads every status)', async () => {
    const { source, seen } = recorder([tipRow])
    await source.listAll('health_tips')
    expect(seen[0]).toEqual({ kind: 'list', table: 'health_tips', filters: [] })
  })

  it('listAll narrows to one status when asked', async () => {
    const { source, seen } = recorder([])
    await source.listAll('recipes', 'rejected')
    expect(seen[0]).toEqual({ kind: 'list', table: 'recipes', filters: [['status', 'rejected']] })
  })

  it('returns the rows with their review columns intact', async () => {
    const { source } = recorder([
      { ...tipRow, status: 'approved', reviewed_by: 'u1', reviewed_at: 't' },
    ])
    const result = await source.listAll('health_tips')
    expect(result.ok && result.data[0]).toMatchObject({
      id: ID,
      slug: 'drink-water',
      status: 'approved',
      reviewed_by: 'u1',
      reviewed_at: 't',
    })
  })

  it('a row without identity / review columns makes the read `unknown`', async () => {
    const { source } = recorder([{ ...tipRow, slug: 7 }])
    expect(await source.listAll('health_tips')).toEqual({ ok: false, error: 'unknown' })
    expect(toAdminRow({ ...tipRow, status: 'draft' })).toBeNull()
    expect(toAdminRow({ ...tipRow, reviewed_by: 5 })).toBeNull()
    expect(toAdminRow(null)).toBeNull()
    expect(toAdminRow([tipRow])).toBeNull()
  })

  it('classifies a server error as unknown and a transport failure as network', async () => {
    const server = recorder([], { message: 'denied', code: '42501' })
    expect(await server.source.listPending('diets')).toEqual({ ok: false, error: 'unknown' })
    const client: AdminClient = {
      list: () => {
        throw new TypeError('Failed to fetch')
      },
      update: () => {
        throw new TypeError('Failed to fetch')
      },
    }
    const source = adminSourceFor(client)
    expect(await source.listPending('diets')).toEqual({ ok: false, error: 'network' })
    expect(await source.setStatus('diets', ID, 'approved')).toEqual({ ok: false, error: 'network' })
  })
})

describe('AdminContentSource — writes', () => {
  it('update sends ONLY the given columns, by id', async () => {
    const { source, seen } = recorder()
    const result = await source.update('health_tips', ID, { title_en: 'Drink more water' })
    expect(result).toEqual({ ok: true, data: undefined })
    expect(seen).toEqual([
      { kind: 'update', table: 'health_tips', id: ID, values: { title_en: 'Drink more water' } },
    ])
  })

  it('update drops undefined entries rather than sending them', async () => {
    const { source, seen } = recorder()
    await source.update('health_tips', ID, { title_en: 'x', body_en: undefined })
    expect(seen[0]?.values).toEqual({ title_en: 'x' })
  })

  it.each(LOCKED_COLUMNS)('update refuses `%s` at runtime and sends nothing', async (column) => {
    const { source, seen } = recorder()
    // reason: the test deliberately smuggles a locked column past the type to prove the runtime check.
    const patch = { title_en: 'x', [column]: 'smuggled' } as unknown as AdminPatch<'health_tips'>
    expect(await source.update('health_tips', ID, patch)).toEqual({ ok: false, error: 'locked' })
    expect(seen).toHaveLength(0)
  })

  it('update refuses `status` (that is setStatus’s job) and a column of another table', async () => {
    const { source, seen } = recorder()
    const withStatus = { status: 'approved' } as unknown as AdminPatch<'health_tips'>
    expect(await source.update('health_tips', ID, withStatus)).toEqual({
      ok: false,
      error: 'locked',
    })
    const wrongTable = { price_eur_min: 1 } as unknown as AdminPatch<'diets'>
    expect(await source.update('diets', ID, wrongTable)).toEqual({ ok: false, error: 'locked' })
    expect(seen).toHaveLength(0)
  })

  it('update refuses an empty patch', async () => {
    const { source, seen } = recorder()
    expect(await source.update('health_tips', ID, {})).toEqual({ ok: false, error: 'empty' })
    expect(seen).toHaveLength(0)
  })

  it('setStatus sends exactly { status }', async () => {
    const { source, seen } = recorder()
    await source.setStatus('recipes', ID, 'approved')
    await source.setStatus('recipes', ID, 'rejected')
    expect(seen).toEqual([
      { kind: 'update', table: 'recipes', id: ID, values: { status: 'approved' } },
      { kind: 'update', table: 'recipes', id: ID, values: { status: 'rejected' } },
    ])
  })

  it('a server refusal of the update is reported, not thrown', async () => {
    const { source } = recorder([], { message: 'permission denied', code: '42501' })
    expect(await source.update('health_tips', ID, { title_en: 'x' })).toEqual({
      ok: false,
      error: 'unknown',
    })
  })

  it('offers no insert and no delete — the methods do not exist', () => {
    const { source } = recorder()
    expect(Object.keys(source).sort()).toEqual(['listAll', 'listPending', 'setStatus', 'update'])
    expect('insert' in source).toBe(false)
    expect('delete' in source).toBe(false)
    expect('remove' in source).toBe(false)
  })
})

describe('AdminContentSource over the real adapter (fake Supabase client)', () => {
  it('reads with select → eq(status) → order and updates with update → eq(id)', async () => {
    const fake = fakeClient({ contentTables: { rows: { health_tips: [{ ...tipRow }] } } })
    const source = adminSource(fake.client)

    const pending = await source.listPending('health_tips')
    expect(pending.ok && pending.data.map((r) => r.slug)).toEqual(['drink-water'])
    expect(fake.calls[0]).toMatchObject({
      table: 'health_tips',
      op: 'select',
      filters: [['status', 'pending']],
    })

    await source.setStatus('health_tips', ID, 'approved')
    expect(fake.calls[1]).toEqual({
      table: 'health_tips',
      op: 'update',
      payload: { status: 'approved' },
      filters: [['id', ID]],
    })

    await source.update('health_tips', ID, { body_el: 'Νέο κείμενο' })
    expect(fake.calls[2]).toEqual({
      table: 'health_tips',
      op: 'update',
      payload: { body_el: 'Νέο κείμενο' },
      filters: [['id', ID]],
    })
    // The fake applied both writes: the row is now approved with the new body and gone from pending.
    const after = await source.listPending('health_tips')
    expect(after.ok && after.data).toEqual([])
    const all = await source.listAll('health_tips')
    expect(all.ok && all.data[0]).toMatchObject({ status: 'approved', body_el: 'Νέο κείμενο' })
  })
})

describe('EDITABLE_COLUMNS mirrors the migration’s UPDATE grant', () => {
  // P7.1 added three content tables in their own forward-only file; the contract is the union.
  const sql: string = `${contentMigration}\n${skincareMigration}`

  /** `grant update (a, b, …) on table hygieia.<table> to authenticated` → [a, b, …]. */
  function grantedColumns(table: ContentTable): string[] {
    const re = new RegExp(
      String.raw`grant update \(([^)]*)\) on table hygieia\.${table} to authenticated`,
      'm',
    )
    const match = re.exec(sql)
    if (!match) throw new Error(`no UPDATE grant found for ${table}`)
    return (match[1] ?? '')
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean)
  }

  it.each(CONTENT_TABLES)('%s: grant = EDITABLE_COLUMNS + status, same order', (table) => {
    expect(grantedColumns(table)).toEqual([...EDITABLE_COLUMNS[table], 'status'])
  })

  it('no locked column is ever granted', () => {
    for (const table of CONTENT_TABLES) {
      const granted = grantedColumns(table)
      for (const locked of LOCKED_COLUMNS) expect(granted).not.toContain(locked)
    }
  })

  it('the price columns are ingredient content columns', () => {
    for (const column of PRICE_COLUMNS) expect(EDITABLE_COLUMNS.ingredients).toContain(column)
    expect(PRICE_COLUMNS).toHaveLength(5)
  })

  it('pickContentColumns is the runtime whitelist', () => {
    expect(pickContentColumns('ingredients', { price_eur_min: 1, price_eur_max: 2 })).toEqual({
      price_eur_min: 1,
      price_eur_max: 2,
    })
    expect(
      pickContentColumns('ingredients', { slug: 'x' } as unknown as AdminPatch<'ingredients'>),
    ).toBeNull()
  })
})
