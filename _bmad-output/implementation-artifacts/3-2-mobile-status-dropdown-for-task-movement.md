# Story 3.2: Mobile Status Dropdown for Task Movement

Status: in-progress

## Blocker

**Do NOT start until Story 3.1 is marked `done`.**
Story 3.2 calls `boardAPI.moveTask()` and relies on the full async flow (API call + OP_SUCCESS/OP_ROLLBACK + throw) implemented in Story 3.1. If 3.1 is not done, `moveTask` only dispatches to the reducer and the API call never fires.

---

## Story

As a mobile user,
I want to change a task's status via a dropdown selector when I tap a card,
so that I can move tasks between columns without needing drag-and-drop.

## Acceptance Criteria

1. **Given** a mobile viewport (< 768px) **When** the user taps a task card **Then** the edit modal opens with the Status `Select` as the first interactive element and it receives focus.

2. **Given** the edit modal is open **When** the user selects a new status ("Todo", "In Progress", "Done") **Then** the modal closes immediately and `useBoardAPI().moveTask(task.id, newStatus)` is called — the same mutation path as drag-and-drop.

3. **Given** the status change **When** `moveTask` resolves successfully (~90%) **Then** the task card moves to the destination column and `pendingOps` is cleared — no toast shown on success.

4. **Given** the status change **When** `moveTask` throws `MockApiError` (~10%) **Then** the card is restored to its origin column (OP_ROLLBACK) and `toast.error('Move failed — "[task title]" has been reverted')` is shown.

5. **Given** the user selects the current status (no change) **When** `onValueChange` fires **Then** no API call is made and the modal stays open.

6. **Given** the shadcn/ui `Select` component **When** rendered **Then** it is keyboard-accessible (Tab to focus, Space/Enter to open, arrow keys to navigate, Enter to select).

## Tasks / Subtasks

- [x] Task 1: Add Status Select field to `TaskModal.tsx` (AC: #1, #2, #5, #6)
  - [x] Import `TaskStatus` from `@/types/task.types`
  - [x] Add `statusTriggerRef = useRef<HTMLButtonElement | null>(null)` (for focus management)
  - [x] Update the existing focus `useEffect` (line ~53): when `isOpen && mode === 'edit'` and `window.innerWidth < 768`, focus `statusTriggerRef.current` instead of `titleInputRef.current`
  - [x] Add `handleStatusChange(newStatus: TaskStatus)` async function — see Dev Notes for implementation
  - [x] Render Status Select as the **first field inside the form** in edit mode (`mode === 'edit' && task`) — ABOVE the Title field
  - [x] Select `value={task.status}`, `onValueChange={(v) => handleStatusChange(v as TaskStatus)}`
  - [x] Attach `ref={statusTriggerRef}` to `<SelectTrigger>` (the trigger is a `<button>` element)
  - [x] Status options: `<SelectItem value="todo">Todo</SelectItem>`, `in-progress` → "In Progress", `done` → "Done"

- [x] Task 2: Update sprint-status.yaml
  - [x] Set `3-2-mobile-status-dropdown-for-task-movement` to `ready-for-dev` (already done by this file creation)

- [x] Task 3: Write tests (AC: all)
  - [x] `TaskModal.test.tsx`: Status Select renders in edit mode; selecting a different status calls `boardAPI.moveTask` and closes modal; selecting same status does nothing; toast shown on `moveTask` rejection
  - [x] Test focus: on mobile viewport (`window.innerWidth < 768`), status trigger receives focus on open in edit mode

---

## Dev Notes

### handleStatusChange — Full Implementation

```typescript
async function handleStatusChange(newStatus: TaskStatus) {
  if (!task || newStatus === task.status) return  // no-op if same status (AC #5)

  const taskTitle = task.title  // capture before closing (task ref may change)
  onClose()                     // close immediately (optimistic)

  try {
    await boardAPI.moveTask(task.id, newStatus)
  } catch {
    toast.error(`Move failed — "${taskTitle}" has been reverted`)
  }
}
```

**Why capture `taskTitle` before `onClose()`:** After `onClose()`, the parent component may clear `editingTask`, making `task` null in the next render cycle. Capturing the title before the async call ensures the error toast has the correct text regardless of timing.

### Status Select Placement in the Form

Place the Status field as the **first item** inside `<div className="flex flex-col gap-4">` in the form, but only when `mode === 'edit' && task`. This makes it the first focusable element in the form on mobile.

```tsx
{mode === 'edit' && task && (
  <div className="flex flex-col gap-1">
    <label className="text-sm font-medium text-zinc-700">Status</label>
    <Select
      value={task.status}
      onValueChange={(v) => handleStatusChange(v as TaskStatus)}
    >
      <SelectTrigger ref={statusTriggerRef} className="w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="todo">Todo</SelectItem>
        <SelectItem value="in-progress">In Progress</SelectItem>
        <SelectItem value="done">Done</SelectItem>
      </SelectContent>
    </Select>
  </div>
)}
```

### Focus Management Update

The current focus effect (in `TaskModal.tsx` around line 53):
```typescript
useEffect(() => {
  if (isOpen) {
    const id = setTimeout(() => titleInputRef.current?.focus(), 0)
    return () => clearTimeout(id)
  }
}, [isOpen])
```

Update to:
```typescript
useEffect(() => {
  if (isOpen) {
    const id = setTimeout(() => {
      if (mode === 'edit' && window.innerWidth < 768) {
        statusTriggerRef.current?.focus()
      } else {
        titleInputRef.current?.focus()
      }
    }, 0)
    return () => clearTimeout(id)
  }
}, [isOpen, mode])
```

Add `mode` to the dependency array so it re-evaluates when mode changes.

### selectTriggerRef Type

The shadcn/ui `SelectTrigger` renders a `<button>`. Its `ref` type is `React.Ref<HTMLButtonElement>`. Use:
```typescript
const statusTriggerRef = useRef<HTMLButtonElement | null>(null)
```

Then attach via `ref={statusTriggerRef}` on `<SelectTrigger>`.

### Only Show Status Select in Edit Mode

The Status Select is **only for edit mode**. In create mode, the task's status defaults to `'todo'` and cannot be changed via this dropdown (see `TaskModal.tsx:119` — `status: 'todo'` hardcoded in `createTask` call). This is intentional — users add tasks to a specific column or use the board default.

### Interaction with isDirty Guard

The status dropdown change calls `onClose()` directly — it does **not** call `handleCloseAttempt()`. This means the unsaved-changes guard (`showGuard` dialog) is **NOT** triggered when status changes. This is correct: the status change is an immediate action, not a form edit. Other in-progress form changes (title, description, etc.) are silently discarded when status changes. This matches the UX spec's "instant" behavior.

If this is a concern, add a note to the user in the UI — but per the ACs it's not required.

### Same Mutation Path as Drag-and-Drop

Per AC #2, the status change must use `boardAPI.moveTask(task.id, newStatus)` — the same function that drag-and-drop uses. This ensures:
- The optimistic update (TASK_MOVE dispatch) fires immediately
- The `pendingOps` snapshot is recorded
- The `isPending` ring on the card shows during the 2s API delay
- Rollback works the same way as drag-and-drop

Do NOT call `boardAPI.updateTask()` with a `{ status: newStatus }` change — that would use the wrong action type (`TASK_UPDATE` instead of `TASK_MOVE`) and bypass the correct history/rollback path.

### No Duplicate Imports Needed

`Select`, `SelectContent`, `SelectItem`, `SelectTrigger`, `SelectValue` are already imported in `TaskModal.tsx` (used for Priority field). Only `TaskStatus` needs to be added to the type import from `@/types/task.types`.

### File Paths

```
src/features/tasks/components/TaskModal.tsx  ← only file to change
src/features/tasks/components/TaskModal.test.tsx  ← extend tests
```

### Verification Checklist

```
1. Open browser DevTools → set viewport to 375px (mobile)
2. Click a task card → modal opens, Status Select is focused (first interactive element)
3. Change status in dropdown → modal closes, card moves instantly (optimistic)
4. ~10% of the time: card snaps back with error toast naming the task title
5. Select same status → modal stays open, no API call, no toast
6. On desktop (> 768px) → modal opens with title focused (existing behavior unchanged)
7. tsc --noEmit → zero errors
```

### References

- `handleStatusChange` toast pattern: [Source: src/features/tasks/components/TaskModal.tsx:141-149] (matches `handleDelete` pattern)
- `boardAPI.moveTask` full async flow: [Source: src/store/BoardAPIContext.tsx — completed in Story 3.1]
- `TASK_MOVE` vs `TASK_UPDATE` distinction: [Source: architecture.md#Action Taxonomy]
- Status Select imports already present: [Source: src/features/tasks/components/TaskModal.tsx:15-21]
- Mobile breakpoint (< 768px): [Source: ux-design-specification.md#Platform Strategy]
- `onClose()` vs `handleCloseAttempt()` — bypass guard on status change: [Source: src/features/tasks/components/TaskModal.tsx:92-98]
- Optimistic update sequence: [Source: architecture.md#Optimistic update sequence]

---

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

None — single-file change following Dev Notes exactly.

### Completion Notes List

- Added `statusTriggerRef` and updated focus useEffect to target the status trigger on mobile (< 768px) in edit mode, adding `mode` to the dependency array.
- Added `handleStatusChange` async function: no-op on same status, calls `onClose()` optimistically before `boardAPI.moveTask`, shows error toast on rejection.
- Rendered Status Select as first form field in edit mode only, wired with `ref={statusTriggerRef}` on SelectTrigger.
- All 100 tests pass; `tsc --noEmit` reports zero errors.

### File List

src/features/tasks/components/TaskModal.tsx
src/features/tasks/components/TaskModal.test.tsx
_bmad-output/implementation-artifacts/sprint-status.yaml

### Change Log

- 2026-04-24: Story 3.2 implemented — mobile status dropdown added to TaskModal; focus management updated for mobile edit mode; 6 new tests added (100 total passing).

### Review Findings

- [x] [Review][Defer] Status Select rendered on all viewports, not just mobile — accepted as intentional; desktop users can use either drag-and-drop or Status Select [src/features/tasks/components/TaskModal.tsx:186-203] — deferred, accepted by reviewer
- [ ] [Review][Patch] Concurrent moves corrupt task status (shared issue with 3.1): a second `moveTask` call while the first is in-flight captures the optimistic snapshot as its rollback target; rollback ordering can leave the card at the wrong status [src/store/BoardAPIContext.tsx:28-37]
- [x] [Review][Defer] No unmount guard in `handleStatusChange`: `dispatch`/`toast` fire after modal/board unmount during the 2s delay [src/features/tasks/components/TaskModal.tsx:154-158] — deferred, pre-existing pattern
- [x] [Review][Defer] `window.innerWidth < 768` focus check is sampled once on open and not reactive to orientation change or DevTools resize while modal is open [src/features/tasks/components/TaskModal.tsx:57] — deferred, minor UX edge case
