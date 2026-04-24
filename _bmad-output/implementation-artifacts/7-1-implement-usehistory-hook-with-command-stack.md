# Story 7.1: Implement useHistory Hook with Command Stack

Status: ready-for-dev

## Blocker

Stories 2.2, 2.3, 2.4, 3.1, 3.2 must be done (all CRUD + DnD mutations through BoardAPIContext established).

---

## Story

As a user of the Kanban board,
I want every task action I perform to be tracked in an undo/redo history stack,
so that I can reverse mistakes and re-apply changes with predictable, transparent behavior even when API calls fail.

## Acceptance Criteria

1. **Given** the user creates a task **When** the create completes optimistically **Then** a history entry labelled `Create task "[title]"` is pushed to the stack.
2. **Given** the user deletes a task **When** the delete completes optimistically **Then** a history entry labelled `Delete task "[title]"` is pushed to the stack.
3. **Given** the user edits a task **When** the update completes optimistically **Then** a history entry labelled `Update task "[title]"` is pushed to the stack.
4. **Given** the user drags or status-selects a task to a new column **When** the move completes optimistically **Then** a history entry labelled `Move "[title]" to [Column Name]` is pushed to the stack.
5. **Given** there is at least one history entry **When** undo() is called **Then** `HISTORY_APPLY` is dispatched with the inverse action and `cursor` moves back by one.
6. **Given** the cursor is not at the end of the stack **When** redo() is called **Then** `HISTORY_APPLY` is dispatched with the forward action and `cursor` moves forward by one.
7. **Given** the user performs an undo and then creates a new task **When** the new action is pushed **Then** all redo entries (entries after the current cursor) are cleared.
8. **Given** the stack already contains 50 entries **When** a 51st action is pushed **Then** the oldest entry is evicted and the stack stays at 50.
9. **Given** an API call fails and `OP_ROLLBACK` fires **When** the user hits undo **Then** the undo still works as if the action succeeded (history stack is untouched by rollback).
10. **Given** `REMOTE_UPDATE` fires from the realtime simulation **When** the update lands **Then** the history stack is not modified.
11. **Given** `canUndo` is false **When** `undo()` is called **Then** nothing happens (no dispatch, no state change).
12. **Given** `canRedo` is false **When** `redo()` is called **Then** nothing happens.
13. **Given** any history state **When** `useHistory()` is called **Then** `{ undoLabel, redoLabel, canUndo, canRedo, undo, redo }` are all returned with correct values.

## Tasks / Subtasks

- [ ] Task 1: Define HistoryEntry and UserAction types in `src/types/history.types.ts` (AC: #1–#4)
  - [ ] Export `UserAction` as the union of the 4 board action types that enter the history stack: `TASK_MOVE | TASK_CREATE | TASK_UPDATE | TASK_DELETE` (each with their exact fields from `boardReducer.ts`)
  - [ ] Export `HistoryEntry = { id: string; label: string; forward: UserAction; inverse: UserAction }`
  - [ ] Use `import type` for all type-only imports; zero `any`

- [ ] Task 2: Implement `useHistory` hook in `src/features/history/hooks/useHistory.ts` (AC: #1–#13)
  - [ ] Maintain local state: `stack: HistoryEntry[]` (capped 50) and `cursor: number` (starts at -1)
  - [ ] Expose `push(entry: HistoryEntry): void` — slices off redo tail, appends, caps at 50, advances cursor
  - [ ] Implement `undo()` — guard `canUndo`, read `stack[cursor]`, decrement cursor, dispatch `HISTORY_APPLY` with `entry.inverse`
  - [ ] Implement `redo()` — guard `canRedo`, read `stack[cursor + 1]`, increment cursor, dispatch `HISTORY_APPLY` with `entry.forward`
  - [ ] Derive `canUndo = cursor >= 0`, `canRedo = cursor < stack.length - 1`
  - [ ] Derive `undoLabel = canUndo ? stack[cursor]?.label ?? null : null`, `redoLabel = canRedo ? stack[cursor + 1]?.label ?? null : null`
  - [ ] Accept `dispatch: React.Dispatch<BoardAction>` and `tasks: Task[]` as arguments (passed from HistoryProvider)
  - [ ] Expose wrapped mutations: `moveTask`, `createTask`, `updateTask`, `deleteTask` — each builds a `HistoryEntry` then calls the underlying `boardAPI` method

- [ ] Task 3: Implement inverse action computation for each mutation (AC: #1–#4, #9)
  - [ ] `createTask`: forward = `{ type: 'TASK_CREATE', task: newTask, opId }`, inverse = `{ type: 'TASK_DELETE', taskId: newTask.id, opId: nanoid() }`
  - [ ] `deleteTask`: look up current task snapshot from `tasks` state BEFORE dispatching; forward = `{ type: 'TASK_DELETE', taskId, opId }`, inverse = `{ type: 'TASK_CREATE', task: snapshot, opId: nanoid() }`
  - [ ] `updateTask`: capture original field values for each dirty key from current task in `tasks` BEFORE dispatch; forward = `{ type: 'TASK_UPDATE', taskId, changes, opId }`, inverse = `{ type: 'TASK_UPDATE', taskId, changes: originalValues, opId: nanoid() }`
  - [ ] `moveTask`: capture current status from `tasks` BEFORE dispatch; forward = `{ type: 'TASK_MOVE', taskId, newStatus, opId }`, inverse = `{ type: 'TASK_MOVE', taskId, newStatus: originalStatus, opId: nanoid() }`
  - [ ] All inverse `opId` values must be fresh `nanoid()` calls — never reuse the forward `opId`

- [ ] Task 4: Implement label generation (AC: #1–#4)
  - [ ] `TASK_CREATE` → `Create task "${title}"`
  - [ ] `TASK_DELETE` → `Delete task "${title}"`
  - [ ] `TASK_UPDATE` → `Update task "${title}"`
  - [ ] `TASK_MOVE` → `Move "${title}" to ${columnTitle}` where `columnTitle` is derived from `newStatus`: `todo → 'Todo'`, `in-progress → 'In Progress'`, `done → 'Done'`

- [ ] Task 5: Replace HistoryContext stub in `src/store/HistoryContext.tsx` with full implementation (AC: #5–#13)
  - [ ] Update `HistoryContextType` to add `undo: () => void` and `redo: () => void` to existing fields
  - [ ] `HistoryProvider` must accept `dispatch: React.Dispatch<BoardAction>` and `tasks: Task[]` props, then call `useHistory(dispatch, tasks)` internally
  - [ ] Provide `{ undoLabel, redoLabel, canUndo, canRedo, undo, redo }` as the context value
  - [ ] Export `useHistory()` hook that calls `useContext(HistoryContext)` — consumers get the full type

- [ ] Task 6: Wire HistoryProvider in `src/store/AppProvider.tsx` (AC: #5–#13)
  - [ ] Pass `boardDispatch` and `boardState.tasks` as props to `HistoryProvider`
  - [ ] Confirm nesting order unchanged: `BoardStateContext → PendingOpsContext → ConflictContext → BoardAPIProvider → FilterProvider → FilterAPIProvider → HistoryProvider → children`

- [ ] Task 7: Update all call sites to route user mutations through `useHistory()` instead of `useBoardAPI()` directly (AC: #1–#4)
  - [ ] `src/features/tasks/components/TaskModal.tsx`: replace `boardAPI.createTask`, `boardAPI.updateTask`, `boardAPI.deleteTask` with `history.createTask`, `history.updateTask`, `history.deleteTask`
  - [ ] `src/features/board/hooks/useBoardDnd.ts`: replace `boardAPI.moveTask` with `history.moveTask`
  - [ ] `src/features/tasks/components/TaskModal.tsx` status select path (Story 3.2): replace `boardAPI.moveTask` with `history.moveTask`
  - [ ] Confirm that `useBoardAPI()` is no longer called in any component — it is used internally by `useHistory` hook only

- [ ] Task 8: Write unit tests in `src/features/history/hooks/useHistory.test.ts` (AC: #1–#13)
  - [ ] Test: pushing a TASK_CREATE entry advances cursor and sets `canUndo = true`
  - [ ] Test: pushing 51 entries caps stack at 50 (oldest evicted, cursor stays at 49)
  - [ ] Test: undo decrements cursor and dispatches `HISTORY_APPLY` with inverse action
  - [ ] Test: redo after undo increments cursor and dispatches `HISTORY_APPLY` with forward action
  - [ ] Test: new push after undo clears redo entries
  - [ ] Test: `canUndo = false` when cursor = -1; `canRedo = false` when cursor = stack.length - 1
  - [ ] Test: `undoLabel` and `redoLabel` reflect the correct stack entries
  - [ ] Test: calling `undo()` when `canUndo = false` is a no-op (dispatch not called)
  - [ ] Test: calling `redo()` when `canRedo = false` is a no-op (dispatch not called)

---

## Dev Notes

### Architecture: Where History Lives

The history stack is local `useState` inside `HistoryProvider` — it is NOT in `boardReducer` and NOT in `BoardState`. This is intentional: history is a UI concern, not domain state, and keeping it outside the reducer avoids complexity in `HISTORY_APPLY` cases.

`HistoryProvider` owns the stack and wraps the mutations. Components call `useHistory()` to get both the read state (`canUndo`, labels) AND the write interface (`moveTask`, `createTask`, etc.). `useBoardAPI()` is no longer called directly by components after this story.

### Stack Mechanics

```typescript
// Internal to HistoryProvider / useHistory
const [stack, setStack] = useState<HistoryEntry[]>([])
const [cursor, setCursor] = useState(-1)

// Derived
const canUndo = cursor >= 0
const canRedo = cursor < stack.length - 1
const undoLabel = canUndo ? (stack[cursor]?.label ?? null) : null
const redoLabel = canRedo ? (stack[cursor + 1]?.label ?? null) : null

function push(entry: HistoryEntry): void {
  setStack(prev => {
    const withoutRedo = prev.slice(0, cursor + 1) // clear redo tail
    const appended = [...withoutRedo, entry]
    return appended.slice(-50) // enforce 50-entry cap
  })
  setCursor(prev => {
    const newLen = Math.min(cursor + 2, 50) // after truncation + append
    return newLen - 1
  })
}

function undo(): void {
  if (!canUndo) return
  const entry = stack[cursor]
  if (!entry) return
  setCursor(prev => prev - 1)
  dispatch({ type: 'HISTORY_APPLY', action: entry.inverse, inverse: entry.forward })
}

function redo(): void {
  if (!canRedo) return
  const entry = stack[cursor + 1]
  if (!entry) return
  setCursor(prev => prev + 1)
  dispatch({ type: 'HISTORY_APPLY', action: entry.forward, inverse: entry.inverse })
}
```

Note: `noUncheckedIndexedAccess` is enabled — `stack[cursor]` is `HistoryEntry | undefined`. Always guard with `if (!entry) return` before using.

### Cursor Bookkeeping After Cap

When the stack is at capacity (50 entries) and a new entry is pushed, `prev.slice(0, cursor + 1)` removes the redo tail (if any), then `[...withoutRedo, entry].slice(-50)` evicts the oldest. The cursor calculation must account for this eviction:

```typescript
setCursor(prev => {
  const withoutRedoLength = Math.min(prev + 1, prev + 1) // = cursor + 1 entries kept
  const newLength = Math.min(withoutRedoLength + 1, 50)
  return newLength - 1
})
```

Simpler: since after `push` the cursor is always at the last element of the new stack, and the new stack length is `Math.min(cursor + 2, 50)`, set `cursor = Math.min(cursor + 1, 49)`.

### Inverse Action Computation

Snapshot capture MUST happen before any dispatch. By the time `boardReducer` processes the optimistic action, the snapshot is gone from `tasks`. The `useHistory` hook receives `tasks: Task[]` as a parameter so it can read the current snapshot synchronously before calling `boardAPI`.

```typescript
// moveTask example
async function moveTask(taskId: string, newStatus: TaskStatus): Promise<void> {
  const original = tasks.find(t => t.id === taskId)
  if (!original) return
  const opId = nanoid()
  const inverseOpId = nanoid()
  const entry: HistoryEntry = {
    id: nanoid(),
    label: `Move "${original.title}" to ${STATUS_LABELS[newStatus]}`,
    forward: { type: 'TASK_MOVE', taskId, newStatus, opId },
    inverse: { type: 'TASK_MOVE', taskId, newStatus: original.status, opId: inverseOpId },
  }
  push(entry)
  await boardAPI.moveTask(taskId, newStatus) // underlying boardAPI still handles optimistic dispatch + API call
}
```

`boardAPI.moveTask` (in `BoardAPIContext`) still dispatches the optimistic `TASK_MOVE` action and handles `OP_SUCCESS`/`OP_ROLLBACK`. The `useHistory` wrapper only prepends the stack bookkeeping.

### STATUS_LABELS Map

```typescript
const STATUS_LABELS: Record<TaskStatus, string> = {
  'todo': 'Todo',
  'in-progress': 'In Progress',
  'done': 'Done',
}
```

### OP_ROLLBACK Transparency

When an API call fails, `boardAPI` dispatches `OP_ROLLBACK`, which restores the task snapshot in `boardReducer`. The `useHistory` stack already has the `TASK_MOVE` entry at this point. The user can still press undo — it will dispatch `HISTORY_APPLY` with `inverse`, which calls `boardReducer` again (moving the task back to its original status). Since `OP_ROLLBACK` already restored the original status, the undo is effectively a no-op on the visible state, but this is acceptable and correct behavior. No special handling needed.

### HistoryContext Type Update

The existing stub in `src/store/HistoryContext.tsx` must be replaced. The full type:

```typescript
export type HistoryContextType = {
  undoLabel: string | null
  redoLabel: string | null
  canUndo: boolean
  canRedo: boolean
  undo: () => void
  redo: () => void
  // Wrapped mutations — components call these instead of useBoardAPI()
  moveTask: (taskId: string, newStatus: TaskStatus) => Promise<void>
  createTask: (task: Omit<Task, 'id' | 'createdAt'>) => Promise<void>
  updateTask: (taskId: string, changes: Partial<Omit<Task, 'id' | 'createdAt'>>) => Promise<void>
  deleteTask: (taskId: string) => Promise<void>
}
```

The default context value for a stub/missing provider should still throw — mirror the `BoardAPIContext` pattern (default `null`, hook throws).

### HISTORY_APPLY Reducer Signature

The current `boardReducer.ts` defines `HISTORY_APPLY` as:
```typescript
| { type: 'HISTORY_APPLY'; action: BoardAction; inverse: BoardAction }
```
The `inverse` field is present but the reducer only uses `action`. This is fine — the reducer case simply re-dispatches `action.action`. No changes to `boardReducer.ts` are required.

### File Paths

- `src/types/history.types.ts` — new file; `UserAction` and `HistoryEntry` types
- `src/features/history/hooks/useHistory.ts` — new file; main hook logic
- `src/features/history/hooks/useHistory.test.ts` — new file; unit tests
- `src/store/HistoryContext.tsx` — replace stub with full implementation
- `src/store/AppProvider.tsx` — pass `boardDispatch` and `boardState.tasks` to `HistoryProvider`
- `src/features/tasks/components/TaskModal.tsx` — swap `useBoardAPI` calls for `useHistory` calls
- `src/features/board/hooks/useBoardDnd.ts` — swap `boardAPI.moveTask` for `history.moveTask`

### Forbidden Patterns

- Never push `OP_ROLLBACK`, `OP_SUCCESS`, `REMOTE_UPDATE`, `CONFLICT_*`, or `HISTORY_APPLY` to the history stack
- Never dispatch `HISTORY_APPLY` from a component — only `useHistory` hook calls it
- Never reuse the same `opId` for the forward and inverse actions — each gets its own `nanoid()`
- Never use `array[cursor]` without a `noUncheckedIndexedAccess`-safe guard (type is `T | undefined`)
- Never capture the task snapshot AFTER calling `boardAPI` — snapshot must be captured from `tasks` BEFORE any dispatch
- No barrel `index.ts`; import directly from file paths
- No `any` — use explicit `UserAction` union type

### Verification Checklist

- [ ] `npm run build` exits zero (no TypeScript errors)
- [ ] `npm run lint` exits zero (no ESLint warnings)
- [ ] `npm test` shows all previous 100 tests passing + new history tests
- [ ] Creating a task → undo removes it from the board
- [ ] Deleting a task → undo restores it on the board
- [ ] Moving a task → undo moves it back to original column
- [ ] Editing a task → undo reverts changed fields
- [ ] Undo after undo continues walking back through the stack
- [ ] Redo re-applies the action
- [ ] New action after undo clears redo (redo button becomes disabled)
- [ ] 51 creates → stack length stays 50
- [ ] API failure on move → OP_ROLLBACK fires → undo still available in UndoHintBar

---

## Dev Agent Record

### Agent Model Used
_TBD_

### Debug Log References
_None_

### Completion Notes List
_TBD_

### File List
_TBD_

### Change Log
_TBD_

### Review Findings
_TBD_
