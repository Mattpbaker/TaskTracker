'use client'
import { useCategoryContext } from '@/context/CategoryContext'
import type { Category } from '@/types/app'

export default function CategoryNav({ categories, taskCounts }: {
  categories: Category[]
  taskCounts: Record<string, number>
}) {
  const { activeCategory, setActiveCategory } = useCategoryContext()

  const isActive = (slug: string | null) =>
    slug === null ? activeCategory === null : activeCategory?.slug === slug

  return (
    <div>
      <p className="text-[9px] uppercase tracking-widest text-muted font-semibold px-1 mb-2">Categories</p>
      {/* All Tasks */}
      <button
        onClick={() => setActiveCategory(null)}
        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg mb-0.5 border text-left transition-all ${
          isActive(null)
            ? 'bg-surface border-cat-social'
            : 'border-transparent hover:bg-surface'
        }`}
      >
        <div className="w-2 h-2 rounded-full bg-cat-social" />
        <span className={`text-xs ${isActive(null) ? 'text-primary' : 'text-secondary'}`}>All Tasks</span>
      </button>
      {categories.map(cat => (
        <button
          key={cat.slug}
          onClick={() => setActiveCategory(cat)}
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
          <span className={`text-xs flex-1 leading-tight ${isActive(cat.slug) ? 'text-primary' : 'text-secondary'}`}>
            {cat.name}
          </span>
          {taskCounts[cat.id] !== undefined && (
            <span className="text-[10px] text-secondary bg-surface border border-border rounded px-1.5 font-medium">
              {taskCounts[cat.id]}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}
