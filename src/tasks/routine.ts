// SKINCARE ROUTINE → TASK PLAN (connect the features, 2026-10-06). Pure. A /skincare routine card's
// "Make it a daily habit" opens `/tasks/skincare-habit?routine=<slug>&skin=<type>&time=<am|pm|weekly>
// &area=<face|nails>` (`habitLink`). The tasks page pre-fills the questionnaire from the params
// (`answersFromParams`: skin type, and nails care for a nail routine) and renders the routine's own
// steps as a "Your routine" checklist ABOVE the generated plan (`fromSkincareRoutine`). The
// generator is untouched: the routine is a section of its own, ticked into the same local state.
//
// Routine step task ids are `routine-<area>-<order>`, which ./track.ts maps to a `skincare` or
// `nails` entry when the plan logs to the profile.

import type { CareArea, RoutineTime } from '../content/enums.ts'
import type { SkincareProductType, SkincareRoutine } from '../content/source.ts'
import type { Answers, Bi, Task } from './types'

export const HABIT_TOPIC = 'skincare-habit'

/** The query keys of the deep link. */
export const ROUTINE_PARAM = {
  routine: 'routine',
  skin: 'skin',
  time: 'time',
  area: 'area',
} as const

/** Skin types the skincare-habit questionnaire offers (its `skin` question's option ids). */
const HABIT_SKIN = ['dry', 'oily', 'combination', 'sensitive', 'normal'] as const

const SLUG = /^[a-z0-9][a-z0-9-]{0,119}$/

export interface RoutineSection {
  slug: string
  area: CareArea
  time: RoutineTime
  title: Bi
  /** One task per step, in step order (cadence daily, or weekly for a weekly routine). */
  tasks: Task[]
  /** Ids of the steps the routine marks optional. */
  optional: string[]
}

/** The deep link a routine card opens. */
export function habitLink(
  routine: Pick<SkincareRoutine, 'slug' | 'skin_type' | 'time' | 'area'>,
): string {
  const params = new URLSearchParams()
  params.set(ROUTINE_PARAM.routine, routine.slug)
  if ((HABIT_SKIN as readonly string[]).includes(routine.skin_type)) {
    params.set(ROUTINE_PARAM.skin, routine.skin_type)
  }
  params.set(ROUTINE_PARAM.time, routine.time)
  params.set(ROUTINE_PARAM.area, routine.area)
  return `/tasks/${HABIT_TOPIC}?${params.toString()}`
}

/** The routine slug named by the URL, or null when absent or malformed. */
export function routineSlugFrom(params: URLSearchParams): string | null {
  const slug = params.get(ROUTINE_PARAM.routine)
  return slug !== null && SLUG.test(slug) ? slug : null
}

/**
 * Questionnaire answers pre-filled from the deep link: the skin type (when the questionnaire has
 * it) and "nails and hands" for a nail routine. Empty when nothing usable is in the URL.
 */
export function answersFromParams(params: URLSearchParams): Answers {
  const out: Record<string, string[]> = {}
  const skin = params.get(ROUTINE_PARAM.skin)
  if (skin !== null && (HABIT_SKIN as readonly string[]).includes(skin)) out.skin = [skin]
  if (params.get(ROUTINE_PARAM.area) === 'nails') out.extras = ['nails']
  return out
}

/**
 * The "Your routine" section for a routine: its steps as tasks, titled with the product type's name
 * (the slug when no visible type has it) and the step's note as the detail. Minutes split the
 * routine's duration evenly over the steps (at least 1 each).
 */
export function fromSkincareRoutine(
  routine: SkincareRoutine,
  types: readonly SkincareProductType[] = [],
): RoutineSection {
  const bySlug = new Map(types.map((type) => [type.slug, type]))
  const steps = [...routine.steps].sort((a, b) => a.order - b.order)
  const minutes = Math.max(1, Math.round(routine.duration_min / Math.max(1, steps.length)))
  const cadence = routine.time === 'weekly' ? 'weekly' : 'daily'
  const optional: string[] = []
  const tasks = steps.map((step): Task => {
    const id = `routine-${routine.area}-${step.order}`
    if (step.optional) optional.push(id)
    const type = bySlug.get(step.product_type_slug)
    const title: Bi = type
      ? { el: type.name_el, en: type.name_en }
      : { el: step.product_type_slug, en: step.product_type_slug }
    const hasNote = step.note_el.trim() !== '' || step.note_en.trim() !== ''
    return {
      id,
      title,
      ...(hasNote ? { detail: { el: step.note_el, en: step.note_en } } : {}),
      minutes,
      cadence,
      when: {},
      weight: 5,
    }
  })
  return {
    slug: routine.slug,
    area: routine.area,
    time: routine.time,
    title: { el: routine.name_el, en: routine.name_en },
    tasks,
    optional,
  }
}
