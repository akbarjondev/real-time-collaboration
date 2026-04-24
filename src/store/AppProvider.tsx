import { useReducer } from 'react'
import { boardReducer } from '@/store/boardReducer'
import type { BoardState } from '@/store/boardReducer'
import { MOCK_TASKS } from '@/shared/utils/mockData'
import { filterReducer, initialFilterState, FilterProvider } from '@/store/FilterContext'
import { BoardStateContext } from '@/store/BoardStateContext'
import { PendingOpsContext } from '@/store/PendingOpsContext'
import { ConflictContext } from '@/store/ConflictContext'
import { BoardAPIProvider } from '@/store/BoardAPIContext'
import { FilterAPIProvider } from '@/store/FilterAPIContext'
import { HistoryProvider } from '@/store/HistoryContext'
import { BoardDispatchContext } from '@/store/BoardDispatchContext'

type AppProviderProps = {
  children: React.ReactNode
}

const seededBoardState: BoardState = {
  tasks: MOCK_TASKS,
  pendingOps: new Map(),
  conflict: null,
}

export function AppProvider({ children }: AppProviderProps) {
  const [boardState, boardDispatch] = useReducer(boardReducer, seededBoardState)
  const [filterState, filterDispatch] = useReducer(filterReducer, initialFilterState)

  return (
    <BoardDispatchContext.Provider value={boardDispatch}>
      <BoardStateContext.Provider value={boardState.tasks}>
        <PendingOpsContext.Provider value={boardState.pendingOps}>
          <ConflictContext.Provider value={boardState.conflict}>
            <BoardAPIProvider dispatch={boardDispatch}>
              <FilterProvider filterState={filterState}>
                <FilterAPIProvider dispatch={filterDispatch}>
                  <HistoryProvider dispatch={boardDispatch} tasks={boardState.tasks}>
                    {children}
                  </HistoryProvider>
                </FilterAPIProvider>
              </FilterProvider>
            </BoardAPIProvider>
          </ConflictContext.Provider>
        </PendingOpsContext.Provider>
      </BoardStateContext.Provider>
    </BoardDispatchContext.Provider>
  )
}
