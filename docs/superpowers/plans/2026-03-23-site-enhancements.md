# Site Enhancements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enhance the Tasktracker app with light/adaptive theming, Geist font, search, inline progress updates, skeleton loaders, and a quick-add task modal.

**Architecture:** CSS variables back all theme tokens; a `SearchContext` and `TaskModalContext` bridge client state across server component subtrees; `useOptimistic` + `startTransition` makes inline progress feel instant; `React.cache` deduplicates the Supabase fetch across `layout.tsx` and `page.tsx` to enable `loading.tsx`.

**Tech Stack:** Next.js 16 App Router, React 19 (`useOptimistic`, `startTransition`), Tailwind CSS 3 (CSS variable tokens), Supabase, `next/font/google` (Geist), `createPortal` (popups/modals)

---

## Task 1: CSS Variable Theming Foundation

**Files:**
- Modify: `src/app/globals.css`
- Modify: `tailwind.config.ts`

> Establishes the light/dark token system. All other tasks depend on these variables being in place. Do this first so every subsequent visual change compiles correctly.

- [ ] **Step 1: Replace `globals.css`**

```css
/* src/app/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --background: #ffffff;
  --surface:    #fafaf9;
  --border:     #e8e8e5;
  --text-primary:   #111111;
  --text-secondary: #555555;
  --text-muted:     #aaaaaa;
}

.dark {
  --background: #0a0f0a;
  --surface:    #0f1a0f;
  --border:     #1a2e1a;
  --text-primary:   #d1fae5;
  --text-secondary: #86a892;
  --text-muted:     #4b7a5a;
}

body {
  background-color: var(--background);
  color: var(--text-primary);
}

* { box-sizing: border-box; }

::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: var(--surface); }
::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }

@keyframes slide-in-from-right {
  from { transform: translateX(100%); opacity: 0; }
  to   { transform: translateX(0);    opacity: 1; }
}
.animate-in { animation: slide-in-from-right 200ms ease-out; }
```

- [ ] **Step 2: Update `tailwind.config.ts`**

```typescript
import type { Config } from 'tailwindcss'
import defaultTheme from 'tailwindcss/defaultTheme'

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-geist)', ...defaultTheme.fontFamily.sans],
      },
      colors: {
        'cat-social':   '#10b981',
        'cat-recog':    '#6366f1',
        'cat-tracking': '#14b8a6',
        'cat-training': '#ec4899',
        'cat-report':   '#f59e0b',
        'cat-video':    '#a3e635',
        'cat-working':  '#8b5cf6',
        background: 'var(--background)',
        surface:    'var(--surface)',
        border:     'var(--border)',
        primary:    'var(--text-primary)',
        secondary:  'var(--text-secondary)',
        muted:      'var(--text-muted)',
      },
    },
  },
  plugins: [],
}
export default config
```

- [ ] **Step 3: Start dev server and verify the app still loads**

```bash
npm run dev
```

Expected: App loads at `http://localhost:3000`. It will look broken (light backgrounds, black text visible) — that's expected; theming is incomplete until Task 2.

- [ ] **Step 4: Commit**

```bash
git add src/app/globals.css tailwind.config.ts
git commit -m "feat: css variable theming foundation with light/dark tokens"
```

---

## Task 2: Geist Font + Theme Flash Prevention Script

**Files:**
- Modify: `src/app/layout.tsx`

> Adds Geist font via CSS variable so Tailwind's `font-sans` picks it up. The inline script sets `.dark` before first paint to prevent flash on reload.

- [ ] **Step 1: Replace `src/app/layout.tsx`**

```typescript
import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' })

// Runs synchronously before first paint — reads localStorage or system preference
const themeScript = `(function(){try{var t=localStorage.getItem('tt-theme');if(!t){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}if(t==='dark')document.documentElement.classList.add('dark');}catch(e){}})();`

export const metadata: Metadata = {
  title: 'TaskTracker',
  description: 'University task tracker',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={geist.variable}>
      {/* dangerouslySetInnerHTML script must be direct child of <html>, before <body>,
          with NO async/defer — it must run synchronously before paint */}
      <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      <body>{children}</body>
    </html>
  )
}
```

- [ ] **Step 2: Run dev server and verify font loads**

```bash
npm run dev
```

Open devtools → Elements → select any text → Computed → `font-family` should include `Geist`.

- [ ] **Step 3: Commit**

```bash
git add src/app/layout.tsx
git commit -m "feat: geist font and theme flash prevention script"
```

---

## Task 3: ThemeToggle Component

**Files:**
- Create: `src/components/layout/ThemeToggle.tsx`
- Modify: `src/components/layout/TopBar.tsx`

> A client component that toggles `.dark` on `<html>` and persists the choice to `localStorage`. Placed in the TopBar alongside the existing date and days badge.

- [ ] **Step 1: Create `src/components/layout/ThemeToggle.tsx`**

```typescript
'use client'
import { useEffect, useState } from 'react'

export default function ThemeToggle() {
  const [dark, setDark] = useState(false)

  // Sync initial state from the class already set by the inline script
  useEffect(() => {
    setDark(document.documentElement.classList.contains('dark'))
  }, [])

  const toggle = () => {
    const next = !dark
    setDark(next)
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem('tt-theme', next ? 'dark' : 'light')
  }

  return (
    <button
      onClick={toggle}
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="text-[13px] px-2 py-1 rounded border border-border text-muted hover:text-primary hover:border-secondary transition-colors"
    >
      {dark ? '☀' : '☾'}
    </button>
  )
}
```

- [ ] **Step 2: Update `src/components/layout/TopBar.tsx`**

Replace `text-emerald-100` and `text-zinc-600` with CSS variable tokens, and add ThemeToggle:

```typescript
import DaysRemainingBadge from './DaysRemainingBadge'
import ThemeToggle from './ThemeToggle'

export default function TopBar() {
  const today = new Date().toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
  return (
    <header className="flex items-center gap-3 px-5 py-3 bg-surface border-b border-border flex-shrink-0">
      <div className="w-2.5 h-2.5 rounded-full bg-cat-social shadow-[0_0_8px_#10b981]" />
      <span className="font-bold text-primary tracking-tight">TaskTracker</span>
      <div className="ml-auto flex items-center gap-3">
        <span className="text-xs text-muted border border-border rounded px-2 py-1">{today}</span>
        <DaysRemainingBadge />
        <ThemeToggle />
      </div>
    </header>
  )
}
```

- [ ] **Step 3: Verify toggle works**

Load `http://localhost:3000/dashboard`. Click ☾/☀ button — page should switch between light and dark. Reload — mode should persist without flash.

- [ ] **Step 4: Commit**

```bash
git add src/components/layout/ThemeToggle.tsx src/components/layout/TopBar.tsx
git commit -m "feat: theme toggle in topbar with localStorage persistence"
```

---

## Task 4: SearchContext + SearchInput Component

**Files:**
- Create: `src/context/SearchContext.tsx`
- Create: `src/components/layout/SearchInput.tsx`
- Modify: `src/components/layout/TopBar.tsx`

> `SearchContext` is a client context (mirrors `CategoryContext`) so both `TopBar`'s input and `DashboardClient`'s filter can share the query without prop drilling through server components.

- [ ] **Step 1: Create `src/context/SearchContext.tsx`**

```typescript
'use client'
import { createContext, useContext, useState } from 'react'

interface SearchContextValue {
  searchQuery: string
  setSearchQuery: (q: string) => void
}

const SearchContext = createContext<SearchContextValue>({
  searchQuery: '',
  setSearchQuery: () => {},
})

export function SearchProvider({ children }: { children: React.ReactNode }) {
  const [searchQuery, setSearchQuery] = useState('')
  return (
    <SearchContext.Provider value={{ searchQuery, setSearchQuery }}>
      {children}
    </SearchContext.Provider>
  )
}

export function useSearchContext() {
  return useContext(SearchContext)
}
```

- [ ] **Step 2: Create `src/components/layout/SearchInput.tsx`**

```typescript
'use client'
import { useSearchContext } from '@/context/SearchContext'
import { useEffect } from 'react'

export default function SearchInput() {
  const { searchQuery, setSearchQuery } = useSearchContext()

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSearchQuery('')
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [setSearchQuery])

  return (
    <div className="relative flex items-center flex-1 max-w-[260px]">
      <svg
        className="absolute left-2.5 text-muted pointer-events-none"
        width="12" height="12" fill="none" stroke="currentColor" strokeWidth={2}
        viewBox="0 0 24 24"
      >
        <circle cx={11} cy={11} r={8} />
        <path d="m21 21-4.35-4.35" />
      </svg>
      <input
        value={searchQuery}
        onChange={e => setSearchQuery(e.target.value)}
        placeholder="Search tasks..."
        className="w-full pl-7 pr-6 py-1.5 text-[12px] bg-surface border border-border rounded-lg text-primary placeholder:text-muted focus:outline-none focus:border-cat-social focus:ring-1 focus:ring-cat-social/20 transition-colors"
      />
      {searchQuery && (
        <button
          onClick={() => setSearchQuery('')}
          aria-label="Clear search"
          className="absolute right-2 text-[10px] text-muted hover:text-primary transition-colors"
        >
          ✕
        </button>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Add `SearchInput` to `src/components/layout/TopBar.tsx`**

```typescript
import DaysRemainingBadge from './DaysRemainingBadge'
import ThemeToggle from './ThemeToggle'
import SearchInput from './SearchInput'

export default function TopBar() {
  const today = new Date().toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
  return (
    <header className="flex items-center gap-3 px-5 py-3 bg-surface border-b border-border flex-shrink-0">
      <div className="w-2.5 h-2.5 rounded-full bg-cat-social shadow-[0_0_8px_#10b981]" />
      <span className="font-bold text-primary tracking-tight">TaskTracker</span>
      <SearchInput />
      <div className="ml-auto flex items-center gap-3">
        <span className="text-xs text-muted border border-border rounded px-2 py-1">{today}</span>
        <DaysRemainingBadge />
        <ThemeToggle />
      </div>
    </header>
  )
}
```

Note: `SearchProvider` is added to `AppShell` in Task 8.

- [ ] **Step 4: Commit**

```bash
git add src/context/SearchContext.tsx src/components/layout/SearchInput.tsx src/components/layout/TopBar.tsx
git commit -m "feat: search context and search input component"
```

---

## Task 5: Dashboard Data Fetcher (React.cache) + Skeleton Loader

**Files:**
- Create: `src/lib/queries/dashboard.ts`
- Create: `src/components/dashboard/DashboardSkeleton.tsx`
- Create: `src/app/dashboard/loading.tsx`
- Modify: `src/app/dashboard/layout.tsx`
- Modify: `src/app/dashboard/page.tsx`

> `React.cache` wraps the Supabase fetch so both `layout.tsx` and `page.tsx` can call `getDashboardData()` with only one actual DB round-trip per request. `loading.tsx` shows `DashboardSkeleton` while `page.tsx` resolves on initial hard load.

- [ ] **Step 1: Create `src/lib/queries/dashboard.ts`**

```typescript
import { cache } from 'react'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { computeSidebarStats } from '@/lib/stats'
import { mapTask, mapCategory } from '@/lib/mappers'
import type { Task, Category, SidebarStats } from '@/types/app'

export interface DashboardData {
  tasks: Task[]
  categories: Category[]
  stats: SidebarStats
  taskCounts: Record<string, number>
}

export const getDashboardData = cache(async (): Promise<DashboardData> => {
  const supabase = await createSupabaseServerClient()
  const [{ data: rawTasks }, { data: rawCats }] = await Promise.all([
    supabase.from('tasks').select('*').eq('is_template', false).order('due_date'),
    supabase.from('categories').select('*').order('name'),
  ])
  const tasks = (rawTasks ?? []).map(mapTask)
  const categories = (rawCats ?? []).map(mapCategory)
  const stats = computeSidebarStats(tasks)
  const taskCounts = Object.fromEntries(
    categories.map(cat => [cat.id, tasks.filter(t => t.categoryId === cat.id).length])
  )
  return { tasks, categories, stats, taskCounts }
})
```

- [ ] **Step 2: Replace `src/app/dashboard/layout.tsx`**

```typescript
import { getDashboardData } from '@/lib/queries/dashboard'
import AppShell from '@/components/layout/AppShell'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { stats, categories, taskCounts } = await getDashboardData()
  return (
    <AppShell stats={stats} categories={categories} taskCounts={taskCounts}>
      {children}
    </AppShell>
  )
}
```

- [ ] **Step 3: Update `src/app/dashboard/page.tsx`**

Replace the two duplicated Supabase fetches with `getDashboardData()`:

```typescript
import { getDashboardData } from '@/lib/queries/dashboard'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { mapAttachment } from '@/lib/mappers'
import { CATEGORY_COLOURS } from '@/lib/constants'
import DashboardClient from '@/components/dashboard/DashboardClient'
import TaskPanel from '@/components/task-panel/TaskPanel'
import type { Task, Category, Attachment } from '@/types/app'

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ task?: string }>
}) {
  const { task: activeTaskId } = await searchParams
  const { tasks, categories } = await getDashboardData()

  const colourMap = Object.fromEntries(
    categories.map(c => [c.id, CATEGORY_COLOURS[c.slug] ?? '#10b981'])
  )

  let activeTask: Task | null = null
  let activeCategory: Category | null = null
  let attachments: Attachment[] = []

  if (activeTaskId) {
    activeTask = tasks.find(t => t.id === activeTaskId) ?? null
    activeCategory = categories.find(c => c.id === activeTask?.categoryId) ?? null
  }

  if (activeTask) {
    const supabase = await createSupabaseServerClient()
    const { data: rawAtt } = await supabase
      .from('attachments').select('*').eq('task_id', activeTask.id)
    attachments = (rawAtt ?? []).map(mapAttachment)
  }

  return (
    <>
      <DashboardClient tasks={tasks} colourMap={colourMap} categories={categories} />
      {activeTask && (
        <TaskPanel task={activeTask} category={activeCategory} attachments={attachments} />
      )}
    </>
  )
}
```

- [ ] **Step 4: Create `src/components/dashboard/DashboardSkeleton.tsx`**

```typescript
export default function DashboardSkeleton() {
  const WEEK_COUNT = 8
  const cardCounts = [2, 3, 1, 2, 1, 1, 2, 1]

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Header bar skeleton */}
      <div className="flex items-center gap-3 px-5 py-3 border-b border-border shrink-0">
        <div className="h-3 w-24 bg-border rounded animate-pulse" />
        <div className="h-3 w-36 bg-border rounded animate-pulse" />
        <div className="ml-auto h-7 w-52 bg-border rounded-lg animate-pulse" />
      </div>
      {/* Weekly columns skeleton */}
      <div className="flex-1 overflow-x-auto p-4">
        <div className="flex h-full gap-2" style={{ minWidth: `${WEEK_COUNT * 220}px` }}>
          {cardCounts.map((count, i) => (
            <div
              key={i}
              className="flex-1 min-w-[200px] rounded-xl border border-border overflow-hidden"
            >
              <div className="px-3 pt-3 pb-2 border-b border-border">
                <div className="h-2.5 w-12 bg-border rounded animate-pulse mb-2" />
                <div className="h-2 w-20 bg-border rounded animate-pulse mb-2" />
                <div className="h-0.5 bg-border rounded-full" />
              </div>
              <div className="p-2 space-y-1.5">
                {Array.from({ length: count }).map((_, j) => (
                  <div key={j} className="rounded-lg p-2.5 border border-border bg-surface">
                    <div className="h-2.5 bg-border rounded animate-pulse mb-2 w-4/5" />
                    <div className="h-2 bg-border rounded animate-pulse mb-2 w-2/5" />
                    <div className="h-0.5 bg-border rounded-full animate-pulse" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Create `src/app/dashboard/loading.tsx`**

```typescript
import DashboardSkeleton from '@/components/dashboard/DashboardSkeleton'

export default function Loading() {
  return <DashboardSkeleton />
}
```

- [ ] **Step 6: Verify no regression**

```bash
npm run dev
```

Navigate to `/dashboard`. App should work identically to before. To see the skeleton: open devtools → Network → throttle to Slow 3G → hard reload.

- [ ] **Step 7: Run existing tests**

```bash
npm test
```

Expected: all existing tests pass.

- [ ] **Step 8: Commit**

```bash
git add src/lib/queries/dashboard.ts src/components/dashboard/DashboardSkeleton.tsx src/app/dashboard/loading.tsx src/app/dashboard/layout.tsx src/app/dashboard/page.tsx
git commit -m "feat: react cache data fetcher and skeleton loader for dashboard"
```

---

## Task 6: createTask Server Action

**Files:**
- Modify: `src/actions/tasks.ts`

> Inserts a new task row into Supabase and invalidates the dashboard cache. Simple addition alongside the existing `updateProgressAction` and `updateNotesAction`.

- [ ] **Step 1: Add `createTaskAction` to `src/actions/tasks.ts`**

Append to the existing file (do not change existing exports):

```typescript
export async function createTaskAction(formData: FormData) {
  const title = (formData.get('title') as string | null)?.trim()
  const categoryId = (formData.get('categoryId') as string | null) || null
  const dueDate = formData.get('dueDate') as string | null

  if (!title) throw new Error('Title is required')
  if (!dueDate) throw new Error('Due date is required')

  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.from('tasks').insert({
    title,
    category_id: categoryId,
    due_date: dueDate,
    progress: 0,
    is_recurring: false,
    is_template: false,
  })
  if (error) throw new Error(error.message)

  revalidatePath('/dashboard')
  revalidatePath('/category', 'layout')
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/actions/tasks.ts
git commit -m "feat: createTaskAction server action"
```

---

## Task 7: TaskModalContext + AddTaskModal

**Files:**
- Create: `src/context/TaskModalContext.tsx`
- Create: `src/components/modals/AddTaskModal.tsx`

> `TaskModalProvider` owns the open/close state and renders `AddTaskModal`. It is placed high in the tree (inside `AppShell`) so both the sidebar button and the modal can live in it.

- [ ] **Step 1: Create `src/components/modals/AddTaskModal.tsx`**

```typescript
'use client'
import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { createTaskAction } from '@/actions/tasks'
import type { Category } from '@/types/app'

export default function AddTaskModal({
  categories,
  onClose,
}: {
  categories: Category[]
  onClose: () => void
}) {
  const dialogRef = useRef<HTMLDivElement>(null)

  // Escape key dismissal + focus trap
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return }

      // Focus trap: cycle Tab/Shift+Tab within the modal
      if (e.key === 'Tab' && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (e.shiftKey) {
          if (document.activeElement === first) { e.preventDefault(); last?.focus() }
        } else {
          if (document.activeElement === last) { e.preventDefault(); first?.focus() }
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  async function handleSubmit(formData: FormData) {
    await createTaskAction(formData)
    onClose()
  }

  return createPortal(
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center pb-20"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      role="dialog"
      aria-modal="true"
      aria-label="Add task"
    >
      <div
        ref={dialogRef}
        className="bg-background border border-border rounded-xl p-5 w-[400px] shadow-2xl"
      >
        <h2 className="text-[14px] font-bold text-primary mb-4">Add Task</h2>

        <form action={handleSubmit} className="space-y-3">
          {/* Title */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-muted mb-1.5">
              Title *
            </label>
            <input
              name="title"
              required
              autoFocus
              placeholder="Task title"
              className="w-full px-3 py-2 text-[13px] bg-surface border border-border rounded-lg text-primary placeholder:text-muted focus:outline-none focus:border-cat-social focus:ring-1 focus:ring-cat-social/20 transition-colors"
            />
          </div>

          {/* Category + Due Date row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-muted mb-1.5">
                Category
              </label>
              <select
                name="categoryId"
                className="w-full px-3 py-2 text-[13px] bg-surface border border-border rounded-lg text-primary focus:outline-none focus:border-cat-social transition-colors"
              >
                <option value="">None</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-muted mb-1.5">
                Due Date *
              </label>
              <input
                name="dueDate"
                type="date"
                required
                className="w-full px-3 py-2 text-[13px] bg-surface border border-border rounded-lg text-primary focus:outline-none focus:border-cat-social transition-colors"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-[12px] font-medium border border-border rounded-lg text-secondary hover:text-primary hover:border-secondary transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-[12px] font-semibold bg-cat-social text-white rounded-lg hover:opacity-90 transition-opacity"
            >
              Add Task →
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}
```

- [ ] **Step 2: Create `src/context/TaskModalContext.tsx`**

```typescript
'use client'
import { createContext, useContext, useState } from 'react'
import AddTaskModal from '@/components/modals/AddTaskModal'
import type { Category } from '@/types/app'

interface TaskModalContextValue {
  openAddTaskModal: () => void
}

const TaskModalContext = createContext<TaskModalContextValue>({
  openAddTaskModal: () => {},
})

export function useTaskModal() {
  return useContext(TaskModalContext)
}

export function TaskModalProvider({
  categories,
  children,
}: {
  categories: Category[]
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)

  return (
    <TaskModalContext.Provider value={{ openAddTaskModal: () => setOpen(true) }}>
      {children}
      {open && <AddTaskModal categories={categories} onClose={() => setOpen(false)} />}
    </TaskModalContext.Provider>
  )
}
```

- [ ] **Step 3: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/context/TaskModalContext.tsx src/components/modals/AddTaskModal.tsx
git commit -m "feat: task modal context and add-task modal component"
```

---

## Task 8: AddTaskButton + Sidebar Children + AppShell Wiring

**Files:**
- Create: `src/components/layout/AddTaskButton.tsx`
- Modify: `src/components/layout/Sidebar.tsx`
- Modify: `src/components/layout/AppShell.tsx`

> Connects all the providers into `AppShell` and gives the sidebar an `AddTaskButton` that calls into `TaskModalContext`. Server components can render client components as leaves — this is the standard Next.js pattern.

- [ ] **Step 1: Create `src/components/layout/AddTaskButton.tsx`**

```typescript
'use client'
import { useTaskModal } from '@/context/TaskModalContext'

export default function AddTaskButton() {
  const { openAddTaskModal } = useTaskModal()
  return (
    <button
      onClick={openAddTaskModal}
      className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-[12px] font-semibold bg-cat-social text-white rounded-lg hover:opacity-90 transition-opacity"
    >
      <span className="text-[16px] leading-none font-light">+</span>
      Add Task
    </button>
  )
}
```

- [ ] **Step 2: Update `src/components/layout/Sidebar.tsx`**

Add optional `children` prop rendered at the top (before stats):

```typescript
import type { Category, SidebarStats as SidebarStatsType } from '@/types/app'
import SidebarStats from './SidebarStats'
import CategoryNav from './CategoryNav'

export default function Sidebar({
  stats,
  categories,
  taskCounts,
  children,
}: {
  stats: SidebarStatsType
  categories: Category[]
  taskCounts: Record<string, number>
  children?: React.ReactNode
}) {
  return (
    <aside className="w-[200px] flex-shrink-0 bg-surface border-r border-border flex flex-col py-4 overflow-y-auto">
      <div className="px-3 flex flex-col gap-4">
        {children}
        <SidebarStats stats={stats} />
        <CategoryNav categories={categories} taskCounts={taskCounts} />
      </div>
    </aside>
  )
}
```

- [ ] **Step 3: Replace `src/components/layout/AppShell.tsx`**

Adds `TaskModalProvider`, `SearchProvider`, and `AddTaskButton` as a sidebar child:

```typescript
import type { Category, SidebarStats } from '@/types/app'
import TopBar from './TopBar'
import Sidebar from './Sidebar'
import AddTaskButton from './AddTaskButton'
import { CategoryProvider } from '@/context/CategoryContext'
import { SearchProvider } from '@/context/SearchContext'
import { TaskModalProvider } from '@/context/TaskModalContext'

export default function AppShell({
  children,
  stats,
  categories,
  taskCounts,
}: {
  children: React.ReactNode
  stats: SidebarStats
  categories: Category[]
  taskCounts: Record<string, number>
}) {
  return (
    <TaskModalProvider categories={categories}>
      <CategoryProvider>
        <SearchProvider>
          <div className="flex flex-col h-screen bg-background">
            <TopBar />
            <div className="flex flex-1 overflow-hidden">
              <Sidebar stats={stats} categories={categories} taskCounts={taskCounts}>
                <AddTaskButton />
              </Sidebar>
              <main className="flex-1 overflow-hidden flex flex-col">
                {children}
              </main>
            </div>
          </div>
        </SearchProvider>
      </CategoryProvider>
    </TaskModalProvider>
  )
}
```

- [ ] **Step 4: Test the full add-task flow**

1. Navigate to `http://localhost:3000/dashboard`
2. Click "+ Add Task" button in sidebar
3. Fill in title and due date, select a category
4. Click "Add Task →"
5. Check Supabase dashboard → `tasks` table: new row should appear
6. Reload the dashboard: new task card should appear in the correct week column

- [ ] **Step 5: Commit**

```bash
git add src/components/layout/AddTaskButton.tsx src/components/layout/Sidebar.tsx src/components/layout/AppShell.tsx
git commit -m "feat: add task button, sidebar children slot, and appshell provider wiring"
```

---

## Task 9: DashboardClient — Search Wiring + useOptimistic

**Files:**
- Modify: `src/components/dashboard/DashboardClient.tsx`

> Hooks up `SearchContext` for filtering and `useOptimistic` + `startTransition` for instant card progress updates. The `onProgressChange` callback threads down to `WeeklyView` (Task 10).

- [ ] **Step 1: Replace `src/components/dashboard/DashboardClient.tsx`**

```typescript
'use client'
import { useCategoryContext } from '@/context/CategoryContext'
import { useSearchContext } from '@/context/SearchContext'
import { computeCategoryInsights } from '@/lib/stats'
import { CATEGORY_COLOURS } from '@/lib/constants'
import { useState, useEffect, useOptimistic, startTransition } from 'react'
import { updateProgressAction } from '@/actions/tasks'
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
  colourMap,
  categories,
}: {
  tasks: Task[]
  colourMap: Record<string, string>
  categories: Category[]
}) {
  const { activeCategory } = useCategoryContext()
  const { searchQuery, setSearchQuery } = useSearchContext()
  const [viewMode, setViewMode] = useState<ViewMode>('weekly')

  const [optimisticTasks, dispatchOptimistic] = useOptimistic(
    tasks,
    (state: Task[], action: { type: 'update-progress'; id: string; progress: number }) => {
      if (action.type === 'update-progress') {
        return state.map(t => t.id === action.id ? { ...t, progress: action.progress } : t)
      }
      return state
    }
  )

  // Restore saved view mode
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as ViewMode | null
    if (saved) setViewMode(saved)
  }, [])

  // Reset search when category changes
  useEffect(() => {
    setSearchQuery('')
  }, [activeCategory, setSearchQuery])

  const handleViewChange = (v: ViewMode) => {
    setViewMode(v)
    localStorage.setItem(STORAGE_KEY, v)
  }

  // Called by ProgressPopup in WeeklyView — must be inside startTransition
  const handleProgressChange = (id: string, progress: number) => {
    startTransition(() => {
      dispatchOptimistic({ type: 'update-progress', id, progress })
      updateProgressAction(id, progress)
    })
  }

  // Apply category + search filters to optimistic task list
  const displayTasks = optimisticTasks
    .filter(t => !activeCategory || t.categoryId === activeCategory.id)
    .filter(t =>
      !searchQuery ||
      t.title.toLowerCase().includes(searchQuery.toLowerCase())
    )

  const accent = activeCategory
    ? (CATEGORY_COLOURS[activeCategory.slug] ?? activeCategory.colour)
    : '#10b981'

  const taskColourMap: Record<string, string> = Object.fromEntries(
    displayTasks.map(t => [
      t.id,
      activeCategory ? accent : (colourMap[t.categoryId ?? ''] ?? '#10b981'),
    ])
  )

  const catColourMap: Record<string, string> = activeCategory
    ? Object.fromEntries(displayTasks.map(t => [t.categoryId ?? '', accent]))
    : colourMap

  const switcher = <ViewSwitcher current={viewMode} onChange={handleViewChange} />

  const categorySection = activeCategory ? (() => {
    const insights = computeCategoryInsights(displayTasks)
    return (
      <>
        <CategoryHeader category={activeCategory} taskCount={displayTasks.length} finalDueDate={insights.finalDueDate} />
        <CategoryProgressBar progress={insights.overallProgress} colour={accent} />
        <CategoryInsightCards insights={insights} colour={accent} />
      </>
    )
  })() : null

  return (
    <>
      {categorySection}
      {viewMode === 'weekly'     && (
        <WeeklyView
          tasks={displayTasks}
          taskColourMap={taskColourMap}
          accent={accent}
          extra={switcher}
          onProgressChange={handleProgressChange}
          searchQuery={searchQuery}
        />
      )}
      {viewMode === 'horizontal' && <Timeline     tasks={displayTasks} categoryColourMap={catColourMap} accent={accent} extra={switcher} />}
      {viewMode === 'swimlane'   && <SwimlaneView tasks={displayTasks} taskColourMap={taskColourMap} accent={accent} extra={switcher} categories={categories} />}
      {viewMode === 'vertical'   && <VerticalView tasks={displayTasks} taskColourMap={taskColourMap} accent={accent} extra={switcher} />}
      {viewMode === 'calendar'   && <CalendarView tasks={displayTasks} taskColourMap={taskColourMap} accent={accent} extra={switcher} />}
    </>
  )
}
```

- [ ] **Step 2: Update `src/components/timeline/views/types.ts`** to add the new props:

```typescript
import type { Task, Category } from '@/types/app'

export interface ViewProps {
  tasks: Task[]
  taskColourMap: Record<string, string>
  accent?: string
  categories?: Category[]
  extra?: React.ReactNode
  // Added for WeeklyView inline progress + search highlighting
  onProgressChange?: (id: string, progress: number) => void
  searchQuery?: string
}
```

- [ ] **Step 3: Verify app compiles**

```bash
npx tsc --noEmit
```

Expected: TypeScript may warn that `WeeklyView` doesn't use the new props yet — that's fine, they're optional. No errors on existing views.

- [ ] **Step 4: Test search**

1. Open `http://localhost:3000/dashboard`
2. Type a partial task title in the search bar — cards should filter in real-time
3. Select a category — both filters apply
4. Press `Escape` — search clears
5. Click `✕` — search clears
6. Switch category — search resets

- [ ] **Step 5: Commit**

```bash
git add src/components/dashboard/DashboardClient.tsx src/components/timeline/views/types.ts
git commit -m "feat: search wiring and useOptimistic progress in dashboard client"
```

---

## Task 10: ProgressPopup + WeeklyView Card Refresh

**Files:**
- Create: `src/components/task-card/ProgressPopup.tsx`
- Modify: `src/components/timeline/views/WeeklyView.tsx`

> `ProgressPopup` is portalled to `document.body` to avoid overflow clipping. `WeeklyView` gets a visual refresh for light mode plus a `%` badge that triggers the popup. Search term highlighting is also added here.

- [ ] **Step 1: Create `src/components/task-card/ProgressPopup.tsx`**

```typescript
'use client'
import { createPortal } from 'react-dom'
import { useEffect, useRef } from 'react'

const OPTIONS = [
  { label: 'Not started',     value: 0   },
  { label: 'Just started',    value: 25  },
  { label: 'Halfway',         value: 50  },
  { label: 'Nearly done',     value: 75  },
  { label: 'Complete',        value: 100 },
]

export default function ProgressPopup({
  taskId,
  currentProgress,
  anchorRect,
  onSelect,
  onClose,
}: {
  taskId: string
  currentProgress: number
  anchorRect: DOMRect
  onSelect: (id: string, progress: number) => void
  onClose: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    const onMouse = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    window.addEventListener('keydown', onKey)
    // Use setTimeout so the click that opened the popup doesn't immediately close it
    const id = setTimeout(() => window.addEventListener('mousedown', onMouse), 0)
    return () => {
      window.removeEventListener('keydown', onKey)
      clearTimeout(id)
      window.removeEventListener('mousedown', onMouse)
    }
  }, [onClose])

  // Position above the badge — getBoundingClientRect() is already viewport-relative,
  // so do NOT add window.scrollY (popup uses position: fixed, not absolute)
  const top = anchorRect.top
  const right = window.innerWidth - anchorRect.right

  return createPortal(
    <div
      ref={ref}
      className="fixed z-50 bg-background border border-border rounded-xl shadow-2xl p-1.5 min-w-[160px]"
      style={{
        top: `${top}px`,
        right: `${right}px`,
        transform: 'translateY(calc(-100% - 6px))',
      }}
    >
      {OPTIONS.map(opt => (
        <button
          key={opt.value}
          onClick={() => { onSelect(taskId, opt.value); onClose() }}
          className={`w-full text-left flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-colors hover:bg-surface ${
            opt.value === currentProgress
              ? 'text-cat-social font-semibold'
              : 'text-secondary'
          }`}
        >
          <div
            className="h-1 w-5 rounded-full flex-shrink-0"
            style={{
              background:
                opt.value === 0   ? 'var(--border)' :
                opt.value === 100 ? '#10b981' :
                '#60a5fa',
            }}
          />
          <span>{opt.label}</span>
          {opt.value > 0 && (
            <span className="text-muted ml-0.5">· {opt.value}%</span>
          )}
          {opt.value === currentProgress && (
            <span className="ml-auto text-cat-social text-[10px]">✓</span>
          )}
        </button>
      ))}
    </div>,
    document.body
  )
}
```

- [ ] **Step 2: Replace `src/components/timeline/views/WeeklyView.tsx`**

Adds: popup state, `%` badge trigger, `ProgressPopup` render, keyword highlighting, and light-mode-friendly card styles:

```typescript
'use client'
import { useState } from 'react'
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
                  <div className="h-1 bg-border rounded-full overflow-hidden">
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
                          <div className="flex-1 h-1 bg-border rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-200"
                              style={{ width: `${task.progress}%`, background: colour }}
                            />
                          </div>
                          {/* % badge — click to open ProgressPopup */}
                          {onProgressChange ? (
                            <button
                              onClick={e => handleBadgeClick(e, task.id, task.progress)}
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
```

- [ ] **Step 3: Test inline progress update**

1. Open `http://localhost:3000/dashboard`
2. Throttle network to Slow 3G in devtools
3. Click the `%` badge on any task card — popup should appear
4. Select a new progress level — card progress bar updates **immediately** (before the network request completes)
5. Popup should close. After network resolves, the new value is persisted.

- [ ] **Step 4: Test overdue card styling**

A task with `dueDate` in the past and `progress < 100` should have a red left border (`#f87171`).

- [ ] **Step 5: Test keyword highlighting**

Type a search term → matching text in card titles should be wrapped in a yellow `<mark>`.

- [ ] **Step 6: Run all tests**

```bash
npm test
```

Expected: all existing tests pass (no new tests required).

- [ ] **Step 7: Commit**

```bash
git add src/components/task-card/ProgressPopup.tsx src/components/timeline/views/WeeklyView.tsx
git commit -m "feat: progress popup and weekly view card refresh with light mode styles"
```

---

## Final Verification Checklist

Run through these manually before closing:

- [ ] **Light mode**: Open fresh incognito window — site loads in light mode (system preference or default). Click ☾ → switches to dark. Click ☀ → switches to light. Reload → persists without flash.
- [ ] **Geist font**: Devtools → Elements → `body` → Computed → `font-family` starts with `Geist`.
- [ ] **Skeleton loader**: Devtools → Network → Slow 3G → hard reload `/dashboard` → shimmer columns appear before real tasks.
- [ ] **Search**: Type partial title → filters live. Combine with category → both apply. `Escape` clears. `✕` clears. Switch category → resets.
- [ ] **Quick-add**: Click "+ Add Task" → fill title + due date → submit → check Supabase `tasks` table for row → reload dashboard to see new card.
- [ ] **Inline progress**: Throttle to Slow 3G → click `%` badge → select new level → card updates before request completes.
- [ ] **Tests pass**: `npm test` → all green.
