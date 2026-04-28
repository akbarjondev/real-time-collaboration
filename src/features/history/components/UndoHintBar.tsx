import { Undo2, Redo2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useHistory } from '@/store/HistoryContext'

export function UndoHintBar() {
  const { canUndo, undoLabel, canRedo, redoLabel, undo, redo } = useHistory()

  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="flex items-center justify-between px-4 border-b border-border bg-card min-h-[44px]"
    >
      <div className="flex items-center min-h-[44px]">
        {canUndo ? (
          <button
            onClick={undo}
            aria-label={`Undo: ${undoLabel ?? ''}`}
            className={cn(
              'flex items-center gap-1.5 text-xs text-foreground px-2 py-1 rounded',
              'hover:bg-secondary min-h-[44px] min-w-[44px]',
              'focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:outline-none'
            )}
          >
            <Undo2 className="h-3.5 w-3.5" aria-hidden="true" />
            Undo: {undoLabel}
          </button>
        ) : (
          <span className="text-xs text-muted-foreground px-2">Nothing to undo</span>
        )}
      </div>

      <div className="flex items-center min-h-[44px]">
        {canRedo && (
          <button
            onClick={redo}
            aria-label={`Redo: ${redoLabel ?? ''}`}
            className={cn(
              'flex items-center gap-1.5 text-xs text-foreground px-2 py-1 rounded',
              'hover:bg-secondary min-h-[44px] min-w-[44px]',
              'focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:outline-none'
            )}
          >
            <Redo2 className="h-3.5 w-3.5" aria-hidden="true" />
            Redo: {redoLabel}
          </button>
        )}
      </div>
    </div>
  )
}

