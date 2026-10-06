// HOME EXTRAS GEOMETRY (2026-10-06). The onboarding card and the two "of the day" cards are a lazy
// chunk (./HomeExtras.tsx) that arrives after the hero has painted; until then the home page
// (src/App.tsx, eager) draws a skeleton in the SAME boxes. Both read their sizes from here, so the
// swap from skeleton to card is not a layout shift (no CLS): the of-the-day cards have a FIXED
// height (their text is line-clamped), the onboarding card a minimum height its content fits in,
// per language (Greek wraps to more lines on a phone), measured from 360 px to 1280 px wide in
// both languages (BUILD_LOG). Plain class strings only: this module is part of the eager chunk.

import type { Lang } from '../i18n/app'

/** The whole slot between the hero and the module grid (`data-home-extras` marks it in e2e). */
export const EXTRAS_SLOT = 'flex flex-col gap-8'

/**
 * The onboarding card's box (skeleton and card alike). Measured content + padding at 360 px:
 * Greek 586 px, English 460 px; at ≥ 640 px (three questions in a row): 296 / 274 px.
 */
export function onboardingBox(lang: Lang): string {
  const phone = lang === 'el' ? 'min-h-[37rem]' : 'min-h-[30rem]'
  return `${phone} rounded-2xl border border-olive-900/10 bg-paper-50/80 p-6 shadow-sm sm:min-h-[19rem]`
}

/** The row holding the recipe and the tip of the day. */
export const TODAY_GRID = 'grid gap-5 sm:grid-cols-2'

/** One of-the-day card's box: fixed height, so loading → loaded never moves anything. */
export const TODAY_CARD =
  'relative flex h-56 flex-col gap-2 overflow-hidden rounded-2xl border border-olive-900/10 bg-paper-50/80 p-5 shadow-sm'

/** A skeleton bone. */
export const BONE = 'rounded-full bg-olive-900/10'
