import { dictionaries } from '../i18n/dictionary'
import { fill } from '../i18n/fill'
import { cleanHome } from './content/clean-home'
import { generatePlan } from './generate'
import { planToText } from './text'
import { DAYS } from './types'

describe('planToText', () => {
  const answers = {
    size: ['studio'],
    household: [],
    time: ['t30'],
    style: ['weekly'],
    state: ['chaotic'],
  }
  const plan = generatePlan(cleanHome, answers)

  it.each(['en', 'el'] as const)('lists every planned task under its section (%s)', (lang) => {
    const t = dictionaries[lang]
    const text = planToText(cleanHome, plan, lang, t)
    const lines = text.split('\n')
    expect(lines[0]).toBe(cleanHome.title[lang])
    expect(lines).toContain(fill(t.tasksBudgetNote, { n: plan.budget }))
    expect(text).toContain(t.tasksGentleTitle)
    for (const heading of [t.tasksEveryDay, t.tasksThisWeek, t.tasksMonthly]) {
      expect(lines).toContain(`${heading}:`)
    }
    for (const day of DAYS) expect(lines).toContain(`${t.tasksDays[day]}:`)
    const tasks = [...plan.daily, ...DAYS.flatMap((d) => plan.weekly[d]), ...plan.monthly]
    for (const task of tasks) expect(text).toContain(`- [ ] ${task.title[lang]} (`)
    expect(text).toContain(`[${t.tasksKickoff}]`)
  })
})
