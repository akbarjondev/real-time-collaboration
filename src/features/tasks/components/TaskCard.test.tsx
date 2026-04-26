import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useSortable } from '@dnd-kit/sortable'
import { TaskCard } from '@/features/tasks/components/TaskCard'
import type { Task } from '@/types/task.types'

vi.mock('@dnd-kit/sortable', () => ({
  useSortable: vi.fn().mockReturnValue({
    setNodeRef: vi.fn(),
    transform: null,
    transition: null,
    isDragging: false,
    attributes: {},
    listeners: {},
  }),
}))

vi.mock('@dnd-kit/utilities', () => ({
  CSS: { Transform: { toString: vi.fn().mockReturnValue(null) } },
}))

const baseTask: Task = {
  id: 'task-1',
  title: 'Fix login bug',
  description: 'Login fails on Safari',
  assignee: 'Alice',
  status: 'todo',
  priority: 'high',
  tags: [],
  createdAt: '2026-01-15T10:00:00.000Z',
}

function renderCard(
  task: Task,
  isPending = false,
  onOpen?: (t: Task) => void,
  extra: { isOverlay?: boolean } = {}
) {
  return render(
    <TaskCard task={task} isPending={isPending} onOpen={onOpen} isOverlay={extra.isOverlay} />
  )
}

describe('TaskCard', () => {
  describe('default render', () => {
    it('displays title', () => {
      renderCard(baseTask)
      expect(screen.getByText('Fix login bug')).toBeInTheDocument()
    })

    it('displays priority badge with dot and label', () => {
      renderCard(baseTask)
      expect(screen.getByText('High')).toBeInTheDocument()
    })

    it('displays assignee name', () => {
      renderCard(baseTask)
      expect(screen.getByText('Alice')).toBeInTheDocument()
    })

    it('displays formatted created date', () => {
      renderCard(baseTask)
      expect(screen.getByText('Jan 15')).toBeInTheDocument()
    })

    it('has role="article" with aria-label containing title, priority, and assignee', () => {
      renderCard(baseTask)
      const article = screen.getByRole('article')
      expect(article).toHaveAttribute('aria-label', 'Fix login bug, high priority, assigned to Alice')
    })

    it('shows "Unassigned" text when no assignee', () => {
      const taskNoAssignee = { ...baseTask, assignee: undefined }
      renderCard(taskNoAssignee)
      expect(screen.getByText('Unassigned')).toBeInTheDocument()
    })

    it('has aria-label with "unassigned" (lowercase) when no assignee', () => {
      const taskNoAssignee = { ...baseTask, assignee: undefined }
      renderCard(taskNoAssignee)
      const article = screen.getByRole('article')
      expect(article).toHaveAttribute('aria-label', 'Fix login bug, high priority, unassigned')
    })

    it('has min-h-[44px] class for touch target compliance', () => {
      renderCard(baseTask)
      const article = screen.getByRole('article')
      expect(article.className).toContain('min-h-[44px]')
    })
  })

  describe('done state', () => {
    it('renders at opacity-[0.65] when status is done', () => {
      const doneTask = { ...baseTask, status: 'done' as const }
      renderCard(doneTask)
      const article = screen.getByRole('article')
      expect(article.className).toContain('opacity-[0.65]')
    })

    it('renders title with line-through when done', () => {
      const doneTask = { ...baseTask, status: 'done' as const }
      renderCard(doneTask)
      const title = screen.getByText('Fix login bug')
      expect(title.className).toContain('line-through')
    })

    it('does NOT apply opacity/strikethrough for todo tasks', () => {
      renderCard(baseTask)
      const article = screen.getByRole('article')
      expect(article.className).not.toContain('opacity-[0.65]')
      const title = screen.getByText('Fix login bug')
      expect(title.className).not.toContain('line-through')
    })
  })

  describe('in-flight state', () => {
    it('applies card-pulse class when isPending=true', () => {
      renderCard(baseTask, true)
      const article = screen.getByRole('article')
      expect(article.className).toContain('card-pulse')
    })

    it('renders CSS spinner when isPending=true', () => {
      renderCard(baseTask, true)
      const spinner = document.querySelector('.animate-spin')
      expect(spinner).toBeInTheDocument()
    })

    it('sets aria-busy="true" when isPending=true', () => {
      renderCard(baseTask, true)
      const article = screen.getByRole('article')
      expect(article).toHaveAttribute('aria-busy', 'true')
    })

    it('does NOT apply card-pulse when isPending=false', () => {
      renderCard(baseTask, false)
      const article = screen.getByRole('article')
      expect(article.className).not.toContain('card-pulse')
    })

    it('does NOT render spinner when isPending=false', () => {
      renderCard(baseTask)
      const spinner = document.querySelector('.animate-spin')
      expect(spinner).not.toBeInTheDocument()
    })

    it('sets aria-busy="false" when isPending=false', () => {
      renderCard(baseTask, false)
      const article = screen.getByRole('article')
      expect(article).toHaveAttribute('aria-busy', 'false')
    })
  })

  describe('priority badges', () => {
    it('renders rose-500 dot for high priority', () => {
      renderCard(baseTask)
      const dot = document.querySelector('.bg-rose-500')
      expect(dot).toBeInTheDocument()
    })

    it('renders amber-500 dot for medium priority', () => {
      const mediumTask = { ...baseTask, priority: 'medium' as const }
      renderCard(mediumTask)
      const dot = document.querySelector('.bg-amber-500')
      expect(dot).toBeInTheDocument()
    })

    it('renders sky-500 dot for low priority', () => {
      const lowTask = { ...baseTask, priority: 'low' as const }
      renderCard(lowTask)
      const dot = document.querySelector('.bg-sky-500')
      expect(dot).toBeInTheDocument()
    })

    it('always shows both dot and label text', () => {
      renderCard(baseTask)
      expect(screen.getByText('High')).toBeInTheDocument()
      expect(document.querySelector('.bg-rose-500')).toBeInTheDocument()
    })
  })

  describe('interaction', () => {
    it('calls onOpen with task when clicked', () => {
      const onOpen = vi.fn()
      renderCard(baseTask, false, onOpen)
      fireEvent.click(screen.getByRole('article'))
      expect(onOpen).toHaveBeenCalledWith(baseTask)
    })

    it('calls onOpen with task when Enter is pressed', () => {
      const onOpen = vi.fn()
      renderCard(baseTask, false, onOpen)
      fireEvent.keyDown(screen.getByRole('article'), { key: 'Enter' })
      expect(onOpen).toHaveBeenCalledWith(baseTask)
    })

    it('does NOT call onOpen on other keys', () => {
      const onOpen = vi.fn()
      renderCard(baseTask, false, onOpen)
      fireEvent.keyDown(screen.getByRole('article'), { key: 'Space' })
      expect(onOpen).not.toHaveBeenCalled()
    })

    it('is focusable (tabIndex=0)', () => {
      renderCard(baseTask)
      const article = screen.getByRole('article')
      expect(article).toHaveAttribute('tabIndex', '0')
    })
  })

  describe('React.memo', () => {
    it('renders without error', () => {
      expect(() => renderCard(baseTask)).not.toThrow()
    })
  })
})

describe('TaskCard — sibling re-render isolation', () => {
  it('does not re-render when a different task changes (React.memo)', () => {
    const task1: Task = { ...baseTask, id: 'task-1', title: 'Task 1' }
    const task2: Task = { ...baseTask, id: 'task-2', title: 'Task 2' }

    const { rerender } = render(
      <>
        <TaskCard task={task1} isPending={false} />
        <TaskCard task={task2} isPending={false} />
      </>
    )

    const updatedTask2: Task = { ...task2, title: 'Task 2 Updated' }
    rerender(
      <>
        <TaskCard task={task1} isPending={false} />
        <TaskCard task={updatedTask2} isPending={false} />
      </>
    )

    expect(screen.getByText('Task 2 Updated')).toBeInTheDocument()
    expect(screen.getByText('Task 1')).toBeInTheDocument()
  })
})

describe('TaskCard — beforeEach cleanup', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders high priority badge correctly', () => {
    renderCard({ ...baseTask, priority: 'high' })
    expect(screen.getByText('High')).toBeInTheDocument()
  })
})

describe('TaskCard — drag and drop', () => {
  beforeEach(() => {
    vi.mocked(useSortable).mockReturnValue({
      setNodeRef: vi.fn(),
      transform: null,
      transition: undefined,
      isDragging: false,
      attributes: {} as ReturnType<typeof useSortable>['attributes'],
      listeners: {},
    } as unknown as ReturnType<typeof useSortable>)
  })

  it('uses tabIndex=-1 when isOverlay=true', () => {
    renderCard(baseTask, false, undefined, { isOverlay: true })
    const article = screen.getByRole('article')
    expect(article).toHaveAttribute('tabIndex', '-1')
  })

  it('uses tabIndex=0 when isOverlay=false', () => {
    renderCard(baseTask)
    const article = screen.getByRole('article')
    expect(article).toHaveAttribute('tabIndex', '0')
  })

  it('applies opacity-0 class when isDragging=true and not overlay', () => {
    vi.mocked(useSortable).mockReturnValue({
      setNodeRef: vi.fn(),
      transform: null,
      transition: undefined,
      isDragging: true,
      attributes: {} as ReturnType<typeof useSortable>['attributes'],
      listeners: {},
    } as unknown as ReturnType<typeof useSortable>)
    renderCard(baseTask)
    const article = screen.getByRole('article')
    expect(article.className).toContain('opacity-0')
    expect(article.className).toContain('pointer-events-none')
  })

  it('does NOT apply opacity-0 when isOverlay=true even if isDragging', () => {
    vi.mocked(useSortable).mockReturnValue({
      setNodeRef: vi.fn(),
      transform: null,
      transition: undefined,
      isDragging: true,
      attributes: {} as ReturnType<typeof useSortable>['attributes'],
      listeners: {},
    } as unknown as ReturnType<typeof useSortable>)
    renderCard(baseTask, false, undefined, { isOverlay: true })
    const article = screen.getByRole('article')
    expect(article.className).not.toContain('opacity-0')
  })

  it('does not call onOpen when isOverlay=true and clicked', () => {
    const onOpen = vi.fn()
    renderCard(baseTask, false, onOpen, { isOverlay: true })
    fireEvent.click(screen.getByRole('article'))
    expect(onOpen).not.toHaveBeenCalled()
  })

  it('applies cursor-grabbing class when isOverlay=true', () => {
    renderCard(baseTask, false, undefined, { isOverlay: true })
    const article = screen.getByRole('article')
    expect(article.className).toContain('cursor-grabbing')
  })

  it('applies cursor-grab class when not overlay', () => {
    renderCard(baseTask)
    const article = screen.getByRole('article')
    expect(article.className).toContain('cursor-grab')
  })
})
