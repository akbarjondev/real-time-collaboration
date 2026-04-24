# Project Context Analysis

## Requirements Overview

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

## Technical Constraints & Dependencies

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

## Cross-Cutting Concerns Identified

1. **Concurrent async state** — Optimistic updates, real-time simulation, and undo/redo all mutate task state from independent sources simultaneously. They must share a consistent ground truth.

2. **Operation identity & rollback** — Every mutation needs a unique operation ID so out-of-order mock API responses roll back only their own operation, not a later one that succeeded.

3. **Undo/redo boundaries** — This is the highest-risk invariant: automatic rollbacks (API failure) and remote simulation updates must **never** push to the history stack. Only intentional user actions do.

4. **Virtualization stability** — Remote updates must use stable item keys and keyed diffing. Full list replacement resets scroll — unacceptable at 1000+ tasks.

5. **Performance-first rendering** — Filter/search derivations and task card rendering must be memoized everywhere. This shapes how state is partitioned and how Context is consumed.

6. **Toast coordination** — Concurrent async sources produce concurrent toasts. A single toast manager with queue/deduplication prevents visual chaos.

7. **Mobile/desktop bifurcation** — Drag-and-drop and status dropdown are equal paths for the same mutation. Mutation logic must be input-agnostic.
