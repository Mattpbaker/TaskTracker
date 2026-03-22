import type { Task, SidebarStats, CategoryInsights } from '@/types/app'
import { isOverdue, isDueThisWeek, daysUntil } from './date-utils'

export function computeSidebarStats(tasks: Task[]): SidebarStats {
  const visible = tasks.filter(t => !t.isTemplate)
  return {
    recurringActive: visible.filter(t => t.isRecurring && daysUntil(t.dueDate) >= 0).length,
    dueThisWeek:     visible.filter(t => isDueThisWeek(t.dueDate) && t.progress < 100).length,
    upcoming:        visible.filter(t => daysUntil(t.dueDate) > 7 && t.progress < 100).length,
    overdue:         visible.filter(t => isOverdue(t.dueDate) && t.progress < 100).length,
    inProgress:      visible.filter(t => t.progress > 0 && t.progress < 100).length,
    completed:       visible.filter(t => t.progress === 100).length,
  }
}

export function computeCategoryInsights(tasks: Task[]): CategoryInsights {
  if (tasks.length === 0) {
    return { total: 0, inProgress: 0, completed: 0, overdue: 0, daysUntilFinalDue: 0, finalDueDate: null, overallProgress: 0 }
  }
  const sorted = [...tasks].sort((a, b) => b.dueDate.localeCompare(a.dueDate))
  const finalDueDate = sorted[0].dueDate
  const totalProgress = tasks.reduce((sum, t) => sum + t.progress, 0)
  return {
    total:             tasks.length,
    inProgress:        tasks.filter(t => t.progress > 0 && t.progress < 100).length,
    completed:         tasks.filter(t => t.progress === 100).length,
    overdue:           tasks.filter(t => isOverdue(t.dueDate) && t.progress < 100).length,
    daysUntilFinalDue: daysUntil(finalDueDate),
    finalDueDate,
    overallProgress:   Math.round(totalProgress / tasks.length),
  }
}
