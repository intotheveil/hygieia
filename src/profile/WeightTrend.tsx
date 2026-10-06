// WEIGHT TREND (P8.2): the last 90 days of weight entries as an inline SVG sparkline (./chart.ts),
// `role="img"` with a summary sentence as its name — the same sentence is printed under it, so
// the figure is never image-only. Fewer than two readings → the empty copy, no chart.

import { useLang } from '../i18n/LangProvider'
import { profileCopy } from '../i18n/features/profile.ts'
import { fill } from '../i18n/fill'
import type { Entry } from '../user/source'
import { buildSparkline, weightPoints } from './chart'
import { formatDelta, formatNumber } from './format'
import { H2, SECTION } from './styles'

const WIDTH = 320
const HEIGHT = 96

export function WeightTrend({ entries, today }: { entries: readonly Entry[]; today: string }) {
  const { t, lang } = useLang(profileCopy)
  const chart = buildSparkline(weightPoints(entries, today), {
    width: WIDTH,
    height: HEIGHT,
    padding: 6,
  })
  const summary =
    chart === null
      ? null
      : fill(t.profileWeightTrendSummary, {
          first: formatNumber(chart.first.value, lang),
          last: formatNumber(chart.last.value, lang),
          delta: formatDelta(chart.delta, lang),
          n: chart.dots.length,
        })

  return (
    <section aria-labelledby="profile-weight" className={SECTION}>
      <h2 id="profile-weight" className={H2}>
        {t.profileWeightTrend}
      </h2>
      {chart === null || summary === null ? (
        <p className="text-sm text-olive-700">{t.profileWeightTrendEmpty}</p>
      ) : (
        <>
          <svg
            role="img"
            aria-label={summary}
            viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
            className="h-24 w-full max-w-md text-sage-700"
          >
            <path
              d={chart.path}
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            {chart.dots.map((dot) => (
              <circle key={dot.date} cx={dot.x} cy={dot.y} r={2.5} fill="currentColor" />
            ))}
          </svg>
          <p className="text-sm text-olive-700">{summary}</p>
        </>
      )}
    </section>
  )
}
