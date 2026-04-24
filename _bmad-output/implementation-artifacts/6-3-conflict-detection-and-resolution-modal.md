# Story 6.3: Conflict Detection and Resolution Modal

Status: ready-for-dev

## Blocker

**Stories 6.1 and 6.2 must both be `done` before starting this story.**
`ConflictModal` reads `ConflictContext` which is populated by `CONFLICT_DETECTED` (Story 6.1). The warning toast for conflict (Story 6.2's notification tier) belongs to this story's toast call.

---

## Story

As a user editing a task,
I want to see a clear comparison when a remote change conflicts with my edits,
so that I can choose which version to keep without losing either side's data.

## Acceptance Criteria

1. **Given** a remote update targets a task that is currently open in the edit modal **When** `CONFLICT_DETECTED` is dispatched **Then** `ConflictModal` appears overlaid above the edit modal displaying both versions side by side.

2. **Given** `ConflictModal` is open **When** rendered **Then** it has `role="alertdialog"`, an accessible title `aria-labelledby`, a focus trap, and Escape key does NOT close it (the user must make an explicit choice).

3. **Given** `ConflictModal` is open **When** the user clicks "Keep mine" **Then** `CONFLICT_RESOLVE_MINE` is dispatched, `conflict` state clears to `null`, the edit modal remains open with the user's unchanged values, and focus returns to the edit modal.

4. **Given** `ConflictModal` is open **When** the user clicks "Take theirs" **Then** `CONFLICT_RESOLVE_THEIRS` is dispatched, `conflict` state clears to `null`, the edit modal re-populates with the remote task's field values (via the existing `reset()` useEffect in `TaskModal`), and focus returns to the edit modal.

5. **Given** `ConflictModal` is open **When** the user clicks "Cancel" **Then** the conflict is dismissed without applying either version — `CONFLICT_RESOLVE_MINE` is dispatched (local task unchanged), the ConflictModal closes, and the edit modal retains the user's in-progress edits.

6. **Given** `ConflictModal` is displaying both versions **When** a field value differs between local and remote **Then** that field row is visually highlighted (amber-50 background + amber-200 border) in both columns.

7. **Given** `ConflictModal` is open **When** it first mounts **Then** focus moves to the "Keep mine" primary button.

8. **Given** a conflict is detected **When** `ConflictModal` first appears **Then** `toast.warning('"[task title]" was changed by another user while you were editing', { duration: 6000 })` fires exactly once.

9. **Given** `ConflictModal` closes (any resolution) **When** it unmounts **Then** the `ConflictContext` value is `null` and no residual conflict state remains.

## Tasks / Subtasks

- [ ] Task 1: Implement `ConflictModal` component (AC: #1, #2, #3, #4, #5, #6, #7)
  - [ ] Replace `export {}` stub in `src/features/realtime/components/ConflictModal.tsx`
  - [ ] Accept no props — reads `ConflictContext` directly via `useConflict()`
  - [ ] Call `useBoardDispatch()` for direct dispatch access
  - [ ] Render nothing when `conflict === null` (conditional rendering, not unmount guard)
  - [ ] Use shadcn `Dialog` with `open={conflict !== null}` and `onOpenChange` disabled (no dismiss on overlay click or Escape)
  - [ ] Set `role="alertdialog"` on the `DialogContent` element via the `role` prop override
  - [ ] Title: "Conflict Detected" in `DialogTitle`
  - [ ] Two-column grid: left = "My version" (localTask fields), right = "Their version" (remoteTask fields)
  - [ ] Render these fields: Title, Description, Assignee, Priority, Tags
  - [ ] Highlight differing fields: wrap each row in a `<div>` that gets `bg-amber-50 border border-amber-200 rounded px-2 py-1` when field values differ
  - [ ] Button row: "Keep mine" (primary, violet-600), "Take theirs" (secondary, white+zinc border), "Cancel" (ghost)
  - [ ] `keepMineRef = useRef<HTMLButtonElement>(null)` — focus on mount via `useEffect`
  - [ ] "Keep mine" handler: `dispatch({ type: 'CONFLICT_RESOLVE_MINE', taskId: conflict.taskId })` then restore focus to edit modal trigger
  - [ ] "Take theirs" handler: `dispatch({ type: 'CONFLICT_RESOLVE_THEIRS', taskId: conflict.taskId, remoteTask: conflict.remoteTask })` then restore focus to edit modal trigger
  - [ ] "Cancel" handler: `dispatch({ type: 'CONFLICT_RESOLVE_MINE', taskId: conflict.taskId })` then restore focus to edit modal trigger

- [ ] Task 2: Show warning toast when conflict is detected (AC: #8)
  - [ ] Add `useEffect([conflict])` in `ConflictModal.tsx` that fires `toast.warning(...)` when `conflict` transitions from `null` to non-null
  - [ ] Toast message: `"${conflict.localTask.title}" was changed by another user while you were editing`
  - [ ] Duration: 6000ms (warning tier per design spec)

- [ ] Task 3: Handle "Take theirs" — TaskModal re-population (AC: #4)
  - [ ] Verify that `TaskModal.tsx` already has a `useEffect([task, reset])` that calls `reset(...)` when `task` changes
  - [ ] Verify that `CONFLICT_RESOLVE_THEIRS` in `boardReducer` updates `tasks[]` with the remote task version
  - [ ] Verify the `editingTask` prop passed to `TaskModal` from `KanbanBoard` comes from `useTaskModal().editingTask`, which is set via `openEdit(task)` and is a reference to the task object at open-time — NOT a live selector
  - [ ] If `TaskModal` uses `editingTask` as a fixed snapshot (not reactive): update `TaskModal` to accept `task` prop that may change OR derive the live task from `useTasks().find(t => t.id === editingTask?.id)` inside the modal's useEffect
  - [ ] Document finding and approach in Completion Notes — this is the most likely integration point needing a patch

- [ ] Task 4: Render `ConflictModal` in `KanbanBoard.tsx` (AC: #1, #9)
  - [ ] Import `ConflictModal` from `@/features/realtime/components/ConflictModal`
  - [ ] Render `<ConflictModal />` after `<TaskModal />` in `KanbanBoard.tsx` JSX
  - [ ] No props needed — ConflictModal is self-contained via ConflictContext

- [ ] Task 5: Focus management — restore focus to edit modal after resolution (AC: #3, #4, #5, #7)
  - [ ] Add `conflictTriggerRef = useRef<HTMLElement | null>(null)` in `ConflictModal.tsx`
  - [ ] In the `useEffect([conflict])` that detects conflict onset: capture `document.activeElement` as `conflictTriggerRef.current` BEFORE the modal steals focus
  - [ ] In all three resolution handlers: after dispatch, call `setTimeout(() => conflictTriggerRef.current?.focus(), 0)` to return focus to the edit modal's focused element

- [ ] Task 6: Write tests (AC: all)
  - [ ] Create `src/features/realtime/components/ConflictModal.test.tsx`
  - [ ] Test: `conflict === null` → renders nothing
  - [ ] Test: conflict non-null → modal renders with both versions' fields
  - [ ] Test: differing field → `bg-amber-50` class present on that row; matching field → no highlight
  - [ ] Test: "Keep mine" → dispatches `CONFLICT_RESOLVE_MINE`
  - [ ] Test: "Take theirs" → dispatches `CONFLICT_RESOLVE_THEIRS` with correct `remoteTask`
  - [ ] Test: "Cancel" → dispatches `CONFLICT_RESOLVE_MINE`
  - [ ] Test: warning toast fires once on conflict onset, not on re-render

---

## Dev Notes

### ConflictModal — Component Structure

```tsx
// src/features/realtime/components/ConflictModal.tsx
import { useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { useConflict } from '@/store/ConflictContext'
import { useBoardDispatch } from '@/store/BoardDispatchContext'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { cn } from '@/shared/utils/cn'
import type { Task } from '@/types/task.types'

type FieldKey = keyof Pick<Task, 'title' | 'description' | 'assignee' | 'priority' | 'tags'>

const DISPLAY_FIELDS: { key: FieldKey; label: string }[] = [
  { key: 'title', label: 'Title' },
  { key: 'description', label: 'Description' },
  { key: 'assignee', label: 'Assignee' },
  { key: 'priority', label: 'Priority' },
  { key: 'tags', label: 'Tags' },
]

function formatFieldValue(value: Task[FieldKey]): string {
  if (value === undefined || value === null) return '—'
  if (Array.isArray(value)) return value.map(t => t.label).join(', ') || '—'
  return String(value)
}

function fieldsDiffer(local: Task, remote: Task, key: FieldKey): boolean {
  return formatFieldValue(local[key]) !== formatFieldValue(remote[key])
}

export function ConflictModal() {
  const conflict = useConflict()
  const dispatch = useBoardDispatch()
  const keepMineRef = useRef<HTMLButtonElement>(null)
  const conflictTriggerRef = useRef<HTMLElement | null>(null)

  // Capture focus target and fire warning toast on conflict onset
  useEffect(() => {
    if (!conflict) return
    conflictTriggerRef.current = document.activeElement as HTMLElement
    toast.warning(
      `"${conflict.localTask.title}" was changed by another user while you were editing`,
      { duration: 6000 },
    )
  }, [conflict?.taskId]) // key on taskId — fires once per unique conflict, not on re-render

  // Move focus to "Keep mine" button when modal opens
  useEffect(() => {
    if (conflict) {
      setTimeout(() => keepMineRef.current?.focus(), 0)
    }
  }, [conflict?.taskId])

  if (!conflict) return null

  function restoreFocus() {
    setTimeout(() => conflictTriggerRef.current?.focus(), 0)
  }

  function handleKeepMine() {
    dispatch({ type: 'CONFLICT_RESOLVE_MINE', taskId: conflict!.taskId })
    restoreFocus()
  }

  function handleTakeTheirs() {
    dispatch({
      type: 'CONFLICT_RESOLVE_THEIRS',
      taskId: conflict!.taskId,
      remoteTask: conflict!.remoteTask,
    })
    restoreFocus()
  }

  function handleCancel() {
    dispatch({ type: 'CONFLICT_RESOLVE_MINE', taskId: conflict!.taskId })
    restoreFocus()
  }

  const { localTask, remoteTask } = conflict

  return (
    <Dialog open modal>
      <DialogContent
        role="alertdialog"
        aria-labelledby="conflict-modal-title"
        onEscapeKeyDown={(e) => e.preventDefault()} // Escape must not dismiss
        onInteractOutside={(e) => e.preventDefault()} // Overlay click must not dismiss
        className="max-w-2xl"
      >
        <DialogHeader>
          <DialogTitle id="conflict-modal-title">Conflict Detected</DialogTitle>
          <p className="text-sm text-zinc-500">
            Another user edited this task while you were working on it. Choose which version to keep.
          </p>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <h3 className="text-sm font-semibold text-zinc-700 mb-2">My version</h3>
            <div className="space-y-1">
              {DISPLAY_FIELDS.map(({ key, label }) => {
                const differs = fieldsDiffer(localTask, remoteTask, key)
                return (
                  <div
                    key={key}
                    className={cn(
                      'rounded px-2 py-1 text-sm',
                      differs && 'bg-amber-50 border border-amber-200',
                    )}
                  >
                    <span className="text-xs text-zinc-500 block">{label}</span>
                    <span className="text-zinc-900">{formatFieldValue(localTask[key])}</span>
                  </div>
                )
              })}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-zinc-700 mb-2">Their version</h3>
            <div className="space-y-1">
              {DISPLAY_FIELDS.map(({ key, label }) => {
                const differs = fieldsDiffer(localTask, remoteTask, key)
                return (
                  <div
                    key={key}
                    className={cn(
                      'rounded px-2 py-1 text-sm',
                      differs && 'bg-amber-50 border border-amber-200',
                    )}
                  >
                    <span className="text-xs text-zinc-500 block">{label}</span>
                    <span className="text-zinc-900">{formatFieldValue(remoteTask[key])}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button variant="ghost" onClick={handleCancel}>
            Cancel
          </Button>
          <Button variant="outline" onClick={handleTakeTheirs}>
            Take theirs
          </Button>
          <Button
            ref={keepMineRef}
            className="bg-violet-600 hover:bg-violet-700 text-white focus-visible:ring-2 focus-visible:ring-violet-500"
            onClick={handleKeepMine}
          >
            Keep mine
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

**`non-null assertion`:** Inside handlers, `conflict!` is safe — the handler can only be called while the modal is rendered, which requires `conflict !== null`. TypeScript cannot narrow this automatically inside callbacks, so the `!` assertion is the correct pattern here.

### Preventing Escape / Overlay Dismiss

The shadcn `Dialog` (built on Radix UI `Dialog.Root`) exposes `onEscapeKeyDown` and `onInteractOutside` on `DialogContent`. Both must call `e.preventDefault()` to block the default Radix close behavior:

```tsx
onEscapeKeyDown={(e) => e.preventDefault()}
onInteractOutside={(e) => e.preventDefault()}
```

This is required by AC #2: the user must make an explicit choice — accidental dismissal would leave the conflict state unresolved. The `CONFLICT_RESOLVE_MINE` action for "Cancel" provides the safe exit path.

**Note:** `@base-ui/react` Dialog primitives follow the same pattern if shadcn `Dialog` is later swapped. The event prevention approach is identical.

### "Take Theirs" — TaskModal Re-Population

`CONFLICT_RESOLVE_THEIRS` updates `boardState.tasks` with the remote task. The question is whether `TaskModal` sees this update.

`KanbanBoard.tsx` passes `task={editingTask}` where `editingTask` comes from `useTaskModal()`. `useTaskModal` stores the task at `openEdit(task)` call time and never updates it reactively. This means `TaskModal` receives a stale snapshot after `CONFLICT_RESOLVE_THEIRS`.

**Fix required in Task 3:** In `TaskModal.tsx`, derive the live task from `useTasks()`:

```typescript
// At the top of TaskModal, alongside the existing task prop:
const liveTasks = useTasks()
const liveTask = mode === 'edit' && task
  ? (liveTasks.find(t => t.id === task.id) ?? task)
  : task

// Then use liveTask in the useEffect that calls reset():
useEffect(() => {
  if (isOpen && mode === 'edit' && liveTask) {
    reset({
      title: liveTask.title,
      description: liveTask.description ?? '',
      // ...
    })
  }
}, [isOpen, mode, liveTask, reset])
```

This makes `TaskModal` reactive to `CONFLICT_RESOLVE_THEIRS` without changing the component's external API. The `task` prop still identifies which task to edit; `liveTask` is the up-to-date version for form population.

**Impact:** This change only affects the `reset()` useEffect. The `handleDelete` and `handleSubmit` paths already capture task data at submission time, so they are unaffected.

### `formatFieldValue` — Tags Array Handling

`Task.tags` is `Tag[]` where `Tag = { id: string; label: string }`. `formatFieldValue` maps to `tag.label` joined by `', '`. Two tasks with the same tags in different order will appear equal in the diff — this is acceptable for MVP.

### useEffect Dependency: `conflict?.taskId` Not `conflict`

```typescript
useEffect(() => {
  if (!conflict) return
  // ...
}, [conflict?.taskId])
```

Keying on `conflict?.taskId` rather than `conflict` prevents the effect from re-running when other fields of the conflict object change (e.g., if `localTask` reference updates). The toast fires once per unique conflicting task, not on every re-render of the modal.

**ESLint note:** `react-hooks/exhaustive-deps` may flag `conflict?.taskId` as incomplete deps. The correct suppression comment:

```typescript
// eslint-disable-next-line react-hooks/exhaustive-deps
// Intentional: fire once per unique conflict (keyed on taskId), not on every re-render
}, [conflict?.taskId])
```

### Rendering Location in KanbanBoard.tsx

```tsx
// After TaskModal in KanbanBoard.tsx return:
<TaskModal
  isOpen={isOpen}
  mode={mode}
  task={editingTask}
  prefillValues={prefillValues}
  onClose={close}
  onOpenCreate={openCreate}
/>
<ConflictModal />  {/* ← add this line */}
```

`ConflictModal` is self-contained — it reads `ConflictContext` internally. No props needed. Rendering it after `TaskModal` in the DOM order means it stacks above `TaskModal` in z-index (both are Radix Dialog portals, z-ordering is managed by Radix automatically via stacking contexts).

### Button Hierarchy — Three Buttons

Per design system rules: never two primary buttons side by side.

- "Keep mine" = **primary** (violet-600, action is safe — preserves user's work)
- "Take theirs" = **secondary** (white + zinc border, replaces user's edits)
- "Cancel" = **ghost** (transparent, deferred decision)

Order: Cancel (leftmost, ghost) → Take theirs (secondary) → Keep mine (primary, rightmost, receives initial focus).

### boardReducer — CONFLICT_RESOLVE_MINE vs Cancel

Both "Keep mine" and "Cancel" dispatch `CONFLICT_RESOLVE_MINE`. The reducer sets `conflict: null` and leaves `tasks[]` unchanged — both actions are identical in state terms. The semantic difference is:
- "Keep mine" = affirmative: user explicitly chose their version
- "Cancel" = deferral: user wants to keep editing (no version preference expressed)

For MVP, treating them identically in state is correct. A future enhancement could add a `CONFLICT_DISMISS` action for semantic clarity, but it would produce identical state transitions.

### File Paths

```
src/features/realtime/components/ConflictModal.tsx          ← replace stub (primary deliverable)
src/features/realtime/components/ConflictModal.test.tsx     ← new test file
src/features/board/components/KanbanBoard.tsx               ← add <ConflictModal /> render
src/features/tasks/components/TaskModal.tsx                 ← patch: derive liveTask from useTasks()
src/features/tasks/components/TaskModal.test.tsx            ← extend: add "Take theirs" re-population test
_bmad-output/implementation-artifacts/sprint-status.yaml   ← update 6-3 to in-progress
```

### Forbidden Patterns

- `role="dialog"` — conflict modal requires `role="alertdialog"` (interrupts user flow)
- Closing on Escape or overlay click — the user MUST make an explicit choice
- `dispatch` called from `BoardAPIContext` — use `useBoardDispatch()` for all conflict resolutions
- Pushing `CONFLICT_RESOLVE_MINE` or `CONFLICT_RESOLVE_THEIRS` to history stack — these are system actions
- `dangerouslySetInnerHTML` for diff highlighting — use Tailwind class conditionals on wrapper divs
- `toast.error(...)` for conflict — warning tier (amber, 6s) is correct; conflict is informational, not an error
- Hardcoded hex colors in className — use Tailwind tokens (`bg-amber-50`, `border-amber-200`, etc.)

### Verification Checklist

```
1. npm run dev → open any task in edit modal → wait for conflict simulation tick
   → ConflictModal appears; both versions visible; differing priority field highlighted amber
2. Click "Keep mine" → ConflictModal closes → edit modal remains open with user's values unchanged
3. Repeat step 1 → click "Take theirs" → edit modal form re-populates with remote task values
4. Repeat step 1 → click "Cancel" → ConflictModal closes → edit modal remains with user's edits
5. Tab through ConflictModal → focus cycles through Cancel / Take theirs / Keep mine only (no leak to edit modal below)
6. Press Escape during ConflictModal → modal stays open (no dismiss)
7. Click outside ConflictModal → modal stays open (overlay click ignored)
8. Warning toast appears once per conflict; closing and reopening edit modal then getting a new conflict produces a new toast
9. npm run test → all ConflictModal.test.tsx cases pass
10. tsc --noEmit → zero errors
11. npm run lint → zero warnings
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
