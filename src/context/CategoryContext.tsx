'use client'
import { createContext, useContext, useState } from 'react'
import type { Category } from '@/types/app'

type CategoryContextValue = {
  activeCategory: Category | null
  setActiveCategory: (cat: Category | null) => void
}

const CategoryContext = createContext<CategoryContextValue>({
  activeCategory: null,
  setActiveCategory: () => {},
})

export function CategoryProvider({ children }: { children: React.ReactNode }) {
  const [activeCategory, setActiveCategory] = useState<Category | null>(null)
  return (
    <CategoryContext.Provider value={{ activeCategory, setActiveCategory }}>
      {children}
    </CategoryContext.Provider>
  )
}

export function useCategoryContext() {
  return useContext(CategoryContext)
}
