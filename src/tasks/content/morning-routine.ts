// TASKS ADVISOR topic: a morning routine (P9). Lazy chunk (./index.ts).
import { daily, kickoff, monthly, opt, question, topic, weekly } from './build.ts'
import { TOPICS } from './topics.ts'

export const morningRoutine = topic(
  TOPICS['morning-routine'],
  [
    question(
      'mornings',
      'single',
      ['How do your mornings feel now?', 'Πώς είναι τα πρωινά σου τώρα;'],
      [
        opt('rushed', ['Rushed and chaotic', 'Βιαστικά και χαοτικά'], { gentle: true }),
        opt('okay', ['Okay, but could be calmer', 'Εντάξει, αλλά θα μπορούσαν να είναι πιο ήρεμα']),
        opt('good', ['Good — I want to make the most of them', 'Καλά — θέλω να τα αξιοποιήσω']),
      ],
    ),
    question(
      'time',
      'single',
      ['How much time could your routine take?', 'Πόσο χρόνο μπορεί να πάρει η ρουτίνα σου;'],
      [
        opt('t10', ['About 10 minutes', 'Περίπου 10 λεπτά'], { minutes: 10 }),
        opt('t20', ['About 20 minutes', 'Περίπου 20 λεπτά'], { minutes: 20 }),
        opt('t40', ['About 40 minutes', 'Περίπου 40 λεπτά'], { minutes: 40 }),
      ],
    ),
    question(
      'wants',
      'multi',
      ['What would you like your mornings to include?', 'Τι θα ήθελες να έχουν τα πρωινά σου;'],
      [
        opt('move', ['Some movement', 'Λίγη κίνηση']),
        opt('calm', ['A calm moment', 'Μια ήρεμη στιγμή']),
        opt('plan', ['A plan for the day', 'Ένα πλάνο για τη μέρα']),
        opt('breakfast', ['A proper breakfast', 'Ένα κανονικό πρωινό']),
        opt('read', ['Reading or learning', 'Διάβασμα ή κάτι καινούργιο']),
      ],
      ['Choose any — or none.', 'Διάλεξε όσα θέλεις — ή κανένα.'],
    ),
    question(
      'others',
      'multi',
      ['Who else is part of your morning?', 'Ποιος άλλος είναι μέρος του πρωινού σου;'],
      [
        opt('kids', ['Kids to get ready', 'Παιδιά που ετοιμάζονται']),
        opt('dog', ['A dog to walk', 'Σκύλος για βόλτα']),
      ],
      ['Choose any — or none.', 'Διάλεξε όσα ισχύουν — ή κανένα.'],
    ),
  ],
  [
    daily('same-time', 1, 5, ['Wake at the same time every day', 'Ξύπνα την ίδια ώρα κάθε μέρα']),
    daily('no-snooze', 1, 4, [
      'Alarm across the room: no snooze',
      'Ξυπνητήρι στην άλλη άκρη του δωματίου: χωρίς αναβολή',
    ]),
    daily('water', 1, 4, ['A glass of water first thing', 'Ένα ποτήρι νερό πρώτο-πρώτο']),
    daily('light', 2, 4, [
      'Open the curtains and let the light in',
      'Άνοιξε τις κουρτίνες και άφησε το φως να μπει',
    ]),
    daily('bed', 2, 3, ['Make the bed', 'Στρώσε το κρεβάτι']),
    daily('no-phone-15', 1, 4, [
      'No phone for the first 15 minutes',
      'Χωρίς κινητό τα πρώτα 15 λεπτά',
    ]),
    daily('stretch', 5, 5, ['Five minutes of stretching', 'Πέντε λεπτά διατάσεις'], {
      when: { wants: ['move'] },
    }),
    daily(
      'workout',
      15,
      5,
      ['A fifteen-minute workout or brisk walk', 'Δεκαπεντάλεπτη γυμναστική ή γρήγορο περπάτημα'],
      {
        when: { wants: ['move'], time: ['t40'] },
      },
    ),
    daily(
      'breathe',
      3,
      4,
      [
        'Three minutes sitting quietly with a coffee or tea',
        'Τρία λεπτά ήσυχα με έναν καφέ ή ένα τσάι',
      ],
      {
        when: { wants: ['calm'] },
      },
    ),
    daily('meditate', 10, 5, ['Ten minutes of meditation', 'Δέκα λεπτά διαλογισμός'], {
      when: { wants: ['calm'], time: ['t20', 't40'] },
    }),
    daily(
      'plan',
      3,
      4,
      ['Write the day’s top three on a card', 'Γράψε τα τρία σημαντικότερα της μέρας σε μια κάρτα'],
      {
        when: { wants: ['plan'] },
      },
    ),
    daily(
      'calendar',
      2,
      4,
      ['Glance at today’s calendar', 'Ρίξε μια ματιά στο σημερινό πρόγραμμα'],
      { when: { wants: ['plan'] } },
    ),
    daily('breakfast', 10, 4, ['Sit down for breakfast', 'Κάτσε για πρωινό'], {
      when: { wants: ['breakfast'], time: ['t20', 't40'] },
    }),
    daily(
      'quick-breakfast',
      3,
      4,
      [
        'Grab-and-go breakfast: yoghurt, fruit or a sandwich',
        'Πρωινό στο χέρι: γιαούρτι, φρούτο ή σάντουιτς',
      ],
      {
        when: { wants: ['breakfast'], time: ['t10'] },
      },
    ),
    daily('read', 10, 5, ['Ten pages of a book', 'Δέκα σελίδες από ένα βιβλίο'], {
      when: { wants: ['read'], time: ['t20', 't40'] },
    }),
    daily(
      'podcast',
      1,
      2,
      ['A podcast or audiobook while you get ready', 'Podcast ή ηχητικό βιβλίο όσο ετοιμάζεσαι'],
      {
        when: { wants: ['read'] },
      },
    ),
    daily(
      'kids-checklist',
      2,
      4,
      ['Kids follow their picture checklist', 'Τα παιδιά ακολουθούν τη λίστα τους με εικόνες'],
      {
        when: { others: ['kids'] },
      },
    ),
    daily(
      'dog-walk',
      15,
      4,
      [
        'Morning dog walk — leave the phone in your pocket',
        'Πρωινή βόλτα με τον σκύλο — το κινητό στην τσέπη',
      ],
      {
        when: { others: ['dog'] },
      },
    ),
    daily(
      'evening-prep',
      5,
      5,
      [
        'The night before: clothes, bag and keys ready',
        'Από το βράδυ: ρούχα, τσάντα και κλειδιά έτοιμα',
      ],
      {
        when: { mornings: ['rushed', 'okay'] },
      },
    ),
    daily('bedtime', 1, 3, [
      'In bed on time, so the alarm is not a shock',
      'Στο κρεβάτι στην ώρα σου, για να μη σε «χτυπήσει» το ξυπνητήρι',
    ]),

    weekly(
      'lunches',
      15,
      3,
      ['Prepare lunches for the next days', 'Ετοίμασε φαγητά για τις επόμενες μέρες'],
      {
        when: { time: ['t20', 't40'] },
        day: 'sun',
      },
    ),
    weekly(
      'week-look',
      10,
      4,
      [
        'Sunday: look at the week and plan the busy mornings',
        'Κυριακή: κοίτα την εβδομάδα και σχεδίασε τα πιο γεμάτα πρωινά',
      ],
      {
        day: 'sun',
      },
    ),
    weekly(
      'slow-morning',
      30,
      3,
      [
        'A slow weekend morning: long breakfast, no rush',
        'Αργό πρωινό Σαββατοκύριακου: μεγάλο πρωινό, χωρίς βιασύνη',
      ],
      {
        when: { time: ['t40'] },
        day: 'sat',
      },
    ),
    weekly('sunrise-walk', 20, 2, ['A walk at sunrise', 'Βόλτα με την ανατολή'], {
      when: { wants: ['move', 'calm'], time: ['t20', 't40'] },
    }),
    weekly('entrance', 10, 3, [
      'Reset the entrance: hooks, keys, shoes',
      'Τακτοποίησε την είσοδο: κρεμάστρες, κλειδιά, παπούτσια',
    ]),
    weekly(
      'kids-bags',
      10,
      3,
      [
        'Pack school bags for the week with the kids',
        'Ετοιμάστε μαζί με τα παιδιά τις σχολικές τσάντες',
      ],
      {
        when: { others: ['kids'] },
        day: 'sun',
      },
    ),
    weekly(
      'adjust',
      5,
      3,
      [
        'Which step did you skip most? Make it easier',
        'Ποιο βήμα παρέλειψες πιο συχνά; Κάν’ το πιο εύκολο',
      ],
      { day: 'fri' },
    ),
    weekly(
      'journal',
      10,
      2,
      ['Morning pages: write whatever comes', 'Πρωινές σελίδες: γράψε ό,τι σου έρθει'],
      {
        when: { wants: ['calm', 'plan'], time: ['t20', 't40'] },
        times: 2,
      },
    ),

    kickoff('ko-order', 5, 5, [
      'Write your routine as a short numbered list',
      'Γράψε τη ρουτίνα σου ως σύντομη λίστα με αριθμούς',
    ]),
    kickoff('ko-one-step', 5, 4, [
      'Start with just one new step this week',
      'Ξεκίνα με ένα μόνο καινούργιο βήμα αυτή την εβδομάδα',
    ]),
    kickoff('ko-launchpad', 10, 4, [
      'Set up a “launch pad” by the door for keys and bag',
      'Φτιάξε μια «βάση εκκίνησης» δίπλα στην πόρτα για κλειδιά και τσάντα',
    ]),
    kickoff('ko-time', 5, 3, [
      'Time your current morning once — no changes, just measure',
      'Χρονομέτρησε μία φορά το σημερινό σου πρωινό — χωρίς αλλαγές, απλώς μέτρα',
    ]),

    monthly('review', 10, 3, [
      'Review the routine: what to keep, what to drop',
      'Ανασκόπηση ρουτίνας: τι κρατάς, τι αφήνεις',
    ]),
    monthly('new-habit', 5, 2, [
      'Try one new small habit for a month',
      'Δοκίμασε μία νέα μικρή συνήθεια για έναν μήνα',
    ]),
    monthly('wardrobe', 15, 2, [
      'Clear clothes you never reach for in the morning',
      'Βγάλε τα ρούχα που δεν διαλέγεις ποτέ το πρωί',
    ]),
  ],
)
