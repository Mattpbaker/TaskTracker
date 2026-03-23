'use client'
import { useSearchContext } from '@/context/SearchContext'
import { useEffect } from 'react'

export default function SearchInput() {
  const { searchQuery, setSearchQuery } = useSearchContext()

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSearchQuery('')
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [setSearchQuery])

  return (
    <div className="relative flex items-center flex-1 max-w-[260px]">
      <svg
        className="absolute left-2.5 text-muted pointer-events-none"
        width="12" height="12" fill="none" stroke="currentColor" strokeWidth={2}
        viewBox="0 0 24 24"
      >
        <circle cx={11} cy={11} r={8} />
        <path d="m21 21-4.35-4.35" />
      </svg>
      <input
        value={searchQuery}
        onChange={e => setSearchQuery(e.target.value)}
        placeholder="Search tasks..."
        className="w-full pl-7 pr-6 py-1.5 text-[12px] bg-surface border border-border rounded-lg text-primary placeholder:text-muted focus:outline-none focus:border-cat-social focus:ring-1 focus:ring-cat-social/20 transition-colors"
      />
      {searchQuery && (
        <button
          onClick={() => setSearchQuery('')}
          aria-label="Clear search"
          className="absolute right-2 text-[10px] text-muted hover:text-primary transition-colors"
        >
          ✕
        </button>
      )}
    </div>
  )
}
