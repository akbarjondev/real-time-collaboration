# Epic 5: Optimistic Updates & Error Recovery

Users experience instant feedback on all mutations, with automatic rollbacks and error notifications when API calls fail.

## Story 5.1: Implement Optimistic Update Sequence with Automatic Rollback

As a user,
I want all task mutations to appear instantly in the UI and automatically roll back if the API call fails,
So that the board always feels fast and self-heals without requiring manual intervention.

**Acceptance Criteria:**

**Given** any task mutation (create, update, delete, move) is dispatched
**When** the action is processed by boardReducer
**Then** the task list updates immediately before `mockRequest()` is called (≤ 1 animation frame, ≤ 16ms)
**And** a `PendingOperation` is recorded in `pendingOps` with the `opId`, `taskId`, and a snapshot of the task's prior state

**Given** a pending mutation is in flight
**When** `mockRequest()` resolves successfully (~90% of cases)
**Then** `OP_SUCCESS` is dispatched and the matching `pendingOps` entry is removed
**And** the task remains in its updated state on the board

**Given** a pending mutation is in flight
**When** `mockRequest()` throws `MockApiError` (~10% of cases)
**Then** `OP_ROLLBACK` is dispatched with the matching `opId`
**And** boardReducer restores the task from its `snapshot` in `pendingOps`
**And** the rollback is transparent to the undo/redo history stack (OP_ROLLBACK never pushes to history)

**Given** a task creation that is rolled back
**When** the API fails
**Then** the task card is removed from the board
**And** the create modal re-opens pre-filled with the previously entered data (UX-DR12, FR19)

**Given** multiple concurrent mutations with independent failure rates
**When** some succeed and some fail
**Then** each `OP_ROLLBACK` restores only its own operation's snapshot (identified by `opId`)
**And** successful operations are unaffected by other operations' rollbacks

---

## Story 5.2: Per-Card In-Flight Loading Indicator

As a user,
I want to see a subtle animated ring and spinner on any task card that has a pending API call,
So that I know which cards are being processed while the board remains fully interactive.

**Acceptance Criteria:**

**Given** a task mutation is dispatched and its `opId` is in `pendingOps`
**When** the corresponding TaskCard renders
**Then** a `cardPulse` CSS keyframe animation (0→50→100% violet border + glow, 1.8s infinite) appears on the card border
**And** a CSS spinner appears in the top-right corner of the card

**Given** a card is in the in-flight state
**When** the board renders
**Then** the card has `aria-busy="true"` for screen readers (UX-DR11)
**And** all other cards remain fully interactive (no global loading overlay or disabled state)

**Given** the API call resolves (success or failure)
**When** `OP_SUCCESS` or `OP_ROLLBACK` is dispatched
**Then** the `cardPulse` animation and spinner are removed from the card

**Given** `usePendingOps()` is consumed in TaskCard
**When** PendingOpsContext updates (new op added or removed)
**Then** only the affected TaskCard re-renders — columns and other task cards do NOT re-render

---

## Story 5.3: Tiered Toast Notification System

As a user,
I want toast notifications that clearly communicate what happened (remote update, success, conflict, error) with different visual weights and auto-dismiss timings,
So that I'm informed of async events without being overwhelmed.

**Acceptance Criteria:**

**Given** a mutation fails and `OP_ROLLBACK` fires
**When** the rollback toast is shown
**Then** it uses rose border styling (error tier), persists until the user manually dismisses it
**And** the message names the specific action and task: e.g., `"Update failed — \"Auth task\" has been reverted"` — generic "Something went wrong" messages are forbidden

**Given** a remote update is applied (production trigger: `useRealtimeSimulation` in Epic 6; test trigger: dispatch `REMOTE_UPDATE` directly via `boardDispatch` with a modified task)
**When** the info toast is shown
**Then** it uses zinc border styling, auto-dismisses after 4 seconds
**And** the message text is: `"[task title] was updated by another user"`

**Given** a test for the info toast in `ToastNotifications.test.tsx`
**When** the test directly dispatches `{ type: 'REMOTE_UPDATE', payload: updatedTask }` via the `boardDispatch` context (not via the realtime hook)
**Then** the info toast appears with zinc border and the correct task title
**And** the test does not depend on Epic 6 being implemented

**Given** a successful operation completes (optional success toast for create)
**When** shown
**Then** it uses emerald border styling, auto-dismisses after 3 seconds

**Given** more than 3 toasts are queued simultaneously
**When** rendered by Sonner
**Then** additional toasts are queued and coalesce — no more than 3 are visible at once

**Given** the Sonner `<Toaster>` component
**When** configured in `ToastProvider`
**Then** toasts stack from the bottom-right corner, newest on top

---

## Story 5.4: Feature-Level Error Boundaries

As a user,
I want individual features to catch render errors gracefully without crashing the whole application,
So that a bug in one part of the board doesn't break everything else.

**Acceptance Criteria:**

**Given** an `ErrorBoundary` component wrapping the board feature
**When** a child component throws a JavaScript error during render
**Then** the ErrorBoundary catches it and renders a fallback UI (error message + "Retry" button)
**And** the rest of the application (header, other features) continues to function

**Given** an app-level `ErrorBoundary` in `App.tsx`
**When** a catastrophic error propagates past feature-level boundaries
**Then** the app-level boundary renders a full-page error state instead of a blank screen

**Given** the error boundary structure
**When** implemented
**Then** there are at least two boundaries: one at app level, one wrapping the board/Kanban feature
**And** `ErrorBoundary` is implemented as a class component (React's requirement for `componentDidCatch`)

---
