// useSettled — run an async loader and expose ONLY its outcome as state (P4.10). The
// `react-hooks/set-state-in-effect` rule is an error in this repo, so "loading" is never set in an
// effect: it is DERIVED (no settled outcome for the current `load` ⇒ loading). The effect records
// the resolved value tagged with the `load` identity it belongs to, so a stale promise (an older
// `load`) is ignored. Callers memoise `load` with `useCallback(…, deps)`, which keeps the
// exhaustive-deps lint where the real dependencies are visible. Loaders never reject here: the
// admin source resolves to an `AdminResult` in every case.

import { useEffect, useState } from 'react'

interface Settled<T> {
  load: () => Promise<T>
  value: T
}

/** The outcome of `load`, or `null` while it is still running (or `load` just changed). */
export function useSettled<T>(load: () => Promise<T>): T | null {
  const [settled, setSettled] = useState<Settled<T> | null>(null)

  useEffect(() => {
    let active = true
    void load().then((value) => {
      if (active) setSettled({ load, value })
    })
    return () => {
      active = false
    }
  }, [load])

  return settled !== null && settled.load === load ? settled.value : null
}
