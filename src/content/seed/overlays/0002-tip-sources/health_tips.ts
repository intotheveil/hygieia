// OVERLAY 0002 — the health_tips patches (see ../0002-tip-sources.ts for the overlay header). One
// module per table so each bundled table loader downloads only its own rows (../by-table/, perf
// 2026-10-06). Erasable syntax only, explicit `.ts` imports.

import type { SlugPatch } from '../types.ts'

const HARVARD_MEAL_PREP = 'https://nutritionsource.hsph.harvard.edu/meal-prep/'
const CDC_WATER = 'https://www.cdc.gov/healthy-weight-growth/water-healthy-drinks/index.html'

export const HEALTH_TIPS: readonly SlugPatch<'health_tips'>[] = [
  // --- sleep -----------------------------------------------------------------------------------
  {
    // softened: the source has no "first hour" or "10 minutes"
    slug: 'sleep-morning-daylight',
    set: {
      body_el:
        'Το πρωινό φως του ήλιου βοηθά το ρολόι του σώματος να συγχρονίζεται με τη μέρα, και τέτοιες καλές συνήθειες φωτός μπορεί να σε βοηθήσουν να κοιμάσαι καλύτερα το βράδυ. Άνοιξε τα παντζούρια, πιες τον καφέ στο μπαλκόνι ή κάνε μια σύντομη βόλτα έξω. Το έντονο φως και οι οθόνες αργά το βράδυ δρουν αντίστροφα, γι’ αυτό χαμήλωσε τα φώτα το βράδυ.',
      body_en:
        'Morning sunlight helps keep your body clock in step with the day, and healthy light habits like this may help you sleep better at night. Open the shutters, have your coffee on the balcony or take a short walk outside. Bright light and screens late in the evening work the other way, so dim the lights at night.',
      source_url: 'https://www.sleepfoundation.org/bedroom-environment/light-and-sleep',
      needs_source: false,
    },
  },
  {
    // softened: the closing sentence now says what the NHS says
    slug: 'sleep-worry-list',
    set: {
      body_el:
        'Αν το μυαλό τρέχει μόλις σβήσεις το φως, κράτα ένα σημειωματάριο δίπλα στο κρεβάτι. Πριν ξαπλώσεις, γράψε τι σε απασχολεί και μια σύντομη λίστα με όσα έχεις να κάνεις αύριο. Όταν τα βάζεις στο χαρτί, το μυαλό ξεκαθαρίζει πιο εύκολα πριν τον ύπνο.',
      body_en:
        'If your mind races as soon as the light goes off, keep a notebook by the bed. Before you settle down, write down what is on your mind and a short list of what you need to do tomorrow. Putting it on paper helps clear your mind before sleep.',
      source_url:
        'https://www.nhs.uk/every-mind-matters/mental-wellbeing-tips/how-to-fall-asleep-faster-and-sleep-better/',
      needs_source: false,
    },
  },
  // --- hydration -------------------------------------------------------------------------------
  {
    // softened: "by the time you are thirsty you are already behind" dropped
    slug: 'hydration-urine-colour-check',
    set: {
      body_el:
        'Τα ανοιχτόχρωμα ούρα σημαίνουν ότι πίνεις αρκετά. Τα σκούρα κίτρινα ούρα με έντονη μυρωδιά είναι σημάδι αφυδάτωσης, συχνά μαζί με δίψα, κόπωση ή πονοκέφαλο. Πίνε τακτικά μέσα στη μέρα, και περισσότερο όταν κάνει ζέστη, όταν γυμνάζεσαι ή όταν είσαι άρρωστος.',
      body_en:
        'Pale pee means you are drinking enough. Dark yellow, strong-smelling pee is a sign of dehydration, often together with thirst, tiredness or a headache. Drink regularly through the day, and more when it is hot, when you exercise or when you are unwell.',
      source_url: 'https://www.nhs.uk/conditions/dehydration/',
      needs_source: false,
    },
  },
  {
    // softened: "we drink what we see" dropped
    slug: 'hydration-bottle-within-reach',
    set: {
      body_el:
        'Ένα επαναγεμιζόμενο μπουκάλι στο γραφείο, στο αυτοκίνητο και στην τσάντα κάνει το νερό την εύκολη επιλογή αντί για τα ζαχαρούχα ποτά. Δέσε το με συνήθειες που ήδη έχεις: ένα ποτήρι με το ξύπνημα, ένα με κάθε γεύμα, ένα πριν βγεις από το σπίτι.',
      body_en:
        'Carrying a refillable bottle — on your desk, in the car, in your bag — makes water the easy choice over sugary drinks. Tie it to habits you already have: a glass on waking, one with every meal, one before you leave the house.',
      source_url: CDC_WATER,
      needs_source: false,
    },
  },
  {
    // softened to Mayo's wording (less body water, water pills, heat or illness)
    slug: 'hydration-older-adults-schedule',
    set: {
      body_el:
        'Με την ηλικία το σώμα έχει λιγότερο νερό και η αίσθηση της δίψας αμβλύνεται, ενώ κάποια φάρμακα, όπως τα διουρητικά, αυξάνουν τον κίνδυνο αφυδάτωσης — ιδίως στη ζέστη ή όταν είσαι άρρωστος. Μην περιμένεις να διψάσεις: βάλε σταθερές ώρες — πρωί, με κάθε γεύμα, απόγευμα. Αν φροντίζεις κάποιον ηλικιωμένο, πρόσφερέ του συχνά κάτι να πιει.',
      body_en:
        'With age the body holds less water and the sense of thirst weakens, and some medicines, such as water pills, add to the risk of dehydration — especially in hot weather or during an illness. Do not wait to feel thirsty: set fixed times — morning, with each meal, afternoon. If you care for an older person, offer drinks often.',
      source_url:
        'https://www.mayoclinic.org/diseases-conditions/dehydration/symptoms-causes/syc-20354086',
      needs_source: false,
    },
  },
  {
    // softened: "a large glass before bed" dropped; the rest is Mayo's advice
    slug: 'hydration-alternate-alcohol-with-water',
    set: {
      body_el:
        'Το αλκοόλ κάνει τον οργανισμό να παράγει περισσότερα ούρα, και τα υγρά που χάνεις είναι ένας από τους λόγους που το επόμενο πρωί έρχεται με δίψα και πονοκέφαλο. Ένα γεμάτο ποτήρι νερό μετά από κάθε ποτό σε κρατά ενυδατωμένο και σε κάνει να πίνεις λιγότερο αλκοόλ. Και όσο λιγότερο πίνεις, τόσο πιο πιθανό είναι να ξυπνήσεις χωρίς πονοκέφαλο και αδιαθεσία.',
      body_en:
        'Alcohol makes your body produce more urine, and the fluid you lose is one reason the next morning brings thirst and a headache. A full glass of water after each alcoholic drink helps you stay hydrated and means you drink less alcohol. And the less you drink, the less likely you are to wake up with a hangover.',
      source_url:
        'https://www.mayoclinic.org/diseases-conditions/hangovers/symptoms-causes/syc-20373012',
      needs_source: false,
    },
  },
  {
    // softened: "almost half your daily intake" dropped
    slug: 'hydration-drink-with-meals',
    set: {
      body_el:
        'Τα γεύματα είναι τρεις έτοιμες «υπενθυμίσεις» μέσα στη μέρα. Βάλε μια κανάτα νερό στο τραπέζι αντί για αναψυκτικό και σέρβιρε νερό πρώτα. Είναι ένας απλός τρόπος να καλύψεις ένα καλό μέρος από τα υγρά της ημέρας χωρίς να το σκεφτείς.',
      body_en:
        'Meals are three built-in reminders a day. Put a jug of water on the table instead of a soft drink and pour water first. It is a simple way to cover a good part of your daily fluids without thinking about it.',
      source_url: CDC_WATER,
      needs_source: false,
    },
  },
  // --- nutrition -------------------------------------------------------------------------------
  {
    // softened: NHS's "less often and in smaller amounts"; "do not fill you up" dropped
    slug: 'nutrition-limit-ultra-processed-foods',
    set: {
      body_el:
        'Πατατάκια, μπισκότα, συσκευασμένα αλλαντικά, ζαχαρούχα ποτά και κάποια έτοιμα γεύματα έχουν συχνά πολλές θερμίδες, κορεσμένα λιπαρά, αλάτι ή ζάχαρη. Δεν χρειάζεται να τα κόψεις — τρώγε τα πιο σπάνια και σε μικρότερες ποσότητες, και στήριξε τα γεύματα σε φρούτα, λαχανικά και δημητριακά ολικής άλεσης. Ένα γρήγορο στοιχείο στην ετικέτα: τα υπερεπεξεργασμένα περιέχουν συχνά συστατικά που δεν θα είχες στην κουζίνα σου, όπως γλυκαντικά, γαλακτωματοποιητές και συντηρητικά.',
      body_en:
        'Crisps, biscuits, packaged meats, sweetened drinks and some ready meals are often high in calories, saturated fat, salt or sugar. You need not cut them out — eat them less often and in smaller amounts, and build meals on fruit, vegetables and wholegrains. A quick clue on the label: ultra-processed foods often contain ingredients you would not have at home, such as sweeteners, emulsifiers and preservatives.',
      source_url:
        'https://www.nhs.uk/live-well/eat-well/how-to-eat-a-balanced-diet/what-are-processed-foods/',
      needs_source: false,
    },
  },
  // --- movement --------------------------------------------------------------------------------
  {
    // softened: "company is the surest way to keep going" dropped
    slug: 'movement-pick-what-you-enjoy',
    set: {
      body_el:
        'Η καλύτερη άσκηση είναι αυτή που θα συνεχίσεις να κάνεις. Χορός, κολύμπι, ποδήλατο, πεζοπορία, κηπουρική — διάλεξε δραστηριότητες που σου αρέσουν και ταιριάζουν στις δυνατότητές σου, γιατί αυτό σε κρατά σταθερό. Μοίρασέ τες όπως σε βολεύει: τα 150 λεπτά μέτριας δραστηριότητας την εβδομάδα μπορούν να σπάσουν σε μικρότερα διαστήματα.',
      body_en:
        'The best exercise is the one you will keep doing. Dancing, swimming, cycling, hiking, gardening — pick activities you enjoy and that match your abilities, because that is what makes it stick. Spread them however suits you: the weekly 150 minutes of moderate activity can be broken up into shorter sessions.',
      source_url: 'https://www.cdc.gov/physical-activity-basics/adding-adults/index.html',
      needs_source: false,
    },
  },
  // --- habits ----------------------------------------------------------------------------------
  {
    // softened: "no symptoms" is claimed for blood pressure and cholesterol only, as the NHS does
    slug: 'habits-know-your-numbers',
    set: {
      body_el:
        'Η υψηλή πίεση και η υψηλή χοληστερίνη συνήθως δεν προκαλούν συμπτώματα, οπότε μπορεί να τις έχεις χωρίς να το ξέρεις. Ένας τακτικός έλεγχος — πίεση, χοληστερίνη και, όπου το κρίνει ο γιατρός, σάκχαρο — με συχνότητα που θα ορίσει εκείνος ανάλογα με την ηλικία και το ιστορικό σου δείχνει νωρίς τον κίνδυνο, και η πίεση και η χοληστερίνη είναι από τους παράγοντες που μπορείς να αλλάξεις. Γράψε τις τιμές σου και κράτα τες μαζί σου.',
      body_en:
        'High blood pressure and high cholesterol usually cause no symptoms, so you can have them without knowing. A regular check — blood pressure, cholesterol and, where your doctor advises, blood sugar — at a frequency your doctor sets for your age and history shows your risk early, and blood pressure and cholesterol are among the risk factors you can change. Write your numbers down and keep them with you.',
      source_url: 'https://www.nhs.uk/tests-and-treatments/nhs-health-check/',
      needs_source: false,
    },
  },
  {
    // softened: "so small it is impossible to skip" → simple actions become automatic faster
    slug: 'habits-stack-new-on-old',
    set: {
      body_el:
        'Οι συνήθειες χτίζονται όταν η ίδια πράξη επαναλαμβάνεται στην ίδια περίσταση, ώσπου η περίσταση να τη «φέρνει» αυτόματα. Διάλεξε κάτι που ήδη κάνεις κάθε μέρα — τον πρωινό καφέ, το βούρτσισμα, το κλείσιμο του υπολογιστή — και βάλε αμέσως μετά τη νέα πράξη: «μετά τον καφέ, δέκα καθίσματα». Κράτα την απλή: οι απλές πράξεις γίνονται αυτόματες πιο γρήγορα από τις σύνθετες ρουτίνες.',
      body_en:
        'Habits form when the same action is repeated in the same situation until that situation triggers it automatically. Pick something you already do every day — the morning coffee, brushing your teeth, shutting the laptop — and put the new action right after it: “after coffee, ten squats”. Keep it simple: simple actions become automatic faster than elaborate routines.',
      source_url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC3505409/',
      needs_source: false,
    },
  },
  {
    // softened: "always more than you think in takeaway food" dropped
    slug: 'habits-cook-at-home-more',
    set: {
      body_el:
        'Όταν μαγειρεύεις εσύ, αποφασίζεις τα υλικά και το μέγεθος της μερίδας, κάτι που βοηθά στον έλεγχο του βάρους και σε πιο ισορροπημένη διατροφή. Δεν χρειάζεται να είσαι σεφ: λίγες απλές συνταγές που ξέρεις απ’ έξω αρκούν. Μαγείρεψε για δύο-τρία βραδινά και ετοίμασε από τώρα το αυριανό μεσημεριανό.',
      body_en:
        'When you cook, you decide the ingredients and the portion size, which can help with weight control and a more balanced diet. You do not need to be a chef: a handful of simple recipes you know by heart is enough. Cook enough for two or three dinners and pack tomorrow’s lunch while you are at it.',
      source_url: HARVARD_MEAL_PREP,
      needs_source: false,
    },
  },
  {
    // kept: Mayo states the rule; "match the room" → Mayo's "comfortable level"
    slug: 'habits-twenty-twenty-twenty-eyes',
    set: {
      body_el:
        'Οι πολλές ώρες μπροστά σε οθόνη κουράζουν τα μάτια, και οι περισσότεροι βλεφαρίζουμε λιγότερο όταν κοιτάμε οθόνη, με αποτέλεσμα ξηρότητα· ο πονοκέφαλος είναι συχνό σημάδι κόπωσης των ματιών. Κάθε 20 λεπτά κοίτα κάτι σε απόσταση περίπου 6 μέτρων (20 πόδια) για τουλάχιστον 20 δευτερόλεπτα. Βλεφάριζε συχνά και ρύθμισε τη φωτεινότητα και την αντίθεση της οθόνης σε άνετο επίπεδο.',
      body_en:
        'Long hours at a screen strain the eyes, and most people blink less while looking at one, which dries the eyes; headaches are a common sign of eyestrain. Every 20 minutes, look at something about 6 metres (20 feet) away for at least 20 seconds. Blink often and set the screen’s brightness and contrast to a comfortable level.',
      source_url:
        'https://www.mayoclinic.org/diseases-conditions/eyestrain/diagnosis-treatment/drc-20372403',
      needs_source: false,
    },
  },
  {
    // softened: "most poor choices happen when hungry" and "never shop hungry" dropped
    slug: 'habits-plan-meals-and-shop-with-a-list',
    set: {
      body_el:
        'Η απόφαση της τελευταίας στιγμής για το τι θα φας είναι αγχωτική και συχνά καταλήγει σε ντελίβερι. Διάλεξε μία μέρα την εβδομάδα για να σχεδιάσεις τα κύρια γεύματα και να γράψεις τη λίστα, και ψώνισε με βάση αυτήν. Ο προγραμματισμός εξοικονομεί χρήματα και χρόνο, βοηθά σε πιο ισορροπημένη διατροφή και, αν αγοράζεις μόνο ό,τι χρειάζεσαι, πετάς λιγότερο φαγητό.',
      body_en:
        'Deciding at the last minute what to eat is stressful and often ends in a takeaway. Pick one day a week to plan the main meals and write the shopping list, then shop from it. Planning ahead can save money and time, help you eat a more balanced diet and, if you buy just what you need, waste less food.',
      source_url: HARVARD_MEAL_PREP,
      needs_source: false,
    },
  },
  // --- mental ----------------------------------------------------------------------------------
  {
    // softened: "lowers stress" → the NHS's "can boost wellbeing, may ease worry"
    slug: 'mental-time-in-nature',
    set: {
      body_el:
        'Ο χρόνος στη φύση μπορεί να ενισχύσει την ψυχική σου ευεξία: ένας σύντομος περίπατος, τρέξιμο ή ποδήλατο σε ανοιχτό χώρο μπορεί να φτιάξει τη διάθεση και να απαλύνει την ανησυχία. Δεν χρειάζεται εκδρομή — ένας περίπατος σε ένα κοντινό πάρκο ή χώρο πρασίνου αρκεί. Πρόσεξε τι βλέπεις, ακούς, αγγίζεις και μυρίζεις — είναι ενσυνειδητότητα χωρίς να το λες έτσι.',
      body_en:
        'Being out in nature can boost your mental wellbeing: a short walk, run or cycle outdoors may lift your mood and ease worry. It need not be an outing — a walk in a nearby park or green space is enough. Notice what you can see, hear, touch and smell — it is mindfulness without calling it that.',
      source_url:
        'https://www.nhs.uk/every-mind-matters/mental-wellbeing-tips/be-active-for-your-mental-health/',
      needs_source: false,
    },
  },
  {
    // softened: "fuel anxiety and low mood" → the CDC's "can be upsetting"
    slug: 'mental-limit-news-and-scrolling',
    set: {
      body_el:
        'Καλό είναι να ενημερώνεσαι, όμως η συνεχής ροή ειδήσεων για αρνητικά γεγονότα μπορεί να σε αναστατώσει, γι’ αυτό κάνε διαλείμματα από τις ειδήσεις και τα κοινωνικά δίκτυα. Διάλεξε μία ή δύο ώρες τη μέρα για να ενημερωθείς από αξιόπιστες πηγές και κλείσε τις ειδοποιήσεις τις υπόλοιπες. Παρατήρησε πώς νιώθεις μετά από μισή ώρα στο κινητό — και άσε αυτό να αποφασίσει.',
      body_en:
        'It is good to stay informed, but a constant stream of news about negative events can be upsetting, so take breaks from news and social media. Choose one or two times a day to catch up from reliable sources and turn off notifications for the rest. Notice how you feel after half an hour on your phone — and let that decide.',
      source_url: 'https://www.cdc.gov/mental-health/living-with/index.html',
      needs_source: false,
    },
  },
  {
    // softened: "the brain is built to remember problems" and "after two weeks most people" dropped
    slug: 'mental-gratitude-three-good-things',
    set: {
      body_el:
        'Όταν έχεις άγχος, είναι εύκολο να σου ξεφεύγουν οι στιγμές που πάνε καλά. Κάθε βράδυ, γράψε ή σκέψου μερικά πράγματα από τη μέρα για τα οποία νιώθεις ευγνωμοσύνη — όσο μικρά κι αν είναι. Όταν γίνει συνήθεια, σε βοηθά να προσέχεις τα καλά τη στιγμή που συμβαίνουν, ακόμη κι όταν άλλα πάνε στραβά.',
      body_en:
        'Under stress it is easy to miss the moments that go well. Each night, write down or think about several things from the day you are grateful for — however small. Made a habit, it can help you notice good things as they happen, even when other things are going badly.',
      source_url: 'https://newsinhealth.nih.gov/2019/03/practicing-gratitude',
      needs_source: false,
    },
  },
]
