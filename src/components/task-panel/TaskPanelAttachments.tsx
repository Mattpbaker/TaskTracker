'use client'
import { useState, useRef, useTransition } from 'react'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { deleteAttachmentAction } from '@/actions/attachments'
import type { Attachment } from '@/types/app'

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function TaskPanelAttachments({ taskId, initial }: {
  taskId: string
  initial: Attachment[]
}) {
  const [attachments, setAttachments] = useState(initial)
  const [uploading, setUploading] = useState(false)
  const [isPending, startTransition] = useTransition()
  const inputRef = useRef<HTMLInputElement>(null)

  const upload = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setUploading(true)
    const supabase = getSupabaseBrowserClient()
    for (const file of Array.from(files)) {
      const path = `${taskId}/${Date.now()}-${file.name}`
      const { error: storageErr } = await supabase.storage.from('task-attachments').upload(path, file)
      if (storageErr) { alert(`Upload failed: ${storageErr.message}`); continue }
      const { data, error: dbErr } = await supabase.from('attachments').insert({
        task_id: taskId,
        file_name: file.name,
        storage_path: path,
        file_size: file.size,
      }).select().single()
      if (dbErr) { alert(`DB insert failed: ${dbErr.message}`); continue }
      setAttachments(prev => [...prev, {
        id: data.id, taskId, fileName: file.name,
        storagePath: path, fileSize: file.size, uploadedAt: data.uploaded_at,
      }])
    }
    setUploading(false)
  }

  const remove = (attachment: Attachment) => {
    setAttachments(prev => prev.filter(a => a.id !== attachment.id))
    startTransition(() => deleteAttachmentAction(attachment.id, attachment.storagePath))
  }

  return (
    <div className="px-5 py-4">
      <p className="text-[10px] uppercase tracking-widest text-muted font-semibold mb-3">Attachments</p>
      {attachments.length > 0 && (
        <div className="flex flex-col gap-1.5 mb-3">
          {attachments.map(att => (
            <div key={att.id} className="flex items-center gap-2 bg-surface border border-border rounded-lg px-3 py-2">
              <span className="text-sm">📄</span>
              <span className="text-[11px] text-primary flex-1 truncate">{att.fileName}</span>
              <span className="text-[10px] text-muted flex-shrink-0">{formatBytes(att.fileSize)}</span>
              <button
                onClick={() => remove(att)}
                disabled={isPending}
                className="text-muted hover:text-red-400 text-xs ml-1 disabled:opacity-50"
              >✕</button>
            </div>
          ))}
        </div>
      )}
      <div
        className="border border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-cat-social hover:bg-emerald-950 transition-all"
        onClick={() => inputRef.current?.click()}
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); upload(e.dataTransfer.files) }}
      >
        <p className="text-[11px] text-muted">
          {uploading ? 'Uploading…' : <><span>Drop files here or </span><span className="text-cat-social">browse to upload</span></>}
        </p>
        <input ref={inputRef} type="file" multiple className="hidden" onChange={e => upload(e.target.files)} />
      </div>
    </div>
  )
}
