// REVIEW FORM (P4.10): one content row, every `*_el` column beside its `*_en` twin (PLAN.md §1
// item 2 — one row = one admin form), the other content columns below, `id` / `slug` / the review
// stamp read-only. The field set is `EDITABLE_COLUMNS[table]` (the migration's UPDATE grant), each
// rendered by its kind: text, long text, number, boolean, select (the CHECK-constrained enums),
// date, or a line editor for `string[]` — paired lists share one editor, so adding or removing a
// line does it in BOTH languages and the two arrays can never differ in length.
//
// Save sends ONLY the columns whose value differs from the row as loaded (never `id`, `slug`,
// `status` or the review columns — `AdminPatch` forbids them anyway). Approve / Reject send
// `{ status }` through `setStatus`; the DB trigger stamps `reviewed_by` / `reviewed_at`.
//
// The field model (kinds, pairing, edit ⇄ column conversion, the changed-columns diff) is
// ./fields.ts, pure and unit-tested; this file is the rendering and the two write paths.

import { useState } from 'react'
import type { ContentTable } from '../content/enums.ts'
import { useLang } from '../i18n/LangProvider'
import type { AdminContentSource, AdminPatch, AdminRow } from './adminSource.ts'
import {
  diffDraft,
  evenLengths,
  fieldGroups,
  fieldsOf,
  initialDraft,
  type EditValue,
  type Field,
} from './fields.ts'

// --- styles ---------------------------------------------------------------------------------------

const INPUT =
  'w-full rounded-lg border border-olive-900/20 bg-paper-50 px-3 py-1.5 text-sm text-olive-900 aria-[invalid=true]:border-clay-500'
const LABEL = 'block font-mono text-xs text-olive-700'
const BUTTON = 'rounded-full px-4 py-1.5 text-sm font-medium disabled:opacity-50'
const PRIMARY = `${BUTTON} bg-olive-900 text-paper-50 hover:bg-olive-700`
const SECONDARY = `${BUTTON} border border-olive-900/20 bg-paper-50/70 text-olive-900 hover:bg-paper-50`
const DANGER = `${BUTTON} border border-clay-500 text-clay-700 hover:bg-clay-500/10`

// --- inputs ---------------------------------------------------------------------------------------

interface ScalarInputProps {
  field: Field
  value: EditValue
  invalid: boolean
  lang?: 'el' | 'en'
  onChange: (value: EditValue) => void
}

function ScalarInput({ field, value, invalid, lang, onChange }: ScalarInputProps) {
  const id = `field-${field.column}`
  const text = typeof value === 'string' ? value : ''
  const label = (
    <label htmlFor={id} className={LABEL}>
      {field.column}
    </label>
  )
  switch (field.kind) {
    case 'boolean':
      return (
        <div className="flex items-center gap-2">
          <input
            id={id}
            type="checkbox"
            checked={value === true}
            onChange={(e) => onChange(e.target.checked)}
            className="size-4 accent-olive-900"
          />
          <label htmlFor={id} className={LABEL}>
            {field.column}
          </label>
        </div>
      )
    case 'select':
      return (
        <div>
          {label}
          <select
            id={id}
            value={text}
            aria-invalid={invalid}
            onChange={(e) => onChange(e.target.value)}
            className={INPUT}
          >
            {(field.options ?? []).map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      )
    case 'long':
      return (
        <div>
          {label}
          <textarea
            id={id}
            lang={lang}
            value={text}
            rows={4}
            aria-invalid={invalid}
            onChange={(e) => onChange(e.target.value)}
            className={INPUT}
          />
        </div>
      )
    default:
      return (
        <div>
          {label}
          <input
            id={id}
            lang={lang}
            type={field.kind === 'number' ? 'number' : field.kind === 'date' ? 'date' : 'text'}
            step={field.kind === 'number' ? 'any' : undefined}
            inputMode={field.kind === 'number' ? 'decimal' : undefined}
            value={text}
            aria-invalid={invalid}
            onChange={(e) => onChange(e.target.value)}
            className={INPUT}
          />
        </div>
      )
  }
}

interface LinesEditorProps {
  base: string
  /** `[column, lines]` per language; one entry for an unpaired list, two for a pair. */
  columns: ReadonlyArray<readonly [column: string, lang: 'el' | 'en' | null, lines: string[]]>
  onChange: (next: string[][]) => void
}

/**
 * One row per line index across every column, so a pair stays aligned: "add" appends an empty
 * line to each column and "remove" deletes index `i` from each column.
 */
function LinesEditor({ base, columns, onChange }: LinesEditorProps) {
  const { t } = useLang()
  const count = Math.max(0, ...columns.map(([, , lines]) => lines.length))
  const set = (col: number, index: number, text: string) =>
    onChange(
      columns.map(([, , lines], c) =>
        c === col ? lines.map((line, i) => (i === index ? text : line)) : lines,
      ),
    )
  const add = () => onChange(columns.map(([, , lines]) => [...lines, '']))
  const remove = (index: number) =>
    onChange(columns.map(([, , lines]) => lines.filter((_, i) => i !== index)))
  return (
    <div className="flex flex-col gap-2">
      <div className={`grid gap-2 ${columns.length === 2 ? 'sm:grid-cols-2' : ''}`}>
        {columns.map(([column]) => (
          <span key={column} className={LABEL} aria-hidden="true">
            {column}
          </span>
        ))}
      </div>
      <ol className="flex flex-col gap-2">
        {Array.from({ length: count }, (_, index) => (
          <li
            key={index}
            className={`grid items-start gap-2 ${
              columns.length === 2 ? 'sm:grid-cols-[1fr_1fr_auto]' : 'grid-cols-[1fr_auto]'
            }`}
          >
            {columns.map(([column, lang, lines], c) => {
              const id = `field-${column}-${index}`
              return (
                <div key={column}>
                  <label htmlFor={id} className="sr-only">
                    {`${column} ${t.lineNumber} ${index + 1}`}
                  </label>
                  <input
                    id={id}
                    lang={lang ?? undefined}
                    type="text"
                    value={lines[index] ?? ''}
                    onChange={(e) => set(c, index, e.target.value)}
                    className={INPUT}
                  />
                </div>
              )
            })}
            <button
              type="button"
              onClick={() => remove(index)}
              aria-label={`${t.removeLine} ${index + 1} (${base})`}
              className={`${SECONDARY} px-3`}
            >
              −
            </button>
          </li>
        ))}
      </ol>
      <div>
        <button
          type="button"
          onClick={add}
          aria-label={`${t.addLine} (${base})`}
          className={SECONDARY}
        >
          {t.addLine}
        </button>
      </div>
    </div>
  )
}

// --- the form -------------------------------------------------------------------------------------

export interface ReviewFormProps {
  table: ContentTable
  row: AdminRow
  source: AdminContentSource
  /** Return to the list without changing anything. */
  onBack: () => void
  /** The status was changed (approved / rejected): the caller refreshes and shows the list. */
  onReviewed: () => void
  /** A content edit was saved: the caller refreshes its lists in the background. */
  onSaved: () => void
}

type Outcome = 'idle' | 'busy' | 'saved' | 'failed'

export function ReviewForm({ table, row, source, onBack, onReviewed, onSaved }: ReviewFormProps) {
  const { t, lang } = useLang()
  const [groups] = useState(() => fieldGroups(table, row))
  const [fields] = useState(() => fieldsOf(groups))
  // `baseline` is the row as loaded (then as last saved); `draft` is what the inputs hold.
  const [baseline, setBaseline] = useState<Record<string, unknown>>(() => ({ ...row }))
  const [draft, setDraft] = useState<Record<string, EditValue>>(() => initialDraft(fields, row))
  const [outcome, setOutcome] = useState<Outcome>('idle')

  const { patch, invalid } = diffDraft(fields, baseline, draft)
  const dirty = Object.keys(patch).length > 0
  const canSave = dirty && invalid.length === 0 && outcome !== 'busy'

  const setValue = (column: string, value: EditValue) => {
    setDraft((prev) => ({ ...prev, [column]: value }))
    setOutcome('idle')
  }

  const save = async () => {
    if (!canSave) return
    setOutcome('busy')
    // reason: `patch` holds only converted values of `EDITABLE_COLUMNS[table]` (diffDraft over
    // fieldGroups), i.e. exactly the keys `AdminPatch<typeof table>` admits; the source re-checks
    // every key at runtime and refuses anything outside the grant.
    const result = await source.update(table, row.id, patch as AdminPatch<typeof table>)
    if (result.ok) {
      setBaseline((prev) => ({ ...prev, ...patch }))
      setOutcome('saved')
      onSaved()
    } else {
      setOutcome('failed')
    }
  }

  const setStatus = async (status: 'approved' | 'rejected') => {
    setOutcome('busy')
    const result = await source.setStatus(table, row.id, status)
    if (result.ok) onReviewed()
    else setOutcome('failed')
  }

  const reviewedAt =
    row.reviewed_at === null
      ? null
      : Number.isNaN(Date.parse(row.reviewed_at))
        ? row.reviewed_at
        : new Date(row.reviewed_at).toLocaleString(lang === 'el' ? 'el-GR' : 'en-GB')

  return (
    <form
      aria-labelledby="review-heading"
      onSubmit={(e) => {
        e.preventDefault()
        void save()
      }}
      className="flex flex-col gap-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h2 id="review-heading" className="font-display text-xl font-semibold text-olive-950">
          {row.slug}
        </h2>
        <button type="button" onClick={onBack} className={SECONDARY}>
          {t.backToList}
        </button>
      </div>

      <p className="text-sm text-olive-700">{t.sideBySideHint}</p>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="field-id" className={LABEL}>
            id
          </label>
          <input id="field-id" type="text" value={row.id} readOnly className={INPUT} />
        </div>
        <div>
          <label htmlFor="field-slug" className={LABEL}>
            slug
          </label>
          <input id="field-slug" type="text" value={row.slug} readOnly className={INPUT} />
        </div>
      </div>

      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
        <dt className="text-olive-700">status</dt>
        <dd>{row.status}</dd>
        {row.reviewed_at === null ? (
          <>
            <dt className="text-olive-700">{t.reviewedAt}</dt>
            <dd>{t.notReviewedYet}</dd>
          </>
        ) : (
          <>
            <dt className="text-olive-700">{t.reviewedAt}</dt>
            <dd>{reviewedAt}</dd>
            <dt className="text-olive-700">{t.reviewedBy}</dt>
            <dd>
              <code className="text-xs">{row.reviewed_by ?? '—'}</code>
            </dd>
          </>
        )}
      </dl>

      {groups.map((group) =>
        group.pair ? (
          <fieldset
            key={group.base}
            className="rounded-xl border border-olive-900/10 bg-paper-50/60 p-4"
          >
            <legend className="px-1 font-mono text-sm text-olive-900">{group.base}</legend>
            {group.el.kind === 'lines' ? (
              <LinesEditor
                base={group.base}
                columns={[
                  [group.el.column, 'el', linesOf(draft[group.el.column])],
                  [group.en.column, 'en', linesOf(draft[group.en.column])],
                ]}
                onChange={([el, en]) => {
                  const [evenEl, evenEn] = evenLengths(el ?? [], en ?? [])
                  setDraft((prev) => ({
                    ...prev,
                    [group.el.column]: evenEl,
                    [group.en.column]: evenEn,
                  }))
                  setOutcome('idle')
                }}
              />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                <ScalarInput
                  field={group.el}
                  lang="el"
                  value={draft[group.el.column] ?? ''}
                  invalid={invalid.includes(group.el.column)}
                  onChange={(v) => setValue(group.el.column, v)}
                />
                <ScalarInput
                  field={group.en}
                  lang="en"
                  value={draft[group.en.column] ?? ''}
                  invalid={invalid.includes(group.en.column)}
                  onChange={(v) => setValue(group.en.column, v)}
                />
              </div>
            )}
          </fieldset>
        ) : group.single.kind === 'lines' ? (
          <fieldset
            key={group.base}
            className="rounded-xl border border-olive-900/10 bg-paper-50/60 p-4"
          >
            <legend className="px-1 font-mono text-sm text-olive-900">{group.base}</legend>
            <LinesEditor
              base={group.base}
              columns={[[group.single.column, null, linesOf(draft[group.single.column])]]}
              onChange={([lines]) => setValue(group.single.column, lines ?? [])}
            />
          </fieldset>
        ) : (
          <ScalarInput
            key={group.base}
            field={group.single}
            value={draft[group.single.column] ?? ''}
            invalid={invalid.includes(group.single.column)}
            onChange={(v) => setValue(group.single.column, v)}
          />
        ),
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={!canSave} className={PRIMARY}>
          {t.saveChanges}
        </button>
        {row.status !== 'approved' && (
          <button
            type="button"
            disabled={outcome === 'busy'}
            onClick={() => void setStatus('approved')}
            className={PRIMARY}
          >
            {t.approve}
          </button>
        )}
        {row.status !== 'rejected' && (
          <button
            type="button"
            disabled={outcome === 'busy'}
            onClick={() => void setStatus('rejected')}
            className={DANGER}
          >
            {t.reject}
          </button>
        )}
        <p role="status" className="text-sm text-olive-700">
          {outcome === 'saved' ? t.adminSaved : outcome === 'failed' ? t.adminSaveFailed : ''}
        </p>
      </div>
    </form>
  )
}

function linesOf(value: EditValue | undefined): string[] {
  return Array.isArray(value) ? value : []
}
