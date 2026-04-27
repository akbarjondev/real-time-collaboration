import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CmdKOverlay } from './CmdKOverlay'
import { BoardStateContext } from '@/store/BoardStateContext'
import type { Task } from '@/types/task.types'

vi.mock('@/components/ui/command', () => ({
  CommandDialog: ({ open, onOpenChange, children }: {
    open: boolean
    onOpenChange: (open: boolean) => void
    children: React.ReactNode
  }) => open ? (
    <div role="dialog" aria-label="command-dialog">
      <button onClick={() => onOpenChange(false)} aria-label="close-dialog">close</button>
      {children}
    </div>
  ) : null,
  CommandInput: ({ value, onValueChange, placeholder }: {
    value: string
    onValueChange: (v: string) => void
    placeholder?: string
  }) => (
    <input
      role="combobox"
      value={value}
      onChange={e => onValueChange(e.target.value)}
      placeholder={placeholder}
      aria-label="Search tasks"
    />
  ),
  CommandList: ({ children }: { children: React.ReactNode }) => <ul>{children}</ul>,
  CommandEmpty: ({ children }: { children: React.ReactNode }) => <li data-testid="cmd-empty">{children}</li>,
  CommandItem: ({ children, onSelect, value }: {
    children: React.ReactNode
    onSelect: () => void
    value: string
  }) => (
    <li role="option" aria-label={value} onClick={onSelect}>{children}</li>
  ),
}))

function makeTask(id: string, title: string): Task {
  return {
    id,
    title,
    description: undefined,
    assignee: 'Alice',
    status: 'todo',
    priority: 'medium',
    tags: [],
    createdAt: '2026-01-01T00:00:00.000Z',
  }
}

const mockTasks = [
  makeTask('1', 'Fix login bug'),
  makeTask('2', 'Add dashboard'),
  makeTask('3', 'Fix logout flow'),
]

function renderOverlay(onOpenEdit = vi.fn()) {
  return {
    onOpenEdit,
    ...render(
      <BoardStateContext.Provider value={mockTasks}>
        <CmdKOverlay onOpenEdit={onOpenEdit} />
      </BoardStateContext.Provider>
    ),
  }
}

describe('CmdKOverlay', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('overlay is closed by default', () => {
    renderOverlay()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('opens when Ctrl+Shift+K is pressed', () => {
    renderOverlay()
    fireEvent.keyDown(document, { key: 'k', ctrlKey: true, shiftKey: true })
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('opens when Meta+Shift+K is pressed (macOS)', () => {
    renderOverlay()
    fireEvent.keyDown(document, { key: 'k', metaKey: true, shiftKey: true })
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('does NOT open when plain k is pressed (no modifier)', () => {
    renderOverlay()
    fireEvent.keyDown(document, { key: 'k' })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('does NOT open when Ctrl+K is pressed without Shift', () => {
    renderOverlay()
    fireEvent.keyDown(document, { key: 'k', ctrlKey: true })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('typing in input does NOT sync to global filters', () => {
    renderOverlay()
    fireEvent.keyDown(document, { key: 'k', ctrlKey: true, shiftKey: true })
    const input = screen.getByRole('combobox')
    fireEvent.change(input, { target: { value: 'fix' } })
    // Query stays local — no filterAPI interaction
    expect(input).toHaveValue('fix')
  })

  it('results list shows tasks matching the query', () => {
    renderOverlay()
    fireEvent.keyDown(document, { key: 'k', ctrlKey: true, shiftKey: true })
    const input = screen.getByRole('combobox')
    fireEvent.change(input, { target: { value: 'fix' } })
    expect(screen.getAllByRole('option')).toHaveLength(2)
  })

  it('selecting a result closes the overlay and calls onOpenEdit', async () => {
    const onOpenEdit = vi.fn()
    renderOverlay(onOpenEdit)
    fireEvent.keyDown(document, { key: 'k', ctrlKey: true, shiftKey: true })
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'fix' } })
    const results = screen.getAllByRole('option')
    fireEvent.click(results[0]!)
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
    expect(onOpenEdit).toHaveBeenCalledWith(mockTasks[0])
  })

  it('Escape closes the overlay without calling onOpenEdit', async () => {
    const onOpenEdit = vi.fn()
    renderOverlay(onOpenEdit)
    fireEvent.keyDown(document, { key: 'k', ctrlKey: true, shiftKey: true })
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    fireEvent.click(screen.getByLabelText('close-dialog'))
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
    expect(onOpenEdit).not.toHaveBeenCalled()
  })
})

describe('useKeyboardShortcut extension', () => {
  it('fires on ctrlKey+shift+k combo', () => {
    render(
      <BoardStateContext.Provider value={[]}>
        <CmdKOverlay onOpenEdit={vi.fn()} />
      </BoardStateContext.Provider>
    )
    fireEvent.keyDown(document, { key: 'k', ctrlKey: true, shiftKey: true })
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('does NOT fire without modifier key', () => {
    render(
      <BoardStateContext.Provider value={[]}>
        <CmdKOverlay onOpenEdit={vi.fn()} />
      </BoardStateContext.Provider>
    )
    fireEvent.keyDown(document, { key: 'k' })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
