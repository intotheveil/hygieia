// AFTER THE NEXT PAINT (perf, 2026-10-06 — CI Lighthouse diet 84).
//
// Resolves once the frame being rendered now is on screen: two animation frames (the second one
// runs only after the first frame was presented), then a task, so whatever the caller starts next
// is not part of that paint. Used by the bundled seed loaders (content/bundled.ts): a content page
// paints its frame — header, intro, draft ribbon, skeleton — and only THEN asks for its 15–90 kB
// seed chunk, so on a slow network the first paint does not share bandwidth with data it does not
// show. Lighthouse measures exactly that: any request that starts before the largest paint is
// charged to LCP, and the seed requests used to start in the same frame as the header that is the
// LCP element on /workouts, /skincare, /tips (measured: workouts 87 → 90, skincare 86 → 90).
//
// Resolves AT ONCE where there is no paint to wait for — no `requestAnimationFrame` / `document`
// (node), or a document that is not visible (a background tab gets no animation frames, and must
// not sit on its data until it is shown) — and as soon as visibility changes while waiting.

export function afterNextPaint(): Promise<void> {
  if (
    typeof requestAnimationFrame !== 'function' ||
    typeof document === 'undefined' ||
    document.visibilityState !== 'visible'
  ) {
    return Promise.resolve()
  }
  return new Promise<void>((resolve) => {
    let done = false
    const finish = () => {
      if (done) return
      done = true
      document.removeEventListener('visibilitychange', finish)
      resolve()
    }
    document.addEventListener('visibilitychange', finish)
    requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(finish, 0)))
  })
}

/** The one field of a `PerformanceElementTiming` entry used here (not in TypeScript's DOM lib). */
interface ElementTimingEntry extends PerformanceEntry {
  readonly identifier: string
}

const isElementTiming = (entry: PerformanceEntry): entry is ElementTimingEntry =>
  'identifier' in entry && typeof entry.identifier === 'string'

/** The longest a caller waits for an element that never reports a paint (zero-size, off-screen). */
export const ELEMENT_PAINT_TIMEOUT_MS = 1000

/**
 * Resolve once the element carrying `elementtiming="<identifier>"` is ON SCREEN — its Element
 * Timing entry (Chromium) is emitted with the presentation time of the frame that painted it. Used
 * to start a page's SECOND-stage reads (below-the-fold data) only after its above-the-fold frame is
 * shown (diets/DietPage.tsx, fridge/FridgePage.tsx). Two animation frames are not enough for that:
 * Chrome pipelines frames, and the frame with a large new subtree was measured on screen 20–40 ms
 * after the second `requestAnimationFrame` callback.
 *
 * Falls back to `afterNextPaint()` where the API is missing (Firefox, Safari, jsdom), resolves at
 * once for a hidden document and on a visibility change, and never waits longer than
 * `ELEMENT_PAINT_TIMEOUT_MS`. Buffered entries count, so an element that already painted resolves
 * at once.
 */
export function afterElementPainted(identifier: string): Promise<void> {
  if (
    typeof PerformanceObserver === 'undefined' ||
    !PerformanceObserver.supportedEntryTypes?.includes('element')
  ) {
    return afterNextPaint()
  }
  if (typeof document === 'undefined' || document.visibilityState !== 'visible') {
    return Promise.resolve()
  }
  return new Promise<void>((resolve) => {
    let done = false
    const observer = new PerformanceObserver((list) => {
      if (list.getEntries().some((e) => isElementTiming(e) && e.identifier === identifier)) {
        finish()
      }
    })
    const timer = setTimeout(() => finish(), ELEMENT_PAINT_TIMEOUT_MS)
    function finish() {
      if (done) return
      done = true
      observer.disconnect()
      clearTimeout(timer)
      document.removeEventListener('visibilitychange', finish)
      resolve()
    }
    document.addEventListener('visibilitychange', finish)
    observer.observe({ type: 'element', buffered: true })
  })
}

// `elementtiming` is a plain HTML attribute (Element Timing API); React passes it through as is.
declare module 'react' {
  // reason: the type parameter must match React's own declaration for the interfaces to merge.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface HTMLAttributes<T> {
    /** Element Timing identifier (see `afterElementPainted`). */
    elementtiming?: string
  }
}
