---
stepsCompleted: [step-01-validate-prerequisites, step-02-design-epics, step-03-create-stories, step-04-final-validation]
inputDocuments:
  - "_bmad-output/planning-artifacts/prd.md"
  - "_bmad-output/planning-artifacts/architecture.md"
  - "_bmad-output/planning-artifacts/ux-design-specification.md"
---

# Real-Time Collaborative Task Board - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for the Real-Time Collaborative Task Board, decomposing the requirements from the PRD, UX Design, and Architecture into implementable stories.

## Requirements Inventory

### Functional Requirements

FR1: User can create a task with title, description, assignee, priority (Low/Medium/High), and optional tags
FR2: User can edit any field of an existing task
FR3: User can delete a task
FR4: User can view tasks with title, description, status, priority badge, assignee, and created date
FR5: System organizes tasks into three status columns: Todo, In Progress, and Done
FR6: User can open a task detail modal from a task card
FR7: User can filter the board by assignee
FR8: User can filter the board by priority level
FR9: User can search tasks by title and description text
FR10: User can combine multiple active filters simultaneously
FR11: System updates filtered results in real time as filter inputs change
FR12: User can move a task between columns via drag-and-drop on desktop
FR13: User can change a task's status via a status selector on mobile/touch devices
FR14: System reflects column changes immediately upon user interaction (before API confirmation)
FR15: System applies task mutations immediately to the UI before the mock API resolves
FR16: System simulates API latency of approximately 2 seconds per operation
FR17: System randomly fails approximately 10% of API operations
FR18: System rolls back a failed mutation to its prior state automatically
FR19: System notifies the user with a descriptive toast when a mutation fails and is rolled back
FR20: System displays a loading indicator on tasks with in-flight API operations
FR21: System recovers gracefully from feature-level errors without crashing the full application
FR22: System applies random task updates simulating a second user every 10–15 seconds
FR23: System notifies the user with a non-intrusive toast when a remote update occurs
FR24: System detects when an incoming remote update conflicts with a user's active edit
FR25: User can resolve a conflict by choosing to keep their own change or accept the remote change
FR26: System applies the resolved state without data loss from either version
FR27: User can undo the most recent tracked action via Ctrl/Cmd+Z
FR28: User can redo the most recently undone action via Ctrl/Cmd+Shift+Z
FR29: System maintains a history stack of up to 50 tracked actions
FR30: System tracks all task mutations (status change, field edits, creation, deletion)
FR31: System displays a UI label indicating what action will be undone or redone next
FR32: System clears the redo stack when the user performs a new action after undoing
FR33: System handles undo/redo correctly in the presence of optimistic rollbacks
FR34: System renders task columns without degradation when total task count exceeds 1,000
FR35: System renders only visible task items within the viewport (virtualization)
FR36: System applies remote updates to the task list without resetting scroll position or causing full re-renders
FR37: System displays task columns stacked vertically on screens narrower than 768px
FR38: All interactive elements are reachable and operable via keyboard navigation
FR39: All buttons, modals, and form inputs carry descriptive ARIA labels
FR40: Modals trap focus while open and restore focus to the triggering element on close

### NonFunctional Requirements

NFR1: Lighthouse Performance score ≥ 85 on production build
NFR2: Initial page load < 2 seconds on fast 3G
NFR3: Board maintains 60fps scroll and interaction with 1,000+ tasks loaded
NFR4: Filter and search respond within 50ms (client-side, memoized)
NFR5: Optimistic UI updates applied within one animation frame (≤ 16ms perceived latency)
NFR6: Remote simulation updates applied without full component re-renders or scroll position reset
NFR7: Codebase compiles with zero TypeScript errors in strict mode; zero `any` types
NFR8: Components are single-responsibility, ≤ 150 lines; stateful logic extracted into custom hooks
NFR9: Feature code co-located in feature folders; shared utilities in `shared/`
NFR10: Non-obvious implementation decisions have inline comments; architecture decisions in README
NFR11: ESLint passes with zero warnings on production build
NFR12: All interactive elements keyboard-navigable via Tab; activatable via Enter/Space
NFR13: Modals implement focus trap on open; restore focus to trigger element on close
NFR14: All interactive elements and form inputs carry `aria-label` or `aria-labelledby`
NFR15: Primary UI elements meet WCAG AA color contrast (4.5:1) — Tailwind defaults satisfy this
NFR16: All user-supplied input rendered via React's built-in escaping (no `dangerouslySetInnerHTML`)
NFR17: No sensitive data stored in localStorage or sessionStorage

### Additional Requirements

- **Starter template (Epic 1, Story 1):** Initialize project with `npm create vite@latest real-time-collaboration -- --template react-swc-ts` (SWC Rust compiler, ~10x faster than Babel)
- Install all required dependencies: `tailwindcss @tailwindcss/vite`, `@tanstack/react-virtual`, `@dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities`, `nanoid sonner react-hook-form`, dev: `vitest @testing-library/react @testing-library/jest-dom jsdom`
- Configure `vite.config.ts` with react-swc + tailwindcss plugins + path alias `@/` → `./src`
- Configure `tsconfig.app.json` with `"strict": true`, `"noUncheckedIndexedAccess": true`, `"paths": { "@/*": ["./src/*"] }`
- Configure `vitest.config.ts` with jsdom environment and `src/test-setup.ts` setup file
- Implement 7-context split state architecture: BoardStateContext (Task[]), PendingOpsContext (Map<opId, PendingOperation>), ConflictContext (ConflictState | null), BoardAPIContext (stable action creators), FilterContext (FilterState), FilterAPIContext (stable setFilter/setSearch), HistoryContext (read-only view)
- Single `boardReducer` managing `{ tasks, pendingOps, conflict }` atomically; `AppProvider` unpacks into separate read contexts
- `BoardAPIContext` is the only mutation gate — no component calls `src/api/tasks.ts` directly
- Action taxonomy: user actions (TASK_MOVE, TASK_CREATE, TASK_UPDATE, TASK_DELETE) push to history; system actions (OP_SUCCESS, OP_ROLLBACK, REMOTE_UPDATE, CONFLICT_*) never push to history
- `useHistory` hook wraps boardAPI, manages 50-entry command stack with forward/inverse action pairs and human-readable labels
- Mock API: `mockRequest<T>` in `src/api/mock-client.ts` with 2s delay + 10% random failure rate; typed `MockApiError` class
- Optimistic update sequence (every mutation must follow exactly): opId = nanoid() → record snapshot in pendingOps → apply change to tasks[] → call mockRequest() → on success: OP_SUCCESS; on failure: OP_ROLLBACK + toast.error()
- `useRealtimeSimulation` hook: 10–15s interval, dispatches REMOTE_UPDATE directly to boardReducer (bypasses useHistory — must never enter history stack)
- Feature-based folder structure as specified (features/board, tasks, filters, history, realtime; store/; api/; shared/; types/)
- No barrel `index.ts` exports — import directly from file paths
- All IDs via `nanoid()` strings (never numbers); all dates via ISO 8601 strings
- Discriminated unions for all async state: `{ status: 'idle' } | { status: 'loading' } | { status: 'success'; data: T } | { status: 'error'; error: string }`
- Error boundaries at app-level and board-level (feature-level recovery without app crash)
- 25 seed tasks in `src/shared/utils/mockData.ts` for development and testing
- All agents use custom hooks (`useTasks`, `useBoardAPI`, `usePendingOps`, etc.) — never raw `useContext`
- Tests co-located with components (`ComponentName.test.tsx` in same folder)
- Provider nesting order: BoardState/PendingOps/Conflict → BoardAPIProvider → FilterProvider → FilterAPIProvider → HistoryProvider → children

### UX Design Requirements

UX-DR1: Implement Zinc + Violet design token system — page background `zinc-50`, column surfaces `zinc-100`, card `white` with `zinc-200` border, primary text `zinc-900`, secondary text `zinc-500`, accent `violet-600` (hover `violet-700`), success `emerald-500`, warning `amber-500`, destructive `rose-500`; priority badges: High `rose-500`, Medium `amber-500`, Low `sky-500`; in-flight indicator `violet-600` border ring
UX-DR2: Install and configure shadcn/ui (copy-owned in `src/components/ui/`) — Dialog (task modal), Sonner (toasts), Select (mobile status), Badge (priority), Tooltip (keyboard shortcuts), Button primitives; components customized via Tailwind tokens, not library overrides
UX-DR3: Implement TaskCard component with 5 visual states: default, hover (elevated border + shadow), dragging (scale 1.02x + deep shadow), in-flight (violet pulse border `cardPulse` CSS keyframe + CSS spinner top-right), done (0.65 opacity + strikethrough title). `role="article"` with `aria-label` including title, priority, assignee. React.memo'd.
UX-DR4: Implement drag-and-drop interaction with @dnd-kit: DndContext + SortableContext per column. Card grab: scale 1.02x, cursor `grabbing`, shadow deepens; dragging: semi-transparent ghost at origin + dashed placeholder in destination; column highlight (violet border) on drag-over; micro-animation on drop (shadow reset + scale-in). Mobile: touch drag disabled, status Select used instead.
UX-DR5: Implement tiered toast notification system (4 tiers via Sonner): Info (zinc border, 4s auto-dismiss, "Task updated by Jane"), Success (emerald border, 3s), Warning (amber border, 6s, "Conflict detected"), Error (rose border, persistent until dismissed, "Update failed — '[title]' has been reverted"). Bottom-right stack, max 3 simultaneous (queue + coalesce overflow). Every error toast must name the specific action and outcome — "Something went wrong" is forbidden.
UX-DR6: Implement Undo Hint Bar — persistent strip between filter bar and columns, always visible. States: empty ("Nothing to undo"), has-action (Undo button with "Undo: [action label]" text), has-redo (Redo button enabled). Stack depth indicator right-aligned. `aria-live="polite"`. Never collapsed or hidden.
UX-DR7: Implement Direction D Filter Bar — full-width strip below board header, always visible (never collapsible in MVP). Contains: ⌘K search field, vertical separator, active filter chips (×-dismissible, `violet-100` bg + violet border), inactive filter dropdowns (Assignee, Priority, Tags), "Clear all" ghost button right-aligned. Active chips overflow: wrap to second row.
UX-DR8: Implement ⌘K / Ctrl+K search/filter overlay — keyboard-triggered overlay, fuzzy search across title/description, MRU items surface first. `role="combobox"`, `aria-expanded`, focus trap, Escape closes. Also click-accessible via search field in filter bar.
UX-DR9: Implement responsive layout (mobile-first): `flex-col md:flex-row` for columns; columns stack vertically on mobile (< 768px), drag-and-drop replaced by status Select dropdown surfaced as first element on card tap; filter bar collapses to "Filter" button opening bottom sheet on mobile; 44×44px minimum touch targets throughout; column min-width 280px on tablet+.
UX-DR10: Implement Conflict Resolution Modal — overlays task edit modal on remote collision during active edit. Two-column diff (Mine / Theirs) with changed fields highlighted. Buttons: "Keep mine" (primary), "Take theirs" (secondary), "Cancel" (ghost — leaves modal as-is). `role="alertdialog"`, focus trap, `aria-describedby` on diff section.
UX-DR11: Implement per-card in-flight state animation: `cardPulse` CSS keyframe (0→50→100% violet border + glow) at 1.8s infinite on card border, plus CSS spinner top-right corner. Applied when task has a pending mutation (checked via PendingOpsContext); removed on OP_SUCCESS or OP_ROLLBACK. `aria-busy="true"` on in-flight cards.
UX-DR12: Implement optimistic task creation UX: card appears in Todo column immediately on modal submit (before API confirms) with skeleton shimmer; on API failure, card is removed from board and modal re-opens pre-filled with the user's previously entered data (no data loss on rollback).
UX-DR13: Implement keyboard shortcut system via `useKeyboardShortcut` hook: `N` (new task), `⌘K`/`Ctrl+K` (search overlay), `⌘Z`/`Ctrl+Z` (undo), `⌘⇧Z`/`Ctrl+Shift+Z` (redo), `Escape` (close modal/overlay), `Tab`/`Shift+Tab` (navigate cards), `Enter` (open focused card), `Space` (keyboard drag initiation). Hover tooltips (shadcn/ui Tooltip) on all elements with shortcuts.
UX-DR14: Implement empty state patterns for 3 contexts: (1) Column with no tasks — `inbox` icon, "No tasks" heading, "Drag a task here or add one" subtext, "Add task" ghost dashed button; (2) Filtered column with no matches — `filter` icon, "No matches", "No tasks match the current filter", "Clear filter" link; (3) All columns empty after filter — `search` icon, "No tasks found", "Try a different search or filter", "Clear all filters" primary button.
UX-DR15: Implement board header layout: board title with `layout-kanban` Lucide icon, "View options" button (left), "New Task" primary button (right-aligned). Uses Lucide icon set throughout all components (`search`, `plus`, `undo-2`, `redo-2`, `filter`, `user`, `flag`, `tag`, `chevron-down`, `alert-circle`, `x`, `check`, `inbox`).
UX-DR16: Implement task modal form patterns: exactly one required field (title), all others optional and clearly labeled; inline validation — errors appear on blur (not submit) with `rose-600` text + `alert-circle` icon below field; tab order (Title → Priority → Assignee → Due Date → Create button); modal closes on success/Escape/backdrop click; unsaved-changes guard ("Discard changes?" with "Discard" destructive + "Keep editing" primary) only triggers if fields are dirty.
UX-DR17: Implement keyboard drag-and-drop navigation: `Space` picks up focused card, arrow keys move between columns, `Space` drops, `Escape` cancels. `aria-live` announcements at drag start, on drag-over target, and on drop (for screen reader support, FR38).
UX-DR18: Implement reduced motion support: all animations (card pulse, drag physics, toast fade, spinner) respect `prefers-reduced-motion: reduce` — transitions become instant or opacity-only fades. Use CSS `@media (prefers-reduced-motion: reduce)` overrides.
UX-DR19: Implement screen reader accessibility: `role="region"` + `aria-label="[name] column, N tasks"` on columns; toast container `aria-live="assertive"` for errors, `"polite"` for info/success; "Skip to main content" visually hidden link at page top (visible on focus); focus indicators `focus-visible:ring-2 focus-visible:ring-violet-500` on all interactive elements — never `outline: none` without replacement.

### FR Coverage Map

| FR | Epic | Description |
|---|---|---|
| FR1 | Epic 2 | Create task with all fields |
| FR2 | Epic 2 | Edit any task field |
| FR3 | Epic 2 | Delete a task |
| FR4 | Epic 2 | View task with all display fields (partial in Epic 1 via seed data) |
| FR5 | Epic 1 | Three-column board rendering |
| FR6 | Epic 2 | Open task detail modal |
| FR7 | Epic 4 | Filter by assignee |
| FR8 | Epic 4 | Filter by priority |
| FR9 | Epic 4 | Search by title/description |
| FR10 | Epic 4 | Combine multiple filters |
| FR11 | Epic 4 | Real-time filter results |
| FR12 | Epic 3 | Drag-and-drop column movement |
| FR13 | Epic 3 | Mobile status selector |
| FR14 | Epic 3 | Immediate column change (optimistic) |
| FR15 | Epic 5 | Mutations applied before API |
| FR16 | Epic 5 | 2s simulated API latency |
| FR17 | Epic 5 | 10% random API failure |
| FR18 | Epic 5 | Automatic rollback on failure |
| FR19 | Epic 5 | Descriptive rollback toast |
| FR20 | Epic 5 | Per-card loading indicator |
| FR21 | Epic 5 | Feature-level error boundaries |
| FR22 | Epic 6 | Remote updates every 10–15s |
| FR23 | Epic 6 | Non-intrusive remote update toast |
| FR24 | Epic 6 | Conflict detection on active edit |
| FR25 | Epic 6 | Keep mine / Take theirs resolution |
| FR26 | Epic 6 | Resolved state applied without data loss |
| FR27 | Epic 7 | Undo via Ctrl/Cmd+Z |
| FR28 | Epic 7 | Redo via Ctrl/Cmd+Shift+Z |
| FR29 | Epic 7 | 50-action history stack |
| FR30 | Epic 7 | Track all task mutations |
| FR31 | Epic 7 | Undo/Redo hint label in UI |
| FR32 | Epic 7 | Redo stack clears on new action |
| FR33 | Epic 7 | Undo/redo correct after rollbacks |
| FR34 | Epic 8 | No degradation with 1000+ tasks |
| FR35 | Epic 8 | Viewport-only rendering (virtualization) |
| FR36 | Epic 8 | Remote updates without scroll reset |
| FR37 | Epic 9 | Stacked columns below 768px |
| FR38 | Epic 9 | Keyboard navigation for all elements |
| FR39 | Epic 9 | ARIA labels on all interactive elements |
| FR40 | Epic 9 | Focus trap + focus restoration in modals |

## Epic List

### Epic 1: Project Foundation & Runnable Board Shell
A developer can run the project locally and see a Kanban board populated with seed tasks in 3 columns. The complete state architecture, mock API layer, and feature folder structure are in place.
**FRs covered:** FR4 (partial — seed tasks visible), FR5

### Epic 2: Task CRUD & Full Task Display
Users can create, view, edit, and delete tasks with all fields (title, description, assignee, priority, tags). The task detail modal works end-to-end.
**FRs covered:** FR1, FR2, FR3, FR4, FR6

### Epic 3: Task Movement — Drag-and-Drop & Status Changes
Users can move tasks between columns via drag-and-drop on desktop and a status dropdown on mobile. Changes reflect immediately on the board.
**FRs covered:** FR12, FR13, FR14

### Epic 4: Filtering & Search
Users can filter the board by assignee and priority, search by text, and combine multiple filters. The Direction D filter bar and ⌘K overlay are fully implemented.
**FRs covered:** FR7, FR8, FR9, FR10, FR11

### Epic 5: Optimistic Updates & Error Recovery
Users experience instant feedback on all mutations. Failed API calls roll back automatically with descriptive error toasts. In-flight loading indicators appear per-card. Error boundaries prevent full-app crashes.
**FRs covered:** FR15, FR16, FR17, FR18, FR19, FR20, FR21

### Epic 6: Real-Time Collaboration Simulation & Conflict Resolution
Users see simulated remote updates from a second user every 10–15 seconds with quiet info toasts. When a conflict is detected during an active edit, users can choose Keep Mine or Take Theirs without data loss.
**FRs covered:** FR22, FR23, FR24, FR25, FR26

### Epic 7: Undo/Redo History System
Users can undo and redo any tracked action via keyboard shortcuts. A persistent Undo Hint Bar always shows the next undoable action. Undo/redo remains correct even after optimistic rollbacks.
**FRs covered:** FR27, FR28, FR29, FR30, FR31, FR32, FR33

### Epic 8: Performance & Scale
Users experience smooth 60fps board operation with 1000+ tasks. Virtualized rendering, memoized filters, and stable remote update application are verified.
**FRs covered:** FR34, FR35, FR36

### Epic 9: Responsive Design & Accessibility
Users can use the full board on mobile devices (stacked columns, status dropdown, 44px tap targets) and with keyboard-only or screen reader navigation (full ARIA, focus management, reduced motion).
**FRs covered:** FR37, FR38, FR39, FR40

---

## Epic 1: Project Foundation & Runnable Board Shell

A developer can run the project locally and see a Kanban board populated with seed tasks in 3 columns. The complete state architecture, mock API layer, and feature folder structure are in place as the foundation for all subsequent epics.

### Story 1.1: Initialize Project with Dependencies and Configuration

As a developer,
I want a fully initialized Vite project with all required dependencies and configuration files,
So that I can start implementing features on a correctly configured, TypeScript-strict foundation.

**Acceptance Criteria:**

**Given** a clean working directory
**When** the project is initialized using `npm create vite@latest real-time-collaboration -- --template react-swc-ts`
**Then** the project compiles with zero TypeScript errors in strict mode
**And** `npm run dev` starts the Vite dev server without errors

**Given** the initialized project
**When** all required dependencies are installed (`tailwindcss @tailwindcss/vite`, `@tanstack/react-virtual`, `@dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities`, `nanoid`, `sonner`, `react-hook-form`, dev: `vitest @testing-library/react @testing-library/jest-dom jsdom`)
**Then** `npm install` completes without errors
**And** all packages are resolvable

**Given** the installed dependencies
**When** `vite.config.ts` is configured with `@vitejs/plugin-react-swc`, `@tailwindcss/vite`, and `resolve.alias: { '@': path.resolve(__dirname, './src') }`
**Then** imports using the `@/` alias resolve correctly to `src/`

**Given** `tsconfig.app.json`
**When** configured with `"strict": true`, `"noUncheckedIndexedAccess": true`, and `"paths": { "@/*": ["./src/*"] }`
**Then** `tsc --noEmit` passes with zero errors

**Given** `vitest.config.ts`
**When** configured with `environment: 'jsdom'` and `setupFiles: ['./src/test-setup.ts']` (which imports `@testing-library/jest-dom`)
**Then** `npm run test` runs successfully (zero test failures; the setup file loads without error)

**Given** `src/index.css`
**When** it contains `@import "tailwindcss"`
**Then** Tailwind utility classes render correctly in the browser

**Given** the feature-based folder structure defined in the architecture (`src/features/`, `src/store/`, `src/api/`, `src/shared/`, `src/types/`)
**When** the empty directories and placeholder files are created
**Then** the structure matches the architecture specification exactly with no barrel `index.ts` exports

---

### Story 1.2: Implement Core State Architecture

As a developer,
I want the complete state management architecture (boardReducer, all contexts, and AppProvider) implemented,
So that all subsequent feature stories can dispatch actions and consume state via the established custom hooks.

**Acceptance Criteria:**

**Given** the architecture specification
**When** `src/types/task.types.ts` is created
**Then** it exports `Task`, `TaskStatus` (`'todo' | 'in-progress' | 'done'`), `Priority` (`'low' | 'medium' | 'high'`), and `Tag` types with zero TypeScript errors in strict mode

**Given** `src/types/common.types.ts`
**When** created
**Then** it exports `AsyncState<T>` as a discriminated union (`idle | loading | success | error`) and `ID` as `string`

**Given** `src/store/boardReducer.ts`
**When** implemented with `BoardState` (`{ tasks: Task[]; pendingOps: Map<string, PendingOperation>; conflict: ConflictState | null }`) and all `BoardAction` types (TASK_MOVE, TASK_CREATE, TASK_UPDATE, TASK_DELETE, OP_SUCCESS, OP_ROLLBACK, REMOTE_UPDATE, CONFLICT_DETECTED, CONFLICT_RESOLVE_MINE, CONFLICT_RESOLVE_THEIRS, HISTORY_APPLY)
**Then** the reducer compiles with zero TypeScript errors and handles all action types
**And** every case returns a full state spread (never mutates state directly)

**Given** all 7 context files (`BoardStateContext`, `PendingOpsContext`, `ConflictContext`, `BoardAPIContext`, `FilterContext`, `FilterAPIContext`, `HistoryContext`)
**When** implemented with their specified types
**Then** each exports a typed context and a corresponding custom hook (`useTasks`, `useBoardAPI`, `usePendingOps`, `useConflict`, `useFilters`, `useFilterAPI`, `useHistory`)
**And** the context value IS the slice directly (not wrapped in an object)

**Given** `BoardAPIContext`
**When** action creators are defined (`moveTask`, `createTask`, `updateTask`, `deleteTask`)
**Then** they are wrapped in `useMemo([], [])` (empty deps) so consumers never re-render due to state changes
**And** each action creator generates a `nanoid()` opId before dispatching

**Given** `src/store/AppProvider.tsx`
**When** implemented with the specified provider nesting order (BoardState → PendingOps → Conflict → BoardAPI → FilterProvider → FilterAPIProvider → HistoryProvider)
**Then** `<AppProvider>` wraps `<App />` in `src/main.tsx`
**And** each context slice is passed directly (not wrapped): `<BoardStateContext.Provider value={boardState.tasks}>`

**Given** `src/store/FilterContext.tsx`
**When** implemented with `FilterState` (`{ assignee: string | null; priority: Priority | null; searchQuery: string }`) and `filterReducer`
**Then** it provides `useFilters()` and `useFilterAPI()` hooks with stable setters

---

### Story 1.3: Implement Mock API Layer, Shared Utilities, and Seed Data

As a developer,
I want the mock API layer and seed data in place,
So that all task mutations can be simulated with 2-second latency and 10% failure rate during development and testing.

**Acceptance Criteria:**

**Given** `src/api/mock-client.ts`
**When** `mockRequest<T>` is implemented
**Then** it waits approximately 2 seconds (via `sleep(2000)`) before resolving
**And** it throws `MockApiError` approximately 10% of the time (`Math.random() < 0.1`)
**And** `MockApiError` extends `Error` with `name = 'MockApiError'`

**Given** `src/api/tasks.ts`
**When** `createTask`, `updateTask`, `deleteTask`, and `moveTask` are implemented
**Then** each calls through `mockRequest<T>` and returns the appropriate typed response
**And** no component or hook imports `mockRequest` directly — only through `src/api/tasks.ts`

**Given** `src/shared/utils/sleep.ts`
**When** imported
**Then** it exports a `sleep(ms: number): Promise<void>` utility

**Given** `src/shared/utils/mockData.ts`
**When** the module is loaded
**Then** it exports an array of exactly 25 `Task` objects with realistic titles, descriptions, assignees, priorities, statuses (spread across 'todo', 'in-progress', 'done'), and ISO 8601 `createdAt` strings
**And** each task has a unique `string` ID generated by `nanoid()`

**Given** `src/shared/components/ErrorBoundary.tsx`
**When** a child component throws a render error
**Then** the ErrorBoundary catches it and renders a fallback UI without crashing the full application

**Given** `src/shared/components/ToastProvider.tsx`
**When** rendered
**Then** it mounts the Sonner `<Toaster>` with position `"bottom-right"` and `richColors`

---

### Story 1.4: Build Kanban Board Shell with Three Columns

As a user,
I want to see a Kanban board with three labeled columns (Todo, In Progress, Done) populated with seed tasks,
So that I have a visual starting point and the board renders correctly before any CRUD features are added.

**Acceptance Criteria:**

**Given** the application is running
**When** the page loads
**Then** the board header renders with the board title, a `layout-kanban` Lucide icon, and a "New Task" primary button (non-functional in this story)
**And** three columns are displayed: "Todo", "In Progress", "Done"
**And** each column header shows the column name and a task count badge

**Given** the 25 seed tasks in `mockData.ts` are loaded into BoardStateContext
**When** the board renders
**Then** each task card is displayed in the correct column matching its `status` field
**And** each card shows at minimum: title (dominant, `text-sm font-medium`), priority badge (colored dot + label), assignee name (`text-xs text-zinc-500`), and created date

**Given** the design token system (UX-DR1)
**When** any component renders
**Then** the page background is `zinc-50`, column backgrounds are `zinc-100`, card backgrounds are `white` with `zinc-200` border
**And** priority badges use: High → `rose-500`, Medium → `amber-500`, Low → `sky-500`

**Given** a column with no tasks
**When** the column renders
**Then** an empty state is shown: `inbox` Lucide icon, "No tasks" heading, "Drag a task here or add one" subtext, and an "Add task" ghost dashed button (non-functional in this story)

**Given** the shadcn/ui component library (UX-DR2)
**When** installed via the shadcn CLI
**Then** `Dialog`, `Badge`, `Button`, `Select`, and `Tooltip` components are copied to `src/components/ui/` and render without errors

**Given** the board runs in the browser
**When** `npm run dev` is executed
**Then** zero TypeScript errors and zero ESLint warnings are reported
**And** Tailwind utility classes apply correctly (no custom CSS overrides or hardcoded hex values)

---

## Epic 2: Task CRUD & Full Task Display

Users can create, view, edit, and delete tasks with all fields (title, description, assignee, priority, tags). The task detail modal works end-to-end.

### Story 2.1: Display Full Task Card with All Visual States

As a user,
I want task cards to display all relevant fields with clear visual hierarchy and distinct states (default, hover, done),
So that I can scan the board and understand each task's details at a glance.

**Acceptance Criteria:**

**Given** a task card in its default state
**When** rendered
**Then** it displays: title (`text-sm font-medium`, dominant), priority badge (colored dot + label text, not color-alone), assignee name (`text-xs text-zinc-500`), created date right-aligned
**And** it uses `role="article"` with `aria-label` containing title, priority, and assignee

**Given** a task with `status: 'done'`
**When** rendered as a TaskCard
**Then** the card renders at 0.65 opacity with the title struck-through

**Given** a TaskCard
**When** the user hovers over it
**Then** the card border elevates and a deeper shadow appears (hover state visual)

**Given** the TaskCard component
**When** implemented
**Then** it is wrapped in `React.memo` to prevent unnecessary re-renders

**Given** an empty column after tasks are moved out
**When** the column renders
**Then** the empty state (UX-DR14) shows the correct icon, heading, sub-text, and action for the no-tasks context

---

### Story 2.2: Create New Task via Modal

As a user,
I want to create a new task with a title (required) and optional fields via a modal,
So that I can add work items to the board without leaving my current context.

**Acceptance Criteria:**

**Given** the "New Task" button in the board header or the "Add task" button in a column
**When** clicked (or keyboard shortcut `N` is pressed)
**Then** the shadcn/ui Dialog modal opens with focus automatically placed on the title field
**And** the modal contains fields: Title (required), Description (optional), Assignee (optional), Priority selector (Low/Medium/High, optional), Tags (optional)

**Given** the task creation modal is open
**When** the user submits without entering a title
**Then** the title field shows an inline validation error (`rose-600` text + `alert-circle` icon below the field) on blur
**And** no toast is shown; focus returns to the title field

**Given** a valid title is entered and the form is submitted
**When** the "Create" button is clicked or Enter is pressed
**Then** the modal closes immediately
**And** a new task card appears in the Todo column immediately (before API confirmation)

**Given** the modal has unsaved dirty field values
**When** the user presses Escape, clicks the backdrop, or the close button
**Then** an unsaved-changes guard prompt appears: "Discard changes?" with "Discard" (destructive) and "Keep editing" (primary) buttons

**Given** the form
**When** Tab is pressed
**Then** focus moves in order: Title → Priority → Assignee → Due Date → Create button (FR38, UX-DR16)

**Given** the form uses React Hook Form
**When** the component renders
**Then** no re-renders occur per keystroke (uncontrolled inputs), verified by React.memo and absence of state updates per character

---

### Story 2.3: Edit Existing Task via Modal

As a user,
I want to open a task's detail modal and edit any of its fields,
So that I can update task information without disrupting my board view.

**Acceptance Criteria:**

**Given** a task card on the board
**When** the user clicks the card or presses Enter on a focused card
**Then** the task detail modal opens with all existing field values pre-populated

**Given** the task edit modal is open with pre-populated data
**When** the user modifies the title and clicks "Save"
**Then** the modal closes and the task card on the board reflects the updated title immediately

**Given** a task is being edited
**When** changes are saved
**Then** the action is dispatched through `useBoardAPI().updateTask()` so it can be tracked by the history system in a later epic

**Given** the user edits a task and saves
**When** the operation completes successfully
**Then** all edited fields (title, description, assignee, priority, tags) persist in the board state

**Given** the modal is open with no changes made
**When** the user presses Escape or clicks the backdrop
**Then** the modal closes immediately with no guard prompt (guard only triggers if fields are dirty)

---

### Story 2.4: Delete Task

As a user,
I want to delete a task from the board,
So that I can remove completed or irrelevant work items.

**Acceptance Criteria:**

**Given** the task detail modal is open
**When** the user clicks the "Delete" destructive action
**Then** the task is removed from the board immediately (optimistic delete — preparation for Epic 5)
**And** the deletion is dispatched through `useBoardAPI().deleteTask()` for history tracking

**Given** a task is deleted
**When** the deletion is executed
**Then** the task no longer appears in any column
**And** the column task count badge updates immediately

**Given** a column that had one task
**When** that task is deleted
**Then** the column empty state (UX-DR14) is shown

---

## Epic 3: Task Movement — Drag-and-Drop & Status Changes

Users can move tasks between columns via drag-and-drop on desktop and a status dropdown on mobile.

### Story 3.1: Desktop Drag-and-Drop Task Movement

As a desktop user,
I want to drag task cards between columns with smooth visual feedback,
So that moving tasks between statuses feels instant and natural.

**Acceptance Criteria:**

**Given** a task card on desktop
**When** the user presses mousedown on the card
**Then** the card scales to 1.02x and its shadow deepens (grabbed state), cursor changes to `grabbing`

**Given** a card being dragged
**When** it is over a valid destination column
**Then** a semi-transparent ghost card remains at the origin
**And** a dashed placeholder appears in the destination column
**And** the destination column border highlights violet

**Given** a card is dropped into a different column
**When** the drop is completed
**Then** the card animates into its new position with a micro-animation (shadow resets, scale returns)
**And** the task's status updates immediately in board state (optimistic — full API call comes in Epic 5)
**And** the move is dispatched through `useBoardAPI().moveTask()` for history tracking

**Given** a card is dropped back into its origin column at the same position
**When** the drop occurs
**Then** the card snaps back with no animation and board state is unchanged

**Given** the @dnd-kit setup
**When** implemented
**Then** `DndContext` wraps the board with `PointerSensor` configured
**And** each column has a `SortableContext` with its task IDs
**And** the `useBoardDnd` hook handles `onDragStart`, `onDragOver`, and `onDragEnd`

---

### Story 3.2: Mobile Status Dropdown for Task Movement

As a mobile user,
I want to change a task's status via a dropdown selector when I tap a card,
So that I can move tasks between columns without needing drag-and-drop.

**Acceptance Criteria:**

**Given** a mobile viewport (< 768px) or touch device
**When** the user taps a task card
**Then** the task detail modal opens with the status `Select` dropdown as the first interactive element

**Given** the task modal is open on mobile
**When** the user selects a new status from the dropdown ("Todo", "In Progress", "Done")
**Then** the modal closes and the task card moves to the corresponding column immediately

**Given** the mobile status change
**When** executed
**Then** it dispatches through `useBoardAPI().moveTask()` — the same mutation path as drag-and-drop

**Given** the shadcn/ui `Select` component is used for the status dropdown
**When** rendered
**Then** the dropdown is accessible via keyboard (Tab to focus, Enter/Space to open, arrow keys to select)

---

## Epic 4: Filtering & Search

Users can filter the board by assignee and priority, search by text, and combine multiple filters.

### Story 4.1: Implement filterTasks Logic and Filter State

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

### Story 4.2: Build Direction D Filter Bar with Active Chips

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

### Story 4.3: Implement ⌘K Search Overlay

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

## Epic 5: Optimistic Updates & Error Recovery

Users experience instant feedback on all mutations, with automatic rollbacks and error notifications when API calls fail.

### Story 5.1: Implement Optimistic Update Sequence with Automatic Rollback

As a user,
I want all task mutations to appear instantly in the UI and automatically roll back if the API call fails,
So that the board always feels fast and self-heals without requiring manual intervention.

**Acceptance Criteria:**

**Given** any task mutation (create, update, delete, move) is dispatched
**When** the action is processed by boardReducer
**Then** the task list updates immediately before `mockRequest()` is called (≤ 1 animation frame, ≤ 16ms)
**And** a `PendingOperation` is recorded in `pendingOps` with the `opId`, `taskId`, and a snapshot of the task's prior state

**Given** a pending mutation is in flight
**When** `mockRequest()` resolves successfully (~90% of cases)
**Then** `OP_SUCCESS` is dispatched and the matching `pendingOps` entry is removed
**And** the task remains in its updated state on the board

**Given** a pending mutation is in flight
**When** `mockRequest()` throws `MockApiError` (~10% of cases)
**Then** `OP_ROLLBACK` is dispatched with the matching `opId`
**And** boardReducer restores the task from its `snapshot` in `pendingOps`
**And** the rollback is transparent to the undo/redo history stack (OP_ROLLBACK never pushes to history)

**Given** a task creation that is rolled back
**When** the API fails
**Then** the task card is removed from the board
**And** the create modal re-opens pre-filled with the previously entered data (UX-DR12, FR19)

**Given** multiple concurrent mutations with independent failure rates
**When** some succeed and some fail
**Then** each `OP_ROLLBACK` restores only its own operation's snapshot (identified by `opId`)
**And** successful operations are unaffected by other operations' rollbacks

---

### Story 5.2: Per-Card In-Flight Loading Indicator

As a user,
I want to see a subtle animated ring and spinner on any task card that has a pending API call,
So that I know which cards are being processed while the board remains fully interactive.

**Acceptance Criteria:**

**Given** a task mutation is dispatched and its `opId` is in `pendingOps`
**When** the corresponding TaskCard renders
**Then** a `cardPulse` CSS keyframe animation (0→50→100% violet border + glow, 1.8s infinite) appears on the card border
**And** a CSS spinner appears in the top-right corner of the card

**Given** a card is in the in-flight state
**When** the board renders
**Then** the card has `aria-busy="true"` for screen readers (UX-DR11)
**And** all other cards remain fully interactive (no global loading overlay or disabled state)

**Given** the API call resolves (success or failure)
**When** `OP_SUCCESS` or `OP_ROLLBACK` is dispatched
**Then** the `cardPulse` animation and spinner are removed from the card

**Given** `usePendingOps()` is consumed in TaskCard
**When** PendingOpsContext updates (new op added or removed)
**Then** only the affected TaskCard re-renders — columns and other task cards do NOT re-render

---

### Story 5.3: Tiered Toast Notification System

As a user,
I want toast notifications that clearly communicate what happened (remote update, success, conflict, error) with different visual weights and auto-dismiss timings,
So that I'm informed of async events without being overwhelmed.

**Acceptance Criteria:**

**Given** a mutation fails and `OP_ROLLBACK` fires
**When** the rollback toast is shown
**Then** it uses rose border styling (error tier), persists until the user manually dismisses it
**And** the message names the specific action and task: e.g., `"Update failed — \"Auth task\" has been reverted"` — generic "Something went wrong" messages are forbidden

**Given** a remote update is applied (Epic 6 will trigger this, but the toast infrastructure is set up here)
**When** the info toast is shown
**Then** it uses zinc border styling, auto-dismisses after 4 seconds

**Given** a successful operation completes (optional success toast for create)
**When** shown
**Then** it uses emerald border styling, auto-dismisses after 3 seconds

**Given** more than 3 toasts are queued simultaneously
**When** rendered by Sonner
**Then** additional toasts are queued and coalesce — no more than 3 are visible at once

**Given** the Sonner `<Toaster>` component
**When** configured in `ToastProvider`
**Then** toasts stack from the bottom-right corner, newest on top

---

### Story 5.4: Feature-Level Error Boundaries

As a user,
I want individual features to catch render errors gracefully without crashing the whole application,
So that a bug in one part of the board doesn't break everything else.

**Acceptance Criteria:**

**Given** an `ErrorBoundary` component wrapping the board feature
**When** a child component throws a JavaScript error during render
**Then** the ErrorBoundary catches it and renders a fallback UI (error message + "Retry" button)
**And** the rest of the application (header, other features) continues to function

**Given** an app-level `ErrorBoundary` in `App.tsx`
**When** a catastrophic error propagates past feature-level boundaries
**Then** the app-level boundary renders a full-page error state instead of a blank screen

**Given** the error boundary structure
**When** implemented
**Then** there are at least two boundaries: one at app level, one wrapping the board/Kanban feature
**And** `ErrorBoundary` is implemented as a class component (React's requirement for `componentDidCatch`)

---

## Epic 6: Real-Time Collaboration Simulation & Conflict Resolution

Users see simulated remote updates from a second user every 10–15 seconds and can resolve conflicts without data loss.

### Story 6.1: Implement Real-Time Simulation Hook

As a system,
I want to periodically apply random task updates simulating a second remote user,
So that the board demonstrates real-time collaboration behavior.

**Acceptance Criteria:**

**Given** the application is running
**When** `useRealtimeSimulation` hook is active
**Then** a random task update fires every 10–15 seconds (random interval within the range)

**Given** a simulation tick fires
**When** a task update is generated
**Then** `REMOTE_UPDATE` is dispatched directly to `boardReducer` (bypassing `useHistory` — remote updates must never enter the history stack)
**And** the task is selected randomly from the current task list with a meaningful field change (e.g., status, assignee, or priority)

**Given** the simulation hook
**When** implemented in `src/features/realtime/hooks/useRealtimeSimulation.ts`
**Then** it uses `useEffect` with proper cleanup (interval is cleared on unmount)
**And** it calls `boardDispatch` directly, NOT through `useBoardAPI()` (architecture boundary: simulation bypasses history)

**Given** the simulation is running alongside user interactions
**When** a `REMOTE_UPDATE` is dispatched
**Then** it does not reset the board scroll position or cause full column re-renders (NFR6)

---

### Story 6.2: Remote Update Notifications

As a user,
I want a non-intrusive info toast when a simulated remote user updates a task,
So that I'm aware of external changes without being interrupted.

**Acceptance Criteria:**

**Given** a `REMOTE_UPDATE` action is dispatched
**When** the update is applied to a task that the user is not actively editing
**Then** an info toast appears (zinc border, 4s auto-dismiss): `"[Task title] was updated by another user"`
**And** the task card on the board updates in place without scroll position reset

**Given** multiple remote updates fire in quick succession
**When** more than 3 toasts would be queued
**Then** excess toasts coalesce — the existing info toast is updated rather than stacking overflow

**Given** a remote update modifies a task's status
**When** applied
**Then** the task card moves to the correct column and the column count badges update

---

### Story 6.3: Conflict Detection and Resolution Modal

As a user,
I want to be informed when a remote update conflicts with my active edit and be able to choose which version to keep,
So that no data is silently lost due to concurrent edits.

**Acceptance Criteria:**

**Given** the user has the task detail modal open and is actively editing a task
**When** a `REMOTE_UPDATE` arrives for the same task
**Then** `CONFLICT_DETECTED` is dispatched with `{ local: Task, remote: Task }` stored in `ConflictContext`
**And** the Conflict Resolution Modal overlays the task edit modal

**Given** the Conflict Resolution Modal is shown
**When** rendered
**Then** it displays a two-column side-by-side diff showing "Mine" vs "Theirs" with changed fields highlighted
**And** it has three action buttons: "Keep mine" (primary/violet), "Take theirs" (secondary), "Cancel" (ghost)
**And** it uses `role="alertdialog"`, focus is trapped inside, and `aria-describedby` points to the diff section

**Given** the user clicks "Keep mine"
**When** the action is executed
**Then** `CONFLICT_RESOLVE_MINE` is dispatched and the user's version is saved
**And** the conflict modal closes and the task edit modal returns to its normal state

**Given** the user clicks "Take theirs"
**When** the action is executed
**Then** `CONFLICT_RESOLVE_THEIRS` is dispatched and the remote version replaces the task
**And** the task edit modal refreshes to show the remote version's field values

**Given** the user clicks "Cancel"
**When** the action is executed
**Then** the conflict modal closes and the task edit modal remains open with the user's original (pre-conflict) values
**And** no state change is applied (the conflict is deferred)

---

## Epic 7: Undo/Redo History System

Users can undo and redo any tracked action via keyboard shortcuts, with a persistent hint bar always showing what's available.

### Story 7.1: Implement useHistory Hook with Command Stack

As a developer,
I want a `useHistory` hook that wraps `boardAPI` and manages a 50-entry command stack with forward/inverse action pairs,
So that all user-initiated mutations are tracked and reversible.

**Acceptance Criteria:**

**Given** `src/features/history/hooks/useHistory.ts`
**When** implemented
**Then** it maintains an internal stack of `HistoryEntry` objects: `{ id: string; label: string; forward: UserAction; inverse: UserAction }`
**And** the stack is capped at 50 entries (oldest entries drop when the cap is reached)

**Given** a user action is dispatched through `useHistory.dispatch(action)`
**When** the action is a user action (TASK_MOVE, TASK_CREATE, TASK_UPDATE, TASK_DELETE)
**Then** a `HistoryEntry` is pushed to the stack with a human-readable label (e.g., "Move 'Auth task' to Done") and the computed inverse action

**Given** an `OP_ROLLBACK` or `REMOTE_UPDATE` occurs
**When** boardReducer processes it
**Then** the history stack is NOT modified (rollbacks and remote updates are transparent to undo/redo)

**Given** `undo()` is called
**When** there are entries in the stack
**Then** the stack cursor moves back and `HISTORY_APPLY(inverse)` is dispatched to boardReducer
**And** `HistoryContext` updates with new `undoLabel`, `redoLabel`, `canUndo`, `canRedo` values

**Given** `redo()` is called
**When** there are undone entries
**Then** the stack cursor moves forward and `HISTORY_APPLY(forward)` is dispatched

**Given** the user performs a new action after undoing
**When** the action is dispatched
**Then** all redo entries ahead of the cursor are cleared (FR32)

**Given** `useHistory.test.ts`
**When** the unit test suite runs
**Then** all invariants (cap, undo, redo, redo-stack-clear, rollback-transparency) pass without rendering

---

### Story 7.2: Keyboard Shortcuts for Undo and Redo

As a user,
I want to undo and redo actions using familiar keyboard shortcuts,
So that correcting mistakes requires no more effort than in any other tool I use.

**Acceptance Criteria:**

**Given** the board is active (no modal open)
**When** the user presses Ctrl+Z (Windows/Linux) or Cmd+Z (macOS)
**Then** the most recent undoable action is reversed
**And** the board state updates immediately

**Given** the board is active
**When** the user presses Ctrl+Shift+Z (Windows/Linux) or Cmd+Shift+Z (macOS)
**Then** the most recently undone action is re-applied

**Given** `useKeyboardShortcut` in `src/shared/hooks/useKeyboardShortcut.ts`
**When** implemented
**Then** it listens for keyboard events at the document level with correct modifier detection for both macOS and Windows
**And** it cleans up event listeners on unmount

**Given** a modal is open
**When** the user presses Ctrl/Cmd+Z
**Then** the shortcut is suppressed (undo should not fire while a modal has focus, to avoid interfering with text editing)

**Given** `canUndo` is `false`
**When** Ctrl/Cmd+Z is pressed
**Then** nothing happens (no error, no state change)

---

### Story 7.3: Undo Hint Bar Component

As a user,
I want a persistent strip between the filter bar and the columns that always shows what action can be undone or redone,
So that I never have to wonder if undo is available or what it will do.

**Acceptance Criteria:**

**Given** the Undo Hint Bar component is rendered
**When** the history stack is empty
**Then** the bar shows "Nothing to undo" in muted `text-xs text-zinc-500` styling

**Given** there is an undoable action on the stack
**When** the bar renders
**Then** an Undo button with `undo-2` Lucide icon and descriptive label is shown: `"Undo: Move 'Auth task' to Done"`
**And** the label text uses `text-xs text-zinc-500` (present but quiet, never dominant)

**Given** there is a redoable action
**When** the bar renders
**Then** a Redo button with `redo-2` icon appears and is enabled

**Given** the `aria-live="polite"` attribute is set on the bar
**When** the undo/redo label changes
**Then** screen readers announce the change without interrupting other announcements (UX-DR6)

**Given** the bar is rendered
**When** the user is on any viewport size
**Then** the bar is always visible and never collapsed or hidden (including on mobile)

---

## Epic 8: Performance & Scale

Users experience smooth 60fps board operation with 1000+ tasks loaded.

### Story 8.1: Virtualized Task List per Column

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

### Story 8.2: Performance Optimizations — Memoization and Render Isolation

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

## Epic 9: Responsive Design & Accessibility

Users can use the full board on mobile and with keyboard-only or screen reader navigation.

### Story 9.1: Responsive Layout and Mobile-First Design

As a mobile user,
I want columns to stack vertically, filters to collapse to a button, and tap targets to be large enough for one-handed use,
So that the board is genuinely usable during stand-ups, not just technically responsive.

**Acceptance Criteria:**

**Given** a viewport narrower than 768px
**When** the board renders
**Then** columns stack vertically (flex-col, each column full-width) in order: Todo → In Progress → Done (FR37)
**And** drag-and-drop is disabled on touch (replaced by status Select dropdown, per Story 3.2)
**And** the filter bar collapses to a single "Filter" button that opens a bottom sheet

**Given** a tablet viewport (768–1024px)
**When** the board renders
**Then** three columns are side-by-side with `md:flex-row`
**And** filter chips may wrap to a second row
**And** column min-width is 280px

**Given** any interactive element on a mobile viewport
**When** rendered
**Then** its tap target is a minimum of 44×44px (FR40, UX-DR9)
**And** badge dismiss buttons use padding expansion to reach 44×44px touch area while remaining visually compact

**Given** the implementation
**When** CSS is written
**Then** only Tailwind responsive prefixes (`md:`, `lg:`) are used — no custom breakpoints and no inline media queries
**And** base styles target mobile, `md:` and `lg:` progressively enhance

---

### Story 9.2: Keyboard Navigation and ARIA Labeling

As a keyboard user,
I want every interactive element on the board to be reachable via Tab and operable via keyboard,
So that I can use the board without a mouse.

**Acceptance Criteria:**

**Given** the board is loaded
**When** the user presses Tab repeatedly
**Then** focus moves through all interactive elements in a logical order: header → filter bar → undo bar → columns → task cards (FR38)
**And** each element has a visible focus indicator: `focus-visible:ring-2 focus-visible:ring-violet-500`

**Given** a focused task card
**When** the user presses Enter
**Then** the task detail modal opens

**Given** a focused task card
**When** the user presses Space
**Then** keyboard drag mode is initiated: arrow keys move the card between columns, Space drops, Escape cancels (UX-DR17)

**Given** all buttons, icons, and form inputs
**When** rendered
**Then** each carries `aria-label` or `aria-labelledby` describing its action (e.g., "Close toast", "Dismiss filter") — never just the icon name (FR39)

**Given** each Kanban column
**When** rendered
**Then** it has `role="region"` and `aria-label="[Column name] column, [N] tasks"`

**Given** all task cards
**When** rendered
**Then** they have `role="article"` with `aria-label` containing title, priority, and assignee

---

### Story 9.3: Focus Management, Screen Reader Support, and Reduced Motion

As a user with assistive technology,
I want focus managed correctly in modals, live regions announcing async changes, and animations that respect motion preferences,
So that the board is fully usable regardless of how I access it.

**Acceptance Criteria:**

**Given** a modal (task create/edit, conflict) is opened
**When** it appears
**Then** focus automatically moves to the first interactive element inside (title field for task modal, "Keep mine" for conflict modal)
**And** focus is trapped inside — Tab wraps within the modal (handled by Radix UI Dialog, FR40)

**Given** a modal is closed
**When** it closes
**Then** focus returns to the element that triggered the modal (FR40, NFR13)

**Given** the Undo Hint Bar with `aria-live="polite"`
**When** the undo/redo label changes
**Then** screen readers announce the new label without interrupting other announcements

**Given** the toast container
**When** an error toast fires
**Then** it uses `aria-live="assertive"` (urgent, interrupts screen reader)
**And** info/success toasts use `aria-live="polite"` (non-interrupting)

**Given** in-flight card state
**When** a mutation is in progress
**Then** the card has `aria-busy="true"` which screen readers announce as "busy"

**Given** a drag-and-drop operation via keyboard or mouse
**When** it occurs
**Then** `aria-live` announcements fire at drag start ("Picked up [task title]"), on drag-over ("Moving to [column name] column"), and on drop ("Dropped in [column name] column")

**Given** the user has `prefers-reduced-motion: reduce` set in their OS
**When** any animation plays (cardPulse, drag physics, toast fade, spinner)
**Then** the animation is reduced to an instant transition or opacity-only fade (UX-DR18)

**Given** the page
**When** it renders
**Then** a "Skip to main content" link is present (visually hidden, visible on focus) that skips to the board `<main>` element
