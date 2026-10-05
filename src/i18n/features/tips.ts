// TIPS DICTIONARY (P4.9 UI) — every string the `/tips` page shows, in both languages (ADR-0002 at
// feature scale). Composed into the app `Dictionary` by ./index.ts. `topics` is keyed by
// `TipTopic`, so a new topic without a label is a type error. `tipsCount` carries a `{n}`
// placeholder filled by `fill()` (../fill.ts).

import type { TipTopic } from '../../content/enums.ts'

export interface TipsDictionary {
  tipsTitle: string
  tipsIntro: string
  allTopics: string
  topics: Record<TipTopic, string>
  readSource: string
  sourcePending: string
  /** `{n}` = number of tips. */
  tipsCount: string
  tipsEmpty: string
  tipsLoadFailed: string
}

export const tipsEn: TipsDictionary = {
  tipsTitle: 'Health tips',
  tipsIntro:
    'Short, practical guidance on sleep, hydration, food, movement, habits and mental wellbeing. Each tip names its source, or says the source is still being checked.',
  allTopics: 'All topics',
  topics: {
    sleep: 'Sleep',
    hydration: 'Hydration',
    nutrition: 'Nutrition',
    movement: 'Movement',
    habits: 'Habits',
    mental: 'Mental wellbeing',
  },
  readSource: 'Read the source',
  sourcePending: 'Source pending review',
  tipsCount: '{n} tips',
  tipsEmpty: 'No tips to show yet.',
  tipsLoadFailed: 'The tips could not be loaded. Check your connection and try again.',
}

export const tipsEl: TipsDictionary = {
  tipsTitle: 'Συμβουλές υγείας',
  tipsIntro:
    'Σύντομη, πρακτική καθοδήγηση για ύπνο, ενυδάτωση, διατροφή, κίνηση, συνήθειες και ψυχική ευεξία. Κάθε συμβουλή αναφέρει την πηγή της, ή σημειώνει ότι η πηγή ελέγχεται ακόμη.',
  allTopics: 'Όλα τα θέματα',
  topics: {
    sleep: 'Ύπνος',
    hydration: 'Ενυδάτωση',
    nutrition: 'Διατροφή',
    movement: 'Κίνηση',
    habits: 'Συνήθειες',
    mental: 'Ψυχική ευεξία',
  },
  readSource: 'Διάβασε την πηγή',
  sourcePending: 'Η πηγή εκκρεμεί έλεγχο',
  tipsCount: '{n} συμβουλές',
  tipsEmpty: 'Δεν υπάρχουν συμβουλές προς εμφάνιση ακόμη.',
  tipsLoadFailed: 'Οι συμβουλές δεν φορτώθηκαν. Έλεγξε τη σύνδεσή σου και δοκίμασε ξανά.',
}
