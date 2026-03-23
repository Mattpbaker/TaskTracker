import { cache } from 'react'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { computeSidebarStats } from '@/lib/stats'
import { mapTask, mapCategory } from '@/lib/mappers'
import type { Task, Category, SidebarStats } from '@/types/app'

export interface DashboardData {
  tasks: Task[]
  categories: Category[]
  stats: SidebarStats
  taskCounts: Record<string, number>
}

export const getDashboardData = cache(async (): Promise<DashboardData> => {
  const supabase = await createSupabaseServerClient()
  const [{ data: rawTasks }, { data: rawCats }] = await Promise.all([
    supabase.from('tasks').select('*').eq('is_template', false).order('due_date'),
    supabase.from('categories').select('*').order('name'),
  ])
  const tasks = (rawTasks ?? []).map(mapTask)
  const categories = (rawCats ?? []).map(mapCategory)
  const stats = computeSidebarStats(tasks)
  const taskCounts = Object.fromEntries(
    categories.map(cat => [cat.id, tasks.filter(t => t.categoryId === cat.id).length])
  )
  return { tasks, categories, stats, taskCounts }
})
