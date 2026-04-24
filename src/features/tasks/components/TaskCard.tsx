import { memo } from 'react'
import { Badge } from '@/components/ui/badge'
import { usePendingOps } from '@/store/PendingOpsContext'
import type { Task, Priority } from '@/types/task.types'

type TaskCardProps = {
  task: Task
}

const PRIORITY_BADGE: Record<Priority, { dot: string; badge: string; label: string }> = {
  high:   { dot: 'bg-rose-500',  badge: 'bg-rose-100 text-rose-700 border-rose-200',    label: 'High' },
  medium: { dot: 'bg-amber-500', badge: 'bg-amber-100 text-amber-700 border-amber-200', label: 'Medium' },
  low:    { dot: 'bg-sky-500',   badge: 'bg-sky-100 text-sky-700 border-sky-200',       label: 'Low' },
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export const TaskCard = memo(function TaskCard({ task }: TaskCardProps) {
  const pendingOps = usePendingOps()
  const isInFlight = [...pendingOps.values()].some(op => op.taskId === task.id)
  const priority = PRIORITY_BADGE[task.priority]

  return (
    <article
      role="article"
      aria-label={`${task.title}, priority ${priority.label}${task.assignee ? `, assigned to ${task.assignee}` : ''}`}
      className={[
        'bg-white border rounded-lg p-4 cursor-pointer',
        'hover:border-zinc-300 hover:shadow-sm transition-all',
        'focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:outline-none',
        isInFlight ? 'border-violet-600 ring-2 ring-violet-600' : 'border-zinc-200',
      ].join(' ')}
      tabIndex={0}
    >
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

      <p className="text-sm font-medium text-zinc-900 leading-snug">{task.title}</p>

      <div className="flex items-center justify-between mt-3">
        <span className="text-xs text-zinc-500 truncate max-w-[60%]">
          {task.assignee ?? <span className="text-zinc-300">Unassigned</span>}
        </span>
        <time className="text-xs text-zinc-500 shrink-0 ml-2" dateTime={task.createdAt}>
          {formatDate(task.createdAt)}
        </time>
      </div>
    </article>
  )
})
