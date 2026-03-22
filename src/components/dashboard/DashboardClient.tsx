'use client'
import { useCategoryContext } from '@/context/CategoryContext'
import { computeCategoryInsights } from '@/lib/stats'
import { CATEGORY_COLOURS } from '@/lib/constants'
import Timeline from '@/components/timeline/Timeline'
import CategoryHeader from '@/components/category/CategoryHeader'
import CategoryProgressBar from '@/components/category/CategoryProgressBar'
import CategoryInsightCards from '@/components/category/CategoryInsightCards'
import type { Task } from '@/types/app'

export default function DashboardClient({
  tasks,
  colourMap,
}: {
  tasks: Task[]
  colourMap: Record<string, string>
}) {
  const { activeCategory } = useCategoryContext()

  if (!activeCategory) {
    return (
      <Timeline tasks={tasks} categoryColourMap={colourMap} title="All Tasks — Timeline" />
    )
  }

  const colour = CATEGORY_COLOURS[activeCategory.slug] ?? activeCategory.colour
  const filtered = tasks.filter(t => t.categoryId === activeCategory.id)
  const insights = computeCategoryInsights(filtered)
  const filteredColourMap = Object.fromEntries(filtered.map(t => [t.id, colour]))

  return (
    <>
      <CategoryHeader category={activeCategory} taskCount={filtered.length} finalDueDate={insights.finalDueDate} />
      <CategoryProgressBar progress={insights.overallProgress} colour={colour} />
      <CategoryInsightCards insights={insights} colour={colour} />
      <Timeline tasks={filtered} categoryColourMap={filteredColourMap} accent={colour} title={`${activeCategory.name} — Timeline`} />
    </>
  )
}
