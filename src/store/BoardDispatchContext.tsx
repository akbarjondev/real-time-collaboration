import { createContext, useContext } from 'react'
import type { BoardAction } from '@/store/boardReducer'

export const BoardDispatchContext = createContext<React.Dispatch<BoardAction> | null>(null)

export function useBoardDispatch(): React.Dispatch<BoardAction> {
  const ctx = useContext(BoardDispatchContext)
  if (!ctx) throw new Error('useBoardDispatch must be used within AppProvider')
  return ctx
}
