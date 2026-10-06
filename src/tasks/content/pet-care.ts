// TASKS ADVISOR topic: pet care (P9 +8). Lazy chunk (./index.ts). Care routine only — parasite
// protection, vaccines and anything health-related follow the vet's advice; no product doses here.
import { daily, kickoff, monthly, opt, question, topic, weekly } from './build.ts'
import { TOPICS } from './topics.ts'

export const petCare = topic(
  TOPICS['pet-care'],
  [
    question(
      'pets',
      'multi',
      ['Which pets live with you?', 'Ποια κατοικίδια ζουν μαζί σας;'],
      [
        opt('dog', ['Dog', 'Σκύλος']),
        opt('cat', ['Cat', 'Γάτα']),
        opt('small', ['Small pet: rabbit, hamster, bird', 'Μικρό ζώο: κουνέλι, χάμστερ, πουλί']),
      ],
      ['Choose all that apply.', 'Διάλεξε όσα ισχύουν.'],
    ),
    question(
      'settled',
      'single',
      ['How long have you had them?', 'Πόσο καιρό είναι μαζί σας;'],
      [
        opt('new', ['They just arrived', 'Μόλις ήρθε'], { gentle: true }),
        opt('settled', ['A while — we have a routine', 'Αρκετό καιρό — έχουμε ρουτίνα']),
      ],
    ),
    question(
      'age',
      'single',
      ['How old is your pet (or the oldest one)?', 'Πόσο χρονών είναι (ή το μεγαλύτερο);'],
      [
        opt('young', ['Young', 'Μικρό']),
        opt('adult', ['Adult', 'Ενήλικο']),
        opt('senior', ['Older', 'Μεγάλο σε ηλικία']),
      ],
    ),
    question(
      'extras',
      'multi',
      ['Anything else that applies?', 'Ισχύει κάτι από τα παρακάτω;'],
      [
        opt('garden', ['We have a garden or balcony', 'Έχουμε κήπο ή μπαλκόνι']),
        opt('alone', ['Alone for long hours', 'Μένει μόνο του πολλές ώρες']),
        opt('kids', ['Children help out', 'Βοηθούν και τα παιδιά']),
      ],
      ['Choose all that apply — or none.', 'Διάλεξε όσα ισχύουν — ή κανένα.'],
    ),
    question(
      'time',
      'single',
      ['How much time a day for pet care?', 'Πόσο χρόνο τη μέρα έχεις για τη φροντίδα του;'],
      [
        opt('t20', ['About 20 minutes', 'Περίπου 20 λεπτά'], { minutes: 20 }),
        opt('t40', ['About 40 minutes', 'Περίπου 40 λεπτά'], { minutes: 40 }),
        opt('t60', ['An hour or more', 'Μία ώρα ή περισσότερο'], { minutes: 60 }),
      ],
    ),
  ],
  [
    daily('walk-am', 10, 6, ['Morning walk', 'Πρωινή βόλτα'], {
      when: { pets: ['dog'] },
      detail: [
        'Hot days: go early, carry water, and test the pavement with your hand.',
        'Τις ζεστές μέρες: πήγαινε νωρίς, πάρε νερό και δοκίμασε το πεζοδρόμιο με το χέρι σου.',
      ],
    }),
    daily('walk-pm', 15, 5, ['Evening walk', 'Βραδινή βόλτα'], {
      when: { pets: ['dog'], time: ['t40', 't60'] },
    }),
    daily('water', 1, 6, ['Fresh water in a clean bowl', 'Φρέσκο νερό σε καθαρό μπολ']),
    daily('meals', 2, 6, [
      'Measured meals at set times',
      'Φαγητό σε μετρημένες μερίδες και σταθερές ώρες',
    ]),
    daily('litter', 3, 6, ['Scoop the litter tray', 'Καθάρισε την άμμο της τουαλέτας'], {
      when: { pets: ['cat'] },
    }),
    daily(
      'cat-play',
      10,
      4,
      ['Ten minutes of play with a wand toy', 'Δέκα λεπτά παιχνίδι με καλάμι ή φτερό'],
      {
        when: { pets: ['cat'] },
      },
    ),
    daily(
      'small-check',
      3,
      5,
      [
        'Check food, water bottle and that your small pet is eating normally',
        'Έλεγξε φαγητό, ποτίστρα και ότι το ζωάκι τρώει κανονικά',
      ],
      {
        when: { pets: ['small'] },
      },
    ),
    daily(
      'spot-clean',
      5,
      4,
      ['Spot-clean the cage or hutch', 'Καθάρισε τα βρόμικα σημεία στο κλουβί'],
      {
        when: { pets: ['small'] },
      },
    ),
    daily(
      'training',
      5,
      5,
      ['Five minutes of training: sit, wait, come', 'Πέντε λεπτά εκπαίδευση: κάτσε, περίμενε, έλα'],
      {
        when: { pets: ['dog'], age: ['young'] },
      },
    ),
    daily('glance', 1, 3, [
      'A quick look: eyes, coat, appetite, mood',
      'Μια γρήγορη ματιά: μάτια, τρίχωμα, όρεξη, διάθεση',
    ]),
    daily(
      'alone-toy',
      2,
      3,
      [
        'Leave a puzzle feeder or a safe chew before you go out',
        'Άφησε ένα παιχνίδι-γρίφο με λιχουδιά ή ένα ασφαλές μασητικό πριν φύγεις',
      ],
      {
        when: { extras: ['alone'], pets: ['dog', 'cat'] },
      },
    ),
    daily(
      'kids-job',
      1,
      2,
      [
        'Each child has one pet job, with an adult checking',
        'Κάθε παιδί έχει μία δουλειά για το ζωάκι, με έναν μεγάλο να ελέγχει',
      ],
      {
        when: { extras: ['kids'] },
      },
    ),

    weekly('brush', 10, 4, ['Brush the coat', 'Βούρτσισε το τρίχωμα'], {
      when: { pets: ['dog', 'cat'] },
      times: 2,
    }),
    weekly(
      'litter-full',
      20,
      4,
      ['Empty, wash and refill the litter tray', 'Άδειασε, πλύνε και ξαναγέμισε την τουαλέτα'],
      {
        when: { pets: ['cat'] },
        day: 'sat',
      },
    ),
    weekly(
      'cage',
      30,
      5,
      [
        'Full clean of the cage or hutch, fresh bedding',
        'Γενικό καθάρισμα στο κλουβί, φρέσκο υπόστρωμα',
      ],
      {
        when: { pets: ['small'] },
        day: 'sun',
      },
    ),
    weekly(
      'out-time',
      20,
      4,
      ['Supervised time out of the cage', 'Ώρα έξω από το κλουβί, με επίβλεψη'],
      {
        when: { pets: ['small'], time: ['t40', 't60'] },
        times: 3,
      },
    ),
    weekly('bowls', 10, 3, [
      'Wash food and water bowls in hot soapy water',
      'Πλύνε τα μπολ φαγητού και νερού με ζεστό νερό και σαπούνι',
    ]),
    weekly(
      'bedding',
      15,
      3,
      ['Wash the pet’s bed or blanket', 'Πλύνε το κρεβατάκι ή την κουβέρτα του'],
      {
        when: { pets: ['dog', 'cat'] },
      },
    ),
    weekly(
      'long-walk',
      30,
      4,
      [
        'Make one walk a long one, or try a new route',
        'Κάνε μία βόλτα μεγάλη ή δοκίμασε καινούρια διαδρομή',
      ],
      {
        when: { pets: ['dog'], time: ['t60'] },
        day: 'sun',
      },
    ),
    weekly(
      'sniff',
      15,
      3,
      [
        'A slow “sniff walk” — let them explore',
        'Μια αργή βόλτα «μυρίσματος» — άφησέ τον να εξερευνήσει',
      ],
      {
        when: { pets: ['dog'] },
        times: 2,
      },
    ),
    weekly('body-check', 5, 3, ['Check nails, ears and teeth', 'Έλεγξε νύχια, αυτιά και δόντια']),
    weekly(
      'ticks',
      5,
      4,
      [
        'Check for ticks and fleas after time outdoors',
        'Έλεγξε για τσιμπούρια και ψύλλους μετά από βόλτα ή ώρα έξω',
      ],
      {
        when: { pets: ['dog', 'cat'] },
        times: 2,
      },
    ),
    weekly(
      'cat-new',
      10,
      3,
      [
        'Something new to explore: a box, a shelf by the window',
        'Κάτι καινούριο να εξερευνήσει: ένα κουτί, ένα ράφι στο παράθυρο',
      ],
      {
        when: { pets: ['cat'] },
      },
    ),
    weekly(
      'garden-check',
      10,
      3,
      [
        'Check the garden or balcony: gaps, railings, toxic plants',
        'Έλεγξε κήπο ή μπαλκόνι: κενά, κάγκελα, τοξικά φυτά',
      ],
      {
        when: { extras: ['garden'] },
      },
    ),
    weekly(
      'garden-pickup',
      5,
      3,
      ['Pick up after your dog in the garden', 'Μάζεψε τις ακαθαρσίες του σκύλου από τον κήπο'],
      {
        when: { extras: ['garden'], pets: ['dog'] },
        times: 2,
      },
    ),
    weekly(
      'socialise',
      20,
      4,
      ['Meet calm dogs and people', 'Γνωριμία με ήρεμους σκύλους και ανθρώπους'],
      {
        when: { pets: ['dog'], age: ['young'], time: ['t40', 't60'] },
        times: 2,
      },
    ),
    weekly(
      'senior-watch',
      5,
      4,
      [
        'Watch for stiffness, thirst or weight change — note it for the vet',
        'Πρόσεξε δυσκαμψία, πολλή δίψα ή αλλαγή βάρους — σημείωσέ τα για τον κτηνίατρο',
      ],
      {
        when: { age: ['senior'] },
      },
    ),
    weekly(
      'heat',
      2,
      3,
      [
        'Hot spell? Shade, extra water, walks only early or late',
        'Ζέστη; Σκιά, περισσότερο νερό, βόλτες μόνο νωρίς το πρωί ή αργά το βράδυ',
      ],
      {
        when: { pets: ['dog'] },
        day: 'mon',
      },
    ),
    weekly(
      'food-stock',
      10,
      3,
      [
        'Check food and litter stock, reorder before it runs out',
        'Έλεγξε απόθεμα τροφής και άμμου, παράγγειλε πριν τελειώσει',
      ],
      {
        day: 'fri',
      },
    ),

    kickoff('ko-vet', 10, 5, [
      'Choose a vet and save their number',
      'Διάλεξε κτηνίατρο και αποθήκευσε το τηλέφωνό του',
    ]),
    kickoff('ko-proof', 15, 4, [
      'Pet-proof the home: cables, toxic plants, cleaning products up high',
      'Κάνε το σπίτι ασφαλές: καλώδια, τοξικά φυτά, απορρυπαντικά ψηλά',
    ]),
    kickoff('ko-routine', 5, 4, [
      'Fix meal and walk times and write them on the fridge',
      'Όρισε ώρες για φαγητό και βόλτα και γράψ’ τες στο ψυγείο',
    ]),
    kickoff(
      'ko-chip',
      5,
      3,
      [
        'Check the microchip is registered with your current phone number',
        'Έλεγξε ότι το microchip είναι καταχωρισμένο με το τωρινό σου τηλέφωνο',
      ],
      {
        when: { pets: ['dog', 'cat'] },
      },
    ),
    kickoff('ko-corner', 5, 3, [
      'Set up a quiet corner they can retreat to',
      'Στήσε μια ήσυχη γωνιά όπου μπορεί να αποσύρεται',
    ]),

    monthly(
      'parasites',
      5,
      5,
      [
        'Flea, tick and worm protection, as your vet advised',
        'Αντιπαρασιτική προστασία, όπως σου έχει πει ο κτηνίατρος',
      ],
      {
        when: { pets: ['dog', 'cat'] },
      },
    ),
    monthly('vet-calendar', 10, 5, [
      'Vet calendar: is a vaccine or check-up due?',
      'Ημερολόγιο κτηνιάτρου: έρχεται εμβόλιο ή έλεγχος;',
    ]),
    monthly(
      'small-teeth',
      10,
      4,
      [
        'Check the small pet’s teeth, nails and weight',
        'Έλεγξε δόντια, νύχια και βάρος του μικρού ζώου',
      ],
      {
        when: { pets: ['small'] },
      },
    ),
    monthly('weigh', 5, 3, ['Weigh your pet and note it', 'Ζύγισε το ζωάκι και σημείωσέ το'], {
      when: { pets: ['dog', 'cat'] },
    }),
    monthly(
      'dog-bath',
      30,
      3,
      [
        'A bath — or a groomer visit — if needed',
        'Μπάνιο — ή επίσκεψη στον κομμωτή σκύλων — αν χρειάζεται',
      ],
      {
        when: { pets: ['dog'] },
      },
    ),
    monthly('toys', 10, 2, [
      'Rotate toys: wash some, put some away, bring others back',
      'Άλλαξε παιχνίδια: πλύνε μερικά, κρύψε μερικά, ξαναβγάλε άλλα',
    ]),
    monthly('costs', 10, 2, [
      'Review pet costs and put a little aside for the vet',
      'Δες τα έξοδα του ζώου και βάλε λίγα στην άκρη για τον κτηνίατρο',
    ]),
  ],
)
