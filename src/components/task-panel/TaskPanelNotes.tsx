'use client'
import { useState, useTransition } from 'react'
import { updateNotesAction } from '@/actions/tasks'

export default function TaskPanelNotes({ taskId, initial }: { taskId: string; initial: string | null }) {
  const [notes, setNotes] = useState(initial ?? '')
  const [saved, setSaved] = useState(false)
  const [isPending, startTransition] = useTransition()

  const save = async () => {
    setSaved(false)
    startTransition(() => updateNotesAction(taskId, notes))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="px-5 py-4 border-b border-border">
      <p className="text-[10px] uppercase tracking-widest text-emerald-950 font-semibold mb-3">Notes</p>
      <textarea
        value={notes}
        onChange={e => { setNotes(e.target.value); setSaved(false) }}
        placeholder="Add your own notes here — key points, reminders, links..."
        className="w-full bg-surface border border-border rounded-lg px-3 py-2.5 text-xs text-emerald-300 leading-relaxed resize-y min-h-[90px] focus:outline-none focus:border-cat-social placeholder:text-emerald-950"
      />
      <button
        onClick={save}
        disabled={isPending}
        className="mt-2 text-[11px] px-3.5 py-1.5 rounded border border-cat-social text-cat-social bg-emerald-950 hover:bg-cat-social hover:text-black transition-all disabled:opacity-50"
      >
        {saved ? 'Saved ✓' : isPending ? 'Saving…' : 'Save notes'}
      </button>
    </div>
  )
}
