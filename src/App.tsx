// HOME `/` (P0 shell, wired in P3.5). Hero + status box + the six module cards, each a link into
// its module: tips → /tips · diets → /diets · recipes → /recipes (with a secondary link to /fridge)
// · cost and calories → /recipes with a note (their panels sit on every recipe page since P4.3)
// · workouts → /workouts. The header and footer are Layout's (src/components/Layout.tsx); this is
// the `<main>`. The `roadmap` badge is gone: every module has a live route.

import { Link } from 'react-router-dom'
import { MODULE_IDS, type ModuleId } from './i18n/dictionary'
import { useLang } from './i18n/LangProvider'
import { appEnv } from './lib/env'

const ICONS: Record<ModuleId, string> = {
  tips: '☀',
  diets: '◔',
  recipes: '✿',
  cost: '€',
  calories: '⚖',
  workouts: '⟳',
}

/** Where each card leads. cost/calories are panels on recipe pages, so they open the recipes list. */
const MODULE_ROUTES: Record<ModuleId, string> = {
  tips: '/tips',
  diets: '/diets',
  recipes: '/recipes',
  cost: '/recipes',
  calories: '/recipes',
  workouts: '/workouts',
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
          <picture>
            <source
              type="image/webp"
              srcSet={`${import.meta.env.BASE_URL}brand/hero-plate-800.webp 800w, ${import.meta.env.BASE_URL}brand/hero-plate-1216.webp 1216w`}
              sizes="(min-width: 1024px) 40vw, 100vw"
            />
            <img
              src={`${import.meta.env.BASE_URL}brand/hero-plate.jpg`}
              srcSet={`${import.meta.env.BASE_URL}brand/hero-plate-sm.jpg 608w, ${import.meta.env.BASE_URL}brand/hero-plate.jpg 1216w`}
              sizes="(min-width: 1024px) 40vw, 100vw"
              width={1216}
              height={640}
              fetchPriority="high"
              alt={t.heroImageAlt}
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

      <section aria-label="modules">
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {MODULE_IDS.map((id) => (
            <ModuleCard key={id} id={id} />
          ))}
        </ul>
      </section>
    </main>
  )
}
