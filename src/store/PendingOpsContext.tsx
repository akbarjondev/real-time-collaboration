import { createContext, useContext } from 'react'
import type { PendingOperation } from '@/types/common.types'

export const PendingOpsContext = createContext<Map<string, PendingOperation>>(new Map())

export function usePendingOps(): Map<string, PendingOperation> {
  return useContext(PendingOpsContext)
}
