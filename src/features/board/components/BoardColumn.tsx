import { useMemo } from 'react'
import { Inbox, Plus } from 'lucide-react'
import { useTasks } from '@/store/BoardStateContext'
import { TaskCard } from '@/features/tasks/components/TaskCard'
import { Button } from '@/components/ui/button'
import type { TaskStatus } from '@/types/task.types'

type BoardColumnProps = {
  status: TaskStatus
  title: string
}

export function BoardColumn({ status, title }: BoardColumnProps) {
  const tasks = useTasks()
  const columnTasks = useMemo(
    () => tasks.filter(t => t.status === status),
    [tasks, status]
  )
  const count = columnTasks.length

  return (
    <section
      role="region"
      aria-label={`${title} column, ${count} task${count !== 1 ? 's' : ''}`}
      className="bg-zinc-100 rounded-xl p-3 flex flex-col gap-3 w-80 min-w-[280px]"
    >
      <div className="flex items-center justify-between px-1">
        <h2 className="text-sm font-semibold text-zinc-700">{title}</h2>
        <span
          className="bg-zinc-200 rounded-full px-2 py-0.5 text-xs text-zinc-600 font-medium tabular-nums"
          aria-hidden="true"
        >
          {count}
        </span>
      </div>

      {count === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8 px-3 text-center">
          <Inbox className="h-8 w-8 text-zinc-400" aria-hidden="true" />
          <p className="text-sm font-medium text-zinc-500">No tasks</p>
          <p className="text-xs text-zinc-400">Drag a task here or add one</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-1 border-dashed border-zinc-300 text-zinc-400 hover:text-zinc-600 hover:border-zinc-400 focus-visible:ring-2 focus-visible:ring-violet-500 min-h-[44px]"
            onClick={() => { /* noop — implemented in Story 2.2 */ }}
            aria-label={`Add task to ${title}`}
          >
            <Plus className="h-3 w-3 mr-1" aria-hidden="true" />
            Add task
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {columnTasks.map(task => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      )}
    </section>
  )
}
