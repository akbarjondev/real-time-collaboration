import { useEffect, useRef } from 'react'

type ShortcutOptions = {
  ctrl?: boolean
  shift?: boolean
}

export function useKeyboardShortcut(
  key: string,
  handler: () => void,
  options: ShortcutOptions = {}
): void {
  const handlerRef = useRef(handler)
  useEffect(() => { handlerRef.current = handler })

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key.toLowerCase() !== key.toLowerCase()) return

      if (options.ctrl) {
        if (!e.ctrlKey && !e.metaKey) return
      } else {
        if (e.ctrlKey || e.metaKey || e.altKey) return
      }

      if (options.shift !== undefined) {
        if (e.shiftKey !== options.shift) return
      }

      handlerRef.current()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [key, options.ctrl, options.shift])
}
