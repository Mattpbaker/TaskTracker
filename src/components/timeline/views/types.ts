import type { Task, Category } from '@/types/app'

export interface ViewProps {
  tasks: Task[]
  taskColourMap: Record<string, string>
  accent?: string
  categories?: Category[]
  extra?: React.ReactNode
  // Added for WeeklyView inline progress + search highlighting
  onProgressChange?: (id: string, progress: number) => void
  searchQuery?: string
}
