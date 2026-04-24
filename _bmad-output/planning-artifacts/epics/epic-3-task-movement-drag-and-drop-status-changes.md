# Epic 3: Task Movement — Drag-and-Drop & Status Changes

Users can move tasks between columns via drag-and-drop on desktop and a status dropdown on mobile.

## Story 3.1: Desktop Drag-and-Drop Task Movement

As a desktop user,
I want to drag task cards between columns with smooth visual feedback,
So that moving tasks between statuses feels instant and natural.

**Acceptance Criteria:**

**Given** a task card on desktop
**When** the user presses mousedown on the card
**Then** the card scales to 1.02x and its shadow deepens (grabbed state), cursor changes to `grabbing`

**Given** a card being dragged
**When** it is over a valid destination column
**Then** a semi-transparent ghost card remains at the origin
**And** a dashed placeholder appears in the destination column
**And** the destination column border highlights violet

**Given** a card is dropped into a different column
**When** the drop is completed
**Then** the card animates into its new position (shadow resets, scale returns)
**And** `useBoardAPI().moveTask()` generates a `nanoid()` opId, records the prior status as a snapshot in `pendingOps`, dispatches `TASK_MOVE` to update the column immediately, and calls `moveTask()` in `src/api/tasks.ts` (which calls `mockRequest<void>`)

**Given** the `mockRequest()` call resolves successfully (~90%)
**When** `OP_SUCCESS` is dispatched
**Then** the task remains in the destination column and the `pendingOps` entry is removed

**Given** the `mockRequest()` call throws `MockApiError` (~10%)
**When** `OP_ROLLBACK` is dispatched
**Then** the card slides back to its origin column (restored from the `pendingOps` snapshot)
**And** `toast.error('Move failed — "[task title]" has been reverted')` is shown

**Note:** The per-card in-flight loading indicator (violet pulse border + spinner) is added in Epic 5 Story 5.2. Until then, the card has no visual in-flight state — rollback is functional but silent on the UI.
**And** the move is dispatched through `useBoardAPI().moveTask()` for history tracking

**Given** a card is dropped back into its origin column at the same position
**When** the drop occurs
**Then** the card snaps back with no animation and board state is unchanged

**Given** the @dnd-kit setup
**When** implemented
**Then** `DndContext` wraps the board with `PointerSensor` configured
**And** each column has a `SortableContext` with its task IDs
**And** the `useBoardDnd` hook handles `onDragStart`, `onDragOver`, and `onDragEnd`

---

## Story 3.2: Mobile Status Dropdown for Task Movement

As a mobile user,
I want to change a task's status via a dropdown selector when I tap a card,
So that I can move tasks between columns without needing drag-and-drop.

**Acceptance Criteria:**

**Given** a mobile viewport (< 768px) or touch device
**When** the user taps a task card
**Then** the task detail modal opens with the status `Select` dropdown as the first interactive element

**Given** the task modal is open on mobile
**When** the user selects a new status from the dropdown ("Todo", "In Progress", "Done")
**Then** the modal closes and the task card moves to the corresponding column immediately

**Given** the mobile status change
**When** executed
**Then** it dispatches through `useBoardAPI().moveTask()` — the same mutation path as drag-and-drop

**Given** the shadcn/ui `Select` component is used for the status dropdown
**When** rendered
**Then** the dropdown is accessible via keyboard (Tab to focus, Enter/Space to open, arrow keys to select)

---
