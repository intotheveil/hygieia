// TASKS ADVISOR topic: less stress, more calm (P9). Lazy chunk (./index.ts). Everyday habits, not
// therapy; the "overwhelmed" answer adds a plain pointer to people who can help.
import { daily, kickoff, monthly, opt, question, topic, weekly } from './build.ts'
import { TOPICS } from './topics.ts'

export const reduceStress = topic(
  TOPICS['reduce-stress'],
  [
    question(
      'level',
      'single',
      ['How stressed do you feel lately?', 'Πόσο αγχωμένος/η νιώθεις τελευταία;'],
      [
        opt('mild', ['A little, now and then', 'Λίγο, πού και πού']),
        opt('often', ['Often', 'Συχνά'], { gentle: true }),
        opt('overwhelmed', ['Overwhelmed', 'Με έχει κατακλύσει'], { gentle: true }),
      ],
    ),
    question(
      'sources',
      'multi',
      ['Where does it mostly come from?', 'Από πού έρχεται κυρίως;'],
      [
        opt('work', ['Work or studies', 'Δουλειά ή σπουδές']),
        opt('home', ['Home and family', 'Σπίτι και οικογένεια']),
        opt('money', ['Money', 'Οικονομικά']),
        opt('news', ['News and social media', 'Ειδήσεις και social media']),
      ],
      ['Choose all that apply — or none.', 'Διάλεξε όσα ισχύουν — ή κανένα.'],
    ),
    question(
      'likes',
      'multi',
      ['What helps you unwind?', 'Τι σε βοηθά να χαλαρώσεις;'],
      [
        opt('breathing', ['Breathing or meditation', 'Αναπνοές ή διαλογισμός']),
        opt('movement', ['Moving my body', 'Κίνηση']),
        opt('nature', ['Being outdoors', 'Η φύση, ο έξω χώρος']),
        opt('writing', ['Writing things down', 'Να γράφω']),
        opt('music', ['Music', 'Μουσική']),
      ],
      [
        'Choose any — or none if you are not sure yet.',
        'Διάλεξε όσα θέλεις — ή κανένα αν δεν είσαι σίγουρος/η ακόμη.',
      ],
    ),
    question(
      'time',
      'single',
      [
        'How much time can you give yourself a day?',
        'Πόσο χρόνο μπορείς να δώσεις στον εαυτό σου τη μέρα;',
      ],
      [
        opt('t5', ['About 5 minutes', 'Περίπου 5 λεπτά'], { minutes: 5 }),
        opt('t15', ['About 15 minutes', 'Περίπου 15 λεπτά'], { minutes: 15 }),
        opt('t30', ['About 30 minutes', 'Περίπου 30 λεπτά'], { minutes: 30 }),
      ],
    ),
  ],
  [
    daily('three-breaths', 1, 5, [
      'Three slow breaths before you open your phone',
      'Τρεις αργές ανάσες πριν ανοίξεις το κινητό',
    ]),
    daily(
      'box-breathing',
      4,
      4,
      [
        'Box breathing: 4 in, 4 hold, 4 out, 4 hold',
        'Αναπνοή «κουτί»: 4 μέσα, 4 κράτημα, 4 έξω, 4 κράτημα',
      ],
      {
        when: { likes: ['breathing'] },
      },
    ),
    daily(
      'meditate',
      10,
      4,
      ['Ten minutes of guided meditation', 'Δέκα λεπτά καθοδηγούμενος διαλογισμός'],
      {
        when: { likes: ['breathing'], time: ['t15', 't30'] },
      },
    ),
    daily(
      'walk-10',
      10,
      4,
      ['A ten-minute walk, phone in your pocket', 'Δεκάλεπτη βόλτα, με το κινητό στην τσέπη'],
      {
        when: { likes: ['movement', 'nature'], time: ['t15', 't30'] },
      },
    ),
    daily('stretch', 3, 3, [
      'Shoulders, neck and jaw: a three-minute release',
      'Ώμοι, αυχένας, σαγόνι: τρία λεπτά χαλάρωμα',
    ]),
    daily(
      'journal',
      5,
      4,
      ['Write for five minutes: what is on your mind', 'Γράψε για πέντε λεπτά ό,τι σε απασχολεί'],
      {
        when: { likes: ['writing'] },
      },
    ),
    daily(
      'one-song',
      4,
      3,
      [
        'One song, eyes closed, doing nothing else',
        'Ένα τραγούδι, με κλειστά μάτια, χωρίς να κάνεις τίποτε άλλο',
      ],
      {
        when: { likes: ['music'] },
      },
    ),
    daily(
      'top-three',
      3,
      4,
      ['Pick today’s three most important things', 'Διάλεξε τα τρία σημαντικότερα της μέρας'],
      {
        when: { sources: ['work', 'home'] },
      },
    ),
    daily(
      'shutdown',
      5,
      4,
      [
        'End-of-work shutdown: write tomorrow’s first step, close the laptop',
        'Κλείσιμο δουλειάς: γράψε το πρώτο βήμα για αύριο και κλείσε τον υπολογιστή',
      ],
      {
        when: { sources: ['work'] },
      },
    ),
    daily(
      'news-window',
      1,
      4,
      [
        'News only once a day, at a set time',
        'Ειδήσεις μόνο μία φορά τη μέρα, σε συγκεκριμένη ώρα',
      ],
      {
        when: { sources: ['news'] },
      },
    ),
    daily('no-scroll-bed', 1, 3, ['No scrolling in bed', 'Όχι scroll στο κρεβάτι'], {
      when: { sources: ['news'] },
    }),
    daily(
      'outside',
      5,
      3,
      [
        'Five minutes outside, looking at the sky or trees',
        'Πέντε λεπτά έξω, κοιτώντας τον ουρανό ή τα δέντρα',
      ],
      {
        when: { likes: ['nature'] },
      },
    ),
    daily('kind-word', 1, 2, [
      'Say one kind thing to yourself — as you would to a friend',
      'Πες ένα καλό λόγο στον εαυτό σου — όπως θα έλεγες σε έναν φίλο',
    ]),
    daily('water-pause', 1, 2, [
      'A glass of water and a pause between tasks',
      'Ένα ποτήρι νερό και μια παύση ανάμεσα στις δουλειές',
    ]),
    daily('gratitude', 2, 3, [
      'Three good things from today',
      'Τρία καλά πράγματα από τη σημερινή μέρα',
    ]),
    daily(
      'body-scan',
      5,
      2,
      ['A five-minute body scan before sleep', 'Πεντάλεπτη «σάρωση σώματος» πριν τον ύπνο'],
      {
        when: { time: ['t15', 't30'] },
      },
    ),

    weekly(
      'exercise',
      20,
      5,
      ['Twenty-five minutes of exercise you enjoy', 'Είκοσι πέντε λεπτά άσκηση που σου αρέσει'],
      {
        when: { likes: ['movement'], time: ['t30'] },
        times: 3,
      },
    ),
    weekly('nature-walk', 20, 5, ['A walk somewhere green', 'Βόλτα κάπου με πράσινο'], {
      when: { likes: ['nature'], time: ['t30'] },
      day: 'sat',
    }),
    weekly(
      'friend',
      15,
      4,
      [
        'Call or meet a friend — just to talk',
        'Πάρε τηλέφωνο ή συνάντησε έναν φίλο — μόνο για κουβέντα',
      ],
      {
        when: { time: ['t15', 't30'] },
      },
    ),
    weekly('message-friend', 2, 3, [
      'Message someone you miss',
      'Στείλε μήνυμα σε κάποιον που σου λείπει',
    ]),
    weekly(
      'plan-week',
      15,
      4,
      [
        'Sunday: look at the week ahead and lighten one day',
        'Κυριακή: κοίτα την εβδομάδα που έρχεται και ελάφρυνε μία μέρα',
      ],
      {
        when: { time: ['t15', 't30'] },
        day: 'sun',
      },
    ),
    weekly(
      'budget-check',
      10,
      4,
      [
        'Ten-minute money check: what is in, what is out',
        'Δεκάλεπτος έλεγχος οικονομικών: τι μπαίνει, τι βγαίνει',
      ],
      {
        when: { sources: ['money'], time: ['t15', 't30'] },
      },
    ),
    weekly(
      'one-bill',
      5,
      3,
      [
        'Deal with one money task you have been avoiding',
        'Τακτοποίησε μία οικονομική εκκρεμότητα που αναβάλλεις',
      ],
      {
        when: { sources: ['money'] },
      },
    ),
    weekly('screen-free', 15, 4, ['A screen-free evening', 'Ένα βράδυ χωρίς οθόνες'], {
      when: { sources: ['news'], time: ['t30'] },
    }),
    weekly(
      'hobby',
      20,
      4,
      ['Time for a hobby, just for fun', 'Χρόνος για ένα χόμπι, μόνο για τη χαρά του'],
      { when: { time: ['t30'] } },
    ),
    weekly('say-no', 1, 3, [
      'Say no to one thing you do not have room for',
      'Πες «όχι» σε κάτι που δεν χωράει',
    ]),
    weekly(
      'home-help',
      10,
      3,
      ['Ask for help with one household task', 'Ζήτα βοήθεια για μία δουλειά του σπιτιού'],
      {
        when: { sources: ['home'] },
      },
    ),
    weekly('playlist', 10, 2, ['Make a calm playlist', 'Φτιάξε μια ήρεμη λίστα τραγουδιών'], {
      when: { likes: ['music'] },
    }),
    weekly(
      'long-write',
      15,
      3,
      [
        'Write a page: what is worrying you, and what is in your control',
        'Γράψε μια σελίδα: τι σε ανησυχεί και τι είναι στο χέρι σου',
      ],
      {
        when: { likes: ['writing'], time: ['t15', 't30'] },
      },
    ),
    weekly(
      'yoga',
      20,
      3,
      [
        'A gentle yoga or stretching class (video is fine)',
        'Ήπια yoga ή διατάσεις (και με βίντεο είναι εντάξει)',
      ],
      {
        when: { likes: ['movement', 'breathing'], time: ['t30'] },
      },
    ),

    kickoff('ko-notice', 5, 5, [
      'Notice: when did stress spike today? Just note it',
      'Παρατήρησε: πότε ανέβηκε το άγχος σήμερα; Απλώς σημείωσέ το',
    ]),
    kickoff('ko-one-thing', 5, 4, [
      'Pick one small thing to drop this week',
      'Διάλεξε ένα μικρό πράγμα που θα αφήσεις αυτή την εβδομάδα',
    ]),
    kickoff(
      'ko-talk',
      10,
      5,
      [
        'Talk to someone you trust; if it feels too much, a doctor or counsellor can help',
        'Μίλησε σε κάποιον που εμπιστεύεσαι· αν σου πέφτει βαρύ, ένας γιατρός ή σύμβουλος μπορεί να βοηθήσει',
      ],
      {
        when: { level: ['overwhelmed'] },
      },
    ),
    kickoff('ko-notifications', 5, 4, [
      'Turn off non-essential notifications',
      'Κλείσε τις ειδοποιήσεις που δεν χρειάζεσαι',
    ]),

    monthly('review', 10, 3, [
      'What helped this month? Do more of it',
      'Τι βοήθησε αυτόν τον μήνα; Κάνε το πιο συχνά',
    ]),
    monthly(
      'day-off',
      30,
      3,
      [
        'Plan a half day with nothing scheduled',
        'Κανόνισε ένα μισό ρεπό χωρίς τίποτα στο πρόγραμμα',
      ],
      {
        when: { time: ['t30'] },
      },
    ),
    monthly('declutter-calendar', 10, 2, [
      'Clear one recurring commitment you no longer need',
      'Βγάλε από το πρόγραμμα μια επαναλαμβανόμενη υποχρέωση που δεν χρειάζεσαι',
    ]),
    monthly('treat', 15, 2, ['Do something just for you', 'Κάνε κάτι μόνο για σένα'], {
      when: { time: ['t15', 't30'] },
    }),
  ],
)
