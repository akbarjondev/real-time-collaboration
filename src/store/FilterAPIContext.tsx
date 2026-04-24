import { createContext, useContext, useMemo } from 'react'
import type { Priority } from '@/types/task.types'
import type { FilterAction } from '@/store/FilterContext'

export type FilterAPIContextType = {
  setAssignee: (assignee: string | null) => void
  setPriority: (priority: Priority | null) => void
  setSearch: (searchQuery: string) => void
  resetFilters: () => void
}

export const FilterAPIContext = createContext<FilterAPIContextType | null>(null)

type FilterAPIProviderProps = {
  dispatch: React.Dispatch<FilterAction>
  children: React.ReactNode
}

export function FilterAPIProvider({ dispatch, children }: FilterAPIProviderProps) {
  const filterAPI = useMemo<FilterAPIContextType>(() => ({
    setAssignee: (assignee) => dispatch({ type: 'SET_ASSIGNEE', assignee }),
    setPriority: (priority) => dispatch({ type: 'SET_PRIORITY', priority }),
    setSearch: (searchQuery) => dispatch({ type: 'SET_SEARCH', searchQuery }),
    resetFilters: () => dispatch({ type: 'RESET_FILTERS' }),
  }), [dispatch])

  return (
    <FilterAPIContext.Provider value={filterAPI}>
      {children}
    </FilterAPIContext.Provider>
  )
}

export function useFilterAPI(): FilterAPIContextType {
  const ctx = useContext(FilterAPIContext)
  if (!ctx) {
    throw new Error('useFilterAPI must be used within FilterAPIProvider')
  }
  return ctx
}
