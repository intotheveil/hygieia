// ADMIN DICTIONARY (P4.10 review page + P4.11 price table). One interface, two literals that must
// both satisfy it (ADR-0002 at feature scale); part of the full `Dictionary` (./index.ts).
// `adminTitle` and the 403 copy (`notAllowedTitle` / `notAllowedBody`) already live in the base
// dictionary (P2.5) and are reused, not redefined. Content kinds are keyed by `ContentTable`, so a
// new content table is a type error here, not an unlabelled tab.
//
// ROUTE FEATURE (perf, 2026-10-06): read only by `/admin`, so it is NOT composed into the
// dictionary every page gets from `useLang()` — the route's components call `useLang(adminCopy)`
// and these strings ship in that route's lazy chunk (./routeFeatures.ts).

import type { ContentTable } from '../../content/enums.ts'
import type { FeatureCopy } from '../app.ts'

export interface AdminDictionary {
  adminIntro: string
  adminUnavailable: string
  sideBySideHint: string
  pendingTab: string
  approvedTab: string
  rejectedTab: string
  kinds: Record<ContentTable, string>
  noPending: string
  noRowsForStatus: string
  adminLoadFailed: string
  backToList: string
  approve: string
  reject: string
  saveChanges: string
  adminSaved: string
  adminSaveFailed: string
  reviewedBy: string
  reviewedAt: string
  notReviewedYet: string
  addLine: string
  removeLine: string
  lineNumber: string
  prices: string
  priceMin: string
  priceMax: string
  pricePer: string
  asOf: string
  priceNote: string
  priceMinMaxError: string
  priceNumberError: string
  editRow: string
  cancel: string
}

export const adminEn: AdminDictionary = {
  adminIntro:
    'Content arrives as a draft and is shown to visitors only once a reviewer approves it. Pick a kind, open a row, check both languages, then approve, correct or reject.',
  adminUnavailable:
    'Reviewing needs the content service. This copy of the app runs without one, so there is nothing to review here.',
  sideBySideHint:
    'Greek on the left, English on the right. Lists keep the same number of lines in both.',
  pendingTab: 'Pending',
  approvedTab: 'Approved',
  rejectedTab: 'Rejected',
  kinds: {
    ingredients: 'Ingredients',
    diets: 'Diets',
    recipes: 'Recipes',
    exercises: 'Exercises',
    workout_templates: 'Workout templates',
    health_tips: 'Health tips',
    skincare_product_types: 'Skincare product types',
    skincare_routines: 'Skincare routines',
    skincare_tips: 'Skincare tips',
  },
  noPending: 'Nothing is waiting for review.',
  noRowsForStatus: 'No rows with this status.',
  adminLoadFailed: 'The content could not be loaded. Check your connection and try again.',
  backToList: 'Back to the list',
  approve: 'Approve',
  reject: 'Reject',
  saveChanges: 'Save changes',
  adminSaved: 'Saved.',
  adminSaveFailed: 'The change could not be saved. Try again.',
  reviewedBy: 'Reviewed by',
  reviewedAt: 'Reviewed at',
  notReviewedYet: 'Not reviewed yet.',
  addLine: 'Add line',
  removeLine: 'Remove line',
  lineNumber: 'Line',
  prices: 'Prices',
  priceMin: 'Min (€)',
  priceMax: 'Max (€)',
  pricePer: 'Per',
  asOf: 'As of',
  priceNote: 'Price note',
  priceMinMaxError: 'The minimum price cannot be higher than the maximum.',
  priceNumberError: 'Enter a price of zero or more.',
  editRow: 'Edit',
  cancel: 'Cancel',
}

export const adminEl: AdminDictionary = {
  adminIntro:
    'Το περιεχόμενο φτάνει ως πρόχειρο και εμφανίζεται στους επισκέπτες μόνο αφού το εγκρίνει ελεγκτής. Διάλεξε είδος, άνοιξε μια εγγραφή, έλεγξε και τις δύο γλώσσες και μετά ενέκρινε, διόρθωσε ή απόρριψε.',
  adminUnavailable:
    'Ο έλεγχος χρειάζεται την υπηρεσία περιεχομένου. Αυτό το αντίγραφο της εφαρμογής τρέχει χωρίς αυτήν, οπότε δεν υπάρχει κάτι για έλεγχο εδώ.',
  sideBySideHint:
    'Ελληνικά αριστερά, αγγλικά δεξιά. Οι λίστες κρατούν τον ίδιο αριθμό γραμμών και στις δύο γλώσσες.',
  pendingTab: 'Σε εκκρεμότητα',
  approvedTab: 'Εγκεκριμένα',
  rejectedTab: 'Απορριφθέντα',
  kinds: {
    ingredients: 'Υλικά',
    diets: 'Δίαιτες',
    recipes: 'Συνταγές',
    exercises: 'Ασκήσεις',
    workout_templates: 'Πρότυπα προπόνησης',
    health_tips: 'Συμβουλές υγείας',
    skincare_product_types: 'Τύποι προϊόντων περιποίησης',
    skincare_routines: 'Ρουτίνες περιποίησης',
    skincare_tips: 'Συμβουλές περιποίησης',
  },
  noPending: 'Δεν εκκρεμεί τίποτα για έλεγχο.',
  noRowsForStatus: 'Καμία εγγραφή με αυτή την κατάσταση.',
  adminLoadFailed: 'Το περιεχόμενο δεν φορτώθηκε. Έλεγξε τη σύνδεσή σου και δοκίμασε ξανά.',
  backToList: 'Πίσω στη λίστα',
  approve: 'Έγκριση',
  reject: 'Απόρριψη',
  saveChanges: 'Αποθήκευση αλλαγών',
  adminSaved: 'Αποθηκεύτηκε.',
  adminSaveFailed: 'Η αλλαγή δεν αποθηκεύτηκε. Δοκίμασε ξανά.',
  reviewedBy: 'Ελέγχθηκε από',
  reviewedAt: 'Ελέγχθηκε στις',
  notReviewedYet: 'Δεν έχει ελεγχθεί ακόμη.',
  addLine: 'Προσθήκη γραμμής',
  removeLine: 'Αφαίρεση γραμμής',
  lineNumber: 'Γραμμή',
  prices: 'Τιμές',
  priceMin: 'Ελάχ. (€)',
  priceMax: 'Μέγ. (€)',
  pricePer: 'Ανά',
  asOf: 'Από',
  priceNote: 'Σημείωση τιμής',
  priceMinMaxError: 'Η ελάχιστη τιμή δεν μπορεί να είναι μεγαλύτερη από τη μέγιστη.',
  priceNumberError: 'Δώσε τιμή μηδέν ή μεγαλύτερη.',
  editRow: 'Επεξεργασία',
  cancel: 'Άκυρο',
}

/** Both literals, for `useLang(adminCopy)` on the `/admin` route. */
export const adminCopy: FeatureCopy<AdminDictionary> = { el: adminEl, en: adminEn }
