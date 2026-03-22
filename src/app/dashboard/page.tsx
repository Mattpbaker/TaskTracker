import { createSupabaseServerClient } from '@/lib/supabase/server'
import { mapTask } from '@/lib/mappers'
import { CATEGORY_COLOURS } from '@/lib/constants'
import Timeline from '@/components/timeline/Timeline'
import type { DbCategory } from '@/types/database'

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ task?: string }>
}) {
  const supabase = await createSupabaseServerClient()
  const [{ data: rawTasks }, { data: rawCats }] = await Promise.all([
    supabase.from('tasks').select('*').eq('is_template', false).order('due_date'),
    supabase.from('categories').select('id, slug').order('name'),
  ])

  const tasks = (rawTasks ?? []).map(mapTask)
  const colourMap = Object.fromEntries(
    (rawCats ?? [] as DbCategory[]).map((c) => [c.id, CATEGORY_COLOURS[c.slug] ?? '#10b981'])
  )

  return <Timeline tasks={tasks} categoryColourMap={colourMap} title="All Tasks — Timeline" />
}
