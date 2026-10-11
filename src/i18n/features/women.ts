// WOMEN DICTIONARY — the UI chrome of `/women` ("Για τη γυναίκα" / "For women"), in both languages
// (ADR-0002 at feature scale). The page's CONTENT (sections, cards, sources) is bilingual data in
// src/women/content.ts; this module holds only the frame around it: title, intro, table of
// contents, link labels and the boxes' headings.
//
// Reused from their owners, never re-declared (one owner per key): `types`, `levels`,
// `intensities`, `duration`, `minutesUnit` (workouts).
//
// ROUTE FEATURE: read only by `/women`, so it is NOT composed into the dictionary every page gets
// from `useLang()` — the page calls `useLang(womenCopy)` and these strings ship in the route's lazy
// chunk (./routeFeatures.ts). The nav label (`nav.women`) is base copy (../app.ts).

import type { FeatureCopy } from '../app.ts'

export interface WomenDictionary {
  womenTitle: string
  womenIntro: string
  /** The page's own note under the intro (the footer disclaimer stays too). */
  womenNote: string
  /** `aria-label` + heading of the in-page table of contents. */
  womenToc: string
  womenSources: string
  /** Heading of the ready-made session cards in the strength section. */
  womenTemplatesHeading: string
  womenTemplatesIntro: string
  /** Link to `/workouts?track=women-strength&type=&level=`; `{name}` = the session title (accessible name). */
  womenOpenSession: string
  womenOpenSessionFor: string
  /** The main link to the whole track, `/workouts?track=women-strength`. */
  womenSeeProgramme: string
  /** The general link to the plan builder under the cards. */
  womenPlanBuilder: string
  /** Heading of the "see a doctor if…" box in the menopause section. */
  womenDoctorTitle: string
  /** `{nutrient}` = the nutrient's name; links to `/recipes?nutrient=<slug>`. */
  womenRecipesFor: string
  womenBackToTop: string
}

export const womenEn: WomenDictionary = {
  womenTitle: 'For women',
  womenIntro:
    'Strength training, perimenopause and menopause, the nutrients women most often run short of, and what your cycle really means for training — short, plain and sourced.',
  womenNote:
    'This is general information, not medical advice. Every body is different: if something worries you, talk to your doctor.',
  womenToc: 'On this page',
  womenSources: 'Sources',
  womenTemplatesHeading: 'Ready-made sessions',
  womenTemplatesIntro:
    'Full-body, lower- and upper-body sessions for the gym or for home. Open one to see every exercise, or build a weekly plan around them.',
  womenOpenSession: 'See the session',
  womenOpenSessionFor: 'See the session: {name}',
  womenSeeProgramme: 'See the programme',
  womenPlanBuilder: 'Build your own weekly plan',
  womenDoctorTitle: 'See a doctor if…',
  womenRecipesFor: 'Recipes with {nutrient}',
  womenBackToTop: 'Back to the top',
}

export const womenEl: WomenDictionary = {
  womenTitle: 'Για τη γυναίκα',
  womenIntro:
    'Προπόνηση δύναμης, περιεμμηνόπαυση και εμμηνόπαυση, τα θρεπτικά συστατικά που συχνότερα λείπουν από τις γυναίκες και τι σημαίνει στ’ αλήθεια ο κύκλος σου για την προπόνηση — σύντομα, απλά και με πηγές.',
  womenNote:
    'Πρόκειται για γενικές πληροφορίες, όχι για ιατρική συμβουλή. Κάθε σώμα είναι διαφορετικό: αν κάτι σε ανησυχεί, μίλησε με τον γιατρό σου.',
  womenToc: 'Σε αυτή τη σελίδα',
  womenSources: 'Πηγές',
  womenTemplatesHeading: 'Έτοιμες προπονήσεις',
  womenTemplatesIntro:
    'Προπονήσεις για όλο το σώμα, για τα πόδια ή για το πάνω μέρος, στο γυμναστήριο ή στο σπίτι. Άνοιξε μία για να δεις κάθε άσκηση ή φτιάξε γύρω τους ένα εβδομαδιαίο πρόγραμμα.',
  womenOpenSession: 'Δες την προπόνηση',
  womenOpenSessionFor: 'Δες την προπόνηση: {name}',
  womenSeeProgramme: 'Δες το πρόγραμμα',
  womenPlanBuilder: 'Φτιάξε το δικό σου εβδομαδιαίο πρόγραμμα',
  womenDoctorTitle: 'Πήγαινε στον γιατρό αν…',
  womenRecipesFor: 'Συνταγές με {nutrient}',
  womenBackToTop: 'Επιστροφή στην αρχή',
}

/** Both literals, for `useLang(womenCopy)` on the `/women` route. */
export const womenCopy: FeatureCopy<WomenDictionary> = { el: womenEl, en: womenEn }
