// WORKOUTS DICTIONARY (P4.8 UI) — every string the `/workouts` page shows, in both languages
// (ADR-0002 at feature scale). Composed into the app `Dictionary` by ./index.ts; never imported
// by a screen directly — screens read `t` from `useLang()`.
//
// Enum labels (`types`, `levels`, `intensities`, `blocks`) are keyed by the content enums so a
// missing label for a new enum member is a type error. Greek loanwords stay Latin-script in `el`
// (PLAN.md §0: calisthenics).

import type { Block, Intensity, Level, WorkoutType } from '../../content/enums.ts'

export interface WorkoutsDictionary {
  workoutsTitle: string
  workoutsIntro: string
  pickType: string
  pickLevel: string
  pickIntensity: string
  types: Record<WorkoutType, string>
  levels: Record<Level, string>
  intensities: Record<Intensity, string>
  blocks: Record<Block, string>
  /** Unit word after the set count: "3 sets". */
  sets: string
  /** Unit word after the rep count: "12 reps". */
  reps: string
  /** Unit abbreviation after a number of seconds: "40 s". */
  seconds: string
  /** Label before the rest figure: "rest 60 s". */
  rest: string
  duration: string
  /** Suffix after the duration figure: "25 min". */
  minutesUnit: string
  equipment: string
  bodyweight: string
  showCue: string
  noSession: string
  workoutsLoadFailed: string
}

export const workoutsEn: WorkoutsDictionary = {
  workoutsTitle: 'Workouts',
  workoutsIntro:
    'Pick where you train, your level and how hard you want to go. You get one session laid out as warm-up, main block and cool-down, with a coaching cue for every movement.',
  pickType: 'Where do you train?',
  pickLevel: 'Your level',
  pickIntensity: 'Intensity',
  types: {
    home: 'Home',
    gym: 'Gym',
    calisthenics: 'Calisthenics',
    running: 'Running',
    swimming: 'Swimming',
    cycling: 'Cycling',
    mobility: 'Mobility',
  },
  levels: {
    beginner: 'Beginner',
    intermediate: 'Intermediate',
    advanced: 'Advanced',
  },
  intensities: {
    low: 'Low',
    moderate: 'Moderate',
    high: 'High',
  },
  blocks: {
    warmup: 'Warm-up',
    main: 'Main block',
    cooldown: 'Cool-down',
  },
  sets: 'sets',
  reps: 'reps',
  seconds: 's',
  rest: 'rest',
  duration: 'Duration',
  minutesUnit: 'min',
  equipment: 'Equipment',
  bodyweight: 'Bodyweight only — no equipment needed',
  showCue: 'Coaching cue',
  noSession: 'There is no session for this selection yet.',
  workoutsLoadFailed: 'The workouts could not be loaded. Check your connection and try again.',
}

export const workoutsEl: WorkoutsDictionary = {
  workoutsTitle: 'Προπονήσεις',
  workoutsIntro:
    'Διάλεξε πού προπονείσαι, το επίπεδό σου και πόσο έντονα θέλεις να δουλέψεις. Παίρνεις μία προπόνηση χωρισμένη σε προθέρμανση, κύριο μέρος και αποθεραπεία, με οδηγία εκτέλεσης για κάθε άσκηση.',
  pickType: 'Πού προπονείσαι;',
  pickLevel: 'Το επίπεδό σου',
  pickIntensity: 'Ένταση',
  types: {
    home: 'Σπίτι',
    gym: 'Γυμναστήριο',
    calisthenics: 'Calisthenics',
    running: 'Τρέξιμο',
    swimming: 'Κολύμβηση',
    cycling: 'Ποδηλασία',
    mobility: 'Κινητικότητα',
  },
  levels: {
    beginner: 'Αρχάριος',
    intermediate: 'Μεσαίος',
    advanced: 'Προχωρημένος',
  },
  intensities: {
    low: 'Χαμηλή',
    moderate: 'Μέτρια',
    high: 'Υψηλή',
  },
  blocks: {
    warmup: 'Προθέρμανση',
    main: 'Κύριο μέρος',
    cooldown: 'Αποθεραπεία',
  },
  sets: 'σετ',
  reps: 'επαναλήψεις',
  seconds: 'δευτ.',
  rest: 'ξεκούραση',
  duration: 'Διάρκεια',
  minutesUnit: 'λεπτά',
  equipment: 'Εξοπλισμός',
  bodyweight: 'Μόνο με το βάρος του σώματος — χωρίς εξοπλισμό',
  showCue: 'Οδηγία εκτέλεσης',
  noSession: 'Δεν υπάρχει ακόμη προπόνηση για αυτή την επιλογή.',
  workoutsLoadFailed: 'Οι προπονήσεις δεν φορτώθηκαν. Έλεγξε τη σύνδεσή σου και δοκίμασε ξανά.',
}
