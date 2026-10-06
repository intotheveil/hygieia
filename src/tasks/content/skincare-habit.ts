// TASKS ADVISOR topic: a skincare habit that sticks (P9). Lazy chunk (./index.ts). Generic product
// TYPES only, never brands (same rule as /skincare); persistent skin trouble → a dermatologist.
import { daily, kickoff, monthly, opt, question, topic, weekly } from './build.ts'
import { TOPICS } from './topics.ts'

export const skincareHabit = topic(
  TOPICS['skincare-habit'],
  [
    question(
      'skin',
      'single',
      ['How would you describe your skin?', 'Πώς θα περιέγραφες την επιδερμίδα σου;'],
      [
        opt('dry', ['Dry or tight', 'Ξηρή ή «τραβηγμένη»']),
        opt('oily', ['Oily', 'Λιπαρή']),
        opt('combination', ['Combination', 'Μικτή']),
        opt('sensitive', ['Sensitive', 'Ευαίσθητη']),
        opt('normal', ['Normal', 'Κανονική']),
      ],
    ),
    question(
      'now',
      'single',
      ['What do you do today?', 'Τι κάνεις σήμερα;'],
      [
        opt('none', ['Nothing yet', 'Τίποτα ακόμη'], { gentle: true }),
        opt('basic', ['I wash my face, that is about it', 'Πλένω το πρόσωπο και περίπου τόσο']),
        opt('routine', ['I have a routine but skip it', 'Έχω ρουτίνα αλλά την παραλείπω']),
      ],
    ),
    question(
      'time',
      'single',
      ['How long would you spend on it a day?', 'Πόσο χρόνο θα διέθετες τη μέρα;'],
      [
        opt('t5', ['About 5 minutes', 'Περίπου 5 λεπτά'], { minutes: 5 }),
        opt('t10', ['About 10 minutes', 'Περίπου 10 λεπτά'], { minutes: 10 }),
        opt('t20', ['About 20 minutes', 'Περίπου 20 λεπτά'], { minutes: 20 }),
      ],
    ),
    question(
      'extras',
      'multi',
      ['Anything else to plan for?', 'Κάτι ακόμη που πρέπει να υπολογίσουμε;'],
      [
        opt('sun', ['I am outdoors a lot', 'Είμαι πολύ έξω, στον ήλιο']),
        opt('makeup', ['I wear make-up', 'Βάφομαι']),
        opt('breakouts', ['Breakouts', 'Σπυράκια']),
        opt('shave', ['I shave my face', 'Ξυρίζω το πρόσωπο']),
        opt('nails', ['Nails and hands', 'Νύχια και χέρια']),
      ],
      ['Choose all that apply — or none.', 'Διάλεξε όσα ισχύουν — ή κανένα.'],
    ),
  ],
  [
    daily('am-cleanse', 1, 4, [
      'Morning: rinse or gently cleanse',
      'Πρωί: ξέπλυμα ή ήπιο καθάρισμα',
    ]),
    daily('am-moist', 1, 4, ['Morning: moisturiser', 'Πρωί: ενυδατική']),
    daily('spf', 1, 5, [
      'Sunscreen as the last morning step',
      'Αντηλιακό ως τελευταίο πρωινό βήμα',
    ]),
    daily('pm-cleanse', 2, 5, ['Evening: cleanse properly', 'Βράδυ: καλό καθάρισμα']),
    daily('pm-moist', 1, 4, ['Evening: moisturiser', 'Βράδυ: ενυδατική']),
    daily(
      'double-cleanse',
      2,
      4,
      ['Remove make-up first, then cleanse', 'Πρώτα ντεμακιγιάζ, μετά καθάρισμα'],
      { when: { extras: ['makeup'] } },
    ),
    daily('rich-cream', 1, 3, ['A richer cream at night', 'Πιο πλούσια κρέμα το βράδυ'], {
      when: { skin: ['dry'] },
    }),
    daily(
      'light-gel',
      1,
      3,
      [
        'A light gel moisturiser instead of a heavy cream',
        'Ελαφριά ενυδατική τζελ αντί για βαριά κρέμα',
      ],
      {
        when: { skin: ['oily', 'combination'] },
      },
    ),
    daily(
      'gentle-only',
      1,
      3,
      ['Fragrance-free, gentle products only', 'Μόνο ήπια προϊόντα χωρίς άρωμα'],
      { when: { skin: ['sensitive'] } },
    ),
    daily(
      'hands-off',
      1,
      3,
      ['Hands off: no squeezing or picking', 'Χωρίς άγγιγμα: δεν πιέζουμε, δεν «σκαλίζουμε»'],
      {
        when: { extras: ['breakouts'] },
      },
    ),
    daily(
      'spf-reapply',
      1,
      4,
      ['Reapply sunscreen when outdoors for long', 'Ξαναβάλε αντηλιακό όταν μένεις πολλή ώρα έξω'],
      {
        when: { extras: ['sun'] },
      },
    ),
    daily(
      'after-shave',
      1,
      3,
      [
        'Soothe after shaving: fragrance-free balm',
        'Καταπράυνση μετά το ξύρισμα: βάλσαμο χωρίς άρωμα',
      ],
      {
        when: { extras: ['shave'] },
      },
    ),
    daily('hand-cream', 1, 3, ['Hand cream after washing up', 'Κρέμα χεριών μετά το πλύσιμο'], {
      when: { extras: ['nails'] },
    }),
    daily('cuticle', 1, 2, ['Cuticle oil before bed', 'Λάδι επωνυχίων πριν τον ύπνο'], {
      when: { extras: ['nails'] },
    }),
    daily('lip', 1, 2, ['Lip balm', 'Lip balm']),
    daily('serum', 2, 3, ['Evening: one treatment serum', 'Βράδυ: ένας ορός περιποίησης'], {
      when: { time: ['t10', 't20'], now: ['basic', 'routine'] },
    }),

    weekly('exfoliate', 5, 3, ['Gentle exfoliation', 'Ήπια απολέπιση'], {
      when: { skin: ['oily', 'combination', 'normal'] },
      times: 2,
    }),
    weekly(
      'exfoliate-soft',
      5,
      3,
      ['Very gentle exfoliation, once only', 'Πολύ ήπια απολέπιση, μία φορά μόνο'],
      {
        when: { skin: ['dry', 'sensitive'] },
      },
    ),
    weekly(
      'mask',
      10,
      4,
      ['A face mask that suits your skin', 'Μάσκα προσώπου που ταιριάζει στην επιδερμίδα σου'],
      {
        when: { time: ['t20'] },
        day: 'sun',
      },
    ),
    weekly('pillowcase', 5, 3, ['Change your pillowcase', 'Άλλαξε μαξιλαροθήκη'], { times: 2 }),
    weekly(
      'brushes',
      10,
      3,
      ['Wash make-up brushes and sponges', 'Πλύνε πινέλα και σφουγγαράκια μακιγιάζ'],
      {
        when: { extras: ['makeup'] },
      },
    ),
    weekly(
      'razor',
      2,
      2,
      ['Change or clean the razor blade', 'Άλλαξε ή καθάρισε τη λεπίδα του ξυραφιού'],
      { when: { extras: ['shave'] } },
    ),
    weekly('nails-file', 10, 3, ['File and shape your nails', 'Λιμάρισε και σχημάτισε τα νύχια'], {
      when: { extras: ['nails'] },
    }),
    weekly('phone-wipe', 1, 2, ['Wipe your phone screen', 'Καθάρισε την οθόνη του κινητού'], {
      when: { extras: ['breakouts'] },
    }),
    weekly(
      'check-in',
      3,
      3,
      [
        'How did your skin react this week? One line in your notes',
        'Πώς αντέδρασε η επιδερμίδα αυτή την εβδομάδα; Μία γραμμή στις σημειώσεις',
      ],
      {
        day: 'sun',
      },
    ),
    weekly('neck', 1, 2, [
      'Take the routine down to your neck',
      'Επέκτεινε τη ρουτίνα και στον λαιμό',
    ]),

    kickoff('ko-basics', 10, 5, [
      'Check you have three basics: cleanser, moisturiser, sunscreen',
      'Έλεγξε ότι έχεις τα τρία βασικά: καθαριστικό, ενυδατική, αντηλιακό',
    ]),
    kickoff('ko-shelf', 5, 4, [
      'Put them in one spot by the sink',
      'Βάλ’ τα σε ένα σημείο δίπλα στον νιπτήρα',
    ]),
    kickoff('ko-patch', 5, 4, [
      'Patch-test anything new on your inner arm first',
      'Δοκίμασε κάθε νέο προϊόν πρώτα στο εσωτερικό του χεριού',
    ]),
    kickoff('ko-expired', 5, 3, [
      'Throw out expired or unused products',
      'Πέτα προϊόντα που έληξαν ή δεν χρησιμοποιείς',
    ]),

    monthly('derm', 5, 3, [
      'A change you are unsure about? Note it for a dermatologist',
      'Κάποια αλλαγή που σε ανησυχεί; Σημείωσέ τη για τον δερματολόγο',
    ]),
    monthly('expiry', 5, 2, [
      'Check opening dates on your products',
      'Έλεγξε τις ημερομηνίες ανοίγματος στα προϊόντα σου',
    ]),
    monthly('mole', 10, 2, [
      'Look over your skin for new or changing moles',
      'Κοίτα το δέρμα σου για νέες ή αλλαγμένες ελιές',
    ]),
    monthly('season', 10, 2, [
      'Adjust for the season: lighter in summer, richer in winter',
      'Προσαρμογή στην εποχή: ελαφρύτερα το καλοκαίρι, πλουσιότερα τον χειμώνα',
    ]),
  ],
)
