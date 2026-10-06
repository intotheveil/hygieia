// TASKS ADVISOR topic: car maintenance (P9 +8). Lazy chunk (./index.ts). Owner checks only — look,
// note, book; anything mechanical goes to a garage. Greek specifics: the KTEO inspection, road tax
// (τέλη κυκλοφορίας) and the legally required safety kit.
import { daily, kickoff, monthly, opt, question, topic, weekly } from './build.ts'
import { TOPICS } from './topics.ts'

export const carCare = topic(
  TOPICS['car-care'],
  [
    question(
      'use',
      'single',
      ['How often do you drive?', 'Πόσο συχνά οδηγείς;'],
      [
        opt('daily', ['Every day', 'Κάθε μέρα']),
        opt('often', ['A few times a week', 'Μερικές φορές την εβδομάδα']),
        opt('rare', ['Rarely', 'Σπάνια']),
      ],
    ),
    question(
      'age',
      'single',
      ['How old is the car?', 'Πόσο παλιό είναι το αυτοκίνητο;'],
      [
        opt('new', ['Under 4 years', 'Κάτω από 4 χρόνια']),
        opt('mid', ['4–10 years', '4–10 χρόνια']),
        opt('old', ['Over 10 years', 'Πάνω από 10 χρόνια']),
      ],
    ),
    question(
      'season',
      'single',
      ['Which season are you heading into?', 'Ποια εποχή έρχεται;'],
      [
        opt('summer', ['Summer', 'Καλοκαίρι']),
        opt('winter', ['Winter', 'Χειμώνας']),
        opt('mild', ['Spring or autumn', 'Άνοιξη ή φθινόπωρο']),
      ],
    ),
    question(
      'know',
      'single',
      ['How well do you know your car?', 'Πόσο καλά ξέρεις το αυτοκίνητό σου;'],
      [
        opt('none', ['Not at all', 'Καθόλου'], { gentle: true }),
        opt('basic', ['The basics', 'Τα βασικά']),
      ],
    ),
    question(
      'extras',
      'multi',
      ['Anything else?', 'Κάτι ακόμη;'],
      [
        opt('trips', ['Long trips coming up', 'Έρχονται μεγάλα ταξίδια']),
        opt('kids', ['Children ride with me', 'Μεταφέρω παιδιά']),
      ],
      ['Choose all that apply — or none.', 'Διάλεξε όσα ισχύουν — ή κανένα.'],
    ),
    question(
      'time',
      'single',
      ['How much time a day for the car?', 'Πόσο χρόνο τη μέρα έχεις για το αυτοκίνητο;'],
      [
        opt('t10', ['About 10 minutes', 'Περίπου 10 λεπτά'], { minutes: 10 }),
        opt('t20', ['About 20 minutes', 'Περίπου 20 λεπτά'], { minutes: 20 }),
        opt('t30', ['Half an hour', 'Μισή ώρα'], { minutes: 30 }),
      ],
    ),
  ],
  [
    daily(
      'walkaround',
      1,
      4,
      [
        'Quick walk-around before you drive: tyres, lights, leaks',
        'Γρήγορος γύρος πριν ξεκινήσεις: λάστιχα, φώτα, διαρροές',
      ],
      {
        when: { use: ['daily', 'often'] },
      },
    ),
    daily('dash', 1, 4, [
      'Glance at the dashboard warning lights at start-up',
      'Ρίξε μια ματιά στις ενδεικτικές λυχνίες του ταμπλό στην εκκίνηση',
    ]),
    daily(
      'kids-seat',
      1,
      5,
      ['Child seats buckled, straps snug', 'Παιδικά καθίσματα δεμένα, ζώνες σφιχτές'],
      {
        when: { extras: ['kids'] },
      },
    ),
    daily(
      'smooth',
      1,
      3,
      [
        'Drive smoothly: gentle starts and stops save fuel and brakes',
        'Οδήγησε ομαλά: ήπιο ξεκίνημα και φρενάρισμα γλιτώνουν καύσιμο και φρένα',
      ],
      {
        when: { use: ['daily'] },
      },
    ),
    daily('rubbish', 2, 2, [
      'Take the rubbish out of the car',
      'Βγάλε τα σκουπίδια από το αυτοκίνητο',
    ]),
    daily(
      'sunshade',
      1,
      3,
      [
        'Windscreen sunshade on, nothing heat-sensitive left inside',
        'Βάλε ηλιοπροστασία στο παρμπρίζ, μην αφήνεις μέσα ό,τι χαλάει με τη ζέστη',
      ],
      {
        when: { season: ['summer'] },
      },
    ),

    weekly(
      'run',
      15,
      6,
      [
        'Drive for 15 minutes or more so the battery charges',
        'Οδήγησε 15 λεπτά ή περισσότερο για να φορτίσει η μπαταρία',
      ],
      {
        when: { use: ['rare'], time: ['t20', 't30'] },
      },
    ),
    weekly('tyre-look', 5, 4, [
      'Look at all four tyres: cuts, bulges, nails',
      'Κοίτα και τα τέσσερα λάστιχα: σκισίματα, φουσκώματα, καρφιά',
    ]),
    weekly(
      'fuel',
      5,
      3,
      [
        'Fill up before the tank drops below a quarter',
        'Βάλε καύσιμο πριν πέσει κάτω από το ένα τέταρτο',
      ],
      {
        when: { use: ['daily', 'often'] },
      },
    ),
    weekly('windows', 10, 3, [
      'Clean the windscreen, mirrors and lights',
      'Καθάρισε παρμπρίζ, καθρέφτες και φανάρια',
    ]),
    weekly('washer', 2, 3, [
      'Top up the screenwash',
      'Συμπλήρωσε υγρό στο δοχείο των υαλοκαθαριστήρων',
    ]),
    weekly('inside', 15, 3, ['Vacuum and wipe the inside', 'Σκούπισε και ξεσκόνισε το εσωτερικό'], {
      when: { time: ['t20', 't30'] },
    }),
    weekly(
      'back-seats',
      10,
      3,
      [
        'Clear crumbs and toys from the back seats',
        'Μάζεψε ψίχουλα και παιχνίδια από τα πίσω καθίσματα',
      ],
      {
        when: { extras: ['kids'] },
      },
    ),
    weekly(
      'wash',
      20,
      2,
      ['Wash the car, or take it to a car wash', 'Πλύνε το αυτοκίνητο ή πήγαινέ το στο πλυντήριο'],
      {
        when: { time: ['t20', 't30'] },
        day: 'sat',
      },
    ),
    weekly(
      'manual',
      10,
      4,
      [
        'Learn one page of the owner’s manual: start with the warning lights',
        'Μάθε μία σελίδα από το εγχειρίδιο: ξεκίνα από τις ενδεικτικές λυχνίες',
      ],
      {
        when: { know: ['none'] },
      },
    ),
    weekly(
      'pre-trip',
      15,
      4,
      [
        'Before a long trip: tyres, oil, water, lights',
        'Πριν από μεγάλο ταξίδι: λάστιχα, λάδια, νερά, φώτα',
      ],
      {
        when: { extras: ['trips'], time: ['t20', 't30'] },
        day: 'fri',
      },
    ),
    weekly(
      'noises',
      2,
      3,
      [
        'Note any new noise, smell or vibration for the garage',
        'Σημείωσε κάθε καινούριο θόρυβο, μυρωδιά ή κραδασμό για το συνεργείο',
      ],
      {
        when: { age: ['mid', 'old'] },
      },
    ),

    kickoff('ko-dates', 10, 5, [
      'Put the insurance, road tax and KTEO dates in your calendar',
      'Βάλε στο ημερολόγιο τις ημερομηνίες ασφάλειας, τελών κυκλοφορίας και ΚΤΕΟ',
    ]),
    kickoff('ko-glovebox', 10, 4, [
      'Glovebox check: registration, insurance, roadside assistance number',
      'Έλεγχος ντουλαπιού: άδεια κυκλοφορίας, ασφάλεια, τηλέφωνο οδικής βοήθειας',
    ]),
    kickoff('ko-pressure', 5, 4, [
      'Find the tyre-pressure sticker (driver’s door or fuel flap)',
      'Βρες το αυτοκόλλητο με τις πιέσεις των ελαστικών (πόρτα οδηγού ή τάπα καυσίμου)',
    ]),
    kickoff('ko-garage', 10, 3, [
      'Find a garage you trust and save its number',
      'Βρες ένα συνεργείο που εμπιστεύεσαι και αποθήκευσε το τηλέφωνο',
    ]),

    monthly('pressure', 10, 5, [
      'Check tyre pressure with cold tyres, including the spare',
      'Έλεγξε την πίεση των ελαστικών με κρύα λάστιχα, και της ρεζέρβας',
    ]),
    monthly('oil', 5, 5, [
      'Check the oil level: level ground, engine cold',
      'Έλεγξε τη στάθμη του λαδιού: σε επίπεδο έδαφος, με κρύα μηχανή',
    ]),
    monthly(
      'kteo',
      5,
      5,
      [
        'KTEO: when is the inspection due? Book it early',
        'ΚΤΕΟ: πότε λήγει ο τεχνικός έλεγχος; Κλείσε ραντεβού νωρίς',
      ],
      {
        when: { age: ['mid', 'old'] },
      },
    ),
    monthly(
      'kteo-first',
      5,
      4,
      [
        'Note the first KTEO: four years after first registration',
        'Σημείωσε το πρώτο ΚΤΕΟ: τέσσερα χρόνια μετά την πρώτη ταξινόμηση',
      ],
      {
        when: { age: ['new'] },
      },
    ),
    monthly(
      'service',
      10,
      5,
      [
        'Service due? Check the kilometres and date in the service book',
        'Έρχεται σέρβις; Δες χιλιόμετρα και ημερομηνία στο βιβλίο σέρβις',
      ],
      {
        when: { age: ['mid', 'old'] },
      },
    ),
    monthly(
      'warranty',
      10,
      4,
      ['Keep the warranty services on schedule', 'Κράτα τα σέρβις της εγγύησης στην ώρα τους'],
      {
        when: { age: ['new'] },
      },
    ),
    monthly(
      'ac',
      10,
      4,
      [
        'Run the A/C: does it cool? Service it before the heat if not',
        'Δοκίμασε το κλιματιστικό: κρυώνει; Αν όχι, σέρβις πριν τη ζέστη',
      ],
      {
        when: { season: ['summer'] },
      },
    ),
    monthly(
      'coolant',
      5,
      4,
      [
        'Check coolant and brake fluid levels — never open a hot engine',
        'Έλεγξε τη στάθμη ψυκτικού και υγρού φρένων — ποτέ με ζεστή μηχανή',
      ],
      {
        when: { season: ['summer'] },
      },
    ),
    monthly(
      'battery',
      5,
      4,
      [
        'Check the battery terminals for corrosion',
        'Έλεγξε τους πόλους της μπαταρίας για οξείδωση',
      ],
      {
        when: { season: ['winter'] },
      },
    ),
    monthly(
      'wipers',
      10,
      4,
      ['Replace worn wiper blades before the rains', 'Άλλαξε τα φθαρμένα μάκτρα πριν τις βροχές'],
      {
        when: { season: ['winter'] },
      },
    ),
    monthly(
      'tread',
      5,
      4,
      [
        'Check the tread depth: at least 1.6 mm, better 3 mm',
        'Έλεγξε το πέλμα: τουλάχιστον 1,6 χιλ., καλύτερα 3 χιλ.',
      ],
      {
        when: { season: ['mild'] },
      },
    ),
    monthly(
      'lights',
      5,
      4,
      [
        'Check every light with a helper: brakes, indicators, headlights',
        'Έλεγξε όλα τα φώτα με βοηθό: στοπ, φλας, μεσαία, μεγάλα',
      ],
      {
        when: { season: ['mild'] },
      },
    ),
    monthly(
      'kit',
      5,
      4,
      [
        'Safety kit: triangle, first-aid kit, fire extinguisher (check its date)',
        'Εξοπλισμός ασφαλείας: τρίγωνο, φαρμακείο, πυροσβεστήρας (δες τη λήξη του)',
      ],
      {
        when: { extras: ['trips'] },
      },
    ),
  ],
)
