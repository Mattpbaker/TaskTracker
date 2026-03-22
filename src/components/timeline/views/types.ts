import type { Task, Category } from '@/types/app'

export interface ViewProps {
  tasks: Task[]
  taskColourMap: Record<string, string>  // task.id → hex colour
  accent?: string
  categories?: Category[]                // needed by SwimlaneView for lane labels
  extra?: React.ReactNode                // ViewSwitcher rendered in each view's header
}
