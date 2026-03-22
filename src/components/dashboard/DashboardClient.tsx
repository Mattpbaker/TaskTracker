'use client'
import { useCategoryContext } from '@/context/CategoryContext'
import { computeCategoryInsights } from '@/lib/stats'
import { CATEGORY_COLOURS } from '@/lib/constants'
import { useState, useEffect } from 'react'
import ViewSwitcher, { type ViewMode } from '@/components/timeline/ViewSwitcher'
import Timeline from '@/components/timeline/Timeline'
import WeeklyView from '@/components/timeline/views/WeeklyView'
import SwimlaneView from '@/components/timeline/views/SwimlaneView'
import VerticalView from '@/components/timeline/views/VerticalView'
import CalendarView from '@/components/timeline/views/CalendarView'
import CategoryHeader from '@/components/category/CategoryHeader'
import CategoryProgressBar from '@/components/category/CategoryProgressBar'
import CategoryInsightCards from '@/components/category/CategoryInsightCards'
import type { Task, Category } from '@/types/app'

const STORAGE_KEY = 'tt-view-mode'

export default function DashboardClient({
  tasks,
  colourMap,
  categories,
}: {
  tasks: Task[]
  colourMap: Record<string, string>   // keyed by category ID — from DashboardPage
  categories: Category[]
}) {
  const { activeCategory } = useCategoryContext()
  const [viewMode, setViewMode] = useState<ViewMode>('weekly')

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as ViewMode | null
    if (saved) setViewMode(saved)
  }, [])

  const handleViewChange = (v: ViewMode) => {
    setViewMode(v)
    localStorage.setItem(STORAGE_KEY, v)
  }

  const displayTasks = activeCategory
    ? tasks.filter(t => t.categoryId === activeCategory.id)
    : tasks

  const accent = activeCategory
    ? (CATEGORY_COLOURS[activeCategory.slug] ?? activeCategory.colour)
    : '#10b981'

  // Task-ID-keyed map for new views
  const taskColourMap: Record<string, string> = Object.fromEntries(
    displayTasks.map(t => [
      t.id,
      activeCategory ? accent : (colourMap[t.categoryId ?? ''] ?? '#10b981'),
    ])
  )

  // Category-ID-keyed map for existing Timeline (horizontal) component
  const catColourMap: Record<string, string> = activeCategory
    ? Object.fromEntries(displayTasks.map(t => [t.categoryId ?? '', accent]))
    : colourMap

  const switcher = <ViewSwitcher current={viewMode} onChange={handleViewChange} />

  const categorySection = activeCategory ? (() => {
    const insights = computeCategoryInsights(displayTasks)
    return (
      <>
        <CategoryHeader category={activeCategory} taskCount={displayTasks.length} finalDueDate={insights.finalDueDate} />
        <CategoryProgressBar progress={insights.overallProgress} colour={accent} />
        <CategoryInsightCards insights={insights} colour={accent} />
      </>
    )
  })() : null

  return (
    <>
      {categorySection}
      {viewMode === 'weekly'     && <WeeklyView   tasks={displayTasks} taskColourMap={taskColourMap} accent={accent} extra={switcher} />}
      {viewMode === 'horizontal' && <Timeline     tasks={displayTasks} categoryColourMap={catColourMap} accent={accent} extra={switcher} />}
      {viewMode === 'swimlane'   && <SwimlaneView tasks={displayTasks} taskColourMap={taskColourMap} accent={accent} extra={switcher} categories={categories} />}
      {viewMode === 'vertical'   && <VerticalView tasks={displayTasks} taskColourMap={taskColourMap} accent={accent} extra={switcher} />}
      {viewMode === 'calendar'   && <CalendarView tasks={displayTasks} taskColourMap={taskColourMap} accent={accent} extra={switcher} />}
    </>
  )
}
