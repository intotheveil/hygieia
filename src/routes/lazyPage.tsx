// LAZY PAGES WITHOUT THE SUSPENSE REVEAL THROTTLE (perf, 2026-10-06 — CI diet 84).
//
// `React.lazy` + the Layout `<Suspense>` showed the page fallback, and React 19 holds the reveal of
// a boundary that has shown a fallback until ~300 ms after it appeared (its fallback throttle, to
// batch reveals). The page chunk arrives in ~3 ms on the audit server, so every lazy route sat on
// the loading line for ~300 ms doing nothing: the page committed (and started its seed `import()`)
// at ~355 ms instead of ~50 ms, its header painted at ~400 ms, and Lighthouse's model — which
// charges every request that starts before the observed LCP to the simulated LCP — counted the
// route's seed chunks against an LCP element (the header intro) that never needed them.
//
// `lazyPage(load)` keeps the chunk split and the loading line, but swaps the page in through
// ordinary state instead of a Suspense reveal, so it commits as soon as the chunk has arrived:
//
//   - the module is imported ONCE (memoised promise; a rejection is forgotten so a later mount
//     retries, like the seed loaders in content/bundled.ts);
//   - a page whose module is already loaded renders it on the first render (no loading line);
//   - otherwise the wrapper renders `PageLoading` (the same bilingual line the Suspense fallback
//     showed) and swaps the page in when the import resolves;
//   - if the import FAILS, it falls back to the plain `React.lazy` component, which retries the
//     import once more and, if that fails too, throws to the nearest boundary exactly as before
//     (the Layout `<Suspense>` stays for that path).
//
// The component type is chosen once per mount (`useState`), so a re-render after the chunk has
// loaded never swaps the element type under a mounted page (that would remount it and lose its
// state). Changing route mounts a different wrapper, which decides afresh.

import { lazy, useEffect, useState, type ComponentType } from 'react'
import { PageLoading } from '../components/PageLoading'

export type LazyPage<P extends object> = ComponentType<P> & {
  /** Start (or reuse) the page module import. Never rejects into an unhandled promise. */
  preload: () => Promise<ComponentType<P>>
}

export function lazyPage<P extends object>(load: () => Promise<ComponentType<P>>): LazyPage<P> {
  let resolved: ComponentType<P> | null = null
  let pending: Promise<ComponentType<P>> | null = null

  const preload = (): Promise<ComponentType<P>> => {
    pending ??= load().then(
      (component) => {
        resolved = component
        return component
      },
      (error: unknown) => {
        pending = null
        throw error
      },
    )
    return pending
  }

  const Fallback = lazy(() => preload().then((component) => ({ default: component })))

  function Page(props: P) {
    const [Component, setComponent] = useState<ComponentType<P> | null>(() => resolved)

    useEffect(() => {
      if (Component) return
      let live = true
      preload().then(
        (component) => {
          if (live) setComponent(() => component)
        },
        () => {
          if (live) setComponent(() => Fallback)
        },
      )
      return () => {
        live = false
      }
    }, [Component])

    return Component ? <Component {...props} /> : <PageLoading />
  }

  return Object.assign(Page, { preload })
}
