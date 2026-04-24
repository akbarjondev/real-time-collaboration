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

export async function updateTask(mergedTask: Task): Promise<Task> {
  return mockRequest<Task>(() => mergedTask)
}

export async function deleteTask(_taskId: string): Promise<void> {
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
