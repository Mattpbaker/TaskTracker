'use server'
import { redirect } from 'next/navigation'
import { verifyPassword, setAuthCookie } from '@/lib/auth'

export async function loginAction(_prevState: { error: string }, formData: FormData) {
  const password = formData.get('password')?.toString() ?? ''
  if (!verifyPassword(password)) {
    return { error: 'Incorrect password' }
  }
  await setAuthCookie()
  redirect('/dashboard')
}
