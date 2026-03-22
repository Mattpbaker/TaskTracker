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
    recurrenceRule: null,
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
