import { parseRecurrenceRule, generateInstances } from '@/lib/recurrence'

const START = new Date('2026-03-21')
const END   = new Date('2026-05-14')

test('parseRecurrenceRule parses weekly:tuesday,thursday', () => {
  const rule = parseRecurrenceRule('weekly:tuesday,thursday')
  expect(rule.frequency).toBe('weekly')
  expect(rule.days).toEqual(['tuesday', 'thursday'])
})

test('parseRecurrenceRule parses weekly:any', () => {
  const rule = parseRecurrenceRule('weekly:any')
  expect(rule.frequency).toBe('weekly')
  expect(rule.days).toEqual(['any'])
})

test('generateInstances weekly:tuesday,thursday produces correct dates', () => {
  const instances = generateInstances('weekly:tuesday,thursday', START, END)
  // All must be Tuesday (2) or Thursday (4)
  instances.forEach(d => expect([2, 4]).toContain(d.getDay()))
  // Count: ~8 Tuesdays + ~8 Thursdays between Mar 21 and May 14
  expect(instances.length).toBeGreaterThanOrEqual(14)
})

test('generateInstances weekly:any first instance is first Monday on or after start', () => {
  const instances = generateInstances('weekly:any', START, END)
  // First Monday on or after Mar 21 (Saturday) is Mar 23
  expect(instances[0].toISOString().slice(0, 10)).toBe('2026-03-23')
  // All instances are Mondays
  instances.forEach(d => expect(d.getDay()).toBe(1))
})

test('generateInstances produces no dates outside range', () => {
  const instances = generateInstances('weekly:tuesday,thursday', START, END)
  instances.forEach(d => {
    expect(d.getTime()).toBeGreaterThanOrEqual(START.getTime())
    expect(d.getTime()).toBeLessThanOrEqual(END.getTime())
  })
})
