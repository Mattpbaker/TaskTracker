'use client'
import { usePathname, useRouter } from 'next/navigation'
import type { Category } from '@/types/app'

export default function CategoryNav({ categories, taskCounts }: {
  categories: Category[]
  taskCounts: Record<string, number>
}) {
  const pathname = usePathname()
  const router = useRouter()

  const isActive = (slug: string | null) => {
    if (slug === null) return pathname.startsWith('/dashboard')
    return pathname === `/category/${slug}`
  }

  const nav = (slug: string | null) => {
    router.push(slug ? `/category/${slug}` : '/dashboard')
  }

  return (
    <div>
      <p className="text-[9px] uppercase tracking-widest text-emerald-950 font-semibold px-1 mb-2">Categories</p>
      {/* All Tasks */}
      <button
        onClick={() => nav(null)}
        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg mb-0.5 border text-left transition-all ${
          isActive(null)
            ? 'bg-emerald-950 border-cat-social'
            : 'border-transparent hover:bg-surface'
        }`}
      >
        <div className="w-2 h-2 rounded-full bg-cat-social" />
        <span className={`text-xs ${isActive(null) ? 'text-emerald-300' : 'text-emerald-800'}`}>All Tasks</span>
      </button>
      {categories.map(cat => (
        <button
          key={cat.slug}
          onClick={() => nav(cat.slug)}
          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg mb-0.5 border text-left transition-all ${
            isActive(cat.slug)
              ? 'border opacity-100'
              : 'border-transparent hover:bg-surface'
          }`}
          style={isActive(cat.slug)
            ? { background: `${cat.colour}15`, borderColor: cat.colour }
            : undefined}
        >
          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: cat.colour }} />
          <span className={`text-xs flex-1 leading-tight ${isActive(cat.slug) ? 'text-emerald-200' : 'text-emerald-800'}`}>
            {cat.name}
          </span>
          {taskCounts[cat.id] !== undefined && (
            <span className="text-[10px] text-emerald-950 bg-border rounded px-1">
              {taskCounts[cat.id]}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}
