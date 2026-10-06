// OVERLAY 0002 — the skincare_tips patches (see ../0002-tip-sources.ts for the overlay header). One
// module per table so each bundled table loader downloads only its own rows (../by-table/, perf
// 2026-10-06). Erasable syntax only, explicit `.ts` imports.

import type { SlugPatch } from '../types.ts'

const AAD = 'https://www.aad.org/public'
const AAD_SHAVE = `${AAD}/everyday-care/skin-care-basics/hair/how-to-shave`
const AAD_RAZOR_PREVENT = `${AAD}/everyday-care/skin-care-basics/hair/razor-bump-prevention`
const AAD_RAZOR_REMEDIES = `${AAD}/everyday-care/skin-care-basics/hair/razor-bump-remedies`
const AAD_BEARD = `${AAD}/everyday-care/skin-care-secrets/face/healthy-beard`
const AAD_ACNE_WORKOUTS = `${AAD}/diseases/acne/causes/workouts`
const AAD_ACNE_MAKEUP = `${AAD}/diseases/acne/causes/makeup`
const AAD_ACNE_WONT_CLEAR = `${AAD}/diseases/acne/diy/wont-clear`
const AAD_ACNE_HABITS = `${AAD}/diseases/acne/skin-care/habits-stop`
const AAD_ACNE_PREGNANCY = `${AAD}/diseases/acne/derm-treat/pregnancy`
const AAD_FACE_WASHING = `${AAD}/everyday-care/skin-care-basics/care/face-washing-101`
const AAD_ORDER = `${AAD}/everyday-care/skin-care-basics/care/apply-skin-care-certain-order`
const AAD_OILY = `${AAD}/everyday-care/skin-care-basics/dry/oily-skin`
const AAD_HEALTHIER = `${AAD}/everyday-care/skin-care-secrets/routine/healthier-looking-skin`
const AAD_BRUSHES = `${AAD}/everyday-care/skin-care-secrets/routine/clean-your-makeup-brushes`
const AAD_PREGNANCY = `${AAD}/everyday-care/skin-care-secrets/routine/pregnancy-skin-care`
const AAD_MASKS = `${AAD}/everyday-care/skin-care-secrets/routine/facial-masks-and-skin-care`
const AAD_MENOPAUSE = `${AAD}/everyday-care/skin-care-secrets/anti-aging/skin-care-during-menopause`
const AAD_RETINOID = `${AAD}/everyday-care/skin-care-secrets/anti-aging/retinoid-retinol`
const AAD_MELASMA_SELF = `${AAD}/diseases/a-z/melasma-self-care`
const AAD_MELASMA_OVERVIEW = `${AAD}/diseases/a-z/melasma-overview`
const AAD_SUNSCREEN = `${AAD}/everyday-care/sun-protection/shade-clothing-sunscreen`
const AAD_SUNSCREEN_CHOOSE = `${AAD_SUNSCREEN}/choosing-right-sunscreen`
const AAD_SUNSCREEN_APPLY = `${AAD_SUNSCREEN}/how-to-apply-sunscreen`
const AAD_ECZEMA_SUMMER = `${AAD}/diseases/eczema/insider/eczema-summertime`
const AAD_SUMMER_HAIR = `${AAD}/everyday-care/hair-scalp-care/hair/summer-hair-care`
const AAD_TRIM_NAILS = `${AAD}/everyday-care/nail-care-secrets/basics/how-to-trim-nails`
const AAD_HEALTHY_NAILS = `${AAD}/everyday-care/nail-care-secrets/basics/healthy-nail-tips`
const MAYO_AGE_SPOTS =
  'https://www.mayoclinic.org/diseases-conditions/age-spots/symptoms-causes/syc-20355859'
const MEDLINE_TRETINOIN = 'https://medlineplus.gov/druginfo/meds/a682437.html'
const MEDLINE_ADAPALENE = 'https://medlineplus.gov/druginfo/meds/a604001.html'
const PMC_VITAMIN_C = 'https://pmc.ncbi.nlm.nih.gov/articles/PMC3673383/'
const PMC_NIACINAMIDE = 'https://pmc.ncbi.nlm.nih.gov/articles/PMC8389214/'
const PMC_SLEEP_FACE = 'https://pmc.ncbi.nlm.nih.gov/articles/PMC3738045/'
const PMC_SLEEP_RESTRICTED = 'https://pmc.ncbi.nlm.nih.gov/articles/PMC5451790/'
const CDC_NAIL_TECHNICIANS = 'https://www.cdc.gov/niosh/nail-technicians/about/index.html'
const FDA_NAIL_PRODUCTS = 'https://www.fda.gov/cosmetics/cosmetic-products/nail-care-products'

export const SKINCARE_TIPS: readonly SlugPatch<'skincare_tips'>[] = [
  // --- face · men ------------------------------------------------------------------------------
  {
    // softened: the "closer result for a few hours" claim dropped
    slug: 'face-men-shave-after-shower-with-the-grain',
    set: {
      body_el:
        'Το ξύρισμα στο τέλος του ντους, όταν η τρίχα είναι μαλακή, κάνει λιγότερο πιθανό να γυρίσει προς τα μέσα στο δέρμα και να βγάλει σπυράκια. Χρησιμοποίησε ενυδατικό αφρό ξυρίσματος και πέρνα το ξυράφι με τη φορά που φυτρώνει η τρίχα, χωρίς να πιέζεις. Το ξύρισμα κόντρα στην τρίχα φέρνει ερεθισμό, σπυράκια και κάψιμο.',
      body_en:
        'Shaving at the end of a shower, when the hair is soft, makes it less likely to curve back into the skin and cause bumps. Use a moisturising shaving cream and pass the razor in the direction the hair grows, without pressing. Shaving against the grain causes irritation, razor bumps and burn.',
      sources: [AAD_RAZOR_PREVENT, AAD_SHAVE],
      needs_source: false,
    },
  },
  {
    // softened: "five to eight shaves" → the AAD's five to seven
    slug: 'face-men-change-the-blade-often',
    set: {
      body_el:
        'Μια στομωμένη λεπίδα ερεθίζει το δέρμα και αυξάνει πολύ τον κίνδυνο για σπυράκια από το ξύρισμα. Άλλαξε λεπίδα, ή πέτα το ξυραφάκι μιας χρήσης, μετά από πέντε ως επτά ξυρίσματα. Ξέπλενε καλά το ξυράφι και άφησέ το να στεγνώσει εντελώς έξω από την ντουζιέρα — στο υγρό ξυράφι αναπτύσσονται βακτήρια.',
      body_en:
        'A dull blade irritates the skin and greatly raises the risk of razor bumps. Change the blade, or throw away a disposable razor, after five to seven shaves. Rinse the razor well and let it dry completely outside the shower — bacteria grow on a razor left wet.',
      sources: [AAD_SHAVE, AAD_RAZOR_REMEDIES],
      needs_source: false,
    },
  },
  {
    // rewritten: "barrier irritation, not germs", allantoin/panthenol and "every other day" are
    // not in any source; now the AAD's rinse → cool compress → soothing aftershave
    slug: 'face-men-razor-burn-cold-rinse-and-balm',
    set: {
      title_el: 'Κάψιμο από το ξύρισμα: δροσερή κομπρέσα και ήπια λοσιόν μετά',
      title_en: 'Razor burn: a cool compress and a soothing aftershave',
      body_el:
        'Το κάψιμο είναι δέρμα ερεθισμένο από τη λεπίδα. Ξέπλυνε τον αφρό με χλιαρό νερό και μετά κράτα ένα δροσερό, υγρό πανάκι πάνω στο ξυρισμένο δέρμα για λίγα λεπτά. Τελείωσε με μια καταπραϋντική λοσιόν για μετά το ξύρισμα, φτιαγμένη για να μειώνει τον ερεθισμό — αν καίει ή τσούζει, σταμάτησέ τη και δοκίμασε άλλη.',
      body_en:
        'Razor burn is skin irritated by the blade. Rinse off the shaving cream with warm water, then hold a cool, damp washcloth on the shaved skin for a few minutes. Finish with a soothing aftershave made to reduce irritation — if one burns or stings, stop using it and try another.',
      sources: [AAD_RAZOR_PREVENT, AAD_RAZOR_REMEDIES],
      needs_source: false,
    },
  },
  {
    // rewritten: the AAD advises washing face AND beard every day with a gentle cleanser — the
    // opposite of the old "two or three times a week". The slug now misdescribes the tip.
    slug: 'face-men-wash-the-beard-not-every-day',
    set: {
      title_el: 'Πλύνε τη γενειάδα κάθε μέρα — απαλά, με ήπιο καθαριστικό',
      title_en: 'Wash the beard daily — gently, with a mild cleanser',
      body_el:
        'Βρομιά, λιπαρότητα, νεκρά κύτταρα και ρύποι μαζεύονται κάθε μέρα στη γενειάδα και, αν μείνουν, μπορεί να φράξουν τους πόρους και να ερεθίσουν το δέρμα από κάτω. Οι δερματολόγοι συστήνουν πλύσιμο προσώπου και γενειάδας κάθε μέρα με ήπιο καθαριστικό για τον τύπο του δέρματός σου αντί για σαπούνι, ώστε να μην ξηραίνεται το δέρμα κάτω από τη γενειάδα. Κάνε μασάζ, ξέβγαλε καλά με χλιαρό νερό και σκούπισε ταμποναριστά, αφήνοντας το δέρμα ελαφρώς νωπό για την ενυδατική.',
      body_en:
        'Dirt, oil, dead skin and pollution build up in a beard every day and, left there, can clog pores and irritate the skin beneath. Dermatologists advise washing face and beard daily with a gentle cleanser made for your skin type rather than soap, so the skin under the beard does not dry out. Massage it in, rinse well with lukewarm water and pat dry, leaving the skin a little damp for your moisturiser.',
      sources: [AAD_BEARD],
      needs_source: false,
    },
  },
  {
    // softened: product choice by skin type and "use sparingly", as the AAD says
    slug: 'face-men-beard-oil-is-for-the-skin-underneath',
    set: {
      body_el:
        'Χωρίς ενυδάτωση, το δέρμα κάτω από τη γενειάδα μπορεί να γίνει ξηρό, να ξεφλουδίζει και να φαγουρίζει, και η γενειάδα να μοιάζει ξερή και να τσιμπάει. Αμέσως μετά το πλύσιμο, με το δέρμα ακόμη ελαφρώς νωπό, δούλεψε μέσα στη γενειάδα και ως το δέρμα λίγο λάδι γενειάδας (κανονικό ως ξηρό δέρμα), μαλακτικό γενειάδας (δέρμα με τάση για σπυράκια) ή ενυδατική χωρίς άρωμα (ευαίσθητο δέρμα). Βάλε λίγο — μπορείς πάντα να προσθέσεις.',
      body_en:
        'Without moisturiser, the skin beneath a beard can become dry, flaky and itchy, and the beard feels dry and prickly. Right after washing, while the skin is still slightly damp, work a little beard oil (normal to dry skin), beard conditioner (acne-prone skin) or a fragrance-free moisturiser (sensitive skin) through the beard and down to the skin. Use it sparingly — you can always add more.',
      sources: [AAD_BEARD],
      needs_source: false,
    },
  },
  {
    // softened: "within 20–30 minutes" → "as soon as you can"; the AAD's shower / change advice
    slug: 'face-men-rinse-after-the-gym',
    set: {
      title_el: 'Μετά το γυμναστήριο: ξέπλυνε τον ιδρώτα γρήγορα',
      title_en: 'After the gym: wash off the sweat soon',
      body_el:
        'Ο ιδρώτας, η λιπαρότητα και τα βακτήρια από άπλυτα ρούχα, πετσέτες ή κοινόχρηστα κράνη μπορεί να φράξουν τους πόρους και να φέρουν σπυράκια. Κάνε ντους όσο πιο σύντομα μπορείς μετά την προπόνηση — ή τουλάχιστον πλύνε το πρόσωπο με ήπιο καθαριστικό χωρίς έλαια — κι αν δεν γίνεται ντους, άλλαξε τα ρούχα της γυμναστικής. Κατά τη διάρκεια, ταμπόναρε τον ιδρώτα με καθαρή πετσέτα αντί να τρίβεις.',
      body_en:
        'Sweat, oil and bacteria from unwashed clothes, towels or shared helmets can clog pores and bring breakouts. Shower as soon as you can after training — or at least wash your face with a mild, oil-free cleanser — and if you cannot shower, change out of your workout clothes. During the session, pat sweat away with a clean towel instead of rubbing.',
      sources: [AAD_ACNE_WORKOUTS, AAD_FACE_WASHING],
      needs_source: false,
    },
  },
  // --- face · women ----------------------------------------------------------------------------
  {
    // softened: "eight hours", "better than nothing" and "mascara snaps the lashes" dropped
    slug: 'face-women-remove-makeup-every-night',
    set: {
      body_el:
        'Ο ύπνος με μακιγιάζ αφήνει χρωστικές, λιπαρότητα και βρομιά στο δέρμα όλη τη νύχτα — οι δερματολόγοι συστήνουν να αφαιρείς όλο το μακιγιάζ, και των ματιών, πριν τον ύπνο. Χρησιμοποίησε ντεμακιγιάζ χωρίς έλαια και μετά πλύνε το πρόσωπο με ήπιο καθαριστικό, χωρίς τρίψιμο. Μαντιλάκια ντεμακιγιάζ χωρίς έλαια δίπλα στο κρεβάτι κάνουν πιο εύκολες τις κουρασμένες βραδιές.',
      body_en:
        'Sleeping in make-up leaves pigment, oil and grime on your skin all night — dermatologists advise removing all of it, eye make-up included, before bed. Use an oil-free make-up remover, then wash your face with a gentle cleanser, without scrubbing. Oil-free remover wipes by the bed make the tired nights easier.',
      sources: [AAD_ACNE_MAKEUP, AAD_OILY],
      needs_source: false,
    },
  },
  {
    // rewritten: no source supports oil-cleanse-then-wash or "doubling dries you"; now the
    // AAD's remover-then-cleanser at night and "limit washing to twice a day"
    slug: 'face-women-double-cleanse-only-when-needed',
    set: {
      body_el:
        'Το βράδυ ο στόχος είναι να φύγουν το μακιγιάζ, το αντηλιακό και η βρομιά της μέρας, οπότε τότε έχει νόημα ο καθαρισμός σε δύο βήματα — πρώτα ντεμακιγιάζ, μετά ήπιο καθαριστικό. Το πρωί αρκεί ένα απαλό πλύσιμο: οι δερματολόγοι συστήνουν να περιορίζεις το πλύσιμο σε δύο φορές τη μέρα και μετά τον ιδρώτα. Χρησιμοποίησε τα δάχτυλα, χλιαρό νερό και καθαριστικό χωρίς οινόπνευμα, και μην τρίβεις.',
      body_en:
        'In the evening the aim is to remove make-up, sunscreen and the day’s grime, so a two-step cleanse — a make-up remover first, then a gentle cleanser — makes sense then. In the morning one gentle wash is enough: dermatologists advise limiting washing to twice a day and after sweating. Use your fingertips, lukewarm water and an alcohol-free cleanser, and do not scrub.',
      sources: [AAD_FACE_WASHING, AAD_HEALTHIER, AAD_ACNE_MAKEUP],
      needs_source: false,
    },
  },
  {
    // rewritten: niacinamide, hyaluronic and lactic acid are not in the AAD pregnancy pages;
    // now azelaic acid (thought safe), vitamin C + glycolic, mineral sunscreen; retinoids and
    // hydroquinone avoided
    slug: 'face-women-pregnancy-safe-actives',
    set: {
      body_el:
        'Πολλά προϊόντα περιποίησης είναι ασφαλή στην εγκυμοσύνη: το αζελαϊκό οξύ θεωρείται ασφαλές, και οι δερματολόγοι προτείνουν ένα προϊόν με βιταμίνη C το πρωί και ένα με γλυκολικό οξύ το βράδυ για τις αλλαγές στο χρώμα, μαζί με αντηλιακό με ορυκτά φίλτρα (οξείδιο του ψευδαργύρου, διοξείδιο του τιτανίου). Αποφεύγονται τα ρετινοειδή (και η ρετινόλη) και η υδροκινόνη. Το μέλασμα, η «μάσκα της εγκυμοσύνης», αντιμετωπίζεται πρώτα με σκιά, ρούχα που προστατεύουν από τον ήλιο και αντηλιακό κάθε μέρα. Ενημέρωσε τον γυναικολόγο και τον δερματολόγο σου για κάθε αγωγή που χρησιμοποιείς — όχι το φόρουμ.',
      body_en:
        'Many skin care products are safe in pregnancy: azelaic acid is thought to be safe, and dermatologists suggest a vitamin C product in the morning and a glycolic acid one in the evening for colour changes, with a mineral sunscreen (zinc oxide, titanium dioxide). Retinoids, retinol included, and hydroquinone are avoided. Melasma, the “mask of pregnancy”, is handled first with shade, sun-protective clothing and daily sunscreen. Tell your obstetrician and dermatologist about every treatment you use — not the forum.',
      sources: [AAD_PREGNANCY, AAD_ACNE_PREGNANCY],
      needs_source: false,
    },
  },
  {
    // softened: "SPF 50" → SPF 30+; "through windows" and "every treatment is wasted" →
    // the AAD's "to get results from treatment, protect your skin every day"
    slug: 'face-women-melasma-needs-tinted-sunscreen',
    set: {
      body_el:
        'Το μέλασμα — οι καφέ κηλίδες στα μάγουλα και το μέτωπο — πυροδοτείται από τον ήλιο, και έχει φανεί ότι το χειροτερεύει και το ορατό φως. Για το ορατό φως οι δερματολόγοι συστήνουν αντηλιακό με χρώμα που περιέχει οξείδια του σιδήρου και SPF 30 ή υψηλότερο, κάθε μέρα, ακόμη και με συννεφιά. Για να αποδώσει οποιαδήποτε θεραπεία χρειάζεται αυτή η προστασία καθημερινά· το πλάνο θεραπείας το φτιάχνει ο δερματολόγος.',
      body_en:
        'Melasma — brown patches on the cheeks and forehead — is triggered by sunlight, and visible light has been shown to worsen it too. Against visible light, dermatologists recommend a tinted sunscreen with iron oxide and SPF 30 or higher, every day, even when it is cloudy. To get results from any treatment you need that sun protection daily; a dermatologist can build the treatment plan.',
      sources: [AAD_MELASMA_SELF, AAD_MELASMA_OVERVIEW],
      needs_source: false,
    },
  },
  {
    // softened: "weekly" → every 7–10 days; soap → gentle shampoo; the sponge claims dropped
    slug: 'face-women-clean-brushes-and-sponges',
    set: {
      title_el: 'Πινέλα και σφουγγαράκια: πλύσιμο κάθε εβδομάδα περίπου',
      title_en: 'Brushes and sponges: wash them every week or so',
      body_el:
        'Τα πινέλα και τα σφουγγαράκια του μακιγιάζ μαζεύουν προϊόν, λιπαρότητα και νεκρά κύτταρα και γίνονται εστία βακτηρίων, που μπορεί να φέρουν σπυράκια, εξανθήματα, ακόμη και λοιμώξεις. Πλύνε τα κάθε 7 με 10 μέρες σε χλιαρό νερό με λίγο ήπιο σαμπουάν — το σκέτο σαπούνι ξηραίνει τις τρίχες — και ξέβγαλε ώσπου το νερό να τρέχει καθαρό. Άφησέ τα να στεγνώσουν οριζόντια και μην τα δανείζεις.',
      body_en:
        'Make-up brushes and applicators collect product, oil and dead skin and are a breeding ground for bacteria, which can bring breakouts, rashes and even infections. Wash them every 7 to 10 days in lukewarm water with a little gentle shampoo — plain soap can dry the bristles — and rinse until the water runs clear. Lay them flat to dry, and do not share them.',
      sources: [AAD_BRUSHES, AAD_ACNE_MAKEUP],
      needs_source: false,
    },
  },
  {
    // softened: "ceramide cream" → the AAD's hyaluronic acid / glycerin; title no longer "lipids"
    slug: 'face-women-menopause-skin-gets-drier',
    set: {
      title_el: 'Μετά την εμμηνόπαυση το δέρμα θέλει περισσότερη ενυδάτωση',
      title_en: 'After menopause the skin needs more moisture',
      body_el:
        'Καθώς πέφτουν οι ορμόνες στην εμμηνόπαυση, το δέρμα μπορεί να γίνει πιο ξηρό, πιο χαλαρό και πιο λεπτό, γιατί χάνει μέρος της ικανότητάς του να συγκρατεί νερό. Πλένε το με ήπιο καθαριστικό αντί για σαπούνι και βάζε ενυδατική μετά το μπάνιο και όποτε νιώθεις το δέρμα ξηρό — το υαλουρονικό οξύ ή η γλυκερίνη βοηθούν. Κράτα αντηλιακό SPF 30 κάθε μέρα, ρώτα τον δερματολόγο αν σου ταιριάζει μια κρέμα με ρετινοειδές, και πήγαινε σε αυτόν αν η ξηρότητα δεν υποχωρεί.',
      body_en:
        'As hormone levels fall in menopause, the skin can become drier, slacker and thinner, because it loses some of its ability to hold water. Wash with a mild cleanser instead of soap, and moisturise after bathing and whenever the skin feels dry — hyaluronic acid or glycerin can help. Keep SPF 30 every day, ask a dermatologist whether a retinoid cream suits you, and see one if the dryness does not settle.',
      sources: [AAD_MENOPAUSE],
      needs_source: false,
    },
  },
  {
    // softened: "thinner skin" and "reapply after every wash" dropped; age spots = sun (Mayo)
    slug: 'face-women-neck-chest-and-hands-count-too',
    set: {
      body_el:
        'Οι κηλίδες ηλικίας και τα άλλα σημάδια της ηλιακής βλάβης εμφανίζονται στο πρόσωπο, τα χέρια, τον λαιμό, τους βραχίονες και το ντεκολτέ — όπου έχει πέσει περισσότερος ήλιος με τα χρόνια. Κατέβασε το αντηλιακό (SPF 30 ή υψηλότερο) στον λαιμό και στο ντεκολτέ και πέρασέ το στη ράχη των χεριών κάθε μέρα. Οι «κηλίδες ηλικίας» στα χέρια είναι στην ουσία κηλίδες ήλιου: τις προκαλεί η υπεριώδης ακτινοβολία, και το τακτικό αντηλιακό βοηθά να μη βγουν.',
      body_en:
        'Age spots and other signs of sun damage show up on the face, hands, neck, arms and chest — wherever the sun has reached most over the years. Take your sunscreen (SPF 30 or higher) down to the neck and chest and onto the backs of your hands every day. Those “age spots” on the hands are really sun spots: UV light drives them, and regular sunscreen helps prevent them.',
      sources: [AAD_MENOPAUSE, MAYO_AGE_SPOTS],
      needs_source: false,
    },
  },
  // --- face · all ------------------------------------------------------------------------------
  {
    // rewritten: "Japanese textures often contain alcohol" and the Korean/European swap are not
    // in any source; now the AAD's label guidance (non-comedogenic; mineral-only if it stings)
    slug: 'face-all-japanese-gel-sunscreens-may-sting',
    set: {
      title_el: 'Υδαρά αντηλιακά: ευχάριστα στο λιπαρό δέρμα — αν τσούζουν, άλλαξε',
      title_en: 'Watery sunscreens: pleasant on oily skin — if one stings, switch',
      body_el:
        'Τα ελαφριά, υδαρά αντηλιακά είναι ευχάριστα στο λιπαρό δέρμα — γι’ αυτόν τον τύπο ψάξε στην ετικέτα «μη φαγεσωρογόνο» ή «δεν φράζει τους πόρους». Αν ένα αντηλιακό τσούζει ή καίει, οι δερματολόγοι συστήνουν να περάσεις σε ένα μόνο με οξείδιο του ψευδαργύρου ή/και διοξείδιο του τιτανίου, χωρίς άρωμα. Για ξηρό δέρμα, διάλεξε ένα με την ένδειξη «ενυδατικό».',
      body_en:
        'Light, watery sunscreens feel pleasant on oily skin — for that skin type, look for “non-comedogenic” or “won’t clog pores” on the label. If a sunscreen stings or burns, dermatologists advise switching to one with only zinc oxide and/or titanium dioxide and no fragrance. For dry skin, choose one labelled “moisturizing”.',
      sources: [AAD_SUNSCREEN_CHOOSE],
      needs_source: false,
    },
  },
  {
    // softened: "two nights a week, +1 night every two weeks" → the AAD's lowest strength,
    // every other night, build up slowly; "dryness for almost everyone" → MedlinePlus wording
    slug: 'face-all-retinol-start-slow-twice-a-week',
    set: {
      title_el: 'Ρετινόλη: ξεκίνα χαμηλά και σιγά-σιγά',
      title_en: 'Retinol: start low and slow',
      body_el:
        'Τις πρώτες εβδομάδες ένα ρετινοειδές φέρνει συχνά ξηρότητα, κοκκίνισμα και ξεφλούδισμα, όσο το δέρμα προσαρμόζεται. Ξεκίνα με το πιο ήπιο προϊόν που θα βρεις, μέρα παρά μέρα το βράδυ, και ανέβαινε σιγά-σιγά· η ενυδατική βοηθά. Βάζε το μόνο το βράδυ, με αντηλιακό τη μέρα, και δώσ’ του μήνες — τα αποτελέσματα θέλουν χρόνο.',
      body_en:
        'In the first weeks a retinoid often brings dryness, redness and flaking while the skin adjusts. Start with the lowest-strength product you can find, every other night, and build up slowly; a moisturiser helps. Use it only at night, with sunscreen by day, and give it months — results take time.',
      sources: [AAD_RETINOID, MEDLINE_ADAPALENE],
      needs_source: false,
    },
  },
  {
    // softened: "pea-sized" and the "sandwich keeps the effect" claim are not in the sources;
    // MedlinePlus: thin layer, dry skin, away from eyes / corners of the nose, moisturiser
    slug: 'face-all-retinol-pea-on-dry-skin-sandwich',
    set: {
      title_el: 'Ρετινοειδή: λεπτή στρώση, σε στεγνό δέρμα, και ενυδατική αν χρειαστεί',
      title_en: 'Retinoids: a thin layer, on dry skin, plus moisturiser if needed',
      body_el:
        'Περισσότερο ρετινοειδές δεν σημαίνει πιο γρήγορο αποτέλεσμα — αν βάζεις περισσότερο ή πιο συχνά απ’ όσο ορίζουν οι οδηγίες, απλώς ερεθίζεις το δέρμα. Άπλωσε μια λεπτή στρώση σε όλη την περιοχή, σε καθαρό και στεγνό δέρμα, μακριά από τα μάτια, το στόμα και τις γωνίες της μύτης. Αν το δέρμα ξηραίνεται, βοηθά μια ενυδατική· ρώτα τον γιατρό ή τον φαρμακοποιό πώς να τις συνδυάσεις.',
      body_en:
        'More retinoid does not mean faster results — applying more, or more often, than directed only irritates the skin. Spread a thin layer over the whole area on clean, dry skin, keeping it away from the eyes, mouth and the corners of the nose. If your skin gets dry, a moisturiser helps; ask your doctor or pharmacist how best to combine the two.',
      sources: [MEDLINE_TRETINOIN, MEDLINE_ADAPALENE],
      needs_source: false,
    },
  },
  {
    // softened: "they cancel out" and the fixed weekday schedule dropped; the AAD's "try one
    // or two products", "too many products irritate"
    slug: 'face-all-one-active-per-evening',
    set: {
      body_el:
        'Ρετινόλη, οξέα AHA/BHA, βιταμίνη C και υπεροξείδιο του βενζοϋλίου δουλεύουν όλα — όμως πολλά μαζί στο δέρμα μπορεί να το ερεθίσουν, και το ερεθισμένο δέρμα συχνά δείχνει χειρότερα και βγάζει περισσότερα σπυράκια. Οι δερματολόγοι συστήνουν να δοκιμάζεις ένα ή δύο προϊόντα τη φορά, να τους δίνεις χρόνο και να ακολουθείς τις οδηγίες του καθενός. Αν θέλεις να χρησιμοποιείς περισσότερα, ρώτα τον δερματολόγο πώς να τα συνδυάσεις ή να τα εναλλάσσεις.',
      body_en:
        'Retinol, AHA/BHA acids, vitamin C and benzoyl peroxide all work, but piling several onto the skin at once can irritate it — and irritated skin often looks worse and breaks out more. Dermatologists advise trying one or two products at a time, giving them time to work and following each one’s directions. If you want to use more, ask a dermatologist how to combine or alternate them.',
      sources: [AAD_ACNE_WONT_CLEAR, AAD_ORDER, AAD_ACNE_HABITS],
      needs_source: false,
    },
  },
  {
    // softened: the review says light oxidises it to a yellow, relatively inactive form that
    // can tint skin and stain clothes; fridge / three months dropped
    slug: 'face-all-vitamin-c-that-turned-orange-is-done',
    set: {
      title_el: 'Βιταμίνη C που κιτρίνισε: αντικατάστησέ την',
      title_en: 'Vitamin C that turned yellow: replace it',
      body_el:
        'Ένας φρέσκος ορός με L-ασκορβικό οξύ είναι σχεδόν άχρωμος, όμως το μόριο είναι ασταθές: στο φως οξειδώνεται σε μια μορφή που κιτρινίζει τον ορό και είναι σχετικά αδρανής. Ο οξειδωμένος ορός μπορεί επίσης να βάψει το δέρμα κιτρινωπό και να λεκιάσει τα ρούχα. Κράτα το μπουκάλι κλειστό και μακριά από το φως, και αντικατάστησε έναν ορό που έχει αλλάξει χρώμα.',
      body_en:
        'A fresh L-ascorbic acid serum is almost colourless, but the molecule is unstable: exposed to light, it oxidises into a form that turns the serum yellow and is relatively inactive. The oxidised serum can also tint the skin yellowish and stain clothes. Keep the bottle closed and away from light, and replace a serum that has changed colour.',
      sources: [PMC_VITAMIN_C],
      needs_source: false,
    },
  },
  {
    // rewritten: the "high-temperature myth" and "above 10 % some people flush" claims are not
    // supported (the review says nicotinamide does NOT cause flushing); now the review's
    // well tolerated, studied at 2–5 % alone or with retinol, peptides and sunscreen
    slug: 'face-all-niacinamide-pairs-with-almost-everything',
    set: {
      title_el: 'Νιασιναμίδη: καλά ανεκτή και εύκολη στους συνδυασμούς',
      title_en: 'Niacinamide: well tolerated and easy to combine',
      body_el:
        'Η τοπική νιασιναμίδη (νικοτιναμίδη) είναι καλά ανεκτή από το δέρμα και, σε αντίθεση με το νικοτινικό οξύ, δεν προκαλεί έξαψη. Στις μελέτες χρησιμοποιήθηκε μόνη της ή μαζί με ρετινόλη, πεπτίδια και αντηλιακό, κυρίως σε 2–5 %, και βελτίωσε λεπτές γραμμές, ανομοιόμορφο τόνο και κοκκινίλες. Ένα προϊόν σε αυτό το εύρος είναι μια λογική αρχή.',
      body_en:
        'Topical niacinamide (nicotinamide) is well tolerated by the skin and, unlike nicotinic acid, does not cause flushing. In studies it was used alone or alongside retinol, peptides and sunscreen, mostly at 2–5 %, and improved fine lines, uneven tone and redness. A product in that range is a sensible place to start.',
      sources: [PMC_NIACINAMIDE],
      needs_source: false,
    },
  },
  {
    // softened: "winter cream clogs pores" and "sweat's salt dries you" dropped; the AAD's
    // oily-skin advice and "use enough sunscreen"
    slug: 'face-all-greek-summer-humidity-lighter-textures',
    set: {
      body_el:
        'Όταν η ζέστη και η υγρασία του ελληνικού καλοκαιριού κάνουν το δέρμα να γυαλίζει, μην κόψεις την ενυδατική — οι δερματολόγοι λένε ότι τη χρειάζεται και το λιπαρό δέρμα. Πέρασε σε προϊόντα με την ένδειξη «χωρίς έλαια» και «μη φαγεσωρογόνο», πλένε το πρόσωπο έως δύο φορές τη μέρα και μετά τον ιδρώτα, και κράτα χαρτάκια απορρόφησης για τη γυαλάδα. Διάλεξε ένα ελαφρύ αντηλιακό που θα βάλεις πραγματικά σε πλήρη δόση — οι περισσότεροι ενήλικες χρειάζονται περίπου ένα σφηνάκι για όλο το σώμα.',
      body_en:
        'When the heat and humidity of a Greek summer make your skin shine, do not drop the moisturiser — dermatologists say even oily skin needs it. Switch to products labelled “oil-free” and “non-comedogenic”, wash your face up to twice a day and after sweating, and keep blotting papers for shine. Pick a light sunscreen you will actually apply in a full dose — most adults need about a shot glass for the whole body.',
      sources: [AAD_OILY, AAD_SUNSCREEN_APPLY],
      needs_source: false,
    },
  },
  {
    // softened: "salt pulls water out of the skin" dropped; the AAD's rinse after sweat or a
    // swim, moisturise on damp skin, reapply sunscreen after swimming
    slug: 'face-all-rinse-off-salt-after-the-sea',
    set: {
      body_el:
        'Ο ιδρώτας που στεγνώνει αφήνει αλμυρό υπόλειμμα που μπορεί να φέρει φαγούρα, και οι δερματολόγοι συστήνουν ένα δροσερό ξέπλυμα μετά τον ιδρώτα ή το κολύμπι — ιδίως για ευαίσθητο δέρμα ή δέρμα με τάση για έκζεμα. Στην παραλία, ένα γρήγορο ντους με γλυκό νερό, μετά ταμπόναρε και βάλε ενυδατική όσο το δέρμα είναι ακόμη νωπό· ξέπλυνε και τα μαλλιά αμέσως μετά το κολύμπι. Ξαναβάλε αντηλιακό αμέσως μετά από κάθε κολύμπι, αν μένεις στον ήλιο.',
      body_en:
        'Dried sweat leaves a salty residue that can make skin itch, and dermatologists advise a cool rinse after sweating or a swim — especially for sensitive or eczema-prone skin. At the beach, take a quick fresh-water shower, then pat dry and moisturise while the skin is still damp; rinse your hair straight after swimming too. Reapply sunscreen immediately after every swim if you are staying in the sun.',
      sources: [AAD_ECZEMA_SUMMER, AAD_SUNSCREEN_APPLY, AAD_SUMMER_HAIR],
      needs_source: false,
    },
  },
  {
    // rewritten: "thinnest to thickest on damp skin" and "patting helps absorption" are not in
    // any source; now the AAD's order (cleanse → treatment → moisturiser/sunscreen → make-up)
    // and "too many products irritate"
    slug: 'face-all-korean-layering-thin-to-thick',
    set: {
      title_el: 'Κορεατικές στρώσεις: μετράει η σειρά, όχι ο αριθμός των βημάτων',
      title_en: 'Korean layering: the order matters more than the number of steps',
      body_el:
        'Η σειρά με την οποία βάζεις τα προϊόντα επηρεάζει το πόσο καλά δουλεύουν. Οι δερματολόγοι συστήνουν: ήπιο καθάρισμα και στέγνωμα με ταμπονάρισμα, μετά το προϊόν θεραπείας (όπως έναν ορό), μετά ενυδατική και — το πρωί — αντηλιακό, και τελευταίο το μακιγιάζ. Δεν χρειάζονται δέκα βήματα: τα πολλά προϊόντα, ειδικά πολλά αντιγηραντικά μαζί, μπορεί να ερεθίσουν το δέρμα.',
      body_en:
        'The order you apply products in affects how well they work. Dermatologists recommend: cleanse gently and pat dry, then any treatment product (such as a serum), then moisturiser and — in the morning — sunscreen, with make-up last. You do not need ten steps: too many products, especially several anti-ageing ones together, can irritate the skin.',
      sources: [AAD_ORDER],
      needs_source: false,
    },
  },
  {
    // rewritten: "a drying sheet pulls water back out" is not in any source; now the AAD's
    // "follow the time on the label", hydrating ingredients, skip fragrance and alcohol
    slug: 'face-all-sheet-mask-do-not-let-it-dry',
    set: {
      title_el: 'Υφασμάτινη μάσκα: βγάλ’ την όταν λέει η ετικέτα',
      title_en: 'Sheet mask: take it off when the label says',
      body_el:
        'Η μάσκα μένει στο δέρμα αρκετή ώρα ώστε να απορροφηθούν τα συστατικά της, γι’ αυτό μπορεί να βοηθήσει στην ενυδάτωση. Ακολούθησε τον χρόνο της ετικέτας: αν την αφήσεις περισσότερο απ’ όσο πρέπει ή τη βάζεις πολύ συχνά, μπορεί να ερεθίσει το δέρμα. Για ξηρό ή ευαίσθητο δέρμα, ψάξε υαλουρονικό οξύ, γλυκερίνη ή κεραμίδια και απόφυγε το άρωμα και το οινόπνευμα.',
      body_en:
        'A mask stays on the skin long enough for its ingredients to absorb, which is why it can help moisturise. Follow the time on the label: leaving a mask on longer than intended, or using it too often, can irritate the skin. For dry or sensitive skin, look for hyaluronic acid, glycerin or ceramides and skip fragrance and alcohol.',
      sources: [AAD_MASKS],
      needs_source: false,
    },
  },
  {
    // rewritten: "skin repairs mostly at night", "slower healing" and the side-sleeping claim
    // are not in any source; now two sleep-loss studies (Sundelin et al., 2013 and 2017)
    slug: 'face-all-sleep-shows-on-the-skin',
    set: {
      title_el: 'Ο ύπνος φαίνεται στο δέρμα',
      title_en: 'Sleep shows on the skin',
      body_el:
        'Σε μια μελέτη, μετά από μια σύντομη νύχτα και μια μέρα χωρίς ύπνο, τα πρόσωπα των συμμετεχόντων κρίθηκαν με πιο πρησμένα μάτια, πιο σκούρους κύκλους, πιο χλωμό δέρμα και περισσότερες λεπτές γραμμές απ’ ό,τι μετά από μια κανονική νύχτα. Σε μια άλλη, δύο νύχτες με περιορισμένο ύπνο έκαναν τα πρόσωπα να φαίνονται λιγότερο υγιή στους άλλους. Καμία κρέμα δεν αντικαθιστά έναν καλό ύπνο.',
      body_en:
        'In one study, after a short night and a day without sleep, people’s faces were rated as having more swollen eyes, darker circles, paler skin and more fine lines than after a normal night. In another, two nights of restricted sleep made faces look less healthy to others. No cream replaces a good night’s sleep.',
      sources: [PMC_SLEEP_FACE, PMC_SLEEP_RESTRICTED],
      needs_source: false,
    },
  },
  // --- nails -----------------------------------------------------------------------------------
  {
    // softened: buffing is not in the AAD pages and is dropped; cuticles: neither cut nor push
    slug: 'nails-men-short-clean-and-buffed',
    set: {
      title_el: 'Για άντρες: κοντά, καθαρά και λιμαρισμένα',
      title_en: 'For men: short, clean and neatly filed',
      body_el:
        'Τα κοντά, καλοκομμένα νύχια δείχνουν περιποιημένα και κρατούν λιγότερη βρομιά και βακτήρια. Κόψ’ τα αμέσως μετά το ντους, σχεδόν ίσια, και μετά στρογγύλεψε ελαφρά τις γωνίες με λίμα, λιμάροντας πάντα προς μία κατεύθυνση. Κράτα τα νύχια καθαρά και στεγνά, άφησε ήσυχα τα επωνύχια — μην τα κόβεις και μην τα σπρώχνεις — και βάζε ενυδατική στα χέρια μετά το πλύσιμο.',
      body_en:
        'Short, well-trimmed nails look neat and are less likely to harbour dirt and bacteria. Trim right after a shower, cutting almost straight across, then round the corners slightly with a file, always filing in one direction. Keep the nails clean and dry, leave the cuticles alone — do not cut or push them back — and moisturise your hands after washing.',
      sources: [AAD_TRIM_NAILS, AAD_HEALTHY_NAILS],
      needs_source: false,
    },
  },
  {
    // rewritten: "no need to give up manicures in pregnancy" is not supported — NIOSH research
    // links nail-technician work in early pregnancy to a birth defect; now ventilation (CDC,
    // FDA) for everyone and "talk to your doctor" for pregnant salon workers
    slug: 'nails-salon-ventilation-and-pregnancy',
    set: {
      title_el: 'Στο σαλόνι: καλός αερισμός, για πελάτες και εργαζόμενους',
      title_en: 'At the salon: good ventilation, for clients and staff',
      body_el:
        'Τα προϊόντα νυχιών περιέχουν χημικές ουσίες όπως ασετόν και μεθακρυλικά, και οι αναθυμιάσεις τους και η σκόνη του λιμαρίσματος μπορεί να εισπνευστούν. Ο καλός αερισμός μειώνει την ποσότητά τους στον αέρα, γι’ αυτό διάλεξε σαλόνι με απορρόφηση στους πάγκους εργασίας ή με ανοιχτά παράθυρα — ο FDA συστήνει καλό αερισμό όποτε χρησιμοποιούνται προϊόντα νυχιών. Έρευνα του NIOSH συνέδεσε τη δουλειά σε σαλόνι νυχιών στις αρχές της εγκυμοσύνης με αυξημένο κίνδυνο καρδιακής ανωμαλίας στο μωρό· αν δουλεύεις σε σαλόνι και είσαι έγκυος ή σχεδιάζεις εγκυμοσύνη, μίλησε με τον γιατρό σου για την έκθεσή σου.',
      body_en:
        'Nail products contain chemicals such as acetone and methacrylates, and their vapours and the filing dust can be breathed in. Good ventilation lowers how much is in the air, so pick a salon with extraction at the work tables or open windows — the FDA advises good ventilation whenever nail products are used. NIOSH research has linked working as a nail technician in early pregnancy with a higher risk of a heart defect in the baby; if you work in a salon and are pregnant or planning to be, talk to your doctor about your exposure.',
      sources: [CDC_NAIL_TECHNICIANS, FDA_NAIL_PRODUCTS],
      needs_source: false,
    },
  },
]
