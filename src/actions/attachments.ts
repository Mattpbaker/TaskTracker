'use server'
import { revalidatePath } from 'next/cache'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function deleteAttachmentAction(attachmentId: string, storagePath: string) {
  const supabase = await createSupabaseServerClient()
  await supabase.storage.from('task-attachments').remove([storagePath])
  const { error } = await supabase.from('attachments').delete().eq('id', attachmentId)
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard')
  revalidatePath('/category', 'layout')
}
