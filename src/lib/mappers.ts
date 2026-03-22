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
    recurrenceRule: t.recurrence_rule,
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
