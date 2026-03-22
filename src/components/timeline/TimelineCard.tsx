'use client'
import { useRouter, usePathname } from 'next/navigation'
import type { Task } from '@/types/app'
import TimelineStem from './TimelineStem'
import { formatDueDate } from '@/lib/date-utils'
import { dateToPercent } from './TimelineAxis'

interface Props {
  task: Task
  position: 'above' | 'below'
  colour: string
}

export default function TimelineCard({ task, position, colour }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const pct = dateToPercent(task.dueDate)

  const open = () => router.push(`${pathname}?task=${task.id}`)

  return (
    <div
      className={`absolute -translate-x-1/2 flex flex-col items-center cursor-pointer group z-10 ${
        position === 'above' ? 'bottom-[calc(50%+1px)]' : 'top-[calc(50%+1px)]'
      }`}
      style={{ left: `${pct}%` }}
    >
      {/* Dot on axis */}
      <div
        className="absolute w-2.5 h-2.5 rounded-full border-2 z-20"
        style={{
          background: '#0a0f0a',
          borderColor: colour,
          boxShadow: `0 0 6px ${colour}66`,
          [position === 'above' ? 'bottom' : 'top']: '-6px',
        }}
      />
      {/* Card + stem */}
      {position === 'above' ? (
        <>
          <div
            className="mb-1 bg-surface border border-border rounded-lg p-2.5 w-36 shadow-lg transition-all"
            onMouseEnter={e => (e.currentTarget.style.borderColor = colour)}
            onMouseLeave={e => (e.currentTarget.style.borderColor = '')}
            onClick={open}
          >
            <CardContent task={task} colour={colour} />
          </div>
          <TimelineStem position="above" colour={colour} />
        </>
      ) : (
        <>
          <TimelineStem position="below" colour={colour} />
          <div
            className="mt-1 bg-surface border border-border rounded-lg p-2.5 w-36 shadow-lg"
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
        <span className="text-[11px] font-semibold text-emerald-100 leading-tight line-clamp-2">{task.title}</span>
      </div>
      <p className="text-[10px] text-zinc-600 mb-1.5">{formatDueDate(task.dueDate, task.dueTime)}</p>
      {task.module && (
        <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-300 inline-block mb-1.5">
          {task.module}
        </span>
      )}
      <div className="h-0.5 bg-border rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${task.progress}%`, background: colour }} />
      </div>
    </>
  )
}
