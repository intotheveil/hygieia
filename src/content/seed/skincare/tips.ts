// SKINCARE SEED — TIPS (P7.1, PLAN.md §P7 `skincare_tips`). Bilingual (EL/EN) skin- and nail-care
// tips filterable by `area` (face | nails), `audiences`, `skin_types`, `concerns` and `regions`.
// Men: shaving, beard, razor burn, post-gym. Women: make-up removal, double cleansing, hormonal
// acne, pregnancy-safe actives. Everyone: daily SPF, retinol ramp-up, patch testing, barrier
// repair, Mediterranean sun, Greek summer humidity, winter heating dryness, when to see a
// dermatologist. Nails (operator addition 2026-10-06): filing, cuticles, biting, hangnails, brittle
// nails vs diet myths, gel/acrylic breaks, acetone, gloves, fungal signs, men's short clean nails,
// salon ventilation.
//
// Content drafting rule (PLAN.md §0): mainstream guidance (WHO, NHS, CDC, FDA, NIH / MedlinePlus,
// Mayo Clinic, American Academy of Dermatology, EU law) — not medical advice; anything persistent
// or alarming says "see a dermatologist / doctor". `sources` holds ONLY pages the drafter has
// actually seen and believes stable; otherwise it is empty and `needs_source` is true
// ("Source pending review" in the UI). `needs_source === (sources.length === 0)` on every row —
// skincare.test.ts enforces it with a domain allow-list. A fabricated URL is the one unacceptable
// outcome here. Slugs are `<area>-…`.
//
// Plain data on purpose: scripts/gen-seed-sql.mjs imports it under node's type stripping.

import type { SkincareTipSeed } from '../../types.ts'

const NHS_SUN = 'https://www.nhs.uk/live-well/seasonal-health/sunscreen-and-sun-safety/'
const FDA_SUNSCREEN =
  'https://www.fda.gov/drugs/understanding-over-counter-medicines/sunscreen-how-help-protect-your-skin-sun'
const AAD_SUNSCREEN_FAQ =
  'https://www.aad.org/public/everyday-care/sun-protection/sunscreen-patients/sunscreen-faqs'
const AAD_DRY_SKIN =
  'https://www.aad.org/public/everyday-care/skin-care-basics/dry/dermatologists-tips-relieve-dry-skin'
const AAD_ACNE_TIPS = 'https://www.aad.org/public/diseases/acne/skin-care/tips'
const AAD_NAIL_TIPS =
  'https://www.aad.org/public/everyday-care/nail-care-secrets/basics/healthy-nail-tips'
const MAYO_NAILS =
  'https://www.mayoclinic.org/healthy-lifestyle/adult-health/in-depth/nails/art-20044954'
const NHS_ACNE = 'https://www.nhs.uk/conditions/acne/'
const WHO_SUN = 'https://www.who.int/news-room/questions-and-answers/item/radiation-sun-protection'

export const SKINCARE_TIPS: readonly SkincareTipSeed[] = [
  // --- men · shaving, beard, post-gym ---------------------------------------------------------------
  {
    slug: 'face-men-shave-after-shower-with-the-grain',
    area: 'face',
    title_el: 'Ξύρισμα μετά το ντους, με τη φορά της τρίχας',
    title_en: 'Shave after the shower, with the grain',
    body_el:
      'Το ζεστό νερό μαλακώνει την τρίχα και ανοίγει το δρόμο στη λεπίδα, γι’ αυτό το ξύρισμα μετά το ντους ερεθίζει λιγότερο. Πέρνα το ξυράφι με τη φορά που φυτρώνει η τρίχα, χωρίς να πιέζεις. Το αντίθετο ξύρισμα δίνει πιο «καθαρό» αποτέλεσμα για λίγες ώρες, αλλά πληρώνεται με κοκκινίλα και τρίχες που μεγαλώνουν προς τα μέσα.',
    body_en:
      'Warm water softens the hair and clears the way for the blade, which is why shaving after the shower irritates less. Pass the razor in the direction the hair grows, without pressing. Shaving against the grain gives a “closer” result for a few hours, paid for with redness and ingrown hairs.',
    audiences: ['men'],
    skin_types: ['all'],
    concerns: ['shaving', 'redness'],
    regions: ['global'],
    sources: [],
    needs_source: true,
  },
  {
    slug: 'face-men-change-the-blade-often',
    area: 'face',
    title_el: 'Άλλαζε λεπίδα πριν αρχίσει να «τραβάει»',
    title_en: 'Change the blade before it starts to drag',
    body_el:
      'Μια στομωμένη λεπίδα δεν κόβει την τρίχα, την τραβά — και μαζί της ξύνει το δέρμα. Πέντε ως οκτώ ξυρίσματα είναι το όριο για τις περισσότερες λεπίδες, λιγότερα αν η γενειάδα είναι σκληρή. Ξέπλενε το ξυράφι καλά και άφησέ το να στεγνώσει έξω από την ντουζιέρα, για να μη σκουριάσει και μαζέψει βακτήρια.',
    body_en:
      'A dull blade does not cut the hair, it pulls it — and scrapes the skin along the way. Five to eight shaves is the limit for most blades, fewer with coarse stubble. Rinse the razor well and let it dry outside the shower so it does not rust or collect bacteria.',
    audiences: ['men'],
    skin_types: ['all'],
    concerns: ['shaving', 'redness'],
    regions: ['global'],
    sources: [],
    needs_source: true,
  },
  {
    slug: 'face-men-razor-burn-cold-rinse-and-balm',
    area: 'face',
    title_el: 'Κάψιμο από το ξύρισμα: κρύο νερό και βάλσαμο, όχι κολόνια',
    title_en: 'Razor burn: cold water and a balm, not a splash',
    body_el:
      'Το κάψιμο μετά το ξύρισμα είναι ερεθισμός του φραγμού, όχι «μικρόβια», οπότε το οινόπνευμα των παλιών κολονιών το χειροτερεύει. Ξέπλυνε με κρύο νερό, ταμπόναρε και βάλε ένα βάλσαμο χωρίς οινόπνευμα με αλλαντοΐνη ή πανθενόλη. Αν κοκκινίζεις κάθε φορά, δοκίμασε ξύρισμα κάθε δεύτερη μέρα για δύο εβδομάδες.',
    body_en:
      'Razor burn is barrier irritation, not “germs”, so the alcohol in old-style splashes makes it worse. Rinse with cold water, pat dry and apply an alcohol-free balm with allantoin or panthenol. If you redden every time, try shaving every other day for two weeks.',
    audiences: ['men'],
    skin_types: ['sensitive', 'all'],
    concerns: ['shaving', 'redness'],
    regions: ['global'],
    sources: [],
    needs_source: true,
  },
  {
    slug: 'face-men-ingrown-hairs-do-not-pluck',
    area: 'face',
    title_el: 'Τρίχες που μεγαλώνουν προς τα μέσα: μην τις ξεριζώνεις',
    title_en: 'Ingrown hairs: do not pluck them out',
    body_el:
      'Οι τρίχες που γυρίζουν μέσα στο δέρμα βγάζουν σπυράκια που μοιάζουν με ακμή, συχνά στον λαιμό. Το ξερίζωμα και το ζούληγμα αφήνουν σημάδια και μπορεί να μολύνουν· άφησε την περιοχή αξύριστη για λίγες μέρες, κάνε ζεστές κομπρέσες και χρησιμοποίησε ήπιο απολεπιστικό με σαλικυλικό οξύ. Αν γίνονται συχνά, μια ηλεκτρική ξυριστική που δεν κόβει τόσο κοντά βοηθά περισσότερο από οποιαδήποτε κρέμα.',
    body_en:
      'Hairs that curl back into the skin raise acne-like bumps, often on the neck. Plucking and squeezing leave marks and can infect; leave the area unshaved for a few days, use warm compresses and a gentle salicylic acid exfoliant. If they keep coming back, an electric shaver that does not cut as close helps more than any cream.',
    audiences: ['men'],
    skin_types: ['all'],
    concerns: ['shaving', 'acne'],
    regions: ['global'],
    sources: ['https://www.nhs.uk/conditions/ingrown-hairs/'],
    needs_source: false,
  },
  {
    slug: 'face-men-wash-the-beard-not-every-day',
    area: 'face',
    title_el: 'Πλύνε τη γενειάδα δύο-τρεις φορές την εβδομάδα, όχι κάθε μέρα',
    title_en: 'Wash the beard two or three times a week, not daily',
    body_el:
      'Η τρίχα της γενειάδας είναι πιο σκληρή από τα μαλλιά και το δέρμα από κάτω ξηραίνεται εύκολα. Καθημερινό πλύσιμο με σαμπουάν μαλλιών αφαιρεί τα λιπίδια και φέρνει φαγούρα και ξεφλούδισμα. Ένα ήπιο καθαριστικό γενειάδας δύο-τρεις φορές την εβδομάδα και ξέβγαλμα με νερό τις υπόλοιπες μέρες είναι αρκετά για τους περισσότερους.',
    body_en:
      'Beard hair is coarser than scalp hair and the skin beneath dries out easily. Daily washing with hair shampoo strips the lipids and brings itch and flaking. A mild beard wash two or three times a week and a water rinse on the other days is enough for most men.',
    audiences: ['men'],
    skin_types: ['all'],
    concerns: ['beard', 'hydration'],
    regions: ['global'],
    sources: [],
    needs_source: true,
  },
  {
    slug: 'face-men-beard-oil-is-for-the-skin-underneath',
    area: 'face',
    title_el: 'Το λάδι γενειάδας είναι για το δέρμα, όχι μόνο για την τρίχα',
    title_en: 'Beard oil is for the skin, not just the hair',
    body_el:
      'Η φαγούρα των πρώτων εβδομάδων μιας γενειάδας έρχεται από το δέρμα που δεν φτάνει να ενυδατωθεί κάτω από την τρίχα. Λίγες σταγόνες ελαφριού ελαίου, δουλεμένες με τα δάχτυλα μέχρι το δέρμα, μαλακώνουν και την τρίχα και τον ερεθισμό. Σε ελαφρώς νωπή γενειάδα απλώνεται ευκολότερα και χρειάζεται λιγότερο.',
    body_en:
      'The itch of a beard’s first weeks comes from skin that no longer gets moisturised under the hair. A few drops of a light oil, worked down to the skin with your fingers, soften both the hair and the irritation. On a slightly damp beard it spreads more easily and you need less.',
    audiences: ['men'],
    skin_types: ['all'],
    concerns: ['beard', 'hydration'],
    regions: ['global'],
    sources: [],
    needs_source: true,
  },
  {
    slug: 'face-men-beardruff-may-be-seborrhoeic-dermatitis',
    area: 'face',
    title_el: '«Πιτυρίδα» στη γενειάδα που επιμένει: ρώτα δερματολόγο',
    title_en: 'Persistent “beardruff”: ask a dermatologist',
    body_el:
      'Λίγο ξεφλούδισμα διορθώνεται με ενυδάτωση, αλλά κίτρινες λιπαρές φολίδες με κοκκινίλα στη γενειάδα, τα φρύδια ή δίπλα στη μύτη είναι συχνά σμηγματορροϊκή δερματίτιδα. Δεν φεύγει με λάδια· χρειάζεται αντιμυκητιασικό σαμπουάν ή κρέμα που θα προτείνει γιατρός. Είναι συνηθισμένη, δεν είναι θέμα καθαριότητας και ελέγχεται εύκολα όταν διαγνωστεί.',
    body_en:
      'A little flaking is fixed by moisturising, but greasy yellow flakes with redness in the beard, eyebrows or beside the nose are often seborrhoeic dermatitis. Oils will not clear it; it needs an antifungal shampoo or cream a doctor can suggest. It is common, not a hygiene issue, and easy to control once diagnosed.',
    audiences: ['men'],
    skin_types: ['all'],
    concerns: ['beard', 'redness'],
    regions: ['global'],
    sources: [
      'https://www.mayoclinic.org/diseases-conditions/seborrheic-dermatitis/symptoms-causes/syc-20352710',
    ],
    needs_source: false,
  },
  {
    slug: 'face-men-rinse-after-the-gym',
    area: 'face',

    title_el: 'Μετά το γυμναστήριο: ξέπλυμα μέσα σε μισή ώρα',
    title_en: 'After the gym: rinse within half an hour',
    body_el:
      'Ιδρώτας, σμήγμα και η τριβή από πετσέτες ή κράνη φράζουν πόρους και φέρνουν σπυράκια στο μέτωπο, την πλάτη και τη γραμμή των μαλλιών. Ξέπλυνε το πρόσωπο με νερό ή ένα ήπιο καθαριστικό μέσα σε 20–30 λεπτά από την προπόνηση και άλλαξε την ιδρωμένη μπλούζα. Μη σκουπίζεις το πρόσωπο με την πετσέτα του γυμναστηρίου — ταμπόναρε με καθαρή.',
    body_en:
      'Sweat, sebum and friction from towels or helmets clog pores and raise spots on the forehead, back and hairline. Rinse your face with water or a gentle cleanser within 20–30 minutes of training and change the sweaty shirt. Do not wipe your face with the gym towel — pat with a clean one.',
    audiences: ['men', 'all'],
    skin_types: ['oily', 'combination', 'all'],
    concerns: ['acne', 'general'],
    regions: ['global'],
    sources: [],
    needs_source: true,
  },
  {
    slug: 'face-men-sunscreen-is-not-a-womens-product',
    area: 'face',
    title_el: 'Το αντηλιακό δεν είναι «γυναικείο προϊόν»',
    title_en: 'Sunscreen is not a “women’s product”',
    body_el:
      'Οι άντρες στην Ελλάδα περνούν περισσότερες ώρες στον ήλιο για δουλειά και άθληση και χρησιμοποιούν αντηλιακό πολύ λιγότερο, γι’ αυτό και οι καρκίνοι του δέρματος εμφανίζονται συχνότερα σε αυτούς. Ένα ελαφρύ gel αντηλιακό δεν γυαλίζει, δεν μυρίζει και μπαίνει σε 30 δευτερόλεπτα το πρωί. Αυτιά, μύτη, σβέρκος και το κεφάλι αν αραιώνουν τα μαλλιά — αυτά καίγονται πρώτα.',
    body_en:
      'Men spend more hours in the sun for work and sport and use sunscreen far less, which is one reason skin cancers show up more often in men. A light gel sunscreen does not shine or smell and goes on in 30 seconds in the morning. Ears, nose, neck and the scalp if the hair is thinning — those burn first.',
    audiences: ['men'],
    skin_types: ['all'],
    concerns: ['sun'],
    regions: ['global'],
    sources: ['https://www.cdc.gov/skin-cancer/sun-safety/index.html'],
    needs_source: false,
  },

  // --- women · make-up, double cleansing, hormonal acne, pregnancy -----------------------------------
  {
    slug: 'face-women-remove-makeup-every-night',
    area: 'face',
    title_el: 'Το μακιγιάζ φεύγει κάθε βράδυ, όσο κουρασμένη κι αν είσαι',
    title_en: 'Make-up comes off every night, however tired you are',
    body_el:
      'Μια νύχτα με μακιγιάζ σημαίνει οκτώ ώρες με χρωστικές, σμήγμα και ρύπους πάνω στους πόρους. Κράτα ένα μικυλλιακό νερό ή μαντιλάκια δίπλα στο κρεβάτι για τις «δεν αντέχω» βραδιές — είναι καλύτερα από το τίποτα. Η μάσκαρα που μένει ξεραίνει τις βλεφαρίδες και τις σπάει.',
    body_en:
      'A night in make-up means eight hours of pigments, sebum and dirt on your pores. Keep micellar water or wipes by the bed for the “I can’t” nights — better than nothing. Mascara left on dries the lashes and snaps them.',
    audiences: ['women'],
    skin_types: ['all'],
    concerns: ['acne', 'general'],
    regions: ['global'],
    sources: [],
    needs_source: true,
  },
  {
    slug: 'face-women-double-cleanse-only-when-needed',
    area: 'face',
    title_el: 'Διπλός καθαρισμός μόνο όταν χρειάζεται',
    title_en: 'Double cleanse only when it is needed',
    body_el:
      'Ο διπλός καθαρισμός —έλαιο ή βάλσαμο και μετά καθαριστικό με νερό— έχει νόημα το βράδυ, όταν φοράς αντηλιακό ανθεκτικό στο νερό ή μακιγιάζ. Το πρωί ή τις μέρες στο σπίτι ένας καθαρισμός αρκεί· ο διπλός κάθε φορά ξηραίνει. Το λάδι μασάρεται σε στεγνό πρόσωπο και γαλακτωματοποιείται με λίγο νερό πριν ξεπλυθεί.',
    body_en:
      'Double cleansing — an oil or balm, then a water-based cleanser — makes sense in the evening, when you wear water-resistant sunscreen or make-up. In the morning or on days at home one cleanse is enough; doubling every time dries you out. Massage the oil onto a dry face and emulsify with a little water before rinsing.',
    audiences: ['women', 'all'],
    skin_types: ['all'],
    concerns: ['general', 'hydration'],
    regions: ['kr', 'jp', 'global'],
    sources: [],
    needs_source: true,
  },
  {
    slug: 'face-women-hormonal-acne-on-the-jawline',
    area: 'face',
    title_el: 'Σπυράκια στο σαγόνι πριν την περίοδο: ορμονικό μοτίβο',
    title_en: 'Spots on the jawline before your period: a hormonal pattern',
    body_el:
      'Βαθιά, επώδυνα σπυράκια στο κάτω μέρος του προσώπου που εμφανίζονται λίγες μέρες πριν την περίοδο ακολουθούν τις ορμονικές διακυμάνσεις, όχι την καθαριότητα. Ένα ήπιο ρετινοειδές ή αζελαϊκό οξύ σε συνεχή χρήση βοηθά περισσότερο από τοπικές «θεραπείες» την ώρα της έξαρσης. Αν επαναλαμβάνεται κάθε μήνα ή αφήνει σημάδια, ο δερματολόγος έχει επιλογές που δεν υπάρχουν στο ράφι.',
    body_en:
      'Deep, painful spots on the lower face that appear a few days before your period track hormonal swings, not cleanliness. A mild retinoid or azelaic acid used consistently helps more than spot “treatments” at flare time. If it repeats monthly or leaves marks, a dermatologist has options that are not on the shelf.',
    audiences: ['women'],
    skin_types: ['oily', 'combination', 'all'],
    concerns: ['acne'],
    regions: ['global'],
    sources: ['https://www.nhs.uk/conditions/acne/causes/'],
    needs_source: false,
  },
  {
    slug: 'face-women-pregnancy-skip-retinoids',
    area: 'face',
    title_el: 'Εγκυμοσύνη και θηλασμός: κανένα ρετινοειδές',
    title_en: 'Pregnancy and breastfeeding: no retinoids',
    body_el:
      'Ρετινόλη, ρετινάλη, αδαπαλένη, τρετινοΐνη και ισοτρετινοΐνη αποφεύγονται από τη στιγμή που προσπαθείς για εγκυμοσύνη και όσο θηλάζεις. Το ίδιο ισχύει για υψηλές συγκεντρώσεις σαλικυλικού οξέος σε μεγάλη έκταση και για την υδροκινόνη. Αν ακολουθείς αγωγή για ακμή, ενημέρωσε τον γιατρό σου πριν συλλάβεις.',
    body_en:
      'Retinol, retinal, adapalene, tretinoin and isotretinoin are avoided from the moment you try to conceive and for as long as you breastfeed. The same goes for high-strength salicylic acid over large areas and for hydroquinone. If you are on acne treatment, tell your doctor before conceiving.',
    audiences: ['women'],
    skin_types: ['all'],
    concerns: ['acne', 'aging'],
    regions: ['global'],
    sources: ['https://www.nhs.uk/conditions/acne/treatment/'],
    needs_source: false,
  },
  {
    slug: 'face-women-pregnancy-safe-actives',
    area: 'face',
    title_el: 'Τι μένει στη ρουτίνα της εγκυμοσύνης',
    title_en: 'What stays in a pregnancy routine',
    body_el:
      'Αζελαϊκό οξύ, νιασιναμίδη, υαλουρονικό, γλυκολικό και γαλακτικό οξύ σε χαμηλή συγκέντρωση και αντηλιακό με ορυκτά φίλτρα θεωρούνται γενικά κατάλληλα. Το μέλασμα της εγκυμοσύνης («μάσκα») αντιμετωπίζεται πρώτα με σκιά, καπέλο και tinted αντηλιακό. Κάθε αλλαγή στην αγωγή συζητείται με τον γυναικολόγο ή τον δερματολόγο — όχι με το φόρουμ.',
    body_en:
      'Azelaic acid, niacinamide, hyaluronic acid, low-strength glycolic and lactic acid and a mineral-filter sunscreen are generally considered suitable. The “mask of pregnancy” (melasma) is handled first with shade, a hat and a tinted sunscreen. Any change in treatment is discussed with your obstetrician or dermatologist — not the forum.',
    audiences: ['women'],
    skin_types: ['all'],
    concerns: ['acne', 'pigmentation', 'sun'],
    regions: ['global'],
    sources: [],
    needs_source: true,
  },
  {
    slug: 'face-women-melasma-needs-tinted-sunscreen',
    area: 'face',
    title_el: 'Μέλασμα: το αντηλιακό θέλει και οξείδια σιδήρου',
    title_en: 'Melasma: your sunscreen needs iron oxides too',
    body_el:
      'Οι καφέ κηλίδες στα μάγουλα και το μέτωπο σκουραίνουν όχι μόνο από την υπεριώδη αλλά και από το ορατό φως — αυτό που περνά από τα τζάμια. Τα συνηθισμένα φίλτρα δεν το κόβουν· τα αντηλιακά με χρώμα (οξείδια σιδήρου) το κόβουν. SPF 50 κάθε μέρα, όλο τον χρόνο, αλλιώς κάθε θεραπεία λεύκανσης πάει χαμένη.',
    body_en:
      'The brown patches on cheeks and forehead darken not only from UV but also from visible light — the kind that comes through windows. Ordinary filters do not block it; tinted sunscreens with iron oxides do. SPF 50 every day, all year, or every brightening treatment is wasted.',
    audiences: ['women', 'all'],
    skin_types: ['all'],
    concerns: ['pigmentation', 'sun'],
    regions: ['global'],
    sources: [],
    needs_source: true,
  },
  {
    slug: 'face-women-clean-brushes-and-sponges',
    area: 'face',
    title_el: 'Πινέλα και σφουγγαράκια: πλύσιμο κάθε εβδομάδα',
    title_en: 'Brushes and sponges: wash them weekly',
    body_el:
      'Ένα σφουγγαράκι μακιγιάζ που μένει υγρό μέσα στη νεσεσέρ είναι ιδανικός χώρος για βακτήρια και μύκητες, που μετά πάνε κατευθείαν στα μάγουλα. Πλύνε πινέλα και σφουγγάρια με σαπούνι ή ήπιο σαμπουάν μία φορά την εβδομάδα και άφησέ τα να στεγνώσουν οριζόντια. Σφουγγαράκι που μυρίζει ή ξεφτίζει πετιέται.',
    body_en:
      'A make-up sponge left damp in a bag is a perfect home for bacteria and fungi, which then go straight onto your cheeks. Wash brushes and sponges with soap or a mild shampoo once a week and let them dry flat. A sponge that smells or crumbles gets thrown away.',
    audiences: ['women'],
    skin_types: ['all'],
    concerns: ['acne', 'general'],
    regions: ['global'],
    sources: [],
    needs_source: true,
  },
  {
    slug: 'face-women-makeup-with-spf-is-not-enough',
    area: 'face',
    title_el: 'Το make-up με SPF δεν αντικαθιστά το αντηλιακό',
    title_en: 'Make-up with SPF does not replace sunscreen',
    body_el:
      'Για να πάρεις το SPF που γράφει η συσκευασία χρειάζεσαι περίπου 2 mg ανά τετραγωνικό εκατοστό — για το πρόσωπο, ποσότητα όσο δύο δάχτυλα. Κανείς δεν βάζει τόσο foundation. Βάλε κανονικό αντηλιακό από κάτω και θεώρησε το SPF του μακιγιάζ απλώς ένα μπόνους.',
    body_en:
      'To get the SPF on the label you need about 2 mg per square centimetre — for the face, roughly two finger-lengths. Nobody applies that much foundation. Put a proper sunscreen on underneath and treat the SPF in your make-up as a bonus only.',
    audiences: ['women'],
    skin_types: ['all'],
    concerns: ['sun'],
    regions: ['global'],
    sources: [AAD_SUNSCREEN_FAQ],
    needs_source: false,
  },
  {
    slug: 'face-women-menopause-skin-gets-drier',
    area: 'face',
    title_el: 'Μετά την εμμηνόπαυση το δέρμα θέλει περισσότερα λιπίδια',
    title_en: 'After menopause the skin wants more lipids',
    body_el:
      'Η πτώση των οιστρογόνων μειώνει το κολλαγόνο και το σμήγμα, κι έτσι μια επιδερμίδα που ήταν μικτή γίνεται ξαφνικά ξηρή και πιο λεπτή. Άλλαξε το gel σε κρέμα με κεραμίδια, πρόσθεσε ένα ήπιο ρετινοειδές αν δεν το έχεις ήδη και μην κόψεις το αντηλιακό. Έντονη ξηρότητα, φαγούρα ή εξανθήματα αξίζουν μια επίσκεψη στον δερματολόγο.',
    body_en:
      'Falling oestrogen reduces collagen and sebum, so skin that used to be combination suddenly turns dry and thinner. Swap the gel for a ceramide cream, add a mild retinoid if you do not already use one and keep the sunscreen. Marked dryness, itching or rashes deserve a visit to a dermatologist.',
    audiences: ['women'],
    skin_types: ['dry', 'all'],
    concerns: ['hydration', 'aging'],
    regions: ['global'],
    sources: [],
    needs_source: true,
  },
  {
    slug: 'face-women-neck-chest-and-hands-count-too',
    area: 'face',
    title_el: 'Λαιμός, ντεκολτέ και χέρια: ό,τι βάζεις στο πρόσωπο, βάλε κι εκεί',
    title_en: 'Neck, chest and hands: whatever goes on the face goes there too',
    body_el:
      'Το δέρμα του λαιμού και των χεριών είναι πιο λεπτό και παίρνει τον ίδιο ήλιο με το πρόσωπο, αλλά σπάνια το ίδιο αντηλιακό. Κατέβασε την κρέμα και το αντηλιακό μέχρι το ντεκολτέ και ξανάβαλε στα χέρια μετά από κάθε πλύσιμο. Οι κηλίδες στα χέρια είναι σχεδόν πάντα ήλιος, όχι ηλικία.',
    body_en:
      'The skin of the neck and hands is thinner and gets the same sun as the face, but rarely the same sunscreen. Take your cream and sunscreen down to the chest and reapply on the hands after every wash. Spots on the hands are almost always sun, not age.',
    audiences: ['women', 'all'],
    skin_types: ['all'],
    concerns: ['aging', 'sun', 'hands'],
    regions: ['global'],
    sources: [],
    needs_source: true,
  },

  // --- everyone · sun ----------------------------------------------------------------------------------
  {
    slug: 'face-all-sunscreen-every-day-clouds-included',
    area: 'face',
    title_el: 'Αντηλιακό κάθε μέρα — και με συννεφιά',
    title_en: 'Sunscreen every day — clouds included',
    body_el:
      'Έως και το 80 % της υπεριώδους ακτινοβολίας περνά μέσα από τα σύννεφα, και η UVA, που γερνά το δέρμα, περνά και από τα τζάμια του αυτοκινήτου και του γραφείου. Το αντηλιακό είναι το μόνο «αντιγηραντικό» με αδιαμφισβήτητα στοιχεία. Κάνε το το τελευταίο βήμα της πρωινής ρουτίνας, όπως το βούρτσισμα των δοντιών.',
    body_en:
      'Up to 80 % of UV radiation passes through clouds, and UVA — the ageing kind — comes through car and office windows too. Sunscreen is the only “anti-ageing” product with undisputed evidence. Make it the last step of your morning routine, like brushing your teeth.',
    audiences: ['all'],
    skin_types: ['all'],
    concerns: ['sun', 'aging'],
    regions: ['global'],
    sources: [WHO_SUN],
    needs_source: false,
  },
  {
    slug: 'face-all-sunscreen-amount-two-finger-lengths',
    area: 'face',
    title_el: 'Ποσότητα αντηλιακού: δύο δάχτυλα για το πρόσωπο',
    title_en: 'Sunscreen amount: two finger-lengths for the face',
    body_el:
      'Οι περισσότεροι βάζουν το ένα τέταρτο ως το μισό της ποσότητας με την οποία μετρήθηκε ο δείκτης, οπότε το SPF 50 γίνεται στην πράξη 10–15. Για πρόσωπο και λαιμό χρειάζεσαι γραμμή αντηλιακού σε μήκος δύο δαχτύλων, ή περίπου μισό κουταλάκι του γλυκού. Για όλο το σώμα στην παραλία, περίπου έξι-οκτώ κουταλάκια.',
    body_en:
      'Most people apply a quarter to half of the amount the SPF was tested with, so SPF 50 becomes 10–15 in practice. For face and neck you need a line of sunscreen two finger-lengths long, or about half a teaspoon. For the whole body at the beach, roughly six to eight teaspoons.',
    audiences: ['all'],
    skin_types: ['all'],
    concerns: ['sun'],
    regions: ['global'],
    sources: [NHS_SUN],
    needs_source: false,
  },
  {
    slug: 'face-all-reapply-every-two-hours-outdoors',
    area: 'face',
    title_el: 'Στον ήλιο, ξανά αντηλιακό κάθε δύο ώρες',
    title_en: 'In the sun, reapply every two hours',
    body_el:
      'Κανένα αντηλιακό δεν κρατά όλη μέρα: ο ιδρώτας, το νερό, το σκούπισμα με την πετσέτα και το ίδιο το φως το καταναλώνουν. Έξω ξαναβάζεις κάθε δύο ώρες και αμέσως μετά το κολύμπι, ακόμη και με ετικέτα «water resistant». Στο γραφείο η πρωινή στρώση αρκεί — εκτός αν κάθεσαι δίπλα σε ηλιόλουστο παράθυρο.',
    body_en:
      'No sunscreen lasts all day: sweat, water, towelling off and the light itself use it up. Outdoors you reapply every two hours and straight after swimming, even with a “water resistant” label. In the office the morning layer is enough — unless you sit beside a sunny window.',
    audiences: ['all'],
    skin_types: ['all'],
    concerns: ['sun'],
    regions: ['global'],
    sources: [FDA_SUNSCREEN],
    needs_source: false,
  },
  {
    slug: 'face-all-read-the-uva-circle-and-pa-grade',
    area: 'face',
    title_el: 'Διάβασε τον κύκλο UVA και τον δείκτη PA',
    title_en: 'Read the UVA circle and the PA grade',
    body_el:
      'Το SPF μετρά μόνο την προστασία από το κάψιμο (UVB). Στην ΕΕ ο κύκλος με τα γράμματα «UVA» σημαίνει προστασία UVA τουλάχιστον το ένα τρίτο του SPF· στην Κορέα και την Ιαπωνία το ίδιο λέει ο δείκτης PA, με PA++++ το μέγιστο. Στις ΗΠΑ ψάξε τη λέξη «broad spectrum». Αντηλιακό χωρίς καμία από αυτές τις ενδείξεις προστατεύει μόνο από το κάψιμο, όχι από τη γήρανση και τις κηλίδες.',
    body_en:
      'SPF measures only protection from burning (UVB). In the EU the circle with the letters “UVA” means UVA protection of at least one third of the SPF; in Korea and Japan the PA grade says the same, with PA++++ the maximum. In the US look for “broad spectrum”. A sunscreen with none of these marks protects against burning only, not ageing and spots.',
    audiences: ['all'],
    skin_types: ['all'],
    concerns: ['sun', 'aging', 'pigmentation'],
    regions: ['eu', 'kr', 'jp', 'us'],
    sources: ['https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32006H0647'],
    needs_source: false,
  },
  {
    slug: 'face-all-mediterranean-sun-is-strong-from-april',
    area: 'face',
    title_el: 'Ο μεσογειακός ήλιος είναι δυνατός από τον Απρίλιο ως τον Οκτώβριο',
    title_en: 'The Mediterranean sun is strong from April to October',
    body_el:
      'Στην Ελλάδα ο δείκτης UV ξεπερνά το 3 —το όριο πάνω από το οποίο χρειάζεται προστασία— σχεδόν κάθε μέρα από την άνοιξη ως το φθινόπωρο, και το καλοκαίρι φτάνει 9–11. Το κάψιμο τον Μάιο είναι τόσο συνηθισμένο γιατί το δέρμα βγαίνει από τον χειμώνα χωρίς μαύρισμα. Κοίτα τον δείκτη UV στην εφαρμογή καιρού όπως κοιτάς τη θερμοκρασία.',
    body_en:
      'In Greece the UV index exceeds 3 — the threshold above which protection is needed — almost daily from spring to autumn, and reaches 9–11 in summer. May sunburns are so common because the skin comes out of winter with no tan. Check the UV index in your weather app the way you check the temperature.',
    audiences: ['all'],
    skin_types: ['all'],
    concerns: ['sun'],
    regions: ['eu', 'global'],
    sources: [WHO_SUN],
    needs_source: false,
  },
  {
    slug: 'face-all-shade-and-hat-between-eleven-and-four',
    area: 'face',
    title_el: 'Σκιά και καπέλο ανάμεσα στις 11 και τις 4',
    title_en: 'Shade and a hat between eleven and four',
    body_el:
      'Το αντηλιακό είναι το τελευταίο μέτρο, όχι το πρώτο: τις ώρες που η σκιά σου είναι πιο κοντή από εσένα, η σκιά, ένα καπέλο με γείσο και γυαλιά ηλίου κόβουν περισσότερη ακτινοβολία από οποιαδήποτε κρέμα. Η ελληνική παράδοση του μεσημεριανού ύπνου έχει και δερματολογική λογική. Η άμμος και η θάλασσα αντανακλούν, οπότε η ομπρέλα στην παραλία δεν αρκεί από μόνη της.',
    body_en:
      'Sunscreen is the last line of defence, not the first: in the hours when your shadow is shorter than you, shade, a brimmed hat and sunglasses cut more radiation than any cream. The Greek tradition of the midday rest has a dermatological logic too. Sand and sea reflect, so the beach umbrella alone is not enough.',
    audiences: ['all'],
    skin_types: ['all'],
    concerns: ['sun'],
    regions: ['eu', 'global'],
    sources: [NHS_SUN],
    needs_source: false,
  },
  {
    slug: 'face-all-us-sunscreen-is-an-otc-drug',
    area: 'face',
    title_el: 'Γιατί τα αμερικανικά αντηλιακά διαφέρουν από τα ευρωπαϊκά',
    title_en: 'Why US sunscreens differ from European ones',
    body_el:
      'Στις ΗΠΑ το αντηλιακό ρυθμίζεται ως φάρμακο χωρίς συνταγή από τον FDA, και τα νεότερα φίλτρα της Ευρώπης και της Ασίας (Tinosorb, Mexoryl, Uvinul A Plus) δεν έχουν εγκριθεί εκεί. Γι’ αυτό τα αμερικανικά συχνά βασίζονται σε ορυκτά φίλτρα ή σε παλαιότερα οργανικά και έχουν λιγότερο κομψές υφές. Στην Ελλάδα έχεις πρόσβαση και στις δύο αγορές — εκμεταλλεύσου τα ευρωπαϊκά φίλτρα.',
    body_en:
      'In the US sunscreen is regulated as an over-the-counter drug by the FDA, and the newer filters of Europe and Asia (Tinosorb, Mexoryl, Uvinul A Plus) are not approved there. That is why US sunscreens often rely on mineral or older organic filters and have less elegant textures. In Greece you have access to both markets — make use of the European filters.',
    audiences: ['all'],
    skin_types: ['all'],
    concerns: ['sun'],
    regions: ['us', 'eu'],
    sources: [FDA_SUNSCREEN],
    needs_source: false,
  },
  {
    slug: 'face-all-japanese-gel-sunscreens-may-sting',
    area: 'face',
    title_el: 'Τα ιαπωνικά υδαρή αντηλιακά: υπέροχη υφή, συχνά με οινόπνευμα',
    title_en: 'Japanese watery sunscreens: lovely texture, often with alcohol',
    body_el:
      'Οι σχεδόν υδάτινες υφές από την Ιαπωνία είναι ιδανικές για λιπαρή επιδερμίδα και για όσους μισούν την αίσθηση του αντηλιακού. Η δροσιά όμως συχνά έρχεται από οινόπνευμα, που σε ξηρή ή ευαίσθητη επιδερμίδα τσούζει και ξηραίνει. Αν τσούζει, γύρνα σε κορεατική υφή με centella ή σε ευρωπαϊκή ενυδατική εκδοχή.',
    body_en:
      'The near-watery textures from Japan are ideal for oily skin and for anyone who hates the feel of sunscreen. The cooling sensation, though, often comes from alcohol, which stings and dries on dry or sensitive skin. If it stings, switch to a Korean texture with centella or a European moisturising version.',
    audiences: ['all'],
    skin_types: ['dry', 'sensitive'],
    concerns: ['sun', 'redness'],
    regions: ['jp', 'kr', 'eu'],
    sources: [],
    needs_source: true,
  },
  {
    slug: 'face-all-check-sunscreen-expiry-and-storage',
    area: 'face',
    title_el: 'Το περσινό αντηλιακό από το αυτοκίνητο δεν μετράει',
    title_en: 'Last year’s sunscreen from the car does not count',
    body_el:
      'Τα φίλτρα διασπώνται με τη ζέστη: ένα μπουκάλι που πέρασε το καλοκαίρι στο ντουλαπάκι του αυτοκινήτου ή στην άμμο έχει πιθανότατα χάσει μέρος της προστασίας του. Κοίτα την ημερομηνία λήξης ή το σύμβολο «ανοιχτού βάζου» (π.χ. 12M) και πέταξε ό,τι έχει αλλάξει μυρωδιά ή υφή. Ένα αντηλιακό που χρησιμοποιείται σωστά τελειώνει μέσα σε μία σεζόν ούτως ή άλλως.',
    body_en:
      'Filters break down in heat: a bottle that spent the summer in the glove box or on the sand has probably lost part of its protection. Check the expiry date or the open-jar symbol (e.g. 12M) and bin anything whose smell or texture has changed. A sunscreen used properly runs out within a season anyway.',
    audiences: ['all'],
    skin_types: ['all'],
    concerns: ['sun'],
    regions: ['global'],
    sources: [
      'https://www.mayoclinic.org/healthy-lifestyle/adult-health/in-depth/best-sunscreen/art-20045110',
    ],
    needs_source: false,
  },
  {
    slug: 'face-all-check-your-moles-abcde',
    area: 'face',
    title_el: 'Κοίτα τις ελιές σου μία φορά τον μήνα: το ABCDE',
    title_en: 'Check your moles once a month: the ABCDE rule',
    body_el:
      'Ασυμμετρία, ακανόνιστα όρια, πολλά χρώματα, διάμετρος πάνω από 6 χιλιοστά και κάθε αλλαγή σε μέγεθος, σχήμα ή αίσθηση είναι τα σημάδια που θέλουν άμεση εξέταση. Ο μεσογειακός ήλιος μαζί με τα ανοιχτόχρωμα δέρματα κάνει τον έλεγχο απαραίτητο, όχι πολυτέλεια. Μια ετήσια χαρτογράφηση στον δερματολόγο είναι η καλύτερη πρόληψη για όποιον έχει πολλές ελιές ή οικογενειακό ιστορικό.',
    body_en:
      'Asymmetry, irregular borders, several colours, a diameter over 6 mm and any change in size, shape or sensation are the signs that need prompt examination. The Mediterranean sun combined with fair skin makes checking a necessity, not a luxury. A yearly mole map at the dermatologist is the best prevention for anyone with many moles or a family history.',
    audiences: ['all'],
    skin_types: ['all'],
    concerns: ['sun', 'general'],
    regions: ['global'],
    sources: ['https://www.nhs.uk/conditions/melanoma-skin-cancer/symptoms/'],
    needs_source: false,
  },

  // --- everyone · actives: retinol, acids, vitamin C, patch testing ----------------------------------
  {
    slug: 'face-all-retinol-start-slow-twice-a-week',
    area: 'face',
    title_el: 'Ρετινόλη: ξεκίνα δύο βράδια την εβδομάδα',
    title_en: 'Retinol: start two nights a week',
    body_el:
      'Οι πρώτες εβδομάδες με ρετινόλη φέρνουν ξηρότητα και ξεφλούδισμα σε σχεδόν όλους — όχι επειδή «δουλεύει», αλλά επειδή το δέρμα προσαρμόζεται. Ξεκίνα με χαμηλή συγκέντρωση δύο βράδια την εβδομάδα και πρόσθεσε ένα βράδυ κάθε δύο εβδομάδες αν δεν ερεθίζεται. Ο στόχος είναι η συνέπεια επί μήνες, όχι η ένταση σε μία εβδομάδα.',
    body_en:
      'The first weeks on retinol bring dryness and flaking for almost everyone — not because it is “working” but because the skin is adapting. Start with a low strength two nights a week and add a night every two weeks if there is no irritation. The goal is consistency over months, not intensity in one week.',
    audiences: ['all'],
    skin_types: ['all'],
    concerns: ['aging', 'texture', 'acne'],
    regions: ['global'],
    sources: [],
    needs_source: true,
  },
  {
    slug: 'face-all-retinol-pea-on-dry-skin-sandwich',
    area: 'face',
    title_el: 'Ένα μπιζέλι ρετινόλη, σε στεγνό δέρμα, ανάμεσα σε δύο στρώσεις ενυδατικής',
    title_en: 'A pea of retinol, on dry skin, between two layers of moisturiser',
    body_el:
      'Περισσότερη ρετινόλη δεν σημαίνει καλύτερο αποτέλεσμα — σημαίνει περισσότερο ερεθισμό. Μια ποσότητα όσο ένα μπιζέλι αρκεί για όλο το πρόσωπο, πάνω σε εντελώς στεγνό δέρμα, μακριά από τα βλέφαρα και τις γωνίες της μύτης. Αν ξηραίνεσαι εύκολα, βάλε ενυδατική πριν και μετά — το «σάντουιτς» μειώνει τον ερεθισμό χωρίς να ακυρώνει τη δράση.',
    body_en:
      'More retinol does not mean better results — it means more irritation. A pea-sized amount covers the whole face, applied to fully dry skin, away from the eyelids and the corners of the nose. If you dry out easily, moisturise before and after — the “sandwich” cuts irritation without cancelling the effect.',
    audiences: ['all'],
    skin_types: ['dry', 'sensitive', 'all'],
    concerns: ['aging', 'hydration'],
    regions: ['global'],
    sources: [],
    needs_source: true,
  },
  {
    slug: 'face-all-one-active-per-evening',
    area: 'face',
    title_el: 'Ένα «ενεργό» κάθε βράδυ, όχι τρία',
    title_en: 'One active per evening, not three',
    body_el:
      'Ρετινόλη, οξέα AHA/BHA, βιταμίνη C και υπεροξείδιο του βενζοϋλίου δουλεύουν όλα — αλλά όχι στην ίδια στρώση την ίδια βραδιά. Ο συνδυασμός τους ερεθίζει και συχνά αλληλοεξουδετερώνεται. Μοίρασέ τα: οξέα Δευτέρα-Τετάρτη-Παρασκευή, ρετινόλη Τρίτη-Πέμπτη-Σάββατο, βιταμίνη C το πρωί και μια βραδιά την εβδομάδα μόνο ενυδάτωση.',
    body_en:
      'Retinol, AHA/BHA acids, vitamin C and benzoyl peroxide all work — but not in the same layer on the same night. Combining them irritates and often cancels out. Spread them: acids Monday-Wednesday-Friday, retinol Tuesday-Thursday-Saturday, vitamin C in the morning and one evening a week of moisturiser only.',
    audiences: ['all'],
    skin_types: ['all'],
    concerns: ['texture', 'acne', 'aging'],
    regions: ['us', 'global'],
    sources: [],
    needs_source: true,
  },
  {
    slug: 'face-all-exfoliate-at-most-two-or-three-times-a-week',
    area: 'face',
    title_el: 'Απολέπιση το πολύ δύο-τρεις φορές την εβδομάδα',
    title_en: 'Exfoliate at most two or three times a week',
    body_el:
      'Η επιδερμίδα ανανεώνεται μόνη της κάθε τέσσερις περίπου εβδομάδες· η απολέπιση απλώς βοηθά. Καθημερινά οξέα ή scrub αφαιρούν και τα υγιή κύτταρα, και το αποτέλεσμα είναι γυαλάδα, τσούξιμο και κοκκινίλα που μοιάζουν με «ευαίσθητη επιδερμίδα». Αν το δέρμα σου τσούζει με απλή ενυδατική, κάνε παύση από κάθε απολέπιση για δύο εβδομάδες.',
    body_en:
      'Skin renews itself roughly every four weeks; exfoliation merely helps. Daily acids or scrubs remove healthy cells too, and the result is shine, stinging and redness that passes for “sensitive skin”. If plain moisturiser stings, pause all exfoliation for two weeks.',
    audiences: ['all'],
    skin_types: ['all'],
    concerns: ['texture', 'redness'],
    regions: ['global'],
    sources: [
      'https://www.aad.org/public/everyday-care/skin-care-secrets/routine/safely-exfoliate-at-home',
    ],
    needs_source: false,
  },
  {
    slug: 'face-all-vitamin-c-that-turned-orange-is-done',
    area: 'face',
    title_el: 'Βιταμίνη C που έγινε πορτοκαλί: πέταξέ την',
    title_en: 'Vitamin C that turned orange: throw it out',
    body_el:
      'Το L-ασκορβικό οξύ οξειδώνεται με το φως, τη ζέστη και τον αέρα· ο ορός από σχεδόν διάφανος γίνεται κίτρινος, μετά πορτοκαλί-καφέ. Στο στάδιο αυτό δεν προσφέρει αντιοξειδωτική προστασία και μπορεί να λεκιάσει. Αγόραζε μικρές συσκευασίες σε αδιαφανές μπουκάλι, φύλαξέ το στο ψυγείο και τελείωσέ το μέσα σε τρεις μήνες.',
    body_en:
      'L-ascorbic acid oxidises with light, heat and air; the serum goes from nearly clear to yellow, then orange-brown. At that stage it offers no antioxidant protection and may stain. Buy small opaque bottles, keep it in the fridge and finish it within three months.',
    audiences: ['all'],
    skin_types: ['all'],
    concerns: ['pigmentation', 'aging'],
    regions: ['global'],
    sources: [],
    needs_source: true,
  },
  {
    slug: 'face-all-niacinamide-pairs-with-almost-everything',
    area: 'face',
    title_el: 'Η νιασιναμίδη συνδυάζεται με σχεδόν τα πάντα',
    title_en: 'Niacinamide pairs with almost everything',
    body_el:
      'Ο παλιός μύθος ότι η νιασιναμίδη «ακυρώνει» τη βιταμίνη C προέρχεται από πειράματα σε υψηλή θερμοκρασία δεκαετιών πριν· στις σημερινές συνθέσεις συνυπάρχουν άνετα. Σε 2–5 % είναι το πιο ανεκτό «ενεργό» για αρχάριους, μαζί με ρετινόλη, οξέα ή αντηλιακό. Πάνω από 10 % μερικοί κοκκινίζουν — περισσότερο δεν σημαίνει καλύτερο.',
    body_en:
      'The old myth that niacinamide “cancels” vitamin C comes from high-temperature experiments decades ago; in today’s formulas they coexist happily. At 2–5 % it is the best-tolerated active for beginners, alongside retinol, acids or sunscreen. Above 10 % some people flush — more is not better.',
    audiences: ['all'],
    skin_types: ['all'],
    concerns: ['general', 'pores', 'redness'],
    regions: ['global'],
    sources: [],
    needs_source: true,
  },
  {
    slug: 'face-all-patch-test-every-new-product',
    area: 'face',
    title_el: 'Patch test σε κάθε νέο προϊόν — πίσω από το αυτί ή στο εσωτερικό του βραχίονα',
    title_en: 'Patch test every new product — behind the ear or on the inner arm',
    body_el:
      'Βάλε λίγο προϊόν σε ένα σημείο στο μέγεθος νομίσματος πίσω από το αυτί ή στο εσωτερικό του πήχη, δύο φορές τη μέρα για 7–10 μέρες, και κοίτα για κοκκινίλα, φαγούρα ή σπυράκια. Οι αλλεργίες επαφής αργούν να εμφανιστούν, γι’ αυτό μία μέρα δεν αρκεί. Ένα προϊόν τη φορά, αλλιώς δεν θα ξέρεις ποιο έφταιξε.',
    body_en:
      'Apply a little product to a coin-sized spot behind the ear or on the inner forearm, twice a day for 7–10 days, and watch for redness, itching or bumps. Contact allergies take time to show, so one day is not enough. One new product at a time, or you will not know which one was to blame.',
    audiences: ['all'],
    skin_types: ['sensitive', 'all'],
    concerns: ['redness', 'general'],
    regions: ['global'],
    sources: [
      'https://www.aad.org/public/everyday-care/skin-care-basics/care/how-to-test-skin-care-products',
    ],
    needs_source: false,
  },

  // --- everyone · barrier, hydration, climate ----------------------------------------------------------
  {
    slug: 'face-all-signs-of-a-damaged-barrier',
    area: 'face',
    title_el: 'Πότε ο φραγμός του δέρματος «φωνάζει» για βοήθεια',
    title_en: 'When the skin barrier is crying out for help',
    body_el:
      'Τσούξιμο με απλό νερό ή ενυδατική, ξεφλούδισμα μαζί με γυαλάδα, κοκκινίλα που δεν φεύγει και προϊόντα που ξαφνικά «δεν ταιριάζουν» είναι σημάδια φραγμού που έχει ξεπεράσει τα όριά του. Σταμάτα κάθε οξύ, ρετινόλη και scrub για δύο εβδομάδες και μείνε σε ήπιο καθαριστικό, κρέμα με κεραμίδια και αντηλιακό. Αν δεν ηρεμήσει σε δύο εβδομάδες, δες δερματολόγο — μπορεί να μην είναι απλός ερεθισμός.',
    body_en:
      'Stinging from plain water or moisturiser, flaking alongside shine, redness that will not fade and products that suddenly “don’t agree” are the signs of a barrier pushed past its limit. Stop every acid, retinol and scrub for two weeks and stick to a gentle cleanser, a ceramide cream and sunscreen. If it has not calmed in two weeks, see a dermatologist — it may not be simple irritation.',
    audiences: ['all'],
    skin_types: ['all'],
    concerns: ['redness', 'hydration'],
    regions: ['global'],
    sources: [AAD_DRY_SKIN],
    needs_source: false,
  },
  {
    slug: 'face-all-lukewarm-water-short-showers',
    area: 'face',
    title_el: 'Χλιαρό νερό και σύντομο ντους',
    title_en: 'Lukewarm water and short showers',
    body_el:
      'Το καυτό νερό διαλύει τα λιπίδια του δέρματος όπως διαλύει το λίπος στα πιάτα, και μετά το δέρμα «τραβάει» και ξεφλουδίζει. Πέντε ως δέκα λεπτά με χλιαρό νερό αρκούν, και η ενυδατική μπαίνει μέσα σε τρία λεπτά από το ντους, όσο το δέρμα είναι ακόμη νωπό. Το πρόσωπο δεν χρειάζεται να πλένεται κάτω από τη ροή του ντους.',
    body_en:
      'Hot water dissolves the skin’s lipids the way it dissolves grease on dishes, and afterwards the skin feels tight and flakes. Five to ten minutes of lukewarm water is enough, and moisturiser goes on within three minutes of the shower while the skin is still damp. Your face does not need to be washed under the shower stream.',
    audiences: ['all'],
    skin_types: ['dry', 'sensitive', 'all'],
    concerns: ['hydration', 'redness'],
    regions: ['global'],
    sources: [
      AAD_DRY_SKIN,
      'https://www.mayoclinic.org/diseases-conditions/dry-skin/symptoms-causes/syc-20353885',
    ],
    needs_source: false,
  },
  {
    slug: 'face-all-greek-summer-humidity-lighter-textures',
    area: 'face',
    title_el: 'Ελληνικό καλοκαίρι: ελαφρύτερες υφές, ίδια βήματα',
    title_en: 'Greek summer: lighter textures, same steps',
    body_el:
      'Με 35 βαθμούς και υγρασία η κρέμα του χειμώνα γίνεται λιπαρό φιλμ που φράζει πόρους. Μην κόψεις την ενυδάτωση — άλλαξε την υφή: gel ή γαλάκτωμα αντί για κρέμα, υδατικός ορός αντί για έλαιο, και αντηλιακό ελαφρύ που θα βάλεις πραγματικά σε αρκετή ποσότητα. Ο ιδρώτας δεν ενυδατώνει· αντίθετα, το αλάτι του ξηραίνει.',
    body_en:
      'At 35 degrees with humidity, your winter cream turns into a greasy film that clogs pores. Do not drop the moisture — change the texture: gel or emulsion instead of cream, a watery serum instead of oil, and a light sunscreen you will actually apply in a full dose. Sweat does not hydrate; its salt dries you out.',
    audiences: ['all'],
    skin_types: ['oily', 'combination', 'all'],
    concerns: ['hydration', 'pores', 'sun'],
    regions: ['eu', 'global'],
    sources: [],
    needs_source: true,
  },
  {
    slug: 'face-all-winter-heating-dryness',
    area: 'face',
    title_el: 'Χειμώνας με θέρμανση: το δέρμα χάνει νερό στον αέρα',
    title_en: 'Winter with the heating on: the skin loses water to the air',
    body_el:
      'Τα καλοριφέρ και το κλιματιστικό ρίχνουν την υγρασία του δωματίου κάτω από 30 %, και το δέρμα παραδίδει νερό στον ξηρό αέρα όλη νύχτα. Πρόσθεσε κρέμα με κεραμίδια πάνω από τον ορό, βάλε έναν υγραντήρα ή ένα δοχείο νερό στο καλοριφέρ του υπνοδωματίου και χαμήλωσε τη θερμοκρασία του ντους. Τα χείλη και τα χέρια το νιώθουν πρώτα.',
    body_en:
      'Radiators and air conditioning push room humidity below 30 %, and the skin hands water to the dry air all night. Add a ceramide cream over your serum, run a humidifier or set a bowl of water on the bedroom radiator and turn the shower temperature down. Lips and hands feel it first.',
    audiences: ['all'],
    skin_types: ['dry', 'sensitive', 'all'],
    concerns: ['hydration'],
    regions: ['eu', 'global'],
    sources: [AAD_DRY_SKIN],
    needs_source: false,
  },
  {
    slug: 'face-all-rinse-off-salt-after-the-sea',
    area: 'face',
    title_el: 'Μετά τη θάλασσα, ξέπλυμα με γλυκό νερό',
    title_en: 'After the sea, rinse with fresh water',
    body_el:
      'Το αλάτι που στεγνώνει πάνω στο δέρμα τραβά νερό από αυτό και αφήνει το πρόσωπο σφιχτό και τα μαλλιά σαν άχυρο. Ένα γρήγορο ξέπλυμα στο ντους της παραλίας, μετά ενυδατική και ξανά αντηλιακό αν μένεις στον ήλιο. Το χλώριο της πισίνας κάνει το ίδιο, με επιπλέον ερεθισμό στα μάτια και τον λαιμό.',
    body_en:
      'Salt drying on the skin pulls water out of it and leaves the face tight and the hair like straw. A quick rinse at the beach shower, then moisturiser and sunscreen again if you are staying in the sun. Pool chlorine does the same, with extra irritation for eyes and neck.',
    audiences: ['all'],
    skin_types: ['all'],
    concerns: ['hydration', 'sun'],
    regions: ['eu', 'global'],
    sources: [],
    needs_source: true,
  },
  {
    slug: 'face-all-oily-skin-still-needs-moisturiser',
    area: 'face',
    title_el: 'Και η λιπαρή επιδερμίδα θέλει ενυδατική',
    title_en: 'Oily skin needs moisturiser too',
    body_el:
      'Το σμήγμα δεν είναι νερό: μια επιδερμίδα μπορεί να γυαλίζει και ταυτόχρονα να είναι αφυδατωμένη, ειδικά όταν της αφαιρείς τα λιπίδια με δυνατά καθαριστικά και οξέα. Όταν παραλείπεις την ενυδάτωση, πολλές επιδερμίδες απαντούν με περισσότερο σμήγμα. Διάλεξε gel χωρίς έλαια, «non-comedogenic», και βάλε λεπτή στρώση δύο φορές τη μέρα.',
    body_en:
      'Sebum is not water: skin can shine and be dehydrated at the same time, especially when strong cleansers and acids strip its lipids. Skip the moisturiser and many skins answer with more sebum. Choose an oil-free, non-comedogenic gel and apply a thin layer twice a day.',
    audiences: ['all'],
    skin_types: ['oily', 'combination'],
    concerns: ['hydration', 'acne', 'pores'],
    regions: ['global'],
    sources: [AAD_ACNE_TIPS],
    needs_source: false,
  },
  {
    slug: 'face-all-korean-layering-thin-to-thick',
    area: 'face',
    title_el: 'Κορεατικές στρώσεις: από το πιο αραιό στο πιο πυκνό',
    title_en: 'Korean layering: thinnest to thickest',
    body_el:
      'Ο κανόνας της κορεατικής ρουτίνας είναι απλός: τόνερ, essence, ορός, γαλάκτωμα, κρέμα — κάθε προϊόν πιο πυκνό από το προηγούμενο, κάθε στρώση πάνω σε ελαφρώς νωπό δέρμα. Το «χτύπημα» με τις παλάμες αντί για τρίψιμο βοηθά την απορρόφηση και δεν τραβά το δέρμα. Δεν χρειάζονται δέκα βήματα: τρεις σωστές στρώσεις κάνουν τη διαφορά.',
    body_en:
      'The Korean rule is simple: toner, essence, serum, emulsion, cream — each product thicker than the last, each layer on slightly damp skin. Patting with your palms instead of rubbing helps absorption and does not tug the skin. You do not need ten steps: three well-chosen layers make the difference.',
    audiences: ['all'],
    skin_types: ['all'],
    concerns: ['hydration', 'general'],
    regions: ['kr'],
    sources: [],
    needs_source: true,
  },
  {
    slug: 'face-all-sheet-mask-do-not-let-it-dry',
    area: 'face',
    title_el: 'Υφασμάτινη μάσκα: βγάλ’ την πριν στεγνώσει',
    title_en: 'Sheet mask: take it off before it dries',
    body_el:
      'Όσο η μάσκα είναι υγρή δίνει νερό στο δέρμα· όταν αρχίζει να στεγνώνει, το χαρτί τραβά το νερό πίσω. Δεκαπέντε με είκοσι λεπτά αρκούν, και το υπόλοιπο έκχυμα του φακέλου πάει στον λαιμό και τα χέρια. Μετά, ενυδατική για να σφραγίσει — αλλιώς η λάμψη κρατά μία ώρα.',
    body_en:
      'While the mask is wet it gives water to the skin; once it starts to dry, the sheet pulls the water back out. Fifteen to twenty minutes is enough, and the leftover essence in the pouch goes on neck and hands. Then moisturise to seal — otherwise the glow lasts an hour.',
    audiences: ['all'],
    skin_types: ['all'],
    concerns: ['hydration'],
    regions: ['kr'],
    sources: [],
    needs_source: true,
  },

  // --- everyone · acne, sensitivity, when to see a dermatologist ------------------------------------------
  {
    slug: 'face-all-do-not-pop-pimples',
    area: 'face',
    title_el: 'Μην πιέζεις τα σπυράκια',
    title_en: 'Do not pop pimples',
    body_el:
      'Το ζούληγμα σπρώχνει βακτήρια και σμήγμα βαθύτερα, μεγαλώνει τη φλεγμονή και είναι η πρώτη αιτία για σημάδια και ουλές που μένουν μήνες. Ένα υδροκολλοειδές επίθεμα πάνω στο σπυράκι το προστατεύει από τα χέρια σου και το αποφορτίζει μέσα σε μια νύχτα. Ακμή που αφήνει ουλές ή δεν βελτιώνεται σε 2–3 μήνες με προϊόντα του φαρμακείου χρειάζεται δερματολόγο.',
    body_en:
      'Squeezing pushes bacteria and sebum deeper, enlarges the inflammation and is the main cause of marks and scars that last for months. A hydrocolloid patch over the spot keeps your fingers off it and drains it overnight. Acne that scars or does not improve within two or three months of pharmacy products needs a dermatologist.',
    audiences: ['all'],
    skin_types: ['oily', 'combination', 'all'],
    concerns: ['acne'],
    regions: ['global'],
    sources: [NHS_ACNE, AAD_ACNE_TIPS],
    needs_source: false,
  },
  {
    slug: 'face-all-pillowcase-phone-and-hands',
    area: 'face',
    title_el: 'Μαξιλαροθήκη, κινητό και χέρια: οι αθόρυβοι ένοχοι',
    title_en: 'Pillowcase, phone and hands: the quiet culprits',
    body_el:
      'Η μαξιλαροθήκη μαζεύει σμήγμα, προϊόντα μαλλιών και ιδρώτα και τα επιστρέφει στο μάγουλό σου οκτώ ώρες τη νύχτα· άλλαξέ τη μία-δύο φορές την εβδομάδα. Η οθόνη του κινητού ακουμπά στο ίδιο μάγουλο όλη μέρα — σκούπισέ τη με μαντιλάκι. Και τα χέρια μακριά από το πρόσωπο, ειδικά στο γραφείο.',
    body_en:
      'Your pillowcase collects sebum, hair products and sweat and hands them back to your cheek for eight hours a night; change it once or twice a week. Your phone screen rests on that same cheek all day — wipe it with a cleansing wipe. And keep your hands off your face, especially at a desk.',
    audiences: ['all'],
    skin_types: ['oily', 'combination', 'all'],
    concerns: ['acne'],
    regions: ['global'],
    sources: [AAD_ACNE_TIPS],
    needs_source: false,
  },
  {
    slug: 'face-all-fragrance-free-for-reactive-skin',
    area: 'face',
    title_el: 'Ευαίσθητη επιδερμίδα: χωρίς άρωμα, χωρίς αιθέρια έλαια',
    title_en: 'Reactive skin: fragrance-free, no essential oils',
    body_el:
      'Το άρωμα είναι η συχνότερη αιτία αλλεργίας επαφής από καλλυντικά, και τα «φυσικά» αιθέρια έλαια (λεβάντα, τσάι, εσπεριδοειδή) δεν αποτελούν εξαίρεση. «Χωρίς άρωμα» (fragrance-free) σημαίνει τίποτα· «άοσμο» (unscented) μπορεί να σημαίνει άρωμα που καλύπτει άλλη μυρωδιά. Στην ΕΕ τα 26 πιο συχνά αλλεργιογόνα αρώματα αναγράφονται υποχρεωτικά στα συστατικά — ψάξε για linalool, limonene, geraniol.',
    body_en:
      'Fragrance is the most common cause of contact allergy from cosmetics, and “natural” essential oils (lavender, tea tree, citrus) are no exception. “Fragrance-free” means none; “unscented” may mean a fragrance masking another smell. In the EU the 26 most common fragrance allergens must be listed in the ingredients — look for linalool, limonene, geraniol.',
    audiences: ['all'],
    skin_types: ['sensitive'],
    concerns: ['redness', 'general'],
    regions: ['eu', 'global'],
    sources: ['https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32009R1223'],
    needs_source: false,
  },
  {
    slug: 'face-all-rosacea-know-your-triggers',
    area: 'face',
    title_el: 'Ροδόχρους ακμή: μάθε τι την πυροδοτεί',
    title_en: 'Rosacea: learn your triggers',
    body_el:
      'Κοκκινίλα στα μάγουλα και τη μύτη που φουντώνει με ήλιο, ζέστη, κρασί, καυτερά, ζεστά ροφήματα ή άγχος είναι συχνά ροδόχρους ακμή — όχι «ευαίσθητο δέρμα» και όχι κανονική ακμή. Κράτα ημερολόγιο δύο εβδομάδων για να βρεις τους δικούς σου διεγέρτες, προτίμησε ορυκτό αντηλιακό και αζελαϊκό οξύ και απόφυγε scrub και οινόπνευμα. Είναι χρόνια αλλά ελέγχεται· ο δερματολόγος έχει αγωγές που μειώνουν τα επεισόδια.',
    body_en:
      'Redness on cheeks and nose that flares with sun, heat, wine, spicy food, hot drinks or stress is often rosacea — not “sensitive skin” and not ordinary acne. Keep a two-week diary to find your own triggers, prefer mineral sunscreen and azelaic acid and avoid scrubs and alcohol. It is chronic but controllable; a dermatologist has treatments that reduce the flares.',
    audiences: ['all'],
    skin_types: ['sensitive'],
    concerns: ['redness'],
    regions: ['global'],
    sources: ['https://www.nhs.uk/conditions/rosacea/'],
    needs_source: false,
  },
  {
    slug: 'face-all-when-to-see-a-dermatologist',
    area: 'face',
    title_el: 'Πότε σταματάς τα προϊόντα και πας σε δερματολόγο',
    title_en: 'When to stop the products and see a dermatologist',
    body_el:
      'Ακμή που αφήνει ουλές ή επιμένει πάνω από τρεις μήνες, κοκκινίλα ή ξεφλούδισμα που δεν υποχωρεί σε δύο εβδομάδες ανάπαυσης, ελιά που αλλάζει, πληγή που δεν κλείνει σε τρεις εβδομάδες, ξαφνικές κηλίδες ή φαγούρα που σε ξυπνά — όλα αυτά δεν λύνονται με έναν ακόμη ορό. Ο δερματολόγος βλέπει σε δέκα λεπτά αυτό που το διαδίκτυο δεν θα βρει ποτέ. Οι συμβουλές εδώ είναι γενική ενημέρωση, όχι διάγνωση.',
    body_en:
      'Acne that scars or lasts over three months, redness or flaking that does not settle after two weeks of rest, a changing mole, a sore that has not healed in three weeks, sudden patches or itching that wakes you — none of these is solved by one more serum. A dermatologist sees in ten minutes what the internet never will. The tips here are general information, not a diagnosis.',
    audiences: ['all'],
    skin_types: ['all'],
    concerns: ['general', 'acne', 'redness', 'sun'],
    regions: ['global'],
    sources: [NHS_ACNE, 'https://www.nhs.uk/conditions/melanoma-skin-cancer/'],
    needs_source: false,
  },
  {
    slug: 'face-all-eu-labels-inci-and-claims',
    area: 'face',
    title_el: 'Πώς διαβάζεις μια ευρωπαϊκή ετικέτα καλλυντικού',
    title_en: 'How to read a European cosmetics label',
    body_el:
      'Στην ΕΕ τα συστατικά γράφονται με τις διεθνείς ονομασίες INCI, σε φθίνουσα σειρά ποσότητας μέχρι το 1 % — ό,τι είναι στις πρώτες πέντε θέσεις είναι το προϊόν. Οι όροι «υποαλλεργικό», «δερματολογικά ελεγμένο» και «φυσικό» δεν έχουν νομικό ορισμό ούτε έγκριση. Το σύμβολο του ανοιχτού βάζου (π.χ. 12M) λέει πόσους μήνες κρατά αφού το ανοίξεις.',
    body_en:
      'In the EU ingredients are listed by their international INCI names in descending order of amount down to 1 % — whatever sits in the first five places is the product. “Hypoallergenic”, “dermatologically tested” and “natural” have no legal definition or approval. The open-jar symbol (e.g. 12M) tells you how many months it keeps once opened.',
    audiences: ['all'],
    skin_types: ['all'],
    concerns: ['general'],
    regions: ['eu'],
    sources: ['https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32009R1223'],
    needs_source: false,
  },
  {
    slug: 'face-all-sleep-shows-on-the-skin',
    area: 'face',
    title_el: 'Ο ύπνος φαίνεται στο δέρμα πριν φανεί οπουδήποτε αλλού',
    title_en: 'Sleep shows on the skin before it shows anywhere else',
    body_el:
      'Λίγες νύχτες με πέντε ώρες ύπνου φτάνουν για θαμπή όψη, πρησμένα μάτια και πιο αργή επούλωση των σπυριών· η επιδερμίδα επισκευάζεται κυρίως τη νύχτα. Καμία κρέμα δεν αντικαθιστά τις επτά ώρες. Κοιμήσου ανάσκελα αν μπορείς — το πλάγιο μαξιλάρι χαράζει με τον καιρό γραμμές στο μάγουλο.',
    body_en:
      'A few nights of five hours’ sleep are enough for a dull look, puffy eyes and slower healing of spots; the skin repairs itself mostly at night. No cream replaces seven hours. Sleep on your back if you can — a pillow pressed to the side etches cheek lines over time.',
    audiences: ['all'],
    skin_types: ['all'],
    concerns: ['general', 'aging'],
    regions: ['global'],
    sources: [],
    needs_source: true,
  },

  // --- nails (operator addition 2026-10-06: "and nails") ---------------------------------------------
  {
    slug: 'nails-file-in-one-direction',
    area: 'nails',
    title_el: 'Λιμάρισμα προς μία κατεύθυνση, σε στεγνά νύχια',
    title_en: 'File in one direction, on dry nails',
    body_el:
      'Το πέρα-δώθε με τη λίμα ξεφτίζει τις στρώσεις κερατίνης στην άκρη και το νύχι αρχίζει να ξεφλουδίζει. Λιμάρισε από την πλαϊνή άκρη προς το κέντρο, με απαλές κινήσεις προς την ίδια κατεύθυνση, και πάντα σε στεγνό νύχι — το βρεγμένο σκίζεται εύκολα. Μια γυάλινη λίμα είναι πιο ήπια από τη χάρτινη και πλένεται.',
    body_en:
      'Sawing back and forth frays the keratin layers at the edge and the nail starts to peel. File from the side edge towards the centre with gentle strokes in one direction, always on a dry nail — a wet one tears easily. A glass file is gentler than an emery board and can be washed.',
    audiences: ['all'],
    skin_types: ['all'],
    concerns: ['nails'],
    regions: ['global'],
    sources: [MAYO_NAILS],
    needs_source: false,
  },
  {
    slug: 'nails-do-not-cut-the-cuticles',
    area: 'nails',
    title_el: 'Τα επωνύχια δεν κόβονται — σπρώχνονται απαλά',
    title_en: 'Cuticles are not cut — they are pushed back gently',
    body_el:
      'Το επωνύχιο σφραγίζει το σημείο όπου γεννιέται το νύχι και κρατά έξω βακτήρια και μύκητες. Όταν το κόβεις, ανοίγεις πόρτα σε λοιμώξεις και το νύχι βγαίνει με ραβδώσεις. Μετά το ντους, όταν είναι μαλακό, σπρώξε το απαλά με πετσέτα ή ξυλάκι και βάλε λάδι επωνυχίων· κόψε μόνο ό,τι έχει ήδη ξεκολλήσει.',
    body_en:
      'The cuticle seals the spot where the nail is born and keeps bacteria and fungi out. Cut it and you open a door to infection, and the nail grows out ridged. After the shower, when it is soft, push it back gently with a towel or an orange stick and apply cuticle oil; trim only what has already lifted.',
    audiences: ['all'],
    skin_types: ['all'],
    concerns: ['nails'],
    regions: ['global'],
    sources: [AAD_NAIL_TIPS, MAYO_NAILS],
    needs_source: false,
  },
  {
    slug: 'nails-how-to-stop-biting',
    area: 'nails',
    title_el: 'Για να κόψεις το δάγκωμα των νυχιών',
    title_en: 'To stop biting your nails',
    body_el:
      'Το δάγκωμα μεταφέρει μικρόβια από τα χέρια στο στόμα και αντίστροφα, πληγώνει τα επωνύχια και, με τα χρόνια, παραμορφώνει το νύχι. Κράτα τα νύχια πολύ κοντά και λιμαρισμένα ώστε να μην έχει «τι να πιάσεις», βάλε πικρό βερνίκι και σημείωσε πότε το κάνεις — το άγχος και η βαρεμάρα είναι οι συνήθεις στιγμές. Ένα όμορφο μανικιούρ ή ένα stress ball στο γραφείο βοηθούν περισσότερο από τη θέληση.',
    body_en:
      'Biting carries germs from hands to mouth and back, wounds the cuticles and, over years, deforms the nail. Keep nails very short and filed so there is nothing to grab, use a bitter polish and note when you do it — stress and boredom are the usual moments. A nice manicure or a stress ball at your desk helps more than willpower.',
    audiences: ['all'],
    skin_types: ['all'],
    concerns: ['nails'],
    regions: ['global'],
    sources: [
      'https://www.aad.org/public/everyday-care/nail-care-secrets/basics/stop-biting-nails',
    ],
    needs_source: false,
  },
  {
    slug: 'nails-hangnails-clip-do-not-tear',
    area: 'nails',
    title_el: 'Παρανυχίδες: κόψιμο με νυχοκόπτη, όχι τράβηγμα',
    title_en: 'Hangnails: clip them, never tear',
    body_el:
      'Η μικρή λωρίδα δέρματος δίπλα στο νύχι τραβιέται πολύ πιο βαθιά απ’ όσο δείχνει, και η πληγή που μένει μολύνεται εύκολα (παρωνυχία). Κόψε την παρανυχίδα στη βάση με καθαρό νυχοκόπτη ή ψαλιδάκι, βάλε λίγο λάδι ή κρέμα και άφησέ την ήσυχη. Ξηρά χέρια βγάζουν περισσότερες — η κρέμα χεριών είναι η πρόληψη. Αν το δάχτυλο κοκκινίσει, πρηστεί ή πονά, δες γιατρό.',
    body_en:
      'That little strip of skin beside the nail tears far deeper than it looks, and the wound it leaves gets infected easily (paronychia). Clip the hangnail at the base with a clean clipper or small scissors, apply a little oil or cream and leave it alone. Dry hands grow more of them — hand cream is the prevention. If the finger reddens, swells or hurts, see a doctor.',
    audiences: ['all'],
    skin_types: ['all'],
    concerns: ['nails', 'hands'],
    regions: ['global'],
    sources: [MAYO_NAILS],
    needs_source: false,
  },
  {
    slug: 'nails-brittle-nails-and-diet-myths',
    area: 'nails',
    title_el: 'Εύθραυστα νύχια: τι λέει η διατροφή και τι ο μύθος',
    title_en: 'Brittle nails: what diet does and what is myth',
    body_el:
      'Τα νύχια σπάνια είναι εύθραυστα από «έλλειψη ασβεστίου»· η συνηθέστερη αιτία είναι το νερό — συνεχές βρέξιμο και στέγνωμα, απορρυπαντικά, ασετόν. Η βιοτίνη βοηθά μόνο όσους έχουν πραγματική έλλειψη, που είναι σπάνια, και τα συμπληρώματά της αλλοιώνουν εργαστηριακές εξετάσεις (θυρεοειδή, καρδιακά ένζυμα). Αν τρως ισορροπημένα, η λύση είναι γάντια, λάδι και υπομονή — όχι χάπι.',
    body_en:
      'Nails are rarely brittle from a “calcium deficiency”; the usual cause is water — constant wetting and drying, detergents, acetone. Biotin helps only people with a genuine deficiency, which is rare, and biotin supplements distort lab tests (thyroid, cardiac enzymes). If you eat a balanced diet, the fix is gloves, oil and patience — not a pill.',
    audiences: ['all'],
    skin_types: ['all'],
    concerns: ['nails'],
    regions: ['global'],
    sources: ['https://ods.od.nih.gov/factsheets/Biotin-HealthProfessional/', MAYO_NAILS],
    needs_source: false,
  },
  {
    slug: 'nails-gel-and-acrylic-take-breaks',
    area: 'nails',
    title_el: 'Gel και ακρυλικό: δώσε στο νύχι διαλείμματα',
    title_en: 'Gel and acrylic: give the nail breaks',
    body_el:
      'Το πρόβλημα με το ημιμόνιμο δεν είναι το προϊόν αλλά η αφαίρεση: το λιμάρισμα και το ξύσιμο λεπταίνουν την πλάκα κάθε φορά. Μετά από δύο-τρεις εφαρμογές άφησε τα νύχια γυμνά για δύο εβδομάδες με λάδι επωνυχίων κάθε βράδυ. Στο σαλόνι ζήτα αφαίρεση με μούλιασμα, όχι ξύσιμο, και βάλε αντηλιακό στα χέρια πριν τη λάμπα UV.',
    body_en:
      'The problem with semi-permanent polish is not the product but the removal: filing and scraping thin the plate every time. After two or three applications leave the nails bare for two weeks with cuticle oil every night. At the salon ask for soak-off removal, not scraping, and put sunscreen on your hands before the UV lamp.',
    audiences: ['women', 'all'],
    skin_types: ['all'],
    concerns: ['nails'],
    regions: ['global'],
    sources: ['https://www.aad.org/public/everyday-care/nail-care-secrets/basics/artificial-nails'],
    needs_source: false,
  },
  {
    slug: 'nails-acetone-dries-the-plate',
    area: 'nails',
    title_el: 'Η ασετόν αφαιρεί και το νερό από το νύχι',
    title_en: 'Acetone strips the water from the nail too',
    body_el:
      'Η ασετόν διαλύει το βερνίκι σε δευτερόλεπτα, αλλά διαλύει και τα λιπίδια και την υγρασία της πλάκας και του δέρματος γύρω της — γι’ αυτό τα νύχια ασπρίζουν και τα επωνύχια ξεφλουδίζουν μετά. Για απλό βερνίκι προτίμησε αφαιρετικό χωρίς ασετόν· όταν την χρειάζεσαι για gel, βάλε λάδι γύρω από το νύχι πριν και κρέμα χεριών αμέσως μετά. Στις ΗΠΑ ο FDA επιβλέπει τα προϊόντα νυχιών ως καλλυντικά και προειδοποιεί για σωστό αερισμό.',
    body_en:
      'Acetone dissolves polish in seconds, but it also dissolves the lipids and moisture of the plate and the surrounding skin — which is why nails go white and cuticles peel afterwards. For plain polish prefer an acetone-free remover; when you need acetone for gel, oil around the nail first and hand cream straight after. In the US the FDA oversees nail products as cosmetics and warns about proper ventilation.',
    audiences: ['all'],
    skin_types: ['all'],
    concerns: ['nails', 'hands'],
    regions: ['global', 'us'],
    sources: ['https://www.fda.gov/cosmetics/cosmetic-products/nail-care-products'],
    needs_source: false,
  },
  {
    slug: 'nails-gloves-for-dishes-and-cleaning',
    area: 'nails',
    title_el: 'Γάντια για τα πιάτα και την καθαριότητα',
    title_en: 'Gloves for the dishes and the cleaning',
    body_el:
      'Το νύχι φουσκώνει με το νερό και ξαναμαζεύει όταν στεγνώνει· δέκα τέτοιοι κύκλοι τη μέρα, με απορρυπαντικό, είναι η πρώτη αιτία για νύχια που ξεφλουδίζουν και σκίζονται. Ένα ζευγάρι γάντια κουζίνας με βαμβακερή επένδυση κόβει το μεγαλύτερο μέρος της ζημιάς. Μετά το πλύσιμο των χεριών, κρέμα μέχρι τα επωνύχια.',
    body_en:
      'The nail swells with water and shrinks again as it dries; ten such cycles a day, with detergent, are the main cause of peeling and splitting nails. A pair of cotton-lined kitchen gloves cuts most of the damage. After washing your hands, cream right up to the cuticles.',
    audiences: ['all'],
    skin_types: ['all'],
    concerns: ['nails', 'hands'],
    regions: ['global'],
    sources: [AAD_NAIL_TIPS, MAYO_NAILS],
    needs_source: false,
  },
  {
    slug: 'nails-fungal-signs-see-a-doctor',
    area: 'nails',
    title_el: 'Κίτρινο, χοντρό νύχι που θρυμματίζεται: μύκητας — δες γιατρό',
    title_en: 'A yellow, thick, crumbly nail: a fungus — see a doctor',
    body_el:
      'Νύχι που κιτρινίζει ή ασπρίζει, παχαίνει, θρυμματίζεται στην άκρη ή σηκώνεται από την κοίτη του είναι συνήθως μυκητίαση — πολύ συχνή στα πόδια, από πισίνες, αθλητικά παπούτσια και ζεστές κάλτσες. Τα βερνίκια του ραφιού σπάνια αρκούν· ο γιατρός επιβεβαιώνει τη διάγνωση και δίνει αγωγή μηνών. Μην καλύπτεις το νύχι με βερνίκι ή gel — κλειδώνεις τον μύκητα μέσα.',
    body_en:
      'A nail that turns yellow or white, thickens, crumbles at the tip or lifts from its bed is usually a fungal infection — very common on the feet, from pools, trainers and warm socks. Shelf polishes rarely suffice; a doctor confirms the diagnosis and prescribes a course of months. Do not cover the nail with polish or gel — you lock the fungus in.',
    audiences: ['all'],
    skin_types: ['all'],
    concerns: ['nails'],
    regions: ['global'],
    sources: ['https://www.nhs.uk/conditions/fungal-nail-infection/'],
    needs_source: false,
  },
  {
    slug: 'nails-men-short-clean-and-buffed',
    area: 'nails',
    title_el: 'Για άντρες: κοντά, καθαρά και, αν θέλεις, ελαφρά γυαλισμένα',
    title_en: 'For men: short, clean and, if you like, lightly buffed',
    body_el:
      'Το αντρικό μανικιούρ είναι τρία πράγματα: νύχια κοντά σε ευθεία γραμμή με στρογγυλεμένες γωνίες, καθαρά από κάτω χωρίς αιχμηρά εργαλεία, και επωνύχια ενυδατωμένα αντί για κομμένα. Ένα πέρασμα με buffer μία φορά τον μήνα δίνει φυσική γυαλάδα που δεν φαίνεται «φτιαγμένη». Ο νυχοκόπτης κόβει ίσια· η λίμα τελειώνει το σχήμα.',
    body_en:
      'A men’s manicure is three things: nails short in a straight line with rounded corners, clean underneath without sharp tools, and cuticles moisturised rather than cut. One pass with a buffer once a month gives a natural shine that does not look “done”. The clipper cuts straight; the file finishes the shape.',
    audiences: ['men'],
    skin_types: ['all'],
    concerns: ['nails'],
    regions: ['global'],
    sources: [],
    needs_source: true,
  },
  {
    slug: 'nails-salon-ventilation-and-pregnancy',
    area: 'nails',
    title_el: 'Στο σαλόνι: αερισμός, ειδικά στην εγκυμοσύνη',
    title_en: 'At the salon: ventilation, especially in pregnancy',
    body_el:
      'Ασετόν, μονομερή ακρυλικού και σκόνη λιμαρίσματος μαζεύονται στον αέρα ενός κλειστού σαλονιού, και οι μυρωδιές που «ζαλίζουν» δεν είναι απλώς ενοχλητικές. Στην εγκυμοσύνη δεν υπάρχει λόγος να κόψεις το μανικιούρ, αλλά διάλεξε χώρο με απορρόφηση ή ανοιχτά παράθυρα, ζήτα το απλό βερνίκι αντί για ακρυλικό και μη μένεις όση ώρα λιμάρουν δίπλα σου. Το ίδιο ισχύει για όσους δουλεύουν εκεί καθημερινά.',
    body_en:
      'Acetone, acrylic monomers and filing dust build up in the air of a closed salon, and the smells that make you light-headed are not merely annoying. In pregnancy there is no need to give up manicures, but pick a place with extraction or open windows, ask for plain polish instead of acrylic and do not sit through someone else’s filing. The same goes for the people who work there every day.',
    audiences: ['women'],
    skin_types: ['all'],
    concerns: ['nails'],
    regions: ['global'],
    sources: [],
    needs_source: true,
  },
  {
    slug: 'nails-ridges-and-white-spots-are-usually-harmless',
    area: 'nails',
    title_el: 'Ραβδώσεις και λευκά στίγματα: συνήθως αθώα',
    title_en: 'Ridges and white spots: usually harmless',
    body_el:
      'Οι κάθετες ραβδώσεις πληθαίνουν με την ηλικία και είναι φυσιολογικές· τα λευκά στίγματα είναι σχεδόν πάντα μικροτραυματισμοί της βάσης του νυχιού από πριν εβδομάδες — όχι έλλειψη ασβεστίου. Τα σημάδια που θέλουν γιατρό είναι άλλα: οριζόντια αυλάκια σε όλα τα νύχια, σκούρα γραμμή που δεν μεγαλώνει προς τα έξω, νύχια που κυρτώνουν σαν κουτάλι ή σαν ρολόι. Τα νύχια είναι παράθυρο στην υγεία, αλλά τα περισσότερα «σημάδια» είναι απλώς ζωή.',
    body_en:
      'Vertical ridges multiply with age and are normal; white spots are almost always small injuries to the nail base from weeks ago — not a calcium deficiency. The signs that need a doctor are different: horizontal grooves across all nails, a dark streak that does not grow out, nails curving like a spoon or a watch glass. Nails are a window on health, but most “signs” are just life.',
    audiences: ['all'],
    skin_types: ['all'],
    concerns: ['nails'],
    regions: ['global'],
    sources: ['https://medlineplus.gov/naildiseases.html'],
    needs_source: false,
  },
  {
    slug: 'nails-toenails-cut-straight-across',
    area: 'nails',
    title_el: 'Νύχια ποδιών: ίσιο κόψιμο, όχι στρογγυλεμένο',
    title_en: 'Toenails: cut straight across, not rounded',
    body_el:
      'Το νύχι του μεγάλου δαχτύλου που κόβεται στρογγυλά ή πολύ κοντά βυθίζεται στο πλαϊνό δέρμα και γίνεται «είσφρυση» — επώδυνη και εύκολα μολυσμένη. Κόψε ίσια, στο ύψος της άκρης του δαχτύλου, και λιμάρισε μόνο τις γωνίες ελαφρά. Στενά παπούτσια και ιδρωμένες κάλτσες χειροτερεύουν τα πράγματα· ένα νύχι που κοκκινίζει και πονά χρειάζεται γιατρό, όχι «χειρουργείο» στο μπάνιο.',
    body_en:
      'A big toenail cut rounded or too short digs into the skin beside it and becomes ingrown — painful and easily infected. Cut straight across at the level of the toe tip and file only the corners lightly. Tight shoes and sweaty socks make it worse; a nail that reddens and hurts needs a doctor, not bathroom surgery.',
    audiences: ['all'],
    skin_types: ['all'],
    concerns: ['nails'],
    regions: ['global'],
    sources: ['https://www.nhs.uk/conditions/ingrown-toenail/'],
    needs_source: false,
  },
  {
    slug: 'nails-hand-cream-after-every-wash',
    area: 'nails',
    title_el: 'Κρέμα χεριών μετά από κάθε πλύσιμο, μέχρι τα επωνύχια',
    title_en: 'Hand cream after every wash, right up to the cuticles',
    body_el:
      'Τα χέρια πλένονται δέκα φορές τη μέρα και δεν έχουν σχεδόν καθόλου σμηγματογόνους αδένες στην παλάμη, γι’ αυτό σκάνε πρώτα τον χειμώνα. Ένα μικρό σωληνάριο δίπλα σε κάθε νιπτήρα και στην τσάντα κάνει την κρέμα αντανακλαστικό, όχι αγγαρεία. Το βράδυ μια πιο πλούσια κρέμα με ουρία και, για τις πολύ σκασμένες μέρες, βαμβακερά γάντια από πάνω.',
    body_en:
      'Hands are washed ten times a day and have almost no sebaceous glands on the palm, which is why they crack first in winter. A small tube by every sink and in your bag makes cream a reflex, not a chore. At night a richer cream with urea and, on the very cracked days, cotton gloves over it.',
    audiences: ['all'],
    skin_types: ['dry', 'all'],
    concerns: ['hands', 'nails', 'hydration'],
    regions: ['global'],
    sources: [AAD_DRY_SKIN],
    needs_source: false,
  },
]
