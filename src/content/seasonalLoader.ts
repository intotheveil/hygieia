// SEASONAL LOADER — the one way app code reaches ./seasonal.ts. The produce calendar is not needed
// for a route's first paint, so it is a dynamic import started only after that paint
// (`afterNextPaint`, lib/afterPaint.ts) and memoised: the /recipes page (for `?season=now`) and the
// season strip share one request. A failed import is forgotten so a later call retries.

import { afterNextPaint } from '../lib/afterPaint.ts'

export type SeasonalModule = typeof import('./seasonal.ts')

let pending: Promise<SeasonalModule> | null = null

/** The seasonal module, imported once, after the current frame has painted. */
export function loadSeasonal(): Promise<SeasonalModule> {
  pending ??= afterNextPaint()
    .then(() => import('./seasonal.ts'))
    .catch((error: unknown) => {
      pending = null
      throw error
    })
  return pending
}
