// TASKS ADVISOR topic: exam season (P9 +8). Lazy chunk (./index.ts). Students (Panhellenics or
// university) get study blocks as anchors; a parent gets a support plan instead. Sleep and breaks
// are part of the plan, not extras; heavy worry is pointed to a counsellor or doctor.
import { daily, kickoff, monthly, opt, question, topic, weekly } from './build.ts'
import { TOPICS } from './topics.ts'

const STUDENT = ['panhellenic', 'uni']

export const examSeason = topic(
  TOPICS['exam-season'],
  [
    question(
      'who',
      'single',
      ['Who is this plan for?', 'Για ποιον είναι αυτό το πλάνο;'],
      [
        opt('panhellenic', ['Me — Panhellenic exams', 'Για μένα — Πανελλαδικές']),
        opt('uni', ['Me — university exams', 'Για μένα — εξεταστική στο πανεπιστήμιο']),
        opt('parent', [
          'I am a parent supporting a candidate',
          'Είμαι γονιός και στηρίζω το παιδί μου',
        ]),
      ],
    ),
    question(
      'start',
      'single',
      ['When do the exams start?', 'Πότε ξεκινούν οι εξετάσεις;'],
      [
        opt('far', ['More than a month away', 'Σε πάνω από έναν μήνα']),
        opt('month', ['Within a month', 'Μέσα στον μήνα']),
        opt('week', ['This week or next', 'Αυτή ή την επόμενη εβδομάδα']),
      ],
    ),
    question(
      'state',
      'single',
      ['How is it going?', 'Πώς πάει;'],
      [
        opt('ok', ['I am coping', 'Τα βγάζω πέρα']),
        opt('stressed', ['Very stressed', 'Με πολύ άγχος'], { gentle: true }),
      ],
    ),
    question(
      'trouble',
      'multi',
      ['What is slipping?', 'Τι έχει αρχίσει να ξεφεύγει;'],
      [
        opt('sleep', ['Sleep', 'Ο ύπνος']),
        opt('phone', ['Phone time', 'Η ώρα στο κινητό']),
        opt('food', ['Skipped meals', 'Τα γεύματα']),
      ],
      ['Choose all that apply — or none.', 'Διάλεξε όσα ισχύουν — ή κανένα.'],
    ),
    question(
      'time',
      'single',
      ['How much time a day goes to this plan?', 'Πόσο χρόνο τη μέρα δίνεις σε αυτό το πλάνο;'],
      [
        opt('t60', ['About an hour', 'Περίπου μία ώρα'], { minutes: 60 }),
        opt('t120', ['About two hours', 'Περίπου δύο ώρες'], { minutes: 120 }),
        opt('t180', ['Three hours or more', 'Τρεις ώρες ή περισσότερο'], { minutes: 180 }),
      ],
      [
        'Students: study time. Parents: time for the support jobs.',
        'Για μαθητές και φοιτητές: χρόνος μελέτης. Για γονείς: χρόνος για τη στήριξη.',
      ],
    ),
  ],
  [
    daily(
      'block-1',
      50,
      6,
      [
        'Study block: 50 minutes on one subject, phone away',
        'Ενότητα μελέτης: 50 λεπτά σε ένα μάθημα, κινητό μακριά',
      ],
      {
        when: { who: STUDENT },
        detail: [
          'Then ten minutes off your feet: water, stretch, look out of the window.',
          'Μετά δέκα λεπτά διάλειμμα: νερό, τέντωμα, μια ματιά έξω από το παράθυρο.',
        ],
      },
    ),
    daily(
      'block-short',
      25,
      6,
      [
        'A short block: 25 minutes, then a real break',
        'Μια μικρή ενότητα: 25 λεπτά και μετά πραγματικό διάλειμμα',
      ],
      {
        when: { who: STUDENT, state: ['stressed'] },
      },
    ),
    daily(
      'plan-tomorrow',
      5,
      5,
      ['Plan tomorrow’s blocks before you stop', 'Σχεδίασε τις αυριανές ενότητες πριν σταματήσεις'],
      {
        when: { who: STUDENT },
      },
    ),
    daily('sleep-same', 1, 5, [
      'Same bedtime and wake-up time — sleep is when memory settles',
      'Ίδια ώρα ύπνου και ξυπνήματος — στον ύπνο «κατασταλάζουν» όσα διάβασες',
    ]),
    daily(
      'breakfast',
      5,
      5,
      ['Breakfast before the first block', 'Πρωινό πριν από την πρώτη ενότητα'],
      {
        when: { trouble: ['food'], who: STUDENT },
      },
    ),
    daily(
      'phone-away',
      1,
      5,
      ['Phone in another room during the blocks', 'Το κινητό σε άλλο δωμάτιο όσο διαβάζεις'],
      {
        when: { trouble: ['phone'], who: STUDENT },
      },
    ),
    daily(
      'screens-off',
      1,
      4,
      [
        'No screens in the last half hour before bed',
        'Καμία οθόνη την τελευταία μισή ώρα πριν τον ύπνο',
      ],
      {
        when: { trouble: ['sleep'] },
      },
    ),
    daily(
      'breathe',
      5,
      4,
      [
        'Before you start: four slow breaths, in for 4, out for 6',
        'Πριν ξεκινήσεις: τέσσερις αργές αναπνοές, εισπνοή στα 4, εκπνοή στα 6',
      ],
      {
        when: { state: ['stressed'] },
      },
    ),
    daily(
      'recall',
      10,
      4,
      [
        'End the day: write what you remember, book closed',
        'Στο τέλος της μέρας: γράψε όσα θυμάσαι με το βιβλίο κλειστό',
      ],
      {
        when: { who: STUDENT },
      },
    ),
    daily(
      'formulas',
      10,
      3,
      ['Ten minutes on formulas and definitions', 'Δέκα λεπτά σε τύπους και ορισμούς'],
      {
        when: { who: ['panhellenic'] },
      },
    ),
    daily('meals', 2, 3, [
      'Three proper meals and a water bottle on the desk',
      'Τρία κανονικά γεύματα και ένα μπουκάλι νερό στο γραφείο',
    ]),
    daily(
      'parent-ask',
      5,
      5,
      ['Ask how the day went — listen, do not quiz', 'Ρώτα πώς πήγε η μέρα — άκου, μην ανακρίνεις'],
      {
        when: { who: ['parent'] },
      },
    ),
    daily(
      'parent-quiet',
      1,
      4,
      ['Keep the house quiet during study hours', 'Κράτα το σπίτι ήσυχο τις ώρες της μελέτης'],
      {
        when: { who: ['parent'] },
      },
    ),
    daily(
      'parent-calm',
      1,
      4,
      [
        'Encouragement, not pressure: keep your own worry out of it',
        'Ενθάρρυνση, όχι πίεση: κράτα το δικό σου άγχος έξω από την κουβέντα',
      ],
      {
        when: { who: ['parent'] },
      },
    ),
    daily(
      'parent-lights',
      1,
      3,
      ['Agree a lights-out time together', 'Συμφωνήστε μαζί μια ώρα για ύπνο'],
      {
        when: { who: ['parent'], trouble: ['sleep'] },
      },
    ),

    weekly('block-2', 50, 5, ['A second study block', 'Δεύτερη ενότητα μελέτης'], {
      when: { who: STUDENT, time: ['t120', 't180'] },
      times: 5,
    }),
    weekly('block-3', 50, 5, ['A third study block', 'Τρίτη ενότητα μελέτης'], {
      when: { who: STUDENT, time: ['t180'] },
      times: 4,
    }),
    weekly(
      'past-papers',
      60,
      5,
      ['Past exam papers against the clock', 'Θέματα προηγούμενων ετών με χρονόμετρο'],
      {
        when: { who: STUDENT, start: ['month', 'week'], time: ['t120', 't180'] },
        times: 2,
      },
    ),
    weekly('essay', 45, 4, ['Write one timed essay', 'Γράψε μία έκθεση με χρονόμετρο'], {
      when: { who: ['panhellenic'], start: ['far', 'month'], time: ['t120', 't180'] },
    }),
    weekly(
      'timetable',
      15,
      5,
      [
        'Plan the week: subjects per day, reviews included',
        'Σχεδίασε την εβδομάδα: μαθήματα ανά μέρα, μαζί με τις επαναλήψεις',
      ],
      {
        when: { who: STUDENT, start: ['far', 'month'] },
        day: 'sun',
      },
    ),
    weekly(
      'review-week',
      30,
      4,
      [
        'Saturday review of everything from this week',
        'Σαββατιάτικη επανάληψη όλων όσων διάβασες την εβδομάδα',
      ],
      {
        when: { who: STUDENT },
        day: 'sat',
      },
    ),
    weekly(
      'study-pair',
      30,
      4,
      [
        'Study with a classmate: quiz each other',
        'Διάβασμα με συμφοιτητή: κάνετε ερωτήσεις ο ένας στον άλλον',
      ],
      {
        when: { who: ['uni'], time: ['t120', 't180'] },
      },
    ),
    weekly(
      'ask-lecturer',
      15,
      3,
      [
        'Take your unclear points to the lecturer or a tutor',
        'Πήγαινε τις απορίες σου στον διδάσκοντα ή σε έναν βοηθό',
      ],
      {
        when: { who: ['uni'], start: ['far', 'month'] },
      },
    ),
    weekly('walk', 20, 4, ['A 20-minute walk outside', 'Βόλτα 20 λεπτών έξω'], { times: 3 }),
    weekly('half-day', 1, 4, ['Half a day completely off', 'Μισή μέρα εντελώς ρεπό'], {
      day: 'sun',
    }),
    weekly(
      'talk',
      10,
      4,
      [
        'Talk to someone you trust about how it is going',
        'Μίλησε σε κάποιον που εμπιστεύεσαι για το πώς πάει',
      ],
      {
        when: { state: ['stressed'] },
      },
    ),
    weekly(
      'exam-bag',
      10,
      5,
      [
        'Pack the exam bag: ID, pens, water, a watch',
        'Ετοίμασε την τσάντα της εξέτασης: ταυτότητα, στυλό, νερό, ρολόι',
      ],
      {
        when: { start: ['week'] },
      },
    ),
    weekly(
      'night-before',
      5,
      4,
      [
        'The night before: light review only, bag ready, early to bed',
        'Το βράδυ πριν: μόνο ελαφριά επανάληψη, τσάντα έτοιμη, νωρίς για ύπνο',
      ],
      {
        when: { start: ['week'] },
      },
    ),
    weekly(
      'parent-cook',
      30,
      4,
      [
        'Cook ahead: easy, nourishing meals for the week',
        'Μαγείρεψε από πριν: εύκολα, θρεπτικά φαγητά για την εβδομάδα',
      ],
      {
        when: { who: ['parent'] },
        times: 2,
      },
    ),
    weekly(
      'parent-treat',
      20,
      3,
      [
        'Plan a small treat or outing for the weekend',
        'Κανόνισε μια μικρή χαρά ή έξοδο για το Σαββατοκύριακο',
      ],
      {
        when: { who: ['parent'] },
      },
    ),
    weekly(
      'parent-self',
      20,
      3,
      [
        'Something for you too: a walk, a friend, a break',
        'Κάτι και για σένα: μια βόλτα, έναν φίλο, ένα διάλειμμα',
      ],
      {
        when: { who: ['parent'] },
      },
    ),

    kickoff('ko-calendar', 10, 5, [
      'Write every exam date on one calendar on the wall',
      'Γράψε όλες τις ημερομηνίες των εξετάσεων σε ένα ημερολόγιο στον τοίχο',
    ]),
    kickoff(
      'ko-map',
      20,
      5,
      [
        'List every subject and chapter: strong, weak, not started',
        'Γράψε κάθε μάθημα και κεφάλαιο: δυνατό, αδύναμο, δεν το έχω ξεκινήσει',
      ],
      {
        when: { who: STUDENT },
      },
    ),
    kickoff(
      'ko-desk',
      15,
      4,
      [
        'Set up the desk: light, chair, everything at hand',
        'Στήσε το γραφείο: φως, καρέκλα, όλα πρόχειρα',
      ],
      {
        when: { who: STUDENT },
      },
    ),
    kickoff(
      'ko-parent-talk',
      15,
      5,
      [
        'Ask your child what helps and what does not — then do that',
        'Ρώτα το παιδί σου τι το βοηθά και τι όχι — και κάνε αυτό',
      ],
      {
        when: { who: ['parent'] },
      },
    ),
    kickoff(
      'ko-support',
      5,
      3,
      [
        'If worry takes over sleep or meals, talk to a counsellor or your doctor',
        'Αν το άγχος σού παίρνει τον ύπνο ή την όρεξη, μίλησε με έναν σύμβουλο ή με τον γιατρό σου',
      ],
      {
        when: { state: ['stressed'] },
      },
    ),

    monthly(
      'mock',
      120,
      5,
      [
        'A full mock exam, timed, in one sitting',
        'Ένα ολόκληρο δοκιμαστικό, με χρονόμετρο, σε μία καθισιά',
      ],
      {
        when: { who: ['panhellenic'], time: ['t120', 't180'] },
      },
    ),
    monthly(
      'progress',
      20,
      4,
      [
        'Check progress against the subject list',
        'Έλεγξε την πρόοδο σε σχέση με τη λίστα των μαθημάτων',
      ],
      {
        when: { who: STUDENT },
      },
    ),
    monthly(
      'parent-long',
      20,
      4,
      [
        'A longer, calm talk: how are they really doing?',
        'Μια μεγαλύτερη, ήρεμη κουβέντα: πώς είναι πραγματικά;',
      ],
      {
        when: { who: ['parent'] },
      },
    ),
    monthly('celebrate', 10, 3, [
      'Mark a month of effort with a small celebration',
      'Γιόρτασε έναν μήνα προσπάθειας με κάτι μικρό',
    ]),
    monthly(
      'stationery',
      10,
      2,
      ['Restock paper, pens and highlighters', 'Ανανέωσε χαρτιά, στυλό και μαρκαδόρους'],
      {
        when: { who: STUDENT },
      },
    ),
  ],
)
