import { useReducer, useCallback } from 'react'
import { nanoid } from 'nanoid'
import type { Task, TaskStatus } from '@/types/task.types'
import type { BoardAction } from '@/store/boardReducer'
import type { HistoryEntry } from '@/types/history.types'
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
  undo: () => Promise<void>
  redo: () => Promise<void>
  moveTask: (taskId: string, newStatus: TaskStatus) => Promise<void>
  createTask: (task: Omit<Task, 'id' | 'createdAt'>) => Promise<void>
  updateTask: (taskId: string, changes: Partial<Omit<Task, 'id' | 'createdAt'>>) => Promise<void>
  deleteTask: (taskId: string) => Promise<void>
}

export function useHistoryImpl(
  _dispatch: React.Dispatch<BoardAction>,
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

  const undo = useCallback(async (): Promise<void> => {
    if (!canUndo) return
    const entry = stack[cursor]
    if (!entry) return

    try {
      switch (entry.type) {
        case 'move':
          await boardAPI.moveTask(entry.taskId, entry.originalStatus)
          break
        case 'create':
          await boardAPI.deleteTask(entry.taskId)
          break
        case 'update':
          await boardAPI.updateTask(entry.taskId, entry.originalValues)
          break
        case 'delete':
          await boardAPI.createTask(entry.taskSnapshot, entry.taskId)
          break
      }
      histDispatch({ type: 'UNDO_CURSOR' })
    } catch {
      // API failed — don't move cursor, state already rolled back by boardAPI
    }
  }, [canUndo, stack, cursor, boardAPI])

  const redo = useCallback(async (): Promise<void> => {
    if (!canRedo) return
    const entry = stack[cursor + 1]
    if (!entry) return

    try {
      switch (entry.type) {
        case 'move':
          await boardAPI.moveTask(entry.taskId, entry.newStatus)
          break
        case 'create':
          await boardAPI.createTask(entry.taskSnapshot, entry.taskId)
          break
        case 'update':
          await boardAPI.updateTask(entry.taskId, entry.changes)
          break
        case 'delete':
          await boardAPI.deleteTask(entry.taskId)
          break
      }
      histDispatch({ type: 'REDO_CURSOR' })
    } catch {
      // API failed — don't move cursor, state already rolled back by boardAPI
    }
  }, [canRedo, stack, cursor, boardAPI])

  async function moveTask(taskId: string, newStatus: TaskStatus): Promise<void> {
    const original = tasks.find(t => t.id === taskId)
    if (!original) return
    const entry: HistoryEntry = {
      type: 'move',
      taskId,
      newStatus,
      originalStatus: original.status,
      label: `Move "${original.title}" to ${STATUS_LABELS[newStatus]}`,
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
    const entry: HistoryEntry = {
      type: 'create',
      taskId,
      taskSnapshot: newTask,
      label: `Create task "${task.title}"`,
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
    const entry: HistoryEntry = {
      type: 'update',
      taskId,
      changes,
      originalValues,
      label: `Update task "${original.title}"`,
    }
    push(entry)
    await boardAPI.updateTask(taskId, changes)
  }

  async function deleteTask(taskId: string): Promise<void> {
    const original = tasks.find(t => t.id === taskId)
    if (!original) return
    const entry: HistoryEntry = {
      type: 'delete',
      taskId,
      taskSnapshot: original,
      label: `Delete task "${original.title}"`,
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