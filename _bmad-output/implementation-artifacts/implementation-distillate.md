---
type: bmad-distillate
sources:
  - "../implementation-artifacts/1-1-initialize-project-with-dependencies-and-configuration.md"
  - "../implementation-artifacts/1-2-implement-core-state-architecture.md"
  - "../implementation-artifacts/1-3-implement-mock-api-layer-shared-utilities-and-seed-data.md"
  - "../implementation-artifacts/1-4-build-kanban-board-shell-with-three-columns.md"
  - "../implementation-artifacts/2-1-display-full-task-card-with-all-visual-states.md"
  - "../implementation-artifacts/2-2-create-new-task-via-modal.md"
  - "../implementation-artifacts/2-3-edit-existing-task-via-modal.md"
  - "../implementation-artifacts/2-4-delete-task.md"
  - "../implementation-artifacts/3-1-desktop-drag-and-drop-task-movement.md"
  - "../implementation-artifacts/3-2-mobile-status-dropdown-for-task-movement.md"
downstream_consumer: "story implementation — developer context for implementing upcoming epics"
created: "2026-04-24"
token_estimate: 8750
parts: 1
---

## Project Setup (Story 1.1 — done)
- Template: `npm create vite@latest real-time-collaboration -- --template react-swc-ts`; SWC pre-installs `@vitejs/plugin-react-swc` — do not reinstall
- Production deps: `tailwindcss @tailwindcss/vite @tanstack/react-virtual @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities nanoid sonner react-hook-form`
- Dev deps: `vitest @testing-library/react @testing-library/jest-dom jsdom`
- Tailwind v4: CSS-only setup via `@import "tailwindcss"` in `src/index.css`; NO `tailwind.config.js`
- `vite.config.ts`: plugins `[react(), tailwindcss()]`; alias `{ '@': path.resolve(__dirname, './src') }`
- `vitest.config.ts` SEPARATE from `vite.config.ts`; `environment: 'jsdom'`; `setupFiles: ['./src/test-setup.ts']`
- `tsconfig.app.json`: `strict: true`, `noUncheckedIndexedAccess: true`, `paths: { "@/*": ["./src/*"] }`
- `src/test-setup.ts`: `import '@testing-library/jest-dom'`
- No barrel `index.ts` exports anywhere — import directly from file paths; enforced from day 1
- `src/assets/` and `src/App.css` from Vite scaffold deleted
- Folder structure: `src/{types,api,store,features/{board/{components,hooks},tasks/{components,hooks},filters/{components,utils},history/{components,hooks},realtime/{components,hooks}},shared/{components,hooks,utils}}`
- All stubs use `export {}` for TypeScript resolution
- Naming: PascalCase.tsx components; camelCase `use` prefix hooks; PascalCase+Context suffix context files; SCREAMING_SNAKE_CASE action types (NOUN_VERB pattern); lowercase union string values

## Core Types (Story 1.2)
- `src/types/task.types.ts`: `TaskStatus = 'todo' | 'in-progress' | 'done'`; `Priority = 'low' | 'medium' | 'high'`; `Tag = { id: string; label: string }`; `Task = { id: string; title: string; description?: string; assignee?: string; status: TaskStatus; priority: Priority; tags: Tag[]; createdAt: string }`
- `src/types/common.types.ts`: `ID = string`; `AsyncState<T>` discriminated union `{status:'idle'|'loading'|'success';data:T}|{status:'error';error:string}`; `PendingOperation = { opId: string; taskId: string; snapshot: Task; opType: string }` (opType added during Story 2.1 debug); `ConflictState = { taskId: string; remoteTask: Task; localTask: Task }`
- ID: always `nanoid()` string, never number; date: always `new Date().toISOString()`, never `Date` object
- Async state: discriminated union only, never `loading: boolean + data + error` flags
- `any` type: zero tolerance; use `unknown` + type guards
- `noUncheckedIndexedAccess` means `array[0]` is `T | undefined`; use `.find()` or guard

## State Architecture (Story 1.2)
- Single `boardReducer` → `BoardState { tasks: Task[]; pendingOps: Map<string, PendingOperation>; conflict: ConflictState | null }`
- 11 `BoardAction` types: `TASK_MOVE | TASK_CREATE | TASK_UPDATE | TASK_DELETE | OP_SUCCESS | OP_ROLLBACK | REMOTE_UPDATE | CONFLICT_DETECTED | CONFLICT_RESOLVE_MINE | CONFLICT_RESOLVE_THEIRS | HISTORY_APPLY`
- User actions (enter history stack): `TASK_MOVE, TASK_CREATE, TASK_UPDATE, TASK_DELETE`; system actions (never history): `OP_SUCCESS, OP_ROLLBACK, REMOTE_UPDATE, CONFLICT_DETECTED, CONFLICT_RESOLVE_MINE, CONFLICT_RESOLVE_THEIRS, HISTORY_APPLY`
- History stack: 50-entry limit; full impl deferred to Story 7.1
- 7 contexts: `BoardStateContext→useTasks()`, `PendingOpsContext→usePendingOps()`, `ConflictContext→useConflict()`, `BoardAPIContext→useBoardAPI()`, `FilterContext→useFilters()`, `FilterAPIContext→useFilterAPI()`, `HistoryContext→useHistory()`
- Context values passed as direct slices, never wrapped in objects (`value={boardState.tasks}` not `value={{ tasks }}`)
- `BoardAPIContext` action creators wrapped in `useMemo([], [])` (empty deps) — stable forever; React guarantees dispatch stability
- `FilterAPIContext` setters wrapped in `useMemo([], [filterDispatch])` — dispatch in deps
- `AppProvider` nesting order (fixed): BoardStateContext → PendingOpsContext → ConflictContext → BoardAPIProvider → FilterProvider → FilterAPIProvider → HistoryProvider → children
- `HistoryContext`: stub provider until Story 7.1; `HistoryContextType = { undoLabel: string|null; redoLabel: string|null; canUndo: boolean; canRedo: boolean }`
- `FilterState = { assignee: string|null; priority: Priority|null; searchQuery: string }`; `FilterAction` types: `SET_ASSIGNEE | SET_PRIORITY | SET_SEARCH | RESET_FILTERS`
- `HISTORY_APPLY` reducer case: recursively applies `action.action` through `boardReducer`
- `REMOTE_UPDATE`: upserts task (replace if exists, append if new), no pendingOps change
- Reducer rules: never mutate; always `{ ...state }` spread; `Map` must be reconstructed `new Map(state.pendingOps)` then `.set()`/`.delete()`
- `BoardAPIContext` default is `null`; hook throws — no no-op default
- `BoardAPIContextType`: `moveTask(taskId, newStatus): void; createTask(task: Omit<Task,'id'|'createdAt'>): void; updateTask(taskId, changes: Partial<Omit<Task,'id'|'createdAt'>>): void; deleteTask(taskId): void` (all made async in Epic 2)

## Mock API Layer (Story 1.3)
- `src/shared/utils/sleep.ts`: `export function sleep(ms: number): Promise<void>`
- `src/api/mock-client.ts`: `MockApiError extends Error` with `this.name = 'MockApiError'` set in constructor (transpilation doesn't preserve class name reliably); `mockRequest<T>(fn: () => T, opts = { delay: 2000, failureRate: 0.1 }): Promise<T>` — accepts factory function not resolved value
- `src/api/tasks.ts`: sole public interface for all mutations; exports `createTask`, `updateTask`, `deleteTask`, `moveTask`; NO component/hook may import `mockRequest` directly
- `updateTask` signature: `(id: string, changes: Partial<Task>): Promise<Task>` — changed from `(mergedTask: Task)` during Story 2.2 debug
- `src/shared/utils/mockData.ts`: `MOCK_TASKS` (25 `Task[]`); distribution: 8 todo / 9 in-progress / 8 done; ~8 high / ~10 medium / ~7 low priority; 4 assignees: Alice/Bob/Carol/Dave; `createdAt`: `new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()`; every id calls `nanoid()`; tag labels: backend/frontend/devops/testing/performance/accessibility/security/dx
- `src/shared/components/ErrorBoundary.tsx`: class component (required for error boundaries); `getDerivedStateFromError` + `componentDidCatch`; dev error display via `import.meta.env.DEV` (NOT `process.env.NODE_ENV`); `role="alert"` on fallback; named export only
- `src/shared/components/ToastProvider.tsx`: `<Toaster position="bottom-right" richColors />` from `sonner`
- Toast vocabulary: `toast.error` persistent (named action + task title); `toast.info` 4s; `toast.warning` 6s; FORBIDDEN: `toast.error('Something went wrong')` — always name task and action
- Optimistic update sequence: opId=nanoid() → snapshot in pendingOps → apply optimistic → call api/tasks.ts → OP_SUCCESS or OP_ROLLBACK+toast
- Import rules: `mock-client.ts` imports only `sleep`; `tasks.ts` imports `mock-client`, task types, nanoid; contexts/hooks/components import only `@/api/tasks`

## Kanban Board Shell (Story 1.4)
- shadcn/ui install: `npx shadcn@latest init` (Default style, Zinc base, CSS variables yes); `npx shadcn@latest add dialog badge button select tooltip`; components land in `src/components/ui/`
- shadcn CLI may modify `src/index.css` adding CSS variables — acceptable; still starts with `@import "tailwindcss"`
- `lucide-react` installed; icons used: `LayoutKanban, Plus, Inbox, Flag`
- Seed data loaded ONLY in `AppProvider.tsx` as `initialBoardState = { tasks: MOCK_TASKS, pendingOps: new Map(), conflict: null }` — `KanbanBoard.tsx` NEVER imports mockData directly
- `KanbanBoard`: `COLUMNS` const array `[{status:'todo',title:'Todo'},{status:'in-progress',title:'In Progress'},{status:'done',title:'Done'}]`; layout `min-h-screen bg-zinc-50`; no direct `useTasks()` call — BoardColumn reads context itself
- `BoardColumn`: props `{ status: TaskStatus; title: string }`; `useTasks()` + `useMemo` filter; `role="region"` + `aria-label`; count badge `bg-zinc-200 rounded-full px-2 py-0.5 text-xs`; empty state: Inbox icon + "No tasks" + "Drag a task here or add one" + "Add task" ghost dashed button (`min-h-[44px]`)
- `TaskCard`: `React.memo`; props `{ task: Task }`; `role="article"` + `aria-label`; `usePendingOps()` for in-flight check; in-flight: `ring-2 ring-violet-600`; `tabIndex={0}`
- Design tokens: page `bg-zinc-50`; column `bg-zinc-100`; card `bg-white border-zinc-200`; primary button `bg-violet-600 hover:bg-violet-700`; focus `focus-visible:ring-2 focus-visible:ring-violet-500`; FORBIDDEN hardcoded hex values
- `src/App.tsx`: `<ErrorBoundary><KanbanBoard /></ErrorBoundary>` default export
- `src/main.tsx`: `<React.StrictMode><AppProvider><ToastProvider /><App /></AppProvider></React.StrictMode>`

## TaskCard Visual States (Story 2.1 — done)
- Done state: `opacity-[0.65]` on article + `line-through` on title when `task.status === 'done'`
- Hover: `hover:border-zinc-300 hover:shadow-md transition-shadow`
- In-flight: `card-pulse` CSS class + CSS spinner (absolute top-right `h-3 w-3 animate-spin rounded-full border-2 border-violet-600 border-t-transparent`) + `aria-busy="true"` on article; card needs `relative` positioning
- `cardPulse` keyframe in `src/index.css`: `0%,100% box-shadow: 0 0 0 2px rgb(124 58 237 / 0.3); 50% box-shadow: 0 0 0 4px rgb(124 58 237 / 0.6)`; duration 1.8s ease-in-out infinite
- Priority badge always dot+text: `PRIORITY_CONFIG = { high: {dot:'bg-rose-500', label:'High'}, medium: {dot:'bg-amber-500', label:'Medium'}, low: {dot:'bg-sky-500', label:'Low'} }`; dot `aria-hidden="true"`
- `isPending` check: `[...pendingOps.values()].some(op => op.taskId === task.id)`
- Added optional `onOpen?: (task: Task) => void` prop to TaskCard for Story 2.3 click/Enter (non-breaking)
- Bug fixed during 2.1: `boardReducer` OP_ROLLBACK was inverted for create/delete — added `opType` field to `PendingOperation`
- `vitest.config.ts` updated: added `globals: true`, react plugin, `@/` path alias
- 25 tests in `TaskCard.test.tsx` passing

## Create Task Modal (Story 2.2 — done)
- `src/features/tasks/hooks/useTaskModal.ts`: manages `isOpen / mode:'create'|'edit' / editingTask: Task|null / prefillValues`; exposes `openCreate() / openEdit(task) / close()`; `triggerRef` for focus return; N shortcut via `useKeyboardShortcut`
- `useKeyboardShortcut`: fires on key match, ignores Ctrl/Meta/Alt combos; `isFormElementFocused()` checks `document.activeElement.tagName`
- `TaskModal.tsx`: uses `react-hook-form` with `mode: 'onBlur'`; `CreateTaskForm = { title: string; description?: string; assignee?: string; priority?: Priority; tags?: string }`; `autoFocus` on title; tab order: Title→Priority→Assignee→DueDate→Create
- Validation error display: `rose-600` text + `AlertCircle` icon below field, shown on blur only
- On submit: `modal.close()` immediately → `boardAPI.createTask(formData)` → new task lands as `status: 'todo'`
- OP_ROLLBACK recovery: modal re-opens pre-filled via `reset(savedFormValues)` + `toast.error('Create failed — "{title}" could not be saved')`
- Unsaved-changes guard: fires only if `isDirty === true`; guard dialog: "Discard changes?" — Discard (rose-600) + "Keep editing" (violet-600)
- Focus return: `setTimeout(() => triggerRef.current?.focus(), 0)` after modal unmounts
- `BoardAPIContext` made async: all CRUD methods now `async` with OP_SUCCESS/OP_ROLLBACK dispatch + re-throw on failure; `BoardAPIContext` context object exported for test injection
- `KanbanBoard`: wired "New Task" button + Tooltip "New task (N)"; renders TaskModal; passes callbacks to BoardColumn
- `BoardColumn`: wired "Add task" button; accepts `onOpenCreate/onOpenEdit` props; passes `onOpen` to TaskCard
- 57 total tests passing (25 TaskCard + 10 useTaskModal + 22 TaskModal)

## Edit Task Modal (Story 2.3 — done)
- Reuses `TaskModal.tsx` in `mode='edit'`; pre-population: `useEffect` calls `reset({ title, description??'', assignee??'', priority, tags: tags?.join(', ')??'' })` when `mode==='edit' && task`
- Submit button label: "Save" in edit mode
- Submit sends only `dirtyFields` to `boardAPI.updateTask(task.id, changes)` — avoids unintentional overwrites
- OP_ROLLBACK toast: `toast.error('Update failed — "{title}" has been reverted')`
- `useTaskModal.openEdit`: stores `triggerRef = document.activeElement` for focus return
- `TaskCard`: onClick + `onKeyDown(Enter)` → `onOpen(task)` prop; drag does NOT trigger modal

## Delete Task (Story 2.4 — done)
- Delete button in `TaskModal` edit mode footer: left side, `variant="destructive"`, rose-600; right side has Cancel+Save
- NO confirmation dialog — immediate optimistic delete + rollback-as-undo UX
- `handleDelete()`: closes modal immediately → awaits `boardAPI.deleteTask(taskId)` → catches for toast
- OP_ROLLBACK for delete: `boardReducer` case appends `op.snapshot` back to `tasks[]` at END of array (bottom of column — acceptable for MVP); position restoration deferred
- OP_ROLLBACK toast: `toast.error('Delete failed — "{title}" has been restored')`; persistent toast (manual dismiss)
- `boardReducer` OP_ROLLBACK fix: `opType` field on `PendingOperation` distinguishes create rollback (filter out) from delete rollback (append back)
- `BoardColumn` count badge derived reactively from `useTasks()` filtered by status — NOT cached; updates to 0 immediately on delete
- 9 reducer unit tests added in `src/store/boardReducer.test.ts`; 66 total tests passing

## Desktop Drag-and-Drop (Story 3.1 — in-progress/done)
- Libraries: `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` (all three required together)
- `PointerSensor` with `activationConstraint: { distance: 8 }` — CRITICAL to preserve click→modal; without it mousedown starts drag
- `DndContext` wraps board `<main>`; `collisionDetection={closestCorners}`; `onDragStart/onDragOver/onDragEnd` from `useBoardDnd()`
- `DragOverlay` after `<main>` inside `DndContext`; renders `<TaskCard task={activeTask} isOverlay />` — no `onOpen` passed to overlay
- `useBoardDnd` (`src/features/board/hooks/useBoardDnd.ts`): `useState<Task|null>(null)` for `activeTask`; `handleDragStart`: find task by `String(active.id)`, set as activeTask; `handleDragEnd`: resolve `newStatus` from `over.id`; same-column = no-op; calls `moveTask` then catches for toast
- Capture `draggedTask` BEFORE `setActiveTask(null)` and BEFORE async call — closure captures correct title for error toast
- `BoardColumn`: `useDroppable({ id: status })`; `setNodeRef` on root `<section>`; drag-over: `ring-2 ring-violet-400 ring-inset`; `SortableContext` with `verticalListSortingStrategy`; dashed placeholder `h-14` when `isOver`
- `TaskCard`: `useSortable({ id: task.id })` unconditionally; `isOverlay?: boolean` prop; overlay style: `scale(1.02) + deep shadow`; normal style: `CSS.Transform.toString(transform) + transition`; `ref={isOverlay ? undefined : setNodeRef}`; `isDragging && !isOverlay` → `opacity-0 pointer-events-none`; `tabIndex={isOverlay ? -1 : 0}`; onClick/onKeyDown skipped when `isOverlay`
- `BoardAPIContext.moveTask` async: dispatch `TASK_MOVE` → `await apiMoveTask()` → `OP_SUCCESS` or `OP_ROLLBACK + throw`; toast shown in `useBoardDnd.handleDragEnd` caller
- Toast on move failure: `toast.error('Move failed — "{draggedTask.title}" has been reverted')`
- 94 tests passing
- Open review items (patches needed): concurrent moves corrupt status (second TASK_MOVE captures optimistic snapshot); empty-column dashed placeholder missing (isOver inside non-empty branch only); `useSortable` called for overlay registers duplicate ID; source card keeps `cursor-grab` during active drag
- Deferred: stale `tasks` closure in handleDragEnd; no unmount guard; drop placeholder always at bottom

## Mobile Status Dropdown (Story 3.2 — in-progress/done)
- Only file changed: `src/features/tasks/components/TaskModal.tsx` (and its test)
- Status `Select` rendered as FIRST form field in edit mode only (`mode==='edit' && task` guard); create mode always defaults `status: 'todo'`
- `statusTriggerRef = useRef<HTMLButtonElement|null>(null)`; attached via `ref={statusTriggerRef}` on `<SelectTrigger>`
- Focus effect: `if (isOpen) { setTimeout(() => { if (mode==='edit' && window.innerWidth < 768) { statusTriggerRef.current?.focus() } else { titleInputRef.current?.focus() } }, 0) }`
- `handleStatusChange(newStatus: TaskStatus)`: no-op if `!task || newStatus === task.status`; capture `taskTitle = task.title` BEFORE `onClose()`; call `onClose()` optimistically; `await boardAPI.moveTask(task.id, newStatus)`; catch → toast
- MUST use `boardAPI.moveTask` not `boardAPI.updateTask` — ensures `TASK_MOVE` action type for correct history/rollback path
- Status change calls `onClose()` directly, NOT `handleCloseAttempt()` — bypasses isDirty guard intentionally
- 6 new tests; 100 total tests passing
- Open review: concurrent moves corrupt status (shared with 3.1); `window.innerWidth` not reactive to resize

## Forbidden Patterns (global)
- Barrel `index.ts` in any feature or shared folder
- `value={{ tasks }}` object wrapping context values
- `useContext(BoardStateContext)` directly in components — use custom hooks
- `id: Math.random()` or `id: Date.now()` — use `nanoid()`
- `new Date()` objects — use `new Date().toISOString()`
- `loading: boolean + data + error` async state — use discriminated union
- `: any` type
- Calling `mockRequest` outside `src/api/tasks.ts`
- Calling `src/api/tasks.ts` directly from components — route through `useBoardAPI()`
- Default exports for most components — use named exports
- Hardcoded hex color values — use Tailwind tokens
- `state.tasks.push(...)` — always spread; always return `{ ...state, tasks }`
- `import.meta.env.DEV` vs `process.env.NODE_ENV` — use Vite's `import.meta.env.DEV`
- `focus:outline-none` without replacement ring

## Test Infrastructure
- `vitest.config.ts`: `globals: true`, react plugin, `@/` path alias
- Test files co-located in same folder as component
- Test count: 25 (post-2.1) → 57 (post-2.2) → 66 (post-2.4) → 94 (post-3.1) → 100 (post-3.2)
- `boardReducer.test.ts` created in Story 2.4; `BoardAPIContext.test.ts` created in Story 3.1; `useBoardDnd.test.ts` created in Story 3.1; `BoardColumn.test.tsx` created in Story 3.1

## Deferred / Out-of-Scope
- `@tanstack/react-virtual` list virtualization — Epic 8 Story 8.1
- `FilterBar` component — Epic 4 Story 4.2
- `UndoHintBar` — Epic 7 Story 7.3
- `HistoryContext` full impl — Story 7.1
- `ConflictModal` — Epic 6 Story 6.3
- `useRealtimeSimulation` — Epic 6 Story 6.1
- Position restoration after OP_ROLLBACK (task appends at bottom) — post-MVP
- Concurrent move corruption guard — patch item from 3.1/3.2
- Empty-column drop placeholder — patch from 3.1
- `useSortable` overlay duplicate registration — patch from 3.1
