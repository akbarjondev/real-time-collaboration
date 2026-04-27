# Requirements Inventory

## Functional Requirements

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

## NonFunctional Requirements

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

## Additional Requirements

- **Starter template (Epic 1, Story 1):** Initialize project with `npm create vite@latest real-time-collaboration -- --template react-ts` (`@vitejs/plugin-react` Babel compiler)
- Install all required dependencies: `tailwindcss @tailwindcss/vite`, `@tanstack/react-virtual`, `@dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities`, `nanoid sonner react-hook-form`, dev: `vitest @testing-library/react @testing-library/jest-dom jsdom`
- Configure `vite.config.ts` with react + tailwindcss plugins + path alias `@/` → `./src`
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

## UX Design Requirements

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

## FR Coverage Map

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
