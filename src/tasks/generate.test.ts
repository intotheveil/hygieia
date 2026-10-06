import { loadAllTopics } from './content/index'
import {
  ANCHOR_WEIGHT,
  DEFAULT_BUDGET,
  MAX_DAILY,
  MAX_MONTHLY,
  MAX_WEEKLY_PER_DAY,
  budgetOf,
  byRank,
  gentleBudget,
  generatePlan,
  hasWork,
  isComplete,
  isGentle,
  matches,
  normalizeAnswers,
  spacedPattern,
  timesPlanned,
  type Plan,
} from './generate'
import { DAYS, type Answers, type Task, type Topic } from './types'

// A small synthetic topic, so each rule is checked against numbers we can work out by hand.
function task(partial: Partial<Task> & Pick<Task, 'id' | 'cadence' | 'minutes'>): Task {
  return { title: { en: partial.id, el: partial.id }, when: {}, weight: 3, ...partial }
}

const TOPIC: Topic = {
  id: 'fixture',
  icon: '*',
  title: { en: 'Fixture', el: 'Δοκιμή' },
  blurb: { en: 'b', el: 'β' },
  questions: [
    {
      id: 'time',
      kind: 'single',
      title: { en: 'Time', el: 'Χρόνος' },
      options: [
        { id: 't10', label: { en: '10', el: '10' }, minutes: 10 },
        { id: 't30', label: { en: '30', el: '30' }, minutes: 30 },
      ],
    },
    {
      id: 'state',
      kind: 'single',
      title: { en: 'State', el: 'Κατάσταση' },
      options: [
        { id: 'ok', label: { en: 'ok', el: 'ok' } },
        { id: 'bad', label: { en: 'bad', el: 'bad' }, gentle: true },
      ],
    },
    {
      id: 'who',
      kind: 'multi',
      title: { en: 'Who', el: 'Ποιοι' },
      options: [
        { id: 'kids', label: { en: 'kids', el: 'παιδιά' } },
        { id: 'pets', label: { en: 'pets', el: 'ζώα' } },
      ],
    },
  ],
  tasks: [
    task({ id: 'd-always', cadence: 'daily', minutes: 2, weight: 5 }),
    task({ id: 'd-kids', cadence: 'daily', minutes: 3, weight: 4, when: { who: ['kids'] } }),
    task({ id: 'd-pets', cadence: 'daily', minutes: 3, weight: 4, when: { who: ['pets'] } }),
    task({
      id: 'd-kids-and-long',
      cadence: 'daily',
      minutes: 3,
      weight: 4,
      when: { who: ['kids'], time: ['t30'] },
    }),
    task({ id: 'w-big', cadence: 'weekly', minutes: 15, weight: 5 }),
    task({ id: 'w-small', cadence: 'weekly', minutes: 5, weight: 3, times: 3 }),
    task({ id: 'w-sat', cadence: 'weekly', minutes: 5, weight: 4, day: 'sat' }),
    task({ id: 'w-huge', cadence: 'weekly', minutes: 60, weight: 5 }),
    task({ id: 'k-start', cadence: 'weekly', minutes: 5, weight: 4, kickoff: true }),
    task({ id: 'm-one', cadence: 'monthly', minutes: 20, weight: 3 }),
    task({ id: 'm-long', cadence: 'monthly', minutes: 90, weight: 5 }),
  ],
}

const ids = (tasks: readonly Task[]) => tasks.map((t) => t.id)
const weeklyIds = (plan: Plan) => new Set(DAYS.flatMap((d) => ids(plan.weekly[d])))
const A = (time: string, state: string, who: string[] = []): Answers => ({
  time: [time],
  state: [state],
  who,
})

/** Every complete answer set of a topic: one option per single question, every subset of a multi. */
function* combos(topic: Topic, i = 0, acc: Answers = {}): Generator<Answers> {
  if (i === topic.questions.length) {
    yield acc
    return
  }
  const q = topic.questions[i]!
  if (q.kind === 'single') {
    for (const o of q.options) yield* combos(topic, i + 1, { ...acc, [q.id]: [o.id] })
    return
  }
  const n = q.options.length
  for (let mask = 0; mask < 1 << n; mask++) {
    const chosen = q.options.filter((_, k) => (mask & (1 << k)) !== 0).map((o) => o.id)
    yield* combos(topic, i + 1, { ...acc, [q.id]: chosen })
  }
}

describe('matches', () => {
  it('is true for an empty condition', () => {
    expect(matches({}, {})).toBe(true)
  })
  it('needs EVERY listed question to have one of its options selected', () => {
    const when = { who: ['kids'], time: ['t30'] }
    expect(matches(when, { who: ['kids'], time: ['t30'] })).toBe(true)
    expect(matches(when, { who: ['kids'], time: ['t10'] })).toBe(false)
    expect(matches(when, { who: [], time: ['t30'] })).toBe(false)
    expect(matches(when, { time: ['t30'] })).toBe(false)
  })
  it('treats a multi-choice answer as "any of"', () => {
    expect(matches({ who: ['kids'] }, { who: ['pets', 'kids'] })).toBe(true)
    expect(matches({ who: ['kids', 'pets'] }, { who: ['pets'] })).toBe(true)
  })
})

describe('answers', () => {
  it('normalizes: unknown questions and options drop, a single keeps one answer', () => {
    expect(
      normalizeAnswers(TOPIC, {
        time: ['t30', 't10'],
        who: ['pets', 'nope', 'kids'],
        ghost: ['x'],
      }),
    ).toEqual({ time: ['t10'], who: ['kids', 'pets'] })
  })
  it('is complete when every single-choice question has an answer; multi may be empty', () => {
    expect(isComplete(TOPIC, A('t10', 'ok'))).toBe(true)
    expect(isComplete(TOPIC, { time: ['t10'] })).toBe(false)
  })
  it('reads the budget from the minutes question, or the default', () => {
    expect(budgetOf(TOPIC, A('t30', 'ok'))).toBe(30)
    expect(budgetOf(TOPIC, {})).toBe(DEFAULT_BUDGET)
  })
  it('is gentle when any chosen option is flagged gentle', () => {
    expect(isGentle(TOPIC, A('t30', 'bad'))).toBe(true)
    expect(isGentle(TOPIC, A('t30', 'ok'))).toBe(false)
  })
  it('gentle budget: ~70 %, rounded to 5, never under 10, never over the full budget', () => {
    expect(gentleBudget(5)).toBe(5)
    expect(gentleBudget(10)).toBe(10)
    expect(gentleBudget(20)).toBe(15)
    expect(gentleBudget(30)).toBe(20)
    expect(gentleBudget(45)).toBe(30)
    expect(gentleBudget(60)).toBe(40)
  })
})

describe('spacedPattern', () => {
  it('spreads repeats across the week', () => {
    expect(spacedPattern(1)).toEqual([0])
    expect(spacedPattern(2)).toEqual([0, 3])
    expect(spacedPattern(3)).toEqual([0, 2, 4])
    expect(spacedPattern(5)).toEqual([0, 1, 2, 4, 5])
    expect(spacedPattern(7)).toEqual([0, 1, 2, 3, 4, 5, 6])
    expect(spacedPattern(12)).toHaveLength(7)
    expect(spacedPattern(0)).toEqual([0])
  })
})

describe('generatePlan on the fixture', () => {
  it('filters by answers, including multi-choice', () => {
    const none = generatePlan(TOPIC, A('t30', 'ok', []))
    expect(ids(none.daily)).not.toContain('d-kids')
    expect(ids(none.daily)).not.toContain('d-pets')

    const kids = generatePlan(TOPIC, A('t30', 'ok', ['kids']))
    expect(ids(kids.daily)).toContain('d-kids')
    expect(ids(kids.daily)).toContain('d-kids-and-long')
    expect(ids(kids.daily)).not.toContain('d-pets')

    const both = generatePlan(TOPIC, A('t30', 'ok', ['kids', 'pets']))
    expect(ids(both.daily)).toEqual(expect.arrayContaining(['d-kids', 'd-pets']))

    // `d-kids-and-long` needs BOTH conditions: kids AND the 30-minute budget.
    expect(ids(generatePlan(TOPIC, A('t10', 'ok', ['kids'])).daily)).not.toContain(
      'd-kids-and-long',
    )
  })

  it('keeps every day within the budget', () => {
    for (const answers of combos(TOPIC)) {
      const plan = generatePlan(TOPIC, answers)
      for (const day of DAYS) {
        const sum =
          plan.daily.reduce((s, t) => s + t.minutes, 0) +
          plan.weekly[day].reduce((s, t) => s + t.minutes, 0)
        expect(sum, `${JSON.stringify(answers)} ${day}`).toBe(plan.load[day])
        expect(sum).toBeLessThanOrEqual(plan.budget)
      }
    }
  })

  it('leaves out a task too long for any day instead of squeezing it in', () => {
    const plan = generatePlan(TOPIC, A('t30', 'ok'))
    expect(weeklyIds(plan).has('w-huge')).toBe(false)
    expect(ids(plan.monthly)).not.toContain('m-long')
    expect(ids(plan.monthly)).toContain('m-one')
  })

  it('places a repeated task on that many different days, and honours a day hint', () => {
    const plan = generatePlan(TOPIC, A('t30', 'ok'))
    expect(timesPlanned(plan, 'w-small')).toBe(3)
    expect(ids(plan.weekly.sat)).toContain('w-sat')
  })

  it('is deterministic: same answers, same plan', () => {
    for (const answers of combos(TOPIC)) {
      expect(generatePlan(TOPIC, answers)).toEqual(generatePlan(TOPIC, answers))
    }
    // …and the answer ORDER inside a multi-choice does not matter.
    expect(generatePlan(TOPIC, A('t30', 'ok', ['pets', 'kids']))).toEqual(
      generatePlan(TOPIC, A('t30', 'ok', ['kids', 'pets'])),
    )
  })

  it('kick-off rule: a gentle start is lighter and carries the kick-off tasks', () => {
    const steady = generatePlan(TOPIC, A('t30', 'ok'))
    const gentle = generatePlan(TOPIC, A('t30', 'bad'))
    expect(steady.gentle).toBe(false)
    expect(steady.budget).toBe(30)
    expect(weeklyIds(steady).has('k-start')).toBe(false)

    expect(gentle.gentle).toBe(true)
    expect(gentle.fullBudget).toBe(30)
    expect(gentle.budget).toBe(20)
    expect(weeklyIds(gentle).has('k-start')).toBe(true)
    // "Lighter" = a smaller daily ceiling: no gentle day goes past it, though a steady day may.
    const peak = (p: Plan) => Math.max(...DAYS.map((d) => p.load[d]))
    expect(peak(gentle)).toBeLessThanOrEqual(gentle.budget)
    expect(gentle.budget).toBeLessThan(steady.budget)
    expect(DAYS.flatMap((d) => gentle.weekly[d]).filter((t) => t.kickoff)).not.toHaveLength(0)
  })

  it('balances weekly jobs: no day gets a second one while another day has none', () => {
    const flat: Topic = {
      ...TOPIC,
      tasks: Array.from({ length: 7 }, (_, i) =>
        task({ id: `job-${i}`, cadence: 'weekly', minutes: 10 }),
      ),
    }
    const plan = generatePlan(flat, A('t30', 'ok'))
    expect(DAYS.map((d) => plan.weekly[d].length)).toEqual([1, 1, 1, 1, 1, 1, 1])
    const loads = DAYS.map((d) => plan.load[d])
    expect(Math.max(...loads) - Math.min(...loads)).toBe(0)
  })

  it('caps weekly jobs per day and daily tasks per plan', () => {
    const crowded: Topic = {
      ...TOPIC,
      tasks: [
        ...Array.from({ length: 30 }, (_, i) =>
          task({ id: `job-${String(i).padStart(2, '0')}`, cadence: 'weekly', minutes: 1 }),
        ),
        ...Array.from({ length: 20 }, (_, i) =>
          task({ id: `habit-${String(i).padStart(2, '0')}`, cadence: 'daily', minutes: 1 }),
        ),
      ],
    }
    const plan = generatePlan(crowded, A('t30', 'ok'))
    for (const d of DAYS) expect(plan.weekly[d].length).toBeLessThanOrEqual(MAX_WEEKLY_PER_DAY)
    expect(plan.daily.length).toBeLessThanOrEqual(MAX_DAILY)
  })

  it('places anchors (weight ≥ ANCHOR_WEIGHT) before the daily habits', () => {
    const anchored: Topic = {
      ...TOPIC,
      tasks: [
        task({ id: 'session', cadence: 'weekly', minutes: 25, weight: ANCHOR_WEIGHT, times: 3 }),
        ...Array.from({ length: 10 }, (_, i) =>
          task({ id: `habit-${i}`, cadence: 'daily', minutes: 2, weight: 5 }),
        ),
      ],
    }
    const plan = generatePlan(anchored, A('t30', 'ok'))
    expect(timesPlanned(plan, 'session')).toBe(3)
    for (const d of DAYS) expect(plan.load[d]).toBeLessThanOrEqual(30)
  })

  it('sorts by weight, then shorter, then id', () => {
    const a = task({ id: 'a', cadence: 'daily', minutes: 5, weight: 3 })
    const b = task({ id: 'b', cadence: 'daily', minutes: 2, weight: 3 })
    const c = task({ id: 'c', cadence: 'daily', minutes: 9, weight: 4 })
    const d = task({ id: 'd', cadence: 'daily', minutes: 2, weight: 3 })
    expect([a, b, c, d].sort(byRank).map((t) => t.id)).toEqual(['c', 'b', 'd', 'a'])
  })

  it('caps the monthly list', () => {
    const many: Topic = {
      ...TOPIC,
      tasks: Array.from({ length: 12 }, (_, i) =>
        task({ id: `m-${String(i).padStart(2, '0')}`, cadence: 'monthly', minutes: 5 }),
      ),
    }
    expect(generatePlan(many, A('t30', 'ok')).monthly).toHaveLength(MAX_MONTHLY)
  })
})

describe('generatePlan on every bundled topic × every answer combination', () => {
  it('always yields a non-empty plan within budget, and every task is reachable', async () => {
    const topics = await loadAllTopics()
    let plans = 0
    for (const topic of topics) {
      const reached = new Set<string>()
      for (const answers of combos(topic)) {
        const plan = generatePlan(topic, answers)
        plans++
        expect(hasWork(plan), `${topic.id} ${JSON.stringify(answers)}`).toBe(true)
        for (const day of DAYS) {
          expect(
            plan.load[day],
            `${topic.id} ${day} ${JSON.stringify(answers)}`,
          ).toBeLessThanOrEqual(plan.budget)
        }
        for (const t of [...plan.daily, ...DAYS.flatMap((d) => plan.weekly[d]), ...plan.monthly]) {
          reached.add(t.id)
        }
      }
      // Dead content check: every task in the bank is planned for SOME answers.
      expect(
        topic.tasks.filter((t) => !reached.has(t.id)).map((t) => t.id),
        topic.id,
      ).toEqual([])
    }
    // 19 topics: 17 424 plans for the first 11 + 6 120 for the eight added on 2026-10-06.
    expect(plans).toBe(23544)
  }, 60_000)
})
