// PROFILE FORMATTING (P8.2) — the one place the profile turns numbers and dates into strings
// (`Intl`, `el-GR` / `en-GB`, UTC dates — same rules as recipes/panelFormat.ts).

import type { AppDictionary, Lang } from '../i18n/app'
import type { ProfileDictionary } from '../i18n/features/profile.ts'

/** The `t` of a /profile component: `useLang(profileCopy)`. */
type ProfileT = AppDictionary & ProfileDictionary
import type { Entry } from '../user/source'
import { dayNumber } from './stats'

export const localeOf = (lang: Lang): string => (lang === 'el' ? 'el-GR' : 'en-GB')

export function formatNumber(n: number, lang: Lang, maxFraction = 1): string {
  return new Intl.NumberFormat(localeOf(lang), { maximumFractionDigits: maxFraction }).format(n)
}

/** `+1,5` / `−2` / `0` — a delta with its sign spelled (U+2212 minus). */
export function formatDelta(n: number, lang: Lang): string {
  const abs = formatNumber(Math.abs(n), lang)
  return n > 0 ? `+${abs}` : n < 0 ? `−${abs}` : abs
}

/** A `YYYY-MM-DD` as a long date in the language; a non-date string is returned as written. */
export function formatDate(iso: string, lang: Lang): string {
  if (dayNumber(iso) === null) return iso
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString(localeOf(lang), {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

/** `72,5 κιλά` / `30 min`; `null` for a value-less entry. */
export function formatEntryValue(entry: Entry, t: ProfileT, lang: Lang): string | null {
  if (entry.value === null) return null
  const unit = entry.unit === null ? '' : ` ${t.profileUnit[entry.unit]}`
  return `${formatNumber(entry.value, lang)}${unit}`
}

/** `Water, 500 ml, Mon 6 October 2026` — the accessible name of an entry row. */
export function entryLabel(entry: Entry, t: ProfileT, lang: Lang): string {
  const value = formatEntryValue(entry, t, lang)
  return [t.profileKind[entry.kind], value, formatDate(entry.entry_date, lang)]
    .filter((part): part is string => part !== null)
    .join(', ')
}
