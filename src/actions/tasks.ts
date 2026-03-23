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

export async function createTaskAction(formData: FormData) {
  const title = (formData.get('title') as string | null)?.trim()
  const categoryId = (formData.get('categoryId') as string | null) || null
  const dueDate = formData.get('dueDate') as string | null

  if (!title) throw new Error('Title is required')
  if (!dueDate) throw new Error('Due date is required')

  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.from('tasks').insert({
    title,
    category_id: categoryId,
    due_date: dueDate,
    progress: 0,
    is_recurring: false,
    is_template: false,
  })
  if (error) throw new Error(error.message)

  revalidatePath('/dashboard')
  revalidatePath('/category', 'layout')
}
