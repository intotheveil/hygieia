// QUICK ADD (P8.2): kind → value (unit fixed per kind; none for skincare / nails) → date (today,
// never the future) → note → `addEntry`. Validation is ./entryForm.ts; this file only holds the
// strings and shows the field errors (`aria-invalid` + `aria-describedby`) and the write failure.

import { useId, useState, type FormEvent } from 'react'
import { useLang } from '../i18n/LangProvider'
import {
  ENTRY_KINDS,
  type Entry,
  type EntryInput,
  type EntryKind,
  type Result,
} from '../user/source'
import {
  UNIT_FOR_KIND,
  emptyForm,
  validateEntry,
  type EntryFormError,
  type EntryFormField,
  type EntryFormValues,
} from './entryForm'
import { ERR, H2, INPUT, LABEL, PILL_PRIMARY, SECTION } from './styles'

export interface QuickAddProps {
  /** `YYYY-MM-DD` */
  today: string
  onSubmit: (input: EntryInput) => Promise<Result<Entry>>
}

function asKind(value: string): EntryKind {
  return (ENTRY_KINDS as readonly string[]).includes(value) ? (value as EntryKind) : 'water'
}

export function QuickAdd({ today, onSubmit }: QuickAddProps) {
  const { t } = useLang()
  const id = useId()
  const [values, setValues] = useState<EntryFormValues>(() => emptyForm(today))
  const [errors, setErrors] = useState<Partial<Record<EntryFormField, EntryFormError>>>({})
  const [outcome, setOutcome] = useState<'idle' | 'busy' | 'failed'>('idle')
  const unit = UNIT_FOR_KIND[values.kind]

  async function submit(event: FormEvent): Promise<void> {
    event.preventDefault()
    const validation = validateEntry(values, today)
    if (!validation.ok) {
      setErrors(validation.errors)
      return
    }
    setErrors({})
    setOutcome('busy')
    const result = await onSubmit(validation.input)
    if (result.ok) {
      setValues((current) => ({ ...current, value: '', note: '' }))
      setOutcome('idle')
    } else setOutcome('failed')
  }

  const field = (name: EntryFormField) => ({
    'aria-invalid': errors[name] !== undefined,
    'aria-describedby': errors[name] !== undefined ? `${id}-${name}-error` : undefined,
  })
  const error = (name: EntryFormField) => {
    const code = errors[name]
    return code === undefined ? null : (
      <p id={`${id}-${name}-error`} role="alert" className={ERR}>
        {t.profileFormError[code]}
      </p>
    )
  }

  return (
    <section aria-labelledby={`${id}-heading`} className={SECTION}>
      <h2 id={`${id}-heading`} className={H2}>
        {t.profileQuickAdd}
      </h2>
      <form onSubmit={(e) => void submit(e)} noValidate className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label htmlFor={`${id}-kind`} className={LABEL}>
            {t.profileKindLabel}
          </label>
          <select
            id={`${id}-kind`}
            value={values.kind}
            onChange={(e) =>
              setValues((current) => ({ ...current, kind: asKind(e.target.value), value: '' }))
            }
            className={INPUT}
          >
            {ENTRY_KINDS.map((kind) => (
              <option key={kind} value={kind}>
                {t.profileKind[kind]}
              </option>
            ))}
          </select>
        </div>

        {unit !== null ? (
          <div className="flex flex-col gap-1">
            <label htmlFor={`${id}-value`} className={LABEL}>
              {t.profileValueLabel} ({t.profileUnit[unit]})
            </label>
            <input
              id={`${id}-value`}
              type="text"
              inputMode="decimal"
              autoComplete="off"
              value={values.value}
              onChange={(e) => setValues((current) => ({ ...current, value: e.target.value }))}
              className={INPUT}
              {...field('value')}
            />
            {error('value')}
          </div>
        ) : (
          <p className="self-end text-sm text-olive-700">{t.profileDoneToday}</p>
        )}

        <div className="flex flex-col gap-1">
          <label htmlFor={`${id}-date`} className={LABEL}>
            {t.profileDateLabel}
          </label>
          <input
            id={`${id}-date`}
            type="date"
            max={today}
            value={values.date}
            onChange={(e) => setValues((current) => ({ ...current, date: e.target.value }))}
            className={INPUT}
            {...field('date')}
          />
          {error('date')}
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor={`${id}-note`} className={LABEL}>
            {t.profileNoteLabel}
          </label>
          <input
            id={`${id}-note`}
            type="text"
            value={values.note}
            onChange={(e) => setValues((current) => ({ ...current, note: e.target.value }))}
            className={INPUT}
            {...field('note')}
          />
          {error('note')}
        </div>

        <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
          <button type="submit" aria-busy={outcome === 'busy'} className={PILL_PRIMARY}>
            {t.profileAddEntry}
          </button>
          {outcome === 'failed' && (
            <p role="alert" className={ERR}>
              {t.profileAddFailed}
            </p>
          )}
        </div>
      </form>
    </section>
  )
}
