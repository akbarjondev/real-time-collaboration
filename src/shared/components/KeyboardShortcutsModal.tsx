import { Keyboard } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { isMac } from '@/shared/utils/platform'

type KeyboardShortcutsModalProps = {
  isOpen: boolean
  onClose: () => void
}

const SHORTCUTS = [
  { key: 'N', description: 'Create new task' },
  { key: isMac ? '⌘K' : 'Ctrl+Shift+K', description: 'Quick search' },
  { key: isMac ? '⌘Z' : 'Ctrl+Z', description: 'Undo' },
  { key: isMac ? '⌘⇧Z' : 'Ctrl+Shift+Z', description: 'Redo' },
  { key: 'Shift+?', description: 'Show keyboard shortcuts' },
  { key: 'Esc', description: 'Close modal' },
] as const

export function KeyboardShortcutsModal({ isOpen, onClose }: KeyboardShortcutsModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" aria-hidden="true" />
            Keyboard Shortcuts
          </DialogTitle>
        </DialogHeader>
        <div className="py-2">
          <ul className="space-y-2">
            {SHORTCUTS.map(({ key, description }) => (
              <li key={key} className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{description}</span>
                <kbd className="px-2 py-1 text-xs font-mono bg-secondary border border-border rounded text-foreground">
                  {key}
                </kbd>
              </li>
            ))}
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  )
}
