import { createContext, useContext } from 'react'
import type { Priority } from '@/types/task.types'

export type FilterState = {
  assignee: string | null
  priority: Priority | null
  searchQuery: string
}

type FilterAction =
  | { type: 'SET_ASSIGNEE'; assignee: string | null }
  | { type: 'SET_PRIORITY'; priority: Priority | null }
  | { type: 'SET_SEARCH'; searchQuery: string }
  | { type: 'RESET_FILTERS' }

export type { FilterAction }

export const initialFilterState: FilterState = {
  assignee: null,
  priority: null,
  searchQuery: '',
}

export function filterReducer(state: FilterState, action: FilterAction): FilterState {
  switch (action.type) {
    case 'SET_ASSIGNEE':
      return { ...state, assignee: action.assignee }
    case 'SET_PRIORITY':
      return { ...state, priority: action.priority }
    case 'SET_SEARCH':
      return { ...state, searchQuery: action.searchQuery }
    case 'RESET_FILTERS':
      return initialFilterState
    default:
      return state
  }
}

export const FilterContext = createContext<FilterState>(initialFilterState)

type FilterProviderProps = {
  filterState: FilterState
  children: React.ReactNode
}

export function FilterProvider({ filterState, children }: FilterProviderProps) {
  return (
    <FilterContext.Provider value={filterState}>
      {children}
    </FilterContext.Provider>
  )
}

export function useFilters(): FilterState {
  return useContext(FilterContext)
}
