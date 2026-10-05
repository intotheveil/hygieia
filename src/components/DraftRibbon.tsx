// DRAFT RIBBON (P1.13): the bilingual "Draft — awaiting review" note shown over content that no
// reviewer has approved (PLAN.md §1 item 5). Two triggers: the whole source is `bundled` (every
// seed row is pending, so a list page shows it once), or a single row's `status` is not
// `approved` (an admin reading a pending row through the supabase source). An approved row under
// the supabase source renders nothing.

import type { ContentStatus } from '../content/enums.ts'
import type { ContentSource } from '../content/source.ts'
import { useLang } from '../i18n/LangProvider'

export interface DraftRibbonProps {
  kind: ContentSource['kind']
  /** The row's status when the ribbon is for one row; omit on list pages. */
  status?: ContentStatus
}

/** True when the ribbon must show for this source kind and (optional) row status. */
export function isDraft(kind: ContentSource['kind'], status?: ContentStatus): boolean {
  return kind === 'bundled' || (status !== undefined && status !== 'approved')
}

export function DraftRibbon({ kind, status }: DraftRibbonProps) {
  const { t } = useLang()
  if (!isDraft(kind, status)) return null
  return (
    <p
      role="note"
      className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm leading-relaxed text-amber-900"
    >
      <strong className="font-semibold">{t.draftRibbon}</strong>
      <span aria-hidden="true"> · </span>
      {t.draftRibbonHint}
    </p>
  )
}
