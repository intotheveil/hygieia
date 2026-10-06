// ACHIEVEMENTS GRID (P8.2; named AchievementsGrid.tsx because `Achievements.tsx` would differ from
// `achievements.ts` only in casing — a collision on Windows/macOS). Every badge from ./achievements.ts, earned ones bright with their
// date, unearned ones muted with "n% there". Names and descriptions are dictionary values keyed
// by badge id, so a badge without copy in either language is a type error.

import { useLang } from '../i18n/LangProvider'
import { profileCopy } from '../i18n/features/profile.ts'
import { fill } from '../i18n/fill'
import type { Achievement, BadgeId } from './achievements'
import { formatDate } from './format'
import { CARD, H2, SECTION } from './styles'

const GLYPH: Readonly<Record<BadgeId, string>> = {
  'first-entry': '🌱',
  'streak-3': '🔥',
  'streak-7': '📅',
  'streak-30': '🏅',
  'workouts-10': '💪',
  'workouts-50': '🏆',
  'hydration-week': '💧',
  'sleep-week': '🌙',
  'steps-week': '👟',
  'weight-4-weeks': '⚖',
  'skincare-14': '✨',
  'nails-4-weeks': '💅',
  'mood-7': '☀',
  'meals-30': '🍽',
  'collector-10': '📚',
  'all-rounder': '🌈',
  'tasks-first': '☑',
  'tasks-streak-7': '🗓',
  'tasks-50': '✅',
}

export function AchievementsGrid({ achievements }: { achievements: readonly Achievement[] }) {
  const { t, lang } = useLang(profileCopy)
  const earned = achievements.filter((a) => a.earned).length
  return (
    <section aria-labelledby="profile-achievements" className={SECTION}>
      <h2 id="profile-achievements" className={H2}>
        {t.profileAchievements}{' '}
        <span className="text-base font-normal text-olive-700">
          {earned}/{achievements.length}
        </span>
      </h2>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {achievements.map((a) => {
          const copy = t.profileBadge[a.id]
          const status = a.earned
            ? a.earnedOn !== undefined
              ? fill(t.profileEarnedOn, { date: formatDate(a.earnedOn, lang) })
              : t.profileEarned
            : fill(t.profileProgress, { pct: Math.round(a.progress * 100) })
          return (
            <li
              key={a.id}
              data-badge={a.id}
              data-earned={a.earned ? 'true' : 'false'}
              className={`${CARD} ${a.earned ? 'border border-sage-500/40' : 'opacity-70'}`}
            >
              <div className="flex items-center gap-2">
                <span aria-hidden="true" className="text-xl">
                  {GLYPH[a.id]}
                </span>
                <h3 className="font-medium text-olive-950">{copy.name}</h3>
              </div>
              <p className="text-sm text-olive-700">{copy.description}</p>
              <p className={`text-xs font-medium ${a.earned ? 'text-sage-700' : 'text-olive-700'}`}>
                {status}
              </p>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
