import { createContext, useContext, useMemo } from 'react'
import { nanoid } from 'nanoid'
import type { Task, TaskStatus } from '@/types/task.types'
import type { BoardAction } from '@/store/boardReducer'

export type BoardAPIContextType = {
  moveTask: (taskId: string, newStatus: TaskStatus) => void
  createTask: (task: Omit<Task, 'id' | 'createdAt'>) => void
  updateTask: (taskId: string, changes: Partial<Omit<Task, 'id' | 'createdAt'>>) => void
  deleteTask: (taskId: string) => void
}

const BoardAPIContext = createContext<BoardAPIContextType | null>(null)

type BoardAPIProviderProps = {
  dispatch: React.Dispatch<BoardAction>
  children: React.ReactNode
}

export function BoardAPIProvider({ dispatch, children }: BoardAPIProviderProps) {
  const boardAPI = useMemo<BoardAPIContextType>(() => ({
    moveTask: (taskId: string, newStatus: TaskStatus) => {
      const opId = nanoid()
      dispatch({ type: 'TASK_MOVE', taskId, newStatus, opId })
    },
    createTask: (task: Omit<Task, 'id' | 'createdAt'>) => {
      const opId = nanoid()
      const newTask: Task = {
        ...task,
        id: nanoid(),
        createdAt: new Date().toISOString(),
      }
      dispatch({ type: 'TASK_CREATE', task: newTask, opId })
    },
    updateTask: (taskId: string, changes: Partial<Omit<Task, 'id' | 'createdAt'>>) => {
      const opId = nanoid()
      dispatch({ type: 'TASK_UPDATE', taskId, changes, opId })
    },
    deleteTask: (taskId: string) => {
      const opId = nanoid()
      dispatch({ type: 'TASK_DELETE', taskId, opId })
    },
  }), [dispatch])

  return (
    <BoardAPIContext.Provider value={boardAPI}>
      {children}
    </BoardAPIContext.Provider>
  )
}

export function useBoardAPI(): BoardAPIContextType {
  const ctx = useContext(BoardAPIContext)
  if (!ctx) {
    throw new Error('useBoardAPI must be used within BoardAPIProvider')
  }
  return ctx
}
