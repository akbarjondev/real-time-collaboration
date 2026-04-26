import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createElement } from 'react'
import { useHistoryImpl } from '@/features/history/hooks/useHistory'
import { BoardAPIProvider } from '@/store/BoardAPIContext'
import * as tasksApi from '@/api/tasks'
import type { Task } from '@/types/task.types'

vi.mock('@/api/tasks', () => ({
  createTask: vi.fn(),
  updateTask: vi.fn(),
  deleteTask: vi.fn(),
  moveTask: vi.fn(),
}))

const MOCK_TASK: Task = {
  id: 'task-1',
  title: 'Test Task',
  status: 'todo',
  priority: 'low',
  tags: [],
  createdAt: '2024-01-01T00:00:00.000Z',
}

describe('useHistoryImpl', () => {
  const mockDispatch = vi.fn()
  const mockTasks: Task[] = [MOCK_TASK]

  function wrapper({ children }: { children: React.ReactNode }) {
    return createElement(BoardAPIProvider, { dispatch: mockDispatch, children })
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(tasksApi.moveTask).mockResolvedValue({} as Task)
    vi.mocked(tasksApi.createTask).mockResolvedValue({} as Task)
    vi.mocked(tasksApi.updateTask).mockResolvedValue({} as Task)
    vi.mocked(tasksApi.deleteTask).mockResolvedValue(undefined)
  })

  it('starts with empty stack, cursor -1, canUndo=false, canRedo=false', () => {
    const { result } = renderHook(() => useHistoryImpl(mockDispatch, []), { wrapper })
    expect(result.current.canUndo).toBe(false)
    expect(result.current.canRedo).toBe(false)
    expect(result.current.cursor).toBe(-1)
    expect(result.current.stack).toHaveLength(0)
  })

  it('pushing a TASK_CREATE entry via moveTask advances cursor and sets canUndo=true', async () => {
    const { result } = renderHook(() => useHistoryImpl(mockDispatch, mockTasks), { wrapper })

    await act(async () => {
      await result.current.moveTask('task-1', 'done')
    })

    expect(result.current.canUndo).toBe(true)
    expect(result.current.cursor).toBe(0)
    expect(result.current.stack).toHaveLength(1)
  })

  it('pushing 51 entries caps stack at 50 and cursor stays at 49', async () => {
    const { result } = renderHook(() => useHistoryImpl(mockDispatch, mockTasks), { wrapper })

    for (let i = 0; i < 51; i++) {
      await act(async () => {
        await result.current.moveTask('task-1', i % 2 === 0 ? 'done' : 'todo')
      })
    }

    expect(result.current.stack).toHaveLength(50)
    expect(result.current.cursor).toBe(49)
  })

  it('undo decrements cursor and dispatches HISTORY_APPLY with inverse action', async () => {
    const { result } = renderHook(() => useHistoryImpl(mockDispatch, mockTasks), { wrapper })

    await act(async () => {
      await result.current.moveTask('task-1', 'done')
    })

    vi.clearAllMocks()

    act(() => {
      result.current.undo()
    })

    expect(result.current.cursor).toBe(-1)
    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'HISTORY_APPLY',
        action: expect.objectContaining({ type: 'TASK_MOVE', newStatus: 'todo' }),
      })
    )
  })

  it('redo after undo increments cursor and dispatches HISTORY_APPLY with forward action', async () => {
    const { result } = renderHook(() => useHistoryImpl(mockDispatch, mockTasks), { wrapper })

    await act(async () => {
      await result.current.moveTask('task-1', 'done')
    })

    act(() => { result.current.undo() })
    vi.clearAllMocks()

    act(() => { result.current.redo() })

    expect(result.current.cursor).toBe(0)
    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'HISTORY_APPLY',
        action: expect.objectContaining({ type: 'TASK_MOVE', newStatus: 'done' }),
      })
    )
  })

  it('new push after undo clears redo entries', async () => {
    const { result } = renderHook(() => useHistoryImpl(mockDispatch, mockTasks), { wrapper })

    await act(async () => { await result.current.moveTask('task-1', 'done') })
    await act(async () => { await result.current.moveTask('task-1', 'in-progress') })

    act(() => { result.current.undo() })
    expect(result.current.canRedo).toBe(true)

    await act(async () => { await result.current.moveTask('task-1', 'todo') })

    expect(result.current.canRedo).toBe(false)
    expect(result.current.stack).toHaveLength(2)
  })

  it('canUndo=false when cursor=-1; canRedo=false when cursor=stack.length-1', async () => {
    const { result } = renderHook(() => useHistoryImpl(mockDispatch, mockTasks), { wrapper })

    expect(result.current.canUndo).toBe(false)

    await act(async () => { await result.current.moveTask('task-1', 'done') })

    expect(result.current.canUndo).toBe(true)
    expect(result.current.canRedo).toBe(false)
  })

  it('undoLabel reflects stack[cursor].label and redoLabel reflects stack[cursor+1].label', async () => {
    const { result } = renderHook(() => useHistoryImpl(mockDispatch, mockTasks), { wrapper })

    await act(async () => { await result.current.moveTask('task-1', 'done') })
    await act(async () => { await result.current.moveTask('task-1', 'in-progress') })

    expect(result.current.undoLabel).toBe('Move "Test Task" to In Progress')
    expect(result.current.redoLabel).toBeNull()

    act(() => { result.current.undo() })

    expect(result.current.undoLabel).toBe('Move "Test Task" to Done')
    expect(result.current.redoLabel).toBe('Move "Test Task" to In Progress')
  })

  it('calling undo() when canUndo=false is a no-op (dispatch not called)', () => {
    const { result } = renderHook(() => useHistoryImpl(mockDispatch, []), { wrapper })

    act(() => { result.current.undo() })

    expect(mockDispatch).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: 'HISTORY_APPLY' })
    )
  })

  it('calling redo() when canRedo=false is a no-op (dispatch not called)', async () => {
    const { result } = renderHook(() => useHistoryImpl(mockDispatch, mockTasks), { wrapper })

    await act(async () => { await result.current.moveTask('task-1', 'done') })
    vi.clearAllMocks()

    act(() => { result.current.redo() })

    expect(mockDispatch).not.toHaveBeenCalled()
  })
})
