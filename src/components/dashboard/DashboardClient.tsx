'use client'
import { useCategoryContext } from '@/context/CategoryContext'
import { useSearchContext } from '@/context/SearchContext'
import { computeCategoryInsights } from '@/lib/stats'
import { CATEGORY_COLOURS } from '@/lib/constants'
import { useState, useEffect, useOptimistic, startTransition } from 'react'
import { updateProgressAction } from '@/actions/tasks'
import ViewSwitcher, { type ViewMode } from '@/components/timeline/ViewSwitcher'
import WeeklyView from '@/components/timeline/views/WeeklyView'
import VerticalView from '@/components/timeline/views/VerticalView'
import CategoryHeader from '@/components/category/CategoryHeader'
import CategoryProgressBar from '@/components/category/CategoryProgressBar'
import CategoryInsightCards from '@/components/category/CategoryInsightCards'
import type { Task, Category, CategoryGroup, ActiveCategory } from '@/types/app'

const STORAGE_KEY = 'tt-view-mode'

function isGroup(cat: ActiveCategory): cat is CategoryGroup {
  return !!cat && 'memberSlugs' in cat
}

export default function DashboardClient({
  tasks,
  colourMap,
  categories,
}: {
  tasks: Task[]
  colourMap: Record<string, string>
  categories: Category[]
}) {
  const { activeCategory, activeMemberSlugs } = useCategoryContext()
  const { searchQuery, setSearchQuery } = useSearchContext()
  const [viewMode, setViewMode] = useState<ViewMode>('weekly')

  const [optimisticTasks, dispatchOptimistic] = useOptimistic(
    tasks,
    (state: Task[], action: { type: 'update-progress'; id: string; progress: number }) => {
      if (action.type === 'update-progress') {
        return state.map(t => t.id === action.id ? { ...t, progress: action.progress } : t)
      }
      return state
    }
  )

  // Restore saved view mode
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as ViewMode | null
    if (saved) setViewMode(saved)
  }, [])

  // Reset search when category changes
  useEffect(() => {
    setSearchQuery('')
  }, [activeCategory, setSearchQuery])

  const handleViewChange = (v: ViewMode) => {
    setViewMode(v)
    localStorage.setItem(STORAGE_KEY, v)
  }

  // Called by ProgressPopup in WeeklyView — must be inside startTransition
  const handleProgressChange = (id: string, progress: number) => {
    startTransition(() => {
      dispatchOptimistic({ type: 'update-progress', id, progress })
      updateProgressAction(id, progress)
    })
  }

  // Apply category + search filters to optimistic task list
  const displayTasks = optimisticTasks
    .filter(t => {
      if (!activeCategory) return true
      if (isGroup(activeCategory)) {
        const effectiveSlugs = activeMemberSlugs ?? activeCategory.memberSlugs
        const memberIds = categories
          .filter(c => effectiveSlugs.includes(c.slug))
          .map(c => c.id)
        return memberIds.includes(t.categoryId ?? '')
      }
      return t.categoryId === activeCategory.id
    })
    .filter(t =>
      !searchQuery ||
      t.title.toLowerCase().includes(searchQuery.toLowerCase())
    )

  // For groups: keep per-category colours. For single category: use single accent.
  const accent = activeCategory
    ? (isGroup(activeCategory)
        ? activeCategory.colour
        : (CATEGORY_COLOURS[activeCategory.slug] ?? activeCategory.colour))
    : '#10b981'

  const taskColourMap: Record<string, string> = Object.fromEntries(
    displayTasks.map(t => [
      t.id,
      (activeCategory && !isGroup(activeCategory))
        ? accent
        : (colourMap[t.categoryId ?? ''] ?? '#10b981'),
    ])
  )

  const switcher = <ViewSwitcher current={viewMode} onChange={handleViewChange} />

  const categorySection = activeCategory ? (() => {
    const insights = computeCategoryInsights(displayTasks)
    // CategoryGroup has same shape as Category for the header (id, name, slug, colour)
    // Pass description: null to satisfy the Category interface
    const headerCat: Category = isGroup(activeCategory)
      ? { id: activeCategory.id, name: activeCategory.name, slug: activeCategory.slug, colour: activeCategory.colour, description: null }
      : activeCategory
    return (
      <>
        <CategoryHeader category={headerCat} taskCount={displayTasks.length} finalDueDate={insights.finalDueDate} />
        <CategoryProgressBar progress={insights.overallProgress} colour={accent} />
        <CategoryInsightCards insights={insights} colour={accent} />
      </>
    )
  })() : null

  return (
    <>
      {categorySection}
      {viewMode === 'weekly'     && (
        <WeeklyView
          tasks={displayTasks}
          taskColourMap={taskColourMap}
          accent={accent}
          extra={switcher}
          onProgressChange={handleProgressChange}
          searchQuery={searchQuery}
        />
      )}
      {viewMode === 'vertical'   && <VerticalView tasks={displayTasks} taskColourMap={taskColourMap} accent={accent} extra={switcher} />}
    </>
  )
}
