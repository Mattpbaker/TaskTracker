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
  recurrenceRule: string | null
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
