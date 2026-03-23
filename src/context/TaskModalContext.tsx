'use client'
import { createContext, useContext, useState } from 'react'
import AddTaskModal from '@/components/modals/AddTaskModal'
import type { Category } from '@/types/app'

interface TaskModalContextValue {
  openAddTaskModal: () => void
}

const TaskModalContext = createContext<TaskModalContextValue>({
  openAddTaskModal: () => {},
})

export function useTaskModal() {
  return useContext(TaskModalContext)
}

export function TaskModalProvider({
  categories,
  children,
}: {
  categories: Category[]
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)

  return (
    <TaskModalContext.Provider value={{ openAddTaskModal: () => setOpen(true) }}>
      {children}
      {open && <AddTaskModal categories={categories} onClose={() => setOpen(false)} />}
    </TaskModalContext.Provider>
  )
}
