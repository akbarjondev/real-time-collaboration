import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createElement } from 'react'
import { useBoardDnd } from '@/features/board/hooks/useBoardDnd'
import { HistoryContext, type HistoryContextType } from '@/store/HistoryContext'
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

const mockHistory: HistoryContextType = {
  undoLabel: null,
  redoLabel: null,
  canUndo: false,
  canRedo: false,
  undo: vi.fn(),
  redo: vi.fn(),
  moveTask: mockMoveTask,
  createTask: vi.fn(),
  updateTask: vi.fn(),
  deleteTask: vi.fn(),
}

function wrapper({ children }: { children: React.ReactNode }) {
  return createElement(
    BoardStateContext.Provider,
    { value: [mockTask] },
    createElement(HistoryContext.Provider, { value: mockHistory }, children)
  )
}

describe('useBoardDnd', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockMoveTask.mockResolvedValue(undefined)
  })

  it('includes KeyboardSensor in the sensors array', () => {
    const { result } = renderHook(() => useBoardDnd(), { wrapper })
    // sensors is an array of sensor descriptors
    expect(result.current.sensors).toHaveLength(2)
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
        createElement(HistoryContext.Provider, { value: mockHistory }, children)
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
