import { COURSE_START, COURSE_END } from '@/lib/constants'

const TOTAL_DAYS = Math.ceil(
  (COURSE_END.getTime() - COURSE_START.getTime()) / (1000 * 60 * 60 * 24)
)

export function dateToPercent(dateStr: string): number {
  const date = new Date(dateStr)
  const elapsed = Math.ceil((date.getTime() - COURSE_START.getTime()) / (1000 * 60 * 60 * 24))
  return Math.max(0, Math.min(100, (elapsed / TOTAL_DAYS) * 100))
}

const CARD_HALF_WIDTH_PX = 72 // w-36 (144px) / 2

const SEARCH_ORDER: Array<['above' | 'below', number]> = [
  ['above', 0], ['below', 0],
  ['above', 1], ['below', 1],
  ['above', 2], ['below', 2],
]

export function assignCardPositions<T extends { id: string; dueDate: string }>(
  tasks: T[],
  innerWidthPx: number
): Array<T & { position: 'above' | 'below'; lane: number }> {
  const halfPct = (CARD_HALF_WIDTH_PX / innerWidthPx) * 100
  const laneEnds: Record<'above' | 'below', number[]> = { above: [], below: [] }

  return tasks.map(task => {
    const pct = dateToPercent(task.dueDate)
    const start = pct - halfPct

    for (const [side, lane] of SEARCH_ORDER) {
      const end = laneEnds[side][lane] ?? -Infinity
      if (end <= start) {
        laneEnds[side][lane] = pct + halfPct
        return { ...task, position: side, lane }
      }
    }

    // Fallback: last slot
    const [side, lane] = SEARCH_ORDER[SEARCH_ORDER.length - 1]
    laneEnds[side][lane] = pct + halfPct
    return { ...task, position: side, lane }
  })
}
