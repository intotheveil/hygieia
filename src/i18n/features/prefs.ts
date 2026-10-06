// PREFERENCES + "OF THE DAY" DICTIONARY (2026-10-06, first-visit onboarding) — every string the
// onboarding card and the recipe / tip of the day cards show, in both languages (ADR-0002 at
// feature scale). The preference highlights on other pages are copy of THOSE pages, owned by their
// features: `dietsYourDiet` (diets), `tasksSuggested` (tasks), `skincareGoal*` (skincare).
//
// ROUTE FEATURE: not composed into the app dictionary every page gets from `useLang()`. The home
// page's cards are a lazy chunk (src/home/HomeExtras.tsx, loaded after the hero has painted) that
// calls `useLang(prefsCopy)`, so these strings never ship in the eager chunk. The one eager
// string — the footer's "Change preferences" link — is `changePrefs` in the base dictionary
// (../app.ts).
//
// Reused from their owners, never re-declared: `loadFailed` / `retry` (plans), `topics` (tips),
// `minutes` (recipes).

import type { ActivityLevel, Goal, PrefDiet } from '../../prefs/prefs.ts'
import type { FeatureCopy } from '../app.ts'

export interface PrefsDictionary {
  prefsTitle: string
  prefsLead: string
  prefsGoalLabel: string
  prefsGoals: Record<Goal, string>
  prefsDietLabel: string
  prefsDiets: Record<PrefDiet, string>
  /** The diet question's "none" option. */
  prefsNoDiet: string
  prefsActivityLabel: string
  prefsActivities: Record<ActivityLevel, string>
  /** The goal / activity questions' empty option. */
  prefsNoAnswer: string
  prefsSave: string
  prefsSkip: string
  /** Replaces "Skip" when the card was opened to CHANGE saved preferences. */
  prefsCancel: string
  /** `aria-label` of the home's "of the day" section. */
  ofTheDayLabel: string
  recipeOfTheDay: string
  tipOfTheDay: string
  recipeOfTheDayOpen: string
  /** Link to /tips?topic=…; `{topic}` = the topic name. */
  tipOfTheDayMore: string
  /** Shown when there is nothing to pick (an empty list, or no recipe for the chosen diet). */
  ofTheDayNone: string
}

export const prefsEn: PrefsDictionary = {
  prefsTitle: 'Make Hygieia yours',
  prefsLead:
    'Three quick questions, all optional. Your answers stay on this device and set where recipes, diets and workouts start.',
  prefsGoalLabel: 'Your main goal',
  prefsGoals: {
    'eat-healthier': 'Eat healthier',
    'lose-weight': 'Lose weight',
    'build-strength': 'Build strength',
    'feel-calmer': 'Feel calmer',
    skin: 'Look after my skin',
  },
  prefsDietLabel: 'How you eat',
  prefsDiets: {
    mediterranean: 'Mediterranean',
    vegetarian: 'Vegetarian',
    vegan: 'Vegan',
    keto: 'Keto',
    'low-carb': 'Low-carb',
  },
  prefsNoDiet: 'No particular diet',
  prefsActivityLabel: 'How active you are',
  prefsActivities: {
    low: 'Not very active',
    moderate: 'Moderately active',
    high: 'Very active',
  },
  prefsNoAnswer: 'No preference',
  prefsSave: 'Save preferences',
  prefsSkip: 'Skip',
  prefsCancel: 'Cancel',
  ofTheDayLabel: "Today's picks",
  recipeOfTheDay: 'Recipe of the day',
  tipOfTheDay: 'Tip of the day',
  recipeOfTheDayOpen: 'Open the recipe',
  tipOfTheDayMore: 'More tips: {topic}',
  ofTheDayNone: 'Nothing to pick today.',
}

export const prefsEl: PrefsDictionary = {
  prefsTitle: 'Προσάρμοσε την Υγίεια σε σένα',
  prefsLead:
    'Τρεις γρήγορες ερωτήσεις, όλες προαιρετικές. Οι απαντήσεις μένουν σε αυτή τη συσκευή και ορίζουν από πού ξεκινούν οι συνταγές, οι διατροφές και οι προπονήσεις.',
  prefsGoalLabel: 'Ο κύριος στόχος σου',
  prefsGoals: {
    'eat-healthier': 'Να τρώω πιο υγιεινά',
    'lose-weight': 'Να χάσω βάρος',
    'build-strength': 'Να δυναμώσω',
    'feel-calmer': 'Να νιώθω πιο ήρεμα',
    skin: 'Να φροντίζω την επιδερμίδα μου',
  },
  prefsDietLabel: 'Πώς τρως',
  prefsDiets: {
    mediterranean: 'Μεσογειακή',
    vegetarian: 'Χορτοφαγική',
    vegan: 'Vegan (αυστηρή χορτοφαγία)',
    keto: 'Κετογονική (keto)',
    'low-carb': 'Χαμηλών υδατανθράκων',
  },
  prefsNoDiet: 'Καμία συγκεκριμένη διατροφή',
  prefsActivityLabel: 'Πόση κίνηση κάνεις',
  prefsActivities: {
    low: 'Λίγη κίνηση',
    moderate: 'Μέτρια κίνηση',
    high: 'Πολλή κίνηση',
  },
  prefsNoAnswer: 'Χωρίς προτίμηση',
  prefsSave: 'Αποθήκευση προτιμήσεων',
  prefsSkip: 'Παράλειψη',
  prefsCancel: 'Ακύρωση',
  ofTheDayLabel: 'Οι σημερινές επιλογές',
  recipeOfTheDay: 'Συνταγή της ημέρας',
  tipOfTheDay: 'Συμβουλή της ημέρας',
  recipeOfTheDayOpen: 'Δες τη συνταγή',
  tipOfTheDayMore: 'Περισσότερες συμβουλές: {topic}',
  ofTheDayNone: 'Καμία επιλογή για σήμερα.',
}

/** Both literals, for `useLang(prefsCopy)` in the home page's lazy extras. */
export const prefsCopy: FeatureCopy<PrefsDictionary> = { el: prefsEl, en: prefsEn }
