# Story 1.4: Build Kanban Board Shell with Three Columns

Status: ready-for-dev

## Story

As a user,
I want to see a Kanban board with three labeled columns (Todo, In Progress, Done) populated with seed tasks,
So that I have a visual starting point and the board renders correctly before any CRUD features are added.

## Acceptance Criteria

1. **Given** the application is running **When** the page loads **Then** the board header renders with the board title, a `layout-kanban` Lucide icon, and a "New Task" primary button (non-functional in this story) **And** three columns are displayed: "Todo", "In Progress", "Done" **And** each column header shows the column name and a task count badge.

2. **Given** the 25 seed tasks in `mockData.ts` are loaded into BoardStateContext **When** the board renders **Then** each task card is displayed in the correct column matching its `status` field **And** each card shows at minimum: title (dominant, `text-sm font-medium`), priority badge (colored dot + label), assignee name (`text-xs text-zinc-500`), and created date.

3. **Given** the design token system (UX-DR1) **When** any component renders **Then** the page background is `zinc-50`, column backgrounds are `zinc-100`, card backgrounds are `white` with `zinc-200` border **And** priority badges use: High → `rose-500`, Medium → `amber-500`, Low → `sky-500`.

4. **Given** a column with no tasks **When** the column renders **Then** an empty state is shown: `inbox` Lucide icon, "No tasks" heading, "Drag a task here or add one" subtext, and an "Add task" ghost dashed button (non-functional in this story).

5. **Given** the shadcn/ui component library (UX-DR2) **When** installed via the shadcn CLI **Then** `Dialog`, `Badge`, `Button`, `Select`, and `Tooltip` components are copied to `src/components/ui/` and render without errors.

6. **Given** the board runs in the browser **When** `npm run dev` is executed **Then** zero TypeScript errors and zero ESLint warnings are reported **And** Tailwind utility classes apply correctly (no custom CSS overrides or hardcoded hex values).

## Tasks / Subtasks

- [ ] Task 1: Install shadcn/ui and required components (AC: #5)
  - [ ] Run `npx shadcn@latest init` — choose TypeScript, Default style, zinc base color, yes to CSS variables
  - [ ] Run `npx shadcn@latest add dialog badge button select tooltip`
  - [ ] Verify components land at `src/components/ui/dialog.tsx`, `badge.tsx`, `button.tsx`, `select.tsx`, `tooltip.tsx`
  - [ ] Confirm zero TypeScript errors after install (`npx tsc --noEmit`)

- [ ] Task 2: Install `lucide-react` if not already present (AC: #1, #4)
  - [ ] Check `package.json` for `lucide-react` — install only if missing: `npm install lucide-react`
  - [ ] Verify icons import correctly: `import { LayoutKanban, Plus, Inbox, Flag } from 'lucide-react'`

- [ ] Task 3: Update `src/store/AppProvider.tsx` to seed `boardReducer` with `SEED_TASKS` (AC: #2)
  - [ ] Import `SEED_TASKS` from `@/shared/utils/mockData`
  - [ ] Import `boardReducer` and `BoardState` type from `@/store/boardReducer`
  - [ ] Define `initialBoardState` with `tasks: SEED_TASKS`, `pendingOps: new Map()`, `conflict: null`
  - [ ] Pass `initialBoardState` as the second argument to `useReducer(boardReducer, initialBoardState)`
  - [ ] Confirm `boardState.tasks` flows into `<BoardStateContext.Provider value={boardState.tasks}>`
  - [ ] Do NOT export `SEED_TASKS` from `AppProvider.tsx` — it is an internal initialization detail only

- [ ] Task 4: Implement `src/features/tasks/components/TaskCard.tsx` (AC: #2, #3)
  - [ ] Wrap the component in `React.memo`
  - [ ] Accept `{ task: Task }` as the sole props type — no other props
  - [ ] Render card container with `role="article"` and `aria-label` containing title, priority, and assignee
  - [ ] Apply card classes: `bg-white border border-zinc-200 rounded-lg p-4 cursor-pointer hover:border-zinc-300 hover:shadow-sm transition-all`
  - [ ] Render title with `text-sm font-medium text-zinc-900`
  - [ ] Render priority badge using shadcn `Badge` component with correct color variant (see Dev Notes)
  - [ ] Render assignee (when present) with `text-xs text-zinc-500`
  - [ ] Render formatted `createdAt` date right-aligned with `text-xs text-zinc-500`
  - [ ] Read `usePendingOps()` and check if this task's `id` exists in the map — if so, apply `ring-2 ring-violet-600` to card container
  - [ ] Ensure all interactive elements have `focus-visible:ring-2 focus-visible:ring-violet-500`

- [ ] Task 5: Implement `src/features/board/components/BoardColumn.tsx` (AC: #1, #3, #4)
  - [ ] Accept `{ status: TaskStatus; title: string }` as props
  - [ ] Read tasks via `useTasks()` — never raw `useContext`
  - [ ] Filter tasks with `useMemo` keyed on `tasks` and `status` prop: `tasks.filter(t => t.status === status)`
  - [ ] Apply column container classes: `bg-zinc-100 rounded-xl p-3 flex flex-col gap-3 w-80 min-w-[280px]`
  - [ ] Apply `role="region"` and `aria-label` of `"[title] column, [count] tasks"` to the column container
  - [ ] Render column header: title with `text-sm font-semibold` + count badge with `bg-zinc-200 rounded-full px-2 py-0.5 text-xs`
  - [ ] Render empty state when filtered task list is empty (see Dev Notes for exact markup)
  - [ ] Render task list: map filtered tasks to `<TaskCard key={task.id} task={task} />`

- [ ] Task 6: Implement `src/features/board/components/KanbanBoard.tsx` (AC: #1, #2, #3)
  - [ ] Read tasks via `useTasks()` — do NOT import `SEED_TASKS` or `mockData` directly
  - [ ] Apply layout: `min-h-screen bg-zinc-50`
  - [ ] Render header section with board title "Real-time Board", `LayoutKanban` icon, and "New Task" `Button` (variant primary, violet-600; onClick = noop)
  - [ ] Add placeholder `<div>` stubs for `FilterBar` and `UndoHintBar` (no implementation — just a `{/* FilterBar stub */}` comment or empty element)
  - [ ] Render three `<BoardColumn>` components in a `flex gap-4 p-4 overflow-x-auto` container
  - [ ] Pass `status="todo"` + `title="Todo"`, `status="in-progress"` + `title="In Progress"`, `status="done"` + `title="Done"`

- [ ] Task 7: Update `src/App.tsx` (AC: #6)
  - [ ] Replace default Vite scaffold with `ErrorBoundary` wrapping `KanbanBoard`
  - [ ] Import `ErrorBoundary` from `@/shared/components/ErrorBoundary`
  - [ ] Import `KanbanBoard` from `@/features/board/components/KanbanBoard`
  - [ ] Export as default function `App`

- [ ] Task 8: Update `src/main.tsx` (AC: #6)
  - [ ] Wrap the app with `AppProvider` and render `ToastProvider` as a sibling to `App` inside the provider
  - [ ] Import `AppProvider` from `@/store/AppProvider`
  - [ ] Import `ToastProvider` from `@/shared/components/ToastProvider`
  - [ ] Keep `React.StrictMode` outermost wrapper
  - [ ] Render order inside `AppProvider`: `<ToastProvider />` then `<App />`

- [ ] Task 9: Verify zero errors, zero warnings (AC: #6)
  - [ ] Run `npx tsc --noEmit` — must show zero errors
  - [ ] Run `npm run dev` — confirm no console errors, no ESLint warnings in terminal
  - [ ] Confirm no `any` types introduced in any file touched by this story
  - [ ] Confirm no hardcoded hex values in any JSX or TS file
  - [ ] Confirm no barrel `index.ts` exports created
  - [ ] Confirm `KanbanBoard.tsx` does NOT import from `@/shared/utils/mockData`

## Dev Notes

### How Seed Data Flows into BoardStateContext

**Critical rule: `KanbanBoard.tsx` must NEVER import `mockData` or `SEED_TASKS` directly.**

The data pipeline is:

```
SEED_TASKS (mockData.ts)
  → imported ONLY by AppProvider.tsx
    → used as initialBoardState.tasks in useReducer(boardReducer, initialBoardState)
      → boardState.tasks flows into BoardStateContext.Provider value
        → useTasks() hook reads BoardStateContext
          → KanbanBoard reads via useTasks()
            → passes filtered slice to BoardColumn via props pattern
              → BoardColumn calls useTasks() itself and filters in-component
```

The `AppProvider.tsx` update required for this story:

```typescript
// src/store/AppProvider.tsx — update the initialBoardState definition
import { SEED_TASKS } from '@/shared/utils/mockData'
import { boardReducer } from '@/store/boardReducer'
import type { BoardState } from '@/store/boardReducer'

const initialBoardState: BoardState = {
  tasks: SEED_TASKS,
  pendingOps: new Map(),
  conflict: null,
}

// Inside AppProvider component:
const [boardState, boardDispatch] = useReducer(boardReducer, initialBoardState)
```

`SEED_TASKS` must be imported from `@/shared/utils/mockData` — the export name is `SEED_TASKS` (not `MOCK_TASKS`). Check Story 1.3's `mockData.ts` for the actual export name and use the correct one. If Story 1.3 exported `MOCK_TASKS`, use that name and add a `SEED_TASKS` alias or just use `MOCK_TASKS` consistently here.

**Note:** If Story 1.3 named the export `MOCK_TASKS`, use it as-is — do not rename it, as that would violate the no-modify-existing-files rule. Simply reference the correct export name in `initialBoardState`.

---

### shadcn/ui Installation Steps

Run these commands in order from the project root:

```bash
# Step 1: Initialize shadcn (answer prompts as shown below)
npx shadcn@latest init
# Prompts:
#   Style: Default
#   Base color: Zinc
#   CSS variables: Yes
#   TypeScript: Yes (already configured)
# This creates/updates src/components/ui/ directory and modifies src/index.css

# Step 2: Add required components
npx shadcn@latest add dialog badge button select tooltip
# Components land at:
#   src/components/ui/dialog.tsx
#   src/components/ui/badge.tsx
#   src/components/ui/button.tsx
#   src/components/ui/select.tsx
#   src/components/ui/tooltip.tsx
```

**After init**, shadcn may modify `src/index.css` to add CSS variable definitions for the zinc color system. This is expected and correct — do NOT revert these changes. The file will still start with `@import "tailwindcss"`.

**Tailwind v4 note:** shadcn CLI may warn about Tailwind v4 compatibility. Proceed anyway — the generated components use standard utility classes that work with v4. If the CLI offers a Tailwind v4 migration path, accept it.

---

### Exact Component Implementations

#### `src/App.tsx`

```tsx
import { ErrorBoundary } from '@/shared/components/ErrorBoundary'
import { KanbanBoard } from '@/features/board/components/KanbanBoard'

export default function App() {
  return (
    <ErrorBoundary>
      <KanbanBoard />
    </ErrorBoundary>
  )
}
```

#### `src/main.tsx`

```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { AppProvider } from '@/store/AppProvider'
import { ToastProvider } from '@/shared/components/ToastProvider'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppProvider>
      <ToastProvider />
      <App />
    </AppProvider>
  </React.StrictMode>
)
```

#### `src/features/board/components/KanbanBoard.tsx`

```tsx
import { LayoutKanban, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { BoardColumn } from '@/features/board/components/BoardColumn'
import type { TaskStatus } from '@/types/task.types'

const COLUMNS: { status: TaskStatus; title: string }[] = [
  { status: 'todo', title: 'Todo' },
  { status: 'in-progress', title: 'In Progress' },
  { status: 'done', title: 'Done' },
]

export function KanbanBoard() {
  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 bg-white">
        <div className="flex items-center gap-2">
          <LayoutKanban className="h-5 w-5 text-violet-600" aria-hidden="true" />
          <h1 className="text-lg font-semibold text-zinc-900">Real-time Board</h1>
        </div>
        <Button
          onClick={() => {/* noop — implemented in Story 2.2 */}}
          className="bg-violet-600 hover:bg-violet-700 text-white focus-visible:ring-2 focus-visible:ring-violet-500"
          aria-label="New Task"
        >
          <Plus className="h-4 w-4 mr-1" aria-hidden="true" />
          New Task
        </Button>
      </header>

      {/* FilterBar stub — implemented in Epic 3 */}
      {/* UndoHintBar stub — implemented in Epic 4 */}

      {/* Board columns */}
      <main className="flex gap-4 p-4 overflow-x-auto items-start">
        {COLUMNS.map(col => (
          <BoardColumn
            key={col.status}
            status={col.status}
            title={col.title}
          />
        ))}
      </main>
    </div>
  )
}
```

**Note:** `KanbanBoard` does not call `useTasks()` itself in this story — `BoardColumn` reads from context directly and filters internally. The board component is a layout/orchestration shell only.

#### `src/features/board/components/BoardColumn.tsx`

```tsx
import { useMemo } from 'react'
import { Inbox, Plus } from 'lucide-react'
import { useTasks } from '@/store/BoardStateContext'
import { TaskCard } from '@/features/tasks/components/TaskCard'
import { Button } from '@/components/ui/button'
import type { TaskStatus } from '@/types/task.types'

type BoardColumnProps = {
  status: TaskStatus
  title: string
}

export function BoardColumn({ status, title }: BoardColumnProps) {
  const tasks = useTasks()
  const columnTasks = useMemo(
    () => tasks.filter(t => t.status === status),
    [tasks, status]
  )
  const count = columnTasks.length

  return (
    <section
      role="region"
      aria-label={`${title} column, ${count} task${count !== 1 ? 's' : ''}`}
      className="bg-zinc-100 rounded-xl p-3 flex flex-col gap-3 w-80 min-w-[280px]"
    >
      {/* Column header */}
      <div className="flex items-center justify-between px-1">
        <h2 className="text-sm font-semibold text-zinc-700">{title}</h2>
        <span
          className="bg-zinc-200 rounded-full px-2 py-0.5 text-xs text-zinc-600 font-medium tabular-nums"
          aria-hidden="true"
        >
          {count}
        </span>
      </div>

      {/* Task list or empty state */}
      {count === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8 px-3 text-center">
          <Inbox className="h-8 w-8 text-zinc-400" aria-hidden="true" />
          <p className="text-sm font-medium text-zinc-500">No tasks</p>
          <p className="text-xs text-zinc-400">Drag a task here or add one</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-1 border-dashed border-zinc-300 text-zinc-400 hover:text-zinc-600 hover:border-zinc-400 focus-visible:ring-2 focus-visible:ring-violet-500 min-h-[44px]"
            onClick={() => {/* noop — implemented in Story 2.2 */}}
            aria-label={`Add task to ${title}`}
          >
            <Plus className="h-3 w-3 mr-1" aria-hidden="true" />
            Add task
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {columnTasks.map(task => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      )}
    </section>
  )
}
```

#### `src/features/tasks/components/TaskCard.tsx`

```tsx
import { memo } from 'react'
import { Badge } from '@/components/ui/badge'
import { usePendingOps } from '@/store/PendingOpsContext'
import type { Task, Priority } from '@/types/task.types'

type TaskCardProps = {
  task: Task
}

// Priority badge configuration — Tailwind classes only, no hex values
const PRIORITY_BADGE: Record<Priority, { dot: string; badge: string; label: string }> = {
  high:   { dot: 'bg-rose-500',  badge: 'bg-rose-100 text-rose-700 border-rose-200',   label: 'High' },
  medium: { dot: 'bg-amber-500', badge: 'bg-amber-100 text-amber-700 border-amber-200', label: 'Medium' },
  low:    { dot: 'bg-sky-500',   badge: 'bg-sky-100 text-sky-700 border-sky-200',       label: 'Low' },
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

export const TaskCard = memo(function TaskCard({ task }: TaskCardProps) {
  const pendingOps = usePendingOps()
  const isInFlight = [...pendingOps.values()].some(op => op.taskId === task.id)

  const priority = PRIORITY_BADGE[task.priority]

  return (
    <article
      role="article"
      aria-label={`${task.title}, priority ${priority.label}${task.assignee ? `, assigned to ${task.assignee}` : ''}`}
      className={[
        'bg-white border rounded-lg p-4 cursor-pointer',
        'hover:border-zinc-300 hover:shadow-sm transition-all',
        'focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:outline-none',
        isInFlight
          ? 'border-violet-600 ring-2 ring-violet-600'
          : 'border-zinc-200',
      ].join(' ')}
      tabIndex={0}
    >
      {/* Priority badge */}
      <div className="mb-2">
        <Badge
          className={`${priority.badge} border text-xs font-medium px-2 py-0.5`}
          aria-label={`Priority: ${priority.label}`}
        >
          <span
            className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 ${priority.dot}`}
            aria-hidden="true"
          />
          {priority.label}
        </Badge>
      </div>

      {/* Title */}
      <p className="text-sm font-medium text-zinc-900 leading-snug">{task.title}</p>

      {/* Footer: assignee + date */}
      <div className="flex items-center justify-between mt-3">
        <span className="text-xs text-zinc-500 truncate max-w-[60%]">
          {task.assignee ?? <span className="text-zinc-300">Unassigned</span>}
        </span>
        <time
          className="text-xs text-zinc-500 shrink-0 ml-2"
          dateTime={task.createdAt}
        >
          {formatDate(task.createdAt)}
        </time>
      </div>
    </article>
  )
})
```

---

### Design Token Enforcement

All styling MUST use Tailwind utility classes exclusively. Zero exceptions.

| Element | Classes |
|---|---|
| Page background | `bg-zinc-50` |
| Column background | `bg-zinc-100` |
| Card background | `bg-white` |
| Card border (default) | `border-zinc-200` |
| Card border (in-flight) | `border-violet-600 ring-2 ring-violet-600` |
| Card hover border | `hover:border-zinc-300` |
| Card hover shadow | `hover:shadow-sm` |
| Card title | `text-sm font-medium text-zinc-900` |
| Card metadata | `text-xs text-zinc-500` |
| Column header text | `text-sm font-semibold text-zinc-700` |
| Count badge | `bg-zinc-200 rounded-full px-2 py-0.5 text-xs text-zinc-600` |
| Priority High badge | `bg-rose-100 text-rose-700 border-rose-200` |
| Priority Medium badge | `bg-amber-100 text-amber-700 border-amber-200` |
| Priority Low badge | `bg-sky-100 text-sky-700 border-sky-200` |
| Priority High dot | `bg-rose-500` |
| Priority Medium dot | `bg-amber-500` |
| Priority Low dot | `bg-sky-500` |
| Primary button | `bg-violet-600 hover:bg-violet-700 text-white` |
| Ghost/dashed button | `border-dashed border-zinc-300 text-zinc-400` |
| Focus ring (all interactive) | `focus-visible:ring-2 focus-visible:ring-violet-500` |

**FORBIDDEN:**

```tsx
// WRONG — never hardcode colors
style={{ color: '#ef4444' }}
style={{ background: '#f4f4f5' }}

// WRONG — never use arbitrary values for design token colors
className="bg-[#ef4444]"

// CORRECT — always use the Tailwind token
className="bg-rose-500"
```

---

### Accessibility Requirements

Every ARIA attribute listed here is required for this story. Missing any one is a defect.

**KanbanBoard header:**

```tsx
<header>               // landmark — no role needed, semantic HTML
<h1>                   // page-level heading
<Button aria-label="New Task">  // announced as "New Task, button" to screen readers
```

**BoardColumn:**

```tsx
<section
  role="region"
  aria-label="Todo column, 8 tasks"   // count must be dynamic
>
  <h2>Todo</h2>         // column-level heading, inside the region
  <span aria-hidden="true">{count}</span>  // count badge hidden (heading already carries it)
```

**TaskCard:**

```tsx
<article
  role="article"
  aria-label="Implement auth middleware, priority High, assigned to Alice"
  tabIndex={0}   // keyboard navigable
>
```

**Priority badge accessibility:** The colored dot (`bg-rose-500`) alone does NOT convey priority to screen readers. The text label ("High", "Medium", "Low") inside the Badge is required for every priority badge. The dot has `aria-hidden="true"`.

**Minimum touch targets:** The "Add task" button and "New Task" button must render at `min-h-[44px]`. Apply this class explicitly if shadcn's default Button height is less than 44px.

**Focus management:** Never suppress the focus ring. The pattern `focus:outline-none` (without a replacement ring) is FORBIDDEN. Always pair it with `focus-visible:ring-2 focus-visible:ring-violet-500`.

---

### In-Flight State Hook-Up

`TaskCard` must read `usePendingOps()` to check whether the task has a pending operation:

```typescript
const pendingOps = usePendingOps()
// pendingOps is Map<string, PendingOperation>
// PendingOperation shape: { id: string; taskId: string; snapshot: Task }

// Check if THIS task has a pending op:
const isInFlight = [...pendingOps.values()].some(op => op.taskId === task.id)
```

When `isInFlight` is `true`, apply `ring-2 ring-violet-600` to the card border instead of the default `border-zinc-200`.

**Performance note:** The `pendingOps` Map will be empty for all 25 seed tasks on initial render (no ops in flight). This hook-up is correct but will produce no visible effect in this story. It is wired now so Story 2+ can rely on it without modifying `TaskCard`.

In Story 1 `pendingOps` starts as `new Map()` — the spread-into-array `[...pendingOps.values()]` on an empty map is a no-op. No risk of incorrect rendering.

---

### Custom Hook Import Paths

All hooks are consumed via their source file paths (no barrel exports):

```typescript
import { useTasks } from '@/store/BoardStateContext'
import { usePendingOps } from '@/store/PendingOpsContext'
import { useBoardAPI } from '@/store/BoardAPIContext'   // not used in this story
```

**FORBIDDEN:**

```typescript
// WRONG — never raw useContext
import { BoardStateContext } from '@/store/BoardStateContext'
const tasks = useContext(BoardStateContext)   // FORBIDDEN

// WRONG — no barrel exports
import { useTasks } from '@/store'           // FORBIDDEN (no index.ts)
```

---

### Component Hierarchy Summary

```
src/main.tsx
└── AppProvider          (provides all 7 contexts + loads seed data into boardReducer)
    ├── ToastProvider    (Sonner portal — no children required)
    └── App.tsx
        └── ErrorBoundary
            └── KanbanBoard.tsx          (layout shell, header, column grid)
                ├── BoardColumn.tsx      (status="todo")
                │   └── TaskCard.tsx × N
                ├── BoardColumn.tsx      (status="in-progress")
                │   └── TaskCard.tsx × N
                └── BoardColumn.tsx      (status="done")
                    └── TaskCard.tsx × N
```

---

### What Is Explicitly OUT OF SCOPE for This Story

The following features will be implemented in later epics. Do NOT stub, partially implement, or placeholder any of them in this story's code:

| Feature | Story |
|---|---|
| Drag-and-drop between columns | Epic 3 — Story 3.1 |
| "New Task" button opening a modal | Epic 2 — Story 2.2 |
| "Add task" button in empty state opening a modal | Epic 2 — Story 2.2 |
| TaskCard click opening task detail modal | Epic 2 — Story 2.1 |
| FilterBar (assignee, priority, search filters) | Epic 3 — Story 3.2 |
| UndoHintBar (undo/redo controls) | Epic 4 |
| Real-time simulation (remote updates, conflict detection) | Epic 5 |
| `status: 'done'` opacity + strikethrough visual | Epic 2 — Story 2.1 |
| Tag chips display on TaskCard | Epic 2 — Story 2.1 |
| `@tanstack/react-virtual` list virtualization | Epic 3 — Story 3.1 |

For `FilterBar` and `UndoHintBar`: add a comment `{/* FilterBar — Story 3.2 */}` and `{/* UndoHintBar — Epic 4 */}` in `KanbanBoard.tsx`. Do NOT import or render the actual stub components — that would introduce a TypeScript dependency on not-yet-implemented code.

---

### Performance Notes

`BoardColumn` derives its filtered task list with `useMemo` to prevent recomputing the filter on every render:

```typescript
const columnTasks = useMemo(
  () => tasks.filter(t => t.status === status),
  [tasks, status]
)
```

`status` is a stable string prop, so this memo only re-runs when `tasks` changes — not on every parent re-render.

`TaskCard` is wrapped in `React.memo`. With 25 seed tasks across 3 columns, the performance difference is negligible now, but the pattern is established for when virtualization is added in Epic 3.

---

### Date Formatting

`createdAt` is an ISO 8601 string (e.g. `"2026-03-28T14:32:11.000Z"`). Render it in a human-readable, locale-appropriate format:

```typescript
function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}
// Output: "Mar 28"
```

Use a `<time dateTime={task.createdAt}>` element for semantic correctness and screen reader support.

---

### Verification Commands

Run these before marking the story complete:

```bash
# 1. TypeScript — must show zero errors
npx tsc --noEmit

# 2. Lint — must show zero warnings
npx eslint src --ext .ts,.tsx

# 3. Dev server — board must render in browser with 25 task cards
npm run dev

# 4. Confirm no barrel exports were created
find src -name "index.ts" -o -name "index.tsx"
# Expected: nothing returned

# 5. Confirm KanbanBoard does not import mockData
grep -r "mockData\|MOCK_TASKS\|SEED_TASKS" src/features/board/
# Expected: nothing returned

# 6. Confirm no any types in new files
grep -rn ": any" src/features/board/ src/features/tasks/
# Expected: nothing returned

# 7. Confirm no hardcoded hex values
grep -rn "#[0-9a-fA-F]\{3,6\}" src/features/ src/store/AppProvider.tsx src/App.tsx src/main.tsx
# Expected: nothing returned

# 8. Confirm shadcn components landed correctly
ls src/components/ui/
# Expected: badge.tsx button.tsx dialog.tsx select.tsx tooltip.tsx (plus any shadcn init files)
```

### Project Structure Notes

Files to create or modify in this story:

```
src/
├── App.tsx                                        ← REPLACE scaffold with ErrorBoundary + KanbanBoard
├── main.tsx                                       ← REPLACE scaffold with AppProvider + ToastProvider wrapping
├── store/
│   └── AppProvider.tsx                            ← UPDATE: add SEED_TASKS to initialBoardState
├── components/
│   └── ui/                                        ← CREATED BY shadcn CLI
│       ├── badge.tsx
│       ├── button.tsx
│       ├── dialog.tsx
│       ├── select.tsx
│       └── tooltip.tsx
└── features/
    ├── board/
    │   └── components/
    │       ├── KanbanBoard.tsx                    ← REPLACE stub with full implementation
    │       └── BoardColumn.tsx                    ← REPLACE stub with full implementation
    └── tasks/
        └── components/
            └── TaskCard.tsx                       ← REPLACE stub with full implementation
```

Files that must NOT be modified in this story:

- `src/store/boardReducer.ts` — implemented in Story 1.2, no changes needed
- `src/store/BoardStateContext.tsx` — implemented in Story 1.2, no changes needed
- `src/store/PendingOpsContext.tsx` — implemented in Story 1.2, no changes needed
- `src/shared/utils/mockData.ts` — implemented in Story 1.3, no changes needed
- `src/shared/components/ErrorBoundary.tsx` — implemented in Story 1.3, no changes needed
- `src/shared/components/ToastProvider.tsx` — implemented in Story 1.3, no changes needed
- `src/index.css` — shadcn init may append CSS variables; this is acceptable and expected
- `src/types/task.types.ts` — implemented in Story 1.2, no changes needed

### References

- Board layout and component hierarchy: [Source: architecture.md — Component Design / Performance Invariants]
- Design token system (UX-DR1): [Source: ux-design-specification.md — Design Tokens]
- shadcn/ui setup (UX-DR2): [Source: ux-design-specification.md — Component Library]
- Empty state specification (UX-DR14): [Source: ux-design-specification.md — Empty States]
- Accessibility requirements: [Source: epics.md — Additional Requirements / architecture.md — Accessibility]
- Context provider nesting order: [Source: architecture.md — AppProvider nesting / State Architecture]
- useTasks / usePendingOps hook paths: [Source: architecture.md — Custom Hooks]
- Forbidden patterns (any, barrel exports, raw useContext): [Source: epics.md — Additional Requirements]
- Optimistic update in-flight indicator: [Source: epics.md — Story 2.x / architecture.md — PendingOpsContext]

## Dev Agent Record

### Agent Model Used

_to be filled by dev agent_

### Debug Log References

_to be filled by dev agent_

### Completion Notes List

_to be filled by dev agent_

### File List

- `src/App.tsx`
- `src/main.tsx`
- `src/store/AppProvider.tsx`
- `src/components/ui/badge.tsx` (shadcn — CLI generated)
- `src/components/ui/button.tsx` (shadcn — CLI generated)
- `src/components/ui/dialog.tsx` (shadcn — CLI generated)
- `src/components/ui/select.tsx` (shadcn — CLI generated)
- `src/components/ui/tooltip.tsx` (shadcn — CLI generated)
- `src/features/board/components/KanbanBoard.tsx`
- `src/features/board/components/BoardColumn.tsx`
- `src/features/tasks/components/TaskCard.tsx`
