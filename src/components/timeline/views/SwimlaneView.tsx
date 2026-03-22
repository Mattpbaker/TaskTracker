'use client'
import { dateToPercent } from '@/lib/timeline'
import type { ViewProps } from './types'

const TICK_DATES = ['2026-03-21', '2026-04-07', '2026-04-24', '2026-05-09', '2026-05-14']

function localDateStr(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function SwimlaneView({ tasks, taskColourMap, accent = '#10b981', categories = [], extra }: ViewProps) {
  const todayPct = dateToPercent(localDateStr())
  const catIds = [...new Set(tasks.map(t => t.categoryId).filter(Boolean))] as string[]

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-3 border-b border-border shrink-0">
        <span className="text-[11px] uppercase tracking-widest text-emerald-900 font-semibold">Swimlane</span>
        <span className="text-[11px] text-emerald-950">Mar 21 → May 14 · 55 days</span>
        {extra}
      </div>
      <div className="flex-1 overflow-x-auto overflow-y-auto">
        <div className="flex" style={{ minWidth: '900px' }}>
          {/* Category label column */}
          <div className="w-36 shrink-0 border-r border-border">
            <div className="h-8 border-b border-border" />
            {catIds.map(catId => {
              const repTask = tasks.find(t => t.categoryId === catId)
              const catColour = repTask ? (taskColourMap[repTask.id] ?? accent) : accent
              const catName = categories.find(c => c.id === catId)?.name ?? 'Unknown'
              return (
                <div key={catId} className="h-16 flex items-center gap-2 px-3 border-b border-border">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ background: catColour }} />
                  <span className="text-[10px] text-emerald-800 leading-tight line-clamp-2">{catName}</span>
                </div>
              )
            })}
          </div>
          {/* Timeline area */}
          <div className="flex-1 relative">
            {/* Date header */}
            <div className="h-8 border-b border-border relative">
              {TICK_DATES.map(d => (
                <div key={d} className="absolute top-0 h-full flex items-end pb-1"
                  style={{ left: `${dateToPercent(d)}%`, transform: 'translateX(-50%)' }}>
                  <span className="text-[9px] text-emerald-950 whitespace-nowrap">
                    {new Date(d).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
              ))}
              <div className="absolute top-0 h-full w-px pointer-events-none"
                style={{ left: `${todayPct}%`, background: `${accent}60` }} />
            </div>
            {/* Lanes */}
            {catIds.map((catId, laneIdx) => {
              const laneTasks = tasks.filter(t => t.categoryId === catId)
              return (
                <div key={catId} className="relative h-16 border-b border-border"
                  style={{ background: laneIdx % 2 === 0 ? 'transparent' : '#0d150d' }}>
                  <div className="absolute top-0 h-full w-px pointer-events-none"
                    style={{ left: `${todayPct}%`, background: `${accent}30` }} />
                  {laneTasks.map(task => {
                    const colour = taskColourMap[task.id] ?? accent
                    const startPct = dateToPercent(task.startDate ?? task.dueDate)
                    const endPct = dateToPercent(task.dueDate)
                    const widthPct = Math.max(endPct - startPct, 1.5)
                    return (
                      <div key={task.id}
                        className="absolute top-3 h-10 rounded flex items-center px-2 overflow-hidden cursor-pointer"
                        title={`${task.title} — ${task.progress}%`}
                        style={{
                          left: `${startPct}%`,
                          width: `${widthPct}%`,
                          background: `${colour}22`,
                          border: `1px solid ${colour}66`,
                          boxShadow: `0 0 8px ${colour}33`,
                        }}>
                        <div className="absolute inset-0 rounded" style={{ width: `${task.progress}%`, background: `${colour}33` }} />
                        <span className="relative text-[9px] font-medium truncate" style={{ color: colour }}>
                          {task.title}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
