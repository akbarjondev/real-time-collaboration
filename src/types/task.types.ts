export type TaskStatus = 'todo' | 'in-progress' | 'done'

export type Priority = 'low' | 'medium' | 'high'

export type Tag = {
  id: string
  label: string
}

export type Task = {
  id: string
  title: string
  description?: string
  assignee?: string
  status: TaskStatus
  priority: Priority
  tags: Tag[]
  createdAt: string
}
