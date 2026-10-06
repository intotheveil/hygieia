// TASKS ADVISOR — the topic list (P9). Small on purpose: the `/tasks` grid renders from this file
// alone (it ships in the page chunk), while each topic's questionnaire and task bank is its own
// lazy chunk (`./index.ts` `loadTopic`). `e2e/support/routes.ts` imports it through node
// type-stripping, so: erasable syntax only and explicit `.ts` extensions.

import type { TopicMeta } from '../types.ts'

export const TOPIC_IDS = [
  'clean-home',
  'workout-routine',
  'better-sleep',
  'eat-healthier',
  'drink-water',
  'skincare-habit',
  'declutter',
  'reduce-stress',
  'morning-routine',
  'budget-groceries',
  'study-focus',
] as const
export type TopicId = (typeof TOPIC_IDS)[number]

export function isTopicId(value: string): value is TopicId {
  return (TOPIC_IDS as readonly string[]).includes(value)
}

export const TOPICS: Readonly<Record<TopicId, TopicMeta>> = {
  'clean-home': {
    id: 'clean-home',
    icon: '⌂',
    title: { en: 'Clean home, kept clean', el: 'Καθαρό σπίτι που μένει καθαρό' },
    blurb: {
      en: 'Short daily resets and one bigger job a day, sized to your home and your time.',
      el: 'Σύντομα καθημερινά «συμμαζέματα» και μία μεγαλύτερη δουλειά τη μέρα, στα μέτρα του σπιτιού και του χρόνου σου.',
    },
  },
  'workout-routine': {
    id: 'workout-routine',
    icon: '⟳',
    title: { en: 'Start a workout routine', el: 'Ξεκίνα ένα πρόγραμμα άσκησης' },
    blurb: {
      en: 'A realistic week of movement for your level, place and schedule — building up, not burning out.',
      el: 'Μια ρεαλιστική εβδομάδα κίνησης για το επίπεδο, τον χώρο και το πρόγραμμά σου — σταδιακά, χωρίς υπερβολές.',
    },
  },
  'better-sleep': {
    id: 'better-sleep',
    icon: '☾',
    title: { en: 'Better sleep', el: 'Καλύτερος ύπνος' },
    blurb: {
      en: 'Wind-down habits, a steadier rhythm and a bedroom that helps you rest.',
      el: 'Συνήθειες χαλάρωσης, πιο σταθερό ρυθμό και ένα υπνοδωμάτιο που σε βοηθά να ξεκουραστείς.',
    },
  },
  'eat-healthier': {
    id: 'eat-healthier',
    icon: '✿',
    title: { en: 'Eat better and meal-prep', el: 'Τρώω καλύτερα και μαγειρεύω από πριν' },
    blurb: {
      en: 'Plan, shop and prep a little each week so the easy choice is also the good one.',
      el: 'Λίγος προγραμματισμός, ψώνια και προετοιμασία κάθε εβδομάδα, ώστε η εύκολη επιλογή να είναι και η καλή.',
    },
  },
  'drink-water': {
    id: 'drink-water',
    icon: '≈',
    title: { en: 'Drink more water', el: 'Πίνω περισσότερο νερό' },
    blurb: {
      en: 'Tiny cues across the day that make drinking water automatic.',
      el: 'Μικρές υπενθυμίσεις μέσα στη μέρα που κάνουν το νερό αυτόματη συνήθεια.',
    },
  },
  'skincare-habit': {
    id: 'skincare-habit',
    icon: '❋',
    title: { en: 'A skincare habit that sticks', el: 'Ρουτίνα περιποίησης που κρατάει' },
    blurb: {
      en: 'Morning and evening basics, plus the weekly extras — matched to your skin and your patience.',
      el: 'Τα βασικά πρωί και βράδυ, συν τα εβδομαδιαία extra — ανάλογα με την επιδερμίδα και την υπομονή σου.',
    },
  },
  declutter: {
    id: 'declutter',
    icon: '▤',
    title: { en: 'Declutter and organise', el: 'Ξεσκαρτάρισμα και οργάνωση' },
    blurb: {
      en: 'One drawer, one shelf, one corner at a time — until everything has a place.',
      el: 'Ένα συρτάρι, ένα ράφι, μια γωνιά τη φορά — μέχρι όλα να έχουν τη θέση τους.',
    },
  },
  'reduce-stress': {
    id: 'reduce-stress',
    icon: '◯',
    title: { en: 'Less stress, more calm', el: 'Λιγότερο άγχος, περισσότερη ηρεμία' },
    blurb: {
      en: 'Breathing, pauses, movement and small rituals that give your day some air.',
      el: 'Αναπνοές, παύσεις, κίνηση και μικρές συνήθειες που αφήνουν τη μέρα σου να ανασάνει.',
    },
  },
  'morning-routine': {
    id: 'morning-routine',
    icon: '☀',
    title: { en: 'A morning routine', el: 'Πρωινή ρουτίνα' },
    blurb: {
      en: 'A calm, repeatable start to the day that fits the time you really have.',
      el: 'Ένα ήρεμο, σταθερό ξεκίνημα της μέρας, στον χρόνο που πραγματικά έχεις.',
    },
  },
  'budget-groceries': {
    id: 'budget-groceries',
    icon: '€',
    title: { en: 'Weekly budget and groceries', el: 'Εβδομαδιαίος προϋπολογισμός και ψώνια' },
    blurb: {
      en: 'Know where the money goes, shop with a list and waste less food.',
      el: 'Μάθε πού πάνε τα χρήματα, ψώνιζε με λίστα και πέτα λιγότερο φαγητό.',
    },
  },
  'study-focus': {
    id: 'study-focus',
    icon: '✎',
    title: { en: 'Study and focus', el: 'Διάβασμα και συγκέντρωση' },
    blurb: {
      en: 'Focused sessions, regular reviews and a desk that works for you, not against you.',
      el: 'Συγκεντρωμένες ώρες μελέτης, τακτικές επαναλήψεις και ένα γραφείο που σε βοηθά αντί να σε αποσπά.',
    },
  },
}
