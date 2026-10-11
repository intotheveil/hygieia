// /women CONTENT — the bilingual, sourced education hub "Για τη γυναίκα" / "For women"
// (docs/research/women-audience-content.md, proposals 1, 2, 3 and 11). Static, bundled with the
// route's lazy chunk; no user data, no tracking (the report's GDPR Art. 9 caution).
//
// Rules this module is held to by ./content.test.ts:
// - every section and card has non-empty `el` AND `en` text and at least one https source;
// - every source was READ before it was cited (2026-10-11), and says what the card says;
// - no weight-loss framing, no "diagnose / treat / cure / balance hormones", no supplement doses,
//   no hormone-therapy recommendations ("talk to your doctor about treatment options" is the limit).
// Greek is written as people speak it, not translated word for word.

import type { Lang } from '../i18n/app'

export type Bilingual = Readonly<Record<Lang, string>>

export const WOMEN_SECTION_IDS = ['strength', 'menopause', 'nutrition', 'cycle'] as const
export type WomenSectionId = (typeof WOMEN_SECTION_IDS)[number]

/** The `/recipes?nutrient=` values (contract with the recipes lane's nutrient filter). */
export const NUTRIENT_SLUGS = ['iron', 'calcium', 'vitamin-d', 'folate'] as const
export type NutrientSlug = (typeof NUTRIENT_SLUGS)[number]

export interface WomenCard {
  readonly id: string
  readonly title: Bilingual
  readonly body: Bilingual
  readonly sources: readonly string[]
  /** Nutrition cards: the recipe filter they link to, and the nutrient's name in that link. */
  readonly nutrient?: { readonly slug: NutrientSlug; readonly name: Bilingual }
}

export interface DoctorBox {
  readonly items: readonly Bilingual[]
  readonly sources: readonly string[]
}

export interface WomenSection {
  readonly id: WomenSectionId
  readonly title: Bilingual
  readonly intro: Bilingual
  readonly cards: readonly WomenCard[]
  /** The menopause section's "see a doctor if…" box. */
  readonly doctor?: DoctorBox
}

/**
 * Workout templates the strength section shows as cards (contract with the women's-strength
 * workouts lane). Looked up by slug through the ContentSource; a slug that does not resolve is
 * simply not shown, so the page works before that content lands.
 */
export const WOMEN_TEMPLATE_SLUGS = [
  'women-strength-gym-beginner-full-body-a',
  'women-strength-gym-beginner-full-body-b',
  'women-strength-home-beginner-dumbbell',
  'women-strength-gym-intermediate-lower',
  'women-strength-gym-intermediate-upper',
  'women-strength-home-intermediate-glutes-core',
] as const

// --- sources (each read 2026-10-11) ---------------------------------------------------------------

export const SRC = {
  nhsActivity:
    'https://www.nhs.uk/live-well/exercise/physical-activity-guidelines-for-adults-aged-19-to-64/',
  nhsStrength: 'https://www.nhs.uk/live-well/exercise/strength-exercises/',
  rtBonePostmenopause: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC9941565/',
  sexDifferencesRt: 'https://pubmed.ncbi.nlm.nih.gov/32218059/',
  acsmProgression: 'https://pubmed.ncbi.nlm.nih.gov/19204579/',
  rtIsMedicine: 'https://pubmed.ncbi.nlm.nih.gov/22777332/',
  iofExercise: 'https://www.osteoporosis.foundation/patients/prevention/exercise',
  nhsMenopause: 'https://www.nhs.uk/conditions/menopause/',
  nhsMenopauseSymptoms: 'https://www.nhs.uk/conditions/menopause/symptoms/',
  nhsMenopauseSelfHelp: 'https://www.nhs.uk/conditions/menopause/things-you-can-do/',
  niceNg23: 'https://www.nice.org.uk/guidance/ng23/chapter/Recommendations',
  menopauseSocietyHotFlashes:
    'https://menopause.org/patient-education/menopause-topics/hot-flashes',
  emasExercise:
    'https://emas-online.org/wp-content/uploads/2026/07/Menopause-Essentials-2026-Exercise.pdf',
  athensVitaminD: 'https://arh.amegroups.org/article/view/4866/html',
  protAge: 'https://pubmed.ncbi.nlm.nih.gov/23867520/',
  nhsIron: 'https://www.nhs.uk/conditions/vitamins-and-minerals/iron/',
  whoAnaemia: 'https://www.who.int/news-room/fact-sheets/detail/anaemia',
  nhsCalcium: 'https://www.nhs.uk/conditions/vitamins-and-minerals/calcium/',
  nhsVitaminD: 'https://www.nhs.uk/conditions/vitamins-and-minerals/vitamin-d/',
  nhsFolate: 'https://www.nhs.uk/conditions/vitamins-and-minerals/vitamin-b/',
  pcosGuideline2023: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC10505534/',
  nhsPcos: 'https://www.nhs.uk/conditions/polycystic-ovary-syndrome-pcos/treatment/',
  cycleUmbrella2023: 'https://www.frontiersin.org/articles/10.3389/fspor.2023.1054542/full',
  cycleMeta2020: 'https://pubmed.ncbi.nlm.nih.gov/32661839/',
  nhsPeriodPain: 'https://www.nhs.uk/conditions/period-pain/',
} as const

// --- sections -------------------------------------------------------------------------------------

const strength: WomenSection = {
  id: 'strength',
  title: { en: 'Strength training', el: 'Προπόνηση δύναμης' },
  intro: {
    en: 'Lifting — with weights, bands or your own body — is one of the most useful things you can do for your bones, your muscles and how capable you feel day to day.',
    el: 'Η προπόνηση με βάρη, λάστιχα ή το βάρος του σώματός σου είναι από τα πιο χρήσιμα πράγματα που μπορείς να κάνεις για τα οστά, τους μυς σου και για το πόσο δυνατή νιώθεις στην καθημερινότητα.',
  },
  cards: [
    {
      id: 'strength-bones',
      title: { en: 'Stronger bones', el: 'Πιο γερά οστά' },
      body: {
        en: 'Bones respond to load. Muscle-strengthening work — weights, bands, even rising onto your toes — helps keep them strong, and a 2023 network meta-analysis found moderate-intensity resistance training three days a week the best option for bone density after menopause.',
        el: 'Τα οστά ανταποκρίνονται στο φορτίο. Οι ασκήσεις ενδυνάμωσης — βάρη, λάστιχα, ακόμη και το να ανεβαίνεις στις μύτες των ποδιών — τα βοηθούν να μένουν γερά. Μια μετα-ανάλυση δικτύου του 2023 βρήκε ότι η προπόνηση αντίστασης μέτριας έντασης τρεις φορές την εβδομάδα είναι η καλύτερη επιλογή για την οστική πυκνότητα μετά την εμμηνόπαυση.',
      },
      sources: [SRC.iofExercise, SRC.rtBonePostmenopause],
    },
    {
      id: 'strength-everyday',
      title: { en: 'Muscle you use every day', el: 'Μύες για την καθημερινότητα' },
      body: {
        en: 'Regular resistance training adds lean muscle, can nudge up the energy your body uses at rest, supports healthy blood sugar and is linked with better self-esteem. In practice: stairs, shopping bags and carrying children get easier.',
        el: 'Η τακτική προπόνηση αντίστασης χτίζει μυϊκή μάζα, μπορεί να ανεβάσει λίγο την ενέργεια που καίει το σώμα σε ηρεμία, βοηθά στη ρύθμιση του σακχάρου και συνδέεται με καλύτερη αυτοεκτίμηση. Στην πράξη: οι σκάλες, οι σακούλες του σούπερ μάρκετ και το παιδί στην αγκαλιά γίνονται πιο εύκολα.',
      },
      sources: [SRC.rtIsMedicine],
    },
    {
      id: 'strength-myth-bulky',
      title: {
        en: 'Myth: “Lifting will make me bulky”',
        el: 'Μύθος: «Τα βάρη θα με φουσκώσουν»',
      },
      body: {
        en: 'A meta-analysis comparing women and men found similar relative gains in muscle and strength from resistance training. What you can expect is to get stronger and move better. How your body looks is your call, not the goal of this page.',
        el: 'Μια μετα-ανάλυση που σύγκρινε γυναίκες και άνδρες βρήκε παρόμοια σχετικά κέρδη σε μυϊκή μάζα και δύναμη από την προπόνηση αντίστασης. Αυτό που μπορείς να περιμένεις είναι να γίνεις πιο δυνατή και να κινείσαι καλύτερα. Το πώς δείχνει το σώμα σου είναι δική σου υπόθεση, όχι ο στόχος αυτής της σελίδας.',
      },
      sources: [SRC.sexDifferencesRt],
    },
    {
      id: 'strength-myth-light',
      title: {
        en: 'Myth: “Women should stick to light weights”',
        el: 'Μύθος: «Οι γυναίκες κάνουν μόνο ελαφριά βάρη»',
      },
      body: {
        en: 'For beginners, the American College of Sports Medicine suggests a load you can lift about 8–12 times with good form, where the last reps feel hard. A weight you could lift all day stops challenging your muscles quickly.',
        el: 'Για αρχάριους, το Αμερικανικό Κολέγιο Αθλητιατρικής προτείνει ένα βάρος που σηκώνεις περίπου 8–12 φορές με σωστή τεχνική, με τις τελευταίες επαναλήψεις να είναι δύσκολες. Ένα βάρος που θα σήκωνες όλη μέρα σταματά γρήγορα να δυναμώνει τους μυς σου.',
      },
      sources: [SRC.acsmProgression],
    },
    {
      id: 'strength-start',
      title: { en: 'How to start', el: 'Πώς να ξεκινήσεις' },
      body: {
        en: 'Aim for strength work on at least two days a week that covers legs, hips, back, tummy, chest, shoulders and arms. Bodyweight moves count: sit-to-stand from a chair, mini-squats, wall press-ups. Learn the movement first, then add load.',
        el: 'Στόχευσε σε ασκήσεις ενδυνάμωσης τουλάχιστον δύο μέρες την εβδομάδα, για πόδια, γοφούς, πλάτη, κοιλιά, στήθος, ώμους και χέρια. Μετράνε και οι ασκήσεις με το βάρος του σώματος: σήκω-κάτσε από καρέκλα, μικρά καθίσματα, κάμψεις στον τοίχο. Μάθε πρώτα την κίνηση και μετά πρόσθεσε βάρος.',
      },
      sources: [SRC.nhsActivity, SRC.nhsStrength],
    },
    {
      id: 'strength-progress',
      title: { en: 'How to progress', el: 'Πώς να προχωρήσεις' },
      body: {
        en: 'When you can do one or two reps more than your target with good form, add a little weight — the ACSM suggests small steps of about 2–10%. Small, steady steps beat big jumps.',
        el: 'Όταν κάνεις μία ή δύο επαναλήψεις παραπάνω από τον στόχο σου με σωστή τεχνική, πρόσθεσε λίγο βάρος — το ACSM προτείνει μικρά βήματα της τάξης του 2–10%. Τα σταθερά μικρά βήματα είναι καλύτερα από τα μεγάλα άλματα.',
      },
      sources: [SRC.acsmProgression, SRC.nhsStrength],
    },
  ],
}

const menopause: WomenSection = {
  id: 'menopause',
  title: { en: 'Perimenopause and menopause', el: 'Περιεμμηνόπαυση και εμμηνόπαυση' },
  intro: {
    en: 'A natural stage of life, usually between 45 and 55, sometimes earlier. Here is what changes and what everyday habits can help.',
    el: 'Ένα φυσιολογικό στάδιο της ζωής, συνήθως μεταξύ 45 και 55 ετών, μερικές φορές νωρίτερα. Τι αλλάζει και ποιες καθημερινές συνήθειες βοηθούν.',
  },
  cards: [
    {
      id: 'menopause-what',
      title: { en: 'What changes', el: 'Τι αλλάζει' },
      body: {
        en: 'As hormone levels fall, periods change and eventually stop. Perimenopause is the run-up: symptoms can start years before your last period, while you still have periods. Some women notice little; for others the changes are hard work.',
        el: 'Καθώς πέφτουν τα επίπεδα των ορμονών, η περίοδος αλλάζει και κάποια στιγμή σταματά. Η περιεμμηνόπαυση είναι η μεταβατική φάση: τα συμπτώματα μπορεί να ξεκινήσουν χρόνια πριν από την τελευταία περίοδο, ενώ ακόμη έχεις περίοδο. Κάποιες γυναίκες δεν καταλαβαίνουν σχεδόν τίποτα· για άλλες οι αλλαγές είναι κουραστικές.',
      },
      sources: [SRC.nhsMenopause, SRC.nhsMenopauseSymptoms],
    },
    {
      id: 'menopause-symptoms',
      title: { en: 'Common symptoms', el: 'Συχνά συμπτώματα' },
      body: {
        en: 'Changes to your periods, hot flushes and night sweats, poor sleep, low mood or anxiety, brain fog, vaginal dryness, joint and muscle aches, headaches and palpitations are all common. You do not have to just put up with them.',
        el: 'Αλλαγές στην περίοδο, εξάψεις και νυχτερινές εφιδρώσεις, κακός ύπνος, πεσμένη διάθεση ή άγχος, «θολό» μυαλό, κολπική ξηρότητα, πόνοι σε αρθρώσεις και μυς, πονοκέφαλοι και αίσθημα παλμών είναι όλα συχνά. Δεν χρειάζεται απλώς να τα υπομένεις.',
      },
      sources: [SRC.nhsMenopauseSymptoms],
    },
    {
      id: 'menopause-nutrition',
      title: { en: 'Food for bones and muscle', el: 'Διατροφή για οστά και μυς' },
      body: {
        en: 'Calcium-rich foods (milk, yoghurt, cheese, leafy greens, sardines with their bones) and vitamin D (sunlight, oily fish, eggs) look after your bones. Enough protein, spread across your meals, helps muscle — especially alongside strength training. Even in sunny Greece, a study of post-menopausal women tested in Athens found low vitamin D very common, so it is worth asking your doctor about.',
        el: 'Οι τροφές με ασβέστιο (γάλα, γιαούρτι, τυρί, πράσινα φυλλώδη, σαρδέλες με τα κόκαλα) και η βιταμίνη D (ήλιος, λιπαρά ψάρια, αυγά) φροντίζουν τα οστά σου. Αρκετή πρωτεΐνη, μοιρασμένη στα γεύματα της μέρας, βοηθά τους μυς — ειδικά μαζί με προπόνηση δύναμης. Ακόμη και στην ηλιόλουστη Ελλάδα, μια μελέτη σε μετεμμηνοπαυσιακές γυναίκες που εξετάστηκαν στην Αθήνα βρήκε πολύ συχνά χαμηλή βιταμίνη D, γι’ αυτό αξίζει να το συζητήσεις με τον γιατρό σου.',
      },
      sources: [
        SRC.nhsMenopauseSelfHelp,
        SRC.nhsCalcium,
        SRC.nhsVitaminD,
        SRC.athensVitaminD,
        SRC.protAge,
      ],
    },
    {
      id: 'menopause-strength',
      title: { en: 'Strength, balance and bones', el: 'Δύναμη, ισορροπία και οστά' },
      body: {
        en: 'Bone density can drop around menopause. Weight-bearing activity (walking, dancing) plus resistance training builds strength, and balance work such as tai chi or yoga lowers the risk of falls. The European Menopause and Andropause Society advises exercise to maximise bone strength.',
        el: 'Η οστική πυκνότητα μπορεί να μειωθεί γύρω από την εμμηνόπαυση. Η δραστηριότητα με το βάρος του σώματος (περπάτημα, χορός) μαζί με προπόνηση αντίστασης χτίζει δύναμη, και οι ασκήσεις ισορροπίας, όπως τάι τσι ή γιόγκα, μειώνουν τον κίνδυνο πτώσεων. Η Ευρωπαϊκή Εταιρεία Εμμηνόπαυσης και Ανδρόπαυσης συστήνει άσκηση για όσο το δυνατόν πιο γερά οστά.',
      },
      sources: [
        SRC.emasExercise,
        SRC.nhsMenopauseSymptoms,
        SRC.nhsMenopauseSelfHelp,
        SRC.iofExercise,
      ],
    },
    {
      id: 'menopause-sleep',
      title: { en: 'Sleep and mood', el: 'Ύπνος και διάθεση' },
      body: {
        en: 'Keep regular sleep times and a cool bedroom, and make room for things that relax you, like yoga, tai chi or meditation. Talking therapies such as cognitive behavioural therapy (CBT) can help with low mood and anxiety, and NICE suggests menopause-specific CBT as one option for hot flushes and night sweats.',
        el: 'Κράτα σταθερές ώρες ύπνου και δροσερό υπνοδωμάτιο, και βρες χρόνο για ό,τι σε χαλαρώνει, όπως γιόγκα, τάι τσι ή διαλογισμό. Η ψυχοθεραπεία, όπως η γνωσιακή-συμπεριφορική (CBT), μπορεί να βοηθήσει στην πεσμένη διάθεση και στο άγχος, και το NICE προτείνει τη CBT ειδικά για την εμμηνόπαυση ως μία επιλογή για τις εξάψεις και τις νυχτερινές εφιδρώσεις.',
      },
      sources: [SRC.nhsMenopauseSelfHelp, SRC.niceNg23],
    },
    {
      id: 'menopause-hot-flushes',
      title: { en: 'Living with hot flushes', el: 'Ζώντας με τις εξάψεις' },
      body: {
        en: 'Wear light layers you can take off, keep a fan or a cool bedroom, and notice your own triggers — alcohol, caffeine, spicy or hot food are common ones. The evidence for these habits is limited, but they are low-risk and many women find them useful.',
        el: 'Φόρα ελαφριά ρούχα σε στρώσεις που βγαίνουν εύκολα, έχε έναν ανεμιστήρα ή δροσερό υπνοδωμάτιο και πρόσεξε τι σου προκαλεί εξάψεις — συχνά είναι το αλκοόλ, ο καφές, το πικάντικο ή το καυτό φαγητό. Τα στοιχεία για αυτές τις συνήθειες είναι περιορισμένα, όμως δεν έχουν ρίσκο και πολλές γυναίκες τις βρίσκουν χρήσιμες.',
      },
      sources: [SRC.menopauseSocietyHotFlashes, SRC.nhsMenopauseSelfHelp],
    },
  ],
  doctor: {
    items: [
      {
        en: 'You think you have symptoms of perimenopause or menopause and want to know your options — talk to your doctor about treatment options.',
        el: 'Πιστεύεις ότι έχεις συμπτώματα περιεμμηνόπαυσης ή εμμηνόπαυσης και θέλεις να μάθεις τις επιλογές σου — μίλησε με τον γιατρό σου για τις επιλογές θεραπείας.',
      },
      {
        en: 'You notice a fast or pounding heartbeat (palpitations).',
        el: 'Νιώθεις γρήγορους ή δυνατούς χτύπους της καρδιάς (αίσθημα παλμών).',
      },
      {
        en: 'You still have periods but you are bleeding more than before, not less.',
        el: 'Έχεις ακόμη περίοδο, αλλά αιμορραγείς περισσότερο από πριν, όχι λιγότερο.',
      },
      {
        en: 'You have had no period for 12 months or more and then have any vaginal bleeding — even once, even spotting.',
        el: 'Δεν έχεις περίοδο για 12 μήνες ή περισσότερο και εμφανίζεις οποιαδήποτε κολπική αιμορραγία — ακόμη και μία φορά, ακόμη και λίγες σταγόνες.',
      },
    ],
    sources: [SRC.nhsMenopauseSymptoms, SRC.niceNg23],
  },
}

const nutrition: WomenSection = {
  id: 'nutrition',
  title: { en: 'Women’s nutrition', el: 'Διατροφή για τη γυναίκα' },
  intro: {
    en: 'Four nutrients women most often need to keep an eye on, why each matters and where to find it in everyday food. Ask your doctor or pharmacist before taking any supplement.',
    el: 'Τέσσερα θρεπτικά συστατικά που οι γυναίκες χρειάζεται συχνότερα να προσέχουν: γιατί μετράει το καθένα και πού θα το βρεις στο καθημερινό φαγητό. Πριν πάρεις οποιοδήποτε συμπλήρωμα, ρώτα τον γιατρό ή τον φαρμακοποιό σου.',
  },
  cards: [
    {
      id: 'nutrition-iron',
      title: { en: 'Iron', el: 'Σίδηρος' },
      body: {
        en: 'Iron helps make the red blood cells that carry oxygen around your body. Women who have periods need more of it, and anaemia — often from too little iron — can leave you tired, dizzy and short of breath. Find it in red meat, beans, lentils, nuts, dried fruit and fortified cereals.',
        el: 'Ο σίδηρος βοηθά να φτιάχνονται τα ερυθρά αιμοσφαίρια που μεταφέρουν οξυγόνο σε όλο το σώμα. Οι γυναίκες που έχουν περίοδο χρειάζονται περισσότερο, και η αναιμία — συχνά από έλλειψη σιδήρου — μπορεί να σε κάνει να νιώθεις κούραση, ζάλη και λαχάνιασμα. Θα τον βρεις στο κόκκινο κρέας, τα φασόλια, τις φακές, τους ξηρούς καρπούς, τα αποξηραμένα φρούτα και τα εμπλουτισμένα δημητριακά.',
      },
      sources: [SRC.nhsIron, SRC.whoAnaemia],
      nutrient: { slug: 'iron', name: { en: 'iron', el: 'σίδηρο' } },
    },
    {
      id: 'nutrition-calcium',
      title: { en: 'Calcium', el: 'Ασβέστιο' },
      body: {
        en: 'Calcium builds bones and keeps teeth healthy, and it also helps your muscles — your heart included — and your blood clot normally. Good sources: milk, yoghurt and cheese, leafy greens such as kale and okra, calcium-fortified soya drinks, and small fish eaten with their bones, like sardines.',
        el: 'Το ασβέστιο χτίζει τα οστά και κρατά γερά τα δόντια, ενώ βοηθά επίσης τους μυς — και την καρδιά — και τη φυσιολογική πήξη του αίματος. Καλές πηγές: γάλα, γιαούρτι και τυρί, πράσινα φυλλώδη όπως το κέιλ, μπάμιες, ρόφημα σόγιας εμπλουτισμένο με ασβέστιο και μικρά ψάρια που τρώγονται με τα κόκαλα, όπως οι σαρδέλες.',
      },
      sources: [SRC.nhsCalcium],
      nutrient: { slug: 'calcium', name: { en: 'calcium', el: 'ασβέστιο' } },
    },
    {
      id: 'nutrition-vitamin-d',
      title: { en: 'Vitamin D', el: 'Βιταμίνη D' },
      body: {
        en: 'Vitamin D helps your body manage calcium and phosphate for healthy bones, teeth and muscles. Your skin makes it in sunlight; food sources include oily fish (salmon, sardines, mackerel), egg yolks and fortified foods. Low levels are common even in Greece, so ask your doctor whether you should be tested.',
        el: 'Η βιταμίνη D βοηθά το σώμα να διαχειρίζεται το ασβέστιο και τον φώσφορο για γερά οστά, δόντια και μυς. Το δέρμα τη φτιάχνει με τον ήλιο· από τις τροφές θα τη βρεις στα λιπαρά ψάρια (σολομός, σαρδέλες, σκουμπρί), στον κρόκο του αυγού και σε εμπλουτισμένα τρόφιμα. Τα χαμηλά επίπεδα είναι συχνά ακόμη και στην Ελλάδα, γι’ αυτό ρώτα τον γιατρό σου αν χρειάζεται να κάνεις εξέταση.',
      },
      sources: [SRC.nhsVitaminD, SRC.athensVitaminD],
      nutrient: { slug: 'vitamin-d', name: { en: 'vitamin D', el: 'βιταμίνη D' } },
    },
    {
      id: 'nutrition-folate',
      title: { en: 'Folate', el: 'Φυλλικό οξύ' },
      body: {
        en: 'Folate helps your body make healthy red blood cells and lowers the risk of neural tube defects such as spina bifida in a baby. Find it in broccoli, Brussels sprouts, leafy greens, peas, chickpeas and beans. If you could get pregnant, health services advise a folic acid supplement from before pregnancy — ask your doctor or pharmacist.',
        el: 'Το φυλλικό οξύ βοηθά το σώμα να φτιάχνει υγιή ερυθρά αιμοσφαίρια και μειώνει τον κίνδυνο ανωμαλιών του νευρικού σωλήνα, όπως η δισχιδής ράχη, στο μωρό. Θα το βρεις στο μπρόκολο, στα λαχανάκια Βρυξελλών, στα πράσινα φυλλώδη, στον αρακά, στα ρεβίθια και στα φασόλια. Αν μπορεί να μείνεις έγκυος, οι υγειονομικές αρχές συστήνουν συμπλήρωμα φυλλικού οξέος από πριν από την εγκυμοσύνη — ρώτα τον γιατρό ή τον φαρμακοποιό σου.',
      },
      sources: [SRC.nhsFolate],
      nutrient: { slug: 'folate', name: { en: 'folate', el: 'φυλλικό οξύ' } },
    },
    {
      id: 'nutrition-pcos',
      title: {
        en: 'PCOS: dietary pattern ideas, not treatment',
        el: 'Σύνδρομο πολυκυστικών ωοθηκών: ιδέες διατροφής, όχι θεραπεία',
      },
      body: {
        en: 'The 2023 international PCOS guideline found no evidence that any one diet is better than another; any way of eating that follows healthy-eating guidelines has benefits. Pick a pattern you enjoy and can keep, and stay active. Your doctor manages PCOS itself.',
        el: 'Η διεθνής κατευθυντήρια οδηγία του 2023 για το σύνδρομο πολυκυστικών ωοθηκών δεν βρήκε στοιχεία ότι κάποια δίαιτα είναι καλύτερη από τις άλλες· κάθε τρόπος διατροφής που ακολουθεί τις οδηγίες υγιεινής διατροφής έχει οφέλη. Διάλεξε έναν τρόπο διατροφής που σου αρέσει και μπορείς να κρατήσεις, και μείνε δραστήρια. Τη διαχείριση του ίδιου του συνδρόμου την κάνει ο γιατρός σου.',
      },
      sources: [SRC.pcosGuideline2023, SRC.nhsPcos],
    },
  ],
}

const cycle: WomenSection = {
  id: 'cycle',
  title: { en: 'Your cycle and training', el: 'Ο κύκλος σου και η προπόνηση' },
  intro: {
    en: 'You may have seen “cycle-synced” workout plans. Here is what the research actually shows.',
    el: 'Ίσως έχεις δει προγράμματα προπόνησης «συγχρονισμένα με τον κύκλο». Δες τι δείχνει στ’ αλήθεια η έρευνα.',
  },
  cards: [
    {
      id: 'cycle-evidence',
      title: { en: 'The evidence is weak', el: 'Τα στοιχεία είναι αδύναμα' },
      body: {
        en: 'A 2023 umbrella review found the studies inconsistent and mostly low quality, and concluded it is premature to say that hormone changes across the cycle meaningfully affect strength or how you adapt to training. Phase-based programmes are not evidence-based.',
        el: 'Μια ανασκόπηση ανασκοπήσεων του 2023 βρήκε τις μελέτες ασυνεπείς και κυρίως χαμηλής ποιότητας, και κατέληξε ότι είναι πρόωρο να πούμε πως οι ορμονικές αλλαγές μέσα στον κύκλο επηρεάζουν ουσιαστικά τη δύναμη ή την προσαρμογή στην προπόνηση. Τα προγράμματα ανά φάση του κύκλου δεν στηρίζονται σε επιστημονικά στοιχεία.',
      },
      sources: [SRC.cycleUmbrella2023],
    },
    {
      id: 'cycle-individual',
      title: { en: 'Everyone is different', el: 'Κάθε γυναίκα είναι διαφορετική' },
      body: {
        en: 'A 2020 meta-analysis found performance may dip slightly in the first days of a period for some women, but the effect was small and varied a lot between people. The authors advise a personal approach over general rules.',
        el: 'Μια μετα-ανάλυση του 2020 βρήκε ότι η απόδοση ίσως πέφτει λίγο τις πρώτες μέρες της περιόδου για κάποιες γυναίκες, όμως η επίδραση ήταν μικρή και διέφερε πολύ από άτομο σε άτομο. Οι ερευνητές προτείνουν προσωπική προσέγγιση αντί για γενικούς κανόνες.',
      },
      sources: [SRC.cycleMeta2020],
    },
    {
      id: 'cycle-listen',
      title: { en: 'Listen to your body', el: 'Άκου το σώμα σου' },
      body: {
        en: 'On a day with cramps, fatigue or poor sleep, it is fine to go lighter, do fewer sets or swap in walking, swimming, cycling or yoga — gentle exercise may even ease period pain. On a good day, train as planned.',
        el: 'Μια μέρα με πόνους περιόδου, κούραση ή κακό ύπνο, δεν πειράζει να κάνεις κάτι πιο ελαφρύ, λιγότερα σετ ή να το αλλάξεις με περπάτημα, κολύμπι, ποδήλατο ή γιόγκα — η ήπια άσκηση μπορεί μάλιστα να ανακουφίσει τον πόνο της περιόδου. Μια καλή μέρα, προπονήσου κανονικά.',
      },
      sources: [SRC.nhsPeriodPain, SRC.cycleUmbrella2023],
    },
    {
      id: 'cycle-no-plan',
      title: { en: 'No need to plan around phases', el: 'Δεν χρειάζεται να οργανώνεις τις φάσεις' },
      body: {
        en: 'Keep a steady programme and adjust on the day. Sleep, food, stress and motivation matter at least as much as your cycle. If you notice a pattern in how you feel, use it — you do not need an app or a tracker for that.',
        el: 'Κράτα ένα σταθερό πρόγραμμα και προσάρμοσέ το τη μέρα που χρειάζεται. Ο ύπνος, το φαγητό, το άγχος και η διάθεση μετράνε τουλάχιστον όσο ο κύκλος σου. Αν προσέξεις ένα μοτίβο στο πώς νιώθεις, αξιοποίησέ το — δεν χρειάζεσαι εφαρμογή παρακολούθησης γι’ αυτό.',
      },
      sources: [SRC.cycleUmbrella2023],
    },
    {
      id: 'cycle-see-gp',
      title: { en: 'When period pain needs a doctor', el: 'Πότε ο πόνος περιόδου θέλει γιατρό' },
      body: {
        en: 'See your doctor if your periods become more painful, heavier or irregular, if pain stops you doing your usual things, or if you bleed between periods. Get urgent advice if the pain is severe or worse than usual and painkillers have not helped.',
        el: 'Πήγαινε στον γιατρό αν η περίοδος γίνει πιο επώδυνη, πιο βαριά ή ακανόνιστη, αν ο πόνος σε εμποδίζει από τις συνηθισμένες σου δραστηριότητες ή αν έχεις αιμορραγία ανάμεσα στις περιόδους. Ζήτα επείγουσα βοήθεια αν ο πόνος είναι έντονος ή χειρότερος από ό,τι συνήθως και τα παυσίπονα δεν βοήθησαν.',
      },
      sources: [SRC.nhsPeriodPain],
    },
  ],
}

/** The four sections, in page (and table-of-contents) order. */
export const WOMEN_SECTIONS: readonly WomenSection[] = [strength, menopause, nutrition, cycle]

/** Every distinct source a section cites (cards + the doctor box), in first-use order. */
export function sectionSources(section: WomenSection): string[] {
  const all = [...section.cards.flatMap((c) => c.sources), ...(section.doctor?.sources ?? [])]
  return [...new Set(all)]
}

/** The workouts track the women's strength templates live on (contract with the workouts lane). */
export const WOMEN_TRACK = 'women-strength'

/** `/workouts?track=women-strength` (the whole programme), or one template's type + level on it. */
export function trackHref(cell?: { type: string; level: string }): string {
  const params = new URLSearchParams({ track: WOMEN_TRACK })
  if (cell) {
    params.set('type', cell.type)
    params.set('level', cell.level)
  }
  return `/workouts?${params.toString()}`
}

/** The nutrient filter link of a nutrition card. */
export function recipesHref(slug: NutrientSlug): string {
  return `/recipes?nutrient=${slug}`
}

/** "pubmed.ncbi.nlm.nih.gov" → link text for a source URL. */
export function sourceHost(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}
