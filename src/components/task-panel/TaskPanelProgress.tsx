'use client'
import { useState, useTransition } from 'react'
import { updateProgressAction } from '@/actions/tasks'
import { PROGRESS_VALUES } from '@/types/app'
import type { ProgressLabel } from '@/types/app'

const LABELS = Object.keys(PROGRESS_VALUES) as ProgressLabel[]

function labelFor(progress: number): ProgressLabel | null {
  return (LABELS.find(l => PROGRESS_VALUES[l] === progress) ?? null)
}

export default function TaskPanelProgress({ taskId, initial, colour }: {
  taskId: string
  initial: number
  colour: string
}) {
  const [progress, setProgress] = useState(initial)
  const [isPending, startTransition] = useTransition()

  const pick = (label: ProgressLabel) => {
    const val = PROGRESS_VALUES[label]
    setProgress(val)
    startTransition(() => updateProgressAction(taskId, val))
  }

  return (
    <div className="px-5 py-4 border-b border-border">
      <p className="text-[10px] uppercase tracking-widest text-muted font-semibold mb-3">Progress</p>
      <div className="flex items-center gap-3 mb-3">
        <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-300" style={{ width: `${progress}%`, background: colour }} />
        </div>
        <span className="text-sm font-bold" style={{ color: colour }}>{progress}%</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {LABELS.map(label => (
          <button
            key={label}
            onClick={() => pick(label)}
            disabled={isPending}
            className={`text-[11px] px-2.5 py-1 rounded border transition-all ${isPending ? 'opacity-50 cursor-not-allowed' : ''} ${
              labelFor(progress) === label
                ? 'border-cat-social text-cat-social bg-emerald-950'
                : 'border-border text-muted bg-surface hover:border-cat-social hover:text-primary'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}
