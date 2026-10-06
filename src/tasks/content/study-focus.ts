// TASKS ADVISOR topic: study and focus (P9). Lazy chunk (./index.ts).
import { daily, kickoff, monthly, opt, question, topic, weekly } from './build.ts'
import { TOPICS } from './topics.ts'

export const studyFocus = topic(
  TOPICS['study-focus'],
  [
    question(
      'who',
      'single',
      ['What are you studying for?', 'Για ποιο λόγο διαβάζεις;'],
      [
        opt('school', ['School', 'Σχολείο']),
        opt('uni', ['University', 'Πανεπιστήμιο']),
        opt('work', ['Work or a certificate', 'Δουλειά ή πιστοποίηση']),
        opt('self', ['Learning something for myself', 'Μαθαίνω κάτι για μένα']),
      ],
    ),
    question(
      'habit',
      'single',
      ['Do you study regularly now?', 'Διαβάζεις τακτικά τώρα;'],
      [
        opt('none', ['Not yet', 'Όχι ακόμη'], { gentle: true }),
        opt('onoff', ['On and off', 'Πότε ναι, πότε όχι']),
        opt('steady', ['Yes, steadily', 'Ναι, σταθερά']),
      ],
    ),
    question(
      'time',
      'single',
      [
        'How long can you study on a normal day?',
        'Πόση ώρα μπορείς να διαβάσεις μια συνηθισμένη μέρα;',
      ],
      [
        opt('t30', ['About 30 minutes', 'Περίπου 30 λεπτά'], { minutes: 30 }),
        opt('t60', ['About an hour', 'Περίπου μία ώρα'], { minutes: 60 }),
        opt('t90', ['About an hour and a half', 'Περίπου μιάμιση ώρα'], { minutes: 90 }),
      ],
    ),
    question(
      'trouble',
      'multi',
      ['What gets in the way?', 'Τι σε εμποδίζει;'],
      [
        opt('phone', ['My phone', 'Το κινητό']),
        opt('starting', ['Getting started', 'Το ξεκίνημα']),
        opt('memory', ['Remembering what I studied', 'Να θυμάμαι όσα διάβασα']),
        opt('space', ['No quiet place', 'Δεν έχω ήσυχο χώρο']),
      ],
      ['Choose all that apply — or none.', 'Διάλεξε όσα ισχύουν — ή κανένα.'],
    ),
    question(
      'exam',
      'single',
      ['Is there an exam or deadline?', 'Υπάρχει εξέταση ή προθεσμία;'],
      [
        opt('soon', ['Within a month', 'Μέσα σε έναν μήνα']),
        opt('later', ['Later on', 'Αργότερα']),
        opt('none', ['No', 'Όχι']),
      ],
    ),
  ],
  [
    daily(
      'session-25',
      25,
      6,
      ['One focused 25-minute session', 'Μία συγκεντρωμένη ενότητα 25 λεπτών'],
      {
        when: { habit: ['onoff', 'steady'] },
        detail: [
          'One topic, timer on, phone away. Then a 5-minute break.',
          'Ένα θέμα, χρονόμετρο, κινητό μακριά. Μετά πέντε λεπτά διάλειμμα.',
        ],
      },
    ),
    weekly('session-2', 25, 5, ['A second 25-minute session', 'Δεύτερη ενότητα 25 λεπτών'], {
      when: { time: ['t60', 't90'] },
      times: 5,
    }),
    weekly('session-3', 25, 4, ['A third 25-minute session', 'Τρίτη ενότητα 25 λεπτών'], {
      when: { time: ['t90'] },
      times: 4,
    }),
    daily(
      'session-10',
      10,
      6,
      ['Ten minutes of study — just open the book', 'Δέκα λεπτά διάβασμα — απλώς άνοιξε το βιβλίο'],
      {
        when: { habit: ['none'] },
      },
    ),
    daily(
      'phone-away',
      1,
      5,
      ['Phone in another room while you study', 'Το κινητό σε άλλο δωμάτιο όσο διαβάζεις'],
      {
        when: { trouble: ['phone'] },
      },
    ),
    daily(
      'first-step',
      2,
      5,
      ['Write the very first step before you begin', 'Γράψε το πρώτο-πρώτο βήμα πριν ξεκινήσεις'],
      {
        when: { trouble: ['starting'] },
      },
    ),
    daily(
      'two-minute',
      2,
      4,
      [
        'The two-minute start: promise yourself only two minutes',
        'Το ξεκίνημα των δύο λεπτών: υποσχέσου μόνο δύο λεπτά',
      ],
      {
        when: { trouble: ['starting'] },
      },
    ),
    daily(
      'recall',
      5,
      5,
      ['Close the book and write what you remember', 'Κλείσε το βιβλίο και γράψε ό,τι θυμάσαι'],
      {
        when: { trouble: ['memory'] },
      },
    ),
    daily('flashcards', 10, 5, ['Ten minutes of flashcards', 'Δέκα λεπτά με κάρτες επανάληψης'], {
      when: { trouble: ['memory'], time: ['t60', 't90'] },
    }),
    daily('desk-clear', 2, 3, [
      'Clear the desk before and after',
      'Καθάρισε το γραφείο πριν και μετά',
    ]),
    daily('same-time', 1, 4, ['Study at the same time each day', 'Διάβαζε την ίδια ώρα κάθε μέρα']),
    daily('tomorrow', 2, 3, [
      'Note what tomorrow’s session will cover',
      'Σημείωσε τι θα καλύψει η αυριανή ενότητα',
    ]),
    daily(
      'headphones',
      1,
      3,
      ['Headphones on, quiet music or silence', 'Ακουστικά, ήσυχη μουσική ή σιωπή'],
      { when: { trouble: ['space'] } },
    ),
    daily('move-break', 3, 2, [
      'Stand up and move in every break',
      'Σήκω και κινήσου σε κάθε διάλειμμα',
    ]),
    weekly(
      'past-paper',
      25,
      5,
      ['Practice questions under time pressure', 'Ασκήσεις με χρονόμετρο, σαν εξέταση'],
      {
        when: { exam: ['soon'], time: ['t60', 't90'] },
        times: 3,
      },
    ),

    weekly(
      'plan-week',
      15,
      5,
      ['Plan next week: topics per day', 'Σχεδίασε την επόμενη εβδομάδα: θέματα ανά μέρα'],
      { day: 'sun' },
    ),
    weekly(
      'review-week',
      20,
      5,
      [
        'Weekly review: go over everything from this week',
        'Εβδομαδιαία επανάληψη όλων όσων διάβασες',
      ],
      {
        day: 'sat',
      },
    ),
    weekly(
      'review-short',
      10,
      4,
      [
        'Ten-minute review of the week’s notes',
        'Δεκάλεπτη επανάληψη στις σημειώσεις της εβδομάδας',
      ],
      {
        when: { time: ['t30'] },
        day: 'sat',
      },
    ),
    weekly(
      'mock',
      50,
      6,
      ['Mock test under exam conditions', 'Δοκιμαστικό διαγώνισμα σε συνθήκες εξέτασης'],
      {
        when: { exam: ['soon'], time: ['t90'] },
        day: 'sat',
      },
    ),
    weekly('mock-short', 30, 5, ['Half a mock test, timed', 'Μισό δοκιμαστικό, με χρονόμετρο'], {
      when: { exam: ['soon'], time: ['t60'] },
    }),
    weekly(
      'teach',
      15,
      3,
      [
        'Explain a topic out loud as if teaching it',
        'Εξήγησε ένα θέμα φωναχτά σαν να το διδάσκεις',
      ],
      {
        when: { trouble: ['memory'] },
        times: 2,
      },
    ),
    weekly(
      'library',
      50,
      5,
      ['A session at the library or a quiet café', 'Διάβασμα σε βιβλιοθήκη ή σε ήσυχο καφέ'],
      {
        when: { trouble: ['space'], time: ['t90'] },
      },
    ),
    weekly(
      'quiet-hours',
      5,
      3,
      [
        'Agree quiet hours with the people you live with',
        'Συμφωνήστε ώρες ησυχίας με όσους μένετε μαζί',
      ],
      {
        when: { trouble: ['space'] },
      },
    ),
    weekly(
      'notes-tidy',
      15,
      3,
      ['Tidy and summarise your notes', 'Οργάνωσε και συνόψισε τις σημειώσεις σου'],
      {
        when: { time: ['t60', 't90'] },
      },
    ),
    weekly(
      'ask',
      10,
      3,
      [
        'Write down questions and ask a teacher or colleague',
        'Γράψε απορίες και ρώτα έναν καθηγητή ή συνάδελφο',
      ],
      {
        when: { who: ['school', 'uni', 'work'] },
      },
    ),
    weekly('study-buddy', 25, 3, ['A study session with a friend', 'Διάβασμα με έναν φίλο'], {
      when: { who: ['school', 'uni'], time: ['t60', 't90'] },
    }),
    weekly(
      'project',
      30,
      3,
      ['Make something with what you learned', 'Φτιάξε κάτι με όσα έμαθες'],
      { when: { who: ['self'], time: ['t60', 't90'] } },
    ),
    weekly(
      'rest-day',
      1,
      3,
      [
        'One full day off — rest helps memory',
        'Μία ολόκληρη μέρα ρεπό — η ξεκούραση βοηθά τη μνήμη',
      ],
      { day: 'sun' },
    ),
    weekly(
      'app-limits',
      5,
      3,
      [
        'Set app limits for the most distracting apps',
        'Βάλε όρια χρήσης στις εφαρμογές που σε αποσπούν πιο πολύ',
      ],
      {
        when: { trouble: ['phone'] },
      },
    ),

    kickoff('ko-space', 15, 5, [
      'Set up one study spot: chair, light, everything at hand',
      'Στήσε ένα σημείο μελέτης: καρέκλα, φως, όλα πρόχειρα',
    ]),
    kickoff('ko-materials', 10, 4, [
      'Gather all materials in one folder',
      'Μάζεψε όλο το υλικό σε έναν φάκελο',
    ]),
    kickoff('ko-map', 15, 4, [
      'Map the topics: what you know, what you do not',
      'Χαρτογράφησε την ύλη: τι ξέρεις, τι όχι',
    ]),
    kickoff('ko-timer', 2, 3, [
      'Pick a timer you will use every session',
      'Διάλεξε ένα χρονόμετρο που θα χρησιμοποιείς σε κάθε ενότητα',
    ]),

    monthly('progress', 15, 4, [
      'Check progress against the topic map',
      'Έλεγξε την πρόοδο σε σχέση με τον χάρτη της ύλης',
    ]),
    monthly('big-review', 25, 3, [
      'A cumulative review of the month',
      'Συνολική επανάληψη του μήνα',
    ]),
    monthly('method', 10, 2, [
      'Try one new study method for a week',
      'Δοκίμασε μία νέα μέθοδο μελέτης για μια εβδομάδα',
    ]),
    monthly('reward', 5, 2, [
      'Reward a month of steady work',
      'Επιβράβευσε έναν μήνα σταθερής δουλειάς',
    ]),
  ],
)
