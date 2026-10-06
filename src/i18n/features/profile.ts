// PROFILE DICTIONARY (P8.2) — every string of `/profile` and of the save buttons, in both
// languages (ADR-0002 at feature scale). Composed into the app `Dictionary` by ./index.ts. Label
// tables are keyed by the P8 contract enums (`EntryKind`, `EntryUnit`, `Cadence`, `SavedItemKind`),
// by the form's `EntryFormError` and by the badge ids, so a new member without a label is a type
// error in both languages at once.
//
// Reused from their owners, never re-declared (one owner per key): `open` + `retry` + `loadFailed`
// (plans), `favourites` + `remove` + `account` (base). Greek: "kcal" and "ml" stay Latin-script as
// every Greek label does; everything else is written the way a Greek coach or pharmacist says it.

import type { BadgeId } from '../../profile/achievements.ts'
import type { EntryFormError } from '../../profile/entryForm.ts'
import type {
  Cadence,
  EntryKind,
  EntryUnit,
  GoalKind,
  SavedItemKind,
} from '../../user/source.ts'
import type { PluralForms } from '../fill.ts'

export interface BadgeCopy {
  name: string
  description: string
}

export interface ProfileDictionary {
  profileTitle: string
  profileIntro: string
  /** The account-menu / account-page link to `/profile`. */
  profileLink: string
  profileLoadFailed: string
  // Summary strip
  profileSummaryHeading: string
  profileEntriesThisWeek: string
  profileCurrentStreak: string
  profileLongestStreak: string
  /** Favourites + saved items, one figure. */
  profileCollection: string
  profileDays: PluralForms
  profileTodayGoals: string
  profileNoGoal: string
  /** `aria-label` + visible text of a goal bar: `{value} / {target} {unit}`. */
  profileGoalBar: string
  // Quick add
  profileQuickAdd: string
  profileKindLabel: string
  profileValueLabel: string
  profileDateLabel: string
  profileNoteLabel: string
  /** Shown instead of a value field for skincare / nails. */
  profileDoneToday: string
  profileAddEntry: string
  profileAddFailed: string
  profileFormError: Record<EntryFormError, string>
  profileKind: Record<EntryKind, string>
  profileUnit: Record<EntryUnit, string>
  /** The unit a goal of each kind is set in (skincare: sessions). */
  profileGoalUnit: Record<GoalKind, string>
  // Weight trend
  profileWeightTrend: string
  profileWeightTrendEmpty: string
  /** `aria-label` of the sparkline: `{first}`, `{last}`, `{delta}` in kg, `{n}` readings. */
  profileWeightTrendSummary: string
  // History
  profileHistory: string
  profileHistoryEmpty: string
  profileDelete: string
  /** The second-click confirmation label ("Sure?"). */
  profileConfirmDelete: string
  profileDeleteFailed: string
  // Goals
  profileGoals: string
  profileGoalsIntro: string
  profileTarget: string
  profileCadenceLabel: string
  profileCadence: Record<Cadence, string>
  profileSaveGoal: string
  profileGoalSaved: string
  profileGoalFailed: string
  profileGoalInvalid: string
  // Achievements
  profileAchievements: string
  profileEarned: string
  /** `{date}` */
  profileEarnedOn: string
  /** `{pct}` */
  profileProgress: string
  profileBadge: Record<BadgeId, BadgeCopy>
  // Saved
  profileSaved: string
  profileSavedEmpty: string
  profileFavouriteRecipes: string
  profileSavedKind: Record<SavedItemKind, string>
  profileUnsave: string
  profileUnsaveFailed: string
  /** A saved id whose content is no longer visible. */
  profileItemUnavailable: string
  // Save buttons (on the content cards)
  saveItemAdd: string
  saveItemRemove: string
  saveItemFailed: string
}

export const profileEn: ProfileDictionary = {
  profileTitle: 'Profile',
  profileIntro:
    'Your log: weight, meals, workouts, water, sleep, steps, skincare, nails and mood — with streaks, goals, badges and everything you have saved.',
  profileLink: 'Profile',
  profileLoadFailed: 'Your profile could not be loaded.',
  profileSummaryHeading: 'At a glance',
  profileEntriesThisWeek: 'Entries this week',
  profileCurrentStreak: 'Current streak',
  profileLongestStreak: 'Longest streak',
  profileCollection: 'Favourites and saved',
  profileDays: { one: '{n} day', other: '{n} days' },
  profileTodayGoals: "Today's goals",
  profileNoGoal: 'No goal set',
  profileGoalBar: '{value} / {target} {unit}',
  profileQuickAdd: 'Quick add',
  profileKindLabel: 'What',
  profileValueLabel: 'Value',
  profileDateLabel: 'Date',
  profileNoteLabel: 'Note (optional)',
  profileDoneToday: 'Done — just log it for the day.',
  profileAddEntry: 'Add entry',
  profileAddFailed: 'The entry was not saved. Try again.',
  profileFormError: {
    valueRequired: 'Enter a value.',
    valueNotNumber: 'Enter a number.',
    valueOutOfRange: 'That value is outside the expected range.',
    valueNotWhole: 'Enter a whole number.',
    dateInvalid: 'Enter a valid date.',
    dateFuture: 'The date cannot be in the future.',
    noteTooLong: 'Keep the note under 280 characters.',
  },
  profileKind: {
    weight: 'Weight',
    meal: 'Meal',
    workout: 'Workout',
    water: 'Water',
    sleep: 'Sleep',
    steps: 'Steps',
    skincare: 'Skincare',
    nails: 'Nails',
    mood: 'Mood',
  },
  profileUnit: {
    kg: 'kg',
    kcal: 'kcal',
    min: 'min',
    ml: 'ml',
    h: 'h',
    steps: 'steps',
    score: 'out of 5',
  },
  profileGoalUnit: {
    water: 'ml',
    sleep: 'h',
    workout: 'min',
    steps: 'steps',
    weight: 'kg',
    skincare: 'sessions',
  },
  profileWeightTrend: 'Weight trend',
  profileWeightTrendEmpty: 'Log two or more weights in the last 90 days to see a trend.',
  profileWeightTrendSummary: 'Weight from {first} to {last} kg, {delta} kg over {n} readings.',
  profileHistory: 'History',
  profileHistoryEmpty: 'Nothing logged yet. Add your first entry above.',
  profileDelete: 'Delete',
  profileConfirmDelete: 'Sure?',
  profileDeleteFailed: 'The entry was not deleted. Try again.',
  profileGoals: 'Goals',
  profileGoalsIntro: 'Set a target per day or per week. Progress shows on the summary above.',
  profileTarget: 'Target',
  profileCadenceLabel: 'Per',
  profileCadence: { daily: 'day', weekly: 'week' },
  profileSaveGoal: 'Save goal',
  profileGoalSaved: 'Goal saved.',
  profileGoalFailed: 'The goal was not saved. Try again.',
  profileGoalInvalid: 'Enter a target above zero.',
  profileAchievements: 'Achievements',
  profileEarned: 'Earned',
  profileEarnedOn: 'Earned {date}',
  profileProgress: '{pct}% there',
  profileBadge: {
    'first-entry': { name: 'First step', description: 'Log your first entry.' },
    'streak-3': { name: 'Three in a row', description: 'Log something three days running.' },
    'streak-7': { name: 'A full week', description: 'Log something seven days running.' },
    'streak-30': { name: 'A whole month', description: 'Log something thirty days running.' },
    'workouts-10': { name: 'Ten sessions', description: 'Log ten workouts.' },
    'workouts-50': { name: 'Fifty sessions', description: 'Log fifty workouts.' },
    'hydration-week': {
      name: 'Hydration week',
      description: 'Meet your water goal seven days running.',
    },
    'sleep-week': { name: 'Rested week', description: 'Meet your sleep goal seven days running.' },
    'steps-week': { name: 'On the move', description: 'Meet your steps goal seven days running.' },
    'weight-4-weeks': {
      name: 'Steady tracker',
      description: 'Log your weight four weeks running.',
    },
    'skincare-14': { name: 'Glow routine', description: 'Log skincare fourteen days running.' },
    'nails-4-weeks': {
      name: 'Nail care habit',
      description: 'Log a nail routine four weeks running.',
    },
    'mood-7': { name: 'Check-in week', description: 'Log your mood seven days running.' },
    'meals-30': { name: 'Thirty plates', description: 'Log thirty meals.' },
    'collector-10': { name: 'Collector', description: 'Keep ten favourites or saved items.' },
    'all-rounder': { name: 'All-rounder', description: 'Log every kind of entry at least once.' },
  },
  profileSaved: 'Saved',
  profileSavedEmpty: 'Nothing saved yet. Save a workout, routine, tip or diet from its page.',
  profileFavouriteRecipes: 'Favourite recipes',
  profileSavedKind: {
    workout: 'Workouts',
    skincare_routine: 'Skincare routines',
    health_tip: 'Health tips',
    skincare_tip: 'Skincare tips',
    diet: 'Diets',
  },
  profileUnsave: 'Unsave',
  profileUnsaveFailed: 'Could not remove it. Try again.',
  profileItemUnavailable: 'No longer available',
  saveItemAdd: 'Save',
  saveItemRemove: 'Saved — remove',
  saveItemFailed: 'Could not save. Try again.',
}

export const profileEl: ProfileDictionary = {
  profileTitle: 'Προφίλ',
  profileIntro:
    'Το ημερολόγιό σου: βάρος, γεύματα, προπονήσεις, νερό, ύπνος, βήματα, περιποίηση δέρματος, νύχια και διάθεση — με σερί, στόχους, παράσημα και ό,τι έχεις αποθηκεύσει.',
  profileLink: 'Προφίλ',
  profileLoadFailed: 'Το προφίλ σου δεν φορτώθηκε.',
  profileSummaryHeading: 'Με μια ματιά',
  profileEntriesThisWeek: 'Καταχωρίσεις αυτή την εβδομάδα',
  profileCurrentStreak: 'Τρέχον σερί',
  profileLongestStreak: 'Μεγαλύτερο σερί',
  profileCollection: 'Αγαπημένα και αποθηκευμένα',
  profileDays: { one: '{n} ημέρα', other: '{n} ημέρες' },
  profileTodayGoals: 'Οι στόχοι της ημέρας',
  profileNoGoal: 'Δεν έχει οριστεί στόχος',
  profileGoalBar: '{value} από {target} {unit}',
  profileQuickAdd: 'Γρήγορη καταχώριση',
  profileKindLabel: 'Τι',
  profileValueLabel: 'Τιμή',
  profileDateLabel: 'Ημερομηνία',
  profileNoteLabel: 'Σημείωση (προαιρετικά)',
  profileDoneToday: 'Έγινε — απλώς καταχώρισέ το για τη μέρα.',
  profileAddEntry: 'Προσθήκη',
  profileAddFailed: 'Η καταχώριση δεν αποθηκεύτηκε. Δοκίμασε ξανά.',
  profileFormError: {
    valueRequired: 'Συμπλήρωσε μια τιμή.',
    valueNotNumber: 'Συμπλήρωσε έναν αριθμό.',
    valueOutOfRange: 'Η τιμή είναι εκτός του αναμενόμενου εύρους.',
    valueNotWhole: 'Συμπλήρωσε ακέραιο αριθμό.',
    dateInvalid: 'Συμπλήρωσε έγκυρη ημερομηνία.',
    dateFuture: 'Η ημερομηνία δεν μπορεί να είναι στο μέλλον.',
    noteTooLong: 'Κράτησε τη σημείωση κάτω από 280 χαρακτήρες.',
  },
  profileKind: {
    weight: 'Βάρος',
    meal: 'Γεύμα',
    workout: 'Προπόνηση',
    water: 'Νερό',
    sleep: 'Ύπνος',
    steps: 'Βήματα',
    skincare: 'Περιποίηση δέρματος',
    nails: 'Νύχια',
    mood: 'Διάθεση',
  },
  profileUnit: {
    kg: 'κιλά',
    kcal: 'kcal',
    min: 'λεπτά',
    ml: 'ml',
    h: 'ώρες',
    steps: 'βήματα',
    score: 'στα 5',
  },
  profileGoalUnit: {
    water: 'ml',
    sleep: 'ώρες',
    workout: 'λεπτά',
    steps: 'βήματα',
    weight: 'κιλά',
    skincare: 'φορές',
  },
  profileWeightTrend: 'Πορεία βάρους',
  profileWeightTrendEmpty:
    'Καταχώρισε δύο ή περισσότερες μετρήσεις βάρους τις τελευταίες 90 ημέρες για να δεις την πορεία.',
  profileWeightTrendSummary: 'Βάρος από {first} σε {last} κιλά, {delta} κιλά σε {n} μετρήσεις.',
  profileHistory: 'Ιστορικό',
  profileHistoryEmpty:
    'Δεν έχεις καταχωρίσει τίποτα ακόμη. Πρόσθεσε την πρώτη σου καταχώριση παραπάνω.',
  profileDelete: 'Διαγραφή',
  profileConfirmDelete: 'Σίγουρα;',
  profileDeleteFailed: 'Η καταχώριση δεν διαγράφηκε. Δοκίμασε ξανά.',
  profileGoals: 'Στόχοι',
  profileGoalsIntro:
    'Όρισε έναν στόχο ανά ημέρα ή ανά εβδομάδα. Η πρόοδος φαίνεται στη σύνοψη παραπάνω.',
  profileTarget: 'Στόχος',
  profileCadenceLabel: 'Ανά',
  profileCadence: { daily: 'ημέρα', weekly: 'εβδομάδα' },
  profileSaveGoal: 'Αποθήκευση στόχου',
  profileGoalSaved: 'Ο στόχος αποθηκεύτηκε.',
  profileGoalFailed: 'Ο στόχος δεν αποθηκεύτηκε. Δοκίμασε ξανά.',
  profileGoalInvalid: 'Συμπλήρωσε στόχο μεγαλύτερο από μηδέν.',
  profileAchievements: 'Επιτεύγματα',
  profileEarned: 'Κερδήθηκε',
  profileEarnedOn: 'Κερδήθηκε {date}',
  profileProgress: '{pct}% του δρόμου',
  profileBadge: {
    'first-entry': { name: 'Πρώτο βήμα', description: 'Κάνε την πρώτη σου καταχώριση.' },
    'streak-3': {
      name: 'Τρεις στη σειρά',
      description: 'Καταχώρισε κάτι τρεις συνεχόμενες ημέρες.',
    },
    'streak-7': {
      name: 'Μια ολόκληρη εβδομάδα',
      description: 'Καταχώρισε κάτι επτά συνεχόμενες ημέρες.',
    },
    'streak-30': {
      name: 'Ένας ολόκληρος μήνας',
      description: 'Καταχώρισε κάτι τριάντα συνεχόμενες ημέρες.',
    },
    'workouts-10': { name: 'Δέκα προπονήσεις', description: 'Καταχώρισε δέκα προπονήσεις.' },
    'workouts-50': { name: 'Πενήντα προπονήσεις', description: 'Καταχώρισε πενήντα προπονήσεις.' },
    'hydration-week': {
      name: 'Εβδομάδα ενυδάτωσης',
      description: 'Πέτυχε τον στόχο νερού επτά συνεχόμενες ημέρες.',
    },
    'sleep-week': {
      name: 'Εβδομάδα ξεκούρασης',
      description: 'Πέτυχε τον στόχο ύπνου επτά συνεχόμενες ημέρες.',
    },
    'steps-week': {
      name: 'Σε κίνηση',
      description: 'Πέτυχε τον στόχο βημάτων επτά συνεχόμενες ημέρες.',
    },
    'weight-4-weeks': {
      name: 'Σταθερή παρακολούθηση',
      description: 'Καταχώρισε το βάρος σου τέσσερις συνεχόμενες εβδομάδες.',
    },
    'skincare-14': {
      name: 'Ρουτίνα λάμψης',
      description: 'Καταχώρισε περιποίηση δέρματος δεκατέσσερις συνεχόμενες ημέρες.',
    },
    'nails-4-weeks': {
      name: 'Συνήθεια νυχιών',
      description: 'Καταχώρισε ρουτίνα νυχιών τέσσερις συνεχόμενες εβδομάδες.',
    },
    'mood-7': {
      name: 'Εβδομάδα αυτοπαρατήρησης',
      description: 'Καταχώρισε τη διάθεσή σου επτά συνεχόμενες ημέρες.',
    },
    'meals-30': { name: 'Τριάντα πιάτα', description: 'Καταχώρισε τριάντα γεύματα.' },
    'collector-10': { name: 'Συλλέκτης', description: 'Κράτησε δέκα αγαπημένα ή αποθηκευμένα.' },
    'all-rounder': {
      name: 'Παντός καιρού',
      description: 'Καταχώρισε κάθε είδος τουλάχιστον μία φορά.',
    },
  },
  profileSaved: 'Αποθηκευμένα',
  profileSavedEmpty:
    'Δεν έχεις αποθηκεύσει τίποτα ακόμη. Αποθήκευσε μια προπόνηση, ρουτίνα, συμβουλή ή δίαιτα από τη σελίδα της.',
  profileFavouriteRecipes: 'Αγαπημένες συνταγές',
  profileSavedKind: {
    workout: 'Προπονήσεις',
    skincare_routine: 'Ρουτίνες περιποίησης',
    health_tip: 'Συμβουλές υγείας',
    skincare_tip: 'Συμβουλές περιποίησης',
    diet: 'Δίαιτες',
  },
  profileUnsave: 'Αφαίρεση από τα αποθηκευμένα',
  profileUnsaveFailed: 'Δεν αφαιρέθηκε. Δοκίμασε ξανά.',
  profileItemUnavailable: 'Δεν είναι πλέον διαθέσιμο',
  saveItemAdd: 'Αποθήκευση',
  saveItemRemove: 'Αποθηκεύτηκε — αφαίρεση',
  saveItemFailed: 'Δεν αποθηκεύτηκε. Δοκίμασε ξανά.',
}
