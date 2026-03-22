'use client'
import { COURSE_START, COURSE_END } from '@/lib/constants'
import type { ViewProps } from './types'
import type { Task } from '@/types/app'

const MONTHS = [
  { year: 2026, month: 2, name: 'March 2026' },
  { year: 2026, month: 3, name: 'April 2026' },
  { year: 2026, month: 4, name: 'May 2026' },
]
const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function calendarDays(year: number, month: number): (Date | null)[] {
  const first = new Date(year, month, 1)
  const last = new Date(year, month + 1, 0)
  const startPad = (first.getDay() + 6) % 7 // Mon = 0
  const days: (Date | null)[] = Array(startPad).fill(null)
  for (let d = 1; d <= last.getDate(); d++) days.push(new Date(year, month, d))
  while (days.length % 7 !== 0) days.push(null)
  return days
}

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function localDateStr(): string {
  return toDateStr(new Date())
}

export default function CalendarView({ tasks, taskColourMap, accent = '#10b981', extra }: ViewProps) {
  const todayStr = localDateStr()
  const courseStartStr = toDateStr(COURSE_START)
  const courseEndStr = toDateStr(COURSE_END)

  const tasksByDate = tasks.reduce<Record<string, Task[]>>((acc, t) => {
    acc[t.dueDate] = [...(acc[t.dueDate] ?? []), t]
    return acc
  }, {})

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-3 border-b border-border shrink-0">
        <span className="text-[11px] uppercase tracking-widest text-emerald-900 font-semibold">Calendar</span>
        <span className="text-[11px] text-emerald-950">Mar 21 → May 14 2026</span>
        {extra}
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {MONTHS.map(({ year, month, name }) => {
          const days = calendarDays(year, month)
          return (
            <div key={name} className="bg-surface rounded-xl border border-border overflow-hidden">
              <div className="px-4 py-3 border-b border-border">
                <h3 className="text-sm font-bold text-emerald-200">{name}</h3>
              </div>
              <div className="grid grid-cols-7">
                {DAY_LABELS.map(d => (
                  <div key={d} className="px-2 py-1.5 text-[9px] text-emerald-950 text-center uppercase tracking-wide border-b border-border">
                    {d}
                  </div>
                ))}
                {days.map((date, i) => {
                  if (!date) return (
                    <div key={`empty-${i}`} className="min-h-[72px] border-b border-r border-border bg-background/40" />
                  )
                  const ds = toDateStr(date)
                  const isToday = ds === todayStr
                  const isOutOfRange = ds < courseStartStr || ds > courseEndStr
                  const dayTasks = tasksByDate[ds] ?? []
                  const shown = dayTasks.slice(0, 2)
                  const overflow = dayTasks.length - shown.length

                  return (
                    <div key={ds} className={`min-h-[72px] p-1.5 border-b border-r border-border flex flex-col ${isOutOfRange ? 'opacity-30' : ''}`}>
                      <div className="flex justify-end mb-1">
                        <span className={`text-[10px] font-medium w-5 h-5 flex items-center justify-center rounded-full ${isToday ? 'text-background font-bold' : 'text-emerald-800'}`}
                          style={isToday ? { background: accent } : {}}>
                          {date.getDate()}
                        </span>
                      </div>
                      <div className="space-y-0.5 flex-1">
                        {shown.map(task => {
                          const colour = taskColourMap[task.id] ?? accent
                          return (
                            <div key={task.id} className="flex items-center gap-1 px-1 py-0.5 rounded text-[9px] truncate"
                              style={{ background: `${colour}18`, borderLeft: `2px solid ${colour}` }}>
                              <span className="truncate" style={{ color: colour }}>{task.title}</span>
                            </div>
                          )
                        })}
                        {overflow > 0 && (
                          <span className="text-[9px] text-emerald-950 pl-1">+{overflow} more</span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
