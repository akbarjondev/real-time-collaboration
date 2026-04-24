# Copilot Instructions — real-time-collaboration

## Commands

```bash
npm run dev          # Vite dev server
npm run build        # tsc -b && vite build
npm run lint         # ESLint (zero warnings expected)
npm test             # Vitest watch mode
npx vitest run       # Vitest single run (no watch)
npx vitest run src/store/boardReducer.test.ts  # Run a single test file
```

## Architecture

React 19 + TypeScript kanban board with simulated real-time collaboration, optimistic updates, conflict resolution, and undo/redo. **No backend** — all network calls go through `src/api/mock-client.ts`.

### State: Single Reducer → 7 Split Contexts

One `boardReducer` (`src/store/boardReducer.ts`) owns all board state (`tasks`, `pendingOps`, `conflict`). `AppProvider` unpacks it into **7 separate read contexts** to minimize re-renders.

**Fixed provider nesting order** (`src/store/AppProvider.tsx`):
```
BoardDispatch → BoardState → PendingOps → Conflict → BoardAPI → Filter → FilterAPI → History → children
```

Always consume contexts via custom hooks — never raw `useContext()`:
- `useTasks()`, `usePendingOps()`, `useConflict()`
- `useBoardAPI()` — the **only** mutation entry point; never call `src/api/tasks.ts` directly from a component
- `useFilterState()`, `useFilterAPI()`
- `useHistory()` — wraps **all** user-initiated mutations (TASK_MOVE, TASK_CREATE, TASK_UPDATE, TASK_DELETE) for undo/redo

### Mutation Flow

```
User action → useBoardAPI action creator
  → useHistory (wraps TASK_* actions → records inverse for undo)
    → boardDispatch

useRealtimeSimulation → dispatches REMOTE_UPDATE directly (intentionally bypasses useHistory)
```

**System actions** (`OP_SUCCESS`, `OP_ROLLBACK`, `REMOTE_UPDATE`, `CONFLICT_*`, `HISTORY_APPLY`) must **never** appear in the history stack.

### Optimistic Update Sequence

```ts
const opId = nanoid()          // capture BEFORE any async call
dispatch({ type: 'TASK_MOVE', taskId, newStatus, opId })  // optimistic
try {
  await moveTask(taskId, newStatus)
  dispatch({ type: 'OP_SUCCESS', opId })
} catch {
  dispatch({ type: 'OP_ROLLBACK', opId })  // restores snapshot; history untouched
}
```

Capture task title / toast data **before** calling `onClose()` — the task ref may be gone by the time the API rejects.

### Feature / Folder Structure

```
src/
  features/{board,tasks,filters,history,realtime}/
    components/    # UI only
    hooks/         # stateful logic extracted from components
  store/           # contexts, reducer, AppProvider
  api/             # mock API (tasks.ts calls mock-client.ts)
  shared/          # cross-feature utils, hooks, UI primitives
  types/           # shared type definitions
  components/ui/   # shadcn copy-owned components (editable)
```

No cross-feature imports — features only import from `src/shared/`, `src/store/`, `src/api/`, `src/types/`.

## Key Conventions

### TypeScript (strict mode)
- Zero `any` — use `unknown` + type guards
- `array[0]` is `T | undefined` (`noUncheckedIndexedAccess`) — use `.find()` or an index guard
- No `const enum` or namespace-style enums (`erasableSyntaxOnly`) — use `as const` objects or string union types
- Async state as discriminated unions: `{ status: 'idle' | 'loading' } | { status: 'success'; data: T } | { status: 'error'; error: string }` — never parallel `loading`/`data`/`error` flags
- IDs: `nanoid()` only — never `Math.random()` or `Date.now()`
- Dates: `new Date().toISOString()` strings — never `Date` objects in state
- `import type` for type-only imports (`verbatimModuleSyntax` enabled)
- Dev checks: `import.meta.env.DEV` — never `process.env.NODE_ENV`
- Path alias `@/` maps to `./src/`

### Exports & Modules
- Named exports for all components and hooks; default export only for `App.tsx`
- No barrel `index.ts` files — always import by direct file path

### Context Values
- Pass the **direct slice** as value: `value={boardState.tasks}` — NOT `value={{ tasks: boardState.tasks }}` (object wrapper breaks `Object.is` diffing, causes all consumers to re-render)
- `BoardAPIContext` action creators in `useMemo([], [])` — stable forever, never cause re-renders
- `BoardAPIContext` default is `null`; its hook throws if used outside provider — no silent no-op default

### Reducer Rules
- Never mutate — always spread: `{ ...state, tasks: [...state.tasks] }`
- Always return full state: `{ ...state, field }` — not `{ field }`
- `Map` must be reconstructed: `new Map(state.pendingOps)` then `.set()`/`.delete()` — never mutate in place

### DnD Kit
- `PointerSensor` must have `activationConstraint: { distance: 8 }` — without it, mousedown starts drag and click-to-open-modal breaks
- `useSortable` must be called unconditionally in every card (hooks cannot be conditional)
- Do NOT pass `onOpen` to `DragOverlay` cards — overlay cards must not be interactive

### Styling
- Tailwind v4 CSS-only: `@import "tailwindcss"` in `src/index.css`; **no `tailwind.config.js`**
- `cn()` helper (clsx + tailwind-merge) for all conditional classNames
- CVA (`class-variance-authority`) for components with multiple visual variants
- Never `focus:outline-none` without a `focus-visible:ring-2 focus-visible:ring-violet-500` replacement
- Font: Geist Variable (`@fontsource-variable/geist`) — not Inter

### Testing
- Test files co-located with their subject: `TaskCard.test.tsx` next to `TaskCard.tsx` — never in `__tests__/` folders
- Naming: `ComponentName.test.tsx`, `hookName.test.ts`, `reducerName.test.ts`
- `globals: true` in vitest config — no need to import `describe`/`it`/`expect`
- Separate `vitest.config.ts` (not reused from `vite.config.ts`) — both must configure the `@/` path alias
- No snapshot tests — test behavior only
- Context-dependent components: inject context via test wrappers using the exported context object
- Do not mock `src/api/tasks.ts` in integration tests — mock at the `mockRequest` level or test optimistic behavior via dispatched actions

### Accessibility
- Every interactive element needs `aria-label` or `aria-labelledby` — no icon-only buttons without labels
- In-flight task cards: `aria-busy="true"` on the `<article>` element
- Error toasts: `aria-live="assertive"`; info/success toasts and UndoHintBar: `aria-live="polite"`
- Modal open → focus title field; modal close → restore focus to trigger via `triggerRef`
- Touch targets minimum 44×44px
- No `dangerouslySetInnerHTML` anywhere
