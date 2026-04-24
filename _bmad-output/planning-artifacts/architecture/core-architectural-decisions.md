# Core Architectural Decisions

## Decision Priority Analysis

**Critical (block implementation):**
- State machine shape and context split strategy
- Action taxonomy (what pushes to history, what doesn't)
- Undo/redo integration with board dispatch

**Important (shape architecture):**
- Drag-and-drop library, toast library, form management, testing
- Mock API structure

**Deferred (post-MVP):**
- AWS deployment, dark mode, service workers

---

## Frontend Architecture — State Machine Design

### Context Split Strategy

_Reference: `docs/article-notes.md` — developerway.com performant Context patterns_

Split by update frequency and consumer set. Never one big context:

```
AppProvider
├── BoardStateContext    — tasks[] only (hot path — read by columns)
├── PendingOpsContext    — Map<opId, PendingOperation> (read by loading indicators only)
├── ConflictContext      — ConflictState | null (read by conflict modal only)
├── BoardAPIContext      — stable memoized action creators (useMemo, [] deps — NEVER re-renders consumers)
├── FilterContext        — { assignee, priority, searchQuery }
├── FilterAPIContext     — stable { setFilter, setSearch } (useMemo, [] deps)
└── HistoryContext       — { undoLabel, redoLabel, canUndo, canRedo } (read-only, thin)
```

**CRITICAL — pass slice references directly, never wrapped in objects:**

```typescript
// ❌ Wrong — new object on every dispatch defeats the entire split
<BoardStateContext.Provider value={{ tasks: boardState.tasks }}>

// ✅ Correct — React diffs the slice reference directly via Object.is
const BoardStateContext = createContext<Task[]>([])
<BoardStateContext.Provider value={boardState.tasks}>
```

When `OP_SUCCESS` fires, the reducer returns `{ ...state, pendingOps: newMap }`. Because `tasks` is not touched, `boardState.tasks` keeps the same array reference → `BoardStateContext` value is unchanged → task consumers do not re-render. This only works if the value IS the slice, not an object wrapping it.

**Why this split matters:**
- Separating `PendingOpsContext` from `BoardStateContext`: a pending op completing does NOT re-render columns or task cards — only loading indicators
- Separating `ConflictContext`: conflict detection/resolution does not touch the task list render path
- Stable API contexts via `useMemo([], [])`: action creator consumers never re-render due to state changes

**Custom hooks per consumer domain:**

```typescript
useTasks()      // BoardStateContext — re-renders on task changes
useBoardAPI()   // BoardAPIContext  — NEVER re-renders (stable)
usePendingOps() // PendingOpsContext — re-renders on op changes only
useConflict()   // ConflictContext  — re-renders on conflict only
useFilters()    // FilterContext    — re-renders on filter changes only
useFilterAPI()  // FilterAPIContext — NEVER re-renders (stable)
useHistory()    // HistoryContext   — re-renders on undo/redo label change
```

### Single Reducer — Atomic Writes, Split Reads

One `boardReducer` manages all three board domains as a single atomic state. `AppProvider` unpacks into separate read contexts:

```typescript
// AppProvider.tsx
const [boardState, boardDispatch] = useReducer(boardReducer, initialBoardState)

return (
  <BoardStateContext.Provider value={boardState.tasks}>
    <PendingOpsContext.Provider value={boardState.pendingOps}>
      <ConflictContext.Provider value={boardState.conflict}>
        <BoardAPIContext.Provider value={api}>
          <FilterProvider>
            <FilterAPIProvider>
              <HistoryProvider>
                {children}
              </HistoryProvider>
            </FilterAPIProvider>
          </FilterProvider>
        </BoardAPIContext.Provider>
      </ConflictContext.Provider>
    </PendingOpsContext.Provider>
  </BoardStateContext.Provider>
)
```

Rationale: an optimistic update that simultaneously changes `tasks[]` AND records a `pendingOp` must be atomic — one reducer case handles both in a single state transition.

### State Shape

```typescript
// boardReducer manages this single state object
type BoardState = {
  tasks: Task[];
  pendingOps: Map<string, PendingOperation>;
  conflict: ConflictState | null;
}

type PendingOperation = {
  id: string;
  taskId: string;
  snapshot: Task;  // task state BEFORE this op — used for rollback
}

type ConflictState = {
  local: Task;
  remote: Task;
}

// FilterContext (separate reducer)
type FilterState = {
  assignee: string | null;
  priority: Priority | null;
  searchQuery: string;
}

// HistoryContext (read-only view — managed by useHistory hook)
type HistoryViewState = {
  undoLabel: string | null;   // e.g. "Undo: Move 'Auth task' to Done"
  redoLabel: string | null;
  canUndo: boolean;
  canRedo: boolean;
}
```

### Stable API Context Pattern

```typescript
// BoardAPIContext — stable for provider lifetime, zero consumer re-renders
const api = useMemo(() => ({
  moveTask:   (taskId: string, newStatus: TaskStatus) =>
                dispatch({ type: 'TASK_MOVE', taskId, newStatus, opId: nanoid() }),
  createTask: (task: Omit<Task, 'id'>) =>
                dispatch({ type: 'TASK_CREATE', task: { ...task, id: nanoid() }, opId: nanoid() }),
  updateTask: (taskId: string, changes: Partial<Task>) =>
                dispatch({ type: 'TASK_UPDATE', taskId, changes, opId: nanoid() }),
  deleteTask: (taskId: string) =>
                dispatch({ type: 'TASK_DELETE', taskId, opId: nanoid() }),
}), []) // empty deps — dispatch from useReducer is stable
```

### Action Taxonomy — The Critical Invariant

```typescript
type BoardAction =
  // USER ACTIONS — pushed to history stack by useHistory hook
  | { type: 'TASK_MOVE';   taskId: string; newStatus: TaskStatus; opId: string }
  | { type: 'TASK_CREATE'; task: Task;                             opId: string }
  | { type: 'TASK_UPDATE'; taskId: string; changes: Partial<Task>; opId: string }
  | { type: 'TASK_DELETE'; taskId: string;                         opId: string }

  // SYSTEM ACTIONS — NEVER pushed to history
  | { type: 'OP_SUCCESS';             opId: string }
  | { type: 'OP_ROLLBACK';            opId: string }  // restores snapshot; transparent to undo/redo
  | { type: 'REMOTE_UPDATE';          task: Task }
  | { type: 'CONFLICT_DETECTED';      local: Task; remote: Task }
  | { type: 'CONFLICT_RESOLVE_MINE' }
  | { type: 'CONFLICT_RESOLVE_THEIRS' }

  // UNDO/REDO — dispatched by useHistory only; never re-push to history
  | { type: 'HISTORY_APPLY'; action: UserAction }
```

### Undo/Redo Integration

The `useHistory` hook owns the command stack and wraps `boardAPI`:

```typescript
type HistoryEntry = {
  id: string;
  label: string;         // "Move 'Auth task' to Done"
  forward: UserAction;   // what was done — for redo
  inverse: UserAction;   // how to undo it — captured at dispatch time
}

// Usage in components:
const { dispatch, undo, redo } = useHistory(boardAPI)
// dispatch() → applies action + pushes {forward, inverse, label} to stack
// undo()     → moves cursor back, dispatches HISTORY_APPLY(inverse)
// redo()     → moves cursor forward, dispatches HISTORY_APPLY(forward)
```

**OP_ROLLBACK invariant in reducer:**

```typescript
case 'OP_ROLLBACK': {
  // Restores snapshot — history stack is UNTOUCHED
  // Rollback is transparent to the undo/redo system
}
```

### Performance Invariants

1. Every `TaskCard` is `React.memo`'d — re-renders only when its own `task` prop changes
2. Column task lists derived with `useMemo` — keyed on `tasks` + active filters
3. API context consumers never re-render — `useMemo` with empty deps
4. `PendingOpsContext` change does not cascade to column or task card re-renders
5. `ConflictContext` change does not touch the task list render path
6. `Map<opId, op>` for pending ops — O(1) rollback lookup

---

## Data Architecture

No database. All state lives in React. Single source of truth:

| Data | Context | Reason |
|---|---|---|
| Task list | `BoardStateContext` (via boardReducer) | Mutated by all four action sources |
| Pending ops | `PendingOpsContext` (via boardReducer) | Decoupled to avoid cascading re-renders |
| Conflict state | `ConflictContext` (via boardReducer) | Only conflict modal subscribes |
| Filter/search | `FilterContext` | Decoupled so filter change ≠ task re-render |
| History stack | `useHistory` hook (internal) | Exposed read-only via `HistoryContext` |

---

## API & Communication — Mock Layer

```typescript
// src/api/mock-client.ts
async function mockRequest<T>(
  fn: () => T,
  opts = { delay: 2000, failureRate: 0.1 }
): Promise<T> {
  await sleep(opts.delay)
  if (Math.random() < opts.failureRate) throw new MockApiError('Simulated failure')
  return fn()
}
```

All API functions (`createTask`, `updateTask`, `deleteTask`, `moveTask`) call through this single utility. One place for delay and failure rate configuration.

---

## Library Decisions

| Concern | Choice | Rationale |
|---|---|---|
| Drag-and-drop | `@dnd-kit/core` + `@dnd-kit/sortable` + `@dnd-kit/utilities` | React 18 native, accessible, TypeScript-first; `react-beautiful-dnd` deprecated 2024 |
| Toast | Sonner | React 18 native, Tailwind-compatible, queued by default — handles concurrent toasts |
| Forms | React Hook Form | Uncontrolled inputs = zero re-renders per keystroke; justified at 6+ fields |
| Testing | Vitest + React Testing Library | Zero extra config on Vite; reducers and useHistory are pure — unit-testable without rendering |

---

## Infrastructure & Deployment

- **Local dev:** Vite dev server (built-in)
- **AWS (deferred to Phase 3):** S3 + CloudFront (static), API Gateway + Lambda (if real API requested by interviewer)
- **CI/CD:** Not in scope for MVP
