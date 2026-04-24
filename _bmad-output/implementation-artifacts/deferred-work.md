# Deferred Work

## Deferred from: code review of 3-1-desktop-drag-and-drop-task-movement (2026-04-24)

- **Stale `tasks` closure in `handleDragEnd`** — `async` closure captures task list at drag-start; concurrent remote updates during the 2s delay produce a stale `draggedTask.status === newStatus` comparison. Architectural React concern; consistent with rest of codebase. [src/features/board/hooks/useBoardDnd.ts]
- **No unmount guard in `handleDragEnd`** — `dispatch` and `toast` fire after board unmount during the 2s API delay. Matches pre-existing pattern in `createTask`/`updateTask`/`deleteTask`. [src/features/board/hooks/useBoardDnd.ts]
- **Drop placeholder always appends at bottom of list** — placeholder position is not the actual insertion point; fixing requires `onDragOver` state updates and a significant refactor. [src/features/board/components/BoardColumn.tsx]
- **`opacity-0` source card in SortableContext items** — when all tasks in a target column are pending (`opacity-0 pointer-events-none`), `over.id` may resolve to the dragged card's own ID and silently abort the move. Very-edge scenario. [src/features/tasks/components/TaskCard.tsx, src/features/board/hooks/useBoardDnd.ts]

## Deferred from: code review of 3-2-mobile-status-dropdown-for-task-movement (2026-04-24)

- **No unmount guard in `handleStatusChange`** — `dispatch` and `toast` fire after modal/board unmount during the 2s delay. Pre-existing pattern. [src/features/tasks/components/TaskModal.tsx]
- **`window.innerWidth < 768` focus check is not reactive** — sampled once on modal open; not updated on orientation change or DevTools resize while modal is open. Minor UX edge case. [src/features/tasks/components/TaskModal.tsx]
