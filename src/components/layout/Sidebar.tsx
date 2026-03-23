import type { Category, SidebarStats as SidebarStatsType } from '@/types/app'
import SidebarStats from './SidebarStats'
import CategoryNav from './CategoryNav'

export default function Sidebar({
  stats,
  categories,
  taskCounts,
  children,
}: {
  stats: SidebarStatsType
  categories: Category[]
  taskCounts: Record<string, number>
  children?: React.ReactNode
}) {
  return (
    <aside className="w-[200px] flex-shrink-0 bg-surface border-r border-border flex flex-col py-4 overflow-y-auto">
      <div className="px-3 flex flex-col gap-4">
        {children}
        <SidebarStats stats={stats} />
        <CategoryNav categories={categories} taskCounts={taskCounts} />
      </div>
    </aside>
  )
}
