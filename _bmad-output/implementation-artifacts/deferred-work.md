# Deferred Work

## Deferred from: code review of 8-2-performance-optimizations-memoization-and-render-isolation (2026-04-24)

- **`<Suspense>` wrapping `TaskModal` is outside board's `<ErrorBoundary>`** — if the lazy chunk fails to load, the error bypasses the board error boundary. Pre-existing: `<TaskModal>` was already outside `<ErrorBoundary>` before this story; wrapping `<Suspense>` in an `ErrorBoundary` would fully protect against chunk load failures. [src/features/board/components/KanbanBoard.tsx]



- **Focus capture timing in ConflictModal** — `document.activeElement` is captured in a `useEffect` (runs after paint). If `@base-ui/react` Dialog traps focus synchronously before effects fire, `conflictTriggerRef.current` will point to an element inside ConflictModal rather than the TaskModal trigger, causing `restoreFocus()` to silently no-op after resolution. Requires live browser testing to confirm @base-ui focus timing. [src/features/realtime/components/ConflictModal.tsx:44]
- **`role="alertdialog"` forwarding by @base-ui DialogContent** — The `role` prop is passed to shadcn's `DialogContent` which wraps `@base-ui/react`. Whether @base-ui forwards arbitrary role overrides to its root element is implementation-dependent. If not forwarded, the accessible alertdialog role is absent. Verify via @base-ui docs or browser DevTools. [src/features/realtime/components/ConflictModal.tsx:93]


## Deferred from: code review of 3-1-desktop-drag-and-drop-task-movement (2026-04-24)

- **Stale `tasks` closure in `handleDragEnd`** — `async` closure captures task list at drag-start; concurrent remote updates during the 2s delay produce a stale `draggedTask.status === newStatus` comparison. Architectural React concern; consistent with rest of codebase. [src/features/board/hooks/useBoardDnd.ts]
- **No unmount guard in `handleDragEnd`** — `dispatch` and `toast` fire after board unmount during the 2s API delay. Matches pre-existing pattern in `createTask`/`updateTask`/`deleteTask`. [src/features/board/hooks/useBoardDnd.ts]
- **Drop placeholder always appends at bottom of list** — placeholder position is not the actual insertion point; fixing requires `onDragOver` state updates and a significant refactor. [src/features/board/components/BoardColumn.tsx]
- **`opacity-0` source card in SortableContext items** — when all tasks in a target column are pending (`opacity-0 pointer-events-none`), `over.id` may resolve to the dragged card's own ID and silently abort the move. Very-edge scenario. [src/features/tasks/components/TaskCard.tsx, src/features/board/hooks/useBoardDnd.ts]

## Deferred from: code review of 5-4-feature-level-error-boundaries (2026-04-24)

- **Story 5-4 subtask checkboxes not checked off** — Tasks 1–3 sub-items in story file are unchecked despite implementation being complete per Completion Notes. Pre-existing tracking inconsistency, docs only. [_bmad-output/implementation-artifacts/5-4-feature-level-error-boundaries.md]

## Deferred from: code review of Epic 7 undo/redo (2026-04-24)

- **`HISTORY_APPLY` creates permanently unresolved `pendingOps` entries** — Undo/redo dispatches `HISTORY_APPLY` which re-runs the inner action through `boardReducer`, adding a fresh opId to `pendingOps`. Since undo/redo make no API call, `OP_SUCCESS`/`OP_ROLLBACK` is never dispatched for the inverse opId → affected task cards show a loading spinner indefinitely after every undo or redo. Accepted architectural limitation for this iteration; requires undo/redo to call the server API (or a dedicated `CLEAR_PENDING_OP` action) to fix properly. [src/features/history/hooks/useHistory.ts:61,68]
- **`createTask` calls `apiCreateTask(task)` (no id) while local state uses client-generated `nanoid()` id** — API contract is `Omit<Task,'id'|'createdAt'>` by design; the server generates its own id. Local board state and history inverse (`TASK_DELETE`) reference the client id. In a real persistence scenario this causes a client/server id divergence. Requires API contract change (accept client id, or reconcile local state from server response). Pre-existed Epic 7. [src/features/history/hooks/useHistory.ts:111]
- **`HistoryProvider` constructs new `value` object on every render** — `useMemo` on value alone is ineffective without `useCallback` on all mutation functions in `useHistoryImpl`; pre-existing pattern across other context providers in the codebase. Requires performance profiling to confirm whether optimization is necessary. [src/store/HistoryContext.tsx]
- **API failures in `moveTask`/`updateTask`/`deleteTask` leave phantom history entries** — Dismissed per spec: AC#9 and dev notes explicitly state "history stack is untouched by rollback — no special handling needed." The undo-after-rollback is a documented no-op (OP_ROLLBACK already reverted state; undo's inverse is then effectively a no-op). [src/features/history/hooks/useHistory.ts]



- **No unmount guard in `handleStatusChange`** — `dispatch` and `toast` fire after modal/board unmount during the 2s delay. Pre-existing pattern. [src/features/tasks/components/TaskModal.tsx]
- **`window.innerWidth < 768` focus check is not reactive** — sampled once on modal open; not updated on orientation change or DevTools resize while modal is open. Minor UX edge case. [src/features/tasks/components/TaskModal.tsx]
