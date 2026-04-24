import { toast } from 'sonner'

export function showRemoteUpdateToast(taskTitle: string): void {
  toast.info(`"${taskTitle}" was updated remotely`, { duration: 4000 })
}

export function showConflictToast(taskTitle: string): void {
  toast.warning(`Conflict detected on "${taskTitle}"`, { duration: 6000 })
}
