import { createContext, useContext } from 'react'
import type { ConflictState } from '@/types/common.types'

export const ConflictContext = createContext<ConflictState | null>(null)

export function useConflict(): ConflictState | null {
  return useContext(ConflictContext)
}
