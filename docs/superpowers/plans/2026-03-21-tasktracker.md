# TaskTracker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a personal university task tracking web app with a horizontal floating-card timeline, category views, task detail panel, file attachments, and recurring tasks — deployed to Vercel with a simple password gate.

**Architecture:** Next.js 14 App Router with Server Components for data fetching and Client Components for interactivity. Supabase Postgres stores all task data; Supabase Storage handles file attachments. Auth is a server-side PIN check that sets an HttpOnly cookie validated by Next.js middleware.

**Tech Stack:** Next.js 14, TypeScript, Tailwind CSS, Supabase (Postgres + Storage), Vercel

**Spec:** `docs/superpowers/specs/2026-03-21-tasktracker-design.md`

---

## File Map

```
src/
├── middleware.ts                        # Auth cookie guard for /dashboard, /category/*
├── types/
│   ├── database.ts                      # Raw DB row types (mirrors SQL schema exactly)
│   └── app.ts                           # App-level types: Task, Category, SidebarStats, etc.
├── lib/
│   ├── supabase/server.ts               # Server Supabase client (cookies)
│   ├── supabase/client.ts               # Browser Supabase client (singleton)
│   ├── constants.ts                     # COURSE_START/END dates, CATEGORY_COLOURS
│   ├── date-utils.ts                    # daysUntil, isOverdue, formatDueDate, etc.
│   ├── recurrence.ts                    # parseRecurrenceRule, generateInstances
│   └── stats.ts                         # computeSidebarStats, computeCategoryInsights
├── actions/
│   ├── auth.ts                          # loginAction server action
│   ├── tasks.ts                         # updateProgressAction, updateNotesAction
│   └── attachments.ts                   # deleteAttachmentAction
├── app/
│   ├── layout.tsx                       # Root layout, global CSS
│   ├── globals.css                      # Tailwind directives + CSS vars
│   ├── page.tsx                         # Login page
│   ├── dashboard/
│   │   ├── layout.tsx                   # Fetches all tasks+categories, renders AppShell
│   │   └── page.tsx                     # All-tasks timeline, reads ?task= param
│   └── category/[slug]/
│       ├── layout.tsx                   # Resolves slug → category
│       └── page.tsx                     # Category timeline + insights, reads ?task= param
└── components/
    ├── auth/LoginForm.tsx               # PIN input, calls loginAction
    ├── layout/
    │   ├── AppShell.tsx                 # Grid: topbar + sidebar + main content
    │   ├── TopBar.tsx                   # Logo, date, days-remaining badge
    │   ├── DaysRemainingBadge.tsx       # Countdown to May 14
    │   ├── Sidebar.tsx                  # Composes SidebarStats + CategoryNav
    │   ├── SidebarStats.tsx             # 6 stat rows
    │   └── CategoryNav.tsx              # Category list, active highlight, navigation
    ├── timeline/
    │   ├── Timeline.tsx                 # Zoom state, card placement, scroll container
    │   ├── TimelineAxis.tsx             # Horizontal line, ticks, today marker
    │   ├── TimelineCard.tsx             # Single floating task card
    │   ├── TimelineStem.tsx             # Stem + dot connecting card to axis
    │   └── ZoomControls.tsx             # − / slider / + buttons, wheel handler
    ├── category/
    │   ├── CategoryHeader.tsx           # Name, dot, count, final deadline
    │   ├── CategoryProgressBar.tsx      # Avg progress bar in category colour
    │   └── CategoryInsightCards.tsx     # Row of 5 insight stat cards
    └── task-panel/
        ├── TaskPanel.tsx                # Slide-in overlay shell, Escape/outside close
        ├── TaskPanelHeader.tsx          # Colour bar, title, tags, close button
        ├── TaskPanelDates.tsx           # Start/due/time, time-remaining box
        ├── TaskPanelProgress.tsx        # Progress bar + 5 quick-pick buttons
        ├── TaskPanelDetails.tsx         # Assignment details from jsonb
        ├── TaskPanelNotes.tsx           # Textarea + save button
        └── TaskPanelAttachments.tsx     # File list + upload dropzone

supabase/
├── migrations/0001_initial_schema.sql   # Schema DDL
└── seed.ts                              # Seed: categories, tasks, recurring instances
```

---

## Task 1: Project Scaffold & Shared Foundation

**Files:**
- Create: `package.json`, `next.config.ts`, `tailwind.config.ts`, `tsconfig.json`, `postcss.config.js`
- Create: `src/types/database.ts`
- Create: `src/types/app.ts`
- Create: `src/lib/constants.ts`
- Create: `src/lib/date-utils.ts`
- Create: `src/lib/supabase/server.ts`
- Create: `src/lib/supabase/client.ts`
- Create: `src/app/globals.css`
- Create: `src/app/layout.tsx`
- Create: `.gitignore`
- Create: `.env.local` (gitignored)

- [ ] **Step 1: Initialise Next.js project**

```bash
cd /Users/mattbaker/Projects/Tasktracker
npx create-next-app@latest . --typescript --tailwind --app --src-dir --import-alias "@/*" --no-eslint
```

Expected: project scaffold created, `npm run dev` starts on port 3000.

- [ ] **Step 2: Install Supabase dependencies**

```bash
npm install @supabase/ssr @supabase/supabase-js
```

- [ ] **Step 3: Install testing dependencies**

```bash
npm install -D jest @testing-library/react @testing-library/jest-dom jest-environment-jsdom @types/jest ts-jest
```

- [ ] **Step 4: Configure Jest**

Create `jest.config.ts`:

```typescript
import type { Config } from 'jest'
const config: Config = {
  testEnvironment: 'node',
  transform: { '^.+\\.tsx?$': ['ts-jest', { tsconfig: { jsx: 'react-jsx' } }] },
  testPathPattern: ['src/__tests__'],
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' },
}
export default config
```

- [ ] **Step 5: Write `src/lib/constants.ts`**

```typescript
export const COURSE_START = new Date('2026-03-21T00:00:00.000Z')
export const COURSE_END   = new Date('2026-05-14T23:59:59.999Z')

export const CATEGORY_COLOURS: Record<string, string> = {
  'social-media':     '#10b981',
  'recognition-day':  '#6366f1',
  'tracking-systems': '#14b8a6',
  'training':         '#ec4899',
  'annual-report':    '#f59e0b',
  'video-qa':         '#a3e635',
  'working-groups':   '#8b5cf6',
}
```

- [ ] **Step 6: Write `src/lib/date-utils.ts`**

```typescript
import { COURSE_END } from './constants'

export function daysUntil(date: Date | string): number {
  const target = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  target.setHours(0, 0, 0, 0)
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

export function daysUntilCourseEnd(): number {
  return daysUntil(new Date(COURSE_END))
}

export function isOverdue(dueDate: string): boolean {
  return daysUntil(dueDate) < 0
}

export function isDueThisWeek(dueDate: string): boolean {
  const d = daysUntil(dueDate)
  return d >= 0 && d <= 7
}

export function formatDueDate(dueDate: string, dueTime?: string | null): string {
  const d = new Date(dueDate)
  const dateStr = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  if (!dueTime) return dateStr
  const [h, m] = dueTime.split(':')
  const hour = parseInt(h)
  const suffix = hour >= 12 ? 'pm' : 'am'
  const displayHour = hour > 12 ? hour - 12 : hour || 12
  return `${dateStr} · ${displayHour}:${m}${suffix}`
}

export function timeRemainingLabel(dueDate: string): { label: string; urgency: 'normal' | 'amber' | 'red' } {
  const days = daysUntil(dueDate)
  if (days < 0)  return { label: `${Math.abs(days)}d overdue`, urgency: 'red' }
  if (days === 0) return { label: 'Due today', urgency: 'red' }
  if (days <= 7)  return { label: `${days}d left`, urgency: 'amber' }
  return { label: `${days} days left`, urgency: 'normal' }
}
```

- [ ] **Step 7: Write failing tests for date-utils**

Create `src/__tests__/date-utils.test.ts`:

```typescript
import { daysUntil, isOverdue, isDueThisWeek, formatDueDate, timeRemainingLabel } from '@/lib/date-utils'

// Pin "today" to a fixed date for deterministic tests
const FIXED_TODAY = new Date('2026-03-21T12:00:00.000Z')
beforeEach(() => { jest.useFakeTimers().setSystemTime(FIXED_TODAY) })
afterEach(() => { jest.useRealTimers() })

test('daysUntil returns 0 for today', () => {
  expect(daysUntil('2026-03-21')).toBe(0)
})
test('daysUntil returns positive for future', () => {
  expect(daysUntil('2026-03-28')).toBe(7)
})
test('daysUntil returns negative for past', () => {
  expect(daysUntil('2026-03-14')).toBe(-7)
})
test('isOverdue returns true for past date', () => {
  expect(isOverdue('2026-03-14')).toBe(true)
})
test('isOverdue returns false for future date', () => {
  expect(isOverdue('2026-03-28')).toBe(false)
})
test('isDueThisWeek true for date within 7 days', () => {
  expect(isDueThisWeek('2026-03-26')).toBe(true)
})
test('isDueThisWeek false for date > 7 days out', () => {
  expect(isDueThisWeek('2026-04-10')).toBe(false)
})
test('formatDueDate formats without time', () => {
  expect(formatDueDate('2026-05-08')).toBe('8 May')
})
test('formatDueDate formats with time', () => {
  expect(formatDueDate('2026-05-08', '14:00')).toBe('8 May · 2:00pm')
})
test('timeRemainingLabel red when overdue', () => {
  expect(timeRemainingLabel('2026-03-14').urgency).toBe('red')
})
test('timeRemainingLabel amber within 7 days', () => {
  expect(timeRemainingLabel('2026-03-26').urgency).toBe('amber')
})
test('timeRemainingLabel normal beyond 7 days', () => {
  expect(timeRemainingLabel('2026-04-10').urgency).toBe('normal')
})
```

- [ ] **Step 8: Run tests — verify they fail**

```bash
npx jest src/__tests__/date-utils.test.ts
```

Expected: FAIL (date-utils.ts doesn't exist yet)

- [ ] **Step 9: Run tests again after writing date-utils**

```bash
npx jest src/__tests__/date-utils.test.ts
```

Expected: All 12 tests PASS

- [ ] **Step 10: Write `src/types/database.ts`**

```typescript
export interface DbCategory {
  id: string
  name: string
  slug: string
  colour: string
  description: string | null
}

export interface DbTask {
  id: string
  category_id: string | null
  title: string
  description: string | null
  module: string | null
  start_date: string | null
  due_date: string
  due_time: string | null
  progress: number
  notes: string | null
  assignment_details: {
    weighting?: string
    format?: string
    brief?: string
    requirements?: string[]
  } | null
  is_recurring: boolean
  is_template: boolean
  recurrence_rule: string | null
  parent_task_id: string | null
  created_at: string
}

export interface DbAttachment {
  id: string
  task_id: string
  file_name: string
  storage_path: string
  file_size: number
  uploaded_at: string
}
```

- [ ] **Step 11: Write `src/types/app.ts`**

```typescript
export interface Category {
  id: string
  name: string
  slug: string
  colour: string
  description: string | null
}

export interface Task {
  id: string
  categoryId: string | null
  title: string
  description: string | null
  module: string | null
  startDate: string | null
  dueDate: string
  dueTime: string | null
  progress: number
  notes: string | null
  assignmentDetails: {
    weighting?: string
    format?: string
    brief?: string
    requirements?: string[]
  } | null
  isRecurring: boolean
  isTemplate: boolean
  parentTaskId: string | null
}

export interface Attachment {
  id: string
  taskId: string
  fileName: string
  storagePath: string
  fileSize: number
  uploadedAt: string
}

export interface SidebarStats {
  recurringActive: number
  dueThisWeek: number
  upcoming: number
  overdue: number
  inProgress: number
  completed: number
}

export interface CategoryInsights {
  total: number
  inProgress: number
  completed: number
  overdue: number
  daysUntilFinalDue: number
  finalDueDate: string | null
  overallProgress: number
}

export type ProgressLabel = 'Not started' | 'Just started' | 'Halfway' | 'Nearly done' | 'Complete ✓'
export const PROGRESS_VALUES: Record<ProgressLabel, number> = {
  'Not started':  0,
  'Just started': 25,
  'Halfway':      50,
  'Nearly done':  75,
  'Complete ✓':  100,
}
```

- [ ] **Step 12: Write `src/lib/supabase/server.ts`**

```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createSupabaseServerClient() {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )
}
```

- [ ] **Step 13: Write `src/lib/supabase/client.ts`**

```typescript
import { createBrowserClient } from '@supabase/ssr'

let client: ReturnType<typeof createBrowserClient> | null = null

export function getSupabaseBrowserClient() {
  if (!client) {
    client = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }
  return client
}
```

- [ ] **Step 14: Configure `tailwind.config.ts` with category colours**

```typescript
import type { Config } from 'tailwindcss'
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'cat-social':   '#10b981',
        'cat-recog':    '#6366f1',
        'cat-tracking': '#14b8a6',
        'cat-training': '#ec4899',
        'cat-report':   '#f59e0b',
        'cat-video':    '#a3e635',
        'cat-working':  '#8b5cf6',
        background:     '#0a0f0a',
        surface:        '#0f1a0f',
        border:         '#1a2e1a',
      },
    },
  },
  plugins: [],
}
export default config
```

- [ ] **Step 15: Write `src/app/globals.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --bg: #0a0f0a;
}

body {
  background-color: var(--bg);
  color: #d1fae5;
}

* {
  box-sizing: border-box;
}

::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: #0f1a0f; }
::-webkit-scrollbar-thumb { background: #1a2e1a; border-radius: 3px; }
```

- [ ] **Step 16: Write `src/app/layout.tsx`**

```tsx
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'TaskTracker',
  description: 'University task tracker',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
```

- [ ] **Step 16b: Write `src/lib/mappers.ts`** — shared DB → app type converters used in every page

```typescript
import type { DbTask, DbCategory, DbAttachment } from '@/types/database'
import type { Task, Category, Attachment } from '@/types/app'

export function mapTask(t: DbTask): Task {
  return {
    id: t.id,
    categoryId: t.category_id,
    title: t.title,
    description: t.description,
    module: t.module,
    startDate: t.start_date,
    dueDate: t.due_date,
    dueTime: t.due_time,
    progress: t.progress,
    notes: t.notes,
    assignmentDetails: t.assignment_details,
    isRecurring: t.is_recurring,
    isTemplate: t.is_template,
    parentTaskId: t.parent_task_id,
  }
}

export function mapCategory(c: DbCategory): Category {
  return {
    id: c.id,
    name: c.name,
    slug: c.slug,
    colour: c.colour,
    description: c.description,
  }
}

export function mapAttachment(a: DbAttachment): Attachment {
  return {
    id: a.id,
    taskId: a.task_id,
    fileName: a.file_name,
    storagePath: a.storage_path,
    fileSize: a.file_size,
    uploadedAt: a.uploaded_at,
  }
}
```

Import `mapTask`, `mapCategory`, `mapAttachment` from `@/lib/mappers` in every page and layout that needs them. Do not redefine them inline.

- [ ] **Step 17: Type-check**

```bash
npx tsc --noEmit
```

Expected: zero errors

- [ ] **Step 18: Commit**

```bash
git add -A
git commit -m "feat: project scaffold, types, date-utils, supabase clients"
```

---

## Task 2: Database Schema & Migrations

**Files:**
- Create: `supabase/migrations/0001_initial_schema.sql`

- [ ] **Step 1: Install Supabase CLI**

```bash
npm install -D supabase
npx supabase login
```

- [ ] **Step 2: Initialise Supabase project**

```bash
npx supabase init
```

- [ ] **Step 3: Write `supabase/migrations/0001_initial_schema.sql`**

```sql
-- Categories
CREATE TABLE IF NOT EXISTS categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  colour      TEXT NOT NULL,
  description TEXT
);

-- Tasks
CREATE TABLE IF NOT EXISTS tasks (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id        UUID REFERENCES categories(id) ON DELETE SET NULL,
  title              TEXT NOT NULL,
  description        TEXT,
  module             TEXT,
  start_date         DATE,
  due_date           DATE NOT NULL,
  due_time           TIME,
  progress           INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  notes              TEXT,
  assignment_details JSONB,
  is_recurring       BOOLEAN NOT NULL DEFAULT FALSE,
  is_template        BOOLEAN NOT NULL DEFAULT FALSE,
  recurrence_rule    TEXT,
  parent_task_id     UUID REFERENCES tasks(id) ON DELETE CASCADE,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS tasks_due_date_idx       ON tasks(due_date);
CREATE INDEX IF NOT EXISTS tasks_category_id_idx    ON tasks(category_id);
CREATE INDEX IF NOT EXISTS tasks_is_template_idx    ON tasks(is_template);
CREATE INDEX IF NOT EXISTS tasks_parent_task_id_idx ON tasks(parent_task_id);

-- Attachments
CREATE TABLE IF NOT EXISTS attachments (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id      UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  file_name    TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  file_size    INTEGER NOT NULL,
  uploaded_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS attachments_task_id_idx ON attachments(task_id);
```

- [ ] **Step 4: Link to your Supabase project**

In the Supabase dashboard, create a new project (free tier). Then:

```bash
npx supabase link --project-ref <your-project-ref>
```

Get `<your-project-ref>` from: Supabase dashboard → Project Settings → General → Reference ID.

- [ ] **Step 5: Push migration**

```bash
npx supabase db push
```

Expected: Migration applied successfully. No errors.

- [ ] **Step 6: Verify in Supabase Studio**

Open Supabase dashboard → Table Editor. Confirm `categories`, `tasks`, `attachments` tables exist with all columns.

- [ ] **Step 7: Commit**

```bash
git add supabase/
git commit -m "feat: initial database schema (categories, tasks, attachments)"
```

---

## Task 3: Seed Data & Recurrence Engine

**Files:**
- Create: `src/lib/recurrence.ts`
- Create: `src/__tests__/recurrence.test.ts`
- Create: `src/lib/stats.ts`
- Create: `src/__tests__/stats.test.ts`
- Create: `supabase/seed.ts`

- [ ] **Step 1: Write failing tests for recurrence engine**

Create `src/__tests__/recurrence.test.ts`:

```typescript
import { parseRecurrenceRule, generateInstances } from '@/lib/recurrence'

const START = new Date('2026-03-21')
const END   = new Date('2026-05-14')

test('parseRecurrenceRule parses weekly:tuesday,thursday', () => {
  const rule = parseRecurrenceRule('weekly:tuesday,thursday')
  expect(rule.frequency).toBe('weekly')
  expect(rule.days).toEqual(['tuesday', 'thursday'])
})

test('parseRecurrenceRule parses weekly:any', () => {
  const rule = parseRecurrenceRule('weekly:any')
  expect(rule.frequency).toBe('weekly')
  expect(rule.days).toEqual(['any'])
})

test('generateInstances weekly:tuesday,thursday produces correct dates', () => {
  const instances = generateInstances('weekly:tuesday,thursday', START, END)
  // All must be Tuesday (2) or Thursday (4)
  instances.forEach(d => expect([2, 4]).toContain(d.getDay()))
  // Count: ~8 Tuesdays + ~8 Thursdays between Mar 21 and May 14
  expect(instances.length).toBeGreaterThanOrEqual(14)
})

test('generateInstances weekly:any first instance is first Monday on or after start', () => {
  const instances = generateInstances('weekly:any', START, END)
  // First Monday on or after Mar 21 (Saturday) is Mar 23
  expect(instances[0].toISOString().slice(0, 10)).toBe('2026-03-23')
  // All instances are Mondays
  instances.forEach(d => expect(d.getDay()).toBe(1))
})

test('generateInstances produces no dates outside range', () => {
  const instances = generateInstances('weekly:tuesday,thursday', START, END)
  instances.forEach(d => {
    expect(d.getTime()).toBeGreaterThanOrEqual(START.getTime())
    expect(d.getTime()).toBeLessThanOrEqual(END.getTime())
  })
})
```

- [ ] **Step 2: Run — verify FAIL**

```bash
npx jest src/__tests__/recurrence.test.ts
```

Expected: FAIL (module not found)

- [ ] **Step 3: Write `src/lib/recurrence.ts`**

```typescript
const DAY_MAP: Record<string, number> = {
  sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
  thursday: 4, friday: 5, saturday: 6,
}

export interface RecurrenceRule {
  frequency: 'weekly'
  days: string[]
}

export function parseRecurrenceRule(rule: string): RecurrenceRule {
  const [frequency, daysPart] = rule.split(':')
  if (frequency !== 'weekly') throw new Error(`Unsupported frequency: ${frequency}`)
  const days = daysPart.split(',').map(d => d.trim().toLowerCase())
  return { frequency: 'weekly', days }
}

export function generateInstances(rule: string, start: Date, end: Date): Date[] {
  const { days } = parseRecurrenceRule(rule)
  const instances: Date[] = []

  if (days.includes('any')) {
    // First Monday on or after start
    const first = new Date(start)
    while (first.getDay() !== 1) first.setDate(first.getDate() + 1)
    const cur = new Date(first)
    while (cur <= end) {
      instances.push(new Date(cur))
      cur.setDate(cur.getDate() + 7)
    }
    return instances
  }

  const targetDays = days.map(d => DAY_MAP[d])
  const cur = new Date(start)
  while (cur <= end) {
    if (targetDays.includes(cur.getDay())) {
      instances.push(new Date(cur))
    }
    cur.setDate(cur.getDate() + 1)
  }
  return instances
}
```

- [ ] **Step 4: Run recurrence tests — verify PASS**

```bash
npx jest src/__tests__/recurrence.test.ts
```

Expected: All 5 tests PASS

- [ ] **Step 5: Write failing stats tests**

Create `src/__tests__/stats.test.ts`:

```typescript
import { computeSidebarStats } from '@/lib/stats'
import type { Task } from '@/types/app'

const today = new Date('2026-03-21')
beforeEach(() => jest.useFakeTimers().setSystemTime(today))
afterEach(() => jest.useRealTimers())

function makeTask(overrides: Partial<Task>): Task {
  return {
    id: crypto.randomUUID(),
    categoryId: 'cat-1',
    title: 'Test',
    description: null,
    module: null,
    startDate: null,
    dueDate: '2026-04-01',
    dueTime: null,
    progress: 0,
    notes: null,
    assignmentDetails: null,
    isRecurring: false,
    isTemplate: false,
    parentTaskId: null,
    ...overrides,
  }
}

test('counts completed tasks (progress = 100)', () => {
  const tasks = [makeTask({ progress: 100 }), makeTask({ progress: 50 })]
  expect(computeSidebarStats(tasks).completed).toBe(1)
})

test('counts in-progress tasks (0 < progress < 100)', () => {
  const tasks = [makeTask({ progress: 50 }), makeTask({ progress: 0 }), makeTask({ progress: 100 })]
  expect(computeSidebarStats(tasks).inProgress).toBe(1)
})

test('counts overdue tasks (past due date, not complete)', () => {
  const tasks = [
    makeTask({ dueDate: '2026-03-14', progress: 0 }), // overdue
    makeTask({ dueDate: '2026-03-14', progress: 100 }), // overdue but complete — not counted
  ]
  expect(computeSidebarStats(tasks).overdue).toBe(1)
})

test('counts dueThisWeek (due within 7 days, not complete)', () => {
  const tasks = [
    makeTask({ dueDate: '2026-03-25', progress: 0 }), // 4 days away
    makeTask({ dueDate: '2026-03-25', progress: 100 }), // complete — not counted
    makeTask({ dueDate: '2026-04-10', progress: 0 }), // too far out
  ]
  expect(computeSidebarStats(tasks).dueThisWeek).toBe(1)
})

test('counts recurringActive (recurring, not template, due >= today)', () => {
  const tasks = [
    makeTask({ isRecurring: true, isTemplate: false, dueDate: '2026-03-25' }),
    makeTask({ isRecurring: true, isTemplate: true, dueDate: '2026-03-21' }), // template — excluded
    makeTask({ isRecurring: true, isTemplate: false, dueDate: '2026-03-14' }), // past — excluded
  ]
  expect(computeSidebarStats(tasks).recurringActive).toBe(1)
})
```

- [ ] **Step 6: Run — verify FAIL**

```bash
npx jest src/__tests__/stats.test.ts
```

- [ ] **Step 7: Write `src/lib/stats.ts`**

```typescript
import type { Task, SidebarStats, CategoryInsights } from '@/types/app'
import { isOverdue, isDueThisWeek, daysUntil } from './date-utils'

export function computeSidebarStats(tasks: Task[]): SidebarStats {
  const visible = tasks.filter(t => !t.isTemplate)
  return {
    recurringActive: visible.filter(t => t.isRecurring && daysUntil(t.dueDate) >= 0).length,
    dueThisWeek:     visible.filter(t => isDueThisWeek(t.dueDate) && t.progress < 100).length,
    upcoming:        visible.filter(t => daysUntil(t.dueDate) > 7 && t.progress < 100).length,
    overdue:         visible.filter(t => isOverdue(t.dueDate) && t.progress < 100).length,
    inProgress:      visible.filter(t => t.progress > 0 && t.progress < 100).length,
    completed:       visible.filter(t => t.progress === 100).length,
  }
}

export function computeCategoryInsights(tasks: Task[]): CategoryInsights {
  if (tasks.length === 0) {
    return { total: 0, inProgress: 0, completed: 0, overdue: 0, daysUntilFinalDue: 0, finalDueDate: null, overallProgress: 0 }
  }
  const sorted = [...tasks].sort((a, b) => b.dueDate.localeCompare(a.dueDate))
  const finalDueDate = sorted[0].dueDate
  const totalProgress = tasks.reduce((sum, t) => sum + t.progress, 0)
  return {
    total:             tasks.length,
    inProgress:        tasks.filter(t => t.progress > 0 && t.progress < 100).length,
    completed:         tasks.filter(t => t.progress === 100).length,
    overdue:           tasks.filter(t => isOverdue(t.dueDate) && t.progress < 100).length,
    daysUntilFinalDue: daysUntil(finalDueDate),
    finalDueDate,
    overallProgress:   Math.round(totalProgress / tasks.length),
  }
}
```

- [ ] **Step 8: Run stats tests — verify PASS**

```bash
npx jest src/__tests__/stats.test.ts
```

Expected: All 5 tests PASS

- [ ] **Step 9: Write `supabase/seed.ts`**

```typescript
import { createClient } from '@supabase/supabase-js'
import { generateInstances } from '../src/lib/recurrence'
import { COURSE_START, COURSE_END, CATEGORY_COLOURS } from '../src/lib/constants'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // use service role for seeding
)

const categories = [
  { name: 'Social Media',        slug: 'social-media',     colour: CATEGORY_COLOURS['social-media'] },
  { name: 'Recognition Day',     slug: 'recognition-day',  colour: CATEGORY_COLOURS['recognition-day'] },
  { name: 'Tracking Systems',    slug: 'tracking-systems', colour: CATEGORY_COLOURS['tracking-systems'] },
  { name: 'Training',            slug: 'training',         colour: CATEGORY_COLOURS['training'] },
  { name: 'Annual Report',       slug: 'annual-report',    colour: CATEGORY_COLOURS['annual-report'] },
  { name: 'Video & Q&A',         slug: 'video-qa',         colour: CATEGORY_COLOURS['video-qa'] },
  { name: 'Working Groups',      slug: 'working-groups',   colour: CATEGORY_COLOURS['working-groups'] },
]

async function seed() {
  console.log('Seeding categories...')
  const { data: cats, error: catErr } = await supabase.from('categories').insert(categories).select()
  if (catErr) throw catErr

  const bySlug = Object.fromEntries(cats.map(c => [c.slug, c.id]))

  console.log('Seeding one-off tasks...')
  await supabase.from('tasks').insert([
    {
      category_id: bySlug['recognition-day'],
      title: 'Team Company Review of Objectives',
      module: 'Self Leadership',
      start_date: '2026-03-23',
      due_date: '2026-03-26',
      progress: 0,
    },
    {
      category_id: bySlug['working-groups'],
      title: 'Storyboard Assignment',
      module: 'Self Leadership',
      start_date: '2026-03-30',
      due_date: '2026-04-03',
      progress: 0,
    },
    {
      category_id: null, // cross-category
      title: 'All Portfolios Due',
      module: 'All modules',
      due_date: '2026-04-27',
      due_time: '14:00',
      progress: 0,
    },
    {
      category_id: bySlug['annual-report'],
      title: 'Annual Report Submission',
      due_date: '2026-05-08',
      due_time: '14:00',
      progress: 0,
    },
    {
      category_id: bySlug['video-qa'],
      title: 'Annual Report Video',
      due_date: '2026-05-11',
      due_time: '12:00',
      progress: 0,
    },
    {
      category_id: bySlug['video-qa'],
      title: 'Annual Report Q&A',
      due_date: '2026-05-14',
      due_time: '09:30',
      progress: 0,
    },
  ])

  console.log('Seeding recurring templates and instances...')
  const recurringDefs = [
    { title: 'LinkedIn Post',          slug: 'social-media',     rule: 'weekly:any' },
    { title: 'Team Website Update',    slug: 'social-media',     rule: 'weekly:any' },
    { title: 'Check Tracking Systems', slug: 'tracking-systems', rule: 'weekly:any' },
    { title: 'Training Session',       slug: 'training',         rule: 'weekly:tuesday,thursday' },
  ]

  for (const def of recurringDefs) {
    // Insert template
    const { data: tmpl, error: tmplErr } = await supabase.from('tasks').insert({
      category_id:    bySlug[def.slug],
      title:          def.title,
      due_date:       '2026-03-21',
      is_recurring:   true,
      is_template:    true,
      recurrence_rule: def.rule,
      progress:       0,
    }).select().single()
    if (tmplErr) throw tmplErr

    // Generate instances
    const dates = generateInstances(def.rule, COURSE_START, COURSE_END)
    const instances = dates.map(d => ({
      category_id:    bySlug[def.slug],
      title:          def.title,
      due_date:       d.toISOString().slice(0, 10),
      is_recurring:   true,
      is_template:    false,
      parent_task_id: tmpl.id,
      progress:       0,
    }))
    const { error: instErr } = await supabase.from('tasks').insert(instances)
    if (instErr) throw instErr
    console.log(`  ${def.title}: ${instances.length} instances`)
  }

  console.log('Seed complete.')
}

seed().catch(console.error)
```

- [ ] **Step 10: Add seed script to `package.json`**

```json
"scripts": {
  "seed": "tsx supabase/seed.ts"
}
```

`tsx` automatically loads `.env.local`, so `SUPABASE_SERVICE_ROLE_KEY` and the Supabase URL will be picked up without explicit forwarding.

Also install tsx: `npm install -D tsx`

- [ ] **Step 11: Add `SUPABASE_SERVICE_ROLE_KEY` to `.env.local`**

Get it from Supabase dashboard → Project Settings → API → service_role key.

```
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

- [ ] **Step 12: Run seed**

```bash
npm run seed
```

Expected: "Seed complete." logged. No errors.

- [ ] **Step 13: Verify in Supabase Studio**

- `SELECT COUNT(*) FROM tasks WHERE is_template = false` → ~55–65 rows
- `SELECT * FROM tasks WHERE title = 'Training Session' ORDER BY due_date LIMIT 5` → first entry `2026-03-24` (Tuesday)
- `SELECT * FROM tasks WHERE title = 'LinkedIn Post' ORDER BY due_date LIMIT 2` → first entry `2026-03-23` (Monday)

- [ ] **Step 14: Commit**

```bash
git add src/lib/recurrence.ts src/lib/stats.ts src/__tests__/ supabase/
git commit -m "feat: recurrence engine, stats helpers, seed data"
```

---

## Task 4: Auth Gate

**Files:**
- Create: `src/middleware.ts`
- Create: `src/lib/auth.ts`
- Create: `src/actions/auth.ts`
- Create: `src/app/page.tsx`
- Create: `src/components/auth/LoginForm.tsx`

- [ ] **Step 1: Write `src/lib/auth.ts`**

Note: no `'use server'` directive here — this is a utility module imported by both Server Actions and middleware. Only Server Action files carry `'use server'`.

```typescript
import { cookies } from 'next/headers'

const COOKIE_NAME = 'tasktracker_auth'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7 // 7 days

export function verifyPassword(input: string): boolean {
  return input === process.env.SITE_PASSWORD
}

export function setAuthCookie() {
  cookies().set(COOKIE_NAME, 'true', {
    httpOnly: true,
    sameSite: 'strict',
    maxAge: COOKIE_MAX_AGE,
    path: '/',
  })
}

export function getAuthCookie(): string | undefined {
  return cookies().get(COOKIE_NAME)?.value
}
```

- [ ] **Step 2: Write `src/actions/auth.ts`**

```typescript
'use server'
import { redirect } from 'next/navigation'
import { verifyPassword, setAuthCookie } from '@/lib/auth'

export async function loginAction(formData: FormData) {
  const password = formData.get('password')?.toString() ?? ''
  if (!verifyPassword(password)) {
    return { error: 'Incorrect password' }
  }
  setAuthCookie()
  redirect('/dashboard')
}
```

- [ ] **Step 3: Write `src/middleware.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const authCookie = request.cookies.get('tasktracker_auth')
  if (!authCookie || authCookie.value !== 'true') {
    return NextResponse.redirect(new URL('/', request.url))
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/category/:path*'],
}
```

- [ ] **Step 4: Write `src/components/auth/LoginForm.tsx`**

```tsx
'use client'
import { useActionState } from 'react'
import { loginAction } from '@/actions/auth'

const initialState = { error: '' }

export default function LoginForm() {
  const [state, formAction] = useActionState(loginAction, initialState)
  return (
    <form action={formAction} className="flex flex-col items-center gap-4">
      <h1 className="text-2xl font-bold text-emerald-300">TaskTracker</h1>
      <p className="text-sm text-emerald-900">Enter your access code</p>
      <input
        type="password"
        name="password"
        autoComplete="current-password"
        placeholder="• • • •"
        className="w-48 text-center text-xl tracking-widest bg-surface border border-border rounded-lg px-4 py-3 text-emerald-300 focus:outline-none focus:border-cat-social"
      />
      {state?.error && <p className="text-red-400 text-sm">{state.error}</p>}
      <button
        type="submit"
        className="px-8 py-2 bg-cat-social text-black font-semibold rounded-lg hover:opacity-90 transition"
      >
        Enter
      </button>
    </form>
  )
}
```

- [ ] **Step 5: Write `src/app/page.tsx`**

```tsx
import LoginForm from '@/components/auth/LoginForm'

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background">
      <LoginForm />
    </main>
  )
}
```

- [ ] **Step 6: Create stub dashboard page to test redirect**

Create `src/app/dashboard/page.tsx` temporarily:

```tsx
export default function DashboardPage() {
  return <p className="p-8 text-emerald-300">Dashboard coming soon</p>
}
```

- [ ] **Step 7: Add `.env.local` entry**

```
SITE_PASSWORD=8181
```

- [ ] **Step 8: Test auth flow manually**

```bash
npm run dev
```

1. Navigate to `http://localhost:3000/dashboard` → should redirect to `/`
2. Submit wrong password → should show "Incorrect password"
3. Submit `8181` → should redirect to `/dashboard` and show stub text
4. Refresh `/dashboard` → should stay on dashboard (cookie persists)

- [ ] **Step 9: Commit**

```bash
git add src/middleware.ts src/lib/auth.ts src/actions/auth.ts src/app/page.tsx src/components/
git commit -m "feat: password gate auth with server action and HttpOnly cookie"
```

---

## Task 5: App Shell (Topbar + Sidebar)

**Files:**
- Create: `src/app/dashboard/layout.tsx`
- Create: `src/components/layout/AppShell.tsx`
- Create: `src/components/layout/TopBar.tsx`
- Create: `src/components/layout/DaysRemainingBadge.tsx`
- Create: `src/components/layout/Sidebar.tsx`
- Create: `src/components/layout/SidebarStats.tsx`
- Create: `src/components/layout/CategoryNav.tsx`

- [ ] **Step 1: Write `src/components/layout/DaysRemainingBadge.tsx`**

```tsx
import { daysUntilCourseEnd } from '@/lib/date-utils'

export default function DaysRemainingBadge() {
  const days = daysUntilCourseEnd()
  return (
    <span className="text-xs text-amber-400 bg-amber-950 border border-amber-900 rounded px-2 py-1">
      ⚡ {days} days left
    </span>
  )
}
```

- [ ] **Step 2: Write `src/components/layout/TopBar.tsx`**

```tsx
import DaysRemainingBadge from './DaysRemainingBadge'

export default function TopBar() {
  const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  return (
    <header className="flex items-center gap-3 px-5 py-3 bg-surface border-b border-border">
      <div className="w-2.5 h-2.5 rounded-full bg-cat-social shadow-[0_0_8px_#10b981]" />
      <span className="font-bold text-emerald-100 tracking-tight">TaskTracker</span>
      <div className="ml-auto flex items-center gap-3">
        <span className="text-xs text-zinc-600 border border-border rounded px-2 py-1">{today}</span>
        <DaysRemainingBadge />
      </div>
    </header>
  )
}
```

- [ ] **Step 3: Write `src/components/layout/SidebarStats.tsx`**

```tsx
import type { SidebarStats } from '@/types/app'

const STATS: { key: keyof SidebarStats; label: string; colour: string }[] = [
  { key: 'recurringActive', label: 'Recurring',      colour: '#14b8a6' },
  { key: 'dueThisWeek',     label: 'Due this week',  colour: '#f59e0b' },
  { key: 'upcoming',        label: 'Upcoming',        colour: '#6ee7b7' },
  { key: 'overdue',         label: 'Overdue',         colour: '#ef4444' },
  { key: 'inProgress',      label: 'In progress',     colour: '#6366f1' },
  { key: 'completed',       label: 'Completed',       colour: '#a3e635' },
]

export default function SidebarStats({ stats }: { stats: SidebarStats }) {
  return (
    <div className="mb-5">
      <p className="text-[9px] uppercase tracking-widest text-emerald-950 font-semibold px-1 mb-2">Overview</p>
      {STATS.map(({ key, label, colour }) => (
        <div key={key} className="flex items-center justify-between px-2 py-1.5 rounded-md hover:bg-surface">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: colour }} />
            <span className="text-xs text-emerald-800">{label}</span>
          </div>
          <span className="text-sm font-bold" style={{ color: colour }}>{stats[key]}</span>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 4: Write `src/components/layout/CategoryNav.tsx`**

```tsx
'use client'
import { usePathname, useRouter } from 'next/navigation'
import type { Category } from '@/types/app'

export default function CategoryNav({ categories, taskCounts }: {
  categories: Category[]
  taskCounts: Record<string, number>
}) {
  const pathname = usePathname()
  const router = useRouter()

  const isActive = (slug: string | null) => {
    if (slug === null) return pathname.startsWith('/dashboard')
    return pathname === `/category/${slug}`
  }

  const nav = (slug: string | null) => {
    router.push(slug ? `/category/${slug}` : '/dashboard')
  }

  return (
    <div>
      <p className="text-[9px] uppercase tracking-widest text-emerald-950 font-semibold px-1 mb-2">Categories</p>
      {/* All Tasks */}
      <button
        onClick={() => nav(null)}
        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg mb-0.5 border text-left transition-all ${
          isActive(null)
            ? 'bg-emerald-950 border-cat-social'
            : 'border-transparent hover:bg-surface'
        }`}
      >
        <div className="w-2 h-2 rounded-full bg-cat-social" />
        <span className={`text-xs ${isActive(null) ? 'text-emerald-300' : 'text-emerald-800'}`}>All Tasks</span>
      </button>
      {categories.map(cat => (
        <button
          key={cat.slug}
          onClick={() => nav(cat.slug)}
          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg mb-0.5 border text-left transition-all ${
            isActive(cat.slug)
              ? 'border opacity-100'
              : 'border-transparent hover:bg-surface'
          }`}
          style={isActive(cat.slug)
            ? { background: `${cat.colour}15`, borderColor: cat.colour }
            : undefined}
        >
          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: cat.colour }} />
          <span className={`text-xs flex-1 leading-tight ${isActive(cat.slug) ? 'text-emerald-200' : 'text-emerald-800'}`}>
            {cat.name}
          </span>
          {taskCounts[cat.id] !== undefined && (
            <span className="text-[10px] text-emerald-950 bg-border rounded px-1">
              {taskCounts[cat.id]}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}
```

- [ ] **Step 5: Write `src/components/layout/Sidebar.tsx`**

```tsx
import type { Category, SidebarStats } from '@/types/app'
import SidebarStats from './SidebarStats'
import CategoryNav from './CategoryNav'

export default function Sidebar({ stats, categories, taskCounts }: {
  stats: SidebarStats
  categories: Category[]
  taskCounts: Record<string, number>
}) {
  return (
    <aside className="w-[200px] flex-shrink-0 bg-[#0b140b] border-r border-border flex flex-col py-4 overflow-y-auto">
      <div className="px-3">
        <SidebarStats stats={stats} />
        <CategoryNav categories={categories} taskCounts={taskCounts} />
      </div>
    </aside>
  )
}
```

- [ ] **Step 6: Write `src/components/layout/AppShell.tsx`**

```tsx
import type { Category, SidebarStats } from '@/types/app'
import TopBar from './TopBar'
import Sidebar from './Sidebar'

export default function AppShell({ children, stats, categories, taskCounts }: {
  children: React.ReactNode
  stats: SidebarStats
  categories: Category[]
  taskCounts: Record<string, number>
}) {
  return (
    <div className="flex flex-col h-screen bg-background">
      <TopBar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar stats={stats} categories={categories} taskCounts={taskCounts} />
        <main className="flex-1 overflow-hidden flex flex-col">
          {children}
        </main>
      </div>
    </div>
  )
}
```

- [ ] **Step 7: Write `src/app/dashboard/layout.tsx`**

```tsx
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { computeSidebarStats } from '@/lib/stats'
import AppShell from '@/components/layout/AppShell'
import type { Task, Category } from '@/types/app'
import type { DbTask, DbCategory } from '@/types/database'

function mapTask(t: DbTask): Task {
  return {
    id: t.id, categoryId: t.category_id, title: t.title,
    description: t.description, module: t.module,
    startDate: t.start_date, dueDate: t.due_date, dueTime: t.due_time,
    progress: t.progress, notes: t.notes, assignmentDetails: t.assignment_details,
    isRecurring: t.is_recurring, isTemplate: t.is_template, parentTaskId: t.parent_task_id,
  }
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createSupabaseServerClient()

  const [{ data: rawTasks }, { data: rawCats }] = await Promise.all([
    supabase.from('tasks').select('*').eq('is_template', false).order('due_date'),
    supabase.from('categories').select('*').order('name'),
  ])

  const tasks = (rawTasks ?? []).map(mapTask)
  const categories: Category[] = (rawCats ?? []).map((c: DbCategory) => ({
    id: c.id, name: c.name, slug: c.slug, colour: c.colour, description: c.description,
  }))

  const stats = computeSidebarStats(tasks)
  const taskCounts = Object.fromEntries(
    categories.map(cat => [cat.id, tasks.filter(t => t.categoryId === cat.id).length])
  )

  return (
    <AppShell stats={stats} categories={categories} taskCounts={taskCounts}>
      {children}
    </AppShell>
  )
}
```

- [ ] **Step 8: Test manually**

```bash
npm run dev
```

Log in with `8181` → should see the full dark shell with topbar (date + days badge) and sidebar with real stats and category list.

- [ ] **Step 9: Commit**

```bash
git add src/components/layout/ src/app/dashboard/layout.tsx
git commit -m "feat: app shell with topbar, sidebar stats, and category nav"
```

---

## Task 6: Category Stub Routes

**Files:**
- Create: `src/app/category/[slug]/layout.tsx`
- Create: `src/app/category/[slug]/page.tsx` (stub)

- [ ] **Step 1: Write `src/app/category/[slug]/layout.tsx`**

```tsx
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'

export default async function CategoryLayout({ children, params }: {
  children: React.ReactNode
  params: { slug: string }
}) {
  const supabase = createSupabaseServerClient()
  const { data } = await supabase.from('categories').select('*').eq('slug', params.slug).single()
  if (!data) notFound()
  return <>{children}</>
}
```

- [ ] **Step 2: Write stub `src/app/category/[slug]/page.tsx`**

```tsx
export default function CategoryPage({ params }: { params: { slug: string } }) {
  return <p className="p-8 text-emerald-300">Category: {params.slug} — coming soon</p>
}
```

- [ ] **Step 3: Test category navigation**

Click each category in the sidebar — URL should change. Clicking "All Tasks" returns to `/dashboard`. Active item highlights in correct category colour.

- [ ] **Step 4: Commit**

```bash
git add src/app/category/
git commit -m "feat: category route stubs and nav"
```

---

## Task 7: Timeline Core (Axis + Zoom)

**Files:**
- Create: `src/components/timeline/ZoomControls.tsx`
- Create: `src/components/timeline/TimelineAxis.tsx`
- Create: `src/components/timeline/TimelineStem.tsx`
- Create: `src/components/timeline/Timeline.tsx`
- Modify: `src/app/dashboard/page.tsx`

- [ ] **Step 1: Write `src/components/timeline/ZoomControls.tsx`**

```tsx
'use client'
interface Props { zoom: number; onZoom: (z: number) => void }

export default function ZoomControls({ zoom, onZoom }: Props) {
  const clamp = (v: number) => Math.min(300, Math.max(60, v))
  return (
    <div className="flex items-center gap-2 ml-auto">
      <button
        onClick={() => onZoom(clamp(zoom - 10))}
        className="w-6 h-6 flex items-center justify-center bg-surface border border-border rounded text-emerald-800 hover:border-cat-social hover:text-cat-social text-sm"
      >−</button>
      <input
        type="range" min={60} max={300} value={zoom}
        onChange={e => onZoom(parseInt(e.target.value))}
        className="w-24 accent-cat-social"
      />
      <button
        onClick={() => onZoom(clamp(zoom + 10))}
        className="w-6 h-6 flex items-center justify-center bg-surface border border-border rounded text-emerald-800 hover:border-cat-social hover:text-cat-social text-sm"
      >+</button>
      <span className="text-[11px] text-emerald-950 w-9 text-center">{zoom}%</span>
    </div>
  )
}
```

- [ ] **Step 2: Write `src/components/timeline/TimelineStem.tsx`**

```tsx
interface Props { position: 'above' | 'below'; colour: string }

export default function TimelineStem({ position, colour }: Props) {
  return (
    <div
      className="w-px h-5 flex-shrink-0"
      style={{
        background: position === 'above'
          ? `linear-gradient(to top, ${colour}60, transparent)`
          : `linear-gradient(to bottom, ${colour}60, transparent)`,
      }}
    />
  )
}
```

- [ ] **Step 3: Write `src/components/timeline/TimelineAxis.tsx`**

```tsx
import { COURSE_START, COURSE_END } from '@/lib/constants'

const TOTAL_DAYS = Math.ceil(
  (COURSE_END.getTime() - COURSE_START.getTime()) / (1000 * 60 * 60 * 24)
)

export function dateToPercent(dateStr: string): number {
  const date = new Date(dateStr)
  const elapsed = Math.ceil((date.getTime() - COURSE_START.getTime()) / (1000 * 60 * 60 * 24))
  return Math.max(0, Math.min(100, (elapsed / TOTAL_DAYS) * 100))
}

export function todayPercent(): number {
  const today = new Date().toISOString().slice(0, 10)
  return dateToPercent(today)
}

const TICK_DATES = [
  { label: '21 Mar', date: '2026-03-21' },
  { label: '7 Apr',  date: '2026-04-07' },
  { label: '24 Apr', date: '2026-04-24' },
  { label: '9 May',  date: '2026-05-09' },
  { label: '14 May', date: '2026-05-14' },
]

interface Props { accent?: string }

export default function TimelineAxis({ accent = '#10b981' }: Props) {
  const todayPct = todayPercent()
  return (
    <div className="relative h-0.5 mx-5 my-0" style={{
      background: `linear-gradient(to right, #1a2e1a, ${accent} 10%, ${accent} 90%, #1a2e1a)`
    }}>
      {/* Today marker */}
      <div
        className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10"
        style={{ left: `${todayPct}%` }}
      >
        <div className="w-px h-10 -translate-y-5" style={{ background: `${accent}80` }} />
        <span className="text-[9px] uppercase tracking-wide mt-1" style={{ color: accent }}>Today</span>
      </div>
      {/* Ticks */}
      {TICK_DATES.map(tick => (
        <div
          key={tick.date}
          className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
          style={{ left: `${dateToPercent(tick.date)}%` }}
        >
          <div className="w-px h-3 bg-border" />
          <span className="text-[9px] text-emerald-950 mt-1.5 whitespace-nowrap">{tick.label}</span>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 4: Write `src/components/timeline/Timeline.tsx` (axis + zoom only, no cards yet)**

```tsx
'use client'
import { useEffect, useRef, useState } from 'react'
import TimelineAxis from './TimelineAxis'
import ZoomControls from './ZoomControls'

const BASE_WIDTH = 900

interface Props {
  accent?: string
  title?: string
  children?: React.ReactNode // cards injected in Task 8
}

export default function Timeline({ accent = '#10b981', title = 'All Tasks — Timeline', children }: Props) {
  const [zoom, setZoom] = useState(100)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const handler = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault()
        setZoom(z => Math.min(300, Math.max(60, z + (e.deltaY < 0 ? 10 : -10))))
      }
    }
    el.addEventListener('wheel', handler, { passive: false })
    return () => el.removeEventListener('wheel', handler)
  }, [])

  // Reset zoom on unmount (navigation)
  useEffect(() => { return () => setZoom(100) }, [])

  const innerWidth = (BASE_WIDTH * zoom) / 100

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-3 border-b border-border">
        <span className="text-[11px] uppercase tracking-widest text-emerald-900 font-semibold">{title}</span>
        <span className="text-[11px] text-emerald-950">Mar 21 → May 14 · 54 days</span>
        <ZoomControls zoom={zoom} onZoom={setZoom} />
      </div>
      {/* Scroll container */}
      <div ref={containerRef} className="flex-1 overflow-x-auto overflow-y-hidden px-5 pb-5 flex items-center">
        <div className="relative" style={{ minWidth: `${innerWidth}px`, width: '100%', paddingTop: '100px', paddingBottom: '100px' }}>
          <TimelineAxis accent={accent} />
          {children}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Update `src/app/dashboard/page.tsx` to render the Timeline**

```tsx
import Timeline from '@/components/timeline/Timeline'

export default function DashboardPage() {
  return <Timeline title="All Tasks — Timeline" />
}
```

- [ ] **Step 6: Test zoom manually**

Load `/dashboard`. The timeline axis should be visible. − / + buttons should change the `100%` label and widen/narrow the inner container. Ctrl+scroll on the timeline should zoom.

- [ ] **Step 7: Commit**

```bash
git add src/components/timeline/
git commit -m "feat: timeline axis with zoom controls and today marker"
```

---

## Task 8: Timeline Cards

**Files:**
- Create: `src/components/timeline/TimelineCard.tsx`
- Modify: `src/components/timeline/Timeline.tsx`
- Modify: `src/app/dashboard/page.tsx`

- [ ] **Step 1: Write `src/lib/timeline.ts`**

```typescript
export function assignCardPositions<T extends { id: string }>(
  tasks: T[]
): Array<T & { position: 'above' | 'below' }> {
  return tasks.map((task, i) => ({ ...task, position: i % 2 === 0 ? 'above' : 'below' as const }))
}
```

- [ ] **Step 2: Write failing test for card placement**

Create `src/__tests__/timeline-placement.test.ts`:

```typescript
import { assignCardPositions } from '@/lib/timeline'

test('even-indexed cards go above, odd below', () => {
  const tasks = [{ id: 'a' }, { id: 'b' }, { id: 'c' }]
  const result = assignCardPositions(tasks)
  expect(result[0].position).toBe('above')
  expect(result[1].position).toBe('below')
  expect(result[2].position).toBe('above')
})

test('single task goes above', () => {
  const result = assignCardPositions([{ id: 'x' }])
  expect(result[0].position).toBe('above')
})

test('empty array returns empty', () => {
  expect(assignCardPositions([])).toEqual([])
})
```

- [ ] **Step 3: Run — verify PASS**

```bash
npx jest src/__tests__/timeline-placement.test.ts
```

Expected: All 3 tests PASS

- [ ] **Step 6: Write `src/components/timeline/TimelineCard.tsx`**

```tsx
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
            className="mb-1 bg-surface border border-border rounded-lg p-2.5 w-36 shadow-lg transition-all group-hover:shadow-[0_0_16px_rgba(0,0,0,0.6)] group-hover:border-opacity-100"
            style={{ '--hover-border': colour } as React.CSSProperties}
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
```

- [ ] **Step 7: Update `Timeline.tsx` to accept and render tasks**

Add `tasks` and `categoryColourMap` props:

```tsx
// Add to Timeline props:
interface Props {
  tasks?: Task[]
  categoryColourMap?: Record<string, string>
  accent?: string
  title?: string
}
```

Inside the inner div, after `<TimelineAxis>`, render cards:

```tsx
import { assignCardPositions } from '@/lib/timeline'
import TimelineCard from './TimelineCard'
// ...
const positioned = assignCardPositions(tasks ?? [])
// In JSX after TimelineAxis:
{positioned.map(({ position, ...task }) => (
  <TimelineCard
    key={task.id}
    task={task}
    position={position}
    colour={categoryColourMap?.[task.categoryId ?? ''] ?? '#10b981'}
  />
))}
```

- [ ] **Step 8: Update `src/app/dashboard/page.tsx` to pass tasks**

```tsx
import { createSupabaseServerClient } from '@/lib/supabase/server'
import Timeline from '@/components/timeline/Timeline'
import { CATEGORY_COLOURS } from '@/lib/constants'
import type { DbTask, DbCategory } from '@/types/database'
import type { Task } from '@/types/app'

function mapTask(t: DbTask): Task { /* same as in layout.tsx */ }

export default async function DashboardPage({ searchParams }: { searchParams: { task?: string } }) {
  const supabase = createSupabaseServerClient()
  const [{ data: rawTasks }, { data: rawCats }] = await Promise.all([
    supabase.from('tasks').select('*').eq('is_template', false).order('due_date'),
    supabase.from('categories').select('id, slug').order('name'),
  ])
  const tasks = (rawTasks ?? []).map(mapTask)
  const colourMap = Object.fromEntries(
    (rawCats ?? []).map((c: DbCategory) => [c.id, CATEGORY_COLOURS[c.slug] ?? '#10b981'])
  )
  return <Timeline tasks={tasks} categoryColourMap={colourMap} title="All Tasks — Timeline" />
}
```

- [ ] **Step 9: Test manually**

Load `/dashboard`. All non-template tasks should appear as floating cards alternating above/below the timeline axis. Cards should have correct category colours. Zoom should widen/narrow the spacing.

- [ ] **Step 10: Commit**

```bash
git add src/components/timeline/TimelineCard.tsx src/lib/timeline.ts src/__tests__/timeline-placement.test.ts
git commit -m "feat: timeline task cards with alternating above/below placement"
```

---

## Task 9: Task Detail Panel (Read-Only)

**Files:**
- Create: `src/components/task-panel/TaskPanelHeader.tsx`
- Create: `src/components/task-panel/TaskPanelDates.tsx`
- Create: `src/components/task-panel/TaskPanelDetails.tsx`
- Create: `src/components/task-panel/TaskPanel.tsx`
- Modify: `src/app/dashboard/page.tsx`

- [ ] **Step 1: Write `src/components/task-panel/TaskPanelHeader.tsx`**

```tsx
interface Props {
  title: string
  category: string | null
  module: string | null
  colour: string
  onClose: () => void
}

export default function TaskPanelHeader({ title, category, module: mod, colour, onClose }: Props) {
  return (
    <div className="flex items-start gap-3 p-5 border-b border-border">
      <div className="w-0.5 h-10 rounded-full flex-shrink-0 mt-0.5" style={{ background: colour }} />
      <div className="flex-1">
        <h2 className="text-base font-bold text-emerald-100 leading-tight mb-2">{title}</h2>
        <div className="flex gap-2 flex-wrap">
          {category && (
            <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: `${colour}20`, color: colour }}>
              {category}
            </span>
          )}
          {mod && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-300">
              {mod}
            </span>
          )}
        </div>
      </div>
      <button onClick={onClose} className="text-emerald-950 hover:text-emerald-300 text-lg leading-none pt-0.5">✕</button>
    </div>
  )
}
```

- [ ] **Step 2: Write `src/components/task-panel/TaskPanelDates.tsx`**

```tsx
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
```

- [ ] **Step 3: Write `src/components/task-panel/TaskPanelDetails.tsx`**

```tsx
interface AssignmentDetails {
  weighting?: string
  format?: string
  brief?: string
  requirements?: string[]
}

export default function TaskPanelDetails({ details }: { details: AssignmentDetails | null }) {
  if (!details || (!details.weighting && !details.brief)) {
    return (
      <div className="px-5 py-4 border-b border-border">
        <p className="text-[10px] uppercase tracking-widest text-emerald-950 font-semibold mb-3">
          Assignment Details <span className="normal-case tracking-normal text-emerald-950 font-normal ml-1 border border-border rounded px-1.5 py-0.5">from module handbook</span>
        </p>
        <p className="text-xs text-emerald-950 italic">Details will be added after handbook review.</p>
      </div>
    )
  }
  return (
    <div className="px-5 py-4 border-b border-border">
      <p className="text-[10px] uppercase tracking-widest text-emerald-950 font-semibold mb-3">
        Assignment Details <span className="normal-case tracking-normal text-emerald-950 font-normal ml-1 border border-border rounded px-1.5 py-0.5">from module handbook</span>
      </p>
      <div className="bg-surface border border-border rounded-lg overflow-hidden">
        {(details.weighting || details.format) && (
          <div className="grid grid-cols-2 border-b border-border">
            {details.weighting && (
              <div className="p-3 border-r border-border">
                <p className="text-[9px] text-emerald-950 uppercase tracking-wide mb-1">Weighting</p>
                <p className="text-lg font-bold text-cat-social">{details.weighting}</p>
              </div>
            )}
            {details.format && (
              <div className="p-3">
                <p className="text-[9px] text-emerald-950 uppercase tracking-wide mb-1">Format</p>
                <p className="text-sm font-semibold text-emerald-300">{details.format}</p>
              </div>
            )}
          </div>
        )}
        {details.brief && (
          <div className="p-3 border-b border-border">
            <p className="text-[9px] text-emerald-950 uppercase tracking-wide mb-2">Brief</p>
            <p className="text-xs text-emerald-400 leading-relaxed">{details.brief}</p>
          </div>
        )}
        {details.requirements && details.requirements.length > 0 && (
          <div className="p-3">
            <p className="text-[9px] text-emerald-950 uppercase tracking-wide mb-2">Key Requirements</p>
            <ul className="flex flex-col gap-1.5">
              {details.requirements.map((r, i) => (
                <li key={i} className="flex gap-2 text-xs text-emerald-800">
                  <span className="text-cat-social flex-shrink-0">›</span>{r}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Write `src/components/task-panel/TaskPanel.tsx`**

```tsx
'use client'
import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import type { Task, Category } from '@/types/app'
import { CATEGORY_COLOURS } from '@/lib/constants'
import TaskPanelHeader from './TaskPanelHeader'
import TaskPanelDates from './TaskPanelDates'
import TaskPanelDetails from './TaskPanelDetails'

interface Props {
  task: Task
  category: Category | null
}

export default function TaskPanel({ task, category }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const colour = category ? CATEGORY_COLOURS[category.slug] ?? '#10b981' : '#10b981'

  const close = () => router.push(pathname)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [pathname])

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" onClick={close} />
      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-[420px] bg-[#0b140b] border-l border-border z-50 overflow-y-auto shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
        <TaskPanelHeader
          title={task.title}
          category={category?.name ?? null}
          module={task.module}
          colour={colour}
          onClose={close}
        />
        <TaskPanelDates
          startDate={task.startDate}
          dueDate={task.dueDate}
          dueTime={task.dueTime}
        />
        <TaskPanelDetails details={task.assignmentDetails} />
      </div>
    </>
  )
}
```

- [ ] **Step 5: Update `src/app/dashboard/page.tsx` to handle `?task=` param**

```tsx
// Add to DashboardPage:
export default async function DashboardPage({ searchParams }: { searchParams: { task?: string } }) {
  // ... existing task/colourMap fetching ...

  let activeTask: Task | null = null
  let activeCategory: Category | null = null

  if (searchParams.task) {
    const { data: rawCatsForPanel } = await supabase.from('categories').select('*')
    const categories = (rawCatsForPanel ?? []).map(mapCategory)
    activeTask = tasks.find(t => t.id === searchParams.task) ?? null
    activeCategory = categories.find(c => c.id === activeTask?.categoryId) ?? null
  }

  return (
    <>
      <Timeline tasks={tasks} categoryColourMap={colourMap} title="All Tasks — Timeline" />
      {activeTask && <TaskPanel task={activeTask} category={activeCategory} />}
    </>
  )
}
```

- [ ] **Step 6: Test task panel manually**

Click any task card → URL should gain `?task=<id>`, panel slides in from right with correct title, dates, time-remaining colour, and "Details will be added after handbook review." placeholder. Press Escape or click the backdrop → panel closes, `?task` removed from URL.

- [ ] **Step 7: Commit**

```bash
git add src/components/task-panel/
git commit -m "feat: read-only task detail panel with dates and assignment details"
```

---

## Task 10: Progress & Notes

**Files:**
- Create: `src/actions/tasks.ts`
- Create: `src/components/task-panel/TaskPanelProgress.tsx`
- Create: `src/components/task-panel/TaskPanelNotes.tsx`
- Modify: `src/components/task-panel/TaskPanel.tsx`

- [ ] **Step 1: Write `src/actions/tasks.ts`**

```typescript
'use server'
import { revalidatePath } from 'next/cache'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function updateProgressAction(taskId: string, progress: number) {
  const supabase = createSupabaseServerClient()
  const { error } = await supabase.from('tasks').update({ progress }).eq('id', taskId)
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard')
  revalidatePath('/category', 'layout')
}

export async function updateNotesAction(taskId: string, notes: string) {
  const supabase = createSupabaseServerClient()
  const { error } = await supabase.from('tasks').update({ notes }).eq('id', taskId)
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard')
  revalidatePath('/category', 'layout')
}
```

- [ ] **Step 2: Write `src/components/task-panel/TaskPanelProgress.tsx`**

```tsx
'use client'
import { useState, useTransition } from 'react'
import { updateProgressAction } from '@/actions/tasks'
import { PROGRESS_VALUES } from '@/types/app'
import type { ProgressLabel } from '@/types/app'

const LABELS = Object.keys(PROGRESS_VALUES) as ProgressLabel[]

function labelFor(progress: number): ProgressLabel | null {
  return (LABELS.find(l => PROGRESS_VALUES[l] === progress) ?? null)
}

export default function TaskPanelProgress({ taskId, initial, colour }: {
  taskId: string
  initial: number
  colour: string
}) {
  const [progress, setProgress] = useState(initial)
  const [isPending, startTransition] = useTransition()

  const pick = (label: ProgressLabel) => {
    const val = PROGRESS_VALUES[label]
    setProgress(val) // optimistic
    startTransition(() => updateProgressAction(taskId, val))
  }

  return (
    <div className="px-5 py-4 border-b border-border">
      <p className="text-[10px] uppercase tracking-widest text-emerald-950 font-semibold mb-3">Progress</p>
      <div className="flex items-center gap-3 mb-3">
        <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-300" style={{ width: `${progress}%`, background: colour }} />
        </div>
        <span className="text-sm font-bold" style={{ color: colour }}>{progress}%</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {LABELS.map(label => (
          <button
            key={label}
            onClick={() => pick(label)}
            disabled={isPending}
            className={`text-[11px] px-2.5 py-1 rounded border transition-all ${
              labelFor(progress) === label
                ? 'border-cat-social text-cat-social bg-emerald-950'
                : 'border-border text-emerald-900 bg-surface hover:border-cat-social hover:text-emerald-300'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Write `src/components/task-panel/TaskPanelNotes.tsx`**

```tsx
'use client'
import { useState, useTransition } from 'react'
import { updateNotesAction } from '@/actions/tasks'

export default function TaskPanelNotes({ taskId, initial }: { taskId: string; initial: string | null }) {
  const [notes, setNotes] = useState(initial ?? '')
  const [saved, setSaved] = useState(false)
  const [isPending, startTransition] = useTransition()

  const save = () => {
    startTransition(async () => {
      await updateNotesAction(taskId, notes)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    })
  }

  return (
    <div className="px-5 py-4 border-b border-border">
      <p className="text-[10px] uppercase tracking-widest text-emerald-950 font-semibold mb-3">Notes</p>
      <textarea
        value={notes}
        onChange={e => { setNotes(e.target.value); setSaved(false) }}
        placeholder="Add your own notes here — key points, reminders, links..."
        className="w-full bg-surface border border-border rounded-lg px-3 py-2.5 text-xs text-emerald-300 leading-relaxed resize-y min-h-[90px] focus:outline-none focus:border-cat-social placeholder:text-emerald-950"
      />
      <button
        onClick={save}
        disabled={isPending}
        className="mt-2 text-[11px] px-3.5 py-1.5 rounded border border-cat-social text-cat-social bg-emerald-950 hover:bg-cat-social hover:text-black transition-all disabled:opacity-50"
      >
        {saved ? 'Saved ✓' : isPending ? 'Saving…' : 'Save notes'}
      </button>
    </div>
  )
}
```

- [ ] **Step 4: Add Progress and Notes to `TaskPanel.tsx`**

Import and render `TaskPanelProgress` and `TaskPanelNotes` after `TaskPanelDetails`:

```tsx
import TaskPanelProgress from './TaskPanelProgress'
import TaskPanelNotes from './TaskPanelNotes'
// In JSX:
<TaskPanelProgress taskId={task.id} initial={task.progress} colour={colour} />
<TaskPanelNotes taskId={task.id} initial={task.notes} />
```

- [ ] **Step 5: Test progress and notes**

1. Open a task panel. Click "Halfway" → progress bar updates to 50% immediately. Refresh → still 50%.
2. Type notes, click Save → "Saved ✓" shows briefly. Refresh → notes persist.
3. Verify sidebar stats update (e.g. "In progress" count increases).

- [ ] **Step 6: Commit**

```bash
git add src/actions/tasks.ts src/components/task-panel/TaskPanelProgress.tsx src/components/task-panel/TaskPanelNotes.tsx
git commit -m "feat: task progress quick-pick and notes with server actions"
```

---

## Task 11: File Attachments

**Files:**
- Create: `src/actions/attachments.ts`
- Create: `src/components/task-panel/TaskPanelAttachments.tsx`
- Modify: `src/components/task-panel/TaskPanel.tsx`

- [ ] **Step 1: Create Supabase Storage bucket**

In Supabase dashboard → Storage → New bucket:
- Name: `task-attachments`
- Public: **No** (private)
- File size limit: 10 MB

Set bucket policy to allow all operations for the anon role (fine for personal tool):

```sql
-- In Supabase SQL Editor:
CREATE POLICY "Allow all" ON storage.objects FOR ALL USING (bucket_id = 'task-attachments');
```

- [ ] **Step 2: Write `src/actions/attachments.ts`**

```typescript
'use server'
import { revalidatePath } from 'next/cache'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function deleteAttachmentAction(attachmentId: string, storagePath: string) {
  const supabase = createSupabaseServerClient()
  await supabase.storage.from('task-attachments').remove([storagePath])
  const { error } = await supabase.from('attachments').delete().eq('id', attachmentId)
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard')
  revalidatePath('/category', 'layout')
}
```

- [ ] **Step 3: Write `src/components/task-panel/TaskPanelAttachments.tsx`**

```tsx
'use client'
import { useState, useRef, useTransition } from 'react'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { deleteAttachmentAction } from '@/actions/attachments'
import type { Attachment } from '@/types/app'

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function TaskPanelAttachments({ taskId, initial }: {
  taskId: string
  initial: Attachment[]
}) {
  const [attachments, setAttachments] = useState(initial)
  const [uploading, setUploading] = useState(false)
  const [isPending, startTransition] = useTransition()
  const inputRef = useRef<HTMLInputElement>(null)

  const upload = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setUploading(true)
    const supabase = getSupabaseBrowserClient()
    for (const file of Array.from(files)) {
      const path = `${taskId}/${Date.now()}-${file.name}`
      const { error: storageErr } = await supabase.storage.from('task-attachments').upload(path, file)
      if (storageErr) { alert(`Upload failed: ${storageErr.message}`); continue }
      const { data, error: dbErr } = await supabase.from('attachments').insert({
        task_id: taskId,
        file_name: file.name,
        storage_path: path,
        file_size: file.size,
      }).select().single()
      if (dbErr) { alert(`DB insert failed: ${dbErr.message}`); continue }
      setAttachments(prev => [...prev, {
        id: data.id, taskId, fileName: file.name,
        storagePath: path, fileSize: file.size, uploadedAt: data.uploaded_at,
      }])
    }
    setUploading(false)
  }

  const remove = (attachment: Attachment) => {
    setAttachments(prev => prev.filter(a => a.id !== attachment.id))
    startTransition(() => deleteAttachmentAction(attachment.id, attachment.storagePath))
  }

  return (
    <div className="px-5 py-4">
      <p className="text-[10px] uppercase tracking-widest text-emerald-950 font-semibold mb-3">Attachments</p>
      {attachments.length > 0 && (
        <div className="flex flex-col gap-1.5 mb-3">
          {attachments.map(att => (
            <div key={att.id} className="flex items-center gap-2 bg-surface border border-border rounded-lg px-3 py-2">
              <span className="text-sm">📄</span>
              <span className="text-[11px] text-emerald-300 flex-1 truncate">{att.fileName}</span>
              <span className="text-[10px] text-emerald-950 flex-shrink-0">{formatBytes(att.fileSize)}</span>
              <button
                onClick={() => remove(att)}
                disabled={isPending}
                className="text-emerald-950 hover:text-red-400 text-xs ml-1 disabled:opacity-50"
              >✕</button>
            </div>
          ))}
        </div>
      )}
      <div
        className="border border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-cat-social hover:bg-emerald-950 transition-all"
        onClick={() => inputRef.current?.click()}
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); upload(e.dataTransfer.files) }}
      >
        <p className="text-[11px] text-emerald-950">
          {uploading ? 'Uploading…' : <>Drop files here or <span className="text-cat-social">browse to upload</span></>}
        </p>
        <input ref={inputRef} type="file" multiple className="hidden" onChange={e => upload(e.target.files)} />
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Fetch attachments and wire into `TaskPanel.tsx`**

In `src/app/dashboard/page.tsx`, when `searchParams.task` is set, also fetch attachments:

```typescript
const { data: rawAttachments } = await supabase
  .from('attachments').select('*').eq('task_id', searchParams.task)
const attachments: Attachment[] = (rawAttachments ?? []).map(a => ({
  id: a.id, taskId: a.task_id, fileName: a.file_name,
  storagePath: a.storage_path, fileSize: a.file_size, uploadedAt: a.uploaded_at,
}))
```

Add `attachments` prop to `TaskPanel` and render `TaskPanelAttachments`:

```tsx
<TaskPanelAttachments taskId={task.id} initial={attachments} />
```

- [ ] **Step 5: Test file uploads**

1. Open a task panel
2. Drag a small file onto the upload zone → file appears in list with correct name and size
3. Refresh → file still listed (persists in DB)
4. Click ✕ → file removed from list and deleted from Supabase Storage
5. Check Supabase Storage bucket in dashboard → file path matches `{taskId}/{filename}` pattern

- [ ] **Step 6: Commit**

```bash
git add src/actions/attachments.ts src/components/task-panel/TaskPanelAttachments.tsx
git commit -m "feat: file attachments with Supabase Storage upload and delete"
```

---

## Task 12: Category View

**Files:**
- Create: `src/components/category/CategoryHeader.tsx`
- Create: `src/components/category/CategoryProgressBar.tsx`
- Create: `src/components/category/CategoryInsightCards.tsx`
- Modify: `src/app/category/[slug]/page.tsx`

- [ ] **Step 1: Write `src/components/category/CategoryHeader.tsx`**

```tsx
import { formatDueDate, daysUntil } from '@/lib/date-utils'
import type { Category } from '@/types/app'

export default function CategoryHeader({ category, taskCount, finalDueDate }: {
  category: Category
  taskCount: number
  finalDueDate: string | null
}) {
  const days = finalDueDate ? daysUntil(finalDueDate) : null
  return (
    <div className="flex items-center gap-4 px-6 py-4 bg-surface border-b border-border">
      <div className="w-3 h-3 rounded-full flex-shrink-0 shadow-lg" style={{ background: category.colour, boxShadow: `0 0 8px ${category.colour}80` }} />
      <div>
        <h1 className="text-lg font-bold" style={{ color: category.colour }}>{category.name}</h1>
        <p className="text-xs text-emerald-900">
          {taskCount} task{taskCount !== 1 ? 's' : ''}
          {finalDueDate && ` · final due ${formatDueDate(finalDueDate)}`}
          {days !== null && ` · ${days > 0 ? `${days} days away` : days === 0 ? 'due today' : `${Math.abs(days)}d overdue`}`}
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Write `src/components/category/CategoryProgressBar.tsx`**

```tsx
export default function CategoryProgressBar({ progress, colour }: { progress: number; colour: string }) {
  return (
    <div className="flex items-center gap-4 px-6 py-3 border-b border-border">
      <span className="text-[10px] uppercase tracking-widest text-emerald-950 font-semibold whitespace-nowrap">Category progress</span>
      <div className="flex-1 h-2 bg-border rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progress}%`, background: `linear-gradient(to right, ${colour}, ${colour}cc)` }} />
      </div>
      <span className="text-sm font-bold whitespace-nowrap" style={{ color: colour }}>{progress}%</span>
    </div>
  )
}
```

- [ ] **Step 3: Write `src/components/category/CategoryInsightCards.tsx`**

```tsx
import type { CategoryInsights } from '@/types/app'

export default function CategoryInsightCards({ insights, colour }: { insights: CategoryInsights; colour: string }) {
  const cards = [
    { label: 'Total Tasks',          value: insights.total,             colour: colour },
    { label: 'In Progress',          value: insights.inProgress,        colour: '#6366f1' },
    { label: 'Completed',            value: insights.completed,         colour: '#a3e635' },
    { label: 'Overdue',              value: insights.overdue,           colour: '#ef4444' },
    { label: 'Days Until Final Due', value: `${insights.daysUntilFinalDue}d`, colour: colour },
  ]
  return (
    <div className="flex gap-2.5 px-6 py-3 border-b border-border">
      {cards.map(card => (
        <div key={card.label} className="flex-1 bg-surface border border-border rounded-lg px-3 py-2.5">
          <div className="text-xl font-bold" style={{ color: card.colour }}>{card.value}</div>
          <div className="text-[9px] uppercase tracking-wide text-emerald-950">{card.label}</div>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 4: Write `src/app/category/[slug]/page.tsx`**

```tsx
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { computeCategoryInsights } from '@/lib/stats'
import { CATEGORY_COLOURS } from '@/lib/constants'
import Timeline from '@/components/timeline/Timeline'
import CategoryHeader from '@/components/category/CategoryHeader'
import CategoryProgressBar from '@/components/category/CategoryProgressBar'
import CategoryInsightCards from '@/components/category/CategoryInsightCards'
import TaskPanel from '@/components/task-panel/TaskPanel'
import type { Task, Category, Attachment } from '@/types/app'
import type { DbTask } from '@/types/database'

function mapTask(t: DbTask): Task { /* same as dashboard */ }

export default async function CategoryPage({ params, searchParams }: {
  params: { slug: string }
  searchParams: { task?: string }
}) {
  const supabase = createSupabaseServerClient()

  const { data: cat } = await supabase.from('categories').select('*').eq('slug', params.slug).single()
  if (!cat) notFound()

  const category: Category = { id: cat.id, name: cat.name, slug: cat.slug, colour: cat.colour, description: cat.description }
  const colour = CATEGORY_COLOURS[params.slug] ?? '#10b981'

  const { data: rawTasks } = await supabase
    .from('tasks').select('*')
    .eq('category_id', cat.id)
    .eq('is_template', false)
    .order('due_date')

  const tasks = (rawTasks ?? []).map(mapTask)
  const insights = computeCategoryInsights(tasks)
  const colourMap = Object.fromEntries(tasks.map(t => [t.id, colour]))

  let activeTask: Task | null = null
  let activeCategory: Category | null = null
  let attachments: Attachment[] = []

  if (searchParams.task) {
    activeTask = tasks.find(t => t.id === searchParams.task) ?? null
    if (!activeTask) {
      const { data: rawTask } = await supabase.from('tasks').select('*').eq('id', searchParams.task).single()
      if (rawTask) activeTask = mapTask(rawTask)
    }
    if (activeTask) {
      activeCategory = category
      const { data: rawAtt } = await supabase.from('attachments').select('*').eq('task_id', activeTask.id)
      attachments = (rawAtt ?? []).map(a => ({ id: a.id, taskId: a.task_id, fileName: a.file_name, storagePath: a.storage_path, fileSize: a.file_size, uploadedAt: a.uploaded_at }))
    }
  }

  return (
    <>
      <CategoryHeader category={category} taskCount={tasks.length} finalDueDate={insights.finalDueDate} />
      <CategoryProgressBar progress={insights.overallProgress} colour={colour} />
      <CategoryInsightCards insights={insights} colour={colour} />
      <Timeline tasks={tasks} categoryColourMap={colourMap} accent={colour} title={`${category.name} — Timeline`} />
      {activeTask && <TaskPanel task={activeTask} category={activeCategory} attachments={attachments} />}
    </>
  )
}
```

- [ ] **Step 5: Test category view**

Navigate to `/category/annual-report`. Should show amber header with "Annual Report", progress bar, 5 insight cards, and filtered timeline with only Annual Report tasks. Navigate to `/dashboard` → "All Portfolios Due" card should be visible (cross-category). Navigate to any category → "All Portfolios Due" should NOT appear.

- [ ] **Step 6: Commit**

```bash
git add src/components/category/ src/app/category/[slug]/page.tsx
git commit -m "feat: category view with header, progress bar, insights, and filtered timeline"
```

---

## Task 13: Polish & Edge Cases

**Files:** Review and fix across all files as needed.

- [ ] **Step 1: Cross-category task appears only on dashboard timeline**

In `src/app/dashboard/page.tsx`, ensure the query fetches tasks with `category_id = null` (Supabase returns them naturally — verify "All Portfolios Due" appears on the dashboard timeline).

- [ ] **Step 2: Verify recurring instances are independent**

Open two Training Session instances → set one to "Complete ✓". Confirm the other is unaffected. Confirm sidebar stats update.

- [ ] **Step 3: Add `slide-in-from-right` animation**

Ensure Tailwind has animation utilities. If not, add to `globals.css`:

```css
@keyframes slide-in-from-right {
  from { transform: translateX(100%); opacity: 0; }
  to   { transform: translateX(0);    opacity: 1; }
}
.animate-in { animation: slide-in-from-right 200ms ease-out; }
```

- [ ] **Step 4: Handle tasks with `dueDate` before course start or after course end on timeline**

In `dateToPercent`, already clamped to [0, 100] — verify no cards render off-screen.

- [ ] **Step 5: Run full type-check**

```bash
npx tsc --noEmit
```

Expected: zero errors.

- [ ] **Step 6: Run all tests**

```bash
npx jest
```

Expected: all tests pass.

- [ ] **Step 7: Manual walkthrough against spec**

Check every requirement in `docs/superpowers/specs/2026-03-21-tasktracker-design.md` is satisfied.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: polish, edge cases, and final spec conformance"
```

---

## Task 14: Vercel Deployment

- [ ] **Step 1: Push to GitHub**

```bash
git remote add origin https://github.com/<your-username>/tasktracker.git
git push -u origin main
```

- [ ] **Step 2: Add `.superpowers/` to `.gitignore`**

```
.superpowers/
.env.local
node_modules/
```

- [ ] **Step 3: Connect to Vercel**

1. Go to vercel.com → Import project → select GitHub repo
2. Framework: Next.js (auto-detected)

- [ ] **Step 4: Set environment variables in Vercel dashboard**

| Variable | Value |
|---|---|
| `SITE_PASSWORD` | `8181` |
| `NEXT_PUBLIC_SUPABASE_URL` | From Supabase Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | From Supabase Project Settings → API |

- [ ] **Step 5: Deploy**

Trigger deploy. Watch build logs for errors.

- [ ] **Step 6: Test production**

1. Visit the Vercel URL → login screen appears
2. Enter `8181` → redirected to dashboard
3. All tasks load on timeline
4. Click a task → panel opens
5. Update progress → persists on refresh
6. Upload a file → appears in attachments
7. Navigate to a category → filtered view correct

- [ ] **Step 7: Final commit**

```bash
git add .gitignore
git commit -m "chore: update gitignore for deployment"
git push
```

---

## Module Handbooks — Post-Launch

When PDFs are provided, populate `assignment_details` for each relevant task via Supabase Studio or a small update script:

```sql
UPDATE tasks
SET assignment_details = '{
  "weighting": "30%",
  "format": "Team Presentation",
  "brief": "...",
  "requirements": ["Requirement 1", "Requirement 2"]
}'::jsonb
WHERE title = 'Team Company Review of Objectives';
```

---

## Verification Summary

| Feature | How to verify |
|---|---|
| Auth gate | Navigate to `/dashboard` unauthenticated → redirected to login |
| Password check | Submit wrong PIN → error. Submit `8181` → cookie + redirect |
| Timeline | All tasks visible as floating cards, alternating above/below |
| Zoom | − / + / slider / Ctrl+scroll all affect timeline scale |
| Task panel | Click card → `?task=` param, panel opens. Escape closes it |
| Progress | Quick-pick button updates bar immediately, persists on refresh |
| Notes | Save button persists notes across refresh |
| Attachments | Upload → appears in list. Delete → removed from Storage |
| Category view | Only that category's tasks shown. Insights accurate |
| Cross-category task | Appears on dashboard, absent from all category views |
| Recurring tasks | Each instance independently completable |
| Sidebar stats | Counts match spec definitions |
