import { render, screen, fireEvent, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { toast } from 'sonner'
import { ConflictModal } from '@/features/realtime/components/ConflictModal'
import { ConflictContext } from '@/store/ConflictContext'
import { BoardDispatchContext } from '@/store/BoardDispatchContext'
import type { ConflictState } from '@/types/common.types'
import type { Task } from '@/types/task.types'

vi.mock('sonner', () => ({
  toast: {
    warning: vi.fn(),
    info: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
  },
}))

vi.mock('@/components/ui/dialog', () => {
  function Dialog({ children, open }: { children: React.ReactNode; open?: boolean }) {
    if (!open) return null
    return React.createElement('div', { role: 'alertdialog' }, children)
  }
  function DialogContent({
    children,
    role: _role,
    'aria-labelledby': _labelledby,
    className: _className,
  }: {
    children: React.ReactNode
    role?: string
    'aria-labelledby'?: string
    className?: string
  }) {
    return React.createElement(
      'div',
      { 'data-testid': 'dialog-content' },
      children
    )
  }
  function DialogHeader({ children }: { children: React.ReactNode }) {
    return React.createElement('div', null, children)
  }
  function DialogTitle({ children, id }: { children: React.ReactNode; id?: string }) {
    return React.createElement('h2', { id }, children)
  }
  return { Dialog, DialogContent, DialogHeader, DialogTitle }
})

const mockDispatch = vi.fn()

const localTask: Task = {
  id: 'task-1',
  title: 'Fix login bug',
  description: 'Login fails on Safari',
  assignee: 'Alice',
  status: 'todo',
  priority: 'high',
  tags: [],
  createdAt: '2026-01-01T00:00:00Z',
}

const remoteTask: Task = {
  ...localTask,
  priority: 'low',
  assignee: 'Bob',
}

const conflict: ConflictState = {
  taskId: 'task-1',
  localTask,
  remoteTask,
}

function renderConflictModal(conflictValue: ConflictState | null) {
  return render(
    <BoardDispatchContext.Provider value={mockDispatch}>
      <ConflictContext.Provider value={conflictValue}>
        <ConflictModal />
      </ConflictContext.Provider>
    </BoardDispatchContext.Provider>
  )
}

describe('ConflictModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders nothing when conflict is null', () => {
    renderConflictModal(null)
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
  })

  it('renders modal with both versions when conflict is non-null', () => {
    renderConflictModal(conflict)
    expect(screen.getByRole('alertdialog')).toBeInTheDocument()
    expect(screen.getByText('My version')).toBeInTheDocument()
    expect(screen.getByText('Their version')).toBeInTheDocument()
  })

  it('displays local task field values', () => {
    renderConflictModal(conflict)
    // Title appears in both columns — check at least one occurrence
    const titleSpans = screen.getAllByText('Fix login bug')
    expect(titleSpans.length).toBeGreaterThanOrEqual(1)
  })

  it('displays remote task field values', () => {
    renderConflictModal(conflict)
    const prioritySpans = screen.getAllByText('low')
    expect(prioritySpans.length).toBeGreaterThanOrEqual(1)
    const assigneeSpans = screen.getAllByText('Bob')
    expect(assigneeSpans.length).toBeGreaterThanOrEqual(1)
  })

  it('highlights differing fields with amber classes', () => {
    const { container } = renderConflictModal(conflict)
    // priority and assignee differ — should have amber highlight
    const highlightedDivs = container.querySelectorAll('.bg-amber-50')
    expect(highlightedDivs.length).toBeGreaterThan(0)
  })

  it('does not highlight matching fields', () => {
    const { container } = renderConflictModal(conflict)
    // title is same in both — count highlighted vs total field divs
    const allFieldDivs = container.querySelectorAll('[class*="rounded px-2 py-1"]')
    const highlightedDivs = container.querySelectorAll('.bg-amber-50')
    expect(highlightedDivs.length).toBeLessThan(allFieldDivs.length)
  })

  it('"Keep mine" dispatches CONFLICT_RESOLVE_MINE', () => {
    renderConflictModal(conflict)
    fireEvent.click(screen.getByRole('button', { name: /keep mine/i }))
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'CONFLICT_RESOLVE_MINE',
      taskId: 'task-1',
    })
  })

  it('"Take theirs" dispatches CONFLICT_RESOLVE_THEIRS with correct remoteTask', () => {
    renderConflictModal(conflict)
    fireEvent.click(screen.getByRole('button', { name: /take theirs/i }))
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'CONFLICT_RESOLVE_THEIRS',
      taskId: 'task-1',
      remoteTask,
    })
  })

  it('"Cancel" dispatches CONFLICT_RESOLVE_MINE', () => {
    renderConflictModal(conflict)
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }))
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'CONFLICT_RESOLVE_MINE',
      taskId: 'task-1',
    })
  })

  it('fires warning toast once on conflict onset', () => {
    renderConflictModal(conflict)
    expect(vi.mocked(toast.warning)).toHaveBeenCalledOnce()
    expect(vi.mocked(toast.warning)).toHaveBeenCalledWith(
      `"${localTask.title}" was changed by another user while you were editing`,
      expect.objectContaining({ duration: 6000 })
    )
  })

  it('does not fire warning toast again on re-render with same conflict', () => {
    const { rerender } = renderConflictModal(conflict)
    // Re-render with same conflict (same taskId)
    act(() => {
      rerender(
        <BoardDispatchContext.Provider value={mockDispatch}>
          <ConflictContext.Provider value={{ ...conflict }}>
            <ConflictModal />
          </ConflictContext.Provider>
        </BoardDispatchContext.Provider>
      )
    })
    // Toast should still only be called once (keyed on taskId)
    expect(vi.mocked(toast.warning)).toHaveBeenCalledTimes(1)
  })
})
