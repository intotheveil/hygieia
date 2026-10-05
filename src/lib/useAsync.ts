// useAsync — THE one way a screen awaits an async read (reconciled from four lanes, 2026-10-06).
//
//   const state = useAsync(run)            // run: () => Promise<T>, memoised by the caller
//   const state = useAsync(run, deps)      // same as useAsync(useCallback(run, deps))
//   const state = useAsyncResult(run)      // run resolves to the app's `Result`; ok:false → error
//
// `state` is `{ status: 'loading' | 'ready' | 'error', data, error, reload }`, a discriminated
// union so `status === 'ready'` narrows `data` to `T`. Rules every variant agreed on, kept here:
//
// - The ONLY state is the SETTLED outcome, tagged with the `run` identity and the attempt number
//   it came from. "loading" is DERIVED (no settled outcome for the current run + attempt), so a new
//   `run` shows loading on the very render it arrives and nothing calls setState synchronously
//   inside the effect (react-hooks `set-state-in-effect` is an error in this repo).
// - A stale resolution (the effect was cleaned up: new run, reload, or unmount) is dropped.
// - A rejection — or a synchronous throw, since `run` starts on a microtask — is an `error`
//   outcome; the hook never throws and never leaves a promise unhandled.
// - `reload()` re-runs the SAME `run` (loading until it settles).
// - `run` IS the dependency list: callers memoise it with `useCallback(…, deps)` so the
//   exhaustive-deps lint sees the real inputs, or pass `deps` here for the same effect.

import { useCallback, useEffect, useMemo, useState } from 'react'

type Outcome<T> =
  | { status: 'ready'; data: T; error: undefined }
  | { status: 'error'; data: undefined; error: unknown }

export type AsyncState<T> = (
  { status: 'loading'; data: undefined; error: undefined } | Outcome<T>
) & {
  /** Run the same `run` again; the state is `loading` until it settles. */
  reload: () => void
}

interface Settled<T> {
  run: () => Promise<T>
  attempt: number
  outcome: Outcome<T>
}

const LOADING = { status: 'loading', data: undefined, error: undefined } as const

function sameDeps(a: readonly unknown[], b: readonly unknown[]): boolean {
  return a.length === b.length && a.every((value, i) => Object.is(value, b[i]))
}

/**
 * `run` keyed like `useCallback(run, deps)`: with `deps`, the identity captured when they last
 * changed (shallow `Object.is`); without, `run` itself. A hook's dependency array must be a
 * literal, so this is the "store information from previous renders" pattern (setState during
 * render, guarded by a comparison — React re-renders at once, before committing).
 */
function useKeyedRun<T>(run: () => Promise<T>, deps: readonly unknown[] | undefined) {
  const [key, setKey] = useState(() => ({ run, deps }))
  if (deps === undefined) return run
  if (key.deps === undefined || !sameDeps(key.deps, deps)) {
    setKey({ run, deps })
    return run
  }
  return key.run
}

export function useAsync<T>(run: () => Promise<T>, deps?: readonly unknown[]): AsyncState<T> {
  const keyed = useKeyedRun(run, deps)
  const [attempt, setAttempt] = useState(0)
  const [settled, setSettled] = useState<Settled<T> | null>(null)

  useEffect(() => {
    let active = true
    Promise.resolve()
      .then(keyed)
      .then(
        (data) => {
          if (active) {
            setSettled({
              run: keyed,
              attempt,
              outcome: { status: 'ready', data, error: undefined },
            })
          }
        },
        (error: unknown) => {
          if (active) {
            setSettled({
              run: keyed,
              attempt,
              outcome: { status: 'error', data: undefined, error },
            })
          }
        },
      )
    return () => {
      active = false
    }
  }, [keyed, attempt])

  const reload = useCallback(() => setAttempt((n) => n + 1), [])

  const current =
    settled !== null && settled.run === keyed && settled.attempt === attempt
      ? settled.outcome
      : LOADING

  // One object per outcome, so `state` is a safe `useMemo`/`useEffect` dependency downstream.
  return useMemo(() => ({ ...current, reload }), [current, reload])
}

/** The shape both `content/source.ts` and `user/source.ts` call `Result` (different error unions). */
export type ResultLike<T, E> = { ok: true; data: T } | { ok: false; error: E }

/**
 * `useAsync` over a `Result`-returning read: `ok: true` → `ready` with its `data`; `ok: false` →
 * `error` with the Result's error code as `error`. A rejection is still an `error` (unknown).
 */
export function useAsyncResult<T, E>(
  run: () => Promise<ResultLike<T, E>>,
  deps?: readonly unknown[],
): AsyncState<T> {
  return useAsync(
    () => run().then((result) => (result.ok ? result.data : Promise.reject(result.error))),
    deps ?? [run],
  )
}
