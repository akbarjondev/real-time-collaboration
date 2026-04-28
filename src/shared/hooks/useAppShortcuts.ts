import { useKeyboardShortcut } from '@/shared/hooks/useKeyboardShortcut'

function isFormElementFocused(): boolean {
  const el = document.activeElement
  if (!el) return false
  const tag = el.tagName.toLowerCase()
  return (
    tag === 'input' ||
    tag === 'textarea' ||
    tag === 'select' ||
    (el as HTMLElement).isContentEditable
  )
}

function isModalOpen(): boolean {
  return document.querySelector('[role="dialog"]') != null
}

type UseAppShortcutsOptions = {
  onNewTask: () => void
  onShowHelp: () => void
}

export function useAppShortcuts({ onNewTask, onShowHelp }: UseAppShortcutsOptions): void {
  useKeyboardShortcut('n', () => {
    if (isFormElementFocused() || isModalOpen()) return
    onNewTask()
  })

  useKeyboardShortcut('?', () => {
    if (isFormElementFocused() || isModalOpen()) return
    onShowHelp()
  }, { shift: true })
}
