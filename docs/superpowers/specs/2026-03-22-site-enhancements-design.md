# Tasktracker Site Enhancements Design

**Date:** 2026-03-22
**Status:** Approved

## Overview

Enhance the Tasktracker university assignment management app across three equal pillars: visual polish, performance, and utility. The approach is targeted and additive — building on the existing clean architecture rather than rewriting it.

---

## Context

The app currently works well but has several gaps:
- System fonts and a single dark theme limit visual appeal
- Progress updates require a full server round-trip before the UI updates
- No way to search or find a specific task quickly
- No task creation from the UI — all data managed via Supabase directly
- No skeleton loaders — blank flash on first page load

---

## Pillar 1: Visual Polish

### Typography
- Add **Geist** font via `next/font/google` using the `variable` option:
  ```ts
  const geist = Geist({ subsets: ['latin'], variable: '--font-geist' })
  ```
- Apply `geist.variable` className to the `<html>` element in `layout.tsx`
- In `tailwind.config.ts`: `theme.extend.fontFamily.sans = ['var(--font-geist)', ...defaultTheme.fontFamily.sans]`

### Light / Adaptive Mode
- CSS variable-based theming system in `globals.css`:
  - Variables: `--background`, `--surface`, `--border`, `--text-primary`, `--text-secondary`, `--text-muted`
  - `:root` block: light values; `.dark` block: existing dark hex values from `tailwind.config.ts`
  - `tailwind.config.ts` backs `bg-background`, `bg-surface`, `border-border` with `var(--background)` etc. instead of hardcoded hex — existing class names throughout the codebase remain unchanged
- Light mode is the **default**; manual toggle stored in `localStorage` (`tt-theme` key)
- Toggle button (sun/moon icon) in `TopBar.tsx`
- **`text-emerald-*` migration (in-scope files only):** Files modified by this spec replace hardcoded `text-emerald-*` with `--text-primary`, `--text-secondary`, `--text-muted` backed utilities. Untouched components are left as-is (acceptable for this phase).

### Theme Flash Prevention
- Synchronous `<script dangerouslySetInnerHTML={{ __html: themeScript }}>` as a direct child of `<html>` in `layout.tsx`, before `<body>` — do not use `<head>` (managed by metadata) and do not use `async`/`defer` or `next/script`
- Script reads `localStorage['tt-theme']`; falls back to `prefers-color-scheme`; adds `.dark` class to `<html>` before first paint

### Light Mode Palette
- Background: `#ffffff` / surface: `#fafaf9` / border: `#e8e8e5`
- Text primary: `#111111` / secondary: `#555555` / muted: `#aaaaaa`

### Card Design
- Task cards: white background, `1px` border, `border-radius: 8px`, subtle hover shadow
- Overdue cards: soft red left-border accent (`border-l-2 border-red-400`)
- Current week column: green accent border + tinted background (`bg-emerald-50 dark:bg-emerald-950/20`)
- Progress bar height: `4px` (up from `3px`)

---

## Pillar 2: Performance

### Skeleton Loaders

**Scope:** `loading.tsx` wraps `page.tsx` in a Suspense boundary. Because `layout.tsx` makes uncached Supabase calls, it blocks client-side navigation — `loading.tsx` will not show on route changes. However, it **will** show on initial hard load / direct URL access (the common first-visit path), which is a meaningful improvement over the current blank flash.

Implementation:
1. Create `src/lib/queries/dashboard.ts` exporting a `React.cache`-wrapped fetcher:
   ```ts
   import { cache } from 'react'
   export const getDashboardData = cache(async () => {
     // same Supabase fetch logic currently in layout.tsx
     // returns { tasks, categories, sidebarStats, taskCounts }
   })
   ```
2. `layout.tsx` calls `getDashboardData()` — no behaviour change, just extracted to a shared function
3. `page.tsx` also calls `getDashboardData()` — `React.cache` deduplicates per request (one DB hit)
4. Create `src/app/dashboard/loading.tsx` — default export calls `<DashboardSkeleton />`

`DashboardSkeleton` renders shimmer week column outlines + card stubs using Tailwind `animate-pulse`.

**Note:** The sidebar always renders with real data from `layout.tsx`. The skeleton only covers the `page.tsx` content area (the weekly view / timeline section).

### Optimistic Progress Updates

Optimistic state for **inline card progress updates only** lives in `DashboardClient.tsx`. `TaskPanelProgress` retains its existing `useState` + `useTransition` pattern (it already provides `isPending` feedback and calling a server action directly — no change needed).

```ts
const [optimisticTasks, dispatchOptimistic] = useOptimistic(
  tasks,
  (state: Task[], action: { type: 'update-progress'; id: string; progress: number }) => {
    if (action.type === 'update-progress') {
      return state.map(t => t.id === action.id ? { ...t, progress: action.progress } : t)
    }
    return state
  }
)
```

**`startTransition` requirement:** `dispatchOptimistic` must be called inside `startTransition` for React 19 optimistic updates to work. Without it, optimistic state reverts on re-render. Pattern:
```ts
startTransition(() => {
  dispatchOptimistic({ type: 'update-progress', id, progress })
  updateTaskProgress(id, progress) // server action
})
```

`WeeklyView` receives `optimisticTasks` (for card progress bars). The task panel receives the original server-fetched `task` object and manages its own progress state — this is intentional and avoids a complex prop-threading chain.

### Add Task Modal — Client Context Pattern

`AddTaskButton` (in the sidebar) and `AddTaskModal` (rendered from `DashboardClient`) need to share open/close state, but they sit in sibling subtrees:

```
AppShell (server)
  Sidebar → AddTaskButton   ← needs to open modal
  main → DashboardClient    ← owns optimistic tasks
```

**Solution:** Create `TaskModalProvider.tsx` — a `'use client'` component that:
- Provides `TaskModalContext` (value: `{ openAddTaskModal: () => void }`)
- Manages `isModalOpen` state internally
- Renders `<AddTaskModal>` when `isModalOpen` is true
- Accepts `categories` as a prop

`AppShell.tsx` wraps its entire output in `<TaskModalProvider categories={categories}>`, forwarding the `categories` prop it already receives:
```tsx
// AppShell.tsx (server component — valid to render client component wrappers)
<TaskModalProvider categories={categories}>
  <div className="flex h-screen">
    <Sidebar stats={stats} categories={categories} taskCounts={taskCounts}>
      {/* AddTaskButton placed at the top of Sidebar's JSX, before SidebarStats */}
      <AddTaskButton />
    </Sidebar>
    <main>{children}</main>
  </div>
</TaskModalProvider>
```

`Sidebar.tsx` accepts an optional `children` prop rendered at the top of the sidebar, before `SidebarStats`. `AddTaskButton` is a `'use client'` leaf component that consumes `TaskModalContext` via `useContext`. `TaskModalProvider` renders `AddTaskModal` and calls `createTask` on submit. No optimistic add — task appears after `revalidatePath` (infrequent operation, acceptable latency).

---

## Pillar 3: Utility

### Search
- Search input in `TopBar.tsx` (max-width ~260px)
- `searchQuery` string state in `DashboardClient.tsx`
- Applied to `optimisticTasks`:
  ```ts
  const displayTasks = optimisticTasks
    .filter(t => !activeCategory || t.categoryId === activeCategory.id)
    .filter(t => !searchQuery || t.title.toLowerCase().includes(searchQuery.toLowerCase()))
  ```
- `<Highlight query={searchQuery}>` utility component wraps matches in `<mark>` for keyword highlighting
- Clears with `✕` button or `Escape` key
- `useEffect` watching `activeCategory` resets `searchQuery` to `''` when category changes

### Inline Progress Popup
- `ProgressPopup.tsx` uses `createPortal` to render into `document.body` — avoids clipping by `overflow-y-auto` week columns
- Position computed from triggering element's `getBoundingClientRect()`, applied via inline style
- **Scope: `WeeklyView.tsx` only** — other views use the task panel for progress updates
- Triggered by clicking the `%` badge; calls `onProgressChange(id, progress)` → `dispatchOptimistic` in `DashboardClient` (inside `startTransition`)
- Shows 5 options (0/25/50/75/100 with labels); dismisses on outside click or `Escape`

### Quick-Add Task Modal
- `AddTaskModal.tsx` — portalled modal, rendered from `TaskModalProvider`
- Fields: **Title** (required), **Category** (select from categories prop), **Due Date** (required date input)
- On submit: calls `createTask` server action → `revalidatePath('/dashboard')` → task appears after re-render
- Dismisses on `Escape`, backdrop click, or after successful save
- Accessible: focus trap, `role="dialog"`, `aria-modal`

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/lib/queries/dashboard.ts` | React `cache`-wrapped fetcher for tasks + categories |
| `src/app/dashboard/loading.tsx` | Next.js loading convention — default exports `DashboardSkeleton` |
| `src/components/dashboard/DashboardSkeleton.tsx` | Shimmer skeleton UI |
| `src/components/layout/ThemeToggle.tsx` | Sun/moon toggle (`'use client'`) |
| `src/components/layout/AddTaskButton.tsx` | Sidebar button (`'use client'`) — consumes `TaskModalContext` |
| `src/context/TaskModalContext.tsx` | Client context + `TaskModalProvider` component |
| `src/components/task-card/ProgressPopup.tsx` | Portalled inline progress picker |
| `src/components/modals/AddTaskModal.tsx` | Quick-add task modal |

## Files to Modify

| File | Change |
|------|--------|
| `src/app/globals.css` | CSS variable theming (light + dark) |
| `src/app/layout.tsx` | Geist font, synchronous theme script before `<body>` |
| `src/app/dashboard/layout.tsx` | Use `getDashboardData()` cached fetcher |
| `src/app/dashboard/page.tsx` | Use `getDashboardData()` cached fetcher; pass tasks/categories to `DashboardClient` |
| `tailwind.config.ts` | `fontFamily.sans` → `--font-geist`; back colour tokens with CSS variables |
| `src/components/layout/AppShell.tsx` | Wrap output in `<TaskModalProvider>`; render `<AddTaskButton />` in sidebar |
| `src/components/layout/TopBar.tsx` | Search bar + `ThemeToggle` |
| `src/components/dashboard/DashboardClient.tsx` | `useOptimistic` + `dispatchOptimistic`, search state, `onProgressChange` callback |
| `src/components/timeline/views/WeeklyView.tsx` | Updated card design + `ProgressPopup` trigger |
| `src/components/task-panel/TaskPanelProgress.tsx` | No change — retains existing `useState` + `useTransition` pattern |
| `src/actions/tasks.ts` | Add `createTask` server action |

---

## Data Flow

```
User clicks "+ Add Task" (AddTaskButton in sidebar)
  → openAddTaskModal() via TaskModalContext
  → AddTaskModal renders (inside TaskModalProvider)
  → User fills title / category / due date → submit
  → createTask server action → revalidatePath → new card appears

User clicks "%" badge on task card (WeeklyView only)
  → ProgressPopup portalled to body, positioned via getBoundingClientRect
  → User selects level → onProgressChange(id, progress) in DashboardClient
  → startTransition(() => { dispatchOptimistic(...); updateTaskProgress(id, progress) })
  → Card updates immediately; server syncs in background

User types in search bar
  → searchQuery state in DashboardClient
  → displayTasks filtered client-side (category + query combined)
  → Keyword highlighted in WeeklyView card titles
  → Resets on category change (useEffect)
```

---

## Out of Scope

- Task editing beyond progress (title, dates, notes — remains in task panel)
- Task deletion from UI
- Sorting controls
- Pagination
- Inline progress popup in Swimlane/Vertical/Calendar/Timeline views
- Migrating `text-emerald-*` classes in components not touched by this spec

---

## Verification

1. **Light/Dark toggle**: Click sun/moon — surfaces, text, borders all switch. Reload — mode persists without flash. Fresh incognito + system dark preference → dark applied before paint.
2. **Geist font**: Devtools → computed `font-family` on body text shows `Geist`.
3. **Skeleton loader**: Throttle to Slow 3G → do a hard reload of `/dashboard` → shimmer week cards appear in the main content area before real tasks load. Sidebar renders fully (from `layout.tsx`). Note: skeleton does not appear on client-side navigation (layout blocks), only on initial page load.
4. **Optimistic progress**: Throttle to Slow 3G → click `%` badge → progress bar updates before network request completes.
5. **Search**: Type partial title → filters in real-time, matches highlighted. Combine with category → both apply. `Escape` → clears. `✕` → clears. Switch category → search resets.
6. **Quick-add**: Click "+ Add Task", fill all fields, submit → check Supabase `tasks` table for inserted row → task card appears after page revalidates.
7. **Tests**: `npm test` — all existing tests pass. No new tests required.
