import { createContext, useContext, useMemo } from 'react'
import { nanoid } from 'nanoid'
import type { Task, TaskStatus } from '@/types/task.types'
import type { BoardAction } from '@/store/boardReducer'
import {
  createTask as apiCreateTask,
  updateTask as apiUpdateTask,
  deleteTask as apiDeleteTask,
  moveTask as apiMoveTask,
} from '@/api/tasks'

export type BoardAPIContextType = {
  moveTask: (taskId: string, newStatus: TaskStatus) => Promise<void>
  createTask: (task: Omit<Task, 'id' | 'createdAt'>, taskId?: string) => Promise<void>
  updateTask: (taskId: string, changes: Partial<Omit<Task, 'id' | 'createdAt'>>) => Promise<void>
  deleteTask: (taskId: string) => Promise<void>
}

export const BoardAPIContext = createContext<BoardAPIContextType | null>(null)

type BoardAPIProviderProps = {
  dispatch: React.Dispatch<BoardAction>
  children: React.ReactNode
}

export function BoardAPIProvider({ dispatch, children }: BoardAPIProviderProps) {
  const boardAPI = useMemo<BoardAPIContextType>(() => ({
    moveTask: async (taskId: string, newStatus: TaskStatus) => {
      const opId = nanoid()
      dispatch({ type: 'TASK_MOVE', taskId, newStatus, opId })
      try {
        await apiMoveTask(taskId, newStatus)
        dispatch({ type: 'OP_SUCCESS', opId })
      } catch (e) {
        dispatch({ type: 'OP_ROLLBACK', opId })
        throw e
      }
    },

    createTask: async (task: Omit<Task, 'id' | 'createdAt'>, taskId?: string) => {
      const opId = nanoid()
      const newTask: Task = {
        ...task,
        id: taskId ?? nanoid(),
        createdAt: new Date().toISOString(),
      }
      dispatch({ type: 'TASK_CREATE', task: newTask, opId })
      try {
        await apiCreateTask(task)
        dispatch({ type: 'OP_SUCCESS', opId })
      } catch (e) {
        dispatch({ type: 'OP_ROLLBACK', opId })
        throw e
      }
    },

    updateTask: async (taskId: string, changes: Partial<Omit<Task, 'id' | 'createdAt'>>) => {
      const opId = nanoid()
      dispatch({ type: 'TASK_UPDATE', taskId, changes, opId })
      try {
        await apiUpdateTask(taskId, changes as Partial<Task>)
        dispatch({ type: 'OP_SUCCESS', opId })
      } catch (e) {
        dispatch({ type: 'OP_ROLLBACK', opId })
        throw e
      }
    },

    deleteTask: async (taskId: string) => {
      const opId = nanoid()
      dispatch({ type: 'TASK_DELETE', taskId, opId })
      try {
        await apiDeleteTask(taskId)
        dispatch({ type: 'OP_SUCCESS', opId })
      } catch (e) {
        dispatch({ type: 'OP_ROLLBACK', opId })
        throw e
      }
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
