import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createElement } from 'react'
import { useBoardAPI, BoardAPIProvider } from '@/store/BoardAPIContext'
import * as tasksApi from '@/api/tasks'
import { MockApiError } from '@/api/mock-client'
import type { Task } from '@/types/task.types'

vi.mock('@/api/tasks', () => ({
  createTask: vi.fn(),
  updateTask: vi.fn(),
  deleteTask: vi.fn(),
  moveTask: vi.fn(),
}))

describe('BoardAPIContext — context stability', () => {
  it('boardAPI reference is stable across re-renders with the same dispatch', () => {
    const mockDispatch = vi.fn()

    function wrapper({ children }: { children: React.ReactNode }) {
      return createElement(BoardAPIProvider, { dispatch: mockDispatch, children })
    }

    const { result, rerender } = renderHook(() => useBoardAPI(), { wrapper })
    const firstRef = result.current

    rerender()

    expect(result.current).toBe(firstRef)
  })
})

describe('BoardAPIContext — moveTask optimistic flow', () => {
  const mockDispatch = vi.fn()

  function wrapper({ children }: { children: React.ReactNode }) {
    return createElement(BoardAPIProvider, { dispatch: mockDispatch, children })
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('dispatches TASK_MOVE immediately on call', async () => {
    vi.mocked(tasksApi.moveTask).mockResolvedValue({} as Task)
    const { result } = renderHook(() => useBoardAPI(), { wrapper })

    await act(async () => {
      await result.current.moveTask('task-1', 'done')
    })

    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'TASK_MOVE', taskId: 'task-1', newStatus: 'done' })
    )
  })

  it('calls apiMoveTask with correct args', async () => {
    vi.mocked(tasksApi.moveTask).mockResolvedValue({} as Task)
    const { result } = renderHook(() => useBoardAPI(), { wrapper })

    await act(async () => {
      await result.current.moveTask('task-1', 'in-progress')
    })

    expect(tasksApi.moveTask).toHaveBeenCalledWith('task-1', 'in-progress')
  })

  it('dispatches OP_SUCCESS after successful API call', async () => {
    vi.mocked(tasksApi.moveTask).mockResolvedValue({} as Task)
    const { result } = renderHook(() => useBoardAPI(), { wrapper })

    await act(async () => {
      await result.current.moveTask('task-1', 'done')
    })

    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'OP_SUCCESS' })
    )
  })

  it('dispatches OP_ROLLBACK and throws on MockApiError', async () => {
    vi.mocked(tasksApi.moveTask).mockRejectedValue(new MockApiError())
    const { result } = renderHook(() => useBoardAPI(), { wrapper })

    await expect(
      act(async () => {
        await result.current.moveTask('task-1', 'done')
      })
    ).rejects.toBeInstanceOf(MockApiError)

    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'TASK_MOVE' })
    )
    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'OP_ROLLBACK' })
    )
  })

  it('does NOT dispatch OP_SUCCESS on failure', async () => {
    vi.mocked(tasksApi.moveTask).mockRejectedValue(new MockApiError())
    const { result } = renderHook(() => useBoardAPI(), { wrapper })

    await expect(
      act(async () => {
        await result.current.moveTask('task-1', 'done')
      })
    ).rejects.toBeInstanceOf(MockApiError)

    expect(mockDispatch).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: 'OP_SUCCESS' })
    )
  })
})
