// /women — "Για τη γυναίκα" / "For women" (docs/research/women-audience-content.md, proposals
// 1, 2, 3, 11). A static, sourced education hub: an in-page table of contents, then four sections
// (strength training · perimenopause and menopause · women's nutrition · your cycle and training),
// each a grid of short cards with their sources. The content is bilingual data (./content.ts);
// the chrome is the `women` route feature (`useLang(womenCopy)`).
//
// The only read is the strength section's ready-made sessions: the six women's-strength workout
// templates, looked up by slug through the ContentSource (`listWorkoutTemplates`). Only the slugs
// that resolve are shown, and nothing at all while loading or on failure — the page is complete
// without them (they are another lane's content). Each links to `/workouts?track=women-strength&
// type=&level=`; the section also links to the whole programme and to the plan builder.
//
// The menopause section carries a "see a doctor if…" box; the nutrition cards link to the recipe
// list filtered by nutrient (`/recipes?nutrient=`). One h1; every section is an h2 with an anchor
// id the table of contents points at; cards are h3.

import { useCallback } from 'react'
import { Link } from 'react-router-dom'
import { contentSource } from '../content'
import type { ContentSource, WorkoutTemplate } from '../content'
import { ok, type Result } from '../content/source'
import { useLang } from '../i18n/LangProvider'
import { fill } from '../i18n/fill'
import { womenCopy } from '../i18n/features/women.ts'
import { useAsyncResult } from '../lib/useAsync'
import {
  WOMEN_SECTIONS,
  WOMEN_TEMPLATE_SLUGS,
  recipesHref,
  sourceHost,
  trackHref,
  type WomenCard,
  type WomenSection,
} from './content'

export interface WomenPageProps {
  /** Defaults to the app's content source; tests pass a fake. */
  source?: ContentSource
}

const CARD =
  'flex flex-col gap-3 rounded-2xl border border-olive-900/10 bg-paper-50/80 p-5 shadow-sm'
const H3 = 'font-display text-lg font-semibold text-olive-950'
const BODY = 'text-sm leading-relaxed text-olive-700'
const LINK = 'font-medium text-sage-700 underline-offset-2 hover:underline'
const ACTION =
  'inline-flex w-fit rounded-full bg-olive-900 px-4 py-1.5 text-sm font-medium text-paper-50 hover:bg-olive-950'

/** The women's-strength templates that resolve, in `WOMEN_TEMPLATE_SLUGS` order. */
export async function loadWomenTemplates(
  source: ContentSource,
): Promise<Result<WorkoutTemplate[]>> {
  const all = await source.listWorkoutTemplates()
  if (!all.ok) return all
  const bySlug = new Map(all.data.map((t) => [t.slug, t]))
  return ok(
    WOMEN_TEMPLATE_SLUGS.flatMap((slug) => {
      const template = bySlug.get(slug)
      return template ? [template] : []
    }),
  )
}

function Sources({ sources }: { sources: readonly string[] }) {
  const { t } = useLang(womenCopy)
  return (
    <p className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-sm">
      <span className="font-medium text-olive-900">{t.womenSources}:</span>
      {sources.map((url) => (
        <a key={url} href={url} target="_blank" rel="noopener noreferrer" className={LINK}>
          {sourceHost(url)}
        </a>
      ))}
    </p>
  )
}

function Card({ card }: { card: WomenCard }) {
  const { t, lang } = useLang(womenCopy)
  return (
    <article aria-labelledby={`${card.id}-title`} data-card={card.id} className={`${CARD} w-full`}>
      <h3 id={`${card.id}-title`} className={H3}>
        {card.title[lang]}
      </h3>
      <p className={BODY}>{card.body[lang]}</p>
      {card.nutrient && (
        <Link to={recipesHref(card.nutrient.slug)} className={LINK}>
          {fill(t.womenRecipesFor, { nutrient: card.nutrient.name[lang] })} →
        </Link>
      )}
      <Sources sources={card.sources} />
    </article>
  )
}

function TemplateCards({ templates }: { templates: readonly WorkoutTemplate[] }) {
  const { t, lang } = useLang(womenCopy)
  return (
    <section aria-labelledby="women-templates-heading" className="flex flex-col gap-4">
      <h3
        id="women-templates-heading"
        className="font-display text-xl font-semibold text-olive-950"
      >
        {t.womenTemplatesHeading}
      </h3>
      <p className={BODY}>{t.womenTemplatesIntro}</p>
      <ul id="women-templates" className="grid gap-4 sm:grid-cols-2">
        {templates.map((template) => {
          const title = lang === 'el' ? template.title_el : template.title_en
          return (
            <li key={template.slug} data-template={template.slug} className={CARD}>
              <p className={`${H3} text-base`}>{title}</p>
              <p className={BODY}>
                {t.types[template.workout_type]} · {t.levels[template.level]} · {t.duration}{' '}
                {template.duration_min} {t.minutesUnit}
              </p>
              <Link
                to={trackHref({ type: template.workout_type, level: template.level })}
                aria-label={fill(t.womenOpenSessionFor, { name: title })}
                className={LINK}
              >
                {t.womenOpenSession} →
              </Link>
            </li>
          )
        })}
      </ul>
      <p className="flex flex-wrap gap-3">
        <Link to={trackHref()} className={ACTION}>
          {t.womenSeeProgramme}
        </Link>
        <Link to="/workouts/plans" className={`${LINK} self-center`}>
          {t.womenPlanBuilder} →
        </Link>
      </p>
    </section>
  )
}

function DoctorBox({ section }: { section: WomenSection }) {
  const { t, lang } = useLang(womenCopy)
  if (!section.doctor) return null
  return (
    <aside
      aria-labelledby={`${section.id}-doctor-heading`}
      data-testid="women-doctor"
      className="flex flex-col gap-3 rounded-2xl border-2 border-clay-700/40 bg-paper-50 p-5"
    >
      <h3 id={`${section.id}-doctor-heading`} className={H3}>
        {t.womenDoctorTitle}
      </h3>
      <ul className={`${BODY} list-disc space-y-1.5 pl-5`}>
        {section.doctor.items.map((item) => (
          <li key={item.en}>{item[lang]}</li>
        ))}
      </ul>
      <Sources sources={section.doctor.sources} />
    </aside>
  )
}

export function WomenPage({ source = contentSource }: WomenPageProps) {
  const { t, lang } = useLang(womenCopy)
  const load = useCallback(() => loadWomenTemplates(source), [source])
  const templates = useAsyncResult(load)
  const resolved = templates.status === 'ready' ? templates.data : []

  return (
    <main className="mx-auto flex min-h-dvh max-w-4xl flex-col gap-10 px-4 py-10 sm:px-6">
      <header className="flex flex-col gap-3">
        <h1 id="women-title" className="font-display text-3xl font-semibold text-olive-950">
          {t.womenTitle}
        </h1>
        <p className="max-w-3xl leading-relaxed text-olive-700">{t.womenIntro}</p>
        <p role="note" className="max-w-3xl text-sm leading-relaxed text-olive-700">
          {t.womenNote}
        </p>
      </header>

      <nav
        aria-labelledby="women-toc-heading"
        className="rounded-2xl border border-olive-900/10 bg-paper-50/80 p-5"
      >
        <h2 id="women-toc-heading" className="font-display text-lg font-semibold text-olive-950">
          {t.womenToc}
        </h2>
        <ol id="women-toc" className="mt-2 list-decimal space-y-1 pl-5 text-olive-900">
          {WOMEN_SECTIONS.map((section) => (
            <li key={section.id}>
              <a href={`#women-${section.id}`} className={LINK}>
                {section.title[lang]}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      {WOMEN_SECTIONS.map((section) => (
        <section
          key={section.id}
          id={`women-${section.id}`}
          aria-labelledby={`women-${section.id}-heading`}
          className="flex scroll-mt-6 flex-col gap-5"
        >
          <h2
            id={`women-${section.id}-heading`}
            className="font-display text-2xl font-semibold text-olive-950"
          >
            {section.title[lang]}
          </h2>
          <p className="max-w-3xl leading-relaxed text-olive-700">{section.intro[lang]}</p>
          <ul className="grid gap-4 sm:grid-cols-2">
            {section.cards.map((card) => (
              <li key={card.id} className="flex">
                <Card card={card} />
              </li>
            ))}
          </ul>
          {section.id === 'strength' && resolved.length > 0 && (
            <TemplateCards templates={resolved} />
          )}
          <DoctorBox section={section} />
          <a href="#women-title" className={`${LINK} w-fit text-sm`}>
            ↑ {t.womenBackToTop}
          </a>
        </section>
      ))}
    </main>
  )
}
