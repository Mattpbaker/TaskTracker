import { daysUntilCourseEnd } from '@/lib/date-utils'

export default function DaysRemainingBadge() {
  const days = daysUntilCourseEnd()
  return (
    <span className="text-[11px] font-semibold text-cat-social border border-cat-social/30 bg-cat-social/8 rounded-full px-2.5 py-1 tabular-nums">
      {days}d left
    </span>
  )
}
