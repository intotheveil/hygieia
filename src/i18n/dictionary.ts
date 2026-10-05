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
  statusTitle: string
  statusBody: string
  roadmap: string
  modules: Record<ModuleId, ModuleCopy>
  notMedicalAdvice: string
  notFoundTitle: string
  notFoundBody: string
  backHome: string
}

export const en: Dictionary = {
  langName: 'English',
  switchTo: 'Ελληνικά',
  tagline: 'Eat well, move well, in Greek and English.',
  heroTitle: 'Health, food and movement — explained simply.',
  heroLead:
    'Hygieia brings together health tips, every major diet, recipes tagged by diet, what you can cook from what is already in your fridge, what a meal costs and contains, and workouts for home, gym or calisthenics at three levels.',
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
}

export const el: Dictionary = {
  langName: 'Ελληνικά',
  switchTo: 'English',
  tagline: 'Τρώμε καλά, κινούμαστε καλά, στα ελληνικά και στα αγγλικά.',
  heroTitle: 'Υγεία, διατροφή και άσκηση — απλά και κατανοητά.',
  heroLead:
    'Η Υγίεια συγκεντρώνει συμβουλές υγείας, κάθε γνωστή δίαιτα, συνταγές ανά δίαιτα, τι μπορείς να μαγειρέψεις με ό,τι έχεις ήδη στο ψυγείο, πόσο κοστίζει και τι περιέχει ένα γεύμα, και προπονήσεις για σπίτι, γυμναστήριο ή calisthenics σε τρία επίπεδα.',
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
}

export const dictionaries: Record<Lang, Dictionary> = { el, en }
