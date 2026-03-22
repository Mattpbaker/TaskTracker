import { daysUntilCourseEnd } from '@/lib/date-utils'

export default function DaysRemainingBadge() {
  const days = daysUntilCourseEnd()
  return (
    <span className="text-xs text-amber-400 bg-amber-950 border border-amber-900 rounded px-2 py-1">
      ⚡ {days} days left
    </span>
  )
}
