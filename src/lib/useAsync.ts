// useAsync — run an async function and expose ONLY its outcome as state (P3.1/P3.2). The
// `react-hooks/set-state-in-effect` rule is an error in this repo, so "loading" is never set in
// an effect: it is DERIVED (no settled outcome for the current `fn` + attempt ⇒ loading). The
// effect only records the resolved/rejected outcome, tagged with the `fn` identity and attempt it
// belongs to, so a stale promise (older `fn`, or an attempt that was retried) is ignored.
//
// `fn` IS the dependency list: callers memoise it with `useCallback(…, deps)`, which keeps the
// exhaustive-deps lint on the caller's side where the real dependencies are visible.

import { useCallback, useEffect, useState } from 'react'

export type AsyncState<T> =
  { status: 'loading' } | { status: 'done'; value: T } | { status: 'failed'; error: unknown }

interface Settled<T> {
  fn: () => Promise<T>
  attempt: number
  outcome: Exclude<AsyncState<T>, { status: 'loading' }>
}

export interface UseAsyncResult<T> {
  state: AsyncState<T>
  /** Run `fn` again (the state goes back to `loading` until it settles). */
  retry: () => void
}

export function useAsync<T>(fn: () => Promise<T>): UseAsyncResult<T> {
  const [attempt, setAttempt] = useState(0)
  const [settled, setSettled] = useState<Settled<T> | null>(null)

  useEffect(() => {
    let active = true
    // `fn` may throw synchronously as well as reject; both are a `failed` outcome.
    Promise.resolve()
      .then(fn)
      .then(
        (value) => {
          if (active) setSettled({ fn, attempt, outcome: { status: 'done', value } })
        },
        (error: unknown) => {
          if (active) setSettled({ fn, attempt, outcome: { status: 'failed', error } })
        },
      )
    return () => {
      active = false
    }
  }, [fn, attempt])

  const retry = useCallback(() => setAttempt((n) => n + 1), [])

  const state: AsyncState<T> =
    settled !== null && settled.fn === fn && settled.attempt === attempt
      ? settled.outcome
      : { status: 'loading' }

  return { state, retry }
}
