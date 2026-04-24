# Story 2.2: Create New Task via Modal

Status: review

## Blocker

**Do NOT start implementation until ALL Epic 1 stories (1.1 → 1.2 → 1.3 → 1.4) are marked `done` AND Story 2.1 is `done`.**
This story wires up the "New Task" button (stubbed in 1.4) and the "Add task" column button (non-functional in 2.1). It depends on: `useBoardAPI().createTask()` (1.2), `mockRequest` + `createTask` API (1.3), `Dialog`/`Button`/`Select`/`Badge` in `src/components/ui/` (1.4), `TaskCard` with in-flight animation (2.1), and `react-hook-form` (1.1).

---

## Story

As a user,
I want to create a new task with a title (required) and optional fields via a modal,
so that I can add work items to the board without leaving my current context.

## Acceptance Criteria

1. **Given** the "New Task" button in the board header or the "Add task" button in a column **When** clicked (or keyboard shortcut `N` is pressed) **Then** the shadcn/ui `Dialog` modal opens with focus automatically placed on the title field **And** the modal contains fields: Title (required), Description (optional), Assignee (optional), Priority selector (Low/Medium/High, optional), Tags (optional).

2. **Given** the task creation modal is open **When** the user submits without entering a title **Then** the title field shows an inline validation error: `rose-600` text + `alert-circle` Lucide icon below the field, shown on blur **And** no toast is shown **And** focus returns to the title field.

3. **Given** a valid title is entered and the form is submitted **When** the "Create" button is clicked or Enter is pressed **Then** the modal closes immediately **And** a new task card appears in the Todo column immediately (before API confirmation) with a skeleton shimmer **And** the `cardPulse` violet ring appears on the new card.

4. **Given** API call resolves successfully (~90%) **When** OP_SUCCESS is dispatched **Then** the shimmer and pulse ring are removed from the new card **And** the undo hint bar updates to: "Undo Create task '[title]'".

5. **Given** the `mockRequest()` call throws `MockApiError` (~10%) **When** OP_ROLLBACK is dispatched **Then** the new card is removed from the board **And** the modal re-opens pre-filled with the user's previously entered data (no data loss) **And** `toast.error('Create failed — "[title]" could not be saved')` is shown.

6. **Given** the modal has unsaved dirty field values **When** the user presses Escape, clicks the backdrop, or the close button **Then** an unsaved-changes guard dialog appears: "Discard changes?" with "Discard" (destructive, `rose-600`) and "Keep editing" (primary, `violet-600`) buttons.

7. **Given** the modal has no dirty fields **When** the user presses Escape or clicks the backdrop **Then** the modal closes immediately without the guard dialog.

8. **Given** the form **When** Tab is pressed **Then** focus moves in order: Title → Priority → Assignee → Due Date → Create button.

9. **Given** the form uses React Hook Form **When** the component renders **Then** no re-renders occur per keystroke (uncontrolled inputs, verified by absence of `useState` per character).

10. **Given** the keyboard shortcut `N` **When** pressed anywhere on the board (when no modal is open and no input is focused) **Then** the create task modal opens with focus on the title field.

## Tasks / Subtasks

- [x] Task 1: Create `useTaskModal.ts` hook (AC: #1, #3, #4, #5, #6, #7, #10)
  - [x] Manage modal open/close state (`isOpen`, `mode: 'create' | 'edit'`, `editingTask: Task | null`)
  - [x] Expose: `openCreate()`, `openEdit(task: Task)`, `close()`
  - [x] Wire keyboard shortcut `N` via `useKeyboardShortcut` from `@/shared/hooks/useKeyboardShortcut` — only fires when no modal is open and no input/textarea is focused
  - [x] Handle unsaved-changes guard: track form `isDirty` from React Hook Form; if dirty + close attempted, show guard dialog
  - [x] Pre-fill failure recovery: store last submitted form values for re-opening on OP_ROLLBACK

- [x] Task 2: Implement `TaskModal.tsx` — create mode (AC: #1, #2, #3, #6, #7, #8, #9)
  - [x] Use shadcn `Dialog` from `@/components/ui/dialog`
  - [x] Use `react-hook-form` (`useForm`) — uncontrolled inputs throughout, no `useState` per field
  - [x] Fields: Title (`<input>`, required), Description (`<textarea>`, optional), Assignee (`<input>`, optional), Priority (`<Select>` from shadcn, optional, default unset), Tags (`<input>` comma-separated, optional)
  - [x] Validation: title required, error on blur (not on submit) — `rose-600` text + `alert-circle` icon below field
  - [x] Tab order: Title → Priority → Assignee → Due Date → Create button (use `tabIndex` if needed)
  - [x] Focus: `autoFocus` on title field on modal open
  - [x] On submit: call `useBoardAPI().createTask(formData)` then close modal immediately
  - [x] On close with dirty fields: show guard dialog (managed by `useTaskModal`)
  - [x] Focus management: on modal close, return focus to the element that opened it

- [x] Task 3: Wire "New Task" button and "Add task" button (AC: #1, #10)
  - [x] In `KanbanBoard.tsx` header: wire "New Task" button click to `useTaskModal().openCreate()`
  - [x] In `BoardColumn.tsx` empty state: wire "Add task" ghost button click to `useTaskModal().openCreate()` (pre-set column/status if relevant)
  - [x] Add `Tooltip` (shadcn) on "New Task" button: "New task (N)"

- [x] Task 4: Implement optimistic creation with rollback recovery (AC: #3, #4, #5)
  - [x] `createTask` in `BoardAPIContext`: generate `opId = nanoid()`, dispatch `TASK_CREATE` optimistically, call `src/api/tasks.ts createTask()`
  - [x] On OP_SUCCESS: standard flow — shimmer/pulse removed
  - [x] On OP_ROLLBACK: re-open modal pre-filled with user's data, show error toast
  - [x] Verify `boardReducer` handles `TASK_CREATE` action correctly (task added to `tasks[]` immediately, `pendingOps` entry created)

- [x] Task 5: Write tests (AC: all)
  - [x] `TaskModal.test.tsx`: test create mode render, title validation (blur error), successful submit (modal closes + card appears), dirty guard (Escape triggers guard), clean guard (Escape closes immediately), tab order, React Hook Form no-re-render
  - [x] `useTaskModal.test.ts`: test `N` shortcut opens modal, shortcut is ignored when input is focused

## Dev Notes

### Critical Architecture Constraints

**FORBIDDEN patterns:**
- `useState` for form field values — React Hook Form manages all form state (uncontrolled inputs)
- Calling `src/api/tasks.ts` directly from components or hooks — route through `useBoardAPI()` only
- Calling `mockRequest` directly — only through `src/api/tasks.ts`
- Any `any` type — strict TypeScript throughout
- Barrel `index.ts` exports — direct imports only

### React Hook Form Usage

```typescript
import { useForm } from 'react-hook-form'

type CreateTaskForm = {
  title: string
  description?: string
  assignee?: string
  priority?: Priority
  tags?: string
}

const { register, handleSubmit, formState: { errors, isDirty }, reset } = useForm<CreateTaskForm>({
  defaultValues: { title: '', description: '', assignee: '', priority: undefined, tags: '' }
})
```

**Key rules:**
- Use `register('title', { required: 'Title is required' })` — NOT `value={...}` / `onChange={...}`
- Errors displayed on blur: set `mode: 'onBlur'` in `useForm` config
- `isDirty` from `formState` drives the unsaved-changes guard
- `reset(savedValues)` is used to re-open modal pre-filled after OP_ROLLBACK

### Optimistic Create Sequence

```
1. User submits form
2. modal.close() immediately (UX — don't wait for API)
3. BoardAPI.createTask({ ...formData, status: 'todo' })
   a. opId = nanoid()
   b. task = { ...formData, id: nanoid(), status: 'todo', createdAt: new Date().toISOString() }
   c. dispatch TASK_CREATE { task, opId }  ← reducer adds to tasks[], records pendingOps snapshot
   d. await createTask(task) via src/api/tasks.ts (mockRequest<Task>)
4a. OP_SUCCESS → pendingOps[opId] cleared → cardPulse stops
4b. MockApiError → OP_ROLLBACK → task removed from board → modal re-opens with saved form values → toast.error(...)
```

**Rollback re-open pattern:**
```typescript
// In useTaskModal or the caller:
try {
  await boardAPI.createTask(formData)
} catch (e) {
  if (e instanceof MockApiError) {
    openCreate() // re-opens modal
    reset(savedFormValues) // pre-fill with user's data
    toast.error(`Create failed — "${formData.title}" could not be saved`)
  }
}
```

### Keyboard Shortcut `N`

```typescript
// useKeyboardShortcut usage (hook from src/shared/hooks/useKeyboardShortcut.ts):
useKeyboardShortcut('n', () => {
  // Only fire if no modal is open AND focused element is not an input/textarea/select
  if (!isOpen && !isFormElementFocused()) {
    openCreate()
  }
})

function isFormElementFocused(): boolean {
  const tag = document.activeElement?.tagName.toLowerCase()
  return tag === 'input' || tag === 'textarea' || tag === 'select'
}
```

### Unsaved-Changes Guard Dialog

```tsx
{showGuard && (
  <Dialog open>
    <DialogContent>
      <DialogTitle>Discard changes?</DialogTitle>
      <DialogFooter>
        <Button variant="ghost" onClick={keepEditing}>Keep editing</Button>
        <Button variant="destructive" onClick={discard}>Discard</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
)}
```

Note: guard fires ONLY if `isDirty` is `true` — verified by React Hook Form's `formState.isDirty`.

### Validation Error Display

```tsx
{errors.title && (
  <p className="mt-1 flex items-center gap-1 text-xs text-rose-600">
    <AlertCircle className="h-3 w-3" />
    {errors.title.message}
  </p>
)}
```

### Toast Message

On rollback (OP_ROLLBACK in TASK_CREATE scenario):
```typescript
toast.error(`Create failed — "${task.title}" could not be saved`)
```

On success: no toast — card appearance is feedback enough.

### File Paths

```
src/features/tasks/components/TaskModal.tsx       ← PRIMARY file (create mode)
src/features/tasks/components/TaskModal.test.tsx  ← co-located test
src/features/tasks/hooks/useTaskModal.ts          ← modal state + keyboard shortcut
src/features/board/components/KanbanBoard.tsx     ← wire "New Task" button
src/features/board/components/BoardColumn.tsx     ← wire "Add task" button
src/store/BoardAPIContext.tsx                     ← createTask action creator (already implemented in 1.2; verify TASK_CREATE is wired)
src/api/tasks.ts                                  ← createTask API function (already implemented in 1.3)
```

### Task Shape for createTask

```typescript
// What BoardAPI.createTask receives from the form:
type CreateTaskInput = Omit<Task, 'id' | 'createdAt'>

// What BoardAPIContext produces and dispatches:
const task: Task = {
  ...input,
  id: nanoid(),
  createdAt: new Date().toISOString(),
}
dispatch({ type: 'TASK_CREATE', task, opId: nanoid() })
```

### References

- Task creation journey: [Source: ux-design-specification.md#Journey 2 — Create Task]
- Form patterns + validation: [Source: ux-design-specification.md#UX-DR16]
- Optimistic create UX (shimmer + rollback re-open): [Source: ux-design-specification.md#UX-DR12]
- Keyboard shortcuts: [Source: ux-design-specification.md#UX-DR13]
- Toast tiers: [Source: ux-design-specification.md#UX-DR5]
- BoardAPIContext.createTask signature: [Source: architecture.md#useBoardAPI Hook Interface]
- TASK_CREATE action shape: [Source: architecture.md#boardReducer actions]
- React Hook Form justification: [Source: architecture.md#TaskModal]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- `BoardAPIContext` was previously sync-only; made all CRUD methods async and wired actual `src/api/tasks.ts` calls
- Fixed `updateTask` signature in `src/api/tasks.ts`: changed from `(mergedTask: Task)` to `(id: string, changes: Partial<Task>)`
- Exported `BoardAPIContext` context object for test-time provider injection
- `useKeyboardShortcut` implemented from empty stub; `useTaskModal` implemented from empty stub

### Completion Notes List

- `useKeyboardShortcut` hook: fires handler on key match, ignores Ctrl/Meta/Alt combos
- `useTaskModal` hook: manages isOpen/mode/editingTask/prefillValues state, triggerRef for focus return, N shortcut integration
- `TaskModal` component: create + edit + delete modes, react-hook-form (uncontrolled), onBlur validation, unsaved-changes guard dialog, optimistic create/update with rollback re-open
- `KanbanBoard`: wired "New Task" button + Tooltip, renders TaskModal, passes callbacks to BoardColumn
- `BoardColumn`: wired "Add task" button, accepts onOpenCreate/onOpenEdit props, passes onOpen to TaskCard
- `BoardAPIContext`: createTask/updateTask/deleteTask are now async with OP_SUCCESS/OP_ROLLBACK dispatch + re-throw on failure
- 57 total tests passing (25 TaskCard + 10 useTaskModal + 22 TaskModal)

### File List

- src/features/tasks/hooks/useTaskModal.ts (created)
- src/features/tasks/hooks/useTaskModal.test.ts (created)
- src/features/tasks/components/TaskModal.tsx (created)
- src/features/tasks/components/TaskModal.test.tsx (created)
- src/shared/hooks/useKeyboardShortcut.ts (implemented from stub)
- src/store/BoardAPIContext.tsx (modified — async methods, API calls, exported context)
- src/api/tasks.ts (modified — updateTask signature)
- src/features/board/components/KanbanBoard.tsx (modified — modal wiring)
- src/features/board/components/BoardColumn.tsx (modified — callback props)

## Change Log

- 2026-04-24: Implemented Story 2.2 — Create Task Modal. Wired full async API loop in BoardAPIContext. 57 tests passing.
