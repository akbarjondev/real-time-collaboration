# Epic 4: Filtering & Search

Users can filter the board by assignee and priority, search by text, and combine multiple filters.

## Story 4.1: Implement filterTasks Logic and Filter State

As a user,
I want the board to instantly show only tasks matching my active filters,
So that I can focus on relevant work items without page reloads.

**Acceptance Criteria:**

**Given** `src/features/filters/utils/filterTasks.ts`
**When** implemented as a pure function `(tasks: Task[], filters: FilterState) => Task[]`
**Then** it filters correctly by `assignee` (exact match), `priority` (exact match), `searchQuery` (case-insensitive substring match on title and description)
**And** all active filters are ANDed together (combined filter, FR10)
**And** an empty `FilterState` returns all tasks unmodified

**Given** the filterTasks function is used in BoardColumn
**When** wrapped in `useMemo` keyed on `tasks` and `filters`
**Then** filter computation runs client-side and completes within 50ms for 1000+ tasks (NFR4)

**Given** `FilterContext` and `FilterAPIContext` are wired into `AppProvider`
**When** `useFilterAPI().setFilter()` is called with a new assignee or priority
**Then** `FilterContext` updates and all column task lists re-derive immediately
**And** `BoardStateContext` does NOT re-render (filter change is isolated to FilterContext consumers)

**Given** `filterTasks.test.ts`
**When** the test suite runs
**Then** all filter combinations (assignee only, priority only, search only, combined) pass

---

## Story 4.2: Build Direction D Filter Bar with Active Chips

As a user,
I want a persistent filter bar below the board header showing all available filters and my active selections as dismissible chips,
So that I always know what filter state the board is in.

**Acceptance Criteria:**

**Given** the board is loaded
**When** no filters are active
**Then** the filter bar shows the ⌘K search field, "Assignee" and "Priority" filter dropdowns, and a "Clear all" ghost button (right-aligned)
**And** no active chips are visible

**Given** the user selects a filter value from the Assignee dropdown
**When** the selection is made
**Then** an active filter chip appears: violet-100 background, violet border, "Assignee: [name]" label, × dismiss button
**And** the column task lists update immediately (FR11)
**And** the column count badges update to reflect filtered counts

**Given** active filter chips are present
**When** the user clicks the × on a chip
**Then** that specific filter is cleared and the chip disappears
**And** the board returns to the state with remaining filters applied

**Given** multiple active filter chips exceed the bar width
**When** the bar renders
**Then** chips wrap to a second line — no overflow or truncation

**Given** the user clicks "Clear all"
**When** the action executes
**Then** all active filters are removed and the board shows all tasks

**Given** a filtered column has no matching tasks
**When** rendered
**Then** the filtered-empty-state shows: `filter` icon, "No matches" heading, "No tasks match the current filter" subtext, "Clear filter" link

---

## Story 4.3: Implement ⌘K Search Overlay

As a user,
I want a keyboard-triggered search overlay that fuzzy-searches tasks with MRU surfacing,
So that power users can find tasks faster than using the visible filter bar.

**Acceptance Criteria:**

**Given** the board is focused
**When** the user presses ⌘K (macOS) or Ctrl+K (Windows/Linux)
**Then** the ⌘K search overlay opens instantly with focus moved to the search input

**Given** the overlay is open
**When** the user types in the search input
**Then** matching tasks from all columns are shown in a results list (client-side, < 50ms)
**And** results are filtered case-insensitively across task title and description
**And** most recently used / viewed tasks surface first in the empty-query state

**Given** the user selects a result
**When** clicked or activated via Enter
**Then** the overlay closes and the board scrolls to / highlights the selected task card

**Given** the overlay is open
**When** the user presses Escape
**Then** the overlay closes and focus returns to the previously focused element

**Given** the overlay component
**When** rendered
**Then** it has `role="combobox"`, `aria-expanded="true"`, focus is trapped inside, and Escape closes it
**And** the search also updates `FilterContext.searchQuery` so the board reflects the search state

---
