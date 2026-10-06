// HISTORY (P8.2): entries grouped by date, newest first (the list arrives `entry_date` desc).
// Delete is a two-click pattern: the first click turns the button into "Sure?" and the second
// deletes — no `window.confirm`, and a click on any OTHER delete button resets the first.

import { useState } from 'react'
import { EmptyState } from '../components/AsyncState'
import { useLang } from '../i18n/LangProvider'
import { profileCopy } from '../i18n/features/profile.ts'
import type { Entry, EntryKind, Result } from '../user/source'
import { entryLabel, formatDate, formatEntryValue } from './format'
import { groupByDate } from './stats'
import { DANGER, ERR, H2, SECTION } from './styles'

const KIND_GLYPH: Readonly<Record<EntryKind, string>> = {
  weight: '⚖',
  meal: '🍽',
  workout: '🏃',
  water: '💧',
  sleep: '🌙',
  steps: '👣',
  skincare: '✨',
  nails: '💅',
  mood: '☺',
}

export interface HistoryProps {
  entries: readonly Entry[]
  onDelete: (id: string) => Promise<Result<void>>
}

export function History({ entries, onDelete }: HistoryProps) {
  const { t, lang } = useLang(profileCopy)
  const [confirming, setConfirming] = useState<string | null>(null)
  const [failed, setFailed] = useState<string | null>(null)
  const groups = groupByDate(entries)

  async function click(entry: Entry): Promise<void> {
    if (confirming !== entry.id) {
      setConfirming(entry.id)
      setFailed(null)
      return
    }
    setConfirming(null)
    const result = await onDelete(entry.id)
    if (!result.ok) setFailed(entry.id)
  }

  return (
    <section aria-labelledby="profile-history" className={SECTION}>
      <h2 id="profile-history" className={H2}>
        {t.profileHistory}
      </h2>
      {groups.length === 0 ? (
        <EmptyState title={t.profileHistoryEmpty} icon="✎" />
      ) : (
        <ol className="flex flex-col gap-4" aria-label={t.profileHistory}>
          {groups.map((group) => (
            <li key={group.date} data-date={group.date}>
              <h3 className="text-sm font-medium text-olive-900">{formatDate(group.date, lang)}</h3>
              <ul className="mt-1 flex flex-col gap-1.5">
                {group.entries.map((entry) => {
                  const label = entryLabel(entry, t, lang)
                  const value = formatEntryValue(entry, t, lang)
                  const confirm = confirming === entry.id
                  return (
                    <li
                      key={entry.id}
                      data-entry-kind={entry.kind}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-paper-200/60 px-3 py-2 text-sm"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span aria-hidden="true">{KIND_GLYPH[entry.kind]}</span>
                        <span className="font-medium text-olive-900">
                          {t.profileKind[entry.kind]}
                        </span>
                        {value !== null && <span className="text-olive-700">{value}</span>}
                        {entry.note !== null && entry.note !== '' && (
                          <span className="text-olive-700 italic">{entry.note}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {failed === entry.id && (
                          <span role="alert" className={ERR}>
                            {t.profileDeleteFailed}
                          </span>
                        )}
                        <button
                          type="button"
                          aria-label={`${confirm ? t.profileConfirmDelete : t.profileDelete}: ${label}`}
                          onClick={() => void click(entry)}
                          className={DANGER}
                        >
                          {confirm ? t.profileConfirmDelete : t.profileDelete}
                        </button>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
