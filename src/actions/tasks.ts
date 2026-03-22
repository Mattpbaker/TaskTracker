'use server'
import { revalidatePath } from 'next/cache'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function updateProgressAction(taskId: string, progress: number) {
  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.from('tasks').update({ progress }).eq('id', taskId)
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard')
  revalidatePath('/category', 'layout')
}

export async function updateNotesAction(taskId: string, notes: string) {
  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.from('tasks').update({ notes }).eq('id', taskId)
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard')
  revalidatePath('/category', 'layout')
}
