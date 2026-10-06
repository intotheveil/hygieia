// TASKS ADVISOR topic: plants, balcony and garden (P9 +8). Lazy chunk (./index.ts). Watering is by
// SEASON for a Greek climate (hot dry summers, mild wet winters): daily in the summer heat, early or
// late; rarely in winter. Fertiliser follows the label — no doses here.
import { daily, kickoff, monthly, opt, question, topic, weekly } from './build.ts'
import { TOPICS } from './topics.ts'

export const plantsGarden = topic(
  TOPICS['plants-garden'],
  [
    question(
      'where',
      'multi',
      ['Where are your plants?', 'Πού είναι τα φυτά σου;'],
      [
        opt('indoor', ['Indoors', 'Μέσα στο σπίτι']),
        opt('balcony', ['On a balcony or terrace', 'Σε μπαλκόνι ή ταράτσα']),
        opt('garden', ['In a garden', 'Σε κήπο']),
      ],
      ['Choose all that apply.', 'Διάλεξε όσα ισχύουν.'],
    ),
    question(
      'season',
      'single',
      ['What season is it now?', 'Τι εποχή έχουμε τώρα;'],
      [
        opt('spring', ['Spring (March–May)', 'Άνοιξη (Μάρτιος–Μάιος)']),
        opt('summer', ['Summer (June–September)', 'Καλοκαίρι (Ιούνιος–Σεπτέμβριος)']),
        opt('autumn', ['Autumn (October–November)', 'Φθινόπωρο (Οκτώβριος–Νοέμβριος)']),
        opt('winter', ['Winter (December–February)', 'Χειμώνας (Δεκέμβριος–Φεβρουάριος)']),
      ],
    ),
    question(
      'grow',
      'multi',
      ['What do you grow?', 'Τι καλλιεργείς;'],
      [
        opt('herbs', ['Herbs', 'Αρωματικά']),
        opt('veg', ['Vegetables', 'Λαχανικά']),
        opt('flowers', ['Flowers', 'Λουλούδια']),
      ],
      ['Choose all that apply — or none.', 'Διάλεξε όσα ισχύουν — ή κανένα.'],
    ),
    question(
      'level',
      'single',
      ['How experienced are you?', 'Πόση εμπειρία έχεις;'],
      [
        opt(
          'new',
          ['Beginner — plants tend to die on me', 'Αρχάριος/α — τα φυτά μού ξεραίνονται'],
          {
            gentle: true,
          },
        ),
        opt('some', ['I know the basics', 'Ξέρω τα βασικά']),
      ],
    ),
    question(
      'time',
      'single',
      ['How much time a day for your plants?', 'Πόσο χρόνο τη μέρα έχεις για τα φυτά;'],
      [
        opt('t10', ['About 10 minutes', 'Περίπου 10 λεπτά'], { minutes: 10 }),
        opt('t20', ['About 20 minutes', 'Περίπου 20 λεπτά'], { minutes: 20 }),
        opt('t30', ['Half an hour or more', 'Μισή ώρα ή περισσότερο'], { minutes: 30 }),
      ],
    ),
  ],
  [
    daily(
      'summer-water',
      10,
      6,
      [
        'Water pots early in the morning or after sunset',
        'Πότισε τις γλάστρες νωρίς το πρωί ή μετά τη δύση',
      ],
      {
        when: { season: ['summer'], where: ['balcony', 'garden'] },
        detail: [
          'Never at midday: water evaporates and wet leaves can scorch.',
          'Ποτέ το μεσημέρι: το νερό εξατμίζεται και τα βρεγμένα φύλλα καίγονται.',
        ],
      },
    ),
    daily('finger-test', 2, 5, [
      'Finger test: water only if the top 2–3 cm of soil are dry',
      'Τεστ με το δάχτυλο: πότισε μόνο αν τα πάνω 2–3 εκ. του χώματος είναι στεγνά',
    ]),
    daily(
      'heat-shade',
      2,
      4,
      [
        'Heatwave: move pots into shade or cover the sunny side',
        'Καύσωνας: πήγαινε τις γλάστρες στη σκιά ή σκέπασε την ηλιόλουστη πλευρά',
      ],
      {
        when: { season: ['summer'], where: ['balcony'] },
      },
    ),
    daily('harvest', 5, 4, ['Pick what is ripe', 'Μάζεψε ό,τι ωρίμασε'], {
      when: { grow: ['veg'], season: ['summer'] },
    }),
    daily(
      'herb-tips',
      2,
      3,
      [
        'Pinch a few herb tips — it keeps them bushy',
        'Κόψε μερικές κορυφές από τα αρωματικά — έτσι πυκνώνουν',
      ],
      {
        when: { grow: ['herbs'], season: ['spring', 'summer'] },
      },
    ),
    daily('deadhead', 5, 3, ['Remove faded flowers', 'Κόψε τα μαραμένα λουλούδια'], {
      when: { grow: ['flowers'], season: ['spring', 'summer'] },
    }),
    daily('pest-look', 2, 3, [
      'Look under a few leaves for pests',
      'Κοίτα κάτω από μερικά φύλλα για έντομα',
    ]),

    weekly(
      'water-indoor',
      10,
      5,
      ['Water the houseplants that need it', 'Πότισε τα φυτά του σπιτιού που το χρειάζονται'],
      {
        when: { where: ['indoor'] },
        times: 2,
      },
    ),
    weekly(
      'water-mild',
      10,
      5,
      [
        'Water pots and beds deeply, then let them dry a little',
        'Πότισε βαθιά γλάστρες και παρτέρια και άφησέ τα να στεγνώσουν λίγο',
      ],
      {
        when: { season: ['spring', 'autumn'], where: ['balcony', 'garden'] },
        times: 3,
      },
    ),
    weekly(
      'water-winter',
      5,
      4,
      [
        'Winter: water outdoor pots only if dry — the rain often does it',
        'Χειμώνας: πότισε τις γλάστρες έξω μόνο αν είναι στεγνές — συχνά φτάνει η βροχή',
      ],
      {
        when: { season: ['winter'], where: ['balcony', 'garden'] },
      },
    ),
    weekly(
      'deep-beds',
      20,
      5,
      [
        'Deep-water the garden beds at the roots, not the leaves',
        'Βαθύ πότισμα στα παρτέρια, στη ρίζα και όχι στα φύλλα',
      ],
      {
        when: { season: ['summer'], where: ['garden'], time: ['t20', 't30'] },
        times: 3,
      },
    ),
    weekly(
      'feed',
      10,
      4,
      [
        'Feed with a liquid fertiliser, following the label',
        'Λίπανε με υγρό λίπασμα, όπως λέει η ετικέτα',
      ],
      {
        when: { season: ['spring', 'summer'] },
      },
    ),
    weekly(
      'saucers',
      5,
      3,
      [
        'Empty standing water from saucers (mosquitoes)',
        'Άδειασε το νερό που μένει στα πιατάκια (κουνούπια)',
      ],
      {
        when: { where: ['balcony', 'garden'], season: ['spring', 'summer', 'autumn'] },
      },
    ),
    weekly(
      'sweep',
      10,
      3,
      ['Sweep the balcony and clear dead leaves', 'Σκούπισε το μπαλκόνι και μάζεψε τα ξερά φύλλα'],
      {
        when: { where: ['balcony'] },
      },
    ),
    weekly('weed', 15, 4, ['Weed one bed', 'Βοτάνισε ένα παρτέρι'], {
      when: { where: ['garden'], season: ['spring', 'summer', 'autumn'] },
    }),
    weekly('tie-up', 10, 3, ['Tie up tomatoes and climbers', 'Δέσε ντομάτες και αναρριχώμενα'], {
      when: { grow: ['veg'], season: ['spring', 'summer'] },
    }),
    weekly(
      'sow',
      15,
      4,
      ['Sow or plant one new pot or row', 'Σπείρε ή φύτεψε μια καινούρια γλάστρα ή σειρά'],
      {
        when: { grow: ['veg', 'herbs', 'flowers'], season: ['spring', 'autumn'] },
        detail: [
          'Spring: tomatoes, courgettes, basil. Autumn: lettuce, spinach, onions, parsley.',
          'Άνοιξη: ντομάτες, κολοκυθάκια, βασιλικός. Φθινόπωρο: μαρούλι, σπανάκι, κρεμμύδια, μαϊντανός.',
        ],
      },
    ),
    weekly(
      'herb-trim',
      10,
      3,
      [
        'Trim herbs and dry or freeze the extra',
        'Κλάδεψε τα αρωματικά και αποξήρανε ή κατέψυξε τα περισσευούμενα',
      ],
      {
        when: { grow: ['herbs'] },
      },
    ),
    weekly('dust', 10, 2, ['Wipe the dust off large leaves', 'Ξεσκόνισε τα μεγάλα φύλλα'], {
      when: { where: ['indoor'] },
    }),
    weekly(
      'turn',
      2,
      3,
      [
        'Turn indoor pots a quarter turn towards the light',
        'Γύρισε τις γλάστρες του σπιτιού ένα τέταρτο προς το φως',
      ],
      {
        when: { where: ['indoor'] },
      },
    ),
    weekly(
      'radiators',
      2,
      3,
      [
        'Keep indoor plants away from radiators and heaters',
        'Κράτα τα φυτά του σπιτιού μακριά από καλοριφέρ και θερμάστρες',
      ],
      {
        when: { where: ['indoor'], season: ['winter'] },
      },
    ),
    weekly(
      'wind',
      5,
      3,
      [
        'Windy forecast? Secure tall pots, move light ones to the wall',
        'Προβλέπεται αέρας; Στερέωσε τις ψηλές γλάστρες, φέρε τις ελαφριές στον τοίχο',
      ],
      {
        when: { where: ['balcony'], season: ['autumn', 'winter'] },
        day: 'mon',
      },
    ),
    weekly(
      'frost',
      5,
      3,
      [
        'Cold night forecast? Cover tender plants or bring them in',
        'Προβλέπεται κρύα νύχτα; Σκέπασε τα ευαίσθητα φυτά ή βάλ’ τα μέσα',
      ],
      {
        when: { where: ['balcony', 'garden'], season: ['winter'] },
      },
    ),
    weekly(
      'compost',
      10,
      3,
      [
        'Add kitchen scraps to the compost and turn it',
        'Ρίξε υπολείμματα κουζίνας στην κομποστοποίηση και ανακάτεψε',
      ],
      {
        when: { where: ['garden'] },
      },
    ),
    weekly(
      'learn',
      10,
      3,
      [
        'Learn one plant’s needs: light, water, soil',
        'Μάθε τι χρειάζεται ένα φυτό: φως, νερό, χώμα',
      ],
      {
        when: { level: ['new'] },
      },
    ),

    kickoff('ko-list', 10, 5, [
      'List your plants and where each one sits',
      'Κάνε λίστα με τα φυτά σου και πού βρίσκεται το καθένα',
    ]),
    kickoff('ko-drain', 15, 4, [
      'Check every pot has a drainage hole',
      'Έλεγξε ότι κάθε γλάστρα έχει τρύπα αποστράγγισης',
    ]),
    kickoff('ko-light', 10, 4, [
      'Note which spots get morning, afternoon or no sun',
      'Σημείωσε ποια σημεία έχουν πρωινό, απογευματινό ή καθόλου ήλιο',
    ]),
    kickoff('ko-tools', 10, 3, [
      'Gather the basics: watering can, secateurs, gloves',
      'Μάζεψε τα βασικά: ποτιστήρι, κλαδευτήρι, γάντια',
    ]),

    monthly(
      'auto-water',
      20,
      5,
      [
        'Away in summer? Set up drip watering or ask a neighbour',
        'Λείπεις το καλοκαίρι; Βάλε σταγονίδια ή ζήτα από έναν γείτονα να ποτίζει',
      ],
      {
        when: { season: ['summer'], where: ['balcony', 'garden'] },
      },
    ),
    monthly(
      'repot',
      30,
      4,
      ['Repot one plant that has outgrown its pot', 'Άλλαξε γλάστρα σε ένα φυτό που στένεψε'],
      {
        when: { season: ['spring', 'autumn'] },
      },
    ),
    monthly(
      'prune',
      30,
      4,
      [
        'Prune roses and shrubs in late winter',
        'Κλάδεψε τριανταφυλλιές και θάμνους στο τέλος του χειμώνα',
      ],
      {
        when: { season: ['winter'], where: ['balcony', 'garden'] },
      },
    ),
    monthly('top-soil', 15, 3, [
      'Top up pots with fresh soil',
      'Συμπλήρωσε φρέσκο χώμα στις γλάστρες',
    ]),
    monthly('plan', 15, 3, [
      'Plan next season: what to sow or plant',
      'Σχεδίασε την επόμενη εποχή: τι θα σπείρεις ή θα φυτέψεις',
    ]),
    monthly('tools', 15, 2, ['Clean and sharpen your tools', 'Καθάρισε και ακόνισε τα εργαλεία']),
  ],
)
