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
