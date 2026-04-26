---
project_name: 'real-time-collaboration'
user_name: 'Ali'
date: '2026-04-24'
sections_completed: ['technology_stack', 'language_rules', 'framework_rules', 'testing_rules', 'quality_rules', 'anti_patterns']
status: 'complete'
rule_count: 52
optimized_for_llm: true
---

# Project Context for AI Agents

_This file contains critical rules and patterns that AI agents must follow when implementing code in this project. Focus on unobvious details that agents might otherwise miss._

---

## Technology Stack & Versions

- React ^19.2.5 (React 19 — NOT React 18; some APIs differ)
- TypeScript ~6.0.2 strict mode
- Tailwind CSS ^4.2.4 (v4 — CSS-only setup, no tailwind.config.js)
- Vite ^8.0.10 + @vitejs/plugin-react ^6.0.1 (Babel compiler)
- @dnd-kit/core ^6.3.1 + @dnd-kit/sortable ^10.0.0 + @dnd-kit/utilities ^3.2.2
- @tanstack/react-virtual ^3.13.24
- Sonner ^2.0.7 (toasts)
- React Hook Form ^7.73.1
- nanoid ^5.1.9
- shadcn ^4.4.0 (new CLI package — not legacy `shadcn/ui`)
- @base-ui/react ^1.4.1 (Radix UI successor — used for accessible primitives)
- lucide-react ^1.9.0
- Geist Variable font via @fontsource-variable/geist ^5.2.8 (NOT Inter)
- clsx ^2.1.1 + tailwind-merge ^3.5.0 + class-variance-authority ^0.7.1 (class utilities)
- tw-animate-css ^1.4.0
- Vitest ^4.1.5 + jsdom ^29.0.2 + @testing-library/react ^16.3.2

## Critical Implementation Rules

### Language-Specific Rules

- TypeScript ~6.0.2: `strict`, `noUncheckedIndexedAccess`, `noUnusedLocals`, `noUnusedParameters`, `erasableSyntaxOnly`, `noFallthroughCasesInSwitch` all enabled
- Zero `any` — use `unknown` + type guards instead
- `array[0]` is `T | undefined` due to `noUncheckedIndexedAccess` — use `.find()` or index guard
- `erasableSyntaxOnly` means no `const enum` or namespace-style enums — use `as const` objects or union string types
- All async state as discriminated unions: `{ status: 'idle' | 'loading' } | { status: 'success'; data: T } | { status: 'error'; error: string }` — never `loading: boolean + data + error` flags
- All IDs: `nanoid()` string, never `Math.random()` or `Date.now()`
- All dates: `new Date().toISOString()` string, never `Date` objects in state
- Import/export: named exports only for components and hooks; default exports only for `App.tsx` and route-level pages
- No barrel `index.ts` files in any feature or shared folder — import directly by file path
- `import.meta.env.DEV` for dev checks — never `process.env.NODE_ENV`
- Path alias `@/` maps to `./src/` — always use for cross-folder imports
- `verbatimModuleSyntax` enabled — use `import type` for type-only imports

### Framework-Specific Rules

**React 19**
- Hooks-only functional components; no class components (except ErrorBoundary — required by React)
- `useReducer` for complex state machines; `useState` for local UI state; Context only for genuinely global state
- `React.memo` on every TaskCard and leaf list component; profile before adding elsewhere
- `useMemo` for expensive derivations (column task lists keyed on `[tasks, filters]`); `useCallback` only for stable callbacks passed to memoized children
- Always clean up `useEffect` (return cleanup function); never return JSX from a hook
- `React.lazy` + `Suspense` for route-level code splitting
- ErrorBoundary must be a class component with `getDerivedStateFromError` + `componentDidCatch`; use `import.meta.env.DEV` in fallback; `role="alert"` on fallback element

**State Architecture (7-Context Split)**
- Single `boardReducer` manages `{ tasks, pendingOps, conflict }` atomically; `AppProvider` unpacks into 7 separate read contexts
- Context value must be the direct slice — `value={boardState.tasks}` NOT `value={{ tasks: boardState.tasks }}` (object wrapper breaks `Object.is` diffing and causes all consumers to re-render)
- `BoardAPIContext` action creators in `useMemo([], [])` — stable forever, NEVER cause re-renders
- `FilterAPIContext` setters in `useMemo([], [filterDispatch])` — dispatch in deps
- Provider nesting order is fixed: `BoardState → PendingOps → Conflict → BoardAPI → Filter → FilterAPI → History → children`
- Always consume contexts via custom hooks (`useTasks()`, `useBoardAPI()`, etc.) — never raw `useContext()`
- `BoardAPIContext` default is `null`; hook throws if used outside provider — no silent no-op default

**Class Management**
- Use `cn()` helper (clsx + tailwind-merge) for all conditional className composition
- Use `class-variance-authority` (CVA) for components with multiple visual variants
- Never hardcode hex color values — use Tailwind design tokens only
- Never use `focus:outline-none` without a replacement `focus-visible:ring-2 focus-visible:ring-violet-500`

**Styling**
- Tailwind v4 CSS-only: `@import "tailwindcss"` in `src/index.css`; no `tailwind.config.js`
- Font is Geist Variable (`@fontsource-variable/geist`) — loaded via CSS import, not Inter
- Custom CSS variables defined via `@theme inline {}` block in `index.css`
- `tw-animate-css` imported for animation utilities

**shadcn / @base-ui/react**
- shadcn components live in `src/components/ui/` — copy-owned, editable
- Use `@base-ui/react` primitives (not `@radix-ui/*`) for accessible low-level UI
- `dangerouslySetInnerHTML` is forbidden — all user input rendered via React's built-in escaping

### Testing Rules

- Test runner: Vitest ^4.1.5 with `globals: true` — no need to import `describe`/`it`/`expect`
- Environment: jsdom ^29.0.2; setup file: `src/test-setup.ts` (`import '@testing-library/jest-dom'`)
- `vitest.config.ts` is SEPARATE from `vite.config.ts` — both need the `@/` path alias configured
- Test files co-located with the component they test: `TaskCard.test.tsx` next to `TaskCard.tsx` — never in `__tests__/` folders
- Test file naming: `ComponentName.test.tsx` for components; `hookName.test.ts` for hooks; `reducerName.test.ts` for reducers
- For context-dependent components, inject context via test wrappers — `BoardAPIContext` exports its context object specifically for this
- Reducer tests (`boardReducer.test.ts`) test state transitions directly — no mocking needed
- Hook tests use `renderHook` from `@testing-library/react`
- No snapshot tests — test behavior, not markup
- Do not mock `src/api/tasks.ts` in integration tests; mock at `mockRequest` level or test optimistic behavior via dispatched actions
- `passWithNoTests: true` in vitest config — new test files won't fail CI before tests are written

### Code Quality & Style Rules

**File & Folder Organization**
- Feature-based structure: `src/features/{board,tasks,filters,history,realtime}/`; each feature has `components/` and `hooks/` subdirectories
- Shared UI primitives in `src/shared/components/`; shared hooks in `src/shared/hooks/`; utilities in `src/shared/utils/`
- shadcn components in `src/components/ui/` (copy-owned)
- Contexts and reducers in `src/store/`; mock API in `src/api/`; shared types in `src/types/`
- No cross-feature imports — features only import from `src/shared/`, `src/store/`, `src/api/`, `src/types/`

**Naming Conventions**
- Components: `PascalCase.tsx`
- Hooks: `camelCase` with `use` prefix, `.ts` extension
- Context files: `PascalCase` + `Context` suffix (e.g., `BoardAPIContext.tsx`)
- Action type constants: `SCREAMING_SNAKE_CASE` in `NOUN_VERB` order (e.g., `TASK_MOVE` not `moveTask`)
- Union string values: lowercase (e.g., `'todo'`, `'in-progress'`, `'done'`)
- Test files: `ComponentName.test.tsx` co-located

**Component Rules**
- Max ~150 lines per component; extract stateful logic to custom hooks
- One concern per custom hook; hook name describes what it manages
- `React.memo` wrapping for list-item components
- Named exports only (except `App.tsx`)

**Comments**
- No comments explaining what code does — well-named identifiers do that
- Comments only for non-obvious WHY: hidden constraints, subtle invariants, workarounds
- No multi-line comment blocks or docstrings

**ESLint**
- Zero warnings on production build (`npm run lint`)
- `eslint-plugin-react-hooks` enforced — exhaustive deps rule active

### Critical Don't-Miss Rules

**Architecture Boundaries — NEVER violate these**
- `BoardAPIContext` is the ONLY mutation entry point — no component calls `src/api/tasks.ts` or `mockRequest` directly
- `useHistory` is the ONLY wrapper for user-initiated mutations (TASK_MOVE, TASK_CREATE, TASK_UPDATE, TASK_DELETE)
- `useRealtimeSimulation` dispatches `REMOTE_UPDATE` directly — intentionally bypasses `useHistory`
- `mockRequest` must only be called from `src/api/tasks.ts` — nowhere else
- System actions (`OP_SUCCESS`, `OP_ROLLBACK`, `REMOTE_UPDATE`, `CONFLICT_*`) must NEVER be pushed to the history stack
- `HISTORY_APPLY` is dispatched by `useHistory` only — never call it directly from a component

**Optimistic Update Gotchas**
- Capture `opId = nanoid()` and snapshot BEFORE any async call — the sequence is: dispatch optimistic → call API → dispatch OP_SUCCESS/OP_ROLLBACK
- `OP_ROLLBACK` restores the snapshot and leaves the history stack UNTOUCHED — rollback is transparent to undo/redo
- Capture task title/data for error toasts BEFORE calling `onClose()` or clearing state — the task ref may be gone by the time the API fails
- Concurrent mutations are isolated by `opId` — never use `taskId` alone to identify a pending op

**Reducer Rules**
- Never mutate state — always spread: `{ ...state, tasks: [...state.tasks] }`
- Always return full state: `return { ...state, field }` not `return { field }`
- `Map` must be reconstructed: `new Map(state.pendingOps)` then `.set()`/`.delete()` — never mutate in place
- `REMOTE_UPDATE` upserts: replace if task exists, append if new — never reset the whole list

**DnD Kit Gotcha**
- `PointerSensor` MUST have `activationConstraint: { distance: 8 }` — without it, mousedown starts drag and click→modal breaks
- `useSortable` must be called unconditionally in every card — hooks cannot be conditional
- Do NOT pass `onOpen` to the `DragOverlay` card — overlay cards must not be interactive
- All three packages required together: `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`

**Accessibility Rules**
- Every interactive element needs `aria-label` or `aria-labelledby` — never icon-only buttons without labels
- Never `focus:outline-none` without `focus-visible:ring-2 focus-visible:ring-violet-500` replacement
- In-flight cards: `aria-busy="true"` on the article element
- Error toasts: `aria-live="assertive"`; info/success toasts and UndoHintBar: `aria-live="polite"`
- Modal open → focus title field; modal close → restore focus to trigger element via `triggerRef`
- Touch targets minimum 44×44px on all interactive elements

**Security**
- No `dangerouslySetInnerHTML` anywhere
- No sensitive data in `localStorage` or `sessionStorage`
- All user input rendered via React's built-in escaping only

---

## Usage Guidelines

**For AI Agents:**
- Read this file before implementing any code in this project
- Follow ALL rules exactly as documented — especially architecture boundaries and forbidden patterns
- When in doubt, prefer the more restrictive option
- Flag any conflicts between this file and story/epic specs to the user

**For Humans:**
- Keep this file lean — focused on unobvious rules agents would miss
- Update when technology stack changes or new anti-patterns are discovered
- Remove rules that become obvious or are no longer relevant

Last Updated: 2026-04-24
