// OVERLAY 0013 — the six templates of the women's strength track (see ../0013-women-strength.ts for
// the overlay header). Each lives on track `women-strength`, so it shares a (type, level, intensity)
// cell with a P4.8 `general` template without colliding (20261007001250 cell key). Slugs are a
// contract: other pages link `/workouts?track=women-strength&type=<type>&level=<level>`.
//
// Programming (progressive resistance training, the research report's proposal 1): compound lifts
// first — squat pattern, hip hinge, hip thrust, row, press, lunge or step-up — then a loaded carry or
// core; 2–4 sets of 6–12 reps with 60–150 s rest; a general warm-up plus a hinge/glute rehearsal, and
// a short cool-down. Notes say how to progress (add load or reps when the last set feels easy) and end
// with the same stop-if-unwell line as every P4.8 template. Tone: strength, bone health, confidence —
// never weight loss or "toning". Erasable syntax only, explicit `.ts` imports.

import type { WorkoutBlockSeed, WorkoutTemplateSeed } from '../../../types.ts'

type Item = readonly [
  slug: string,
  sets: number,
  work: { reps: number } | { seconds: number },
  rest: number,
]

const items = (block: WorkoutBlockSeed['block'], rows: readonly Item[]): WorkoutBlockSeed[] =>
  rows.map(([exercise_slug, sets, work, rest_seconds]) => ({
    block,
    exercise_slug,
    sets,
    reps: 'reps' in work ? work.reps : null,
    seconds: 'seconds' in work ? work.seconds : null,
    rest_seconds,
  }))

const blocks = (warmup: readonly Item[], main: readonly Item[], cooldown: readonly Item[]) => [
  ...items('warmup', warmup),
  ...items('main', main),
  ...items('cooldown', cooldown),
]

/** The P4.8 duration estimate (3 s per rep, 30 s per transition), rounded up to 5 minutes. */
function durationOf(slots: readonly WorkoutBlockSeed[]): number {
  let seconds = 0
  for (const s of slots)
    seconds += s.sets * ((s.seconds ?? (s.reps ?? 0) * 3) + s.rest_seconds) + 30
  return Math.ceil(seconds / 60 / 5) * 5
}

const STOP_EN =
  'Stop if you feel sharp pain, dizziness or chest discomfort, and talk to a doctor before starting if you have a health condition.'
const STOP_EL =
  'Σταμάτα αν νιώσεις οξύ πόνο, ζάλη ή ενόχληση στο στήθος, και συμβουλέψου γιατρό πριν ξεκινήσεις αν έχεις κάποιο πρόβλημα υγείας.'

function template(
  row: Omit<WorkoutTemplateSeed, 'track' | 'duration_min' | 'blocks' | 'notes_en' | 'notes_el'> & {
    notes_en: string
    notes_el: string
  },
  slots: WorkoutBlockSeed[],
): WorkoutTemplateSeed {
  return {
    ...row,
    track: 'women-strength',
    duration_min: durationOf(slots),
    notes_en: `${row.notes_en} ${STOP_EN}`,
    notes_el: `${row.notes_el} ${STOP_EL}`,
    blocks: slots,
  }
}

const R = (reps: number) => ({ reps })
const S = (seconds: number) => ({ seconds })

export const WORKOUT_TEMPLATES: readonly WorkoutTemplateSeed[] = [
  template(
    {
      slug: 'women-strength-gym-beginner-full-body-a',
      workout_type: 'gym',
      level: 'beginner',
      intensity: 'moderate',
      title_en: 'Strength for women · Gym full body A',
      title_el: 'Δύναμη για γυναίκες · Γυμναστήριο, όλο το σώμα A',
      notes_en:
        'Day A of a two-day full-body plan: alternate it with day B two or three times a week, with a rest day in between. Pick weights that leave about two good reps in reserve, and when every set of an exercise feels easy, add a little weight next time.',
      notes_el:
        'Η μέρα A ενός προγράμματος δύο ημερών για όλο το σώμα: εναλλάσσεται με τη μέρα B δύο ή τρεις φορές την εβδομάδα, με μία μέρα ξεκούρασης ανάμεσα. Διάλεξε βάρη που σου αφήνουν περίπου δύο καλές επαναλήψεις ακόμη, και όταν όλα τα σετ μιας άσκησης σού φαίνονται εύκολα, βάλε λίγο περισσότερο βάρος την επόμενη φορά.',
    },
    blocks(
      [
        ['treadmill-walk-5min', 1, S(300), 0],
        ['bodyweight-good-morning', 2, R(10), 30],
        ['band-lateral-walk', 2, R(12), 30],
      ],
      [
        ['goblet-squat', 3, R(10), 90],
        ['hip-thrust', 3, R(10), 90],
        ['lat-pulldown', 3, R(10), 75],
        ['dumbbell-shoulder-press', 3, R(10), 75],
        ['farmer-carry', 3, S(30), 60],
      ],
      [
        ['standing-quad-stretch', 1, S(30), 0],
        ['supine-knee-hug', 1, S(45), 0],
      ],
    ),
  ),
  template(
    {
      slug: 'women-strength-gym-beginner-full-body-b',
      workout_type: 'gym',
      level: 'beginner',
      // Day B shares A's cell on this track's unique key, so it takes the neighbouring intensity:
      // slightly fewer sets and higher reps — the lighter day of the pair.
      intensity: 'low',
      title_en: 'Strength for women · Gym full body B',
      title_el: 'Δύναμη για γυναίκες · Γυμναστήριο, όλο το σώμα B',
      notes_en:
        'Day B of the two-day full-body plan, a slightly lighter session with machines and a single-leg movement. Learn each movement with a weight you control on every rep; regular lifting like this builds strength and supports bone health.',
      notes_el:
        'Η μέρα B του προγράμματος δύο ημερών, λίγο πιο ελαφριά, με μηχανήματα και μία άσκηση στο ένα πόδι. Μάθε κάθε κίνηση με βάρος που ελέγχεις σε κάθε επανάληψη· η τακτική προπόνηση με βάρη χτίζει δύναμη και στηρίζει την υγεία των οστών.',
    },
    blocks(
      [
        ['rowing-machine-easy', 1, S(300), 0],
        ['cat-cow', 1, S(45), 0],
        ['glute-bridge', 2, R(12), 30],
      ],
      [
        ['leg-press', 3, R(12), 90],
        ['dumbbell-romanian-deadlift', 3, R(10), 90],
        ['seated-cable-row', 3, R(12), 75],
        ['chest-press-machine', 3, R(12), 75],
        ['step-up', 2, R(8), 60],
        ['dead-bug', 2, R(8), 45],
      ],
      [
        ['seated-hamstring-stretch', 1, S(30), 0],
        ['supine-knee-hug', 1, S(45), 0],
      ],
    ),
  ),
  template(
    {
      slug: 'women-strength-home-beginner-dumbbell',
      workout_type: 'home',
      level: 'beginner',
      intensity: 'moderate',
      title_en: 'Strength for women · Home dumbbell session',
      title_el: 'Δύναμη για γυναίκες · Στο σπίτι με αλτήρες',
      notes_en:
        'A full-body strength session with one or two pairs of dumbbells and a sturdy step — two or three times a week. When you can do every set with clean form, add two reps; when that is easy too, move to heavier dumbbells.',
      notes_el:
        'Μια προπόνηση δύναμης για όλο το σώμα με ένα ή δύο ζευγάρια αλτήρες και ένα σταθερό σκαλί — δύο ή τρεις φορές την εβδομάδα. Όταν κάνεις όλα τα σετ με καθαρή τεχνική, πρόσθεσε δύο επαναλήψεις· όταν γίνει κι αυτό εύκολο, πήγαινε σε βαρύτερους αλτήρες.',
    },
    blocks(
      [
        ['march-in-place', 1, S(120), 0],
        ['bodyweight-good-morning', 2, R(10), 30],
        ['glute-bridge', 1, R(12), 30],
      ],
      [
        ['goblet-squat-home', 3, R(10), 75],
        ['dumbbell-romanian-deadlift', 3, R(10), 75],
        ['dumbbell-row-home', 3, R(10), 60],
        ['dumbbell-floor-press', 3, R(10), 60],
        ['step-up', 2, R(8), 60],
        ['dead-bug', 2, R(8), 45],
      ],
      [
        ['standing-quad-stretch', 1, S(30), 0],
        ['supine-knee-hug', 1, S(45), 0],
      ],
    ),
  ),
  template(
    {
      slug: 'women-strength-gym-intermediate-lower',
      workout_type: 'gym',
      level: 'intermediate',
      intensity: 'high',
      title_en: 'Strength for women · Gym lower body',
      title_el: 'Δύναμη για γυναίκες · Γυμναστήριο, κάτω μέρος σώματος',
      notes_en:
        'The heavy lower-body day of an upper/lower split: squat, hinge and hip thrust in lower rep ranges with full rest. Add weight in small steps when you complete every set with two reps to spare, and keep one easier week every month or so.',
      notes_el:
        'Η βαριά μέρα για το κάτω μέρος σε πρόγραμμα πάνω/κάτω: κάθισμα, κάμψη ισχίου και hip thrust με λιγότερες επαναλήψεις και πλήρη ξεκούραση. Πρόσθεσε βάρος σε μικρά βήματα όταν ολοκληρώνεις όλα τα σετ με δύο επαναλήψεις περιθώριο, και κράτα μια πιο ελαφριά εβδομάδα περίπου κάθε μήνα.',
    },
    blocks(
      [
        ['rowing-machine-easy', 1, S(300), 0],
        ['band-lateral-walk', 2, R(12), 30],
        ['bodyweight-good-morning', 2, R(10), 30],
      ],
      [
        ['barbell-back-squat', 4, R(6), 150],
        ['romanian-deadlift', 4, R(8), 120],
        ['hip-thrust', 4, R(8), 120],
        ['walking-lunge-dumbbells', 3, R(10), 90],
        ['seated-leg-curl', 3, R(12), 75],
        ['farmer-carry', 3, S(40), 75],
      ],
      [
        ['deep-squat-hold', 1, S(45), 0],
        ['pigeon-stretch', 1, S(45), 0],
      ],
    ),
  ),
  template(
    {
      slug: 'women-strength-gym-intermediate-upper',
      workout_type: 'gym',
      level: 'intermediate',
      intensity: 'moderate',
      title_en: 'Strength for women · Gym upper body',
      title_el: 'Δύναμη για γυναίκες · Γυμναστήριο, πάνω μέρος σώματος',
      notes_en:
        'The upper-body day of the split: pull-ups, pressing and rowing for a strong back and shoulders. Track the assistance on the pull-up machine and use a little less every few weeks — your first unassisted pull-up is a realistic goal.',
      notes_el:
        'Η μέρα για το πάνω μέρος του προγράμματος: έλξεις, πιέσεις και κωπηλατικές για δυνατή πλάτη και ώμους. Σημείωνε τη βοήθεια στο μηχάνημα έλξεων και μείωνέ τη λίγο κάθε λίγες εβδομάδες — η πρώτη σου έλξη χωρίς βοήθεια είναι ρεαλιστικός στόχος.',
    },
    blocks(
      [
        ['rowing-machine-easy', 1, S(300), 0],
        ['arm-circles', 1, S(30), 0],
        ['band-shoulder-dislocates', 2, R(10), 30],
      ],
      [
        ['assisted-pull-up', 3, R(6), 120],
        ['dumbbell-bench-press', 3, R(8), 120],
        ['seated-cable-row', 3, R(10), 90],
        ['dumbbell-shoulder-press', 3, R(8), 90],
        ['cable-face-pull', 3, R(12), 60],
        ['side-plank', 2, S(30), 45],
      ],
      [
        ['thoracic-rotation', 1, S(45), 0],
        ['downward-dog', 1, S(45), 0],
      ],
    ),
  ),
  template(
    {
      slug: 'women-strength-home-intermediate-glutes-core',
      workout_type: 'home',
      level: 'intermediate',
      intensity: 'moderate',
      title_en: 'Strength for women · Home glutes and core',
      title_el: 'Δύναμη για γυναίκες · Στο σπίτι, γλουτοί και κορμός',
      notes_en:
        'A home session for strong hips, legs and trunk with dumbbells, a band and a sofa or sturdy bench. Slow the lowering phase to about three seconds before you reach for heavier weights; strong glutes and core make everyday lifting and climbing easier.',
      notes_el:
        'Μια προπόνηση στο σπίτι για δυνατούς γοφούς, πόδια και κορμό, με αλτήρες, λάστιχο και καναπέ ή σταθερό πάγκο. Κάνε την κάθοδο πιο αργή, περίπου τρία δευτερόλεπτα, πριν πας σε βαρύτερους αλτήρες· δυνατοί γλουτοί και κορμός κάνουν πιο εύκολο το σήκωμα και το ανέβασμα στην καθημερινότητα.',
    },
    blocks(
      [
        ['march-in-place', 1, S(120), 0],
        ['band-lateral-walk', 2, R(15), 30],
        ['glute-bridge', 2, R(12), 30],
      ],
      [
        ['dumbbell-hip-thrust', 4, R(10), 90],
        ['reverse-lunge', 3, R(10), 75],
        ['dumbbell-romanian-deadlift', 3, R(10), 75],
        ['single-leg-glute-bridge', 3, R(10), 60],
        ['suitcase-carry', 3, S(40), 60],
        ['side-plank', 3, S(30), 45],
        ['dead-bug', 3, R(10), 45],
      ],
      [
        ['pigeon-stretch', 1, S(45), 0],
        ['supine-knee-hug', 1, S(45), 0],
      ],
    ),
  ),
]
