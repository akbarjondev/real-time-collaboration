import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { FilterBar } from './FilterBar'
import { FilterContext, initialFilterState } from '@/store/FilterContext'
import { FilterAPIContext } from '@/store/FilterAPIContext'
import type { FilterState } from '@/store/FilterContext'
import type { FilterAPIContextType } from '@/store/FilterAPIContext'

function makeFilterAPI(overrides: Partial<FilterAPIContextType> = {}): FilterAPIContextType {
  return {
    setAssignee: vi.fn(),
    setPriority: vi.fn(),
    setSearch: vi.fn(),
    resetFilters: vi.fn(),
    ...overrides,
  }
}

function renderFilterBar(
  filterState: FilterState = initialFilterState,
  filterAPI: FilterAPIContextType = makeFilterAPI()
) {
  return {
    filterAPI,
    ...render(
      <FilterContext.Provider value={filterState}>
        <FilterAPIContext.Provider value={filterAPI}>
          <FilterBar />
        </FilterAPIContext.Provider>
      </FilterContext.Provider>
    ),
  }
}

describe('FilterBar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders without active chips when all filters are empty', () => {
    renderFilterBar()
    expect(screen.queryByLabelText('Active filters')).not.toBeInTheDocument()
    expect(screen.queryByText('Clear all')).not.toBeInTheDocument()
  })

  it('renders search input', () => {
    renderFilterBar()
    expect(screen.getByRole('textbox', { name: 'Search tasks' })).toBeInTheDocument()
  })

  it('search input onChange calls filterAPI.setSearch', () => {
    const filterAPI = makeFilterAPI()
    renderFilterBar(initialFilterState, filterAPI)
    const input = screen.getByRole('textbox', { name: 'Search tasks' })
    fireEvent.change(input, { target: { value: 'hello' } })
    expect(filterAPI.setSearch).toHaveBeenCalledWith('hello')
  })

  it('shows assignee chip when assignee filter is active', () => {
    renderFilterBar({ ...initialFilterState, assignee: 'Alice' })
    expect(screen.getByText(/Assignee: Alice/)).toBeInTheDocument()
  })

  it('chip dismiss calls setAssignee(null)', () => {
    const filterAPI = makeFilterAPI()
    renderFilterBar({ ...initialFilterState, assignee: 'Alice' }, filterAPI)
    fireEvent.click(screen.getByLabelText('Remove assignee filter'))
    expect(filterAPI.setAssignee).toHaveBeenCalledWith(null)
  })

  it('shows priority chip when priority filter is active', () => {
    renderFilterBar({ ...initialFilterState, priority: 'high' })
    expect(screen.getByText(/Priority: high/i)).toBeInTheDocument()
  })

  it('chip dismiss calls setPriority(null)', () => {
    const filterAPI = makeFilterAPI()
    renderFilterBar({ ...initialFilterState, priority: 'high' }, filterAPI)
    fireEvent.click(screen.getByLabelText('Remove priority filter'))
    expect(filterAPI.setPriority).toHaveBeenCalledWith(null)
  })

  it('shows search chip when searchQuery is set', () => {
    renderFilterBar({ ...initialFilterState, searchQuery: 'fix' })
    expect(screen.getByText(/"fix"/)).toBeInTheDocument()
  })

  it('search chip dismiss calls setSearch("")', () => {
    const filterAPI = makeFilterAPI()
    renderFilterBar({ ...initialFilterState, searchQuery: 'fix' }, filterAPI)
    fireEvent.click(screen.getByLabelText('Remove search filter'))
    expect(filterAPI.setSearch).toHaveBeenCalledWith('')
  })

  it('Clear all button only visible when filters are active', () => {
    const { rerender } = renderFilterBar(initialFilterState)
    expect(screen.queryByLabelText('Clear all filters')).not.toBeInTheDocument()

    rerender(
      <FilterContext.Provider value={{ ...initialFilterState, assignee: 'Alice' }}>
        <FilterAPIContext.Provider value={makeFilterAPI()}>
          <FilterBar />
        </FilterAPIContext.Provider>
      </FilterContext.Provider>
    )
    expect(screen.getByLabelText('Clear all filters')).toBeInTheDocument()
  })

  it('Clear all calls resetFilters', () => {
    const filterAPI = makeFilterAPI()
    renderFilterBar({ ...initialFilterState, assignee: 'Bob' }, filterAPI)
    fireEvent.click(screen.getByLabelText('Clear all filters'))
    expect(filterAPI.resetFilters).toHaveBeenCalled()
  })
})
