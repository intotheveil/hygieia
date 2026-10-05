// PLANS DICTIONARY (P4.6): the weekly meal-plan view and the account page's saved-items tabs.
// `savedPlans`, `savedFridgeLists`, `favourites`, `nothingSavedYet`, `remove`, `loading` already
// live in the base dictionary (P2.5) and are NOT redefined here. Macro labels are namespaced
// under `planMacros` so they cannot collide with the recipe nutrition panel's keys (P4.3).

import type { PlanMeal } from '../../plans/generate.ts'

/** Monday first, matching `DayPlan.index` when the plan is pinned to a Monday `weekStart`. */
export type DayNames = readonly [string, string, string, string, string, string, string]

export interface PlansDictionary {
  generatePlan: string
  generatePlanIntro: string
  reshuffle: string
  savePlan: string
  saving: string
  planSaved: string
  saveFailed: string
  shoppingList: string
  dailyTotal: string
  dayNames: DayNames
  mealNames: Record<PlanMeal, string>
  planMacros: { kcal: string; protein: string; carbs: string; fat: string }
  planWarningNoRecipe: string
  planWarningSmallPool: string
  planEmptySlot: string
  weekOf: string
  open: string
  loadFailed: string
  retry: string
  removeFailed: string
  itemCount: string
}

export const plansEn: PlansDictionary = {
  generatePlan: 'Generate a weekly plan',
  generatePlanIntro:
    'Seven days of breakfast, lunch and dinner drawn from the recipes tagged with this diet, one portion per meal, with a shopping list for the week. Reshuffle until it suits you.',
  reshuffle: 'Reshuffle',
  savePlan: 'Save plan',
  saving: 'Saving…',
  planSaved: 'Plan saved. Find it under Account.',
  saveFailed: 'The plan could not be saved. Try again.',
  shoppingList: 'Shopping list',
  dailyTotal: 'Daily total',
  dayNames: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
  mealNames: { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner' },
  planMacros: { kcal: 'kcal', protein: 'protein', carbs: 'carbs', fat: 'fat' },
  planWarningNoRecipe: 'No recipe tagged with this diet is marked as',
  planWarningSmallPool: 'Few recipes for this meal, so some repeat within the week:',
  planEmptySlot: 'No recipe',
  weekOf: 'Week of',
  open: 'Open',
  loadFailed: 'Could not load. Check your connection and try again.',
  retry: 'Try again',
  removeFailed: 'Could not remove it. Try again.',
  itemCount: 'items',
}

export const plansEl: PlansDictionary = {
  generatePlan: 'Δημιούργησε εβδομαδιαίο πλάνο',
  generatePlanIntro:
    'Επτά ημέρες με πρωινό, μεσημεριανό και βραδινό από τις συνταγές αυτής της δίαιτας, μία μερίδα ανά γεύμα, με λίστα αγορών για την εβδομάδα. Ανακάτεψε μέχρι να σου ταιριάζει.',
  reshuffle: 'Ανακάτεμα',
  savePlan: 'Αποθήκευση πλάνου',
  saving: 'Αποθήκευση…',
  planSaved: 'Το πλάνο αποθηκεύτηκε. Θα το βρεις στον Λογαριασμό.',
  saveFailed: 'Το πλάνο δεν αποθηκεύτηκε. Δοκίμασε ξανά.',
  shoppingList: 'Λίστα αγορών',
  dailyTotal: 'Ημερήσιο σύνολο',
  dayNames: ['Δευτέρα', 'Τρίτη', 'Τετάρτη', 'Πέμπτη', 'Παρασκευή', 'Σάββατο', 'Κυριακή'],
  mealNames: { breakfast: 'Πρωινό', lunch: 'Μεσημεριανό', dinner: 'Βραδινό' },
  planMacros: { kcal: 'kcal', protein: 'πρωτεΐνη', carbs: 'υδατάνθρακες', fat: 'λίπος' },
  planWarningNoRecipe: 'Καμία συνταγή αυτής της δίαιτας δεν είναι σημειωμένη ως',
  planWarningSmallPool:
    'Λίγες συνταγές για αυτό το γεύμα, οπότε κάποιες επαναλαμβάνονται μέσα στην εβδομάδα:',
  planEmptySlot: 'Χωρίς συνταγή',
  weekOf: 'Εβδομάδα της',
  open: 'Άνοιγμα',
  loadFailed: 'Δεν ήταν δυνατή η φόρτωση. Έλεγξε τη σύνδεσή σου και δοκίμασε ξανά.',
  retry: 'Δοκίμασε ξανά',
  removeFailed: 'Δεν ήταν δυνατή η αφαίρεση. Δοκίμασε ξανά.',
  itemCount: 'υλικά',
}
