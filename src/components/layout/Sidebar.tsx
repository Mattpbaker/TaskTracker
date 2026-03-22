import type { Category, SidebarStats as SidebarStatsType } from '@/types/app'
import SidebarStats from './SidebarStats'
import CategoryNav from './CategoryNav'

export default function Sidebar({ stats, categories, taskCounts }: {
  stats: SidebarStatsType
  categories: Category[]
  taskCounts: Record<string, number>
}) {
  return (
    <aside className="w-[200px] flex-shrink-0 bg-[#0b140b] border-r border-border flex flex-col py-4 overflow-y-auto">
      <div className="px-3">
        <SidebarStats stats={stats} />
        <CategoryNav categories={categories} taskCounts={taskCounts} />
      </div>
    </aside>
  )
}
