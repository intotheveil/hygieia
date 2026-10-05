// RECIPES DICTIONARY (P3.1 list + P3.2 detail). One interface, two literals that must both satisfy
// it (ADR-0002 at feature scale); composed into the app `Dictionary` by ./index.ts. Counted
// strings are `PluralForms` (`{n}` filled by `src/i18n/fill.ts`); unit labels are keyed by `Unit`
// and meal labels by `MealType`, so a new enum literal is a type error here, not a blank chip.
// Loanwords stay Latin-script in Greek (PLAN.md §0).

import type { MealType, Unit } from '../../content/enums.ts'
import type { PluralForms } from '../fill.ts'

export interface RecipesDictionary {
  recipesTitle: string
  recipesIntro: string
  filterByDiet: string
  filterByMeal: string
  searchRecipes: string
  resultsCount: PluralForms
  noRecipesMatch: string
  clearFilters: string
  portions: PluralForms
  minutes: PluralForms
  loadFailed: string
  retry: string
  ingredients: string
  steps: string
  dietTags: string
  mealTypes: string
  addToFavourites: string
  removeFromFavourites: string
  favouriteFailed: string
  units: Record<Unit, PluralForms>
  meals: Record<MealType, string>
}

export const recipesEn: RecipesDictionary = {
  recipesTitle: 'Recipes',
  recipesIntro: 'Recipes tagged by diet. Narrow by diet or meal, or search by title.',
  filterByDiet: 'Filter by diet',
  filterByMeal: 'Filter by meal',
  searchRecipes: 'Search recipes by title',
  resultsCount: { one: '{n} recipe', other: '{n} recipes' },
  noRecipesMatch: 'No recipes match these filters.',
  clearFilters: 'Clear filters',
  portions: { one: '{n} portion', other: '{n} portions' },
  minutes: { one: '{n} min', other: '{n} min' },
  loadFailed: 'The recipes could not be loaded.',
  retry: 'Try again',
  ingredients: 'Ingredients',
  steps: 'Method',
  dietTags: 'Diets',
  mealTypes: 'Meal',
  addToFavourites: 'Add to favourites',
  removeFromFavourites: 'Remove from favourites',
  favouriteFailed: 'The change to your favourites could not be saved. Try again.',
  units: {
    g: { one: 'g', other: 'g' },
    ml: { one: 'ml', other: 'ml' },
    piece: { one: 'piece', other: 'pieces' },
    tbsp: { one: 'tbsp', other: 'tbsp' },
    tsp: { one: 'tsp', other: 'tsp' },
    slice: { one: 'slice', other: 'slices' },
    clove: { one: 'clove', other: 'cloves' },
    bunch: { one: 'bunch', other: 'bunches' },
  },
  meals: {
    breakfast: 'Breakfast',
    lunch: 'Lunch',
    dinner: 'Dinner',
    snack: 'Snack',
  },
}

export const recipesEl: RecipesDictionary = {
  recipesTitle: 'Συνταγές',
  recipesIntro:
    'Συνταγές με ετικέτες ανά δίαιτα. Περιόρισε ανά δίαιτα ή γεύμα, ή αναζήτησε με τον τίτλο.',
  filterByDiet: 'Φίλτρο ανά δίαιτα',
  filterByMeal: 'Φίλτρο ανά γεύμα',
  searchRecipes: 'Αναζήτηση συνταγών με τίτλο',
  resultsCount: { one: '{n} συνταγή', other: '{n} συνταγές' },
  noRecipesMatch: 'Καμία συνταγή δεν ταιριάζει με αυτά τα φίλτρα.',
  clearFilters: 'Καθαρισμός φίλτρων',
  portions: { one: '{n} μερίδα', other: '{n} μερίδες' },
  minutes: { one: '{n} λεπτό', other: '{n} λεπτά' },
  loadFailed: 'Οι συνταγές δεν φορτώθηκαν.',
  retry: 'Δοκίμασε ξανά',
  ingredients: 'Υλικά',
  steps: 'Εκτέλεση',
  dietTags: 'Δίαιτες',
  mealTypes: 'Γεύμα',
  addToFavourites: 'Προσθήκη στα αγαπημένα',
  removeFromFavourites: 'Αφαίρεση από τα αγαπημένα',
  favouriteFailed: 'Η αλλαγή στα αγαπημένα δεν αποθηκεύτηκε. Δοκίμασε ξανά.',
  units: {
    g: { one: 'γρ.', other: 'γρ.' },
    ml: { one: 'ml', other: 'ml' },
    piece: { one: 'τεμάχιο', other: 'τεμάχια' },
    tbsp: { one: 'κ.σ.', other: 'κ.σ.' },
    tsp: { one: 'κ.γ.', other: 'κ.γ.' },
    slice: { one: 'φέτα', other: 'φέτες' },
    clove: { one: 'σκελίδα', other: 'σκελίδες' },
    bunch: { one: 'ματσάκι', other: 'ματσάκια' },
  },
  meals: {
    breakfast: 'Πρωινό',
    lunch: 'Μεσημεριανό',
    dinner: 'Βραδινό',
    snack: 'Σνακ',
  },
}
