import { createContext, useContext } from 'react'

// Stub — full implementation in Story 7.1
export type HistoryContextType = {
  undoLabel: string | null
  redoLabel: string | null
  canUndo: boolean
  canRedo: boolean
}

const defaultHistory: HistoryContextType = {
  undoLabel: null,
  redoLabel: null,
  canUndo: false,
  canRedo: false,
}

const HistoryContext = createContext<HistoryContextType>(defaultHistory)

type HistoryProviderProps = {
  children: React.ReactNode
}

export function HistoryProvider({ children }: HistoryProviderProps) {
  return (
    <HistoryContext.Provider value={defaultHistory}>
      {children}
    </HistoryContext.Provider>
  )
}

export function useHistory(): HistoryContextType {
  return useContext(HistoryContext)
}
