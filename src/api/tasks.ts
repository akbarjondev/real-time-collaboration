import { nanoid } from 'nanoid'
import type { Task, TaskStatus } from '@/types/task.types'
import { mockRequest } from './mock-client'

export async function createTask(
  task: Omit<Task, 'id' | 'createdAt'>
): Promise<Task> {
  return mockRequest<Task>(() => ({
    ...task,
    id: nanoid(),
    createdAt: new Date().toISOString(),
  }))
}

export async function updateTask(id: string, changes: Partial<Task>): Promise<Task> {
  return mockRequest<Task>(() => ({ id, ...changes } as Task))
}

export async function deleteTask(_: string): Promise<void> {
  return mockRequest<void>(() => undefined)
}

export async function moveTask(
  taskId: string,
  newStatus: TaskStatus
): Promise<Task> {
  return mockRequest<Task>(() => ({
    id: taskId,
    status: newStatus,
  } as Task))
}
