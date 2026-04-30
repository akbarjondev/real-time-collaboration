import type { Task, TaskStatus } from '@/types/task.types'

export type MoveEntry = {
  type: 'move'
  taskId: string
  newStatus: TaskStatus
  originalStatus: TaskStatus
  label: string
}

export type CreateEntry = {
  type: 'create'
  taskId: string
  taskSnapshot: Task
  label: string
}

export type UpdateEntry = {
  type: 'update'
  taskId: string
  changes: Partial<Omit<Task, 'id' | 'createdAt'>>
  originalValues: Partial<Omit<Task, 'id' | 'createdAt'>>
  label: string
}

export type DeleteEntry = {
  type: 'delete'
  taskId: string
  taskSnapshot: Task
  label: string
}

export type HistoryEntry = MoveEntry | CreateEntry | UpdateEntry | DeleteEntry
