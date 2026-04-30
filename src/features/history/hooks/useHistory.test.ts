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

  it('undo calls boardAPI.moveTask with original status and decrements cursor on success', async () => {
    const { result } = renderHook(() => useHistoryImpl(mockDispatch, mockTasks), { wrapper })

    await act(async () => {
      await result.current.moveTask('task-1', 'done')
    })

    vi.clearAllMocks()

    await act(async () => {
      await result.current.undo()
    })

    expect(result.current.cursor).toBe(-1)
    expect(tasksApi.moveTask).toHaveBeenCalledWith('task-1', 'todo')
  })

  it('redo calls boardAPI.moveTask with new status and increments cursor on success', async () => {
    const { result } = renderHook(() => useHistoryImpl(mockDispatch, mockTasks), { wrapper })

    await act(async () => {
      await result.current.moveTask('task-1', 'done')
    })

    await act(async () => {
      await result.current.undo()
    })

    vi.clearAllMocks()

    await act(async () => {
      await result.current.redo()
    })

    expect(result.current.cursor).toBe(0)
    expect(tasksApi.moveTask).toHaveBeenCalledWith('task-1', 'done')
  })

  it('new push after undo clears redo entries', async () => {
    const { result } = renderHook(() => useHistoryImpl(mockDispatch, mockTasks), { wrapper })

    await act(async () => { await result.current.moveTask('task-1', 'done') })
    await act(async () => { await result.current.moveTask('task-1', 'in-progress') })

    await act(async () => { await result.current.undo() })
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

    await act(async () => { await result.current.undo() })

    expect(result.current.undoLabel).toBe('Move "Test Task" to Done')
    expect(result.current.redoLabel).toBe('Move "Test Task" to In Progress')
  })

  it('calling undo() when canUndo=false is a no-op (API not called)', async () => {
    const { result } = renderHook(() => useHistoryImpl(mockDispatch, []), { wrapper })

    await act(async () => { await result.current.undo() })

    expect(tasksApi.moveTask).not.toHaveBeenCalled()
    expect(tasksApi.createTask).not.toHaveBeenCalled()
    expect(tasksApi.updateTask).not.toHaveBeenCalled()
    expect(tasksApi.deleteTask).not.toHaveBeenCalled()
  })

  it('calling redo() when canRedo=false is a no-op (API not called)', async () => {
    const { result } = renderHook(() => useHistoryImpl(mockDispatch, mockTasks), { wrapper })

    await act(async () => { await result.current.moveTask('task-1', 'done') })
    vi.clearAllMocks()

    await act(async () => { await result.current.redo() })

    expect(tasksApi.moveTask).not.toHaveBeenCalled()
  })

  it('undo does not move cursor when API fails', async () => {
    const { result } = renderHook(() => useHistoryImpl(mockDispatch, mockTasks), { wrapper })

    await act(async () => { await result.current.moveTask('task-1', 'done') })
    
    vi.mocked(tasksApi.moveTask).mockRejectedValueOnce(new Error('Network error'))

    await act(async () => { await result.current.undo() })

    expect(result.current.cursor).toBe(0)
    expect(result.current.canUndo).toBe(true)
  })

  it('redo does not move cursor when API fails', async () => {
    const { result } = renderHook(() => useHistoryImpl(mockDispatch, mockTasks), { wrapper })

    await act(async () => { await result.current.moveTask('task-1', 'done') })
    await act(async () => { await result.current.undo() })

    vi.mocked(tasksApi.moveTask).mockRejectedValueOnce(new Error('Network error'))

    await act(async () => { await result.current.redo() })

    expect(result.current.cursor).toBe(-1)
    expect(result.current.canRedo).toBe(true)
  })

  it('undo create calls deleteTask', async () => {
    const { result } = renderHook(() => useHistoryImpl(mockDispatch, mockTasks), { wrapper })

    await act(async () => {
      await result.current.createTask({ title: 'New Task', status: 'todo', priority: 'low', tags: [] })
    })

    vi.clearAllMocks()

    await act(async () => { await result.current.undo() })

    expect(tasksApi.deleteTask).toHaveBeenCalled()
  })

  it('undo delete calls createTask with snapshot', async () => {
    const { result } = renderHook(() => useHistoryImpl(mockDispatch, mockTasks), { wrapper })

    await act(async () => { await result.current.deleteTask('task-1') })

    vi.clearAllMocks()

    await act(async () => { await result.current.undo() })

    expect(tasksApi.createTask).toHaveBeenCalled()
  })

  it('undo update calls updateTask with original values', async () => {
    const { result } = renderHook(() => useHistoryImpl(mockDispatch, mockTasks), { wrapper })

    await act(async () => { await result.current.updateTask('task-1', { title: 'Updated Title' }) })

    vi.clearAllMocks()

    await act(async () => { await result.current.undo() })

    expect(tasksApi.updateTask).toHaveBeenCalledWith('task-1', { title: 'Test Task' })
  })
})
