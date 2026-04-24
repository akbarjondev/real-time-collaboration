# Story 5.2: Per-Card In-Flight Loading Indicator

Status: ready-for-dev

## Blocker

Story 5.1 should be complete first (ensures the optimistic sequence is solid before auditing visual feedback).

---

## Story

As a user,
I want to see a subtle visual indicator on the exact card being processed,
so that I know which task is waiting for the server response without the whole board feeling frozen.

## Acceptance Criteria

1. **Given** a task mutation is in flight **When** the card renders **Then** it shows the `card-pulse` violet border animation AND the CSS spinner in the top-right corner.
2. **Given** a task mutation is in flight **When** the card renders **Then** `aria-busy="true"` is present on the `<article>` element.
3. **Given** task A is in flight and task B is not **When** `PendingOpsContext` updates **Then** only task A's card re-renders; task B's card does NOT re-render.
4. **Given** a mutation succeeds (`OP_SUCCESS`) **When** the pending entry is removed **Then** the spinner and pulse animation disappear from the card; `aria-busy` returns to `false`.
5. **Given** a mutation fails (`OP_ROLLBACK`) **When** the pending entry is removed **Then** the spinner and pulse animation disappear before the card itself disappears or reverts.
6. **Given** multiple cards are in flight simultaneously **When** any one card's `opId` resolves **Then** only that card stops showing the indicator; other in-flight cards continue pulsing.

## Tasks / Subtasks

- [ ] Task 1: Audit existing in-flight visual implementation in `TaskCard.tsx` (AC: #1, #2)
  - [ ] Confirm `isPending` check is `[...pendingOps.values()].some(op => op.taskId === task.id)`
  - [ ] Confirm `card-pulse` CSS class is applied on the `<article>` element when `isPending` is true
  - [ ] Confirm the CSS spinner `<div>` (`absolute top-2 right-2 h-3 w-3 animate-spin rounded-full border-2 border-violet-600 border-t-transparent`) renders conditionally when `isPending` and has `aria-hidden="true"`
  - [ ] Confirm `aria-busy={isPending}` is set on the `<article>` element
  - [ ] Confirm the `<article>` has `relative` positioning (required for the absolutely-positioned spinner)

- [ ] Task 2: Fix render isolation so only the affected TaskCard re-renders on PendingOpsContext change (AC: #3, #6)
  - [ ] Audit the current `TaskCard` — it calls `usePendingOps()` and recomputes `isPending` on every `PendingOpsContext` update; because ALL TaskCards subscribe to the same context, ALL cards re-render even when only one task becomes pending
  - [ ] Fix this by adding a custom `areEqual` comparison function to `React.memo`:
    ```ts
    export const TaskCard = memo(function TaskCard(...) { ... }, (prev, next) => {
      // Re-render only when the task data changes OR isPending status changes
      // isPending must be computed here for comparison, not inside the component
    })
    ```
  - [ ] Preferred approach: lift `isPending` computation out of TaskCard and pass it as a prop from `BoardColumn`; `BoardColumn` already has `usePendingOps()` access and can compute `isPending` per task inside the `columnTasks.map()`:
    ```ts
    // In BoardColumn.tsx — add usePendingOps() call
    const pendingOps = usePendingOps()
    // In the map:
    const isPending = [...pendingOps.values()].some(op => op.taskId === task.id)
    <TaskCard key={task.id} task={task} onOpen={onOpenEdit} isPending={isPending} />
    ```
  - [ ] Update `TaskCard` props type to include `isPending: boolean` (required, not optional) and remove the internal `usePendingOps()` call
  - [ ] Update `DragOverlay` usage in `KanbanBoard.tsx`: pass `isPending={false}` (overlay cards are never in-flight by design)
  - [ ] Update all `TaskCard` test usages in `TaskCard.test.tsx` to pass `isPending` prop
  - [ ] Verify `React.memo` shallow comparison now correctly prevents spurious re-renders: when task B's `isPending` prop does not change, its memo wrapper blocks the re-render

- [ ] Task 3: Audit `cardPulse` keyframe in `src/index.css` (AC: #1)
  - [ ] Confirm `@keyframes cardPulse` is defined with `0%, 100% { box-shadow: 0 0 0 2px rgb(124 58 237 / 0.3) }` and `50% { box-shadow: 0 0 0 4px rgb(124 58 237 / 0.6) }`
  - [ ] Confirm `.card-pulse` utility applies `animation: cardPulse 1.8s ease-in-out infinite`
  - [ ] Confirm `@media (prefers-reduced-motion: reduce)` disables the animation: `.card-pulse { animation: none }`

- [ ] Task 4: Add `prefers-reduced-motion` guard to in-flight indicator (AC: #1)
  - [ ] If not already present, add to `src/index.css`:
    ```css
    @media (prefers-reduced-motion: reduce) {
      .card-pulse {
        animation: none;
        box-shadow: 0 0 0 2px rgb(124 58 237 / 0.5); /* static ring, no motion */
      }
    }
    ```
  - [ ] The CSS spinner uses `animate-spin` (Tailwind); Tailwind v4 respects `prefers-reduced-motion` by default for `animate-*` — verify this is the case; if not, add an explicit `.animate-spin` override

- [ ] Task 5: Write / update tests (AC: #1, #2, #3)
  - [ ] In `TaskCard.test.tsx`: add tests verifying `aria-busy="true"` and the spinner element are present when `isPending={true}`; absent when `isPending={false}`
  - [ ] In `TaskCard.test.tsx`: confirm `card-pulse` class is applied when `isPending={true}`
  - [ ] In `BoardColumn.test.tsx`: add a test verifying `isPending` is correctly derived and passed per-task (render two tasks, one in pendingOps and one not; verify only the pending card has `aria-busy="true"`)

---

## Dev Notes

### Why All TaskCards Re-Render Today

`TaskCard` currently calls `usePendingOps()` directly. `PendingOpsContext` holds a `Map<string, PendingOperation>`. When any task becomes pending, the context value is a new `Map` reference (because `boardReducer` reconstructs via `new Map(state.pendingOps)`). React propagates this to all consumers — all TaskCards that called `usePendingOps()` re-render, even if the specific task they render is not in the map.

`React.memo` at the component boundary doesn't help here because `usePendingOps()` is called INSIDE the component — the memo wrapper only compares props, not hook return values.

### Preferred Fix: Lift isPending to BoardColumn

BoardColumn already subscribes to `PendingOpsContext` via a custom hook. The re-render cascade from `PendingOpsContext` is unavoidable at `BoardColumn` level, but `BoardColumn` can compute `isPending` per task and pass it as a stable boolean prop to each `TaskCard`. Then `React.memo` on `TaskCard` compares `isPending` as a prop — if it hasn't changed for a given card, that card does not re-render.

```tsx
// BoardColumn.tsx — updated map
const pendingOps = usePendingOps()

{columnTasks.map(task => {
  const isPending = [...pendingOps.values()].some(op => op.taskId === task.id)
  return (
    <TaskCard
      key={task.id}
      task={task}
      onOpen={onOpenEdit}
      isPending={isPending}
    />
  )
})}
```

```tsx
// TaskCard.tsx — updated props, remove internal usePendingOps()
type TaskCardProps = {
  task: Task
  onOpen?: (task: Task) => void
  isOverlay?: boolean
  isPending: boolean   // now a required prop
}

export const TaskCard = memo(function TaskCard({ task, onOpen, isOverlay, isPending }: TaskCardProps) {
  // Remove: const pendingOps = usePendingOps()
  // Remove: const isPending = [...pendingOps.values()].some(op => op.taskId === task.id)
  // isPending is now received directly as a prop
  ...
})
```

### DragOverlay TaskCard

`KanbanBoard.tsx` renders `<TaskCard task={activeTask} isOverlay />` inside `DragOverlay`. Since `isOverlay` cards are never in-flight (no mutation is pending on a card mid-drag in the overlay), pass `isPending={false}` explicitly:

```tsx
<DragOverlay>
  {activeTask ? <TaskCard task={activeTask} isOverlay isPending={false} /> : null}
</DragOverlay>
```

### cardPulse CSS — Exact Required Implementation

```css
/* In src/index.css */
@keyframes cardPulse {
  0%, 100% { box-shadow: 0 0 0 2px rgb(124 58 237 / 0.3); }
  50%       { box-shadow: 0 0 0 4px rgb(124 58 237 / 0.6); }
}

.card-pulse {
  animation: cardPulse 1.8s ease-in-out infinite;
}

@media (prefers-reduced-motion: reduce) {
  .card-pulse {
    animation: none;
    box-shadow: 0 0 0 2px rgb(124 58 237 / 0.5);
  }
}
```

### File Paths

```
src/features/tasks/components/TaskCard.tsx       — remove usePendingOps(), add isPending prop (Task 2)
src/features/tasks/components/TaskCard.test.tsx  — update prop, add in-flight tests (Tasks 2, 5)
src/features/board/components/BoardColumn.tsx    — add usePendingOps() + per-task isPending derivation (Task 2)
src/features/board/components/BoardColumn.test.tsx — add isPending propagation test (Task 5)
src/features/board/components/KanbanBoard.tsx    — pass isPending={false} to DragOverlay TaskCard (Task 2)
src/index.css                                    — verify/add cardPulse keyframe + reduced-motion (Tasks 3, 4)
```

### Forbidden Patterns

- `usePendingOps()` called inside `TaskCard` directly: causes all cards to re-render on any pending op change
- Passing `isPending` as optional (`isPending?: boolean`) — it must be required; no card should silently omit it
- Hardcoded color values in CSS: use `rgb(124 58 237 / ...)` which maps to violet-600 — not `#7c3aed`
- `React.memo` with a custom `areEqual` that ignores `isPending`: subtle — the comparison must include `isPending`
- `animation: none` for reduced-motion without a static visual fallback — the in-flight state must still be visually distinguishable

### Verification Checklist

```
1. Open React DevTools Profiler → trigger a TASK_UPDATE → confirm only the updated task's card shows a render highlight; neighboring cards do not render
2. Temporarily set MockApiError failureRate to 0 → drag a task → confirm spinner appears for ~2s then disappears cleanly
3. Temporarily set failureRate to 1.0 → drag a task → confirm spinner appears briefly then card reverts (spinner disappears before/with revert)
4. In a browser with prefers-reduced-motion enabled (OS accessibility setting) → trigger a pending op → confirm card shows a static violet ring without animation
5. npm run test → all tests pass
6. npm run lint → zero warnings
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
