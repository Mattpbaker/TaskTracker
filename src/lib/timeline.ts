import { COURSE_START, COURSE_END } from '@/lib/constants'

const TOTAL_DAYS = Math.ceil(
  (COURSE_END.getTime() - COURSE_START.getTime()) / (1000 * 60 * 60 * 24)
)

export function dateToPercent(dateStr: string): number {
  const date = new Date(dateStr)
  const elapsed = Math.ceil((date.getTime() - COURSE_START.getTime()) / (1000 * 60 * 60 * 24))
  return Math.max(0, Math.min(100, (elapsed / TOTAL_DAYS) * 100))
}

export const CARD_HALF_WIDTH_PX = 56 // w-[112px] / 2

// Interleaved above/below lanes, 6 fixed slots each side
const SEARCH_ORDER: Array<['above' | 'below', number]> = [
  ['above', 0], ['below', 0],
  ['above', 1], ['below', 1],
  ['above', 2], ['below', 2],
  ['above', 3], ['below', 3],
  ['above', 4], ['below', 4],
  ['above', 5], ['below', 5],
]

export function assignCardPositions<T extends { id: string; dueDate: string }>(
  tasks: T[],
  innerWidthPx: number
): Array<T & { position: 'above' | 'below'; lane: number }> {
  // Sort by due date so nearby tasks compete for lanes deterministically
  const sorted = [...tasks].sort((a, b) => a.dueDate.localeCompare(b.dueDate))
  const halfPct = (CARD_HALF_WIDTH_PX / innerWidthPx) * 100
  const laneEnds: Record<'above' | 'below', number[]> = { above: [], below: [] }

  const results = sorted.map(task => {
    const pct = dateToPercent(task.dueDate)
    const start = pct - halfPct

    for (const [side, lane] of SEARCH_ORDER) {
      const end = laneEnds[side][lane] ?? -Infinity
      if (end <= start) {
        laneEnds[side][lane] = pct + halfPct
        return { ...task, position: side, lane }
      }
    }

    // Dynamic overflow: expand lanes beyond the fixed set
    let nextLane = SEARCH_ORDER[SEARCH_ORDER.length - 1][1] + 1
    for (const side of ['above', 'below'] as const) {
      const end = laneEnds[side][nextLane] ?? -Infinity
      if (end <= start) {
        laneEnds[side][nextLane] = pct + halfPct
        return { ...task, position: side, lane: nextLane }
      }
    }

    // Last resort: always expand above
    laneEnds.above[nextLane] = pct + halfPct
    return { ...task, position: 'above' as const, lane: nextLane }
  })

  // Re-map to original task order
  const positionMap = new Map(results.map(r => [r.id, { position: r.position, lane: r.lane }]))
  return tasks.map(task => ({
    ...task,
    position: positionMap.get(task.id)!.position,
    lane: positionMap.get(task.id)!.lane,
  }))
}
