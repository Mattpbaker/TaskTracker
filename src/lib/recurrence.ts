const DAY_MAP: Record<string, number> = {
  sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
  thursday: 4, friday: 5, saturday: 6,
}

export interface RecurrenceRule {
  frequency: 'weekly'
  days: string[]
}

export function parseRecurrenceRule(rule: string): RecurrenceRule {
  const [frequency, daysPart] = rule.split(':')
  if (frequency !== 'weekly') throw new Error(`Unsupported frequency: ${frequency}`)
  const days = daysPart.split(',').map(d => d.trim().toLowerCase())
  return { frequency: 'weekly', days }
}

export function generateInstances(rule: string, start: Date, end: Date): Date[] {
  const { days } = parseRecurrenceRule(rule)
  const instances: Date[] = []

  if (days.includes('any')) {
    // First Monday on or after start
    const first = new Date(start)
    while (first.getDay() !== 1) first.setDate(first.getDate() + 1)
    const cur = new Date(first)
    while (cur <= end) {
      instances.push(new Date(cur))
      cur.setDate(cur.getDate() + 7)
    }
    return instances
  }

  const targetDays = days.map(d => DAY_MAP[d])
  const cur = new Date(start)
  while (cur <= end) {
    if (targetDays.includes(cur.getDay())) {
      instances.push(new Date(cur))
    }
    cur.setDate(cur.getDate() + 1)
  }
  return instances
}
