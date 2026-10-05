import { AccountMenu } from './components/AccountMenu'
import { MODULE_IDS, type ModuleId } from './i18n/dictionary'
import { useLang } from './i18n/LangProvider'

const ICONS: Record<ModuleId, string> = {
  tips: '☀',
  diets: '◔',
  recipes: '✿',
  cost: '€',
  calories: '⚖',
  workouts: '⟳',
}

function LangSwitch() {
  const { t, toggle } = useLang()
  return (
    <button
      type="button"
      onClick={toggle}
      className="rounded-full border border-olive-900/20 bg-paper-50/70 px-4 py-1.5 text-sm font-medium text-olive-900 shadow-sm backdrop-blur hover:border-olive-900/40 hover:bg-paper-50"
    >
      {t.switchTo}
    </button>
  )
}

function ModuleCard({ id }: { id: ModuleId }) {
  const { t } = useLang()
  const copy = t.modules[id]
  return (
    <li className="group relative flex flex-col gap-3 rounded-2xl border border-olive-900/10 bg-paper-50/80 p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <span
          aria-hidden="true"
          className="grid size-10 place-items-center rounded-xl bg-sage-500/15 font-display text-xl text-sage-700"
        >
          {ICONS[id]}
        </span>
        <span className="rounded-full bg-paper-200 px-2.5 py-0.5 text-xs font-medium tracking-wide text-olive-700 uppercase">
          {t.roadmap}
        </span>
      </div>
      <h3 className="font-display text-xl font-semibold text-olive-950">{copy.title}</h3>
      <p className="text-sm leading-relaxed text-olive-700">{copy.blurb}</p>
    </li>
  )
}

export default function App() {
  const { t } = useLang()
  return (
    <div className="mx-auto flex min-h-dvh max-w-6xl flex-col px-4 sm:px-6">
      <header className="flex items-center justify-between py-6">
        <a href="#top" className="flex items-baseline gap-2">
          <span className="font-display text-2xl font-bold tracking-tight text-olive-950">
            Hygieia
          </span>
          <span className="font-display text-lg text-sage-700">· Υγίεια</span>
        </a>
        <div className="flex items-center gap-2">
          <AccountMenu />
          <LangSwitch />
        </div>
      </header>

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
              <p>{t.statusBody}</p>
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

      <footer className="border-t border-olive-900/10 py-6 text-xs leading-relaxed text-olive-700">
        <p>{t.notMedicalAdvice}</p>
      </footer>
    </div>
  )
}
