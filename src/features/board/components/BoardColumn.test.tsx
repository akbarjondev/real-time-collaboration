import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useDroppable } from '@dnd-kit/core'
import { BoardColumn } from '@/features/board/components/BoardColumn'
import { BoardStateContext } from '@/store/BoardStateContext'
import { FilterContext, initialFilterState } from '@/store/FilterContext'
import { FilterAPIContext } from '@/store/FilterAPIContext'
import type { Task } from '@/types/task.types'
import type { FilterState } from '@/store/FilterContext'
import type { FilterAPIContextType } from '@/store/FilterAPIContext'

vi.mock('@dnd-kit/core', () => ({
  useDroppable: vi.fn(),
}))

vi.mock('@dnd-kit/sortable', () => ({
  SortableContext: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  verticalListSortingStrategy: {},
}))

vi.mock('@/features/tasks/components/TaskCard', () => ({
  TaskCard: ({ task }: { task: Task }) => <div data-testid="task-card">{task.title}</div>,
}))

const mockSetNodeRef = vi.fn()

const mockTask: Task = {
  id: 'task-1',
  title: 'Test Task',
  description: '',
  assignee: 'Alice',
  status: 'todo',
  priority: 'medium',
  tags: [],
  createdAt: '2026-01-01T00:00:00.000Z',
}

const mockFilterAPI: FilterAPIContextType = {
  setAssignee: vi.fn(),
  setPriority: vi.fn(),
  setSearch: vi.fn(),
  resetFilters: vi.fn(),
}

function renderColumn(
  tasks: Task[] = [],
  isOver = false,
  filterState: FilterState = initialFilterState
) {
  vi.mocked(useDroppable).mockReturnValue({ isOver, setNodeRef: mockSetNodeRef } as ReturnType<typeof useDroppable>)
  return render(
    <BoardStateContext.Provider value={tasks}>
      <FilterContext.Provider value={filterState}>
        <FilterAPIContext.Provider value={mockFilterAPI}>
          <BoardColumn
            status="todo"
            title="Todo"
            onOpenCreate={vi.fn()}
            onOpenEdit={vi.fn()}
          />
        </FilterAPIContext.Provider>
      </FilterContext.Provider>
    </BoardStateContext.Provider>
  )
}

describe('BoardColumn', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders column title and task count', () => {
    renderColumn([mockTask])
    expect(screen.getByText('Todo')).toBeInTheDocument()
    expect(screen.getByText('1')).toBeInTheDocument()
  })

  it('renders task cards for tasks in this column', () => {
    renderColumn([mockTask])
    expect(screen.getAllByTestId('task-card')).toHaveLength(1)
    expect(screen.getByText('Test Task')).toBeInTheDocument()
  })

  it('renders empty state when no tasks', () => {
    renderColumn([])
    expect(screen.getByText('No tasks')).toBeInTheDocument()
  })

  it('renders SortableContext when tasks are present', () => {
    renderColumn([mockTask])
    // SortableContext renders children — task cards are visible
    expect(screen.getByTestId('task-card')).toBeInTheDocument()
  })

  it('adds ring class when isOver=true', () => {
    renderColumn([mockTask], true)
    const section = screen.getByRole('region')
    expect(section.className).toContain('ring-2')
    expect(section.className).toContain('ring-violet-400')
  })

  it('does NOT add ring class when isOver=false', () => {
    renderColumn([mockTask], false)
    const section = screen.getByRole('region')
    expect(section.className).not.toContain('ring-2')
  })

  it('renders placeholder div when isOver=true and column has tasks', () => {
    renderColumn([mockTask], true)
    const placeholder = document.querySelector('.border-dashed')
    expect(placeholder).toBeInTheDocument()
  })

  it('does NOT render placeholder div when isOver=false', () => {
    renderColumn([mockTask], false)
    const placeholder = document.querySelector('.border-dashed.border-violet-400')
    expect(placeholder).not.toBeInTheDocument()
  })

  it('calls setNodeRef with the section element', () => {
    renderColumn([mockTask])
    expect(mockSetNodeRef).toHaveBeenCalled()
  })

  it('renders filtered empty state when column has no tasks and filters are active', () => {
    renderColumn([], false, { assignee: 'Carol', priority: null, searchQuery: '' })
    expect(screen.getByText('No matches')).toBeInTheDocument()
    expect(screen.getByText('No tasks match the current filter')).toBeInTheDocument()
    expect(screen.getByText('Clear filter')).toBeInTheDocument()
    expect(screen.queryByText('No tasks')).not.toBeInTheDocument()
  })

  it('renders original empty state when column is empty and no filters are active', () => {
    renderColumn([], false, initialFilterState)
    expect(screen.getByText('No tasks')).toBeInTheDocument()
    expect(screen.queryByText('No matches')).not.toBeInTheDocument()
  })

  it('Clear filter link calls filterAPI.resetFilters', () => {
    renderColumn([], false, { assignee: 'Carol', priority: null, searchQuery: '' })
    fireEvent.click(screen.getByText('Clear filter'))
    expect(mockFilterAPI.resetFilters).toHaveBeenCalled()
  })
})
