// OVERLAY 0013 — the exercises the women's strength track needs that the P4.7 library lacks (see
// ../0013-women-strength.ts for the overlay header). Everything else the track uses is REUSED by
// slug (goblet-squat, romanian-deadlift, glute-bridge, lat-pulldown, …). Same row shape and voice as
// ../../exercises.ts: plural-polite Greek cues, everyday gym vocabulary, loanwords as Greeks write
// them (hip thrust). Erasable syntax only, explicit `.ts` imports.

import type { ExerciseSeed } from '../../../types.ts'

const DUMBBELLS = ['Dumbbells', 'Αλτήρες'] as const
const DUMBBELL = ['Dumbbell', 'Αλτήρας'] as const
const BAND = ['Resistance band', 'Λάστιχο αντίστασης'] as const
const MACHINE = ['Machine', 'Μηχάνημα'] as const
const BARBELL_BENCH = ['Barbell and bench', 'Μπάρα και πάγκος'] as const
const DUMBBELL_SOFA = [
  'Dumbbell and sofa or sturdy bench',
  'Αλτήρας και καναπές ή σταθερός πάγκος',
] as const
const STEP = ['Sturdy step or bottom stair', 'Σταθερό σκαλοπάτι ή το πρώτο σκαλί'] as const
const MAT = ['Mat', 'Στρώμα'] as const

type Equipment = readonly [en: string, el: string]

function ex(
  row: Omit<ExerciseSeed, 'equipment_en' | 'equipment_el'>,
  equipment?: Equipment,
): ExerciseSeed {
  return {
    ...row,
    equipment_en: equipment ? equipment[0] : null,
    equipment_el: equipment ? equipment[1] : null,
  }
}

export const EXERCISES: readonly ExerciseSeed[] = [
  // --- gym ------------------------------------------------------------------------------------------
  ex(
    {
      slug: 'hip-thrust',
      workout_type: 'gym',
      level: 'beginner',
      muscle_groups: ['glutes', 'hamstrings', 'core'],
      name_en: 'Barbell hip thrust',
      name_el: 'Hip thrust με μπάρα',
      cue_en:
        'Upper back on the bench edge, padded bar across the hips, feet flat about hip-width apart. Drive through the heels until the hips are level with the knees and shoulders, pause and squeeze the glutes, then lower under control. Exhale as you lift.',
      cue_el:
        'Πάνω μέρος της πλάτης στην άκρη του πάγκου, μπάρα με προστατευτικό πάνω στους γοφούς, πέλματα στο πάτωμα στο άνοιγμα της λεκάνης. Σπρώξτε με τις φτέρνες μέχρι οι γοφοί να έρθουν στην ευθεία γονάτων και ώμων, κρατήστε στιγμιαία σφίγγοντας τους γλουτούς και κατεβείτε ελεγχόμενα. Εκπνεύστε στην άνοδο.',
    },
    BARBELL_BENCH,
  ),
  ex(
    {
      slug: 'farmer-carry',
      workout_type: 'gym',
      level: 'beginner',
      muscle_groups: ['forearms', 'core', 'shoulders'],
      name_en: 'Farmer carry',
      name_el: 'Μεταφορά αγρότη (farmer carry)',
      cue_en:
        'Pick up a heavy dumbbell in each hand with a flat back, stand tall with the shoulders down and away from the ears, and walk with short, steady steps. Breathe normally and set the weights down with the same flat-back hinge.',
      cue_el:
        'Σηκώστε έναν βαρύ αλτήρα σε κάθε χέρι με ίσια πλάτη, σταθείτε όρθιοι με τους ώμους χαμηλά και μακριά από τα αυτιά και περπατήστε με μικρά, σταθερά βήματα. Αναπνέετε κανονικά και αφήστε τα βάρη κάτω με την ίδια κάμψη από τους γοφούς.',
    },
    DUMBBELLS,
  ),
  ex(
    {
      slug: 'seated-leg-curl',
      workout_type: 'gym',
      level: 'beginner',
      muscle_groups: ['hamstrings'],
      name_en: 'Seated leg curl',
      name_el: 'Καθιστές κάμψεις γονάτων στο μηχάνημα',
      cue_en:
        'Set the pad just above the heels and the knee joint in line with the machine pivot. Curl the heels down and back in a smooth arc, pause, and return slowly without letting the stack slam. Exhale as you curl.',
      cue_el:
        'Ρυθμίστε το μαξιλαράκι λίγο πάνω από τις φτέρνες και το γόνατο στην ευθεία του άξονα του μηχανήματος. Λυγίστε τα γόνατα φέρνοντας τις φτέρνες κάτω και πίσω σε ομαλό τόξο, κρατήστε στιγμιαία και επιστρέψτε αργά χωρίς να χτυπήσουν τα βάρη. Εκπνεύστε στην κάμψη.',
    },
    MACHINE,
  ),
  ex(
    {
      slug: 'assisted-pull-up',
      workout_type: 'gym',
      level: 'intermediate',
      muscle_groups: ['back', 'biceps', 'core'],
      name_en: 'Assisted pull-up (machine)',
      name_el: 'Υποβοηθούμενες έλξεις στο μηχάνημα',
      cue_en:
        'Kneel on the pad with an overhand grip a little wider than the shoulders. Pull the shoulder blades down first, then pull until the chin clears the bar, and lower all the way under control. Use less assistance over the weeks as you get stronger.',
      cue_el:
        'Γονατίστε στο μαξιλάρι και πιάστε τη μπάρα με πρηνή λαβή λίγο πιο ανοιχτά από τους ώμους. Τραβήξτε πρώτα τις ωμοπλάτες κάτω, μετά τραβηχτείτε μέχρι το πηγούνι να περάσει τη μπάρα και κατεβείτε ως κάτω ελεγχόμενα. Μειώνετε τη βοήθεια με τις εβδομάδες, όσο δυναμώνετε.',
    },
    MACHINE,
  ),

  // --- home -----------------------------------------------------------------------------------------
  ex(
    {
      slug: 'goblet-squat-home',
      workout_type: 'home',
      level: 'beginner',
      muscle_groups: ['quads', 'glutes', 'core'],
      name_en: 'Goblet squat with a dumbbell',
      name_el: 'Goblet squat με αλτήρα',
      cue_en:
        'Hold one dumbbell upright against the chest, feet a little wider than the hips. Sit down between the knees with the chest tall and the heels down, then stand by pushing the floor away. Inhale down, exhale up.',
      cue_el:
        'Κρατήστε έναν αλτήρα όρθιο κολλητά στο στήθος, πέλματα λίγο πιο ανοιχτά από τη λεκάνη. Καθίστε ανάμεσα στα γόνατα με το στήθος ψηλά και τις φτέρνες κάτω και σηκωθείτε σπρώχνοντας το πάτωμα. Εισπνοή στην κάθοδο, εκπνοή στην άνοδο.',
    },
    DUMBBELL,
  ),
  ex(
    {
      slug: 'dumbbell-romanian-deadlift',
      workout_type: 'home',
      level: 'beginner',
      muscle_groups: ['hamstrings', 'glutes', 'back'],
      name_en: 'Dumbbell Romanian deadlift',
      name_el: 'Ρουμανικές άρσεις θανάτου με αλτήρες',
      cue_en:
        'Dumbbells in front of the thighs, knees softly bent. Push the hips back and slide the weights down the legs with a flat back until you feel the hamstrings stretch, then drive the hips forward to stand tall. Exhale on the way up.',
      cue_el:
        'Αλτήρες μπροστά από τους μηρούς, γόνατα ελαφρά λυγισμένα. Σπρώξτε τους γοφούς πίσω και κατεβάστε τα βάρη κατά μήκος των ποδιών με ίσια πλάτη μέχρι να νιώσετε τους οπίσθιους μηριαίους να τεντώνουν, και σπρώξτε τους γοφούς μπροστά για να σταθείτε όρθιοι. Εκπνεύστε στην άνοδο.',
    },
    DUMBBELLS,
  ),
  ex(
    {
      slug: 'dumbbell-floor-press',
      workout_type: 'home',
      level: 'beginner',
      muscle_groups: ['chest', 'triceps', 'shoulders'],
      name_en: 'Dumbbell floor press',
      name_el: 'Πιέσεις στήθους με αλτήρες στο πάτωμα',
      cue_en:
        'Lie on your back, knees bent, a dumbbell in each hand above the chest. Lower until the upper arms touch the floor at about 45 degrees from the body, pause, and press back up. Exhale as you press.',
      cue_el:
        'Ξαπλώστε ανάσκελα με λυγισμένα γόνατα και έναν αλτήρα σε κάθε χέρι πάνω από το στήθος. Κατεβάστε μέχρι οι βραχίονες να ακουμπήσουν το πάτωμα σε γωνία περίπου 45 μοιρών από το σώμα, κρατήστε στιγμιαία και πιέστε ξανά πάνω. Εκπνεύστε στην πίεση.',
    },
    DUMBBELLS,
  ),
  ex(
    {
      slug: 'step-up',
      workout_type: 'home',
      level: 'beginner',
      muscle_groups: ['quads', 'glutes'],
      name_en: 'Step-up',
      name_el: 'Ανεβάσματα σε σκαλί',
      cue_en:
        'Place the whole foot on a sturdy step, lean slightly forward and drive through that heel to stand up on it, then step down slowly with the same leg leading. Finish all reps on one side before switching; hold dumbbells only once it feels steady.',
      cue_el:
        'Βάλτε όλο το πέλμα σε σταθερό σκαλί, γείρετε ελαφρά μπροστά και σπρώξτε με αυτή τη φτέρνα για να ανεβείτε όρθιοι, μετά κατεβείτε αργά με το ίδιο πόδι πρώτο. Ολοκληρώστε τις επαναλήψεις στη μία πλευρά πριν αλλάξετε· κρατήστε αλτήρες μόνο όταν νιώθετε σταθεροί.',
    },
    STEP,
  ),
  ex({
    slug: 'bodyweight-good-morning',
    workout_type: 'home',
    level: 'beginner',
    muscle_groups: ['hamstrings', 'glutes', 'back'],
    name_en: 'Bodyweight good morning',
    name_el: 'Good morning με το βάρος του σώματος',
    cue_en:
      'Hands lightly behind the head, knees soft. Push the hips back and tip the chest forward with a flat back until you feel the hamstrings, then squeeze the glutes to stand. A rehearsal of the hip hinge before loading it.',
    cue_el:
      'Χέρια ελαφρά πίσω από το κεφάλι, γόνατα χαλαρά. Σπρώξτε τους γοφούς πίσω και γείρετε το στήθος μπροστά με ίσια πλάτη μέχρι να νιώσετε τους οπίσθιους μηριαίους, και σφίξτε τους γλουτούς για να σηκωθείτε. Πρόβα της κάμψης από τους γοφούς πριν μπει βάρος.',
  }),
  ex(
    {
      slug: 'band-lateral-walk',
      workout_type: 'home',
      level: 'beginner',
      muscle_groups: ['glutes', 'adductors'],
      name_en: 'Banded lateral walk',
      name_el: 'Πλάγια βήματα με λάστιχο',
      cue_en:
        'Loop a band just above the knees, sit into a quarter squat and take slow side steps, keeping tension on the band and the knees pushed out over the toes. Count each step and repeat in the other direction.',
      cue_el:
        'Περάστε ένα λάστιχο λίγο πάνω από τα γόνατα, καθίστε σε ελαφρύ κάθισμα και κάντε αργά πλάγια βήματα, κρατώντας το λάστιχο τεντωμένο και τα γόνατα προς τα έξω, πάνω από τα δάχτυλα. Μετρήστε κάθε βήμα και επαναλάβετε προς την άλλη πλευρά.',
    },
    BAND,
  ),
  ex(
    {
      slug: 'dead-bug',
      workout_type: 'home',
      level: 'beginner',
      muscle_groups: ['core', 'hip-flexors'],
      name_en: 'Dead bug',
      name_el: 'Dead bug (αντίθετα χέρι-πόδι ανάσκελα)',
      cue_en:
        'Lie on your back, arms up, hips and knees at 90 degrees, lower back gently pressed into the floor. Reach one arm and the opposite leg away slowly, exhale fully, and return. Alternate sides without letting the back arch.',
      cue_el:
        'Ξαπλώστε ανάσκελα, χέρια ψηλά, γοφοί και γόνατα στις 90 μοίρες, η μέση ελαφρά πιεσμένη στο πάτωμα. Απλώστε αργά το ένα χέρι και το αντίθετο πόδι, εκπνεύστε πλήρως και επιστρέψτε. Εναλλάξτε πλευρές χωρίς να καμπουριάζει η μέση προς τα πάνω.',
    },
    MAT,
  ),
  ex(
    {
      slug: 'dumbbell-hip-thrust',
      workout_type: 'home',
      level: 'intermediate',
      muscle_groups: ['glutes', 'hamstrings', 'core'],
      name_en: 'Dumbbell hip thrust',
      name_el: 'Hip thrust με αλτήρα',
      cue_en:
        'Upper back against the edge of a sofa or sturdy bench, a dumbbell held on the hips, feet flat. Drive through the heels until the body is level from shoulders to knees, squeeze the glutes for a second, and lower slowly. Exhale as you lift.',
      cue_el:
        'Πάνω μέρος της πλάτης στην άκρη καναπέ ή σταθερού πάγκου, ένας αλτήρας πάνω στους γοφούς, πέλματα στο πάτωμα. Σπρώξτε με τις φτέρνες μέχρι το σώμα να είναι ευθεία από ώμους ως γόνατα, σφίξτε τους γλουτούς για ένα δευτερόλεπτο και κατεβείτε αργά. Εκπνεύστε στην άνοδο.',
    },
    DUMBBELL_SOFA,
  ),
  ex(
    {
      slug: 'suitcase-carry',
      workout_type: 'home',
      level: 'intermediate',
      muscle_groups: ['core', 'forearms', 'shoulders'],
      name_en: 'Suitcase carry',
      name_el: 'Μεταφορά βάρους με το ένα χέρι (suitcase carry)',
      cue_en:
        'Hold one heavy dumbbell at your side like a suitcase and walk tall without leaning towards or away from it. Keep the ribs down and the shoulders level, then switch hands for the next round.',
      cue_el:
        'Κρατήστε έναν βαρύ αλτήρα στο πλάι σαν βαλίτσα και περπατήστε όρθιοι χωρίς να γέρνετε προς το βάρος ή μακριά του. Κρατήστε τα πλευρά κάτω και τους ώμους στο ίδιο ύψος, και αλλάξτε χέρι στον επόμενο γύρο.',
    },
    DUMBBELL,
  ),
  ex(
    {
      slug: 'side-plank',
      workout_type: 'home',
      level: 'intermediate',
      muscle_groups: ['core', 'shoulders', 'glutes'],
      name_en: 'Side plank',
      name_el: 'Πλάγια σανίδα',
      cue_en:
        'Elbow under the shoulder, feet stacked or staggered, body in one straight line from head to heels. Lift the hips and hold while breathing steadily; drop to the bottom knee if the hips sag. Hold both sides.',
      cue_el:
        'Αγκώνας κάτω από τον ώμο, πέλματα το ένα πάνω στο άλλο ή το ένα μπροστά, σώμα σε μία ευθεία από το κεφάλι ως τις φτέρνες. Σηκώστε τους γοφούς και κρατήστε αναπνέοντας σταθερά· στηριχτείτε στο κάτω γόνατο αν πέφτουν οι γοφοί. Κρατήστε και από τις δύο πλευρές.',
    },
    MAT,
  ),
]
