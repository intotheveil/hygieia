// TASKS ADVISOR topic: weekly budget and groceries (P9). Lazy chunk (./index.ts). Household
// habits, not financial advice; amounts are never suggested.
import { daily, kickoff, monthly, opt, question, topic, weekly } from './build.ts'
import { TOPICS } from './topics.ts'

export const budgetGroceries = topic(
  TOPICS['budget-groceries'],
  [
    question(
      'household',
      'single',
      ['Who is the budget for?', 'Για ποιους είναι ο προϋπολογισμός;'],
      [
        opt('one', ['Just me', 'Μόνο για μένα']),
        opt('two', ['Two of us', 'Για δύο']),
        opt('family', ['A family', 'Για οικογένεια']),
      ],
    ),
    question(
      'tracking',
      'single',
      ['Do you know where your money goes?', 'Ξέρεις πού πάνε τα χρήματά σου;'],
      [
        opt('yes', ['Yes, I track it', 'Ναι, τα καταγράφω']),
        opt('roughly', ['Roughly', 'Περίπου']),
        opt('no', ['Not really', 'Όχι ιδιαίτερα'], { gentle: true }),
      ],
    ),
    question(
      'goals',
      'multi',
      ['What matters most?', 'Τι μετράει περισσότερο;'],
      [
        opt('save', ['Saving a little each month', 'Να αποταμιεύω λίγα κάθε μήνα']),
        opt('waste', ['Wasting less food', 'Λιγότερη σπατάλη φαγητού']),
        opt('cook', ['Cooking more at home', 'Περισσότερο μαγείρεμα στο σπίτι']),
        opt('subs', [
          'Cutting subscriptions and small leaks',
          'Λιγότερες συνδρομές και «μικρές διαρροές»',
        ]),
      ],
      ['Choose all that apply — or none.', 'Διάλεξε όσα ισχύουν — ή κανένα.'],
    ),
    question(
      'shopping',
      'single',
      ['How do you shop for groceries?', 'Πώς ψωνίζεις για το σπίτι;'],
      [
        opt('big', ['One big shop a week', 'Ένα μεγάλο ψώνιο την εβδομάδα']),
        opt('small', ['Small shops, several times', 'Μικρά ψώνια, πολλές φορές']),
        opt('online', ['Online delivery', 'Online παραγγελία']),
      ],
    ),
    question(
      'time',
      'single',
      [
        'How much time can you give it on a busy day?',
        'Πόσο χρόνο μπορείς να διαθέσεις μια γεμάτη μέρα;',
      ],
      [
        opt('t15', ['About 15 minutes', 'Περίπου 15 λεπτά'], { minutes: 15 }),
        opt('t30', ['About 30 minutes', 'Περίπου 30 λεπτά'], { minutes: 30 }),
        opt('t45', ['About 45 minutes', 'Περίπου 45 λεπτά'], { minutes: 45 }),
      ],
    ),
  ],
  [
    daily('log', 2, 5, [
      'Log today’s spending in one place',
      'Κατέγραψε τα σημερινά έξοδα σε ένα σημείο',
    ]),
    daily('receipts', 1, 3, [
      'Keep the receipts in one envelope or a photo folder',
      'Κράτα τις αποδείξεις σε έναν φάκελο ή σε έναν φάκελο φωτογραφιών',
    ]),
    daily('pause', 1, 4, [
      'Before a non-essential buy: wait 24 hours',
      'Πριν από μια μη απαραίτητη αγορά: περίμενε 24 ώρες',
    ]),
    daily('coffee-home', 5, 3, ['Make coffee at home', 'Φτιάξε καφέ στο σπίτι'], {
      when: { goals: ['save', 'subs'] },
    }),
    daily('lunchbox', 5, 4, ['Take lunch from home', 'Πάρε φαγητό από το σπίτι'], {
      when: { goals: ['save', 'cook'] },
    }),
    daily(
      'leftovers-first',
      1,
      4,
      ['Eat what needs eating first', 'Φάε πρώτα ό,τι πρέπει να φαγωθεί'],
      { when: { goals: ['waste'] } },
    ),
    weekly(
      'cook-tonight',
      15,
      4,
      ['Cook tonight instead of ordering', 'Μαγείρεψε απόψε αντί να παραγγείλεις'],
      {
        when: { goals: ['cook'], time: ['t30', 't45'] },
        times: 3,
      },
    ),
    daily(
      'cash-check',
      1,
      2,
      ['Check your balance in the banking app', 'Δες το υπόλοιπο στην εφαρμογή της τράπεζας'],
      {
        when: { tracking: ['roughly', 'yes'] },
      },
    ),
    daily('list-add', 1, 3, [
      'Add what runs out to the shopping list right away',
      'Γράψε αμέσως στη λίστα ό,τι τελειώνει',
    ]),

    weekly(
      'meal-plan',
      15,
      5,
      [
        'Plan the week’s meals around what you already have',
        'Σχεδίασε τα γεύματα της εβδομάδας με βάση όσα ήδη έχεις',
      ],
      {
        when: { time: ['t30', 't45'] },
        day: 'sat',
      },
    ),
    weekly(
      'meal-plan-quick',
      10,
      5,
      ['Pick five dinners for the week', 'Διάλεξε πέντε βραδινά για την εβδομάδα'],
      {
        when: { time: ['t15'] },
        day: 'sat',
      },
    ),
    weekly(
      'list',
      10,
      5,
      ['Write the shopping list by aisle', 'Γράψε τη λίστα για τα ψώνια ανά διάδρομο'],
      { day: 'sat' },
    ),
    weekly(
      'shop-big',
      40,
      6,
      [
        'The weekly shop — with the list, not hungry',
        'Τα ψώνια της εβδομάδας — με λίστα, όχι πεινασμένος/η',
      ],
      {
        when: { shopping: ['big'], time: ['t45'] },
        day: 'sat',
      },
    ),
    weekly(
      'shop-big-short',
      15,
      6,
      ['Weekly top-up shop for the essentials', 'Εβδομαδιαίο ψώνιο για τα βασικά'],
      {
        when: { shopping: ['big'], time: ['t30', 't15'] },
        day: 'sat',
      },
    ),
    weekly(
      'shop-small',
      10,
      4,
      ['Quick shop, only what is on the list', 'Γρήγορο ψώνιο, μόνο όσα γράφει η λίστα'],
      {
        when: { shopping: ['small'] },
        times: 2,
      },
    ),
    weekly(
      'shop-online',
      10,
      5,
      ['Place the online order from the list', 'Κάνε την online παραγγελία από τη λίστα'],
      {
        when: { shopping: ['online'] },
        day: 'sat',
      },
    ),
    weekly(
      'online-basket',
      5,
      3,
      [
        'Check the basket for impulse extras before paying',
        'Έλεγξε το καλάθι για «παρορμητικά» πριν πληρώσεις',
      ],
      {
        when: { shopping: ['online'] },
        day: 'sat',
      },
    ),
    weekly(
      'flyers',
      10,
      3,
      [
        'Check the supermarket offers for staples',
        'Δες τις προσφορές του σούπερ μάρκετ για τα βασικά',
      ],
      {
        when: { goals: ['save'] },
      },
    ),
    weekly(
      'weekly-total',
      10,
      5,
      [
        'Add up the week: food, transport, everything else',
        'Άθροισε την εβδομάδα: φαγητό, μετακινήσεις, όλα τα υπόλοιπα',
      ],
      {
        day: 'sun',
      },
    ),
    weekly(
      'fridge-check',
      5,
      4,
      ['Fridge check before shopping', 'Έλεγχος ψυγείου πριν τα ψώνια'],
      { day: 'fri' },
    ),
    weekly(
      'use-up',
      20,
      3,
      ['“Use it up” dinner from leftovers and odds and ends', 'Βραδινό «ό,τι έχει μείνει»'],
      {
        when: { goals: ['waste'], time: ['t30', 't45'] },
        day: 'thu',
      },
    ),
    weekly(
      'freeze',
      5,
      3,
      [
        'Freeze bread, fruit or portions before they go off',
        'Κατέψυξε ψωμί, φρούτα ή μερίδες πριν χαλάσουν',
      ],
      {
        when: { goals: ['waste'] },
      },
    ),
    weekly(
      'batch',
      35,
      4,
      ['Batch-cook two meals for the week', 'Μαγείρεψε από πριν δύο φαγητά για την εβδομάδα'],
      {
        when: { goals: ['cook'], time: ['t45'] },
        day: 'sun',
      },
    ),
    weekly(
      'save-transfer',
      2,
      4,
      [
        'Move a small fixed amount to savings',
        'Μετέφερε ένα μικρό σταθερό ποσό στις αποταμιεύσεις',
      ],
      {
        when: { goals: ['save'] },
        day: 'mon',
      },
    ),
    weekly('no-spend', 1, 3, ['One no-spend day', 'Μία μέρα χωρίς έξοδα'], {
      when: { goals: ['save'] },
      day: 'wed',
    }),
    weekly(
      'family-talk',
      10,
      3,
      [
        'Ten-minute money chat at home: what is coming up',
        'Δεκάλεπτη κουβέντα για τα οικονομικά στο σπίτι: τι έρχεται',
      ],
      {
        when: { household: ['two', 'family'] },
        day: 'sun',
      },
    ),
    weekly(
      'kids-pocket',
      5,
      2,
      ['Pocket money and a small lesson about it', 'Χαρτζιλίκι και ένα μικρό μάθημα γι’ αυτό'],
      {
        when: { household: ['family'] },
      },
    ),
    weekly('unit-price', 5, 2, [
      'Compare the price per kilo, not per pack',
      'Σύγκρινε την τιμή ανά κιλό, όχι ανά συσκευασία',
    ]),

    kickoff('ko-statements', 15, 5, [
      'Read last month’s bank statement, line by line',
      'Διάβασε την κίνηση του λογαριασμού του προηγούμενου μήνα, γραμμή-γραμμή',
    ]),
    kickoff('ko-categories', 10, 4, [
      'Choose five spending categories to track',
      'Διάλεξε πέντε κατηγορίες εξόδων για καταγραφή',
    ]),
    kickoff('ko-tool', 5, 4, [
      'Pick one place to log: notebook, sheet or app',
      'Διάλεξε ένα σημείο καταγραφής: τετράδιο, υπολογιστικό φύλλο ή εφαρμογή',
    ]),
    kickoff('ko-pantry', 10, 3, [
      'Check what is in the cupboards before buying more',
      'Δες τι υπάρχει στα ντουλάπια πριν αγοράσεις κι άλλα',
    ]),

    monthly(
      'review',
      20,
      5,
      [
        'Monthly review: where did it go, what to change',
        'Μηνιαία ανασκόπηση: πού πήγαν, τι αλλάζει',
      ],
      {
        when: { time: ['t30', 't45'] },
      },
    ),
    monthly('review-quick', 10, 5, ['Monthly total by category', 'Μηνιαίο σύνολο ανά κατηγορία'], {
      when: { time: ['t15'] },
    }),
    monthly(
      'subs',
      15,
      4,
      ['List every subscription; cancel one', 'Γράψε όλες τις συνδρομές· ακύρωσε μία'],
      { when: { goals: ['subs'] } },
    ),
    monthly('bills', 10, 3, [
      'Check one bill for a better plan (phone, internet, power)',
      'Έλεγξε έναν λογαριασμό για καλύτερο πρόγραμμα (κινητό, internet, ρεύμα)',
    ]),
    monthly(
      'freezer',
      15,
      3,
      [
        'Freezer audit and a “freezer week” plan',
        'Έλεγχος κατάψυξης και πλάνο «εβδομάδας κατάψυξης»',
      ],
      {
        when: { goals: ['waste'] },
      },
    ),
    monthly(
      'goal',
      5,
      3,
      ['Note how much you saved — celebrate it', 'Σημείωσε πόσα αποταμίευσες — και γιόρτασέ το'],
      { when: { goals: ['save'] } },
    ),
  ],
)
