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
        <LangSwitch />
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
          <aside
            aria-labelledby="status-title"
            className="rounded-2xl border border-clay-500/30 bg-clay-500/10 p-5 text-sm leading-relaxed text-olive-900"
          >
            <h2 id="status-title" className="mb-1 font-semibold">
              {t.statusTitle}
            </h2>
            <p>{t.statusBody}</p>
          </aside>
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
