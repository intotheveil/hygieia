// OVERLAY 0011 — the skincare_product_types additions (see ../0011-skincare-more.ts for the overlay
// header). One module per bundled table loader (../by-table/, perf 2026-10-06). Same conventions as
// the base seed (../../skincare/product-types.ts): generic TYPES, never brands; `key_ingredients` /
// `avoid_with` lower-case English; anything prescription-only or condition-specific says so.
// Erasable syntax only, explicit `.ts` imports.

import type { SkincareProductTypeSeed } from '../../../types.ts'

export const SKINCARE_PRODUCT_TYPES: readonly SkincareProductTypeSeed[] = [
  // --- cleansers ---------------------------------------------------------------------------------
  {
    slug: 'cleanser-salicylic-wash',
    category: 'cleanser',
    name_el: 'Καθαριστικό με σαλικυλικό οξύ',
    name_en: 'Salicylic acid face wash',
    description_el:
      'Gel καθαρισμού με χαμηλή συγκέντρωση σαλικυλικού οξέος (BHA), που μένει λίγο στο δέρμα και βοηθά να μη φράζουν οι πόροι. Για λιπαρή επιδερμίδα με τάση ακμής, και για άντρες με τρίχες που μπαίνουν μέσα μετά το ξύρισμα.',
    description_en:
      'A cleansing gel with a low level of salicylic acid (BHA) that sits on the skin briefly and helps keep pores clear. For oily, acne-prone skin, and for men who get ingrown hairs after shaving.',
    key_ingredients: ['salicylic acid', 'glycerin', 'zinc pca'],
    avoid_with: ['another bha in the same session', 'very dry or broken skin'],
    regions: ['us', 'global'],
    audiences: ['all'],
    skin_types: ['oily', 'combination'],
    concerns: ['acne', 'pores', 'shaving'],
    time: 'both',
    price_band_eur: 'low',
    notes_el:
      'Άφησέ το 30–60 δευτερόλεπτα πριν το ξεπλύνεις. Αν το δέρμα ξεραίνεται, κράτα το μόνο για το βράδυ.',
    notes_en:
      'Leave it on for 30–60 seconds before rinsing. If your skin dries out, keep it for evenings only.',
  },
  {
    slug: 'cleanser-syndet-bar',
    category: 'cleanser',
    name_el: 'Πλάκα καθαρισμού χωρίς σαπούνι (syndet)',
    name_en: 'Soap-free cleansing bar (syndet)',
    description_el:
      'Στερεό καθαριστικό με ήπιους συνθετικούς επιφανειοδραστικούς, με pH κοντά σε αυτό του δέρματος. Καθαρίζει σαν σαπούνι αλλά στεγνώνει πολύ λιγότερο, κρατάει μήνες και δεν θέλει πλαστική συσκευασία.',
    description_en:
      'A solid cleanser made with mild synthetic surfactants at a pH close to the skin’s. It cleans like soap but dries far less, lasts for months and needs no plastic bottle.',
    key_ingredients: ['sodium cocoyl isethionate', 'stearic acid', 'glycerin'],
    avoid_with: [],
    regions: ['eu', 'global'],
    audiences: ['all'],
    skin_types: ['normal', 'dry', 'combination', 'sensitive'],
    concerns: ['general', 'hydration'],
    time: 'both',
    price_band_eur: 'low',
    notes_el:
      'Δεν είναι το ίδιο με το κλασικό σαπούνι: κοίτα να γράφει «χωρίς σαπούνι» ή «syndet». Φύλαξέ το σε σαπουνοθήκη που στραγγίζει.',
    notes_en:
      'It is not the same as ordinary soap: look for “soap-free” or “syndet” on the label. Keep it on a draining dish.',
  },
  {
    slug: 'cleanser-eye-makeup-biphase',
    category: 'cleanser',
    name_el: 'Διφασικό ντεμακιγιάζ ματιών',
    name_en: 'Bi-phase eye make-up remover',
    description_el:
      'Υγρό δύο φάσεων (λάδι και νερό) που ανακινείται πριν τη χρήση και διαλύει αδιάβροχη μάσκαρα και eyeliner χωρίς τρίψιμο. Το κρατάς με το βαμβάκι λίγα δευτερόλεπτα στα βλέφαρα και σκουπίζεις προς τα κάτω.',
    description_en:
      'A two-phase liquid (oil and water) that you shake before use; it dissolves waterproof mascara and eyeliner without rubbing. Hold the soaked pad on the lids for a few seconds, then wipe downwards.',
    key_ingredients: ['isohexadecane', 'cyclopentasiloxane', 'cornflower water', 'panthenol'],
    avoid_with: [],
    regions: ['eu', 'global'],
    audiences: ['women'],
    skin_types: ['all'],
    concerns: ['general'],
    time: 'pm',
    price_band_eur: 'low',
    notes_el:
      'Για φακούς επαφής, βγάλε πρώτα τους φακούς. Αν τα μάτια τσούζουν, προτίμησε σύνθεση χωρίς άρωμα.',
    notes_en:
      'If you wear contact lenses, take them out first. If your eyes sting, choose a fragrance-free formula.',
  },

  // --- toner / mist ------------------------------------------------------------------------------
  {
    slug: 'toner-thermal-water-mist',
    category: 'toner',
    name_el: 'Ιαματικό νερό σε σπρέι',
    name_en: 'Thermal spring water mist',
    description_el:
      'Νερό από ιαματικές πηγές σε σπρέι, κλασικό των ευρωπαϊκών φαρμακείων, για δροσιά και ανακούφιση σε ευαίσθητο ή ερεθισμένο δέρμα, μετά τον ήλιο ή μετά το ξύρισμα. Δεν ενυδατώνει από μόνο του: σκούπισε την περίσσεια και βάλε κρέμα από πάνω.',
    description_en:
      'Spring water in a spray, a European pharmacy classic, for a cooling, soothing moment on sensitive or irritated skin, after the sun or after shaving. On its own it does not moisturise: blot the excess and follow with a cream.',
    key_ingredients: ['thermal spring water', 'nitrogen'],
    avoid_with: [],
    regions: ['eu'],
    audiences: ['all'],
    skin_types: ['sensitive', 'dry', 'normal', 'all'],
    concerns: ['redness', 'sun', 'shaving'],
    time: 'both',
    price_band_eur: 'low',
    notes_el:
      'Αν το αφήσεις να εξατμιστεί μόνο του στο πρόσωπο, το δέρμα μπορεί να στεγνώσει περισσότερο. Ταμπονάρισε μετά από λίγα δευτερόλεπτα.',
    notes_en:
      'Left to evaporate on its own, it can leave the skin drier than before. Pat it off after a few seconds.',
  },

  // --- serums ------------------------------------------------------------------------------------
  {
    slug: 'serum-tranexamic-acid',
    category: 'serum',
    name_el: 'Ορός τρανεξαμικού οξέος',
    name_en: 'Tranexamic acid serum',
    description_el:
      'Ορός για κηλίδες και μέλασμα, συνήθως 2–5 % τρανεξαμικό οξύ, συχνά μαζί με νιασιναμίδη. Οι μελέτες σε μέλασμα δείχνουν όφελος σε 8–12 εβδομάδες, αρκεί να υπάρχει καθημερινά αντηλιακό.',
    description_en:
      'A serum for dark patches and melasma, usually 2–5 % tranexamic acid, often with niacinamide. Studies in melasma show benefit within 8–12 weeks, provided daily sunscreen goes with it.',
    key_ingredients: ['tranexamic acid', 'niacinamide', 'glycerin'],
    avoid_with: [],
    regions: ['kr', 'eu', 'global'],
    audiences: ['women', 'all'],
    skin_types: ['all'],
    concerns: ['pigmentation'],
    time: 'both',
    price_band_eur: 'mid',
    notes_el:
      'Το τρανεξαμικό από το στόμα είναι φάρμακο με συνταγή και άλλους κινδύνους· ο ορός είναι καλλυντικό. Για επίμονο μέλασμα, το πλάνο το φτιάχνει δερματολόγος.',
    notes_en:
      'Oral tranexamic acid is a prescription drug with different risks; the serum is a cosmetic. For stubborn melasma, a dermatologist builds the plan.',
  },
  {
    slug: 'serum-bakuchiol',
    category: 'serum',
    name_el: 'Ορός μπακουχιόλης',
    name_en: 'Bakuchiol serum',
    description_el:
      'Φυτικό συστατικό (από τον σπόρο Psoralea corylifolia) που δεν είναι ρετινοειδές, αλλά σε μικρές μελέτες έδωσε αποτελέσματα κοντά σε αυτά της ρετινόλης στις λεπτές γραμμές, με λιγότερο ερεθισμό. Επιλογή για όσους δεν ανέχονται τη ρετινόλη.',
    description_en:
      'A plant ingredient (from Psoralea corylifolia seeds) that is not a retinoid, yet in small studies gave results close to retinol on fine lines, with less irritation. An option for those who cannot tolerate retinol.',
    key_ingredients: ['bakuchiol', 'squalane', 'tocopherol'],
    avoid_with: [],
    regions: ['us', 'eu', 'global'],
    audiences: ['all'],
    skin_types: ['sensitive', 'dry', 'normal', 'combination'],
    concerns: ['aging', 'texture'],
    time: 'both',
    price_band_eur: 'mid',
    notes_el:
      'Τα στοιχεία είναι λιγότερα από της ρετινόλης. «Φυτικό» δεν σημαίνει ελεγμένο στην εγκυμοσύνη: ρώτα τον γιατρό σου πριν το χρησιμοποιήσεις τότε.',
    notes_en:
      'The evidence is thinner than retinol’s. “Plant-based” does not mean tested in pregnancy: ask your doctor before using it then.',
  },
  {
    slug: 'serum-retinal',
    category: 'serum',
    name_el: 'Ορός ρετινάλης (ρετιναλδεΰδης)',
    name_en: 'Retinal (retinaldehyde) serum',
    description_el:
      'Ρετινοειδές χωρίς συνταγή, ένα βήμα πιο κοντά στη δραστική μορφή από τη ρετινόλη, γι’ αυτό δουλεύει σε μικρότερες συγκεντρώσεις (0,05–0,1 %). Για λεπτές γραμμές, υφή και κηλίδες, μόνο το βράδυ.',
    description_en:
      'A non-prescription retinoid one step closer to the active form than retinol, so it works at lower strengths (0.05–0.1 %). For fine lines, texture and dark spots, evenings only.',
    key_ingredients: ['retinal', 'niacinamide', 'squalane'],
    avoid_with: [
      'aha in the same session',
      'bha in the same session',
      'benzoyl peroxide',
      'pregnancy and breastfeeding',
    ],
    regions: ['eu', 'global'],
    audiences: ['all'],
    skin_types: ['normal', 'dry', 'combination', 'oily'],
    concerns: ['aging', 'texture', 'pigmentation'],
    time: 'pm',
    price_band_eur: 'high',
    notes_el:
      'Ξεκίνα δύο βράδια την εβδομάδα και ανέβαινε σιγά σιγά. Όχι στην εγκυμοσύνη και τον θηλασμό, και αντηλιακό κάθε πρωί.',
    notes_en:
      'Start two nights a week and build up slowly. Not in pregnancy or breastfeeding, and sunscreen every morning.',
  },
  {
    slug: 'serum-arbutin-kojic',
    category: 'serum',
    name_el: 'Ορός λάμψης με άλφα-αρμπουτίνη ή κογικό οξύ',
    name_en: 'Brightening serum with alpha-arbutin or kojic acid',
    description_el:
      'Ορός για ανομοιόμορφο τόνο και καφέ κηλίδες, με ουσίες που φρενάρουν την παραγωγή μελανίνης. Στην ΕΕ τα όρια είναι 2 % άλφα-αρμπουτίνη και 1 % κογικό οξύ σε προϊόντα προσώπου.',
    description_en:
      'A serum for uneven tone and brown spots, with ingredients that slow melanin production. In the EU the caps are 2 % alpha-arbutin and 1 % kojic acid in face products.',
    key_ingredients: ['alpha-arbutin', 'kojic acid', 'niacinamide', 'licorice root extract'],
    avoid_with: [],
    regions: ['eu', 'kr', 'jp'],
    audiences: ['women', 'all'],
    skin_types: ['normal', 'combination', 'oily', 'dry'],
    concerns: ['pigmentation'],
    time: 'both',
    price_band_eur: 'mid',
    notes_el:
      'Χωρίς καθημερινό αντηλιακό οι κηλίδες ξαναγυρίζουν. Το κογικό οξύ ερεθίζει κάποιες επιδερμίδες: κάνε πρώτα τεστ.',
    notes_en:
      'Without daily sunscreen the spots come back. Kojic acid irritates some skin: patch test first.',
  },
  {
    slug: 'serum-panthenol-barrier',
    category: 'serum',
    name_el: 'Καταπραϋντικός ορός με πανθενόλη και κεραμίδια',
    name_en: 'Soothing panthenol and ceramide serum',
    description_el:
      'Απλός ορός επανόρθωσης του φραγμού, με προβιταμίνη B5, κεραμίδια και γλυκερίνη. Για δέρμα που τσούζει από υπερβολικά «ενεργά», μετά τον ήλιο ή τον χειμώνα με το καλοριφέρ.',
    description_en:
      'A simple barrier-repair serum with provitamin B5, ceramides and glycerin. For skin that stings from too many actives, after the sun, or in winter with the heating on.',
    key_ingredients: ['panthenol', 'ceramides', 'glycerin', 'allantoin'],
    avoid_with: [],
    regions: ['eu', 'global'],
    audiences: ['all'],
    skin_types: ['sensitive', 'dry', 'all'],
    concerns: ['redness', 'hydration'],
    time: 'both',
    price_band_eur: 'low',
    notes_el:
      'Όταν ο φραγμός έχει «καεί», σταμάτα τα οξέα και τα ρετινοειδή για μία με δύο εβδομάδες και κράτα μόνο αυτόν και κρέμα.',
    notes_en:
      'When the barrier is “burnt”, stop acids and retinoids for a week or two and keep only this and a cream.',
  },

  // --- moisturisers ------------------------------------------------------------------------------
  {
    slug: 'moisturizer-urea-face',
    category: 'moisturizer',
    name_el: 'Κρέμα προσώπου με ουρία 5 %',
    name_en: 'Face cream with 5 % urea',
    description_el:
      'Ενυδατική με χαμηλή συγκέντρωση ουρίας, που τραβάει νερό στο δέρμα και μαλακώνει την τραχιά υφή. Καλή για πολύ ξηρό ή ώριμο δέρμα και για τις ξηρές περιοχές στον χειμώνα.',
    description_en:
      'A moisturiser with a low level of urea, which draws water into the skin and softens rough texture. Good for very dry or mature skin and for dry patches in winter.',
    key_ingredients: ['urea', 'glycerin', 'ceramides', 'lactic acid'],
    avoid_with: ['rosacea-prone skin'],
    regions: ['eu'],
    audiences: ['all'],
    skin_types: ['dry', 'normal'],
    concerns: ['hydration', 'texture', 'aging'],
    time: 'both',
    price_band_eur: 'low',
    notes_el:
      'Σε σκασμένο ή ερεθισμένο δέρμα μπορεί να τσούξει. Σε ροδόχρου, οι δερματολόγοι προτείνουν να την αποφεύγεις.',
    notes_en:
      'It can sting on cracked or irritated skin. With rosacea, dermatologists suggest avoiding urea.',
  },
  {
    slug: 'moisturizer-rich-lipid-mature',
    category: 'moisturizer',
    name_el: 'Πλούσια κρέμα νυκτός για ώριμο δέρμα',
    name_en: 'Rich night cream for mature skin',
    description_el:
      'Πυκνή κρέμα με λιπίδια (κεραμίδια, χοληστερόλη, λιπαρά οξέα), πεπτίδια και γλυκερίνη, για το δέρμα που γίνεται πιο ξηρό και λεπτό στην περιεμμηνόπαυση και μετά. Μπαίνει τελευταία το βράδυ.',
    description_en:
      'A dense cream with lipids (ceramides, cholesterol, fatty acids), peptides and glycerin, for skin that turns drier and thinner around perimenopause and after. It goes on last at night.',
    key_ingredients: [
      'ceramides',
      'cholesterol',
      'shea butter',
      'palmitoyl tripeptide-1',
      'glycerin',
    ],
    avoid_with: [],
    regions: ['eu', 'global'],
    audiences: ['women'],
    skin_types: ['dry', 'normal'],
    concerns: ['aging', 'hydration'],
    time: 'pm',
    price_band_eur: 'mid',
    notes_el:
      'Η τιμή δεν δείχνει την αποτελεσματικότητα: τα βασικά λιπίδια υπάρχουν και σε φτηνές κρέμες φαρμακείου.',
    notes_en:
      'Price does not tell you how well it works: the key lipids are in inexpensive pharmacy creams too.',
  },
  {
    slug: 'moisturizer-after-sun-gel',
    category: 'moisturizer',
    name_el: 'Gel για μετά τον ήλιο με αλόη και πανθενόλη',
    name_en: 'After-sun gel with aloe and panthenol',
    description_el:
      'Δροσερό, ελαφρύ gel χωρίς άρωμα για δέρμα που ζεστάθηκε στον ήλιο, με αλόη, πανθενόλη και γλυκερίνη. Φύλαξέ το στο ψυγείο το καλοκαίρι για επιπλέον δροσιά.',
    description_en:
      'A cool, light, fragrance-free gel for skin that has had too much sun, with aloe, panthenol and glycerin. Keep it in the fridge in summer for extra cooling.',
    key_ingredients: ['aloe barbadensis leaf juice', 'panthenol', 'glycerin', 'allantoin'],
    avoid_with: ['menthol or alcohol-heavy formulas on burnt skin'],
    regions: ['global'],
    audiences: ['all'],
    skin_types: ['all'],
    concerns: ['sun', 'redness', 'hydration'],
    time: 'both',
    price_band_eur: 'low',
    notes_el:
      'Δεν «θεραπεύει» το έγκαυμα και δεν αντικαθιστά το αντηλιακό. Φουσκάλες, πυρετός ή ζάλη θέλουν γιατρό.',
    notes_en:
      'It does not “heal” a burn and does not replace sunscreen. Blisters, fever or dizziness need a doctor.',
  },

  // --- sunscreens --------------------------------------------------------------------------------
  {
    slug: 'sunscreen-tinted-iron-oxide',
    category: 'sunscreen',
    name_el: 'Αντηλιακό με χρώμα (οξείδια του σιδήρου)',
    name_en: 'Tinted sunscreen with iron oxides',
    description_el:
      'Ορυκτό αντηλιακό SPF 30–50 με χρωστικές οξειδίων του σιδήρου, που προστατεύει και από το ορατό φως, κάτι που μετράει στο μέλασμα και τις κηλίδες. Δίνει ελαφριά κάλυψη, οπότε σε πολλές μέρες αντικαθιστά το make-up.',
    description_en:
      'A mineral SPF 30–50 sunscreen with iron oxide pigments that also shield against visible light, which matters for melasma and dark spots. It gives light coverage, so on many days it replaces foundation.',
    key_ingredients: ['zinc oxide', 'titanium dioxide', 'iron oxides'],
    avoid_with: [],
    regions: ['eu', 'us', 'global'],
    audiences: ['women', 'all'],
    skin_types: ['all'],
    concerns: ['sun', 'pigmentation', 'redness'],
    time: 'am',
    price_band_eur: 'mid',
    notes_el:
      'Οι αποχρώσεις διαφέρουν πολύ: δοκίμασε στο σαγόνι στο φως της μέρας. Βάλε όση ποσότητα θα έβαζες από άχρωμο αντηλιακό.',
    notes_en:
      'Shades vary a lot: test on the jawline in daylight. Apply as much as you would of an untinted sunscreen.',
  },
  {
    slug: 'sunscreen-spray-reapply',
    category: 'sunscreen',
    name_el: 'Αντηλιακό σπρέι για ανανέωση',
    name_en: 'Sunscreen spray for reapplying',
    description_el:
      'Λεπτό, διάφανο σπρέι για να ανανεώνεις την προστασία στην παραλία, στον λαιμό, στα αυτιά και στο σώμα. Για το πρόσωπο ψέκασε στις παλάμες και άπλωσε, ποτέ κατευθείαν στο πρόσωπο.',
    description_en:
      'A fine, clear spray to top up protection at the beach on the neck, ears and body. For the face, spray into your palms and spread — never straight at the face.',
    key_ingredients: [
      'bis-ethylhexyloxyphenol methoxyphenyl triazine',
      'octocrylene',
      'alcohol denat',
    ],
    avoid_with: ['open flame until dry'],
    regions: ['eu', 'us', 'global'],
    audiences: ['all'],
    skin_types: ['normal', 'oily', 'combination', 'all'],
    concerns: ['sun'],
    time: 'am',
    price_band_eur: 'mid',
    notes_el:
      'Ψέκασε μέχρι το δέρμα να γυαλίσει και άπλωσε με το χέρι — ο αέρας παίρνει μεγάλο μέρος. Μην το εισπνέεις.',
    notes_en:
      'Spray until the skin glistens and rub it in — the wind takes a lot of it. Do not breathe it in.',
  },
  {
    slug: 'sunscreen-powder-touch-up',
    category: 'sunscreen',
    name_el: 'Πούδρα με SPF για ανανέωση πάνω από το μακιγιάζ',
    name_en: 'SPF powder for top-ups over make-up',
    description_el:
      'Ορυκτή πούδρα με πινέλο, για να ανανεώνεις την προστασία στη μέση της μέρας χωρίς να χαλάσεις το μακιγιάζ. Είναι συμπλήρωμα του κανονικού αντηλιακού το πρωί, όχι υποκατάστατο.',
    description_en:
      'A mineral powder with a built-in brush, for topping up protection mid-day without ruining make-up. It complements the morning sunscreen; it does not replace it.',
    key_ingredients: ['zinc oxide', 'titanium dioxide', 'iron oxides', 'silica'],
    avoid_with: [],
    regions: ['us', 'global'],
    audiences: ['women'],
    skin_types: ['oily', 'combination', 'normal'],
    concerns: ['sun', 'pores'],
    time: 'am',
    price_band_eur: 'high',
    notes_el:
      'Για να φτάσεις το SPF της ετικέτας χρειάζεται πολύ περισσότερη πούδρα απ’ όση βάζει κανείς. Πέρασε πολλές φορές, σε όλο το πρόσωπο.',
    notes_en:
      'Reaching the label SPF takes far more powder than people use. Go over the whole face several times.',
  },
  {
    slug: 'sunscreen-fluid-oil-control',
    category: 'sunscreen',
    name_el: 'Ματ αντηλιακό fluid για λιπαρή επιδερμίδα',
    name_en: 'Matte sunscreen fluid for oily skin',
    description_el:
      'Πολύ ρευστό αντηλιακό SPF 50 με απορροφητικές πούδρες και σήμα «μη φαγεσωρογόνο», που δεν γυαλίζει και δεν βαραίνει. Για λιπαρό δέρμα με τάση ακμής και για άντρες που μισούν την αίσθηση της κρέμας.',
    description_en:
      'A very runny SPF 50 sunscreen with oil-absorbing powders and a non-comedogenic label, so it does not shine or feel heavy. For oily, acne-prone skin and for men who hate the feel of cream.',
    key_ingredients: [
      'bis-ethylhexyloxyphenol methoxyphenyl triazine',
      'silica',
      'niacinamide',
      'zinc pca',
    ],
    avoid_with: [],
    regions: ['eu', 'global'],
    audiences: ['all', 'men'],
    skin_types: ['oily', 'combination'],
    concerns: ['sun', 'acne', 'pores'],
    time: 'am',
    price_band_eur: 'mid',
    notes_el:
      'Ανακίνησε καλά πριν τη χρήση. Η ματ υφή δεν σημαίνει λιγότερη ποσότητα: δύο δάχτυλα για πρόσωπο και λαιμό.',
    notes_en:
      'Shake well before use. A matte finish does not mean less product: two finger-lengths for face and neck.',
  },
  {
    slug: 'sunscreen-primer-spf',
    category: 'sunscreen',
    name_el: 'Βάση μακιγιάζ (primer) με SPF',
    name_en: 'Make-up primer with SPF',
    description_el:
      'Λεία βάση που «στρώνει» το δέρμα για το μακιγιάζ και έχει δηλωμένο SPF 30–50. Λειτουργεί ως αντηλιακό μόνο αν μπει σε πλήρη ποσότητα, όπως ένα κανονικό αντηλιακό.',
    description_en:
      'A smoothing base that preps the skin for make-up and carries a declared SPF 30–50. It works as sunscreen only if applied in full amount, like a regular sunscreen.',
    key_ingredients: ['ethylhexyl triazone', 'dimethicone', 'silica', 'glycerin'],
    avoid_with: [],
    regions: ['eu', 'kr', 'global'],
    audiences: ['women'],
    skin_types: ['normal', 'combination', 'oily'],
    concerns: ['sun', 'pores'],
    time: 'am',
    price_band_eur: 'mid',
    notes_el:
      'Αν βάζεις λίγο, όπως βάζουμε συνήθως το primer, η προστασία πέφτει πολύ. Σε μέρες με πολύ ήλιο, βάλε πρώτα αντηλιακό.',
    notes_en:
      'Used sparingly, as primer usually is, the protection drops a lot. On very sunny days, put sunscreen on first.',
  },

  // --- exfoliant ---------------------------------------------------------------------------------
  {
    slug: 'exfoliant-mandelic',
    category: 'exfoliant',
    name_el: 'Ήπιο απολεπιστικό με μανδελικό οξύ',
    name_en: 'Gentle mandelic acid exfoliant',
    description_el:
      'AHA με μεγάλο μόριο που μπαίνει πιο αργά στο δέρμα, γι’ αυτό ερεθίζει λιγότερο από το γλυκολικό. Επιλογή για ευαίσθητη ή σκουρόχρωμη επιδερμίδα με κηλίδες και τάση ακμής, μία με δύο φορές την εβδομάδα.',
    description_en:
      'An AHA with a large molecule that enters the skin more slowly, so it irritates less than glycolic acid. An option for sensitive or darker skin with marks and breakouts, once or twice a week.',
    key_ingredients: ['mandelic acid', 'lactobionic acid', 'glycerin'],
    avoid_with: ['retinoids in the same session', 'other acids in the same session'],
    regions: ['eu', 'us'],
    audiences: ['all'],
    skin_types: ['sensitive', 'combination', 'oily', 'normal'],
    concerns: ['texture', 'pigmentation', 'acne'],
    time: 'pm',
    price_band_eur: 'mid',
    notes_el:
      'Ακόμα και ήπια, τα οξέα κάνουν το δέρμα πιο ευαίσθητο στον ήλιο: αντηλιακό το επόμενο πρωί. Σε ενεργή ροδόχρου, ρώτα πρώτα δερματολόγο.',
    notes_en:
      'Even gentle acids make the skin more sun-sensitive: sunscreen the next morning. With active rosacea, ask a dermatologist first.',
  },

  // --- eye ---------------------------------------------------------------------------------------
  {
    slug: 'eye-cream-peptide',
    category: 'eye',
    name_el: 'Κρέμα ματιών με πεπτίδια',
    name_en: 'Peptide eye cream',
    description_el:
      'Ελαφριά κρέμα για τη λεπτή περιοχή των ματιών, με πεπτίδια, γλυκερίνη και κεραμίδια, χωρίς ρετινοειδή. Ενυδατώνει τις λεπτές γραμμές και ταιριάζει σε όποιον δεν αντέχει ρετινάλη γύρω από τα μάτια.',
    description_en:
      'A light cream for the delicate eye area with peptides, glycerin and ceramides, no retinoids. It plumps fine lines with moisture and suits anyone who cannot tolerate retinal around the eyes.',
    key_ingredients: ['acetyl hexapeptide-8', 'palmitoyl tripeptide-1', 'glycerin', 'ceramides'],
    avoid_with: [],
    regions: ['global', 'kr'],
    audiences: ['all'],
    skin_types: ['all'],
    concerns: ['aging', 'hydration'],
    time: 'both',
    price_band_eur: 'mid',
    notes_el:
      'Μια ποσότητα όσο ένα κόκκος ρυζιού αρκεί για τα δύο μάτια. Ταμπονάρισε με τον παράμεσο, χωρίς να τραβάς το δέρμα.',
    notes_en:
      'A rice-grain amount is enough for both eyes. Tap it in with the ring finger, without pulling the skin.',
  },
  {
    slug: 'eye-patch-hydrogel',
    category: 'eye',
    name_el: 'Επιθέματα hydrogel για τα μάτια',
    name_en: 'Hydrogel eye patches',
    description_el:
      'Δροσερά επιθέματα σε σχήμα μισοφέγγαρου, εμποτισμένα με ενυδατικά και καφεΐνη, κλασικά της κορεατικής περιποίησης. Μένουν 15–20 λεπτά κάτω από τα μάτια και δίνουν πρόσκαιρη φρεσκάδα το πρωί.',
    description_en:
      'Cooling crescent-shaped patches soaked in humectants and caffeine, a Korean skincare classic. They stay under the eyes for 15–20 minutes and give a temporary fresh look in the morning.',
    key_ingredients: ['caffeine', 'glycerin', 'hyaluronic acid', 'niacinamide'],
    avoid_with: [],
    regions: ['kr'],
    audiences: ['women', 'all'],
    skin_types: ['all'],
    concerns: ['hydration', 'general'],
    time: 'am',
    price_band_eur: 'mid',
    notes_el:
      'Το αποτέλεσμα είναι προσωρινό: ο ύπνος και το αλάτι κάνουν περισσότερα για τις σακούλες. Μην τα ξαναχρησιμοποιείς.',
    notes_en: 'The effect is temporary: sleep and salt do more for puffiness. Do not reuse them.',
  },

  // --- lip ---------------------------------------------------------------------------------------
  {
    slug: 'lip-ointment-repair',
    category: 'lip',
    name_el: 'Επανορθωτική αλοιφή χειλιών',
    name_en: 'Repairing lip ointment',
    description_el:
      'Απλή αλοιφή χωρίς άρωμα, με βαζελίνη, λανολίνη ή κερί, για σκασμένα χείλη από κρύο, αέρα ή ρετινοειδή. Πυκνότερη από ένα στικ και χωρίς γεύσεις που σε κάνουν να γλείφεις τα χείλη.',
    description_en:
      'A plain, fragrance-free ointment with petrolatum, lanolin or wax for lips cracked by cold, wind or retinoids. Thicker than a stick, and without flavours that make you lick your lips.',
    key_ingredients: ['petrolatum', 'lanolin', 'beeswax', 'dexpanthenol'],
    avoid_with: ['menthol, camphor or flavourings on cracked lips'],
    regions: ['eu', 'global'],
    audiences: ['all'],
    skin_types: ['all'],
    concerns: ['hydration'],
    time: 'both',
    price_band_eur: 'low',
    notes_el:
      'Τη μέρα, στον ήλιο, προτίμησε στικ με SPF. Αν οι γωνίες των χειλιών σκάνε συνέχεια, δείξ’ τες σε γιατρό.',
    notes_en:
      'By day in the sun, choose a stick with SPF instead. If the corners of the mouth keep cracking, show them to a doctor.',
  },

  // --- shaving -----------------------------------------------------------------------------------
  {
    slug: 'shaving-gel-clear-sensitive',
    category: 'shaving',
    name_el: 'Διάφανο gel ξυρίσματος για ευαίσθητο δέρμα',
    name_en: 'Clear shaving gel for sensitive skin',
    description_el:
      'Gel ξυρίσματος χωρίς άρωμα που δεν αφρίζει πολύ, οπότε βλέπεις πού περνάς τη λεπίδα, ιδανικό για περίγραμμα γενειάδας. Ενυδατώνει την τρίχα και βοηθά τη λεπίδα να γλιστράει.',
    description_en:
      'A fragrance-free shaving gel that barely foams, so you can see where the blade goes, ideal for shaping a beard line. It moisturises the hair and helps the blade glide.',
    key_ingredients: ['glycerin', 'aloe barbadensis leaf juice', 'allantoin'],
    avoid_with: [],
    regions: ['global'],
    audiences: ['men', 'all'],
    skin_types: ['sensitive', 'normal', 'dry', 'all'],
    concerns: ['shaving', 'redness'],
    time: 'both',
    price_band_eur: 'low',
    notes_el:
      'Ταιριάζει και για ξύρισμα ποδιών ή μασχάλης. Ξέπλενε τη λεπίδα μετά από κάθε πέρασμα.',
    notes_en: 'It works for legs and underarms too. Rinse the blade after every stroke.',
  },
  {
    slug: 'shaving-ingrown-hair-lotion',
    category: 'shaving',
    name_el: 'Λοσιόν κατά των τριχών που μπαίνουν μέσα',
    name_en: 'Ingrown-hair lotion',
    description_el:
      'Λοσιόν με ήπια οξέα (σαλικυλικό, γλυκολικό) για τις περιοχές που ξυρίζονται ή αποτριχώνονται, ώστε η τρίχα να βγαίνει χωρίς να εγκλωβίζεται. Μπαίνει το βράδυ, όχι αμέσως μετά το ξύρισμα.',
    description_en:
      'A lotion with mild acids (salicylic, glycolic) for shaved or waxed areas, so hairs grow out instead of getting trapped. It goes on in the evening, not right after shaving.',
    key_ingredients: ['salicylic acid', 'glycolic acid', 'witch hazel'],
    avoid_with: ['freshly shaved or broken skin', 'retinoids in the same session'],
    regions: ['us', 'global'],
    audiences: ['men', 'women'],
    skin_types: ['normal', 'oily', 'combination'],
    concerns: ['shaving', 'acne', 'texture'],
    time: 'pm',
    price_band_eur: 'mid',
    notes_el:
      'Αν τα σπυράκια από το ξύρισμα επιμένουν ή αφήνουν σκούρα σημάδια, ρώτα δερματολόγο. Αντηλιακό την επομένη στις περιοχές που φαίνονται.',
    notes_en:
      'If razor bumps persist or leave dark marks, ask a dermatologist. Sunscreen the next day on any exposed areas.',
  },

  // --- nails -------------------------------------------------------------------------------------
  {
    slug: 'nail-treatment-hydrating-serum',
    category: 'nail_treatment',
    name_el: 'Ενυδατική θεραπεία νυχιών',
    name_en: 'Hydrating nail treatment',
    description_el:
      'Ορός ή κρέμα για την πλάκα του νυχιού με υγροσκοπικά (γλυκερίνη, ουρία) και ουσίες που κλείνουν την υγρασία μέσα (λανολίνη, βαζελίνη). Για νύχια που σχίζονται σε στρώσεις επειδή στεγνώνουν, όχι επειδή είναι «μαλακά».',
    description_en:
      'A serum or cream for the nail plate with humectants (glycerin, urea) and occlusives that lock moisture in (lanolin, petrolatum). For nails that split into layers because they dry out, not because they are “soft”.',
    key_ingredients: ['glycerin', 'urea', 'lanolin', 'petrolatum', 'phospholipids'],
    avoid_with: [],
    regions: ['eu', 'global'],
    audiences: ['all'],
    skin_types: ['all'],
    concerns: ['nails', 'hydration'],
    time: 'pm',
    price_band_eur: 'low',
    notes_el:
      'Δούλεψέ το στο νύχι και στο δέρμα γύρω του κάθε βράδυ, για μήνες. Αν τα νύχια αλλάζουν χρώμα ή σχήμα, δείξ’ τα σε γιατρό.',
    notes_en:
      'Work it into the nail and the skin around it every night, for months. If nails change colour or shape, show them to a doctor.',
  },
  {
    slug: 'nail-remover-gel-soak-off',
    category: 'nail_remover',
    name_el: 'Σετ αφαίρεσης ημιμόνιμου με ασετόνη (soak-off)',
    name_en: 'Gel polish soak-off kit (acetone)',
    description_el:
      'Ασετόνη με βαμβάκια και αλουμινόχαρτο ή κλιπ, για να μαλακώσει το ημιμόνιμο ώστε να φύγει χωρίς τρόχισμα και ξύσιμο. Ο ήπιος τρόπος αφαίρεσης, αντί για το ξεκόλλημα με τα νύχια.',
    description_en:
      'Acetone with cotton pads and foil or clips, to soften gel polish so it comes off without heavy filing or scraping. The gentle way to remove it, instead of peeling it off.',
    key_ingredients: ['acetone', 'glycerin'],
    avoid_with: ['open flame', 'acetone allergy'],
    regions: ['global'],
    audiences: ['women', 'all'],
    skin_types: ['all'],
    concerns: ['nails'],
    time: 'pm',
    price_band_eur: 'low',
    notes_el:
      'Λίμαρε ελαφρά μόνο τη γυαλιστερή επιφάνεια, άφησε 10–15 λεπτά και σπρώξε απαλά με ξυλάκι. Μετά, λάδι επωνυχίων και κρέμα χεριών.',
    notes_en:
      'File only the shiny top coat lightly, wait 10–15 minutes and nudge it off with a wooden stick. Then cuticle oil and hand cream.',
  },
  {
    slug: 'hand-cream-spf',
    category: 'hand_cream',
    name_el: 'Κρέμα χεριών με SPF',
    name_en: 'Hand cream with SPF',
    description_el:
      'Μη λιπαρή κρέμα χεριών με SPF 30 ή περισσότερο, για το πρωί και πριν από το ημιμόνιμο με λάμπα. Τα χέρια παίρνουν ήλιο όλη μέρα στο τιμόνι και στο κινητό, και δείχνουν την ηλικία νωρίς.',
    description_en:
      'A non-greasy hand cream with SPF 30 or more, for mornings and before a gel manicure under a lamp. Hands catch sun all day on the steering wheel and the phone, and show age early.',
    key_ingredients: ['zinc oxide', 'ethylhexyl triazone', 'glycerin', 'niacinamide'],
    avoid_with: [],
    regions: ['eu', 'us', 'global'],
    audiences: ['women', 'all'],
    skin_types: ['all'],
    concerns: ['hands', 'sun', 'pigmentation'],
    time: 'am',
    price_band_eur: 'mid',
    notes_el:
      'Ανανέωσέ τη μετά από κάθε πλύσιμο χεριών, γιατί το νερό την παίρνει. Μην ξεχνάς τη ράχη της παλάμης.',
    notes_en:
      'Reapply after every hand wash, because water takes it off. Do not forget the backs of the hands.',
  },
  {
    slug: 'base-coat-ridge-filler',
    category: 'base_coat',
    name_el: 'Βάση νυχιών που γεμίζει τις ραβδώσεις',
    name_en: 'Ridge-filling base coat',
    description_el:
      'Γαλακτερή βάση που λειαίνει τις κάθετες ραβδώσεις και προστατεύει την πλάκα από τις χρωστικές του βερνικιού. Αρκεί και μόνη της για ένα φυσικό, περιποιημένο αποτέλεσμα.',
    description_en:
      'A milky base coat that smooths vertical ridges and protects the plate from polish pigments. On its own it gives a natural, groomed finish.',
    key_ingredients: ['nitrocellulose', 'silica', 'calcium pantothenate'],
    avoid_with: [],
    regions: ['global'],
    audiences: ['all'],
    skin_types: ['all'],
    concerns: ['nails'],
    time: 'pm',
    price_band_eur: 'low',
    notes_el:
      'Οι κάθετες ραβδώσεις πληθαίνουν με την ηλικία και συνήθως είναι αθώες. Μη λιμάρεις την πλάκα για να τις εξαφανίσεις.',
    notes_en:
      'Vertical ridges increase with age and are usually harmless. Do not file the plate down to get rid of them.',
  },
]
