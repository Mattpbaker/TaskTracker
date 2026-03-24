'use client'
import { createContext, useContext, useState } from 'react'
import type { ActiveCategory } from '@/types/app'

type CategoryContextValue = {
  activeCategory: ActiveCategory
  setActiveCategory: (cat: ActiveCategory) => void
  activeMemberSlugs: string[] | null  // null = all members; array = filtered subset
  setActiveMemberSlugs: (slugs: string[] | null) => void
}

const CategoryContext = createContext<CategoryContextValue>({
  activeCategory: null,
  setActiveCategory: () => {},
  activeMemberSlugs: null,
  setActiveMemberSlugs: () => {},
})

export function CategoryProvider({ children }: { children: React.ReactNode }) {
  const [activeCategory, setActiveCategory] = useState<ActiveCategory>(null)
  const [activeMemberSlugs, setActiveMemberSlugs] = useState<string[] | null>(null)

  const handleSetActiveCategory = (cat: ActiveCategory) => {
    setActiveCategory(cat)
    setActiveMemberSlugs(null) // reset member filter whenever category changes
  }

  return (
    <CategoryContext.Provider value={{ activeCategory, setActiveCategory: handleSetActiveCategory, activeMemberSlugs, setActiveMemberSlugs }}>
      {children}
    </CategoryContext.Provider>
  )
}

export function useCategoryContext() {
  return useContext(CategoryContext)
}
