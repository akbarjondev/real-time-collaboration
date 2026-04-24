import type { Task } from '@/types/task.types'
import type { FilterState } from '@/store/FilterContext'

export function filterTasks(tasks: Task[], filters: FilterState): Task[] {
  const { assignee, priority, searchQuery } = filters

  if (!assignee && !priority && !searchQuery) return tasks

  return tasks.filter(task => {
    if (assignee && task.assignee !== assignee) return false
    if (priority && task.priority !== priority) return false
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      const inTitle = task.title.toLowerCase().includes(q)
      const inDesc = task.description?.toLowerCase().includes(q) ?? false
      if (!inTitle && !inDesc) return false
    }
    return true
  })
}
