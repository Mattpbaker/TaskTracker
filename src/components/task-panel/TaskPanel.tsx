'use client'
import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import type { Task, Category, Attachment } from '@/types/app'
import { CATEGORY_COLOURS } from '@/lib/constants'
import TaskPanelHeader from './TaskPanelHeader'
import TaskPanelDates from './TaskPanelDates'
import TaskPanelDetails from './TaskPanelDetails'
import TaskPanelProgress from './TaskPanelProgress'
import TaskPanelNotes from './TaskPanelNotes'
import TaskPanelAttachments from './TaskPanelAttachments'

interface Props {
  task: Task
  category: Category | null
  attachments?: Attachment[]
}

export default function TaskPanel({ task, category, attachments }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const colour = category ? CATEGORY_COLOURS[category.slug] ?? '#10b981' : '#10b981'

  const close = () => router.push(pathname)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') router.push(pathname) }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [pathname, router])

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" onClick={close} />
      {/* Panel */}
      <div className="animate-in fixed right-0 top-0 h-full w-[420px] bg-background border-l border-border z-50 overflow-y-auto shadow-2xl flex flex-col">
        <TaskPanelHeader
          title={task.title}
          category={category?.name ?? null}
          module={task.module}
          colour={colour}
          onClose={close}
        />
        <TaskPanelDates
          startDate={task.startDate}
          dueDate={task.dueDate}
          dueTime={task.dueTime}
        />
        <TaskPanelDetails details={task.assignmentDetails} />
        <TaskPanelProgress taskId={task.id} initial={task.progress} colour={colour} />
        <TaskPanelNotes taskId={task.id} initial={task.notes} />
        <TaskPanelAttachments taskId={task.id} initial={attachments ?? []} />
      </div>
    </>
  )
}
