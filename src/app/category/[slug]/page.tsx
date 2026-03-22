import { createSupabaseServerClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { computeCategoryInsights } from '@/lib/stats'
import { CATEGORY_COLOURS } from '@/lib/constants'
import { mapTask, mapCategory, mapAttachment } from '@/lib/mappers'
import Timeline from '@/components/timeline/Timeline'
import CategoryHeader from '@/components/category/CategoryHeader'
import CategoryProgressBar from '@/components/category/CategoryProgressBar'
import CategoryInsightCards from '@/components/category/CategoryInsightCards'
import TaskPanel from '@/components/task-panel/TaskPanel'
import type { Task, Category, Attachment } from '@/types/app'

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ task?: string }>
}) {
  const { slug } = await params
  const { task: activeTaskId } = await searchParams

  const supabase = await createSupabaseServerClient()

  const { data: cat } = await supabase.from('categories').select('*').eq('slug', slug).single()
  if (!cat) notFound()

  const category: Category = mapCategory(cat)
  const colour = CATEGORY_COLOURS[slug] ?? '#10b981'

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

  if (activeTaskId) {
    activeTask = tasks.find(t => t.id === activeTaskId) ?? null
    if (!activeTask) {
      const { data: rawTask } = await supabase.from('tasks').select('*').eq('id', activeTaskId).single()
      if (rawTask) activeTask = mapTask(rawTask)
    }
    if (activeTask) {
      activeCategory = category
      const { data: rawAtt } = await supabase.from('attachments').select('*').eq('task_id', activeTask.id)
      attachments = (rawAtt ?? []).map(mapAttachment)
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
