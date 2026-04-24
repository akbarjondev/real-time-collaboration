import { useState, useRef, useEffect } from 'react'
import {
  type DragStartEvent,
  type DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { toast } from 'sonner'
import { useHistory } from '@/store/HistoryContext'
import { useTasks } from '@/store/BoardStateContext'
import type { Task, TaskStatus } from '@/types/task.types'

const VALID_STATUSES: TaskStatus[] = ['todo', 'in-progress', 'done']

export function useBoardDnd() {
  const tasks = useTasks()
  const { moveTask } = useHistory()
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const isMountedRef = useRef(true)

  useEffect(() => {
    return () => { isMountedRef.current = false }
  }, [])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  function handleDragStart({ active }: DragStartEvent) {
    const found = tasks.find(t => t.id === String(active.id))
    if (found) setActiveTask(found)
  }

  function handleDragOver() {
    // no-op: cross-column destination is resolved in handleDragEnd
  }

  async function handleDragEnd({ active, over }: DragEndEvent) {
    const draggedTask = tasks.find(t => t.id === String(active.id))
    setActiveTask(null)

    if (!over || !draggedTask) return

    let newStatus: TaskStatus

    if (VALID_STATUSES.includes(String(over.id) as TaskStatus)) {
      newStatus = String(over.id) as TaskStatus
    } else {
      const overTask = tasks.find(t => t.id === String(over.id))
      if (!overTask) return
      newStatus = overTask.status
    }

    if (draggedTask.status === newStatus) return

    try {
      await moveTask(draggedTask.id, newStatus)
    } catch {
      if (isMountedRef.current) {
        toast.error(`Move failed — "${draggedTask.title}" has been reverted`, { duration: Infinity })
      }
    }
  }

  return { sensors, activeTask, handleDragStart, handleDragOver, handleDragEnd }
}
