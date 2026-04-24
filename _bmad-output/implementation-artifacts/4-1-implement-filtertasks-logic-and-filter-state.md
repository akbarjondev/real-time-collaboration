# Story 4.1: Implement filterTasks Logic and Filter State

Status: ready-for-dev

## Story

As a user,
I want the board to instantly show only tasks matching my active filters,
so that I can focus on relevant work items without page reloads.

## Acceptance Criteria

1. **Given** `src/features/filters/utils/filterTasks.ts`  
   **When** implemented as a pure function `(tasks: Task[], filters: FilterState) => Task[]`  
   **Then** it filters correctly by `assignee` (exact match), `priority` (exact match), `searchQuery` (case-insensitive substring on title and description)  
   **And** all active filters are ANDed together  
   **And** an empty `FilterState` (all null/empty string) returns all tasks unmodified

2. **Given** the filterTasks function is used in `BoardColumn`  
   **When** wrapped in `useMemo` keyed on `[tasks, filters, status]`  
   **Then** filter computation completes within 50ms for 1000+ tasks (client-side memoized)

3. **Given** `FilterContext` and `FilterAPIContext` are already wired into `AppProvider`  
   **When** `useFilterAPI().setFilter()` is called with a new assignee or priority  
   **Then** `FilterContext` updates and all column task lists re-derive immediately  
   **And** `BoardStateContext` does NOT re-render (filter change is isolated to FilterContext consumers)

4. **Given** `filterTasks.test.ts`  
   **When** the test suite runs  
   **Then** all filter combinations pass: assignee only, priority only, search only, combined, and empty filters

## Tasks / Subtasks

- [ ] Task 1: Implement `filterTasks` pure function (AC: #1, #2)
  - [ ] Replace `export {}` stub in `src/features/filters/utils/filterTasks.ts` with the full implementation
  - [ ] Import `Task` from `@/types/task.types` and `FilterState` from `@/store/FilterContext`
  - [ ] Early return all tasks when all filter fields are null/empty (performance fast path)
  - [ ] Apply AND logic: assignee exact match → priority exact match → searchQuery substring match

- [ ] Task 2: Wire `filterTasks` into `BoardColumn` (AC: #2, #3)
  - [ ] Add `useFilters()` call in `BoardColumn.tsx`
  - [ ] Update the existing `useMemo` to apply `filterTasks` AFTER the status filter
  - [ ] Update deps array to `[tasks, filters, status]`
  - [ ] No other changes to BoardColumn in this story — empty state UI is Story 4.2

- [ ] Task 3: Write tests (AC: #1, #4)
  - [ ] Create `src/features/filters/utils/filterTasks.test.ts` (co-located with the utility)
  - [ ] Test: empty filters returns all tasks unchanged
  - [ ] Test: assignee filter (Alice only)
  - [ ] Test: priority filter (high only)
  - [ ] Test: searchQuery matches title (case-insensitive)
  - [ ] Test: searchQuery matches description (case-insensitive)
  - [ ] Test: combined assignee + priority filter (AND logic)
  - [ ] Test: combined assignee + searchQuery filter
  - [ ] Test: no tasks match → returns empty array
  - [ ] Test: null assignee/priority fields are ignored (partial filter state)

---

## Dev Notes

### `filterTasks` Implementation

File: `src/features/filters/utils/filterTasks.ts` (replace stub `export {}`)

```typescript
import type { Task } from '@/types/task.types'
import type { FilterState } from '@/store/FilterContext'

export function filterTasks(tasks: Task[], filters: FilterState): Task[] {
  const { assignee, priority, searchQuery } = filters

  if (!assignee && !priority && !searchQuery) return tasks

  return tasks.filter(task => {
    if (assignee && task.assignee !== assignee) return false
    if (priority && task.priority !== priority) return false
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      const inTitle = task.title.toLowerCase().includes(q)
      const inDesc = task.description?.toLowerCase().includes(q) ?? false
      if (!inTitle && !inDesc) return false
    }
    return true
  })
}
```

**Why early return:** Avoids iterating tasks when all filters are inactive. This is the 90% case (no filters active) and is the primary performance optimization.

**`noUncheckedIndexedAccess` note:** `task.description` is `string | undefined` — use optional chaining `?.toLowerCase()` and nullish coalesce `?? false`.

### `BoardColumn` Update

Current (around line 21–24 in `BoardColumn.tsx`):
```typescript
const tasks = useTasks()
const columnTasks = useMemo(
  () => tasks.filter(t => t.status === status),
  [tasks, status]
)
```

Updated:
```typescript
import { filterTasks } from '@/features/filters/utils/filterTasks'
import { useFilters } from '@/store/FilterContext'

// Inside component:
const tasks = useTasks()
const filters = useFilters()
const columnTasks = useMemo(
  () => filterTasks(tasks.filter(t => t.status === status), filters),
  [tasks, filters, status]
)
```

**Pattern:** Status filter first (reduces array), then `filterTasks` applies the FilterState predicates. Slightly more efficient than filtering full task list before status split.

**CRITICAL — Do NOT re-order the context calls.** `useTasks()` and `useFilters()` must remain unconditional hooks at the top of the component body.

### FilterContext — Already Wired

`FilterContext`, `FilterAPIContext`, `filterReducer`, and both providers are fully implemented in:
- `src/store/FilterContext.tsx` — `FilterState`, `filterReducer`, `FilterProvider`, `useFilters()`
- `src/store/FilterAPIContext.tsx` — `FilterAPIContextType`, `FilterAPIProvider`, `useFilterAPI()`
- `src/store/AppProvider.tsx` — both providers in the correct nesting order

**DO NOT** re-create or re-wire these. They are complete. Only `filterTasks.ts` (stub) and `BoardColumn.tsx` (useMemo update) need changes.

### Seed Data for Tests

Assignees: `Alice`, `Bob`, `Carol`, `Dave`  
Priorities: `'low'`, `'medium'`, `'high'`  
Tags: backend/frontend/devops/testing/performance/accessibility/security/dx  
[Source: `src/shared/utils/mockData.ts`]

### Count Badge Updates Automatically

`BoardColumn` derives the count badge from `columnTasks.length` (the memoized derived list). Once `filterTasks` is applied, the count badge naturally reflects filtered counts — no extra changes needed.

### File Paths

```
src/features/filters/utils/filterTasks.ts       ← replace stub
src/features/filters/utils/filterTasks.test.ts  ← new test file
src/features/board/components/BoardColumn.tsx   ← add useFilters() + update useMemo
```

### Verification Checklist

```
1. npm run test → all tests pass (expect ~109+ total)
2. tsc --noEmit → zero errors
3. Open board → no visual change (no filters active = all tasks shown)
4. In browser console: filterAPI.setAssignee('Alice') → only Alice tasks visible
5. filterAPI.resetFilters() → all tasks return
6. npm run lint → zero warnings
```

### References

- `FilterState` type: [Source: `src/store/FilterContext.tsx`]
- `FilterAPIContextType`: [Source: `src/store/FilterAPIContext.tsx`]
- `BoardColumn` current implementation: [Source: `src/features/board/components/BoardColumn.tsx:21-24`]
- Performance requirement <50ms for 1000+ tasks: [Source: NFR4, planning-distillate.md]
- AND filter logic: [Source: FR10, epic-4-filtering-search.md]
- `noUncheckedIndexedAccess` pattern for optional fields: [Source: project-context.md#Language-Specific Rules]

---

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List

### Change Log
