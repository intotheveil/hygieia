// DIETS DICTIONARY (P4.4): every string the diets list and diet detail pages show. Base keys
// (`notMedicalAdvice`, `loading`, `notFoundTitle`…) stay in dictionary.ts; this module adds only
// what the diets screens introduce. Both literals must satisfy the interface (ADR-0002).

export interface DietsDictionary {
  dietsTitle: string
  dietsIntro: string
  whatItIs: string
  allowed: string
  avoided: string
  pros: string
  cons: string
  whoShouldAvoid: string
  recipesForDiet: string
  source: string
  sourcePending: string
  viewDiet: string
}

export const dietsEn: DietsDictionary = {
  dietsTitle: 'Diets',
  dietsIntro:
    'What each diet actually is: what it allows, what it leaves out, where it helps, where it falls short and who should steer clear. Every diet comes with recipes and a weekly plan you can generate.',
  whatItIs: 'What it is',
  allowed: 'Allowed',
  avoided: 'Avoided',
  pros: 'Pros',
  cons: 'Cons',
  whoShouldAvoid: 'Who should avoid it',
  recipesForDiet: 'Recipes for this diet',
  source: 'Source',
  sourcePending: 'Source pending review',
  viewDiet: 'View diet',
}

export const dietsEl: DietsDictionary = {
  dietsTitle: 'Δίαιτες',
  dietsIntro:
    'Τι είναι πραγματικά κάθε δίαιτα: τι επιτρέπει, τι αφήνει έξω, πού βοηθά, πού υστερεί και ποιοι πρέπει να την αποφύγουν. Κάθε δίαιτα συνοδεύεται από συνταγές και ένα εβδομαδιαίο πλάνο που μπορείς να δημιουργήσεις.',
  whatItIs: 'Τι είναι',
  allowed: 'Επιτρέπονται',
  avoided: 'Αποφεύγονται',
  pros: 'Υπέρ',
  cons: 'Κατά',
  whoShouldAvoid: 'Ποιοι πρέπει να την αποφύγουν',
  recipesForDiet: 'Συνταγές για αυτή τη δίαιτα',
  source: 'Πηγή',
  sourcePending: 'Η πηγή εκκρεμεί έλεγχο',
  viewDiet: 'Δες τη δίαιτα',
}
