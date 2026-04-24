import { createContext, useContext } from 'react'
import type { Task, TaskStatus } from '@/types/task.types'
import type { BoardAction } from '@/store/boardReducer'
import { useHistoryImpl } from '@/features/history/hooks/useHistory'

export type HistoryContextType = {
  undoLabel: string | null
  redoLabel: string | null
  canUndo: boolean
  canRedo: boolean
  undo: () => void
  redo: () => void
  moveTask: (taskId: string, newStatus: TaskStatus) => Promise<void>
  createTask: (task: Omit<Task, 'id' | 'createdAt'>) => Promise<void>
  updateTask: (taskId: string, changes: Partial<Omit<Task, 'id' | 'createdAt'>>) => Promise<void>
  deleteTask: (taskId: string) => Promise<void>
}

export const HistoryContext = createContext<HistoryContextType | null>(null)

type HistoryProviderProps = {
  dispatch: React.Dispatch<BoardAction>
  tasks: Task[]
  children: React.ReactNode
}

export function HistoryProvider({ dispatch, tasks, children }: HistoryProviderProps) {
  const history = useHistoryImpl(dispatch, tasks)

  const value: HistoryContextType = {
    undoLabel: history.undoLabel,
    redoLabel: history.redoLabel,
    canUndo: history.canUndo,
    canRedo: history.canRedo,
    undo: history.undo,
    redo: history.redo,
    moveTask: history.moveTask,
    createTask: history.createTask,
    updateTask: history.updateTask,
    deleteTask: history.deleteTask,
  }

  return (
    <HistoryContext.Provider value={value}>
      {children}
    </HistoryContext.Provider>
  )
}

export function useHistory(): HistoryContextType {
  const ctx = useContext(HistoryContext)
  if (!ctx) {
    throw new Error('useHistory must be used within HistoryProvider')
  }
  return ctx
}

