import { useMemo } from 'react'
import { Inbox, Plus } from 'lucide-react'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useTasks } from '@/store/BoardStateContext'
import { TaskCard } from '@/features/tasks/components/TaskCard'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Task, TaskStatus } from '@/types/task.types'
import type { CreateTaskForm } from '@/features/tasks/hooks/useTaskModal'

type BoardColumnProps = {
  status: TaskStatus
  title: string
  onOpenCreate: (prefill?: Partial<CreateTaskForm>) => void
  onOpenEdit: (task: Task) => void
}

export function BoardColumn({ status, title, onOpenCreate, onOpenEdit }: BoardColumnProps) {
  const tasks = useTasks()
  const columnTasks = useMemo(
    () => tasks.filter(t => t.status === status),
    [tasks, status]
  )
  const count = columnTasks.length
  const { isOver, setNodeRef } = useDroppable({ id: status })

  return (
    <section
      ref={setNodeRef}
      role="region"
      aria-label={`${title} column, ${count} task${count !== 1 ? 's' : ''}`}
      className={cn(
        'bg-zinc-100 rounded-xl p-3 flex flex-col gap-3 w-80 min-w-[280px]',
        isOver ? 'ring-2 ring-violet-400 ring-inset' : ''
      )}
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
        <div className="flex flex-col items-center gap-2 py-8 px-3 text-center min-h-[120px]">
          <Inbox className="h-8 w-8 text-zinc-400" aria-hidden="true" />
          <p className="text-sm font-medium text-zinc-500">No tasks</p>
          <p className="text-xs text-zinc-400">Drag a task here or add one</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-1 border-dashed border-zinc-300 text-zinc-400 hover:text-zinc-600 hover:border-zinc-400 focus-visible:ring-2 focus-visible:ring-violet-500 min-h-[44px]"
            onClick={() => onOpenCreate({ })}
            aria-label={`Add task to ${title}`}
          >
            <Plus className="h-3 w-3 mr-1" aria-hidden="true" />
            Add task
          </Button>
        </div>
      ) : (
        <SortableContext items={columnTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-2 min-h-[60px]">
            {columnTasks.map(task => (
              <TaskCard key={task.id} task={task} onOpen={onOpenEdit} />
            ))}
            {isOver && (
              <div className="h-14 rounded-lg border-2 border-dashed border-violet-400 opacity-50" />
            )}
          </div>
        </SortableContext>
      )}
    </section>
  )
}
