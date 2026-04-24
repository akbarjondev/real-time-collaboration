# Epic 6: Real-Time Collaboration Simulation & Conflict Resolution

Users see simulated remote updates from a second user every 10–15 seconds and can resolve conflicts without data loss.

## Story 6.1: Implement Real-Time Simulation Hook

As a system,
I want to periodically apply random task updates simulating a second remote user,
So that the board demonstrates real-time collaboration behavior.

**Acceptance Criteria:**

**Given** the application is running
**When** `useRealtimeSimulation` hook is active
**Then** a random task update fires every 10–15 seconds (random interval within the range)

**Given** a simulation tick fires
**When** a task update is generated
**Then** `REMOTE_UPDATE` is dispatched directly to `boardReducer` (bypassing `useHistory` — remote updates must never enter the history stack)
**And** the task is selected randomly from the current task list with a meaningful field change (e.g., status, assignee, or priority)

**Given** the simulation hook
**When** implemented in `src/features/realtime/hooks/useRealtimeSimulation.ts`
**Then** it uses `useEffect` with proper cleanup (interval is cleared on unmount)
**And** it calls `boardDispatch` directly, NOT through `useBoardAPI()` (architecture boundary: simulation bypasses history)

**Given** the simulation is running alongside user interactions
**When** a `REMOTE_UPDATE` is dispatched
**Then** it does not reset the board scroll position or cause full column re-renders (NFR6)

---

## Story 6.2: Remote Update Notifications

As a user,
I want a non-intrusive info toast when a simulated remote user updates a task,
So that I'm aware of external changes without being interrupted.

**Acceptance Criteria:**

**Given** a `REMOTE_UPDATE` action is dispatched
**When** the update is applied to a task that the user is not actively editing
**Then** an info toast appears (zinc border, 4s auto-dismiss): `"[Task title] was updated by another user"`
**And** the task card on the board updates in place without scroll position reset

**Given** multiple remote updates fire in quick succession
**When** more than 3 toasts would be queued
**Then** excess toasts coalesce — the existing info toast is updated rather than stacking overflow

**Given** a remote update modifies a task's status
**When** applied
**Then** the task card moves to the correct column and the column count badges update

---

## Story 6.3: Conflict Detection and Resolution Modal

As a user,
I want to be informed when a remote update conflicts with my active edit and be able to choose which version to keep,
So that no data is silently lost due to concurrent edits.

**Acceptance Criteria:**

**Given** the user has the task detail modal open and is actively editing a task
**When** a `REMOTE_UPDATE` arrives for the same task
**Then** `CONFLICT_DETECTED` is dispatched with `{ local: Task, remote: Task }` stored in `ConflictContext`
**And** the Conflict Resolution Modal overlays the task edit modal

**Given** the Conflict Resolution Modal is shown
**When** rendered
**Then** it displays a two-column side-by-side diff showing "Mine" vs "Theirs" with changed fields highlighted
**And** it has three action buttons: "Keep mine" (primary/violet), "Take theirs" (secondary), "Cancel" (ghost)
**And** it uses `role="alertdialog"`, focus is trapped inside, and `aria-describedby` points to the diff section

**Given** the user clicks "Keep mine"
**When** the action is executed
**Then** `CONFLICT_RESOLVE_MINE` is dispatched and the user's version is saved
**And** the conflict modal closes and the task edit modal returns to its normal state

**Given** the user clicks "Take theirs"
**When** the action is executed
**Then** `CONFLICT_RESOLVE_THEIRS` is dispatched and the remote version replaces the task
**And** the task edit modal refreshes to show the remote version's field values

**Given** the user clicks "Cancel"
**When** the action is executed
**Then** the conflict modal closes and the task edit modal remains open with the user's original (pre-conflict) values
**And** no state change is applied (the conflict is deferred)

---
