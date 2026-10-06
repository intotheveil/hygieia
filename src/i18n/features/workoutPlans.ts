// WORKOUT PLANS DICTIONARY (P8.3) — every string of `/workouts/plans` (plan builder, active plan
// grid, session logger, progress and PRs, session history) plus the "My plans" / "Start plan" links
// on /workouts and /profile. Named `workoutPlans` because `plans.ts` is the MEAL-plan module (P4.6),
// which also owns the shared `loadFailed` / `retry`. Every key is prefixed `wp` so it can never
// collide with another module's key (one owner per key, dictionary.test.ts). Reused from their
// owners, never redeclared: `minutesUnit` (workouts), `profileUnit.kg`, `profileDelete`,
// `profileConfirmDelete` (profile), `types` / `levels` / `intensities` / `pickType`… (workouts).

import type { PluralForms } from '../fill.ts'
import type { PlanStatus } from '../../user/source.ts'
import type { LoggerError, SetFieldError } from '../../workouts/plans/logger.ts'
import type { PlanFormError } from '../../workouts/plans/builder.ts'
import type { PersonalRecordKind } from '../../workouts/plans/progress.ts'

export interface WorkoutPlansDictionary {
  wpTitle: string
  wpIntro: string
  /** Link text to the page from /workouts and /profile. */
  wpLink: string
  /** The /workouts card button; `{name}` = the session title (accessible name). */
  wpStartPlan: string
  wpStartPlanFor: string
  wpLoadFailed: string

  // builder
  wpBuilderHeading: string
  wpBuilderIntro: string
  wpNewPlan: string
  wpName: string
  wpWeeks: string
  wpDaysPerWeek: string
  wpStartDate: string
  wpCreate: string
  wpCreating: string
  wpCreateFailed: string
  wpCancel: string
  wpNoTemplate: string
  /** "This plan: 4 weeks × 3 days = 12 sessions". */
  wpBuilderSummary: string
  wpFormErrors: Record<PlanFormError, string>

  // active plan
  wpActiveHeading: string
  wpNoActive: string
  wpNoActiveHint: string
  wpWeek: string
  wpThisWeekBadge: string
  /** Cell names: `{week}`, `{day}`. */
  wpCellDone: string
  wpCellOpen: string
  wpScheduleLabel: string
  wpProgressValue: string
  wpThisWeek: string
  wpDates: string
  wpNotStarted: string
  wpFinished: string
  wpLogToday: string
  wpComplete: string
  wpAbandon: string
  wpConfirm: string
  wpStatusFailed: string
  wpPastHeading: string
  wpStatus: Record<PlanStatus, string>

  // logger
  wpLoggerHeading: string
  wpLoggerFor: string
  wpDate: string
  wpDuration: string
  wpNote: string
  wpSet: string
  wpReps: string
  wpWeight: string
  wpRpe: string
  wpRpeShort: string
  wpDone: string
  wpAddSet: string
  wpRemoveSet: string
  wpPrescribed: string
  wpSecondsShort: string
  wpSave: string
  wpSaving: string
  wpSaved: string
  wpSavedPr: string
  wpSaveFailed: string
  wpErrors: Record<LoggerError, string>
  wpSetErrors: Record<SetFieldError, string>
  wpRestTimer: string
  wpRestStart: string
  wpRestStop: string
  wpRestLeft: string
  wpRestOver: string

  // progress
  wpProgressHeading: string
  wpProgressEmpty: string
  wpExercise: string
  wpSessions: PluralForms
  wpSessionsLabel: string
  wpBestSet: string
  wpBestSetValue: string
  wpBodyweight: string
  wpE1rm: string
  wpVolume: string
  wpTrendSummary: string
  wpTrendEmpty: string
  wpWeeklyVolume: string
  wpWeeklySummary: string

  // PRs + history
  wpPr: string
  wpPrKinds: Record<PersonalRecordKind, string>
  wpHistoryHeading: string
  wpHistoryEmpty: string
  wpFreeSession: string
  wpSessionSummary: string
  wpDeleteFailed: string
  wpUnknownExercise: string
}

export const workoutPlansEn: WorkoutPlansDictionary = {
  wpTitle: 'My workout plans',
  wpIntro:
    'Turn any session into a plan of a few weeks, log every set as you train, and watch your records and weekly volume grow.',
  wpLink: 'My plans',
  wpStartPlan: 'Start plan',
  wpStartPlanFor: 'Start plan: {name}',
  wpLoadFailed: 'Your plans could not be loaded.',

  wpBuilderHeading: 'New plan',
  wpBuilderIntro:
    'Pick the session you will repeat, how many weeks and how many days a week. You can log a session any day.',
  wpNewPlan: 'New plan',
  wpName: 'Plan name',
  wpWeeks: 'Weeks',
  wpDaysPerWeek: 'Days per week',
  wpStartDate: 'Start date',
  wpCreate: 'Create plan',
  wpCreating: 'Creating…',
  wpCreateFailed: 'The plan was not created. Try again.',
  wpCancel: 'Cancel',
  wpNoTemplate: 'No session is available for this combination yet.',
  wpBuilderSummary: '{weeks} weeks × {days} days = {total} sessions',
  wpFormErrors: {
    name: 'Give the plan a name (up to 80 characters).',
    weeks: 'Choose between 1 and 12 weeks.',
    days: 'Choose between 1 and 7 days a week.',
    date: 'Enter a valid start date.',
    template: 'Pick a session first.',
  },

  wpActiveHeading: 'Active plans',
  wpNoActive: 'No active plan yet',
  wpNoActiveHint: 'Create one below, or start from any session on the Workouts page.',
  wpWeek: 'Week {n}',
  wpThisWeekBadge: 'This week',
  wpCellDone: 'Week {week}, day {day}: done',
  wpCellOpen: 'Week {week}, day {day}: not yet',
  wpScheduleLabel: 'Schedule',
  wpProgressValue: '{done} of {total} sessions done',
  wpThisWeek: '{n} of {days} this week',
  wpDates: '{start} to {end}',
  wpNotStarted: 'Starts on {date}',
  wpFinished: 'The planned weeks are over — mark it completed when you are ready.',
  wpLogToday: "Log today's session",
  wpComplete: 'Mark completed',
  wpAbandon: 'Abandon',
  wpConfirm: 'Sure?',
  wpStatusFailed: 'The plan was not updated. Try again.',
  wpPastHeading: 'Past plans',
  wpStatus: { active: 'Active', completed: 'Completed', abandoned: 'Abandoned' },

  wpLoggerHeading: 'Log a session',
  wpLoggerFor: 'Logging: {name}',
  wpDate: 'Date',
  wpDuration: 'Duration (min)',
  wpNote: 'Note',
  wpSet: 'Set {n}',
  wpReps: 'Reps',
  wpWeight: 'Weight (kg)',
  wpRpe: 'Effort, RPE 1–10',
  wpRpeShort: 'RPE',
  wpDone: 'Done',
  wpAddSet: 'Add set',
  wpRemoveSet: 'Remove set {n} of {name}',
  wpPrescribed: 'Plan: {figure}',
  wpSecondsShort: 's',
  wpSave: 'Save session',
  wpSaving: 'Saving…',
  wpSaved: 'Session saved.',
  wpSavedPr: 'Session saved — new personal record!',
  wpSaveFailed: 'The session was not saved. Try again.',
  wpErrors: {
    durationRange: 'Duration is whole minutes, 1 to 600.',
    noteTooLong: 'The note is too long (500 characters at most).',
    dateInvalid: 'Enter a valid date.',
    dateFuture: 'The date cannot be in the future.',
    noSets: 'Add at least one set.',
    tooManyExercises: 'A session can hold at most 40 exercises.',
  },
  wpSetErrors: {
    reps: 'Reps must be a whole number from 0 to 999.',
    weight: 'Weight is a number from 0 to 1000 kg.',
    rpe: 'Effort is 1 to 10, in half steps.',
  },
  wpRestTimer: 'Rest timer',
  wpRestStart: 'Rest {n} s',
  wpRestStop: 'Stop timer',
  wpRestLeft: 'Rest: {clock}',
  wpRestOver: 'Rest over — next set.',

  wpProgressHeading: 'Progress',
  wpProgressEmpty: 'Log a session with completed sets to see your progress here.',
  wpExercise: 'Exercise',
  wpSessions: { one: '{n} session', other: '{n} sessions' },
  wpSessionsLabel: 'Sessions',
  wpBestSet: 'Best set',
  wpBestSetValue: '{weight} × {reps} reps',
  wpBodyweight: 'bodyweight',
  wpE1rm: 'Estimated 1RM',
  wpVolume: 'Total volume',
  wpTrendSummary: 'Estimated 1RM over the last {n} sessions: from {first} to {last} kg.',
  wpTrendEmpty: 'Log this exercise with a weight in two sessions to see a trend.',
  wpWeeklyVolume: 'Weekly volume, last 8 weeks',
  wpWeeklySummary: 'Weekly volume over the last 8 weeks: this week {last} kg, highest {max} kg.',

  wpPr: 'PR',
  wpPrKinds: {
    weight: 'Heaviest weight: {value} kg',
    e1rm: 'Best estimated 1RM: {value} kg',
    reps: 'Most reps: {value} at {weight}',
  },
  wpHistoryHeading: 'Session history',
  wpHistoryEmpty: 'No sessions logged yet',
  wpFreeSession: 'Session without a plan',
  wpSessionSummary: '{exercises} exercises · {sets} sets done · {volume} kg volume',
  wpDeleteFailed: 'The session was not deleted. Try again.',
  wpUnknownExercise: 'Exercise no longer available',
}

export const workoutPlansEl: WorkoutPlansDictionary = {
  wpTitle: 'Τα προγράμματα προπόνησής μου',
  wpIntro:
    'Κάνε οποιαδήποτε προπόνηση πρόγραμμα λίγων εβδομάδων, κατέγραψε κάθε σετ καθώς γυμνάζεσαι και δες τα ρεκόρ και τον εβδομαδιαίο όγκο σου να ανεβαίνουν.',
  wpLink: 'Τα προγράμματά μου',
  wpStartPlan: 'Ξεκίνα πρόγραμμα',
  wpStartPlanFor: 'Ξεκίνα πρόγραμμα: {name}',
  wpLoadFailed: 'Δεν φορτώθηκαν τα προγράμματά σου.',

  wpBuilderHeading: 'Νέο πρόγραμμα',
  wpBuilderIntro:
    'Διάλεξε την προπόνηση που θα επαναλαμβάνεις, για πόσες εβδομάδες και πόσες μέρες την εβδομάδα. Μπορείς να καταγράψεις προπόνηση όποια μέρα θέλεις.',
  wpNewPlan: 'Νέο πρόγραμμα',
  wpName: 'Όνομα προγράμματος',
  wpWeeks: 'Εβδομάδες',
  wpDaysPerWeek: 'Μέρες την εβδομάδα',
  wpStartDate: 'Ημερομηνία έναρξης',
  wpCreate: 'Δημιουργία προγράμματος',
  wpCreating: 'Δημιουργία…',
  wpCreateFailed: 'Το πρόγραμμα δεν δημιουργήθηκε. Δοκίμασε ξανά.',
  wpCancel: 'Άκυρο',
  wpNoTemplate: 'Δεν υπάρχει ακόμη προπόνηση για αυτόν τον συνδυασμό.',
  wpBuilderSummary: '{weeks} εβδομάδες × {days} μέρες = {total} προπονήσεις',
  wpFormErrors: {
    name: 'Δώσε όνομα στο πρόγραμμα (έως 80 χαρακτήρες).',
    weeks: 'Διάλεξε από 1 έως 12 εβδομάδες.',
    days: 'Διάλεξε από 1 έως 7 μέρες την εβδομάδα.',
    date: 'Γράψε έγκυρη ημερομηνία έναρξης.',
    template: 'Διάλεξε πρώτα προπόνηση.',
  },

  wpActiveHeading: 'Ενεργά προγράμματα',
  wpNoActive: 'Κανένα ενεργό πρόγραμμα ακόμη',
  wpNoActiveHint: 'Φτιάξε ένα παρακάτω ή ξεκίνα από οποιαδήποτε προπόνηση στη σελίδα Γυμναστική.',
  wpWeek: 'Εβδομάδα {n}',
  wpThisWeekBadge: 'Αυτή την εβδομάδα',
  wpCellDone: 'Εβδομάδα {week}, μέρα {day}: έγινε',
  wpCellOpen: 'Εβδομάδα {week}, μέρα {day}: εκκρεμεί',
  wpScheduleLabel: 'Πρόγραμμα εβδομάδων',
  wpProgressValue: '{done} από {total} προπονήσεις',
  wpThisWeek: '{n} από {days} αυτή την εβδομάδα',
  wpDates: '{start} έως {end}',
  wpNotStarted: 'Ξεκινά στις {date}',
  wpFinished: 'Οι εβδομάδες του προγράμματος τελείωσαν — σήμανέ το ολοκληρωμένο όταν θέλεις.',
  wpLogToday: 'Κατέγραψε τη σημερινή προπόνηση',
  wpComplete: 'Ολοκληρώθηκε',
  wpAbandon: 'Εγκατάλειψη',
  wpConfirm: 'Σίγουρα;',
  wpStatusFailed: 'Το πρόγραμμα δεν ενημερώθηκε. Δοκίμασε ξανά.',
  wpPastHeading: 'Προηγούμενα προγράμματα',
  wpStatus: { active: 'Ενεργό', completed: 'Ολοκληρωμένο', abandoned: 'Εγκαταλείφθηκε' },

  wpLoggerHeading: 'Καταγραφή προπόνησης',
  wpLoggerFor: 'Καταγραφή: {name}',
  wpDate: 'Ημερομηνία',
  wpDuration: 'Διάρκεια (λεπτά)',
  wpNote: 'Σημείωση',
  wpSet: 'Σετ {n}',
  wpReps: 'Επαναλήψεις',
  wpWeight: 'Βάρος (κιλά)',
  wpRpe: 'Κόπωση, RPE 1–10',
  wpRpeShort: 'Κόπωση',
  wpDone: 'Έγινε',
  wpAddSet: 'Προσθήκη σετ',
  wpRemoveSet: 'Αφαίρεση σετ {n} από {name}',
  wpPrescribed: 'Πρόγραμμα: {figure}',
  wpSecondsShort: 'δευτ.',
  wpSave: 'Αποθήκευση προπόνησης',
  wpSaving: 'Αποθήκευση…',
  wpSaved: 'Η προπόνηση αποθηκεύτηκε.',
  wpSavedPr: 'Η προπόνηση αποθηκεύτηκε — νέο προσωπικό ρεκόρ!',
  wpSaveFailed: 'Η προπόνηση δεν αποθηκεύτηκε. Δοκίμασε ξανά.',
  wpErrors: {
    durationRange: 'Η διάρκεια είναι ακέραια λεπτά, από 1 έως 600.',
    noteTooLong: 'Η σημείωση είναι πολύ μεγάλη (έως 500 χαρακτήρες).',
    dateInvalid: 'Γράψε έγκυρη ημερομηνία.',
    dateFuture: 'Η ημερομηνία δεν μπορεί να είναι στο μέλλον.',
    noSets: 'Πρόσθεσε τουλάχιστον ένα σετ.',
    tooManyExercises: 'Μια προπόνηση χωράει έως 40 ασκήσεις.',
  },
  wpSetErrors: {
    reps: 'Οι επαναλήψεις είναι ακέραιος αριθμός από 0 έως 999.',
    weight: 'Το βάρος είναι αριθμός από 0 έως 1000 κιλά.',
    rpe: 'Η κόπωση είναι από 1 έως 10, ανά μισή μονάδα.',
  },
  wpRestTimer: 'Χρονόμετρο διαλείμματος',
  wpRestStart: 'Διάλειμμα {n} δευτ.',
  wpRestStop: 'Διακοπή χρονομέτρου',
  wpRestLeft: 'Διάλειμμα: {clock}',
  wpRestOver: 'Τέλος διαλείμματος — επόμενο σετ.',

  wpProgressHeading: 'Πρόοδος',
  wpProgressEmpty: 'Κατέγραψε μια προπόνηση με ολοκληρωμένα σετ για να δεις εδώ την πρόοδό σου.',
  wpExercise: 'Άσκηση',
  wpSessions: { one: '{n} προπόνηση', other: '{n} προπονήσεις' },
  wpSessionsLabel: 'Προπονήσεις',
  wpBestSet: 'Καλύτερο σετ',
  wpBestSetValue: '{weight} × {reps} επαν.',
  wpBodyweight: 'σωματικό βάρος',
  wpE1rm: 'Εκτιμώμενο 1RM',
  wpVolume: 'Συνολικός όγκος',
  wpTrendSummary: 'Εκτιμώμενο 1RM στις τελευταίες {n} προπονήσεις: από {first} σε {last} κιλά.',
  wpTrendEmpty: 'Κατέγραψε την άσκηση με βάρος σε δύο προπονήσεις για να δεις την τάση.',
  wpWeeklyVolume: 'Εβδομαδιαίος όγκος, τελευταίες 8 εβδομάδες',
  wpWeeklySummary:
    'Εβδομαδιαίος όγκος τις τελευταίες 8 εβδομάδες: αυτή την εβδομάδα {last} κιλά, μέγιστος {max} κιλά.',

  wpPr: 'Ρεκόρ',
  wpPrKinds: {
    weight: 'Μεγαλύτερο βάρος: {value} κιλά',
    e1rm: 'Καλύτερο εκτιμώμενο 1RM: {value} κιλά',
    reps: 'Περισσότερες επαναλήψεις: {value} με {weight}',
  },
  wpHistoryHeading: 'Ιστορικό προπονήσεων',
  wpHistoryEmpty: 'Δεν έχεις καταγράψει προπονήσεις ακόμη',
  wpFreeSession: 'Προπόνηση εκτός προγράμματος',
  wpSessionSummary: '{exercises} ασκήσεις · {sets} σετ έγιναν · όγκος {volume} κιλά',
  wpDeleteFailed: 'Η προπόνηση δεν διαγράφηκε. Δοκίμασε ξανά.',
  wpUnknownExercise: 'Η άσκηση δεν είναι πια διαθέσιμη',
}
