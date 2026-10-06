// useOverlay (P8.2): optimistic local edits over a loaded value, WITHOUT an effect. The overlay
// remembers which `base` it was built on; when the base changes (a reload settled) the overlay
// is discarded and the fresh value shows. This is the "store information from previous renders"
// pattern — `set-state-in-effect` is an error in this repo, and a derived value needs no effect.

import { useCallback, useState } from 'react'

export function useOverlay<T>(base: T): [T, (update: (current: T) => T) => void] {
  const [overlay, setOverlay] = useState<{ base: T; value: T } | null>(null)
  const value = overlay !== null && Object.is(overlay.base, base) ? overlay.value : base
  const set = useCallback(
    (update: (current: T) => T) =>
      setOverlay((prev) => {
        const current = prev !== null && Object.is(prev.base, base) ? prev.value : base
        return { base, value: update(current) }
      }),
    [base],
  )
  return [value, set]
}
