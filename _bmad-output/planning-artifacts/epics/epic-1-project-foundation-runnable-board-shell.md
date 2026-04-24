# Epic 1: Project Foundation & Runnable Board Shell

A developer can run the project locally and see a Kanban board populated with seed tasks in 3 columns. The complete state architecture, mock API layer, and feature folder structure are in place as the foundation for all subsequent epics.

**Note:** Stories 1.2 and 1.3 are technical setup stories (no direct end-user value). They are prerequisites for Story 1.4 and all subsequent epics. In a team context these would be implementation tasks, not stories.

## Story 1.1: Initialize Project with Dependencies and Configuration

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

## Story 1.2: [Technical Setup] Implement Core State Architecture

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

## Story 1.3: [Technical Setup] Implement Mock API Layer, Shared Utilities, and Seed Data

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

## Story 1.4: Build Kanban Board Shell with Three Columns

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
