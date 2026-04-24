# Story 4.2: Build Direction D Filter Bar with Active Chips

Status: ready-for-dev

## Blocker

**Do NOT start until Story 4.1 is marked `done`.**  
Story 4.2 renders `FilterBar` which calls `useFilterAPI()` to set filters. The board columns must already consume `filterTasks` (wired in 4.1) so that selecting a chip immediately shows filtered results. If 4.1 is not done, filter API calls exist but the columns won't react.

---

## Story

As a user,
I want a persistent filter bar below the board header showing all available filters and my active selections as dismissible chips,
so that I always know what filter state the board is in.

## Acceptance Criteria

1. **Given** the board is loaded  
   **When** no filters are active  
   **Then** the filter bar shows a search input field, "Assignee" and "Priority" filter dropdowns, and a "Clear all" ghost button (right-aligned)  
   **And** no active chips are visible

2. **Given** the user selects a filter value from the Assignee dropdown  
   **When** the selection is made  
   **Then** an active filter chip appears: `violet-100` background, `violet-300` border, "Assignee: [name]" label, × dismiss button  
   **And** the column task lists update immediately  
   **And** the column count badges update to reflect filtered counts

3. **Given** active filter chips are present  
   **When** the user clicks × on a chip  
   **Then** that specific filter is cleared and the chip disappears  
   **And** the board returns to the state with remaining filters applied

4. **Given** multiple active filter chips  
   **When** the bar renders  
   **Then** chips wrap to a second line — no overflow or horizontal scroll

5. **Given** the user clicks "Clear all"  
   **When** the action executes  
   **Then** all active filters are removed (`resetFilters()`) and the board shows all tasks

6. **Given** a filtered column has no matching tasks  
   **When** rendered  
   **Then** the filtered-empty-state shows: `Filter` icon, "No matches" heading, "No tasks match the current filter" subtext, "Clear filter" link  
   **And** (if no filters are active and column is truly empty) the original empty state remains: `Inbox` icon, "No tasks", "Drag a task here or add one"

## Tasks / Subtasks

- [ ] Task 1: Build `FilterBar` component (AC: #1, #2, #3, #4, #5)
  - [ ] Replace `export {}` stub in `src/features/filters/components/FilterBar.tsx`
  - [ ] Call `useFilters()` (read state) and `useFilterAPI()` (dispatch)
  - [ ] Render search input — `value={filters.searchQuery}`, `onChange` calls `filterAPI.setSearch()`
  - [ ] Render Assignee `Select` dropdown with options: `All`, `Alice`, `Bob`, `Carol`, `Dave`
  - [ ] Render Priority `Select` dropdown with options: `All`, `High`, `Medium`, `Low`
  - [ ] Render active chip for assignee when `filters.assignee !== null`
  - [ ] Render active chip for priority when `filters.priority !== null`
  - [ ] Render active chip for searchQuery when `filters.searchQuery !== ''`
  - [ ] Each chip: violet-100 bg + violet-300 border + label + `×` button that calls the appropriate clear function
  - [ ] Render "Clear all" ghost button — only visible when any filter is active; calls `filterAPI.resetFilters()`
  - [ ] Chips container uses `flex flex-wrap gap-2` for wrapping (AC: #4)
  - [ ] Accessibility: search input has `aria-label="Search tasks"`, dropdowns have `aria-label`, chip dismiss buttons have `aria-label="Remove [filter name] filter"`

- [ ] Task 2: Update `BoardColumn` filtered empty state (AC: #6)
  - [ ] Detect when column has no tasks AND filters are active: `columnTasks.length === 0 && isFiltered`
  - [ ] `isFiltered = filters.assignee !== null || filters.priority !== null || filters.searchQuery !== ''`
  - [ ] If filtered empty: show Filter icon + "No matches" + "No tasks match the current filter" + "Clear filter" link (`onClick` → `filterAPI.resetFilters()`)
  - [ ] If truly empty (no filters): keep existing empty state unchanged (Inbox icon + "No tasks" + "Drag a task here or add one" + "Add task" ghost button)
  - [ ] Import `useFilters` and `useFilterAPI` (already used in 4.1 for useMemo)

- [ ] Task 3: Mount `FilterBar` in `KanbanBoard` (AC: #1)
  - [ ] Import `FilterBar` from `@/features/filters/components/FilterBar`
  - [ ] Replace `{/* FilterBar — Story 4.2 */}` comment with `<FilterBar />`
  - [ ] FilterBar renders between `<header>` and the `<DndContext>` main area

- [ ] Task 4: Write tests (AC: all)
  - [ ] Create `src/features/filters/components/FilterBar.test.tsx`
  - [ ] Test: renders without active chips when filters are empty
  - [ ] Test: Assignee Select renders all 4 assignee options + "All"
  - [ ] Test: selecting an assignee renders an active chip with dismiss button
  - [ ] Test: clicking chip dismiss calls `setAssignee(null)`
  - [ ] Test: "Clear all" button only visible when filters are active
  - [ ] Test: "Clear all" calls `resetFilters()`
  - [ ] Test: search input onChange calls `setSearch`
  - [ ] Update `BoardColumn.test.tsx`: filtered empty state renders when columnTasks is empty + filters active

---

## Dev Notes

### FilterBar Component Skeleton

File: `src/features/filters/components/FilterBar.tsx`

```typescript
import { Search, X, Filter } from 'lucide-react'
import { useFilters } from '@/store/FilterContext'
import { useFilterAPI } from '@/store/FilterAPIContext'
import { cn } from '@/shared/utils/cn'
import type { Priority } from '@/types/task.types'

export function FilterBar() {
  const filters = useFilters()
  const filterAPI = useFilterAPI()

  const hasActiveFilters =
    filters.assignee !== null ||
    filters.priority !== null ||
    filters.searchQuery !== ''

  return (
    <div className="border-b border-zinc-200 bg-white px-6 py-3 flex flex-col gap-2">
      {/* Controls row */}
      <div className="flex items-center gap-3">
        {/* Search input */}
        <div className="relative flex items-center">
          <Search className="absolute left-2.5 h-4 w-4 text-zinc-400" aria-hidden="true" />
          <input
            type="text"
            value={filters.searchQuery}
            onChange={e => filterAPI.setSearch(e.target.value)}
            placeholder="Search tasks… (⌘K)"
            aria-label="Search tasks"
            className="pl-9 pr-3 py-1.5 text-sm rounded-md border border-zinc-200 bg-zinc-50 focus:bg-white focus-visible:ring-2 focus-visible:ring-violet-500 focus:outline-none w-56"
          />
        </div>
        {/* ... Assignee + Priority Selects + Clear all */}
      </div>

      {/* Active chips row */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2" aria-label="Active filters">
          {/* chips rendered here */}
        </div>
      )}
    </div>
  )
}
```

### Active Chip Markup

```tsx
{filters.assignee && (
  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs
                   bg-violet-100 border border-violet-300 text-violet-700">
    Assignee: {filters.assignee}
    <button
      onClick={() => filterAPI.setAssignee(null)}
      aria-label="Remove assignee filter"
      className="ml-0.5 rounded-full hover:bg-violet-200 focus-visible:ring-1 focus-visible:ring-violet-500 p-0.5"
    >
      <X className="h-3 w-3" aria-hidden="true" />
    </button>
  </span>
)}
```

Apply the same pattern for `filters.priority` and `filters.searchQuery`.

### Assignee + Priority Selects

Use the already-installed shadcn `Select` component (no new shadcn installs needed for this story):

```tsx
<Select
  value={filters.assignee ?? ''}
  onValueChange={v => filterAPI.setAssignee(v === '' ? null : v)}
>
  <SelectTrigger className="w-32 text-sm" aria-label="Filter by assignee">
    <SelectValue placeholder="Assignee" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="">All</SelectItem>
    <SelectItem value="Alice">Alice</SelectItem>
    <SelectItem value="Bob">Bob</SelectItem>
    <SelectItem value="Carol">Carol</SelectItem>
    <SelectItem value="Dave">Dave</SelectItem>
  </SelectContent>
</Select>
```

Priority Select:
```tsx
<Select
  value={filters.priority ?? ''}
  onValueChange={v => filterAPI.setPriority(v === '' ? null : v as Priority)}
>
  <SelectTrigger className="w-28 text-sm" aria-label="Filter by priority">
    <SelectValue placeholder="Priority" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="">All</SelectItem>
    <SelectItem value="high">High</SelectItem>
    <SelectItem value="medium">Medium</SelectItem>
    <SelectItem value="low">Low</SelectItem>
  </SelectContent>
</Select>
```

**CRITICAL:** `value={filters.assignee ?? ''}` — the Select's value must be a string, not null. Use `''` as the "no selection" sentinel, and convert `''` back to `null` in `onValueChange`.

### BoardColumn Filtered Empty State

Update the empty-state rendering in `BoardColumn.tsx`. The component already has `useFilters()` from Story 4.1. Add:

```typescript
import { useFilterAPI } from '@/store/FilterAPIContext'
// ...
const filterAPI = useFilterAPI()
const isFiltered =
  filters.assignee !== null ||
  filters.priority !== null ||
  filters.searchQuery !== ''
```

In the render (where the existing Inbox empty state is):
```tsx
{columnTasks.length === 0 && (
  isFiltered ? (
    <div className="flex flex-col items-center gap-2 py-8 text-zinc-400">
      <Filter className="h-8 w-8" aria-hidden="true" />
      <p className="text-sm font-medium text-zinc-500">No matches</p>
      <p className="text-xs">No tasks match the current filter</p>
      <button
        onClick={() => filterAPI.resetFilters()}
        className="text-xs text-violet-600 hover:text-violet-700 underline focus-visible:ring-2 focus-visible:ring-violet-500 rounded"
      >
        Clear filter
      </button>
    </div>
  ) : (
    /* existing Inbox empty state — no changes */
  )
)}
```

### KanbanBoard Wiring

In `src/features/board/components/KanbanBoard.tsx`, find the comment:
```tsx
{/* FilterBar — Story 4.2 */}
```

Replace with:
```tsx
<FilterBar />
```

And add the import:
```typescript
import { FilterBar } from '@/features/filters/components/FilterBar'
```

### Icons Used

`Search`, `X`, `Filter` from `lucide-react` (already installed). No new dependencies.

### No Barrel Exports

Import `FilterBar` directly: `import { FilterBar } from '@/features/filters/components/FilterBar'` — no `index.ts`.

### File Paths

```
src/features/filters/components/FilterBar.tsx       ← replace stub
src/features/filters/components/FilterBar.test.tsx  ← new
src/features/board/components/BoardColumn.tsx       ← add filtered empty state
src/features/board/components/KanbanBoard.tsx       ← mount FilterBar
```

### Verification Checklist

```
1. npm run test → all tests pass
2. tsc --noEmit → zero errors
3. Open board → FilterBar renders below header, no chips visible
4. Type in search → board filters in real time, search chip appears
5. Select assignee → assignee chip appears, columns update
6. Click × on chip → that filter cleared, others remain
7. Click "Clear all" → all filters clear, full board shown
8. Set filter that produces 0 tasks in a column → filtered empty state with "Clear filter" link
9. Click "Clear filter" → full board restored
10. npm run lint → zero warnings
```

### References

- `useFilters()` / `useFilterAPI()`: [Source: `src/store/FilterContext.tsx`, `src/store/FilterAPIContext.tsx`]
- FilterBar comment location in KanbanBoard: [Source: `src/features/board/components/KanbanBoard.tsx`]
- Design Direction D filter bar spec: [Source: `ux-design-specification.md#Implementation Approach`]
- Active chip anatomy (violet-100 + violet border): [Source: planning-distillate.md#Visual Design & UX]
- Empty state patterns: [Source: `ux-design-specification.md#Empty State Patterns`]
- Seed data assignees: [Source: `src/shared/utils/mockData.ts`]
- shadcn Select already installed: [Source: `_bmad-output/implementation-artifacts/1-4-build-kanban-board-shell-with-three-columns.md`]
- `focus:outline-none` requires `focus-visible:ring-2 focus-visible:ring-violet-500` replacement: [Source: project-context.md#Critical Don't-Miss Rules]

---

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List

### Change Log
