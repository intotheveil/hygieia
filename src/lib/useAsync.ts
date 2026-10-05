// useAsync — the smallest hook for "run this promise once per function identity and render its
// outcome". Only the SETTLED outcome is state, tagged with the `run` that produced it; "loading"
// is derived (`settled.run !== run`), so a new `run` shows loading on the very render it arrives
// and no state is set synchronously inside the effect (react-hooks `set-state-in-effect`). A
// stale resolution (the effect was cleaned up first) is dropped. Callers memoize `run`
// (`useCallback`, or a module-level function) — a fresh closure every render would re-run forever.

import { useEffect, useState } from 'react'

export type AsyncState<T> =
  { status: 'loading' } | { status: 'ready'; data: T } | { status: 'error'; error: unknown }

interface Settled<T> {
  run: () => Promise<T>
  state: AsyncState<T>
}

const LOADING: AsyncState<never> = { status: 'loading' }

export function useAsync<T>(run: () => Promise<T>): AsyncState<T> {
  const [settled, setSettled] = useState<Settled<T> | null>(null)

  useEffect(() => {
    let active = true
    run().then(
      (data) => {
        if (active) setSettled({ run, state: { status: 'ready', data } })
      },
      (error: unknown) => {
        if (active) setSettled({ run, state: { status: 'error', error } })
      },
    )
    return () => {
      active = false
    }
  }, [run])

  return settled !== null && settled.run === run ? settled.state : LOADING
}
