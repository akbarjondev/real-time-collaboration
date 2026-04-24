import type { BoardAction } from '@/store/boardReducer'

export type UserAction = Extract<
  BoardAction,
  | { type: 'TASK_MOVE' }
  | { type: 'TASK_CREATE' }
  | { type: 'TASK_UPDATE' }
  | { type: 'TASK_DELETE' }
>

export type HistoryEntry = {
  id: string
  label: string
  forward: UserAction
  inverse: UserAction
}
