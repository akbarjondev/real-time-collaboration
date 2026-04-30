import { useState } from 'react'
import { Undo2, Redo2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useHistory } from '@/store/HistoryContext'

export function UndoHintBar() {
  const { canUndo, undoLabel, canRedo, redoLabel, undo, redo } = useHistory()
  const [isUndoing, setIsUndoing] = useState(false)
  const [isRedoing, setIsRedoing] = useState(false)

  async function handleUndo() {
    if (isUndoing) return
    setIsUndoing(true)
    try {
      await undo()
    } catch {
      toast.error('Failed to undo. Please try again.')
    } finally {
      setIsUndoing(false)
    }
  }

  async function handleRedo() {
    if (isRedoing) return
    setIsRedoing(true)
    try {
      await redo()
    } catch {
      toast.error('Failed to redo. Please try again.')
    } finally {
      setIsRedoing(false)
    }
  }

  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="flex items-center justify-between px-4 border-b border-border bg-card min-h-[44px]"
    >
      <div className="flex items-center min-h-[44px]">
        {canUndo ? (
          <button
            onClick={handleUndo}
            disabled={isUndoing}
            aria-label={`Undo: ${undoLabel ?? ''}`}
            className={cn(
              'flex items-center gap-1.5 text-xs text-foreground px-2 py-1 rounded',
              'hover:bg-secondary min-h-[44px] min-w-[44px]',
              'focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:outline-none',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            {isUndoing ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            ) : (
              <Undo2 className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            Undo: {undoLabel}
          </button>
        ) : (
          <span className="text-xs text-muted-foreground px-2">Nothing to undo</span>
        )}
      </div>

      <div className="flex items-center min-h-[44px]">
        {canRedo && (
          <button
            onClick={handleRedo}
            disabled={isRedoing}
            aria-label={`Redo: ${redoLabel ?? ''}`}
            className={cn(
              'flex items-center gap-1.5 text-xs text-foreground px-2 py-1 rounded',
              'hover:bg-secondary min-h-[44px] min-w-[44px]',
              'focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:outline-none',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            {isRedoing ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            ) : (
              <Redo2 className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            Redo: {redoLabel}
          </button>
        )}
      </div>
    </div>
  )
}

