// TASKS ADVISOR — topic loaders (P9). Each topic's questionnaire and task bank is its own lazy chunk
// (Vite emits one per dynamic import), so `/tasks` ships only the small topic list (./topics.ts)
// and `/tasks/<topic>` fetches one bank. Same shape as the bundled seed tables (BRAIN §2).

import type { Topic } from '../types.ts'
import { TOPIC_IDS, type TopicId } from './topics.ts'

export const TOPIC_LOADERS: Readonly<Record<TopicId, () => Promise<Topic>>> = {
  'clean-home': () => import('./clean-home.ts').then((m) => m.cleanHome),
  'workout-routine': () => import('./workout-routine.ts').then((m) => m.workoutRoutine),
  'better-sleep': () => import('./better-sleep.ts').then((m) => m.betterSleep),
  'eat-healthier': () => import('./eat-healthier.ts').then((m) => m.eatHealthier),
  'drink-water': () => import('./drink-water.ts').then((m) => m.drinkWater),
  'skincare-habit': () => import('./skincare-habit.ts').then((m) => m.skincareHabit),
  declutter: () => import('./declutter.ts').then((m) => m.declutter),
  'reduce-stress': () => import('./reduce-stress.ts').then((m) => m.reduceStress),
  'morning-routine': () => import('./morning-routine.ts').then((m) => m.morningRoutine),
  'budget-groceries': () => import('./budget-groceries.ts').then((m) => m.budgetGroceries),
  'study-focus': () => import('./study-focus.ts').then((m) => m.studyFocus),
  'newborn-routine': () => import('./newborn-routine.ts').then((m) => m.newbornRoutine),
  'pet-care': () => import('./pet-care.ts').then((m) => m.petCare),
  'plants-garden': () => import('./plants-garden.ts').then((m) => m.plantsGarden),
  'car-care': () => import('./car-care.ts').then((m) => m.carCare),
  'moving-house': () => import('./moving-house.ts').then((m) => m.movingHouse),
  'exam-season': () => import('./exam-season.ts').then((m) => m.examSeason),
  'summer-prep': () => import('./summer-prep.ts').then((m) => m.summerPrep),
  'quit-smoking': () => import('./quit-smoking.ts').then((m) => m.quitSmoking),
}

export function loadTopic(id: TopicId): Promise<Topic> {
  return TOPIC_LOADERS[id]()
}

/** Every topic, in TOPIC_IDS order (tests and tooling; the app loads one at a time). */
export function loadAllTopics(): Promise<Topic[]> {
  return Promise.all(TOPIC_IDS.map((id) => loadTopic(id)))
}
