# Story 8.1: Virtualized Task List per Column

Status: ready-for-dev

## Blocker

**Do NOT start until Epic 4 Story 4.1 is marked `done`.**
This story updates `BoardColumn.tsx` which Story 4.1 also modifies (it adds `useFilters()` and updates the `useMemo` deps to `[tasks, filters, status]`). Starting before 4.1 is done will produce a merge conflict and will miss the `filters` dep in the virtualizer's `count` input.

---

## Story

As a user with a large backlog,
I want columns to only mount the task cards I can actually see,
so that the board stays smooth and fast even with hundreds of tasks per column.

## Acceptance Criteria

1. **Given** a column with more tasks than fit in the viewport **When** the board renders **Then** only the visible cards plus up to 5 overscan cards above/below are mounted in the DOM.

2. **Given** a virtualised column **When** the user scrolls inside that column **Then** cards enter and leave the DOM as they cross the viewport boundary and the column never has a flash or jump.

3. **Given** a remote update arrives (REMOTE_UPDATE action) **When** a task field changes but the task ID is unchanged **Then** the scroll position of the affected column is not reset.

4. **Given** active filters reduce a column's task list **When** the filter changes **Then** the virtualizer recalculates `count` and `getTotalSize()` correctly — cards that no longer match are not rendered.

5. **Given** a column where `columnTasks.length === 0` (no tasks, or all filtered out) **When** the column renders **Then** the empty state (Inbox icon + "No tasks" text + dashed Add-task button) is shown instead of the virtual scroller.

6. **Given** the dnd-kit `SortableContext` **When** virtualization is active **Then** `SortableContext` still receives ALL column task IDs in its `items` prop (not just visible ones) so that drag-and-drop collision detection is unaffected.

7. **Given** the virtual list implementation **When** running `tsc --noEmit` **Then** zero TypeScript errors; `noUncheckedIndexedAccess` guard (`if (!task) return null`) is present on the virtual item lookup.

8. **Given** a production build **When** Lighthouse Performance audit runs on a desktop profile **Then** the score is ≥ 85.

## Tasks / Subtasks

- [ ] Task 1: Add scroll container and `useVirtualizer` to `BoardColumn.tsx` (AC: #1, #2, #3, #4, #5, #6, #7)
  - [ ] Import `useVirtualizer` from `@tanstack/react-virtual`
  - [ ] Import `useRef` from `react` (alongside existing `useMemo`)
  - [ ] Add `const scrollRef = useRef<HTMLDivElement>(null)` inside the component
  - [ ] Call `useVirtualizer({ count: columnTasks.length, getScrollElement: () => scrollRef.current, estimateSize: () => 72, overscan: 5 })`
  - [ ] Replace the existing `{count === 0 ? ... : <SortableContext>...}` block with the updated structure described in Dev Notes
  - [ ] Attach `ref={scrollRef}` to the scrollable inner div; add `className="flex-1 overflow-y-auto"`
  - [ ] Render `<div style={{ height: virtualizer.getTotalSize() + 'px', position: 'relative' }}>` as the only child of the scroll div
  - [ ] Inside that div, map `virtualizer.getVirtualItems()` to absolutely-positioned task wrappers (see Dev Notes)
  - [ ] Add `if (!task) return null` guard after the `columnTasks[virtualItem.index]` lookup (required by `noUncheckedIndexedAccess`)
  - [ ] Pass ALL column task IDs to `SortableContext items` prop: `items={columnTasks.map(t => t.id)}`
  - [ ] Keep the drag-over dashed placeholder rendering — move it outside the virtualizer inner div, directly inside `SortableContext` (see Dev Notes)

- [ ] Task 2: Update `KanbanBoard.tsx` board layout for column height (AC: #1, #2)
  - [ ] The columns `<main>` currently uses `items-start`; the columns need a defined height for the virtual scroller's `overflow-y-auto` to activate
  - [ ] Change `<main>` to `className="flex gap-4 p-4 overflow-x-auto"` (remove `items-start`)
  - [ ] Add `className="flex flex-col"` on the outer `<div className="min-h-screen bg-zinc-50">` wrapper (so the columns area can grow to fill remaining height)
  - [ ] Constrain the column section's height: on the `<section>` root in `BoardColumn.tsx`, ensure it has `flex flex-col` and that the scroll div inside can flex-grow with `flex-1`
  - [ ] Confirm columns reach the bottom of the viewport without a fixed pixel value

- [ ] Task 3: Update `BoardColumn.tsx` section height classes (AC: #1, #2)
  - [ ] The `<section>` currently has `'bg-zinc-100 rounded-xl p-3 flex flex-col gap-3 w-80 min-w-[280px]'`
  - [ ] Add height constraint so the inner scroll area activates: replace `gap-3` with `gap-2` and ensure the section grows: add `self-stretch` (or `h-full`) so the section fills the flex row
  - [ ] Inside the section, the scroll wrapper div needs `flex-1 min-h-0` — the `min-h-0` is critical; without it, flexbox ignores `flex-1` on overflow containers

- [ ] Task 4: Write / update tests (AC: #1, #5, #6, #7)
  - [ ] Extend `BoardColumn.test.tsx`: assert that when 20 mock tasks exist for a column, only a subset of `<article>` elements are rendered in the DOM (fewer than 20)
  - [ ] Extend `BoardColumn.test.tsx`: assert empty state renders when `columnTasks.length === 0` after filtering
  - [ ] Extend `BoardColumn.test.tsx`: assert `SortableContext` receives the full task ID list (spy on `SortableContext` items prop or check the DOM for all task ids in data attributes if accessible)
  - [ ] Verify test count increases from current 100

---

## Dev Notes

### Updated `BoardColumn.tsx` Structure

The full component layout after this story. Read all notes before editing.

```tsx
import { useMemo, useRef } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { Inbox, Plus } from 'lucide-react'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useTasks } from '@/store/BoardStateContext'
import { useFilters } from '@/store/FilterContext'
import { filterTasks } from '@/features/filters/utils/filterTasks'
import { TaskCard } from '@/features/tasks/components/TaskCard'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Task, TaskStatus } from '@/types/task.types'
import type { CreateTaskForm } from '@/features/tasks/hooks/useTaskModal'

// ... BoardColumnProps unchanged ...

export function BoardColumn({ status, title, onOpenCreate, onOpenEdit }: BoardColumnProps) {
  const tasks = useTasks()
  const filters = useFilters()     // added in Story 4.1
  const columnTasks = useMemo(
    () => filterTasks(tasks.filter(t => t.status === status), filters),
    [tasks, filters, status]       // filters dep added in Story 4.1
  )
  const count = columnTasks.length
  const { isOver, setNodeRef } = useDroppable({ id: status })

  const scrollRef = useRef<HTMLDivElement>(null)
  const virtualizer = useVirtualizer({
    count: columnTasks.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 72,
    overscan: 5,
  })

  return (
    <section
      ref={setNodeRef}
      role="region"
      aria-label={`${title} column, ${count} task${count !== 1 ? 's' : ''}`}
      className={cn(
        'bg-zinc-100 rounded-xl p-3 flex flex-col w-80 min-w-[280px] self-stretch',
        isOver ? 'ring-2 ring-violet-400 ring-inset' : ''
      )}
    >
      <div className="flex items-center justify-between px-1 mb-2">
        <h2 className="text-sm font-semibold text-zinc-700">{title}</h2>
        <span
          className="bg-zinc-200 rounded-full px-2 py-0.5 text-xs text-zinc-600 font-medium tabular-nums"
          aria-hidden="true"
        >
          {count}
        </span>
      </div>

      {count === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8 px-3 text-center min-h-[120px]">
          <Inbox className="h-8 w-8 text-zinc-400" aria-hidden="true" />
          <p className="text-sm font-medium text-zinc-500">No tasks</p>
          <p className="text-xs text-zinc-400">Drag a task here or add one</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-1 border-dashed border-zinc-300 text-zinc-400 hover:text-zinc-600 hover:border-zinc-400 focus-visible:ring-2 focus-visible:ring-violet-500 min-h-[44px]"
            onClick={() => onOpenCreate({})}
            aria-label={`Add task to ${title}`}
          >
            <Plus className="h-3 w-3 mr-1" aria-hidden="true" />
            Add task
          </Button>
        </div>
      ) : (
        <SortableContext items={columnTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          {/* scroll container — flex-1 min-h-0 is critical to allow overflow-y-auto to activate */}
          <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto">
            <div
              style={{ height: `${virtualizer.getTotalSize()}px`, position: 'relative' }}
            >
              {virtualizer.getVirtualItems().map(virtualItem => {
                const task = columnTasks[virtualItem.index]
                if (!task) return null  // noUncheckedIndexedAccess guard
                return (
                  <div
                    key={virtualItem.key}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      transform: `translateY(${virtualItem.start}px)`,
                      paddingBottom: '8px',  // gap between cards
                    }}
                  >
                    <TaskCard task={task} onOpen={onOpenEdit} />
                  </div>
                )
              })}
            </div>
          </div>
          {/* drag-over placeholder lives outside the virtual scroller so it always shows at bottom */}
          {isOver && (
            <div className="h-14 rounded-lg border-2 border-dashed border-violet-400 opacity-50 mt-2" />
          )}
        </SortableContext>
      )}
    </section>
  )
}
```

### Why `flex-1 min-h-0` on the Scroll Container

In a flex column, children with `overflow: auto` do not naturally constrain themselves to the available height — the browser treats them as unconstrained and the scroll never activates. Adding `min-h-0` overrides the default `min-height: auto` that flex items inherit, allowing the child to shrink and `flex-1` to expand it to fill the remaining space. Without `min-h-0`, the virtualizer's `getScrollElement()` returns an element that is never actually scrollable, so all items are considered "visible" and the entire list is rendered.

### `estimateSize: () => 72` — Where This Comes From

The seed `Task` cards render at roughly 88–96px with `p-4` and content. `72px` is an intentional slight underestimate. @tanstack/react-virtual measures actual rendered sizes via a `ResizeObserver` and corrects the layout dynamically. An underestimate causes a single small layout correction on first render; an overestimate causes permanent blank space at the bottom. Undershooting is preferred.

### Scroll Preservation Through REMOTE_UPDATE

@tanstack/react-virtual preserves scroll position by default when the `count` or item content changes — it only resets scroll when the scroll container DOM node itself changes (remounts). Since `BoardColumn` never unmounts on `REMOTE_UPDATE`, and `scrollRef.current` remains the same DOM node, scroll position is stable. This is why stable `task.id` values from `nanoid()` are critical: `REMOTE_UPDATE` updates task fields in-place (`state.tasks.map(t => t.id === id ? newTask : t)`), which keeps the same array index and virtualizer item key.

### DnD Kit + Virtualization: The IDs Contract

dnd-kit's `SortableContext` uses its `items` prop to build an internal ordered map for collision detection — it does not require the items to be rendered in the DOM. Passing ALL `columnTasks.map(t => t.id)` to `items` keeps collision detection correct even when only a subset of cards are virtually rendered. The rendered `TaskCard` components call `useSortable({ id: task.id })` which registers with the nearest `SortableContext` — only the visible (rendered) cards register. This is the intended usage and does not cause errors.

### Drag-Over Placeholder Position

The dashed placeholder (`isOver && <div ... />`) is moved outside the virtual scroller div and placed after the scroll container, still inside `SortableContext`. This means the placeholder always appears below the scroll area, not inside it. This is a deliberate trade-off: placing it inside the absolute-positioned virtual container would require knowing the correct `translateY` offset, which is non-trivial. The below-column placement is visually acceptable and consistent with the pre-virtualization behavior.

### `KanbanBoard.tsx` Layout Change

The columns `<main>` must not use `items-start` once columns are expected to fill vertical space.

Before:
```tsx
<main className="flex gap-4 p4 overflow-x-auto items-start">
```

After:
```tsx
<main className="flex gap-4 p-4 overflow-x-auto">
```

The outer `<div className="min-h-screen bg-zinc-50">` should be changed to `flex flex-col` to allow the `<main>` to grow:
```tsx
<div className="min-h-screen bg-zinc-50 flex flex-col">
```

And `<main>` should get `flex-1` so it fills remaining height:
```tsx
<main className="flex flex-1 gap-4 p-4 overflow-x-auto">
```

### Story 4.1 Dependency Note

This story's `BoardColumn.tsx` snippet shows the post-4.1 state (with `useFilters()` and `filterTasks` applied). If 4.1 is not yet done, implement 4.1 first. Do not apply the filters integration in this story if 4.1 has not been implemented — keep the existing `useMemo([tasks, status])` and upgrade it in 4.1.

### File Paths

```
src/features/board/components/BoardColumn.tsx    ← primary changes: virtualizer + scroll container + layout
src/features/board/components/KanbanBoard.tsx    ← layout change: flex-col wrapper + flex-1 on main
src/features/board/components/BoardColumn.test.tsx  ← extend with virtualization tests
```

### Forbidden Patterns

- Passing only `virtualizer.getVirtualItems().map(v => columnTasks[v.index].id)` to `SortableContext items` — must pass ALL `columnTasks.map(t => t.id)`
- Skipping the `if (!task) return null` guard — `noUncheckedIndexedAccess` makes `columnTasks[index]` type `Task | undefined`
- Using a hardcoded pixel height on the column section — the column must grow from the flex layout, not a fixed height
- Rendering empty state inside the virtual scroller branch — always check `count === 0` first
- Mutating `columnTasks` array inside the virtualizer callback — derive only, never modify
- `any` type on `virtualItem` — type is `VirtualItem` from `@tanstack/react-virtual`

### Verification Checklist

```
1. Open board with 25 seed tasks (~8-9 per column) — count badge shows correct numbers
2. Open browser DevTools Elements panel — confirm a column with 8 tasks has exactly 8 <article> elements
3. Temporarily add 50 more tasks to MOCK_TASKS in mockData.ts → restart dev server
4. Scroll a tall column — observe <article> elements appear/disappear in DevTools as you scroll
5. Scroll to middle of a long column → trigger a REMOTE_UPDATE (wait ~10s) → confirm scroll position is unchanged
6. Apply a filter (assignee = Alice) → confirm virtualizer count and column height recalculate
7. Drag a card between columns — confirm drag-and-drop still works, collision detection is accurate
8. tsc --noEmit → zero errors
9. npm run test → all tests pass (≥ 100 current baseline)
10. npm run lint → zero warnings
11. npm run build → production build completes
12. Lighthouse Performance audit on production preview → score ≥ 85
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
