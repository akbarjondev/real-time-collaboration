import { createContext, useContext } from 'react'
import type { Task } from '@/types/task.types'

export const BoardStateContext = createContext<Task[]>([])

export function useTasks(): Task[] {
  return useContext(BoardStateContext)
}
