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
  ingredients: string
  steps: string
  dietTags: string
  mealTypes: string
  addToFavourites: string
  removeFromFavourites: string
  favouriteFailed: string
  // Nutrition + cost panels (P4.3). `{min}`/`{max}`/`{date}`/`{items}` and the three macro
  // percentages are filled by `src/i18n/fill.ts`.
  nutritionTitle: string
  costTitle: string
  kcal: string
  protein: string
  carbs: string
  fat: string
  perPortion: string
  perRecipe: string
  typicalValuesNote: string
  notCounted: string
  confidenceTypical: string
  costRange: string
  pricesAsOf: string
  unpriced: string
  priceBasisNote: string
  macroBarLabel: string
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
  ingredients: 'Ingredients',
  steps: 'Method',
  dietTags: 'Diets',
  mealTypes: 'Meal',
  addToFavourites: 'Add to favourites',
  removeFromFavourites: 'Remove from favourites',
  favouriteFailed: 'The change to your favourites could not be saved. Try again.',
  nutritionTitle: 'Nutrition',
  costTitle: 'Estimated cost',
  kcal: 'kcal',
  protein: 'Protein',
  carbs: 'Carbs',
  fat: 'Fat',
  perPortion: 'Per portion',
  perRecipe: 'Per recipe',
  typicalValuesNote:
    'Typical values from USDA FoodData Central reference ranges; actual figures vary with brand, ripeness and cooking.',
  notCounted: 'Not counted (no nutrition data): {items}',
  confidenceTypical: 'Confidence: typical values',
  costRange: 'About {min}–{max}',
  pricesAsOf: 'Prices as of {date}',
  unpriced: 'Not priced: {items}',
  priceBasisNote: 'Typical Greek supermarket range; prices vary by shop, season and brand.',
  macroBarLabel: 'Energy split: {protein}% protein, {carbs}% carbs, {fat}% fat',
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
  ingredients: 'Υλικά',
  steps: 'Εκτέλεση',
  dietTags: 'Δίαιτες',
  mealTypes: 'Γεύμα',
  addToFavourites: 'Προσθήκη στα αγαπημένα',
  removeFromFavourites: 'Αφαίρεση από τα αγαπημένα',
  favouriteFailed: 'Η αλλαγή στα αγαπημένα δεν αποθηκεύτηκε. Δοκίμασε ξανά.',
  nutritionTitle: 'Διατροφική αξία',
  costTitle: 'Εκτιμώμενο κόστος',
  kcal: 'kcal',
  protein: 'Πρωτεΐνη',
  carbs: 'Υδατάνθρακες',
  fat: 'Λίπος',
  perPortion: 'Ανά μερίδα',
  perRecipe: 'Ανά συνταγή',
  typicalValuesNote:
    'Τυπικές τιμές από τα εύρη αναφοράς του USDA FoodData Central· τα πραγματικά νούμερα διαφέρουν ανάλογα με τη μάρκα, την ωρίμανση και το μαγείρεμα.',
  notCounted: 'Δεν υπολογίστηκαν (χωρίς διατροφικά δεδομένα): {items}',
  confidenceTypical: 'Αξιοπιστία: τυπικές τιμές',
  costRange: 'Περίπου {min}–{max}',
  pricesAsOf: 'Τιμές με ημερομηνία {date}',
  unpriced: 'Χωρίς τιμή: {items}',
  priceBasisNote:
    'Τυπικό εύρος ελληνικού σούπερ μάρκετ· οι τιμές διαφέρουν ανά κατάστημα, εποχή και μάρκα.',
  macroBarLabel: 'Κατανομή ενέργειας: {protein}% πρωτεΐνη, {carbs}% υδατάνθρακες, {fat}% λίπος',
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
