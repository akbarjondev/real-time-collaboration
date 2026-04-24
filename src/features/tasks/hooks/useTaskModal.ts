import { useState, useRef, useCallback } from 'react'
import { useKeyboardShortcut } from '@/shared/hooks/useKeyboardShortcut'
import type { Task } from '@/types/task.types'

export type CreateTaskForm = {
  title: string
  description?: string
  assignee?: string
  priority?: Task['priority']
  tags?: string
}

export type UseTaskModalReturn = {
  isOpen: boolean
  mode: 'create' | 'edit'
  editingTask: Task | null
  prefillValues: Partial<CreateTaskForm> | null
  openCreate: (prefill?: Partial<CreateTaskForm>) => void
  openEdit: (task: Task) => void
  close: () => void
  triggerRef: React.MutableRefObject<HTMLElement | null>
}

function isFormElementFocused(): boolean {
  const tag = document.activeElement?.tagName.toLowerCase()
  return tag === 'input' || tag === 'textarea' || tag === 'select'
}

export function useTaskModal(): UseTaskModalReturn {
  const [isOpen, setIsOpen] = useState(false)
  const [mode, setMode] = useState<'create' | 'edit'>('create')
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [prefillValues, setPrefillValues] = useState<Partial<CreateTaskForm> | null>(null)
  const triggerRef = useRef<HTMLElement | null>(null)

  const openCreate = useCallback((prefill?: Partial<CreateTaskForm>) => {
    triggerRef.current = document.activeElement as HTMLElement
    setPrefillValues(prefill ?? null)
    setMode('create')
    setEditingTask(null)
    setIsOpen(true)
  }, [])

  const openEdit = useCallback((task: Task) => {
    triggerRef.current = document.activeElement as HTMLElement
    setMode('edit')
    setEditingTask(task)
    setPrefillValues(null)
    setIsOpen(true)
  }, [])

  const close = useCallback(() => {
    setIsOpen(false)
    setTimeout(() => triggerRef.current?.focus(), 0)
  }, [])

  useKeyboardShortcut('n', useCallback(() => {
    if (!isOpen && !isFormElementFocused()) {
      openCreate()
    }
  }, [isOpen, openCreate]))

  return { isOpen, mode, editingTask, prefillValues, openCreate, openEdit, close, triggerRef }
}
