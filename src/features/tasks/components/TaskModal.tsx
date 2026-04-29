import { useEffect, useRef, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { toast } from 'sonner'
import { AlertCircle } from 'lucide-react'
import { useHistory } from '@/store/HistoryContext'
import { useTasks } from '@/store/BoardStateContext'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Task, TaskStatus } from '@/types/task.types'
import type { CreateTaskForm } from '@/features/tasks/hooks/useTaskModal'

const DEFAULT_VALUES: CreateTaskForm = {
  title: '',
  description: '',
  assignee: '',
  priority: undefined,
  tags: '',
}

type TaskModalProps = {
  isOpen: boolean
  mode: 'create' | 'edit'
  task: Task | null
  prefillValues: Partial<CreateTaskForm> | null
  onClose: () => void
  onOpenCreate: (prefill?: Partial<CreateTaskForm>) => void
}

export function TaskModal({
  isOpen,
  mode,
  task,
  prefillValues,
  onClose,
  onOpenCreate,
}: TaskModalProps) {
  const history = useHistory()
  const liveTasks = useTasks()
  // Derive the live version of the task so CONFLICT_RESOLVE_THEIRS re-populates the form
  const liveTask = mode === 'edit' && task
    ? (liveTasks.find(t => t.id === task.id) ?? task)
    : task
  const [showGuard, setShowGuard] = useState(false)
  const titleInputRef = useRef<HTMLInputElement | null>(null)
  const statusTriggerRef = useRef<HTMLButtonElement | null>(null)
  const isMountedRef = useRef(true)

  useEffect(() => {
    return () => { isMountedRef.current = false }
  }, [])

  useEffect(() => {
    if (isOpen) {
      const id = setTimeout(() => {
        if (mode === 'edit' && window.innerWidth < 768) {
          statusTriggerRef.current?.focus()
        } else {
          titleInputRef.current?.focus()
        }
      }, 0)
      return () => clearTimeout(id)
    }
  }, [isOpen, mode])

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
    control,
  } = useForm<CreateTaskForm>({
    mode: 'onBlur',
    defaultValues: DEFAULT_VALUES,
  })

  // reset() sets isDirty=false. If onClose() fires before this effect runs (e.g. rollback
  // re-open path), there is a brief render cycle where isDirty reads stale. This is benign —
  // the guard won't fire since the modal is already closed at that point.
  useEffect(() => {
    if (isOpen && mode === 'create') {
      reset({ ...DEFAULT_VALUES, ...prefillValues })
    }
  }, [isOpen, mode, prefillValues, reset])

  useEffect(() => {
    if (isOpen && mode === 'edit' && liveTask) {
      reset({
        title: liveTask.title,
        description: liveTask.description ?? '',
        assignee: liveTask.assignee ?? '',
        priority: liveTask.priority,
        tags: liveTask.tags.map(t => t.label).join(', '),
      })
    }
  }, [isOpen, mode, liveTask, reset])

  function handleCloseAttempt() {
    if (isDirty) {
      setShowGuard(true)
    } else {
      onClose()
    }
  }

  function handleDiscard() {
    setShowGuard(false)
    onClose()
  }

  const { ref: rhfTitleRef, ...titleRegisterRest } = register('title', {
    required: 'Title is required',
    validate: (v) => (v ?? '').trim() !== '' || 'Title is required',
  })
  const { ref: rhfDescRef, ...descRegisterRest } = register('description', {
    required: 'Description is required',
    validate: (v) => (v ?? '').trim() !== '' || 'Description is required',
  })
  const { ref: rhfAssigneeRef, ...assigneeRegisterRest } = register('assignee', {
    required: 'Assignee is required',
    validate: (v) => (v ?? '').trim() !== '' || 'Assignee is required',
  })

  const onSubmit = handleSubmit(async (data) => {
    const savedValues = { ...data }
    onClose()

    if (mode === 'create') {
      try {
        await history.createTask({
          title: data.title,
          description: data.description || undefined,
          assignee: data.assignee || undefined,
          priority: data.priority ?? 'low',
          status: 'todo',
          tags: [],
        })
        toast.success(`Task "${data.title}" created`, { duration: 3000 })
      } catch {
        onOpenCreate(savedValues)
        toast.error(`Create failed — "${data.title}" could not be saved`, { duration: Infinity })
      }
    } else if (mode === 'edit' && task) {
      const taskTitle = task.title
      try {
        await history.updateTask(task.id, {
          title: data.title,
          description: data.description || undefined,
          assignee: data.assignee || undefined,
          priority: data.priority ?? task.priority,
          tags: task.tags,
        })
        toast.success(`Task "${taskTitle}" updated`, { duration: 3000 })
      } catch {
        toast.error(`Update failed — "${taskTitle}" has been reverted`, { duration: Infinity })
      }
    }
  })

  async function handleStatusChange(newStatus: TaskStatus) {
    if (!task || newStatus === task.status) return

    const taskTitle = task.title
    onClose()

    try {
      await history.moveTask(task.id, newStatus)
    } catch {
      if (isMountedRef.current) {
        toast.error(`Move failed — "${taskTitle}" has been reverted`, { duration: Infinity })
      }
    }
  }

  async function handleDelete() {
    if (!task) return
    const taskTitle = task.title
    onClose()
    try {
      await history.deleteTask(task.id)
    } catch {
      if (isMountedRef.current) {
        toast.error(`Delete failed — "${taskTitle}" has been restored`, { duration: Infinity })
      }
    }
  }

  return (
    <>
      <Dialog
        open={isOpen}
        onOpenChange={(open) => { if (!open) handleCloseAttempt() }}
      >
        <DialogContent showCloseButton={false} className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{mode === 'create' ? 'New Task' : 'Edit Task'}</DialogTitle>
          </DialogHeader>

          <form id="task-form" onSubmit={onSubmit} noValidate>
            <div className="flex flex-col gap-4">
              {/* Status — edit mode only, focused on mobile */}
              {mode === 'edit' && task && (
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Status</label>
                  <Select
                    value={task.status}
                    onValueChange={(v) => handleStatusChange(v as TaskStatus)}
                  >
                    <SelectTrigger ref={statusTriggerRef} className="w-full min-h-[44px]" aria-label="Status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todo">Todo</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="done">Done</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Title */}
              <div className="flex flex-col gap-1">
                <label htmlFor="task-title" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Title <span className="text-rose-600">*</span>
                </label>
                <input
                  id="task-title"
                  className="rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive min-h-[44px]"
                  placeholder="Task title"
                  aria-invalid={!!errors.title}
                  aria-describedby={errors.title ? 'title-error' : undefined}
                  ref={(el) => { rhfTitleRef(el); titleInputRef.current = el }}
                  {...titleRegisterRest}
                />
                {errors.title && (
                  <p id="title-error" className="mt-1 flex items-center gap-1 text-xs text-rose-600" role="alert">
                    <AlertCircle className="h-3 w-3" aria-hidden="true" />
                    {errors.title.message}
                  </p>
                )}
              </div>

              {/* Priority */}
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Priority</label>
                <Controller
                  name="priority"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value ?? ''} onValueChange={(v) => field.onChange(v || undefined)}>
                      <SelectTrigger className="w-full min-h-[44px]" aria-label="Priority">
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              {/* Assignee */}
              <div className="flex flex-col gap-1">
                <label htmlFor="task-assignee" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Assignee <span className="text-rose-600">*</span>
                </label>
                <input
                  id="task-assignee"
                  className="rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive min-h-[44px]"
                  placeholder="Assignee name"
                  aria-invalid={!!errors.assignee}
                  aria-describedby={errors.assignee ? 'assignee-error' : undefined}
                  ref={rhfAssigneeRef}
                  {...assigneeRegisterRest}
                />
                {errors.assignee && (
                  <p id="assignee-error" className="mt-1 flex items-center gap-1 text-xs text-rose-600" role="alert">
                    <AlertCircle className="h-3 w-3" aria-hidden="true" />
                    {errors.assignee.message}
                  </p>
                )}
              </div>

              {/* Description */}
              <div className="flex flex-col gap-1">
                <label htmlFor="task-description" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Description <span className="text-rose-600">*</span>
                </label>
                <textarea
                  id="task-description"
                  rows={3}
                  className="rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive resize-none min-h-[44px]"
                  placeholder="Task description"
                  aria-invalid={!!errors.description}
                  aria-describedby={errors.description ? 'description-error' : undefined}
                  ref={rhfDescRef}
                  {...descRegisterRest}
                />
                {errors.description && (
                  <p id="description-error" className="mt-1 flex items-center gap-1 text-xs text-rose-600" role="alert">
                    <AlertCircle className="h-3 w-3" aria-hidden="true" />
                    {errors.description.message}
                  </p>
                )}
              </div>

              {/* Tags */}
              <div className="flex flex-col gap-1">
                <label htmlFor="task-tags" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Tags
                </label>
                <input
                  id="task-tags"
                  className="rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 min-h-[44px]"
                  placeholder="Comma-separated tags"
                  {...register('tags')}
                />
              </div>
            </div>
          </form>

          <DialogFooter className={mode === 'edit' ? 'flex justify-between' : undefined}>
            {mode === 'edit' && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                aria-label="Delete task"
                className="min-h-[44px]"
              >
                Delete
              </Button>
            )}
            <div className="flex gap-2">
              <Button type="button" variant="ghost" onClick={handleCloseAttempt} className="min-h-[44px]">
                Cancel
              </Button>
              <Button type="submit" form="task-form" className="min-h-[44px]">
                {mode === 'create' ? 'Create' : 'Save'}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unsaved-changes guard dialog */}
      <Dialog open={showGuard} onOpenChange={(open) => { if (!open) setShowGuard(false) }}>
        <DialogContent showCloseButton={false} className="sm:max-w-xs">
          <DialogHeader>
            <DialogTitle>Discard changes?</DialogTitle>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowGuard(false)}>
              Keep editing
            </Button>
            <Button variant="destructive" onClick={handleDiscard}>
              Discard
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
