// OVERLAY 0011 — the skincare_tips additions (see ../0011-skincare-more.ts for the overlay header).
// Same rules as the base tips (../../skincare/tips.ts) and overlay 0002: 2–5 sentences per language,
// mainstream guidance, not medical advice, anything condition-specific points to a dermatologist or
// doctor, and EVERY tip cites at least one source the drafter opened on 2026-10-11 (AAD, NHS,
// MedlinePlus/NIH, EU law on eur-lex, peer-reviewed reviews on PubMed/PMC) — every host is on
// skincare.test.ts's allow-list. Erasable syntax only, explicit `.ts` imports.

import type { SkincareTipSeed } from '../../../types.ts'

const AAD = 'https://www.aad.org/public'
const AAD_ADULT_ACNE = `${AAD}/diseases/acne/really-acne/adult-acne`
const AAD_ACNE_MAKEUP = `${AAD}/diseases/acne/causes/makeup`
const AAD_ACNE_SKIN_COLOR = `${AAD}/diseases/acne/diy/skin-color`
const AAD_ACNE_PREGNANCY = `${AAD}/diseases/acne/derm-treat/pregnancy`
const AAD_ACNE_SCARS = `${AAD}/diseases/acne/derm-treat/scars`
const AAD_DARK_SPOTS = `${AAD}/everyday-care/skin-care-secrets/routine/fade-dark-spots`
const AAD_EXFOLIATE = `${AAD}/everyday-care/skin-care-secrets/routine/safely-exfoliate-at-home`
const AAD_PREGNANCY = `${AAD}/everyday-care/skin-care-secrets/routine/pregnancy-skin-care`
const AAD_MENOPAUSE = `${AAD}/everyday-care/skin-care-secrets/anti-aging/skin-care-during-menopause`
const AAD_RETINOID = `${AAD}/everyday-care/skin-care-secrets/anti-aging/retinoid-retinol`
const AAD_ANTI_AGING = `${AAD}/everyday-care/skin-care-secrets/anti-aging/selecting-anti-aging-products`
const AAD_MELASMA_TREAT = `${AAD}/diseases/a-z/melasma-treatment`
const AAD_MELASMA_SELF = `${AAD}/diseases/a-z/melasma-self-care`
const AAD_ROSACEA_TIPS = `${AAD}/diseases/rosacea/triggers/tips`
const AAD_ROSACEA_PREVENT = `${AAD}/diseases/rosacea/triggers/prevent`
const AAD_ROSACEA_KNOW = `${AAD}/diseases/rosacea/insider/things-to-know`
const AAD_SUNBURN = `${AAD}/everyday-care/injured-skin/burns/treat-sunburn`
const AAD_SUNSCREEN = `${AAD}/everyday-care/sun-protection/shade-clothing-sunscreen`
const AAD_SUNSCREEN_CHOOSE = `${AAD_SUNSCREEN}/choosing-right-sunscreen`
const AAD_SUNSCREEN_APPLY = `${AAD_SUNSCREEN}/how-to-apply-sunscreen`
const AAD_FACE_WASHING = `${AAD}/everyday-care/skin-care-basics/care/face-washing-101`
const AAD_DRY_SKIN = `${AAD}/everyday-care/skin-care-basics/dry/dermatologists-tips-relieve-dry-skin`
const AAD_HEALTHY_NAILS = `${AAD}/everyday-care/nail-care-secrets/basics/healthy-nail-tips`
const AAD_ARTIFICIAL_NAILS = `${AAD}/everyday-care/nail-care-secrets/basics/pedicures/reduce-artificial-nail-damage`
const AAD_MEN = 'https://www.aad.org/skin-care-basics/skin-care-for-men'
const AAD_GEL_MANICURE =
  'https://www.aad.org/media/news-releases/gel-manicures-dermatologists-share-tips-to-keep-nails-healthy'
const NHS = 'https://www.nhs.uk'
const NHS_SUNBURN = `${NHS}/conditions/sunburn/`
const NHS_SUN = `${NHS}/live-well/seasonal-health/sunscreen-and-sun-safety/`
const NHS_ROSACEA = `${NHS}/conditions/rosacea/`
const NHS_HEAT_RASH = `${NHS}/conditions/heat-rash-prickly-heat/`
const NHS_CONTACT_DERMATITIS = `${NHS}/conditions/contact-dermatitis/`
const NHS_EMOLLIENTS = `${NHS}/tests-and-treatments/emollients/`
const NHS_NAIL_PROBLEMS = `${NHS}/symptoms/nail-problems/`
const NHS_MENOPAUSE = `${NHS}/conditions/menopause-and-perimenopause/symptoms/`
const NHS_BENZOYL_PEROXIDE = `${NHS}/medicines/benzoyl-peroxide/`
const FDA_SUN_TIPS =
  'https://www.fda.gov/consumers/consumer-updates/tips-stay-safe-sun-sunscreen-sunglasses'
const FDA_SUNSCREEN =
  'https://www.fda.gov/drugs/understanding-over-counter-medicines/sunscreen-how-help-protect-your-skin-sun'
const EU_SUNSCREEN_CLAIMS = 'https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32006H0647'
const EU_COSMETICS_REGULATION =
  'https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32009R1223'
const EU_RETINOL_ARBUTIN_2024 = 'https://eur-lex.europa.eu/eli/reg/2024/996/oj'
const PMC_TRANEXAMIC_MELASMA = 'https://pmc.ncbi.nlm.nih.gov/articles/PMC6247725/'
const PMC_MELASMA_THERAPIES = 'https://pmc.ncbi.nlm.nih.gov/articles/PMC10718129/'
const PUBMED_BAKUCHIOL_TRIAL = 'https://pubmed.ncbi.nlm.nih.gov/29947134/'
const PUBMED_BAKUCHIOL_REVIEW = 'https://pubmed.ncbi.nlm.nih.gov/36176207/'
const PUBMED_AZELAIC_REVIEW = 'https://pubmed.ncbi.nlm.nih.gov/37550898/'
const PMC_BRITTLE_NAILS = 'https://pmc.ncbi.nlm.nih.gov/articles/PMC6994568/'
const ODS_BIOTIN = 'https://ods.od.nih.gov/factsheets/Biotin-HealthProfessional/'

export const SKINCARE_TIPS: readonly SkincareTipSeed[] = [
  // --- women · adult acne, hormones, perimenopause ---------------------------------------------------
  {
    slug: 'face-women-adult-acne-is-common',
    area: 'face',
    title_el: 'Ακμή στα 30 και στα 40: συχνή, και αντιμετωπίζεται',
    title_en: 'Acne in your 30s and 40s: common, and treatable',
    body_el:
      'Πολλές γυναίκες βγάζουν σπυράκια για πρώτη φορά μετά τα 25 ή τα ξαναβρίσκουν τότε. Οι αιτίες είναι συνήθως ορμονικές διακυμάνσεις (περίοδος, εγκυμοσύνη, περιεμμηνόπαυση, έναρξη ή διακοπή αντισύλληψης), το άγχος, η κληρονομικότητα και προϊόντα που φράζουν τους πόρους. Αν τίποτα δεν βοηθά, ένας δερματολόγος συνήθως συνδυάζει δύο ή περισσότερες θεραπείες.',
    body_en:
      'Many women get spots for the first time after 25, or see them return then. The usual causes are hormone shifts (periods, pregnancy, perimenopause, starting or stopping the pill), stress, family history and products that clog pores. If nothing helps, a dermatologist usually combines two or more treatments.',
    audiences: ['women'],
    skin_types: ['combination', 'oily', 'all'],
    concerns: ['acne'],
    regions: ['global'],
    sources: [AAD_ADULT_ACNE],
    needs_source: false,
  },
  {
    slug: 'face-women-adult-acne-check-labels',
    area: 'face',
    title_el: 'Ακμή ενηλίκων: διάβασε την ετικέτα κάθε κρέμας και make-up',
    title_en: 'Adult acne: read the label on every cream and make-up',
    body_el:
      'Ενυδατικές, αντηλιακά, καλλυντικά μακιγιάζ και προϊόντα μαλλιών μπορούν να φράξουν τους πόρους. Διάλεξε όσα γράφουν «μη φαγεσωρογόνο» (non-comedogenic) ή «χωρίς λιπαρά» (oil-free). Ξεβάφεσαι πάντα πριν τον ύπνο και καθαρίζεις τα πινέλα τακτικά.',
    body_en:
      'Moisturisers, sunscreens, make-up and hair products can all clog pores. Choose the ones labelled non-comedogenic or oil-free. Always take make-up off before bed and clean your brushes regularly.',
    audiences: ['women'],
    skin_types: ['oily', 'combination'],
    concerns: ['acne', 'pores'],
    regions: ['global'],
    sources: [AAD_ADULT_ACNE, AAD_ACNE_MAKEUP],
    needs_source: false,
  },
  {
    slug: 'face-women-perimenopause-skin-changes',
    area: 'face',
    title_el: 'Περιεμμηνόπαυση: το δέρμα αλλάζει πριν σταματήσει η περίοδος',
    title_en: 'Perimenopause: the skin changes before periods stop',
    body_el:
      'Τα χρόνια πριν την εμμηνόπαυση, η πτώση των ορμονών μπορεί να φέρει ξηρό δέρμα, φαγούρα, σπυράκια ή πιο έντονες κηλίδες. Ήπιο καθαριστικό αντί για σαπούνι, ενυδατική αμέσως μετά το μπάνιο και αντηλιακό κάθε μέρα είναι η βάση. Για τα υπόλοιπα συμπτώματα της περιεμμηνόπαυσης μίλησε με τον γιατρό σου.',
    body_en:
      'In the years before menopause, falling hormone levels can bring dry or itchy skin, breakouts or more noticeable dark spots. A mild cleanser instead of soap, moisturiser straight after bathing and daily sunscreen are the basis. For the other symptoms of perimenopause, talk to your doctor.',
    audiences: ['women'],
    skin_types: ['dry', 'all'],
    concerns: ['aging', 'hydration'],
    regions: ['global'],
    sources: [NHS_MENOPAUSE, AAD_MENOPAUSE],
    needs_source: false,
  },
  {
    slug: 'face-women-mature-skin-one-retinoid-slowly',
    area: 'face',
    title_el: 'Ώριμο δέρμα: ένα ρετινοειδές, σιγά σιγά, πάνω σε καλή ενυδάτωση',
    title_en: 'Mature skin: one retinoid, slowly, over good moisture',
    body_el:
      'Τα ρετινοειδή έχουν τα καλύτερα στοιχεία για λεπτές γραμμές και κηλίδες, αλλά ερεθίζουν πιο εύκολα το λεπτό, ξηρό δέρμα της εμμηνόπαυσης. Ξεκίνα με ρετινόλη ή ρετινάλη λίγα βράδια την εβδομάδα, πάνω ή κάτω από μια πλούσια κρέμα. Αν θέλεις ισχυρότερο ρετινοειδές με συνταγή, ρώτα δερματολόγο.',
    body_en:
      'Retinoids have the best evidence for fine lines and dark spots, but they irritate the thin, dry skin of menopause more easily. Start with retinol or retinal a few nights a week, over or under a rich cream. If you want a stronger prescription retinoid, ask a dermatologist.',
    audiences: ['women'],
    skin_types: ['dry', 'normal'],
    concerns: ['aging', 'texture'],
    regions: ['global'],
    sources: [AAD_RETINOID, AAD_MENOPAUSE],
    needs_source: false,
  },
  {
    slug: 'face-women-one-anti-ageing-concern-at-a-time',
    area: 'face',
    title_el: 'Αντιγήρανση: ένας στόχος τη φορά, όχι πέντε προϊόντα',
    title_en: 'Anti-ageing: one goal at a time, not five products',
    body_el:
      'Κανένα προϊόν δεν διορθώνει όλα τα σημάδια γήρανσης, και πολλά μαζί ερεθίζουν το δέρμα. Ξεκίνα από αντηλιακό και ενυδατική, και μετά διάλεξε έναν στόχο — γραμμές, κηλίδες ή χαλάρωση. Υποσχέσεις όπως «δέκα χρόνια νεότερη σε μια νύχτα» είναι πολύ καλές για να είναι αληθινές.',
    body_en:
      'No single product fixes every sign of ageing, and using many at once irritates the skin. Start with sunscreen and moisturiser, then pick one goal — lines, spots or sagging. Promises such as “ten years younger overnight” are too good to be true.',
    audiences: ['women', 'all'],
    skin_types: ['all'],
    concerns: ['aging'],
    regions: ['global'],
    sources: [AAD_ANTI_AGING],
    needs_source: false,
  },

  // --- women · pregnancy -------------------------------------------------------------------------------
  {
    slug: 'face-women-pregnancy-short-gentle-routine',
    area: 'face',
    title_el: 'Εγκυμοσύνη: μικρή, ήπια ρουτίνα και αντηλιακό με ορυκτά φίλτρα',
    title_en: 'Pregnancy: a short, gentle routine and a mineral sunscreen',
    body_el:
      'Στην εγκυμοσύνη το δέρμα συχνά γίνεται πιο ευαίσθητο, οπότε λιγότερα προϊόντα χωρίς άρωμα είναι καλύτερη ιδέα. Αζελαϊκό οξύ και γλυκολικό οξύ είναι από τις επιλογές που προτείνουν οι δερματολόγοι, μαζί με αντηλιακό με οξείδιο του ψευδαργύρου ή διοξείδιο του τιτανίου. Ρετινοειδή, ρετινόλη και υδροκινόνη μένουν εκτός, και κάθε αγωγή τη συζητάς με τον γυναικολόγο σου.',
    body_en:
      'In pregnancy the skin is often more sensitive, so fewer, fragrance-free products are a better idea. Azelaic acid and glycolic acid are among the options dermatologists suggest, with a zinc oxide or titanium dioxide sunscreen. Retinoids, retinol and hydroquinone stay out, and you discuss every treatment with your obstetrician.',
    audiences: ['women'],
    skin_types: ['all'],
    concerns: ['acne', 'pigmentation', 'general'],
    regions: ['global'],
    sources: [AAD_PREGNANCY, AAD_ACNE_PREGNANCY],
    needs_source: false,
  },
  {
    slug: 'face-women-pregnancy-melasma-often-fades',
    area: 'face',
    title_el: 'Οι κηλίδες της εγκυμοσύνης συχνά ξεθωριάζουν μετά τον τοκετό',
    title_en: 'Pregnancy patches often fade after the birth',
    body_el:
      'Οι ορμόνες της εγκυμοσύνης πυροδοτούν συχνά μέλασμα, που μπορεί να ξεθωριάσει μόνο του όταν τελειώσει η εγκυμοσύνη. Μέχρι τότε, σκιά, καπέλο και αντηλιακό με χρώμα κάθε μέρα, γιατί ο ήλιος το κάνει πιο σκούρο. Αν επιμένει μήνες μετά τον θηλασμό, ένας δερματολόγος έχει θεραπείες που δεν χρησιμοποιούνται στην εγκυμοσύνη.',
    body_en:
      'Pregnancy hormones often trigger melasma, which can fade on its own once the pregnancy is over. Until then, shade, a hat and a tinted sunscreen every day, because sun makes it darker. If it lingers months after breastfeeding, a dermatologist has treatments that are not used in pregnancy.',
    audiences: ['women'],
    skin_types: ['all'],
    concerns: ['pigmentation', 'sun'],
    regions: ['global'],
    sources: [AAD_MELASMA_TREAT, AAD_PREGNANCY],
    needs_source: false,
  },
  {
    slug: 'face-women-bakuchiol-not-tested-in-pregnancy',
    area: 'face',
    title_el: 'Μπακουχιόλη στην εγκυμοσύνη: «φυτικό» δεν σημαίνει ελεγμένο',
    title_en: 'Bakuchiol in pregnancy: “plant-based” does not mean tested',
    body_el:
      'Η μπακουχιόλη προβάλλεται ως «η ρετινόλη της εγκυμοσύνης», αλλά οι μελέτες της είναι λίγες, μικρές και δεν αφορούν έγκυες. Δεν είναι ρετινοειδές, όμως ούτε έχει αποδειχτεί ασφαλής για το έμβρυο. Μέχρι να υπάρξουν στοιχεία, ρώτα τον γυναικολόγο σου ή κράτα το αζελαϊκό οξύ.',
    body_en:
      'Bakuchiol is marketed as “the pregnancy retinol”, but its studies are few, small and do not include pregnant women. It is not a retinoid, yet it has not been shown to be safe for the baby either. Until there is evidence, ask your obstetrician or stick with azelaic acid.',
    audiences: ['women'],
    skin_types: ['all'],
    concerns: ['aging', 'general'],
    regions: ['global'],
    sources: [PUBMED_BAKUCHIOL_REVIEW, AAD_PREGNANCY],
    needs_source: false,
  },

  // --- women · melasma, dark spots, make-up ---------------------------------------------------------
  {
    slug: 'face-women-melasma-tranexamic-acid',
    area: 'face',
    title_el: 'Τρανεξαμικό οξύ για το μέλασμα: τι δείχνουν οι μελέτες',
    title_en: 'Tranexamic acid for melasma: what the studies show',
    body_el:
      'Ανασκοπήσεις κλινικών μελετών δείχνουν ότι το τρανεξαμικό οξύ, σε κρέμα ή ορό 2–5 %, μειώνει το μέλασμα μέσα σε 8–12 εβδομάδες, με ήπιες παρενέργειες. Λειτουργεί μόνο μαζί με καθημερινό αντηλιακό, και οι κηλίδες μπορεί να επιστρέψουν όταν το σταματήσεις. Το τρανεξαμικό σε χάπι είναι φάρμακο με συνταγή — αν είχες ποτέ θρόμβο, πες το στον δερματολόγο.',
    body_en:
      'Reviews of clinical trials show that tranexamic acid, in a 2–5 % cream or serum, reduces melasma within 8–12 weeks with mild side effects. It works only alongside daily sunscreen, and the patches may come back when you stop. Tranexamic acid tablets are a prescription drug — if you have ever had a blood clot, tell the dermatologist.',
    audiences: ['women', 'all'],
    skin_types: ['all'],
    concerns: ['pigmentation'],
    regions: ['global'],
    sources: [PMC_TRANEXAMIC_MELASMA, PMC_MELASMA_THERAPIES, AAD_MELASMA_TREAT],
    needs_source: false,
  },
  {
    slug: 'face-women-melasma-comes-back-without-sun-care',
    area: 'face',
    title_el: 'Το μέλασμα ξαναγυρίζει αν χαλαρώσει η αντηλιακή προστασία',
    title_en: 'Melasma returns when sun protection slips',
    body_el:
      'Ακόμα και όταν ξεθωριάσει, το μέλασμα συχνά επιστρέφει με ένα καλοκαίρι χωρίς προστασία. Οι δερματολόγοι συστήνουν καθημερινά αντηλιακό SPF 30+ με οξείδιο του ψευδαργύρου, διοξείδιο του τιτανίου και οξείδια του σιδήρου, μαζί με καπέλο με φαρδύ γείσο και σκιά. Η ίδια προστασία χρειάζεται και τον χειμώνα, γιατί και το ορατό φως παίζει ρόλο.',
    body_en:
      'Even once it has faded, melasma often comes back after one unprotected summer. Dermatologists recommend a daily SPF 30+ sunscreen with zinc oxide, titanium dioxide and iron oxides, plus a wide-brimmed hat and shade. The same protection is needed in winter, because visible light plays a part too.',
    audiences: ['women'],
    skin_types: ['all'],
    concerns: ['pigmentation', 'sun'],
    regions: ['global'],
    sources: [AAD_MELASMA_TREAT, AAD_MELASMA_SELF],
    needs_source: false,
  },
  {
    slug: 'face-women-dark-spots-no-bleach-no-diy-peels',
    area: 'face',
    title_el: 'Κηλίδες: όχι χλωρίνη, όχι «σπιτικά» peeling',
    title_en: 'Dark spots: no bleach, no DIY peels',
    body_el:
      'Η χλωρίνη και τα σπιτικά «λευκαντικά» βλάπτουν το δέρμα και δεν πρέπει ποτέ να μπαίνουν στο πρόσωπο. Σε πιο σκούρα επιδερμίδα, ακόμα και ένα δυνατό peeling ή μια συσκευή μικροδερμοαπόξεσης στο σπίτι μπορεί να αφήσει μόνιμες σκούρες κηλίδες. Πρώτα αντιμετωπίζεται η αιτία (ακμή, έκζεμα) και μετά, με τη βοήθεια δερματολόγου, οι κηλίδες.',
    body_en:
      'Bleach and home-made “whitening” mixes harm the skin and must never go on the face. On darker skin, even a strong peel or an at-home microdermabrasion device can leave permanent dark marks. First the cause is treated (acne, eczema), then, with a dermatologist’s help, the spots.',
    audiences: ['women', 'all'],
    skin_types: ['all'],
    concerns: ['pigmentation'],
    regions: ['global'],
    sources: [AAD_DARK_SPOTS],
    needs_source: false,
  },
  {
    slug: 'face-women-tinted-sunscreen-instead-of-foundation',
    area: 'face',
    title_el: 'Αντηλιακό με χρώμα αντί για make-up τις καθημερινές',
    title_en: 'Tinted sunscreen instead of foundation on weekdays',
    body_el:
      'Ένα αντηλιακό με χρώμα και οξείδια του σιδήρου δίνει ελαφριά κάλυψη και προστατεύει και από το ορατό φως, κάτι που βοηθά όσες έχουν κηλίδες. Επειδή μπαίνει σε πλήρη ποσότητα, προστατεύει καλύτερα από ένα make-up με SPF. Ταιριάζει και σε όσες έχουν κοκκινίλες, γιατί το χρώμα τις καλύπτει.',
    body_en:
      'A tinted sunscreen with iron oxides gives light coverage and also protects against visible light, which helps anyone with dark spots. Because it goes on in full amount, it protects better than a foundation with SPF. It also suits skin with redness, because the tint covers it.',
    audiences: ['women'],
    skin_types: ['all'],
    concerns: ['sun', 'pigmentation', 'redness'],
    regions: ['global'],
    sources: [AAD_MELASMA_TREAT, AAD_SUNSCREEN_CHOOSE],
    needs_source: false,
  },
  {
    slug: 'face-women-spf-powder-and-primer-are-top-ups',
    area: 'face',
    title_el: 'Πούδρα και primer με SPF: συμπλήρωμα, όχι το κύριο αντηλιακό',
    title_en: 'SPF powder and primer: a top-up, not your main sunscreen',
    body_el:
      'Το SPF της ετικέτας μετριέται με γενναία ποσότητα, πολύ περισσότερη από όση βάζουμε από μια πούδρα ή ένα primer. Βάλε πρώτα ένα κανονικό αντηλιακό σε όλο το πρόσωπο και κράτα την πούδρα για ανανέωση πάνω από το μακιγιάζ. Στην παραλία η ανανέωση γίνεται με αντηλιακό, κάθε δύο ώρες και μετά το κολύμπι.',
    body_en:
      'The SPF on the label is measured with a generous layer, far more than anyone applies from a powder or a primer. Put a regular sunscreen over the whole face first and keep the powder for top-ups over make-up. At the beach, reapply real sunscreen every two hours and after swimming.',
    audiences: ['women'],
    skin_types: ['all'],
    concerns: ['sun'],
    regions: ['global'],
    sources: [AAD_SUNSCREEN_APPLY, FDA_SUNSCREEN],
    needs_source: false,
  },
  {
    slug: 'face-women-remove-eye-makeup-without-rubbing',
    area: 'face',
    title_el: 'Ντεμακιγιάζ ματιών: κράτα το βαμβάκι, μην τρίβεις',
    title_en: 'Eye make-up removal: hold the pad, do not rub',
    body_el:
      'Το δέρμα των βλεφάρων είναι από τα πιο λεπτά του σώματος, και το τρίψιμο το ερεθίζει. Μούσκεψε ένα βαμβάκι με ντεμακιγιάζ, κράτα το λίγα δευτερόλεπτα πάνω στο μάτι και σκούπισε απαλά προς τα κάτω. Μετά πλύνε το πρόσωπο με ήπιο καθαριστικό και τα δάχτυλά σου, όχι με πανάκι.',
    body_en:
      'Eyelid skin is among the thinnest on the body, and rubbing irritates it. Soak a pad with remover, hold it on the eye for a few seconds and wipe gently downwards. Then wash your face with a mild cleanser and your fingertips, not a washcloth.',
    audiences: ['women'],
    skin_types: ['all', 'sensitive'],
    concerns: ['general'],
    regions: ['global'],
    sources: [AAD_FACE_WASHING, AAD_ACNE_MAKEUP],
    needs_source: false,
  },
  {
    slug: 'face-women-acne-marks-fade-slowly',
    area: 'face',
    title_el: 'Τα σκούρα σημάδια της ακμής φεύγουν αργά — μην τα πειράζεις',
    title_en: 'Dark acne marks fade slowly — leave them alone',
    body_el:
      'Τα καφέ ή μωβ σημάδια που αφήνει ένα σπυράκι, ιδίως σε πιο σκούρο δέρμα, ξεθωριάζουν σε μήνες και σκουραίνουν με τον ήλιο. Μην σπας και μην ξύνεις τα σπυράκια, γιατί έτσι τα σημάδια γίνονται πιο έντονα. Αντηλιακό με χρώμα κάθε μέρα και ένα προϊόν όπως ρετινόλη ή αζελαϊκό οξύ βοηθούν· βαθιές ουλές θέλουν δερματολόγο.',
    body_en:
      'The brown or purple marks a spot leaves, especially on darker skin, fade over months and darken in the sun. Do not squeeze or pick spots, because that makes the marks stronger. Daily tinted sunscreen and a product such as retinol or azelaic acid help; deep scars need a dermatologist.',
    audiences: ['women', 'all'],
    skin_types: ['all'],
    concerns: ['acne', 'pigmentation'],
    regions: ['global'],
    sources: [AAD_DARK_SPOTS, AAD_ACNE_SKIN_COLOR, AAD_ACNE_SCARS],
    needs_source: false,
  },

  // --- men ----------------------------------------------------------------------------------------
  {
    slug: 'face-men-mild-cleanser-not-bar-soap',
    area: 'face',
    title_el: 'Για άντρες: ήπιο καθαριστικό προσώπου, όχι το σαπούνι του μπάνιου',
    title_en: 'For men: a mild face cleanser, not the bathroom soap',
    body_el:
      'Οι δερματολόγοι προτείνουν πλύσιμο κάθε μέρα και μετά την προπόνηση με ήπιο καθαριστικό προσώπου και χλιαρό νερό, όχι με κλασικό σαπούνι. Αν το δέρμα σου βγάζει σπυράκια, διάλεξε προϊόντα «oil-free» ή «μη φαγεσωρογόνα», κι αν είναι ευαίσθητο, «χωρίς άρωμα». Η ενυδατική μπαίνει όσο το δέρμα είναι ακόμα νωπό.',
    body_en:
      'Dermatologists suggest washing daily and after exercise with a mild face cleanser and lukewarm water, not ordinary bar soap. If your skin breaks out, pick oil-free or non-comedogenic products, and if it is sensitive, fragrance-free ones. Moisturiser goes on while the skin is still damp.',
    audiences: ['men'],
    skin_types: ['all'],
    concerns: ['general', 'acne'],
    regions: ['global'],
    sources: [AAD_MEN],
    needs_source: false,
  },
  {
    slug: 'face-men-fewer-blades-for-razor-bumps',
    area: 'face',
    title_el: 'Σπυράκια από το ξύρισμα; Δοκίμασε ξυράφι με μία ή δύο λεπίδες',
    title_en: 'Razor bumps? Try a single- or double-blade razor',
    body_el:
      'Τα ξυράφια με πολλές λεπίδες κόβουν την τρίχα πιο κοντά, κάτω από την επιφάνεια, και αυτό ευνοεί τις τρίχες που μπαίνουν μέσα. Αν βγάζεις σπυράκια ή κάψιμο, οι δερματολόγοι προτείνουν ξυράφι με μία ή δύο λεπίδες, βρεγμένο δέρμα, ενυδατικό αφρό και ξύρισμα με τη φορά της τρίχας. Άλλαζε λεπίδα κάθε πέντε με επτά ξυρίσματα.',
    body_en:
      'Multi-blade razors cut the hair closer, below the surface, which encourages ingrown hairs. If you get bumps or burn, dermatologists suggest a single- or double-blade razor, wet skin, a moisturising shaving cream and shaving with the grain. Change the blade every five to seven shaves.',
    audiences: ['men'],
    skin_types: ['all'],
    concerns: ['shaving', 'redness'],
    regions: ['global'],
    sources: [AAD_MEN],
    needs_source: false,
  },
  {
    slug: 'face-men-sunscreen-ears-neck-and-scalp',
    area: 'face',
    title_el: 'Αντηλιακό και στα αυτιά, τον σβέρκο και το κεφάλι',
    title_en: 'Sunscreen on the ears, the back of the neck and the scalp',
    body_el:
      'Τα αυτιά, ο σβέρκος και, σε όσους αραιώνουν τα μαλλιά, το κεφάλι είναι σημεία που καίγονται εύκολα και ξεχνιούνται. Βάλε εκεί αντηλιακό SPF 30+ ανθεκτικό στο νερό και ανανέωνε κάθε δύο ώρες έξω. Ένα καπέλο με φαρδύ γείσο καλύπτει ό,τι δεν φτάνει το χέρι.',
    body_en:
      'The ears, the back of the neck and, for men with thinning hair, the scalp burn easily and are often forgotten. Put water-resistant SPF 30+ there and reapply every two hours outdoors. A wide-brimmed hat covers what your hand cannot reach.',
    audiences: ['men', 'all'],
    skin_types: ['all'],
    concerns: ['sun'],
    regions: ['global'],
    sources: [AAD_SUNSCREEN_APPLY, AAD_MEN],
    needs_source: false,
  },

  // --- everyone · rosacea & sensitive skin -----------------------------------------------------------
  {
    slug: 'face-all-rosacea-ingredients-to-skip',
    area: 'face',
    title_el: 'Ροδόχρου: τα συστατικά που καλό είναι να αποφεύγεις',
    title_en: 'Rosacea: the ingredients best avoided',
    body_el:
      'Σε δέρμα με ροδόχρου οι δερματολόγοι προτείνουν να αποφεύγεις οινόπνευμα, καμφορά, άρωμα, γλυκολικό και γαλακτικό οξύ, μενθόλη, sodium lauryl sulfate και ουρία. Προτίμησε προϊόντα χωρίς άρωμα, για ευαίσθητη επιδερμίδα, και κρέμες αντί για τόνερ και στυπτικά. Η διάγνωση και η θεραπεία της ροδόχρου είναι δουλειά του δερματολόγου.',
    body_en:
      'For rosacea-prone skin, dermatologists suggest avoiding alcohol, camphor, fragrance, glycolic and lactic acid, menthol, sodium lauryl sulfate and urea. Prefer fragrance-free products made for sensitive skin, and creams over toners and astringents. Diagnosing and treating rosacea is a dermatologist’s job.',
    audiences: ['all'],
    skin_types: ['sensitive'],
    concerns: ['redness'],
    regions: ['global'],
    sources: [AAD_ROSACEA_TIPS],
    needs_source: false,
  },
  {
    slug: 'face-all-rosacea-test-new-products-for-a-week',
    area: 'face',
    title_el: 'Ροδόχρου: δοκίμασε κάθε νέο προϊόν στο μπράτσο για μία εβδομάδα',
    title_en: 'Rosacea: test each new product on your arm for a week',
    body_el:
      'Πριν βάλεις ένα νέο προϊόν στο πρόσωπο, άπλωσε λίγο στο εσωτερικό του μπράτσου κάθε μέρα για 7–10 μέρες. Αν δεν κοκκινίσει, δεν τσούξει και δεν πρηστεί, δοκίμασέ το σε μια μικρή περιοχή του προσώπου. Ένα νέο προϊόν τη φορά, ώστε να ξέρεις ποιο φταίει αν το δέρμα αντιδράσει, και ρώτα τον δερματολόγο σου αν η ροδόχρου επιμένει.',
    body_en:
      'Before a new product goes on your face, spread a little on the inside of your arm every day for 7–10 days. If it does not redden, sting or swell, try it on a small area of the face. One new product at a time, so you know which is to blame if your skin reacts, and ask your dermatologist if the rosacea persists.',
    audiences: ['all'],
    skin_types: ['sensitive'],
    concerns: ['redness'],
    regions: ['global'],
    sources: [AAD_ROSACEA_TIPS],
    needs_source: false,
  },
  {
    slug: 'face-all-rosacea-mineral-sunscreen-every-day',
    area: 'face',
    title_el: 'Ροδόχρου και ήλιος: ορυκτό αντηλιακό κάθε μέρα',
    title_en: 'Rosacea and sun: a mineral sunscreen every day',
    body_el:
      'Ο ήλιος είναι από τις πιο συχνές αιτίες έξαρσης της ροδόχρου. Οι δερματολόγοι προτείνουν αντηλιακό SPF 30+ με οξείδιο του ψευδαργύρου ή διοξείδιο του τιτανίου, που συνήθως ενοχλεί λιγότερο το ευαίσθητο δέρμα, μαζί με σκιά και καπέλο. Ένα κονσίλερ με πράσινη απόχρωση καμουφλάρει την κοκκινίλα, αν θέλεις.',
    body_en:
      'Sun is one of the most common rosacea flare triggers. Dermatologists suggest an SPF 30+ sunscreen with zinc oxide or titanium dioxide, which usually bothers sensitive skin less, plus shade and a hat. A green-tinted concealer can camouflage the redness if you wish.',
    audiences: ['all'],
    skin_types: ['sensitive'],
    concerns: ['redness', 'sun'],
    regions: ['global'],
    sources: [AAD_ROSACEA_TIPS, AAD_ROSACEA_PREVENT],
    needs_source: false,
  },
  {
    slug: 'face-all-rosacea-greek-summer-triggers',
    area: 'face',
    title_el: 'Ροδόχρου το ελληνικό καλοκαίρι: ζέστη, καυτά ροφήματα, αλκοόλ',
    title_en: 'Rosacea in a Greek summer: heat, hot drinks, alcohol',
    body_el:
      'Η ζέστη, ο ήλιος, τα καυτά ροφήματα, το αλκοόλ, τα πικάντικα φαγητά και η έντονη άσκηση είναι συχνοί πυροδότες της ροδόχρου. Το καλοκαίρι, κάνε σκιά, πίνε τον καφέ σου κρύο, γυμνάσου νωρίς το πρωί και δρόσιζε το πρόσωπο με δροσερό, όχι παγωμένο, νερό. Κράτα ημερολόγιο για να βρεις τους δικούς σου πυροδότες και δείξ’ το στον δερματολόγο.',
    body_en:
      'Heat, sun, hot drinks, alcohol, spicy food and strenuous exercise are common rosacea triggers. In summer, stay in the shade, have your coffee iced, exercise early in the morning and cool your face with cool, not icy, water. Keep a diary to find your own triggers and show it to your dermatologist.',
    audiences: ['all'],
    skin_types: ['sensitive'],
    concerns: ['redness'],
    regions: ['eu', 'global'],
    sources: [AAD_ROSACEA_PREVENT, NHS_ROSACEA, AAD_ROSACEA_KNOW],
    needs_source: false,
  },
  {
    slug: 'face-all-new-product-rash-stop-it',
    area: 'face',
    title_el: 'Κοκκινίλα και φαγούρα μετά από νέο προϊόν: σταμάτα το',
    title_en: 'Redness and itching after a new product: stop using it',
    body_el:
      'Ένα εξάνθημα με φαγούρα, κάψιμο ή ξηρότητα λίγες ώρες ή μέρες μετά από ένα νέο καλλυντικό μπορεί να είναι δερματίτιδα εξ επαφής, συχνά από άρωμα ή συντηρητικά. Σταμάτα το προϊόν, πλύνε απαλά και βάλε μια απλή, μαλακτική κρέμα χωρίς άρωμα. Αν δεν βελτιωθεί σε λίγες μέρες ή απλώνεται, πήγαινε σε γιατρό ή φαρμακοποιό.',
    body_en:
      'An itchy, burning or dry rash a few hours or days after a new cosmetic may be contact dermatitis, often from fragrance or preservatives. Stop the product, wash gently and apply a plain, fragrance-free emollient. If it does not improve within a few days or keeps spreading, see a doctor or pharmacist.',
    audiences: ['all'],
    skin_types: ['sensitive', 'all'],
    concerns: ['redness'],
    regions: ['global'],
    sources: [NHS_CONTACT_DERMATITIS],
    needs_source: false,
  },
  {
    slug: 'face-all-emollient-smooth-it-on-do-not-rub',
    area: 'face',
    title_el: 'Μαλακτική κρέμα: απλώνεται απαλά, με τη φορά της τρίχας',
    title_en: 'Emollients: smooth them on, in the direction of hair growth',
    body_el:
      'Μια πλούσια μαλακτική κρέμα δουλεύει καλύτερα αμέσως μετά το πλύσιμο, όταν έχεις ταμπονάρει το δέρμα. Άπλωσέ την απαλά προς την κατεύθυνση που φυτρώνουν οι τρίχες, χωρίς τρίψιμο, για να μη φράξουν οι θύλακοι. Μακριά από φλόγες και τσιγάρα: τα υφάσματα που έχουν απορροφήσει κρέμα πιάνουν φωτιά πιο εύκολα.',
    body_en:
      'A rich emollient works best straight after washing, once you have patted the skin dry. Smooth it on gently in the direction the hair grows, without rubbing, so follicles do not get blocked. Keep away from flames and cigarettes: fabrics that have soaked up cream catch fire more easily.',
    audiences: ['all'],
    skin_types: ['dry', 'sensitive'],
    concerns: ['hydration'],
    regions: ['global'],
    sources: [NHS_EMOLLIENTS, AAD_DRY_SKIN],
    needs_source: false,
  },

  // --- everyone · sun, after-sun, Greek summer ------------------------------------------------------
  {
    slug: 'face-all-sunburn-cool-moisturise-drink',
    area: 'face',
    title_el: 'Κάηκες; Δροσιά, ενυδατική χωρίς άρωμα και νερό',
    title_en: 'Sunburnt? Cool water, unperfumed moisturiser, plenty to drink',
    body_el:
      'Βγες από τον ήλιο και δρόσισε το δέρμα με δροσερό ντους ή υγρή πετσέτα — όχι με πάγο. Βάλε gel για μετά τον ήλιο ή ενυδατική χωρίς άρωμα όσο το δέρμα είναι νωπό, πιες άφθονο νερό και απόφυγε το αλκοόλ. Κράτα την καμένη περιοχή καλυμμένη από τον ήλιο μέχρι να επουλωθεί.',
    body_en:
      'Get out of the sun and cool the skin with a cool shower or a damp towel — not ice. Apply after-sun gel or an unperfumed moisturiser while the skin is damp, drink plenty of water and avoid alcohol. Keep the burnt area covered from the sun until it has healed.',
    audiences: ['all'],
    skin_types: ['all'],
    concerns: ['sun', 'redness'],
    regions: ['global'],
    sources: [NHS_SUNBURN, AAD_SUNBURN],
    needs_source: false,
  },
  {
    slug: 'face-all-sunburn-do-not-pop-blisters',
    area: 'face',
    title_el: 'Έγκαυμα από τον ήλιο: μη σπας φουσκάλες, μην ξεφλουδίζεις',
    title_en: 'Sunburn: do not pop blisters or peel the skin',
    body_el:
      'Οι φουσκάλες σημαίνουν πιο βαθύ έγκαυμα και προστατεύουν το δέρμα από τις λοιμώξεις, γι’ αυτό δεν τις σπάμε. Μην ξύνεις και μην τραβάς το δέρμα που ξεφλουδίζει, και απόφυγε προϊόντα με αναισθητικά «-καΐνη», που ερεθίζουν. Μέχρι να επουλωθεί, άφησε στην άκρη οξέα και ρετινοειδή.',
    body_en:
      'Blisters mean a deeper burn and protect the skin from infection, so do not pop them. Do not scratch or pull at peeling skin, and avoid “-caine” numbing products, which can irritate. Until it heals, put acids and retinoids aside.',
    audiences: ['all'],
    skin_types: ['all'],
    concerns: ['sun'],
    regions: ['global'],
    sources: [AAD_SUNBURN, NHS_SUNBURN],
    needs_source: false,
  },
  {
    slug: 'face-all-sunburn-when-to-get-help',
    area: 'face',
    title_el: 'Πότε ένα έγκαυμα από τον ήλιο θέλει γιατρό',
    title_en: 'When sunburn needs a doctor',
    body_el:
      'Ζήτα βοήθεια αν το δέρμα έχει φουσκάλες σε μεγάλη έκταση ή πρήζεται, αν έχεις πυρετό, ρίγη, ζάλη, πονοκέφαλο, ναυτία ή κράμπες. Αυτά μπορεί να σημαίνουν θερμική εξάντληση ή θερμοπληξία, που είναι σοβαρές καταστάσεις. Τα μωρά και τα μικρά παιδιά με έγκαυμα τα βλέπει πάντα γιατρός.',
    body_en:
      'Get help if the skin is widely blistered or swollen, or if you have a fever, chills, dizziness, a headache, nausea or cramps. These can mean heat exhaustion or heatstroke, which are serious. Babies and young children with sunburn should always be seen by a doctor.',
    audiences: ['all'],
    skin_types: ['all'],
    concerns: ['sun'],
    regions: ['global'],
    sources: [NHS_SUNBURN, AAD_SUNBURN],
    needs_source: false,
  },
  {
    slug: 'face-all-heat-rash-keep-cool',
    area: 'face',
    title_el: 'Ιδρωτοφουσκάλες το καλοκαίρι: δροσιά και ελαφριά ρούχα',
    title_en: 'Heat rash in summer: keep cool, wear loose clothes',
    body_el:
      'Τα μικρά κόκκινα σπυράκια που τσιμπάνε στη ζέστη και την υγρασία είναι συνήθως ιδρωτοφουσκάλες. Φόρα φαρδιά βαμβακερά ρούχα, κάνε δροσερά ντους, πίνε νερό και απόφυγε αφρόλουτρα και κρέμες με άρωμα. Μην ξύνεις, και αν δεν βελτιωθεί σε λίγες μέρες ρώτα φαρμακοποιό ή γιατρό.',
    body_en:
      'Small, prickly red spots in heat and humidity are usually heat rash. Wear loose cotton clothes, take cool showers, drink water and avoid perfumed shower gels and creams. Do not scratch, and if it does not improve in a few days, ask a pharmacist or doctor.',
    audiences: ['all'],
    skin_types: ['all'],
    concerns: ['redness', 'sun'],
    regions: ['eu', 'global'],
    sources: [NHS_HEAT_RASH],
    needs_source: false,
  },
  {
    slug: 'face-all-spray-sunscreen-into-your-hands-for-the-face',
    area: 'face',
    title_el: 'Αντηλιακό σπρέι: για το πρόσωπο, πρώτα στις παλάμες',
    title_en: 'Spray sunscreen: for the face, into your palms first',
    body_el:
      'Μην ψεκάζεις αντηλιακό κατευθείαν στο πρόσωπο, για να μην το εισπνεύσεις και να μην πάει στα μάτια. Ψέκασε στις παλάμες και άπλωσε. Στο σώμα, ψέκασε μέχρι να γυαλίσει το δέρμα και άπλωσε με το χέρι, γιατί ο αέρας παίρνει μεγάλο μέρος.',
    body_en:
      'Do not spray sunscreen straight at your face, so you do not breathe it in or get it in your eyes. Spray it into your palms and spread it on. On the body, spray until the skin glistens and rub it in, because the wind carries a lot away.',
    audiences: ['all'],
    skin_types: ['all'],
    concerns: ['sun'],
    regions: ['global'],
    sources: [AAD_SUNSCREEN_APPLY, FDA_SUN_TIPS],
    needs_source: false,
  },
  {
    slug: 'face-all-water-resistant-is-not-waterproof',
    area: 'face',
    title_el: 'Αντηλιακό «ανθεκτικό στο νερό» δεν σημαίνει ότι δεν φεύγει',
    title_en: '“Water-resistant” sunscreen still comes off',
    body_el:
      'Στην ΕΕ η σύσταση για τις ετικέτες λέει ότι κανένα αντηλιακό δεν δίνει «πλήρη» προστασία, οπότε όροι όπως «sunblock» ή «100 % προστασία» δεν πρέπει να εμφανίζονται. Στις ΗΠΑ το «ανθεκτικό στο νερό» (water resistant) σημαίνει ότι κρατάει 40 ή 80 λεπτά στο νερό. Μετά το κολύμπι, τον ιδρώτα ή το σκούπισμα με πετσέτα, ξαναβάζεις.',
    body_en:
      'In the EU, the labelling recommendation says no sunscreen gives “total” protection, so terms like “sunblock” or “100 % protection” should not appear. In the US, “water resistant” means it lasts 40 or 80 minutes in water. After swimming, sweating or towelling off, put it on again.',
    audiences: ['all'],
    skin_types: ['all'],
    concerns: ['sun'],
    regions: ['eu', 'us'],
    sources: [EU_SUNSCREEN_CLAIMS, FDA_SUNSCREEN],
    needs_source: false,
  },
  {
    slug: 'face-all-greek-summer-sunscreen-in-the-bag',
    area: 'face',
    title_el: 'Ελληνικό καλοκαίρι: το αντηλιακό μένει στην τσάντα, όχι στο σπίτι',
    title_en: 'Greek summer: the sunscreen lives in your bag, not at home',
    body_el:
      'Ένα πρωινό στρώμα δεν φτάνει για μια μέρα στην παραλία, στο νησί ή στη βόλτα στο κέντρο. Κράτα ένα μικρό αντηλιακό ή ένα στικ στην τσάντα και ανανέωνε κάθε δύο ώρες έξω, και πάντα μετά τη θάλασσα. Όταν ο δείκτης UV είναι υψηλός (3+), προτίμησε τη σκιά, ειδικά γύρω στο μεσημέρι.',
    body_en:
      'One morning layer is not enough for a day at the beach, on an island or walking around town. Keep a small sunscreen or a stick in your bag and reapply every two hours outdoors, and always after the sea. When the UV index is high (3+), seek shade, especially around midday.',
    audiences: ['all'],
    skin_types: ['all'],
    concerns: ['sun'],
    regions: ['eu', 'global'],
    sources: [NHS_SUN, AAD_SUNSCREEN_APPLY],
    needs_source: false,
  },

  // --- everyone · actives & EU rules ----------------------------------------------------------------
  {
    slug: 'face-all-eu-retinol-cap-0-3-percent',
    area: 'face',
    title_el: 'Ρετινόλη στην ΕΕ: έως 0,3 % RE στα καλλυντικά, 0,05 % στις λοσιόν σώματος',
    title_en: 'Retinol in the EU: up to 0.3 % RE in cosmetics, 0.05 % in body lotions',
    body_el:
      'Ο Κανονισμός (ΕΕ) 2024/996 βάζει όριο 0,05 % σε ισοδύναμα ρετινόλης (RE) για τη ρετινόλη και τους εστέρες της στις λοσιόν σώματος, και 0,3 % RE σε όλα τα άλλα καλλυντικά που παραμένουν ή ξεβγάζονται. Προϊόντα εκτός ορίων δεν μπαίνουν στην αγορά από τον Νοέμβριο του 2025 και πρέπει να έχουν αποσυρθεί ως τον Μάιο του 2027. Περισσότερη ρετινόλη δεν σημαίνει καλύτερο αποτέλεσμα, μόνο περισσότερο ερεθισμό· ισχυρότερα ρετινοειδή δίνει ο δερματολόγος με συνταγή.',
    body_en:
      'Regulation (EU) 2024/996 caps retinol and its esters at 0.05 % retinol equivalent (RE) in body lotions and 0.3 % RE in other leave-on and rinse-off cosmetics. Non-compliant products cannot be placed on the market from November 2025 and must be off the shelves by May 2027. More retinol does not mean better results, only more irritation. Stronger retinoids come from a dermatologist on prescription.',
    audiences: ['all'],
    skin_types: ['all'],
    concerns: ['aging'],
    regions: ['eu'],
    sources: [EU_RETINOL_ARBUTIN_2024, AAD_RETINOID],
    needs_source: false,
  },
  {
    slug: 'face-all-eu-limits-on-brightening-actives',
    area: 'face',
    title_el: 'Λευκαντικά συστατικά στην ΕΕ: όρια για άλφα-αρμπουτίνη και κογικό οξύ',
    title_en: 'Brightening actives in the EU: limits for alpha-arbutin and kojic acid',
    body_el:
      'Από το 2025 η ΕΕ επιτρέπει έως 2 % άλφα-αρμπουτίνη και 7 % αρμπουτίνη σε κρέμες προσώπου, και έως 1 % κογικό οξύ σε προϊόντα προσώπου και χεριών. Προϊόντα από το διαδίκτυο ή από χώρες εκτός ΕΕ μπορεί να μην τηρούν αυτά τα όρια ή να περιέχουν απαγορευμένες ουσίες. Αγόραζε από φαρμακεία και καταστήματα με ετικέτα στα ελληνικά και πλήρη λίστα συστατικών.',
    body_en:
      'Since 2025 the EU allows up to 2 % alpha-arbutin and 7 % arbutin in face creams, and up to 1 % kojic acid in face and hand products. Products from the internet or from outside the EU may not respect these limits or may contain banned substances. Buy from pharmacies and shops with a label in your language and a full ingredient list.',
    audiences: ['all', 'women'],
    skin_types: ['all'],
    concerns: ['pigmentation'],
    regions: ['eu'],
    sources: [EU_RETINOL_ARBUTIN_2024, EU_COSMETICS_REGULATION],
    needs_source: false,
  },
  {
    slug: 'face-all-azelaic-acid-for-redness-spots-and-marks',
    area: 'face',
    title_el: 'Αζελαϊκό οξύ: ένα συστατικό για κοκκινίλα, σπυράκια και κηλίδες',
    title_en: 'Azelaic acid: one ingredient for redness, spots and marks',
    body_el:
      'Μια συστηματική ανασκόπηση βρήκε ότι το αζελαϊκό οξύ βοηθά στην ακμή, στην κοκκινίλα της ροδόχρου και στο μέλασμα, με ήπιο και παροδικό τσούξιμο ως συνηθέστερη παρενέργεια. Τα καλλυντικά στην αγορά έχουν συνήθως έως 10 %, ενώ οι πιο ισχυρές μορφές δίνονται με συνταγή. Για ροδόχρου ή μέλασμα, ζήτα τη γνώμη δερματολόγου για τη σωστή μορφή.',
    body_en:
      'A systematic review found that azelaic acid helps acne, rosacea redness and melasma, with mild, short-lived stinging as the most common side effect. Cosmetics usually contain up to 10 %, while stronger forms are prescribed. For rosacea or melasma, ask a dermatologist about the right form.',
    audiences: ['all'],
    skin_types: ['all', 'sensitive'],
    concerns: ['redness', 'acne', 'pigmentation'],
    regions: ['global'],
    sources: [PUBMED_AZELAIC_REVIEW, AAD_MELASMA_TREAT],
    needs_source: false,
  },
  {
    slug: 'face-all-bakuchiol-what-the-evidence-says',
    area: 'face',
    title_el: 'Μπακουχιόλη: τι λένε πραγματικά οι μελέτες',
    title_en: 'Bakuchiol: what the studies actually say',
    body_el:
      'Σε μια μικρή τυχαιοποιημένη μελέτη 12 εβδομάδων, η μπακουχιόλη 0,5 % δύο φορές τη μέρα βελτίωσε τις ρυτίδες και τις κηλίδες περίπου όσο η ρετινόλη 0,5 %, με λιγότερο ξεφλούδισμα και τσούξιμο. Οι μελέτες είναι ακόμη λίγες, άρα είναι μια λογική εναλλακτική για όποιον δεν αντέχει τη ρετινόλη, όχι μια αποδεδειγμένα ισότιμη αντικατάσταση. Όπως με κάθε νέο προϊόν, κάνε πρώτα τεστ.',
    body_en:
      'In a small 12-week randomised trial, 0.5 % bakuchiol twice a day improved wrinkles and dark spots about as much as 0.5 % retinol, with less peeling and stinging. The studies are still few, so it is a reasonable alternative for anyone who cannot tolerate retinol, not a proven equal replacement. As with any new product, patch test first.',
    audiences: ['all'],
    skin_types: ['sensitive', 'all'],
    concerns: ['aging', 'pigmentation'],
    regions: ['global'],
    sources: [PUBMED_BAKUCHIOL_TRIAL, PUBMED_BAKUCHIOL_REVIEW],
    needs_source: false,
  },
  {
    slug: 'face-all-benzoyl-peroxide-bleaches-fabric',
    area: 'face',
    title_el: 'Υπεροξείδιο του βενζοϋλίου: προσοχή στις πετσέτες και τα μαξιλάρια',
    title_en: 'Benzoyl peroxide: mind your towels and pillowcases',
    body_el:
      'Το υπεροξείδιο του βενζοϋλίου είναι από τα πιο τεκμηριωμένα για την ακμή, αλλά ξεβάφει πετσέτες, μαξιλαροθήκες, ρούχα και μαλλιά. Χρησιμοποίησε λευκές πετσέτες, άφησέ το να στεγνώσει πριν ακουμπήσεις υφάσματα και ξεκίνα με χαμηλή συγκέντρωση. Κάνει το δέρμα πιο ευαίσθητο στον ήλιο, οπότε αντηλιακό κάθε πρωί.',
    body_en:
      'Benzoyl peroxide is one of the best-studied acne treatments, but it bleaches towels, pillowcases, clothes and hair. Use white towels, let it dry before it touches fabric and start with a low strength. It makes the skin more sensitive to the sun, so wear sunscreen every morning.',
    audiences: ['all'],
    skin_types: ['oily', 'combination'],
    concerns: ['acne'],
    regions: ['global'],
    sources: [NHS_BENZOYL_PEROXIDE],
    needs_source: false,
  },
  {
    slug: 'face-all-darker-skin-exfoliate-gently',
    area: 'face',
    title_el: 'Σκουρόχρωμη επιδερμίδα: ήπια απολέπιση, για να μη μείνουν κηλίδες',
    title_en: 'Darker skin: exfoliate gently, so no dark marks are left',
    body_el:
      'Σε πιο σκούρο δέρμα, μια επιθετική απολέπιση μπορεί να αφήσει σκούρες κηλίδες εκεί που ήθελες λάμψη. Διάλεξε ήπιο απολεπιστικό και κράτα το σε μία ή δύο φορές την εβδομάδα. Αν το δέρμα κοκκινίσει ή τσούξει, σταμάτα, και πριν από peeling ή laser μίλησε με δερματολόγο.',
    body_en:
      'On darker skin, aggressive exfoliation can leave dark marks where you wanted a glow. Choose a gentle exfoliant and keep it to once or twice a week. If the skin reddens or stings, stop, and before any peel or laser talk to a dermatologist.',
    audiences: ['all'],
    skin_types: ['all'],
    concerns: ['texture', 'pigmentation'],
    regions: ['global'],
    sources: [AAD_EXFOLIATE, AAD_DARK_SPOTS],
    needs_source: false,
  },
  {
    slug: 'face-all-price-is-not-quality',
    area: 'face',
    title_el: 'Η ακριβή κρέμα δεν είναι απαραίτητα καλύτερη',
    title_en: 'An expensive cream is not necessarily a better one',
    body_el:
      'Αποτελεσματικά προϊόντα περιποίησης υπάρχουν σε κάθε κατηγορία τιμής. Το «κλινικά αποδεδειγμένο» σημαίνει συνήθως ότι το δοκίμασαν καταναλωτές, όχι ότι το ενέκρινε κάποια αρχή. Αντηλιακό, ήπιο καθαριστικό και ενυδατική από το φαρμακείο ή το σούπερ μάρκετ κάνουν τη μεγαλύτερη διαφορά.',
    body_en:
      'Effective skin care products exist at every price point. “Clinically proven” usually means consumers tried it, not that any authority approved it. Sunscreen, a mild cleanser and a moisturiser from the pharmacy or supermarket make the biggest difference.',
    audiences: ['all'],
    skin_types: ['all'],
    concerns: ['general'],
    regions: ['global'],
    sources: [AAD_ANTI_AGING],
    needs_source: false,
  },

  // --- nails ----------------------------------------------------------------------------------------
  {
    slug: 'nails-gel-manicure-hand-sunscreen-or-gloves',
    area: 'nails',
    title_el: 'Ημιμόνιμο: αντηλιακό ή γάντια για τα χέρια κάτω από τη λάμπα',
    title_en: 'Gel manicure: sunscreen or gloves for your hands under the lamp',
    body_el:
      'Οι λάμπες που «ψήνουν» το ημιμόνιμο εκπέμπουν υπεριώδη ακτινοβολία, και τα επαναλαμβανόμενα μανικιούρ αυξάνουν τη γήρανση και τον κίνδυνο καρκίνου του δέρματος στα χέρια. Βάλε αντηλιακό SPF 30+ ανθεκτικό στο νερό στα χέρια πριν, ή φόρα σκούρα γάντια με κομμένες άκρες.',
    body_en:
      'The lamps that cure gel polish give off UV light, and repeated manicures increase skin ageing and skin cancer risk on the hands. Put water-resistant SPF 30+ on your hands beforehand, or wear dark gloves with the fingertips cut off.',
    audiences: ['women', 'all'],
    skin_types: ['all'],
    concerns: ['nails', 'hands'],
    regions: ['global'],
    sources: [AAD_GEL_MANICURE, AAD_ARTIFICIAL_NAILS],
    needs_source: false,
  },
  {
    slug: 'nails-gel-soak-off-never-peel',
    area: 'nails',
    title_el: 'Το ημιμόνιμο μουλιάζει και φεύγει — δεν ξεκολλιέται',
    title_en: 'Gel polish is soaked off — never peeled off',
    body_el:
      'Όταν τραβάς ή ξύνεις το ημιμόνιμο που σηκώνεται, παίρνεις μαζί στρώσεις από την πλάκα του νυχιού. Ζήτα στο σαλόνι αφαίρεση με μούλιασμα σε ασετόνη και μην «πειράζεις» το βερνίκι που ξεφλουδίζει. Αν είσαι αλλεργική στην ασετόνη ή έχεις συχνά προβλήματα στα νύχια, προτίμησε κλασικό βερνίκι.',
    body_en:
      'When you pull or pick at lifting gel polish, layers of the nail plate come off with it. Ask the salon for acetone soak-off removal and do not pick at chipping polish. If you are allergic to acetone or often have nail problems, choose regular polish instead.',
    audiences: ['women'],
    skin_types: ['all'],
    concerns: ['nails'],
    regions: ['global'],
    sources: [AAD_GEL_MANICURE, AAD_ARTIFICIAL_NAILS],
    needs_source: false,
  },
  {
    slug: 'nails-artificial-nails-for-special-occasions',
    area: 'nails',
    title_el: 'Τεχνητά νύχια για τις ειδικές περιστάσεις, όχι για όλο τον χρόνο',
    title_en: 'Artificial nails for special occasions, not all year round',
    body_el:
      'Τα τεχνητά νύχια και το συνεχόμενο ημιμόνιμο δεν αφήνουν τα φυσικά νύχια να συνέλθουν. Οι δερματολόγοι προτείνουν να τα κρατάς για ειδικές περιστάσεις και, όταν τα βάζεις, να ζητάς gel που αφαιρείται με μούλιασμα, πιο ελαστικό από το ακρυλικό. Ζήτα επίσης να μην κόβονται τα επωνύχια, γιατί προστατεύουν από λοιμώξεις.',
    body_en:
      'Artificial nails and back-to-back gel manicures leave natural nails no time to recover. Dermatologists suggest saving them for special occasions and, when you do wear them, asking for soak-off gel, which is more flexible than acrylic. Also ask that your cuticles are not trimmed, because they protect against infection.',
    audiences: ['women'],
    skin_types: ['all'],
    concerns: ['nails'],
    regions: ['global'],
    sources: [AAD_ARTIFICIAL_NAILS],
    needs_source: false,
  },
  {
    slug: 'nails-brittle-nails-moisturise-the-plate',
    area: 'nails',
    title_el: 'Εύθραυστα νύχια: ενυδάτωσε την πλάκα, όχι μόνο τα χέρια',
    title_en: 'Brittle nails: moisturise the plate, not just the hands',
    body_el:
      'Τα νύχια που σχίζονται σε στρώσεις συχνά απλώς στεγνώνουν από το συνεχές βρέξιμο και στέγνωμα. Κρέμες με γλυκερίνη, ουρία, λανολίνη ή βαζελίνη, τριμμένες πάνω στο νύχι και γύρω του κάθε βράδυ, βοηθούν την πλάκα να κρατάει νερό. Κράτα τα νύχια κοντά, και αν σπάνε χωρίς λόγο ή αλλάζουν μορφή, δείξ’ τα σε γιατρό.',
    body_en:
      'Nails that split into layers have often simply dried out from constant wetting and drying. Creams with glycerin, urea, lanolin or petrolatum, rubbed into and around the nail every night, help the plate hold water. Keep nails short, and if they break for no reason or change shape, show them to a doctor.',
    audiences: ['all', 'women'],
    skin_types: ['all'],
    concerns: ['nails', 'hydration'],
    regions: ['global'],
    sources: [PMC_BRITTLE_NAILS, AAD_HEALTHY_NAILS],
    needs_source: false,
  },
  {
    slug: 'nails-cotton-under-vinyl-gloves-for-wet-work',
    area: 'nails',
    title_el: 'Για τις δουλειές με νερό: βαμβακερά γάντια μέσα σε γάντια βινυλίου',
    title_en: 'For wet work: cotton gloves under vinyl ones',
    body_el:
      'Η ανασκόπηση για τα εύθραυστα νύχια προτείνει βαμβακερά γάντια κάτω από γάντια βινυλίου για πιάτα και καθαριότητα, και χοντρά βαμβακερά για τις ξερές δουλειές. Τα κλειστά γάντια πάνω σε βρεγμένα χέρια μπορεί να κάνουν τα νύχια να σχίζονται, γι’ αυτό στέγνωνε καλά τα χέρια πριν. Μετά, κρέμα χεριών μέχρι τα επωνύχια.',
    body_en:
      'The review on brittle nails suggests cotton gloves under vinyl gloves for dishes and cleaning, and heavy cotton gloves for dry chores. Occlusive gloves over wet hands can make nails split, so dry your hands well first. Afterwards, hand cream right up to the cuticles.',
    audiences: ['all'],
    skin_types: ['all'],
    concerns: ['nails', 'hands'],
    regions: ['global'],
    sources: [PMC_BRITTLE_NAILS],
    needs_source: false,
  },
  {
    slug: 'nails-biotin-is-not-a-quick-fix',
    area: 'nails',
    title_el: 'Βιοτίνη για τα νύχια: λίγα στοιχεία και μια παγίδα στις εξετάσεις',
    title_en: 'Biotin for nails: thin evidence and a blood-test trap',
    body_el:
      'Οι μελέτες για τη βιοτίνη στα εύθραυστα νύχια είναι μικρές και χωρίς ομάδα ελέγχου, οπότε το όφελος δεν είναι αποδεδειγμένο. Οι υψηλές δόσεις μπορούν να αλλοιώσουν αποτελέσματα αιματολογικών εξετάσεων, όπως του θυρεοειδούς. Αν παίρνεις συμπλήρωμα βιοτίνης, πες το στον γιατρό πριν από κάθε εξέταση αίματος.',
    body_en:
      'Studies of biotin for brittle nails are small and lack control groups, so the benefit is unproven. High doses can distort blood test results, thyroid tests among them. If you take a biotin supplement, tell your doctor before any blood test.',
    audiences: ['all', 'women'],
    skin_types: ['all'],
    concerns: ['nails'],
    regions: ['global'],
    sources: [ODS_BIOTIN, PMC_BRITTLE_NAILS],
    needs_source: false,
  },
  {
    slug: 'nails-changes-worth-showing-a-doctor',
    area: 'nails',
    title_el: 'Αλλαγές στα νύχια που αξίζει να δει γιατρός',
    title_en: 'Nail changes worth showing a doctor',
    body_el:
      'Μια σκούρα γραμμή που εμφανίστηκε χωρίς χτύπημα, ένα νύχι που ξεκολλάει από το δέρμα, αλλαγές στο σχήμα ή στο χρώμα, ή πόνος και πρήξιμο γύρω από το νύχι θέλουν γιατρό. Οι περισσότερες αλλαγές στα νύχια είναι αθώες, αλλά κάποιες σχετίζονται με λοίμωξη ή άλλες παθήσεις. Μην τις καλύπτεις με βερνίκι μέχρι να τις δει κάποιος.',
    body_en:
      'A dark streak that appeared without an injury, a nail lifting off the skin, changes in shape or colour, or pain and swelling around the nail need a doctor. Most nail changes are harmless, but some are linked to infection or other conditions. Do not cover them with polish until someone has looked.',
    audiences: ['all'],
    skin_types: ['all'],
    concerns: ['nails'],
    regions: ['global'],
    sources: [NHS_NAIL_PROBLEMS],
    needs_source: false,
  },
  {
    slug: 'nails-hands-show-age-sunscreen-on-the-backs',
    area: 'nails',
    title_el: 'Τα χέρια δείχνουν την ηλικία: αντηλιακό και στη ράχη τους',
    title_en: 'Hands show age: sunscreen on the backs too',
    body_el:
      'Η ράχη των χεριών παίρνει ήλιο κάθε μέρα, στο τιμόνι, στο κινητό και στη βόλτα, και εκεί εμφανίζονται νωρίς οι κηλίδες. Βάλε αντηλιακό ή κρέμα χεριών με SPF το πρωί και ανανέωσέ τη μετά από κάθε πλύσιμο. Το ελληνικό καλοκαίρι, πάρε ένα μικρό σωληνάριο στην τσάντα.',
    body_en:
      'The backs of the hands catch sun every day, at the wheel, on the phone and out walking, and that is where spots appear early. Put on sunscreen or a hand cream with SPF in the morning and reapply after every wash. In a Greek summer, keep a small tube in your bag.',
    audiences: ['women', 'all'],
    skin_types: ['all'],
    concerns: ['hands', 'sun', 'nails'],
    regions: ['global'],
    sources: [AAD_SUNSCREEN_APPLY, AAD_GEL_MANICURE],
    needs_source: false,
  },
]
