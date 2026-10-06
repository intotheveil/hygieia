// CHIP GROUP — a labelled single-choice row of pill buttons (`role="radiogroup"` / `role="radio"`).
// Lifted out of WorkoutsPage (P4.8) in P8.3 so the plan builder on /workouts/plans filters the
// templates with the very same control.

export interface ChipGroupProps<T extends string> {
  id: string
  label: string
  options: readonly T[]
  value: T
  labels: Record<T, string>
  onChange: (next: T) => void
}

export function ChipGroup<T extends string>({
  id,
  label,
  options,
  value,
  labels,
  onChange,
}: ChipGroupProps<T>) {
  return (
    <div className="flex flex-col gap-2">
      <p id={`${id}-label`} className="text-sm font-medium tracking-wide text-sage-700 uppercase">
        {label}
      </p>
      <div role="radiogroup" aria-labelledby={`${id}-label`} className="flex flex-wrap gap-2">
        {options.map((option) => {
          const selected = option === value
          return (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(option)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                selected
                  ? 'bg-olive-900 text-paper-50'
                  : 'border border-olive-900/20 bg-paper-50/70 text-olive-900 hover:bg-paper-50'
              }`}
            >
              {labels[option]}
            </button>
          )
        })}
      </div>
    </div>
  )
}
