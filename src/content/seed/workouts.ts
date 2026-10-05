// SEED: workout templates (PLAN.md P4.8). Exactly 63 rows — one per workout type × level ×
// intensity (7 × 3 × 3) — each laid out as warm-up → main → cool-down blocks of exercise slugs from
// the P4.7 library (`./exercises.ts`). Every slug in a template matches the template's type and is
// at or below the template's level (an advanced session may warm up with beginner movements; a
// beginner session never contains an advanced one).
//
// Authoring: a per-(type, level) design table names the exercises of each block once; the three
// intensities are derived from it with `[low, moderate, high]` scaling tuples (strength: sets 2/3/4,
// reps 8–10/10–12/12–15 or holds 30/40/50 s, rest 90/60/45 s; endurance: longer/harder efforts and
// shorter recoveries; mobility: 30/40/50 s holds). `duration_min` is estimated from the blocks
// (work + rest + a transition per movement) and rounded up to 5 minutes. The committed
// `WORKOUT_TEMPLATES` array is the truth the seed generator and the app read — admin edits later
// replace rows, not this table.
//
// Erasable syntax only: `scripts/gen-seed-sql.mjs` imports this module under node's type stripping.

import { BLOCKS, INTENSITIES, LEVELS, WORKOUT_TYPES } from '../enums.ts'
import type { Block, Intensity, Level, WorkoutType } from '../enums.ts'
import type { WorkoutBlockSeed, WorkoutTemplateSeed } from '../types.ts'

// --- scaling helpers -----------------------------------------------------------------------------

/** A value that is either fixed across intensities or given as `[low, moderate, high]`. */
type Scaled<T> = T | readonly [low: T, moderate: T, high: T]

interface ItemSpec {
  slug: string
  sets: Scaled<number>
  reps?: Scaled<number>
  seconds?: Scaled<number>
  rest: Scaled<number>
}

interface BlockSpec {
  warmup: ItemSpec[]
  main: ItemSpec[]
  cooldown: ItemSpec[]
}

type Design = { [T in WorkoutType]: { [L in Level]: BlockSpec } }

function pick<T>(value: Scaled<T>, intensity: Intensity): T {
  if (Array.isArray(value)) {
    const tuple = value as readonly [T, T, T]
    return tuple[INTENSITIES.indexOf(intensity)]
  }
  return value as T
}

/** Gym-style loaded lift: 2/3/4 sets × 8/10/12 reps, rest 90/60/45 s. */
const lift = (slug: string): ItemSpec => ({
  slug,
  sets: [2, 3, 4],
  reps: [8, 10, 12],
  rest: [90, 60, 45],
})

/** Bodyweight strength movement: 2/3/4 sets × 10/12/15 reps, rest 90/60/45 s. */
const bw = (slug: string): ItemSpec => ({
  slug,
  sets: [2, 3, 4],
  reps: [10, 12, 15],
  rest: [90, 60, 45],
})

/** Hard bodyweight skill (pull-ups, dips, pistols): 2/3/4 sets × 5/6/8 reps, rest 90/75/60 s. */
const skill = (slug: string): ItemSpec => ({
  slug,
  sets: [2, 3, 4],
  reps: [5, 6, 8],
  rest: [90, 75, 60],
})

/** Timed hold or cardio burst: 2/3/4 sets × 30/40/50 s, rest 60/45/30 s. */
const hold = (slug: string): ItemSpec => ({
  slug,
  sets: [2, 3, 4],
  seconds: [30, 40, 50],
  rest: [60, 45, 30],
})

/** Continuous warm-up movement: 1 set of `seconds`, no rest. */
const warm = (slug: string, seconds: Scaled<number>): ItemSpec => ({
  slug,
  sets: 1,
  seconds,
  rest: 0,
})

/** Light activation set before the main block: 1 set × `reps`, 30 s rest. */
const activate = (slug: string, reps: number): ItemSpec => ({ slug, sets: 1, reps, rest: 30 })

/** Static stretch, `sets` sides × 30 s, no rest; identical at every intensity. */
const stretch = (slug: string, sets = 2): ItemSpec => ({ slug, sets, seconds: 30, rest: 0 })

/** Easy continuous cool-down (spin-down, easy swim): 1 set of `seconds`. */
const easy = (slug: string, seconds: number): ItemSpec => ({ slug, sets: 1, seconds, rest: 0 })

/** Endurance effort: `sets` × `seconds` with `rest` recovery, each scalable. */
const effort = (
  slug: string,
  sets: Scaled<number>,
  seconds: Scaled<number>,
  rest: Scaled<number>,
): ItemSpec => ({ slug, sets, seconds, rest })

/** Mobility position: 1/1/2 rounds × 30/40/50 s, 15/10/10 s to change position. */
const mob = (slug: string): ItemSpec => ({
  slug,
  sets: [1, 1, 2],
  seconds: [30, 40, 50],
  rest: [15, 10, 10],
})

// --- design table: which exercises each (type, level) uses, per block ----------------------------

const DESIGN: Design = {
  home: {
    beginner: {
      warmup: [warm('arm-circles', 30), warm('march-in-place', [60, 90, 120])],
      main: [bw('bodyweight-squat'), bw('wall-push-up'), bw('glute-bridge'), hold('knee-plank')],
      cooldown: [stretch('standing-quad-stretch')],
    },
    intermediate: {
      warmup: [
        warm('arm-circles', 30),
        warm('march-in-place', 60),
        warm('jumping-jacks', [30, 45, 60]),
      ],
      main: [
        bw('bodyweight-squat'),
        bw('push-up'),
        bw('reverse-lunge'),
        bw('dumbbell-row-home'),
        bw('glute-bridge'),
        hold('mountain-climbers'),
        hold('plank'),
      ],
      cooldown: [stretch('seated-hamstring-stretch', 1), stretch('standing-quad-stretch')],
    },
    advanced: {
      warmup: [
        warm('arm-circles', 30),
        warm('jumping-jacks', 45),
        warm('skipping-rope', [60, 90, 120]),
      ],
      main: [
        bw('jump-squat'),
        bw('bulgarian-split-squat'),
        bw('push-up'),
        bw('single-leg-glute-bridge'),
        bw('dumbbell-row-home'),
        bw('burpees'),
        hold('plank'),
      ],
      cooldown: [
        stretch('pigeon-stretch'),
        stretch('seated-hamstring-stretch', 1),
        stretch('standing-quad-stretch'),
      ],
    },
  },
  gym: {
    beginner: {
      warmup: [warm('treadmill-walk-5min', 300), activate('seated-cable-row', 12)],
      main: [
        lift('leg-press'),
        lift('chest-press-machine'),
        lift('lat-pulldown'),
        lift('dumbbell-shoulder-press'),
      ],
      cooldown: [easy('stationary-bike-cooldown', 300)],
    },
    intermediate: {
      warmup: [warm('rowing-machine-easy', [240, 300, 300]), activate('cable-face-pull', 15)],
      main: [
        lift('goblet-squat'),
        lift('romanian-deadlift'),
        lift('dumbbell-bench-press'),
        lift('barbell-row'),
        lift('walking-lunge-dumbbells'),
        lift('lat-pulldown'),
      ],
      cooldown: [easy('stationary-bike-cooldown', 300)],
    },
    advanced: {
      warmup: [
        warm('rowing-machine-easy', 300),
        activate('goblet-squat', 10),
        activate('cable-face-pull', 15),
      ],
      main: [
        lift('barbell-back-squat'),
        lift('deadlift'),
        lift('barbell-bench-press'),
        lift('overhead-press'),
        skill('weighted-pull-up'),
        lift('kettlebell-swing'),
      ],
      cooldown: [easy('stationary-bike-cooldown', 300), stretch('foam-roll-quads')],
    },
  },
  calisthenics: {
    beginner: {
      warmup: [warm('wrist-circles', 30), warm('dead-hang', [15, 20, 20])],
      main: [
        bw('incline-push-up'),
        bw('australian-row'),
        bw('assisted-squat'),
        hold('hollow-hold-tuck'),
      ],
      cooldown: [stretch('chest-doorway-stretch', 1)],
    },
    intermediate: {
      warmup: [warm('wrist-circles', 30), warm('dead-hang', 20), activate('scapular-pull-up', 8)],
      main: [
        skill('pull-up'),
        bw('diamond-push-up'),
        bw('bench-dip'),
        bw('australian-row'),
        bw('hanging-knee-raise'),
        hold('hollow-hold'),
      ],
      cooldown: [stretch('lat-stretch-bar'), stretch('chest-doorway-stretch', 1)],
    },
    advanced: {
      warmup: [warm('wrist-circles', 30), warm('dead-hang', 30), activate('scapular-pull-up', 8)],
      main: [
        skill('chest-to-bar-pull-up'),
        bw('archer-push-up'),
        skill('parallel-bar-dip'),
        skill('pistol-squat'),
        bw('hanging-leg-raise'),
        hold('l-sit'),
      ],
      cooldown: [
        stretch('german-hang-stretch', 1),
        stretch('lat-stretch-bar'),
        stretch('chest-doorway-stretch', 1),
      ],
    },
  },
  running: {
    beginner: {
      warmup: [warm('brisk-walk-5min', 300), effort('leg-swings', 2, 20, 0)],
      main: [
        effort('walk-jog-intervals', [5, 6, 8], 60, [120, 90, 60]),
        effort('easy-jog', 1, [300, 480, 600], 0),
        effort('high-knees', 2, 20, 40),
      ],
      cooldown: [stretch('calf-stretch-wall')],
    },
    intermediate: {
      warmup: [
        warm('brisk-walk-5min', 300),
        effort('leg-swings', 2, 20, 0),
        effort('butt-kicks', 2, 20, 20),
      ],
      main: [
        effort('strides-100m', [4, 5, 6], 20, 60),
        effort('tempo-run-20min', 1, [900, 1200, 1500], 0),
        effort('fartlek-30-30', [6, 8, 10], 30, 30),
        effort('hill-walk-recovery', 1, 180, 0),
      ],
      cooldown: [stretch('standing-hamstring-stretch'), stretch('calf-stretch-wall')],
    },
    advanced: {
      warmup: [warm('easy-jog', 600), effort('leg-swings', 2, 20, 0), effort('a-skips', 2, 20, 20)],
      main: [
        effort('strides-100m', 4, 20, 60),
        effort('intervals-400m', [4, 6, 8], 90, [120, 100, 80]),
        effort('hill-sprints', [4, 6, 8], 12, 90),
        effort('hill-walk-recovery', 1, 180, 0),
      ],
      cooldown: [
        stretch('hip-flexor-stretch-kneeling'),
        stretch('standing-hamstring-stretch'),
        stretch('calf-stretch-wall'),
      ],
    },
  },
  swimming: {
    beginner: {
      warmup: [warm('easy-swim-100m', 180), warm('bobbing-breath-practice', 60)],
      main: [
        effort('drill-kick-board', [2, 3, 4], 60, 30),
        effort('freestyle-25m-repeats', [4, 6, 8], 40, [40, 30, 20]),
        effort('backstroke-easy', 1, [120, 180, 240], 0),
      ],
      cooldown: [stretch('pool-wall-shoulder-stretch')],
    },
    intermediate: {
      warmup: [warm('easy-swim-100m', 240), effort('drill-catch-up-freestyle', 2, 60, 20)],
      main: [
        effort('pull-buoy-freestyle', [3, 4, 5], 90, 30),
        effort('freestyle-50m-repeats', [4, 6, 8], 60, [30, 25, 20]),
        effort('breaststroke-100m', [2, 3, 4], 150, 45),
        effort('fins-kick-set', [2, 3, 4], 60, 30),
      ],
      cooldown: [easy('easy-swim-cooldown-200m', 300), stretch('pool-wall-shoulder-stretch')],
    },
    advanced: {
      warmup: [
        warm('easy-swim-100m', 300),
        effort('drill-sculling', 2, 45, 15),
        effort('drill-catch-up-freestyle', 2, 60, 20),
      ],
      main: [
        effort('freestyle-100m-intervals', [4, 6, 8], 100, [30, 25, 20]),
        effort('butterfly-25m', [4, 6, 8], 30, 45),
        effort('individual-medley-100m', [2, 3, 4], 120, 60),
        effort('hypoxic-breathing-set', 1, [180, 240, 300], 0),
      ],
      cooldown: [
        easy('easy-swim-cooldown-200m', 300),
        stretch('streamline-glide-stretch', 1),
        stretch('pool-wall-shoulder-stretch'),
      ],
    },
  },
  cycling: {
    beginner: {
      warmup: [warm('easy-spin', 300)],
      main: [
        effort('cadence-drill-90rpm', [3, 4, 5], 60, 60),
        effort('steady-ride-20min', 1, [900, 1200, 1500], 0),
        effort('single-leg-pedalling', 2, [30, 45, 60], 30),
      ],
      cooldown: [easy('spin-down-5min', 300), stretch('post-ride-quad-stretch')],
    },
    intermediate: {
      warmup: [warm('easy-spin', 300), effort('cadence-drill-90rpm', 2, 60, 30)],
      main: [
        effort('cadence-drill-100rpm', [3, 4, 5], 60, 45),
        effort('tempo-ride-20min', 1, [900, 1200, 1200], 0),
        effort('seated-climb-intervals', [2, 2, 3], 300, [150, 120, 120]),
        effort('standing-climb-drill', [3, 4, 5], 30, 45),
      ],
      cooldown: [
        easy('spin-down-5min', 300),
        stretch('post-ride-hip-stretch'),
        stretch('post-ride-quad-stretch'),
      ],
    },
    advanced: {
      warmup: [warm('easy-spin', 450), effort('cadence-drill-100rpm', 2, 60, 30)],
      main: [
        effort('vo2-intervals-3min', [3, 4, 5], 180, [180, 150, 120]),
        effort('sprint-intervals-30s', [4, 6, 8], 30, [90, 75, 60]),
        effort('low-cadence-strength', [2, 2, 3], 180, 90),
      ],
      cooldown: [
        easy('spin-down-5min', 300),
        stretch('post-ride-foam-roll', 1),
        stretch('post-ride-hip-stretch'),
      ],
    },
  },
  mobility: {
    beginner: {
      warmup: [warm('neck-rolls', 30), warm('shoulder-rolls', 30)],
      main: [mob('cat-cow'), mob('hip-circles'), mob('ankle-circles'), mob('childs-pose')],
      cooldown: [stretch('supine-knee-hug', 1)],
    },
    intermediate: {
      warmup: [warm('neck-rolls', 30), warm('shoulder-rolls', 30), warm('cat-cow', 45)],
      main: [
        mob('worlds-greatest-stretch'),
        mob('thoracic-rotation'),
        mob('ninety-ninety-hip-switch'),
        mob('deep-squat-hold'),
        mob('downward-dog'),
        mob('half-kneeling-adductor-rock'),
        mob('band-shoulder-dislocates'),
      ],
      cooldown: [stretch('childs-pose', 1), stretch('supine-knee-hug', 1)],
    },
    advanced: {
      warmup: [warm('shoulder-rolls', 30), warm('cat-cow', 45), warm('hip-circles', 30)],
      main: [
        mob('worlds-greatest-stretch'),
        mob('ninety-ninety-hip-switch'),
        mob('deep-squat-hold'),
        mob('cossack-squat'),
        mob('jefferson-curl'),
        mob('wall-shoulder-flexion-slides'),
        mob('couch-stretch'),
        mob('bridge-pose'),
      ],
      cooldown: [stretch('legs-up-the-wall', 1), stretch('childs-pose', 1)],
    },
  },
}

// --- copy ----------------------------------------------------------------------------------------

type Pair = readonly [en: string, el: string]

const TYPE_NAME: { [T in WorkoutType]: Pair } = {
  home: ['Home', 'Σπίτι'],
  gym: ['Gym', 'Γυμναστήριο'],
  calisthenics: ['Calisthenics', 'Calisthenics'],
  running: ['Running', 'Τρέξιμο'],
  swimming: ['Swimming', 'Κολύμβηση'],
  cycling: ['Cycling', 'Ποδηλασία'],
  mobility: ['Mobility', 'Κινητικότητα'],
}

const LEVEL_NAME: { [L in Level]: Pair } = {
  beginner: ['Beginner', 'Αρχάριο'],
  intermediate: ['Intermediate', 'Μεσαίο'],
  advanced: ['Advanced', 'Προχωρημένο'],
}

const INTENSITY_NAME: { [I in Intensity]: Pair } = {
  low: ['Low intensity', 'Χαμηλή ένταση'],
  moderate: ['Moderate intensity', 'Μέτρια ένταση'],
  high: ['High intensity', 'Υψηλή ένταση'],
}

/** Sentence 1 of the notes: who the session is for. */
const WHO: { [T in WorkoutType]: { [L in Level]: Pair } } = {
  home: {
    beginner: [
      'A bodyweight session for your living room, for anyone starting out or coming back after a long break.',
      'Πρόγραμμα με το βάρος του σώματος για το σαλόνι σου, για όποιον ξεκινάει τώρα ή επιστρέφει μετά από μεγάλο διάλειμμα.',
    ],
    intermediate: [
      'A home session with push-ups, lunges and a pair of dumbbells for someone who already trains regularly.',
      'Πρόγραμμα για το σπίτι με κάμψεις, προβολές και ένα ζευγάρι αλτήρες, για όποιον γυμνάζεται ήδη τακτικά.',
    ],
    advanced: [
      'A demanding home session with jumps and single-leg work for experienced exercisers.',
      'Απαιτητικό πρόγραμμα για το σπίτι με άλματα και ασκήσεις στο ένα πόδι, για έμπειρους ασκούμενους.',
    ],
  },
  gym: {
    beginner: [
      'A machine-based full-body session for your first months in the gym.',
      'Πρόγραμμα ολόκληρου σώματος στα μηχανήματα, για τους πρώτους μήνες σου στο γυμναστήριο.',
    ],
    intermediate: [
      'A free-weight full-body session for someone comfortable with dumbbells and the barbell.',
      'Πρόγραμμα ολόκληρου σώματος με ελεύθερα βάρη, για όποιον νιώθει άνετα με αλτήρες και μπάρα.',
    ],
    advanced: [
      'A heavy barbell session for lifters with solid technique in the squat, deadlift and press.',
      'Βαρύ πρόγραμμα με μπάρα, για ασκούμενους με σταθερή τεχνική στο κάθισμα, την άρση θανάτου και τις πιέσεις.',
    ],
  },
  calisthenics: {
    beginner: [
      'Bar and bodyweight basics for someone building their first pull-up and push-up.',
      'Βασικές ασκήσεις στο μονόζυγο και με το βάρος του σώματος, για όποιον χτίζει την πρώτη του έλξη και κάμψη.',
    ],
    intermediate: [
      'A bar session for someone who can already do a few strict pull-ups and dips.',
      'Πρόγραμμα στο μονόζυγο για όποιον κάνει ήδη μερικές καθαρές έλξεις και βυθίσεις.',
    ],
    advanced: [
      'Advanced bodyweight strength: archer push-ups, pistol squats, L-sits and chest-to-bar pull-ups.',
      'Προχωρημένη δύναμη με το βάρος του σώματος: archer κάμψεις, pistol καθίσματα, L-sit και έλξεις μέχρι το στήθος.',
    ],
  },
  running: {
    beginner: [
      'A walk–jog session for someone starting to run; the walking breaks are part of the plan.',
      'Πρόγραμμα περπάτημα–τζόκινγκ για όποιον ξεκινάει το τρέξιμο· τα διαλείμματα περπατήματος είναι μέρος του σχεδίου.',
    ],
    intermediate: [
      'A tempo and fartlek session for someone who runs comfortably for 30 minutes.',
      'Πρόγραμμα tempo και fartlek για όποιον τρέχει άνετα 30 λεπτά συνεχόμενα.',
    ],
    advanced: [
      'Track intervals and hill sprints for an experienced runner with a solid aerobic base.',
      'Διαλειμματικό στον στίβο και σπριντ σε ανηφόρα, για έμπειρο δρομέα με καλή αερόβια βάση.',
    ],
  },
  swimming: {
    beginner: [
      'Short freestyle repeats with a kickboard and breathing practice for a new swimmer.',
      'Σύντομες επαναλήψεις ελεύθερου με σανίδα και εξάσκηση στην αναπνοή, για όποιον ξεκινάει την κολύμβηση.',
    ],
    intermediate: [
      'A mixed-stroke set with pull buoy and fins for someone who swims a kilometre comfortably.',
      'Σετ με διάφορα στιλ, pull buoy και βατραχοπέδιλα, για όποιον κολυμπάει άνετα ένα χιλιόμετρο.',
    ],
    advanced: [
      'Interval, butterfly and medley work for a confident swimmer with good technique in all four strokes.',
      'Διαλειμματικό, πεταλούδα και μικτή ατομική, για έμπειρο κολυμβητή με καλή τεχνική και στα τέσσερα στιλ.',
    ],
  },
  cycling: {
    beginner: [
      'A steady ride with cadence drills for someone new to structured cycling.',
      'Σταθερή διαδρομή με ασκήσεις ρυθμού πεταλιάς, για όποιον ξεκινάει τώρα την οργανωμένη ποδηλασία.',
    ],
    intermediate: [
      'Tempo and climbing intervals for a rider who trains two or three times a week.',
      'Tempo και διαστήματα ανηφόρας, για ποδηλάτη που προπονείται δύο με τρεις φορές την εβδομάδα.',
    ],
    advanced: [
      'VO2 intervals, sprints and low-cadence strength for an experienced rider.',
      'Διαστήματα VO2, σπριντ και δύναμη με χαμηλό ρυθμό πεταλιάς, για έμπειρο ποδηλάτη.',
    ],
  },
  mobility: {
    beginner: [
      'Gentle joint circles and floor stretches; suitable on any day, including rest days.',
      'Ήπιες κυκλικές κινήσεις των αρθρώσεων και διατάσεις στο στρώμα· ταιριάζει κάθε μέρα, ακόμη και στις μέρες ξεκούρασης.',
    ],
    intermediate: [
      'A flow of hip, spine and shoulder mobility for someone who already stretches regularly.',
      'Ροή κινητικότητας για ισχία, σπονδυλική στήλη και ώμους, για όποιον κάνει ήδη τακτικά διατάσεις.',
    ],
    advanced: [
      'Loaded and end-range mobility (Cossack squats, Jefferson curls, bridge) for experienced movers.',
      'Κινητικότητα με φορτίο και σε ακραίο εύρος (Cossack καθίσματα, Jefferson curl, γέφυρα), για έμπειρους ασκούμενους.',
    ],
  },
}

type Family = 'strength' | 'endurance' | 'mobility'

const FAMILY: { [T in WorkoutType]: Family } = {
  home: 'strength',
  gym: 'strength',
  calisthenics: 'strength',
  running: 'endurance',
  swimming: 'endurance',
  cycling: 'endurance',
  mobility: 'mobility',
}

/** Sentence 2 of the notes: how the intensity is set and how to scale it. */
const SCALE: { [F in Family]: { [I in Intensity]: Pair } } = {
  strength: {
    low: [
      'Two sets per exercise with long rests — add a set or shorten the rest when it feels easy.',
      'Δύο σετ ανά άσκηση με μεγάλες παύσεις — πρόσθεσε ένα σετ ή μείωσε την παύση όταν σου φαίνεται εύκολο.',
    ],
    moderate: [
      "Three sets per exercise with a minute's rest — drop a set or lengthen the rest if you cannot keep good form.",
      'Τρία σετ ανά άσκηση με ένα λεπτό παύση — αφαίρεσε ένα σετ ή αύξησε την παύση αν δεν κρατάς καλή τεχνική.',
    ],
    high: [
      'Four sets with short rests; keep two reps in reserve and lower the load before you lower the standard.',
      'Τέσσερα σετ με σύντομες παύσεις· κράτα δύο επαναλήψεις στο απόθεμα και μείωσε το φορτίο πριν χαλάσει η τεχνική.',
    ],
  },
  endurance: {
    low: [
      'Keep every effort conversational — if you cannot talk in short sentences, slow down.',
      'Κράτα κάθε προσπάθεια σε ρυθμό που μπορείς να μιλάς — αν δεν βγάζεις σύντομες προτάσεις, κόψε ταχύτητα.',
    ],
    moderate: [
      'Efforts are comfortably hard; shorten them or add recovery if your pace fades in the last repeat.',
      'Οι προσπάθειες είναι άνετα δύσκολες· μείωσέ τες ή πρόσθεσε αποκατάσταση αν ο ρυθμός πέφτει στην τελευταία επανάληψη.',
    ],
    high: [
      'Hard but controlled — stop the set when you can no longer hold the pace of the first repeat.',
      'Δύσκολο αλλά ελεγχόμενο — σταμάτα το σετ όταν δεν κρατάς πια τον ρυθμό της πρώτης επανάληψης.',
    ],
  },
  mobility: {
    low: [
      'Hold each position for about 30 seconds and breathe slowly; no bouncing.',
      'Κράτα κάθε θέση περίπου 30 δευτερόλεπτα και ανάπνεε αργά· χωρίς αναπηδήσεις.',
    ],
    moderate: [
      'Hold each position for about 40 seconds, moving a little deeper on each exhale.',
      'Κράτα κάθε θέση περίπου 40 δευτερόλεπτα, πηγαίνοντας λίγο βαθύτερα σε κάθε εκπνοή.',
    ],
    high: [
      'Two rounds of 50-second holds; go to a strong but comfortable stretch, never into pain.',
      'Δύο γύροι με κρατήματα 50 δευτερολέπτων· φτάσε σε έντονη αλλά ανεκτή διάταση, ποτέ σε πόνο.',
    ],
  },
}

/** Sentence 3 of the notes: when to stop (the health disclaimer, PLAN.md §1). */
const STOP: Pair = [
  'Stop if you feel sharp pain, dizziness or chest discomfort, and talk to a doctor before starting if you have a health condition.',
  'Σταμάτα αν νιώσεις οξύ πόνο, ζάλη ή ενόχληση στο στήθος, και συμβουλέψου γιατρό πριν ξεκινήσεις αν έχεις κάποιο πρόβλημα υγείας.',
]

// --- assembly ------------------------------------------------------------------------------------

/** Seconds assumed per rep when estimating the duration of a reps-based set. */
const SECONDS_PER_REP = 3

/** Seconds added per movement for setting up / changing station. */
const TRANSITION_SECONDS = 30

/** Estimate the session length from its blocks, rounded UP to the next 5 minutes. */
function estimateDurationMin(blocks: readonly WorkoutBlockSeed[]): number {
  let seconds = 0
  for (const item of blocks) {
    const work = item.seconds ?? (item.reps ?? 0) * SECONDS_PER_REP
    seconds += item.sets * (work + item.rest_seconds) + TRANSITION_SECONDS
  }
  return Math.ceil(seconds / 60 / 5) * 5
}

function itemFor(block: Block, spec: ItemSpec, intensity: Intensity): WorkoutBlockSeed {
  return {
    block,
    exercise_slug: spec.slug,
    sets: pick(spec.sets, intensity),
    reps: spec.reps === undefined ? null : pick(spec.reps, intensity),
    seconds: spec.seconds === undefined ? null : pick(spec.seconds, intensity),
    rest_seconds: pick(spec.rest, intensity),
  }
}

function templateFor(type: WorkoutType, level: Level, intensity: Intensity): WorkoutTemplateSeed {
  const design = DESIGN[type][level]
  const blocks = BLOCKS.flatMap((block) =>
    design[block].map((spec) => itemFor(block, spec, intensity)),
  )
  const [typeEn, typeEl] = TYPE_NAME[type]
  const [levelEn, levelEl] = LEVEL_NAME[level]
  const [intensityEn, intensityEl] = INTENSITY_NAME[intensity]
  const [whoEn, whoEl] = WHO[type][level]
  const [scaleEn, scaleEl] = SCALE[FAMILY[type]][intensity]
  return {
    slug: `${type}-${level}-${intensity}`,
    workout_type: type,
    level,
    intensity,
    title_en: `${typeEn} · ${levelEn} · ${intensityEn}`,
    title_el: `${typeEl} · ${levelEl} · ${intensityEl}`,
    duration_min: estimateDurationMin(blocks),
    notes_en: `${whoEn} ${scaleEn} ${STOP[0]}`,
    notes_el: `${whoEl} ${scaleEl} ${STOP[1]}`,
    blocks,
  }
}

/** The 63 workout templates, ordered type → level → intensity as the enums list them. */
export const WORKOUT_TEMPLATES: readonly WorkoutTemplateSeed[] = WORKOUT_TYPES.flatMap((type) =>
  LEVELS.flatMap((level) => INTENSITIES.map((intensity) => templateFor(type, level, intensity))),
)
