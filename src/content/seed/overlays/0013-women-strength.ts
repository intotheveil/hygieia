// OVERLAY 0013 — a women's strength-training track (2026-10-11; docs/research/women-audience-content.md
// proposal 1: resistance training improves strength and bone density, so lead with it). Adds:
//   * 6 workout templates on track `women-strength` (the track column and the per-track cell key are
//     20261007001250_hygieia_workout_track.sql; this overlay is content only): two gym full-body
//     beginner days (A moderate, B low — B cannot share A's cell on the same track), a home dumbbell
//     beginner session, a gym lower and a gym upper intermediate day, and a home glutes-and-core
//     intermediate session. Slugs are a contract (other pages link to the track by type and level).
//   * 14 exercises the P4.7 library lacked (hip thrust, farmer and suitcase carries, dumbbell RDL,
//     home goblet squat, step-up, dead bug, …); every other movement reuses an existing slug.
// Body-positive on purpose: strength, bone health and confidence — never "toning" or weight loss.
// Gym templates may borrow bodyweight `home` and `mobility` movements for warm-ups and cool-downs;
// home templates use only `home` and `mobility` ones (women-strength.test.ts pins both).
//
// The rows live in ./0013-women-strength/<table>.ts, one module per bundled table loader (perf —
// ./by-table/ re-exports each table's slice); this module assembles the overlay.

import type { Overlay } from './types.ts'
import { EXERCISES } from './0013-women-strength/exercises.ts'
import { WORKOUT_TEMPLATES } from './0013-women-strength/workout_templates.ts'

export const OVERLAY: Overlay = {
  id: '0013-women-strength',
  summary:
    "women's strength track: 6 workout templates on track women-strength and 14 new exercises",
  additions: {
    exercises: EXERCISES,
    workout_templates: WORKOUT_TEMPLATES,
  },
}
