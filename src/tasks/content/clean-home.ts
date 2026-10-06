// TASKS ADVISOR topic: clean home, kept clean (P9). Lazy chunk (./index.ts).
import { daily, kickoff, monthly, opt, question, topic, weekly } from './build.ts'
import { TOPICS } from './topics.ts'

const SMALL = { size: ['studio', 'small'] }
const BIGGER = { size: ['small', 'large'] }
const LARGE = { size: ['large'] }

export const cleanHome = topic(
  TOPICS['clean-home'],
  [
    question(
      'size',
      'single',
      ['How big is your home?', 'Πόσο μεγάλο είναι το σπίτι σου;'],
      [
        opt('studio', ['Studio or one room', 'Γκαρσονιέρα ή ένα δωμάτιο']),
        opt('small', ['1–2 bedrooms', '1–2 υπνοδωμάτια']),
        opt('large', ['3 or more bedrooms', '3 ή περισσότερα υπνοδωμάτια']),
      ],
    ),
    question(
      'household',
      'multi',
      ['Who shares your home?', 'Με ποιους μοιράζεσαι το σπίτι;'],
      [
        opt('partner', ['A partner', 'Σύντροφος']),
        opt('kids', ['Kids', 'Παιδιά']),
        opt('pets', ['Pets', 'Κατοικίδια']),
        opt('roommates', ['Roommates', 'Συγκάτοικοι']),
      ],
      [
        'Choose all that apply — or none if you live alone.',
        'Διάλεξε όσα ισχύουν — ή κανένα αν μένεις μόνος/η.',
      ],
    ),
    question(
      'time',
      'single',
      [
        'How much time can you give it on a normal day?',
        'Πόσο χρόνο μπορείς να διαθέσεις μια συνηθισμένη μέρα;',
      ],
      [
        opt('t15', ['About 15 minutes', 'Περίπου 15 λεπτά'], { minutes: 15 }),
        opt('t30', ['About 30 minutes', 'Περίπου 30 λεπτά'], { minutes: 30 }),
        opt('t45', ['About 45 minutes', 'Περίπου 45 λεπτά'], { minutes: 45 }),
      ],
    ),
    question(
      'style',
      'single',
      ['How do you prefer to clean?', 'Πώς προτιμάς να καθαρίζεις;'],
      [
        opt('daily', ['A little every day', 'Λίγο κάθε μέρα']),
        opt('weekly', [
          'Bigger sessions a few times a week',
          'Μεγαλύτερες «φουρνιές» λίγες φορές την εβδομάδα',
        ]),
      ],
    ),
    question(
      'state',
      'single',
      ['Honestly, how is the house right now?', 'Ειλικρινά, πώς είναι το σπίτι τώρα;'],
      [
        opt('tidy', ['Mostly tidy', 'Γενικά συμμαζεμένο']),
        opt('messy', ['A bit messy', 'Λίγο ακατάστατο'], { gentle: true }),
        opt(
          'chaotic',
          ['Chaotic — I do not know where to start', 'Χάος — δεν ξέρω από πού να αρχίσω'],
          { gentle: true },
        ),
      ],
    ),
  ],
  [
    // daily resets
    daily('make-bed', 2, 5, ['Make the bed', 'Στρώσε το κρεβάτι']),
    daily(
      'dishes',
      10,
      5,
      ['Wash up or load the dishwasher', 'Πλύνε τα πιάτα ή φόρτωσε το πλυντήριο πιάτων'],
      {
        detail: [
          'Nothing waits in the sink overnight.',
          'Τίποτα δεν μένει στον νεροχύτη το βράδυ.',
        ],
      },
    ),
    daily('counters', 5, 4, [
      'Wipe the kitchen counters and the table',
      'Σκούπισε τους πάγκους της κουζίνας και το τραπέζι',
    ]),
    weekly('reset-10', 10, 4, ['Ten-minute evening reset', 'Δεκάλεπτο βραδινό συμμάζεμα'], {
      when: { style: ['daily'] },
      times: 3,
      detail: [
        'Set a timer and put things back where they live.',
        'Βάλε χρονόμετρο και γύρνα τα πράγματα στη θέση τους.',
      ],
    }),
    weekly(
      'reset-5',
      5,
      3,
      ['Five-minute tidy of the living room', 'Πεντάλεπτο συμμάζεμα στο σαλόνι'],
      { times: 3 },
    ),
    daily('clothes-away', 3, 3, [
      'Put away the clothes lying around',
      'Μάζεψε τα ρούχα που είναι πεταμένα',
    ]),
    weekly(
      'kitchen-sweep',
      5,
      3,
      ['Quick sweep of the kitchen floor', 'Γρήγορο σκούπισμα στο πάτωμα της κουζίνας'],
      {
        when: { household: ['kids', 'pets', 'partner', 'roommates'] },
        times: 3,
      },
    ),
    weekly('entry', 2, 3, [
      'Line up the shoes and bags at the door',
      'Τακτοποίησε παπούτσια και τσάντες στην είσοδο',
    ]),
    daily('air', 2, 4, ['Open the windows for a few minutes', 'Άνοιξε τα παράθυρα για λίγα λεπτά']),
    daily(
      'toys',
      5,
      5,
      ['Toy tidy-up with the kids before bed', 'Μαζεύουμε τα παιχνίδια με τα παιδιά πριν τον ύπνο'],
      {
        when: { household: ['kids'] },
      },
    ),
    daily(
      'pet-bowls',
      3,
      5,
      ['Wash and refill the pet bowls', 'Πλύνε και γέμισε τα μπολ του κατοικίδιου'],
      {
        when: { household: ['pets'] },
      },
    ),
    daily(
      'litter',
      5,
      5,
      [
        'Scoop the litter or clean up after the pet',
        'Καθάρισε την άμμο ή ό,τι άφησε το κατοικίδιο',
      ],
      {
        when: { household: ['pets'] },
      },
    ),
    daily(
      'bathroom-wipe',
      3,
      4,
      ['Quick wipe of the bathroom sink', 'Γρήγορο σκούπισμα στον νιπτήρα του μπάνιου'],
      {
        when: { style: ['daily'] },
      },
    ),

    // weekly jobs
    weekly(
      'vacuum-small',
      20,
      5,
      ['Vacuum all the floors', 'Σκούπισε με την ηλεκτρική σκούπα όλα τα πατώματα'],
      {
        when: SMALL,
        day: 'sat',
      },
    ),
    weekly(
      'vacuum-large',
      25,
      5,
      ['Vacuum all the floors', 'Σκούπισε με την ηλεκτρική σκούπα όλα τα πατώματα'],
      {
        when: LARGE,
        day: 'sat',
      },
    ),
    weekly(
      'vacuum-main',
      10,
      4,
      ['Vacuum the main living area', 'Σκούπισε το σαλόνι και τους κοινόχρηστους χώρους'],
      {
        when: { time: ['t15'] },
      },
    ),
    weekly('mop', 20, 4, ['Mop the floors', 'Σφουγγάρισε τα πατώματα'], {
      when: BIGGER,
      day: 'sun',
    }),
    weekly('mop-studio', 10, 4, ['Mop the floor', 'Σφουγγάρισε το πάτωμα'], {
      when: { size: ['studio'] },
    }),
    weekly(
      'bathroom-full',
      25,
      5,
      [
        'Clean the bathroom: toilet, sink, shower, mirror',
        'Καθάρισε το μπάνιο: λεκάνη, νιπτήρα, ντουζιέρα, καθρέφτη',
      ],
      {
        when: { time: ['t30', 't45'] },
        day: 'wed',
      },
    ),
    weekly(
      'toilet',
      10,
      5,
      ['Clean the toilet and the sink', 'Καθάρισε τη λεκάνη και τον νιπτήρα'],
      {
        when: { time: ['t15'] },
      },
    ),
    weekly('shower', 10, 4, ['Scrub the shower or bath', 'Τρίψε τη ντουζιέρα ή την μπανιέρα'], {
      when: { time: ['t15'] },
    }),
    weekly('second-bathroom', 15, 4, ['Clean the second bathroom', 'Καθάρισε το δεύτερο μπάνιο'], {
      when: LARGE,
    }),
    weekly('sheets', 15, 4, ['Change the bed sheets', 'Άλλαξε τα σεντόνια'], { day: 'sun' }),
    weekly(
      'laundry',
      10,
      5,
      ['Run a load of laundry and hang it', 'Βάλε ένα πλυντήριο ρούχων και άπλωσέ το'],
      {
        times: 2,
      },
    ),
    weekly('laundry-extra', 10, 4, ['One more load of laundry', 'Ένα ακόμη πλυντήριο ρούχων'], {
      when: { household: ['kids', 'partner'] },
    }),
    weekly(
      'fold',
      10,
      3,
      ['Fold and put away the clean laundry', 'Δίπλωσε και μάζεψε τα καθαρά ρούχα'],
      { times: 2 },
    ),
    weekly(
      'dust',
      15,
      3,
      ['Dust shelves, surfaces and the TV', 'Ξεσκόνισε ράφια, επιφάνειες και την τηλεόραση'],
      {
        when: { time: ['t30', 't45'] },
      },
    ),
    weekly('dust-quick', 5, 3, ['Quick dust of the living room', 'Γρήγορο ξεσκόνισμα στο σαλόνι'], {
      when: { time: ['t15'] },
    }),
    weekly('stove', 10, 4, [
      'Degrease the hob and the cooker hood',
      'Καθάρισε τις εστίες και τον απορροφητήρα',
    ]),
    weekly('appliances', 10, 3, [
      'Wipe the fronts of the appliances',
      'Σκούπισε εξωτερικά τις συσκευές της κουζίνας',
    ]),
    weekly(
      'fridge-check',
      5,
      3,
      ['Clear out old food from the fridge', 'Πέτα ό,τι έχει λήξει στο ψυγείο'],
      { day: 'thu' },
    ),
    weekly('mirrors', 10, 3, [
      'Clean mirrors and glass doors',
      'Καθάρισε καθρέφτες και τζάμια στις πόρτες',
    ]),
    weekly('recycling', 5, 3, ['Take out the recycling', 'Βγάλε την ανακύκλωση']),
    weekly('towels', 5, 4, ['Swap the towels for fresh ones', 'Άλλαξε τις πετσέτες με καθαρές']),
    weekly(
      'kids-room',
      15,
      4,
      ['Reset the kids’ room together', 'Συμμαζεύουμε μαζί το παιδικό δωμάτιο'],
      {
        when: { household: ['kids'] },
      },
    ),
    weekly(
      'pet-hair',
      10,
      4,
      [
        'Vacuum pet hair off sofas and rugs',
        'Μάζεψε τις τρίχες του κατοικίδιου από καναπέ και χαλιά',
      ],
      {
        when: { household: ['pets'] },
        times: 2,
      },
    ),
    weekly(
      'pet-bed',
      5,
      4,
      ['Shake out and air the pet bed', 'Τίναξε και άερισε το κρεβατάκι του κατοικίδιου'],
      {
        when: { household: ['pets'] },
      },
    ),
    weekly(
      'chores-talk',
      10,
      3,
      [
        'Ten minutes to share out the week’s chores',
        'Δέκα λεπτά για να μοιράσετε τις δουλειές της εβδομάδας',
      ],
      {
        when: { household: ['partner', 'roommates'] },
        day: 'sun',
      },
    ),
    weekly(
      'hall-stairs',
      15,
      4,
      ['Hallways and stairs: sweep and wipe', 'Διάδρομοι και σκάλες: σκούπισμα και σφουγγάρισμα'],
      {
        when: LARGE,
      },
    ),
    weekly(
      'bedrooms',
      15,
      3,
      ['Tidy and dust the bedrooms', 'Συμμάζεψε και ξεσκόνισε τα υπνοδωμάτια'],
      { when: BIGGER },
    ),
    weekly(
      'power-session',
      35,
      6,
      ['Power session: one room top to bottom', 'Γενική σε ένα δωμάτιο, από πάνω ως κάτω'],
      {
        when: { style: ['weekly'], time: ['t45'] },
        times: 2,
      },
    ),
    weekly(
      'half-session',
      20,
      4,
      ['Twenty-minute focused clean of one room', 'Εικοσάλεπτο καθάρισμα σε ένα δωμάτιο'],
      {
        when: { style: ['weekly'], time: ['t30', 't45'] },
        times: 2,
      },
    ),
    weekly('door-handles', 5, 3, [
      'Wipe door handles and light switches',
      'Σκούπισε πόμολα και διακόπτες',
    ]),
    // kick-off (gentle start, week 1)
    kickoff('ko-bag', 5, 5, [
      'Fill one bag with rubbish and take it out',
      'Γέμισε μία σακούλα με σκουπίδια και βγάλ’ την',
    ]),
    kickoff('ko-sink', 10, 5, [
      'Empty the sink completely, once',
      'Άδειασε εντελώς τον νεροχύτη, μία φορά',
    ]),
    kickoff('ko-counter', 10, 4, [
      'Clear one kitchen counter end to end',
      'Άδειασε έναν πάγκο της κουζίνας από άκρη σε άκρη',
    ]),
    kickoff(
      'ko-floor',
      15,
      4,
      ['Clear the floor of one room', 'Ελευθέρωσε το πάτωμα ενός δωματίου'],
      {
        when: { state: ['chaotic'] },
      },
    ),
    kickoff(
      'ko-laundry',
      20,
      4,
      [
        'One load of laundry, start to finish: wash, dry, fold',
        'Ένα πλυντήριο από την αρχή ως το τέλος: πλύσιμο, άπλωμα, δίπλωμα',
      ],
      {
        when: { time: ['t30', 't45'] },
      },
    ),
    kickoff(
      'ko-caddy',
      10,
      3,
      ['Put your cleaning products in one basket', 'Μάζεψε τα καθαριστικά σου σε ένα καλάθι'],
      {
        detail: [
          'One grab-and-go basket makes every job quicker.',
          'Ένα καλάθι «πιάσ’ το και πάμε» κάνει κάθε δουλειά πιο γρήγορη.',
        ],
      },
    ),
    kickoff('ko-hotspot', 5, 3, [
      'Pick the one spot that annoys you most and clear it',
      'Διάλεξε το σημείο που σε ενοχλεί πιο πολύ και άδειασέ το',
    ]),

    // monthly
    monthly(
      'fridge-deep',
      30,
      4,
      ['Clean the fridge inside, shelf by shelf', 'Καθάρισε το ψυγείο μέσα, ράφι-ράφι'],
      {
        when: { time: ['t45'] },
      },
    ),
    monthly('fridge-shelf', 10, 3, ['Clean two fridge shelves', 'Καθάρισε δύο ράφια του ψυγείου']),
    monthly('oven', 40, 4, ['Clean the oven', 'Καθάρισε τον φούρνο'], { when: { time: ['t45'] } }),
    monthly('microwave', 5, 3, [
      'Steam-clean the microwave',
      'Καθάρισε τον φούρνο μικροκυμάτων με ατμό',
    ]),
    monthly('windows', 20, 3, ['Wash the windows of one room', 'Πλύνε τα τζάμια ενός δωματίου'], {
      when: { time: ['t30', 't45'] },
    }),
    monthly('kettle', 10, 2, [
      'Descale the kettle and the coffee maker',
      'Ξεπλύνε από τα άλατα βραστήρα και καφετιέρα',
    ]),
    monthly('washing-machine', 10, 2, [
      'Clean the washing machine seal and drawer',
      'Καθάρισε το λάστιχο και τη θήκη του πλυντηρίου ρούχων',
    ]),
    monthly('skirting', 20, 3, [
      'Dust skirting boards and door frames',
      'Ξεσκόνισε σοβατεπί και κάσες',
    ]),
    monthly(
      'mattress',
      20,
      3,
      ['Vacuum the mattress and turn it', 'Σκούπισε το στρώμα και γύρισέ το'],
      { when: { time: ['t30', 't45'] } },
    ),
    monthly(
      'pet-wash',
      15,
      3,
      ['Wash the pet bed and toys', 'Πλύνε το κρεβατάκι και τα παιχνίδια του κατοικίδιου'],
      {
        when: { household: ['pets'] },
      },
    ),
    monthly('filters', 10, 2, [
      'Clean the cooker hood filter',
      'Καθάρισε το φίλτρο του απορροφητήρα',
    ]),
  ],
)
