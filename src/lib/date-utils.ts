import { COURSE_END } from './constants'

export function daysUntil(date: Date | string): number {
  const target = new Date(typeof date === 'string' ? date : date.getTime())
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  target.setHours(0, 0, 0, 0)
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

export function daysUntilCourseEnd(): number {
  return daysUntil(new Date(COURSE_END))
}

export function isOverdue(dueDate: string): boolean {
  return daysUntil(dueDate) < 0
}

export function isDueThisWeek(dueDate: string): boolean {
  const d = daysUntil(dueDate)
  return d >= 0 && d <= 7
}

export function formatDueDate(dueDate: string, dueTime?: string | null): string {
  const d = new Date(dueDate)
  const dateStr = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  if (!dueTime) return dateStr
  const [h, m] = dueTime.split(':')
  const hour = parseInt(h)
  const suffix = hour >= 12 ? 'pm' : 'am'
  const displayHour = hour > 12 ? hour - 12 : hour || 12
  return `${dateStr} · ${displayHour}:${m}${suffix}`
}

export function timeRemainingLabel(dueDate: string): { label: string; urgency: 'normal' | 'amber' | 'red' } {
  const days = daysUntil(dueDate)
  if (days < 0)  return { label: `${Math.abs(days)}d overdue`, urgency: 'red' }
  if (days === 0) return { label: 'Due today', urgency: 'red' }
  if (days <= 7)  return { label: `${days}d left`, urgency: 'amber' }
  return { label: `${days} days left`, urgency: 'normal' }
}
