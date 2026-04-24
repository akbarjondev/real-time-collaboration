# Story 5.3: Tiered Toast Notification System

Status: ready-for-dev

## Blocker

None — ready to implement. Story 5.1 and 5.2 can proceed concurrently.

---

## Story

As a user,
I want notifications that clearly distinguish between recoverable info, successful actions, and errors that need my attention,
so that I can quickly understand what happened and decide whether to act.

## Acceptance Criteria

1. **Given** a task is successfully created **When** `OP_SUCCESS` fires for a create operation **Then** a success toast appears: `'Task "[title]" created'` — emerald, 3 seconds auto-dismiss.
2. **Given** a task is successfully updated **When** `OP_SUCCESS` fires for an update operation **Then** a success toast appears: `'Task "[title]" updated'` — emerald, 3 seconds auto-dismiss.
3. **Given** any operation fails **When** `OP_ROLLBACK` is dispatched **Then** an error toast appears naming the exact task and action: e.g. `'Create failed — "My task" could not be saved'` — rose, persistent (no auto-dismiss), user must manually dismiss.
4. **Given** a remote simulation update arrives (Epic 6 stub) **When** `REMOTE_UPDATE` is dispatched **Then** an info toast appears: `'"[title]" was updated remotely'` — zinc, 4 seconds auto-dismiss. (Stub implementation — wired in Epic 6 Story 6.1.)
5. **Given** a conflict is detected (Epic 6 stub) **When** conflict state is set **Then** a warning toast appears: `'Conflict detected on "[title]"'` — amber, 6 seconds auto-dismiss. (Stub implementation — wired in Epic 6 Story 6.3.)
6. **Given** more than 3 toasts are queued **When** a new toast is triggered **Then** the oldest toast is dismissed to keep at most 3 visible at any time (`visibleToasts={3}` on `<Toaster>`).
7. **Given** all existing error toast calls across the codebase **When** audited **Then** every `toast.error()` call names the specific task title AND the specific action — the message `'Something went wrong'` is absent from the entire codebase.
8. **Given** all toast calls **When** audited **Then** the correct Sonner API is used: `toast.error(msg, { duration: Infinity })` for errors; `toast.success(msg, { duration: 3000 })` for success; `toast.info(msg, { duration: 4000 })` for info; `toast.warning(msg, { duration: 6000 })` for warnings.

## Tasks / Subtasks

- [ ] Task 1: Audit all existing toast calls for correctness (AC: #3, #7, #8)
  - [ ] Search codebase for all `toast.error(`, `toast.success(`, `toast.info(`, `toast.warning(` calls
  - [ ] Verify every `toast.error` call names the task title and action in the message string
  - [ ] Verify `toast.error` calls pass `{ duration: Infinity }` — confirm Sonner uses Infinity for persistent toasts (Sonner's default for `.error()` is already persistent with `richColors`, but make explicit)
  - [ ] Verify no call uses `toast.error('Something went wrong')` or any equivalent unnamed error
  - [ ] Document all call sites found and their current message strings

- [ ] Task 2: Add success toasts for create and update operations (AC: #1, #2)
  - [ ] In `TaskModal.tsx` `onSubmit`, capture `taskTitle` from `data.title` BEFORE `onClose()` (already done for update — verify for create too)
  - [ ] In `TaskModal.tsx` `onSubmit` for `mode === 'create'`: after `await boardAPI.createTask(...)` resolves (no error), call `toast.success(\`Task "${data.title}" created\`, { duration: 3000 })`
  - [ ] In `TaskModal.tsx` `onSubmit` for `mode === 'edit'`: after `await boardAPI.updateTask(...)` resolves (no error), call `toast.success(\`Task "${taskTitle}" updated\`, { duration: 3000 })`
  - [ ] Do NOT add success toast for moveTask or deleteTask — move is confirmed visually by the card position; delete is confirmed by card disappearance; these do not need success toasts per spec

- [ ] Task 3: Configure `<Toaster>` with `visibleToasts` and explicit duration options (AC: #6, #8)
  - [ ] In `src/shared/components/ToastProvider.tsx`, update `<Toaster>` to include `visibleToasts={3}`
  - [ ] Current: `<Toaster position="bottom-right" richColors />`
  - [ ] Updated: `<Toaster position="bottom-right" richColors visibleToasts={3} />`
  - [ ] Do NOT add `toastOptions` with a global default duration — each call site passes its own duration explicitly

- [ ] Task 4: Stub info toast function for Epic 6 remote updates (AC: #4)
  - [ ] Create `src/features/realtime/hooks/useRealtimeToast.ts` (stub only — actual wiring in Epic 6)
  - [ ] Export `function showRemoteUpdateToast(taskTitle: string): void` that calls `toast.info(\`"${taskTitle}" was updated remotely\`, { duration: 4000 })`
  - [ ] Do NOT call this function anywhere yet — it is wired by `useRealtimeSimulation` in Story 6.1

- [ ] Task 5: Stub warning toast function for Epic 6 conflict detection (AC: #5)
  - [ ] In `src/features/realtime/hooks/useRealtimeToast.ts` (same file as Task 4), add `export function showConflictToast(taskTitle: string): void` that calls `toast.warning(\`Conflict detected on "${taskTitle}"\`, { duration: 6000 })`
  - [ ] Do NOT call this function anywhere yet — it is wired by conflict detection logic in Story 6.1/6.3

- [ ] Task 6: Write tests (AC: #1, #2, #3, #6, #7)
  - [ ] In `TaskModal.test.tsx`: add test for create success path — mock API success → verify `toast.success` called with correct message
  - [ ] In `TaskModal.test.tsx`: add test for update success path — mock API success → verify `toast.success` called with correct message
  - [ ] In `TaskModal.test.tsx`: verify existing create-failure test uses `toast.error` with named message (not generic)
  - [ ] In `TaskModal.test.tsx`: verify existing update-failure test uses `toast.error` with named message
  - [ ] In `useBoardDnd.test.ts`: verify move-failure toast uses named message

---

## Dev Notes

### Sonner API Reference

```ts
// Error — persistent, user must dismiss
toast.error('Create failed — "My Task" could not be saved', { duration: Infinity })

// Success — 3 seconds
toast.success('Task "My Task" created', { duration: 3000 })

// Info — 4 seconds (remote updates)
toast.info('"My Task" was updated remotely', { duration: 4000 })

// Warning — 6 seconds (conflict)
toast.warning('Conflict detected on "My Task"', { duration: 6000 })
```

Sonner's `richColors` prop on `<Toaster>` automatically styles `.error` as rose, `.success` as emerald, `.info` as zinc, `.warning` as amber. No additional className required.

### Toast Message Vocabulary (Required Format)

| Trigger | Tier | Message Pattern | Duration |
|---------|------|----------------|----------|
| Create success | success | `Task "[title]" created` | 3000ms |
| Update success | success | `Task "[title]" updated` | 3000ms |
| Create failure | error | `Create failed — "[title]" could not be saved` | Infinity |
| Update failure | error | `Update failed — "[title]" has been reverted` | Infinity |
| Delete failure | error | `Delete failed — "[title]" has been restored` | Infinity |
| Move failure | error | `Move failed — "[title]" has been reverted` | Infinity |
| Remote update (Epic 6) | info | `"[title]" was updated remotely` | 4000ms |
| Conflict (Epic 6) | warning | `Conflict detected on "[title]"` | 6000ms |

The `FORBIDDEN` message is: `'Something went wrong'` — never use this pattern.

### Where Success Toasts Are Called

Success toasts are called in `TaskModal.tsx` in the `onSubmit` handler, AFTER the await resolves (inside the `try` block, after the API call). They must NOT be called from `BoardAPIContext.tsx` — callers handle presentation; the context layer only throws on failure.

```ts
// In TaskModal.tsx onSubmit, mode === 'create'
try {
  await boardAPI.createTask({ ... })
  toast.success(`Task "${data.title}" created`, { duration: 3000 })
} catch {
  onOpenCreate(savedValues)
  toast.error(`Create failed — "${data.title}" could not be saved`, { duration: Infinity })
}

// In TaskModal.tsx onSubmit, mode === 'edit'
const taskTitle = task.title   // captured before onClose()
try {
  await boardAPI.updateTask(task.id, { ... })
  toast.success(`Task "${taskTitle}" updated`, { duration: 3000 })
} catch {
  toast.error(`Update failed — "${taskTitle}" has been reverted`, { duration: Infinity })
}
```

Move and delete operations do NOT get success toasts. They are already handled in `TaskModal.tsx` (`handleDelete`, `handleStatusChange`) and `useBoardDnd.ts` (`handleDragEnd`) — only error paths have toasts.

### Existing Error Toast Call Sites to Audit

Known call sites at end of Epic 3 (verify these are correct, add `duration: Infinity` if missing):

1. `src/features/tasks/components/TaskModal.tsx` — `handleDelete` catch: `Delete failed — "${taskTitle}" has been restored`
2. `src/features/tasks/components/TaskModal.tsx` — `handleStatusChange` catch: `Move failed — "${taskTitle}" has been reverted`
3. `src/features/tasks/components/TaskModal.tsx` — `onSubmit` create catch: `Create failed — "${data.title}" could not be saved`
4. `src/features/tasks/components/TaskModal.tsx` — `onSubmit` edit catch: `Update failed — "${taskTitle}" has been reverted`
5. `src/features/board/hooks/useBoardDnd.ts` — `handleDragEnd` catch: `Move failed — "${draggedTask.title}" has been reverted`

### ToastProvider Updated Implementation

```tsx
// src/shared/components/ToastProvider.tsx
import { Toaster } from 'sonner'

export function ToastProvider(): React.JSX.Element {
  return <Toaster position="bottom-right" richColors visibleToasts={3} />
}
```

### useRealtimeToast.ts Stub

```ts
// src/features/realtime/hooks/useRealtimeToast.ts
import { toast } from 'sonner'

export function showRemoteUpdateToast(taskTitle: string): void {
  toast.info(`"${taskTitle}" was updated remotely`, { duration: 4000 })
}

export function showConflictToast(taskTitle: string): void {
  toast.warning(`Conflict detected on "${taskTitle}"`, { duration: 6000 })
}
```

Note: These are plain functions, not hooks. They do not need the `use` prefix. They live in a `hooks/` folder for co-location with Epic 6 realtime code, but they are pure utility functions that call Sonner's imperative API.

### File Paths

```
src/shared/components/ToastProvider.tsx                    — add visibleToasts={3} (Task 3)
src/features/tasks/components/TaskModal.tsx                — add success toasts for create/update (Task 2)
src/features/tasks/components/TaskModal.test.tsx           — add success toast tests (Task 6)
src/features/board/hooks/useBoardDnd.ts                    — audit error toast message (Task 1)
src/features/realtime/hooks/useRealtimeToast.ts            — new stub file (Tasks 4, 5)
```

### Forbidden Patterns

- `toast.error('Something went wrong')` — always name the task and action
- `toast('...')` (untyped) — use the typed variants: `toast.error`, `toast.success`, `toast.info`, `toast.warning`
- Adding success toasts to `BoardAPIContext.tsx` — presentation belongs in the caller (component/hook), not the context
- `toast.error` without `{ duration: Infinity }` on error toasts — errors are persistent by Sonner's default with `richColors` but be explicit
- Calling `showRemoteUpdateToast` or `showConflictToast` outside of Epic 6 hooks — these are stubs reserved for useRealtimeSimulation
- Adding a global `toastOptions` default to `<Toaster>` — each call site controls its own duration

### Verification Checklist

```
1. Create a task successfully → confirm emerald success toast appears with "[title] created" and disappears after 3s
2. Update a task successfully → confirm emerald success toast appears with "[title] updated" and disappears after 3s
3. Set failureRate to 1.0 → create a task → confirm rose error toast persists until manually dismissed
4. Set failureRate to 1.0 → update a task → confirm rose error toast persists with task title in message
5. Trigger 4+ operations quickly → confirm at most 3 toasts visible simultaneously
6. Search codebase for "Something went wrong" → zero results
7. npm run test → all tests pass
8. npm run lint → zero warnings
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
