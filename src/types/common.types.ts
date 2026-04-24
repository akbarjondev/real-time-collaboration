import type { Task } from '@/types/task.types'

export type ID = string

export type AsyncState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: string }

export type PendingOperation = {
  opId: string
  taskId: string
  snapshot: Task
}

export type ConflictState = {
  taskId: string
  remoteTask: Task
  localTask: Task
}
