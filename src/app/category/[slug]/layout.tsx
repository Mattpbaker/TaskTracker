import { createSupabaseServerClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { computeSidebarStats } from '@/lib/stats'
import { mapTask, mapCategory } from '@/lib/mappers'
import AppShell from '@/components/layout/AppShell'

export default async function CategoryLayout({ children, params }: {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createSupabaseServerClient()

  const [{ data: catData }, { data: rawTasks }, { data: rawCats }] = await Promise.all([
    supabase.from('categories').select('*').eq('slug', slug).single(),
    supabase.from('tasks').select('*').eq('is_template', false).order('due_date'),
    supabase.from('categories').select('*').order('name'),
  ])

  if (!catData) notFound()

  const tasks = (rawTasks ?? []).map(mapTask)
  const categories = (rawCats ?? []).map(mapCategory)
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
