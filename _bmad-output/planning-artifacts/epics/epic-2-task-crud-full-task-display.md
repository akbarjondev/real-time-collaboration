# Epic 2: Task CRUD & Full Task Display

Users can create, view, edit, and delete tasks with all fields (title, description, assignee, priority, tags). The task detail modal works end-to-end.

## Story 2.1: Display Full Task Card with All Visual States

As a user,
I want task cards to display all relevant fields with clear visual hierarchy and distinct states (default, hover, done),
So that I can scan the board and understand each task's details at a glance.

**Acceptance Criteria:**

**Given** a task card in its default state
**When** rendered
**Then** it displays: title (`text-sm font-medium`, dominant), priority badge (colored dot + label text, not color-alone), assignee name (`text-xs text-zinc-500`), created date right-aligned
**And** it uses `role="article"` with `aria-label` containing title, priority, and assignee

**Given** a task with `status: 'done'`
**When** rendered as a TaskCard
**Then** the card renders at 0.65 opacity with the title struck-through

**Given** a TaskCard
**When** the user hovers over it
**Then** the card border elevates and a deeper shadow appears (hover state visual)

**Given** the TaskCard component
**When** implemented
**Then** it is wrapped in `React.memo` to prevent unnecessary re-renders

**Given** an empty column after tasks are moved out
**When** the column renders
**Then** the empty state (UX-DR14) shows the correct icon, heading, sub-text, and action for the no-tasks context

---

## Story 2.2: Create New Task via Modal

As a user,
I want to create a new task with a title (required) and optional fields via a modal,
So that I can add work items to the board without leaving my current context.

**Acceptance Criteria:**

**Given** the "New Task" button in the board header or the "Add task" button in a column
**When** clicked (or keyboard shortcut `N` is pressed)
**Then** the shadcn/ui Dialog modal opens with focus automatically placed on the title field
**And** the modal contains fields: Title (required), Description (optional), Assignee (optional), Priority selector (Low/Medium/High, optional), Tags (optional)

**Given** the task creation modal is open
**When** the user submits without entering a title
**Then** the title field shows an inline validation error (`rose-600` text + `alert-circle` icon below the field) on blur
**And** no toast is shown; focus returns to the title field

**Given** a valid title is entered and the form is submitted
**When** the "Create" button is clicked or Enter is pressed
**Then** the modal closes immediately
**And** a new task card appears in the Todo column immediately (before API confirmation)

**Given** the modal has unsaved dirty field values
**When** the user presses Escape, clicks the backdrop, or the close button
**Then** an unsaved-changes guard prompt appears: "Discard changes?" with "Discard" (destructive) and "Keep editing" (primary) buttons

**Given** the form
**When** Tab is pressed
**Then** focus moves in order: Title → Priority → Assignee → Due Date → Create button (FR38, UX-DR16)

**Given** the form uses React Hook Form
**When** the component renders
**Then** no re-renders occur per keystroke (uncontrolled inputs), verified by React.memo and absence of state updates per character

---

## Story 2.3: Edit Existing Task via Modal

As a user,
I want to open a task's detail modal and edit any of its fields,
So that I can update task information without disrupting my board view.

**Acceptance Criteria:**

**Given** a task card on the board
**When** the user clicks the card or presses Enter on a focused card
**Then** the task detail modal opens with all existing field values pre-populated

**Given** the task edit modal is open with pre-populated data
**When** the user modifies the title and clicks "Save"
**Then** the modal closes and the task card on the board reflects the updated title immediately

**Given** a task is being edited
**When** changes are saved
**Then** the action is dispatched through `useBoardAPI().updateTask()` so it can be tracked by the history system in a later epic

**Given** the user edits a task and saves
**When** the operation completes successfully
**Then** all edited fields (title, description, assignee, priority, tags) persist in the board state

**Given** the modal is open with no changes made
**When** the user presses Escape or clicks the backdrop
**Then** the modal closes immediately with no guard prompt (guard only triggers if fields are dirty)

---

## Story 2.4: Delete Task

As a user,
I want to delete a task from the board,
So that I can remove completed or irrelevant work items.

**Acceptance Criteria:**

**Given** the task detail modal is open
**When** the user clicks the "Delete" destructive action
**Then** `useBoardAPI().deleteTask()` generates a `nanoid()` opId, records a task snapshot in `pendingOps`, dispatches `TASK_DELETE` to remove the task immediately, and calls `deleteTask()` in `src/api/tasks.ts` (which calls `mockRequest<void>`)
**And** the deletion is dispatched through `useBoardAPI().deleteTask()` for history tracking

**Given** the `mockRequest()` call resolves successfully (~90%)
**When** `OP_SUCCESS` is dispatched with the matching opId
**Then** the task remains deleted and the `pendingOps` entry is removed

**Given** the `mockRequest()` call throws `MockApiError` (~10%)
**When** `OP_ROLLBACK` is dispatched with the matching opId
**Then** the task is restored to its original column from the `pendingOps` snapshot
**And** `toast.error('Delete failed — "[task title]" has been restored')` is shown

**Given** a task is deleted
**When** the deletion is executed
**Then** the task no longer appears in any column
**And** the column task count badge updates immediately

**Given** a column that had one task
**When** that task is deleted
**Then** the column empty state (UX-DR14) is shown

---
