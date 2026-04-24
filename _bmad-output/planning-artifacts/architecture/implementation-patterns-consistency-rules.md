# Implementation Patterns & Consistency Rules

**Critical conflict points identified:** 7 areas where agents could diverge and break each other's code.

## Naming Patterns

### Files & Directories

```
# Components — PascalCase.tsx
TaskCard.tsx           ✅
task-card.tsx          ❌

# Hooks — camelCase with use prefix
useHistory.ts          ✅
use-history.ts         ❌

# Contexts — PascalCase + Context suffix
BoardStateContext.ts   ✅
boardStateContext.ts   ❌

# Test files — co-located, *.test.tsx
TaskCard.test.tsx      ✅  (same folder as component)
__tests__/TaskCard.tsx ❌  (separate folder — don't do this)
```

### Action Types — SCREAMING_SNAKE_CASE, NOUN_VERB order

```typescript
'TASK_MOVE'           ✅
'TASK_CREATE'         ✅
'OP_ROLLBACK'         ✅
'CONFLICT_DETECTED'   ✅
'moveTask'            ❌  (camelCase — conflicts with function names)
'task/move'           ❌  (Redux-style slice — not used here)
```

### TypeScript Naming

```typescript
// Types & interfaces — PascalCase
type Task = { ... }
type BoardAction = { ... }

// Union values — lowercase strings (readable in logs/devtools)
type TaskStatus = 'todo' | 'in-progress' | 'done'
type Priority   = 'low' | 'medium' | 'high'
```

## Structure Patterns

### Feature Folder Shape

```
src/features/tasks/
  components/
    TaskCard.tsx
    TaskCard.test.tsx      ← co-located test
    TaskModal.tsx
  hooks/
    useTaskModal.ts
  types.ts
  utils.ts

src/features/board/
  components/
    BoardColumn.tsx
    KanbanBoard.tsx
  hooks/
    useBoardDnd.ts

src/features/history/
  hooks/
    useHistory.ts
  types.ts

src/store/                 ← all Context + Reducer files
  BoardStateContext.tsx
  PendingOpsContext.tsx
  ConflictContext.tsx
  BoardAPIContext.tsx
  FilterContext.tsx
  FilterAPIContext.tsx
  HistoryContext.tsx
  AppProvider.tsx

src/api/
  mock-client.ts           ← mockRequest<T> utility
  tasks.ts
  types.ts

src/shared/
  components/
    ErrorBoundary.tsx
  hooks/
    useKeyboardShortcut.ts
  utils/
    sleep.ts
```

### No barrel `index.ts` files

```typescript
// ❌ Don't do this
export * from './components/TaskCard'

// ✅ Import directly
import { TaskCard } from '@/features/tasks/components/TaskCard'
```

## Format Patterns

### Async State — Discriminated Union (enforced everywhere)

```typescript
// ✅ Correct
type AsyncState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: string }

// ❌ Wrong — ambiguous combinations possible
type AsyncState<T> = { loading: boolean; data: T | null; error: string | null }
```

### IDs, Dates, Errors

```typescript
// IDs — nanoid() strings only
const id: string = nanoid()         // ✅
const id: number = Date.now()       // ❌

// Dates — ISO 8601 strings
createdAt: new Date().toISOString() // ✅
createdAt: Date.now()               // ❌

// Mock API errors — typed class
class MockApiError extends Error {
  constructor(message = 'Simulated API failure') {
    super(message); this.name = 'MockApiError'
  }
}
```

## State Management Patterns

### Reducer — always return full state spread

```typescript
// ✅
case 'TASK_MOVE': {
  return {
    ...state,
    tasks: state.tasks.map(t =>
      t.id === action.taskId ? { ...t, status: action.newStatus } : t
    ),
  }
}
// ❌ Never mutate state directly
```

### Context consumption — always via custom hook

```typescript
const tasks = useTasks()     // ✅
const api   = useBoardAPI()  // ✅
const tasks = useContext(BoardStateContext)  // ❌
```

### Optimistic update sequence (every mutation follows this exactly)

```
1. opId = nanoid()
2. Record snapshot in pendingOps: { taskId, snapshot: currentTask }
3. Apply change to tasks[] immediately (optimistic)
4. Call mockRequest() in background
5a. On success → dispatch OP_SUCCESS(opId) → remove from pendingOps
5b. On failure → dispatch OP_ROLLBACK(opId) → restore snapshot → toast.error(...)
```

## Process Patterns

### Error Boundaries — feature-level

```
AppRoot
└── ErrorBoundary (app-level)
    └── BoardFeature
        └── ErrorBoundary (board-level — catches board render failures)
```

### Loading State — per-task via PendingOpsContext, not global

```typescript
// ✅
const pendingOps = usePendingOps()
const isPending = [...pendingOps.values()].some(op => op.taskId === task.id)
// ❌ No global isLoading flag
```

### Toast vocabulary — four types, consistent messages

```typescript
toast.error(`Update failed — "${task.title}" has been reverted`)      // rollback
toast.info(`"${task.title}" was updated by another user`)              // remote update
toast.warning(`Conflict on "${task.title}" — choose which to keep`)   // conflict
// Undo confirmation — hint bar only, never a toast
```

## Enforcement

**All agents MUST:**
- Use custom hooks (`useTasks`, `useBoardAPI`, etc.) — never raw `useContext`
- Discriminated union for every async state — never `loading: boolean + data + error`
- Action types in `SCREAMING_SNAKE_CASE` with `NOUN_VERB` order
- Co-locate tests with components (`ComponentName.test.tsx`)
- `string` IDs via `nanoid()` — never number IDs
- ISO 8601 for all dates — never `Date` objects or timestamps
- Follow optimistic update sequence exactly as defined

**Anti-patterns that break the architecture:**
- Importing `dispatch` directly — use `useBoardAPI()`
- Pushing `OP_ROLLBACK` or `REMOTE_UPDATE` to the history stack
- Adding state to `BoardStateContext` that belongs in `PendingOpsContext` or `ConflictContext`
- Barrel `index.ts` exports in feature folders
- Wrapping context values in objects: `value={{ tasks }}` instead of `value={tasks}`
