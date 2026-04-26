import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useRealtimeSimulation } from '@/features/realtime/hooks/useRealtimeSimulation'
import { toast } from 'sonner'

vi.mock('sonner', () => ({
  toast: {
    info: vi.fn(),
    warning: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
  },
}))

const mockDispatch = vi.fn()

const task1 = {
  id: 'task-1',
  title: 'Fix login bug',
  status: 'todo' as const,
  priority: 'high' as const,
  tags: [],
  createdAt: '2026-01-01T00:00:00Z',
}

const defaultTasks = [
  task1,
  {
    id: 'task-2',
    title: 'Add dark mode',
    status: 'in-progress' as const,
    priority: 'medium' as const,
    tags: [],
    createdAt: '2026-01-02T00:00:00Z',
  },
]

vi.mock('@/store/BoardStateContext', () => ({
  useTasks: vi.fn(() => defaultTasks),
  BoardStateContext: {},
}))

vi.mock('@/store/BoardDispatchContext', () => ({
  useBoardDispatch: vi.fn(() => mockDispatch),
  BoardDispatchContext: {},
}))

const { useTasks } = vi.mocked(await import('@/store/BoardStateContext'))

describe('useRealtimeSimulation', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
    vi.mocked(useTasks).mockReturnValue(defaultTasks)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('dispatches REMOTE_UPDATE when editingTaskId does not match selected task', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)

    renderHook(() => useRealtimeSimulation(null))

    act(() => { vi.advanceTimersByTime(15000) })

    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'REMOTE_UPDATE' })
    )
  })

  it('calls toast.info with correct message and id after REMOTE_UPDATE', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)

    renderHook(() => useRealtimeSimulation(null))

    act(() => { vi.advanceTimersByTime(15000) })

    expect(vi.mocked(toast.info)).toHaveBeenCalledWith(
      '"Fix login bug" was updated by another user',
      expect.objectContaining({ id: 'remote-task-1', duration: 4000 })
    )
  })

  it('dispatches CONFLICT_DETECTED when editingTaskId matches selected task', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)

    renderHook(() => useRealtimeSimulation('task-1'))

    act(() => { vi.advanceTimersByTime(15000) })

    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'CONFLICT_DETECTED', taskId: 'task-1' })
    )
  })

  it('does NOT call toast.info when CONFLICT_DETECTED is dispatched', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)

    renderHook(() => useRealtimeSimulation('task-1'))

    act(() => { vi.advanceTimersByTime(15000) })

    expect(vi.mocked(toast.info)).not.toHaveBeenCalled()
  })

  it('does not dispatch when tasks list is empty', () => {
    vi.mocked(useTasks).mockReturnValue([])

    renderHook(() => useRealtimeSimulation(null))

    act(() => { vi.advanceTimersByTime(15000) })

    expect(mockDispatch).not.toHaveBeenCalled()
  })

  it('calls clearTimeout on unmount (cleanup)', () => {
    const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout')

    const { unmount } = renderHook(() => useRealtimeSimulation(null))
    unmount()

    expect(clearTimeoutSpy).toHaveBeenCalled()
  })

  it('noUncheckedIndexedAccess guard — single task array produces a valid task', () => {
    vi.mocked(useTasks).mockReturnValue([task1])
    vi.spyOn(Math, 'random').mockReturnValue(0)

    renderHook(() => useRealtimeSimulation(null))

    act(() => { vi.advanceTimersByTime(15000) })

    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'REMOTE_UPDATE' })
    )
  })

  it('re-arms the timer recursively after firing', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    const setTimeoutSpy = vi.spyOn(globalThis, 'setTimeout')

    renderHook(() => useRealtimeSimulation(null))

    const initialCalls = setTimeoutSpy.mock.calls.length

    act(() => { vi.advanceTimersByTime(15000) })

    expect(setTimeoutSpy.mock.calls.length).toBeGreaterThan(initialCalls)
  })

  it('toast deduplication — rapid dispatches for same taskId use same toast id', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)

    renderHook(() => useRealtimeSimulation(null))

    act(() => { vi.advanceTimersByTime(15000) })
    act(() => { vi.advanceTimersByTime(15000) })

    vi.mocked(toast.info).mock.calls.forEach(callArgs => {
      const opts = callArgs[1] as { id: string }
      expect(opts.id).toBe('remote-task-1')
    })
  })

  it('dispatches CONFLICT_DETECTED after editingTaskId changes via re-render (regression for stale closure fix)', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)

    // Mount with null — simulates component mount before any task is opened
    const { rerender } = renderHook(
      ({ id }: { id: string | null }) => useRealtimeSimulation(id),
      { initialProps: { id: null } as { id: string | null } }
    )

    // Simulate user opening a task edit modal after mount
    rerender({ id: 'task-1' })

    act(() => { vi.advanceTimersByTime(15000) })

    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'CONFLICT_DETECTED', taskId: 'task-1' })
    )
  })
})

