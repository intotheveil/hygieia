// OVERLAY 0011 — the skincare_routines additions (see ../0011-skincare-more.ts for the overlay
// header). Same conventions as the base seed (../../skincare/routines.ts): ordered steps, `order` =
// index + 1, every `product_type_slug` resolves to a served product type (base or this overlay), a
// face routine uses only types whose `time` is `both` or its own time, ≥ 2 mandatory steps. The two
// pregnancy routines contain NO retinoid (retinol, retinal, adapalene) and no bakuchiol (no
// pregnancy data) — ../skincare-more.test.ts pins it. Face routines carry ONE regional style, never
// `global` (the page and its tests rely on a style filter showing only that style's face routines). Erasable syntax only, explicit `.ts` imports.

import type { SkincareRoutineSeed } from '../../../types.ts'

export const SKINCARE_ROUTINES: readonly SkincareRoutineSeed[] = [
  // --- pregnancy -----------------------------------------------------------------------------------
  {
    slug: 'face-women-all-am-eu-pregnancy-safe',
    area: 'face',
    name_el: 'Πρωινή ρουτίνα στην εγκυμοσύνη — χωρίς ρετινοειδή',
    name_en: 'Pregnancy morning routine — retinoid-free',
    audience: 'women',
    skin_type: 'all',
    region: 'eu',
    time: 'am',
    intro_el:
      'Λίγα, ήπια βήματα για την εγκυμοσύνη και τον θηλασμό: καμία ρετινόλη, ρετινάλη ή αδαπαλένη, και καθόλου υδροκινόνη. Το σημαντικότερο βήμα είναι το αντηλιακό με χρώμα, γιατί οι ορμόνες της εγκυμοσύνης ευνοούν το μέλασμα. Δείξε τα προϊόντα σου στον γυναικολόγο σου.',
    intro_en:
      'A few gentle steps for pregnancy and breastfeeding: no retinol, retinal or adapalene, and no hydroquinone. The most important step is a tinted sunscreen, because pregnancy hormones make melasma more likely. Show your products to your obstetrician.',
    duration_min: 5,
    steps: [
      {
        order: 1,
        product_type_slug: 'cleanser-cream-milk',
        note_el: 'Ήπιος καθαρισμός με χλιαρό νερό· αν το δέρμα είναι ξηρό, αρκεί ένα ξέβγαλμα.',
        note_en: 'A gentle cleanse with lukewarm water; if your skin is dry, a rinse is enough.',
        optional: false,
      },
      {
        order: 2,
        product_type_slug: 'serum-vitamin-c',
        note_el: 'Λίγες σταγόνες για λάμψη και κηλίδες· οι δερματολόγοι τη θεωρούν κατάλληλη.',
        note_en: 'A few drops for glow and dark spots; dermatologists consider it suitable.',
        optional: true,
      },
      {
        order: 3,
        product_type_slug: 'serum-azelaic-acid',
        note_el: 'Για σπυράκια ή κοκκινίλα, σε λεπτή στρώση· σταμάτα αν τσούζει επίμονα.',
        note_en: 'For spots or redness, in a thin layer; stop if it keeps stinging.',
        optional: true,
      },
      {
        order: 4,
        product_type_slug: 'moisturizer-cream-ceramide',
        note_el: 'Ενυδατική χωρίς άρωμα — το δέρμα στην εγκυμοσύνη ερεθίζεται πιο εύκολα.',
        note_en: 'A fragrance-free moisturiser — skin reacts more easily in pregnancy.',
        optional: false,
      },
      {
        order: 5,
        product_type_slug: 'sunscreen-tinted-iron-oxide',
        note_el: 'Ορυκτά φίλτρα με χρώμα, SPF 30+, κάθε μέρα, μαζί με καπέλο και σκιά.',
        note_en: 'Tinted mineral filters, SPF 30+, every day, together with a hat and shade.',
        optional: false,
      },
    ],
  },
  {
    slug: 'face-women-all-pm-eu-pregnancy-safe',
    area: 'face',
    name_el: 'Βραδινή ρουτίνα στην εγκυμοσύνη — χωρίς ρετινοειδή',
    name_en: 'Pregnancy evening routine — retinoid-free',
    audience: 'women',
    skin_type: 'all',
    region: 'eu',
    time: 'pm',
    intro_el:
      'Το βράδυ στην εγκυμοσύνη κρατάμε ό,τι είναι ήπιο και τεκμηριωμένο: αζελαϊκό οξύ για σπυράκια και κηλίδες, και αν θέλεις γλυκολικό μία με δύο φορές την εβδομάδα. Τα ρετινοειδή περιμένουν μέχρι να τελειώσει και ο θηλασμός.',
    intro_en:
      'In pregnancy the evening keeps what is gentle and well studied: azelaic acid for spots and marks, and glycolic acid once or twice a week if you like. Retinoids wait until breastfeeding is over too.',
    duration_min: 6,
    steps: [
      {
        order: 1,
        product_type_slug: 'cleanser-micellar-water',
        note_el: 'Μόνο αν φοράς μακιγιάζ ή αντηλιακό με χρώμα, για να φύγει το πρώτο στρώμα.',
        note_en: 'Only if you wear make-up or tinted sunscreen, to lift the first layer.',
        optional: true,
      },
      {
        order: 2,
        product_type_slug: 'cleanser-cream-milk',
        note_el: 'Ο κυρίως καθαρισμός, απαλά με τα δάχτυλα, χωρίς σφουγγάρι.',
        note_en: 'The main cleanse, gently with your fingertips, no sponge.',
        optional: false,
      },
      {
        order: 3,
        product_type_slug: 'serum-azelaic-acid',
        note_el: 'Λεπτή στρώση σε στεγνό δέρμα, στα σημεία με σπυράκια ή κηλίδες.',
        note_en: 'A thin layer on dry skin, over spots or dark patches.',
        optional: false,
      },
      {
        order: 4,
        product_type_slug: 'exfoliant-aha-glycolic-lactic',
        note_el: 'Μία ή δύο φορές την εβδομάδα, σε βράδυ χωρίς αζελαϊκό· όχι σε ερεθισμένο δέρμα.',
        note_en: 'Once or twice a week, on a night without azelaic acid; not on irritated skin.',
        optional: true,
      },
      {
        order: 5,
        product_type_slug: 'moisturizer-cream-ceramide',
        note_el: 'Τελευταίο βήμα· βάλε και στον λαιμό και το ντεκολτέ.',
        note_en: 'The last step; take it down to the neck and chest.',
        optional: false,
      },
    ],
  },

  // --- melasma / hyperpigmentation -------------------------------------------------------------------
  {
    slug: 'face-women-all-am-eu-melasma',
    area: 'face',
    name_el: 'Πρωινή ρουτίνα για μέλασμα και κηλίδες',
    name_en: 'Morning routine for melasma and dark spots',
    audience: 'women',
    skin_type: 'all',
    region: 'eu',
    time: 'am',
    intro_el:
      'Στο μέλασμα το πρωί κρίνει τα πάντα: ένας ορός που φρενάρει τη μελανίνη και, κυρίως, αντηλιακό με χρώμα που κόβει και το ορατό φως. Ανανέωση στη μέση της μέρας, ακόμα και με συννεφιά. Το μέλασμα ξαναγυρίζει εύκολα — το συνολικό πλάνο το φτιάχνει δερματολόγος.',
    intro_en:
      'With melasma the morning decides everything: a serum that slows melanin and, above all, a tinted sunscreen that also blocks visible light. Top it up mid-day, even on cloudy days. Melasma returns easily — a dermatologist builds the overall plan.',
    duration_min: 6,
    steps: [
      {
        order: 1,
        product_type_slug: 'cleanser-cream-milk',
        note_el: 'Ήπιος καθαρισμός· ο ερεθισμός μπορεί να σκουρύνει τις κηλίδες.',
        note_en: 'A gentle cleanse; irritation can darken the patches.',
        optional: false,
      },
      {
        order: 2,
        product_type_slug: 'serum-tranexamic-acid',
        note_el: 'Σε όλο το πρόσωπο, όχι μόνο στις κηλίδες· δώσε του 8–12 εβδομάδες.',
        note_en: 'Over the whole face, not just the patches; give it 8–12 weeks.',
        optional: false,
      },
      {
        order: 3,
        product_type_slug: 'serum-vitamin-c',
        note_el: 'Αν το δέρμα το ανέχεται, μετά το τρανεξαμικό, πριν την κρέμα.',
        note_en: 'If your skin tolerates it, after the tranexamic acid, before the cream.',
        optional: true,
      },
      {
        order: 4,
        product_type_slug: 'moisturizer-emulsion-light',
        note_el: 'Λίγη ποσότητα· αν το αντηλιακό σου ενυδατώνει αρκετά, παράλειψέ το.',
        note_en: 'A small amount; skip it if your sunscreen moisturises enough.',
        optional: true,
      },
      {
        order: 5,
        product_type_slug: 'sunscreen-tinted-iron-oxide',
        note_el: 'Δύο δάχτυλα ποσότητα, μέχρι τους κροτάφους και το πάνω χείλος.',
        note_en: 'Two finger-lengths, out to the temples and over the upper lip.',
        optional: false,
      },
      {
        order: 6,
        product_type_slug: 'sunscreen-powder-touch-up',
        note_el: 'Ανανέωση το μεσημέρι πάνω από το μακιγιάζ, με πολλά περάσματα.',
        note_en: 'A mid-day top-up over make-up, with several passes.',
        optional: true,
      },
    ],
  },
  {
    slug: 'face-women-all-pm-eu-melasma',
    area: 'face',
    name_el: 'Βραδινή ρουτίνα για μέλασμα και κηλίδες',
    name_en: 'Evening routine for melasma and dark spots',
    audience: 'women',
    skin_type: 'all',
    region: 'eu',
    time: 'pm',
    intro_el:
      'Το βράδυ δουλεύουν τα συστατικά που ομογενοποιούν τον τόνο, μέσα στα όρια που ορίζει η ΕΕ για τα καλλυντικά. Κανένα τρίψιμο, κανένα «σπιτικό peeling»: στο μέλασμα ο ερεθισμός κάνει τις κηλίδες πιο σκούρες. Ισχυρότερες θεραπείες, όπως η υδροκινόνη, είναι υπόθεση δερματολόγου.',
    intro_en:
      'At night the tone-evening ingredients do their work, within the EU’s cosmetic limits. No scrubbing, no “home peels”: with melasma, irritation makes the patches darker. Stronger treatments such as hydroquinone are a matter for a dermatologist.',
    duration_min: 6,
    steps: [
      {
        order: 1,
        product_type_slug: 'cleanser-oil-balm',
        note_el: 'Λιώνει το αντηλιακό με χρώμα και το μακιγιάζ χωρίς τρίψιμο.',
        note_en: 'Melts tinted sunscreen and make-up without rubbing.',
        optional: true,
      },
      {
        order: 2,
        product_type_slug: 'cleanser-cream-milk',
        note_el: 'Δεύτερος, ήπιος καθαρισμός.',
        note_en: 'A second, gentle cleanse.',
        optional: false,
      },
      {
        order: 3,
        product_type_slug: 'serum-arbutin-kojic',
        note_el: 'Σε όλο το πρόσωπο· κάνε πρώτα τεστ στο σαγόνι για μερικές μέρες.',
        note_en: 'All over the face; patch test on the jawline for a few days first.',
        optional: false,
      },
      {
        order: 4,
        product_type_slug: 'serum-azelaic-acid',
        note_el: 'Εναλλακτικά με τον ορό λάμψης, σε διαφορετικά βράδια, αν το δέρμα το αντέχει.',
        note_en: 'Alternate with the brightening serum on different nights, if your skin copes.',
        optional: true,
      },
      {
        order: 5,
        product_type_slug: 'moisturizer-cream-ceramide',
        note_el: 'Κλείνει τη ρουτίνα και προστατεύει τον φραγμό.',
        note_en: 'Closes the routine and protects the barrier.',
        optional: false,
      },
    ],
  },

  // --- rosacea-prone / sensitive ---------------------------------------------------------------------
  {
    slug: 'face-all-sensitive-am-eu-rosacea',
    area: 'face',
    name_el: 'Πρωινή ρουτίνα για ευαίσθητο δέρμα με τάση για ροδόχρου',
    name_en: 'Morning routine for sensitive, rosacea-prone skin',
    audience: 'all',
    skin_type: 'sensitive',
    region: 'eu',
    time: 'am',
    intro_el:
      'Λίγα προϊόντα χωρίς άρωμα, οινόπνευμα ή μενθόλη, και ορυκτό αντηλιακό, γιατί ο ήλιος είναι από τις πιο συχνές αιτίες έξαρσης. Αν έχεις διάγνωση ροδόχρου και φαρμακευτική αγωγή από δερματολόγο, η αγωγή μπαίνει πρώτη και η ενυδατική μετά.',
    intro_en:
      'A few products without fragrance, alcohol or menthol, and a mineral sunscreen, because sun is one of the most common flare triggers. If you have rosacea and a dermatologist’s prescription, the medicine goes on first and the moisturiser after.',
    duration_min: 5,
    steps: [
      {
        order: 1,
        product_type_slug: 'cleanser-cream-milk',
        note_el:
          'Με τα δάχτυλα και χλιαρό νερό, χωρίς πανάκι ή σφουγγάρι· ταμπονάρισμα για στέγνωμα.',
        note_en: 'With fingertips and lukewarm water, no washcloth or sponge; pat dry.',
        optional: false,
      },
      {
        order: 2,
        product_type_slug: 'toner-thermal-water-mist',
        note_el: 'Λίγο σπρέι όταν το δέρμα καίει, και ταμπονάρισμα μετά από λίγα δευτερόλεπτα.',
        note_en: 'A light spray when the skin feels hot, blotted after a few seconds.',
        optional: true,
      },
      {
        order: 3,
        product_type_slug: 'serum-azelaic-acid',
        note_el:
          'Για κοκκινίλα και σπυράκια· ένα ελαφρύ τσίμπημα τις πρώτες εβδομάδες είναι συνηθισμένο.',
        note_en: 'For redness and bumps; a slight tingle in the first weeks is common.',
        optional: true,
      },
      {
        order: 4,
        product_type_slug: 'moisturizer-cream-ceramide',
        note_el: 'Κάθε μέρα, ακόμα κι αν το δέρμα είναι λιπαρό· χωρίς ουρία.',
        note_en: 'Every day, even if your skin is oily; no urea.',
        optional: false,
      },
      {
        order: 5,
        product_type_slug: 'sunscreen-mineral-zinc',
        note_el: 'Οξείδιο του ψευδαργύρου ή/και διοξείδιο του τιτανίου, SPF 30+, και καπέλο.',
        note_en: 'Zinc oxide and/or titanium dioxide, SPF 30+, and a hat.',
        optional: false,
      },
    ],
  },
  {
    slug: 'face-all-sensitive-pm-eu-rosacea',
    area: 'face',
    name_el: 'Βραδινή ρουτίνα για ευαίσθητο δέρμα με τάση για ροδόχρου',
    name_en: 'Evening routine for sensitive, rosacea-prone skin',
    audience: 'all',
    skin_type: 'sensitive',
    region: 'eu',
    time: 'pm',
    intro_el:
      'Το βράδυ ο στόχος είναι να ηρεμήσει το δέρμα: ήπιος καθαρισμός και επανόρθωση του φραγμού, χωρίς απολεπιστικά και scrub. Δοκίμαζε κάθε νέο προϊόν πρώτα στο εσωτερικό του μπράτσου για μία εβδομάδα.',
    intro_en:
      'In the evening the aim is to calm the skin: a gentle cleanse and barrier repair, no exfoliants or scrubs. Try every new product on the inside of your arm for a week first.',
    duration_min: 4,
    steps: [
      {
        order: 1,
        product_type_slug: 'cleanser-cream-milk',
        note_el: 'Ένας καθαρισμός αρκεί· χωρίς καυτό νερό.',
        note_en: 'One cleanse is enough; no hot water.',
        optional: false,
      },
      {
        order: 2,
        product_type_slug: 'serum-centella-cica',
        note_el: 'Πίεσε απαλά με τις παλάμες, χωρίς τρίψιμο.',
        note_en: 'Press it in gently with your palms, no rubbing.',
        optional: true,
      },
      {
        order: 3,
        product_type_slug: 'serum-panthenol-barrier',
        note_el: 'Τις μέρες που το δέρμα τσούζει ή ξεφλουδίζει.',
        note_en: 'On days when the skin stings or flakes.',
        optional: true,
      },
      {
        order: 4,
        product_type_slug: 'moisturizer-cream-ceramide',
        note_el: 'Κρέμα αντί για λοσιόν ή gel — οι δερματολόγοι την προτιμούν στο ευαίσθητο δέρμα.',
        note_en:
          'A cream rather than a lotion or gel — dermatologists prefer it for sensitive skin.',
        optional: false,
      },
    ],
  },

  // --- adult acne (women) ------------------------------------------------------------------------------
  {
    slug: 'face-women-combination-am-us-adult-acne',
    area: 'face',
    name_el: 'Πρωινή ρουτίνα για ακμή ενηλίκων',
    name_en: 'Morning routine for adult acne',
    audience: 'women',
    skin_type: 'combination',
    region: 'us',
    time: 'am',
    intro_el:
      'Η ακμή μετά τα 25 είναι συχνή στις γυναίκες, συνήθως στο σαγόνι και γύρω από το στόμα. Το πρωί θέλει ήπιο καθαρισμό, ένα ενεργό που δεν ξηραίνει και αντηλιακό που δεν φράζει τους πόρους. Αν τίποτα δεν βοηθά μετά από μερικούς μήνες, πήγαινε σε δερματολόγο.',
    intro_en:
      'Acne after 25 is common in women, usually on the jaw and around the mouth. The morning needs a gentle cleanse, an active that does not dry you out and a sunscreen that will not clog pores. If nothing helps after a few months, see a dermatologist.',
    duration_min: 5,
    steps: [
      {
        order: 1,
        product_type_slug: 'cleanser-gel-foaming',
        note_el: 'Δύο φορές τη μέρα το πολύ· το συχνό πλύσιμο ερεθίζει.',
        note_en: 'Twice a day at most; washing more often irritates.',
        optional: false,
      },
      {
        order: 2,
        product_type_slug: 'serum-niacinamide',
        note_el: 'Για λιπαρότητα και κοκκινίλα από τα σπυράκια.',
        note_en: 'For oiliness and the redness left by spots.',
        optional: true,
      },
      {
        order: 3,
        product_type_slug: 'serum-azelaic-acid',
        note_el: 'Σε όλη τη ζώνη που βγάζει σπυράκια, όχι μόνο πάνω στο σπυράκι.',
        note_en: 'Over the whole area that breaks out, not just on the spot.',
        optional: false,
      },
      {
        order: 4,
        product_type_slug: 'moisturizer-gel-oil-free',
        note_el: 'Ελαφριά, με σήμα «μη φαγεσωρογόνο».',
        note_en: 'Light, labelled non-comedogenic.',
        optional: false,
      },
      {
        order: 5,
        product_type_slug: 'sunscreen-fluid-oil-control',
        note_el: 'Ματ φινίρισμα που δεν βαραίνει και κρατάει κάτω από το μακιγιάζ.',
        note_en: 'A matte finish that feels light and holds under make-up.',
        optional: false,
      },
    ],
  },
  {
    slug: 'face-women-combination-pm-us-adult-acne',
    area: 'face',
    name_el: 'Βραδινή ρουτίνα για ακμή ενηλίκων',
    name_en: 'Evening routine for adult acne',
    audience: 'women',
    skin_type: 'combination',
    region: 'us',
    time: 'pm',
    intro_el:
      'Το βράδυ είναι η ώρα του ρετινοειδούς: η αδαπαλένη χωρίς συνταγή κρατάει τους πόρους ανοιχτούς, αλλά θέλει τρεις μήνες για να φανεί. Όχι αν είσαι έγκυος ή προσπαθείς να μείνεις. Μακιγιάζ και αντηλιακό φεύγουν πάντα πριν τον ύπνο.',
    intro_en:
      'Evening is retinoid time: over-the-counter adapalene keeps pores clear, but takes three months to show. Not if you are pregnant or trying to be. Make-up and sunscreen always come off before bed.',
    duration_min: 6,
    steps: [
      {
        order: 1,
        product_type_slug: 'cleanser-micellar-water',
        note_el: 'Αν φοράς μακιγιάζ, για να φύγει πριν τον κυρίως καθαρισμό.',
        note_en: 'If you wear make-up, to lift it before the main cleanse.',
        optional: true,
      },
      {
        order: 2,
        product_type_slug: 'cleanser-salicylic-wash',
        note_el:
          'Άφησέ το μισό λεπτό στο δέρμα και ξέπλυνε· σε μέρες ερεθισμού, ήπιο gel αντ’ αυτού.',
        note_en: 'Leave it for half a minute, then rinse; on irritated days, a mild gel instead.',
        optional: false,
      },
      {
        order: 3,
        product_type_slug: 'treatment-adapalene-otc',
        note_el: 'Ένα μπιζέλι για όλο το πρόσωπο, σε στεγνό δέρμα, μέρα παρά μέρα στην αρχή.',
        note_en: 'One pea for the whole face, on dry skin, every other night at first.',
        optional: false,
      },
      {
        order: 4,
        product_type_slug: 'moisturizer-gel-oil-free',
        note_el: 'Περίμενε λίγα λεπτά μετά το ρετινοειδές και βάλε την κρέμα.',
        note_en: 'Wait a few minutes after the retinoid, then apply the cream.',
        optional: false,
      },
      {
        order: 5,
        product_type_slug: 'treatment-hydrocolloid-patch',
        note_el: 'Πάνω σε ανοιχτό σπυράκι, για να μην το πειράζεις τη νύχτα.',
        note_en: 'Over an open spot, so you do not pick at it overnight.',
        optional: true,
      },
    ],
  },

  // --- perimenopause / mature skin -------------------------------------------------------------------
  {
    slug: 'face-women-dry-am-eu-perimenopause',
    area: 'face',
    name_el: 'Πρωινή ρουτίνα για ώριμο δέρμα στην περιεμμηνόπαυση',
    name_en: 'Morning routine for mature skin in perimenopause',
    audience: 'women',
    skin_type: 'dry',
    region: 'eu',
    time: 'am',
    intro_el:
      'Με την πτώση των οιστρογόνων το δέρμα χάνει νερό και ελαστικότητα και γίνεται πιο λεπτό. Το πρωί δίνουμε ενυδάτωση σε στρώσεις και προστασία από τον ήλιο, που είναι η πιο αποδεδειγμένη αντιγηραντική κίνηση. Αν εμφανιστεί και ακμή, πες το στον δερματολόγο.',
    intro_en:
      'As oestrogen falls the skin loses water and elasticity and grows thinner. In the morning we layer hydration and add sun protection, the best-proven anti-ageing step. If breakouts appear as well, tell a dermatologist.',
    duration_min: 6,
    steps: [
      {
        order: 1,
        product_type_slug: 'cleanser-cream-milk',
        note_el: 'Ή απλώς χλιαρό νερό, αν καθάρισες καλά το βράδυ.',
        note_en: 'Or just lukewarm water, if you cleansed well the night before.',
        optional: true,
      },
      {
        order: 2,
        product_type_slug: 'serum-vitamin-c',
        note_el: 'Αντιοξειδωτική προστασία κάτω από το αντηλιακό.',
        note_en: 'Antioxidant protection under the sunscreen.',
        optional: true,
      },
      {
        order: 3,
        product_type_slug: 'serum-hyaluronic-acid',
        note_el: 'Σε νωπό δέρμα, για να τραβήξει νερό.',
        note_en: 'On damp skin, so it has water to draw in.',
        optional: false,
      },
      {
        order: 4,
        product_type_slug: 'moisturizer-urea-face',
        note_el: 'Μαλακώνει την τραχιά υφή· στις ξηρές περιοχές λίγο παραπάνω.',
        note_en: 'Softens rough texture; a little extra on dry patches.',
        optional: false,
      },
      {
        order: 5,
        product_type_slug: 'eye-cream-peptide',
        note_el: 'Ελάχιστη ποσότητα, ταμπονάροντας.',
        note_en: 'A tiny amount, tapped in.',
        optional: true,
      },
      {
        order: 6,
        product_type_slug: 'sunscreen-eu-modern-filters',
        note_el: 'SPF 30–50 με υψηλή UVA, σε πρόσωπο, λαιμό και ντεκολτέ.',
        note_en: 'SPF 30–50 with high UVA, on face, neck and chest.',
        optional: false,
      },
    ],
  },
  {
    slug: 'face-women-dry-pm-eu-perimenopause',
    area: 'face',
    name_el: 'Βραδινή ρουτίνα για ώριμο δέρμα στην περιεμμηνόπαυση',
    name_en: 'Evening routine for mature skin in perimenopause',
    audience: 'women',
    skin_type: 'dry',
    region: 'eu',
    time: 'pm',
    intro_el:
      'Ένα ρετινοειδές και μια πλούσια κρέμα: αυτό είναι όλο. Η ρετινάλη ξεκινά δύο βράδια την εβδομάδα και ανεβαίνει μόνο αν το δέρμα δεν ερεθίζεται· τα άλλα βράδια μένει μόνο η κρέμα.',
    intro_en:
      'One retinoid and one rich cream: that is all. Retinal starts two nights a week and goes up only if the skin is not irritated; on the other nights it is just the cream.',
    duration_min: 5,
    steps: [
      {
        order: 1,
        product_type_slug: 'cleanser-oil-balm',
        note_el: 'Λιώνει αντηλιακό και μακιγιάζ χωρίς να στεγνώνει το δέρμα· ξέπλυνε καλά.',
        note_en: 'Melts sunscreen and make-up without drying the skin; rinse well.',
        optional: false,
      },
      {
        order: 2,
        product_type_slug: 'serum-retinal',
        note_el: 'Ένα μπιζέλι σε στεγνό δέρμα, μακριά από τα βλέφαρα και τις γωνίες της μύτης.',
        note_en: 'One pea on dry skin, away from the eyelids and the corners of the nose.',
        optional: false,
      },
      {
        order: 3,
        product_type_slug: 'moisturizer-rich-lipid-mature',
        note_el: 'Γενναία ποσότητα, και στον λαιμό.',
        note_en: 'A generous layer, down the neck too.',
        optional: false,
      },
      {
        order: 4,
        product_type_slug: 'eye-cream-peptide',
        note_el: 'Στο κόκαλο κάτω από το μάτι, όχι στο βλέφαρο.',
        note_en: 'On the bone under the eye, not on the lid.',
        optional: true,
      },
      {
        order: 5,
        product_type_slug: 'lip-ointment-repair',
        note_el: 'Τα ρετινοειδή ξεραίνουν τα χείλη· λίγη αλοιφή πριν τον ύπνο.',
        note_en: 'Retinoids dry the lips; a little ointment before bed.',
        optional: true,
      },
    ],
  },

  // --- sun: after-sun + Greek summer -----------------------------------------------------------------
  {
    slug: 'face-all-all-pm-eu-after-sun',
    area: 'face',
    name_el: 'Βραδινή ρουτίνα μετά από πολύ ήλιο',
    name_en: 'Evening routine after too much sun',
    audience: 'all',
    skin_type: 'all',
    region: 'eu',
    time: 'pm',
    intro_el:
      'Όταν το δέρμα κοκκίνισε και «καίει»: δροσιά, ενυδάτωση χωρίς άρωμα και διάλειμμα από οξέα και ρετινοειδή μέχρι να ηρεμήσει. Μην σπας φουσκάλες και μην βάζεις πάγο απευθείας. Φουσκάλες σε μεγάλη έκταση, πυρετός, ρίγος ή ζάλη θέλουν γιατρό.',
    intro_en:
      'When the skin has turned red and feels hot: cool it, moisturise without fragrance, and pause acids and retinoids until it settles. Do not pop blisters or put ice straight on the skin. Widespread blisters, fever, chills or dizziness need a doctor.',
    duration_min: 5,
    steps: [
      {
        order: 1,
        product_type_slug: 'cleanser-cream-milk',
        note_el: 'Δροσερό ντους πρώτα· μετά ήπιος καθαρισμός με δροσερό νερό, χωρίς τρίψιμο.',
        note_en: 'A cool shower first; then a gentle cleanse with cool water, no rubbing.',
        optional: false,
      },
      {
        order: 2,
        product_type_slug: 'toner-thermal-water-mist',
        note_el: 'Για δροσιά· ταμπονάρισε μετά από λίγα δευτερόλεπτα.',
        note_en: 'For cooling; blot it after a few seconds.',
        optional: true,
      },
      {
        order: 3,
        product_type_slug: 'serum-panthenol-barrier',
        note_el: 'Σε νωπό δέρμα, αν το πρόσωπο τσούζει.',
        note_en: 'On damp skin, if your face stings.',
        optional: true,
      },
      {
        order: 4,
        product_type_slug: 'moisturizer-after-sun-gel',
        note_el: 'Παχιά στρώση, και ξανά όποτε το δέρμα ζεσταίνεται· πιες και άφθονο νερό.',
        note_en: 'A thick layer, again whenever the skin heats up; drink plenty of water too.',
        optional: false,
      },
    ],
  },
  {
    slug: 'face-all-all-am-eu-greek-summer-beach',
    area: 'face',
    name_el: 'Πρωινή ρουτίνα για μέρα στην παραλία — ελληνικό καλοκαίρι',
    name_en: 'Morning routine for a beach day — Greek summer',
    audience: 'all',
    skin_type: 'all',
    region: 'eu',
    time: 'am',
    intro_el:
      'Από τον Μάιο ως τον Σεπτέμβριο ο δείκτης UV στην Ελλάδα φτάνει συχνά το 8–10. Ελαφριές υφές, αντηλιακό με υψηλή UVA, στικ στην τσάντα για ανανέωση κάθε δύο ώρες και μετά από κάθε βουτιά, και σκιά από τις 11 ως τις 4.',
    intro_en:
      'From May to September the UV index in Greece often reaches 8–10. Light textures, a high-UVA sunscreen, a stick in the bag to reapply every two hours and after every swim, and shade from 11 to 4.',
    duration_min: 5,
    steps: [
      {
        order: 1,
        product_type_slug: 'cleanser-gel-foaming',
        note_el: 'Γρήγορο πλύσιμο με δροσερό νερό.',
        note_en: 'A quick wash with cool water.',
        optional: false,
      },
      {
        order: 2,
        product_type_slug: 'serum-vitamin-c',
        note_el: 'Επιπλέον αντιοξειδωτικά κάτω από το αντηλιακό.',
        note_en: 'Extra antioxidants under the sunscreen.',
        optional: true,
      },
      {
        order: 3,
        product_type_slug: 'moisturizer-gel-oil-free',
        note_el:
          'Με την υγρασία του καλοκαιριού συχνά αρκεί το αντηλιακό· βάλε το μόνο αν το δέρμα τραβάει.',
        note_en:
          'In summer humidity the sunscreen is often enough; use this only if your skin feels tight.',
        optional: true,
      },
      {
        order: 4,
        product_type_slug: 'sunscreen-eu-modern-filters',
        note_el: 'SPF 50, αδιάβροχο, 15 λεπτά πριν βγεις· και στα αυτιά και τον σβέρκο.',
        note_en:
          'SPF 50, water-resistant, 15 minutes before going out; ears and back of the neck too.',
        optional: false,
      },
      {
        order: 5,
        product_type_slug: 'sunscreen-stick-reapply',
        note_el: 'Στην τσάντα: μύτη, ζυγωματικά, αυτιά, μετά από κάθε μπάνιο και σκούπισμα.',
        note_en: 'In the bag: nose, cheekbones, ears, after every swim and towel-off.',
        optional: false,
      },
      {
        order: 6,
        product_type_slug: 'lip-balm-spf',
        note_el: 'Ανανέωση κάθε φορά που τρως ή πίνεις.',
        note_en: 'Reapply every time you eat or drink.',
        optional: false,
      },
    ],
  },

  // --- budget ----------------------------------------------------------------------------------------
  {
    slug: 'face-all-all-am-eu-budget',
    area: 'face',
    name_el: 'Οικονομική πρωινή ρουτίνα: τρία προϊόντα',
    name_en: 'Budget morning routine: three products',
    audience: 'all',
    skin_type: 'all',
    region: 'eu',
    time: 'am',
    intro_el:
      'Καθαριστικό, ενυδατική, αντηλιακό: τα τρία βήματα που κάνουν τη μεγαλύτερη διαφορά, όλα από τη χαμηλή κατηγορία τιμής του φαρμακείου ή του σούπερ μάρκετ. Η τιμή δεν δείχνει την αποτελεσματικότητα — η καθημερινή χρήση τη δείχνει.',
    intro_en:
      'Cleanser, moisturiser, sunscreen: the three steps that make the most difference, all from the low price band of the pharmacy or supermarket. Price does not show how well a product works — daily use does.',
    duration_min: 3,
    steps: [
      {
        order: 1,
        product_type_slug: 'cleanser-syndet-bar',
        note_el: 'Μία πλάκα κρατάει μήνες· αφρός στις παλάμες, όχι πάνω στο πρόσωπο.',
        note_en: 'One bar lasts months; lather in your palms, not on the face.',
        optional: false,
      },
      {
        order: 2,
        product_type_slug: 'moisturizer-cream-ceramide',
        note_el: 'Η μεγάλη συσκευασία με αντλία συχνά κάνει και για το σώμα.',
        note_en: 'The big pump tub often works for the body too.',
        optional: false,
      },
      {
        order: 3,
        product_type_slug: 'sunscreen-eu-modern-filters',
        note_el: 'Το μεγάλο μπουκάλι για όλη την οικογένεια βγαίνει φτηνότερο ανά ml.',
        note_en: 'The large family bottle works out cheaper per ml.',
        optional: false,
      },
      {
        order: 4,
        product_type_slug: 'lip-balm-spf',
        note_el: 'Ένα φτηνό στικ με SPF στην τσέπη.',
        note_en: 'A cheap SPF stick in your pocket.',
        optional: true,
      },
    ],
  },
  {
    slug: 'face-all-all-pm-eu-budget',
    area: 'face',
    name_el: 'Οικονομική βραδινή ρουτίνα',
    name_en: 'Budget evening routine',
    audience: 'all',
    skin_type: 'all',
    region: 'eu',
    time: 'pm',
    intro_el:
      'Το βράδυ το δέρμα θέλει καθαρισμό και ενυδάτωση· τα υπόλοιπα είναι προαιρετικά. Αν θέλεις ένα μόνο «ενεργό», η νιασιναμίδη είναι φτηνή και ταιριάζει σχεδόν με όλα.',
    intro_en:
      'At night the skin needs cleansing and moisture; the rest is optional. If you want just one active, niacinamide is cheap and pairs with almost everything.',
    duration_min: 4,
    steps: [
      {
        order: 1,
        product_type_slug: 'cleanser-micellar-water',
        note_el: 'Μόνο για μακιγιάζ ή αδιάβροχο αντηλιακό.',
        note_en: 'Only for make-up or water-resistant sunscreen.',
        optional: true,
      },
      {
        order: 2,
        product_type_slug: 'cleanser-syndet-bar',
        note_el: 'Η ίδια πλάκα με το πρωί.',
        note_en: 'The same bar as in the morning.',
        optional: false,
      },
      {
        order: 3,
        product_type_slug: 'serum-niacinamide',
        note_el: 'Λίγες σταγόνες· το 5 % αρκεί, δεν χρειάζεται 20 %.',
        note_en: 'A few drops; 5 % is enough, there is no need for 20 %.',
        optional: true,
      },
      {
        order: 4,
        product_type_slug: 'moisturizer-cream-ceramide',
        note_el: 'Η ίδια κρέμα με το πρωί, λίγο πιο γενναία.',
        note_en: 'The same cream as the morning, a little more generously.',
        optional: false,
      },
    ],
  },

  // --- men -------------------------------------------------------------------------------------------
  {
    slug: 'face-men-sensitive-am-eu-gentle-shave',
    area: 'face',
    name_el: 'Πρωινό ήπιο ξύρισμα για ευαίσθητο δέρμα',
    name_en: 'Gentle morning shave for sensitive skin',
    audience: 'men',
    skin_type: 'sensitive',
    region: 'eu',
    time: 'am',
    intro_el:
      'Για όσους κοκκινίζουν ή βγάζουν σπυράκια μετά το ξύρισμα: προϊόντα χωρίς άρωμα, ξυράφι με μία ή δύο λεπίδες, ξύρισμα με τη φορά της τρίχας και ενυδατική όσο το δέρμα είναι ακόμη νωπό. Και ορυκτό αντηλιακό στο τέλος, γιατί το φρεσκοξυρισμένο δέρμα καίγεται εύκολα.',
    intro_en:
      'For men who go red or get bumps after shaving: fragrance-free products, a single- or double-blade razor, shaving with the grain and moisturiser while the skin is still damp. And a mineral sunscreen at the end, because freshly shaved skin burns easily.',
    duration_min: 10,
    steps: [
      {
        order: 1,
        product_type_slug: 'cleanser-syndet-bar',
        note_el: 'Στο τέλος του ντους, για να μαλακώσει η τρίχα.',
        note_en: 'At the end of the shower, so the hair softens.',
        optional: false,
      },
      {
        order: 2,
        product_type_slug: 'shaving-pre-shave-oil',
        note_el: 'Λίγες σταγόνες αν η γενειάδα είναι σκληρή.',
        note_en: 'A few drops if your stubble is coarse.',
        optional: true,
      },
      {
        order: 3,
        product_type_slug: 'shaving-gel-clear-sensitive',
        note_el: 'Λεπτή στρώση· βλέπεις το περίγραμμα και δεν ξαναπερνάς το ίδιο σημείο.',
        note_en: 'A thin layer; you can see the line and avoid going over the same spot.',
        optional: false,
      },
      {
        order: 4,
        product_type_slug: 'toner-thermal-water-mist',
        note_el: 'Δροσερό ψέκασμα στην κοκκινίλα, και ταμπονάρισμα.',
        note_en: 'A cool spritz on any redness, then blot.',
        optional: true,
      },
      {
        order: 5,
        product_type_slug: 'shaving-aftershave-balm',
        note_el: 'Βάλσαμο, όχι λοσιόν με οινόπνευμα.',
        note_en: 'A balm, not an alcohol splash.',
        optional: false,
      },
      {
        order: 6,
        product_type_slug: 'sunscreen-mineral-zinc',
        note_el: 'Ορυκτό SPF 30+, και στα αυτιά και τον λαιμό.',
        note_en: 'Mineral SPF 30+, on the ears and neck too.',
        optional: false,
      },
    ],
  },
  {
    slug: 'face-men-oily-pm-us-ingrown-hairs',
    area: 'face',
    name_el: 'Βραδινή ρουτίνα για τρίχες που μπαίνουν μέσα',
    name_en: 'Evening routine for ingrown hairs',
    audience: 'men',
    skin_type: 'oily',
    region: 'us',
    time: 'pm',
    intro_el:
      'Τα σπυράκια στον λαιμό και το σαγόνι μετά το ξύρισμα είναι συνήθως τρίχες που γύρισαν προς τα μέσα. Ένα ήπιο οξύ το βράδυ, μακριά από το ξύρισμα, βοηθά την τρίχα να βγαίνει. Μην τις τσιμπάς με τσιμπιδάκι· αν αφήνουν σημάδια ή μολύνονται, δερματολόγος.',
    intro_en:
      'Bumps on the neck and jaw after shaving are usually hairs that curled back in. A mild acid in the evening, well away from the shave, helps them grow out. Do not dig them out with tweezers; if they scar or get infected, see a dermatologist.',
    duration_min: 4,
    steps: [
      {
        order: 1,
        product_type_slug: 'cleanser-gel-foaming',
        note_el: 'Καθαρισμός χωρίς τρίψιμο με πανάκι.',
        note_en: 'A cleanse without scrubbing with a cloth.',
        optional: false,
      },
      {
        order: 2,
        product_type_slug: 'shaving-ingrown-hair-lotion',
        note_el: 'Με βαμβάκι στις περιοχές του ξυρίσματος· όχι σε σπασμένο δέρμα.',
        note_en: 'With a cotton pad on the shaved areas; not on broken skin.',
        optional: false,
      },
      {
        order: 3,
        product_type_slug: 'moisturizer-gel-oil-free',
        note_el: 'Λίγο, όταν στεγνώσει η λοσιόν.',
        note_en: 'A little, once the lotion has dried.',
        optional: false,
      },
      {
        order: 4,
        product_type_slug: 'treatment-hydrocolloid-patch',
        note_el: 'Πάνω σε φουσκωμένο σπυράκι, για να μην το πειράζεις.',
        note_en: 'Over a swollen bump, so you leave it alone.',
        optional: true,
      },
    ],
  },
  {
    slug: 'face-men-dry-pm-eu-bakuchiol',
    area: 'face',
    name_el: 'Βραδινή αντιγηραντική ρουτίνα για άντρες χωρίς ρετινόλη',
    name_en: 'Men’s retinol-free anti-ageing evening routine',
    audience: 'men',
    skin_type: 'dry',
    region: 'eu',
    time: 'pm',
    intro_el:
      'Για όσους η ρετινόλη τσούζει ή ξεφλουδίζει: μπακουχιόλη, μια πλούσια κρέμα και λάδι για τη γενειάδα. Τέσσερα λεπτά πριν τον ύπνο· το αποτέλεσμα θέλει τρεις μήνες συνέπειας.',
    intro_en:
      'For men whose skin stings or peels with retinol: bakuchiol, a rich cream and beard oil. Four minutes before bed; results take three months of consistency.',
    duration_min: 4,
    steps: [
      {
        order: 1,
        product_type_slug: 'cleanser-cream-milk',
        note_el: 'Ήπιος καθαρισμός, και στη γενειάδα.',
        note_en: 'A gentle cleanse, through the beard too.',
        optional: false,
      },
      {
        order: 2,
        product_type_slug: 'serum-bakuchiol',
        note_el: 'Λίγες σταγόνες σε πρόσωπο και λαιμό.',
        note_en: 'A few drops on face and neck.',
        optional: false,
      },
      {
        order: 3,
        product_type_slug: 'moisturizer-cream-ceramide',
        note_el: 'Σε όλο το πρόσωπο, μέχρι τη γραμμή της γενειάδας.',
        note_en: 'Over the whole face, up to the beard line.',
        optional: false,
      },
      {
        order: 4,
        product_type_slug: 'eye-cream-peptide',
        note_el: 'Για τις λεπτές ρυτίδες στις άκρες των ματιών.',
        note_en: 'For crow’s feet.',
        optional: true,
      },
      {
        order: 5,
        product_type_slug: 'beard-oil',
        note_el: 'Δύο-τρεις σταγόνες στο δέρμα κάτω από τη γενειάδα.',
        note_en: 'Two or three drops on the skin under the beard.',
        optional: true,
      },
    ],
  },

  // --- nails -----------------------------------------------------------------------------------------
  {
    slug: 'nails-women-pm-gel-soak-off-removal',
    area: 'nails',
    name_el: 'Ασφαλής αφαίρεση ημιμόνιμου στο σπίτι',
    name_en: 'Removing gel polish safely at home',
    audience: 'women',
    skin_type: 'all',
    region: 'global',
    time: 'pm',
    intro_el:
      'Το ημιμόνιμο που ξεκολλάει με τα νύχια παίρνει μαζί του στρώσεις από την πλάκα. Μουλιάζεις, περιμένεις, σπρώχνεις απαλά — και μετά δίνεις στο νύχι λάδι και ενυδάτωση. Αν έχεις αλλεργία στην ασετόνη, προτίμησε κλασικό βερνίκι.',
    intro_en:
      'Gel polish peeled off with your nails takes layers of the plate with it. Soak, wait, nudge gently — then give the nail oil and moisture. If you are allergic to acetone, stick to regular polish.',
    duration_min: 25,
    steps: [
      {
        order: 1,
        product_type_slug: 'nail-remover-gel-soak-off',
        note_el: 'Βαμβάκι με ασετόνη και αλουμινόχαρτο για 10–15 λεπτά· όχι κοντά σε φλόγα.',
        note_en: 'Acetone-soaked cotton under foil for 10–15 minutes; away from any flame.',
        optional: false,
      },
      {
        order: 2,
        product_type_slug: 'nail-file-glass',
        note_el: 'Μόνο για να στρώσεις την άκρη, προς μία κατεύθυνση, όχι πάνω στην πλάκα.',
        note_en: 'Only to tidy the free edge, in one direction, never over the plate.',
        optional: true,
      },
      {
        order: 3,
        product_type_slug: 'cuticle-oil-jojoba',
        note_el: 'Μία σταγόνα σε κάθε νύχι αμέσως μετά — η ασετόνη έχει στεγνώσει τα πάντα.',
        note_en: 'One drop per nail straight after — the acetone has dried everything out.',
        optional: false,
      },
      {
        order: 4,
        product_type_slug: 'nail-treatment-hydrating-serum',
        note_el: 'Κάθε βράδυ για τις επόμενες εβδομάδες, πριν το επόμενο χρώμα.',
        note_en: 'Every night for the next weeks, before the next colour.',
        optional: true,
      },
      {
        order: 5,
        product_type_slug: 'hand-cream-urea',
        note_el: 'Στα χέρια και πάνω στα νύχια.',
        note_en: 'On the hands and over the nails.',
        optional: false,
      },
    ],
  },
  {
    slug: 'nails-all-pm-daily-cuticle-care',
    area: 'nails',
    name_el: 'Καθημερινή φροντίδα επωνυχίων και νυχιών',
    name_en: 'Daily cuticle and nail care',
    audience: 'all',
    skin_type: 'all',
    region: 'global',
    time: 'pm',
    intro_el:
      'Δύο λεπτά πριν τον ύπνο για νύχια που σχίζονται και επωνύχια που σκάνε. Τα επωνύχια δεν κόβονται: προστατεύουν από τις λοιμώξεις, γι’ αυτό απλώς τα μαλακώνεις.',
    intro_en:
      'Two minutes before bed for nails that split and cuticles that crack. Cuticles are not cut: they protect against infection, so you simply soften them.',
    duration_min: 2,
    steps: [
      {
        order: 1,
        product_type_slug: 'cuticle-oil-jojoba',
        note_el: 'Μία σταγόνα στη βάση κάθε νυχιού, με μασάζ.',
        note_en: 'One drop at the base of each nail, massaged in.',
        optional: false,
      },
      {
        order: 2,
        product_type_slug: 'nail-treatment-hydrating-serum',
        note_el: 'Πάνω σε όλη την πλάκα και την άκρη.',
        note_en: 'Over the whole plate and the free edge.',
        optional: true,
      },
      {
        order: 3,
        product_type_slug: 'hand-cream-urea',
        note_el: 'Τελευταία, για να κλείσει μέσα την υγρασία.',
        note_en: 'Last, to seal the moisture in.',
        optional: false,
      },
    ],
  },
  {
    slug: 'nails-women-weekly-natural-nail-break',
    area: 'nails',
    name_el: 'Εβδομάδα «ξεκούρασης» από το ημιμόνιμο',
    name_en: 'A week off gel: natural-nail care',
    audience: 'women',
    skin_type: 'all',
    region: 'global',
    time: 'weekly',
    intro_el:
      'Οι δερματολόγοι προτείνουν να κρατάς τα τεχνητά νύχια και το ημιμόνιμο για ειδικές περιστάσεις, ώστε τα φυσικά νύχια να συνέρχονται. Μια φορά την εβδομάδα: σχήμα, βάση που λειαίνει, λάδι — και αντηλιακό στα χέρια κάθε πρωί.',
    intro_en:
      'Dermatologists suggest saving artificial nails and gel for special occasions, so natural nails can recover. Once a week: shape, a smoothing base coat, oil — and sunscreen on the hands every morning.',
    duration_min: 15,
    steps: [
      {
        order: 1,
        product_type_slug: 'nail-remover-acetone-free',
        note_el: 'Αν υπάρχει παλιό βερνίκι, με ένα πέρασμα, χωρίς τρίψιμο.',
        note_en: 'If there is old polish, in one sweep, without rubbing.',
        optional: true,
      },
      {
        order: 2,
        product_type_slug: 'nail-file-glass',
        note_el: 'Κοντό, στρογγυλεμένο σχήμα, σε στεγνά νύχια, προς μία κατεύθυνση.',
        note_en: 'A short, rounded shape, on dry nails, in one direction.',
        optional: false,
      },
      {
        order: 3,
        product_type_slug: 'base-coat-ridge-filler',
        note_el: 'Μία στρώση για λείο, περιποιημένο φινίρισμα χωρίς χρώμα.',
        note_en: 'One coat for a smooth, groomed, colour-free finish.',
        optional: true,
      },
      {
        order: 4,
        product_type_slug: 'cuticle-oil-jojoba',
        note_el: 'Και κάθε βράδυ της εβδομάδας.',
        note_en: 'And every night of the week.',
        optional: false,
      },
      {
        order: 5,
        product_type_slug: 'hand-cream-spf',
        note_el: 'Κάθε πρωί, και ξανά μετά το πλύσιμο των χεριών.',
        note_en: 'Every morning, and again after washing your hands.',
        optional: false,
      },
    ],
  },
]
