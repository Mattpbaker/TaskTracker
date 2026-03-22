'use client'
import { formatDueDate } from '@/lib/date-utils'
import type { ViewProps } from './types'

function localDateStr(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const MONTH_LABELS: Record<string, string> = {
  '2026-03': 'March 2026',
  '2026-04': 'April 2026',
  '2026-05': 'May 2026',
}

export default function VerticalView({ tasks, taskColourMap, accent = '#10b981', extra }: ViewProps) {
  const sorted = [...tasks].sort((a, b) => a.dueDate.localeCompare(b.dueDate))
  const todayStr = localDateStr()
  const firstUpcomingId = sorted.find(t => t.dueDate >= todayStr)?.id ?? null

  let lastMonth = ''
  let cardIndex = 0

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-3 border-b border-border shrink-0">
        <span className="text-[11px] uppercase tracking-widest text-emerald-900 font-semibold">Vertical Timeline</span>
        {extra}
      </div>
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="relative max-w-3xl mx-auto">
          <div className="absolute left-1/2 top-0 bottom-0 w-px -translate-x-1/2"
            style={{ background: `linear-gradient(to bottom, transparent, ${accent} 5%, ${accent} 95%, transparent)` }} />

          {sorted.map(task => {
            const colour = taskColourMap[task.id] ?? accent
            const month = task.dueDate.slice(0, 7)
            const showMonthHeader = month !== lastMonth
            lastMonth = month
            const isLeft = cardIndex % 2 === 0
            const isPast = task.dueDate < todayStr
            const isDone = task.progress === 100
            const showTodayMarker = task.id === firstUpcomingId
            cardIndex++

            return (
              <div key={task.id}>
                {showMonthHeader && (
                  <div className="relative flex justify-center my-6">
                    <span className="relative z-10 px-4 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full border"
                      style={{ color: accent, borderColor: `${accent}40`, background: '#0a0f0a' }}>
                      {MONTH_LABELS[month] ?? month}
                    </span>
                  </div>
                )}
                {showTodayMarker && (
                  <div className="relative flex items-center justify-center my-4">
                    <div className="absolute inset-x-0 h-px" style={{ background: `${accent}30` }} />
                    <span className="relative z-10 px-3 py-0.5 text-[9px] font-bold uppercase tracking-widest rounded"
                      style={{ background: `${accent}20`, color: accent, border: `1px solid ${accent}40` }}>
                      Today
                    </span>
                  </div>
                )}
                <div className={`relative flex items-center mb-6 ${isLeft ? 'flex-row' : 'flex-row-reverse'}`}>
                  <div className={`w-[calc(50%-24px)] ${isLeft ? 'pr-4' : 'pl-4'}`}
                    style={{ opacity: isPast ? 0.65 : 1 }}>
                    <div className="bg-surface border border-border rounded-lg p-3 transition-all"
                      style={{ borderColor: `${colour}40` }}>
                      <div className="flex items-center gap-1.5 mb-1">
                        <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: colour }} />
                        <span className={`text-[11px] font-semibold leading-tight line-clamp-2 ${isDone ? 'line-through text-emerald-950' : 'text-emerald-100'}`}>
                          {isDone && '✓ '}{task.title}
                        </span>
                      </div>
                      <p className="text-[10px] text-emerald-900 mb-1.5">{formatDueDate(task.dueDate, task.dueTime)}</p>
                      {task.module && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-300 inline-block mb-1.5">
                          {task.module}
                        </span>
                      )}
                      <div className="h-0.5 bg-border rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${task.progress}%`, background: colour }} />
                      </div>
                    </div>
                  </div>
                  <div className="w-12 flex justify-center shrink-0 z-10">
                    <div className="w-3 h-3 rounded-full border-2" style={{
                      background: '#0a0f0a', borderColor: colour, boxShadow: `0 0 8px ${colour}66`,
                    }} />
                  </div>
                  <div className="w-[calc(50%-24px)]" />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
