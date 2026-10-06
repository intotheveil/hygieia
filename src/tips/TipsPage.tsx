// /tips (PLAN.md P4.9, UI half). Every visible health tip grouped under its topic, with a topic
// filter (the six `TIP_TOPICS` plus "all") that lives in the URL (`?topic=sleep`; absent or
// unknown = all). A card is title + body + either a link to the real source (new tab,
// `rel="noopener noreferrer"`) or the "Source pending review" label when `needs_source` — the
// content drafting rule (PLAN.md §0) made visible: a tip never pretends to have a source.
// Content comes from the ContentSource's `listTips`, so bundled and supabase modes render alike.

import { useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { EmptyState, ErrorState, Loading } from '../components/AsyncState'
import { DraftRibbon } from '../components/DraftRibbon'
import { contentSource } from '../content'
import type { ContentSource, HealthTip } from '../content'
import { TIP_TOPICS } from '../content/enums.ts'
import type { TipTopic } from '../content/enums.ts'
import { useLang } from '../i18n/LangProvider'
import { fill } from '../i18n/fill'
import { useAsyncResult } from '../lib/useAsync'

export const TOPIC_PARAM = 'topic'

/** `?topic=` → a topic, or null for "all" (absent, blank or unknown). */
export function parseTopic(params: URLSearchParams): TipTopic | null {
  const value = params.get(TOPIC_PARAM)
  return value !== null && (TIP_TOPICS as readonly string[]).includes(value)
    ? (value as TipTopic)
    : null
}

export interface TopicGroup {
  topic: TipTopic
  tips: HealthTip[]
}

/** Tips grouped in `TIP_TOPICS` order (every topic present, possibly empty), input order kept. */
export function groupByTopic(tips: readonly HealthTip[]): TopicGroup[] {
  const groups: TopicGroup[] = TIP_TOPICS.map((topic) => ({ topic, tips: [] }))
  for (const tip of tips) {
    const group = groups[TIP_TOPICS.indexOf(tip.topic)]
    if (group !== undefined) group.tips.push(tip)
  }
  return groups
}

function TipCard({ tip }: { tip: HealthTip }) {
  const { t, lang } = useLang()
  const title = lang === 'el' ? tip.title_el : tip.title_en
  const body = lang === 'el' ? tip.body_el : tip.body_en
  return (
    <article className="flex flex-col gap-2 rounded-2xl border border-olive-900/10 bg-paper-50/80 p-5 shadow-sm">
      <h3 className="font-display text-lg font-semibold text-olive-950">{title}</h3>
      <p className="text-sm leading-relaxed text-olive-700">{body}</p>
      {tip.source_url !== null && !tip.needs_source ? (
        <a
          href={tip.source_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium text-sage-700 underline-offset-2 hover:underline"
        >
          {t.readSource}
        </a>
      ) : (
        <p className="text-xs font-medium tracking-wide text-clay-700 uppercase">
          {t.sourcePending}
        </p>
      )}
    </article>
  )
}

export interface TipsPageProps {
  /** Defaults to the app's content source; tests pass a fake. */
  source?: ContentSource
}

export function TipsPage({ source = contentSource }: TipsPageProps) {
  const { t } = useLang()
  const [params, setParams] = useSearchParams()
  const topic = parseTopic(params)

  const load = useCallback(() => source.listTips(), [source])
  const state = useAsyncResult(load)

  const groups = state.status === 'ready' ? groupByTopic(state.data) : []
  const total = groups.reduce((sum, group) => sum + group.tips.length, 0)
  const visible = groups.filter(
    (group) => (topic === null || group.topic === topic) && group.tips.length > 0,
  )

  const choose = (next: TipTopic | null) =>
    setParams(next === null ? new URLSearchParams() : new URLSearchParams({ [TOPIC_PARAM]: next }))

  const chipClass = (selected: boolean) =>
    `rounded-full px-4 py-1.5 text-sm font-medium transition ${
      selected
        ? 'bg-olive-900 text-paper-50'
        : 'border border-olive-900/20 bg-paper-50/70 text-olive-900 hover:bg-paper-50'
    }`

  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col gap-8 px-4 py-10 sm:px-6">
      <header className="flex flex-col gap-3">
        <h1 className="font-display text-3xl font-semibold text-olive-950">{t.tipsTitle}</h1>
        <p className="max-w-2xl leading-relaxed text-olive-700">{t.tipsIntro}</p>
      </header>

      <DraftRibbon kind={source.kind} />

      <div role="radiogroup" aria-label={t.tipsTitle} className="flex flex-wrap gap-2">
        <button
          type="button"
          role="radio"
          aria-checked={topic === null}
          onClick={() => choose(null)}
          className={chipClass(topic === null)}
        >
          {t.allTopics}
          {state.status === 'ready' && <Count n={total} />}
        </button>
        {TIP_TOPICS.map((option) => {
          const n = groups[TIP_TOPICS.indexOf(option)]?.tips.length ?? 0
          return (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={topic === option}
              onClick={() => choose(option)}
              className={chipClass(topic === option)}
            >
              {t.topics[option]}
              {state.status === 'ready' && <Count n={n} />}
            </button>
          )
        })}
      </div>

      {state.status === 'loading' ? (
        <Loading variant="list" />
      ) : state.status === 'error' ? (
        <ErrorState message={t.tipsLoadFailed} onRetry={state.reload} />
      ) : visible.length === 0 ? (
        <EmptyState title={t.tipsEmpty} icon="☀" />
      ) : (
        visible.map((group) => (
          <section
            key={group.topic}
            aria-labelledby={`topic-${group.topic}`}
            className="flex flex-col gap-4"
          >
            <h2
              id={`topic-${group.topic}`}
              className="font-display text-2xl font-semibold text-olive-950"
            >
              {t.topics[group.topic]}
              <span className="ml-3 align-middle text-sm font-normal text-olive-700">
                {fill(t.tipsCount, { n: group.tips.length })}
              </span>
            </h2>
            <ul className="grid gap-4 sm:grid-cols-2">
              {group.tips.map((tip) => (
                <li key={tip.slug}>
                  <TipCard tip={tip} />
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </main>
  )
}

function Count({ n }: { n: number }) {
  return <span className="ml-1.5 text-xs opacity-80">({n})</span>
}
