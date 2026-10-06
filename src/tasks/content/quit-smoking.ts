// TASKS ADVISOR topic: quit smoking (P9 +8). Lazy chunk (./index.ts). Evidence-based steps only:
// a quit date, knowing the triggers, support (the national quit-smoking helpline, named
// generically), and stop-smoking medicines or nicotine replacement ONLY via "ask a pharmacist or
// doctor" — no product, no dose. Never shaming: a slip is a restart, not a failure.
import { daily, kickoff, monthly, opt, question, topic, weekly } from './build.ts'
import { TOPICS } from './topics.ts'

export const quitSmoking = topic(
  TOPICS['quit-smoking'],
  [
    question(
      'stage',
      'single',
      ['Where are you right now?', 'Σε ποιο σημείο βρίσκεσαι;'],
      [
        opt('thinking', ['Thinking about quitting', 'Σκέφτομαι να το κόψω']),
        opt('date', ['I have set a quit date', 'Έχω ορίσει ημερομηνία']),
        opt('quit', ['I stopped recently', 'Το έκοψα πρόσφατα']),
      ],
    ),
    question(
      'amount',
      'single',
      ['How much do (or did) you smoke?', 'Πόσο καπνίζεις (ή κάπνιζες);'],
      [
        opt('few', ['A few a day', 'Λίγα τη μέρα']),
        opt('pack', ['About a pack a day', 'Περίπου ένα πακέτο τη μέρα']),
        opt('more', ['More than a pack', 'Πάνω από ένα πακέτο']),
      ],
    ),
    question(
      'confidence',
      'single',
      ['How sure do you feel?', 'Πόσο σίγουρος/η νιώθεις;'],
      [
        opt('ready', ['Ready for it', 'Έτοιμος/η']),
        opt('unsure', ['Not sure I can', 'Δεν ξέρω αν θα τα καταφέρω'], { gentle: true }),
      ],
    ),
    question(
      'triggers',
      'multi',
      ['When do you reach for a cigarette?', 'Πότε σου έρχεται να ανάψεις τσιγάρο;'],
      [
        opt('coffee', ['With coffee', 'Με τον καφέ']),
        opt('stress', ['When stressed', 'Όταν αγχώνομαι']),
        opt('social', ['Going out with friends', 'Σε εξόδους με φίλους']),
        opt('alcohol', ['With a drink', 'Με ένα ποτό']),
      ],
      ['Choose all that apply — or none.', 'Διάλεξε όσα ισχύουν — ή κανένα.'],
    ),
    question(
      'time',
      'single',
      ['How much time a day for this plan?', 'Πόσο χρόνο τη μέρα έχεις για αυτό το πλάνο;'],
      [
        opt('t10', ['About 10 minutes', 'Περίπου 10 λεπτά'], { minutes: 10 }),
        opt('t20', ['About 20 minutes', 'Περίπου 20 λεπτά'], { minutes: 20 }),
        opt('t30', ['Half an hour', 'Μισή ώρα'], { minutes: 30 }),
      ],
    ),
  ],
  [
    daily(
      'craving-plan',
      2,
      6,
      [
        'When a craving hits: wait, breathe, sip water — it passes in a few minutes',
        'Όταν έρθει η λαχτάρα: περίμενε, ανάσανε, πιες νερό — περνάει σε λίγα λεπτά',
      ],
      {
        when: { stage: ['date', 'quit'] },
      },
    ),
    daily(
      'diary',
      1,
      5,
      ['Note each cigarette: when, where, with whom', 'Σημείωσε κάθε τσιγάρο: πότε, πού, με ποιον'],
      {
        when: { stage: ['thinking'] },
      },
    ),
    daily(
      'delay',
      1,
      4,
      [
        'Delay the first cigarette of the day by 15 minutes',
        'Καθυστέρησε το πρώτο τσιγάρο της μέρας κατά 15 λεπτά',
      ],
      {
        when: { stage: ['thinking'] },
      },
    ),
    daily(
      'tick-day',
      1,
      5,
      ['Tick another smoke-free day', 'Τσέκαρε άλλη μία μέρα χωρίς τσιγάρο'],
      {
        when: { stage: ['quit'] },
      },
    ),
    daily('walk', 5, 5, [
      'A five-minute walk — moving takes the edge off cravings',
      'Πέντε λεπτά περπάτημα — η κίνηση μαλακώνει τη λαχτάρα',
    ]),
    daily('reasons', 1, 4, [
      'Read your list of reasons to quit',
      'Διάβασε τη λίστα με τους λόγους που το κόβεις',
    ]),
    daily(
      'breathe',
      3,
      5,
      [
        'Three minutes of slow breathing instead of a smoke break',
        'Τρία λεπτά αργές αναπνοές αντί για διάλειμμα για τσιγάρο',
      ],
      {
        when: { triggers: ['stress'] },
      },
    ),
    daily(
      'coffee-swap',
      1,
      5,
      [
        'Change the coffee ritual: another seat, another cup, or tea',
        'Άλλαξε το τελετουργικό του καφέ: άλλη θέση, άλλη κούπα ή τσάι',
      ],
      {
        when: { triggers: ['coffee'] },
      },
    ),
    daily(
      'slip',
      1,
      4,
      [
        'Slipped? One cigarette is not failure — carry on today, no guilt',
        'Γλίστρησες; Ένα τσιγάρο δεν είναι αποτυχία — συνέχισε σήμερα, χωρίς ενοχές',
      ],
      {
        when: { stage: ['date', 'quit'], confidence: ['unsure'] },
      },
    ),
    daily(
      'hands',
      1,
      3,
      [
        'Keep your hands busy: a pen, a stress ball, sugar-free gum',
        'Κράτα τα χέρια απασχολημένα: ένα στυλό, ένα μπαλάκι, τσίχλα χωρίς ζάχαρη',
      ],
      {
        when: { stage: ['date', 'quit'] },
      },
    ),
    daily('water', 1, 3, ['Water within reach all day', 'Νερό πρόχειρο όλη τη μέρα']),
    daily(
      'savings',
      1,
      3,
      [
        'Put the cigarette money aside and watch it grow',
        'Βάλε στην άκρη τα λεφτά του τσιγάρου και δες τα να μαζεύονται',
      ],
      {
        when: { stage: ['quit'] },
      },
    ),

    weekly('support', 5, 5, [
      'Check in with someone who backs your quit',
      'Μίλησε λίγο με κάποιον που στηρίζει την προσπάθειά σου',
    ]),
    weekly(
      'helpline',
      10,
      5,
      [
        'Call the national quit-smoking helpline: free advice and a plan',
        'Τηλεφώνησε στην εθνική γραμμή διακοπής του καπνίσματος: δωρεάν συμβουλές και πλάνο',
      ],
      {
        when: { stage: ['thinking', 'date'] },
      },
    ),
    weekly(
      'clear-out',
      5,
      5,
      [
        'Clear out cigarettes, lighters and ashtrays: home, car, bag',
        'Πέτα τσιγάρα, αναπτήρες και τασάκια: σπίτι, αυτοκίνητο, τσάντα',
      ],
      {
        when: { stage: ['date'] },
      },
    ),
    weekly(
      'triggers-review',
      10,
      4,
      [
        'Read your diary: which triggers come up most?',
        'Διάβασε τις σημειώσεις σου: ποιες αφορμές εμφανίζονται πιο συχνά;',
      ],
      {
        when: { stage: ['thinking', 'date'] },
        day: 'sun',
      },
    ),
    weekly(
      'reward',
      5,
      4,
      [
        'Reward a smoke-free week with some of the money saved',
        'Επιβράβευσε μια εβδομάδα χωρίς τσιγάρο με μέρος από τα λεφτά που γλίτωσες',
      ],
      {
        when: { stage: ['quit'] },
        day: 'sun',
      },
    ),
    weekly(
      'exercise',
      20,
      4,
      [
        'Twenty minutes of exercise: brisk walk, bike, swim',
        'Είκοσι λεπτά άσκηση: γρήγορο περπάτημα, ποδήλατο, κολύμπι',
      ],
      {
        when: { time: ['t20', 't30'] },
        times: 2,
      },
    ),
    weekly(
      'stress-tool',
      15,
      4,
      [
        'Practise a stress tool that is not a cigarette: music, a walk, stretching',
        'Δοκίμασε κάτι για το άγχος που δεν είναι τσιγάρο: μουσική, βόλτα, διατάσεις',
      ],
      {
        when: { triggers: ['stress'], time: ['t20', 't30'] },
      },
    ),
    weekly(
      'going-out',
      5,
      4,
      [
        'Before going out: decide your answer to “want one?” and tell a friend',
        'Πριν βγεις: αποφάσισε τι θα απαντήσεις στο «θες ένα;» και πες το σε έναν φίλο',
      ],
      {
        when: { triggers: ['social'] },
      },
    ),
    weekly(
      'smoke-free-meet',
      15,
      3,
      [
        'Meet friends somewhere smoke-free, or for a walk',
        'Βρες τους φίλους σε μέρος χωρίς τσιγάρο ή για περπάτημα',
      ],
      {
        when: { triggers: ['social'], time: ['t20', 't30'] },
      },
    ),
    weekly(
      'less-drink',
      1,
      4,
      [
        'Drink less alcohol in the first weeks — it makes cravings stronger',
        'Λιγότερο αλκοόλ τις πρώτες εβδομάδες — δυναμώνει τη λαχτάρα',
      ],
      {
        when: { triggers: ['alcohol'] },
      },
    ),
    weekly('snacks', 10, 3, [
      'Prepare snacks for cravings: fruit, nuts, carrot sticks',
      'Ετοίμασε σνακ για τις λαχτάρες: φρούτα, ξηρούς καρπούς, καρότα',
    ]),
    weekly(
      'freshen',
      20,
      3,
      [
        'Wash jackets and clean the car to lose the smell',
        'Πλύνε τα μπουφάν και καθάρισε το αυτοκίνητο να φύγει η μυρωδιά',
      ],
      {
        when: { stage: ['date', 'quit'], time: ['t30'] },
      },
    ),
    weekly('smoke-free-home', 2, 3, [
      'Keep the home and the car smoke-free',
      'Σπίτι και αυτοκίνητο χωρίς τσιγάρο',
    ]),
    weekly(
      'pharmacist-check',
      5,
      4,
      [
        'Using nicotine replacement? Check with the pharmacist it still suits you',
        'Χρησιμοποιείς υποκατάστατα νικοτίνης; Ρώτα τον φαρμακοποιό αν σου ταιριάζουν ακόμη',
      ],
      {
        when: { stage: ['date', 'quit'], amount: ['pack', 'more'] },
      },
    ),

    kickoff(
      'ko-date',
      5,
      5,
      [
        'Pick a quit date in the next two weeks and write it down',
        'Διάλεξε ημερομηνία μέσα στις επόμενες δύο εβδομάδες και γράψ’ τη',
      ],
      {
        when: { stage: ['thinking', 'date'] },
      },
    ),
    kickoff('ko-reasons', 10, 5, [
      'Write your reasons to quit and keep them in your wallet',
      'Γράψε τους λόγους που το κόβεις και κράτα τους στο πορτοφόλι',
    ]),
    kickoff(
      'ko-help',
      10,
      5,
      [
        'Ask a pharmacist or doctor about nicotine replacement or quit medicines',
        'Ρώτα τον φαρμακοποιό ή τον γιατρό για υποκατάστατα νικοτίνης ή φάρμακα διακοπής',
      ],
      {
        detail: [
          'Used properly, they make quitting easier — they will tell you what suits you.',
          'Με σωστή χρήση κάνουν τη διακοπή πιο εύκολη — θα σου πουν τι σου ταιριάζει.',
        ],
      },
    ),
    kickoff('ko-tell', 5, 4, [
      'Tell family and friends — ask for support, not policing',
      'Πες το σε οικογένεια και φίλους — ζήτα στήριξη, όχι έλεγχο',
    ]),
    kickoff(
      'ko-past',
      10,
      3,
      [
        'Tried before? Write what helped and what tripped you up — every try teaches',
        'Το έχεις ξαναπροσπαθήσει; Γράψε τι βοήθησε και τι σε δυσκόλεψε — κάθε προσπάθεια διδάσκει',
      ],
      {
        when: { confidence: ['unsure'] },
      },
    ),
    kickoff(
      'ko-helpline',
      5,
      4,
      [
        'Save the national quit-smoking helpline number for tough moments',
        'Αποθήκευσε το τηλέφωνο της εθνικής γραμμής διακοπής καπνίσματος για τις δύσκολες στιγμές',
      ],
      {
        when: { stage: ['quit'] },
      },
    ),

    monthly('money', 10, 4, [
      'Add up the money saved and spend some on yourself',
      'Μέτρησε τα λεφτά που γλίτωσες και ξόδεψε κάτι για σένα',
    ]),
    monthly('notice', 10, 4, [
      'Notice what changed: breath, taste, stairs, sleep',
      'Πρόσεξε τι άλλαξε: ανάσα, γεύση, σκάλες, ύπνος',
    ]),
    monthly('plan-review', 10, 3, [
      'Review the craving plan: what works, what to change',
      'Ξανακοίτα το σχέδιο για τις λαχτάρες: τι πιάνει, τι αλλάζεις',
    ]),
    monthly(
      'checkup',
      15,
      3,
      [
        'Tell your doctor you quit at your next check-up',
        'Πες στον γιατρό σου ότι το έκοψες στον επόμενο έλεγχο',
      ],
      {
        when: { stage: ['quit'] },
      },
    ),
    monthly('dentist', 30, 2, ['Book a dental cleaning', 'Κλείσε ραντεβού για καθαρισμό δοντιών'], {
      when: { stage: ['quit'] },
    }),
  ],
)
