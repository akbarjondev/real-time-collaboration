# Technical Standards

## Stack

| Concern | Choice | Rationale |
|---|---|---|
| Framework | React 18+ | Concurrent features, hooks-only |
| Language | TypeScript strict | No `any`, discriminated unions for async state |
| CSS | Tailwind CSS | Utility-first, zero runtime overhead |
| Components | Functional only | Hooks API, simpler mental model |
| Bundler | Vite | Fast HMR, optimized production builds |
| API | Mock — setTimeout 2s + 10% failure | Matches spec, no infra dependency |
| Virtualization | @tanstack/react-virtual | Stable, hooks-based, TypeScript-native |

## Folder Structure (Feature-Based)

```
src/
  features/
    tasks/       # components, hooks, types, utils co-located
    board/
    history/     # undo/redo feature
  shared/
    components/  # reusable UI primitives
    hooks/
    utils/
  api/           # mock API client, request/response types
  store/         # context or reducer-based global state
  types/         # shared TypeScript interfaces
  App.tsx
  main.tsx
```

## React Production Patterns (Enforced)

- **Component design:** Single responsibility, < 150 lines, composition over configuration
- **State:** Local first (`useState`), `useReducer` for complex state machines, Context only for genuinely global state
- **Performance:** `React.memo` for pure components, `useMemo` for expensive derivations, `useCallback` for stable callbacks passed to memoized children — profile before memoizing
- **Custom hooks:** One concern per hook, always clean up `useEffect`, never return JSX from a hook
- **TypeScript:** Strict mode, `unknown` + type guards over `any`, discriminated unions for async state: `{ status: 'loading' } | { status: 'error'; error: string } | { status: 'success'; data: T }`
- **Error handling:** Error boundaries at feature level, typed error states, actionable user-facing messages
- **Code splitting:** `React.lazy` + `Suspense` for route-level components
