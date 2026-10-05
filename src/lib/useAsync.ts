// useAsync(): run a `Result`-returning async read and expose it as loading / ready / error.
//
// The ONLY state is the settled outcome, stored together with the `run` function that produced
// it; "loading" is derived (`settled.run !== run`), so a new `run` identity shows the loading
// state at once without a synchronous setState inside the effect
// (react-hooks/set-state-in-effect). Callers therefore memoise `run` with `useCallback` on the
// inputs that should trigger a reload. A stale resolution (the caller moved on) is dropped.

import { useEffect, useState } from 'react'
import type { ContentError, Result } from '../content/source.ts'

export type AsyncState<T> =
  { status: 'loading' } | { status: 'ready'; data: T } | { status: 'error'; error: ContentError }

interface Settled<T> {
  run: () => Promise<Result<T>>
  state: AsyncState<T>
}

const LOADING: AsyncState<never> = { status: 'loading' }

export function useAsync<T>(run: () => Promise<Result<T>>): AsyncState<T> {
  const [settled, setSettled] = useState<Settled<T> | null>(null)

  useEffect(() => {
    let active = true
    void run().then((result) => {
      if (!active) return
      setSettled({
        run,
        state: result.ok
          ? { status: 'ready', data: result.data }
          : { status: 'error', error: result.error },
      })
    })
    return () => {
      active = false
    }
  }, [run])

  return settled !== null && settled.run === run ? settled.state : LOADING
}
