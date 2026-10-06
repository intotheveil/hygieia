// HOME `/` (P0 shell, wired in P3.5). Hero + status box + the eight module cards, each a link into
// its module: tips → /tips · diets → /diets · recipes → /recipes (with a secondary link to /fridge)
// · cost and calories → /recipes with a note (their panels sit on every recipe page since P4.3)
// · workouts → /workouts · skincare → /skincare (P7.2) · tasks → /tasks (P9). The header and footer are Layout's
// (src/components/Layout.tsx); this is the `<main>`. The `roadmap` badge is gone: every module has
// a live route. Eight cards on a 3-column grid leave one short row (3 + 3 + 2); accepted.
//
// PREFERENCES + OF THE DAY (2026-10-06). Between the hero and the modules: the first-visit
// onboarding card (or, from the footer's `/?prefs=edit`, the same card to change the answers)
// and the recipe / tip of the day. They live in a LAZY chunk (./home/HomeExtras.tsx) imported only
// once the hero image — the LCP element — has painted, so the home LCP and the eager chunk are
// unchanged by them; until it arrives a skeleton in the same boxes holds their space
// (./home/layout.ts, no layout shift). The preferences themselves are read here, synchronously,
// because the goal decides which module card comes first (src/prefs/prefs.ts).

import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import type { HomeExtrasProps } from './home/HomeExtras.tsx'
import { EXTRAS_SLOT, TODAY_CARD, TODAY_GRID, onboardingBox } from './home/layout.ts'
import { MODULE_IDS, type ModuleId } from './i18n/app'
import { useLang } from './i18n/LangProvider'
import { appEnv } from './lib/env'
import {
  PREFS_PARAM,
  applyPrefsToModules,
  readPrefs,
  writePrefs,
  type Prefs,
} from './prefs/prefs.ts'
import { useTheme } from './theme/ThemeProvider'

/**
 * Resolve once the page has LOADED (the `load` event: the hero image — the LCP element — and
 * everything else the first paint needed are in) and one more frame has been drawn. The extras'
 * chunk and the content reads it starts are requested only then, so they never compete with the
 * first paint or the LCP for bandwidth. Inline, not lib/afterPaint.ts: that module would add
 * ~0.5 kB gzip to the eager chunk for the same effect here. A hidden tab gets no frames, so it
 * does not wait for one.
 */
function afterPageLoad(): Promise<void> {
  return new Promise((resolve) => {
    const frame = () =>
      document.visibilityState === 'visible' ? requestAnimationFrame(() => resolve()) : resolve()
    if (document.readyState === 'complete') frame()
    else window.addEventListener('load', frame, { once: true })
  })
}

type ExtrasComponent = (props: HomeExtrasProps) => ReactNode
/** Kept once loaded, so coming back to the home page renders the extras at once. */
let loadedExtras: ExtrasComponent | null = null

/** The extras' boxes, empty, until the chunk arrives (same classes: no shift on the swap). */
function ExtrasSkeleton({ onboarding }: { onboarding: boolean }) {
  const { lang } = useLang()
  return (
    <div
      aria-hidden="true"
      className={EXTRAS_SLOT}
      data-home-extras=""
      data-testid="home-extras-skeleton"
    >
      {onboarding && <div className={onboardingBox(lang)} />}
      <div className={TODAY_GRID}>
        <div className={TODAY_CARD} />
        <div className={TODAY_CARD} />
      </div>
    </div>
  )
}

/**
 * The extras slot: the skeleton until the lazy chunk has arrived (requested once the page has loaded), then the extras; nothing if the chunk failed to load (the slot collapses).
 */
function HomeExtrasSlot(props: HomeExtrasProps) {
  const [Extras, setExtras] = useState<ExtrasComponent | null | false>(() => loadedExtras)
  useEffect(() => {
    if (Extras !== null) return
    let alive = true
    afterPageLoad()
      .then(() => import('./home/HomeExtras.tsx'))
      .then(
        (m) => {
          loadedExtras = m.HomeExtras
          if (alive) setExtras(() => m.HomeExtras)
        },
        () => {
          if (alive) setExtras(false)
        },
      )
    return () => {
      alive = false
    }
  }, [Extras])
  if (Extras === null) return <ExtrasSkeleton onboarding={props.showOnboarding} />
  return Extras === false ? null : <Extras {...props} />
}

const ICONS: Record<ModuleId, string> = {
  tips: '☀',
  diets: '◔',
  recipes: '✿',
  cost: '€',
  calories: '⚖',
  workouts: '⟳',
  skincare: '❋',
  tasks: '☑',
}

/** Where each card leads. cost/calories are panels on recipe pages, so they open the recipes list. */
const MODULE_ROUTES: Record<ModuleId, string> = {
  tips: '/tips',
  diets: '/diets',
  recipes: '/recipes',
  cost: '/recipes',
  calories: '/recipes',
  workouts: '/workouts',
  skincare: '/skincare',
  tasks: '/tasks',
}

/** Modules that are a panel inside another page rather than a page of their own: they carry `panelsNote`. */
const PANEL_MODULES: ReadonlySet<ModuleId> = new Set<ModuleId>(['cost', 'calories'])

function ModuleCard({ id }: { id: ModuleId }) {
  const { t } = useLang()
  const copy = t.modules[id]
  return (
    <li className="group relative flex flex-col gap-3 rounded-2xl border border-olive-900/10 bg-paper-50/80 p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <span
        aria-hidden="true"
        className="grid size-10 place-items-center rounded-xl bg-sage-500/15 font-display text-xl text-sage-700"
      >
        {ICONS[id]}
      </span>
      <h3 className="font-display text-xl font-semibold text-olive-950">
        {/* The title link covers the whole card (after:inset-0); secondary links sit above it (z-10). */}
        <Link
          to={MODULE_ROUTES[id]}
          className="after:absolute after:inset-0 after:rounded-2xl hover:underline focus-visible:underline"
        >
          {copy.title}
        </Link>
      </h3>
      <p className="text-sm leading-relaxed text-olive-700">{copy.blurb}</p>
      {id === 'recipes' && (
        <Link
          to="/fridge"
          className="relative z-10 self-start text-sm font-medium text-sage-700 underline-offset-2 hover:underline"
        >
          {t.fridgeLink} →
        </Link>
      )}
      {PANEL_MODULES.has(id) && (
        <p className="text-xs leading-relaxed text-olive-700/80">{t.panelsNote}</p>
      )}
    </li>
  )
}

export default function App() {
  const { t } = useLang()
  const { theme } = useTheme()
  const [searchParams, setSearchParams] = useSearchParams()
  const [prefs, setPrefs] = useState<Prefs | null>(() => readPrefs())
  const [now] = useState(() => new Date())
  // Editing needs something to edit: on a first visit the card is the onboarding (with Skip).
  const editing = searchParams.get(PREFS_PARAM) === 'edit' && prefs !== null
  const showOnboarding = prefs === null || editing
  const onPrefsDone = useCallback(
    (next: Prefs | null) => {
      if (next !== null) {
        writePrefs(next)
        setPrefs(next)
      }
      if (searchParams.has(PREFS_PARAM)) {
        setSearchParams(
          (current) => {
            const out = new URLSearchParams(current)
            out.delete(PREFS_PARAM)
            return out
          },
          { replace: true },
        )
      }
    },
    [searchParams, setSearchParams],
  )
  /** The hero image set for this theme: `hero-plate` (kitchen default) or `hero-<theme>`. */
  const hero = `${import.meta.env.BASE_URL}brand/hero-${theme === 'default' ? 'plate' : theme}`
  return (
    <main id="top" className="flex flex-1 flex-col gap-14 pb-16">
      <section className="grid gap-8 pt-8 sm:pt-14 lg:grid-cols-[3fr_2fr] lg:items-end">
        <div className="flex flex-col gap-5">
          <p className="text-sm font-medium tracking-wide text-sage-700 uppercase">{t.tagline}</p>
          <h1 className="font-display text-4xl leading-tight font-semibold text-olive-950 text-balance sm:text-5xl">
            {t.heroTitle}
          </h1>
          <p className="max-w-2xl text-lg leading-relaxed text-olive-700">{t.heroLead}</p>
        </div>
        <div className="flex flex-col gap-4">
          {/* The LCP element on mobile (Lighthouse, PLAN P5.3): WebP first (scripts/brand.mjs), JPEG
              fallback, fetched at high priority, never lazy. Deliberately NOT preloaded from
              index.html: measured, a preload left home's LCP unchanged (render-bound) and cost every
              other route a 42 kB download it never shows (-3 points on /auth). */}
          {/* One image set per theme (scripts/brand.mjs; operator request 2026-10-06): the kitchen
              plate for the default skin, a slate plate for dark, a meal-prep box for athletic, a
              glowing desk for gamer. Only the chosen set is requested, so the LCP budget is unchanged. */}
          <picture>
            <source
              type="image/webp"
              srcSet={`${hero}-800.webp 800w, ${hero}-1216.webp 1216w`}
              sizes="(min-width: 1024px) 40vw, 100vw"
            />
            <img
              src={`${hero}.jpg`}
              srcSet={`${hero}-sm.jpg 608w, ${hero}.jpg 1216w`}
              sizes="(min-width: 1024px) 40vw, 100vw"
              width={1216}
              height={640}
              fetchPriority="high"
              alt={theme === 'default' ? t.heroImageAlt : t.themeHeroAlt[theme]}
              className="aspect-[1216/640] w-full rounded-2xl object-cover shadow-md ring-1 ring-olive-900/10"
            />
          </picture>
          <aside
            aria-labelledby="status-title"
            className="rounded-2xl border border-clay-500/30 bg-clay-500/10 p-5 text-sm leading-relaxed text-olive-900"
          >
            <h2 id="status-title" className="mb-1 font-semibold">
              {t.statusTitle}
            </h2>
            <p>{appEnv.mode === 'configured' ? t.statusBodyConfigured : t.statusBody}</p>
          </aside>
        </div>
      </section>

      <HomeExtrasSlot
        prefs={prefs}
        showOnboarding={showOnboarding}
        editing={editing}
        onPrefsDone={onPrefsDone}
        now={now}
      />

      <section aria-label="modules">
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {applyPrefsToModules(MODULE_IDS, prefs).map((id) => (
            <ModuleCard key={id} id={id} />
          ))}
        </ul>
      </section>
    </main>
  )
}
