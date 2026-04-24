# Story 3.1: Desktop Drag-and-Drop Task Movement

Status: ready-for-dev

## Blocker

**Do NOT start implementation until ALL Epic 1 stories (1-1 → 1-4) AND ALL Epic 2 stories (2-1 → 2-4) are marked `done`.**
This story modifies `TaskCard`, `BoardColumn`, `KanbanBoard`, and `BoardAPIContext` — all of which were changed in Epic 2. Starting before Epic 2 is done will cause merge conflicts.

---

## Story

As a desktop user,
I want to drag task cards between columns with smooth visual feedback,
so that moving tasks between statuses feels instant and natural.

## Acceptance Criteria

1. **Given** a task card on desktop **When** the user presses mousedown and moves 8px **Then** the card drag activates: a semi-transparent ghost appears at the origin, a DragOverlay card follows the cursor (scaled 1.02x, deeper shadow), cursor becomes `grabbing`.

2. **Given** a card being dragged **When** it hovers over a valid destination column **Then** the destination column gets a violet dashed border highlight **And** a dashed placeholder div appears at the bottom of that column's task list.

3. **Given** a card is dropped into a different column **When** the drop completes **Then** `useBoardAPI().moveTask(taskId, newStatus)` is called: it dispatches `TASK_MOVE` (optimistic, instant), then calls `moveTask()` in `src/api/tasks.ts` in the background.

4. **Given** the `mockRequest()` resolves successfully (~90%) **When** `OP_SUCCESS` is dispatched **Then** the task stays in the destination column and the `pendingOps` entry is removed.

5. **Given** the `mockRequest()` throws `MockApiError` (~10%) **When** `OP_ROLLBACK` is dispatched **Then** the card slides back to its origin column (restored from the `pendingOps` snapshot) **And** `toast.error('Move failed — "[task title]" has been reverted')` is shown.

6. **Given** a card is dropped back into its origin column **When** the drop completes **Then** no state change occurs and no API call is made.

7. **Given** the @dnd-kit setup **When** implemented **Then** `DndContext` wraps the board with `PointerSensor` (activationConstraint: `{ distance: 8 }`), each column has `SortableContext` with its task IDs, and `useBoardDnd` handles `onDragStart`, `onDragOver`, and `onDragEnd`.

8. **Given** a click on a task card (pointer moves < 8px) **When** the user clicks **Then** the task modal opens normally — drag is NOT triggered, existing `onOpen` behavior is preserved.

## Tasks / Subtasks

- [ ] Task 1: Complete `BoardAPIContext.moveTask` async flow (AC: #3, #4, #5)
  - [ ] Add `import { moveTask as apiMoveTask } from '@/api/tasks'` to `BoardAPIContext.tsx`
  - [ ] Add `import { toast } from 'sonner'` to `BoardAPIContext.tsx`
  - [ ] Replace the `// Epic 3: add async API call here` comment with the full try/catch flow
  - [ ] On success: `dispatch({ type: 'OP_SUCCESS', opId })`
  - [ ] On failure: `dispatch({ type: 'OP_ROLLBACK', opId })` then `throw e` (caller in `useBoardDnd` shows the toast)
  - [ ] Do NOT add toast inside `BoardAPIContext.moveTask` — follow the same `throw e` pattern as `createTask`/`updateTask`/`deleteTask`

- [ ] Task 2: Implement `useBoardDnd` hook (AC: #1, #2, #3, #5, #6, #7, #8)
  - [ ] Implement `src/features/board/hooks/useBoardDnd.ts` — currently `export {}`
  - [ ] Import from `@dnd-kit/core`: `DragStartEvent`, `DragEndEvent`, `DragOverEvent`, `PointerSensor`, `useSensor`, `useSensors`
  - [ ] Import `useBoardAPI` from `@/store/BoardAPIContext`
  - [ ] Import `useTasks` from `@/store/BoardStateContext`
  - [ ] Configure: `useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))`
  - [ ] `useState<Task | null>(null)` for `activeTask`
  - [ ] `handleDragStart({ active })`: find task by `String(active.id)` in `tasks`, set as `activeTask`
  - [ ] `handleDragOver`: no-op body (satisfies AC #7 hook signature; cross-column destination is resolved in `handleDragEnd`)
  - [ ] `handleDragEnd({ active, over })`: clear `activeTask`, resolve `newStatus`, call `moveTask`, catch error + show toast
  - [ ] Return `{ sensors, activeTask, handleDragStart, handleDragOver, handleDragEnd }`

- [ ] Task 3: Wire `DndContext` + `DragOverlay` into `KanbanBoard.tsx` (AC: #1, #7)
  - [ ] Import `DndContext`, `DragOverlay` from `@dnd-kit/core`
  - [ ] Import `useBoardDnd` from `@/features/board/hooks/useBoardDnd`
  - [ ] Destructure `{ sensors, activeTask, handleDragStart, handleDragOver, handleDragEnd }` from `useBoardDnd()`
  - [ ] Wrap the `<main>` columns block with `<DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>`
  - [ ] Import `closestCorners` from `@dnd-kit/core`
  - [ ] Add `<DragOverlay>` after the `<main>` block (but still inside `DndContext`)
  - [ ] Inside `DragOverlay`: when `activeTask` is not null, render `<TaskCard task={activeTask} isOverlay />` — DO NOT pass `onOpen` to the overlay card

- [ ] Task 4: Add `useDroppable` + `SortableContext` + drag-over styles to `BoardColumn.tsx` (AC: #2, #7)
  - [ ] Import `useDroppable` from `@dnd-kit/core`
  - [ ] Import `SortableContext`, `verticalListSortingStrategy` from `@dnd-kit/sortable`
  - [ ] Add `const { isOver, setNodeRef } = useDroppable({ id: status })` inside `BoardColumn`
  - [ ] Attach `ref={setNodeRef}` to the root `<section>` element
  - [ ] Add drag-over border: use `cn(...)` on `<section>` className — add `isOver ? 'ring-2 ring-violet-400 ring-inset' : ''`
  - [ ] Wrap `columnTasks.map(...)` in `<SortableContext items={columnTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>`
  - [ ] Inside the `SortableContext` div (non-empty case), after `columnTasks.map(...)`, add: `{isOver && <div className="h-14 rounded-lg border-2 border-dashed border-violet-400 opacity-50" />}`
  - [ ] The `min-h` value on the inner div should prevent layout collapse on empty columns during drag

- [ ] Task 5: Add `useSortable` to `TaskCard.tsx` (AC: #1, #8)
  - [ ] Import `useSortable` from `@dnd-kit/sortable`
  - [ ] Import `CSS` from `@dnd-kit/utilities`
  - [ ] Add `isOverlay?: boolean` to `TaskCardProps`
  - [ ] Call `useSortable({ id: task.id })` unconditionally (hooks must not be conditional)
  - [ ] Destructure `{ setNodeRef, transform, transition, isDragging, attributes, listeners }` from `useSortable`
  - [ ] Build `style`: when `isOverlay`, use `{ transform: 'scale(1.02)', boxShadow: '0 10px 30px rgba(0,0,0,0.18)' }`; otherwise use `{ transform: CSS.Transform.toString(transform), transition }`
  - [ ] Apply `ref={isOverlay ? undefined : setNodeRef}` on `<article>`
  - [ ] Apply `style={style}` on `<article>`
  - [ ] Apply `{...(isOverlay ? {} : attributes)}` and `{...(isOverlay ? {} : listeners)}` on `<article>`
  - [ ] Add to `cn(...)`: `isDragging && !isOverlay ? 'opacity-0 pointer-events-none' : ''` and `isOverlay ? 'cursor-grabbing' : 'cursor-grab'`
  - [ ] `tabIndex`: when `isOverlay`, use `-1`; otherwise keep `0`
  - [ ] `onClick` and `onKeyDown`: when `isOverlay`, skip (don't pass `onOpen`)

- [ ] Task 6: Update sprint-status.yaml (AC: all)
  - [ ] Set `epic-3` to `in-progress`
  - [ ] Set `3-1-desktop-drag-and-drop-task-movement` to `ready-for-dev` (already done by this story creation)

- [ ] Task 7: Write tests (AC: all)
  - [ ] `useBoardDnd.test.ts`: mock `useBoardAPI` + `useTasks`; verify `handleDragEnd` calls `moveTask` when column changes; no call when same column; toast shown on error
  - [ ] `BoardAPIContext.test.ts` (extend existing): `moveTask` dispatches `TASK_MOVE`, calls `apiMoveTask`, dispatches `OP_SUCCESS` on success, dispatches `OP_ROLLBACK` + throws on `MockApiError`
  - [ ] `TaskCard.test.tsx` (extend existing): when `isOverlay=true`, drag listeners are not applied; `isDragging` sets `opacity-0`
  - [ ] `BoardColumn.test.tsx` (extend existing): `SortableContext` renders; `useDroppable` `isOver` adds ring class; placeholder div renders when `isOver`

---

## Dev Notes

### CRITICAL: BoardAPIContext.moveTask — What to Change

The current `moveTask` has a placeholder comment (`// Epic 3: add async API call here`). **Replace only that comment** with the API call flow. Do not change the dispatch above it.

**Current (incomplete):**
```typescript
moveTask: async (taskId: string, newStatus: TaskStatus) => {
  const opId = nanoid()
  dispatch({ type: 'TASK_MOVE', taskId, newStatus, opId })
  // Epic 3: add async API call here
},
```

**After Story 3.1:**
```typescript
moveTask: async (taskId: string, newStatus: TaskStatus) => {
  const opId = nanoid()
  dispatch({ type: 'TASK_MOVE', taskId, newStatus, opId })
  try {
    await apiMoveTask(taskId, newStatus)
    dispatch({ type: 'OP_SUCCESS', opId })
  } catch (e) {
    dispatch({ type: 'OP_ROLLBACK', opId })
    throw e
  }
},
```

**Why `throw e` not `toast.error` here:** The `createTask`/`updateTask`/`deleteTask` pattern already established in Epic 2 is to throw and let the caller handle it. `useBoardDnd.handleDragEnd` is the caller and has access to `draggedTask.title` for the toast message.

### useBoardDnd — handleDragEnd Logic

```typescript
async function handleDragEnd({ active, over }: DragEndEvent) {
  const draggedTask = tasks.find(t => t.id === String(active.id))
  setActiveTask(null)

  if (!over || !draggedTask) return

  // over.id is a column status string (from useDroppable) or a task id (from useSortable)
  const VALID_STATUSES: TaskStatus[] = ['todo', 'in-progress', 'done']
  let newStatus: TaskStatus

  if (VALID_STATUSES.includes(String(over.id) as TaskStatus)) {
    newStatus = String(over.id) as TaskStatus
  } else {
    // Dropped on a card — resolve its column
    const overTask = tasks.find(t => t.id === String(over.id))
    if (!overTask) return
    newStatus = overTask.status
  }

  if (draggedTask.status === newStatus) return // same column — no-op

  try {
    await moveTask(draggedTask.id, newStatus)
  } catch {
    toast.error(`Move failed — "${draggedTask.title}" has been reverted`)
  }
}
```

**Important:** Capture `draggedTask` BEFORE `setActiveTask(null)` and BEFORE the async `moveTask` call. After the `await`, state may have changed — but `draggedTask` is captured in the local closure and will hold the correct title for the error toast.

### TaskCard — useSortable Outside SortableContext (DragOverlay case)

`DragOverlay` renders in a React portal outside the `SortableContext`. Calling `useSortable({ id: task.id })` in the overlay will return default values (no transform, no `isDragging: true`) without conflicting with the in-column instance — dnd-kit deregisters when unmounted. The `isOverlay` flag prevents applying the hooks' listeners/refs to the overlay card.

### PointerSensor activationConstraint: { distance: 8 }

This is **critical** to preserve click behavior. Without it, any mousedown on a card would start a drag — breaking the `onOpen` modal flow established in Epic 2. With `distance: 8`, the card must move 8px before drag activates, so a normal click/tap fires `onClick` normally.

### Column Droppable IDs

Use `TaskStatus` values as the droppable IDs: `'todo'`, `'in-progress'`, `'done'`. In `handleDragEnd`, `over.id` will be one of these when dropped on empty column space, or a task id when dropped on top of another card. Both cases are handled in the logic above.

### DragOverlay — Do Not Pass onOpen

```tsx
// In KanbanBoard.tsx DragOverlay:
{activeTask ? <TaskCard task={activeTask} isOverlay /> : null}
// NOT: <TaskCard task={activeTask} isOverlay onOpen={...} />
// The overlay card is purely visual — clicking it during drag is not meaningful
```

### Optimistic Update Sequence (complete flow)

```
1. User drags card to new column
2. useBoardDnd.handleDragEnd fires
3. boardAPI.moveTask(taskId, newStatus):
   a. opId = nanoid()
   b. dispatch TASK_MOVE → card moves instantly (optimistic)
                         → snapshot stored in pendingOps[opId]
   c. await apiMoveTask(taskId, newStatus) — 2s delay, 10% failure
4a. Success → OP_SUCCESS → pendingOps[opId] cleared
4b. MockApiError → OP_ROLLBACK → card restored from snapshot
    → throw e → caught in handleDragEnd → toast.error(...)
```

**OP_ROLLBACK is a SYSTEM ACTION — never pushed to the history stack.**
This invariant is enforced by `boardReducer.ts` which does not call the history hook.

### isPending Ring During 2s API Delay

`TaskCard` already shows `isPending` state (`border-violet-600 card-pulse` + spinner) when a `pendingOp` exists for the task. After `TASK_MOVE` is dispatched, the card will immediately show this ring — this is correct and intentional. Story 5.2 enhances this indicator; do not remove it.

### File Paths

```
src/store/BoardAPIContext.tsx                      ← complete moveTask (replace comment)
src/features/board/hooks/useBoardDnd.ts            ← implement (currently empty export {})
src/features/board/components/KanbanBoard.tsx      ← add DndContext + DragOverlay
src/features/board/components/BoardColumn.tsx      ← add useDroppable + SortableContext
src/features/tasks/components/TaskCard.tsx         ← add useSortable + isOverlay prop
```

### Forbidden Patterns

- `any` type anywhere
- Barrel `index.ts` exports
- Calling `src/api/tasks.ts` directly from components — always route through `useBoardAPI()`
- `useContext(BoardStateContext)` directly — use `useTasks()`
- Pushing `OP_ROLLBACK` to history stack — it is a SYSTEM ACTION

### Verification Checklist

After implementing, manually verify:

```
1. Drag a card to a different column → moves instantly, 2s later stays there (~90%)
2. Run ~15 drags → ~1-2 failures: card snaps back + error toast with task title appears
3. Drag a card back to its own column → no API call, no state change
4. Click a card (don't drag) → modal opens normally (no drag activation)
5. Column under drag gets violet ring + dashed placeholder at bottom
6. Dragged card origin shows ghost (opacity-0), DragOverlay follows cursor at 1.02x scale
7. TypeScript: tsc --noEmit → zero errors
```

### References

- `moveTask` placeholder comment: [Source: src/store/BoardAPIContext.tsx:31]
- `useBoardDnd.ts` empty file: [Source: src/features/board/hooks/useBoardDnd.ts]
- `TASK_MOVE` reducer case (correctly implemented): [Source: src/store/boardReducer.ts:44-59]
- `apiMoveTask` function: [Source: src/api/tasks.ts:23-31]
- Optimistic update sequence: [Source: architecture.md#Optimistic update sequence]
- OP_ROLLBACK is SYSTEM ACTION (never history): [Source: architecture.md#Action Taxonomy]
- dnd-kit library decision: [Source: architecture.md#Library Decisions]
- `useBoardDnd.ts` file location: [Source: architecture.md#Feature Folder Shape]
- DragOverlay ghost card UX: [Source: ux-design-specification.md#2.5 Experience Mechanics]
- Violet column highlight on drag-over: [Source: ux-design-specification.md#Custom Components]
- Toast vocabulary: [Source: architecture.md#Toast vocabulary]
- `TaskCard.onOpen` prop (Epic 2): [Source: src/features/tasks/components/TaskCard.tsx:9]
- `BoardColumn.onOpenCreate/onOpenEdit` props (Epic 2): [Source: src/features/board/components/BoardColumn.tsx:9-14]

---

## Dev Agent Record

### Agent Model Used

_to be filled by dev agent_

### Debug Log References

### Completion Notes List

### File List
