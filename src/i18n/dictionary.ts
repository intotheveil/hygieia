// THE BILINGUAL DICTIONARY. Hygieia is Greek + English by definition (the operator's intent), so
// the two languages are peers: one `Dictionary` type, two literals that must both satisfy it.
// A key added to one and forgotten in the other is a TYPE error, not a blank string in production.
// Greek is the default (index.html `lang="el"`); see LangProvider for detection and persistence.

export const LANGS = ['el', 'en'] as const
export type Lang = (typeof LANGS)[number]

/** The six product modules from the intent, in the order they appear on the home page. */
export const MODULE_IDS = ['tips', 'diets', 'recipes', 'cost', 'calories', 'workouts'] as const
export type ModuleId = (typeof MODULE_IDS)[number]

export interface ModuleCopy {
  title: string
  blurb: string
}

export interface Dictionary {
  langName: string
  switchTo: string
  tagline: string
  heroTitle: string
  heroLead: string
  heroImageAlt: string
  statusTitle: string
  statusBody: string
  roadmap: string
  modules: Record<ModuleId, ModuleCopy>
  notMedicalAdvice: string
  notFoundTitle: string
  notFoundBody: string
  backHome: string
  // auth (P2)
  signIn: string
  signInIntro: string
  signInEmailLabel: string
  signInSendLink: string
  signInLinkSent: string
  signInGoogle: string
  signInUnavailableTitle: string
  signInUnavailableBody: string
  signInFailed: string
  signOut: string
  callbackWorking: string
  callbackFailed: string
  backToSignIn: string
  // user data (P2.4)
  userDataUnavailableLocal: string
  userDataSignInToSave: string
  saved: string
  save: string
  remove: string
  // guards (P2.5)
  account: string
  notAllowedTitle: string
  notAllowedBody: string
  adminTitle: string
  adminPlaceholder: string
  savedPlans: string
  savedFridgeLists: string
  favourites: string
  nothingSavedYet: string
  loading: string
}

export const en: Dictionary = {
  langName: 'English',
  switchTo: 'Ελληνικά',
  tagline: 'Eat well, move well, in Greek and English.',
  heroTitle: 'Health, food and movement — explained simply.',
  heroLead:
    'Hygieia brings together health tips, every major diet, recipes tagged by diet, what you can cook from what is already in your fridge, what a meal costs and contains, and workouts for home, gym or calisthenics at three levels.',
  heroImageAlt:
    'A plate of grilled salmon with roasted vegetables and quinoa salad on a linen tablecloth.',
  statusTitle: 'Early build',
  statusBody:
    'This is the foundation of the product. The modules below describe what is coming; none of them holds content yet.',
  roadmap: 'Coming',
  modules: {
    tips: {
      title: 'Health tips',
      blurb: 'Short, sourced guidance on sleep, hydration, habits and everyday wellbeing.',
    },
    diets: {
      title: 'Diets and meal plans',
      blurb:
        'What each diet actually is — Mediterranean, Atkins, paleo, low-carb, keto, carnivore and more — and weekly plans built on it.',
    },
    recipes: {
      title: 'Recipes and your fridge',
      blurb:
        'Recipes tagged by diet, plus “What is in my fridge?”: list your ingredients and get meals you can make right now.',
    },
    cost: {
      title: 'Meal cost',
      blurb: 'An estimate of what a recipe costs to make, per portion.',
    },
    calories: {
      title: 'Calories and macros',
      blurb: 'An estimate of calories, protein, carbohydrate and fat for any meal.',
    },
    workouts: {
      title: 'Workouts',
      blurb:
        'Home, gym or calisthenics. Beginner, intermediate or advanced, each at three intensities.',
    },
  },
  notMedicalAdvice:
    'Hygieia offers general information, not medical advice. Talk to a doctor or dietitian before changing your diet or training.',
  notFoundTitle: 'Page not found',
  notFoundBody: 'There is nothing at this address.',
  backHome: 'Back to the start',
  // auth (P2)
  signIn: 'Sign in',
  signInIntro:
    'Sign in to save plans, keep your fridge list and mark favourites. We will email you a link; no password needed.',
  signInEmailLabel: 'Email address',
  signInSendLink: 'Send me a sign-in link',
  signInLinkSent: 'Check your inbox: the sign-in link is on its way. You can close this page.',
  signInGoogle: 'Continue with Google',
  signInUnavailableTitle: 'Sign-in unavailable',
  signInUnavailableBody:
    'This copy of Hygieia runs without an account service, so there is nothing to sign in to. Everything else works.',
  signInFailed: 'Sign-in did not go through. Check the address and try again.',
  signOut: 'Sign out',
  callbackWorking: 'Signing you in…',
  callbackFailed: 'The sign-in link did not work. It may have expired or already been used.',
  backToSignIn: 'Back to sign-in',
  // user data (P2.4)
  userDataUnavailableLocal:
    'This copy of Hygieia runs without an account service, so saving plans, fridge lists and favourites is switched off. Everything else works.',
  userDataSignInToSave: 'Sign in to save plans, keep fridge lists and mark favourites.',
  saved: 'Saved',
  save: 'Save',
  remove: 'Remove',
  // guards (P2.5)
  account: 'Account',
  notAllowedTitle: 'Not allowed',
  notAllowedBody: 'This page is for Hygieia reviewers only. Your account does not have that role.',
  adminTitle: 'Review',
  adminPlaceholder:
    'The review tools — approving, rejecting and editing content in both languages — arrive in a later phase (P4). Nothing to do here yet.',
  savedPlans: 'Saved plans',
  savedFridgeLists: 'Fridge lists',
  favourites: 'Favourites',
  nothingSavedYet: 'Nothing saved yet.',
  loading: 'Loading…',
}

export const el: Dictionary = {
  langName: 'Ελληνικά',
  switchTo: 'English',
  tagline: 'Τρώμε καλά, κινούμαστε καλά, στα ελληνικά και στα αγγλικά.',
  heroTitle: 'Υγεία, διατροφή και άσκηση — απλά και κατανοητά.',
  heroLead:
    'Η Υγίεια συγκεντρώνει συμβουλές υγείας, κάθε γνωστή δίαιτα, συνταγές ανά δίαιτα, τι μπορείς να μαγειρέψεις με ό,τι έχεις ήδη στο ψυγείο, πόσο κοστίζει και τι περιέχει ένα γεύμα, και προπονήσεις για σπίτι, γυμναστήριο ή calisthenics σε τρία επίπεδα.',
  heroImageAlt: 'Πιάτο με ψητό σολομό, ψητά λαχανικά και σαλάτα κινόα πάνω σε λινό τραπεζομάντιλο.',
  statusTitle: 'Πρώιμη έκδοση',
  statusBody:
    'Αυτή είναι η βάση του προϊόντος. Οι ενότητες παρακάτω περιγράφουν τι έρχεται· καμία δεν έχει ακόμη περιεχόμενο.',
  roadmap: 'Έρχεται',
  modules: {
    tips: {
      title: 'Συμβουλές υγείας',
      blurb:
        'Σύντομη, τεκμηριωμένη καθοδήγηση για ύπνο, ενυδάτωση, συνήθειες και καθημερινή ευεξία.',
    },
    diets: {
      title: 'Δίαιτες και πλάνα γευμάτων',
      blurb:
        'Τι είναι πραγματικά κάθε δίαιτα — μεσογειακή, Atkins, paleo, χαμηλών υδατανθράκων, κετογονική, carnivore και άλλες — και εβδομαδιαία πλάνα πάνω της.',
    },
    recipes: {
      title: 'Συνταγές και το ψυγείο σου',
      blurb:
        'Συνταγές με ετικέτες ανά δίαιτα, και «Τι έχω στο ψυγείο;»: γράψε τα υλικά σου και δες τι γεύματα μπορείς να φτιάξεις τώρα.',
    },
    cost: {
      title: 'Κόστος γεύματος',
      blurb: 'Εκτίμηση του κόστους μιας συνταγής, ανά μερίδα.',
    },
    calories: {
      title: 'Θερμίδες και μακροθρεπτικά',
      blurb: 'Εκτίμηση θερμίδων, πρωτεΐνης, υδατανθράκων και λίπους για κάθε γεύμα.',
    },
    workouts: {
      title: 'Προπονήσεις',
      blurb:
        'Σπίτι, γυμναστήριο ή calisthenics. Αρχάριος, μεσαίος ή προχωρημένος, το καθένα σε τρεις εντάσεις.',
    },
  },
  notMedicalAdvice:
    'Η Υγίεια προσφέρει γενικές πληροφορίες, όχι ιατρικές συμβουλές. Μίλησε με γιατρό ή διαιτολόγο πριν αλλάξεις διατροφή ή προπόνηση.',
  notFoundTitle: 'Η σελίδα δεν βρέθηκε',
  notFoundBody: 'Δεν υπάρχει τίποτα σε αυτή τη διεύθυνση.',
  backHome: 'Πίσω στην αρχή',
  // auth (P2)
  signIn: 'Σύνδεση',
  signInIntro:
    'Συνδέσου για να αποθηκεύεις πλάνα, να κρατάς τη λίστα του ψυγείου σου και να σημειώνεις αγαπημένα. Θα σου στείλουμε έναν σύνδεσμο με email· δεν χρειάζεται κωδικός.',
  signInEmailLabel: 'Διεύθυνση email',
  signInSendLink: 'Στείλε μου σύνδεσμο σύνδεσης',
  signInLinkSent:
    'Έλεγξε τα εισερχόμενά σου: ο σύνδεσμος σύνδεσης είναι καθ’ οδόν. Μπορείς να κλείσεις αυτή τη σελίδα.',
  signInGoogle: 'Συνέχεια με Google',
  signInUnavailableTitle: 'Η σύνδεση δεν είναι διαθέσιμη',
  signInUnavailableBody:
    'Αυτό το αντίγραφο της Υγίειας λειτουργεί χωρίς υπηρεσία λογαριασμών, οπότε δεν υπάρχει πού να συνδεθείς. Όλα τα υπόλοιπα λειτουργούν.',
  signInFailed: 'Η σύνδεση δεν ολοκληρώθηκε. Έλεγξε τη διεύθυνση και δοκίμασε ξανά.',
  signOut: 'Αποσύνδεση',
  callbackWorking: 'Γίνεται σύνδεση…',
  callbackFailed:
    'Ο σύνδεσμος σύνδεσης δεν λειτούργησε. Ίσως έχει λήξει ή έχει ήδη χρησιμοποιηθεί.',
  backToSignIn: 'Πίσω στη σύνδεση',
  // user data (P2.4)
  userDataUnavailableLocal:
    'Αυτό το αντίγραφο της Υγίειας λειτουργεί χωρίς υπηρεσία λογαριασμών, οπότε η αποθήκευση πλάνων, λιστών ψυγείου και αγαπημένων είναι απενεργοποιημένη. Όλα τα υπόλοιπα λειτουργούν.',
  userDataSignInToSave:
    'Συνδέσου για να αποθηκεύεις πλάνα, να κρατάς λίστες ψυγείου και να σημειώνεις αγαπημένα.',
  saved: 'Αποθηκεύτηκε',
  save: 'Αποθήκευση',
  remove: 'Αφαίρεση',
  // guards (P2.5)
  account: 'Λογαριασμός',
  notAllowedTitle: 'Δεν επιτρέπεται',
  notAllowedBody:
    'Αυτή η σελίδα είναι μόνο για τους ελεγκτές της Υγίειας. Ο λογαριασμός σου δεν έχει αυτόν τον ρόλο.',
  adminTitle: 'Έλεγχος περιεχομένου',
  adminPlaceholder:
    'Τα εργαλεία ελέγχου — έγκριση, απόρριψη και επεξεργασία περιεχομένου και στις δύο γλώσσες — έρχονται σε επόμενη φάση (P4). Δεν υπάρχει κάτι να κάνεις εδώ ακόμη.',
  savedPlans: 'Αποθηκευμένα πλάνα',
  savedFridgeLists: 'Λίστες ψυγείου',
  favourites: 'Αγαπημένα',
  nothingSavedYet: 'Δεν έχεις αποθηκεύσει τίποτα ακόμη.',
  loading: 'Φόρτωση…',
}

export const dictionaries: Record<Lang, Dictionary> = { el, en }
