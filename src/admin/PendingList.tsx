// PENDING LIST (P4.10): the rows of one content kind under the current status filter, each a
// button that opens the ReviewForm. A row is identified by its slug (PLAN.md §1.6) and shown with
// both languages of its title (`title_*`) or name (`name_*`) so a reviewer sees at a glance
// whether a translation is missing — the side-by-side rule starts here, not only in the form.

import type { ContentTable } from '../content/enums.ts'
import type { AdminRow } from './adminSource.ts'
import { headingOf } from './fields.ts'

export interface PendingListProps {
  table: ContentTable
  rows: readonly AdminRow[]
  /** Shown when `rows` is empty. */
  empty: string
  onSelect: (row: AdminRow) => void
}

export function PendingList({ table, rows, empty, onSelect }: PendingListProps) {
  if (rows.length === 0) return <p className="text-olive-700">{empty}</p>
  return (
    <ul className="flex flex-col gap-2">
      {rows.map((row) => (
        <li key={row.id}>
          <button
            type="button"
            onClick={() => onSelect(row)}
            className="grid w-full grid-cols-1 gap-x-4 gap-y-1 rounded-xl bg-paper-200/60 px-4 py-3 text-left text-sm text-olive-900 hover:bg-paper-200 sm:grid-cols-[1fr_2fr_2fr]"
          >
            <code className="text-xs text-olive-700">{row.slug}</code>
            <span lang="el">{headingOf(table, row, 'el')}</span>
            <span lang="en">{headingOf(table, row, 'en')}</span>
          </button>
        </li>
      ))}
    </ul>
  )
}
