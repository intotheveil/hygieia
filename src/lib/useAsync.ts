// useAsync: the one way a screen awaits a `load` function without setting state inside an effect
// body. Only the SETTLED outcome is state, tagged with the loader identity and attempt number it
// came from; "loading" is derived — a stale outcome (older loader, older attempt) reads as loading,
// so a screen never shows the previous key's data while the next is in flight. `load` must be
// referentially stable (wrap it in `useCallback`); `reload` re-runs the same loader.

import { useCallback, useEffect, useState } from 'react'

export type AsyncState<T> = { status: 'loading' } | { status: 'done'; value: T }

interface Settled<T> {
  load: () => Promise<T>
  attempt: number
  value: T
}

export function useAsync<T>(load: () => Promise<T>): {
  state: AsyncState<T>
  reload: () => void
} {
  const [attempt, setAttempt] = useState(0)
  const [settled, setSettled] = useState<Settled<T> | null>(null)

  useEffect(() => {
    let active = true
    void load().then((value) => {
      if (active) setSettled({ load, attempt, value })
    })
    return () => {
      active = false
    }
  }, [load, attempt])

  const reload = useCallback(() => setAttempt((n) => n + 1), [])
  const state: AsyncState<T> =
    settled !== null && settled.load === load && settled.attempt === attempt
      ? { status: 'done', value: settled.value }
      : { status: 'loading' }
  return { state, reload }
}
