// TASKS ADVISOR topic: ready for summer (P9 +8). Lazy chunk (./index.ts). Sun and heat safety follow
// the usual public guidance (shade in the hottest hours, water, check on older people, never leave
// a child or a pet in a parked car); anyone on regular medicines is pointed to a doctor or pharmacist.
import { daily, kickoff, monthly, opt, question, topic, weekly } from './build.ts'
import { TOPICS } from './topics.ts'

const AWAY = ['abroad', 'greece']

export const summerPrep = topic(
  TOPICS['summer-prep'],
  [
    question(
      'phase',
      'single',
      ['Where are you in the summer?', 'Σε ποιο σημείο του καλοκαιριού βρίσκεσαι;'],
      [
        opt('early', ['Getting ready (May–June)', 'Προετοιμασία (Μάιος–Ιούνιος)']),
        opt('peak', ['High summer (July–August)', 'Καρδιά του καλοκαιριού (Ιούλιος–Αύγουστος)']),
        opt('leaving', ['Leaving for holidays soon', 'Φεύγω σύντομα για διακοπές']),
      ],
    ),
    question(
      'who',
      'multi',
      ['Who else are you looking after?', 'Ποιον άλλον φροντίζεις;'],
      [
        opt('kids', ['Children', 'Παιδιά']),
        opt('elderly', ['An older relative', 'Έναν ηλικιωμένο συγγενή']),
        opt('pets', ['Pets', 'Κατοικίδια']),
      ],
      ['Choose all that apply — or none.', 'Διάλεξε όσα ισχύουν — ή κανένα.'],
    ),
    question(
      'heat',
      'single',
      ['How do you handle the heat?', 'Πώς τα πας με τη ζέστη;'],
      [
        opt('fine', ['I cope fine', 'Την αντέχω']),
        opt('hard', ['It really gets to me', 'Με ταλαιπωρεί πολύ'], { gentle: true }),
      ],
    ),
    question(
      'travel',
      'single',
      ['Holidays this year?', 'Διακοπές φέτος;'],
      [
        opt('abroad', ['Abroad', 'Στο εξωτερικό']),
        opt('greece', ['Within Greece', 'Μέσα στην Ελλάδα']),
        opt('home', ['Staying home', 'Μένω σπίτι']),
      ],
    ),
    question(
      'time',
      'single',
      ['How much time a day for this?', 'Πόσο χρόνο τη μέρα έχεις γι’ αυτό;'],
      [
        opt('t10', ['About 10 minutes', 'Περίπου 10 λεπτά'], { minutes: 10 }),
        opt('t20', ['About 20 minutes', 'Περίπου 20 λεπτά'], { minutes: 20 }),
        opt('t30', ['Half an hour', 'Μισή ώρα'], { minutes: 30 }),
      ],
    ),
  ],
  [
    daily(
      'bottle',
      1,
      6,
      [
        'Carry a water bottle and refill it through the day',
        'Έχε μαζί ένα μπουκάλι νερό και ξαναγέμιζέ το μέσα στη μέρα',
      ],
      {
        detail: [
          'Drink before you feel thirsty — in a heatwave thirst comes late.',
          'Πίνε πριν διψάσεις — στον καύσωνα η δίψα έρχεται αργά.',
        ],
      },
    ),
    daily(
      'elderly-call',
      5,
      6,
      [
        'Call or visit the older relative: water, a cool room, how do they feel?',
        'Πάρε τηλέφωνο ή επισκέψου τον ηλικιωμένο συγγενή: νερό, δροσερό δωμάτιο, πώς νιώθει;',
      ],
      {
        when: { who: ['elderly'], phase: ['peak'] },
      },
    ),
    daily('sunscreen', 2, 5, [
      'Sunscreen before going out; reapply after a swim',
      'Αντηλιακό πριν βγεις· ξαναβάλε μετά το μπάνιο',
    ]),
    daily(
      'midday',
      1,
      5,
      [
        'Heatwave: stay in the shade or indoors in the hottest hours (about 12:00–17:00)',
        'Καύσωνας: μείνε στη σκιά ή μέσα τις πιο ζεστές ώρες (περίπου 12:00–17:00)',
      ],
      {
        when: { phase: ['peak'] },
      },
    ),
    daily(
      'kids-shade',
      1,
      5,
      [
        'Hats, light clothes and shade for the children',
        'Καπέλα, ελαφριά ρούχα και σκιά για τα παιδιά',
      ],
      {
        when: { who: ['kids'] },
      },
    ),
    daily(
      'parked-car',
      1,
      5,
      [
        'Never leave a child or a pet in a parked car, not even for a minute',
        'Ποτέ παιδί ή ζώο μέσα σε σταθμευμένο αυτοκίνητο, ούτε για ένα λεπτό',
      ],
      {
        when: { who: ['kids', 'pets'] },
      },
    ),
    daily(
      'pets-water',
      2,
      4,
      [
        'Shade and fresh water for pets; walks early or late',
        'Σκιά και φρέσκο νερό για τα ζώα· βόλτες νωρίς ή αργά',
      ],
      {
        when: { who: ['pets'] },
      },
    ),
    daily('cool-home', 2, 4, [
      'Shutters closed by day, windows open in the cool of the night',
      'Παντζούρια κλειστά τη μέρα, παράθυρα ανοιχτά όταν δροσίσει το βράδυ',
    ]),
    daily(
      'heat-signs',
      1,
      4,
      [
        'Dizzy, headache, nausea? Get somewhere cool, sip water, ask for help',
        'Ζαλάδα, πονοκέφαλος, ναυτία; Πήγαινε κάπου δροσερά, πιες νερό σιγά σιγά, ζήτα βοήθεια',
      ],
      {
        when: { heat: ['hard'] },
      },
    ),
    daily(
      'cool-shower',
      5,
      5,
      ['A lukewarm shower when you feel overheated', 'Ένα χλιαρό ντους όταν νιώθεις ότι «βράζεις»'],
      {
        when: { heat: ['hard'] },
      },
    ),
    daily('light-meals', 2, 2, [
      'Lighter meals: fruit, salads, vegetables',
      'Πιο ελαφριά γεύματα: φρούτα, σαλάτες, λαχανικά',
    ]),

    weekly(
      'forecast',
      5,
      4,
      [
        'Check the week’s forecast and any heatwave warnings',
        'Δες την πρόγνωση της εβδομάδας και τυχόν προειδοποιήσεις για καύσωνα',
      ],
      {
        day: 'mon',
      },
    ),
    weekly(
      'fire',
      2,
      4,
      [
        'High fire-risk days: no barbecues or burning outdoors; keep 112 alerts on',
        'Μέρες υψηλού κινδύνου πυρκαγιάς: όχι ψησταριές ή κάψιμο έξω· κράτα ενεργές τις ειδοποιήσεις του 112',
      ],
      {
        when: { phase: ['peak', 'leaving'] },
      },
    ),
    weekly('mosquito', 10, 3, [
      'Empty standing water: saucers, buckets, toys (mosquitoes)',
      'Άδειασε τα στάσιμα νερά: πιατάκια, κουβάδες, παιχνίδια (κουνούπια)',
    ]),
    weekly(
      'early-move',
      20,
      4,
      ['Move exercise to the early morning', 'Μετάφερε την άσκηση νωρίς το πρωί'],
      {
        when: { time: ['t20', 't30'] },
        times: 3,
      },
    ),
    weekly(
      'fans',
      15,
      3,
      [
        'Clean the fans and the A/C filters',
        'Καθάρισε τους ανεμιστήρες και τα φίλτρα του κλιματιστικού',
      ],
      {
        when: { phase: ['early'] },
      },
    ),
    weekly(
      'sun-kit',
      10,
      3,
      ['Restock sunscreen, after-sun and hats', 'Ανανέωσε αντηλιακά, after-sun και καπέλα'],
      {
        when: { phase: ['early'] },
      },
    ),
    weekly(
      'shade-up',
      20,
      3,
      ['Put up awnings or shade on the sunny side', 'Βάλε τέντα ή σκίαστρο στην ηλιόλουστη πλευρά'],
      {
        when: { phase: ['early'], time: ['t20', 't30'] },
      },
    ),
    weekly(
      'wardrobe',
      20,
      4,
      [
        'Swap one wardrobe to summer clothes',
        'Κάνε την αλλαγή σε μία ντουλάπα: έξω τα καλοκαιρινά',
      ],
      {
        when: { phase: ['early'], time: ['t30'] },
      },
    ),
    weekly(
      'beach-bag',
      10,
      3,
      [
        'Beach bag ready: water, hat, sunscreen, umbrella',
        'Τσάντα θάλασσας έτοιμη: νερό, καπέλο, αντηλιακό, ομπρέλα',
      ],
      {
        when: { phase: ['peak'] },
        day: 'fri',
      },
    ),
    weekly(
      'water-watch',
      1,
      4,
      [
        'At the beach or pool, one adult always watching the children',
        'Στη θάλασσα ή στην πισίνα, ένας μεγάλος πάντα να προσέχει τα παιδιά',
      ],
      {
        when: { who: ['kids'], phase: ['peak', 'leaving'] },
        day: 'sat',
      },
    ),
    weekly(
      'elderly-room',
      15,
      4,
      [
        'Make sure the older relative has a fan or a cool room and water at hand',
        'Φρόντισε ο ηλικιωμένος να έχει ανεμιστήρα ή δροσερό δωμάτιο και νερό πρόχειρο',
      ],
      {
        when: { who: ['elderly'] },
      },
    ),
    weekly('pack-list', 15, 5, ['Write the packing list', 'Γράψε τη λίστα για τη βαλίτσα'], {
      when: { phase: ['leaving'], travel: AWAY },
    }),
    weekly(
      'documents',
      10,
      5,
      [
        'Passports or IDs valid? European Health Insurance Card packed?',
        'Διαβατήρια ή ταυτότητες σε ισχύ; Πήρες την Ευρωπαϊκή Κάρτα Ασφάλισης Ασθένειας;',
      ],
      {
        when: { travel: ['abroad'] },
      },
    ),
    weekly(
      'meds',
      10,
      4,
      [
        'Pack your usual medicines and a small first-aid kit',
        'Βάλε στη βαλίτσα τα φάρμακα που παίρνεις και ένα μικρό φαρμακείο',
      ],
      {
        when: { travel: AWAY },
      },
    ),
    weekly(
      'home-leave',
      20,
      5,
      [
        'Before you go: empty the fridge, unplug, turn off the water mains',
        'Πριν φύγεις: άδειασε το ψυγείο, βγάλε τις πρίζες, κλείσε τον γενικό του νερού',
      ],
      {
        when: { phase: ['leaving'], travel: AWAY, time: ['t20', 't30'] },
      },
    ),
    weekly(
      'plants',
      10,
      4,
      [
        'Arrange watering for the plants while you are away',
        'Κανόνισε ποιος θα ποτίζει τα φυτά όσο λείπεις',
      ],
      {
        when: { phase: ['leaving'], travel: AWAY },
      },
    ),
    weekly(
      'pet-sitter',
      15,
      5,
      ['Book a pet-sitter or boarding', 'Κλείσε κάποιον να προσέχει τα ζώα ή ξενοδοχείο ζώων'],
      {
        when: { who: ['pets'], travel: AWAY },
      },
    ),
    weekly(
      'neighbour',
      5,
      3,
      [
        'Ask a neighbour to keep an eye out and collect the post',
        'Ζήτα από έναν γείτονα να ρίχνει μια ματιά και να μαζεύει την αλληλογραφία',
      ],
      {
        when: { travel: AWAY },
      },
    ),

    kickoff('ko-cool-room', 15, 5, [
      'Pick the coolest room and make it your heatwave room',
      'Διάλεξε το πιο δροσερό δωμάτιο και κάν’ το «δωμάτιο του καύσωνα»',
    ]),
    kickoff('ko-numbers', 5, 4, [
      'Save 112 and your doctor’s number; switch on emergency alerts',
      'Αποθήκευσε το 112 και το τηλέφωνο του γιατρού σου· ενεργοποίησε τις ειδοποιήσεις έκτακτης ανάγκης',
    ]),
    kickoff('ko-bottle', 5, 3, [
      'Find a reusable water bottle you actually like',
      'Βρες ένα επαναχρησιμοποιούμενο μπουκάλι νερού που σου αρέσει',
    ]),
    kickoff(
      'ko-medicines',
      10,
      4,
      [
        'On regular medicines? Ask your doctor or pharmacist about the heat',
        'Παίρνεις φάρμακα τακτικά; Ρώτα τον γιατρό ή τον φαρμακοποιό σου για τη ζέστη',
      ],
      {
        when: { heat: ['hard'] },
        detail: [
          'Some medicines need extra care in hot weather — they can tell you what to watch for.',
          'Μερικά φάρμακα θέλουν προσοχή στη ζέστη — θα σου πουν τι να προσέχεις.',
        ],
      },
    ),

    monthly(
      'ac-service',
      30,
      4,
      [
        'Service the air conditioning before the heat',
        'Κάνε σέρβις στο κλιματιστικό πριν τις ζέστες',
      ],
      {
        when: { phase: ['early'] },
      },
    ),
    monthly(
      'travel-insurance',
      10,
      4,
      ['Travel insurance for the trip?', 'Ταξιδιωτική ασφάλιση για το ταξίδι;'],
      {
        when: { travel: ['abroad'] },
      },
    ),
    monthly('first-aid', 10, 3, [
      'Restock the first-aid kit: plasters, after-sun, bite cream',
      'Ανανέωσε το φαρμακείο: τσιρότα, after-sun, κρέμα για τσιμπήματα',
    ]),
    monthly('moles', 10, 3, [
      'Look over your skin: a new or changing mole goes to a dermatologist',
      'Κοίτα το δέρμα σου: μια καινούρια ή αλλαγμένη ελιά τη δείχνεις σε δερματολόγο',
    ]),
    monthly(
      'holiday-budget',
      15,
      3,
      ['Check the holiday budget', 'Έλεγξε τον προϋπολογισμό των διακοπών'],
      {
        when: { travel: AWAY },
      },
    ),
    monthly('review', 10, 2, [
      'What helped most in the heat? Keep it for next summer',
      'Τι βοήθησε πιο πολύ στη ζέστη; Κράτα το και για το επόμενο καλοκαίρι',
    ]),
  ],
)
