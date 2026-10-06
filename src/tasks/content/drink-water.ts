// TASKS ADVISOR topic: drink more water (P9). Lazy chunk (./index.ts). Tiny cues, no targets in
// litres — needs differ, and the plan nudges, it does not prescribe. No budget question: the tasks
// take a minute or two each, so the default budget applies.
import { daily, kickoff, monthly, opt, question, topic, weekly } from './build.ts'
import { TOPICS } from './topics.ts'

export const drinkWater = topic(
  TOPICS['drink-water'],
  [
    question(
      'now',
      'single',
      ['How much water do you drink on a normal day?', 'Πόσο νερό πίνεις μια συνηθισμένη μέρα;'],
      [
        opt('low', ['Hardly any', 'Σχεδόν καθόλου'], { gentle: true }),
        opt('some', ['A few glasses', 'Λίγα ποτήρια']),
        opt('good', ['Quite a lot already', 'Αρκετό ήδη']),
      ],
    ),
    question(
      'day',
      'single',
      ['What does your day look like?', 'Πώς είναι η μέρα σου;'],
      [
        opt('desk', ['Mostly at a desk', 'Κυρίως σε γραφείο']),
        opt('home', ['Mostly at home', 'Κυρίως στο σπίτι']),
        opt('active', ['On my feet or outdoors', 'Όρθιος/α ή έξω, σε κίνηση']),
      ],
    ),
    question(
      'hurdles',
      'multi',
      ['What makes it hard?', 'Τι σε δυσκολεύει;'],
      [
        opt('forget', ['I simply forget', 'Απλώς το ξεχνάω']),
        opt('taste', ['Plain water bores me', 'Το σκέτο νερό με βαριέται']),
        opt('coffee', ['I drink a lot of coffee', 'Πίνω πολύ καφέ']),
        opt('exercise', ['I sweat a lot when I train', 'Ιδρώνω πολύ όταν γυμνάζομαι']),
      ],
      ['Choose all that apply — or none.', 'Διάλεξε όσα ισχύουν — ή κανένα.'],
    ),
  ],
  [
    daily('wake-glass', 1, 5, [
      'A glass of water when you wake up',
      'Ένα ποτήρι νερό μόλις ξυπνήσεις',
    ]),
    daily('bottle', 1, 5, [
      'Fill a bottle and keep it in sight',
      'Γέμισε ένα μπουκάλι και κράτα το σε σημείο που το βλέπεις',
    ]),
    daily('meal-glass', 1, 4, ['A glass with every meal', 'Ένα ποτήρι σε κάθε γεύμα']),
    daily('refill-2', 1, 3, ['Refill the bottle at lunch', 'Ξαναγέμισε το μπουκάλι το μεσημέρι'], {
      when: { now: ['some', 'good'] },
    }),
    daily('refill-3', 1, 2, ['Refill it again mid-afternoon', 'Ξαναγέμισέ το το απόγευμα'], {
      when: { now: ['good'] },
    }),
    daily(
      'reminders',
      1,
      4,
      [
        'Three phone reminders: 11:00, 15:00, 18:00',
        'Τρεις υπενθυμίσεις στο κινητό: 11:00, 15:00, 18:00',
      ],
      {
        when: { hurdles: ['forget'] },
      },
    ),
    daily(
      'anchor',
      1,
      3,
      [
        'Drink a glass every time you go to the bathroom',
        'Ένα ποτήρι κάθε φορά που πηγαίνεις στο μπάνιο',
      ],
      {
        when: { hurdles: ['forget'] },
      },
    ),
    daily(
      'flavour',
      2,
      4,
      ['Add lemon, cucumber or mint to your water', 'Ρίξε λεμόνι, αγγούρι ή δυόσμο στο νερό σου'],
      {
        when: { hurdles: ['taste'] },
      },
    ),
    daily(
      'herbal',
      3,
      3,
      ['A cup of herbal tea (mountain tea, chamomile)', 'Ένα φλιτζάνι τσάι του βουνού ή χαμομήλι'],
      {
        when: { hurdles: ['taste'] },
      },
    ),
    daily(
      'coffee-water',
      1,
      4,
      ['A glass of water with every coffee', 'Ένα ποτήρι νερό με κάθε καφέ'],
      { when: { hurdles: ['coffee'] } },
    ),
    daily(
      'desk-glass',
      1,
      3,
      [
        'A full glass on the desk before you start work',
        'Ένα γεμάτο ποτήρι στο γραφείο πριν ξεκινήσεις δουλειά',
      ],
      {
        when: { day: ['desk'] },
      },
    ),
    daily(
      'kitchen-jug',
      1,
      3,
      ['A jug of water on the kitchen table', 'Μια κανάτα νερό στο τραπέζι της κουζίνας'],
      { when: { day: ['home'] } },
    ),
    daily('carry', 1, 4, ['Carry water when you go out', 'Πάρε νερό μαζί σου όταν βγαίνεις'], {
      when: { day: ['active'] },
    }),
    daily(
      'train-sip',
      1,
      3,
      ['Sip before, during and after training', 'Πίνε λίγο πριν, κατά και μετά την προπόνηση'],
      {
        when: { hurdles: ['exercise'] },
      },
    ),
    daily('fruit-veg', 2, 2, [
      'Eat a watery fruit or vegetable: watermelon, cucumber, orange',
      'Φάε ένα «ζουμερό» φρούτο ή λαχανικό: καρπούζι, αγγούρι, πορτοκάλι',
    ]),
    daily(
      'check',
      1,
      2,
      [
        'Evening check: one glass more than yesterday?',
        'Βραδινός έλεγχος: ένα ποτήρι περισσότερο από χθες;',
      ],
      {
        when: { now: ['low', 'some'] },
      },
    ),
    daily('soup', 1, 1, ['Soup or a salad counts too', 'Μετράει και η σούπα ή η σαλάτα']),

    weekly(
      'clean-bottle',
      5,
      4,
      ['Wash your water bottle properly', 'Πλύνε καλά το μπουκάλι σου'],
      { times: 2 },
    ),
    weekly('jug-filter', 5, 2, [
      'Rinse the jug or change the filter if you use one',
      'Ξέπλυνε την κανάτα ή άλλαξε το φίλτρο αν έχεις',
    ]),
    weekly(
      'new-flavour',
      5,
      3,
      ['Try a new flavour combination', 'Δοκίμασε νέο συνδυασμό γεύσης'],
      { when: { hurdles: ['taste'] } },
    ),
    weekly(
      'reflect',
      3,
      3,
      [
        'Look back: on which days did you drink least, and why?',
        'Κοίτα πίσω: ποιες μέρες ήπιες λιγότερο και γιατί;',
      ],
      {
        day: 'sun',
      },
    ),
    weekly(
      'hot-day',
      2,
      2,
      [
        'Hot or busy day ahead? Take an extra bottle',
        'Ζεστή ή γεμάτη μέρα μπροστά; Πάρε ένα μπουκάλι παραπάνω',
      ],
      {
        when: { day: ['active'] },
      },
    ),

    kickoff('ko-bottle', 10, 5, [
      'Pick a bottle you like and will carry',
      'Διάλεξε ένα μπουκάλι που σου αρέσει και θα το κουβαλάς',
    ]),
    kickoff('ko-spots', 5, 4, [
      'Place a glass in three spots you pass often',
      'Βάλε ένα ποτήρι σε τρία σημεία από όπου περνάς συχνά',
    ]),
    kickoff('ko-one-more', 1, 4, [
      'This week, just one glass more each day',
      'Αυτή την εβδομάδα, απλώς ένα ποτήρι παραπάνω κάθε μέρα',
    ]),

    monthly('bottle-check', 5, 2, [
      'Check the bottle seal; replace it if worn',
      'Έλεγξε το λάστιχο του μπουκαλιού· άλλαξέ το αν φθάρηκε',
    ]),
    monthly('review', 5, 3, [
      'How does a well-watered day feel? Note it',
      'Πώς νιώθεις μια μέρα που ήπιες αρκετό νερό; Σημείωσέ το',
    ]),
  ],
)
