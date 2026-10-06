// TASKS ADVISOR topic: start a workout routine (P9). Lazy chunk (./index.ts).
// The main sessions are generated from three small tables (place × daily time × days a week, for a
// gentle and a regular level) so every answer combination has exactly one session task. Sessions
// are weight 6 (anchors, placed first — `generate.ts`) and leave a few minutes of the day's budget
// (gentle: `gentleBudget`) for the small daily habits.
import type { Task } from '../types.ts'
import { daily, kickoff, monthly, opt, question, topic, weekly, type Pair } from './build.ts'
import { TOPICS } from './topics.ts'

const PLACES: ReadonlyArray<{ id: string; name: Pair; plan: Pair }> = [
  {
    id: 'home',
    name: ['Home workout', 'Προπόνηση στο σπίτι'],
    plan: [
      'Warm up, then squats, push-ups (wall or knees are fine), lunges, glute bridges and a plank, in rounds.',
      'Ζέσταμα και μετά καθίσματα, κάμψεις (στον τοίχο ή στα γόνατα είναι μια χαρά), προβολές, γέφυρες γλουτών και σανίδα, σε γύρους.',
    ],
  },
  {
    id: 'gym',
    name: ['Gym session', 'Προπόνηση στο γυμναστήριο'],
    plan: [
      'Five minutes on a bike or treadmill, then one push, one pull and one leg exercise, two or three sets each.',
      'Πέντε λεπτά ποδήλατο ή διάδρομο και μετά μία άσκηση ώθησης, μία έλξης και μία ποδιών, από δύο-τρία σετ.',
    ],
  },
  {
    id: 'outdoors',
    name: ['Outdoor session', 'Προπόνηση έξω'],
    plan: [
      'Brisk walk or easy jog, with a few stops for squats, step-ups on a bench and incline push-ups.',
      'Γρήγορο περπάτημα ή χαλαρό τρέξιμο, με στάσεις για καθίσματα, ανεβάσματα σε παγκάκι και κάμψεις σε κεκλιμένο.',
    ],
  },
]

const TIMES = [
  { id: 't15', gentle: 10, regular: 10 },
  { id: 't30', gentle: 15, regular: 20 },
  { id: 't45', gentle: 25, regular: 35 },
] as const

const DAYS_A_WEEK = [
  { id: 'd2', gentle: 2, regular: 2 },
  { id: 'd3', gentle: 3, regular: 3 },
  { id: 'd5', gentle: 3, regular: 5 },
] as const

function sessions(): Task[] {
  const out: Task[] = []
  for (const place of PLACES) {
    for (const time of TIMES) {
      for (const days of DAYS_A_WEEK) {
        out.push(
          weekly(
            `session-easy-${place.id}-${time.id}-${days.id}`,
            time.gentle,
            6,
            [`${place.name[0]}, easy pace`, `${place.name[1]}, χαλαρός ρυθμός`],
            {
              when: {
                level: ['new', 'returning'],
                place: [place.id],
                time: [time.id],
                days: [days.id],
              },
              times: days.gentle,
              detail: [
                `${place.plan[0]} Stop while it still feels good.`,
                `${place.plan[1]} Σταμάτα όσο ακόμη νιώθεις καλά.`,
              ],
            },
          ),
          weekly(
            `session-${place.id}-${time.id}-${days.id}`,
            time.regular,
            6,
            [place.name[0], place.name[1]],
            {
              when: { level: ['regular'], place: [place.id], time: [time.id], days: [days.id] },
              times: days.regular,
              detail: place.plan,
            },
          ),
        )
      }
    }
  }
  return out
}

export const workoutRoutine = topic(
  TOPICS['workout-routine'],
  [
    question(
      'level',
      'single',
      ['Where are you starting from?', 'Από πού ξεκινάς;'],
      [
        opt('new', ['New to exercise', 'Δεν έχω γυμναστεί ποτέ σταθερά'], { gentle: true }),
        opt('returning', ['Coming back after a break', 'Επιστρέφω μετά από διάλειμμα'], {
          gentle: true,
        }),
        opt('regular', ['I already move regularly', 'Ήδη κινούμαι τακτικά']),
      ],
    ),
    question(
      'place',
      'single',
      ['Where would you rather train?', 'Πού προτιμάς να γυμνάζεσαι;'],
      [
        opt('home', ['At home', 'Στο σπίτι']),
        opt('gym', ['At a gym', 'Σε γυμναστήριο']),
        opt('outdoors', ['Outdoors', 'Έξω, στον αέρα']),
      ],
    ),
    question(
      'days',
      'single',
      ['How many days a week can you train?', 'Πόσες μέρες την εβδομάδα μπορείς να γυμναστείς;'],
      [opt('d2', ['Two', 'Δύο']), opt('d3', ['Three', 'Τρεις']), opt('d5', ['Five', 'Πέντε'])],
    ),
    question(
      'time',
      'single',
      ['How long can a session be?', 'Πόσο μπορεί να κρατάει μια προπόνηση;'],
      [
        opt('t15', ['About 15 minutes', 'Περίπου 15 λεπτά'], { minutes: 15 }),
        opt('t30', ['About 30 minutes', 'Περίπου 30 λεπτά'], { minutes: 30 }),
        opt('t45', ['About 45 minutes', 'Περίπου 45 λεπτά'], { minutes: 45 }),
      ],
    ),
    question(
      'goal',
      'multi',
      ['What do you want more of?', 'Τι θέλεις να κερδίσεις;'],
      [
        opt('strength', ['Strength', 'Δύναμη']),
        opt('stamina', ['Stamina', 'Αντοχή']),
        opt('mobility', ['Flexibility and mobility', 'Ευλυγισία και κινητικότητα']),
        opt('calm', ['A clearer head', 'Καθαρό μυαλό']),
      ],
      ['Choose any — or none.', 'Διάλεξε όσα θέλεις — ή κανένα.'],
    ),
  ],
  [
    ...sessions(),

    // daily habits
    daily('stretch-5', 5, 4, ['Five minutes of gentle stretching', 'Πέντε λεπτά ήπιες διατάσεις']),
    daily('stairs', 2, 3, ['Take the stairs at least once', 'Ανέβα σκάλες τουλάχιστον μία φορά']),
    daily('move-hourly', 2, 3, [
      'Stand up and move for two minutes every hour you sit',
      'Σήκω και κινήσου δύο λεπτά για κάθε ώρα που κάθεσαι',
    ]),
    weekly(
      'walk-meal',
      10,
      4,
      ['A ten-minute walk after a meal', 'Δεκάλεπτη βόλτα μετά το φαγητό'],
      {
        times: 3,
        when: { goal: ['stamina', 'calm'] },
      },
    ),
    daily(
      'clothes-ready',
      2,
      4,
      ['Lay out tomorrow’s workout clothes', 'Ετοίμασε τα ρούχα γυμναστικής για αύριο'],
      {
        when: { level: ['new', 'returning'] },
      },
    ),
    daily('water', 1, 2, [
      'Keep a water bottle where you can see it',
      'Κράτα ένα μπουκάλι νερό σε σημείο που το βλέπεις',
    ]),
    daily('breathe', 3, 4, ['Three minutes of slow breathing', 'Τρία λεπτά αργές αναπνοές'], {
      when: { goal: ['calm'] },
    }),
    // weekly extras
    weekly(
      'plan-week',
      10,
      5,
      [
        'Pick your workout days and times for next week',
        'Όρισε μέρες και ώρες προπόνησης για την επόμενη εβδομάδα',
      ],
      {
        day: 'sun',
      },
    ),
    weekly('core', 10, 3, ['Ten-minute core circuit', 'Δεκάλεπτο κύκλωμα για τον κορμό'], {
      when: { goal: ['strength'] },
      times: 2,
    }),
    weekly('brisk-walk', 20, 3, ['Twenty-minute brisk walk', 'Εικοσάλεπτο γρήγορο περπάτημα'], {
      when: { goal: ['stamina'], time: ['t30', 't45'] },
      times: 2,
    }),
    weekly(
      'mobility-flow',
      15,
      3,
      ['Fifteen-minute stretch or yoga flow', 'Δεκαπεντάλεπτες διατάσεις ή yoga'],
      {
        when: { goal: ['mobility'], time: ['t30', 't45'] },
        times: 2,
      },
    ),
    weekly(
      'mobility-short',
      10,
      3,
      [
        'Ten minutes of hips and shoulders mobility',
        'Δέκα λεπτά κινητικότητα για λεκάνη και ώμους',
      ],
      {
        when: { goal: ['mobility'], time: ['t15'] },
        times: 2,
      },
    ),
    weekly(
      'phone-free-walk',
      15,
      3,
      ['A slow walk without your phone', 'Αργή βόλτα χωρίς κινητό'],
      {
        when: { goal: ['calm'], time: ['t30', 't45'] },
      },
    ),
    weekly(
      'long-walk',
      30,
      3,
      ['A longer walk or bike ride', 'Μεγαλύτερη βόλτα με τα πόδια ή με ποδήλατο'],
      {
        when: { time: ['t30', 't45'] },
        day: 'sat',
      },
    ),
    weekly(
      'rest-stretch',
      10,
      2,
      ['Rest day: a light stretch', 'Μέρα ξεκούρασης: ελαφριές διατάσεις'],
      { day: 'sun' },
    ),
    weekly(
      'pack-bag',
      5,
      2,
      ['Pack the gym bag the night before', 'Ετοίμασε την τσάντα του γυμναστηρίου από το βράδυ'],
      {
        when: { place: ['gym'] },
        times: 2,
      },
    ),
    weekly('balance', 5, 2, [
      'Balance practice: stand on one leg, then the other',
      'Ισορροπία: στάσου στο ένα πόδι και μετά στο άλλο',
    ]),
    weekly(
      'check-in',
      5,
      2,
      [
        'How did the week feel? Adjust next week by one notch',
        'Πώς ήταν η εβδομάδα; Προσάρμοσε την επόμενη κατά ένα βήμα',
      ],
      {
        day: 'sun',
      },
    ),

    // kick-off
    kickoff('ko-walk', 10, 5, [
      'Go for an easy ten-minute walk',
      'Κάνε μια χαλαρή δεκάλεπτη βόλτα',
    ]),
    kickoff('ko-shoes', 5, 4, [
      'Check your shoes are comfortable and supportive',
      'Έλεγξε ότι τα παπούτσια σου είναι άνετα και σταθερά',
    ]),
    kickoff(
      'ko-space',
      10,
      4,
      [
        'Clear a spot at home big enough to lie down and move',
        'Άδειασε ένα σημείο στο σπίτι όπου χωράς να ξαπλώσεις και να κινηθείς',
      ],
      {
        when: { place: ['home'] },
      },
    ),
    kickoff(
      'ko-gym-tour',
      20,
      4,
      [
        'Ask the gym staff for a short tour and a starter plan',
        'Ζήτα από το γυμναστήριο μια σύντομη ξενάγηση και ένα πρόγραμμα αρχαρίου',
      ],
      {
        when: { place: ['gym'], time: ['t30', 't45'] },
      },
    ),
    kickoff(
      'ko-route',
      10,
      4,
      [
        'Plan a safe, well-lit route near home',
        'Βρες μια ασφαλή, φωτισμένη διαδρομή κοντά στο σπίτι',
      ],
      {
        when: { place: ['outdoors'] },
      },
    ),
    kickoff('ko-baseline', 5, 3, [
      'Write down how you feel today: energy, sleep, mood',
      'Γράψε πώς νιώθεις σήμερα: ενέργεια, ύπνος, διάθεση',
    ]),
    kickoff('ko-buddy', 5, 3, [
      'Tell a friend your plan — or invite them along',
      'Πες σε έναν φίλο το πλάνο σου — ή κάλεσέ τον μαζί',
    ]),
    kickoff('ko-check', 5, 3, [
      'If you have a health condition, ask your doctor what suits you',
      'Αν έχεις κάποιο θέμα υγείας, ρώτα τον γιατρό σου τι σου ταιριάζει',
    ]),

    // monthly
    monthly('progress', 10, 4, [
      'Progress check: repeat a simple test from week one',
      'Έλεγχος προόδου: επανάλαβε ένα απλό τεστ της πρώτης εβδομάδας',
    ]),
    monthly('new-move', 15, 3, [
      'Learn one new exercise properly',
      'Μάθε σωστά μία καινούργια άσκηση',
    ]),
    monthly('review', 10, 3, [
      'Review the month: keep, change, add one thing',
      'Ανασκόπηση μήνα: κράτα, άλλαξε, πρόσθεσε ένα πράγμα',
    ]),
    monthly('playlist', 10, 2, [
      'Refresh your workout playlist',
      'Ανανέωσε τη λίστα μουσικής της προπόνησης',
    ]),
    monthly('gear', 10, 2, [
      'Wash your mat, bottle and gear',
      'Πλύνε στρωματάκι, παγούρι και εξοπλισμό',
    ]),
    monthly('treat', 5, 2, ['Celebrate a month of showing up', 'Γιόρτασε έναν μήνα συνέπειας']),
  ],
)
