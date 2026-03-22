'use client'
import { COURSE_START } from '@/lib/constants'
import type { ViewProps } from './types'

const MS_PER_DAY = 86_400_000
const TOTAL_WEEKS = 8

function localDateStr(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function weekIndex(dueDate: string): number {
  const diff = Math.floor(
    (new Date(dueDate).getTime() - COURSE_START.getTime()) / MS_PER_DAY
  )
  return Math.min(TOTAL_WEEKS - 1, Math.max(0, Math.floor(diff / 7)))
}

function weekRange(i: number) {
  const start = new Date(COURSE_START.getTime() + i * 7 * MS_PER_DAY)
  const end = new Date(start.getTime() + 6 * MS_PER_DAY)
  const fmt = (d: Date) => d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })
  return { label: `${fmt(start)} – ${fmt(end)}` }
}

export default function WeeklyView({ tasks, taskColourMap, accent = '#10b981', extra }: ViewProps) {
  const todayStr = localDateStr()
  const todayWeek = weekIndex(todayStr)

  const weeks = Array.from({ length: TOTAL_WEEKS }, (_, i) => ({
    index: i,
    range: weekRange(i),
    tasks: tasks.filter(t => weekIndex(t.dueDate) === i),
  }))

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-3 border-b border-border shrink-0">
        <span className="text-[11px] uppercase tracking-widest text-emerald-900 font-semibold">Weekly Sprint</span>
        <span className="text-[11px] text-emerald-950">Mar 21 → May 14 · 8 weeks</span>
        {extra}
      </div>
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <div className="flex h-full gap-2 p-4" style={{ minWidth: `${TOTAL_WEEKS * 220}px` }}>
          {weeks.map(week => {
            const isCurrentWeek = week.index === todayWeek
            const completed = week.tasks.filter(t => t.progress === 100).length
            const pct = week.tasks.length > 0 ? Math.round((completed / week.tasks.length) * 100) : 0
            return (
              <div
                key={week.index}
                className="flex flex-col flex-1 min-w-[200px] rounded-xl border overflow-hidden"
                style={{
                  borderColor: isCurrentWeek ? accent : '#1a2e1a',
                  background: isCurrentWeek ? `${accent}08` : '#0f1a0f',
                  boxShadow: isCurrentWeek ? `0 0 20px ${accent}18` : 'none',
                }}
              >
                <div className="px-3 pt-3 pb-2 border-b border-border shrink-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold text-emerald-300">Week {week.index + 1}</span>
                    {isCurrentWeek && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full font-semibold"
                        style={{ background: `${accent}25`, color: accent }}>Now</span>
                    )}
                    <span className="text-[10px] text-emerald-950">{week.tasks.length}</span>
                  </div>
                  <p className="text-[9px] text-emerald-950 mb-2">{week.range.label}</p>
                  <div className="h-0.5 bg-border rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: accent }} />
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
                  {week.tasks.length === 0 && (
                    <p className="text-[10px] text-emerald-950 text-center pt-4">No tasks</p>
                  )}
                  {week.tasks.map(task => {
                    const colour = taskColourMap[task.id] ?? accent
                    const done = task.progress === 100
                    return (
                      <div
                        key={task.id}
                        className="bg-background rounded-lg p-2.5 border border-border"
                        style={{ borderLeftColor: colour, borderLeftWidth: '3px' }}
                      >
                        <p className={`text-[11px] font-semibold leading-tight mb-1 line-clamp-2 ${done ? 'line-through text-emerald-950' : 'text-emerald-100'}`}>
                          {done && <span className="mr-1">✓</span>}{task.title}
                        </p>
                        <div className="flex items-center gap-1 mb-1.5">
                          <div className="w-1.5 h-1.5 rounded-full" style={{ background: colour }} />
                          <span className="text-[9px] text-emerald-900">
                            Due {new Date(task.dueDate).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}
                          </span>
                        </div>
                        <div className="h-0.5 bg-border rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${task.progress}%`, background: colour }} />
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
    </div>
  )
}
