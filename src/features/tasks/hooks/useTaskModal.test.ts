import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useTaskModal } from '@/features/tasks/hooks/useTaskModal'
import type { Task } from '@/types/task.types'

const mockTask: Task = {
  id: 'task-1',
  title: 'Fix login bug',
  status: 'todo',
  priority: 'high',
  tags: [],
  createdAt: '2026-01-15T10:00:00.000Z',
}

describe('useTaskModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('initializes with modal closed', () => {
    const { result } = renderHook(() => useTaskModal())
    expect(result.current.isOpen).toBe(false)
    expect(result.current.mode).toBe('create')
    expect(result.current.editingTask).toBeNull()
  })

  it('openCreate opens the modal in create mode', () => {
    const { result } = renderHook(() => useTaskModal())
    act(() => { result.current.openCreate() })
    expect(result.current.isOpen).toBe(true)
    expect(result.current.mode).toBe('create')
    expect(result.current.editingTask).toBeNull()
  })

  it('openCreate accepts prefill values', () => {
    const { result } = renderHook(() => useTaskModal())
    act(() => { result.current.openCreate({ title: 'Pre-filled', assignee: 'Bob' }) })
    expect(result.current.prefillValues).toEqual({ title: 'Pre-filled', assignee: 'Bob' })
  })

  it('openEdit opens the modal in edit mode with the task', () => {
    const { result } = renderHook(() => useTaskModal())
    act(() => { result.current.openEdit(mockTask) })
    expect(result.current.isOpen).toBe(true)
    expect(result.current.mode).toBe('edit')
    expect(result.current.editingTask).toEqual(mockTask)
  })

  it('close sets isOpen to false', () => {
    const { result } = renderHook(() => useTaskModal())
    act(() => { result.current.openCreate() })
    act(() => { result.current.close() })
    expect(result.current.isOpen).toBe(false)
  })

  it('N keyboard shortcut opens modal when not focused on input', () => {
    const { result } = renderHook(() => useTaskModal())
    expect(result.current.isOpen).toBe(false)
    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'n', bubbles: true }))
    })
    expect(result.current.isOpen).toBe(true)
    expect(result.current.mode).toBe('create')
  })

  it('N shortcut does NOT fire when modal is already open', () => {
    const { result } = renderHook(() => useTaskModal())
    act(() => { result.current.openCreate() })
    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'n', bubbles: true }))
    })
    // Modal was already open — state should not change
    expect(result.current.isOpen).toBe(true)
  })

  it('N shortcut is case-insensitive (capital N also works)', () => {
    const { result } = renderHook(() => useTaskModal())
    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'N', bubbles: true }))
    })
    expect(result.current.isOpen).toBe(true)
  })

  it('N shortcut does NOT fire when an input is focused', () => {
    const input = document.createElement('input')
    document.body.appendChild(input)
    input.focus()

    const { result } = renderHook(() => useTaskModal())
    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'n', bubbles: true }))
    })
    expect(result.current.isOpen).toBe(false)

    document.body.removeChild(input)
  })

  it('N shortcut does NOT fire when a textarea is focused', () => {
    const textarea = document.createElement('textarea')
    document.body.appendChild(textarea)
    textarea.focus()

    const { result } = renderHook(() => useTaskModal())
    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'n', bubbles: true }))
    })
    expect(result.current.isOpen).toBe(false)

    document.body.removeChild(textarea)
  })
})
