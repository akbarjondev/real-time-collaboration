# Story 6.1: Implement Real-Time Simulation Hook

Status: ready-for-dev

## Blocker

**Do NOT start implementation until ALL Epic 5 stories (5-1 → 5-4) are marked `done`.**
The simulation hook fires toasts and interacts with `ConflictContext` — ensure Epic 5's toast tier system and error boundary wiring are complete to avoid integration conflicts.

---

## Story

As a user,
I want the board to reflect simulated remote changes automatically,
so that the app demonstrates real-time collaboration behavior without a live backend.

## Acceptance Criteria

1. **Given** the board is mounted **When** 10–15 seconds have elapsed **Then** one randomly selected task receives a simulated remote update (priority or assignee changes) and the board reflects it without a full re-render.

2. **Given** a remote update fires **When** the targeted task is NOT currently open in the edit modal **Then** `REMOTE_UPDATE` is dispatched directly to `boardReducer` (bypassing `BoardAPIContext` and `useHistory` entirely).

3. **Given** a remote update fires **When** the targeted task IS currently open in the edit modal **Then** `CONFLICT_DETECTED` is dispatched instead of `REMOTE_UPDATE`, and no `REMOTE_UPDATE` action is dispatched for that task in that tick.

4. **Given** a remote update fires **When** the tasks list is empty **Then** no dispatch occurs and the timer reschedules normally.

5. **Given** the board is unmounted **When** a pending timeout fires **Then** no dispatch or state mutation occurs (unmount cleanup via `clearTimeout`).

6. **Given** the simulation is running **When** inspected with React DevTools **Then** `BoardStateContext` consumers that are not downstream of the changed task's column do not re-render (upsert, not full reset).

7. **Given** `noUncheckedIndexedAccess` TypeScript config **When** accessing the randomly selected task **Then** the code guards for `undefined` before dispatching.

## Tasks / Subtasks

- [ ] Task 1: Implement `useBoardDispatch` hook for direct reducer access (AC: #2, #3)
  - [ ] Create `src/store/BoardDispatchContext.tsx`
  - [ ] Export `BoardDispatchContext = createContext<React.Dispatch<BoardAction> | null>(null)`
  - [ ] Export `useBoardDispatch(): React.Dispatch<BoardAction>` hook — throws if used outside provider
  - [ ] Wire into `AppProvider.tsx`: wrap the existing provider tree in `<BoardDispatchContext.Provider value={boardDispatch}>` at the outermost level (before `BoardStateContext.Provider`)

- [ ] Task 2: Implement `useRealtimeSimulation` hook body (AC: #1, #2, #3, #4, #5, #7)
  - [ ] Replace `export {}` stub in `src/features/realtime/hooks/useRealtimeSimulation.ts`
  - [ ] Accept `editingTaskId: string | null` parameter
  - [ ] Call `useTasks()` to get the current task list
  - [ ] Call `useBoardDispatch()` to get direct dispatch
  - [ ] Implement `scheduleNext()` function that sets a `setTimeout` with `Math.floor(Math.random() * 5000) + 10000` ms delay
  - [ ] Inside the timeout callback: select random task using index guard for `noUncheckedIndexedAccess`
  - [ ] Generate `remoteTask`: spread original task, mutate one field (priority cycle or append " [remote]" to title)
  - [ ] If `task.id === editingTaskId`: dispatch `CONFLICT_DETECTED` with `taskId`, `remoteTask`, `localTask: task`
  - [ ] Otherwise: dispatch `REMOTE_UPDATE` with the `remoteTask`
  - [ ] Call `scheduleNext()` recursively at end of callback to re-arm the timer
  - [ ] Return cleanup: `return () => clearTimeout(timeoutId)` from `useEffect`
  - [ ] Empty `useEffect` deps array (`[]`) — intentional stale closure for simulation randomness

- [ ] Task 3: Wire `useRealtimeSimulation` into `KanbanBoard.tsx` (AC: #1, #3)
  - [ ] Import `useRealtimeSimulation` from `@/features/realtime/hooks/useRealtimeSimulation`
  - [ ] Pass `editingTask?.id ?? null` from the existing `useTaskModal()` return value as the argument
  - [ ] No return value needed from the hook call

- [ ] Task 4: Update `sprint-status.yaml` (AC: all)
  - [ ] Set `epic-6` to `in-progress`
  - [ ] Set `6-1-implement-real-time-simulation-hook` to `in-progress`

- [ ] Task 5: Write tests (AC: #1, #2, #3, #4, #5, #7)
  - [ ] Create `src/features/realtime/hooks/useRealtimeSimulation.test.ts`
  - [ ] Mock `useTasks` and `useBoardDispatch`
  - [ ] Test: timeout fires after delay → dispatches `REMOTE_UPDATE` when `editingTaskId` does not match
  - [ ] Test: timeout fires → dispatches `CONFLICT_DETECTED` when `editingTaskId` matches selected task
  - [ ] Test: empty tasks array → no dispatch
  - [ ] Test: cleanup function calls `clearTimeout` on unmount
  - [ ] Test: `noUncheckedIndexedAccess` guard — tasks array with length 1 still produces a valid task (not undefined)

---

## Dev Notes

### New Context: BoardDispatchContext

`useRealtimeSimulation` must dispatch directly to `boardReducer` — it intentionally bypasses `BoardAPIContext`. To access `boardDispatch` without passing it down as a prop, expose it via a context:

```typescript
// src/store/BoardDispatchContext.tsx
import { createContext, useContext } from 'react'
import type { BoardAction } from '@/store/boardReducer'

export const BoardDispatchContext = createContext<React.Dispatch<BoardAction> | null>(null)

export function useBoardDispatch(): React.Dispatch<BoardAction> {
  const ctx = useContext(BoardDispatchContext)
  if (!ctx) throw new Error('useBoardDispatch must be used within AppProvider')
  return ctx
}
```

Add to `AppProvider.tsx` — wrap the entire existing tree:

```tsx
return (
  <BoardDispatchContext.Provider value={boardDispatch}>
    <BoardStateContext.Provider value={boardState.tasks}>
      {/* ... rest unchanged ... */}
    </BoardStateContext.Provider>
  </BoardDispatchContext.Provider>
)
```

**Why a new context and not a prop:** Props would require threading `boardDispatch` through `KanbanBoard` → `useRealtimeSimulation`, breaking the feature boundary. A context keeps the hook self-contained and matches the established pattern for `BoardAPIContext`.

**Why NOT through `useBoardAPI()`:** `BoardAPIContext` action creators call `src/api/tasks.ts` and go through the optimistic update cycle (pending ops, history, toasts). Remote updates must NOT enter the pending ops map or history stack — they are external facts, not user intentions.

### useRealtimeSimulation — Full Implementation

```typescript
// src/features/realtime/hooks/useRealtimeSimulation.ts
import { useEffect } from 'react'
import { useTasks } from '@/store/BoardStateContext'
import { useBoardDispatch } from '@/store/BoardDispatchContext'
import type { Priority } from '@/types/task.types'

const PRIORITIES: Priority[] = ['low', 'medium', 'high']

export function useRealtimeSimulation(editingTaskId: string | null) {
  const tasks = useTasks()
  const dispatch = useBoardDispatch()

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>

    function scheduleNext() {
      const delay = Math.floor(Math.random() * 5000) + 10000
      timeoutId = setTimeout(() => {
        // Capture tasks at fire time via closure — intentional stale ref for simulation
        const currentTasks = tasks
        if (currentTasks.length === 0) {
          scheduleNext()
          return
        }

        const idx = Math.floor(Math.random() * currentTasks.length)
        const task = currentTasks[idx]
        // noUncheckedIndexedAccess guard
        if (!task) {
          scheduleNext()
          return
        }

        // Mutate one field — cycle to a different priority
        const otherPriorities = PRIORITIES.filter(p => p !== task.priority)
        const newPriority = otherPriorities[Math.floor(Math.random() * otherPriorities.length)] ?? 'medium'
        const remoteTask = { ...task, priority: newPriority }

        if (task.id === editingTaskId) {
          dispatch({
            type: 'CONFLICT_DETECTED',
            taskId: task.id,
            remoteTask,
            localTask: task,
          })
        } else {
          dispatch({ type: 'REMOTE_UPDATE', task: remoteTask })
        }

        scheduleNext()
      }, delay)
    }

    scheduleNext()
    return () => clearTimeout(timeoutId)
  }, []) // empty deps — intentional; stale closure acceptable for simulation

  // tasks and dispatch referenced but not in deps: this is intentional.
  // The simulation picks a random task at fire time from whatever is in scope.
  // Adding tasks/dispatch to deps would restart the timer on every update,
  // defeating the 10-15s interval semantics.
}
```

**`noUncheckedIndexedAccess` guard:** TypeScript ~6 with `noUncheckedIndexedAccess` makes `currentTasks[idx]` type `Task | undefined`. The `if (!task)` guard satisfies the compiler and prevents a crash on empty-list edge cases.

**`PRIORITIES.filter` returns `Priority[]`** — accessing `[idx]` on the filtered array is also `Priority | undefined`, hence the `?? 'medium'` fallback.

**ESLint `react-hooks/exhaustive-deps`:** The empty `[]` deps will trigger the exhaustive-deps lint warning for `tasks`, `dispatch`, and `editingTaskId`. Suppress with a targeted comment and a WHY explanation:

```typescript
// eslint-disable-next-line react-hooks/exhaustive-deps
// Intentional stale closure: re-arming on every tasks change would reset
// the 10-15s interval on every remote update, creating a feedback loop.
// The simulation intentionally reads a snapshot of tasks at fire time.
}, [])
```

### Wiring in KanbanBoard.tsx

Only one line changes in `KanbanBoard.tsx` — add after the existing hook calls:

```typescript
const { isOpen, mode, editingTask, prefillValues, openCreate, openEdit, close } = useTaskModal()
useRealtimeSimulation(editingTask?.id ?? null)  // ← add this line
```

`editingTask` is already available from `useTaskModal()`. The `?.id ?? null` pattern handles the `Task | null` type safely.

### Random Field Mutation Strategy

The simulation changes `priority` only (cycles to a different value). This:
- Is always a valid change (every task has a priority)
- Is visually visible in the priority badge on `TaskCard`
- Does not alter `status` (avoids confusing card column movement in simulation)
- Does not alter `title` (avoids interfering with pending edits in an open modal)

Title changes are avoided because `editingTaskId` check only prevents dispatching to the currently open task — other tasks' titles could still interfere with the user's mental model if they change. Priority is a safer simulation choice.

### CONFLICT_DETECTED vs REMOTE_UPDATE Dispatch

```
Remote tick fires for task T
│
├── T.id === editingTaskId?
│   ├── YES → dispatch CONFLICT_DETECTED { taskId: T.id, remoteTask, localTask: T }
│   │         boardReducer sets conflict: { taskId, remoteTask, localTask }
│   │         ConflictContext.Provider (value={boardState.conflict}) updates
│   │         ConflictModal (Story 6.3) detects non-null conflict and renders
│   │
│   └── NO  → dispatch REMOTE_UPDATE { task: remoteTask }
│             boardReducer upserts task in-place
│             BoardStateContext.Provider (value={boardState.tasks}) updates
│             Only affected column's useMemo re-computes
```

### Why Empty useEffect Deps is Correct Here

The simulation is a "fire and forget" background process. If `tasks` were in the deps array:
1. Every `REMOTE_UPDATE` dispatch updates `tasks[]`
2. That update re-runs the `useEffect`, canceling the in-flight timer
3. A new 10–15s timer starts immediately after each remote update
4. The timer resets to full delay after every update, effectively throttling itself to never fire again in rapid succession

The stale closure intentionally reads `tasks` from component mount. For a simulation (not real data synchronization), this is the correct trade-off.

### File Paths

```
src/store/BoardDispatchContext.tsx                           ← new file
src/store/AppProvider.tsx                                    ← add BoardDispatchContext.Provider wrapper
src/features/realtime/hooks/useRealtimeSimulation.ts        ← replace stub
src/features/board/components/KanbanBoard.tsx               ← add useRealtimeSimulation call
src/features/realtime/hooks/useRealtimeSimulation.test.ts   ← new test file
_bmad-output/implementation-artifacts/sprint-status.yaml   ← update epic-6 status
```

### Forbidden Patterns

- Dispatching through `useBoardAPI()` from `useRealtimeSimulation` — this bypasses the architectural intent
- Pushing `REMOTE_UPDATE` or `CONFLICT_DETECTED` to the history stack — these are system actions
- Using `Math.random()` for IDs — `useRealtimeSimulation` does not generate IDs; remote tasks reuse existing task IDs
- `state.tasks.push(...)` anywhere — reducer always spreads
- Calling `import.meta.env.DEV` check to gate the simulation — it runs in all environments (it's a feature, not debug code)
- `import { boardDispatch } from '@/store/AppProvider'` — dispatch is never exported directly; it must come from a context

### Verification Checklist

```
1. npm run dev → open board, wait 10-15s → observe a task's priority badge change
2. Open edit modal for a task → wait for the next simulation tick targeting that task
   → ConflictModal should appear (Story 6.3 will render it; for now verify CONFLICT_DETECTED in Redux DevTools or console)
3. Close modal → next tick for same task → REMOTE_UPDATE dispatched normally
4. npm run test → all tests pass (target ≥ 107 from 100)
5. tsc --noEmit → zero errors
6. npm run lint → zero warnings (check eslint-disable comment is correctly placed)
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
