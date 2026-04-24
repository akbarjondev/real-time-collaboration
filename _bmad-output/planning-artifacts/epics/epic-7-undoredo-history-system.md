# Epic 7: Undo/Redo History System

Users can undo and redo any tracked action via keyboard shortcuts, with a persistent hint bar always showing what's available.

## Story 7.1: Implement useHistory Hook with Command Stack

As a developer,
I want a `useHistory` hook that wraps `boardAPI` and manages a 50-entry command stack with forward/inverse action pairs,
So that all user-initiated mutations are tracked and reversible.

**Acceptance Criteria:**

**Given** `src/features/history/hooks/useHistory.ts`
**When** implemented
**Then** it maintains an internal stack of `HistoryEntry` objects: `{ id: string; label: string; forward: UserAction; inverse: UserAction }`
**And** the stack is capped at 50 entries (oldest entries drop when the cap is reached)

**Given** a user action is dispatched through `useHistory.dispatch(action)`
**When** the action is a user action (TASK_MOVE, TASK_CREATE, TASK_UPDATE, TASK_DELETE)
**Then** a `HistoryEntry` is pushed to the stack with a human-readable label (e.g., "Move 'Auth task' to Done") and the computed inverse action

**Given** an `OP_ROLLBACK` or `REMOTE_UPDATE` occurs
**When** boardReducer processes it
**Then** the history stack is NOT modified (rollbacks and remote updates are transparent to undo/redo)

**Given** `undo()` is called
**When** there are entries in the stack
**Then** the stack cursor moves back and `HISTORY_APPLY(inverse)` is dispatched to boardReducer
**And** `HistoryContext` updates with new `undoLabel`, `redoLabel`, `canUndo`, `canRedo` values

**Given** `redo()` is called
**When** there are undone entries
**Then** the stack cursor moves forward and `HISTORY_APPLY(forward)` is dispatched

**Given** the user performs a new action after undoing
**When** the action is dispatched
**Then** all redo entries ahead of the cursor are cleared (FR32)

**Given** `useHistory.test.ts`
**When** the unit test suite runs
**Then** all invariants (cap, undo, redo, redo-stack-clear, rollback-transparency) pass without rendering

---

## Story 7.2: Keyboard Shortcuts for Undo and Redo

As a user,
I want to undo and redo actions using familiar keyboard shortcuts,
So that correcting mistakes requires no more effort than in any other tool I use.

**Acceptance Criteria:**

**Given** the board is active (no modal open)
**When** the user presses Ctrl+Z (Windows/Linux) or Cmd+Z (macOS)
**Then** the most recent undoable action is reversed
**And** the board state updates immediately

**Given** the board is active
**When** the user presses Ctrl+Shift+Z (Windows/Linux) or Cmd+Shift+Z (macOS)
**Then** the most recently undone action is re-applied

**Given** `useKeyboardShortcut` in `src/shared/hooks/useKeyboardShortcut.ts`
**When** implemented
**Then** it listens for keyboard events at the document level with correct modifier detection for both macOS and Windows
**And** it cleans up event listeners on unmount

**Given** a modal is open
**When** the user presses Ctrl/Cmd+Z
**Then** the shortcut is suppressed (undo should not fire while a modal has focus, to avoid interfering with text editing)

**Given** `canUndo` is `false`
**When** Ctrl/Cmd+Z is pressed
**Then** nothing happens (no error, no state change)

---

## Story 7.3: Undo Hint Bar Component

As a user,
I want a persistent strip between the filter bar and the columns that always shows what action can be undone or redone,
So that I never have to wonder if undo is available or what it will do.

**Acceptance Criteria:**

**Given** the Undo Hint Bar component is rendered
**When** the history stack is empty
**Then** the bar shows "Nothing to undo" in muted `text-xs text-zinc-500` styling

**Given** there is an undoable action on the stack
**When** the bar renders
**Then** an Undo button with `undo-2` Lucide icon and descriptive label is shown: `"Undo: Move 'Auth task' to Done"`
**And** the label text uses `text-xs text-zinc-500` (present but quiet, never dominant)

**Given** there is a redoable action
**When** the bar renders
**Then** a Redo button with `redo-2` icon appears and is enabled

**Given** the `aria-live="polite"` attribute is set on the bar
**When** the undo/redo label changes
**Then** screen readers announce the change without interrupting other announcements (UX-DR6)

**Given** the bar is rendered
**When** the user is on any viewport size
**Then** the bar is always visible and never collapsed or hidden (including on mobile)

---
