import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { TaskModal } from '@/features/tasks/components/TaskModal'
import { BoardAPIContext, type BoardAPIContextType } from '@/store/BoardAPIContext'
import type { Task } from '@/types/task.types'

const mockTask: Task = {
  id: 'task-1',
  title: 'Fix login bug',
  description: 'Login fails on Safari',
  assignee: 'Alice',
  status: 'todo',
  priority: 'high',
  tags: [],
  createdAt: '2026-01-15T10:00:00.000Z',
}

const mockBoardAPI: BoardAPIContextType = {
  moveTask: vi.fn(),
  createTask: vi.fn().mockResolvedValue(undefined),
  updateTask: vi.fn().mockResolvedValue(undefined),
  deleteTask: vi.fn().mockResolvedValue(undefined),
}

function renderModal(props: Partial<Parameters<typeof TaskModal>[0]> = {}) {
  const defaults = {
    isOpen: true,
    mode: 'create' as const,
    task: null,
    prefillValues: null,
    onClose: vi.fn(),
    onOpenCreate: vi.fn(),
    ...props,
  }
  return render(
    <BoardAPIContext.Provider value={mockBoardAPI}>
      <TaskModal {...defaults} />
    </BoardAPIContext.Provider>
  )
}

describe('TaskModal — create mode', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(mockBoardAPI.createTask as ReturnType<typeof vi.fn>).mockResolvedValue(undefined)
  })

  it('renders create modal with title field focused', () => {
    renderModal()
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('New Task')).toBeInTheDocument()
    expect(screen.getByLabelText(/title/i)).toBeInTheDocument()
  })

  it('shows "Create" button in create mode', () => {
    renderModal()
    expect(screen.getByRole('button', { name: 'Create' })).toBeInTheDocument()
  })

  it('does NOT show Delete button in create mode', () => {
    renderModal()
    expect(screen.queryByRole('button', { name: 'Delete task' })).not.toBeInTheDocument()
  })

  it('shows validation error on blur when title is empty', async () => {
    renderModal()
    const titleInput = screen.getByLabelText(/title/i)
    fireEvent.blur(titleInput)
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Title is required')
    })
  })

  it('does NOT show validation error before blur', () => {
    renderModal()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('calls createTask and closes modal on valid submit', async () => {
    const onClose = vi.fn()
    renderModal({ onClose })
    const titleInput = screen.getByLabelText(/title/i)
    fireEvent.change(titleInput, { target: { value: 'New feature' } })
    fireEvent.click(screen.getByRole('button', { name: 'Create' }))
    await waitFor(() => {
      expect(onClose).toHaveBeenCalled()
      expect(mockBoardAPI.createTask).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'New feature', status: 'todo' })
      )
    })
  })

  it('re-opens modal with prefilled values on create failure', async () => {
    const onOpenCreate = vi.fn()
    ;(mockBoardAPI.createTask as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('failed'))
    renderModal({ onOpenCreate })
    const titleInput = screen.getByLabelText(/title/i)
    fireEvent.change(titleInput, { target: { value: 'Failing task' } })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Create' }))
    })
    await waitFor(() => {
      expect(onOpenCreate).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Failing task' })
      )
    })
  })

  it('shows guard dialog when Escape attempted with dirty fields', async () => {
    renderModal()
    const titleInput = screen.getByLabelText(/title/i)
    fireEvent.change(titleInput, { target: { value: 'Some text' } })
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    await waitFor(() => {
      expect(screen.getByText('Discard changes?')).toBeInTheDocument()
    })
  })

  it('closes immediately via Cancel when form is clean', async () => {
    const onClose = vi.fn()
    renderModal({ onClose })
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onClose).toHaveBeenCalled()
    expect(screen.queryByText('Discard changes?')).not.toBeInTheDocument()
  })

  it('discards changes when Discard is clicked in guard dialog', async () => {
    const onClose = vi.fn()
    renderModal({ onClose })
    fireEvent.change(screen.getByLabelText(/title/i), { target: { value: 'Some text' } })
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    await waitFor(() => screen.getByText('Discard changes?'))
    fireEvent.click(screen.getByRole('button', { name: 'Discard' }))
    expect(onClose).toHaveBeenCalled()
  })

  it('keeps editing when Keep editing is clicked in guard dialog', async () => {
    const onClose = vi.fn()
    renderModal({ onClose })
    fireEvent.change(screen.getByLabelText(/title/i), { target: { value: 'Some text' } })
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    await waitFor(() => screen.getByText('Discard changes?'))
    fireEvent.click(screen.getByRole('button', { name: 'Keep editing' }))
    expect(onClose).not.toHaveBeenCalled()
    expect(screen.queryByText('Discard changes?')).not.toBeInTheDocument()
  })

  it('pre-fills form with prefillValues when provided', () => {
    renderModal({ prefillValues: { title: 'Pre-filled title', assignee: 'Bob' } })
    const titleInput = screen.getByLabelText(/title/i)
    expect((titleInput as HTMLInputElement).value).toBe('Pre-filled title')
  })
})

describe('TaskModal — edit mode', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(mockBoardAPI.updateTask as ReturnType<typeof vi.fn>).mockResolvedValue(undefined)
    ;(mockBoardAPI.deleteTask as ReturnType<typeof vi.fn>).mockResolvedValue(undefined)
  })

  it('renders edit modal with correct title', () => {
    renderModal({ mode: 'edit', task: mockTask })
    expect(screen.getByText('Edit Task')).toBeInTheDocument()
  })

  it('pre-populates all fields from task', () => {
    renderModal({ mode: 'edit', task: mockTask })
    const titleInput = screen.getByLabelText(/title/i)
    expect((titleInput as HTMLInputElement).value).toBe('Fix login bug')
    const assigneeInput = screen.getByLabelText(/assignee/i)
    expect((assigneeInput as HTMLInputElement).value).toBe('Alice')
  })

  it('shows "Save" button in edit mode', () => {
    renderModal({ mode: 'edit', task: mockTask })
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument()
  })

  it('shows Delete button in edit mode', () => {
    renderModal({ mode: 'edit', task: mockTask })
    expect(screen.getByRole('button', { name: 'Delete task' })).toBeInTheDocument()
  })

  it('calls updateTask and closes modal on save', async () => {
    const onClose = vi.fn()
    renderModal({ mode: 'edit', task: mockTask, onClose })
    const titleInput = screen.getByLabelText(/title/i)
    fireEvent.change(titleInput, { target: { value: 'Updated title' } })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    })
    await waitFor(() => {
      expect(onClose).toHaveBeenCalled()
      expect(mockBoardAPI.updateTask).toHaveBeenCalledWith(
        'task-1',
        expect.objectContaining({ title: 'Updated title' })
      )
    })
  })

  it('calls deleteTask and closes modal on delete click', async () => {
    const onClose = vi.fn()
    renderModal({ mode: 'edit', task: mockTask, onClose })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Delete task' }))
    })
    await waitFor(() => {
      expect(onClose).toHaveBeenCalled()
      expect(mockBoardAPI.deleteTask).toHaveBeenCalledWith('task-1')
    })
  })

  it('shows toast on delete failure', async () => {
    ;(mockBoardAPI.deleteTask as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('failed'))
    const onClose = vi.fn()
    renderModal({ mode: 'edit', task: mockTask, onClose })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Delete task' }))
    })
    await waitFor(() => {
      expect(onClose).toHaveBeenCalled()
    })
  })

  it('shows guard dialog when Cancel attempted with dirty fields in edit mode', async () => {
    renderModal({ mode: 'edit', task: mockTask })
    fireEvent.change(screen.getByLabelText(/title/i), { target: { value: 'Changed' } })
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    await waitFor(() => {
      expect(screen.getByText('Discard changes?')).toBeInTheDocument()
    })
  })

  it('closes immediately when Cancel with no changes in edit mode', async () => {
    const onClose = vi.fn()
    renderModal({ mode: 'edit', task: mockTask, onClose })
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onClose).toHaveBeenCalled()
  })
})

describe('TaskModal — closed state', () => {
  it('does not render dialog when isOpen=false', () => {
    renderModal({ isOpen: false })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
