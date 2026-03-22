# Toggleable Timeline Views Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add four new timeline view modes (Weekly Sprint, Swimlane/Gantt, Vertical, Calendar) with a view switcher UI, defaulting to Weekly Sprint.

**Architecture:** `DashboardClient` owns a `viewMode` state (persisted in localStorage, default `'weekly'`). Each view is a self-contained client component under `src/components/timeline/views/`. A `ViewSwitcher` button group is rendered in each view's header via an `extra` prop. The existing `Timeline.tsx` (horizontal view) uses `categoryColourMap` keyed by **category ID** — that interface is unchanged. All new view components share a `ViewProps` type defined in `src/components/timeline/views/types.ts`, which uses `taskColourMap` keyed by **task ID**. `DashboardClient` builds both maps from the category-keyed `colourMap` passed by the page.

**Tech Stack:** React client components, Tailwind CSS, TypeScript, `dateToPercent` + `COURSE_START`/`COURSE_END` from `src/lib/timeline.ts` / `src/lib/constants.ts`.

**Reference mockups:** `mockups/timeline-weekly.html`, `mockups/timeline-swimlane.html`, `mockups/timeline-vertical.html`, `mockups/timeline-calendar.html`

---

## Colour Map Key Semantics (Critical)

The existing `colourMap` from `DashboardPage` is keyed by **category ID**. `Timeline.tsx` uses `categoryColourMap[task.categoryId]` — correct.

All new view components use a **task-ID-keyed** map. `DashboardClient` builds this:

```ts
// colourMap prop from DashboardPage: Record<categoryId, colour>
// Build task-keyed map for new views:
const taskColourMap = Object.fromEntries(
  displayTasks.map(t => [
    t.id,
    activeCategory ? accent : (colourMap[t.categoryId ?? ''] ?? '#10b981')
  ])
)
// Keep category-keyed map for Timeline (horizontal view):
const catColourMap = activeCategory
  ? Object.fromEntries(displayTasks.map(t => [t.categoryId ?? '', accent]))
  : colourMap
```

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `src/components/timeline/views/types.ts` | CREATE | Shared `ViewProps` interface for all new views |
| `src/components/timeline/ViewSwitcher.tsx` | CREATE | Toggle buttons for switching views |
| `src/components/timeline/views/WeeklyView.tsx` | CREATE | 8-column weekly sprint board (default) |
| `src/components/timeline/views/SwimlaneView.tsx` | CREATE | Horizontal lanes per category with duration bars |
| `src/components/timeline/views/VerticalView.tsx` | CREATE | Cards alternating left/right on central axis |
| `src/components/timeline/views/CalendarView.tsx` | CREATE | Month grid with tasks as chips on due dates |
| `src/components/timeline/Timeline.tsx` | MODIFY | Accept `extra?: React.ReactNode` in header |
| `src/components/dashboard/DashboardClient.tsx` | MODIFY | Manage `viewMode` state, build colour maps, render correct view |
| `src/app/dashboard/page.tsx` | MODIFY | Pass `categories` prop to `DashboardClient` |

---

## Task 1: Shared types + ViewSwitcher

**Files:**
- Create: `src/components/timeline/views/types.ts`
- Create: `src/components/timeline/ViewSwitcher.tsx`

**`src/components/timeline/views/types.ts`:**
```ts
import type { Task, Category } from '@/types/app'

export interface ViewProps {
  tasks: Task[]
  taskColourMap: Record<string, string>  // task.id → hex colour
  accent?: string
  categories?: Category[]               // needed by SwimlaneView for lane labels
  extra?: React.ReactNode               // ViewSwitcher rendered in each view's header
}
```

**`src/components/timeline/ViewSwitcher.tsx`:**
```tsx
'use client'

export type ViewMode = 'weekly' | 'horizontal' | 'swimlane' | 'vertical' | 'calendar'

const VIEWS: { mode: ViewMode; label: string; icon: string }[] = [
  { mode: 'weekly',     label: 'Weekly',   icon: '⊞' },
  { mode: 'horizontal', label: 'Timeline', icon: '⟶' },
  { mode: 'swimlane',   label: 'Swimlane', icon: '⊟' },
  { mode: 'vertical',   label: 'Vertical', icon: '⇕' },
  { mode: 'calendar',   label: 'Calendar', icon: '▦' },
]

export default function ViewSwitcher({
  current,
  onChange,
}: {
  current: ViewMode
  onChange: (v: ViewMode) => void
}) {
  return (
    <div className="flex items-center gap-0.5 ml-auto bg-surface border border-border rounded-lg p-0.5">
      {VIEWS.map(v => (
        <button
          key={v.mode}
          onClick={() => onChange(v.mode)}
          title={v.label}
          className={`flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-medium transition-all ${
            current === v.mode
              ? 'bg-emerald-950 text-emerald-300 border border-emerald-900'
              : 'text-emerald-900 hover:text-emerald-700 hover:bg-emerald-950/30 border border-transparent'
          }`}
        >
          <span>{v.icon}</span>
          <span className="hidden sm:inline">{v.label}</span>
        </button>
      ))}
    </div>
  )
}
```

- [ ] Create `src/components/timeline/views/types.ts`
- [ ] Create `src/components/timeline/ViewSwitcher.tsx`
- [ ] Commit: `git commit -m "feat: add ViewProps type and ViewSwitcher component"`

---

## Task 2: Add `extra` prop to Timeline.tsx

**Files:**
- Modify: `src/components/timeline/Timeline.tsx`

Add `extra?: React.ReactNode` to the `Props` interface. Render it in the header row after `ZoomControls`:

```tsx
interface Props {
  tasks?: Task[]
  categoryColourMap?: Record<string, string>
  accent?: string
  title?: string
  extra?: React.ReactNode  // ← add
}

// In the header div, after <ZoomControls .../>:
{extra}
```

- [ ] Add `extra` to Props and render in header
- [ ] Commit: `git commit -m "feat: add extra slot to Timeline header"`

---

## Task 3: WeeklyView

**Files:**
- Create: `src/components/timeline/views/WeeklyView.tsx`

```tsx
'use client'
import { COURSE_START } from '@/lib/constants'
import type { ViewProps } from './types'
import type { Task } from '@/types/app'

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
  return { start, end, label: `${fmt(start)} – ${fmt(end)}` }
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
```

- [ ] Create `src/components/timeline/views/WeeklyView.tsx`
- [ ] Commit: `git commit -m "feat: add WeeklyView component"`

---

## Task 4: SwimlaneView

**Files:**
- Create: `src/components/timeline/views/SwimlaneView.tsx`

One horizontal lane per category present in `tasks`. Task bars span `startDate → dueDate` (fallback start: `dueDate` itself for zero-width dot). Category names from `categories` prop.

```tsx
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
              const catName = categories.find(c => c.id === catId)?.name ?? catId
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
```

- [ ] Create `src/components/timeline/views/SwimlaneView.tsx`
- [ ] Commit: `git commit -m "feat: add SwimlaneView component"`

---

## Task 5: VerticalView

**Files:**
- Create: `src/components/timeline/views/VerticalView.tsx`

Cards alternate left/right on a central axis. Month headers separate sections. A "Today" marker appears before the first upcoming task. Pre-compute it outside the map to avoid O(n²).

```tsx
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
  // First task that is due today or later — insert "Today" marker before it
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
                    <div className="bg-surface border border-border rounded-lg p-3 hover:border-opacity-100 transition-all"
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
```

- [ ] Create `src/components/timeline/views/VerticalView.tsx`
- [ ] Commit: `git commit -m "feat: add VerticalView component"`

---

## Task 6: CalendarView

**Files:**
- Create: `src/components/timeline/views/CalendarView.tsx`

Three month grids (March, April, May 2026). Tasks as chips on their `dueDate`. Derived from `COURSE_START`/`COURSE_END` constants.

```tsx
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
  const startPad = (first.getDay() + 6) % 7 // Mon=0
  const days: (Date | null)[] = Array(startPad).fill(null)
  for (let d = 1; d <= last.getDate(); d++) days.push(new Date(year, month, d))
  while (days.length % 7 !== 0) days.push(null)
  return days
}

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function localDateStr(): string {
  const d = new Date()
  return toDateStr(d)
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
```

- [ ] Create `src/components/timeline/views/CalendarView.tsx`
- [ ] Commit: `git commit -m "feat: add CalendarView component"`

---

## Task 7: Wire up DashboardClient + DashboardPage

**Files:**
- Modify: `src/components/dashboard/DashboardClient.tsx`
- Modify: `src/app/dashboard/page.tsx`

**`DashboardClient.tsx`** — add `viewMode` state, build both colour maps, render selected view:

```tsx
'use client'
import { useCategoryContext } from '@/context/CategoryContext'
import { computeCategoryInsights } from '@/lib/stats'
import { CATEGORY_COLOURS } from '@/lib/constants'
import { useState, useEffect } from 'react'
import ViewSwitcher, { type ViewMode } from '@/components/timeline/ViewSwitcher'
import Timeline from '@/components/timeline/Timeline'
import WeeklyView from '@/components/timeline/views/WeeklyView'
import SwimlaneView from '@/components/timeline/views/SwimlaneView'
import VerticalView from '@/components/timeline/views/VerticalView'
import CalendarView from '@/components/timeline/views/CalendarView'
import CategoryHeader from '@/components/category/CategoryHeader'
import CategoryProgressBar from '@/components/category/CategoryProgressBar'
import CategoryInsightCards from '@/components/category/CategoryInsightCards'
import type { Task, Category } from '@/types/app'

const STORAGE_KEY = 'tt-view-mode'

export default function DashboardClient({
  tasks,
  colourMap,  // keyed by category ID — from DashboardPage
  categories,
}: {
  tasks: Task[]
  colourMap: Record<string, string>
  categories: Category[]
}) {
  const { activeCategory } = useCategoryContext()
  const [viewMode, setViewMode] = useState<ViewMode>('weekly')

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as ViewMode | null
    if (saved) setViewMode(saved)
  }, [])

  const handleViewChange = (v: ViewMode) => {
    setViewMode(v)
    localStorage.setItem(STORAGE_KEY, v)
  }

  const displayTasks = activeCategory
    ? tasks.filter(t => t.categoryId === activeCategory.id)
    : tasks

  const accent = activeCategory
    ? (CATEGORY_COLOURS[activeCategory.slug] ?? activeCategory.colour)
    : '#10b981'

  // Task-ID-keyed map for new views
  const taskColourMap: Record<string, string> = Object.fromEntries(
    displayTasks.map(t => [
      t.id,
      activeCategory ? accent : (colourMap[t.categoryId ?? ''] ?? '#10b981'),
    ])
  )

  // Category-ID-keyed map for existing Timeline component
  const catColourMap: Record<string, string> = activeCategory
    ? Object.fromEntries(displayTasks.map(t => [t.categoryId ?? '', accent]))
    : colourMap

  const switcher = <ViewSwitcher current={viewMode} onChange={handleViewChange} />

  return (
    <>
      {activeCategory && (() => {
        const insights = computeCategoryInsights(displayTasks)
        return (
          <>
            <CategoryHeader category={activeCategory} taskCount={displayTasks.length} finalDueDate={insights.finalDueDate} />
            <CategoryProgressBar progress={insights.overallProgress} colour={accent} />
            <CategoryInsightCards insights={insights} colour={accent} />
          </>
        )
      })()}
      {viewMode === 'weekly'     && <WeeklyView  tasks={displayTasks} taskColourMap={taskColourMap} accent={accent} extra={switcher} />}
      {viewMode === 'horizontal' && <Timeline    tasks={displayTasks} categoryColourMap={catColourMap} accent={accent} extra={switcher} />}
      {viewMode === 'swimlane'   && <SwimlaneView tasks={displayTasks} taskColourMap={taskColourMap} accent={accent} extra={switcher} categories={categories} />}
      {viewMode === 'vertical'   && <VerticalView tasks={displayTasks} taskColourMap={taskColourMap} accent={accent} extra={switcher} />}
      {viewMode === 'calendar'   && <CalendarView tasks={displayTasks} taskColourMap={taskColourMap} accent={accent} extra={switcher} />}
    </>
  )
}
```

**`DashboardPage`** — pass `categories`:
```tsx
<DashboardClient tasks={tasks} colourMap={colourMap} categories={categories} />
```

- [ ] Update `DashboardClient.tsx`
- [ ] Update `DashboardPage` to pass `categories`
- [ ] Commit: `git commit -m "feat: wire up toggleable views in DashboardClient"`

---

## Verification

- [ ] `npm run dev` — default view is Weekly Sprint (or last saved)
- [ ] Click each view switcher button — instant switch, no page reload
- [ ] Reload — view mode restored from localStorage
- [ ] Select a category — all views show only that category's tasks; category header/progress/insights visible above
- [ ] Switch back to All Tasks — full task set shown
- [ ] Build passes: `npm run build`
