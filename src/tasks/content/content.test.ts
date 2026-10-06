import { CADENCES, DAYS, type Bi, type Topic } from '../types'
import { TOPIC_LOADERS, loadAllTopics, loadTopic } from './index'
import { TOPICS, TOPIC_IDS, isTopicId } from './topics'

const GREEK = /[Ͱ-Ͽἀ-῾]/

function bilingual(label: string, value: Bi | undefined) {
  expect(value, label).toBeDefined()
  expect(value!.en.trim(), `${label} (en)`).not.toBe('')
  expect(value!.el.trim(), `${label} (el)`).not.toBe('')
}

let topics: Topic[] = []
beforeAll(async () => {
  topics = await loadAllTopics()
})

describe('the topic list', () => {
  it('has nineteen topics, each with a loader, in TOPIC_IDS order', () => {
    expect(TOPIC_IDS.length).toBe(19)
    expect(Object.keys(TOPIC_LOADERS).sort()).toEqual([...TOPIC_IDS].sort())
    expect(topics.map((t) => t.id)).toEqual([...TOPIC_IDS])
    expect(new Set(TOPIC_IDS).size).toBe(TOPIC_IDS.length)
  })

  it('covers the requested topics', () => {
    for (const id of [
      'clean-home',
      'workout-routine',
      'better-sleep',
      'eat-healthier',
      'drink-water',
      'skincare-habit',
      'declutter',
      'reduce-stress',
      'morning-routine',
      'budget-groceries',
      'study-focus',
      'newborn-routine',
      'pet-care',
      'plants-garden',
      'car-care',
      'moving-house',
      'exam-season',
      'summer-prep',
      'quit-smoking',
    ]) {
      expect(isTopicId(id), id).toBe(true)
    }
    expect(isTopicId('nope')).toBe(false)
  })

  it('every loaded topic carries the meta of the light list (one source of truth)', async () => {
    for (const id of TOPIC_IDS) {
      const topic = await loadTopic(id)
      expect(topic.id).toBe(id)
      expect(topic.title).toEqual(TOPICS[id].title)
      expect(topic.blurb).toEqual(TOPICS[id].blurb)
      expect(topic.icon).toBe(TOPICS[id].icon)
      bilingual(`${id} title`, topic.title)
      bilingual(`${id} blurb`, topic.blurb)
      expect(GREEK.test(topic.title.el), `${id} Greek title in Greek script`).toBe(true)
    }
  })
})

describe('questionnaires', () => {
  it('3–6 questions each, unique ids, ≥ 2 options with unique ids, both languages', () => {
    for (const topic of topics) {
      expect(topic.questions.length, topic.id).toBeGreaterThanOrEqual(3)
      expect(topic.questions.length, topic.id).toBeLessThanOrEqual(6)
      const qids = topic.questions.map((q) => q.id)
      expect(new Set(qids).size, `${topic.id} question ids`).toBe(qids.length)
      for (const q of topic.questions) {
        bilingual(`${topic.id}/${q.id}`, q.title)
        if (q.help) bilingual(`${topic.id}/${q.id} help`, q.help)
        expect(q.options.length, `${topic.id}/${q.id}`).toBeGreaterThanOrEqual(2)
        const oids = q.options.map((o) => o.id)
        expect(new Set(oids).size, `${topic.id}/${q.id} option ids`).toBe(oids.length)
        for (const o of q.options) bilingual(`${topic.id}/${q.id}/${o.id}`, o.label)
      }
    }
  })

  it('at most one time-budget question, single-choice, every option with minutes > 0', () => {
    for (const topic of topics) {
      const budget = topic.questions.filter((q) => q.options.some((o) => o.minutes !== undefined))
      expect(budget.length, topic.id).toBeLessThanOrEqual(1)
      for (const q of budget) {
        expect(q.kind, `${topic.id}/${q.id}`).toBe('single')
        for (const o of q.options)
          expect(o.minutes, `${topic.id}/${q.id}/${o.id}`).toBeGreaterThan(0)
      }
    }
  })

  it('every topic has a gentle option (the kick-off rule can trigger) and a kick-off task', () => {
    for (const topic of topics) {
      expect(
        topic.questions.some((q) => q.options.some((o) => o.gentle === true)),
        topic.id,
      ).toBe(true)
      expect(
        topic.tasks.some((t) => t.kickoff === true),
        topic.id,
      ).toBe(true)
    }
  })
})

describe('task banks', () => {
  it('≥ 25 tasks per topic and ≥ 40 on average', () => {
    for (const topic of topics) expect(topic.tasks.length, topic.id).toBeGreaterThanOrEqual(25)
    const total = topics.reduce((s, t) => s + t.tasks.length, 0)
    expect(total / topics.length).toBeGreaterThanOrEqual(40)
  })

  it('unique ids, minutes > 0, known cadence/day, both languages', () => {
    for (const topic of topics) {
      const ids = topic.tasks.map((t) => t.id)
      expect(new Set(ids).size, `${topic.id} task ids`).toBe(ids.length)
      for (const t of topic.tasks) {
        const where = `${topic.id}/${t.id}`
        bilingual(where, t.title)
        if (t.detail) bilingual(`${where} detail`, t.detail)
        expect(Number.isInteger(t.minutes) && t.minutes > 0, `${where} minutes`).toBe(true)
        expect(CADENCES, where).toContain(t.cadence)
        expect(t.weight, `${where} weight`).toBeGreaterThan(0)
        if (t.day !== undefined) {
          expect(DAYS, where).toContain(t.day)
          expect(t.cadence, `${where}: a day hint is for weekly tasks`).toBe('weekly')
        }
        if (t.times !== undefined) {
          expect(t.cadence, `${where}: times is for weekly tasks`).toBe('weekly')
          expect(t.times >= 1 && t.times <= 7, `${where} times`).toBe(true)
        }
        if (t.kickoff) expect(t.cadence, `${where}: a kick-off is weekly`).toBe('weekly')
      }
    }
  })

  it('every `when` names a real question and real options of that question', () => {
    for (const topic of topics) {
      const questions = new Map(
        topic.questions.map((q) => [q.id, new Set(q.options.map((o) => o.id))]),
      )
      for (const t of topic.tasks) {
        for (const [qid, optionIds] of Object.entries(t.when)) {
          const options = questions.get(qid)
          expect(options, `${topic.id}/${t.id}: unknown question ${qid}`).toBeDefined()
          expect(
            optionIds.length,
            `${topic.id}/${t.id}: empty option list for ${qid}`,
          ).toBeGreaterThan(0)
          for (const o of optionIds) {
            expect(options!.has(o), `${topic.id}/${t.id}: ${qid} has no option ${o}`).toBe(true)
          }
        }
      }
    }
  })

  it('every topic has a daily and a weekly task, and something for everyone (an empty `when`)', () => {
    for (const topic of topics) {
      expect(
        topic.tasks.some((t) => t.cadence === 'daily'),
        topic.id,
      ).toBe(true)
      expect(
        topic.tasks.some((t) => t.cadence === 'weekly'),
        topic.id,
      ).toBe(true)
      expect(
        topic.tasks.some((t) => Object.keys(t.when).length === 0),
        topic.id,
      ).toBe(true)
    }
  })
})

describe('health-sensitive wording', () => {
  // Newborn, summer heat and quitting smoking touch medicine: the plan never advises a product or a
  // dose itself — any task about TAKING or GIVING one (a dose, any medicine, regular medicines, quit
  // medicines, nicotine replacement, starting solids) points to a paediatrician, pharmacist or
  // doctor. Packing or returning medicines is not advice and is not matched.
  const MEDICINE =
    /\b(doses?|any medicine|regular medicines|quit medicines|nicotine replacement|solids)\b/i
  const PROFESSIONAL = /paediatrician|pharmacist|doctor|midwife/i
  it('every task about taking or giving medicine names a professional', () => {
    let checked = 0
    for (const topic of topics) {
      for (const t of topic.tasks) {
        const en = [t.title.en, t.detail?.en ?? ''].join(' ')
        if (!MEDICINE.test(en)) continue
        checked++
        expect(PROFESSIONAL.test(en), `${topic.id}/${t.id}: ${en}`).toBe(true)
      }
    }
    expect(checked).toBeGreaterThanOrEqual(4)
  })

  it('quit smoking never shames: a slip is a restart, and support is offered', async () => {
    const quit = await loadTopic('quit-smoking')
    const text = quit.tasks.map((t) => [t.title.en, t.detail?.en ?? ''].join(' ')).join(' | ')
    // "failure" may appear only as "is not failure"
    expect(text).toMatch(/is not failure/i)
    expect(text.replace(/is not failure/gi, '')).not.toMatch(
      /\b(weak|fail(ure|ed)?|ashamed|disgusting|lazy|guilty)\b/i,
    )
    expect(text).toMatch(/national quit-smoking helpline/i)
  })
})
