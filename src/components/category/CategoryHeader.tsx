import { formatDueDate, daysUntil } from '@/lib/date-utils'
import type { Category } from '@/types/app'

export default function CategoryHeader({ category, taskCount, finalDueDate }: {
  category: Category
  taskCount: number
  finalDueDate: string | null
}) {
  const days = finalDueDate ? daysUntil(finalDueDate) : null
  return (
    <div className="flex items-center gap-4 px-6 py-4 bg-surface border-b border-border">
      <div className="w-3 h-3 rounded-full flex-shrink-0 shadow-lg" style={{ background: category.colour, boxShadow: `0 0 8px ${category.colour}80` }} />
      <div>
        <h1 className="text-lg font-bold" style={{ color: category.colour }}>{category.name}</h1>
        <p className="text-xs text-muted">
          {taskCount} task{taskCount !== 1 ? 's' : ''}
          {finalDueDate && ` · final due ${formatDueDate(finalDueDate)}`}
          {days !== null && ` · ${days > 0 ? `${days} days away` : days === 0 ? 'due today' : `${Math.abs(days)}d overdue`}`}
        </p>
      </div>
    </div>
  )
}
