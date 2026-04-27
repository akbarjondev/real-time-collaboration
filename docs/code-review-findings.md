# Code Review Findings — Five-Axis Analysis

**Date:** 2026-04-27  
**Reviewer:** Automated Code Review (code-review-and-quality skill)  
**Codebase:** real-time-collaboration (React 19 + TypeScript Kanban Board)

---

## Executive Summary

| Axis | Critical | Important | Nit | Status |
|------|----------|-----------|-----|--------|
| Correctness | 1 | 2 | 1 | 🔴 Needs Fix |
| Readability | 2 | 5 | 13 | 🟠 Attention |
| Architecture | 3 | 2 | 2 | 🔴 Needs Fix |
| Security | 0 | 4 | 6 | 🟢 Good |
| Performance | 3 | 5 | 4 | 🔴 Needs Fix |
| **TOTAL** | **9** | **18** | **26** | |

**Overall Health:** ⚠️ Needs Attention — 9 critical issues require immediate fixes.

---

## 1. Correctness

### CRITICAL

#### CR-1: Task ID Mismatch in createTask

**Files:**
- `src/store/BoardAPIContext.tsx:49`
- `src/features/history/hooks/useHistory.ts:125`

**Problem:** Client generates a unique task ID optimistically with `nanoid()`, but the API call doesn't pass this ID. The mock API generates its own independent ID, creating a mismatch.

```typescript
// BoardAPIContext.tsx lines 40-55
const newTask = { ...task, id: nanoid(), createdAt: ... }  // Client generates ID
dispatch({ type: 'TASK_CREATE', task: newTask, opId })     // Optimistic: uses client ID
await apiCreateTask(task)  // ❌ Sends task WITHOUT the client's generated ID
```

**Impact:** In a real backend scenario, subsequent operations (update, delete) would fail because the client uses a stale ID. Breaks task persistence and referential integrity.

**Fix Options:**
1. Return the generated task from API with its assigned ID and reconcile
2. Pass the client-generated ID to the API so it uses the same one

---

### IMPORTANT

#### CR-2: HistoryProvider Missing useMemo

**File:** `src/store/HistoryContext.tsx:30-41`

**Problem:** The context value object is recreated on every render without memoization:

```typescript
export function HistoryProvider({ dispatch, tasks, children }: HistoryProviderProps) {
  const history = useHistoryImpl(dispatch, tasks)
  
  const value: HistoryContextType = {  // ❌ New object every render
    undoLabel: history.undoLabel,
    redoLabel: history.redoLabel,
    // ... 8 more properties
  }
  return <HistoryContext.Provider value={value}>{children}</HistoryContext.Provider>
}
```

**Impact:** Every component using `useHistory()` re-renders unnecessarily.

**Fix:**
```typescript
const value = useMemo<HistoryContextType>(() => ({
  undoLabel: history.undoLabel,
  redoLabel: history.redoLabel,
  // ...
}), [history])
```

---

#### CR-3: BoardColumn Virtualization Tests Failing

**File:** `src/features/board/components/BoardColumn.test.tsx`

**Problem:** 7 tests are failing because the virtualizer doesn't render items in the test environment (scroll container has zero height).

**Impact:** Test suite doesn't verify task card rendering, pending indicators, or virtual rendering behavior.

**Fix:** Mock the virtualizer or fix test DOM setup to provide container dimensions.

---

### NIT

#### CR-4: Type Cast Looseness in updateTask

**File:** `src/features/history/hooks/useHistory.ts:138`

**Problem:** Cast to `Record<string, unknown>` bypasses type safety.

---

## 2. Readability & Simplicity

### CRITICAL

#### RD-1: Context Proliferation — Over-Engineered Abstraction

**File:** `src/store/AppProvider.tsx:28-45`

**Problem:** 8 nested Context Providers with mixed concerns:

```
BoardDispatch → BoardState → PendingOps → Conflict → BoardAPI → Filter → FilterAPI → History
```

**Impact:** Component tree is hard to reason about. Creates a context maze instead of prop drilling.

**Recommendation:** Consolidate to 3-4 contexts maximum:
- `BoardContext` (combines state, pendingOps, conflict)
- `FilterContext`
- `HistoryContext`
- `APIContext` (combines board and filter actions)

---

#### RD-2: Stale Closure with ESLint Suppressions

**Files:**
- `src/features/realtime/hooks/useRealtimeSimulation.ts:65-69`
- `src/features/realtime/components/ConflictModal.tsx:49-50`

**Problem:** Multiple intentional stale closures with eslint-disable comments. This is a design smell.

**Recommendation:** Refactor to avoid stale closures instead of silencing linter.

---

### IMPORTANT

#### RD-3: Duplicated Task-Finding Logic

**Files:**
- `src/features/history/hooks/useHistory.ts:87, 134, 155`
- `src/features/board/hooks/useBoardDnd.ts:34, 43, 53`

**Problem:** `tasks.find(t => t.id === taskId)` repeated 5+ times.

**Fix:** Extract to shared utility:
```typescript
// src/shared/utils/taskUtils.ts
export const findTaskById = (tasks: Task[], id: string) => tasks.find(t => t.id === id)
```

---

#### RD-4: Unnecessary Wrapper Contexts

**Files:**
- `src/store/PendingOpsContext.tsx` (8 lines)
- `src/store/ConflictContext.tsx` (8 lines)
- `src/store/BoardStateContext.tsx` (9 lines)

**Problem:** Trivial wrappers that just pass a single value. Add indirection without benefit.

---

#### RD-5: Duplicate Configuration Objects

**Files:**
- `src/features/tasks/components/TaskCard.tsx:15-19` — `PRIORITY_CONFIG`
- `src/features/history/hooks/useHistory.ts:33-37` — `STATUS_LABELS`
- `src/features/board/components/KanbanBoard.tsx:30-40` — `COLUMNS` & `COLUMN_LABELS`

**Fix:** Move to `src/shared/constants/ui-config.ts`

---

#### RD-6: Repetitive Error Handling Pattern

**Files:**
- `src/store/BoardAPIContext.tsx:34-37, 52-54, 64-66, 75-77` (4×)
- `src/features/tasks/components/TaskModal.tsx:140-143, 155-157` (2×)

**Fix:** Extract to helper:
```typescript
async function executeOptimistically<T>(
  fn: () => Promise<T>,
  onRollback: () => void
): Promise<T | void>
```

---

#### RD-7: Inconsistent Naming Convention

**Files:** Various in `src/store/`

**Problem:** Mixed suffixes: `BoardAPIContext` vs `BoardStateContext`, `useHistoryImpl` (why "Impl"?), `FilterAPIContext` vs `PendingOpsContext`.

**Fix:** Standardize to `useX` + private `XProvider` internals.

---

## 3. Architecture

### CRITICAL

#### AR-1: Cross-Feature Imports in KanbanBoard

**File:** `src/features/board/components/KanbanBoard.tsx:12-21`

**Problem:** Imports from 5 different features:

```typescript
import { BoardColumn } from "@/features/board/components/BoardColumn";
import { TaskCard } from "@/features/tasks/components/TaskCard";
import { FilterBar } from "@/features/filters/components/FilterBar";
import { CmdKOverlay } from "@/features/filters/components/CmdKOverlay";
import { useTaskModal } from "@/features/tasks/hooks/useTaskModal";
import { useRealtimeSimulation } from "@/features/realtime/hooks/useRealtimeSimulation";
import { useUndoRedoShortcuts } from "@/features/history/hooks/useUndoRedoShortcuts";
```

**Impact:** Violates architecture rule "No cross-feature imports". Creates tight coupling.

**Fix:** Extract orchestration to a top-level layout component outside features, or move shared components to `src/shared/`.

---

#### AR-2: Store Layer Imports from Features

**File:** `src/store/HistoryContext.tsx:4`

```typescript
import { useHistoryImpl } from '@/features/history/hooks/useHistory'
```

**Problem:** Store (infrastructure layer) imports from features. Inverts dependency flow.

**Fix:** Move `useHistoryImpl` to `src/store/` or refactor architecture.

---

#### AR-3: BoardColumn Imports from Multiple Features

**File:** `src/features/board/components/BoardColumn.tsx:10-15`

```typescript
import { filterTasks } from '@/features/filters/utils/filterTasks'
import { TaskCard } from '@/features/tasks/components/TaskCard'
import type { CreateTaskForm } from '@/features/tasks/hooks/useTaskModal'
```

**Fix:** Move `filterTasks` to `src/shared/utils/`, move `TaskCard` to `src/shared/components/`, move types to `src/types/`.

---

### IMPORTANT

#### AR-4: useHistoryImpl Bypasses useBoardAPI

**File:** `src/features/history/hooks/useHistory.ts:106-131`

**Problem:** The history hook directly dispatches `TASK_CREATE` and calls API functions, bypassing the established `useBoardAPI()` mutation pattern.

**Fix:** Refactor to delegate mutations through `useBoardAPI()`.

---

#### AR-5: Duplicate isFormElementFocused Utility

**Files:**
- `src/features/tasks/hooks/useTaskModal.ts:24-27`
- `src/features/history/hooks/useUndoRedoShortcuts.ts:4-14`

**Fix:** Move to `src/shared/utils/dom.ts`

---

### NIT

#### AR-6: No Feature Public API Definitions

**Problem:** No `index.ts` files in feature directories to define public exports.

---

#### AR-7: Type Imports Leak from Feature Hooks

**File:** `src/features/board/components/BoardColumn.tsx:15`

**Fix:** Move `CreateTaskForm` type to `src/types/`

---

## 4. Security

### STRENGTHS ✅

- No `dangerouslySetInnerHTML` usage
- No hardcoded secrets or credentials
- Strong TypeScript configuration with strict mode
- ErrorBoundary prevents stack trace leaks in production
- Default React escaping on all interpolated content

---

### IMPORTANT

#### SC-1: Missing Input Validation — Tag Length/Format

**File:** `src/features/tasks/components/TaskModal.tsx:301`

**Problem:** Tags input accepts arbitrary strings with no length or format validation.

**Fix:**
```typescript
const MAX_TAG_LENGTH = 20
const MAX_TAGS = 5
// Validate before accepting
```

---

#### SC-2: Unsafe Task ID in DOM Query

**File:** `src/features/filters/components/CmdKOverlay.tsx:62-63`

```typescript
document.getElementById(`task-${task.id}`)
```

**Problem:** DOM query with user-controlled ID. Currently safe (nanoid), but fragile pattern.

**Fix:** Use React refs or data attributes instead.

---

#### SC-3: Form Input Length Not Enforced

**File:** `src/features/tasks/components/TaskModal.tsx:227-303`

**Problem:** Title, description, assignee have no `maxLength` attributes.

**Fix:** Add `maxLength={200}` to title, `maxLength={2000}` to description.

---

#### SC-4: Search Query Not Validated

**Files:**
- `src/features/filters/components/FilterBar.tsx:36`
- `src/features/filters/components/CmdKOverlay.tsx:36-41`

**Fix:**
```typescript
const MAX_SEARCH_LENGTH = 500
if (value.length > MAX_SEARCH_LENGTH) return
```

---

### NIT

#### SC-5: Console Logging in Production

**File:** `src/shared/components/ErrorBoundary.tsx:29`

**Fix:** Gate with `if (import.meta.env.DEV)`

---

#### SC-6: Missing CSRF Headers (for future backend)

**File:** `src/api/tasks.ts`

**Note:** When integrating real API, add CSRF protection headers.

---

## 5. Performance

### CRITICAL

#### PF-1: Context Provider Re-render Cascade

**File:** `src/store/AppProvider.tsx:28-46`

**Problem:** Multiple nested context providers passing new object instances on every render. All consumers of ANY context re-render unnecessarily.

**Fix:** Wrap context values in `useMemo` or consolidate contexts.

---

#### PF-2: N+1 Pattern in BoardColumn Filtering

**File:** `src/features/board/components/BoardColumn.tsx:29-36`

**Problem:** `filterTasks()` called with `tasks.filter(t => t.status === status)` inside `useMemo`. Creates intermediate filtered array, then passes to `filterTasks`. With 3 columns = 3 full array iterations per render.

**Fix:** Memoize the status-filtered array separately.

---

#### PF-3: Set Creation in Hot Path

**File:** `src/features/board/components/BoardColumn.tsx:33-36`

```typescript
const pendingTaskIds = useMemo(
  () => new Set([...pendingOps.values()].map(op => op.taskId)),
  [pendingOps]
)
```

**Problem:** Creates new Set on every `pendingOps` change with intermediate array.

**Fix:** Use Map lookup directly or memoize at a higher level.

---

### IMPORTANT

#### PF-4: Unbounded Keyboard Event Listeners

**File:** `src/shared/hooks/useKeyboardShortcut.ts:16-34`

**Problem:** Every hook instance adds a separate event listener. No debouncing.

**Fix:** Centralize keyboard shortcut handler with event delegation.

---

#### PF-5: Task Search O(n×m) Lookup

**File:** `src/features/filters/components/CmdKOverlay.tsx:36-44`

```typescript
mruIds.map(id => allTasks.find(t => t.id === id))
```

**Fix:** Build `Map<id, Task>` for O(1) lookups.

---

#### PF-6: useHistory Hook Re-creates Value Object

**File:** `src/store/HistoryContext.tsx:27-41`

**Fix:** See CR-2 — wrap in `useMemo`.

---

#### PF-7: Conflict Modal Repeated Diff Computation

**File:** `src/features/realtime/components/ConflictModal.tsx:104-145`

**Problem:** `fieldsDiffer()` called 10 times per render.

**Fix:** Memoize diff computation.

---

#### PF-8: Drag Handler N+1 Finds

**File:** `src/features/board/hooks/useBoardDnd.ts:33-56`

**Problem:** Two separate `tasks.find()` calls on every drop.

**Fix:** Use Map index or memoize lookup.

---

## Recommended Fix Priority

### Phase 1: Critical Fixes (High Impact)

| # | Issue | File | Effort |
|---|-------|------|--------|
| 1 | CR-1: Task ID mismatch | BoardAPIContext.tsx, useHistory.ts | Medium |
| 2 | CR-2/PF-6: HistoryProvider useMemo | HistoryContext.tsx | Low |
| 3 | PF-1: Context cascade | AppProvider.tsx | Medium |
| 4 | AR-1/AR-2/AR-3: Cross-feature imports | Multiple | High |

### Phase 2: Important Fixes

| # | Issue | File | Effort |
|---|-------|------|--------|
| 5 | CR-3: Fix virtualizer tests | BoardColumn.test.tsx | Medium |
| 6 | RD-3/AR-5: Consolidate duplicates | Multiple | Low |
| 7 | SC-1/SC-3/SC-4: Input validation | TaskModal.tsx, FilterBar.tsx | Low |
| 8 | PF-2/PF-3: BoardColumn optimization | BoardColumn.tsx | Medium |

### Phase 3: Cleanup & Polish

- Consolidate contexts (RD-1, RD-4)
- Standardize naming (RD-7)
- Extract shared constants (RD-5)
- Add feature index files (AR-6)

---

## Appendix: Files Requiring Changes

| File | Issues |
|------|--------|
| `src/store/AppProvider.tsx` | PF-1, RD-1 |
| `src/store/HistoryContext.tsx` | CR-2, PF-6, AR-2 |
| `src/store/BoardAPIContext.tsx` | CR-1, RD-6 |
| `src/features/board/components/KanbanBoard.tsx` | AR-1 |
| `src/features/board/components/BoardColumn.tsx` | AR-3, PF-2, PF-3 |
| `src/features/board/hooks/useBoardDnd.ts` | RD-3, PF-8 |
| `src/features/history/hooks/useHistory.ts` | CR-1, RD-3, AR-4 |
| `src/features/tasks/components/TaskModal.tsx` | SC-1, SC-3, RD-6 |
| `src/features/filters/components/CmdKOverlay.tsx` | SC-2, PF-5 |
| `src/features/filters/components/FilterBar.tsx` | SC-4 |
| `src/features/realtime/hooks/useRealtimeSimulation.ts` | RD-2 |
| `src/features/realtime/components/ConflictModal.tsx` | RD-2, PF-7 |
| `src/shared/hooks/useKeyboardShortcut.ts` | PF-4 |

---

*Generated by automated Five-Axis Code Review*
