'use client'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { createTaskAction } from '@/actions/tasks'
import type { Category } from '@/types/app'

export default function AddTaskModal({
  categories,
  onClose,
}: {
  categories: Category[]
  onClose: () => void
}) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)

  // Escape key dismissal + focus trap
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return }

      // Focus trap: cycle Tab/Shift+Tab within the modal
      if (e.key === 'Tab' && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (e.shiftKey) {
          if (document.activeElement === first) { e.preventDefault(); last?.focus() }
        } else {
          if (document.activeElement === last) { e.preventDefault(); first?.focus() }
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  async function handleSubmit(formData: FormData) {
    try {
      setError(null)
      await createTaskAction(formData)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add task')
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 bg-black/55 backdrop-blur-[2px] z-50 flex items-end justify-center pb-20"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      role="dialog"
      aria-modal="true"
      aria-label="Add task"
    >
      <div
        ref={dialogRef}
        className="bg-background border border-border rounded-xl p-5 w-[400px] shadow-2xl modal-enter"
      >
        <h2 className="text-[14px] font-bold text-primary mb-4">Add Task</h2>

        <form action={handleSubmit} className="space-y-3">
          {/* Title */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-muted mb-1.5">
              Title *
            </label>
            <input
              name="title"
              required
              autoFocus
              placeholder="Task title"
              className="w-full px-3 py-2 text-[13px] bg-surface border border-border rounded-lg text-primary placeholder:text-muted focus:outline-none focus:border-cat-social focus:ring-1 focus:ring-cat-social/20 transition-colors"
            />
          </div>

          {/* Category + Due Date row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-muted mb-1.5">
                Category
              </label>
              <select
                name="categoryId"
                className="w-full px-3 py-2 text-[13px] bg-surface border border-border rounded-lg text-primary focus:outline-none focus:border-cat-social transition-colors"
              >
                <option value="">None</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-muted mb-1.5">
                Due Date *
              </label>
              <input
                name="dueDate"
                type="date"
                required
                className="w-full px-3 py-2 text-[13px] bg-surface border border-border rounded-lg text-primary focus:outline-none focus:border-cat-social transition-colors"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-[12px] font-medium border border-border rounded-lg text-secondary hover:text-primary hover:border-secondary transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-[12px] font-semibold bg-cat-social text-white rounded-lg hover:opacity-90 transition-opacity"
            >
              Add Task →
            </button>
          </div>
          {error && (
            <p className="text-[11px] text-red-500 mt-2 text-center">{error}</p>
          )}
        </form>
      </div>
    </div>,
    document.body
  )
}
