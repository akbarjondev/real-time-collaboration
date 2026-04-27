import { useReducer } from 'react'
import { nanoid } from 'nanoid'
import type { Task, TaskStatus } from '@/types/task.types'
import type { BoardAction } from '@/store/boardReducer'
import type { HistoryEntry, UserAction } from '@/types/history.types'
import { useBoardAPI } from '@/store/BoardAPIContext'

const MAX_HISTORY = 50

type HistoryState = { stack: HistoryEntry[]; cursor: number }
type HistoryInternalAction =
  | { type: 'PUSH'; entry: HistoryEntry }
  | { type: 'UNDO_CURSOR' }
  | { type: 'REDO_CURSOR' }

function historyReducer(state: HistoryState, action: HistoryInternalAction): HistoryState {
  switch (action.type) {
    case 'PUSH': {
      const withoutRedo = state.stack.slice(0, state.cursor + 1)
      const newStack = [...withoutRedo, action.entry].slice(-MAX_HISTORY)
      return { stack: newStack, cursor: newStack.length - 1 }
    }
    case 'UNDO_CURSOR':
      return state.cursor < 0 ? state : { ...state, cursor: state.cursor - 1 }
    case 'REDO_CURSOR':
      return state.cursor >= state.stack.length - 1 ? state : { ...state, cursor: state.cursor + 1 }
  }
}

const STATUS_LABELS: Record<TaskStatus, string> = {
  'todo': 'Todo',
  'in-progress': 'In Progress',
  'done': 'Done',
}

export type UseHistoryResult = {
  stack: HistoryEntry[]
  cursor: number
  canUndo: boolean
  canRedo: boolean
  undoLabel: string | null
  redoLabel: string | null
  undo: () => void
  redo: () => void
  moveTask: (taskId: string, newStatus: TaskStatus) => Promise<void>
  createTask: (task: Omit<Task, 'id' | 'createdAt'>) => Promise<void>
  updateTask: (taskId: string, changes: Partial<Omit<Task, 'id' | 'createdAt'>>) => Promise<void>
  deleteTask: (taskId: string) => Promise<void>
}

export function useHistoryImpl(
  dispatch: React.Dispatch<BoardAction>,
  tasks: Task[],
): UseHistoryResult {
  const boardAPI = useBoardAPI()
  const [{ stack, cursor }, histDispatch] = useReducer(historyReducer, { stack: [], cursor: -1 })

  const canUndo = cursor >= 0
  const canRedo = cursor < stack.length - 1
  const undoLabel = canUndo ? (stack[cursor]?.label ?? null) : null
  const redoLabel = canRedo ? (stack[cursor + 1]?.label ?? null) : null

  function push(entry: HistoryEntry): void {
    histDispatch({ type: 'PUSH', entry })
  }

  function undo(): void {
    if (!canUndo) return
    const entry = stack[cursor]
    if (!entry) return
    histDispatch({ type: 'UNDO_CURSOR' })
    dispatch({ type: 'HISTORY_APPLY', action: entry.inverse, inverse: entry.forward })
  }

  function redo(): void {
    if (!canRedo) return
    const entry = stack[cursor + 1]
    if (!entry) return
    histDispatch({ type: 'REDO_CURSOR' })
    dispatch({ type: 'HISTORY_APPLY', action: entry.forward, inverse: entry.inverse })
  }

  async function moveTask(taskId: string, newStatus: TaskStatus): Promise<void> {
    const original = tasks.find(t => t.id === taskId)
    if (!original) return
    const opId = nanoid()
    const inverseOpId = nanoid()
    const forward: UserAction = { type: 'TASK_MOVE', taskId, newStatus, opId }
    const inverse: UserAction = { type: 'TASK_MOVE', taskId, newStatus: original.status, opId: inverseOpId }
    const entry: HistoryEntry = {
      id: nanoid(),
      label: `Move "${original.title}" to ${STATUS_LABELS[newStatus]}`,
      forward,
      inverse,
    }
    push(entry)
    await boardAPI.moveTask(taskId, newStatus)
  }

  async function createTask(task: Omit<Task, 'id' | 'createdAt'>): Promise<void> {
    const taskId = nanoid()
    const newTask: Task = {
      ...task,
      id: taskId,
      createdAt: new Date().toISOString(),
    }
    const opId = nanoid()
    const inverseOpId = nanoid()
    const forward: UserAction = { type: 'TASK_CREATE', task: newTask, opId }
    const inverse: UserAction = { type: 'TASK_DELETE', taskId, opId: inverseOpId }
    const entry: HistoryEntry = {
      id: nanoid(),
      label: `Create task "${task.title}"`,
      forward,
      inverse,
    }
    push(entry)
    await boardAPI.createTask(task, taskId)
  }

  async function updateTask(taskId: string, changes: Partial<Omit<Task, 'id' | 'createdAt'>>): Promise<void> {
    const original = tasks.find(t => t.id === taskId)
    if (!original) return
    const originalValues: Partial<Omit<Task, 'id' | 'createdAt'>> = {}
    for (const key of Object.keys(changes) as Array<keyof typeof changes>) {
      (originalValues as Record<string, unknown>)[key] = original[key]
    }
    const opId = nanoid()
    const inverseOpId = nanoid()
    const forward: UserAction = { type: 'TASK_UPDATE', taskId, changes, opId }
    const inverse: UserAction = { type: 'TASK_UPDATE', taskId, changes: originalValues, opId: inverseOpId }
    const entry: HistoryEntry = {
      id: nanoid(),
      label: `Update task "${original.title}"`,
      forward,
      inverse,
    }
    push(entry)
    await boardAPI.updateTask(taskId, changes)
  }

  async function deleteTask(taskId: string): Promise<void> {
    const original = tasks.find(t => t.id === taskId)
    if (!original) return
    const opId = nanoid()
    const inverseOpId = nanoid()
    const forward: UserAction = { type: 'TASK_DELETE', taskId, opId }
    const inverse: UserAction = { type: 'TASK_CREATE', task: original, opId: inverseOpId }
    const entry: HistoryEntry = {
      id: nanoid(),
      label: `Delete task "${original.title}"`,
      forward,
      inverse,
    }
    push(entry)
    await boardAPI.deleteTask(taskId)
  }

  return {
    stack,
    cursor,
    canUndo,
    canRedo,
    undoLabel,
    redoLabel,
    undo,
    redo,
    moveTask,
    createTask,
    updateTask,
    deleteTask,
  }
}


