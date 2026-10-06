// SKINCARE SEED — PRODUCT TYPES (P7.1, PLAN.md §P7 `skincare_product_types`). Generic product TYPES
// — "gel cleanser", "mineral sunscreen", "cuticle oil" — never a brand, never a shop (DECISIONS
// P7.1: informational, no endorsement). `regions` say where a type is TYPICAL as a style or by
// regulation (kr essences / sheet masks / PA++++, eu high-SPF filters such as Tinosorb and
// Mexoryl, us OTC retinoids and drugstore actives, jp lightweight gel sunscreens), not where to buy.
//
// Conventions (PLAN.md §0 content drafting rule):
//   - Bilingual on the same row; Greek written as a Greek pharmacist would say it, loanwords stay
//     Latin where Greek has none in use (SPF, PA, retinol, niacinamide are written as in Greek shops).
//   - `key_ingredients` / `avoid_with` are lower-case English INCI-style names.
//   - Not medical advice: anything prescription-only or condition-specific says "see a dermatologist".
//   - Slugs are `<category>-…` so the product-type guide groups naturally.
//
// Plain data on purpose: scripts/gen-seed-sql.mjs imports it under node's type stripping.

import type { SkincareProductTypeSeed } from '../../types.ts'

export const SKINCARE_PRODUCT_TYPES: readonly SkincareProductTypeSeed[] = [
  // --- cleansers ----------------------------------------------------------------------------------
  {
    slug: 'cleanser-gel-foaming',
    category: 'cleanser',
    name_el: 'Αφρίζον καθαριστικό gel',
    name_en: 'Foaming gel cleanser',
    description_el:
      'Ελαφρύ καθαριστικό με ήπιους επιφανειοδραστικούς παράγοντες που αφαιρεί σμήγμα, ιδρώτα και αντηλιακό χωρίς να αφήνει φιλμ. Η βασική επιλογή για λιπαρή και μικτή επιδερμίδα, πρωί και βράδυ.',
    description_en:
      'A light cleanser with mild surfactants that lifts sebum, sweat and sunscreen without leaving a film. The default choice for oily and combination skin, morning and evening.',
    key_ingredients: ['glycerin', 'cocamidopropyl betaine', 'niacinamide', 'zinc pca'],
    avoid_with: [],
    regions: ['global'],
    audiences: ['all'],
    skin_types: ['oily', 'combination', 'normal'],
    concerns: ['acne', 'pores', 'general'],
    time: 'both',
    price_band_eur: 'low',
    notes_el:
      'Αν η επιδερμίδα «τραβάει» μετά το πλύσιμο, το καθαριστικό είναι πολύ δυνατό για σένα· δοκίμασε κρεμώδες.',
    notes_en:
      'If your skin feels tight after washing, the cleanser is too strong for you; switch to a cream one.',
  },
  {
    slug: 'cleanser-cream-milk',
    category: 'cleanser',
    name_el: 'Κρεμώδες καθαριστικό / γαλάκτωμα',
    name_en: 'Cream or milk cleanser',
    description_el:
      'Καθαριστικό χαμηλού αφρισμού με μαλακτικά λιπίδια, για ξηρή και ευαίσθητη επιδερμίδα. Καθαρίζει χωρίς να αφαιρεί τα φυσικά λιπίδια του φραγμού.',
    description_en:
      'A low-foam cleanser with emollient lipids for dry and sensitive skin. It cleanses without stripping the barrier’s own lipids.',
    key_ingredients: ['glycerin', 'ceramides', 'squalane', 'shea butter'],
    avoid_with: [],
    regions: ['eu', 'global'],
    audiences: ['all'],
    skin_types: ['dry', 'sensitive', 'normal'],
    concerns: ['hydration', 'redness', 'general'],
    time: 'both',
    price_band_eur: 'low',
    notes_el:
      'Στην ΕΕ τα καλλυντικά υπόκεινται στον Κανονισμό 1223/2009· τα συστατικά αναγράφονται με INCI ονομασίες και ο όρος «δερματολογικά ελεγμένο» δεν σημαίνει έγκριση.',
    notes_en:
      'In the EU cosmetics fall under Regulation 1223/2009; ingredients are listed by INCI name and “dermatologically tested” is not an approval.',
  },
  {
    slug: 'cleanser-oil-balm',
    category: 'cleanser',
    name_el: 'Έλαιο ή βάλσαμο καθαρισμού',
    name_en: 'Cleansing oil or balm',
    description_el:
      'Το πρώτο βήμα του «διπλού καθαρισμού» κορεατικού τύπου: διαλύει αντηλιακό, μακιγιάζ και σμήγμα και ξεπλένεται με νερό χάρη σε γαλακτωματοποιητές. Ακολουθεί ένα καθαριστικό με βάση το νερό.',
    description_en:
      'Step one of the Korean-style “double cleanse”: it dissolves sunscreen, make-up and sebum and rinses off with water thanks to emulsifiers. A water-based cleanser follows.',
    key_ingredients: ['mineral oil', 'sunflower seed oil', 'polysorbate', 'squalane'],
    avoid_with: [],
    regions: ['kr', 'jp'],
    audiences: ['all'],
    skin_types: ['all'],
    concerns: ['general', 'pores'],
    time: 'pm',
    price_band_eur: 'mid',
    notes_el:
      'Μόνο βράδυ, και μόνο αν φοράς αντηλιακό ή μακιγιάζ· το πρωί αρκεί ένα απλό καθαριστικό.',
    notes_en:
      'Evening only, and only when you wear sunscreen or make-up; in the morning a single cleanser is enough.',
  },
  {
    slug: 'cleanser-micellar-water',
    category: 'cleanser',
    name_el: 'Μικυλλιακό νερό',
    name_en: 'Micellar water',
    description_el:
      'Γαλλικής καταγωγής καθαριστικό χωρίς ξέβγαλμα, με μικύλλια που «πιάνουν» ρύπους και ελαφρύ μακιγιάζ. Βολικό για γρήγορο καθαρισμό ή ως πρώτο βήμα πριν το πλύσιμο.',
    description_en:
      'A French-born rinse-free cleanser whose micelles pick up dirt and light make-up. Handy for a quick cleanse or as the first step before washing.',
    key_ingredients: ['poloxamer', 'glycerin', 'hexylene glycol'],
    avoid_with: [],
    regions: ['eu'],
    audiences: ['all'],
    skin_types: ['all'],
    concerns: ['general'],
    time: 'pm',
    price_band_eur: 'low',
    notes_el:
      'Παρά την ετικέτα «χωρίς ξέβγαλμα», το ξέβγαλμα μειώνει τον ερεθισμό σε ευαίσθητες επιδερμίδες.',
    notes_en:
      'Despite the “no-rinse” label, rinsing afterwards reduces irritation on sensitive skin.',
  },

  // --- toners and essences --------------------------------------------------------------------------
  {
    slug: 'toner-hydrating',
    category: 'toner',
    name_el: 'Ενυδατικό τόνερ (χωρίς οινόπνευμα)',
    name_en: 'Hydrating toner (alcohol-free)',
    description_el:
      'Υδατικό στρώμα με υγροσκοπικά συστατικά που εφαρμόζεται σε ελαφρώς νωπή επιδερμίδα, πριν τον ορό. Στην κορεατική ρουτίνα συχνά «χτυπιέται» σε 2–3 στρώσεις.',
    description_en:
      'A watery layer of humectants patted onto slightly damp skin before serum. In Korean routines it is often applied in two or three thin layers.',
    key_ingredients: ['hyaluronic acid', 'glycerin', 'panthenol', 'beta-glucan'],
    avoid_with: [],
    regions: ['kr', 'jp'],
    audiences: ['all'],
    skin_types: ['all'],
    concerns: ['hydration', 'general'],
    time: 'both',
    price_band_eur: 'low',
    notes_el:
      'Τα παλιά «στυπτικά» τόνερ με οινόπνευμα δεν προσφέρουν κάτι στις περισσότερες επιδερμίδες και ξηραίνουν.',
    notes_en: 'Old-style alcohol “astringent” toners offer little to most skins and dry them out.',
  },
  {
    slug: 'toner-exfoliating-bha',
    category: 'toner',
    name_el: 'Απολεπιστικό τόνερ με BHA',
    name_en: 'Exfoliating BHA toner',
    description_el:
      'Λοσιόν με σαλικυλικό οξύ (συνήθως 0,5–2 %) που διεισδύει στους πόρους και διαλύει το σμήγμα. Αμερικανικού τύπου «ενεργό» βήμα για λιπαρή επιδερμίδα με μαύρα στίγματα.',
    description_en:
      'A lotion with salicylic acid (usually 0.5–2 %) that gets into pores and dissolves sebum. A US-style “active” step for oily skin with blackheads.',
    key_ingredients: ['salicylic acid', 'glycerin', 'green tea extract'],
    avoid_with: ['retinol in the same session', 'aha in the same session', 'benzoyl peroxide'],
    regions: ['us', 'global'],
    audiences: ['all'],
    skin_types: ['oily', 'combination'],
    concerns: ['acne', 'pores', 'texture'],
    time: 'pm',
    price_band_eur: 'mid',
    notes_el:
      'Στην ΕΕ το σαλικυλικό οξύ σε προϊόντα που παραμένουν στο δέρμα περιορίζεται στο 2 %. Ξεκίνα 2–3 φορές την εβδομάδα.',
    notes_en:
      'In the EU salicylic acid in leave-on products is capped at 2 %. Start two or three times a week.',
  },
  {
    slug: 'essence-hydrating',
    category: 'essence',
    name_el: 'Ενυδατική essence',
    name_en: 'Hydrating essence',
    description_el:
      'Κορεατικό ενδιάμεσο βήμα, πιο «πυκνό» από τόνερ και πιο αραιό από ορό. Προσθέτει νερό και συστατικά που ηρεμούν την επιδερμίδα πριν τα πιο στοχευμένα βήματα.',
    description_en:
      'A Korean in-between step, richer than a toner and thinner than a serum. It adds water and soothing ingredients before the more targeted steps.',
    key_ingredients: ['snail mucin', 'centella asiatica', 'hyaluronic acid', 'fermented extracts'],
    avoid_with: [],
    regions: ['kr'],
    audiences: ['all'],
    skin_types: ['all'],
    concerns: ['hydration', 'redness', 'general'],
    time: 'both',
    price_band_eur: 'mid',
    notes_el:
      'Προαιρετικό βήμα: αν η ρουτίνα σου έχει ήδη ενυδατικό τόνερ και ορό, η essence προσθέτει λίγα.',
    notes_en:
      'An optional step: if your routine already has a hydrating toner and a serum, an essence adds little.',
  },
  {
    slug: 'essence-first-treatment',
    category: 'essence',
    name_el: 'First treatment essence (ζυμωμένα εκχυλίσματα)',
    name_en: 'First treatment essence (fermented)',
    description_el:
      'Υδατικό προϊόν με ζυμωμένα εκχυλίσματα (μαγιά, ρύζι) που εφαρμόζεται πρώτο μετά τον καθαρισμό στην κορεατική και ιαπωνική ρουτίνα. Στόχος η λάμψη και η ομοιόμορφη υφή.',
    description_en:
      'A watery product with fermented extracts (yeast, rice) applied first after cleansing in Korean and Japanese routines. The aim is glow and an even texture.',
    key_ingredients: ['galactomyces ferment filtrate', 'rice ferment', 'niacinamide'],
    avoid_with: [],
    regions: ['kr', 'jp'],
    audiences: ['all'],
    skin_types: ['normal', 'dry', 'combination'],
    concerns: ['texture', 'pigmentation', 'hydration'],
    time: 'both',
    price_band_eur: 'high',
    notes_el:
      'Τα ζυμωμένα εκχυλίσματα ενοχλούν κάποιες επιδερμίδες με τάση για ακμή από μύκητες (fungal acne)· κάνε patch test.',
    notes_en: 'Fermented extracts bother some skins prone to fungal acne; patch test first.',
  },

  // --- serums ---------------------------------------------------------------------------------------
  {
    slug: 'serum-niacinamide',
    category: 'serum',
    name_el: 'Ορός νιασιναμίδης',
    name_en: 'Niacinamide serum',
    description_el:
      'Βιταμίνη B3 σε 2–10 %: ρυθμίζει το σμήγμα, ενισχύει τον φραγμό και αμβλύνει τα σημάδια μετά από σπυράκια. Από τα πιο ανεκτά «ενεργά», πρωί και βράδυ.',
    description_en:
      'Vitamin B3 at 2–10 %: it regulates sebum, strengthens the barrier and softens post-blemish marks. One of the best-tolerated actives, morning and evening.',
    key_ingredients: ['niacinamide', 'zinc pca', 'hyaluronic acid'],
    avoid_with: [],
    regions: ['global', 'us', 'kr'],
    audiences: ['all'],
    skin_types: ['all'],
    concerns: ['pores', 'pigmentation', 'acne', 'redness'],
    time: 'both',
    price_band_eur: 'low',
    notes_el:
      'Πάνω από 10 % δεν προσφέρει περισσότερα και αυξάνει την πιθανότητα κοκκινίλας. Ο συνδυασμός με βιταμίνη C είναι ασφαλής.',
    notes_en:
      'Above 10 % adds nothing and raises the chance of flushing. Pairing with vitamin C is fine.',
  },
  {
    slug: 'serum-hyaluronic-acid',
    category: 'serum',
    name_el: 'Ορός υαλουρονικού οξέος',
    name_en: 'Hyaluronic acid serum',
    description_el:
      'Υγροσκοπικός ορός που «κρατά» νερό στα επιφανειακά στρώματα και δίνει άμεσα πιο γεμάτη όψη. Εφαρμόζεται σε νωπή επιδερμίδα και πάντα σφραγίζεται με ενυδατική.',
    description_en:
      'A humectant serum that holds water in the upper layers for an instantly plumper look. Apply to damp skin and always seal with a moisturiser.',
    key_ingredients: ['sodium hyaluronate', 'hyaluronic acid', 'glycerin', 'panthenol'],
    avoid_with: [],
    regions: ['global'],
    audiences: ['all'],
    skin_types: ['all'],
    concerns: ['hydration', 'aging'],
    time: 'both',
    price_band_eur: 'low',
    notes_el:
      'Σε πολύ ξηρό αέρα (θέρμανση, κλιματισμός) χωρίς ενυδατική από πάνω μπορεί να «τραβήξει» νερό από το δέρμα αντί από τον αέρα.',
    notes_en:
      'In very dry air (heating, air conditioning) without a moisturiser on top it can pull water from the skin rather than the air.',
  },
  {
    slug: 'serum-vitamin-c',
    category: 'serum',
    name_el: 'Ορός βιταμίνης C',
    name_en: 'Vitamin C serum',
    description_el:
      'Αντιοξειδωτικός ορός για το πρωί: συμπληρώνει το αντηλιακό, φωτίζει και βοηθά στην ομοιόμορφη απόχρωση. Το L-ασκορβικό (10–20 %) είναι το πιο μελετημένο αλλά και το πιο ασταθές.',
    description_en:
      'An antioxidant morning serum: it complements sunscreen, brightens and helps even out tone. L-ascorbic acid (10–20 %) is the best-studied form and the least stable.',
    key_ingredients: ['l-ascorbic acid', 'ascorbyl glucoside', 'ferulic acid', 'vitamin e'],
    avoid_with: ['benzoyl peroxide', 'retinol in the same session'],
    regions: ['us', 'eu', 'global'],
    audiences: ['all'],
    skin_types: ['normal', 'combination', 'oily'],
    concerns: ['pigmentation', 'aging', 'sun'],
    time: 'am',
    price_band_eur: 'mid',
    notes_el:
      'Όταν ο ορός σκουραίνει προς πορτοκαλί-καφέ, έχει οξειδωθεί και δεν προσφέρει πια. Φύλαξέ τον μακριά από φως και ζέστη.',
    notes_en:
      'When the serum turns orange-brown it has oxidised and no longer works. Keep it away from light and heat.',
  },
  {
    slug: 'serum-retinol',
    category: 'serum',
    name_el: 'Ορός ρετινόλης',
    name_en: 'Retinol serum',
    description_el:
      'Παράγωγο βιταμίνης Α χωρίς συνταγή που επιταχύνει την ανανέωση των κυττάρων: λεπτές γραμμές, υφή, σημάδια ακμής. Το βράδυ, σε στεγνή επιδερμίδα, ξεκινώντας 1–2 φορές την εβδομάδα.',
    description_en:
      'An over-the-counter vitamin A derivative that speeds cell turnover: fine lines, texture, acne marks. Evenings, on dry skin, starting once or twice a week.',
    key_ingredients: ['retinol', 'retinaldehyde', 'squalane', 'bisabolol'],
    avoid_with: [
      'aha in the same session',
      'bha in the same session',
      'benzoyl peroxide',
      'vitamin c in the same session',
      'pregnancy and breastfeeding',
    ],
    regions: ['us', 'eu', 'global'],
    audiences: ['all'],
    skin_types: ['normal', 'combination', 'oily', 'dry'],
    concerns: ['aging', 'texture', 'acne', 'pigmentation'],
    time: 'pm',
    price_band_eur: 'mid',
    notes_el:
      'Από το 2025 η ΕΕ περιορίζει τη ρετινόλη σε καλλυντικά προσώπου στο 0,3 %. Αποφεύγεται στην εγκυμοσύνη και τον θηλασμό· για ισχυρότερα ρετινοειδή χρειάζεται δερματολόγος.',
    notes_en:
      'Since 2025 the EU caps retinol in face cosmetics at 0.3 %. Avoid in pregnancy and breastfeeding; stronger retinoids need a dermatologist.',
  },
  {
    slug: 'serum-azelaic-acid',
    category: 'serum',
    name_el: 'Ορός ή κρέμα αζελαϊκού οξέος',
    name_en: 'Azelaic acid serum or cream',
    description_el:
      'Ήπιο «ενεργό» (10 % χωρίς συνταγή στην ΕΕ) για κοκκινίλα, ροδόχρου ακμή, σπυράκια και σημάδια. Από τα λίγα δραστικά που θεωρούνται κατάλληλα και στην εγκυμοσύνη.',
    description_en:
      'A gentle active (10 % over the counter in the EU) for redness, rosacea-prone skin, blemishes and marks. One of the few actives generally considered suitable in pregnancy.',
    key_ingredients: ['azelaic acid', 'niacinamide', 'allantoin'],
    avoid_with: ['aha in the same session'],
    regions: ['eu', 'us'],
    audiences: ['all'],
    skin_types: ['sensitive', 'combination', 'oily', 'normal'],
    concerns: ['redness', 'acne', 'pigmentation'],
    time: 'both',
    price_band_eur: 'mid',
    notes_el:
      'Ένα ελαφρύ τσούξιμο τα πρώτα λεπτά είναι συνηθισμένο και υποχωρεί σε 1–2 εβδομάδες. Τα 15–20 % είναι φαρμακευτικά σκευάσματα με συνταγή.',
    notes_en:
      'A light tingle for the first minutes is common and fades within a week or two. The 15–20 % strengths are prescription medicines.',
  },
  {
    slug: 'serum-peptides',
    category: 'serum',
    name_el: 'Ορός πεπτιδίων',
    name_en: 'Peptide serum',
    description_el:
      'Ορός με μικρές αλυσίδες αμινοξέων που «σηματοδοτούν» στο δέρμα ενυδάτωση και σφριγηλότητα. Ήπιο, ταιριάζει σε όσους δεν ανέχονται ρετινόλη.',
    description_en:
      'A serum of short amino-acid chains that signal hydration and firmness to the skin. Gentle, and a fit for people who do not tolerate retinol.',
    key_ingredients: ['palmitoyl tripeptide', 'copper peptides', 'acetyl hexapeptide-8'],
    avoid_with: ['vitamin c in the same session (copper peptides)'],
    regions: ['kr', 'us', 'global'],
    audiences: ['all'],
    skin_types: ['all'],
    concerns: ['aging', 'hydration'],
    time: 'both',
    price_band_eur: 'high',
    notes_el:
      'Οι ενδείξεις είναι πιο αδύναμες από ό,τι για τη ρετινόλη· θεώρησέ το συμπλήρωμα και όχι αντικατάσταση αντηλιακού και ρετινόλης.',
    notes_en:
      'The evidence is weaker than for retinol; treat it as a supplement, not a replacement for sunscreen and retinol.',
  },
  {
    slug: 'serum-centella-cica',
    category: 'serum',
    name_el: 'Ορός centella («cica»)',
    name_en: 'Centella (“cica”) serum',
    description_el:
      'Κορεατικό καταπραϋντικό με εκχύλισμα Centella asiatica (μαδεκασσοσίδη, ασιατικοσίδη) που ηρεμεί κοκκινίλα και επισκευάζει τον φραγμό μετά από ενεργά ή ξύρισμα.',
    description_en:
      'A Korean soother with Centella asiatica extract (madecassoside, asiaticoside) that calms redness and repairs the barrier after actives or shaving.',
    key_ingredients: ['centella asiatica extract', 'madecassoside', 'panthenol', 'allantoin'],
    avoid_with: [],
    regions: ['kr'],
    audiences: ['all'],
    skin_types: ['sensitive', 'all'],
    concerns: ['redness', 'shaving', 'hydration'],
    time: 'both',
    price_band_eur: 'mid',
    notes_el: 'Καλή επιλογή για τις «ήσυχες» βραδιές ανάμεσα σε ρετινόλη και οξέα.',
    notes_en: 'A good pick for the “rest” evenings between retinol and acids.',
  },
  {
    slug: 'serum-snail-mucin',
    category: 'serum',
    name_el: 'Ορός βλεννίνης σαλιγκαριού',
    name_en: 'Snail mucin serum',
    description_el:
      'Κολλώδης ενυδατικός ορός της κορεατικής αγοράς, με έκκριμα σαλιγκαριού πλούσιο σε γλυκοπρωτεΐνες και υαλουρονικό. Ενυδατώνει, απαλύνει και βοηθά στην επούλωση μικροτραυματισμών.',
    description_en:
      'A tacky hydrating serum from the Korean market, with snail secretion rich in glycoproteins and hyaluronic acid. It hydrates, softens and helps minor marks heal.',
    key_ingredients: ['snail secretion filtrate', 'hyaluronic acid', 'allantoin'],
    avoid_with: [],
    regions: ['kr'],
    audiences: ['all'],
    skin_types: ['all'],
    concerns: ['hydration', 'texture', 'acne'],
    time: 'both',
    price_band_eur: 'mid',
    notes_el:
      'Όσοι έχουν αλλεργία σε οστρακοειδή ή μαλάκια ας κάνουν patch test· υπάρχουν αναφορές διασταυρούμενης αντίδρασης.',
    notes_en:
      'Anyone allergic to shellfish or molluscs should patch test; cross-reactions have been reported.',
  },

  // --- moisturizers --------------------------------------------------------------------------------
  {
    slug: 'moisturizer-gel-oil-free',
    category: 'moisturizer',
    name_el: 'Ενυδατική gel (χωρίς έλαια)',
    name_en: 'Oil-free gel moisturiser',
    description_el:
      'Υδατική ενυδατική που απορροφάται γρήγορα και δεν αφήνει γυαλάδα· η λύση για λιπαρή επιδερμίδα και ελληνικά καλοκαίρια. Συνδυάζεται άνετα με αντηλιακό από πάνω.',
    description_en:
      'A water-based moisturiser that absorbs fast and leaves no shine; the answer for oily skin and Greek summers. It layers easily under sunscreen.',
    key_ingredients: ['glycerin', 'hyaluronic acid', 'niacinamide', 'dimethicone'],
    avoid_with: [],
    regions: ['global', 'us'],
    audiences: ['all'],
    skin_types: ['oily', 'combination'],
    concerns: ['hydration', 'acne', 'pores'],
    time: 'both',
    price_band_eur: 'low',
    notes_el:
      'Η λιπαρή επιδερμίδα χρειάζεται ενυδάτωση: όταν την παραλείπεις, το δέρμα συχνά παράγει περισσότερο σμήγμα.',
    notes_en: 'Oily skin still needs moisture: skip it and the skin often produces more sebum.',
  },
  {
    slug: 'moisturizer-cream-ceramide',
    category: 'moisturizer',
    name_el: 'Κρέμα με κεραμίδια (επισκευή φραγμού)',
    name_en: 'Ceramide barrier cream',
    description_el:
      'Πλούσια κρέμα που αναπληρώνει τα λιπίδια του δερματικού φραγμού — κεραμίδια, χοληστερόλη, λιπαρά οξέα. Για ξηρή, ερεθισμένη ή «κουρασμένη από ενεργά» επιδερμίδα και για τον χειμώνα με θέρμανση.',
    description_en:
      'A rich cream that replenishes the barrier’s lipids — ceramides, cholesterol, fatty acids. For dry, irritated or “over-exfoliated” skin and for heated winter rooms.',
    key_ingredients: ['ceramide np', 'cholesterol', 'fatty acids', 'glycerin', 'petrolatum'],
    avoid_with: [],
    regions: ['eu', 'us', 'global'],
    audiences: ['all'],
    skin_types: ['dry', 'sensitive', 'normal'],
    concerns: ['hydration', 'redness', 'aging'],
    time: 'both',
    price_band_eur: 'mid',
    notes_el:
      'Οι «δερμοκαλλυντικές» σειρές των ευρωπαϊκών φαρμακείων συνήθως εδώ ξεχωρίζουν: λίγα συστατικά, χωρίς άρωμα.',
    notes_en:
      'European pharmacy “dermo-cosmetic” lines usually shine here: few ingredients, no fragrance.',
  },
  {
    slug: 'moisturizer-emulsion-light',
    category: 'moisturizer',
    name_el: 'Ελαφρύ γαλάκτωμα (emulsion)',
    name_en: 'Light emulsion',
    description_el:
      'Λεπτόρρευστη ενυδατική ανάμεσα σε λοσιόν και κρέμα, τυπική της κορεατικής και ιαπωνικής ρουτίνας. «Σφραγίζει» τόνερ και ορό χωρίς βάρος, ιδανική σε ζέστη και υγρασία.',
    description_en:
      'A fluid moisturiser between a lotion and a cream, typical of Korean and Japanese routines. It seals toner and serum without weight — ideal in heat and humidity.',
    key_ingredients: ['glycerin', 'squalane', 'ceramides', 'green tea extract'],
    avoid_with: [],
    regions: ['kr', 'jp'],
    audiences: ['all'],
    skin_types: ['combination', 'normal', 'oily'],
    concerns: ['hydration', 'general'],
    time: 'both',
    price_band_eur: 'mid',
    notes_el:
      'Τον χειμώνα πολλοί προσθέτουν κρέμα από πάνω και κρατούν το γαλάκτωμα για το καλοκαίρι.',
    notes_en: 'In winter many add a cream on top and keep the emulsion for summer.',
  },
  {
    slug: 'moisturizer-occlusive-balm',
    category: 'moisturizer',
    name_el: 'Κλειστικό βάλσαμο (slugging)',
    name_en: 'Occlusive balm (slugging)',
    description_el:
      'Λεπτή στρώση βαζελίνης ή πυκνού βάλσαμου ως τελευταίο βήμα το βράδυ, που περιορίζει την απώλεια νερού. Για ξηρές ή πληγωμένες από ενεργά επιδερμίδες, όχι για ακμή.',
    description_en:
      'A thin layer of petrolatum or a thick balm as the last evening step to cut water loss. For dry or active-stressed skin, not for acne-prone skin.',
    key_ingredients: ['petrolatum', 'lanolin', 'shea butter', 'squalane'],
    avoid_with: ['retinol underneath (traps it)', 'aha or bha underneath'],
    regions: ['us', 'kr', 'global'],
    audiences: ['all'],
    skin_types: ['dry', 'sensitive'],
    concerns: ['hydration', 'redness'],
    time: 'pm',
    price_band_eur: 'low',
    notes_el:
      'Πάνω από καθαρή, ενυδατωμένη επιδερμίδα· σε λιπαρή ή με σπυράκια συχνά φέρνει έξαρση.',
    notes_en:
      'Over clean, moisturised skin; on oily or blemish-prone skin it often triggers a flare.',
  },

  // --- sunscreens ---------------------------------------------------------------------------------
  {
    slug: 'sunscreen-mineral-zinc',
    category: 'sunscreen',
    name_el: 'Αντηλιακό με ορυκτά φίλτρα (οξείδιο ψευδαργύρου)',
    name_en: 'Mineral sunscreen (zinc oxide)',
    description_el:
      'Οξείδιο ψευδαργύρου ή/και διοξείδιο τιτανίου που αντανακλούν και απορροφούν την ακτινοβολία. Ανεκτό από ευαίσθητες επιδερμίδες και ροδόχρου ακμή· μπορεί να αφήνει λευκό ίχνος.',
    description_en:
      'Zinc oxide and/or titanium dioxide that reflect and absorb UV. Tolerated by sensitive and rosacea-prone skin; it may leave a white cast.',
    key_ingredients: ['zinc oxide', 'titanium dioxide', 'iron oxides'],
    avoid_with: [],
    regions: ['us', 'global'],
    audiences: ['all'],
    skin_types: ['sensitive', 'dry', 'normal'],
    concerns: ['sun', 'redness', 'pigmentation'],
    time: 'am',
    price_band_eur: 'mid',
    notes_el:
      'Στις ΗΠΑ τα αντηλιακά είναι φάρμακα OTC υπό τον FDA και μόνο τα ορυκτά φίλτρα αναγνωρίζονται ως GRASE. Τα οξείδια σιδήρου βοηθούν και με το ορατό φως (μέλασμα).',
    notes_en:
      'In the US sunscreens are OTC drugs under the FDA and only the mineral filters are recognised as GRASE. Iron oxides also help against visible light (melasma).',
  },
  {
    slug: 'sunscreen-eu-modern-filters',
    category: 'sunscreen',
    name_el: 'Αντηλιακό ευρείας προστασίας με νέα ευρωπαϊκά φίλτρα',
    name_en: 'Broad-spectrum sunscreen with modern EU filters',
    description_el:
      'Οργανικά φίλτρα νέας γενιάς (Tinosorb S/M, Mexoryl SX/XL, Uvinul A Plus) με ισχυρή κάλυψη UVA, φωτοσταθερά και χωρίς λευκό ίχνος. SPF 50+ με τον κύκλο UVA της ΕΕ στην ετικέτα.',
    description_en:
      'New-generation organic filters (Tinosorb S/M, Mexoryl SX/XL, Uvinul A Plus) with strong, photostable UVA cover and no white cast. SPF 50+ with the EU UVA circle on the label.',
    key_ingredients: [
      'bemotrizinol (tinosorb s)',
      'bisoctrizole (tinosorb m)',
      'ecamsule (mexoryl sx)',
      'diethylamino hydroxybenzoyl hexyl benzoate',
    ],
    avoid_with: [],
    regions: ['eu'],
    audiences: ['all'],
    skin_types: ['all'],
    concerns: ['sun', 'aging', 'pigmentation'],
    time: 'am',
    price_band_eur: 'mid',
    notes_el:
      'Ο κύκλος «UVA» της ΕΕ σημαίνει προστασία UVA τουλάχιστον το 1/3 του SPF. Τα περισσότερα από αυτά τα φίλτρα δεν έχουν ακόμη έγκριση FDA, γι’ αυτό λείπουν από τα αμερικανικά ράφια.',
    notes_en:
      'The EU “UVA” circle means UVA protection of at least one third of the SPF. Most of these filters still lack FDA approval, which is why US shelves do not carry them.',
  },
  {
    slug: 'sunscreen-kr-pa-plus',
    category: 'sunscreen',
    name_el: 'Κορεατικό αντηλιακό SPF50+ PA++++',
    name_en: 'Korean sunscreen SPF50+ PA++++',
    description_el:
      'Ελαφριές, ενυδατικές υφές (συχνά με centella ή υαλουρονικό) που νιώθουν σαν ενυδατική. Ο δείκτης PA δηλώνει την προστασία UVA· τέσσερα «+» είναι το μέγιστο.',
    description_en:
      'Light, hydrating textures (often with centella or hyaluronic acid) that feel like a moisturiser. The PA grade states UVA protection; four pluses is the maximum.',
    key_ingredients: [
      'ethylhexyl triazone',
      'bemotrizinol',
      'centella asiatica extract',
      'niacinamide',
    ],
    avoid_with: [],
    regions: ['kr'],
    audiences: ['all'],
    skin_types: ['all'],
    concerns: ['sun', 'hydration'],
    time: 'am',
    price_band_eur: 'low',
    notes_el:
      'Το PA++++ αντιστοιχεί σε PPD 16+. Βάζε αρκετή ποσότητα (περίπου δύο δάχτυλα για το πρόσωπο) — η ελαφριά υφή κάνει εύκολο να βάλεις πολύ λίγο.',
    notes_en:
      'PA++++ corresponds to PPD 16+. Use enough (about two finger-lengths for the face) — a light texture makes it easy to apply too little.',
  },
  {
    slug: 'sunscreen-jp-gel-watery',
    category: 'sunscreen',
    name_el: 'Ιαπωνικό υδαρές gel αντηλιακό',
    name_en: 'Japanese watery gel sunscreen',
    description_el:
      'Οι πιο ελαφριές υφές της αγοράς — σχεδόν νερό — με SPF50+ PA++++, συχνά ανθεκτικές σε ιδρώτα και νερό. Ιδανικές κάτω από μακιγιάζ ή σε άντρες που δεν θέλουν «να νιώθουν» το αντηλιακό.',
    description_en:
      'The lightest textures on the market — almost water — at SPF50+ PA++++, often sweat- and water-resistant. Ideal under make-up or for men who do not want to “feel” sunscreen.',
    key_ingredients: [
      'ethylhexyl methoxycinnamate',
      'bemotrizinol',
      'alcohol denat',
      'hyaluronic acid',
    ],
    avoid_with: [],
    regions: ['jp'],
    audiences: ['all'],
    skin_types: ['oily', 'combination', 'normal'],
    concerns: ['sun', 'pores'],
    time: 'am',
    price_band_eur: 'low',
    notes_el:
      'Πολλά περιέχουν οινόπνευμα για την αίσθηση δροσιάς· σε ξηρή ή ευαίσθητη επιδερμίδα μπορεί να τσούξει.',
    notes_en: 'Many contain alcohol for the cooling feel; on dry or sensitive skin it may sting.',
  },
  {
    slug: 'sunscreen-stick-reapply',
    category: 'sunscreen',
    name_el: 'Αντηλιακό stick για επανεφαρμογή',
    name_en: 'Sunscreen stick for reapplication',
    description_el:
      'Στερεό αντηλιακό για γρήγορη επανεφαρμογή πάνω από μακιγιάζ ή στην παραλία, χωρίς χέρια. Χρειάζονται πολλά περάσματα για να φτάσει την προστασία της ετικέτας.',
    description_en:
      'A solid sunscreen for quick, hands-free reapplication over make-up or at the beach. It takes several passes to reach the labelled protection.',
    key_ingredients: ['zinc oxide', 'homosalate', 'octocrylene', 'shea butter'],
    avoid_with: [],
    regions: ['us', 'kr', 'global'],
    audiences: ['all'],
    skin_types: ['all'],
    concerns: ['sun'],
    time: 'am',
    price_band_eur: 'mid',
    notes_el:
      'Συμπλήρωμα και όχι αντικατάσταση της πρωινής εφαρμογής: βοηθά στην επανεφαρμογή κάθε 2 ώρες στον ήλιο.',
    notes_en:
      'A supplement, not a replacement for the morning layer: it makes the two-hourly reapplication in the sun doable.',
  },

  // --- exfoliants ---------------------------------------------------------------------------------
  {
    slug: 'exfoliant-aha-glycolic-lactic',
    category: 'exfoliant',
    name_el: 'Χημική απολέπιση AHA (γλυκολικό / γαλακτικό)',
    name_en: 'AHA chemical exfoliant (glycolic / lactic)',
    description_el:
      'Υδατοδιαλυτά οξέα που χαλαρώνουν τους δεσμούς των νεκρών κυττάρων στην επιφάνεια: λάμψη, πιο λεία υφή, ομοιόμορφη απόχρωση. Το γαλακτικό είναι πιο ήπιο από το γλυκολικό.',
    description_en:
      'Water-soluble acids that loosen the bonds between dead surface cells: glow, smoother texture, more even tone. Lactic acid is gentler than glycolic.',
    key_ingredients: ['glycolic acid', 'lactic acid', 'mandelic acid'],
    avoid_with: [
      'retinol in the same session',
      'bha in the same session',
      'vitamin c in the same session',
    ],
    regions: ['us', 'eu', 'global'],
    audiences: ['all'],
    skin_types: ['normal', 'dry', 'combination'],
    concerns: ['texture', 'pigmentation', 'aging'],
    time: 'pm',
    price_band_eur: 'mid',
    notes_el:
      'Στην ΕΕ τα AHA σε καλλυντικά περιορίζονται σε περίπου 10 % και pH ≥ 3,5. Αυξάνουν τη φωτοευαισθησία — αντηλιακό το επόμενο πρωί είναι υποχρεωτικό.',
    notes_en:
      'In the EU cosmetic AHAs are limited to about 10 % at pH 3.5 or above. They increase photosensitivity — sunscreen the next morning is non-negotiable.',
  },
  {
    slug: 'exfoliant-bha-salicylic',
    category: 'exfoliant',
    name_el: 'Χημική απολέπιση BHA (σαλικυλικό οξύ)',
    name_en: 'BHA chemical exfoliant (salicylic acid)',
    description_el:
      'Λιποδιαλυτό οξύ που μπαίνει μέσα στον πόρο και διαλύει σμήγμα και νεκρά κύτταρα. Η κλασική επιλογή για μαύρα στίγματα, κλειστά κομεδόνια και λιπαρή ζώνη Τ.',
    description_en:
      'An oil-soluble acid that gets inside the pore and dissolves sebum and dead cells. The classic pick for blackheads, closed comedones and an oily T-zone.',
    key_ingredients: ['salicylic acid', 'betaine salicylate', 'willow bark extract'],
    avoid_with: ['retinol in the same session', 'aha in the same session'],
    regions: ['us', 'kr', 'global'],
    audiences: ['all'],
    skin_types: ['oily', 'combination'],
    concerns: ['acne', 'pores', 'texture'],
    time: 'pm',
    price_band_eur: 'mid',
    notes_el:
      'Στην Κορέα συχνά συναντάς «betaine salicylate», πιο ήπια μορφή. Όχι σε αλλεργία στην ασπιρίνη (σαλικυλικά).',
    notes_en:
      'In Korea you often see “betaine salicylate”, a gentler form. Not for people allergic to aspirin (salicylates).',
  },
  {
    slug: 'exfoliant-pha-gentle',
    category: 'exfoliant',
    name_el: 'Ήπια απολέπιση PHA (γλουκονολακτόνη)',
    name_en: 'Gentle PHA exfoliant (gluconolactone)',
    description_el:
      'Πολυυδροξυοξέα με μεγαλύτερο μόριο που δουλεύουν μόνο στην επιφάνεια και ενυδατώνουν ταυτόχρονα. Το σημείο εκκίνησης για ευαίσθητη επιδερμίδα ή ροδόχρου ακμή.',
    description_en:
      'Polyhydroxy acids with a larger molecule that work only at the surface and hydrate at the same time. The starting point for sensitive or rosacea-prone skin.',
    key_ingredients: ['gluconolactone', 'lactobionic acid', 'glycerin'],
    avoid_with: ['retinol in the same session'],
    regions: ['kr', 'eu'],
    audiences: ['all'],
    skin_types: ['sensitive', 'dry'],
    concerns: ['texture', 'redness', 'hydration'],
    time: 'pm',
    price_band_eur: 'mid',
    notes_el: 'Ακόμη και τα PHA απολεπίζουν: 1–2 φορές την εβδομάδα αρκούν, όχι κάθε βράδυ.',
    notes_en: 'Even PHAs exfoliate: once or twice a week is enough, not every night.',
  },
  {
    slug: 'exfoliant-enzyme-powder',
    category: 'exfoliant',
    name_el: 'Ενζυμική απολέπιση / σκόνη καθαρισμού',
    name_en: 'Enzyme exfoliant / cleansing powder',
    description_el:
      'Ιαπωνικού τύπου σκόνη με πρωτεολυτικά ένζυμα (παπαΐνη, βρωμελίνη, πρωτεάση) που ενεργοποιείται με νερό και «τρώει» τα νεκρά κύτταρα. Πολύ ήπια εναλλακτική των οξέων.',
    description_en:
      'A Japanese-style powder with proteolytic enzymes (papain, bromelain, protease) activated with water that digests dead cells. A very gentle alternative to acids.',
    key_ingredients: ['papain', 'bromelain', 'protease', 'rice bran'],
    avoid_with: [],
    regions: ['jp'],
    audiences: ['all'],
    skin_types: ['all'],
    concerns: ['texture', 'pores'],
    time: 'pm',
    price_band_eur: 'mid',
    notes_el: 'Ανακάτεψε με λίγο νερό στην παλάμη μέχρι να αφρίσει ελαφρά· 1–3 φορές την εβδομάδα.',
    notes_en:
      'Mix with a little water in your palm until it foams lightly; one to three times a week.',
  },

  // --- masks ----------------------------------------------------------------------------------------
  {
    slug: 'mask-sheet',
    category: 'mask',
    name_el: 'Υφασμάτινη μάσκα (sheet mask)',
    name_en: 'Sheet mask',
    description_el:
      'Το σήμα κατατεθέν της κορεατικής περιποίησης: χαρτί ή βιοκυτταρίνη εμποτισμένη με ορό, 15–20 λεπτά, κυρίως για ενυδάτωση και άμεση φρεσκάδα.',
    description_en:
      'The signature of Korean skincare: paper or bio-cellulose soaked in serum for 15–20 minutes, mainly for hydration and an instant refresh.',
    key_ingredients: ['hyaluronic acid', 'glycerin', 'centella asiatica extract', 'tea tree'],
    avoid_with: [],
    regions: ['kr'],
    audiences: ['all'],
    skin_types: ['all'],
    concerns: ['hydration', 'general'],
    time: 'pm',
    price_band_eur: 'low',
    notes_el:
      'Μην την αφήνεις να στεγνώσει πάνω σου — μετά «τραβά» νερό πίσω. Μετά, ενυδατική για να σφραγίσει.',
    notes_en:
      'Do not let it dry on your face — it then pulls water back out. Follow with moisturiser to seal.',
  },
  {
    slug: 'mask-clay',
    category: 'mask',
    name_el: 'Μάσκα αργίλου',
    name_en: 'Clay mask',
    description_el:
      'Καολίνης ή μπεντονίτης που απορροφούν σμήγμα και «τραβούν» από τους πόρους. Για λιπαρή ζώνη Τ, 1 φορά την εβδομάδα, 10 λεπτά — όχι μέχρι να σκάσει.',
    description_en:
      'Kaolin or bentonite that absorb sebum and draw from the pores. For an oily T-zone, once a week, ten minutes — not until it cracks.',
    key_ingredients: ['kaolin', 'bentonite', 'charcoal', 'zinc oxide'],
    avoid_with: ['aha or bha the same evening'],
    regions: ['us', 'eu', 'global'],
    audiences: ['all'],
    skin_types: ['oily', 'combination'],
    concerns: ['pores', 'acne'],
    time: 'pm',
    price_band_eur: 'low',
    notes_el:
      'Το «multi-masking» — άργιλος στη μύτη, ενυδατική μάσκα στα μάγουλα — ταιριάζει στη μικτή επιδερμίδα.',
    notes_en:
      'Multi-masking — clay on the nose, a hydrating mask on the cheeks — suits combination skin.',
  },
  {
    slug: 'mask-sleeping-overnight',
    category: 'mask',
    name_el: 'Μάσκα νύχτας (sleeping mask)',
    name_en: 'Sleeping (overnight) mask',
    description_el:
      'Κορεατικό τελευταίο βήμα της βραδινής ρουτίνας, μια πιο πυκνή κρέμα-gel που μένει όλη νύχτα και ξεπλένεται το πρωί. Ενυδάτωση και επισκευή χωρίς τη βαρύτητα του βάλσαμου.',
    description_en:
      'A Korean final evening step — a thicker cream-gel that stays on all night and rinses off in the morning. Hydration and repair without the heaviness of a balm.',
    key_ingredients: ['glycerin', 'ceramides', 'hyaluronic acid', 'squalane'],
    avoid_with: [],
    regions: ['kr'],
    audiences: ['all'],
    skin_types: ['dry', 'normal', 'combination'],
    concerns: ['hydration', 'aging'],
    time: 'pm',
    price_band_eur: 'mid',
    notes_el: 'Δύο-τρεις νύχτες την εβδομάδα στη θέση της κρέμας, όχι επιπλέον.',
    notes_en: 'Two or three nights a week instead of your cream, not on top of it.',
  },

  // --- eye ------------------------------------------------------------------------------------------
  {
    slug: 'eye-cream-caffeine',
    category: 'eye',
    name_el: 'Κρέμα ματιών με καφεΐνη',
    name_en: 'Caffeine eye cream',
    description_el:
      'Ελαφριά κρέμα ή gel για πρήξιμο και κούραση κάτω από τα μάτια· η καφεΐνη συσφίγγει προσωρινά τα αγγεία. Τα κληρονομικά σκούρα κύκλοι δεν αλλάζουν με κρέμα.',
    description_en:
      'A light cream or gel for puffiness and tired under-eyes; caffeine constricts vessels for a while. Hereditary dark circles do not change with a cream.',
    key_ingredients: ['caffeine', 'hyaluronic acid', 'peptides', 'niacinamide'],
    avoid_with: [],
    regions: ['global', 'kr'],
    audiences: ['all'],
    skin_types: ['all'],
    concerns: ['aging', 'hydration'],
    time: 'both',
    price_band_eur: 'mid',
    notes_el:
      'Μια απλή ενυδατική χωρίς άρωμα κάνει σχεδόν την ίδια δουλειά· η κρέμα ματιών είναι επιλογή άνεσης, όχι ανάγκη.',
    notes_en:
      'A plain fragrance-free moisturiser does nearly the same job; an eye cream is a comfort choice, not a need.',
  },
  {
    slug: 'eye-cream-retinal',
    category: 'eye',
    name_el: 'Κρέμα ματιών με ρετινάλη',
    name_en: 'Retinal eye cream',
    description_el:
      'Χαμηλή συγκέντρωση ρετιναλδεΰδης ή ρετινόλης σε πλούσια βάση, για λεπτές γραμμές στο λεπτό δέρμα των ματιών. Το βράδυ, 2–3 φορές την εβδομάδα στην αρχή.',
    description_en:
      'A low concentration of retinaldehyde or retinol in a rich base, for fine lines on the thin eye-area skin. Evenings, two or three times a week at first.',
    key_ingredients: ['retinaldehyde', 'retinol', 'ceramides', 'peptides'],
    avoid_with: ['aha or bha around the eyes', 'pregnancy and breastfeeding'],
    regions: ['eu', 'us'],
    audiences: ['all'],
    skin_types: ['normal', 'dry', 'combination'],
    concerns: ['aging'],
    time: 'pm',
    price_band_eur: 'high',
    notes_el: 'Μέχρι το οστό της κόγχης, όχι στο βλέφαρο· αν ξεφλουδίσει, κάνε παύση.',
    notes_en: 'Up to the orbital bone, never on the lid; if it peels, pause.',
  },

  // --- treatments -----------------------------------------------------------------------------------
  {
    slug: 'treatment-benzoyl-peroxide-spot',
    category: 'treatment',
    name_el: 'Τοπική θεραπεία με υπεροξείδιο του βενζοϋλίου',
    name_en: 'Benzoyl peroxide spot treatment',
    description_el:
      'Αντιβακτηριακό gel 2,5–5 % για φλεγμονώδη σπυράκια, κλασικό της αμερικανικής αγοράς χωρίς συνταγή. Στην Ελλάδα και στην ΕΕ διατίθεται ως φάρμακο από το φαρμακείο.',
    description_en:
      'An antibacterial 2.5–5 % gel for inflamed spots, a US drugstore classic. In Greece and the EU it is sold as a medicine through pharmacies.',
    key_ingredients: ['benzoyl peroxide'],
    avoid_with: [
      'retinol in the same session',
      'vitamin c in the same session',
      'bha in the same session',
    ],
    regions: ['us'],
    audiences: ['all'],
    skin_types: ['oily', 'combination'],
    concerns: ['acne'],
    time: 'pm',
    price_band_eur: 'low',
    notes_el:
      'Ξεβάφει πετσέτες και μαξιλαροθήκες. Το 2,5 % δουλεύει σχεδόν όσο το 10 % με λιγότερο ερεθισμό. Επίμονη ακμή: δερματολόγος.',
    notes_en:
      'It bleaches towels and pillowcases. 2.5 % works almost as well as 10 % with less irritation. Persistent acne: see a dermatologist.',
  },
  {
    slug: 'treatment-adapalene-otc',
    category: 'treatment',
    name_el: 'Αδαπαλένη 0,1 % (ρετινοειδές)',
    name_en: 'Adapalene 0.1 % (retinoid)',
    description_el:
      'Ρετινοειδές τρίτης γενιάς που στις ΗΠΑ πωλείται χωρίς συνταγή από το 2016 για την ακμή· λιγότερο ερεθιστικό από την τρετινοΐνη. Στην ΕΕ χορηγείται με ιατρική συνταγή.',
    description_en:
      'A third-generation retinoid sold over the counter in the US since 2016 for acne; less irritating than tretinoin. In the EU it is prescription-only.',
    key_ingredients: ['adapalene'],
    avoid_with: [
      'aha in the same session',
      'bha in the same session',
      'benzoyl peroxide (unless a combined product)',
      'pregnancy and breastfeeding',
    ],
    regions: ['us'],
    audiences: ['all'],
    skin_types: ['oily', 'combination', 'normal'],
    concerns: ['acne', 'texture'],
    time: 'pm',
    price_band_eur: 'low',
    notes_el:
      'Είναι φάρμακο, όχι καλλυντικό: στην Ελλάδα το γράφει ο δερματολόγος. Οι πρώτες 4–6 εβδομάδες μπορεί να φέρουν έξαρση πριν τη βελτίωση.',
    notes_en:
      'It is a medicine, not a cosmetic: in Greece a dermatologist prescribes it. The first four to six weeks can bring a flare before improvement.',
  },
  {
    slug: 'treatment-hydrocolloid-patch',
    category: 'treatment',
    name_el: 'Αυτοκόλλητο υδροκολλοειδές για σπυράκια',
    name_en: 'Hydrocolloid pimple patch',
    description_el:
      'Μικρό διάφανο επίθεμα από τη χειρουργική επιδεσμολογία που απορροφά υγρό από ανοιχτά σπυράκια, προστατεύει από το ξύσιμο και επιταχύνει την επούλωση. Κορεατική επινόηση που έγινε παγκόσμια.',
    description_en:
      'A small clear dressing borrowed from wound care that absorbs fluid from open spots, stops picking and speeds healing. A Korean idea that went global.',
    key_ingredients: ['hydrocolloid', 'salicylic acid (some)', 'tea tree (some)'],
    avoid_with: [],
    regions: ['kr', 'global'],
    audiences: ['all'],
    skin_types: ['all'],
    concerns: ['acne'],
    time: 'pm',
    price_band_eur: 'low',
    notes_el:
      'Δουλεύει σε σπυράκι με «κεφάλι», όχι σε βαθιές κύστεις. Σε καθαρό, στεγνό δέρμα, 6–8 ώρες.',
    notes_en:
      'Works on a spot with a head, not on deep cysts. On clean, dry skin for six to eight hours.',
  },

  // --- shaving and beard ----------------------------------------------------------------------------
  {
    slug: 'shaving-pre-shave-oil',
    category: 'shaving',
    name_el: 'Έλαιο πριν το ξύρισμα',
    name_en: 'Pre-shave oil',
    description_el:
      'Λίγες σταγόνες ελαφριού ελαίου πριν τον αφρό μαλακώνουν την τρίχα και αφήνουν το ξυράφι να γλιστρά. Βοηθά σε σκληρή γενειάδα και ευαίσθητο λαιμό.',
    description_en:
      'A few drops of a light oil before the lather soften the hair and let the razor glide. Helpful for coarse stubble and a sensitive neck.',
    key_ingredients: ['castor oil', 'jojoba oil', 'sunflower seed oil', 'vitamin e'],
    avoid_with: [],
    regions: ['global', 'eu'],
    audiences: ['men'],
    skin_types: ['all'],
    concerns: ['shaving', 'redness'],
    time: 'am',
    price_band_eur: 'mid',
    notes_el: 'Ξύρισμα μετά το ντους, όταν η τρίχα είναι ήδη μαλακή από το ζεστό νερό.',
    notes_en: 'Shave after the shower, when the hair is already softened by warm water.',
  },
  {
    slug: 'shaving-cream-brush',
    category: 'shaving',
    name_el: 'Κρέμα ξυρίσματος (με πινέλο)',
    name_en: 'Shaving cream (brush lather)',
    description_el:
      'Παραδοσιακή κρέμα που αφρίζει με πινέλο: σηκώνει την τρίχα, κρατά υγρασία και προστατεύει το δέρμα καλύτερα από τον αφρό σε σπρέι. Για ξύρισμα με ξυράφι πολλαπλών ή μονής λεπίδας.',
    description_en:
      'A traditional cream lathered with a brush: it lifts the hair, holds moisture and protects the skin better than aerosol foam. For multi-blade or single-blade razors.',
    key_ingredients: ['glycerin', 'stearic acid', 'coconut acid', 'aloe vera'],
    avoid_with: [],
    regions: ['eu', 'global'],
    audiences: ['men'],
    skin_types: ['all'],
    concerns: ['shaving', 'redness'],
    time: 'am',
    price_band_eur: 'low',
    notes_el: 'Προτίμησε εκδοχές χωρίς άρωμα και μενθόλη αν κοκκινίζεις εύκολα.',
    notes_en: 'Pick fragrance- and menthol-free versions if you redden easily.',
  },
  {
    slug: 'shaving-aftershave-balm',
    category: 'shaving',
    name_el: 'Βάλσαμο μετά το ξύρισμα (χωρίς οινόπνευμα)',
    name_en: 'Alcohol-free aftershave balm',
    description_el:
      'Καταπραϋντική κρέμα-γαλάκτωμα για μετά το ξύρισμα, που ενυδατώνει και ηρεμεί αντί να «καίει» όπως οι παλιές κολόνιες με οινόπνευμα. Το βασικό βήμα κατά του ερεθισμού και των τριχών που μεγαλώνουν προς τα μέσα.',
    description_en:
      'A soothing post-shave cream-lotion that hydrates and calms instead of “burning” like the old alcohol splashes. The key step against razor burn and ingrown hairs.',
    key_ingredients: ['allantoin', 'panthenol', 'aloe vera', 'niacinamide', 'bisabolol'],
    avoid_with: [],
    regions: ['global', 'eu'],
    audiences: ['men'],
    skin_types: ['all'],
    concerns: ['shaving', 'redness', 'hydration'],
    time: 'am',
    price_band_eur: 'low',
    notes_el:
      'Το ξύρισμα είναι από μόνο του απολέπιση· άφησε τα οξέα για άλλο βράδυ, όχι την ίδια μέρα.',
    notes_en:
      'Shaving is itself an exfoliation; leave acids for another evening, not the same day.',
  },
  {
    slug: 'beard-oil',
    category: 'beard',
    name_el: 'Έλαιο γενειάδας',
    name_en: 'Beard oil',
    description_el:
      'Ελαφριά έλαια που μαλακώνουν την τρίχα και ενυδατώνουν το δέρμα κάτω από τη γενειάδα, μειώνοντας φαγούρα και «πιτυρίδα γενειάδας». Λίγες σταγόνες σε στεγνή ή ελαφρώς νωπή γενειάδα.',
    description_en:
      'Light oils that soften the hair and moisturise the skin under the beard, cutting itch and “beardruff”. A few drops on a dry or slightly damp beard.',
    key_ingredients: ['jojoba oil', 'argan oil', 'grapeseed oil', 'vitamin e'],
    avoid_with: [],
    regions: ['global', 'us'],
    audiences: ['men'],
    skin_types: ['all'],
    concerns: ['beard', 'hydration'],
    time: 'both',
    price_band_eur: 'mid',
    notes_el:
      'Αν η φαγούρα επιμένει ή έχει ξεφλούδισμα και κοκκινίλα, μπορεί να είναι σμηγματορροϊκή δερματίτιδα — ρώτα δερματολόγο.',
    notes_en:
      'If the itch persists with flaking and redness, it may be seborrhoeic dermatitis — ask a dermatologist.',
  },
  {
    slug: 'beard-wash',
    category: 'beard',
    name_el: 'Σαμπουάν γενειάδας',
    name_en: 'Beard wash',
    description_el:
      'Ήπιο καθαριστικό για την τρίχα και το δέρμα της γενειάδας, πιο μαλακό από σαμπουάν μαλλιών και πιο αποτελεσματικό από καθαριστικό προσώπου στην τρίχα. 2–3 φορές την εβδομάδα.',
    description_en:
      'A mild cleanser for beard hair and the skin beneath, softer than hair shampoo and better than a face cleanser at cleaning hair. Two or three times a week.',
    key_ingredients: ['coco-glucoside', 'glycerin', 'aloe vera', 'tea tree'],
    avoid_with: [],
    regions: ['global'],
    audiences: ['men'],
    skin_types: ['all'],
    concerns: ['beard'],
    time: 'pm',
    price_band_eur: 'low',
    notes_el: 'Καθημερινό πλύσιμο με σαμπουάν μαλλιών ξηραίνει τη γενειάδα και το δέρμα από κάτω.',
    notes_en: 'Daily washing with hair shampoo dries the beard and the skin under it.',
  },
  {
    slug: 'beard-balm',
    category: 'beard',
    name_el: 'Βάλσαμο γενειάδας',
    name_en: 'Beard balm',
    description_el:
      'Έλαια σε βάση βουτύρου και κεριού που ενυδατώνουν και ταυτόχρονα δίνουν ελαφρύ κράτημα και σχήμα στη γενειάδα. Για μεσαίες και μεγάλες γενειάδες.',
    description_en:
      'Oils in a butter-and-wax base that moisturise while giving the beard light hold and shape. For medium and long beards.',
    key_ingredients: ['shea butter', 'beeswax', 'jojoba oil', 'argan oil'],
    avoid_with: [],
    regions: ['global', 'us'],
    audiences: ['men'],
    skin_types: ['all'],
    concerns: ['beard'],
    time: 'am',
    price_band_eur: 'mid',
    notes_el: 'Ζέστανε μια μικρή ποσότητα στις παλάμες μέχρι να λιώσει πριν την περάσεις.',
    notes_en: 'Warm a small amount between your palms until it melts before working it through.',
  },

  // --- lip ------------------------------------------------------------------------------------------
  {
    slug: 'lip-balm-spf',
    category: 'lip',
    name_el: 'Βάλσαμο χειλιών με SPF',
    name_en: 'Lip balm with SPF',
    description_el:
      'Τα χείλη δεν έχουν μελανίνη και καίγονται εύκολα· ένα βάλσαμο με SPF 30 και κλειστικά συστατικά τα προστατεύει και τα κρατά μαλακά. Επανεφαρμογή συχνά — τρώγεται και πίνεται.',
    description_en:
      'Lips have no melanin and burn easily; an SPF 30 balm with occlusives protects them and keeps them soft. Reapply often — it gets eaten and drunk off.',
    key_ingredients: ['petrolatum', 'beeswax', 'zinc oxide', 'shea butter'],
    avoid_with: [],
    regions: ['global'],
    audiences: ['all'],
    skin_types: ['all'],
    concerns: ['sun', 'hydration'],
    time: 'both',
    price_band_eur: 'low',
    notes_el: 'Απόφυγε βάλσαμα με μενθόλη, καμφορά ή άρωμα αν τα χείλη σκάνε συχνά.',
    notes_en: 'Skip balms with menthol, camphor or fragrance if your lips chap often.',
  },
  {
    slug: 'lip-sleeping-mask',
    category: 'lip',
    name_el: 'Μάσκα χειλιών νύχτας',
    name_en: 'Lip sleeping mask',
    description_el:
      'Πυκνό κορεατικό βάλσαμο που μένει όλη νύχτα και επανορθώνει σκασμένα χείλη, συχνά με ήπια απολεπιστικά σάκχαρα. Το πρωί σκουπίζεις τα νεκρά κύτταρα με πετσέτα.',
    description_en:
      'A thick Korean balm left on all night to repair chapped lips, often with mild exfoliating sugars. In the morning the loosened flakes wipe off with a towel.',
    key_ingredients: ['shea butter', 'murumuru butter', 'vitamin c', 'hyaluronic acid'],
    avoid_with: [],
    regions: ['kr'],
    audiences: ['all'],
    skin_types: ['all'],
    concerns: ['hydration'],
    time: 'pm',
    price_band_eur: 'mid',
    notes_el: 'Ένα απλό στρώμα βαζελίνης το βράδυ κάνει σχεδόν το ίδιο για ένα κλάσμα της τιμής.',
    notes_en:
      'A plain layer of petrolatum at night does nearly the same for a fraction of the price.',
  },

  // --- nails and hands (operator addition 2026-10-06: "and nails") ---------------------------------
  {
    slug: 'cuticle-oil-jojoba',
    category: 'cuticle_oil',
    name_el: 'Λάδι επωνυχίων',
    name_en: 'Cuticle oil',
    description_el:
      'Ελαφριά έλαια (jojoba, αμυγδάλου, βιταμίνη Ε) που μαλακώνουν τα επωνύχια και ενυδατώνουν την πλάκα του νυχιού, ώστε να λυγίζει αντί να σπάει. Μία-δύο φορές τη μέρα, με μασάζ στη βάση του νυχιού.',
    description_en:
      'Light oils (jojoba, almond, vitamin E) that soften the cuticles and hydrate the nail plate so it bends instead of snapping. Once or twice a day, massaged into the nail base.',
    key_ingredients: ['jojoba oil', 'sweet almond oil', 'vitamin e', 'squalane'],
    avoid_with: [],
    regions: ['global'],
    audiences: ['all'],
    skin_types: ['all'],
    concerns: ['nails', 'hands'],
    time: 'both',
    price_band_eur: 'low',
    notes_el:
      'Το πιο αποτελεσματικό βήμα για εύθραυστα νύχια είναι η σταθερή ενυδάτωση, όχι τα «ενισχυτικά» με φορμαλδεΰδη.',
    notes_en:
      'The most effective step for brittle nails is consistent moisture, not formaldehyde “hardeners”.',
  },
  {
    slug: 'nail-treatment-strengthener-keratin',
    category: 'nail_treatment',
    name_el: 'Ενισχυτική θεραπεία νυχιών (κερατίνη / πεπτίδια)',
    name_en: 'Nail strengthener (keratin / peptides)',
    description_el:
      'Διάφανο βερνίκι-θεραπεία με υδρολυμένη κερατίνη, πανθενόλη ή πεπτίδια που «γεμίζει» τις ρωγμές της πλάκας και μειώνει το σκίσιμο στις άκρες. Για κύκλο 4–6 εβδομάδων, κατά προτίμηση χωρίς φορμαλδεΰδη.',
    description_en:
      'A clear treatment polish with hydrolysed keratin, panthenol or peptides that fills micro-cracks in the plate and reduces peeling at the tips. For a four-to-six-week course, preferably formaldehyde-free.',
    key_ingredients: ['hydrolysed keratin', 'panthenol', 'calcium pantothenate', 'peptides'],
    avoid_with: ['formaldehyde hardeners for more than a few weeks'],
    regions: ['global', 'eu'],
    audiences: ['all'],
    skin_types: ['all'],
    concerns: ['nails'],
    time: 'pm',
    price_band_eur: 'mid',
    notes_el:
      'Οι «σκληρυντές» με φορμαλδεΰδη κάνουν το νύχι πιο σκληρό αλλά και πιο εύθρυπτο με τον καιρό· στην ΕΕ η φορμαλδεΰδη σε βερνίκια περιορίζεται αυστηρά.',
    notes_en:
      'Formaldehyde hardeners make the nail harder but more brittle over time; in the EU formaldehyde in nail products is tightly restricted.',
  },
  {
    slug: 'base-coat-breathable',
    category: 'base_coat',
    name_el: 'Προστατευτική βάση (base coat) που «αναπνέει»',
    name_en: 'Breathable base coat',
    description_el:
      'Διάφανη βάση που μπαίνει πριν το χρώμα: προστατεύει την πλάκα από χρωστικές, κάνει το βερνίκι να κρατά και μειώνει το κιτρίνισμα. Οι εκδοχές «water-permeable» αφήνουν λίγο νερό και οξυγόνο να περνούν.',
    description_en:
      'A clear base applied before colour: it shields the plate from pigments, helps polish last and reduces yellowing. “Water-permeable” versions let a little water and oxygen through.',
    key_ingredients: ['nitrocellulose', 'adipic acid copolymer', 'panthenol'],
    avoid_with: [],
    regions: ['global', 'us'],
    audiences: ['women', 'all'],
    skin_types: ['all'],
    concerns: ['nails'],
    time: 'pm',
    price_band_eur: 'low',
    notes_el:
      'Οι όροι «5-free», «10-free» κ.λπ. δηλώνουν ποια αμφιλεγόμενα συστατικά λείπουν (τολουόλιο, φθαλικά, φορμαλδεΰδη)· είναι εμπορικές ετικέτες, όχι επίσημος κανόνας.',
    notes_en:
      'Labels such as “5-free” or “10-free” list which controversial ingredients are left out (toluene, phthalates, formaldehyde); they are marketing terms, not an official standard.',
  },
  {
    slug: 'nail-file-glass',
    category: 'nail_file',
    name_el: 'Γυάλινη (κρυστάλλινη) λίμα',
    name_en: 'Glass (crystal) nail file',
    description_el:
      'Λίμα από σκληρυμένο γυαλί με πολύ λεπτή επιφάνεια που «σφραγίζει» την άκρη του νυχιού αντί να το ξεφτίζει όπως οι χάρτινες λίμες. Πλένεται και κρατά χρόνια.',
    description_en:
      'A tempered-glass file with a very fine surface that seals the nail edge instead of fraying it like emery boards do. Washable and lasts for years.',
    key_ingredients: ['tempered glass'],
    avoid_with: ['sawing back and forth'],
    regions: ['global', 'eu'],
    audiences: ['all'],
    skin_types: ['all'],
    concerns: ['nails'],
    time: 'pm',
    price_band_eur: 'low',
    notes_el:
      'Λιμάρισμα προς μία κατεύθυνση, σε στεγνό νύχι· το βρεγμένο νύχι σκίζεται ευκολότερα.',
    notes_en: 'File in one direction on a dry nail; a wet nail tears more easily.',
  },
  {
    slug: 'nail-file-buffer-block',
    category: 'nail_file',
    name_el: 'Μπλοκ γυαλίσματος (buffer)',
    name_en: 'Buffer block',
    description_el:
      'Τετράπλευρο σφουγγάρι με διαβαθμίσεις που λειαίνει τις ραβδώσεις και δίνει φυσική γυαλάδα χωρίς βερνίκι — η πιο «αντρική» εκδοχή του μανικιούρ. Ελαφρά, όχι πάνω από 1–2 φορές τον μήνα.',
    description_en:
      'A four-sided sponge of graded grits that smooths ridges and gives a natural shine without polish — the most “masculine” version of a manicure. Lightly, no more than once or twice a month.',
    key_ingredients: ['foam block', 'graded abrasive'],
    avoid_with: ['buffing weekly (thins the plate)'],
    regions: ['global'],
    audiences: ['men', 'all'],
    skin_types: ['all'],
    concerns: ['nails'],
    time: 'pm',
    price_band_eur: 'low',
    notes_el:
      'Το συχνό γυάλισμα λεπταίνει την πλάκα· αν τα νύχια γίνουν μαλακά, σταμάτα για έναν μήνα.',
    notes_en: 'Frequent buffing thins the plate; if your nails go soft, stop for a month.',
  },
  {
    slug: 'hand-cream-urea',
    category: 'hand_cream',
    name_el: 'Κρέμα χεριών με ουρία',
    name_en: 'Hand cream with urea',
    description_el:
      'Κρέμα χεριών με ουρία 5–10 %, γλυκερίνη και κλειστικά, που ενυδατώνει βαθιά και μαλακώνει σκληρύνσεις και σκασμένα δάχτυλα. Μετά από κάθε πλύσιμο και πριν τον ύπνο, μέχρι τα επωνύχια.',
    description_en:
      'A hand cream with 5–10 % urea, glycerin and occlusives that hydrates deeply and softens calluses and cracked fingertips. After every wash and before bed, right up to the cuticles.',
    key_ingredients: ['urea', 'glycerin', 'shea butter', 'ceramides', 'dimethicone'],
    avoid_with: [],
    regions: ['eu', 'global'],
    audiences: ['all'],
    skin_types: ['dry', 'all'],
    concerns: ['hands', 'nails', 'hydration'],
    time: 'both',
    price_band_eur: 'low',
    notes_el:
      'Οι ευρωπαϊκές φαρμακευτικές σειρές με ουρία είναι εδώ από τις πιο δοκιμασμένες· πάνω από 10 % η ουρία κερατολύει και προορίζεται για πέλματα.',
    notes_en:
      'European pharmacy lines with urea are among the best-proven here; above 10 % urea is keratolytic and meant for feet.',
  },
  {
    slug: 'nail-remover-acetone-free',
    category: 'nail_remover',
    name_el: 'Ασετόν-free αφαιρετικό βερνικιού',
    name_en: 'Acetone-free nail polish remover',
    description_el:
      'Αφαιρετικό με οξικό αιθυλεστέρα ή ανθρακικό προπυλένιο και ελαφρά έλαια, πιο ήπιο για πλάκα και επωνύχια από την καθαρή ασετόν. Αργεί λίγο περισσότερο και δεν αφαιρεί gel.',
    description_en:
      'A remover with ethyl acetate or propylene carbonate and light oils, gentler on the plate and cuticles than pure acetone. It takes a little longer and does not remove gel.',
    key_ingredients: ['ethyl acetate', 'propylene carbonate', 'glycerin', 'sweet almond oil'],
    avoid_with: [],
    regions: ['global', 'eu'],
    audiences: ['women', 'all'],
    skin_types: ['all'],
    concerns: ['nails'],
    time: 'pm',
    price_band_eur: 'low',
    notes_el:
      'Για gel ή ακρυλικό χρειάζεται ασετόν — αλλά με λάδι επωνυχίων πριν και κρέμα μετά, και όχι ξύσιμο.',
    notes_en:
      'Gel or acrylic needs acetone — but with cuticle oil before and hand cream after, and never scraping.',
  },
]
