'use client'
import { useCategoryContext } from '@/context/CategoryContext'
import { CATEGORY_GROUPS, CATEGORY_COLOURS, GROUPED_SLUGS, type CategoryGroup } from '@/lib/constants'
import type { Category, ActiveCategory } from '@/types/app'

export default function CategoryNav({ categories, taskCounts }: {
  categories: Category[]
  taskCounts: Record<string, number>
}) {
  const { activeCategory, setActiveCategory, activeMemberSlugs, setActiveMemberSlugs } = useCategoryContext()

  const isActive = (id: string) => activeCategory?.id === id

  const visibleCategories = categories.filter(c => !GROUPED_SLUGS.has(c.slug))

  const groupCount = (g: CategoryGroup) =>
    categories
      .filter(c => g.memberSlugs.includes(c.slug))
      .reduce((sum, c) => sum + (taskCounts[c.id] ?? 0), 0)

  // Build combined list: regular categories + group entries, sorted by name
  type NavItem = { type: 'category'; cat: Category } | { type: 'group'; group: CategoryGroup }
  const items: NavItem[] = [
    ...visibleCategories.map(cat => ({ type: 'category' as const, cat })),
    ...CATEGORY_GROUPS.map(group => ({ type: 'group' as const, group })),
  ].sort((a, b) => {
    const nameA = a.type === 'category' ? a.cat.name : a.group.name
    const nameB = b.type === 'category' ? b.cat.name : b.group.name
    return nameA.localeCompare(nameB)
  })

  const toggleMember = (slug: string, groupSlugs: string[]) => {
    const current = activeMemberSlugs ?? groupSlugs
    if (current.includes(slug)) {
      // Don't allow deselecting the last one
      if (current.length === 1) return
      setActiveMemberSlugs(current.filter(s => s !== slug))
    } else {
      const next = groupSlugs.filter(s => current.includes(s) || s === slug)
      // If all would be selected, treat as null (all)
      setActiveMemberSlugs(next.length === groupSlugs.length ? null : next)
    }
  }

  return (
    <div>
      <p className="text-[9px] uppercase tracking-widest text-muted font-semibold px-1 mb-2">Categories</p>
      {/* All Tasks */}
      <button
        onClick={() => setActiveCategory(null)}
        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg mb-0.5 border text-left transition-all ${
          activeCategory === null
            ? 'bg-surface border-cat-social'
            : 'border-transparent hover:bg-surface'
        }`}
      >
        <div className="w-2 h-2 rounded-full bg-cat-social" />
        <span className={`text-xs ${activeCategory === null ? 'text-primary' : 'text-secondary'}`}>All Tasks</span>
      </button>

      {items.map(item => {
        if (item.type === 'category') {
          const cat = item.cat
          const active = isActive(cat.id)
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg mb-0.5 border text-left transition-all ${
                active ? 'border opacity-100' : 'border-transparent hover:bg-surface'
              }`}
              style={active ? { background: `${cat.colour}15`, borderColor: cat.colour } : undefined}
            >
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: cat.colour }} />
              <span className={`text-xs flex-1 leading-tight ${active ? 'text-primary' : 'text-secondary'}`}>
                {cat.name}
              </span>
              {taskCounts[cat.id] !== undefined && (
                <span className="text-[10px] text-secondary bg-surface border border-border rounded px-1.5 font-medium">
                  {taskCounts[cat.id]}
                </span>
              )}
            </button>
          )
        }

        const group = item.group
        const active = isActive(group.id)
        const count = groupCount(group)
        const memberCategories = categories.filter(c => group.memberSlugs.includes(c.slug))

        return (
          <div key={group.id}>
            <button
              onClick={() => setActiveCategory(group)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg mb-0.5 border text-left transition-all ${
                active ? 'border opacity-100' : 'border-transparent hover:bg-surface'
              }`}
              style={active ? { background: `${group.colour}15`, borderColor: group.colour } : undefined}
            >
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: group.colour }} />
              <span className={`text-xs flex-1 leading-tight ${active ? 'text-primary' : 'text-secondary'}`}>
                {group.name}
              </span>
              <span className="text-[10px] text-secondary bg-surface border border-border rounded px-1.5 font-medium">
                {count}
              </span>
            </button>

            {/* Per-member toggles — visible when this group is active */}
            {active && memberCategories.length > 0 && (
              <div className="ml-3 mb-1 flex flex-col gap-0.5">
                {group.memberSlugs.map(slug => {
                  const cat = memberCategories.find(c => c.slug === slug)
                  const colour = CATEGORY_COLOURS[slug] ?? group.colour
                  const catName = cat?.name ?? slug
                  const catCount = cat ? (taskCounts[cat.id] ?? 0) : 0
                  const currentSlugs = activeMemberSlugs ?? group.memberSlugs
                  const on = currentSlugs.includes(slug)
                  return (
                    <button
                      key={slug}
                      onClick={() => toggleMember(slug, group.memberSlugs)}
                      className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md border text-left transition-all ${
                        on ? 'border opacity-100' : 'border-transparent opacity-40 hover:opacity-70'
                      }`}
                      style={on ? { background: `${colour}12`, borderColor: `${colour}60` } : undefined}
                    >
                      <div
                        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{ background: on ? colour : 'var(--text-muted)' }}
                      />
                      <span className={`text-[11px] flex-1 leading-tight ${on ? 'text-primary' : 'text-secondary'}`}>
                        {catName}
                      </span>
                      <span className="text-[10px] text-muted font-medium">{catCount}</span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
