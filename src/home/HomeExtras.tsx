// HOME EXTRAS (2026-10-06): the onboarding card (first visit, or "Change preferences") and the
// recipe / tip of the day — the part of the home page that is NOT needed for its first paint. The
// home page (src/App.tsx) imports this module only after the hero image has painted and draws a
// same-size skeleton until then (./layout.ts), so the hero stays the LCP element, the strings
// (`prefsCopy`) and the content reads stay out of the eager chunk, and nothing shifts.

import type { ContentSource } from '../content/index.ts'
import type { Prefs } from '../prefs/prefs.ts'
import { EXTRAS_SLOT } from './layout.ts'
import { OfTheDay } from './OfTheDay.tsx'
import { Onboarding } from './Onboarding.tsx'

export interface HomeExtrasProps {
  /** The stored preferences; null on a first visit. */
  prefs: Prefs | null
  /** Show the onboarding card (first visit, or opened from "Change preferences"). */
  showOnboarding: boolean
  /** Opened to change saved preferences (Cancel instead of Skip). */
  editing: boolean
  /** The card closed: the answers to store, or null for "Cancel" (nothing changes). */
  onPrefsDone: (prefs: Prefs | null) => void
  now: Date
  source?: ContentSource
}

export function HomeExtras({
  prefs,
  showOnboarding,
  editing,
  onPrefsDone,
  now,
  source,
}: HomeExtrasProps) {
  return (
    <div className={EXTRAS_SLOT} data-home-extras="">
      {showOnboarding && <Onboarding initial={prefs} editing={editing} onDone={onPrefsDone} />}
      <OfTheDay prefs={prefs} now={now} source={source} />
    </div>
  )
}
