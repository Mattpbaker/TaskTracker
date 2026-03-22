import { formatDueDate, timeRemainingLabel } from '@/lib/date-utils'

interface Props {
  startDate: string | null
  dueDate: string
  dueTime: string | null
}

const URGENCY_STYLES = {
  normal: 'border-border text-emerald-400',
  amber:  'border-amber-900 text-amber-400 bg-amber-950',
  red:    'border-red-900 text-red-400 bg-red-950',
}

export default function TaskPanelDates({ startDate, dueDate, dueTime }: Props) {
  const { label, urgency } = timeRemainingLabel(dueDate)
  return (
    <div className="px-5 py-4 border-b border-border">
      <p className="text-[10px] uppercase tracking-widest text-emerald-950 font-semibold mb-3">Dates</p>
      <div className="flex gap-2.5">
        {startDate && (
          <div className="flex-1 bg-surface border border-border rounded-lg p-2.5">
            <p className="text-[9px] text-emerald-950 uppercase tracking-wide mb-1">Start</p>
            <p className="text-sm font-semibold text-emerald-300">{formatDueDate(startDate)}</p>
          </div>
        )}
        <div className="flex-1 bg-surface border border-border rounded-lg p-2.5">
          <p className="text-[9px] text-emerald-950 uppercase tracking-wide mb-1">Due</p>
          <p className="text-sm font-semibold text-emerald-300">{formatDueDate(dueDate, dueTime)}</p>
        </div>
        <div className={`flex-1 border rounded-lg p-2.5 ${URGENCY_STYLES[urgency]}`}>
          <p className="text-[9px] uppercase tracking-wide mb-1 opacity-70">Time left</p>
          <p className="text-sm font-semibold">{label}</p>
        </div>
      </div>
    </div>
  )
}
