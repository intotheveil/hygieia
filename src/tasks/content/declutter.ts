// TASKS ADVISOR topic: declutter and organise (P9). Lazy chunk (./index.ts).
import { daily, kickoff, monthly, opt, question, topic, weekly } from './build.ts'
import { TOPICS } from './topics.ts'

export const declutter = topic(
  TOPICS.declutter,
  [
    question(
      'areas',
      'multi',
      ['Which areas need it most?', 'Ποια σημεία το χρειάζονται περισσότερο;'],
      [
        opt('wardrobe', ['Wardrobe and clothes', 'Ντουλάπα και ρούχα']),
        opt('kitchen', ['Kitchen cupboards', 'Ντουλάπια κουζίνας']),
        opt('papers', ['Papers and mail', 'Χαρτιά και αλληλογραφία']),
        opt('digital', ['Phone and computer', 'Κινητό και υπολογιστής']),
        opt('kids', ['Kids’ things', 'Τα πράγματα των παιδιών']),
        opt('storage', ['Storage room, balcony or garage', 'Αποθήκη, μπαλκόνι ή γκαράζ']),
      ],
      [
        'Choose any — or none for a general plan.',
        'Διάλεξε όσα θέλεις — ή κανένα για ένα γενικό πλάνο.',
      ],
    ),
    question(
      'state',
      'single',
      ['How full does it feel?', 'Πόσο γεμάτο το νιώθεις;'],
      [
        opt('light', ['A few problem spots', 'Λίγα προβληματικά σημεία']),
        opt('full', ['Full everywhere', 'Γεμάτο παντού'], { gentle: true }),
        opt('overwhelmed', ['Overwhelming', 'Με πνίγει'], { gentle: true }),
      ],
    ),
    question(
      'time',
      'single',
      ['How much time a day?', 'Πόσο χρόνο τη μέρα;'],
      [
        opt('t10', ['About 10 minutes', 'Περίπου 10 λεπτά'], { minutes: 10 }),
        opt('t20', ['About 20 minutes', 'Περίπου 20 λεπτά'], { minutes: 20 }),
        opt('t45', ['About 45 minutes', 'Περίπου 45 λεπτά'], { minutes: 45 }),
      ],
    ),
    question(
      'letgo',
      'single',
      ['How easy is it for you to let things go?', 'Πόσο εύκολα αποχωρίζεσαι πράγματα;'],
      [
        opt('easy', ['Easy', 'Εύκολα']),
        opt('hard', [
          'Hard — I keep things “just in case”',
          'Δύσκολα — τα κρατάω «για καλό και για κακό»',
        ]),
      ],
    ),
    question(
      'outlet',
      'single',
      ['Where will things go?', 'Πού θα πηγαίνουν τα πράγματα;'],
      [
        opt('donate', ['Donate or give away', 'Δωρεά ή χάρισμα']),
        opt('sell', ['Sell what is worth it', 'Πώληση όσων αξίζουν']),
      ],
    ),
  ],
  [
    daily('one-in', 1, 4, [
      'One in, one out: new item in, an old one leaves',
      'Ένα μπαίνει, ένα βγαίνει: για κάθε καινούργιο, φεύγει ένα παλιό',
    ]),
    daily('five-things', 5, 5, [
      'Find five things to let go of',
      'Βρες πέντε πράγματα να αποχωριστείς',
    ]),
    daily('surface', 5, 4, ['Clear one surface completely', 'Άδειασε εντελώς μία επιφάνεια']),
    daily(
      'mail',
      2,
      4,
      [
        'Open the mail at once: bin, act or file',
        'Άνοιξε την αλληλογραφία αμέσως: πέτα, ενέργησε ή αρχειοθέτησε',
      ],
      {
        when: { areas: ['papers'] },
      },
    ),
    weekly(
      'photos',
      5,
      4,
      ['Delete 20 photos you do not need', 'Σβήσε 20 φωτογραφίες που δεν χρειάζεσαι'],
      { when: { areas: ['digital'] }, times: 3 },
    ),
    weekly(
      'inbox',
      5,
      4,
      ['Unsubscribe from three newsletters', 'Διάγραψε τη συνδρομή σε τρία newsletters'],
      { when: { areas: ['digital'] } },
    ),
    daily(
      'outfit-back',
      2,
      2,
      ['Hang up or fold today’s clothes', 'Κρέμασε ή δίπλωσε τα σημερινά ρούχα'],
      { when: { areas: ['wardrobe'] } },
    ),
    daily(
      'toy-rotate',
      5,
      5,
      [
        'Toys back in their boxes, with the kids',
        'Τα παιχνίδια πίσω στα κουτιά τους, μαζί με τα παιδιά',
      ],
      {
        when: { areas: ['kids'] },
      },
    ),
    weekly(
      'drawer',
      10,
      4,
      [
        'Empty one drawer, keep only what you use',
        'Άδειασε ένα συρτάρι, κράτα μόνο όσα χρησιμοποιείς',
      ],
      {
        when: { time: ['t20', 't45'] },
        times: 3,
      },
    ),
    daily('bag', 2, 2, ['Empty your bag or backpack', 'Άδειασε την τσάντα ή το σακίδιό σου']),

    weekly(
      'donate-run',
      15,
      5,
      ['Take the donation bag out of the house', 'Βγάλε τη σακούλα της δωρεάς από το σπίτι'],
      {
        when: { outlet: ['donate'] },
        day: 'sat',
      },
    ),
    weekly(
      'list-sell',
      20,
      4,
      [
        'List three items for sale with photos',
        'Ανέβασε τρία αντικείμενα για πώληση με φωτογραφίες',
      ],
      {
        when: { outlet: ['sell'] },
      },
    ),
    weekly(
      'sell-deadline',
      5,
      3,
      [
        'Not sold in two weeks? It goes to donation',
        'Δεν πουλήθηκε σε δύο εβδομάδες; Πάει για δωρεά',
      ],
      {
        when: { outlet: ['sell'] },
        day: 'sun',
      },
    ),
    weekly(
      'wardrobe-shelf',
      15,
      4,
      ['Wardrobe: sort one shelf or rail', 'Ντουλάπα: ταξινόμησε ένα ράφι ή μια κρεμάστρα'],
      {
        when: { areas: ['wardrobe'] },
        times: 2,
      },
    ),
    weekly(
      'wardrobe-hanger',
      5,
      3,
      [
        'Turn hangers back after wearing — see what you never wear',
        'Γύρνα ανάποδα τις κρεμάστρες μετά τη χρήση — θα δεις τι δεν φοράς ποτέ',
      ],
      {
        when: { areas: ['wardrobe'] },
      },
    ),
    weekly(
      'kitchen-cupboard',
      15,
      4,
      [
        'Kitchen: one cupboard, check dates, group like with like',
        'Κουζίνα: ένα ντουλάπι, έλεγξε ημερομηνίες, βάλε τα όμοια μαζί',
      ],
      {
        when: { areas: ['kitchen'] },
        times: 2,
      },
    ),
    weekly(
      'tupperware',
      10,
      3,
      [
        'Match containers to lids; recycle the orphans',
        'Ταίριαξε τάπερ με καπάκια· ανακύκλωσε τα «ορφανά»',
      ],
      {
        when: { areas: ['kitchen'] },
      },
    ),
    weekly(
      'papers-batch',
      15,
      4,
      [
        'Papers: shred, scan or file one pile',
        'Χαρτιά: κατάστρεψε, σκάναρε ή αρχειοθέτησε μία στοίβα',
      ],
      {
        when: { areas: ['papers'] },
        times: 2,
      },
    ),
    weekly(
      'desktop',
      10,
      3,
      [
        'Clean up the computer desktop and downloads',
        'Καθάρισε την επιφάνεια εργασίας και τα «Λήψεις»',
      ],
      {
        when: { areas: ['digital'] },
      },
    ),
    weekly(
      'apps',
      5,
      3,
      [
        'Delete apps you have not opened in a month',
        'Σβήσε εφαρμογές που δεν άνοιξες εδώ και έναν μήνα',
      ],
      {
        when: { areas: ['digital'] },
      },
    ),
    weekly(
      'kids-sort',
      15,
      4,
      [
        'With the kids: choose toys or clothes they have outgrown',
        'Με τα παιδιά: διαλέξτε παιχνίδια ή ρούχα που μεγάλωσαν γι’ αυτά',
      ],
      {
        when: { areas: ['kids'] },
      },
    ),
    weekly(
      'storage-corner',
      30,
      4,
      ['Storage: clear one corner or shelf', 'Αποθήκη: άδειασε μία γωνία ή ένα ράφι'],
      {
        when: { areas: ['storage'], time: ['t45'] },
        day: 'sat',
      },
    ),
    weekly(
      'storage-box',
      15,
      4,
      ['Storage: go through one box', 'Αποθήκη: ξεσκαρτάρισε ένα κουτί'],
      {
        when: { areas: ['storage'], time: ['t20', 't45'] },
      },
    ),
    weekly(
      'storage-quick',
      5,
      4,
      [
        'Storage: take out one thing you no longer need',
        'Αποθήκη: βγάλε έξω ένα πράγμα που δεν χρειάζεσαι πια',
      ],
      {
        when: { areas: ['storage'], time: ['t10'] },
      },
    ),
    weekly('bathroom-cab', 10, 3, [
      'Bathroom cabinet: toss empties and expired products',
      'Ντουλάπι μπάνιου: πέτα τα άδεια και τα ληγμένα',
    ]),
    weekly(
      'hotspot',
      10,
      4,
      [
        'Reset the clutter hotspot (table, chair, entrance)',
        'Μάζεψε το σημείο που μαζεύει τα πάντα (τραπέζι, καρέκλα, είσοδος)',
      ],
      {
        times: 2,
      },
    ),
    weekly(
      'maybe-box',
      5,
      3,
      [
        'Unsure items go in a dated “maybe” box',
        'Ό,τι δεν είσαι σίγουρος/η μπαίνει σε ένα κουτί «ίσως» με ημερομηνία',
      ],
      {
        when: { letgo: ['hard'] },
      },
    ),
    weekly(
      'photo-memory',
      10,
      3,
      [
        'Photograph a sentimental item, then decide',
        'Φωτογράφισε ένα συναισθηματικό αντικείμενο και μετά αποφάσισε',
      ],
      {
        when: { letgo: ['hard'] },
      },
    ),
    weekly(
      'one-room',
      40,
      6,
      ['Deep declutter of one small room', 'Γενικό ξεσκαρτάρισμα σε ένα μικρό δωμάτιο'],
      {
        when: { time: ['t45'], state: ['light', 'full'] },
        day: 'sun',
      },
    ),
    weekly('labels', 10, 2, ['Label boxes and shelves', 'Βάλε ετικέτες σε κουτιά και ράφια'], {
      when: { state: ['light'] },
    }),
    weekly('shoes', 10, 2, [
      'Shoes: keep the pairs you wear',
      'Παπούτσια: κράτα τα ζευγάρια που φοράς',
    ]),
    weekly('linen', 10, 2, [
      'Linen cupboard: two sets per bed is enough',
      'Ντουλάπα λευκών ειδών: δύο σετ ανά κρεβάτι αρκούν',
    ]),
    weekly('charger', 5, 2, ['Sort the cable drawer', 'Τακτοποίησε το συρτάρι με τα καλώδια']),

    kickoff('ko-bags', 5, 5, [
      'Get three bags: rubbish, donate or sell, elsewhere',
      'Πάρε τρεις σακούλες: σκουπίδια, δωρεά ή πώληση, αλλού',
    ]),
    kickoff('ko-ten', 10, 5, [
      'Ten-minute timer, one spot, stop when it rings',
      'Χρονόμετρο δέκα λεπτών, ένα σημείο, σταματάς όταν χτυπήσει',
    ]),
    kickoff('ko-easy', 10, 4, [
      'Start with rubbish only: no decisions needed',
      'Ξεκίνα μόνο με τα σκουπίδια: καμία απόφαση',
    ]),
    kickoff(
      'ko-where',
      5,
      4,
      ['Find out where to donate locally', 'Βρες πού μπορείς να κάνεις δωρεά στην περιοχή σου'],
      {
        when: { outlet: ['donate'] },
      },
    ),
    kickoff('ko-photo', 2, 3, [
      'Take a “before” photo — you will want it later',
      'Βγάλε μια φωτογραφία «πριν» — θα τη θέλεις μετά',
    ]),

    monthly('review', 15, 3, [
      'Walk through the house: what has crept back?',
      'Κάνε μια βόλτα στο σπίτι: τι επέστρεψε;',
    ]),
    monthly(
      'maybe-open',
      10,
      3,
      [
        'Open the “maybe” box: untouched? Let it go',
        'Άνοιξε το κουτί «ίσως»: δεν το άγγιξες; Άφησέ το να φύγει',
      ],
      {
        when: { letgo: ['hard'] },
      },
    ),
    monthly('subscriptions', 10, 3, [
      'Cancel subscriptions you do not use',
      'Ακύρωσε συνδρομές που δεν χρησιμοποιείς',
    ]),
    monthly(
      'backup',
      15,
      3,
      [
        'Back up phone photos, then free up space',
        'Κάνε αντίγραφο ασφαλείας στις φωτογραφίες και άδειασε χώρο',
      ],
      {
        when: { areas: ['digital'] },
      },
    ),
    monthly(
      'season-swap',
      30,
      2,
      [
        'Seasonal swap: store off-season clothes',
        'Αλλαγή εποχής: φύλαξε τα ρούχα της άλλης εποχής',
      ],
      {
        when: { areas: ['wardrobe'], time: ['t45'] },
      },
    ),
    monthly('medicine', 10, 3, [
      'Return expired medicines to the pharmacy',
      'Πήγαινε τα ληγμένα φάρμακα στο φαρμακείο',
    ]),
  ],
)
