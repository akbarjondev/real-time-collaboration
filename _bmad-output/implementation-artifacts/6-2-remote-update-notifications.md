# Story 6.2: Remote Update Notifications

Status: ready-for-dev

## Blocker

**Story 6.1 must be `done` before starting this story.**
This story adds the toast notification triggered inside `useRealtimeSimulation` after dispatching `REMOTE_UPDATE`. The hook must exist and fire before the notification layer can be tested.

---

## Story

As a user,
I want to see a non-intrusive notification when another user updates a task,
so that I'm aware of remote changes without being interrupted.

## Acceptance Criteria

1. **Given** a `REMOTE_UPDATE` fires for a task **When** `useRealtimeSimulation` dispatches it **Then** `toast.info('"[task title]" was updated by another user', { id: 'remote-[taskId]', duration: 4000 })` is shown in the bottom-right corner.

2. **Given** multiple `REMOTE_UPDATE` dispatches fire for the same task within 4 seconds **When** each fires **Then** only one toast is visible at a time — the toast is updated in place (Sonner deduplicates by `id`).

3. **Given** a remote update changes a task's status **When** `REMOTE_UPDATE` is dispatched **Then** the task card disappears from its origin column and appears in the destination column automatically (no extra dispatch needed — reactive derivation from `boardState.tasks`).

4. **Given** a remote update fires **When** it targets a task that is in-flight (has a pending op) **Then** the task still updates visually (REMOTE_UPDATE upserts regardless of pending state) and the info toast still fires.

5. **Given** a `CONFLICT_DETECTED` dispatch (task open in modal) **When** it occurs **Then** NO info toast is shown for that tick — conflict toasts are handled separately in Story 6.3.

6. **Given** the Sonner toast configuration **When** multiple info toasts from remote updates queue **Then** maximum 3 toasts are visible simultaneously (existing Sonner `visibleToasts` limit from Epic 5).

## Tasks / Subtasks

- [ ] Task 1: Add `toast.info` call to `useRealtimeSimulation` after `REMOTE_UPDATE` dispatch (AC: #1, #2, #5)
  - [ ] Import `toast` from `sonner` in `useRealtimeSimulation.ts`
  - [ ] In the `else` branch (non-conflict path), add `toast.info(...)` call AFTER `dispatch({ type: 'REMOTE_UPDATE', ... })`
  - [ ] Use toast id `\`remote-${task.id}\`` for Sonner deduplication
  - [ ] Set `duration: 4000`
  - [ ] Confirm the `CONFLICT_DETECTED` branch has NO toast call (conflict toast is Story 6.3)

- [ ] Task 2: Verify card auto-moves via reactive derivation (AC: #3)
  - [ ] Read `boardReducer.ts` REMOTE_UPDATE case — confirm it upserts (replaces) the task in-place
  - [ ] Read `BoardColumn.tsx` columnTasks `useMemo` — confirm it re-derives from `tasks` on every `BoardStateContext` update
  - [ ] No code changes required if both are already correct — document as verified in Completion Notes
  - [ ] Write a reducer unit test in `boardReducer.test.ts`: `REMOTE_UPDATE` with changed status → task appears in new status filter result

- [ ] Task 3: Verify in-flight task handling (AC: #4)
  - [ ] Read `boardReducer.ts` `REMOTE_UPDATE` case — confirm it does not check `pendingOps` before upsert
  - [ ] No code changes required — document as verified
  - [ ] Add a reducer test: task with pending op receives REMOTE_UPDATE → task is updated, pending op remains in map

- [ ] Task 4: Write / extend tests (AC: #1, #2, #5)
  - [ ] Extend `useRealtimeSimulation.test.ts` from Story 6.1
  - [ ] Test: `REMOTE_UPDATE` dispatch → `toast.info` called with correct message and id
  - [ ] Test: `CONFLICT_DETECTED` dispatch → `toast.info` NOT called
  - [ ] Test: two rapid dispatches for same taskId → toast called with same id both times (Sonner handles dedup)

---

## Dev Notes

### Toast Call — Exact Location and Format

The toast call lives inside `useRealtimeSimulation.ts` in the `else` (non-conflict) branch, immediately after the `dispatch`:

```typescript
} else {
  dispatch({ type: 'REMOTE_UPDATE', task: remoteTask })
  toast.info(`"${task.title}" was updated by another user`, {
    id: `remote-${task.id}`,
    duration: 4000,
  })
}
```

**Why `id: \`remote-${task.id}\``:** Sonner updates an existing toast if a new `toast.info` call uses the same `id`. This means rapid remote updates for the same task (e.g., simulation fires twice within 4s) replace the existing notification rather than stacking two. The user sees at most one "was updated" toast per task at a time.

**Why AFTER dispatch:** The optimistic update has already been applied to the reducer state synchronously when the `toast.info` fires. If the toast fired BEFORE dispatch, the card would still show the old value when the user glances at the board.

**Forbidden toast messages:**
- `toast.error('Something went wrong')` — always use specific messages
- `toast.warning(...)` for remote updates — info tier (zinc 4s) is correct for non-error notifications
- `toast.success(...)` — remote updates are not user-initiated successes

### Card Auto-Move — How it Works

No extra code is needed for status-change auto-move. The data flow is:

```
REMOTE_UPDATE dispatched
    ↓
boardReducer.REMOTE_UPDATE: tasks.map(t => t.id === task.id ? task : t)
    ↓
boardState.tasks updated (new array reference)
    ↓
BoardStateContext.Provider value={boardState.tasks} updates
    ↓
useTasks() consumers re-render (BoardColumn × 3)
    ↓
columnTasks = useMemo(() => filterTasks(tasks.filter(t => t.status === status), filters), [tasks, filters, status])
    ↓
Task appears in column matching remoteTask.status, disappears from old column
```

This is pure React reactivity — no imperative column-switching logic needed. The `boardReducer` REMOTE_UPDATE case (verified in Story 1.2) already performs a targeted upsert without resetting the array.

**Scroll preservation:** Because the reducer uses `tasks.map(...)` (replace in place) rather than `[...tasks.filter(...), remoteTask]` (move to end), the virtualized list (Epic 8) will maintain scroll position — the replaced item stays at the same index. For status changes (task moves column), the item is removed from one column's filtered array and added to another's — a full scroll-reset is acceptable for cross-column moves.

### In-Flight Task Handling

The `REMOTE_UPDATE` reducer case does not check `pendingOps`:

```typescript
case "REMOTE_UPDATE": {
  const exists = state.tasks.some((t) => t.id === action.task.id)
  return {
    ...state,
    tasks: exists
      ? state.tasks.map((t) => (t.id === action.task.id ? action.task : t))
      : [...state.tasks, action.task],
  }
}
```

If a task has a pending op (e.g., user just dragged it), `REMOTE_UPDATE` still replaces it. The `pendingOps` entry remains in the map. When the pending API call resolves:
- `OP_SUCCESS`: pending op cleared, task stays at remote value (correct — remote won)
- `OP_ROLLBACK`: pending op's snapshot is restored, overwriting the remote value (user's original pre-drag position wins)

This is intentional last-write-wins semantics for MVP. Story 6.3 (ConflictModal) handles the more nuanced case where the task is actively being edited.

### Toast Tier Reference

Per project design specification (planning-distillate.md):

| Tier    | Color  | Duration   | Use case                          |
|---------|--------|------------|-----------------------------------|
| Info    | zinc   | 4s         | Remote update ("updated by user") |
| Success | emerald| 3s         | User-initiated success            |
| Warning | amber  | 6s         | Conflict detected                 |
| Error   | rose   | persistent | Named rollback failures           |

Remote update notifications use **info** (zinc, 4s). Never use `warning` or `error` for remote updates.

### boardReducer Tests to Add

```typescript
// In src/store/boardReducer.test.ts

it('REMOTE_UPDATE changes task status — task appears in new status', () => {
  const task = { ...sampleTask, status: 'todo' as const }
  const state = { ...initialBoardState, tasks: [task] }
  const updated = boardReducer(state, {
    type: 'REMOTE_UPDATE',
    task: { ...task, status: 'done' },
  })
  expect(updated.tasks[0]?.status).toBe('done')
})

it('REMOTE_UPDATE on task with pending op — op remains in map', () => {
  const task = { ...sampleTask }
  const op: PendingOperation = { opId: 'op1', taskId: task.id, snapshot: task, opType: 'move' }
  const state = {
    ...initialBoardState,
    tasks: [task],
    pendingOps: new Map([['op1', op]]),
  }
  const updated = boardReducer(state, {
    type: 'REMOTE_UPDATE',
    task: { ...task, priority: 'high' },
  })
  expect(updated.pendingOps.has('op1')).toBe(true)
  expect(updated.tasks[0]?.priority).toBe('high')
})
```

### File Paths

```
src/features/realtime/hooks/useRealtimeSimulation.ts    ← add toast.info call (REMOTE_UPDATE branch only)
src/store/boardReducer.test.ts                          ← add REMOTE_UPDATE + in-flight tests
src/features/realtime/hooks/useRealtimeSimulation.test.ts  ← extend with toast assertion tests
```

### Forbidden Patterns

- `toast.warning(...)` or `toast.error(...)` for remote update notifications — info tier only
- `toast.info('Something was updated')` — always include the task title and attribute to "another user"
- Calling `toast.info` inside the `CONFLICT_DETECTED` branch — conflict toasts belong in Story 6.3
- Hardcoding toast duration as a string (`'4s'`) — Sonner uses milliseconds: `duration: 4000`
- Dispatching a second action to move the card to the correct column — REMOTE_UPDATE already handles this via reducer + reactive derivation

### Verification Checklist

```
1. npm run dev → wait for first simulation tick (10-15s)
   → observe: task priority badge changes + info toast appears bottom-right
2. Rapidly trigger two ticks for the same task (temporarily lower delay to 100ms in dev)
   → confirm only one toast visible at a time (deduplication by id)
3. Open a task in edit modal → wait for conflict tick → confirm NO info toast appears
4. npm run test → boardReducer.test.ts REMOTE_UPDATE cases pass
5. npm run test → useRealtimeSimulation.test.ts toast assertions pass
6. tsc --noEmit → zero errors
7. npm run lint → zero warnings
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
