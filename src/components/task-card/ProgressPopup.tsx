'use client'
import { createPortal } from 'react-dom'
import { useEffect, useRef } from 'react'

const OPTIONS = [
  { label: 'Not started',     value: 0   },
  { label: 'Just started',    value: 25  },
  { label: 'Halfway',         value: 50  },
  { label: 'Nearly done',     value: 75  },
  { label: 'Complete',        value: 100 },
]

export default function ProgressPopup({
  taskId,
  currentProgress,
  anchorRect,
  onSelect,
  onClose,
}: {
  taskId: string
  currentProgress: number
  anchorRect: DOMRect
  onSelect: (id: string, progress: number) => void
  onClose: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    const onMouse = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    window.addEventListener('keydown', onKey)
    // Use setTimeout so the click that opened the popup doesn't immediately close it
    const id = setTimeout(() => window.addEventListener('mousedown', onMouse), 0)
    return () => {
      window.removeEventListener('keydown', onKey)
      clearTimeout(id)
      window.removeEventListener('mousedown', onMouse)
    }
  }, [onClose])

  // Position above the badge — getBoundingClientRect() is already viewport-relative,
  // so do NOT add window.scrollY (popup uses position: fixed, not absolute)
  const top = anchorRect.top
  const right = window.innerWidth - anchorRect.right

  return createPortal(
    <div
      ref={ref}
      className="fixed z-50 bg-background border border-border rounded-xl shadow-2xl p-1.5 min-w-[160px]"
      style={{
        top: `${top}px`,
        right: `${right}px`,
        transform: 'translateY(calc(-100% - 6px))',
      }}
    >
      {OPTIONS.map(opt => (
        <button
          key={opt.value}
          onClick={() => { onSelect(taskId, opt.value); onClose() }}
          className={`w-full text-left flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-colors hover:bg-surface ${
            opt.value === currentProgress
              ? 'text-cat-social font-semibold'
              : 'text-secondary'
          }`}
        >
          <div
            className="h-1 w-5 rounded-full flex-shrink-0"
            style={{
              background:
                opt.value === 0   ? 'var(--border)' :
                opt.value === 100 ? '#10b981' :
                '#60a5fa',
            }}
          />
          <span>{opt.label}</span>
          {opt.value > 0 && (
            <span className="text-muted ml-0.5">· {opt.value}%</span>
          )}
          {opt.value === currentProgress && (
            <span className="ml-auto text-cat-social text-[10px]">✓</span>
          )}
        </button>
      ))}
    </div>,
    document.body
  )
}
