// TASKS ADVISOR topic: eat better and meal-prep (P9). Lazy chunk (./index.ts). Health-neutral:
// no calorie targets, no "good/bad" foods — just planning, shopping and cooking habits.
import { daily, kickoff, monthly, opt, question, topic, weekly } from './build.ts'
import { TOPICS } from './topics.ts'

const BIG_PREP = { prep: ['sunday'] }
const LITTLE = { prep: ['little'] }

export const eatHealthier = topic(
  TOPICS['eat-healthier'],
  [
    question(
      'cook',
      'single',
      ['How often do you cook now?', 'Πόσο συχνά μαγειρεύεις τώρα;'],
      [
        opt('rarely', ['Rarely', 'Σπάνια'], { gentle: true }),
        opt('sometimes', ['A few times a week', 'Λίγες φορές την εβδομάδα']),
        opt('often', ['Most days', 'Τις περισσότερες μέρες']),
      ],
    ),
    question(
      'people',
      'single',
      ['Who are you cooking for?', 'Για πόσους μαγειρεύεις;'],
      [
        opt('one', ['Just me', 'Μόνο για μένα']),
        opt('two', ['Two of us', 'Για δύο']),
        opt('family', ['A family', 'Για οικογένεια']),
      ],
    ),
    question(
      'goals',
      'multi',
      ['What would you like to change?', 'Τι θα ήθελες να αλλάξεις;'],
      [
        opt('veg', ['More vegetables and fruit', 'Περισσότερα λαχανικά και φρούτα']),
        opt('sugar', ['Fewer sugary snacks and drinks', 'Λιγότερα γλυκά σνακ και αναψυκτικά']),
        opt('protein', ['More protein in each meal', 'Περισσότερη πρωτεΐνη σε κάθε γεύμα']),
        opt('takeaway', ['Less takeaway', 'Λιγότερο delivery']),
        opt('money', ['Spend less on food', 'Λιγότερα έξοδα για φαγητό']),
      ],
      ['Choose all that apply — or none.', 'Διάλεξε όσα ισχύουν — ή κανένα.'],
    ),
    question(
      'time',
      'single',
      [
        'How much time for food on a normal day?',
        'Πόσο χρόνο έχεις για το φαγητό μια συνηθισμένη μέρα;',
      ],
      [
        opt('t15', ['About 15 minutes', 'Περίπου 15 λεπτά'], { minutes: 15 }),
        opt('t30', ['About 30 minutes', 'Περίπου 30 λεπτά'], { minutes: 30 }),
        opt('t60', ['About an hour', 'Περίπου μία ώρα'], { minutes: 60 }),
      ],
    ),
    question(
      'prep',
      'single',
      ['How do you like to prepare?', 'Πώς σου αρέσει να προετοιμάζεσαι;'],
      [
        opt('sunday', ['One bigger prep session a week', 'Μία μεγάλη προετοιμασία την εβδομάδα']),
        opt('little', ['A little each day', 'Λίγο κάθε μέρα']),
      ],
    ),
  ],
  [
    daily('breakfast', 5, 4, [
      'Sit down for breakfast, even a simple one',
      'Κάτσε για πρωινό, έστω κάτι απλό',
    ]),
    daily(
      'veg-plate',
      5,
      5,
      [
        'Half your lunch or dinner plate is vegetables',
        'Το μισό πιάτο στο μεσημεριανό ή το βραδινό να είναι λαχανικά',
      ],
      {
        when: { goals: ['veg'] },
      },
    ),
    daily('fruit', 2, 4, ['One piece of fruit as a snack', 'Ένα φρούτο για σνακ'], {
      when: { goals: ['veg', 'sugar'] },
    }),
    daily('water-meal', 1, 3, [
      'A glass of water with every meal',
      'Ένα ποτήρι νερό σε κάθε γεύμα',
    ]),
    daily(
      'protein-each',
      2,
      4,
      [
        'A source of protein in every meal: eggs, yoghurt, pulses, fish, meat',
        'Πρωτεΐνη σε κάθε γεύμα: αυγά, γιαούρτι, όσπρια, ψάρι, κρέας',
      ],
      {
        when: { goals: ['protein'] },
      },
    ),
    daily(
      'swap-drink',
      1,
      4,
      [
        'Swap one sugary drink for water or sparkling water',
        'Άλλαξε ένα αναψυκτικό με νερό ή ανθρακούχο',
      ],
      {
        when: { goals: ['sugar'] },
      },
    ),
    daily('cook-dinner', 25, 6, ['Cook a simple dinner', 'Μαγείρεψε ένα απλό βραδινό'], {
      when: { prep: ['little'], time: ['t30', 't60'] },
    }),
    daily(
      'assemble',
      8,
      5,
      [
        'Assemble tonight’s meal from your prepped boxes',
        'Στήσε το αποψινό γεύμα από τα έτοιμα δοχεία σου',
      ],
      {
        when: BIG_PREP,
      },
    ),
    daily('tomorrow-lunch', 5, 5, [
      'Pack tomorrow’s lunch tonight',
      'Ετοίμασε από το βράδυ το αυριανό μεσημεριανό',
    ]),
    daily('eat-slowly', 1, 2, [
      'Eat one meal without a screen, slowly',
      'Φάε ένα γεύμα χωρίς οθόνη, με την ησυχία σου',
    ]),
    daily(
      'defrost',
      2,
      3,
      [
        'Move tomorrow’s ingredients from freezer to fridge',
        'Βγάλε από την κατάψυξη τα υλικά για αύριο',
      ],
      {
        when: LITTLE,
      },
    ),
    daily(
      'kids-veg',
      5,
      5,
      [
        'Let the kids wash or chop one vegetable',
        'Άσε τα παιδιά να πλύνουν ή να κόψουν ένα λαχανικό',
      ],
      {
        when: { people: ['family'] },
      },
    ),

    weekly('plan-menu', 15, 5, ['Plan the week’s dinners', 'Σχεδίασε τα βραδινά της εβδομάδας'], {
      day: 'sat',
    }),
    weekly(
      'list',
      10,
      5,
      ['Write the shopping list from the plan', 'Γράψε τη λίστα για τα ψώνια από το πλάνο'],
      { day: 'sat' },
    ),
    weekly(
      'shop',
      30,
      5,
      ['Do the weekly shop, with the list', 'Κάνε τα ψώνια της εβδομάδας, με τη λίστα'],
      {
        when: { time: ['t30', 't60'] },
        day: 'sat',
      },
    ),
    weekly(
      'shop-online',
      10,
      5,
      [
        'Order the weekly shop online, from the list',
        'Παράγγειλε online τα ψώνια της εβδομάδας, από τη λίστα',
      ],
      {
        when: { time: ['t15'] },
        day: 'sat',
      },
    ),
    weekly(
      'big-prep',
      50,
      6,
      [
        'Prep session: cook two mains, a grain and chopped veg',
        'Προετοιμασία: δύο κυρίως πιάτα, ένα δημητριακό και κομμένα λαχανικά',
      ],
      {
        when: { ...BIG_PREP, time: ['t60'] },
        day: 'sun',
      },
    ),
    weekly(
      'mid-prep',
      25,
      6,
      [
        'Prep session: one big pot and washed salad',
        'Προετοιμασία: μία μεγάλη κατσαρόλα και πλυμένη σαλάτα',
      ],
      {
        when: { ...BIG_PREP, time: ['t30'] },
        day: 'sun',
        times: 2,
      },
    ),
    weekly(
      'mini-prep',
      10,
      6,
      [
        'Mini prep: wash and chop veg for three days',
        'Μίνι προετοιμασία: πλύνε και κόψε λαχανικά για τρεις μέρες',
      ],
      {
        when: { time: ['t15'] },
        times: 2,
      },
    ),
    weekly(
      'batch-cook',
      30,
      4,
      ['Cook a double batch and freeze half', 'Μαγείρεψε διπλή ποσότητα και κατέψυξε τη μισή'],
      {
        when: { time: ['t30', 't60'], people: ['one', 'two'] },
      },
    ),
    weekly(
      'pulses',
      20,
      3,
      [
        'A pulses dinner: lentils, beans or chickpeas',
        'Βραδινό με όσπρια: φακές, φασόλια ή ρεβίθια',
      ],
      {
        when: { time: ['t30', 't60'] },
      },
    ),
    weekly('fish', 20, 3, ['A fish dinner', 'Ένα βραδινό με ψάρι'], {
      when: { time: ['t30', 't60'] },
    }),
    weekly('new-recipe', 30, 3, ['Try one new recipe', 'Δοκίμασε μία καινούργια συνταγή'], {
      when: { time: ['t30', 't60'], cook: ['sometimes', 'often'] },
    }),
    weekly(
      'snack-box',
      10,
      3,
      [
        'Prepare a box of ready snacks: fruit, nuts, yoghurt',
        'Φτιάξε ένα κουτί με έτοιμα σνακ: φρούτα, ξηροί καρποί, γιαούρτι',
      ],
      {
        when: { goals: ['sugar'] },
      },
    ),
    weekly(
      'takeaway-swap',
      20,
      4,
      [
        '“Fakeaway” night: your own version of a takeaway favourite',
        'Βράδυ «σπιτικού delivery»: η δική σου εκδοχή ενός αγαπημένου πιάτου',
      ],
      {
        when: { goals: ['takeaway'], time: ['t30', 't60'] },
        day: 'fri',
      },
    ),
    weekly(
      'takeaway-plan',
      5,
      3,
      [
        'Decide in advance which night (if any) is takeaway',
        'Αποφάσισε από πριν ποιο βράδυ (αν υπάρχει) είναι για delivery',
      ],
      {
        when: { goals: ['takeaway'] },
      },
    ),
    weekly(
      'fridge-review',
      10,
      3,
      [
        'Check the fridge and use what is about to go off',
        'Έλεγξε το ψυγείο και χρησιμοποίησε ό,τι πλησιάζει να λήξει',
      ],
      {
        day: 'thu',
      },
    ),
    weekly(
      'price-check',
      10,
      3,
      ['Compare prices on three staples', 'Σύγκρινε τιμές σε τρία βασικά προϊόντα'],
      {
        when: { goals: ['money'] },
      },
    ),
    weekly('leftovers', 10, 3, ['Leftovers night', 'Βράδυ για ό,τι περίσσεψε'], {
      when: { goals: ['money'] },
    }),
    weekly('family-cook', 30, 3, ['Cook together as a family', 'Μαγειρέψτε όλοι μαζί'], {
      when: { people: ['family'], time: ['t30', 't60'] },
      day: 'sun',
    }),
    weekly(
      'veg-new',
      5,
      2,
      ['Buy one vegetable you rarely eat', 'Αγόρασε ένα λαχανικό που τρως σπάνια'],
      { when: { goals: ['veg'] } },
    ),
    weekly(
      'soup',
      30,
      3,
      [
        'Make a big vegetable soup for the week',
        'Φτιάξε μια μεγάλη σούπα λαχανικών για την εβδομάδα',
      ],
      {
        when: { goals: ['veg'], time: ['t30', 't60'] },
      },
    ),

    kickoff('ko-three', 10, 5, [
      'Pick three easy dinners you already like',
      'Διάλεξε τρία εύκολα βραδινά που ήδη σου αρέσουν',
    ]),
    kickoff('ko-pantry', 15, 4, [
      'Check the cupboards and note what is there',
      'Κοίτα τα ντουλάπια και σημείωσε τι υπάρχει',
    ]),
    kickoff('ko-boxes', 10, 4, [
      'Find or buy a few food containers with lids',
      'Βρες ή αγόρασε μερικά τάπερ με καπάκι',
    ]),
    kickoff(
      'ko-one-meal',
      20,
      4,
      [
        'Cook one simple meal from start to finish',
        'Μαγείρεψε ένα απλό φαγητό από την αρχή ως το τέλος',
      ],
      {
        when: { time: ['t30', 't60'] },
      },
    ),
    kickoff(
      'ko-knife',
      5,
      3,
      ['Sharpen or replace your main kitchen knife', 'Ακόνισε ή άλλαξε το βασικό σου μαχαίρι'],
      {
        when: { cook: ['rarely'] },
      },
    ),
    kickoff('ko-basics', 10, 3, [
      'Stock five basics: olive oil, rice or pasta, tinned tomatoes, pulses, eggs',
      'Πάρε πέντε βασικά: ελαιόλαδο, ρύζι ή ζυμαρικά, ντομάτα κονσέρβα, όσπρια, αυγά',
    ]),

    monthly('freezer', 15, 3, [
      'Freezer audit: label, date, use the oldest first',
      'Έλεγχος κατάψυξης: ετικέτα, ημερομηνία, πρώτα τα παλιότερα',
    ]),
    monthly('spices', 10, 2, [
      'Check spices and herbs; refill the ones you use',
      'Έλεγξε μπαχαρικά και μυρωδικά· ανανέωσε όσα χρησιμοποιείς',
    ]),
    monthly('favourites', 10, 3, [
      'Add the month’s best new meal to your favourites list',
      'Πρόσθεσε το καλύτερο νέο φαγητό του μήνα στη λίστα με τα αγαπημένα',
    ]),
    monthly(
      'spend-review',
      15,
      3,
      ['Look at what food cost this month', 'Δες πόσο κόστισε το φαγητό αυτόν τον μήνα'],
      { when: { goals: ['money'] } },
    ),
    monthly(
      'market',
      30,
      2,
      [
        'Visit the farmers’ market (laiki) for seasonal produce',
        'Πήγαινε στη λαϊκή για εποχικά προϊόντα',
      ],
      {
        when: { time: ['t30', 't60'] },
      },
    ),
  ],
)
