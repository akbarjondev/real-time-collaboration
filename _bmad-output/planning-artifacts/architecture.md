---
stepsCompleted: [step-01-init, step-02-context, step-03-starter, step-04-decisions, step-05-patterns, step-06-structure, step-07-validation, step-08-complete]
inputDocuments: ["_bmad-output/planning-artifacts/prd.md", "_bmad-output/planning-artifacts/ux-design-specification.md", "docs/requirements.md"]
workflowType: 'architecture'
project_name: 'real-time-collaboration'
user_name: 'Ali'
date: '2026-04-23'
lastStep: 8
status: complete
completedAt: '2026-04-23'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements — 40 FRs across 8 categories:**

| Category | FRs | Architectural Weight |
|---|---|---|
| Task CRUD & Display | FR1–FR6 | Standard model/view layer |
| Filtering & Search | FR7–FR11 | Memoized derivation; must compose with virtualization |
| Task Movement | FR12–FR14 | Optimistic mutation entry point; drag-and-drop + mobile fallback |
| Optimistic Updates & Errors | FR15–FR21 | Core state machine; 2s delay + 10% failure drives rollback logic |
| Real-Time Simulation | FR22–FR26 | Concurrent mutation source; conflict detection + resolution |
| History Management | FR27–FR33 | Cross-cutting — integrates with every mutation path |
| Performance & Rendering | FR34–FR36 | Virtualization; remote-update-stable scroll |
| Responsive & Accessible UI | FR37–FR40 | Breakpoints; keyboard nav; ARIA; focus management |

**Non-Functional Requirements:**

| Area | Key Constraint | Architectural Impact |
|---|---|---|
| Performance | 60fps / 1000+ tasks; ≤16ms optimistic; <50ms filter | Mandatory virtualization; memoized selectors; no full-list re-renders |
| Code Quality | Strict TS, zero `any`, ≤150 line components | Discriminated unions for async state; feature-folder co-location |
| Accessibility | WCAG AA; focus trap; Tab-navigable board | Dedicated modal management + keyboard event layer |
| Security | No `dangerouslySetInnerHTML`, no sensitive localStorage | React's default escaping is sufficient |

**Scale & Complexity:**
- Primary domain: Frontend SPA (no real backend)
- Complexity level: Medium-High — standard Kanban CRUD elevated by concurrent async state, optimistic rollback, undo/redo integration, and virtualized live updates
- Estimated architectural components: ~18

### Technical Constraints & Dependencies

| Constraint | Source | Impact |
|---|---|---|
| React 18+, hooks-only, functional components | Assignment spec | Concurrent features available (useTransition, useDeferredValue) |
| TypeScript strict, zero `any` | PRD + spec | Discriminated unions mandatory; type guards over casting |
| Tailwind CSS | PRD | Utility-first; zero runtime overhead |
| Vite bundler | PRD | Fast HMR; route-level code splitting via React.lazy + Suspense |
| Mock API: setTimeout 2s, 10% failure | Assignment spec | All async state designed around slow, unreliable operations |
| @tanstack/react-virtual | PRD | Hooks-based, TypeScript-native virtualization |
| No real backend | Context | All "real-time" is simulated client-side; no WebSockets/SSE |
| Feature-based folder structure | PRD | `src/features/`, `src/shared/`, `src/api/`, `src/store/`, `src/types/` |

### Cross-Cutting Concerns Identified

1. **Concurrent async state** — Optimistic updates, real-time simulation, and undo/redo all mutate task state from independent sources simultaneously. They must share a consistent ground truth.

2. **Operation identity & rollback** — Every mutation needs a unique operation ID so out-of-order mock API responses roll back only their own operation, not a later one that succeeded.

3. **Undo/redo boundaries** — This is the highest-risk invariant: automatic rollbacks (API failure) and remote simulation updates must **never** push to the history stack. Only intentional user actions do.

4. **Virtualization stability** — Remote updates must use stable item keys and keyed diffing. Full list replacement resets scroll — unacceptable at 1000+ tasks.

5. **Performance-first rendering** — Filter/search derivations and task card rendering must be memoized everywhere. This shapes how state is partitioned and how Context is consumed.

6. **Toast coordination** — Concurrent async sources produce concurrent toasts. A single toast manager with queue/deduplication prevents visual chaos.

7. **Mobile/desktop bifurcation** — Drag-and-drop and status dropdown are equal paths for the same mutation. Mutation logic must be input-agnostic.

## Starter Template Evaluation

### Primary Technology Domain

Frontend SPA — React 18, TypeScript strict, Tailwind CSS, Vite. All mandated by the assignment spec; no discovery needed.

### Starter Options Considered

| Option | Notes | Verdict |
|---|---|---|
| `create-vite react-ts` | Babel-based, minimal | Good but SWC is faster |
| `create-vite react-swc-ts` | SWC (Rust) compiler, minimal | **Selected** — ~10x faster transforms, clean baseline |
| `create-t3-app` | Full-stack Next.js opinionated | Wrong domain — pure SPA |
| Custom from scratch | Full control | No additional signal for interview context |

### Selected Starter: `create-vite` with `react-swc-ts`

**Rationale:** PRD explicitly mandates Vite + React 18 + TypeScript. The `react-swc-ts` variant uses the Rust-based SWC compiler (~10x faster than Babel) — a small but visible signal of pragmatic craftsmanship. Minimal baseline, no opinionated abstractions forced onto the project.

**Initialization Commands:**

```bash
npm create vite@latest real-time-collaboration -- --template react-swc-ts
cd real-time-collaboration
npm install

# Tailwind v4 (vite plugin approach — no tailwind.config.js needed)
npm install tailwindcss @tailwindcss/vite

# Virtualization
npm install @tanstack/react-virtual

# dnd-kit (all three packages required)
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities

# Utilities
npm install nanoid sonner react-hook-form

# Dev dependencies
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
```

**`vite.config.ts` after setup:**

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
})
```

**`tsconfig.app.json` paths:**

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "paths": { "@/*": ["./src/*"] }
  }
}
```

**`src/index.css`:**

```css
@import "tailwindcss";
```

**`vitest.config.ts`:**

```typescript
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
  },
})
```

**`src/test-setup.ts`:**

```typescript
import '@testing-library/jest-dom'
```

### Architectural Decisions Provided by Starter

| Concern | Decision | Note |
|---|---|---|
| Language | TypeScript 5.x strict | `"strict": true`, `"noUncheckedIndexedAccess": true` in tsconfig |
| Compiler | SWC (Rust) | ~10x faster than Babel; no config needed |
| Bundler | Vite 8.x | Fast HMR; esbuild production minification; automatic code splitting |
| Styling | Tailwind v4 via `@tailwindcss/vite` | No `tailwind.config.js` for basic use |
| Testing | Vitest + React Testing Library | jsdom environment; co-located test files |
| Code structure | Flat `src/` by default | **Overridden** with PRD feature-based structure |
| ESLint | React hooks plugin pre-configured | Zero-warning target from NFR11 |

**Note:** Project initialization using this command should be the first implementation story.

## Core Architectural Decisions

### Decision Priority Analysis

**Critical (block implementation):**
- State machine shape and context split strategy
- Action taxonomy (what pushes to history, what doesn't)
- Undo/redo integration with board dispatch

**Important (shape architecture):**
- Drag-and-drop library, toast library, form management, testing
- Mock API structure

**Deferred (post-MVP):**
- AWS deployment, dark mode, service workers

---

### Frontend Architecture — State Machine Design

#### Context Split Strategy

_Reference: `docs/article-notes.md` — developerway.com performant Context patterns_

Split by update frequency and consumer set. Never one big context:

```
AppProvider
├── BoardStateContext    — tasks[] only (hot path — read by columns)
├── PendingOpsContext    — Map<opId, PendingOperation> (read by loading indicators only)
├── ConflictContext      — ConflictState | null (read by conflict modal only)
├── BoardAPIContext      — stable memoized action creators (useMemo, [] deps — NEVER re-renders consumers)
├── FilterContext        — { assignee, priority, searchQuery }
├── FilterAPIContext     — stable { setFilter, setSearch } (useMemo, [] deps)
└── HistoryContext       — { undoLabel, redoLabel, canUndo, canRedo } (read-only, thin)
```

**CRITICAL — pass slice references directly, never wrapped in objects:**

```typescript
// ❌ Wrong — new object on every dispatch defeats the entire split
<BoardStateContext.Provider value={{ tasks: boardState.tasks }}>

// ✅ Correct — React diffs the slice reference directly via Object.is
const BoardStateContext = createContext<Task[]>([])
<BoardStateContext.Provider value={boardState.tasks}>
```

When `OP_SUCCESS` fires, the reducer returns `{ ...state, pendingOps: newMap }`. Because `tasks` is not touched, `boardState.tasks` keeps the same array reference → `BoardStateContext` value is unchanged → task consumers do not re-render. This only works if the value IS the slice, not an object wrapping it.

**Why this split matters:**
- Separating `PendingOpsContext` from `BoardStateContext`: a pending op completing does NOT re-render columns or task cards — only loading indicators
- Separating `ConflictContext`: conflict detection/resolution does not touch the task list render path
- Stable API contexts via `useMemo([], [])`: action creator consumers never re-render due to state changes

**Custom hooks per consumer domain:**

```typescript
useTasks()      // BoardStateContext — re-renders on task changes
useBoardAPI()   // BoardAPIContext  — NEVER re-renders (stable)
usePendingOps() // PendingOpsContext — re-renders on op changes only
useConflict()   // ConflictContext  — re-renders on conflict only
useFilters()    // FilterContext    — re-renders on filter changes only
useFilterAPI()  // FilterAPIContext — NEVER re-renders (stable)
useHistory()    // HistoryContext   — re-renders on undo/redo label change
```

#### Single Reducer — Atomic Writes, Split Reads

One `boardReducer` manages all three board domains as a single atomic state. `AppProvider` unpacks into separate read contexts:

```typescript
// AppProvider.tsx
const [boardState, boardDispatch] = useReducer(boardReducer, initialBoardState)

return (
  <BoardStateContext.Provider value={boardState.tasks}>
    <PendingOpsContext.Provider value={boardState.pendingOps}>
      <ConflictContext.Provider value={boardState.conflict}>
        <BoardAPIContext.Provider value={api}>
          <FilterProvider>
            <FilterAPIProvider>
              <HistoryProvider>
                {children}
              </HistoryProvider>
            </FilterAPIProvider>
          </FilterProvider>
        </BoardAPIContext.Provider>
      </ConflictContext.Provider>
    </PendingOpsContext.Provider>
  </BoardStateContext.Provider>
)
```

Rationale: an optimistic update that simultaneously changes `tasks[]` AND records a `pendingOp` must be atomic — one reducer case handles both in a single state transition.

#### State Shape

```typescript
// boardReducer manages this single state object
type BoardState = {
  tasks: Task[];
  pendingOps: Map<string, PendingOperation>;
  conflict: ConflictState | null;
}

type PendingOperation = {
  id: string;
  taskId: string;
  snapshot: Task;  // task state BEFORE this op — used for rollback
}

type ConflictState = {
  local: Task;
  remote: Task;
}

// FilterContext (separate reducer)
type FilterState = {
  assignee: string | null;
  priority: Priority | null;
  searchQuery: string;
}

// HistoryContext (read-only view — managed by useHistory hook)
type HistoryViewState = {
  undoLabel: string | null;   // e.g. "Undo: Move 'Auth task' to Done"
  redoLabel: string | null;
  canUndo: boolean;
  canRedo: boolean;
}
```

#### Stable API Context Pattern

```typescript
// BoardAPIContext — stable for provider lifetime, zero consumer re-renders
const api = useMemo(() => ({
  moveTask:   (taskId: string, newStatus: TaskStatus) =>
                dispatch({ type: 'TASK_MOVE', taskId, newStatus, opId: nanoid() }),
  createTask: (task: Omit<Task, 'id'>) =>
                dispatch({ type: 'TASK_CREATE', task: { ...task, id: nanoid() }, opId: nanoid() }),
  updateTask: (taskId: string, changes: Partial<Task>) =>
                dispatch({ type: 'TASK_UPDATE', taskId, changes, opId: nanoid() }),
  deleteTask: (taskId: string) =>
                dispatch({ type: 'TASK_DELETE', taskId, opId: nanoid() }),
}), []) // empty deps — dispatch from useReducer is stable
```

#### Action Taxonomy — The Critical Invariant

```typescript
type BoardAction =
  // USER ACTIONS — pushed to history stack by useHistory hook
  | { type: 'TASK_MOVE';   taskId: string; newStatus: TaskStatus; opId: string }
  | { type: 'TASK_CREATE'; task: Task;                             opId: string }
  | { type: 'TASK_UPDATE'; taskId: string; changes: Partial<Task>; opId: string }
  | { type: 'TASK_DELETE'; taskId: string;                         opId: string }

  // SYSTEM ACTIONS — NEVER pushed to history
  | { type: 'OP_SUCCESS';             opId: string }
  | { type: 'OP_ROLLBACK';            opId: string }  // restores snapshot; transparent to undo/redo
  | { type: 'REMOTE_UPDATE';          task: Task }
  | { type: 'CONFLICT_DETECTED';      local: Task; remote: Task }
  | { type: 'CONFLICT_RESOLVE_MINE' }
  | { type: 'CONFLICT_RESOLVE_THEIRS' }

  // UNDO/REDO — dispatched by useHistory only; never re-push to history
  | { type: 'HISTORY_APPLY'; action: UserAction }
```

#### Undo/Redo Integration

The `useHistory` hook owns the command stack and wraps `boardAPI`:

```typescript
type HistoryEntry = {
  id: string;
  label: string;         // "Move 'Auth task' to Done"
  forward: UserAction;   // what was done — for redo
  inverse: UserAction;   // how to undo it — captured at dispatch time
}

// Usage in components:
const { dispatch, undo, redo } = useHistory(boardAPI)
// dispatch() → applies action + pushes {forward, inverse, label} to stack
// undo()     → moves cursor back, dispatches HISTORY_APPLY(inverse)
// redo()     → moves cursor forward, dispatches HISTORY_APPLY(forward)
```

**OP_ROLLBACK invariant in reducer:**

```typescript
case 'OP_ROLLBACK': {
  // Restores snapshot — history stack is UNTOUCHED
  // Rollback is transparent to the undo/redo system
}
```

#### Performance Invariants

1. Every `TaskCard` is `React.memo`'d — re-renders only when its own `task` prop changes
2. Column task lists derived with `useMemo` — keyed on `tasks` + active filters
3. API context consumers never re-render — `useMemo` with empty deps
4. `PendingOpsContext` change does not cascade to column or task card re-renders
5. `ConflictContext` change does not touch the task list render path
6. `Map<opId, op>` for pending ops — O(1) rollback lookup

---

### Data Architecture

No database. All state lives in React. Single source of truth:

| Data | Context | Reason |
|---|---|---|
| Task list | `BoardStateContext` (via boardReducer) | Mutated by all four action sources |
| Pending ops | `PendingOpsContext` (via boardReducer) | Decoupled to avoid cascading re-renders |
| Conflict state | `ConflictContext` (via boardReducer) | Only conflict modal subscribes |
| Filter/search | `FilterContext` | Decoupled so filter change ≠ task re-render |
| History stack | `useHistory` hook (internal) | Exposed read-only via `HistoryContext` |

---

### API & Communication — Mock Layer

```typescript
// src/api/mock-client.ts
async function mockRequest<T>(
  fn: () => T,
  opts = { delay: 2000, failureRate: 0.1 }
): Promise<T> {
  await sleep(opts.delay)
  if (Math.random() < opts.failureRate) throw new MockApiError('Simulated failure')
  return fn()
}
```

All API functions (`createTask`, `updateTask`, `deleteTask`, `moveTask`) call through this single utility. One place for delay and failure rate configuration.

---

### Library Decisions

| Concern | Choice | Rationale |
|---|---|---|
| Drag-and-drop | `@dnd-kit/core` + `@dnd-kit/sortable` + `@dnd-kit/utilities` | React 18 native, accessible, TypeScript-first; `react-beautiful-dnd` deprecated 2024 |
| Toast | Sonner | React 18 native, Tailwind-compatible, queued by default — handles concurrent toasts |
| Forms | React Hook Form | Uncontrolled inputs = zero re-renders per keystroke; justified at 6+ fields |
| Testing | Vitest + React Testing Library | Zero extra config on Vite; reducers and useHistory are pure — unit-testable without rendering |

---

### Infrastructure & Deployment

- **Local dev:** Vite dev server (built-in)
- **AWS (deferred to Phase 3):** S3 + CloudFront (static), API Gateway + Lambda (if real API requested by interviewer)
- **CI/CD:** Not in scope for MVP

## Implementation Patterns & Consistency Rules

**Critical conflict points identified:** 7 areas where agents could diverge and break each other's code.

### Naming Patterns

#### Files & Directories

```
# Components — PascalCase.tsx
TaskCard.tsx           ✅
task-card.tsx          ❌

# Hooks — camelCase with use prefix
useHistory.ts          ✅
use-history.ts         ❌

# Contexts — PascalCase + Context suffix
BoardStateContext.ts   ✅
boardStateContext.ts   ❌

# Test files — co-located, *.test.tsx
TaskCard.test.tsx      ✅  (same folder as component)
__tests__/TaskCard.tsx ❌  (separate folder — don't do this)
```

#### Action Types — SCREAMING_SNAKE_CASE, NOUN_VERB order

```typescript
'TASK_MOVE'           ✅
'TASK_CREATE'         ✅
'OP_ROLLBACK'         ✅
'CONFLICT_DETECTED'   ✅
'moveTask'            ❌  (camelCase — conflicts with function names)
'task/move'           ❌  (Redux-style slice — not used here)
```

#### TypeScript Naming

```typescript
// Types & interfaces — PascalCase
type Task = { ... }
type BoardAction = { ... }

// Union values — lowercase strings (readable in logs/devtools)
type TaskStatus = 'todo' | 'in-progress' | 'done'
type Priority   = 'low' | 'medium' | 'high'
```

### Structure Patterns

#### Feature Folder Shape

```
src/features/tasks/
  components/
    TaskCard.tsx
    TaskCard.test.tsx      ← co-located test
    TaskModal.tsx
  hooks/
    useTaskModal.ts
  types.ts
  utils.ts

src/features/board/
  components/
    BoardColumn.tsx
    KanbanBoard.tsx
  hooks/
    useBoardDnd.ts

src/features/history/
  hooks/
    useHistory.ts
  types.ts

src/store/                 ← all Context + Reducer files
  BoardStateContext.tsx
  PendingOpsContext.tsx
  ConflictContext.tsx
  BoardAPIContext.tsx
  FilterContext.tsx
  FilterAPIContext.tsx
  HistoryContext.tsx
  AppProvider.tsx

src/api/
  mock-client.ts           ← mockRequest<T> utility
  tasks.ts
  types.ts

src/shared/
  components/
    ErrorBoundary.tsx
  hooks/
    useKeyboardShortcut.ts
  utils/
    sleep.ts
```

#### No barrel `index.ts` files

```typescript
// ❌ Don't do this
export * from './components/TaskCard'

// ✅ Import directly
import { TaskCard } from '@/features/tasks/components/TaskCard'
```

### Format Patterns

#### Async State — Discriminated Union (enforced everywhere)

```typescript
// ✅ Correct
type AsyncState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: string }

// ❌ Wrong — ambiguous combinations possible
type AsyncState<T> = { loading: boolean; data: T | null; error: string | null }
```

#### IDs, Dates, Errors

```typescript
// IDs — nanoid() strings only
const id: string = nanoid()         // ✅
const id: number = Date.now()       // ❌

// Dates — ISO 8601 strings
createdAt: new Date().toISOString() // ✅
createdAt: Date.now()               // ❌

// Mock API errors — typed class
class MockApiError extends Error {
  constructor(message = 'Simulated API failure') {
    super(message); this.name = 'MockApiError'
  }
}
```

### State Management Patterns

#### Reducer — always return full state spread

```typescript
// ✅
case 'TASK_MOVE': {
  return {
    ...state,
    tasks: state.tasks.map(t =>
      t.id === action.taskId ? { ...t, status: action.newStatus } : t
    ),
  }
}
// ❌ Never mutate state directly
```

#### Context consumption — always via custom hook

```typescript
const tasks = useTasks()     // ✅
const api   = useBoardAPI()  // ✅
const tasks = useContext(BoardStateContext)  // ❌
```

#### Optimistic update sequence (every mutation follows this exactly)

```
1. opId = nanoid()
2. Record snapshot in pendingOps: { taskId, snapshot: currentTask }
3. Apply change to tasks[] immediately (optimistic)
4. Call mockRequest() in background
5a. On success → dispatch OP_SUCCESS(opId) → remove from pendingOps
5b. On failure → dispatch OP_ROLLBACK(opId) → restore snapshot → toast.error(...)
```

### Process Patterns

#### Error Boundaries — feature-level

```
AppRoot
└── ErrorBoundary (app-level)
    └── BoardFeature
        └── ErrorBoundary (board-level — catches board render failures)
```

#### Loading State — per-task via PendingOpsContext, not global

```typescript
// ✅
const pendingOps = usePendingOps()
const isPending = [...pendingOps.values()].some(op => op.taskId === task.id)
// ❌ No global isLoading flag
```

#### Toast vocabulary — four types, consistent messages

```typescript
toast.error(`Update failed — "${task.title}" has been reverted`)      // rollback
toast.info(`"${task.title}" was updated by another user`)              // remote update
toast.warning(`Conflict on "${task.title}" — choose which to keep`)   // conflict
// Undo confirmation — hint bar only, never a toast
```

### Enforcement

**All agents MUST:**
- Use custom hooks (`useTasks`, `useBoardAPI`, etc.) — never raw `useContext`
- Discriminated union for every async state — never `loading: boolean + data + error`
- Action types in `SCREAMING_SNAKE_CASE` with `NOUN_VERB` order
- Co-locate tests with components (`ComponentName.test.tsx`)
- `string` IDs via `nanoid()` — never number IDs
- ISO 8601 for all dates — never `Date` objects or timestamps
- Follow optimistic update sequence exactly as defined

**Anti-patterns that break the architecture:**
- Importing `dispatch` directly — use `useBoardAPI()`
- Pushing `OP_ROLLBACK` or `REMOTE_UPDATE` to the history stack
- Adding state to `BoardStateContext` that belongs in `PendingOpsContext` or `ConflictContext`
- Barrel `index.ts` exports in feature folders
- Wrapping context values in objects: `value={{ tasks }}` instead of `value={tasks}`

## Project Structure & Boundaries

### Complete Project Directory Structure

```
real-time-collaboration/
├── README.md
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tsconfig.app.json
├── eslint.config.js
├── vitest.config.ts
├── index.html
├── .gitignore
│
├── public/
│   └── favicon.ico
│
└── src/
    ├── main.tsx                       ← entry: renders <AppProvider><App />
    ├── App.tsx                        ← root layout, top-level error boundary
    ├── index.css                      ← @import "tailwindcss"
    ├── test-setup.ts                  ← import '@testing-library/jest-dom'
    │
    ├── types/
    │   ├── task.types.ts              ← Task, TaskStatus, Priority, Tag
    │   └── common.types.ts            ← AsyncState<T>, ID (= string)
    │
    ├── api/
    │   ├── mock-client.ts             ← mockRequest<T>, sleep, MockApiError
    │   ├── tasks.ts                   ← createTask, updateTask, deleteTask, moveTask
    │   └── types.ts                   ← API request/response shapes
    │
    ├── store/
    │   ├── AppProvider.tsx            ← composes all providers in correct order
    │   ├── BoardStateContext.tsx      ← createContext<Task[]>([])
    │   ├── PendingOpsContext.tsx      ← createContext<Map<string, PendingOperation>>
    │   ├── ConflictContext.tsx        ← createContext<ConflictState | null>(null)
    │   ├── BoardAPIContext.tsx        ← stable memoized action creators (useMemo [])
    │   ├── boardReducer.ts            ← single reducer: { tasks, pendingOps, conflict }
    │   ├── FilterContext.tsx          ← FilterState + filterReducer
    │   ├── FilterAPIContext.tsx       ← stable setFilter, setSearch (useMemo [])
    │   └── HistoryContext.tsx         ← read-only { undoLabel, redoLabel, canUndo, canRedo }
    │
    ├── features/
    │   ├── board/                     ← FR5, FR12–FR14, FR34–FR36
    │   │   ├── components/
    │   │   │   ├── KanbanBoard.tsx
    │   │   │   ├── KanbanBoard.test.tsx
    │   │   │   ├── BoardColumn.tsx    ← single column + @tanstack/react-virtual list
    │   │   │   └── BoardColumn.test.tsx
    │   │   └── hooks/
    │   │       └── useBoardDnd.ts     ← @dnd-kit/core sensors, drag handlers
    │   │
    │   ├── tasks/                     ← FR1–FR6, FR15–FR21
    │   │   ├── components/
    │   │   │   ├── TaskCard.tsx       ← React.memo'd, pending indicator
    │   │   │   ├── TaskCard.test.tsx
    │   │   │   ├── TaskModal.tsx      ← create/edit modal, React Hook Form
    │   │   │   └── TaskModal.test.tsx
    │   │   ├── hooks/
    │   │   │   └── useTaskModal.ts
    │   │   └── utils.ts
    │   │
    │   ├── filters/                   ← FR7–FR11
    │   │   ├── components/
    │   │   │   ├── FilterBar.tsx
    │   │   │   └── FilterBar.test.tsx
    │   │   └── utils/
    │   │       ├── filterTasks.ts     ← pure filter fn: (tasks, FilterState) → Task[]
    │   │       └── filterTasks.test.ts
    │   │
    │   ├── history/                   ← FR27–FR33
    │   │   ├── components/
    │   │   │   ├── UndoHintBar.tsx    ← "Undo: Move 'Auth task' to Done"
    │   │   │   └── UndoHintBar.test.tsx
    │   │   ├── hooks/
    │   │   │   ├── useHistory.ts      ← command stack, undo/redo, 50-entry cap
    │   │   │   └── useHistory.test.ts ← pure unit tests, no rendering needed
    │   │   └── types.ts               ← HistoryEntry, UserAction
    │   │
    │   └── realtime/                  ← FR22–FR26
    │       ├── components/
    │       │   ├── ConflictModal.tsx
    │       │   └── ConflictModal.test.tsx
    │       └── hooks/
    │           └── useRealtimeSimulation.ts  ← 10–15s interval, random task updates
    │
    └── shared/
        ├── components/
        │   ├── ErrorBoundary.tsx
        │   ├── ErrorBoundary.test.tsx
        │   └── ToastProvider.tsx      ← Sonner <Toaster> config
        ├── hooks/
        │   ├── useKeyboardShortcut.ts ← Ctrl/Cmd+Z, Ctrl/Cmd+Shift+Z
        │   └── useKeyboardShortcut.test.ts
        └── utils/
            ├── sleep.ts
            └── mockData.ts            ← 25 seed tasks
```

### FR Category → Directory Mapping

| FR Category | FRs | Primary Location |
|---|---|---|
| Task CRUD & Display | FR1–FR6 | `src/features/tasks/` |
| Filtering & Search | FR7–FR11 | `src/features/filters/` |
| Task Movement | FR12–FR14 | `src/features/board/`, `src/features/tasks/` |
| Optimistic Updates & Errors | FR15–FR21 | `src/store/`, `src/api/` |
| Real-Time Simulation | FR22–FR26 | `src/features/realtime/` |
| History / Undo-Redo | FR27–FR33 | `src/features/history/` |
| Performance & Virtualization | FR34–FR36 | `src/features/board/components/BoardColumn.tsx` |
| Responsive & Accessible UI | FR37–FR40 | All components (Tailwind breakpoints + ARIA) |

### Architectural Boundaries

#### Mutation Entry Point — `BoardAPIContext` is the only gate

```
Component / hook
  → useBoardAPI()
  → BoardAPIContext action creator
  → boardReducer (optimistic update)
  → src/api/tasks.ts
  → mockRequest<T>                    ← only place with delay + failure logic
```

No component calls `src/api/tasks.ts` or `mockRequest` directly.

#### Simulation bypasses `useHistory` intentionally

```
useRealtimeSimulation
  → dispatch(REMOTE_UPDATE)           ← directly to boardReducer
  → NOT through useHistory            ← remote updates must not enter history stack
  → may dispatch(CONFLICT_DETECTED)   → ConflictContext updated → ConflictModal shown
```

#### Undo/Redo wraps `BoardAPIContext`, not raw dispatch

```
useKeyboardShortcut → useHistory.undo()
  → HISTORY_APPLY(inverse) dispatched
  → boardReducer applies inverse
  → HistoryContext view state updated
```

### Data Flow

```
User action (drag / click / form submit)
  → useBoardDnd / useTaskModal / TaskModal
  → useHistory.dispatch(action)       ← records to command stack
  → BoardAPIContext action creator
  → boardReducer: optimistic update applied immediately
  → pendingOps: op snapshot recorded
  → mockRequest() resolves after ~2s
    → success: OP_SUCCESS → pendingOps cleared
    → failure: OP_ROLLBACK → snapshot restored + toast.error()

Simulation tick (every 10–15s)
  → useRealtimeSimulation selects random task
  → REMOTE_UPDATE dispatched
  → boardReducer merges or detects conflict
  → if conflict → CONFLICT_DETECTED → ConflictModal
  → user resolves → CONFLICT_RESOLVE_MINE or CONFLICT_RESOLVE_THEIRS

Keyboard shortcut (Ctrl/Cmd+Z)
  → useKeyboardShortcut fires
  → useHistory.undo()
  → HISTORY_APPLY(inverse) dispatched
  → boardReducer applies inverse action
  → HistoryContext: undoLabel, canUndo updated
```

## Architecture Validation Results

### Coherence Validation ✅

**Decision Compatibility:** All stack choices verified compatible — React 18, TypeScript 5.x strict, Tailwind v4, Vite 8, SWC, @dnd-kit, @tanstack/react-virtual, Sonner, React Hook Form, Vitest + RTL, nanoid. No version conflicts.

**Pattern Consistency:** Context split strategy ↔ stable API pattern ↔ custom hook access → consistent. Action taxonomy ↔ discriminated union state → consistent. Feature-folder structure ↔ co-located tests ↔ no barrel exports → consistent. Optimistic sequence ↔ PendingOpsContext ↔ OP_ROLLBACK → consistent.

**Structure Alignment:** Feature folders map 1:1 to FR categories. `src/store/` centralises all Context files. `src/api/` is the only path to mockRequest. Tests co-located with every component.

### Requirements Coverage Validation ✅

All 40 FRs and 17 NFRs architecturally covered.

| NFR | Mechanism |
|---|---|
| NFR3 (60fps / 1000+ tasks) | @tanstack/react-virtual + React.memo + memoized column selectors |
| NFR4 (<50ms filter) | Pure `filterTasks()` in `useMemo` — client-side, zero I/O |
| NFR5 (≤16ms optimistic) | Synchronous reducer update fires before `mockRequest()` is called |
| NFR6 (no scroll reset) | Stable task IDs + keyed diffing — virtual list never replaced wholesale |

### Gap Analysis & Resolutions

#### Gap 1 — Single reducer, split read contexts ✅ Resolved

One `boardReducer` manages `{ tasks, pendingOps, conflict }` as atomic state. `AppProvider` unpacks into three separate read contexts. `BoardAPIContext` wraps the single `boardDispatch`. Rationale: an optimistic update that simultaneously changes `tasks[]` AND records a `pendingOp` must be atomic — one reducer case handles both in a single state transition.

#### Gap 2 — Three missing config items ✅ Resolved

| Item | Resolution |
|---|---|
| Vite path alias `@/` | `resolve.alias: { '@': '/src' }` in `vite.config.ts` + `"paths": { "@/*": ["./src/*"] }` in `tsconfig.app.json` |
| Vitest jsdom environment | `environment: 'jsdom'`, `setupFiles: ['./src/test-setup.ts']`, import `@testing-library/jest-dom` |
| dnd-kit full package set | Install `@dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities` together |

#### Gap 3 — Provider nesting order ✅ Resolved

```
BoardState/PendingOps/Conflict (single boardReducer, split read contexts)
  └── BoardAPIProvider       (wraps boardDispatch — stable)
      └── FilterProvider     (filterDispatch available)
          └── FilterAPIProvider  (wraps filterDispatch — stable)
              └── HistoryProvider  (reads BoardAPIContext)
                  └── {children}
```

### Architecture Completeness Checklist

- [x] Project context thoroughly analysed (40 FRs, 17 NFRs, 7 cross-cutting concerns)
- [x] Scale and complexity assessed (Medium-High)
- [x] Technical constraints identified and locked
- [x] Starter template selected with verified version (Vite 8, `react-swc-ts`)
- [x] State machine designed (single boardReducer, split read contexts, stable API contexts)
- [x] Action taxonomy defined (user / system / undo/redo distinction enforced)
- [x] Undo/redo integration specified (command pattern, useHistory hook)
- [x] Library decisions made with rationale
- [x] Mock API layer designed (centralised `mockRequest<T>`)
- [x] Naming conventions established (files, actions, types, dates, IDs)
- [x] Complete file tree defined (every file named to FR level)
- [x] Architectural boundaries documented
- [x] Data flow documented (three paths: user action, simulation, keyboard shortcut)
- [x] Performance invariants specified (React.memo, useMemo, context slice references)
- [x] All gaps identified and resolved

### Architecture Readiness Assessment

**Overall Status: READY FOR IMPLEMENTATION**

**Confidence: High**

**Key strengths:**
- Undo/redo + optimistic rollback invariant designed upfront — highest-risk item is architecturally solved
- Seven-context split with stable API contexts eliminates re-render problem at 1000+ tasks
- Single `boardReducer` ensures atomic transitions across tasks / pendingOps / conflict
- Context values passed as direct slice references — `Object.is` diffing works correctly
- Every FR maps to a specific file — no ambiguity for implementing agents

**Phase 2 extension points:**
- Option B (query builder): `src/features/filters/` extended with compound filter logic
- Option C (conflict resolution): `src/features/realtime/` + `ConflictContext` already scaffolded

### Implementation Handoff

**First story:** `npm create vite@latest real-time-collaboration -- --template react-swc-ts`, install all dependencies, configure path alias, configure Vitest with jsdom.

**Agent prime directive:** `BoardAPIContext` is the only mutation entry point. `useHistory` is the only wrapper for user-initiated mutations. `OP_ROLLBACK` and `REMOTE_UPDATE` never touch the history stack. Context values are slice references, never object wrappers.
