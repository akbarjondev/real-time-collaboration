import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createElement } from 'react'
import { useBoardDnd } from '@/features/board/hooks/useBoardDnd'
import { BoardAPIContext, type BoardAPIContextType } from '@/store/BoardAPIContext'
import { BoardStateContext } from '@/store/BoardStateContext'
import type { Task, TaskStatus } from '@/types/task.types'
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core'

vi.mock('sonner', () => ({ toast: { error: vi.fn() } }))

const mockTask: Task = {
  id: 'task-1',
  title: 'Fix login bug',
  description: 'desc',
  assignee: 'Alice',
  status: 'todo',
  priority: 'high',
  tags: [],
  createdAt: '2026-01-15T10:00:00.000Z',
}

const mockMoveTask = vi.fn()

const mockBoardAPI: BoardAPIContextType = {
  moveTask: mockMoveTask,
  createTask: vi.fn(),
  updateTask: vi.fn(),
  deleteTask: vi.fn(),
}

function wrapper({ children }: { children: React.ReactNode }) {
  return createElement(
    BoardStateContext.Provider,
    { value: [mockTask] },
    createElement(BoardAPIContext.Provider, { value: mockBoardAPI }, children)
  )
}

describe('useBoardDnd', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockMoveTask.mockResolvedValue(undefined)
  })

  it('sets activeTask on handleDragStart', () => {
    const { result } = renderHook(() => useBoardDnd(), { wrapper })

    act(() => {
      result.current.handleDragStart({ active: { id: 'task-1' } } as DragStartEvent)
    })

    expect(result.current.activeTask).toEqual(mockTask)
  })

  it('clears activeTask on handleDragEnd', async () => {
    const { result } = renderHook(() => useBoardDnd(), { wrapper })

    act(() => {
      result.current.handleDragStart({ active: { id: 'task-1' } } as DragStartEvent)
    })

    await act(async () => {
      await result.current.handleDragEnd({
        active: { id: 'task-1' },
        over: null,
      } as DragEndEvent)
    })

    expect(result.current.activeTask).toBeNull()
  })

  it('calls moveTask when card dropped into a different column', async () => {
    const { result } = renderHook(() => useBoardDnd(), { wrapper })

    await act(async () => {
      await result.current.handleDragEnd({
        active: { id: 'task-1' },
        over: { id: 'in-progress' },
      } as DragEndEvent)
    })

    expect(mockMoveTask).toHaveBeenCalledWith('task-1', 'in-progress' as TaskStatus)
  })

  it('does not call moveTask when dropped in same column', async () => {
    const { result } = renderHook(() => useBoardDnd(), { wrapper })

    await act(async () => {
      await result.current.handleDragEnd({
        active: { id: 'task-1' },
        over: { id: 'todo' },
      } as DragEndEvent)
    })

    expect(mockMoveTask).not.toHaveBeenCalled()
  })

  it('does not call moveTask when over is null', async () => {
    const { result } = renderHook(() => useBoardDnd(), { wrapper })

    await act(async () => {
      await result.current.handleDragEnd({
        active: { id: 'task-1' },
        over: null,
      } as DragEndEvent)
    })

    expect(mockMoveTask).not.toHaveBeenCalled()
  })

  it('shows toast on moveTask error', async () => {
    const { toast } = await import('sonner')
    mockMoveTask.mockRejectedValue(new Error('API failed'))
    const { result } = renderHook(() => useBoardDnd(), { wrapper })

    await act(async () => {
      await result.current.handleDragEnd({
        active: { id: 'task-1' },
        over: { id: 'done' },
      } as DragEndEvent)
    })

    expect(toast.error).toHaveBeenCalledWith(
      'Move failed — "Fix login bug" has been reverted',
      { duration: Infinity }
    )
  })

  it('resolves target column when dropped on another task', async () => {
    const secondTask: Task = {
      ...mockTask,
      id: 'task-2',
      status: 'in-progress',
    }

    function wrapperTwo({ children }: { children: React.ReactNode }) {
      return createElement(
        BoardStateContext.Provider,
        { value: [mockTask, secondTask] },
        createElement(BoardAPIContext.Provider, { value: mockBoardAPI }, children)
      )
    }

    const { result } = renderHook(() => useBoardDnd(), { wrapper: wrapperTwo })

    await act(async () => {
      await result.current.handleDragEnd({
        active: { id: 'task-1' },
        over: { id: 'task-2' },
      } as DragEndEvent)
    })

    expect(mockMoveTask).toHaveBeenCalledWith('task-1', 'in-progress')
  })
})
