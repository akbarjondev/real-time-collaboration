import { memo } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { Task, Priority } from '@/types/task.types'

type TaskCardProps = {
  task: Task
  isPending: boolean
  onOpen?: (task: Task) => void
  isOverlay?: boolean
}

const PRIORITY_CONFIG: Record<Priority, { dot: string; badge: string; label: string }> = {
  high:   { dot: 'bg-rose-500',  badge: 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800',    label: 'High' },
  medium: { dot: 'bg-amber-500', badge: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800', label: 'Medium' },
  low:    { dot: 'bg-sky-500',   badge: 'bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800',       label: 'Low' },
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export const TaskCard = memo(function TaskCard({ task, isPending, onOpen, isOverlay }: TaskCardProps) {
  const priority = PRIORITY_CONFIG[task.priority]
  const isDone = task.status === 'done'

  const { setNodeRef, transform, transition, isDragging, attributes, listeners } = useSortable({ id: task.id })

  const style = isOverlay
    ? { transform: 'scale(1.02)', boxShadow: '0 10px 30px rgba(0,0,0,0.18)' }
    : { transform: CSS.Transform.toString(transform), transition }

  return (
    <article
      id={`task-${task.id}`}
      ref={isOverlay ? undefined : setNodeRef}
      style={style}
      {...(isOverlay ? {} : attributes)}
      role="article"
      aria-label={`${task.title}, ${task.priority} priority${task.assignee ? `, assigned to ${task.assignee}` : ', unassigned'}`}
      aria-busy={isPending}
      tabIndex={isOverlay ? -1 : 0}
      className={cn(
        'relative rounded-lg border bg-card p-4 transition-shadow min-h-[44px]',
        'hover:border-zinc-300 dark:hover:border-zinc-600 hover:shadow-md',
        'focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:outline-none',
        isPending ? 'border-border card-pulse' : 'border-border',
        isDone && 'opacity-[0.65]',
        isDragging && !isOverlay ? 'opacity-0 pointer-events-none' : '',
        isOverlay ? 'cursor-grabbing' : 'cursor-grab',
      )}
      {...(isOverlay ? {} : listeners)}
      onClick={isOverlay ? undefined : () => onOpen?.(task)}
      onKeyDown={isOverlay ? undefined : (e) => { if (e.key === 'Enter') onOpen?.(task) }}
    >
      {isPending && (
        <div
          className="absolute top-2 right-2 h-3 w-3 animate-spin rounded-full border-2 border-violet-600 dark:border-violet-400 border-t-transparent"
          aria-hidden="true"
        />
      )}

      <div className="mb-2">
        <Badge
          className={`${priority.badge} border text-xs font-medium px-2 py-0.5`}
          aria-label={`Priority: ${priority.label}`}
        >
          <span
            className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 ${priority.dot}`}
            aria-hidden="true"
          />
          {priority.label}
        </Badge>
      </div>

      <p className={cn('text-sm font-medium text-foreground leading-snug', isDone && 'line-through')}>
        {task.title}
      </p>

      <div className="flex items-center justify-between mt-3">
        <span className="text-xs text-muted-foreground truncate max-w-[60%]">
          {task.assignee ?? <span className="text-muted-foreground/50">Unassigned</span>}
        </span>
        <time className="text-xs text-muted-foreground shrink-0 ml-2" dateTime={task.createdAt}>
          {formatDate(task.createdAt)}
        </time>
      </div>
    </article>
  )
})
