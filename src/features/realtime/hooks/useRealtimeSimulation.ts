import { useEffect, useLayoutEffect, useRef } from 'react'
import { toast } from 'sonner'
import { useTasks } from '@/store/BoardStateContext'
import { useBoardDispatch } from '@/store/BoardDispatchContext'
import type { Priority } from '@/types/task.types'

const PRIORITIES: Priority[] = ['low', 'medium', 'high']

export function useRealtimeSimulation(editingTaskId: string | null) {
  const tasks = useTasks()
  const dispatch = useBoardDispatch()
  // Ref keeps the current editingTaskId accessible inside the stale closure
  // without restarting the timer on every prop change.
  const editingTaskIdRef = useRef(editingTaskId)
  useLayoutEffect(() => {
    editingTaskIdRef.current = editingTaskId
  })

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>

    function scheduleNext() {
      const delay = Math.floor(Math.random() * 5000) + 10000
      timeoutId = setTimeout(() => {
        const currentTasks = tasks
        if (currentTasks.length === 0) {
          scheduleNext()
          return
        }

        const idx = Math.floor(Math.random() * currentTasks.length)
        const task = currentTasks[idx]
        // noUncheckedIndexedAccess guard
        if (!task) {
          scheduleNext()
          return
        }

        // Cycle to a different priority
        const otherPriorities = PRIORITIES.filter(p => p !== task.priority)
        const newPriority = otherPriorities[Math.floor(Math.random() * otherPriorities.length)] ?? 'medium'
        const remoteTask = { ...task, priority: newPriority }

        if (task.id === editingTaskIdRef.current) {
          dispatch({
            type: 'CONFLICT_DETECTED',
            taskId: task.id,
            remoteTask,
            localTask: task,
          })
        } else {
          dispatch({ type: 'REMOTE_UPDATE', task: remoteTask })
          toast.info(`"${task.title}" was updated by another user`, {
            id: `remote-${task.id}`,
            duration: 4000,
          })
        }

        scheduleNext()
      }, delay)
    }

    scheduleNext()
    return () => clearTimeout(timeoutId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    // Intentional stale closure: re-arming on every tasks change would reset
    // the 10-15s interval on every remote update, creating a feedback loop.
    // The simulation intentionally reads a snapshot of tasks at fire time.
  }, []) // empty deps — intentional; stale closure acceptable for simulation
}

