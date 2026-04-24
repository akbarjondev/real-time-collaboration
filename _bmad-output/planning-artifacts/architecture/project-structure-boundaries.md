# Project Structure & Boundaries

## Complete Project Directory Structure

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

## FR Category → Directory Mapping

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

## Architectural Boundaries

### Mutation Entry Point — `BoardAPIContext` is the only gate

```
Component / hook
  → useBoardAPI()
  → BoardAPIContext action creator
  → boardReducer (optimistic update)
  → src/api/tasks.ts
  → mockRequest<T>                    ← only place with delay + failure logic
```

No component calls `src/api/tasks.ts` or `mockRequest` directly.

### Simulation bypasses `useHistory` intentionally

```
useRealtimeSimulation
  → dispatch(REMOTE_UPDATE)           ← directly to boardReducer
  → NOT through useHistory            ← remote updates must not enter history stack
  → may dispatch(CONFLICT_DETECTED)   → ConflictContext updated → ConflictModal shown
```

### Undo/Redo wraps `BoardAPIContext`, not raw dispatch

```
useKeyboardShortcut → useHistory.undo()
  → HISTORY_APPLY(inverse) dispatched
  → boardReducer applies inverse
  → HistoryContext view state updated
```

## Data Flow

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
