import { useEffect } from 'react'

export function useKeyboardShortcut(key: string, handler: () => void): void {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (
        e.key.toLowerCase() === key.toLowerCase() &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.altKey
      ) {
        handler()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [key, handler])
}
