// OVERLAY 0003 — the Orthodox fasting diet (see ../0003-greek-kitchen.ts for the overlay header).
// One module per table (../by-table/). Erasable syntax only, explicit `.ts` imports.

import type { DietSeed } from '../../../types.ts'

export const DIETS: DietSeed[] = [
  {
    slug: 'fasting',
    name_el: 'Νηστεία (Ορθόδοξη)',
    name_en: 'Orthodox fasting (Lent)',
    summary_el:
      'Η νηστεία της Ορθόδοξης Εκκλησίας, όπως την τηρούν πολλοί Έλληνες. Τις ημέρες νηστείας δεν τρώγονται κρέας, πουλερικά, γαλακτοκομικά και αυγά· το ψάρι με ραχοκοκαλιά επιτρέπεται μόνο σε ορισμένες γιορτές (Ευαγγελισμός, Κυριακή των Βαΐων), ενώ χταπόδι, καλαμάρι, σουπιά, γαρίδες, μύδια και ταραμάς επιτρέπονται. Στις αυστηρές ημέρες (ξηροφαγία) παραλείπονται και το λάδι και το κρασί. Οι μεγάλες περίοδοι είναι η Μεγάλη Σαρακοστή πριν από το Πάσχα, η νηστεία των Χριστουγέννων (15 Νοεμβρίου–24 Δεκεμβρίου), του Δεκαπενταύγουστου (1–14 Αυγούστου) και των Αγίων Αποστόλων, καθώς και κάθε Τετάρτη και Παρασκευή. Στην πράξη είναι φυτική διατροφή με όσπρια, λαδερά, χόρτα και θαλασσινά. Η ετικέτα «Νηστεία» σε μια συνταγή σημαίνει ότι ταιριάζει σε συνηθισμένη ημέρα νηστείας με λάδι και κρασί.',
    summary_en:
      'The fast of the Orthodox Church as many Greeks keep it. On fasting days there is no meat, poultry, dairy or eggs; fish with a backbone is allowed only on certain feasts (the Annunciation, Palm Sunday), while octopus, squid, cuttlefish, shrimp, mussels and fish roe (taramas) are allowed. On strict days (xerofagia) oil and wine are dropped too. The main periods are Great Lent before Easter, the Nativity fast (15 November–24 December), the Dormition fast (1–14 August) and the Apostles’ fast, plus every Wednesday and Friday. In practice it is a plant-based diet of legumes, vegetables cooked in olive oil, greens and seafood. The "Fasting" tag on a recipe means it fits an ordinary fasting day with oil and wine.',
    allowed_el: [
      'Όσπρια: φακές, φασόλια, ρεβίθια, φάβα, γίγαντες',
      'Λαδερά: φασολάκια, μπάμιες, αρακάς, μπριάμ, γεμιστά',
      'Χόρτα, λαχανικά και φρούτα εποχής',
      'Ψωμί, λαγάνα, ρύζι, ζυμαρικά χωρίς αυγό, πλιγούρι',
      'Χταπόδι, καλαμάρι, σουπιά, γαρίδες, μύδια και ταραμάς',
      'Ταχίνι, χαλβάς, ξηροί καρποί και ελιές',
      'Ελαιόλαδο και κρασί, εκτός από τις ημέρες ξηροφαγίας',
      'Φυτικά ροφήματα (βρώμης, αμυγδάλου, σόγιας) και τόφου',
    ],
    allowed_en: [
      'Legumes: lentils, beans, chickpeas, fava, giant beans',
      'Vegetables cooked in olive oil (ladera): green beans, okra, peas, briam, gemista',
      'Greens, vegetables and seasonal fruit',
      'Bread, lagana, rice, egg-free pasta, bulgur',
      'Octopus, squid, cuttlefish, shrimp, mussels and fish roe (taramas)',
      'Tahini, halva, nuts and olives',
      'Olive oil and wine, except on strict (xerofagia) days',
      'Plant milks (oat, almond, soy) and tofu',
    ],
    avoided_el: [
      'Κρέας και αλλαντικά',
      'Πουλερικά',
      'Γάλα, γιαούρτι, τυρί και βούτυρο',
      'Αυγά, και ζυμαρικά με αυγό όπως οι χυλοπίτες',
      'Ψάρι με ραχοκοκαλιά, εκτός από τις ημέρες που επιτρέπεται',
      'Ζωικά λίπη (λαρδί, λίπος μοσχαριού) και ζελατίνη',
      'Λάδι και κρασί στις ημέρες ξηροφαγίας: κατά την αυστηρή τήρηση, οι καθημερινές της Μεγάλης Σαρακοστής και η Μεγάλη Παρασκευή',
    ],
    avoided_en: [
      'Meat and cold cuts',
      'Poultry',
      'Milk, yoghurt, cheese and butter',
      'Eggs, and egg pasta such as hilopites',
      'Fish with a backbone, except on the days it is allowed',
      'Animal fats (lard, tallow) and gelatin',
      'Oil and wine on strict days: in the strict rule, the weekdays of Great Lent and Good Friday',
    ],
    pros_el: [
      'Φέρνει στο τραπέζι πολλά όσπρια, λαχανικά και φυτικές ίνες — τον πυρήνα της παραδοσιακής μεσογειακής διατροφής',
      'Μελέτη σε Κρητικούς που νήστευαν (Sarri και συν., British Journal of Nutrition, 2004) έδειξε χαμηλότερη ολική και LDL χοληστερόλη στις περιόδους νηστείας',
      'Η ελληνική κουζίνα έχει πλούσια νηστίσιμη παράδοση: λαδερά, όσπρια, πίτες, θαλασσινά',
      'Οικονομική, αφού βασίζεται σε όσπρια και λαχανικά εποχής',
    ],
    pros_en: [
      'Puts plenty of legumes, vegetables and fibre on the table — the core of the traditional Mediterranean diet',
      'A study of fasting Cretans (Sarri et al., British Journal of Nutrition, 2004) found lower total and LDL cholesterol during fasting periods',
      'Greek cooking has a rich fasting tradition: ladera, legumes, pies, seafood',
      'Inexpensive, since it rests on legumes and seasonal vegetables',
    ],
    cons_el: [
      'Χωρίς σχεδιασμό, οι μεγάλες περίοδοι μπορεί να δώσουν λιγότερη πρωτεΐνη, ασβέστιο, σίδηρο και βιταμίνη B12',
      'Τα «νηστίσιμα» έτοιμα γλυκά και αρτοσκευάσματα έχουν συχνά πολλή ζάχαρη και λίπος',
      'Το πολύ λάδι στα λαδερά ανεβάζει γρήγορα τις θερμίδες',
      'Οι κανόνες διαφέρουν ανά περίοδο, ημέρα και τοπική παράδοση',
    ],
    cons_en: [
      'Without planning, long periods can mean less protein, calcium, iron and vitamin B12',
      'Shop-bought "fasting" sweets and baked goods are often high in sugar and fat',
      'Generous olive oil in ladera adds calories quickly',
      'The rules vary by period, day and local tradition',
    ],
    avoid_if_el: [
      'Αν είστε έγκυος ή θηλάζετε, έχετε διαβήτη (ιδίως με ινσουλίνη ή φάρμακα που ρίχνουν το σάκχαρο), νεφρική νόσο ή άλλη διαγνωσμένη πάθηση, ρωτήστε πρώτα γιατρό ή διαιτολόγο.',
      'Η Εκκλησία απαλλάσσει από την αυστηρή νηστεία τα παιδιά, τους ηλικιωμένους, τους ασθενείς και τις εγκύους· η απόφαση παίρνεται με τον πνευματικό και τον γιατρό.',
      'Αν έχετε ιστορικό διατροφικής διαταραχής, μιλήστε πρώτα με επαγγελματία υγείας.',
      'Στις μεγάλες περιόδους, φροντίστε για αρκετή πρωτεΐνη από όσπρια και θαλασσινά και ρωτήστε για συμπλήρωμα βιταμίνης B12.',
    ],
    avoid_if_en: [
      'If you are pregnant or breastfeeding, have diabetes (especially on insulin or glucose-lowering medication), kidney disease or another diagnosed condition, ask a doctor or dietitian first.',
      'The Church excuses children, the elderly, the sick and pregnant women from the strict fast; decide with your spiritual father and your doctor.',
      'If you have a history of an eating disorder, talk to a health professional first.',
      'In the long periods, get enough protein from legumes and seafood and ask about a vitamin B12 supplement.',
    ],
    source_url: 'https://www.goarch.org/-/fasting',
  },
]
