import { renderHook } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createElement } from 'react'
import { useUndoRedoShortcuts } from '@/features/history/hooks/useUndoRedoShortcuts'
import { HistoryContext } from '@/store/HistoryContext'
import type { HistoryContextType } from '@/store/HistoryContext'

function makeHistory(overrides: Partial<HistoryContextType> = {}): HistoryContextType {
  return {
    canUndo: true,
    undoLabel: 'Move "Task" to Done',
    canRedo: false,
    redoLabel: null,
    undo: vi.fn(),
    redo: vi.fn(),
    moveTask: vi.fn(),
    createTask: vi.fn(),
    updateTask: vi.fn(),
    deleteTask: vi.fn(),
    ...overrides,
  }
}

function fireKey(key: string, opts: Partial<KeyboardEventInit> = {}) {
  document.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, ...opts }))
}

describe('useUndoRedoShortcuts', () => {
  let undo: ReturnType<typeof vi.fn>
  let redo: ReturnType<typeof vi.fn>
  let historyValue: HistoryContextType

  beforeEach(() => {
    undo = vi.fn()
    redo = vi.fn()
    historyValue = makeHistory({ undo: undo as () => void, redo: redo as () => void })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  function wrapper({ children }: { children: React.ReactNode }) {
    return createElement(HistoryContext.Provider, { value: historyValue }, children)
  }

  it('Ctrl+Z fires undo', () => {
    renderHook(() => useUndoRedoShortcuts(), { wrapper })
    fireKey('z', { ctrlKey: true })
    expect(undo).toHaveBeenCalledOnce()
    expect(redo).not.toHaveBeenCalled()
  })

  it('Cmd+Z (metaKey) fires undo', () => {
    renderHook(() => useUndoRedoShortcuts(), { wrapper })
    fireKey('z', { metaKey: true })
    expect(undo).toHaveBeenCalledOnce()
  })

  it('Ctrl+Shift+Z fires redo', () => {
    renderHook(() => useUndoRedoShortcuts(), { wrapper })
    fireKey('z', { ctrlKey: true, shiftKey: true })
    expect(redo).toHaveBeenCalledOnce()
    expect(undo).not.toHaveBeenCalled()
  })

  it('Cmd+Shift+Z fires redo', () => {
    renderHook(() => useUndoRedoShortcuts(), { wrapper })
    fireKey('z', { metaKey: true, shiftKey: true })
    expect(redo).toHaveBeenCalledOnce()
  })

  it('Ctrl+Z is suppressed when activeElement is inside a [role="dialog"]', () => {
    const dialog = document.createElement('div')
    dialog.setAttribute('role', 'dialog')
    const input = document.createElement('input')
    dialog.appendChild(input)
    document.body.appendChild(dialog)
    input.focus()

    renderHook(() => useUndoRedoShortcuts(), { wrapper })
    fireKey('z', { ctrlKey: true })
    expect(undo).not.toHaveBeenCalled()

    document.body.removeChild(dialog)
  })

  it('Ctrl+Z is suppressed when an input element is focused', () => {
    const input = document.createElement('input')
    document.body.appendChild(input)
    input.focus()

    renderHook(() => useUndoRedoShortcuts(), { wrapper })
    fireKey('z', { ctrlKey: true })
    expect(undo).not.toHaveBeenCalled()

    document.body.removeChild(input)
  })

  it('Ctrl+Z is suppressed when a textarea element is focused', () => {
    const textarea = document.createElement('textarea')
    document.body.appendChild(textarea)
    textarea.focus()

    renderHook(() => useUndoRedoShortcuts(), { wrapper })
    fireKey('z', { ctrlKey: true })
    expect(undo).not.toHaveBeenCalled()

    document.body.removeChild(textarea)
  })

  it('plain Z key does NOT trigger undo (no modifier)', () => {
    renderHook(() => useUndoRedoShortcuts(), { wrapper })
    fireKey('z')
    expect(undo).not.toHaveBeenCalled()
    expect(redo).not.toHaveBeenCalled()
  })

  it('Ctrl+Z is NOT suppressed when document.activeElement is null (no modal present)', () => {
    // jsdom sets activeElement to document.body by default, but test the guard logic via
    // confirming shortcuts fire normally when no modal or input is focused
    renderHook(() => useUndoRedoShortcuts(), { wrapper })
    fireKey('z', { ctrlKey: true })
    expect(undo).toHaveBeenCalledOnce()
  })

  it('event listener is removed on unmount', () => {
    const removespy = vi.spyOn(document, 'removeEventListener')
    const { unmount } = renderHook(() => useUndoRedoShortcuts(), { wrapper })
    unmount()
    expect(removespy).toHaveBeenCalledWith('keydown', expect.any(Function))
    removespy.mockRestore()
  })
})
