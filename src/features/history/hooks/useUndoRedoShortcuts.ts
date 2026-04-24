import { useEffect, useRef } from 'react'
import { useHistory } from '@/store/HistoryContext'

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

function isModalFocused(): boolean {
  return document.activeElement?.closest('[role="dialog"]') != null
}

export function useUndoRedoShortcuts(): void {
  const { undo, redo } = useHistory()

  const undoRef = useRef(undo)
  const redoRef = useRef(redo)
  useEffect(() => { undoRef.current = undo })
  useEffect(() => { redoRef.current = redo })

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent): void {
      if (!(e.ctrlKey || e.metaKey)) return
      if (e.key.toLowerCase() !== 'z') return
      if (isFormElementFocused() || isModalFocused()) return

      if (e.shiftKey) {
        e.preventDefault()
        redoRef.current()
      } else {
        e.preventDefault()
        undoRef.current()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])
}
