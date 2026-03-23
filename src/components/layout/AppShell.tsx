import type { Category, SidebarStats } from '@/types/app'
import TopBar from './TopBar'
import Sidebar from './Sidebar'
import AddTaskButton from './AddTaskButton'
import { CategoryProvider } from '@/context/CategoryContext'
import { SearchProvider } from '@/context/SearchContext'
import { TaskModalProvider } from '@/context/TaskModalContext'

export default function AppShell({
  children,
  stats,
  categories,
  taskCounts,
}: {
  children: React.ReactNode
  stats: SidebarStats
  categories: Category[]
  taskCounts: Record<string, number>
}) {
  return (
    <TaskModalProvider categories={categories}>
      <CategoryProvider>
        <SearchProvider>
          <div className="flex flex-col h-screen bg-background">
            <TopBar />
            <div className="flex flex-1 overflow-hidden">
              <Sidebar stats={stats} categories={categories} taskCounts={taskCounts}>
                <AddTaskButton />
              </Sidebar>
              <main className="flex-1 overflow-hidden flex flex-col">
                {children}
              </main>
            </div>
          </div>
        </SearchProvider>
      </CategoryProvider>
    </TaskModalProvider>
  )
}
