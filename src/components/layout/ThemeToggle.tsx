'use client'
import { useEffect, useState } from 'react'

export default function ThemeToggle() {
  const [dark, setDark] = useState(false)

  // Sync initial state from the class already set by the inline script
  useEffect(() => {
    setDark(document.documentElement.classList.contains('dark'))
  }, [])

  const toggle = () => {
    const next = !dark
    setDark(next)
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem('tt-theme', next ? 'dark' : 'light')
  }

  return (
    <button
      onClick={toggle}
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="text-[13px] px-2 py-1 rounded border border-border text-muted hover:text-primary hover:border-secondary transition-colors"
    >
      {dark ? '☀' : '☾'}
    </button>
  )
}
