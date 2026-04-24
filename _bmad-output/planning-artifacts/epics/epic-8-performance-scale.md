# Epic 8: Performance & Scale

Users experience smooth 60fps board operation with 1000+ tasks loaded.

## Story 8.1: Virtualized Task List per Column

As a user,
I want each column to render only the task cards currently visible in the viewport,
So that the board stays performant even with 1000+ tasks.

**Acceptance Criteria:**

**Given** a column with 1000+ tasks
**When** rendered with `@tanstack/react-virtual`
**Then** only the cards visible in the viewport (plus `overscan: 5`) are mounted in the DOM

**Given** the virtual list
**When** implemented in `BoardColumn.tsx`
**Then** it uses `useVirtualizer` with `estimateSize: () => 72` (72px per card) and `overscan: 5`

**Given** the user scrolls through a 1000+ task column
**When** scrolling
**Then** scroll is smooth at 60fps with no layout thrashing (NFR3)
**And** scroll position is preserved when remote updates apply to tasks not in the current viewport

**Given** a filter is applied that reduces the visible task count
**When** `filterTasks` returns a subset
**Then** the virtualizer recalculates bounds correctly and does not show blank spaces

**Given** a remote update modifies a task in the list
**When** `REMOTE_UPDATE` is applied
**Then** the list uses stable task IDs (keyed diffing) — the full list is never replaced wholesale, preventing scroll reset (NFR6)

---

## Story 8.2: Performance Optimizations — Memoization and Render Isolation

As a developer,
I want all expensive derivations and render-heavy components memoized correctly,
So that state changes in one part of the system don't cascade unnecessary re-renders to other parts.

**Acceptance Criteria:**

**Given** `TaskCard` is wrapped in `React.memo`
**When** a task update for a different task is dispatched
**Then** only the TaskCard for the updated task re-renders — all other TaskCards remain stable (verified via React DevTools Profiler)

**Given** column task lists are derived via `useMemo([tasks, filters])`
**When** `PendingOpsContext` updates (a loading indicator changes)
**Then** the column task list does NOT re-derive (tasks and filters haven't changed)
**And** TaskCard components do NOT re-render

**Given** `BoardAPIContext` actions are wrapped in `useMemo([], [])`
**When** any board state changes
**Then** `useBoardAPI()` consumers do NOT re-render

**Given** `FilterAPIContext` setters are wrapped in `useMemo([], [])`
**When** filter state changes
**Then** components consuming only `useFilterAPI()` do NOT re-render

**Given** the production build
**When** `npm run build` completes and Lighthouse Performance audit runs
**Then** the score is ≥ 85 (NFR1)
**And** initial page load is < 2 seconds on fast 3G (NFR2)

---
