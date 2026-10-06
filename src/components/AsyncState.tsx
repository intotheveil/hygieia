// SHARED ASYNC STATES (PLAN P5.1): the ONE way a screen renders "still loading", "could not load"
// and "nothing here". Every page over `useAsync` / `useAsyncResult` (src/lib/useAsync.ts) used to
// carry its own `<p role="status">Loading…</p>` and its own alert markup; they differed in whether
// Retry existed, in colour and in whether the footer jumped. Now:
//
// - `Loading` is a SKELETON WITH RESERVED HEIGHT, not a one-line "Loading…". Lighthouse measured
//   CLS 0.29 / 0.88 / 0.36 on /recipes, /diets/:slug and /tips: the page painted a single line,
//   then the real content pushed everything below it (the footer most of all) down a screen.
//   A skeleton at least as tall as the content area keeps everything below it where it is, so the
//   swap to real content is not a layout shift. Variants: `list` (a grid of cards — the list
//   pages), `detail` (a header + body blocks — the detail pages and the workout session) and
//   `panel` (a few rows inside an existing panel — admin and account). The text `t.loading` is
//   there for assistive tech (sr-only) and for tests; the boxes are `aria-hidden`.
// - `ErrorState` is `role="alert"` with the PAGE'S copy (each page keeps its own dictionary key —
//   `loadFailed`, `fridgeLoadFailed`, `tipsLoadFailed`, …) and a Retry button (`t.retry`) that
//   calls the state's `reload`. The dead-backend e2e project (e2e/dead-backend) proves this on the
//   production artifact against a backend nothing listens on.
// - `EmptyState` is the dashed box the fridge introduced: icon + title + optional hint + optional
//   action. No live-region role: an empty result is content, not an announcement (the pages that
//   announce counts keep their own `role="status"` line).

import type { ReactNode } from 'react'
import { useLang } from '../i18n/LangProvider'

export type SkeletonVariant = 'list' | 'detail' | 'panel'

export interface LoadingProps {
  /** Which shape to reserve space for. Default `list`. */
  variant?: SkeletonVariant
  /** Accessible text; defaults to the dictionary's `loading`. */
  label?: string
}

const BONE = 'rounded-2xl bg-olive-900/8'
const LINE = 'rounded-full bg-olive-900/10'

/** Six cards: taller than a phone viewport, so the footer never sits under the skeleton. */
const LIST_CARDS = [0, 1, 2, 3, 4, 5] as const
const DETAIL_BLOCKS = [0, 1, 2] as const
const PANEL_ROWS = [0, 1, 2] as const

function Skeleton({ variant }: { variant: SkeletonVariant }) {
  if (variant === 'list') {
    return (
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {LIST_CARDS.map((i) => (
          <div key={i} className={`${BONE} h-44`} />
        ))}
      </div>
    )
  }
  if (variant === 'detail') {
    return (
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-4">
          <div className={`${LINE} h-4 w-24`} />
          <div className={`${LINE} h-9 w-3/4`} />
          <div className={`${LINE} h-5 w-1/2`} />
        </div>
        {DETAIL_BLOCKS.map((i) => (
          <div key={i} className={`${BONE} h-40`} />
        ))}
      </div>
    )
  }
  return (
    <div className="flex flex-col gap-2">
      {PANEL_ROWS.map((i) => (
        <div key={i} className={`${BONE} h-11`} />
      ))}
    </div>
  )
}

export function Loading({ variant = 'list', label }: LoadingProps) {
  const { t } = useLang()
  return (
    <div role="status" aria-busy="true" aria-live="polite" data-skeleton={variant}>
      <span className="sr-only">{label ?? t.loading}</span>
      <div aria-hidden="true" className="animate-pulse motion-reduce:animate-none">
        <Skeleton variant={variant} />
      </div>
    </div>
  )
}

export interface ErrorStateProps {
  /** The page's own bilingual copy (a dictionary value). */
  message: string
  /** The async state's `reload`; when absent there is no Retry button. */
  onRetry?: () => void
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  const { t } = useLang()
  return (
    <div
      role="alert"
      className="flex flex-col items-start gap-3 rounded-2xl border border-clay-500/30 bg-clay-500/10 p-5 text-clay-700"
    >
      <p className="leading-relaxed">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="rounded-full bg-olive-900 px-5 py-2 text-sm font-medium text-paper-50 hover:bg-olive-700"
        >
          {t.retry}
        </button>
      )}
    </div>
  )
}

export interface EmptyStateProps {
  /** The page's own bilingual copy (a dictionary value). */
  title: string
  hint?: string
  /** Decorative glyph; default an empty circle. */
  icon?: string
  /** A link or button that gets the visitor out of the empty state (optional). */
  action?: ReactNode
}

export function EmptyState({ title, hint, icon = '○', action }: EmptyStateProps) {
  return (
    <div
      data-empty-state=""
      className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-olive-900/20 p-8 text-center"
    >
      <span aria-hidden="true" className="font-display text-3xl text-sage-700">
        {icon}
      </span>
      <p className="font-display text-xl text-olive-950">{title}</p>
      {hint && <p className="text-sm leading-relaxed text-olive-700">{hint}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}
