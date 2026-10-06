import { describe, expect, it } from 'vitest'
import { validatePlanForm, type PlanForm } from './builder'
import { plan, session } from './fixtures'
import { planSchedule } from './schedule'

const own = (performed_at: string) => session(performed_at, [], { plan_id: 'plan-1' })

describe('planSchedule', () => {
  it('lays out weeks × days with plan weeks from the start date', () => {
    const s = planSchedule(plan(), [], '2026-10-06')
    expect(s.weeks).toHaveLength(4)
    expect(s.total).toBe(12)
    expect(s.done).toBe(0)
    expect(s.percent).toBe(0)
    expect(s.weeks.map((w) => [w.start, w.end])).toEqual([
      ['2026-10-01', '2026-10-07'],
      ['2026-10-08', '2026-10-14'],
      ['2026-10-15', '2026-10-21'],
      ['2026-10-22', '2026-10-28'],
    ])
    expect(s.endDate).toBe('2026-10-28')
    expect(s.currentWeek).toBe(0)
    expect(s.weeks.map((w) => w.current)).toEqual([true, false, false, false])
  })

  it('fills cells with the sessions logged on the plan, capped per week', () => {
    const sessions = [
      own('2026-10-01'),
      own('2026-10-02'),
      own('2026-10-03'),
      own('2026-10-04'), // a 4th in week 1: counted, cannot fill a 4th cell
      own('2026-10-09'),
      session('2026-10-10', []), // not on the plan
      session('2026-10-11', [], { plan_id: 'other' }),
    ]
    const s = planSchedule(plan(), sessions, '2026-10-09')
    expect(s.weeks.map((w) => w.sessions.length)).toEqual([4, 1, 0, 0])
    expect(s.weeks.map((w) => w.filled)).toEqual([3, 1, 0, 0])
    expect(s.done).toBe(4)
    expect(s.percent).toBe(33)
    expect(s.currentWeek).toBe(1)
    expect(s.thisWeek).toBe(1)
  })

  it('reaches 100 % when every cell is filled', () => {
    const p = plan({ weeks: 1, days_per_week: 2 })
    const s = planSchedule(p, [own('2026-10-01'), own('2026-10-05')], '2026-10-05')
    expect(s.percent).toBe(100)
    expect(s.done).toBe(2)
  })

  it('clamps sessions dated before the start / after the end into the first / last week', () => {
    const s = planSchedule(plan(), [own('2026-09-20'), own('2026-12-01')], '2026-10-06')
    expect(s.weeks[0]?.sessions).toHaveLength(1)
    expect(s.weeks[3]?.sessions).toHaveLength(1)
  })

  it('has no current week before the start or after the end', () => {
    expect(planSchedule(plan(), [], '2026-09-30').currentWeek).toBeNull()
    const after = planSchedule(plan(), [own('2026-10-02')], '2026-10-29')
    expect(after.currentWeek).toBeNull()
    expect(after.thisWeek).toBe(0)
    expect(after.weeks.every((w) => !w.current)).toBe(true)
    expect(planSchedule(plan(), [], '2026-10-28').currentWeek).toBe(3)
  })

  it('orders a week’s sessions oldest first', () => {
    const a = own('2026-10-03')
    const b = own('2026-10-01')
    expect(planSchedule(plan(), [a, b], '2026-10-06').weeks[0]?.sessions).toEqual([b, a])
  })
})

describe('validatePlanForm', () => {
  const form = (patch: Partial<PlanForm> = {}): PlanForm => ({
    template_id: 'tpl-gym',
    name: '  Autumn strength ',
    weeks: '4',
    days_per_week: '3',
    start_date: '2026-10-06',
    ...patch,
  })

  it('returns the exact createWorkoutPlan payload (trimmed name, numbers, no user_id)', () => {
    expect(validatePlanForm(form())).toEqual({
      ok: true,
      input: {
        template_id: 'tpl-gym',
        name: 'Autumn strength',
        weeks: 4,
        days_per_week: 3,
        start_date: '2026-10-06',
      },
    })
  })

  it('accepts the bounds 1 / 12 weeks, 1 / 7 days, an 80-character name', () => {
    for (const patch of [
      { weeks: '1', days_per_week: '1' },
      { weeks: '12', days_per_week: '7' },
      { name: 'n'.repeat(80) },
    ]) {
      expect(validatePlanForm(form(patch)).ok).toBe(true)
    }
  })

  it.each([
    [{ template_id: null }, ['template']],
    [{ template_id: '' }, ['template']],
    [{ name: '   ' }, ['name']],
    [{ name: 'n'.repeat(81) }, ['name']],
    [{ weeks: '0' }, ['weeks']],
    [{ weeks: '13' }, ['weeks']],
    [{ weeks: '2.5' }, ['weeks']],
    [{ days_per_week: '0' }, ['days']],
    [{ days_per_week: '8' }, ['days']],
    [{ days_per_week: '' }, ['days']],
    [{ start_date: '2026-13-01' }, ['date']],
    [{ start_date: '' }, ['date']],
    [
      { template_id: null, name: '', weeks: 'x', days_per_week: '9', start_date: 'no' },
      ['template', 'name', 'weeks', 'days', 'date'],
    ],
  ] as const)('rejects %j', (patch, errors) => {
    expect(validatePlanForm(form(patch))).toEqual({ ok: false, errors: [...errors] })
  })
})
