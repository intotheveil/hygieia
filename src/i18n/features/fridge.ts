// FRIDGE DICTIONARY (P3.4) — every string the `/fridge` page shows, in both languages (ADR-0002).
// Templates use `{name}` tokens filled by `src/i18n/fill.ts`. Composed into the app `Dictionary`
// through ./index.ts; never imported by a page directly (pages read `useLang().t`).

export interface FridgeDictionary {
  fridgeTitle: string
  fridgeIntro: string
  addIngredient: string
  searchIngredientsPlaceholder: string
  yourIngredients: string
  removeIngredient: string
  ignoreStaples: string
  ignoreStaplesHint: string
  /** `{have}/{total}` */
  youHave: string
  missing: string
  /** `{missing} → {use}` */
  substitute: string
  coverage: string
  fridgeEmpty: string
  fridgeEmptyHint: string
  noMatches: string
  fridgeLoadFailed: string
  saveList: string
  listName: string
  listSaved: string
  listSaveFailed: string
  savedLists: string
  loadList: string
  /** `{n}` */
  matchesCount: string
  clearAll: string
}

export const fridgeEn: FridgeDictionary = {
  fridgeTitle: 'What is in my fridge?',
  fridgeIntro:
    'List the ingredients you already have and see which recipes you can cook right now, ranked by how much of each one you have.',
  addIngredient: 'Add an ingredient',
  searchIngredientsPlaceholder: 'Type a name, e.g. tomato or ντομάτα',
  yourIngredients: 'Your ingredients',
  removeIngredient: 'Remove',
  ignoreStaples: 'Ignore pantry staples',
  ignoreStaplesHint:
    'Salt, oil, pepper and other staples are assumed to be in the cupboard and do not count as missing.',
  youHave: 'You have {have}/{total}',
  missing: 'Missing',
  substitute: '{missing} → use {use}',
  coverage: 'Coverage',
  fridgeEmpty: 'Your fridge is empty.',
  fridgeEmptyHint: 'Add a few ingredients above and the recipes you can make will appear here.',
  noMatches: 'No recipe uses these ingredients yet. Try adding a few more.',
  fridgeLoadFailed: 'The recipes could not be loaded. Check your connection and try again.',
  saveList: 'Save list',
  listName: 'List name',
  listSaved: 'List saved.',
  listSaveFailed: 'The list could not be saved. Try again.',
  savedLists: 'Saved lists',
  loadList: 'Load',
  matchesCount: '{n} recipes match',
  clearAll: 'Clear all',
}

export const fridgeEl: FridgeDictionary = {
  fridgeTitle: 'Τι έχω στο ψυγείο;',
  fridgeIntro:
    'Γράψε τα υλικά που ήδη έχεις και δες ποιες συνταγές μπορείς να μαγειρέψεις τώρα, ταξινομημένες ανάλογα με το πόσα από τα υλικά τους έχεις.',
  addIngredient: 'Πρόσθεσε υλικό',
  searchIngredientsPlaceholder: 'Γράψε ένα όνομα, π.χ. ντομάτα ή tomato',
  yourIngredients: 'Τα υλικά σου',
  removeIngredient: 'Αφαίρεση',
  ignoreStaples: 'Αγνόησε τα βασικά του ντουλαπιού',
  ignoreStaplesHint:
    'Αλάτι, λάδι, πιπέρι και άλλα βασικά θεωρούνται ότι υπάρχουν στο ντουλάπι και δεν μετρούν ως ελλείψεις.',
  youHave: 'Έχεις {have}/{total}',
  missing: 'Λείπουν',
  substitute: '{missing} → βάλε {use}',
  coverage: 'Κάλυψη',
  fridgeEmpty: 'Το ψυγείο σου είναι άδειο.',
  fridgeEmptyHint:
    'Πρόσθεσε μερικά υλικά παραπάνω και εδώ θα εμφανιστούν οι συνταγές που βγαίνουν.',
  noMatches: 'Καμία συνταγή δεν χρησιμοποιεί αυτά τα υλικά ακόμη. Δοκίμασε να προσθέσεις κι άλλα.',
  fridgeLoadFailed: 'Οι συνταγές δεν φορτώθηκαν. Έλεγξε τη σύνδεσή σου και δοκίμασε ξανά.',
  saveList: 'Αποθήκευση λίστας',
  listName: 'Όνομα λίστας',
  listSaved: 'Η λίστα αποθηκεύτηκε.',
  listSaveFailed: 'Η λίστα δεν αποθηκεύτηκε. Δοκίμασε ξανά.',
  savedLists: 'Αποθηκευμένες λίστες',
  loadList: 'Φόρτωση',
  matchesCount: '{n} συνταγές ταιριάζουν',
  clearAll: 'Καθάρισμα όλων',
}
