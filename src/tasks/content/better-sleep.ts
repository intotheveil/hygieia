// TASKS ADVISOR topic: better sleep (P9). Lazy chunk (./index.ts). Habits only — never medical
// advice; persistent sleep trouble is pointed to a doctor in one task, without diagnosing.
import { daily, kickoff, monthly, opt, question, topic, weekly } from './build.ts'
import { TOPICS } from './topics.ts'

export const betterSleep = topic(
  TOPICS['better-sleep'],
  [
    question(
      'feel',
      'single',
      ['How do you feel most mornings?', 'Πώς νιώθεις τα περισσότερα πρωινά;'],
      [
        opt('rested', ['Mostly rested', 'Συνήθως ξεκούραστος/η']),
        opt('tired', ['Tired', 'Κουρασμένος/η'], { gentle: true }),
        opt('exhausted', ['Exhausted', 'Εξαντλημένος/η'], { gentle: true }),
      ],
    ),
    question(
      'bedtime',
      'single',
      ['When do you usually go to bed?', 'Τι ώρα πας συνήθως για ύπνο;'],
      [
        opt('early', ['Before 23:00', 'Πριν τις 23:00']),
        opt('late', ['After midnight', 'Μετά τα μεσάνυχτα']),
        opt('varies', ['It changes a lot', 'Αλλάζει πολύ']),
      ],
    ),
    question(
      'issues',
      'multi',
      ['What gets in the way?', 'Τι σε δυσκολεύει;'],
      [
        opt('falling', ['Falling asleep', 'Να με πάρει ο ύπνος']),
        opt('waking', ['Waking up in the night', 'Ξυπνάω μέσα στη νύχτα']),
        opt('screens', ['Phone or TV in bed', 'Κινητό ή τηλεόραση στο κρεβάτι']),
        opt('caffeine', ['Coffee late in the day', 'Καφές αργά μέσα στη μέρα']),
        opt('noise', ['Noise or light in the bedroom', 'Θόρυβος ή φως στο υπνοδωμάτιο']),
      ],
      ['Choose all that apply — or none.', 'Διάλεξε όσα ισχύουν — ή κανένα.'],
    ),
    question(
      'time',
      'single',
      [
        'How long can your wind-down be?',
        'Πόσο χρόνο μπορείς να δώσεις στη χαλάρωση πριν τον ύπνο;',
      ],
      [
        opt('t10', ['About 10 minutes', 'Περίπου 10 λεπτά'], { minutes: 10 }),
        opt('t20', ['About 20 minutes', 'Περίπου 20 λεπτά'], { minutes: 20 }),
        opt('t30', ['About 30 minutes', 'Περίπου 30 λεπτά'], { minutes: 30 }),
      ],
    ),
  ],
  [
    daily('same-wake', 1, 5, [
      'Get up at the same time, weekends too',
      'Ξύπνα την ίδια ώρα, και τα Σαββατοκύριακα',
    ]),
    daily('daylight', 5, 4, [
      'Five minutes of daylight soon after waking',
      'Πέντε λεπτά φως της μέρας λίγο μετά το ξύπνημα',
    ]),
    daily('alarm-bed', 1, 4, [
      'Set a “start winding down” alarm',
      'Βάλε ξυπνητήρι «ώρα για χαλάρωση»',
    ]),
    daily('dim', 2, 3, [
      'Dim the lights an hour before bed',
      'Χαμήλωσε τα φώτα μία ώρα πριν τον ύπνο',
    ]),
    daily(
      'phone-out',
      2,
      5,
      ['Phone charges outside the bedroom', 'Το κινητό φορτίζει έξω από το υπνοδωμάτιο'],
      {
        when: { issues: ['screens'] },
      },
    ),
    daily(
      'screens-off',
      1,
      4,
      ['Screens off 30 minutes before bed', 'Οθόνες κλειστές 30 λεπτά πριν τον ύπνο'],
      {
        when: { issues: ['screens', 'falling'] },
      },
    ),
    daily('coffee-cutoff', 1, 5, ['Last coffee before 14:00', 'Τελευταίος καφές πριν τις 14:00'], {
      when: { issues: ['caffeine'] },
    }),
    daily(
      'read',
      10,
      5,
      [
        'Read a paper book in bed for ten minutes',
        'Διάβασε ένα βιβλίο (σε χαρτί) δέκα λεπτά στο κρεβάτι',
      ],
      {
        when: { time: ['t20', 't30'] },
      },
    ),
    daily(
      'breathing',
      5,
      5,
      ['Slow breathing: in for 4, out for 6', 'Αργές αναπνοές: εισπνοή στα 4, εκπνοή στα 6'],
      {
        when: { issues: ['falling', 'waking'] },
      },
    ),
    daily(
      'brain-dump',
      5,
      5,
      [
        'Write tomorrow’s worries on paper, then close the notebook',
        'Γράψε σε χαρτί τις έγνοιες για αύριο και κλείσε το τετράδιο',
      ],
      {
        when: { issues: ['falling', 'waking'] },
      },
    ),
    daily('stretch', 5, 4, ['Five minutes of gentle stretching', 'Πέντε λεπτά ήπιες διατάσεις'], {
      when: { time: ['t20', 't30'] },
    }),
    daily('cool-room', 1, 2, [
      'Air the bedroom and keep it cool',
      'Άερισε το υπνοδωμάτιο και κράτα το δροσερό',
    ]),
    daily(
      'earlier-15',
      1,
      4,
      [
        'Go to bed 15 minutes earlier than last week',
        'Πήγαινε για ύπνο 15 λεπτά νωρίτερα από την περασμένη εβδομάδα',
      ],
      {
        when: { bedtime: ['late'] },
      },
    ),
    daily(
      'fixed-bedtime',
      1,
      4,
      [
        'Pick a bedtime and keep it within half an hour',
        'Όρισε ώρα ύπνου και κράτα τη μέσα σε μισή ώρα',
      ],
      {
        when: { bedtime: ['varies'] },
      },
    ),
    daily('no-late-meal', 1, 2, [
      'Finish dinner two to three hours before bed',
      'Τελείωσε το βραδινό δύο με τρεις ώρες πριν τον ύπνο',
    ]),
    daily('gratitude', 2, 3, [
      'Note one good thing from today',
      'Σημείωσε ένα καλό πράγμα από τη μέρα',
    ]),
    daily(
      'nap-short',
      1,
      2,
      [
        'If you nap, keep it under 20 minutes and before 15:00',
        'Αν κοιμηθείς το μεσημέρι, κάτω από 20 λεπτά και πριν τις 15:00',
      ],
      {
        when: { feel: ['tired', 'exhausted'] },
      },
    ),
    daily(
      'get-up',
      1,
      2,
      [
        'Awake for ages? Get up, do something calm, return when sleepy',
        'Ξύπνιος/α ώρα πολλή; Σήκω, κάνε κάτι ήρεμο, γύρνα όταν νυστάξεις',
      ],
      {
        when: { issues: ['waking', 'falling'] },
      },
    ),

    weekly(
      'move',
      20,
      4,
      [
        'Twenty minutes of exercise, earlier in the day',
        'Είκοσι λεπτά άσκηση, νωρίτερα μέσα στη μέρα',
      ],
      {
        when: { time: ['t20', 't30'] },
        times: 3,
      },
    ),
    weekly('walk', 10, 3, ['A ten-minute walk outside', 'Μια δεκάλεπτη βόλτα έξω'], { times: 3 }),
    weekly('sheets', 15, 4, ['Fresh sheets', 'Καθαρά σεντόνια'], { day: 'sun' }),
    weekly(
      'sleep-log',
      5,
      3,
      [
        'Look at your week: bedtimes, wake times, how you felt',
        'Κοίτα την εβδομάδα σου: ώρες ύπνου, ξυπνήματος, πώς ένιωσες',
      ],
      {
        day: 'sun',
      },
    ),
    weekly(
      'weekend-limit',
      1,
      3,
      [
        'Weekend lie-in: no more than an hour extra',
        'Το Σαββατοκύριακο: όχι πάνω από μία ώρα παραπάνω ύπνο',
      ],
      {
        day: 'sat',
      },
    ),
    weekly(
      'noise-check',
      10,
      3,
      [
        'Fix one source of light or noise in the bedroom',
        'Λύσε μία πηγή φωτός ή θορύβου στο υπνοδωμάτιο',
      ],
      {
        when: { issues: ['noise'] },
      },
    ),
    weekly('tidy-bedroom', 10, 2, [
      'Clear clutter from the bedroom',
      'Μάζεψε την ακαταστασία από το υπνοδωμάτιο',
    ]),
    weekly('alcohol', 1, 2, [
      'Keep alcohol-free evenings most of the week',
      'Τα περισσότερα βράδια της εβδομάδας χωρίς αλκοόλ',
    ]),
    weekly('screen-free-night', 20, 3, ['One screen-free evening', 'Ένα βράδυ χωρίς οθόνες'], {
      when: { time: ['t30'], issues: ['screens'] },
    }),

    kickoff('ko-pick', 5, 5, [
      'Choose your wake-up time and write it down',
      'Διάλεξε την ώρα που θα ξυπνάς και γράψ’ τη',
    ]),
    kickoff('ko-audit', 10, 5, [
      'Bedroom check: light, noise, temperature, mattress',
      'Έλεγχος υπνοδωματίου: φως, θόρυβος, θερμοκρασία, στρώμα',
    ]),
    kickoff(
      'ko-charger',
      5,
      4,
      [
        'Move the phone charger out of the bedroom',
        'Μετάφερε τον φορτιστή του κινητού έξω από το υπνοδωμάτιο',
      ],
      {
        when: { issues: ['screens'] },
      },
    ),
    kickoff('ko-early', 1, 3, [
      'Tonight, go to bed when you first feel sleepy',
      'Απόψε, πήγαινε για ύπνο μόλις νιώσεις την πρώτη νύστα',
    ]),
    kickoff(
      'ko-doctor',
      5,
      3,
      [
        'Tired for weeks whatever you do? Mention it to your doctor',
        'Κουρασμένος/η εδώ και εβδομάδες ό,τι κι αν κάνεις; Πες το στον γιατρό σου',
      ],
      {
        when: { feel: ['exhausted'] },
      },
    ),

    monthly('pillows', 10, 2, [
      'Wash or air the pillows and duvet',
      'Πλύνε ή άερισε μαξιλάρια και πάπλωμα',
    ]),
    monthly('review', 10, 3, [
      'Which habit helped most? Keep it, drop one that did not',
      'Ποια συνήθεια βοήθησε πιο πολύ; Κράτα τη και άφησε μία που δεν βοήθησε',
    ]),
    monthly('mattress-turn', 10, 2, ['Turn the mattress', 'Γύρισε το στρώμα']),
    monthly('curtains', 15, 1, [
      'Check curtains or blinds block early light',
      'Δες αν κουρτίνες ή στόρια κόβουν το πρωινό φως',
    ]),
  ],
)
