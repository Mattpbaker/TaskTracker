'use client'
import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { COURSE_START } from '@/lib/constants'
import ProgressPopup from '@/components/task-card/ProgressPopup'
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

/** Wraps matched substring in a <mark> element */
function Highlight({ text, query }: { text: string; query?: string }) {
  if (!query) return <>{text}</>
  const idx = text.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return <>{text}</>
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-yellow-200 dark:bg-yellow-800 rounded-sm px-0.5">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  )
}

export default function WeeklyView({
  tasks,
  taskColourMap,
  accent = '#10b981',
  extra,
  onProgressChange,
  searchQuery,
}: ViewProps) {
  const router = useRouter()
  const pathname = usePathname()
  const todayStr = localDateStr()
  const todayWeek = weekIndex(todayStr)

  const [popup, setPopup] = useState<{
    taskId: string
    progress: number
    rect: DOMRect
  } | null>(null)

  const weeks = Array.from({ length: TOTAL_WEEKS }, (_, i) => ({
    index: i,
    range: weekRange(i),
    tasks: tasks.filter(t => weekIndex(t.dueDate) === i),
  }))

  const handleBadgeClick = (
    e: React.MouseEvent<HTMLButtonElement>,
    taskId: string,
    progress: number
  ) => {
    e.stopPropagation()
    const rect = e.currentTarget.getBoundingClientRect()
    setPopup(prev =>
      prev?.taskId === taskId ? null : { taskId, progress, rect }
    )
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-3 border-b border-border shrink-0">
        <span className="text-[11px] uppercase tracking-widest text-muted font-semibold">Weekly Sprint</span>
        <span className="text-[11px] text-muted">Mar 21 → May 14 · 8 weeks</span>
        {extra}
      </div>

      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <div className="flex h-full gap-2 p-4" style={{ minWidth: `${TOTAL_WEEKS * 220}px` }}>
          {weeks.map(week => {
            const isCurrentWeek = week.index === todayWeek
            const completed = week.tasks.filter(t => t.progress === 100).length
            const pct = week.tasks.length > 0
              ? Math.round((completed / week.tasks.length) * 100)
              : 0

            return (
              <div
                key={week.index}
                className="flex flex-col flex-1 min-w-[200px] rounded-xl border overflow-hidden"
                style={{
                  borderColor: isCurrentWeek ? accent : 'var(--border)',
                  background: isCurrentWeek ? `${accent}08` : 'var(--surface)',
                  boxShadow: isCurrentWeek ? `0 0 20px ${accent}15` : 'none',
                }}
              >
                {/* Week header */}
                <div className="px-3 pt-3 pb-2 border-b border-border shrink-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold text-primary">Week {week.index + 1}</span>
                    {isCurrentWeek && (
                      <span
                        className="text-[9px] px-1.5 py-0.5 rounded-full font-semibold"
                        style={{ background: `${accent}25`, color: accent }}
                      >
                        Now
                      </span>
                    )}
                    <span className="text-[10px] text-muted">{week.tasks.length}</span>
                  </div>
                  <p className="text-[9px] text-muted mb-2">{week.range.label}</p>
                  <div className="h-1 bg-[#d4d4d0] dark:bg-border rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{ width: `${pct}%`, background: accent }}
                    />
                  </div>
                </div>

                {/* Task cards */}
                <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
                  {week.tasks.length === 0 && (
                    <p className="text-[10px] text-muted text-center pt-4">No tasks</p>
                  )}
                  {week.tasks.map(task => {
                    const colour = taskColourMap[task.id] ?? accent
                    const done = task.progress === 100
                    const isOverdue =
                      task.progress < 100 &&
                      task.dueDate < localDateStr()

                    return (
                      <div
                        key={task.id}
                        onClick={() => router.push(`${pathname}?task=${task.id}`)}
                        className="bg-background rounded-lg p-2.5 border border-border hover:shadow-sm transition-shadow cursor-pointer"
                        style={{
                          borderLeftColor: isOverdue ? '#f87171' : colour,
                          borderLeftWidth: '2px',
                        }}
                      >
                        <p
                          className={`text-[11px] font-semibold leading-tight mb-1.5 line-clamp-2 ${
                            done ? 'line-through text-muted' : 'text-primary'
                          }`}
                        >
                          {done && <span className="mr-1">✓</span>}
                          <Highlight text={task.title} query={searchQuery} />
                        </p>

                        <div className="flex items-center gap-1.5">
                          <div
                            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                            style={{ background: colour }}
                          />
                          <span className="text-[9px] text-muted">
                            {new Date(task.dueDate).toLocaleDateString('en-AU', {
                              day: 'numeric', month: 'short',
                            })}
                          </span>
                          {/* Progress bar */}
                          <div className="flex-1 h-1 bg-[#d4d4d0] dark:bg-border rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-200"
                              style={{ width: `${task.progress}%`, background: colour }}
                            />
                          </div>
                          {/* % badge — click to open ProgressPopup */}
                          {onProgressChange ? (
                            <button
                              onClick={e => { e.stopPropagation(); handleBadgeClick(e, task.id, task.progress) }}
                              className={`text-[9px] font-bold px-1 py-0.5 rounded transition-colors hover:bg-surface ${
                                popup?.taskId === task.id
                                  ? 'text-cat-social bg-surface'
                                  : 'text-muted'
                              }`}
                              title="Update progress"
                            >
                              {task.progress}%
                            </button>
                          ) : (
                            <span className="text-[9px] font-bold text-muted">
                              {task.progress}%
                            </span>
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

      {/* Progress popup — portalled, shown over the triggering badge */}
      {popup && onProgressChange && (
        <ProgressPopup
          taskId={popup.taskId}
          currentProgress={popup.progress}
          anchorRect={popup.rect}
          onSelect={onProgressChange}
          onClose={() => setPopup(null)}
        />
      )}
    </div>
  )
}
