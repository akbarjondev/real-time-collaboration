import { useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { useConflict } from '@/store/ConflictContext'
import { useBoardDispatch } from '@/store/BoardDispatchContext'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Task } from '@/types/task.types'

type FieldKey = keyof Pick<Task, 'title' | 'description' | 'assignee' | 'priority' | 'tags'>

const DISPLAY_FIELDS: { key: FieldKey; label: string }[] = [
  { key: 'title', label: 'Title' },
  { key: 'description', label: 'Description' },
  { key: 'assignee', label: 'Assignee' },
  { key: 'priority', label: 'Priority' },
  { key: 'tags', label: 'Tags' },
]

function formatFieldValue(value: Task[FieldKey]): string {
  if (value === undefined || value === null) return '—'
  if (Array.isArray(value)) return value.map(t => t.label).join(', ') || '—'
  return String(value)
}

function fieldsDiffer(local: Task, remote: Task, key: FieldKey): boolean {
  return formatFieldValue(local[key]) !== formatFieldValue(remote[key])
}

export function ConflictModal() {
  const conflict = useConflict()
  const dispatch = useBoardDispatch()
  const keepMineRef = useRef<HTMLButtonElement>(null)
  const conflictTriggerRef = useRef<HTMLElement | null>(null)

  // Capture focus target and fire warning toast on conflict onset
  useEffect(() => {
    if (!conflict) return
    conflictTriggerRef.current = document.activeElement as HTMLElement
    toast.warning(
      `"${conflict.localTask.title}" was changed by another user while you were editing`,
      { duration: 6000 },
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
    // Intentional: fire once per unique conflict (keyed on taskId), not on every re-render
  }, [conflict?.taskId])

  // Move focus to "Keep mine" button when modal opens
  useEffect(() => {
    if (conflict) {
      setTimeout(() => keepMineRef.current?.focus(), 0)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conflict?.taskId])

  if (!conflict) return null

  function restoreFocus() {
    setTimeout(() => conflictTriggerRef.current?.focus(), 0)
  }

  function handleKeepMine() {
    dispatch({ type: 'CONFLICT_RESOLVE_MINE', taskId: conflict!.taskId })
    restoreFocus()
  }

  function handleTakeTheirs() {
    dispatch({
      type: 'CONFLICT_RESOLVE_THEIRS',
      taskId: conflict!.taskId,
      remoteTask: conflict!.remoteTask,
    })
    restoreFocus()
  }

  function handleCancel() {
    dispatch({ type: 'CONFLICT_RESOLVE_MINE', taskId: conflict!.taskId })
    restoreFocus()
  }

  const { localTask, remoteTask } = conflict

  return (
    // onOpenChange no-op: prevents Escape key and overlay click from dismissing
    // the modal — user must make an explicit choice (AC #2)
    <Dialog open onOpenChange={() => {}}>
      <DialogContent
        role="alertdialog"
        aria-labelledby="conflict-modal-title"
        className="max-w-2xl"
      >
        <DialogHeader>
          <DialogTitle id="conflict-modal-title">Conflict Detected</DialogTitle>
          <p className="text-sm text-zinc-500">
            Another user edited this task while you were working on it. Choose which version to keep.
          </p>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <h3 className="text-sm font-semibold text-zinc-700 mb-2">My version</h3>
            <div className="space-y-1">
              {DISPLAY_FIELDS.map(({ key, label }) => {
                const differs = fieldsDiffer(localTask, remoteTask, key)
                return (
                  <div
                    key={key}
                    className={cn(
                      'rounded px-2 py-1 text-sm',
                      differs && 'bg-amber-50 border border-amber-200',
                    )}
                  >
                    <span className="text-xs text-zinc-500 block">{label}</span>
                    <span className="text-zinc-900">{formatFieldValue(localTask[key])}</span>
                  </div>
                )
              })}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-zinc-700 mb-2">Their version</h3>
            <div className="space-y-1">
              {DISPLAY_FIELDS.map(({ key, label }) => {
                const differs = fieldsDiffer(localTask, remoteTask, key)
                return (
                  <div
                    key={key}
                    className={cn(
                      'rounded px-2 py-1 text-sm',
                      differs && 'bg-amber-50 border border-amber-200',
                    )}
                  >
                    <span className="text-xs text-zinc-500 block">{label}</span>
                    <span className="text-zinc-900">{formatFieldValue(remoteTask[key])}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button variant="ghost" onClick={handleCancel}>
            Cancel
          </Button>
          <Button variant="outline" onClick={handleTakeTheirs}>
            Take theirs
          </Button>
          <Button
            ref={keepMineRef}
            className="bg-violet-600 hover:bg-violet-700 text-white focus-visible:ring-2 focus-visible:ring-violet-500"
            onClick={handleKeepMine}
          >
            Keep mine
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

