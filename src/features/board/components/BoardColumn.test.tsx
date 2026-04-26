import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useDroppable } from '@dnd-kit/core'
import { BoardColumn } from '@/features/board/components/BoardColumn'
import { BoardStateContext } from '@/store/BoardStateContext'
import { FilterContext, initialFilterState } from '@/store/FilterContext'
import { FilterAPIContext } from '@/store/FilterAPIContext'
import { PendingOpsContext } from '@/store/PendingOpsContext'
import type { Task } from '@/types/task.types'
import type { FilterState } from '@/store/FilterContext'
import type { FilterAPIContextType } from '@/store/FilterAPIContext'
import type { PendingOperation } from '@/types/common.types'

// Spy on SortableContext items prop via vi.hoisted so the ref is available before vi.mock hoisting
const mockSortableContext = vi.hoisted(() =>
  vi.fn(({ children }: { children: React.ReactNode }) => <>{children}</>)
)

vi.mock('@dnd-kit/core', () => ({
  useDroppable: vi.fn(),
}))

vi.mock('@dnd-kit/sortable', () => ({
  SortableContext: mockSortableContext,
  verticalListSortingStrategy: {},
}))

vi.mock('@/features/tasks/components/TaskCard', () => ({
  TaskCard: ({ task, isPending }: { task: Task; isPending: boolean }) => (
    <div data-testid="task-card" aria-busy={isPending}>{task.title}</div>
  ),
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
  filterState: FilterState = initialFilterState,
  pendingOps: Map<string, PendingOperation> = new Map()
) {
  vi.mocked(useDroppable).mockReturnValue({ isOver, setNodeRef: mockSetNodeRef } as unknown as ReturnType<typeof useDroppable>)
  return render(
    <BoardStateContext.Provider value={tasks}>
      <FilterContext.Provider value={filterState}>
        <FilterAPIContext.Provider value={mockFilterAPI}>
          <PendingOpsContext.Provider value={pendingOps}>
            <BoardColumn
              status="todo"
              title="Todo"
              onOpenCreate={vi.fn()}
              onOpenEdit={vi.fn()}
            />
          </PendingOpsContext.Provider>
        </FilterAPIContext.Provider>
      </FilterContext.Provider>
    </BoardStateContext.Provider>
  )
}

describe('BoardColumn', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSortableContext.mockImplementation(({ children }: { children: React.ReactNode }) => <>{children}</>)
  })

  it('has responsive width classes for mobile-first layout', () => {
    renderColumn([mockTask])
    const section = screen.getByRole('region')
    expect(section.className).toContain('w-full')
    expect(section.className).toContain('md:w-80')
  })

  it('has min-h-[120px] for visible empty column on mobile', () => {
    renderColumn([mockTask])
    const section = screen.getByRole('region')
    expect(section.className).toContain('min-h-[120px]')
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

  it('passes isPending=true only to the card whose task is in pendingOps', () => {
    const task1: Task = { ...mockTask, id: 'task-1', title: 'Task One' }
    const task2: Task = { ...mockTask, id: 'task-2', title: 'Task Two' }
    const pendingOps = new Map<string, PendingOperation>([
      ['op-1', { opId: 'op-1', taskId: 'task-1', snapshot: task1, opType: 'update' }],
    ])
    renderColumn([task1, task2], false, initialFilterState, pendingOps)

    const cards = screen.getAllByTestId('task-card')
    const pendingCard = cards.find(c => c.textContent === 'Task One')
    const nonPendingCard = cards.find(c => c.textContent === 'Task Two')

    expect(pendingCard).toHaveAttribute('aria-busy', 'true')
    expect(nonPendingCard).toHaveAttribute('aria-busy', 'false')
  })

  it('pendingTaskIds Set is correctly derived: only pending task card gets aria-busy=true', () => {
    // Set up 3 tasks; only task-2 is pending
    const task1: Task = { ...mockTask, id: 'task-1', title: 'Alpha' }
    const task2: Task = { ...mockTask, id: 'task-2', title: 'Beta' }
    const task3: Task = { ...mockTask, id: 'task-3', title: 'Gamma' }
    const pendingOps = new Map<string, PendingOperation>([
      ['op-x', { opId: 'op-x', taskId: 'task-2', snapshot: task2, opType: 'move' }],
    ])
    renderColumn([task1, task2, task3], false, initialFilterState, pendingOps)

    const cards = screen.getAllByTestId('task-card')
    const alpha = cards.find(c => c.textContent === 'Alpha')
    const beta = cards.find(c => c.textContent === 'Beta')
    const gamma = cards.find(c => c.textContent === 'Gamma')

    expect(alpha).toHaveAttribute('aria-busy', 'false')
    expect(beta).toHaveAttribute('aria-busy', 'true')
    expect(gamma).toHaveAttribute('aria-busy', 'false')
  })

  it('all task cards get isPending=false when pendingOps is empty', () => {
    const task1: Task = { ...mockTask, id: 'task-1', title: 'Task One' }
    const task2: Task = { ...mockTask, id: 'task-2', title: 'Task Two' }
    renderColumn([task1, task2], false, initialFilterState, new Map())

    const cards = screen.getAllByTestId('task-card')
    cards.forEach(card => expect(card).toHaveAttribute('aria-busy', 'false'))
  })

  it('virtualizer renders only overscan window, not all items', () => {
    // With jsdom (no layout), virtualizer renders only the overscan window (up to ~5 items)
    const manyTasks: Task[] = Array.from({ length: 20 }, (_, i) => ({
      ...mockTask,
      id: `task-${i}`,
      title: `Task ${i}`,
    }))
    renderColumn(manyTasks)
    const renderedCards = screen.getAllByTestId('task-card')
    expect(renderedCards.length).toBeGreaterThan(0)
    expect(renderedCards.length).toBeLessThan(20)
  })

  it('SortableContext receives ALL column task IDs even when virtualizer renders only a subset', () => {
    const manyTasks: Task[] = Array.from({ length: 20 }, (_, i) => ({
      ...mockTask,
      id: `task-${i}`,
      title: `Task ${i}`,
    }))
    renderColumn(manyTasks)
    const allExpectedIds = manyTasks.map(t => t.id)
    expect(mockSortableContext).toHaveBeenCalledWith(
      expect.objectContaining({ items: allExpectedIds }),
      expect.anything()
    )
  })
})
