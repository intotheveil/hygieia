// SHARED ROUTE-FEATURE COPY (perf, 2026-10-06 — CI diet 84). The few profile / workout-plans keys
// that are read OUTSIDE their own route: the account menu's and account page's link to /profile
// (`profileLink`, in the header of every page), the save button on the workouts / diets / tips /
// skincare cards (`saveItem*`), the "My plans" / "Start plan" links on /workouts and /profile
// (`wp*`), and the unit labels + delete / confirm buttons that /profile and /workouts/plans both
// render. Everything else of `profile.ts` and `workoutPlans.ts` is a ROUTE feature: it is not in
// the dictionary every page gets from `useLang()`, it ships with its own lazily-loaded route
// (`useLang(profileCopy)` / `useLang(workoutPlansCopy)`, features/index.ts). These keys live here,
// composed into the app dictionary, so a page that only shows a link or a save button does not
// download a whole feature's strings. One owner per key (dictionary.test.ts): moved here, not
// copied; the names keep their `profile` / `wp` / `saveItem` prefixes so the call sites read the
// same.

import type { EntryUnit } from '../../user/source.ts'

export interface SharedDictionary {
  /** The account-menu / account-page link to `/profile`. */
  profileLink: string
  profileUnit: Record<EntryUnit, string>
  profileDelete: string
  /** The second-click confirmation label ("Sure?"). */
  profileConfirmDelete: string
  saveItemAdd: string
  saveItemRemove: string
  saveItemFailed: string
  /** Link text to the page from /workouts and /profile. */
  wpLink: string
  /** The /workouts card button; `{name}` = the session title (accessible name). */
  wpStartPlan: string
  wpStartPlanFor: string
}

export const sharedEn: SharedDictionary = {
  profileLink: 'Profile',
  profileUnit: {
    kg: 'kg',
    kcal: 'kcal',
    min: 'min',
    ml: 'ml',
    h: 'h',
    steps: 'steps',
    score: 'out of 5',
  },
  profileDelete: 'Delete',
  profileConfirmDelete: 'Sure?',
  saveItemAdd: 'Save',
  saveItemRemove: 'Saved — remove',
  saveItemFailed: 'Could not save. Try again.',
  wpLink: 'My plans',
  wpStartPlan: 'Start plan',
  wpStartPlanFor: 'Start plan: {name}',
}

export const sharedEl: SharedDictionary = {
  profileLink: 'Προφίλ',
  profileUnit: {
    kg: 'κιλά',
    kcal: 'kcal',
    min: 'λεπτά',
    ml: 'ml',
    h: 'ώρες',
    steps: 'βήματα',
    score: 'στα 5',
  },
  profileDelete: 'Διαγραφή',
  profileConfirmDelete: 'Σίγουρα;',
  saveItemAdd: 'Αποθήκευση',
  saveItemRemove: 'Αποθηκεύτηκε — αφαίρεση',
  saveItemFailed: 'Δεν αποθηκεύτηκε. Δοκίμασε ξανά.',
  wpLink: 'Τα προγράμματά μου',
  wpStartPlan: 'Ξεκίνα πρόγραμμα',
  wpStartPlanFor: 'Ξεκίνα πρόγραμμα: {name}',
}
