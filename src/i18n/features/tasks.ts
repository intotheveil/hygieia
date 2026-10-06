// TASKS ADVISOR DICTIONARY (P9) — every string the `/tasks` pages show, in both languages (ADR-0002
// at feature scale). The topics, questions and tasks themselves are bilingual CONTENT in
// src/tasks/content/*.ts; this module holds only the page chrome. Part of the full `Dictionary`
// (./index.ts).
//
// Reused from their owners, never re-declared (one owner per key): `minutes` (recipes),
// `retry` (plans), `loading` (base).
//
// ROUTE FEATURE (perf, 2026-10-06): read only by the `/tasks` pages, so it is NOT composed into the
// dictionary every page gets from `useLang()` — the route's components call `useLang(tasksCopy)`
// and these strings ship in that route's lazy chunk (./routeFeatures.ts).

import type { RoutineTime } from '../../content/enums.ts'
import type { Day } from '../../tasks/types.ts'
import type { FeatureCopy } from '../app.ts'

export interface TasksDictionary {
  tasksTitle: string
  tasksIntro: string
  /** Under the intro: where answers and ticks live. */
  tasksLocalNote: string
  tasksChooseTopic: string
  tasksBackToTopics: string
  tasksUnknownTopic: string
  tasksLoadFailed: string
  /** `{n}` of `{total}`. */
  tasksQuestionProgress: string
  /** `aria-label` of the questionnaire progress bar. */
  tasksQuestionnaireProgress: string
  /** Shown under a multi-choice question that carries no help line of its own. */
  tasksMultiHint: string
  tasksBack: string
  tasksNext: string
  tasksSeePlan: string
  /** `{n}` = minutes a day. */
  tasksBudgetNote: string
  tasksGentleTitle: string
  /** `{n}` = the lighter week-1 minutes a day. */
  tasksGentleBody: string
  tasksKickoff: string
  tasksToday: string
  tasksTodayEmpty: string
  tasksThisWeek: string
  tasksMonthly: string
  tasksMonthlyHint: string
  tasksMonthlyEmpty: string
  tasksDays: Record<Day, string>
  /** `{done}` of `{total}` daily tasks ticked that day (week columns). */
  tasksDailyLine: string
  tasksDayEmpty: string
  /** `{done}` of `{total}` done. */
  tasksProgress: string
  /** `aria-label` of a progress bar; `{label}` = Today / a day name / This week. */
  tasksProgressOf: string
  tasksRetake: string
  tasksPrint: string
  tasksCopy: string
  tasksCopied: string
  tasksCopyFailed: string
  /** Plain-text export section heading for the daily list. */
  tasksEveryDay: string
  // Connect the features (2026-10-06)
  /** The plan's "Log to profile" switch (signed in only). */
  tasksLogToggle: string
  tasksLogHint: string
  tasksLogFailed: string
  /** workout-routine plan → /workouts/plans. */
  tasksToWorkoutPlan: string
  /** The skincare routine section above the plan. */
  tasksRoutineHeading: string
  tasksRoutineTime: Record<RoutineTime, string>
  tasksRoutineOptional: string
  tasksRoutineRemove: string
  tasksRoutineLoadFailed: string
  /** Above a questionnaire pre-filled from a /skincare routine. */
  tasksPrefilled: string
}

export const tasksEn: TasksDictionary = {
  tasksTitle: 'Task plans',
  tasksIntro:
    'Pick a topic, answer a few quick questions and get a daily and weekly plan sized to the time you really have. Every list is written in advance by people — no AI involved.',
  tasksLocalNote:
    'Your answers and ticks stay on this device, in this browser. Nothing is sent anywhere.',
  tasksChooseTopic: 'Choose a topic',
  tasksBackToTopics: 'All topics',
  tasksUnknownTopic: 'There is no task plan at this address.',
  tasksLoadFailed: 'This topic could not be loaded. Check your connection and try again.',
  tasksQuestionProgress: 'Question {n} of {total}',
  tasksQuestionnaireProgress: 'Questionnaire progress',
  tasksMultiHint: 'Choose all that apply — or none.',
  tasksBack: 'Back',
  tasksNext: 'Next',
  tasksSeePlan: 'See my plan',
  tasksBudgetNote: 'Planned for about {n} minutes a day.',
  tasksGentleTitle: 'A gentle first week',
  tasksGentleBody:
    'Week one is lighter on purpose — about {n} minutes a day — and starts with a few kick-off tasks. When it starts to feel easy, retake the questionnaire to step up.',
  tasksKickoff: 'Kick-off',
  tasksToday: 'Today',
  tasksTodayEmpty: 'Nothing planned for today. Enjoy the breather.',
  tasksThisWeek: 'This week',
  tasksMonthly: 'This month',
  tasksMonthlyHint: 'Once a month, on a day with a little more time.',
  tasksMonthlyEmpty: 'No monthly tasks for your answers.',
  tasksDays: {
    mon: 'Monday',
    tue: 'Tuesday',
    wed: 'Wednesday',
    thu: 'Thursday',
    fri: 'Friday',
    sat: 'Saturday',
    sun: 'Sunday',
  },
  tasksDailyLine: 'Daily tasks: {done} of {total}',
  tasksDayEmpty: 'No extra jobs — just the daily ones.',
  tasksProgress: '{done} of {total} done',
  tasksProgressOf: 'Progress: {label}',
  tasksRetake: 'Retake the questionnaire',
  tasksPrint: 'Print',
  tasksCopy: 'Copy as text',
  tasksCopied: 'Copied to the clipboard.',
  tasksCopyFailed: 'Could not copy — your browser did not allow it.',
  tasksEveryDay: 'Every day',
  tasksLogToggle: 'Log ticked tasks to my profile',
  tasksLogHint:
    'Workouts, glasses of water, your sleep log and skincare or nail care you tick also appear in your profile history. Un-ticking removes them.',
  tasksLogFailed: 'Your profile could not be updated — the tick is still saved on this device.',
  tasksToWorkoutPlan: 'Turn this into a workout plan',
  tasksRoutineHeading: 'Your routine',
  tasksRoutineTime: { am: 'Morning', pm: 'Evening', weekly: 'Once a week' },
  tasksRoutineOptional: 'optional',
  tasksRoutineRemove: 'Remove this routine',
  tasksRoutineLoadFailed: 'This routine could not be loaded.',
  tasksPrefilled:
    'We filled in what your skincare routine already tells us — change anything you like.',
}

export const tasksEl: TasksDictionary = {
  tasksTitle: 'Πλάνα εργασιών',
  tasksIntro:
    'Διάλεξε ένα θέμα, απάντησε σε λίγες γρήγορες ερωτήσεις και πάρε ένα καθημερινό και εβδομαδιαίο πλάνο στα μέτρα του χρόνου που πραγματικά έχεις. Κάθε λίστα είναι γραμμένη από πριν από ανθρώπους — χωρίς τεχνητή νοημοσύνη.',
  tasksLocalNote:
    'Οι απαντήσεις και τα τικ σου μένουν σε αυτή τη συσκευή, σε αυτόν τον browser. Δεν στέλνεται τίποτα πουθενά.',
  tasksChooseTopic: 'Διάλεξε θέμα',
  tasksBackToTopics: 'Όλα τα θέματα',
  tasksUnknownTopic: 'Δεν υπάρχει πλάνο εργασιών σε αυτή τη διεύθυνση.',
  tasksLoadFailed:
    'Δεν ήταν δυνατή η φόρτωση του θέματος. Έλεγξε τη σύνδεσή σου και δοκίμασε ξανά.',
  tasksQuestionProgress: 'Ερώτηση {n} από {total}',
  tasksQuestionnaireProgress: 'Πρόοδος ερωτηματολογίου',
  tasksMultiHint: 'Διάλεξε όσα ισχύουν — ή κανένα.',
  tasksBack: 'Πίσω',
  tasksNext: 'Επόμενη',
  tasksSeePlan: 'Δες το πλάνο μου',
  tasksBudgetNote: 'Σχεδιασμένο για περίπου {n} λεπτά τη μέρα.',
  tasksGentleTitle: 'Μια ήπια πρώτη εβδομάδα',
  tasksGentleBody:
    'Η πρώτη εβδομάδα είναι σκόπιμα πιο ελαφριά — περίπου {n} λεπτά τη μέρα — και ξεκινά με μερικές εργασίες «εκκίνησης». Όταν αρχίσει να σου φαίνεται εύκολο, ξαναπάρε το ερωτηματολόγιο για το επόμενο βήμα.',
  tasksKickoff: 'Εκκίνηση',
  tasksToday: 'Σήμερα',
  tasksTodayEmpty: 'Τίποτα προγραμματισμένο για σήμερα. Απόλαυσε το διάλειμμα.',
  tasksThisWeek: 'Αυτή την εβδομάδα',
  tasksMonthly: 'Αυτόν τον μήνα',
  tasksMonthlyHint: 'Μία φορά τον μήνα, μια μέρα που έχεις λίγο περισσότερο χρόνο.',
  tasksMonthlyEmpty: 'Δεν υπάρχουν μηνιαίες εργασίες για τις απαντήσεις σου.',
  tasksDays: {
    mon: 'Δευτέρα',
    tue: 'Τρίτη',
    wed: 'Τετάρτη',
    thu: 'Πέμπτη',
    fri: 'Παρασκευή',
    sat: 'Σάββατο',
    sun: 'Κυριακή',
  },
  tasksDailyLine: 'Καθημερινές εργασίες: {done} από {total}',
  tasksDayEmpty: 'Καμία επιπλέον δουλειά — μόνο οι καθημερινές.',
  tasksProgress: '{done} από {total} έγιναν',
  tasksProgressOf: 'Πρόοδος: {label}',
  tasksRetake: 'Ξαναπάρε το ερωτηματολόγιο',
  tasksPrint: 'Εκτύπωση',
  tasksCopy: 'Αντιγραφή ως κείμενο',
  tasksCopied: 'Αντιγράφηκε στο πρόχειρο.',
  tasksCopyFailed: 'Η αντιγραφή δεν έγινε — ο browser δεν το επέτρεψε.',
  tasksEveryDay: 'Κάθε μέρα',
  tasksLogToggle: 'Καταγραφή των εργασιών που τσεκάρω στο προφίλ μου',
  tasksLogHint:
    'Οι προπονήσεις, τα ποτήρια νερό, το ημερολόγιο ύπνου και η περιποίηση προσώπου ή νυχιών που τσεκάρεις εμφανίζονται και στο ιστορικό του προφίλ σου. Αν βγάλεις το τικ, αφαιρούνται.',
  tasksLogFailed:
    'Το προφίλ σου δεν ενημερώθηκε — το τικ παραμένει αποθηκευμένο σε αυτή τη συσκευή.',
  tasksToWorkoutPlan: 'Κάν’ το πρόγραμμα προπόνησης',
  tasksRoutineHeading: 'Η ρουτίνα σου',
  tasksRoutineTime: { am: 'Πρωί', pm: 'Βράδυ', weekly: 'Μία φορά την εβδομάδα' },
  tasksRoutineOptional: 'προαιρετικό',
  tasksRoutineRemove: 'Αφαίρεση της ρουτίνας',
  tasksRoutineLoadFailed: 'Δεν ήταν δυνατή η φόρτωση της ρουτίνας.',
  tasksPrefilled: 'Συμπληρώσαμε ό,τι ήδη λέει η ρουτίνα περιποίησής σου — άλλαξε ό,τι θέλεις.',
}

/** Both literals, for `useLang(tasksCopy)` on the `/tasks` pages. */
export const tasksCopy: FeatureCopy<TasksDictionary> = { el: tasksEl, en: tasksEn }
