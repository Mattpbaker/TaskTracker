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
