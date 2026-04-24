# Story 5.1: Implement Optimistic Update Sequence with Automatic Rollback

Status: ready-for-dev

## Blocker

None — ready to implement.

---

## Story

As a user,
I want task changes to appear instantly on screen and automatically undo themselves when the API fails,
so that the board always feels responsive and I'm never left with stale or incorrect data.

## Acceptance Criteria

1. **Given** any CRUD or move operation **When** the user submits **Then** the board reflects the change within one animation frame (≤16ms) — before `mockRequest` resolves.
2. **Given** a `TASK_CREATE` that fails **When** `OP_ROLLBACK` fires **Then** the task card is removed from the board AND the create modal re-opens pre-filled with the form values the user had typed.
3. **Given** any failing operation **When** `OP_ROLLBACK` fires **Then** the reducer restores the exact snapshot recorded at dispatch time, isolated by `opId`.
4. **Given** two concurrent mutations on different tasks **When** the second API call fails **Then** only the second task reverts; the first task is unaffected.
5. **Given** two concurrent mutations on the **same** task **When** the second API call fails **Then** only the second mutation's snapshot is restored — not the original pre-first-mutation snapshot.
6. **Given** any `OP_ROLLBACK` **When** it fires **Then** the history stack is not modified (rollback is transparent to undo/redo).
7. **Given** all 4 operations (createTask, updateTask, deleteTask, moveTask) in `BoardAPIContext` **When** audited **Then** each follows the exact 5-step sequence: `opId = nanoid()` → dispatch user action (snapshot recorded inside reducer) → optimistic update appears → `await api/tasks.ts` call → `OP_SUCCESS` or (`OP_ROLLBACK` + re-throw).

## Tasks / Subtasks

- [ ] Task 1: Audit optimistic sequence correctness in `BoardAPIContext.tsx` (AC: #1, #7)
  - [ ] Verify `opId = nanoid()` is called synchronously BEFORE the dispatch for all 4 operations
  - [ ] Verify all 4 operations dispatch the user action (TASK_MOVE / TASK_CREATE / TASK_UPDATE / TASK_DELETE) synchronously before any `await`
  - [ ] Verify `OP_SUCCESS` is dispatched in the `try` block after successful API call for all 4 operations
  - [ ] Verify `OP_ROLLBACK` is dispatched in the `catch` block and the error is re-thrown for all 4 operations
  - [ ] Confirm no `await` appears before the user-action dispatch in any operation

- [ ] Task 2: Audit `boardReducer.ts` for concurrent mutation isolation by `opId` (AC: #3, #4, #5)
  - [ ] Verify `OP_ROLLBACK` uses `pendingOps.get(action.opId)` and targets only the matching operation's snapshot
  - [ ] Verify `OP_SUCCESS` uses `pendingOps.delete(action.opId)` — does not touch other pending ops
  - [ ] Verify the `Map` is always reconstructed (`new Map(state.pendingOps)`) before `.set()` or `.delete()` — never mutated in place
  - [ ] Write or extend reducer unit tests in `src/store/boardReducer.test.ts` covering:
    - Two concurrent TASK_MOVE ops: rolling back opId-2 leaves opId-1's pending entry intact
    - Two concurrent TASK_UPDATE ops on the same task: rolling back opId-2 restores opId-2's snapshot (not the original pre-opId-1 state)
    - OP_SUCCESS for opId-1 does not affect opId-2's pending entry

- [ ] Task 3: Implement create-rollback modal re-open in `TaskModal.tsx` (AC: #2)
  - [ ] Verify `onSubmit` in `TaskModal.tsx` already captures `savedValues = { ...data }` BEFORE calling `onClose()`
  - [ ] Verify `onSubmit` already calls `onOpenCreate(savedValues)` in the `catch` block for `mode === 'create'`
  - [ ] Verify `useTaskModal.openCreate(prefill?)` stores `prefillValues` and sets `isOpen = true` — re-opening with the saved form values
  - [ ] Verify the `useEffect` in `TaskModal.tsx` that calls `reset({ ...DEFAULT_VALUES, ...prefillValues })` fires when `isOpen && mode === 'create'`, repopulating the form with the previously-entered data
  - [ ] Add an integration-level test in `TaskModal.test.tsx`: submit a create form → mock API failure → assert the modal re-opens with prefilled title

- [ ] Task 4: Add unmount guard to `handleStatusChange` in `TaskModal.tsx` (deferred item from Story 3.2) (AC: #7)
  - [ ] Add `isMountedRef = useRef(true)` initialized to `true`; set to `false` in a cleanup `useEffect` (`return () => { isMountedRef.current = false }`)
  - [ ] Wrap the `catch` block's `toast.error(...)` call in `handleStatusChange` with `if (isMountedRef.current)`
  - [ ] Add unmount guard to `handleDelete` in the same way

- [ ] Task 5: Add unmount guard to `handleDragEnd` in `useBoardDnd.ts` (deferred item from Story 3.1) (AC: #7)
  - [ ] Add `isMountedRef = useRef(true)` with cleanup effect in `useBoardDnd.ts`
  - [ ] Wrap the `catch` block's `toast.error(...)` call in `handleDragEnd` with `if (isMountedRef.current)`

- [ ] Task 6: Write / update tests (AC: all)
  - [ ] Extend `boardReducer.test.ts` with concurrent-op isolation tests (see Task 2)
  - [ ] Add `TaskModal.test.tsx` test for create-rollback re-open path (see Task 3)
  - [ ] Verify total passing test count increases (target ≥ 106 from current 100)

---

## Dev Notes

### Optimistic Sequence (5-Step Contract)

Every mutation in `BoardAPIContext.tsx` MUST follow this exact sequence. No deviation:

```ts
// Step 1 — generate opId synchronously
const opId = nanoid()

// Step 2 — dispatch user action (reducer records snapshot + adds to pendingOps atomically)
dispatch({ type: 'TASK_MOVE', taskId, newStatus, opId })

// Step 3 — optimistic update is already live (dispatch is synchronous)

// Step 4 — call API layer (background async)
try {
  await apiMoveTask(taskId, newStatus)
  // Step 5a — success: remove pending entry
  dispatch({ type: 'OP_SUCCESS', opId })
} catch (e) {
  // Step 5b — failure: restore snapshot, surface error upstream
  dispatch({ type: 'OP_ROLLBACK', opId })
  throw e   // re-throw so callers can show toast
}
```

The snapshot is captured INSIDE the reducer in the `TASK_MOVE` / `TASK_UPDATE` / `TASK_DELETE` cases (via `state.tasks.find()`). For `TASK_CREATE` the snapshot field is the new task itself (used by rollback to identify which task to remove). This is already implemented correctly in `boardReducer.ts` — the audit verifies it stays that way.

### Create-Rollback Re-Open Flow

The create-rollback path spans three files:

1. `TaskModal.tsx` — `onSubmit` captures `savedValues` before `onClose()`, calls `onOpenCreate(savedValues)` in the catch block.
2. `useTaskModal.ts` — `openCreate(prefill?)` stores `prefill` in `prefillValues` state and sets `isOpen = true`.
3. `TaskModal.tsx` — the `useEffect([isOpen, mode, prefillValues, reset])` calls `reset({ ...DEFAULT_VALUES, ...prefillValues })` when `isOpen && mode === 'create'`, restoring the previously-entered form values.

This chain is already present in the code from Story 2.2. This story's Task 3 audits and tests it end-to-end.

### Concurrent Mutation Isolation

The `pendingOps` Map is keyed by `opId` (not by `taskId`). Two concurrent mutations on the same task produce two separate Map entries. Rolling back `opId-2` looks up only `opId-2`'s snapshot and restores only that delta — `opId-1`'s entry remains. This means rollback is purely additive/subtractive on the snapshot for that specific op, which is correct for independent concurrent mutations.

The edge case to test: if `opId-1` and `opId-2` both update the same task, `opId-2`'s snapshot is the post-opId-1 state (because the reducer applies opId-1 first, then opId-2 snapshots that result). Rolling back opId-2 restores the post-opId-1 state — which is correct behavior.

### Unmount Guard Pattern

```ts
// In useBoardDnd.ts (hook)
const isMountedRef = useRef(true)
useEffect(() => {
  return () => { isMountedRef.current = false }
}, [])

// In handleDragEnd catch block
} catch {
  if (isMountedRef.current) {
    toast.error(`Move failed — "${draggedTask.title}" has been reverted`)
  }
}
```

In `TaskModal.tsx` (component), use the same `useRef(true)` + cleanup effect pattern, applied to `handleStatusChange` and `handleDelete` catch blocks.

### boardReducer OP_ROLLBACK — opType Branching

The `OP_ROLLBACK` case in `boardReducer.ts` branches on `op.opType`:
- `'create'` → filter the task out (task never existed on the server)
- `'delete'` → append the snapshot back to the end of tasks[]
- `'move'` / `'update'` → replace the task with its snapshot via map

This is already correct. The concurrent-op tests must confirm each opType branch works independently when multiple pendingOps entries exist simultaneously.

### File Paths

```
src/store/BoardAPIContext.tsx           — audit optimistic sequence (Tasks 1, no changes expected)
src/store/boardReducer.ts               — audit OP_ROLLBACK isolation (Task 2, no changes expected)
src/store/boardReducer.test.ts          — add concurrent-op tests (Task 2)
src/features/tasks/components/TaskModal.tsx  — audit create-rollback + add unmount guards (Tasks 3, 4)
src/features/tasks/components/TaskModal.test.tsx  — add create-rollback test (Task 3)
src/features/tasks/hooks/useTaskModal.ts     — audit prefill flow (Task 3, no changes expected)
src/features/board/hooks/useBoardDnd.ts     — add unmount guard (Task 5)
```

### Forbidden Patterns

- Dispatching `OP_ROLLBACK` from a component directly: only `BoardAPIContext.tsx` dispatches this
- Pushing `OP_ROLLBACK` to the history stack: system actions never enter history
- Calling `mockRequest` anywhere except `src/api/tasks.ts`
- Using `taskId` alone to identify a pending operation — always use `opId`
- `state.pendingOps.set(...)` or `state.pendingOps.delete(...)` directly in reducer — always reconstruct with `new Map(state.pendingOps)` first
- Calling `onOpenCreate` AFTER `toast.error` — the modal re-open must happen before the toast to preserve UX order

### Verification Checklist

```
1. Submit a create task form in dev → observe card appears immediately (before 2s mock delay)
2. Temporarily set MockApiError failureRate to 1.0 in mock-client.ts → submit create → confirm card disappears AND modal re-opens pre-filled with the typed title
3. Restore failureRate → open two separate tasks → drag both quickly → confirm each reverts independently without corrupting the other
4. npm run test -- boardReducer → all concurrent-op tests pass
5. npm run lint → zero warnings
6. npm run test → ≥106 tests pass (target, not a hard gate)
```

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
