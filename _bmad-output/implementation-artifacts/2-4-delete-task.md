# Story 2.4: Delete Task

Status: review

## Blocker

**Do NOT start implementation until ALL Epic 1 stories (1.1 → 1.2 → 1.3 → 1.4) are marked `done` AND Stories 2.1, 2.2, and 2.3 are `done`.**
This story adds a delete action inside the task detail modal built in 2.3. It depends on `useBoardAPI().deleteTask()` (1.2), `src/api/tasks.ts deleteTask()` (1.3), `TaskModal` in edit mode (2.3), `ToastProvider` (1.3), and `BoardColumn` column count badge (1.4).

---

## Story

As a user,
I want to delete a task from the board,
so that I can remove completed or irrelevant work items.

## Acceptance Criteria

1. **Given** the task detail modal is open **When** the user clicks the "Delete" action button **Then** `useBoardAPI().deleteTask(taskId)` is called: it generates a `nanoid()` opId, records a full task snapshot in `pendingOps`, dispatches `TASK_DELETE` to remove the task immediately from `tasks[]`, and fires `deleteTask()` from `src/api/tasks.ts`.

2. **Given** the `TASK_DELETE` is dispatched **When** the reducer processes it **Then** the task is removed from `tasks[]` immediately **And** the `pendingOps` entry is created with the full task snapshot **And** the modal closes immediately.

3. **Given** `mockRequest()` resolves successfully (~90%) **When** `OP_SUCCESS` is dispatched with the matching opId **Then** the task remains deleted **And** the `pendingOps` entry for that opId is cleared **And** no toast is shown.

4. **Given** `mockRequest()` throws `MockApiError` (~10%) **When** `OP_ROLLBACK` is dispatched with the matching opId **Then** the task is restored to its original column from the `pendingOps` snapshot **And** `toast.error('Delete failed — "[task title]" has been restored')` is shown.

5. **Given** a task is deleted **When** the deletion is executed **Then** the task no longer appears in any column **And** the column task count badge updates immediately (reactive to `tasks[]` length in that status bucket).

6. **Given** a column that had one task **When** that task is deleted **Then** the column empty state (UX-DR14) is shown: `inbox` Lucide icon, "No tasks", "Drag a task here or add one", "Add task" ghost dashed button.

7. **Given** the delete operation is in-flight **When** the task has been removed from the board but OP_SUCCESS/OP_ROLLBACK has not yet arrived **Then** no loading indicator is shown on the deleted task (it is not on the board) **And** no ghost card is shown in its place.

8. **Given** the task's deletion is rolled back (OP_ROLLBACK) **When** the card is restored **Then** it re-appears in its original column in its original position **And** the `cardPulse` in-flight animation plays briefly then stops once OP_ROLLBACK completes.

## Tasks / Subtasks

- [x] Task 1: Add "Delete" button to `TaskModal.tsx` in edit mode (AC: #1, #2)
  - [x] Add a "Delete" button with destructive styling (`variant="destructive"` from shadcn `Button`, `rose-600` fill, white text)
  - [x] Button placement: left side of modal footer (separated from "Save" / "Cancel" on the right)
  - [x] On click: call `handleDelete()` — see Task 2
  - [x] After calling delete: close modal immediately (do not wait for API)
  - [x] Do NOT add a second confirmation dialog — the delete is immediate with undo-via-rollback UX

- [x] Task 2: Implement `deleteTask` through `useBoardAPI()` (AC: #1, #2, #3, #4)
  - [x] Verify `BoardAPIContext.deleteTask()` is implemented (from Story 1.2); it should: `opId = nanoid()`, dispatch `TASK_DELETE { taskId, opId }`, call `deleteTask(taskId)` from `src/api/tasks.ts`
  - [x] Verify `boardReducer` handles `TASK_DELETE`: removes task from `tasks[]`, records `pendingOps` snapshot
  - [x] Verify `boardReducer` handles `OP_SUCCESS` for delete: clears `pendingOps[opId]`
  - [x] Verify `boardReducer` handles `OP_ROLLBACK` for delete: restores task from `pendingOps[opId].snapshot` into `tasks[]`, clears `pendingOps[opId]`
  - [x] In `BoardAPIContext.deleteTask()`: catch `MockApiError`, dispatch `OP_ROLLBACK`, show `toast.error(...)`

- [x] Task 3: Implement `deleteTask` in `src/api/tasks.ts` (AC: #1)
  - [x] Verify the function is implemented (not just `export {}` stub from 1.3): `return mockRequest<void>(() => {})`
  - [x] If stub only, implement it now

- [x] Task 4: Verify column count badge and empty state reactivity (AC: #5, #6)
  - [x] Confirm `BoardColumn` computes task count from `useTasks()` filtered by `status` — must be derived, not cached
  - [x] Confirm empty state renders when filtered tasks array is empty after delete
  - [x] Run a manual test: delete the last task in a column → verify empty state appears and count badge updates to 0

- [x] Task 5: Write tests (AC: all)
  - [x] `TaskModal.test.tsx`: test Delete button renders in edit mode, click calls `boardAPI.deleteTask`, modal closes on delete
  - [x] Reducer unit test: `TASK_DELETE` removes task + records pendingOps; `OP_ROLLBACK` restores from snapshot; `OP_SUCCESS` clears pendingOps
  - [x] `BoardColumn.test.tsx` or integration test: empty state shows after last task in column is deleted

## Dev Notes

### Critical Architecture Constraints

**FORBIDDEN patterns:**
- Any `any` type
- Barrel `index.ts` exports
- Calling `src/api/tasks.ts` directly from components — route through `useBoardAPI()` only
- Using a confirmation dialog for delete — the architecture uses optimistic delete + rollback toast (no "Are you sure?" modal)

### TASK_DELETE Reducer Cases

```typescript
// boardReducer.ts — verify all three cases are implemented:

case 'TASK_DELETE': {
  const snapshot = state.tasks.find(t => t.id === action.taskId)
  if (!snapshot) return state // guard: task already gone
  return {
    ...state,
    tasks: state.tasks.filter(t => t.id !== action.taskId),
    pendingOps: new Map(state.pendingOps).set(action.opId, {
      id: action.opId,
      taskId: action.taskId,
      snapshot,
    }),
  }
}

case 'OP_SUCCESS': {
  const next = new Map(state.pendingOps)
  next.delete(action.opId)
  return { ...state, pendingOps: next }
}

case 'OP_ROLLBACK': {
  const op = state.pendingOps.get(action.opId)
  if (!op) return state
  const next = new Map(state.pendingOps)
  next.delete(action.opId)
  return {
    ...state,
    tasks: [...state.tasks, op.snapshot], // restore task
    pendingOps: next,
  }
}
```

Note: `OP_SUCCESS` and `OP_ROLLBACK` are shared across create/update/delete — one handler each covers all mutation types. The `pendingOps` snapshot is the discriminator.

### Optimistic Delete Sequence

```
1. User clicks "Delete" in modal
2. modal.close() immediately
3. BoardAPI.deleteTask(taskId)
   a. opId = nanoid()
   b. dispatch TASK_DELETE { taskId, opId }
      → task removed from tasks[] immediately
      → snapshot stored in pendingOps[opId]
   c. await deleteTask(taskId) via src/api/tasks.ts
4a. OP_SUCCESS → pendingOps[opId] cleared → done
4b. MockApiError → OP_ROLLBACK → task restored from snapshot → toast.error(...)
```

### deleteTask in BoardAPIContext

```typescript
// src/store/BoardAPIContext.tsx
// Already defined in Story 1.2 — verify implementation:
deleteTask: async (taskId: string) => {
  const opId = nanoid()
  dispatch({ type: 'TASK_DELETE', taskId, opId })
  try {
    await apiDeleteTask(taskId) // imported from src/api/tasks.ts as apiDeleteTask
    dispatch({ type: 'OP_SUCCESS', opId })
  } catch (e) {
    dispatch({ type: 'OP_ROLLBACK', opId })
    const task = getSnapshot(opId) // read from pendingOps before dispatch clears it
    toast.error(`Delete failed — "${task?.title ?? 'Task'}" has been restored`)
  }
}
```

**Important:** `toast.error(...)` must fire AFTER `OP_ROLLBACK` is dispatched, so the task is already back on the board when the user reads the toast.

### deleteTask in src/api/tasks.ts

```typescript
export async function deleteTask(id: string): Promise<void> {
  return mockRequest<void>(() => {})
}
```

### Toast Message

```typescript
toast.error(`Delete failed — "${task.title}" has been restored`)
```

This is a **persistent** toast (error tier, manual dismiss only per UX-DR5). Do not use `toast.success` or `toast.info` for delete.

### Column Count Badge Derivation

The column count must be derived from live state, not cached:

```typescript
// In BoardColumn.tsx:
const allTasks = useTasks() // Task[]
const columnTasks = allTasks.filter(t => t.status === status)
// columnTasks.length is the count displayed in the badge
```

This ensures the badge updates to 0 immediately on TASK_DELETE without any additional wiring.

### Delete Button Placement in Modal Footer

```tsx
<DialogFooter className="flex justify-between">
  {/* Left: destructive action */}
  <Button variant="destructive" onClick={handleDelete}>Delete</Button>

  {/* Right: primary actions */}
  <div className="flex gap-2">
    <Button variant="ghost" onClick={close}>Cancel</Button>
    <Button type="submit">Save</Button>
  </div>
</DialogFooter>
```

This visually separates the destructive action from safe actions — consistent with UX destructive button placement patterns.

### Rollback Restoration Position

When a task is restored via OP_ROLLBACK, the `[...state.tasks, op.snapshot]` append puts it at the END of the tasks array, meaning it appears at the bottom of its column. This is acceptable for MVP — position restoration is a UX enhancement beyond this epic's scope.

### File Paths

```
src/features/tasks/components/TaskModal.tsx       ← add Delete button in edit mode
src/features/tasks/components/TaskModal.test.tsx  ← test Delete button
src/store/boardReducer.ts                         ← verify TASK_DELETE/OP_SUCCESS/OP_ROLLBACK cases
src/store/BoardAPIContext.tsx                     ← verify deleteTask action creator
src/api/tasks.ts                                  ← verify deleteTask API function
src/features/board/components/BoardColumn.tsx     ← verify count badge derivation + empty state reactivity
```

### Verification Checklist

After implementing, manually verify:
```
1. Delete a task → it disappears from board immediately, modal closes
2. ~10% of the time (run 10–15 deletes) → task reappears with error toast
3. Delete the last task in a column → empty state (inbox icon + "No tasks") appears
4. Column count badge updates from N to N-1 immediately on delete
5. TypeScript: tsc --noEmit → zero errors
```

### References

- Optimistic delete flow: [Source: epics.md#Story 2.4 Acceptance Criteria]
- Toast vocabulary (error tier, persistent): [Source: ux-design-specification.md#UX-DR5]
- OP_ROLLBACK must not be pushed to history stack: [Source: architecture.md#Optimistic Update Sequence]
- Empty state spec: [Source: ux-design-specification.md#UX-DR14]
- BoardAPIContext.deleteTask signature: [Source: architecture.md#useBoardAPI Hook Interface]
- TASK_DELETE action shape: [Source: architecture.md#boardReducer actions]
- PendingOperation type: [Source: architecture.md#boardReducer state shape]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- boardReducer OP_ROLLBACK was buggy for delete (restored tasks via filter instead of append). Fixed by adding opType to PendingOperation and branching on opType in OP_ROLLBACK.
- BoardAPIContext.deleteTask now dispatches TASK_DELETE optimistically, calls apiDeleteTask, dispatches OP_SUCCESS or OP_ROLLBACK + re-throws for caller toast handling
- deleteTask in src/api/tasks.ts was already implemented correctly (mockRequest<void>)

### Completion Notes List

- Delete button: variant="destructive", left side of modal footer, calls handleDelete() which closes modal then awaits boardAPI.deleteTask
- boardReducer: TASK_DELETE removes from tasks[], records pendingOps snapshot with opType=delete; OP_ROLLBACK appends snapshot back to tasks[]; OP_SUCCESS clears pendingOps entry
- BoardColumn: count badge and empty state derived reactively from useTasks() filtered by status — updates immediately on delete
- 9 reducer unit tests for TASK_DELETE/OP_ROLLBACK/OP_SUCCESS/TASK_CREATE rollback/TASK_UPDATE rollback added in boardReducer.test.ts
- 66 total tests passing

### File List

- src/features/tasks/components/TaskModal.tsx (Delete button, handleDelete)
- src/features/tasks/components/TaskModal.test.tsx (delete tests)
- src/store/boardReducer.ts (TASK_DELETE + OP_ROLLBACK fixes)
- src/store/boardReducer.test.ts (reducer unit tests — created)
- src/store/BoardAPIContext.tsx (async deleteTask)
- src/api/tasks.ts (deleteTask verified)
- src/features/board/components/BoardColumn.tsx (count badge reactivity verified)
- src/types/common.types.ts (opType field added)

## Change Log

- 2026-04-24: Implemented Story 2.4 — Delete Task. Fixed OP_ROLLBACK for create/delete cases. 66 tests passing, 0 TypeScript errors.
