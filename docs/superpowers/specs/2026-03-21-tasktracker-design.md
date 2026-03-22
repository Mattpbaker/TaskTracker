# TaskTracker — Design Spec

**Date:** 2026-03-21
**Author:** Matt Baker
**Status:** Approved

---

## Context

A personal task tracking web app for the final stretch of a university entrepreneurship course (Mar 21 – May 14, 2026). The user is a final-year student managing multiple assignment categories, recurring responsibilities, and hard deadlines. The site will be deployed to Vercel and protected by a simple password gate.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14 (App Router) |
| Database | Supabase (Postgres) |
| File Storage | Supabase Storage |
| Styling | Tailwind CSS |
| Deployment | Vercel |
| Auth | Simple password gate (PIN stored in server-only env var `SITE_PASSWORD`) |

---

## Visual Design

- **Colour scheme:** Dark Emerald — near-black background (`#0a0f0a`), emerald green accents (`#10b981`), each category has its own accent colour
- **Font:** System sans-serif stack
- **Theme:** Dark, focused, minimal chrome

### Category Accent Colours

| Category | Slug | Colour |
|---|---|---|
| Social Media | `social-media` | `#10b981` (emerald) |
| Recognition Day | `recognition-day` | `#6366f1` (indigo) |
| Tracking Systems | `tracking-systems` | `#14b8a6` (teal) |
| Training | `training` | `#ec4899` (pink) |
| Annual Report | `annual-report` | `#f59e0b` (amber) |
| Video & Q&A | `video-qa` | `#a3e635` (lime) |
| Working Groups | `working-groups` | `#8b5cf6` (violet) |

---

## Pages & Routes

| Route | Description |
|---|---|
| `/` | Login screen — password gate |
| `/dashboard` | Homepage — all tasks timeline |
| `/dashboard?task=<id>` | Dashboard with task detail panel open (URL param, no full navigation) |
| `/category/[slug]` | Category view — filtered timeline |
| `/category/[slug]?task=<id>` | Category view with task detail panel open |

Clicking a task card on the timeline updates the URL via a `?task=<id>` search param (no page navigation). The task detail panel opens as an overlay. Direct-linking to `?task=<id>` renders the full shell with the panel pre-opened. There is no standalone `/task/[id]` route.

---

## Auth

- Single password gate at `/` — renders a PIN entry screen
- Password stored in server-only env var `SITE_PASSWORD` (no `NEXT_PUBLIC_` prefix — never exposed to the client bundle)
- PIN check happens in a Next.js Server Action or Route Handler; on success the server sets an HttpOnly, SameSite=Strict cookie `tasktracker_auth=true` with 7-day expiry
- Next.js middleware checks the cookie on all `/dashboard`, `/dashboard/*`, and `/category/*` routes; redirects to `/` if missing or expired
- No Supabase Auth, no user accounts

---

## Layout

### Global Shell
- **Top bar:** Logo, current date, days-until-course-end badge (counting down to May 14, 2026)
- **Left sidebar (200px):** Stats overview list + category nav
- **Main content area:** Timeline view (switches based on selected category)

### Left Sidebar

**Stats Overview (compact list):**

| Label | Definition |
|---|---|
| Recurring active | Count of rows where `is_recurring = true AND is_template = false AND due_date >= today` |
| Due this week | Count of tasks with `due_date` within the next 7 days and `progress < 100` |
| Upcoming | Count of tasks with `due_date > 7 days from now` and `progress < 100` |
| Overdue | Count of tasks with `due_date < today` and `progress < 100` |
| In progress | Count of tasks with `progress > 0` and `progress < 100` |
| Completed | Count of tasks with `progress = 100` |

**Category Navigation:**
- "All Tasks" (default selected)
- One item per category with colour dot and task count badge (count of all tasks in category, including completed)
- Active item highlighted with category accent colour

---

## Timeline Component

The core UI element, shared across all views.

### Layout
- Horizontal line spanning the full date range (Mar 21 → May 14, 2026)
- "Today" marker — a vertical line at the current date position
- Date tick marks at regular intervals with labels
- Task cards float above and below the line, alternating to avoid overlap
- Each card is connected to the line by a thin stem leading to a dot marker on the line

### Task Card (on timeline)
- Category colour dot + task title
- Due date (and due time if set, e.g. "May 8 · 2:00pm")
- Module tag (if applicable)
- Mini progress bar
- Dot on the line coloured to match category

### Zoom Controls
- − / + step buttons (10% per step)
- Drag slider (60%–300%)
- Ctrl/Cmd + scroll gesture while hovering the timeline
- Zoom is local React state, resets to 100% on navigation
- Initial zoom: 100%

### Interaction
- Clicking a task card pushes `?task=<id>` to the URL and opens the Task Detail Panel
- Clicking outside the panel or pressing Escape removes the `?task` param and closes the panel

---

## Category View

Shown when a category is selected in the sidebar. Same layout as dashboard but filtered to one category.

**Category header band:**
- Category name, colour dot, total task count, final deadline (latest `due_date` in the category), days remaining

**Overall progress bar:**
- Average `progress` across all non-template tasks in the category (0–100)
- Coloured with category accent

**Insight cards row:**

| Card | Value |
|---|---|
| Total Tasks | Count of all tasks in category (excluding template rows) |
| In Progress | `progress > 0 AND progress < 100` |
| Completed | `progress = 100` |
| Overdue | `due_date < today AND progress < 100` |
| Days Until Final Due | Days from today to the latest `due_date` in the category |

**Timeline:**
- Same floating card component, filtered to category tasks only
- Accent colour applied throughout (line gradient, dot markers, progress fills)

---

## Task Detail Panel

Opens as a right-side overlay when a task card is clicked. URL updates to include `?task=<id>`.

### Sections (top to bottom)

1. **Header** — category colour bar, task title, category tag, module tag, close button
2. **Dates** — start date (if set), due date, due time (if set), time-remaining box (goes amber when ≤ 7 days, red when overdue)
3. **Progress** — fill bar + quick-pick buttons mapped as follows:

   | Label | `progress` value |
   |---|---|
   | Not started | 0 |
   | Just started | 25 |
   | Halfway | 50 |
   | Nearly done | 75 |
   | Complete ✓ | 100 |

4. **Assignment Details** — pulled from module handbook (populated post-launch):
   - Weighting (% of module grade)
   - Format (e.g. Team Presentation, Written Report)
   - Official brief / description
   - Key requirements as bullet points
   - Stored in `assignment_details` jsonb field
5. **Notes** — free-text textarea, saved via button press (upserts `notes` field)
6. **Attachments** — list of uploaded files with name, size, delete button; drag-and-drop / browse upload zone
   - Supabase Storage bucket: `task-attachments`
   - Max file size: 10 MB
   - Allowed types: any (no restriction)
   - Storage path pattern: `{task_id}/{filename}`

---

## Data Model

### `categories`
| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| name | text | e.g. "Annual Report" |
| slug | text | e.g. "annual-report", unique |
| colour | text | hex colour |
| description | text | nullable |

### `tasks`
| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| category_id | uuid | FK → categories; nullable for cross-category tasks |
| title | text | |
| description | text | nullable |
| module | text | nullable, e.g. "Self Leadership" |
| start_date | date | nullable |
| due_date | date | |
| due_time | time | nullable |
| progress | int | 0–100, default 0 |
| notes | text | nullable |
| assignment_details | jsonb | nullable; shape: `{ weighting, format, brief, requirements[] }` |
| is_recurring | boolean | default false |
| is_template | boolean | default false — template rows are not shown in the UI |
| recurrence_rule | text | nullable; only set on template rows (see Recurrence Rules) |
| parent_task_id | uuid | FK → tasks; set on recurring instances, null on templates and one-off tasks |
| created_at | timestamptz | default now() |

### `attachments`
| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| task_id | uuid | FK → tasks |
| file_name | text | original filename |
| storage_path | text | Supabase Storage path: `{task_id}/{filename}` |
| file_size | int | bytes |
| uploaded_at | timestamptz | default now() |

---

## Cross-Category Tasks

The "All Portfolios Due" task spans all modules and does not belong to a single category. It is stored with `category_id = null`. Behaviour:
- Appears on the "All Tasks" timeline
- Does **not** appear in any individual category view
- Not counted in any category's progress bar or insight stats
- Counted in the sidebar's global stats (Due this week, Upcoming, etc.)

---

## Recurring Tasks

### Recurrence Rules

The `recurrence_rule` column on template rows uses the following format:

```
<frequency>:<days>
```

| Token | Values |
|---|---|
| `<frequency>` | `weekly` |
| `<days>` | Comma-separated lowercase English day names: `monday`, `tuesday`, `wednesday`, `thursday`, `friday`, `saturday`, `sunday`. Use `any` for "once per week, day unspecified". |

**Examples:**
- `weekly:tuesday,thursday` — every Tuesday and Thursday
- `weekly:any` — once per week (no specific day; instance `due_date` is set to Monday of each week. The first instance uses the first Monday on or after the course start date, i.e. March 23, 2026)

### Template Rows

Each recurring task has one template row with:
- `is_template = true`
- `is_recurring = true`
- `recurrence_rule` set
- `due_date` = course start (Mar 21, 2026) — not meaningful, just a placeholder
- `progress = 0`
- Template rows are **not** shown in any timeline or stats

### Instances

Generated from Mar 21 to May 14, 2026 at seed time:
- `is_template = false`, `is_recurring = true`
- `parent_task_id` = template row's id
- `due_date` = the specific occurrence date
- `progress` = 0 (independent per instance — completing one does not affect others)
- `notes` = null (independent per instance)

### Recurring Task Templates

| Title | Rule | Category |
|---|---|---|
| LinkedIn post | `weekly:any` | Social Media |
| Team website update | `weekly:any` | Social Media |
| Check tracking systems | `weekly:any` | Tracking Systems |
| Training session | `weekly:tuesday,thursday` | Training |

---

## Pre-Seeded Tasks

| Title | Start | Due Date | Due Time | Category | Module |
|---|---|---|---|---|---|
| Team Company Review of Objectives | Mar 23 | Mar 26 | — | Recognition Day | Self Leadership |
| Storyboard Assignment | Mar 30 | Apr 3 | — | Working Groups | Self Leadership |
| All Portfolios Due | — | Apr 27 | 14:00 | *(cross-category, `category_id = null`)* | All modules |
| Annual Report submission | — | May 8 | 14:00 | Annual Report | — |
| Annual Report Video | — | May 11 | 12:00 | Video & Q&A | — |
| Annual Report Q&A | — | May 14 | 09:30 | Video & Q&A | — |
| + all recurring instances | Mar 21 | May 14 | — | varies | — |

Assignment details (`assignment_details` jsonb) will be populated after module handbook PDFs are provided.

---

## Vercel Deployment

- Connect GitHub repo to Vercel
- Environment variables (set in Vercel dashboard):
  - `SITE_PASSWORD` — the PIN (server-only, no `NEXT_PUBLIC_` prefix)
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Supabase project on free tier (sufficient for this use case)
- Add `.superpowers/` to `.gitignore`

---

## Module Handbooks

The user will provide PDFs for all modules post-launch. Once provided, extract and populate the `assignment_details` jsonb field on relevant tasks with:
- `weighting` — percentage of module grade
- `format` — submission format (e.g. "Written Report", "Team Presentation")
- `brief` — official assignment description
- `requirements` — array of key requirement strings / marking criteria points

---

## Out of Scope (v1)

- Multi-user support
- Email / push notifications
- Calendar export
- Mobile-optimised layout (desktop-first for now)
