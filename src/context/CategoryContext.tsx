'use client'
import { createContext, useContext, useState } from 'react'
import type { ActiveCategory } from '@/types/app'

type CategoryContextValue = {
  activeCategory: ActiveCategory
  setActiveCategory: (cat: ActiveCategory) => void
}

const CategoryContext = createContext<CategoryContextValue>({
  activeCategory: null,
  setActiveCategory: () => {},
})

export function CategoryProvider({ children }: { children: React.ReactNode }) {
  const [activeCategory, setActiveCategory] = useState<ActiveCategory>(null)
  return (
    <CategoryContext.Provider value={{ activeCategory, setActiveCategory }}>
      {children}
    </CategoryContext.Provider>
  )
}

export function useCategoryContext() {
  return useContext(CategoryContext)
}
