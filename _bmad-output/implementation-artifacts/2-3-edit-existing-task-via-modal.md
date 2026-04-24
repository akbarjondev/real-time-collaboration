# Story 2.3: Edit Existing Task via Modal

Status: ready-for-dev

## Blocker

**Do NOT start implementation until ALL Epic 1 stories (1.1 → 1.2 → 1.3 → 1.4) are marked `done` AND Stories 2.1 and 2.2 are `done`.**
This story reuses `TaskModal.tsx` in edit mode (built in 2.2) and `useTaskModal.ts`. It depends on `useBoardAPI().updateTask()` (1.2), `src/api/tasks.ts updateTask()` (1.3), and the modal infrastructure from 2.2. Story 2.2 must be complete so TaskModal is not being modified by two stories concurrently.

---

## Story

As a user,
I want to open a task's detail modal and edit any of its fields,
so that I can update task information without disrupting my board view.

## Acceptance Criteria

1. **Given** a task card on the board **When** the user clicks the card or presses Enter on a focused card **Then** the task detail modal opens with all existing field values pre-populated in all fields (title, description, assignee, priority, tags).

2. **Given** the task edit modal is open with pre-populated data **When** the user modifies the title and clicks "Save" **Then** the modal closes and the task card on the board reflects the updated title immediately (optimistic update).

3. **Given** a task is being edited **When** changes are saved **Then** the action is dispatched through `useBoardAPI().updateTask()` so it can be tracked by the history system in a later epic **And** the `opId` is recorded in `pendingOps` for rollback capability.

4. **Given** the user edits a task and saves **When** the operation completes successfully **Then** all edited fields (title, description, assignee, priority, tags) persist in the board state **And** the `cardPulse` in-flight animation plays during API call then stops on OP_SUCCESS.

5. **Given** `mockRequest()` throws `MockApiError` (~10%) **When** OP_ROLLBACK is dispatched **Then** the task is restored to its pre-edit state on the board **And** `toast.error('Update failed — "[title]" has been reverted')` is shown.

6. **Given** the modal is open with no changes made **When** the user presses Escape or clicks the backdrop **Then** the modal closes immediately with no guard dialog.

7. **Given** the modal is open with dirty fields **When** the user presses Escape, clicks the backdrop, or the close button **Then** the unsaved-changes guard dialog appears: "Discard changes?" with "Discard" (destructive) and "Keep editing" (primary) buttons.

8. **Given** the modal closes (save or discard) **When** focus is returned **Then** focus returns to the task card that originally opened the modal.

9. **Given** a remote update arrives on a task that is currently open in the edit modal **When** conflict is detected **Then** the conflict resolution modal (Epic 6) overlays — in this epic, this scenario simply restores the remote version via OP_ROLLBACK + toast (conflict UI is Epic 6 scope).

## Tasks / Subtasks

- [ ] Task 1: Extend `TaskModal.tsx` to support edit mode (AC: #1, #2, #4, #6, #7, #8)
  - [ ] Add `mode: 'create' | 'edit'` and `task?: Task` props to `TaskModal`
  - [ ] In edit mode: `reset(task)` on modal open to pre-populate all fields via React Hook Form
  - [ ] Change submit button label to "Save" in edit mode
  - [ ] On submit in edit mode: call `useBoardAPI().updateTask(task.id, dirtyFields)` then close modal
  - [ ] Guard logic: same as create mode — `isDirty` check before Escape/backdrop close
  - [ ] Focus return: store `triggerRef` (the card that opened the modal), restore focus on close

- [ ] Task 2: Wire card click / Enter to open edit modal (AC: #1)
  - [ ] In `TaskCard.tsx`: add `onClick` and `onKeyDown` (Enter key) handlers
  - [ ] On activation: call `useTaskModal().openEdit(task)` from `useTaskModal.ts`
  - [ ] Card must be focusable: `tabIndex={0}` on the `<article>` element, `cursor-pointer` class
  - [ ] Do NOT open the modal on card drag start — only on click/Enter

- [ ] Task 3: Implement optimistic update with rollback (AC: #2, #3, #4, #5)
  - [ ] Verify `boardReducer` handles `TASK_UPDATE` action: applies `changes` to matching task in `tasks[]`, records `pendingOps` snapshot of pre-edit task
  - [ ] Verify `src/api/tasks.ts updateTask()` is implemented (from 1.3); if stub only, implement it: `return mockRequest(() => ({ ...task, ...changes }))`
  - [ ] After OP_ROLLBACK: task card shows reverted values, toast.error fires with task title

- [ ] Task 4: Write tests (AC: all)
  - [ ] `TaskModal.test.tsx` (edit mode): test pre-population of all fields, successful save (modal closes + card updates), rollback (card reverts + toast), no guard on clean close, guard on dirty close, focus return to trigger element
  - [ ] `TaskCard.test.tsx`: test click opens modal (mock `openEdit`), Enter key opens modal, drag start does NOT open modal

## Dev Notes

### Critical Architecture Constraints

**FORBIDDEN patterns:**
- Calling `src/api/tasks.ts` directly from components — route through `useBoardAPI()` only
- Any `any` type
- `useState` for form fields — React Hook Form manages all form state
- Barrel `index.ts` exports

### Edit Mode Pre-Population

```typescript
// In TaskModal when mode === 'edit' and task is provided:
useEffect(() => {
  if (mode === 'edit' && task) {
    reset({
      title: task.title,
      description: task.description ?? '',
      assignee: task.assignee ?? '',
      priority: task.priority,
      tags: task.tags?.join(', ') ?? '',
    })
  }
}, [task, mode, reset])
```

### Optimistic Update Sequence

```
1. User submits edit form
2. modal.close() immediately
3. BoardAPI.updateTask(task.id, changes)
   a. opId = nanoid()
   b. snapshot recorded: pendingOps[opId] = { taskId: task.id, snapshot: currentTask }
   c. dispatch TASK_UPDATE { taskId, changes, opId }  ← reducer applies changes to tasks[] immediately
   d. await updateTask(task.id, changes) via src/api/tasks.ts
4a. OP_SUCCESS → pendingOps[opId] cleared → cardPulse stops
4b. MockApiError → OP_ROLLBACK → task restored from snapshot → toast.error(...)
```

**TASK_UPDATE reducer case (verify in boardReducer.ts):**
```typescript
case 'TASK_UPDATE': {
  return {
    ...state,
    tasks: state.tasks.map(t =>
      t.id === action.taskId ? { ...t, ...action.changes } : t
    ),
    pendingOps: new Map(state.pendingOps).set(action.opId, {
      id: action.opId,
      taskId: action.taskId,
      snapshot: state.tasks.find(t => t.id === action.taskId)!, // pre-edit snapshot
    }),
  }
}
```

### updateTask in src/api/tasks.ts

```typescript
// Verify this is implemented (not just a stub) from Story 1.3:
export async function updateTask(
  id: string,
  changes: Partial<Task>
): Promise<Task> {
  return mockRequest(() => ({ id, ...changes } as Task))
}
```

If it was left as `export {}` stub in 1.3, implement it now.

### Card Click / Enter Handling

```tsx
// In TaskCard.tsx:
<article
  role="article"
  tabIndex={0}
  aria-label={...}
  className="... cursor-pointer"
  onClick={() => onOpen(task)}           // prop or context-provided
  onKeyDown={(e) => {
    if (e.key === 'Enter') onOpen(task)
  }}
>
```

The `onOpen` callback should be `useTaskModal().openEdit` — pass it via prop or consume `useTaskModal` directly inside `TaskCard`. **Prefer passing as a prop** to keep `TaskCard` from depending on modal state.

### Focus Return

```typescript
// In useTaskModal.ts:
const triggerRef = useRef<HTMLElement | null>(null)

function openEdit(task: Task, trigger?: HTMLElement) {
  triggerRef.current = trigger ?? (document.activeElement as HTMLElement)
  setMode('edit')
  setEditingTask(task)
  setIsOpen(true)
}

function close() {
  setIsOpen(false)
  // Return focus after modal unmounts (next tick):
  setTimeout(() => triggerRef.current?.focus(), 0)
}
```

### Toast Message on Rollback

```typescript
toast.error(`Update failed — "${task.title}" has been reverted`)
```

### Dirty Fields Only

When submitting an edit, pass only the changed fields (`dirtyFields` from React Hook Form) to `updateTask` — this avoids unintentional overwrites:

```typescript
const { handleSubmit, formState: { dirtyFields } } = useForm(...)

const onSubmit = handleSubmit((data) => {
  const changes = Object.fromEntries(
    Object.keys(dirtyFields).map(key => [key, data[key as keyof CreateTaskForm]])
  ) as Partial<Task>
  boardAPI.updateTask(editingTask.id, changes)
  close()
})
```

### File Paths

```
src/features/tasks/components/TaskModal.tsx       ← extend with edit mode
src/features/tasks/components/TaskModal.test.tsx  ← extend tests
src/features/tasks/components/TaskCard.tsx        ← add click/Enter handler
src/features/tasks/components/TaskCard.test.tsx   ← add interaction tests
src/features/tasks/hooks/useTaskModal.ts          ← add openEdit, triggerRef
src/store/BoardAPIContext.tsx                     ← verify updateTask is wired
src/api/tasks.ts                                  ← verify updateTask is implemented
```

### References

- Edit modal journey: [Source: ux-design-specification.md#Journey 3 — Edit Task]
- Form patterns + guard: [Source: ux-design-specification.md#UX-DR16]
- Focus management: [Source: ux-design-specification.md#UX-DR17]
- BoardAPIContext.updateTask signature: [Source: architecture.md#useBoardAPI Hook Interface]
- TASK_UPDATE action shape: [Source: architecture.md#boardReducer actions]
- Optimistic sequence: [Source: architecture.md#Optimistic Update Sequence]
- Toast vocabulary: [Source: architecture.md#toast messages]

## Dev Agent Record

### Agent Model Used

_to be filled by dev agent_

### Debug Log References

### Completion Notes List

### File List
