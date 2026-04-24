import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { createElement } from 'react'
import { UndoHintBar } from '@/features/history/components/UndoHintBar'
import { HistoryContext } from '@/store/HistoryContext'
import type { HistoryContextType } from '@/store/HistoryContext'

function renderWithHistory(value: HistoryContextType) {
  return render(
    createElement(
      HistoryContext.Provider,
      { value },
      createElement(UndoHintBar)
    )
  )
}

function makeHistory(overrides: Partial<HistoryContextType> = {}): HistoryContextType {
  return {
    canUndo: false,
    undoLabel: null,
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

describe('UndoHintBar', () => {
  it('renders "Nothing to undo" when canUndo=false', () => {
    renderWithHistory(makeHistory())
    expect(screen.getByText('Nothing to undo')).toBeDefined()
  })

  it('renders undo button with correct label when canUndo=true', () => {
    renderWithHistory(makeHistory({ canUndo: true, undoLabel: 'Move "Task A" to Done' }))
    expect(screen.getByRole('button', { name: /Undo: Move "Task A" to Done/i })).toBeDefined()
    expect(screen.getByText(/Undo: Move "Task A" to Done/)).toBeDefined()
  })

  it('clicking undo button calls undo()', () => {
    const undo = vi.fn()
    renderWithHistory(makeHistory({ canUndo: true, undoLabel: 'Move "Task A" to Done', undo }))
    fireEvent.click(screen.getByRole('button', { name: /Undo:/i }))
    expect(undo).toHaveBeenCalledOnce()
  })

  it('renders redo button with correct label when canRedo=true', () => {
    renderWithHistory(makeHistory({ canRedo: true, redoLabel: 'Move "Task A" to In Progress' }))
    expect(screen.getByRole('button', { name: /Redo: Move "Task A" to In Progress/i })).toBeDefined()
  })

  it('clicking redo button calls redo()', () => {
    const redo = vi.fn()
    renderWithHistory(makeHistory({ canRedo: true, redoLabel: 'Move "Task A" to Done', redo }))
    fireEvent.click(screen.getByRole('button', { name: /Redo:/i }))
    expect(redo).toHaveBeenCalledOnce()
  })

  it('redo button is absent when canRedo=false', () => {
    renderWithHistory(makeHistory())
    const redoBtn = screen.queryByRole('button', { name: /Redo:/i })
    expect(redoBtn).toBeNull()
  })

  it('container has aria-live="polite"', () => {
    const { container } = renderWithHistory(makeHistory())
    const liveRegion = container.querySelector('[aria-live="polite"]')
    expect(liveRegion).toBeTruthy()
  })
})
