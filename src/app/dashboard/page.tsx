import { createSupabaseServerClient } from '@/lib/supabase/server'
import { mapTask, mapCategory, mapAttachment } from '@/lib/mappers'
import { CATEGORY_COLOURS } from '@/lib/constants'
import Timeline from '@/components/timeline/Timeline'
import TaskPanel from '@/components/task-panel/TaskPanel'
import type { DbCategory } from '@/types/database'
import type { Task, Category, Attachment } from '@/types/app'

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ task?: string }>
}) {
  const { task: activeTaskId } = await searchParams
  const supabase = await createSupabaseServerClient()

  const [{ data: rawTasks }, { data: rawCats }] = await Promise.all([
    supabase.from('tasks').select('*').eq('is_template', false).order('due_date'),
    supabase.from('categories').select('*').order('name'),
  ])

  const tasks = (rawTasks ?? []).map(mapTask)
  const categories = (rawCats ?? [] as DbCategory[]).map(mapCategory)

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
    const { data: rawAtt } = await supabase
      .from('attachments').select('*').eq('task_id', activeTask.id)
    attachments = (rawAtt ?? []).map(mapAttachment)
  }

  return (
    <>
      <Timeline tasks={tasks} categoryColourMap={colourMap} title="All Tasks — Timeline" />
      {activeTask && <TaskPanel task={activeTask} category={activeCategory} attachments={attachments} />}
    </>
  )
}
