'use client'
import { useRouter, usePathname } from 'next/navigation'
import type { Task } from '@/types/app'
import TimelineStem from './TimelineStem'
import { formatDueDate } from '@/lib/date-utils'
import { dateToPercent } from './TimelineAxis'

const LANE_HEIGHT = 90 // px per lane step — must match TimelineStem

interface Props {
  task: Task
  position: 'above' | 'below'
  lane: number
  colour: string
}

export default function TimelineCard({ task, position, lane, colour }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const pct = dateToPercent(task.dueDate)

  const open = () => router.push(`${pathname}?task=${task.id}`)

  // Dot sits on the axis: offset = card-container-bottom-to-axis distance + half dot height
  // Container bottom = axis + (1 + lane * LANE_HEIGHT)px above axis
  // So dot bottom relative to container = -(1 + lane * LANE_HEIGHT + 5)px ≈ -(6 + lane * 90)
  const dotOffset = 6 + lane * LANE_HEIGHT

  return (
    <div
      className="absolute -translate-x-1/2 flex flex-col items-center cursor-pointer group z-10"
      style={{
        left: `${pct}%`,
        [position === 'above' ? 'bottom' : 'top']: `calc(50% + 1px + ${lane * LANE_HEIGHT}px)`,
      }}
    >
      {/* Dot on axis — always positioned at the axis line regardless of lane */}
      <div
        className="absolute w-2.5 h-2.5 rounded-full border-2 z-20 transition-transform group-hover:scale-150"
        style={{
          background: 'var(--surface)',
          borderColor: colour,
          boxShadow: `0 0 6px ${colour}66`,
          [position === 'above' ? 'bottom' : 'top']: `-${dotOffset}px`,
        }}
      />

      {position === 'above' ? (
        <>
          <div
            className="mb-1 bg-surface border border-border rounded-lg p-2 w-[112px] shadow-sm transition-all group-hover:shadow-md group-hover:-translate-y-0.5"
            onMouseEnter={e => (e.currentTarget.style.borderColor = colour)}
            onMouseLeave={e => (e.currentTarget.style.borderColor = '')}
            onClick={open}
          >
            <CardContent task={task} colour={colour} />
          </div>
          <TimelineStem position="above" colour={colour} lane={lane} />
        </>
      ) : (
        <>
          <TimelineStem position="below" colour={colour} lane={lane} />
          <div
            className="mt-1 bg-surface border border-border rounded-lg p-2 w-[112px] shadow-sm transition-all group-hover:shadow-md group-hover:translate-y-0.5"
            onMouseEnter={e => (e.currentTarget.style.borderColor = colour)}
            onMouseLeave={e => (e.currentTarget.style.borderColor = '')}
            onClick={open}
          >
            <CardContent task={task} colour={colour} />
          </div>
        </>
      )}
    </div>
  )
}

function CardContent({ task, colour }: { task: Task; colour: string }) {
  return (
    <>
      <div className="flex items-center gap-1.5 mb-1">
        <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: colour }} />
        <span className="text-[11px] font-semibold text-primary leading-tight line-clamp-2">{task.title}</span>
      </div>
      <p className="text-[10px] text-muted mb-1.5">{formatDueDate(task.dueDate, task.dueTime)}</p>
      {task.module && (
        <span className="text-[9px] px-1.5 py-0.5 rounded border border-border bg-surface text-secondary inline-block mb-1.5">
          {task.module}
        </span>
      )}
      <div className="h-0.5 bg-[#d4d4d0] dark:bg-border rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${task.progress}%`, background: colour }} />
      </div>
    </>
  )
}
