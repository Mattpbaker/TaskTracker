import { daysUntil, isOverdue, isDueThisWeek, formatDueDate, timeRemainingLabel } from '@/lib/date-utils'

// Pin "today" to a fixed date for deterministic tests
const FIXED_TODAY = new Date('2026-03-21T12:00:00.000Z')
beforeEach(() => { jest.useFakeTimers().setSystemTime(FIXED_TODAY) })
afterEach(() => { jest.useRealTimers() })

test('daysUntil returns 0 for today', () => {
  expect(daysUntil('2026-03-21')).toBe(0)
})
test('daysUntil returns positive for future', () => {
  expect(daysUntil('2026-03-28')).toBe(7)
})
test('daysUntil returns negative for past', () => {
  expect(daysUntil('2026-03-14')).toBe(-7)
})
test('isOverdue returns true for past date', () => {
  expect(isOverdue('2026-03-14')).toBe(true)
})
test('isOverdue returns false for future date', () => {
  expect(isOverdue('2026-03-28')).toBe(false)
})
test('isDueThisWeek true for date within 7 days', () => {
  expect(isDueThisWeek('2026-03-26')).toBe(true)
})
test('isDueThisWeek false for date > 7 days out', () => {
  expect(isDueThisWeek('2026-04-10')).toBe(false)
})
test('formatDueDate formats without time', () => {
  expect(formatDueDate('2026-05-08')).toBe('8 May')
})
test('formatDueDate formats with time', () => {
  expect(formatDueDate('2026-05-08', '14:00')).toBe('8 May · 2:00pm')
})
test('timeRemainingLabel red when overdue', () => {
  expect(timeRemainingLabel('2026-03-14').urgency).toBe('red')
})
test('timeRemainingLabel amber within 7 days', () => {
  expect(timeRemainingLabel('2026-03-26').urgency).toBe('amber')
})
test('timeRemainingLabel normal beyond 7 days', () => {
  expect(timeRemainingLabel('2026-04-10').urgency).toBe('normal')
})
