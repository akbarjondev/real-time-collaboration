import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useDroppable } from '@dnd-kit/core'
import { BoardColumn } from '@/features/board/components/BoardColumn'
import { BoardStateContext } from '@/store/BoardStateContext'
import type { Task } from '@/types/task.types'

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

function renderColumn(tasks: Task[] = [], isOver = false) {
  vi.mocked(useDroppable).mockReturnValue({ isOver, setNodeRef: mockSetNodeRef } as ReturnType<typeof useDroppable>)
  return render(
    <BoardStateContext.Provider value={tasks}>
      <BoardColumn
        status="todo"
        title="Todo"
        onOpenCreate={vi.fn()}
        onOpenEdit={vi.fn()}
      />
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
})
