// TASKS ADVISOR topic: moving house (P9 +8). Lazy chunk (./index.ts). An eight-week countdown keyed
// by the `weeks` answer (6–8 weeks → 3–5 → 1–2 → just moved in). Utilities are named generically
// ("your electricity / water / internet provider"): no company names, no phone numbers.
import { daily, kickoff, monthly, opt, question, topic, weekly } from './build.ts'
import { TOPICS } from './topics.ts'

export const movingHouse = topic(
  TOPICS['moving-house'],
  [
    question(
      'weeks',
      'single',
      ['When is the move?', 'Πότε είναι η μετακόμιση;'],
      [
        opt('w8', ['In 6–8 weeks', 'Σε 6–8 εβδομάδες']),
        opt('w4', ['In 3–5 weeks', 'Σε 3–5 εβδομάδες']),
        opt('w2', ['In 1–2 weeks', 'Σε 1–2 εβδομάδες']),
        opt('w0', ['We just moved in', 'Μόλις μετακομίσαμε']),
      ],
    ),
    question(
      'how',
      'single',
      ['Who is doing the moving?', 'Ποιος θα κάνει τη μεταφορά;'],
      [
        opt('movers', ['A moving company', 'Μεταφορική εταιρεία']),
        opt('diy', ['Us, with friends and a van', 'Εμείς, με φίλους και ένα βανάκι']),
      ],
    ),
    question(
      'who',
      'multi',
      ['Who is moving with you?', 'Ποιοι μετακομίζουν μαζί σου;'],
      [opt('kids', ['Children', 'Παιδιά']), opt('pets', ['Pets', 'Κατοικίδια'])],
      ['Choose all that apply — or none.', 'Διάλεξε όσα ισχύουν — ή κανένα.'],
    ),
    question(
      'feel',
      'single',
      ['How does it feel so far?', 'Πώς νιώθεις μέχρι στιγμής;'],
      [
        opt('ok', ['Under control', 'Υπό έλεγχο']),
        opt('overwhelmed', ['Overwhelming', 'Με έχει πνίξει'], { gentle: true }),
      ],
    ),
    question(
      'time',
      'single',
      ['How much time a day can you give it?', 'Πόσο χρόνο τη μέρα μπορείς να διαθέσεις;'],
      [
        opt('t20', ['About 20 minutes', 'Περίπου 20 λεπτά'], { minutes: 20 }),
        opt('t40', ['About 40 minutes', 'Περίπου 40 λεπτά'], { minutes: 40 }),
        opt('t60', ['An hour or more', 'Μία ώρα ή περισσότερο'], { minutes: 60 }),
      ],
    ),
  ],
  [
    daily(
      'pack',
      15,
      6,
      [
        'Pack one box and label it: room and contents',
        'Πακετάρισε μία κούτα και γράψε πάνω: δωμάτιο και περιεχόμενο',
      ],
      {
        when: { weeks: ['w4', 'w2'] },
      },
    ),
    daily(
      'unpack',
      15,
      6,
      ['Unpack one box and put everything away', 'Άδειασε μία κούτα και τακτοποίησε τα πάντα'],
      {
        when: { weeks: ['w0'] },
      },
    ),
    daily(
      'sort-bag',
      10,
      5,
      ['Fill one bag: donate, sell or bin', 'Γέμισε μία σακούλα: για δωρεά, πώληση ή πέταμα'],
      {
        when: { weeks: ['w8', 'w4'] },
      },
    ),
    daily('checklist', 2, 4, [
      'Tick today’s item on the moving checklist',
      'Τσέκαρε το σημερινό βήμα στη λίστα της μετακόμισης',
    ]),
    daily(
      'eat-down',
      1,
      3,
      [
        'Cook from the fridge and freezer — buy less',
        'Μαγείρεψε ό,τι έχει το ψυγείο και ο καταψύκτης — ψώνιζε λιγότερα',
      ],
      {
        when: { weeks: ['w4', 'w2'] },
      },
    ),
    daily(
      'pause',
      5,
      3,
      [
        'Five quiet minutes: a coffee, a breath, then back to it',
        'Πέντε ήσυχα λεπτά: ένας καφές, μια ανάσα, και ξανά στη δουλειά',
      ],
      {
        when: { feel: ['overwhelmed'] },
      },
    ),
    daily(
      'kids-routine',
      2,
      4,
      [
        'Keep the children’s meals and bedtime at the usual times',
        'Κράτα τα γεύματα και την ώρα ύπνου των παιδιών στις συνηθισμένες ώρες',
      ],
      {
        when: { who: ['kids'] },
      },
    ),
    daily(
      'pets-room',
      2,
      4,
      [
        'On busy days, keep pets in a quiet, closed room',
        'Τις φορτωμένες μέρες, κράτα τα ζώα σε ένα ήσυχο, κλειστό δωμάτιο',
      ],
      {
        when: { who: ['pets'], weeks: ['w2', 'w0'] },
      },
    ),

    weekly(
      'quotes',
      20,
      5,
      ['Ask two or three moving companies for a quote', 'Ζήτα προσφορά από δύο-τρεις μεταφορικές'],
      {
        when: { weeks: ['w8'], how: ['movers'] },
      },
    ),
    weekly(
      'book-movers',
      15,
      5,
      [
        'Book the movers: date, time, floors, lift or not',
        'Κλείσε τη μεταφορική: ημερομηνία, ώρα, όροφοι, ασανσέρ ή όχι',
      ],
      {
        when: { weeks: ['w4'], how: ['movers'] },
      },
    ),
    weekly(
      'van',
      15,
      5,
      [
        'Book a van and ask friends to keep the day free',
        'Κλείσε βανάκι και ζήτα από φίλους να κρατήσουν τη μέρα ελεύθερη',
      ],
      {
        when: { weeks: ['w8', 'w4'], how: ['diy'] },
      },
    ),
    weekly(
      'helpers',
      5,
      3,
      [
        'Confirm the helpers and plan food and drinks for them',
        'Επιβεβαίωσε τους βοηθούς και κανόνισε φαγητό και νερά για αυτούς',
      ],
      {
        when: { weeks: ['w2'], how: ['diy'] },
      },
    ),
    weekly(
      'lease',
      10,
      4,
      [
        'Give notice on the lease; check the deposit terms',
        'Ενημέρωσε τον ιδιοκτήτη για την αποχώρηση· δες τους όρους για την εγγύηση',
      ],
      {
        when: { weeks: ['w8'] },
      },
    ),
    weekly(
      'boxes',
      15,
      4,
      ['Collect boxes, tape and markers', 'Μάζεψε κούτες, ταινία και μαρκαδόρους'],
      {
        when: { weeks: ['w8', 'w4'] },
      },
    ),
    weekly(
      'sell',
      15,
      3,
      ['List bigger items for sale or donation', 'Ανέβασε μεγαλύτερα πράγματα για πώληση ή δωρεά'],
      {
        when: { weeks: ['w8'] },
      },
    ),
    weekly(
      'measure',
      15,
      4,
      [
        'Measure the new rooms and plan where the big furniture goes',
        'Μέτρησε τα νέα δωμάτια και σχεδίασε πού πάνε τα μεγάλα έπιπλα',
      ],
      {
        when: { weeks: ['w8', 'w4'] },
      },
    ),
    weekly(
      'documents',
      10,
      4,
      [
        'One folder for passports, contracts and keys — it travels with you',
        'Ένας φάκελος για διαβατήρια, συμβόλαια και κλειδιά — ταξιδεύει μαζί σου',
      ],
      {
        when: { weeks: ['w8', 'w4'] },
      },
    ),
    weekly(
      'school',
      15,
      5,
      [
        'Arrange the children’s school transfer',
        'Κανόνισε τη μεταγραφή των παιδιών στο νέο σχολείο',
      ],
      {
        when: { who: ['kids'], weeks: ['w8', 'w4'] },
      },
    ),
    weekly(
      'utilities',
      20,
      5,
      [
        'Electricity, water, internet: arrange the switch-over for the moving date',
        'Ρεύμα, νερό, ίντερνετ: κανόνισε τη μεταφορά για την ημέρα της μετακόμισης',
      ],
      {
        when: { weeks: ['w4', 'w2'] },
        detail: [
          'Call your electricity, water and internet providers: a final reading at the old home, a connection at the new one.',
          'Επικοινώνησε με τον πάροχο ρεύματος, νερού και ίντερνετ: τελική μέτρηση στο παλιό σπίτι, σύνδεση στο καινούριο.',
        ],
      },
    ),
    weekly(
      'meters',
      10,
      5,
      [
        'Photograph the meter readings at both homes',
        'Φωτογράφισε τις ενδείξεις των μετρητών και στα δύο σπίτια',
      ],
      {
        when: { weeks: ['w2', 'w0'] },
      },
    ),
    weekly(
      'open-first',
      15,
      5,
      [
        'Pack an “open first” box: kettle, cups, toilet paper, chargers, bedding',
        'Ετοίμασε την κούτα «ανοίγεται πρώτη»: βραστήρας, κούπες, χαρτί υγείας, φορτιστές, σεντόνια',
      ],
      {
        when: { weeks: ['w2'] },
      },
    ),
    weekly(
      'mail',
      10,
      4,
      [
        'Arrange mail forwarding with the post office',
        'Κανόνισε την προώθηση της αλληλογραφίας στο ταχυδρομείο',
      ],
      {
        when: { weeks: ['w2'] },
      },
    ),
    weekly(
      'freezer',
      5,
      3,
      [
        'Run down the freezer and defrost it two days before',
        'Άδειασε σταδιακά τον καταψύκτη και ξεπάγωσέ τον δύο μέρες πριν',
      ],
      {
        when: { weeks: ['w2'] },
      },
    ),
    weekly(
      'clean-old',
      30,
      4,
      ['Clean the old home, one room at a time', 'Καθάρισε το παλιό σπίτι, ένα δωμάτιο τη φορά'],
      {
        when: { weeks: ['w2'], time: ['t40', 't60'] },
      },
    ),
    weekly(
      'address',
      20,
      5,
      [
        'Update your address: tax office, bank, employer, insurance, doctor',
        'Άλλαξε διεύθυνση: εφορία, τράπεζα, εργοδότης, ασφάλεια, γιατρός',
      ],
      {
        when: { weeks: ['w0'] },
      },
    ),
    weekly(
      'clean-new',
      30,
      4,
      ['Deep-clean one room of the new home', 'Γενικό καθάρισμα σε ένα δωμάτιο του νέου σπιτιού'],
      {
        when: { weeks: ['w0'], time: ['t40', 't60'] },
      },
    ),
    weekly(
      'nearby',
      20,
      3,
      [
        'Find the essentials nearby: pharmacy, supermarket, bakery',
        'Βρες τα βασικά της γειτονιάς: φαρμακείο, σούπερ μάρκετ, φούρνο',
      ],
      {
        when: { weeks: ['w0'], time: ['t40', 't60'] },
      },
    ),
    weekly('neighbours', 10, 2, ['Say hello to the neighbours', 'Γνωρίσου με τους γείτονες'], {
      when: { weeks: ['w0'] },
    }),
    weekly(
      'vet',
      10,
      3,
      [
        'Find a vet near the new home; update the microchip address',
        'Βρες κτηνίατρο κοντά στο νέο σπίτι· ενημέρωσε τη διεύθυνση στο microchip',
      ],
      {
        when: { who: ['pets'], weeks: ['w4', 'w0'] },
      },
    ),
    weekly(
      'review',
      10,
      4,
      [
        'Sunday: update the checklist and plan the week',
        'Κυριακή: ενημέρωσε τη λίστα και σχεδίασε την εβδομάδα',
      ],
      {
        day: 'sun',
      },
    ),
    weekly('evening-off', 1, 2, [
      'Take one evening off — no boxes',
      'Ένα βράδυ ρεπό — χωρίς κούτες',
    ]),

    kickoff('ko-checklist', 15, 5, [
      'Write the moving checklist: dates, who does what',
      'Γράψε τη λίστα της μετακόμισης: ημερομηνίες, ποιος κάνει τι',
    ]),
    kickoff('ko-budget', 10, 4, [
      'Set a moving budget: transport, boxes, cleaning, deposits',
      'Όρισε προϋπολογισμό: μεταφορά, κούτες, καθάρισμα, εγγυήσεις',
    ]),
    kickoff('ko-folder', 5, 3, [
      'One folder (or phone album) for every receipt and contract',
      'Ένας φάκελος (ή άλμπουμ στο κινητό) για κάθε απόδειξη και συμβόλαιο',
    ]),

    monthly(
      'timeline',
      15,
      4,
      ['Go over the timeline with everyone involved', 'Δείτε όλοι μαζί το χρονοδιάγραμμα'],
      {
        when: { weeks: ['w8', 'w4'] },
      },
    ),
    monthly(
      'insurance',
      10,
      4,
      [
        'Update home insurance for the new address',
        'Ενημέρωσε την ασφάλεια κατοικίας για τη νέα διεύθυνση',
      ],
      {
        when: { weeks: ['w2', 'w0'] },
      },
    ),
    monthly(
      'bills',
      10,
      5,
      [
        'Check the first bills at the new address: right name, right readings',
        'Έλεγξε τους πρώτους λογαριασμούς στο νέο σπίτι: σωστό όνομα, σωστές ενδείξεις',
      ],
      {
        when: { weeks: ['w0'] },
      },
    ),
    monthly(
      'deposit',
      5,
      4,
      [
        'Follow up the old deposit if it has not come back',
        'Ρώτα για την εγγύηση του παλιού σπιτιού αν δεν έχει επιστραφεί',
      ],
      {
        when: { weeks: ['w0'] },
      },
    ),
    monthly(
      'settle',
      15,
      4,
      [
        'One month in: what still needs fixing or buying?',
        'Έναν μήνα μετά: τι χρειάζεται ακόμη επισκευή ή αγορά;',
      ],
      {
        when: { weeks: ['w0'] },
      },
    ),
    monthly('costs', 10, 3, [
      'Compare spending with the moving budget',
      'Σύγκρινε τα έξοδα με τον προϋπολογισμό της μετακόμισης',
    ]),
  ],
)
