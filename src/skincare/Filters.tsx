// SKINCARE FILTERS (P7.2): the toolbar above the three sections. Two segmented groups (area
// Face / Nails, audience Everyone / Men / Women — `aria-pressed` buttons inside a labelled
// `role="group"`, the recipes-page chip pattern) and three native `<select>`s (skin type, concern,
// regional style — the compact, keyboard-complete control for 5–13 options, labelled with
// `<label for>`). Under nails the skin-type select is NOT rendered (every nail row is skin type
// `all`, so the control would do nothing) and the region label changes wording. Every string is a
// dictionary value; the option VALUES are the enum literals, the null option is `all`.

import type { CareArea } from '../content/enums.ts'
import { useLang } from '../i18n/LangProvider'
import { skincareCopy } from '../i18n/features/skincare.ts'
import {
  AUDIENCE_OPTIONS,
  REGION_OPTIONS,
  SKIN_TYPE_OPTIONS,
  concernOptions,
  type SkincareSelection,
} from './select'

export interface FiltersProps {
  selection: SkincareSelection
  onChange: (patch: Partial<SkincareSelection>) => void
}

const SEG_ON = 'rounded-full bg-olive-900 px-4 py-1.5 text-sm font-medium text-paper-50'
const SEG_OFF =
  'rounded-full border border-olive-900/20 bg-paper-50/70 px-4 py-1.5 text-sm font-medium text-olive-900 transition hover:bg-paper-50'
const SELECT =
  'rounded-xl border border-olive-900/20 bg-paper-50/80 px-3 py-2 text-sm text-olive-900 shadow-sm focus:border-olive-900/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-sage-500'
const LABEL = 'text-sm font-medium tracking-wide text-sage-700 uppercase'

/** The "everything" option value shared by the three selects. */
const ANY = 'all'

function Segmented<T extends string>({
  id,
  label,
  options,
  value,
  labels,
  onChange,
}: {
  id: string
  label: string
  options: readonly T[]
  value: T
  labels: (option: T) => string
  onChange: (next: T) => void
}) {
  return (
    <div className="flex flex-col gap-2">
      <p id={`${id}-label`} className={LABEL}>
        {label}
      </p>
      <div role="group" aria-labelledby={`${id}-label`} className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={option === value}
            onClick={() => onChange(option)}
            className={option === value ? SEG_ON : SEG_OFF}
          >
            {labels(option)}
          </button>
        ))}
      </div>
    </div>
  )
}

function Select<T extends string>({
  id,
  label,
  anyLabel,
  options,
  value,
  labels,
  onChange,
}: {
  id: string
  label: string
  anyLabel: string
  options: readonly T[]
  value: T | null
  labels: (option: T) => string
  onChange: (next: T | null) => void
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className={LABEL}>
        {label}
      </label>
      <select
        id={id}
        value={value ?? ANY}
        onChange={(e) => {
          const next = e.target.value
          onChange((options as readonly string[]).includes(next) ? (next as T) : null)
        }}
        className={SELECT}
      >
        <option value={ANY}>{anyLabel}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {labels(option)}
          </option>
        ))}
      </select>
    </div>
  )
}

/** Audience as the control shows it: `all` first (= everyone, the null state), then men, women. */
const AUDIENCE_SEGMENTS = ['all', ...AUDIENCE_OPTIONS] as const
type AudienceSegment = (typeof AUDIENCE_SEGMENTS)[number]

export function Filters({ selection, onChange }: FiltersProps) {
  const { t } = useLang(skincareCopy)
  const areaOptions: readonly CareArea[] = ['face', 'nails']
  const audienceValue: AudienceSegment = selection.audience ?? 'all'

  return (
    <div
      role="region"
      aria-label={t.skincareFilters}
      className="flex flex-col gap-5 rounded-2xl border border-olive-900/10 bg-paper-50/60 p-5"
    >
      <div className="flex flex-wrap gap-x-10 gap-y-5">
        <Segmented
          id="skincare-area"
          label={t.skincareAreaLabel}
          options={areaOptions}
          value={selection.area}
          labels={(area) => t.skincareArea[area]}
          onChange={(area) => onChange({ area })}
        />
        <Segmented
          id="skincare-audience"
          label={t.skincareAudienceLabel}
          options={AUDIENCE_SEGMENTS}
          value={audienceValue}
          labels={(audience) => t.skincareAudience[audience]}
          onChange={(audience) => onChange({ audience: audience === 'all' ? null : audience })}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {selection.area !== 'nails' && (
          <Select
            id="skincare-skin"
            label={t.skincareSkinTypeLabel}
            anyLabel={t.skincareSkinType.all}
            options={SKIN_TYPE_OPTIONS}
            value={selection.skin}
            labels={(skin) => t.skincareSkinType[skin]}
            onChange={(skin) => onChange({ skin })}
          />
        )}
        <Select
          id="skincare-concern"
          label={t.skincareConcernLabel}
          anyLabel={t.skincareAnyConcern}
          options={concernOptions(selection.area)}
          value={selection.concern}
          labels={(concern) => t.skincareConcern[concern]}
          onChange={(concern) => onChange({ concern })}
        />
        <Select
          id="skincare-region"
          label={selection.area === 'nails' ? t.skincareRegionLabelNails : t.skincareRegionLabel}
          anyLabel={t.skincareAnyRegion}
          options={REGION_OPTIONS}
          value={selection.region}
          labels={(region) => t.skincareRegion[region]}
          onChange={(region) => onChange({ region })}
        />
      </div>
    </div>
  )
}
