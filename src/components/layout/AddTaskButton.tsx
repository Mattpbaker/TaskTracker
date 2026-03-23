'use client'
import { useTaskModal } from '@/context/TaskModalContext'

export default function AddTaskButton() {
  const { openAddTaskModal } = useTaskModal()
  return (
    <button
      onClick={openAddTaskModal}
      className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-[12px] font-semibold bg-cat-social text-white rounded-lg hover:opacity-90 transition-opacity"
    >
      <span className="text-[16px] leading-none font-light">+</span>
      Add Task
    </button>
  )
}
