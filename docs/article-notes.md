# Architecture Session Notes — Real-Time Collaborative Task Board

**Session date:** 2026-04-23
**Outcome:** Complete architecture document at `_bmad-output/planning-artifacts/architecture.md`

---

## Best Choices & Key Findings

### Finding 1 — The undo/redo + optimistic rollback invariant is the highest-risk design decision

Most implementations treat undo/redo and API rollback as separate concerns and accidentally couple them. The key insight: **these are fundamentally different operations and must never share the same code path.**

- `OP_ROLLBACK` restores a snapshot because the API failed — it is a *system correction*, invisible to the user's intent
- `UNDO` reverses a *user decision* — it must be explicit, keyboard-triggered, and always reversible with redo

**The rule:** `OP_ROLLBACK`, `REMOTE_UPDATE`, and `CONFLICT_DETECTED` actions must **never** push to the history stack. Only the four user action types (`TASK_MOVE`, `TASK_CREATE`, `TASK_UPDATE`, `TASK_DELETE`) do.

If this invariant breaks, the redo stack corrupts mid-rollback and the user gets phantom undo entries for failures they didn't cause.

---

### Finding 2 — Single reducer + split read contexts is the right pattern for atomic + performant state

The naive approach is either one big context (simple but causes re-renders everywhere) or fully separate reducers per domain (fine-grained but requires coordinating multiple dispatches for atomic state changes).

**The correct pattern:** one `boardReducer` manages `{ tasks, pendingOps, conflict }` as a single state object. `AppProvider` unpacks this into three separate read-only contexts.

```typescript
const [boardState, boardDispatch] = useReducer(boardReducer, initial)

<BoardStateContext.Provider value={boardState.tasks}>
  <PendingOpsContext.Provider value={boardState.pendingOps}>
    <ConflictContext.Provider value={boardState.conflict}>
```

**Why this matters:** An optimistic update that moves a task AND records its snapshot in pendingOps is a single atomic reducer case — no race condition, no inconsistent intermediate state. But consumers only subscribe to the slice they care about, so re-renders are surgical.

---

### Finding 3 — Operation identity (opId) is what makes concurrent rollbacks safe

With 10% random mock API failures and multiple in-flight operations, naive rollback implementations restore the wrong snapshot. The fix: every mutation generates a unique `opId = nanoid()` at dispatch time. The pending ops map is keyed by this ID.

```typescript
case 'OP_ROLLBACK': {
  const op = state.pendingOps.get(action.opId)  // O(1) lookup
  // restore only op.snapshot for op.taskId
  // other in-flight ops are unaffected
}
```

A user who drags three tasks in quick succession gets three independent opIds. If the second fails and rolls back, the first and third are completely unaffected. Without opIds, you'd have to guess which snapshot to restore.

---

### Finding 4 — Command pattern with forward/inverse pairs is better than snapshot stacks for large lists

Two approaches to undo/redo:
- **Snapshot stack:** save the full task list state before each action. Simple, O(1) undo. But at 1000+ tasks × 50 history entries = potentially large memory footprint, and the snapshots become stale the moment a remote update arrives.
- **Command pattern:** store `{ forward: UserAction, inverse: UserAction, label }` pairs. Memory-efficient (just the deltas). The inverse is captured at dispatch time when the current value is known.

For this project the command pattern wins on both memory and correctness — a remote update that changes a task doesn't invalidate the history entry for an earlier move on a *different* task.

---

### Finding 5 — Stable API context pattern eliminates a whole category of re-render bugs

Exposing raw `dispatch` through context means every component that calls `dispatch` must import the action shape directly. Opaque calls like `dispatch({ type: 'TASK_MOVE', taskId, newStatus, opId: nanoid() })` scatter `nanoid()` calls and action type strings across the codebase.

The stable API context solves three problems at once:

```typescript
const api = useMemo(() => ({
  moveTask: (taskId, newStatus) =>
    dispatch({ type: 'TASK_MOVE', taskId, newStatus, opId: nanoid() }),
}), []) // truly stable — dispatch from useReducer never changes
```

1. `opId` generation lives in one place
2. Action shape is encapsulated — components call `api.moveTask()`, not action creators
3. `BoardAPIContext` consumers **never re-render** because the context value reference is permanently stable

---

### Finding 6 — Separating FilterContext from BoardStateContext is a big performance win

If filters and tasks live in the same context, every keystroke in the search box re-renders all 1000 task cards. Separated:

- `FilterContext` change → re-renders `FilterBar` + column components (lightweight)
- Column components re-derive their filtered list with `useMemo` → new array reference only if result actually changed
- `TaskCard` is `React.memo`'d → only re-renders when its own `task` prop reference changes
- Typing in the search box never touches a single `TaskCard`

The `useMemo` on the filtered list is the bridge: it absorbs the `FilterContext` change and converts it into a stable array reference if the filtered output is the same.

---

### Finding 7 — SWC over Babel is a small but meaningful interview signal

> **Note:** This project later switched from `@vitejs/plugin-react-swc` (SWC) to `@vitejs/plugin-react` (Babel) for compatibility reasons.

`react-swc-ts` template vs `react-ts` — the only difference is the compiler. SWC (Rust-based) is ~10x faster at transform time. For a solo dev on an interview project this barely matters in practice, but it signals awareness of the current toolchain ecosystem. An interviewer who notices the template choice gets a data point about the candidate's tooling awareness without any extra explanation needed.

---

### Finding 8 — dnd-kit requires three packages, not one

A common mistake: installing only `@dnd-kit/core` and hitting missing exports at runtime.

```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

- `@dnd-kit/core` — sensors, DndContext, drag overlay
- `@dnd-kit/sortable` — SortableContext, useSortable — needed for within-column task ordering
- `@dnd-kit/utilities` — CSS.Transform and other helpers used in drag transform calculations

---

### Finding 9 — Vitest needs jsdom + setup file for React Testing Library

The Vite starter does not include a test environment. Without explicit configuration, RTL tests fail silently or with cryptic DOM errors.

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
  },
})

// src/test-setup.ts
import '@testing-library/jest-dom'
```

The `useHistory` hook and `boardReducer` are pure functions — they can be unit tested without jsdom at all. Only component tests need the full jsdom + RTL setup.

---

### Finding 10 — useRealtimeSimulation must bypass useHistory, not wrap it

The real-time simulation dispatches `REMOTE_UPDATE` directly to the board reducer. If it were routed through `useHistory`, every simulated remote change would appear in the user's undo stack — pressing Ctrl+Z would undo *someone else's* change, which is wrong behaviour.

The correct mental model: `useHistory` owns the *user's* action history. Everything else (API outcomes, remote simulation, conflict resolution) is infrastructure that the user's history is layered on top of.

---

### Finding 11 — Context value must be the slice directly, not an object wrapper

**The trap:** splitting contexts into multiple Providers is useless if you wrap each slice in a new object:

```typescript
// ❌ Defeats the split — new object reference on EVERY dispatch
<BoardStateContext.Provider value={{ tasks: boardState.tasks }}>
<PendingOpsContext.Provider value={{ pendingOps: boardState.pendingOps }}>
```

`AppProvider` re-renders on every dispatch (because `boardState` changed). That causes all three Provider components to re-render. React diffs context values with `Object.is` — so `{ tasks: boardState.tasks }` is always a new object, always a new reference, and ALL consumers re-render regardless of which slice actually changed. The whole split is wasted.

**The fix:** pass the slice itself as the value, not wrapped:

```typescript
// ✅ Context value IS the slice — React diffs the reference directly
const BoardStateContext = createContext<Task[]>([])
const PendingOpsContext = createContext<Map<string, PendingOperation>>(new Map())
const ConflictContext   = createContext<ConflictState | null>(null)

<BoardStateContext.Provider value={boardState.tasks}>
<PendingOpsContext.Provider value={boardState.pendingOps}>
<ConflictContext.Provider   value={boardState.conflict}>
```

Now when `OP_SUCCESS` fires, the reducer returns `{ ...state, pendingOps: newMap }`. The `tasks` property keeps its same array reference. So:

- `BoardStateContext` value → same reference → task consumers **do not re-render** ✅
- `PendingOpsContext` value → new Map reference → loading indicators **re-render** ✅

**Alternative** if you need an object shape:

```typescript
const boardStateValue = useMemo(
  () => ({ tasks: boardState.tasks }),
  [boardState.tasks]  // new object only when tasks actually changes
)
```

**The mental model:** single reducer gives you **atomic writes**. Passing slice references directly gives you **selective reads**. Both are required for the architecture to work as intended.

---

## Research Notes — Performant React Context

**Source:** https://www.developerway.com/posts/how-to-write-performant-react-apps-with-context

---

## Core Problem

Every Context consumer re-renders when the context value changes — regardless of whether that consumer uses the changed value. At 1000+ tasks this becomes a serious performance issue.

## Key Patterns

### 1. State + API (Dispatch) Split

Never expose raw `dispatch`. Wrap it in a stable API object via `useMemo` with empty deps. Since `dispatch` from `useReducer` is stable for the provider lifetime, the entire API object never changes reference — consumers of the API context **never re-render** due to state changes.

```typescript
const api = useMemo(() => ({
  moveTask: (taskId: string, newStatus: TaskStatus) =>
    dispatch({ type: 'TASK_MOVE', taskId, newStatus, opId: nanoid() }),
  // ...
}), []) // empty deps — dispatch is stable, so api is stable
```

**Applied in this project:** `BoardAPIContext` and `FilterAPIContext` both follow this pattern.

### 2. Granular Context Division

Split one large state context into multiple domain-specific contexts that change independently. This ensures a change in one domain does not trigger re-renders in unrelated consumers.

**Applied in this project:**

| Context | Changes When | Consumers |
|---|---|---|
| `BoardStateContext` | Any task mutates | Column components (via useMemo) |
| `PendingOpsContext` | Op starts / succeeds / rolls back | Task card loading indicators only |
| `ConflictContext` | Conflict detected / resolved | Conflict modal only |
| `FilterContext` | User changes filter/search | Filter bar, column derived lists |

**Win:** A pending op completing does NOT re-render columns or task cards. Conflict state changes do NOT touch the task list render path.

### 3. Stable Callbacks via useReducer

Using `useReducer` (vs `useState`) makes the `dispatch` reference stable, which is what makes the empty-deps `useMemo` API pattern reliable. With `useState` setters this also works, but `useReducer` + dispatch is the canonical pattern for complex state machines.

### 4. Selective Hook Usage

Expose one custom hook per domain rather than raw context access:

```typescript
useTasks()      // BoardStateContext — re-renders on task changes
useBoardAPI()   // BoardAPIContext  — NEVER re-renders (stable)
usePendingOps() // PendingOpsContext — re-renders on op changes only
useConflict()   // ConflictContext  — re-renders on conflict only
useFilters()    // FilterContext    — re-renders on filter changes only
useFilterAPI()  // FilterAPIContext — NEVER re-renders (stable)
useHistory()    // HistoryContext   — re-renders on undo/redo label change
```

This means components import a semantic hook, not a raw context — and TypeScript catches usage outside a provider immediately.

## Applied Architecture for This Project

```
AppProvider
├── BoardStateContext    — tasks[] only
├── PendingOpsContext    — Map<opId, PendingOperation>
├── ConflictContext      — ConflictState | null
├── BoardAPIContext      — stable memoized action creators
├── FilterContext        — { assignee, priority, searchQuery }
├── FilterAPIContext     — stable { setFilter, setSearch }
└── HistoryContext       — { undoLabel, redoLabel, canUndo, canRedo }
```

## Performance Invariants to Enforce

1. Every `TaskCard` is `React.memo`'d — re-renders only when its own `task` prop changes
2. Column task lists derived with `useMemo` — keyed on `tasks` + filters
3. API context consumers never re-render — useMemo with empty deps
4. `PendingOpsContext` change ≠ column re-render (separate contexts)
5. `ConflictContext` change ≠ task list re-render (separate contexts)
