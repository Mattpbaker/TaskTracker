'use client'
import { useActionState } from 'react'
import { loginAction } from '@/actions/auth'

const initialState = { error: '' }

export default function LoginForm() {
  const [state, formAction] = useActionState(loginAction, initialState)
  return (
    <form action={formAction} className="flex flex-col items-center gap-4">
      <h1 className="text-2xl font-bold text-emerald-300">TaskTracker</h1>
      <p className="text-sm text-emerald-900">Enter your access code</p>
      <input
        type="password"
        name="password"
        autoComplete="current-password"
        placeholder="• • • •"
        className="w-48 text-center text-xl tracking-widest bg-surface border border-border rounded-lg px-4 py-3 text-emerald-300 focus:outline-none focus:border-cat-social"
      />
      {state?.error && <p className="text-red-400 text-sm">{state.error}</p>}
      <button
        type="submit"
        className="px-8 py-2 bg-cat-social text-black font-semibold rounded-lg hover:opacity-90 transition"
      >
        Enter
      </button>
    </form>
  )
}
