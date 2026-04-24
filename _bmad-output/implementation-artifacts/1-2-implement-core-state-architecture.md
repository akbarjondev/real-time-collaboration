# Story 1.2: Implement Core State Architecture

Status: ready-for-dev

## Story

As a developer,
I want the complete state management architecture (boardReducer, all contexts, and AppProvider) implemented,
so that all subsequent feature stories can dispatch actions and consume state via the established custom hooks.

## Acceptance Criteria

1. **Given** the architecture specification **When** `src/types/task.types.ts` is created **Then** it exports `Task`, `TaskStatus` (`'todo' | 'in-progress' | 'done'`), `Priority` (`'low' | 'medium' | 'high'`), and `Tag` types **And** the file compiles with zero TypeScript errors in strict mode.

2. **Given** `src/types/common.types.ts` **When** created **Then** it exports `AsyncState<T>` as a discriminated union (`idle | loading | success | error`), `ID` as `string`, `PendingOperation`, and `ConflictState` types.

3. **Given** `src/store/boardReducer.ts` **When** implemented with `BoardState` (`{ tasks: Task[]; pendingOps: Map<string, PendingOperation>; conflict: ConflictState | null }`) and all 11 `BoardAction` types (TASK_MOVE, TASK_CREATE, TASK_UPDATE, TASK_DELETE, OP_SUCCESS, OP_ROLLBACK, REMOTE_UPDATE, CONFLICT_DETECTED, CONFLICT_RESOLVE_MINE, CONFLICT_RESOLVE_THEIRS, HISTORY_APPLY) **Then** the reducer compiles with zero TypeScript errors **And** every case returns a full state spread — never mutates state directly.

4. **Given** all 7 context files (`BoardStateContext`, `PendingOpsContext`, `ConflictContext`, `BoardAPIContext`, `FilterContext`, `FilterAPIContext`, `HistoryContext`) **When** implemented with their specified types **Then** each exports a typed context and a corresponding custom hook (`useTasks`, `usePendingOps`, `useConflict`, `useBoardAPI`, `useFilters`, `useFilterAPI`, `useHistory`) **And** the context value IS the slice directly (not wrapped in an object).

5. **Given** `BoardAPIContext` **When** action creators are defined (`moveTask`, `createTask`, `updateTask`, `deleteTask`) **Then** they are wrapped in `useMemo([], [])` (empty deps) so consumers never re-render due to state changes **And** each action creator generates a `nanoid()` opId before dispatching.

6. **Given** `src/store/AppProvider.tsx` **When** implemented with the specified provider nesting order **Then** `<AppProvider>` wraps `<App />` in `src/main.tsx` **And** each context slice is passed directly (not wrapped): `<BoardStateContext.Provider value={boardState.tasks}>`.

7. **Given** `src/store/FilterContext.tsx` **When** implemented with `FilterState` (`{ assignee: string | null; priority: Priority | null; searchQuery: string }`) and `filterReducer` **Then** it provides `useFilters()` and `useFilterAPI()` hooks with stable setters via `useMemo([], [filterDispatch])`.

## Tasks / Subtasks

- [ ] Task 1: Create domain type files (AC: #1, #2)
  - [ ] Replace stub in `src/types/task.types.ts` with `Tag`, `TaskStatus`, `Priority`, and `Task` type definitions
  - [ ] Replace stub in `src/types/common.types.ts` with `ID`, `AsyncState<T>`, `PendingOperation`, and `ConflictState` type definitions
  - [ ] Run `tsc --noEmit` after each file to confirm zero errors

- [ ] Task 2: Implement `boardReducer.ts` (AC: #3)
  - [ ] Define `BoardState` interface using `Task[]`, `Map<string, PendingOperation>`, and `ConflictState | null`
  - [ ] Define `BoardAction` discriminated union with all 11 action types
  - [ ] Implement `boardReducer` function with a `switch` on `action.type` — one case per action
  - [ ] Implement `TASK_MOVE` case: spread state, map tasks to update matching task's status, add PendingOperation to pendingOps
  - [ ] Implement `TASK_CREATE` case: spread state, append new task to tasks array, add PendingOperation
  - [ ] Implement `TASK_UPDATE` case: spread state, map tasks to merge changes onto matching task, add PendingOperation
  - [ ] Implement `TASK_DELETE` case: spread state, filter out matching task from tasks, add PendingOperation
  - [ ] Implement `OP_SUCCESS` case: remove opId from pendingOps Map (return new Map without that key)
  - [ ] Implement `OP_ROLLBACK` case: restore task from snapshot stored in pendingOps, remove the op from pendingOps
  - [ ] Implement `REMOTE_UPDATE` case: upsert task into tasks array (replace if exists, append if new) — no pendingOps change
  - [ ] Implement `CONFLICT_DETECTED` case: set `conflict` to `{ taskId, remoteTask, localTask }`
  - [ ] Implement `CONFLICT_RESOLVE_MINE` case: clear `conflict` to null (local state stays as-is)
  - [ ] Implement `CONFLICT_RESOLVE_THEIRS` case: replace local task with remoteTask, clear `conflict`
  - [ ] Implement `HISTORY_APPLY` case: re-dispatch `action.action` through the reducer recursively (apply without re-recording)
  - [ ] Add `default` case returning state unchanged
  - [ ] Export `initialBoardState` constant

- [ ] Task 3: Implement the three read-only board contexts (AC: #4)
  - [ ] Replace stub `src/store/BoardStateContext.tsx` with `React.createContext<Task[]>([])`, `BoardStateContext.Provider`, and `useTasks()` hook
  - [ ] Replace stub `src/store/PendingOpsContext.tsx` with `React.createContext<Map<string, PendingOperation>>(new Map())`, provider, and `usePendingOps()` hook
  - [ ] Replace stub `src/store/ConflictContext.tsx` with `React.createContext<ConflictState | null>(null)`, provider, and `useConflict()` hook
  - [ ] Each custom hook must throw a descriptive error if called outside its provider

- [ ] Task 4: Implement `BoardAPIContext.tsx` (AC: #4, #5)
  - [ ] Define `BoardAPIContextType` interface with `moveTask`, `createTask`, `updateTask`, `deleteTask` signatures
  - [ ] Create context with `null` as default value (throw in hook if null)
  - [ ] In `BoardAPIProvider`, accept `dispatch: React.Dispatch<BoardAction>` as a prop
  - [ ] Wrap all four action creators in a single `useMemo(() => ({ ... }), [])` with empty deps
  - [ ] Each creator: call `nanoid()` for `opId`, then call `dispatch({ ... })`
  - [ ] Export `useBoardAPI()` custom hook that reads and returns the context value

- [ ] Task 5: Implement `FilterContext.tsx` and `FilterAPIContext.tsx` (AC: #7)
  - [ ] Define `FilterState` and `FilterAction` types in `FilterContext.tsx`
  - [ ] Implement `filterReducer` handling `SET_ASSIGNEE`, `SET_PRIORITY`, `SET_SEARCH`, and `RESET_FILTERS` actions
  - [ ] Create `FilterContext` with `FilterState` type and export `FilterProvider` component
  - [ ] Export `useFilters()` custom hook
  - [ ] In `FilterAPIContext.tsx`, create stable `setAssignee`, `setPriority`, `setSearch`, `resetFilters` wrapped in `useMemo([], [filterDispatch])`
  - [ ] Export `useFilterAPI()` custom hook

- [ ] Task 6: Scaffold `HistoryContext.tsx` (AC: #4)
  - [ ] Define `HistoryContextType` with `undoLabel: string | null`, `redoLabel: string | null`, `canUndo: boolean`, `canRedo: boolean`
  - [ ] Create context with a stub default value (all false/null)
  - [ ] Create `HistoryProvider` stub that renders children without any logic (full impl deferred to Story 7.1)
  - [ ] Export `useHistory()` custom hook
  - [ ] Add comment: `// Stub — full implementation in Story 7.1`

- [ ] Task 7: Implement `AppProvider.tsx` (AC: #6)
  - [ ] Import all context providers and `boardReducer`
  - [ ] Use `useReducer(boardReducer, initialBoardState)` to get `[boardState, boardDispatch]`
  - [ ] Use `useReducer(filterReducer, initialFilterState)` to get `[filterState, filterDispatch]`
  - [ ] Nest providers in the exact specified order (see Dev Notes)
  - [ ] Pass slices directly — NOT wrapped in objects
  - [ ] Export `AppProvider` as a named export (not default)

- [ ] Task 8: Update `src/main.tsx` to wrap App in AppProvider (AC: #6)
  - [ ] Import `AppProvider` from `@/store/AppProvider`
  - [ ] Wrap `<App />` inside `<AppProvider>` in the `ReactDOM.createRoot(...).render(...)` call
  - [ ] Confirm `tsc --noEmit` passes with zero errors after this change

- [ ] Task 9: Final verification
  - [ ] Run `tsc --noEmit` — must report zero errors
  - [ ] Confirm no barrel `index.ts` or `index.tsx` files were created
  - [ ] Confirm no `any` types were introduced
  - [ ] Confirm no context value is wrapped in an object (search for `value={{`)

## Dev Notes

### Overview of the 7-Context Split Pattern

The single `boardReducer` produces one `BoardState` object. `AppProvider` unpacks it into three separate read contexts and one write context. This enables fine-grained re-renders: a task card that only calls `useTasks()` never re-renders when `pendingOps` changes.

```
boardReducer → BoardState
                  ├── tasks       → BoardStateContext   → useTasks()
                  ├── pendingOps  → PendingOpsContext    → usePendingOps()
                  └── conflict    → ConflictContext      → useConflict()

boardDispatch   → BoardAPIContext  → useBoardAPI()       (write-only, stable)

filterReducer → FilterState
                  └── FilterContext → useFilters()

filterDispatch  → FilterAPIContext → useFilterAPI()      (stable setters)

HistoryContext  → useHistory()     (read-only view, stub until Story 7.1)
```

### File: `src/types/task.types.ts`

```typescript
export type TaskStatus = 'todo' | 'in-progress' | 'done'

export type Priority = 'low' | 'medium' | 'high'

export type Tag = {
  id: string
  label: string
}

export type Task = {
  id: string           // always nanoid()
  title: string
  description?: string
  assignee?: string
  status: TaskStatus
  priority: Priority
  tags: Tag[]
  createdAt: string    // always new Date().toISOString()
}
```

### File: `src/types/common.types.ts`

```typescript
export type ID = string

export type AsyncState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: string }

export type PendingOperation = {
  opId: string
  taskId: string
  snapshot: Task  // full task state BEFORE optimistic apply — used for OP_ROLLBACK
}

export type ConflictState = {
  taskId: string
  remoteTask: Task
  localTask: Task
}
```

Note: `PendingOperation` and `ConflictState` reference `Task`, so import it:
```typescript
import type { Task } from '@/types/task.types'
```

### File: `src/store/boardReducer.ts`

Complete type and implementation reference:

```typescript
import type { Task, TaskStatus } from '@/types/task.types'
import type { PendingOperation, ConflictState } from '@/types/common.types'

export type BoardState = {
  tasks: Task[]
  pendingOps: Map<string, PendingOperation>
  conflict: ConflictState | null
}

export type BoardAction =
  | { type: 'TASK_MOVE'; taskId: string; newStatus: TaskStatus; opId: string }
  | { type: 'TASK_CREATE'; task: Task; opId: string }
  | { type: 'TASK_UPDATE'; taskId: string; changes: Partial<Task>; opId: string }
  | { type: 'TASK_DELETE'; taskId: string; opId: string }
  | { type: 'OP_SUCCESS'; opId: string }
  | { type: 'OP_ROLLBACK'; opId: string }
  | { type: 'REMOTE_UPDATE'; task: Task }
  | { type: 'CONFLICT_DETECTED'; taskId: string; remoteTask: Task; localTask: Task }
  | { type: 'CONFLICT_RESOLVE_MINE'; taskId: string }
  | { type: 'CONFLICT_RESOLVE_THEIRS'; taskId: string; remoteTask: Task }
  | { type: 'HISTORY_APPLY'; action: BoardAction; inverse: BoardAction }

export const initialBoardState: BoardState = {
  tasks: [],
  pendingOps: new Map(),
  conflict: null,
}

export function boardReducer(state: BoardState, action: BoardAction): BoardState {
  switch (action.type) {

    case 'TASK_MOVE': {
      const newPendingOps = new Map(state.pendingOps)
      const snapshot = state.tasks.find(t => t.id === action.taskId)
      if (!snapshot) return state
      newPendingOps.set(action.opId, { opId: action.opId, taskId: action.taskId, snapshot })
      return {
        ...state,
        tasks: state.tasks.map(t =>
          t.id === action.taskId ? { ...t, status: action.newStatus } : t
        ),
        pendingOps: newPendingOps,
      }
    }

    case 'TASK_CREATE': {
      const newPendingOps = new Map(state.pendingOps)
      // Snapshot is the task itself — rollback deletes it
      newPendingOps.set(action.opId, { opId: action.opId, taskId: action.task.id, snapshot: action.task })
      return {
        ...state,
        tasks: [...state.tasks, action.task],
        pendingOps: newPendingOps,
      }
    }

    case 'TASK_UPDATE': {
      const newPendingOps = new Map(state.pendingOps)
      const snapshot = state.tasks.find(t => t.id === action.taskId)
      if (!snapshot) return state
      newPendingOps.set(action.opId, { opId: action.opId, taskId: action.taskId, snapshot })
      return {
        ...state,
        tasks: state.tasks.map(t =>
          t.id === action.taskId ? { ...t, ...action.changes } : t
        ),
        pendingOps: newPendingOps,
      }
    }

    case 'TASK_DELETE': {
      const newPendingOps = new Map(state.pendingOps)
      const snapshot = state.tasks.find(t => t.id === action.taskId)
      if (!snapshot) return state
      newPendingOps.set(action.opId, { opId: action.opId, taskId: action.taskId, snapshot })
      return {
        ...state,
        tasks: state.tasks.filter(t => t.id !== action.taskId),
        pendingOps: newPendingOps,
      }
    }

    case 'OP_SUCCESS': {
      const newPendingOps = new Map(state.pendingOps)
      newPendingOps.delete(action.opId)
      return { ...state, pendingOps: newPendingOps }
    }

    case 'OP_ROLLBACK': {
      const op = state.pendingOps.get(action.opId)
      if (!op) return state
      const newPendingOps = new Map(state.pendingOps)
      newPendingOps.delete(action.opId)
      // Restore snapshot: if task still exists replace it; if it was a CREATE, remove it
      const taskExists = state.tasks.some(t => t.id === op.taskId)
      const restoredTasks = taskExists
        ? state.tasks.map(t => t.id === op.taskId ? op.snapshot : t)
        : state.tasks.filter(t => t.id !== op.taskId) // was TASK_CREATE rollback — task was never real
      return { ...state, tasks: restoredTasks, pendingOps: newPendingOps }
    }

    case 'REMOTE_UPDATE': {
      const exists = state.tasks.some(t => t.id === action.task.id)
      return {
        ...state,
        tasks: exists
          ? state.tasks.map(t => t.id === action.task.id ? action.task : t)
          : [...state.tasks, action.task],
      }
    }

    case 'CONFLICT_DETECTED': {
      return {
        ...state,
        conflict: {
          taskId: action.taskId,
          remoteTask: action.remoteTask,
          localTask: action.localTask,
        },
      }
    }

    case 'CONFLICT_RESOLVE_MINE': {
      // Keep local state as-is; just clear the conflict flag
      return { ...state, conflict: null }
    }

    case 'CONFLICT_RESOLVE_THEIRS': {
      return {
        ...state,
        tasks: state.tasks.map(t =>
          t.id === action.taskId ? action.remoteTask : t
        ),
        conflict: null,
      }
    }

    case 'HISTORY_APPLY': {
      // Re-apply the recorded action through the reducer without re-recording
      // The HistoryProvider calls dispatch(HISTORY_APPLY) — the reducer applies the inner action
      return boardReducer(state, action.action)
    }

    default:
      return state
  }
}
```

**Critical reducer rules:**
- NEVER use `state.tasks.push(...)` or any mutation — always spread
- ALWAYS return `{ ...state, ... }` — never return state with only a nested mutation
- `Map` must be reconstructed: `new Map(state.pendingOps)` then `.set()` / `.delete()`
- `OP_ROLLBACK` for `TASK_CREATE`: the snapshot IS the newly created task, so rollback removes it from the array. Use `tasks.filter(t => t.id !== op.taskId)` only if the task shouldn't exist after rollback — determine from context that it's a create rollback by checking if there's no pre-existing task. The simplest reliable approach: always restore snapshot if task exists in array; filter it out if the create was the origin (see comment in code above).

### File: `src/store/BoardStateContext.tsx`

```typescript
import { createContext, useContext } from 'react'
import type { Task } from '@/types/task.types'

export const BoardStateContext = createContext<Task[]>([])

export function useTasks(): Task[] {
  return useContext(BoardStateContext)
}
```

Note: No custom error needed here since the default value `[]` is valid. However, if you want to detect "used outside provider" errors in development, use the sentinel pattern shown in `BoardAPIContext` below.

### File: `src/store/PendingOpsContext.tsx`

```typescript
import { createContext, useContext } from 'react'
import type { PendingOperation } from '@/types/common.types'

export const PendingOpsContext = createContext<Map<string, PendingOperation>>(new Map())

export function usePendingOps(): Map<string, PendingOperation> {
  return useContext(PendingOpsContext)
}
```

### File: `src/store/ConflictContext.tsx`

```typescript
import { createContext, useContext } from 'react'
import type { ConflictState } from '@/types/common.types'

export const ConflictContext = createContext<ConflictState | null>(null)

export function useConflict(): ConflictState | null {
  return useContext(ConflictContext)
}
```

### File: `src/store/BoardAPIContext.tsx`

This is the ONLY write gate for board mutations. The key constraint is `useMemo([], [])` — empty dependency array — so the action creator object reference never changes, preventing re-renders in consumers that only call `useBoardAPI()`.

```typescript
import { createContext, useContext, useMemo } from 'react'
import { nanoid } from 'nanoid'
import type { Task, TaskStatus } from '@/types/task.types'
import type { BoardAction } from '@/store/boardReducer'

export type BoardAPIContextType = {
  moveTask: (taskId: string, newStatus: TaskStatus) => void
  createTask: (task: Omit<Task, 'id' | 'createdAt'>) => void
  updateTask: (taskId: string, changes: Partial<Omit<Task, 'id' | 'createdAt'>>) => void
  deleteTask: (taskId: string) => void
}

const BoardAPIContext = createContext<BoardAPIContextType | null>(null)

type BoardAPIProviderProps = {
  dispatch: React.Dispatch<BoardAction>
  children: React.ReactNode
}

export function BoardAPIProvider({ dispatch, children }: BoardAPIProviderProps) {
  const boardAPI = useMemo<BoardAPIContextType>(() => ({
    moveTask: (taskId: string, newStatus: TaskStatus) => {
      const opId = nanoid()
      dispatch({ type: 'TASK_MOVE', taskId, newStatus, opId })
    },
    createTask: (task: Omit<Task, 'id' | 'createdAt'>) => {
      const opId = nanoid()
      const newTask: Task = {
        ...task,
        id: nanoid(),
        createdAt: new Date().toISOString(),
      }
      dispatch({ type: 'TASK_CREATE', task: newTask, opId })
    },
    updateTask: (taskId: string, changes: Partial<Omit<Task, 'id' | 'createdAt'>>) => {
      const opId = nanoid()
      dispatch({ type: 'TASK_UPDATE', taskId, changes, opId })
    },
    deleteTask: (taskId: string) => {
      const opId = nanoid()
      dispatch({ type: 'TASK_DELETE', taskId, opId })
    },
  }), [])  // EMPTY DEPS — stable forever; dispatch is stable (React guarantees it)

  return (
    <BoardAPIContext.Provider value={boardAPI}>
      {children}
    </BoardAPIContext.Provider>
  )
}

export function useBoardAPI(): BoardAPIContextType {
  const ctx = useContext(BoardAPIContext)
  if (!ctx) {
    throw new Error('useBoardAPI must be used within BoardAPIProvider')
  }
  return ctx
}
```

**Why `dispatch` is safe in empty deps:** React guarantees that the `dispatch` function returned by `useReducer` is stable (referentially equal across renders). It is safe to omit from deps per the React docs.

### File: `src/store/FilterContext.tsx`

```typescript
import { createContext, useContext, useReducer } from 'react'
import type { Priority } from '@/types/task.types'

export type FilterState = {
  assignee: string | null
  priority: Priority | null
  searchQuery: string
}

type FilterAction =
  | { type: 'SET_ASSIGNEE'; assignee: string | null }
  | { type: 'SET_PRIORITY'; priority: Priority | null }
  | { type: 'SET_SEARCH'; searchQuery: string }
  | { type: 'RESET_FILTERS' }

export const initialFilterState: FilterState = {
  assignee: null,
  priority: null,
  searchQuery: '',
}

export function filterReducer(state: FilterState, action: FilterAction): FilterState {
  switch (action.type) {
    case 'SET_ASSIGNEE':
      return { ...state, assignee: action.assignee }
    case 'SET_PRIORITY':
      return { ...state, priority: action.priority }
    case 'SET_SEARCH':
      return { ...state, searchQuery: action.searchQuery }
    case 'RESET_FILTERS':
      return initialFilterState
    default:
      return state
  }
}

// Export FilterAction type for use by FilterAPIContext
export type { FilterAction }

const FilterContext = createContext<FilterState>(initialFilterState)

type FilterProviderProps = {
  filterState: FilterState
  children: React.ReactNode
}

export function FilterProvider({ filterState, children }: FilterProviderProps) {
  return (
    <FilterContext.Provider value={filterState}>
      {children}
    </FilterContext.Provider>
  )
}

export function useFilters(): FilterState {
  return useContext(FilterContext)
}
```

Note: `FilterProvider` accepts `filterState` as a prop from `AppProvider` (which owns the `useReducer` call). This keeps the pattern consistent with the board state split.

### File: `src/store/FilterAPIContext.tsx`

```typescript
import { createContext, useContext, useMemo } from 'react'
import type { Priority } from '@/types/task.types'
import type { FilterAction } from '@/store/FilterContext'

export type FilterAPIContextType = {
  setAssignee: (assignee: string | null) => void
  setPriority: (priority: Priority | null) => void
  setSearch: (searchQuery: string) => void
  resetFilters: () => void
}

const FilterAPIContext = createContext<FilterAPIContextType | null>(null)

type FilterAPIProviderProps = {
  dispatch: React.Dispatch<FilterAction>
  children: React.ReactNode
}

export function FilterAPIProvider({ dispatch, children }: FilterAPIProviderProps) {
  const filterAPI = useMemo<FilterAPIContextType>(() => ({
    setAssignee: (assignee) => dispatch({ type: 'SET_ASSIGNEE', assignee }),
    setPriority: (priority) => dispatch({ type: 'SET_PRIORITY', priority }),
    setSearch: (searchQuery) => dispatch({ type: 'SET_SEARCH', searchQuery }),
    resetFilters: () => dispatch({ type: 'RESET_FILTERS' }),
  }), [dispatch])  // dispatch is stable — React guarantees it

  return (
    <FilterAPIContext.Provider value={filterAPI}>
      {children}
    </FilterAPIContext.Provider>
  )
}

export function useFilterAPI(): FilterAPIContextType {
  const ctx = useContext(FilterAPIContext)
  if (!ctx) {
    throw new Error('useFilterAPI must be used within FilterAPIProvider')
  }
  return ctx
}
```

Note: `FilterAPIContext` uses `[dispatch]` in the deps array (not empty `[]`) because `filterDispatch` is passed as a prop. React still guarantees it is stable, but being explicit is safer when it comes from a prop.

### File: `src/store/HistoryContext.tsx`

This is a scaffold only. The full implementation with undo/redo logic is Story 7.1.

```typescript
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

// Stub provider — renders children unchanged; real logic added in Story 7.1
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
```

### File: `src/store/AppProvider.tsx`

This is the composition root that owns both `useReducer` calls and splits state into separate providers.

```typescript
import { useReducer } from 'react'
import { boardReducer, initialBoardState } from '@/store/boardReducer'
import { filterReducer, initialFilterState, FilterProvider } from '@/store/FilterContext'
import { BoardStateContext } from '@/store/BoardStateContext'
import { PendingOpsContext } from '@/store/PendingOpsContext'
import { ConflictContext } from '@/store/ConflictContext'
import { BoardAPIProvider } from '@/store/BoardAPIContext'
import { FilterAPIProvider } from '@/store/FilterAPIContext'
import { HistoryProvider } from '@/store/HistoryContext'

type AppProviderProps = {
  children: React.ReactNode
}

export function AppProvider({ children }: AppProviderProps) {
  const [boardState, boardDispatch] = useReducer(boardReducer, initialBoardState)
  const [filterState, filterDispatch] = useReducer(filterReducer, initialFilterState)

  return (
    // Read contexts: pass slices DIRECTLY — never wrap in an object
    <BoardStateContext.Provider value={boardState.tasks}>
      <PendingOpsContext.Provider value={boardState.pendingOps}>
        <ConflictContext.Provider value={boardState.conflict}>
          {/* Write context: stable dispatch wrapper */}
          <BoardAPIProvider dispatch={boardDispatch}>
            {/* Filter read context */}
            <FilterProvider filterState={filterState}>
              {/* Filter write context: stable setters */}
              <FilterAPIProvider dispatch={filterDispatch}>
                {/* History: stub until Story 7.1 */}
                <HistoryProvider>
                  {children}
                </HistoryProvider>
              </FilterAPIProvider>
            </FilterProvider>
          </BoardAPIProvider>
        </ConflictContext.Provider>
      </PendingOpsContext.Provider>
    </BoardStateContext.Provider>
  )
}
```

**Provider nesting order is fixed — do not reorder:**
1. `BoardStateContext.Provider` (outermost read)
2. `PendingOpsContext.Provider`
3. `ConflictContext.Provider`
4. `BoardAPIProvider` (write — wraps boardDispatch)
5. `FilterProvider` (read)
6. `FilterAPIProvider` (write — wraps filterDispatch)
7. `HistoryProvider` (read — stub)
8. `{children}` (innermost)

### File: `src/main.tsx`

Minimal change — wrap `<App />` in `<AppProvider>`:

```typescript
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@/index.css'
import { App } from '@/App'
import { AppProvider } from '@/store/AppProvider'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProvider>
      <App />
    </AppProvider>
  </StrictMode>,
)
```

Note: If `App` is currently a default export in the Vite scaffold, keep it as-is or adjust the import. Do not refactor `App.tsx` in this story — that is Story 1.4's scope.

### Action Taxonomy (critical for HistoryProvider in Story 7.1+)

| Action | Category | Enters History Stack |
|--------|----------|---------------------|
| `TASK_MOVE` | User action | YES |
| `TASK_CREATE` | User action | YES |
| `TASK_UPDATE` | User action | YES |
| `TASK_DELETE` | User action | YES |
| `OP_SUCCESS` | System action | NO |
| `OP_ROLLBACK` | System action | NO |
| `REMOTE_UPDATE` | System action | NO |
| `CONFLICT_DETECTED` | System action | NO |
| `CONFLICT_RESOLVE_MINE` | System action | NO |
| `CONFLICT_RESOLVE_THEIRS` | System action | NO |
| `HISTORY_APPLY` | Re-application | NO (already recorded) |

When Story 7.1 implements `HistoryProvider`, it will intercept `boardDispatch` calls. Only the four user actions above will push to the 50-entry command stack.

### FORBIDDEN Patterns

| Pattern | Why it breaks | Correct alternative |
|---------|---------------|---------------------|
| `<BoardStateContext.Provider value={{ tasks: boardState.tasks }}>` | Object wrap causes re-render on every state change | `value={boardState.tasks}` |
| `useContext(BoardStateContext)` in a component | Bypasses the hook layer | `useTasks()` |
| `state.tasks.push(newTask)` in reducer | Mutation — React won't detect change | `tasks: [...state.tasks, newTask]` |
| `state.pendingOps.set(...)` in reducer | Map mutation | `const m = new Map(state.pendingOps); m.set(...); return { ...state, pendingOps: m }` |
| `id: Math.random()` or `id: Date.now()` | Not collision-safe strings | `id: nanoid()` |
| `createdAt: new Date()` | Date object | `createdAt: new Date().toISOString()` |
| `const [loading, setLoading] = useState(false)` | Divergent async flags | `AsyncState<T>` discriminated union |
| Barrel `export * from './types'` | Breaks tree shaking, forbidden in this project | Import directly: `import type { Task } from '@/types/task.types'` |
| `import { boardReducer } from '@/store'` | Barrel import | `import { boardReducer } from '@/store/boardReducer'` |
| `type X = any` | Zero tolerance | Use `unknown` + type guards, or the correct union type |
| Returning partial state: `return { tasks: newTasks }` | Drops other state fields | Always `return { ...state, tasks: newTasks }` |

### TypeScript Strict Mode Considerations

- `"noUncheckedIndexedAccess": true` means `array[0]` has type `T | undefined`. Use `.find()` or check before use.
- `Map.get(key)` returns `T | undefined` — always guard before use in reducer.
- `Partial<Task>` in `TASK_UPDATE.changes` is intentional — the spread `{ ...t, ...action.changes }` is safe because `Partial<Task>` fields that are `undefined` do not overwrite existing fields when spread.
- `BoardAPIContext` default is `null` and the hook throws — this is intentional. Do NOT provide a no-op default; throwing gives a clear error if a component is rendered outside the provider tree.

### Relationship to Previous Story (1-1)

Story 1-1 created all stub files with `export {}`. This story REPLACES those stubs. All directories already exist:
- `src/types/` — replace `task.types.ts` and `common.types.ts` stubs
- `src/store/` — replace all 9 store stubs
- `src/main.tsx` — modify existing file (do NOT recreate from scratch)

No new directories need to be created. No existing feature component stubs in `src/features/` are touched by this story.

### Verification Commands

```bash
# Must return zero errors — run after completing each file
npx tsc --noEmit

# Must return nothing (no barrel exports)
find src -name "index.ts" -o -name "index.tsx"

# Must return nothing (no wrapped context values)
grep -r "value={{" src/store/

# Must return nothing (no any types)
grep -r ": any" src/types/ src/store/
```

### References

- Architecture decisions: `_bmad-output/planning-artifacts/architecture.md` — Section: "7-Context Split Architecture"
- BoardAction types: `_bmad-output/planning-artifacts/epics.md` — Story 1.2 acceptance criteria
- PendingOperation / ConflictState types: `_bmad-output/planning-artifacts/architecture.md` — Section: "State Shape"
- Action taxonomy table: `_bmad-output/planning-artifacts/epics.md` — Additional Requirements bullet "Action taxonomy"
- Provider nesting order: architecture.md — Section: "AppProvider composition"
- Stub file format reference: `_bmad-output/implementation-artifacts/1-1-initialize-project-with-dependencies-and-configuration.md` — Task 7

## Dev Agent Record

### Agent Model Used

_to be filled by dev agent_

### Debug Log References

_to be filled by dev agent_

### Completion Notes List

_to be filled by dev agent_

### File List

- `src/types/task.types.ts`
- `src/types/common.types.ts`
- `src/store/boardReducer.ts`
- `src/store/BoardStateContext.tsx`
- `src/store/PendingOpsContext.tsx`
- `src/store/ConflictContext.tsx`
- `src/store/BoardAPIContext.tsx`
- `src/store/FilterContext.tsx`
- `src/store/FilterAPIContext.tsx`
- `src/store/HistoryContext.tsx`
- `src/store/AppProvider.tsx`
- `src/main.tsx`
