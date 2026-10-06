// TASKS ADVISOR topic: newborn and toddler routine (P9 +8). Lazy chunk (./index.ts). Routine and
// parent self-care only — never medical or dosing advice: medicine, fever and solids are pointed to
// the paediatrician (or a pharmacist), low mood to a doctor or midwife, without diagnosing.
import { daily, kickoff, monthly, opt, question, topic, weekly } from './build.ts'
import { TOPICS } from './topics.ts'

export const newbornRoutine = topic(
  TOPICS['newborn-routine'],
  [
    question(
      'age',
      'single',
      ['How old is your little one?', 'Πόσο είναι το μικρό σας;'],
      [
        opt('newborn', ['0–3 months', '0–3 μηνών']),
        opt('baby', ['3–12 months', '3–12 μηνών']),
        opt('toddler', ['1–3 years', '1–3 ετών']),
      ],
    ),
    question(
      'support',
      'single',
      ['Who handles the day-to-day?', 'Ποιος φροντίζει την καθημερινότητα;'],
      [
        opt('shared', ['Two of us share it', 'Το μοιραζόμαστε στα δύο']),
        opt('solo', ['Mostly me', 'Κυρίως εγώ']),
        opt('help', ['We have family help', 'Έχουμε βοήθεια από την οικογένεια']),
      ],
    ),
    question(
      'feeling',
      'single',
      ['How are you doing right now?', 'Πώς τα πάτε αυτή την περίοδο;'],
      [
        opt('ok', ['Finding our feet', 'Βρίσκουμε τον ρυθμό μας']),
        opt('tired', ['Running on empty', 'Είμαστε εξαντλημένοι'], { gentle: true }),
      ],
    ),
    question(
      'focus',
      'multi',
      ['What do you want to get on top of?', 'Σε τι θέλεις να βάλεις τάξη;'],
      [
        opt('sleep', ['Naps and nights', 'Μεσημεριανοί ύπνοι και νύχτες']),
        opt('feeding', ['Feeding', 'Τάισμα']),
        opt('laundry', ['Laundry and baby things', 'Πλυντήρια και πράγματα του μωρού']),
        opt('selfcare', ['Time for myself', 'Χρόνος για μένα']),
      ],
      ['Choose all that apply — or none.', 'Διάλεξε όσα ισχύουν — ή κανένα.'],
    ),
    question(
      'time',
      'single',
      [
        'How many minutes a day can go to this plan?',
        'Πόσα λεπτά τη μέρα μπορείς να δώσεις σε αυτό το πλάνο;',
      ],
      [
        opt('t15', ['About 15 minutes', 'Περίπου 15 λεπτά'], { minutes: 15 }),
        opt('t30', ['About 30 minutes', 'Περίπου 30 λεπτά'], { minutes: 30 }),
        opt('t45', ['About 45 minutes', 'Περίπου 45 λεπτά'], { minutes: 45 }),
      ],
    ),
  ],
  [
    daily('bedtime', 10, 5, ['The same short bedtime routine', 'Η ίδια σύντομη βραδινή ρουτίνα'], {
      when: { age: ['baby', 'toddler'] },
      detail: [
        'Wash, pyjamas, a story or a song, lights out — in the same order every night.',
        'Πλύσιμο, πιτζάμες, ένα παραμύθι ή τραγούδι, φώτα κλειστά — με την ίδια σειρά κάθε βράδυ.',
      ],
    }),
    daily(
      'rest-nap',
      1,
      5,
      [
        'When the baby naps, rest first — chores second',
        'Όταν κοιμάται το μωρό, ξεκουράσου πρώτα — οι δουλειές μετά',
      ],
      {
        when: { age: ['newborn', 'baby'] },
      },
    ),
    daily('meal-water', 3, 6, [
      'Sit down for a real meal and a glass of water',
      'Κάτσε να φας ένα κανονικό γεύμα και πιες ένα ποτήρι νερό',
    ]),
    daily(
      'safe-sleep',
      1,
      5,
      [
        'Safe-sleep check: on the back, in a clear cot',
        'Έλεγχος ασφαλούς ύπνου: ανάσκελα, σε κούνια χωρίς τίποτα χαλαρό μέσα',
      ],
      {
        when: { age: ['newborn', 'baby'] },
      },
    ),
    daily('station', 3, 4, [
      'Restock the changing station: nappies, wipes, cream',
      'Συμπλήρωσε την αλλαξιέρα: πάνες, μωρομάντηλα, κρέμα',
    ]),
    daily(
      'feed-log',
      2,
      4,
      [
        'Jot down feeds and nappies roughly — handy for check-ups',
        'Σημείωσε χοντρικά ταΐσματα και πάνες — χρήσιμο για τους ελέγχους',
      ],
      {
        when: { focus: ['feeding'], age: ['newborn', 'baby'] },
      },
    ),
    daily(
      'bottles',
      10,
      5,
      [
        'Wash and sterilise bottles and pump parts',
        'Πλύνε και αποστείρωσε μπιμπερό και εξαρτήματα θήλαστρου',
      ],
      {
        when: { focus: ['feeding'], age: ['newborn', 'baby'] },
      },
    ),
    daily(
      'feed-spot',
      2,
      3,
      [
        'Ready the feeding spot: water, burp cloth, charger',
        'Ετοίμασε τη γωνιά του ταΐσματος: νερό, πανάκι, φορτιστή',
      ],
      {
        when: { focus: ['feeding'], age: ['newborn'] },
      },
    ),
    daily(
      'tummy',
      5,
      4,
      [
        'Tummy time while awake, always watched',
        'Λίγη ώρα μπρούμυτα όταν είναι ξύπνιο, πάντα με επίβλεψη',
      ],
      {
        when: { age: ['newborn', 'baby'] },
      },
    ),
    daily(
      'read-sing',
      10,
      5,
      ['Read or sing together for ten minutes', 'Διαβάστε ή τραγουδήστε μαζί για δέκα λεπτά'],
      {
        when: { age: ['baby', 'toddler'] },
      },
    ),
    daily(
      'night-dim',
      1,
      3,
      [
        'Night wake-ups: dim light, quiet voice, straight back down',
        'Νυχτερινά ξυπνήματα: χαμηλό φως, σιγανή φωνή, κατευθείαν πάλι για ύπνο',
      ],
      {
        when: { focus: ['sleep'] },
      },
    ),
    daily(
      'nap-log',
      2,
      3,
      ['Note nap times to spot the rhythm', 'Σημείωσε τις ώρες του ύπνου για να φανεί ο ρυθμός'],
      {
        when: { focus: ['sleep'], age: ['newborn', 'baby'] },
      },
    ),
    daily(
      'table',
      1,
      5,
      ['Eat together at the table, screens off', 'Φάτε μαζί στο τραπέζι, χωρίς οθόνες'],
      {
        when: { age: ['toddler'] },
      },
    ),
    weekly(
      'tidy-10',
      10,
      2,
      [
        'A ten-minute tidy of the main room — no more',
        'Δέκα λεπτά συμμάζεμα στο κεντρικό δωμάτιο — όχι παραπάνω',
      ],
      {
        when: { time: ['t30', 't45'] },
        times: 2,
      },
    ),

    weekly('bath', 15, 5, ['Bath time', 'Ώρα για μπάνιο'], { times: 3 }),
    weekly(
      'laundry',
      10,
      4,
      ['Run a load of baby laundry', 'Βάλε ένα πλυντήριο με τα ρούχα του μωρού'],
      {
        times: 3,
      },
    ),
    weekly(
      'fold',
      10,
      3,
      ['Fold and put away the little clothes', 'Δίπλωσε και τακτοποίησε τα ρουχαλάκια'],
      {
        when: { focus: ['laundry'] },
        times: 2,
      },
    ),
    weekly(
      'daylight',
      10,
      3,
      [
        'Ten minutes outside in daylight, pram or carrier',
        'Δέκα λεπτά έξω στο φως της μέρας, με καρότσι ή μάρσιπο',
      ],
      {
        times: 3,
      },
    ),
    weekly(
      'me-time',
      20,
      4,
      [
        'Twenty minutes just for you: a walk, a shower, a book',
        'Είκοσι λεπτά μόνο για σένα: βόλτα, ντους, ένα βιβλίο',
      ],
      {
        when: { focus: ['selfcare'], time: ['t30', 't45'] },
        times: 2,
      },
    ),
    weekly(
      'message',
      5,
      3,
      [
        'Message a friend — about anything but the baby',
        'Στείλε μήνυμα σε έναν φίλο — για οτιδήποτε εκτός από το μωρό',
      ],
      {
        when: { focus: ['selfcare'] },
        times: 2,
      },
    ),
    weekly(
      'swap',
      5,
      4,
      [
        'Swap a lie-in or a night shift with your partner',
        'Μοιραστείτε με τον σύντροφό σου ένα πρωινό ξάπλωμα ή μια νυχτερινή βάρδια',
      ],
      {
        when: { support: ['shared'] },
      },
    ),
    weekly(
      'couple',
      10,
      2,
      [
        'Ten minutes with your partner that are not about logistics',
        'Δέκα λεπτά με τον σύντροφό σου που δεν αφορούν τις υποχρεώσεις',
      ],
      {
        when: { support: ['shared'] },
      },
    ),
    weekly(
      'accept-help',
      5,
      4,
      [
        'Say yes to one offer of help — a meal, a walk with the pram',
        'Πες ναι σε μία προσφορά βοήθειας — ένα φαγητό, μια βόλτα με το καρότσι',
      ],
      {
        when: { support: ['solo', 'help'] },
      },
    ),
    weekly(
      'helpers',
      10,
      3,
      [
        'Give helpers a concrete job: shopping, laundry, an hour with the baby',
        'Δώσε στους βοηθούς συγκεκριμένη δουλειά: ψώνια, πλυντήριο, μία ώρα με το μωρό',
      ],
      {
        when: { support: ['help'] },
      },
    ),
    weekly(
      'solids',
      5,
      4,
      [
        'Starting solids? Ask your paediatrician when and how, then offer one new food at a calm time',
        'Ξεκινάτε στερεές τροφές; Ρώτα τον παιδίατρο πότε και πώς, και δοκίμασε μία νέα τροφή σε ήρεμη ώρα',
      ],
      {
        when: { age: ['baby'], focus: ['feeding'] },
      },
    ),
    weekly(
      'snack-prep',
      15,
      4,
      [
        'Prep toddler snacks and meals for two days',
        'Ετοίμασε σνακ και φαγητά του μικρού για δύο μέρες',
      ],
      {
        when: { age: ['toddler'], focus: ['feeding'] },
      },
    ),
    weekly(
      'park',
      15,
      4,
      [
        'Fifteen minutes at the playground or park',
        'Δεκαπέντε λεπτά στην παιδική χαρά ή στο πάρκο',
      ],
      {
        when: { age: ['toddler'], time: ['t45'] },
        times: 2,
      },
    ),
    weekly(
      'nails',
      5,
      2,
      ['Trim the little nails (easiest while asleep)', 'Κόψε τα νυχάκια (πιο εύκολα όσο κοιμάται)'],
      {
        when: { age: ['newborn', 'baby'] },
      },
    ),
    weekly('bag', 10, 3, ['Repack the changing bag', 'Ξαναγέμισε την τσάντα αλλαξιέρας']),
    weekly(
      'batch',
      20,
      4,
      [
        'Cook a double dinner and freeze half',
        'Μαγείρεψε διπλή μερίδα φαγητό και κατέψυξε τη μισή',
      ],
      {
        when: { time: ['t45'] },
      },
    ),
    weekly(
      'groceries',
      10,
      3,
      [
        'Order the groceries online or hand the list to a helper',
        'Παράγγειλε τα ψώνια online ή δώσε τη λίστα σε κάποιον που βοηθά',
      ],
      {
        day: 'thu',
      },
    ),

    kickoff(
      'ko-numbers',
      5,
      5,
      [
        'Pin the paediatrician’s and the out-of-hours numbers by the fridge',
        'Κόλλησε στο ψυγείο τα τηλέφωνα του παιδιάτρου και της εφημερίας',
      ],
      {
        detail: [
          'For any medicine or a fever, ask the paediatrician or a pharmacist — never guess a dose.',
          'Για οποιοδήποτε φάρμακο ή πυρετό, ρώτα τον παιδίατρο ή τον φαρμακοποιό — ποτέ μη μαντεύεις τη δόση.',
        ],
      },
    ),
    kickoff('ko-station', 15, 4, [
      'Set up one changing spot with everything in reach',
      'Στήσε μία γωνιά αλλαξιέρας με όλα πρόχειρα',
    ]),
    kickoff('ko-lower', 5, 4, [
      'Lower the bar: list what can wait three months',
      'Χαμήλωσε τον πήχη: γράψε τι μπορεί να περιμένει τρεις μήνες',
    ]),
    kickoff(
      'ko-helpers',
      10,
      4,
      ['List who can help with what', 'Γράψε ποιος μπορεί να βοηθήσει και σε τι'],
      {
        when: { support: ['solo', 'help'] },
      },
    ),
    kickoff(
      'ko-mood',
      5,
      3,
      [
        'Low or anxious for more than two weeks? Tell your doctor or midwife',
        'Νιώθεις πεσμένα ή αγχωμένα πάνω από δύο εβδομάδες; Πες το στον γιατρό ή στη μαία σου',
      ],
      {
        when: { feeling: ['tired'] },
        detail: [
          'It is common after a baby, it is not your fault, and it can be helped.',
          'Είναι συχνό μετά από ένα μωρό, δεν φταις εσύ, και υπάρχει βοήθεια.',
        ],
      },
    ),

    monthly('checkups', 10, 5, [
      'Check the check-up and vaccination calendar with your paediatrician',
      'Δες με τον παιδίατρο το ημερολόγιο ελέγχων και εμβολίων',
    ]),
    monthly(
      'childproof',
      20,
      4,
      [
        'Childproof one more area: sockets, corners, cupboards',
        'Ασφάλισε ακόμη ένα σημείο του σπιτιού: πρίζες, γωνίες, ντουλάπια',
      ],
      {
        when: { age: ['baby', 'toddler'] },
      },
    ),
    monthly('stock', 15, 3, [
      'Stock-take: nappies, wipes, cream, the next size',
      'Απογραφή: πάνες, μωρομάντηλα, κρέμα, το επόμενο νούμερο',
    ]),
    monthly('outgrown', 20, 3, [
      'Put away outgrown clothes and note the next size',
      'Μάζεψε τα ρούχα που μίκρυναν και σημείωσε το επόμενο νούμερο',
    ]),
    monthly('review', 10, 3, [
      'What worked this month? Keep one thing, drop one',
      'Τι λειτούργησε αυτόν τον μήνα; Κράτα ένα, άφησε ένα',
    ]),
    monthly('photos', 15, 2, [
      'Back up this month’s photos',
      'Κράτα αντίγραφο από τις φωτογραφίες του μήνα',
    ]),
  ],
)
