// PRICE TABLE (P4.11): every ingredient the admin can see (all statuses — a price is quoted
// before approval too), sorted by name in the current language, with the five price columns
// editable inline, ONE row at a time. Validation: both prices are numbers ≥ 0 and `min ≤ max`
// (the DB CHECK's twin, surfaced in the reviewer's language before the request). Save sends the
// five price columns through `AdminContentSource.update` — nothing else about the ingredient —
// and the table reflects the saved row without a reload.

import { useCallback, useState } from 'react'
import { PRICE_PER, type PricePer } from '../content/enums.ts'
import { useLang } from '../i18n/LangProvider'
import { useAsyncResult } from '../lib/useAsync.ts'
import type { AdminContentSource, PricePatch } from './adminSource.ts'
import { checkDraft, draftOf, sortByName, type PriceDraft } from './prices.ts'

const INPUT =
  'w-full rounded-lg border border-olive-900/20 bg-paper-50 px-2 py-1 text-sm text-olive-900 aria-[invalid=true]:border-clay-500'
const BUTTON = 'rounded-full px-3 py-1 text-sm font-medium disabled:opacity-50'
const PRIMARY = `${BUTTON} bg-olive-900 text-paper-50 hover:bg-olive-700`
const SECONDARY = `${BUTTON} border border-olive-900/20 bg-paper-50/70 text-olive-900 hover:bg-paper-50`
const CELL = 'px-2 py-2 align-top'

export interface PriceTableProps {
  source: AdminContentSource
}

type Outcome = 'idle' | 'busy' | 'saved' | 'failed'

export function PriceTable({ source }: PriceTableProps) {
  const { t, lang } = useLang()
  const load = useCallback(() => source.listAll('ingredients'), [source])
  // `ok: false` and a rejection are both `status: 'error'` → the load-failed line.
  const loaded = useAsyncResult(load)
  // Rows saved in this session, applied over the loaded rows (no reload needed).
  const [saved, setSaved] = useState<Record<string, PricePatch>>({})
  const [editing, setEditing] = useState<{ id: string; draft: PriceDraft } | null>(null)
  const [outcome, setOutcome] = useState<Outcome>('idle')

  if (loaded.status === 'loading')
    return (
      <p role="status" className="text-olive-700">
        {t.loading}
      </p>
    )
  if (loaded.status === 'error') return <p role="alert">{t.adminLoadFailed}</p>

  const rows = sortByName(
    loaded.data.map((row) => (saved[row.id] ? { ...row, ...saved[row.id] } : row)),
    lang,
  )
  const check = editing === null ? null : checkDraft(editing.draft)
  const nameKey = lang === 'el' ? 'name_el' : 'name_en'

  const setDraft = (patch: Partial<PriceDraft>) => {
    setEditing((prev) => (prev === null ? prev : { ...prev, draft: { ...prev.draft, ...patch } }))
    setOutcome('idle')
  }

  const save = async () => {
    if (editing === null || check === null || !check.ok) return
    setOutcome('busy')
    const result = await source.update('ingredients', editing.id, check.patch)
    if (result.ok) {
      setSaved((prev) => ({ ...prev, [editing.id]: check.patch }))
      setEditing(null)
      setOutcome('saved')
    } else {
      setOutcome('failed')
    }
  }

  const problemText =
    check !== null && !check.ok
      ? check.problem === 'order'
        ? t.priceMinMaxError
        : t.priceNumberError
      : null

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-olive-900">
          <caption className="sr-only">{t.prices}</caption>
          <thead>
            <tr className="border-b border-olive-900/10 text-xs text-olive-700">
              <th scope="col" className={CELL}>
                {t.kinds.ingredients}
              </th>
              <th scope="col" className={CELL}>
                {t.priceMin}
              </th>
              <th scope="col" className={CELL}>
                {t.priceMax}
              </th>
              <th scope="col" className={CELL}>
                {t.pricePer}
              </th>
              <th scope="col" className={CELL}>
                {t.asOf}
              </th>
              <th scope="col" className={CELL}>
                {t.priceNote}
              </th>
              <th scope="col" className={CELL}>
                <span className="sr-only">{t.editRow}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) =>
              editing !== null && editing.id === row.id ? (
                <tr key={row.id} className="border-b border-olive-900/10 bg-paper-50/60">
                  <th scope="row" className={`${CELL} font-medium`}>
                    {row[nameKey]}
                  </th>
                  <td className={CELL}>
                    <label htmlFor="price-min" className="sr-only">
                      {t.priceMin}
                    </label>
                    <input
                      id="price-min"
                      type="number"
                      step="any"
                      inputMode="decimal"
                      min={0}
                      value={editing.draft.min}
                      aria-invalid={check !== null && !check.ok}
                      aria-describedby={problemText ? 'price-problem' : undefined}
                      onChange={(e) => setDraft({ min: e.target.value })}
                      className={INPUT}
                    />
                  </td>
                  <td className={CELL}>
                    <label htmlFor="price-max" className="sr-only">
                      {t.priceMax}
                    </label>
                    <input
                      id="price-max"
                      type="number"
                      step="any"
                      inputMode="decimal"
                      min={0}
                      value={editing.draft.max}
                      aria-invalid={check !== null && !check.ok}
                      aria-describedby={problemText ? 'price-problem' : undefined}
                      onChange={(e) => setDraft({ max: e.target.value })}
                      className={INPUT}
                    />
                  </td>
                  <td className={CELL}>
                    <label htmlFor="price-per" className="sr-only">
                      {t.pricePer}
                    </label>
                    <select
                      id="price-per"
                      value={editing.draft.per}
                      onChange={(e) => {
                        const per = e.target.value
                        if ((PRICE_PER as readonly string[]).includes(per))
                          setDraft({ per: per as PricePer })
                      }}
                      className={INPUT}
                    >
                      {PRICE_PER.map((per) => (
                        <option key={per} value={per}>
                          {per}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className={CELL}>
                    <label htmlFor="price-as-of" className="sr-only">
                      {t.asOf}
                    </label>
                    <input
                      id="price-as-of"
                      type="date"
                      value={editing.draft.asOf}
                      onChange={(e) => setDraft({ asOf: e.target.value })}
                      className={INPUT}
                    />
                  </td>
                  <td className={CELL}>
                    <label htmlFor="price-note" className="sr-only">
                      {t.priceNote}
                    </label>
                    <input
                      id="price-note"
                      type="text"
                      value={editing.draft.note}
                      onChange={(e) => setDraft({ note: e.target.value })}
                      className={INPUT}
                    />
                  </td>
                  <td className={`${CELL} whitespace-nowrap`}>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={check === null || !check.ok || outcome === 'busy'}
                        onClick={() => void save()}
                        className={PRIMARY}
                      >
                        {t.saveChanges}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditing(null)
                          setOutcome('idle')
                        }}
                        className={SECONDARY}
                      >
                        {t.cancel}
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                <tr key={row.id} className="border-b border-olive-900/10">
                  <th scope="row" className={`${CELL} font-medium`}>
                    {row[nameKey]}
                  </th>
                  <td className={CELL}>{row.price_eur_min}</td>
                  <td className={CELL}>{row.price_eur_max}</td>
                  <td className={CELL}>{row.price_per}</td>
                  <td className={CELL}>{row.price_as_of}</td>
                  <td className={CELL}>{row.price_note}</td>
                  <td className={CELL}>
                    <button
                      type="button"
                      disabled={editing !== null}
                      aria-label={`${t.editRow}: ${row[nameKey]}`}
                      onClick={() => {
                        setEditing({ id: row.id, draft: draftOf(row) })
                        setOutcome('idle')
                      }}
                      className={SECONDARY}
                    >
                      {t.editRow}
                    </button>
                  </td>
                </tr>
              ),
            )}
          </tbody>
        </table>
      </div>
      {problemText && (
        <p id="price-problem" role="alert" className="text-sm text-clay-500">
          {problemText}
        </p>
      )}
      <p role="status" className="text-sm text-olive-700">
        {outcome === 'saved' ? t.adminSaved : outcome === 'failed' ? t.adminSaveFailed : ''}
      </p>
    </div>
  )
}
