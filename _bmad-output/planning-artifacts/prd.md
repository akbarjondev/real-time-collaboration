---
stepsCompleted: [step-01-init, step-02-discovery, step-02b-vision, step-02c-executive-summary, step-03-success, step-04-journeys, step-05-domain, step-06-innovation, step-07-project-type, step-08-scoping, step-09-functional, step-10-nonfunctional, step-11-polish, step-12-complete]
releaseMode: phased
inputDocuments: ["docs/requirements.md"]
workflowType: 'prd'
classification:
  projectType: web_app
  domain: productivity_task_management
  complexity: medium
  projectContext: brownfield
  mvpScope: "Parts 1 + 2 + Option A (undo/redo)"
  postMvp: "Option B (query builder), Option C (conflict resolution), Bonus Points"
  stack:
    framework: "React 18+"
    language: TypeScript
    css: Tailwind
    components: functional_only
    api: "Mock API — setTimeout 2s delay, 10% random failure rate"
    deployment: "Local dev — AWS (S3 + CloudFront + API Gateway + Lambda) as end-of-project optional"
---

# Product Requirements Document — Real-Time Collaborative Task Board

**Author:** Ali
**Date:** 2026-04-23

## Executive Summary

A production-grade real-time collaborative task board built as a technical showcase for an engineering interview. The application targets engineering reviewers evaluating depth, architectural judgment, and frontend craftsmanship simultaneously — not breadth of features. Built with React 18, TypeScript (strict), and Tailwind CSS; API operations are simulated via a mock layer (2s delay, 10% failure rate) matching the assignment spec.

The MVP delivers: a Kanban board (Todo / In Progress / Done) with drag-and-drop, task CRUD, filtering, optimistic updates with rollback, real-time multi-user simulation, virtualized rendering for 1000+ tasks, and a full undo/redo system with keyboard shortcuts (Option A). Post-MVP phases add an advanced compound query builder (Option B) and a conflict resolution system with presence indicators (Option C). End-of-project polish includes dark mode, animations, offline support, and optional AWS deployment if requested.

### What Makes This Special

Most interview submissions optimize for one dimension. This implementation targets three simultaneously: **UI/UX polish** (smooth interactions, responsive design, real-time feedback), **performance** (virtualization, memoization, zero unnecessary re-renders), and **architectural clarity** (clean component hierarchy, custom hooks, legible state management). Every non-obvious technical decision is documented — inline comments where needed, README for assumptions, and a technical blog post for the most complex design choice.

## Project Classification

| Field | Value |
|---|---|
| **Project Type** | Web Application (React SPA) |
| **Domain** | Productivity / Task Management |
| **Complexity** | Medium |
| **Project Context** | Spec-driven (interview assignment) |
| **Primary Language** | TypeScript (strict, must-have) |
| **CSS** | Tailwind CSS |
| **API** | Mock — setTimeout 2s + 10% failure rate |
| **Deployment** | Local dev; AWS (S3 + CloudFront + API Gateway + Lambda) optional at end |

## Success Criteria

### User Success
- Task interactions (drag-and-drop, create, edit, status change) feel instant — no perceptible lag with 1000+ tasks loaded
- Optimistic updates make state changes immediate; rollbacks are smooth with a clear error toast
- Real-time simulation notifications are non-intrusive and clearly communicate external changes
- Undo/redo works predictably across all tracked action types including after optimistic rollbacks

### Reviewer Success (Interview Context)
- Any component is readable and understandable within 30 seconds
- Architecture is self-evident: a reviewer navigates the codebase confidently without a guide
- TypeScript is strict and meaningful — no `any`, no type gymnastics
- README documents assumptions and non-obvious decisions explicitly

### Technical Success
- Zero unnecessary re-renders (verified via React DevTools Profiler)
- Virtualization handles 1000+ tasks at consistent 60fps
- Error boundaries catch and recover at feature-level without crashing the app
- Race conditions on concurrent optimistic updates resolve correctly
- Zero TypeScript errors in strict mode, zero ESLint warnings

### Measurable Outcomes
- Lighthouse Performance ≥ 85 on production build
- All MVP functional requirements implemented (FR1–FR40)
- Undo/redo: Ctrl/Cmd+Z and Ctrl/Cmd+Shift+Z, 50-action history stack
- Zero `any` types in codebase

## Technical Standards

### Stack

| Concern | Choice | Rationale |
|---|---|---|
| Framework | React 18+ | Concurrent features, hooks-only |
| Language | TypeScript strict | No `any`, discriminated unions for async state |
| CSS | Tailwind CSS | Utility-first, zero runtime overhead |
| Components | Functional only | Hooks API, simpler mental model |
| Bundler | Vite | Fast HMR, optimized production builds |
| API | Mock — setTimeout 2s + 10% failure | Matches spec, no infra dependency |
| Virtualization | @tanstack/react-virtual | Stable, hooks-based, TypeScript-native |

### Folder Structure (Feature-Based)

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

### React Production Patterns (Enforced)

- **Component design:** Single responsibility, < 150 lines, composition over configuration
- **State:** Local first (`useState`), `useReducer` for complex state machines, Context only for genuinely global state
- **Performance:** `React.memo` for pure components, `useMemo` for expensive derivations, `useCallback` for stable callbacks passed to memoized children — profile before memoizing
- **Custom hooks:** One concern per hook, always clean up `useEffect`, never return JSX from a hook
- **TypeScript:** Strict mode, `unknown` + type guards over `any`, discriminated unions for async state: `{ status: 'loading' } | { status: 'error'; error: string } | { status: 'success'; data: T }`
- **Error handling:** Error boundaries at feature level, typed error states, actionable user-facing messages
- **Code splitting:** `React.lazy` + `Suspense` for route-level components

## Project Scoping & Phased Development

### Strategy

**Delivery Mode:** Phased — three sequential phases with clear boundaries
**Approach:** Depth-first MVP — complete core experience before expanding scope
**Resource:** Solo developer

### Phase 1 — MVP

**Journeys covered:** 1–6 (happy path, rollback, conflict, undo/redo, scale, mobile)

- Kanban board with 3 columns (Todo / In Progress / Done)
- Drag-and-drop task movement; status dropdown fallback on mobile
- Task creation/edit modal (title, description, assignee, priority, tags)
- Filtering by assignee and priority; full-text search across title and description
- Optimistic updates: mock API 2s delay, 10% failure rate, automatic rollback
- Real-time multi-user simulation: random task updates every 10–15s
- Conflict detection and reconciliation (keep mine / take theirs)
- Virtualized task list for 1000+ tasks
- Undo/redo: 50-action history stack, Ctrl/Cmd+Z and Ctrl/Cmd+Shift+Z, UI hint label
- Responsive layout — mobile-first, columns stack < 768px
- Error boundaries at feature level
- TypeScript strict mode throughout

### Phase 2 — Post-MVP

**Option B — Advanced Query Builder:**
- Compound AND/OR filter logic with visual builder UI
- URL param sync for shareable filter links
- Saved queries in localStorage
- Performance maintained for 1000+ tasks

**Option C — Conflict Resolution System:**
- Real-time presence indicators (who's viewing/editing)
- Edit locking when another user is active on a task
- Merge changes modal (Keep mine / Take theirs / Merge manually)
- CRDT-like logic for description field
- Network reconnection handling

### Phase 3 — End-of-Project Polish

- Keyboard shortcuts for power users
- Performant animations and transitions
- Dark mode
- Offline-first with service workers
- Technical blog post on one complex design decision
- README with assumptions and decisions documented
- AWS API Gateway + Lambda real CRUD API — only if interviewer requests
- AWS S3 + CloudFront deployment — only if interviewer requests

### Risk Mitigation

**Risk 1 — Undo/redo + optimistic rollback interaction (HIGH)**
Concurrent undos and API rollbacks can corrupt the history stack.
*Mitigation:* Design state machine upfront. Model history as an immutable stack with explicit action types. Rollbacks restore a prior snapshot — they never push to history.

**Risk 2 — Virtualization + real-time updates (MEDIUM)**
Applying remote updates to a virtualized list can cause scroll jumps.
*Mitigation:* Stable item keys, keyed diffing on updates, never reset the full list on a remote mutation.

**Risk 3 — Race conditions on rapid drag (MEDIUM)**
Multiple concurrent mock API calls with independent failure rates produce out-of-order rollbacks.
*Mitigation:* Tag each operation with a unique ID; apply rollbacks only to the matching operation.

## Web App Platform Requirements

### Browser Support

| Browser | Versions |
|---|---|
| Chrome | Latest 2 |
| Firefox | Latest 2 |
| Safari | Latest 2 |
| Edge | Latest 2 |
| IE / Legacy | Not supported |

Modern CSS (Grid, Flexbox, custom properties) and ES2020+ syntax used freely. No polyfills.

### Responsive Design

- **Breakpoints:** Mobile < 768px | Tablet 768–1024px | Desktop > 1024px
- Columns stack vertically on mobile; side-by-side on tablet/desktop
- Drag-and-drop degrades to status dropdown on touch devices
- Minimum tap target: 44×44px on all interactive elements

### Accessibility

Basic coverage — pragmatic for interview context:
- All interactive elements reachable via Tab; activatable via Enter/Space
- ARIA labels on buttons, modals, and form inputs
- Focus trap in modals; focus restored to trigger element on close
- WCAG AA color contrast on primary elements (Tailwind defaults satisfy this)

## User Journeys

### Journey 1: Happy Path — First Board Interaction

**Persona:** Alex, a mid-level engineer, opens the task board for the first time during a sprint.

**Opening Scene:** Three columns load instantly — Todo, In Progress, Done — each populated with tasks showing title, priority badge, assignee, and created date.

**Rising Action:** Alex searches "authentication" — results filter instantly. He switches to filter by assignee "John Doe". He opens the create modal, fills in title, description, assignee, and priority High, and submits.

**Climax:** The new task appears in Todo immediately (optimistic update) — no spinner, no wait.

**Resolution:** Alex drags the task to In Progress. The move is instant and smooth. The board feels trustworthy.

*Reveals: Task display, filtering, search, drag-and-drop, task creation modal, optimistic insert.*

---

### Journey 2: Optimistic Update Failure & Rollback

**Persona:** Alex, mid-sprint, moving tasks quickly.

**Opening Scene:** Alex drags a task from In Progress to Done. Column updates instantly.

**Rising Action:** Two seconds pass. Mock API fails (10% chance). Task snaps back to In Progress. Toast: *"Update failed — change has been reverted."*

**Climax:** Error is clear, state is consistent, board is not broken. Alex tries again — it succeeds.

**Resolution:** Alex trusts the board because failure is transparent and recovery is automatic.

*Reveals: Optimistic update, 10% failure simulation, rollback, error toast, loading state.*

---

### Journey 3: Real-Time Conflict — Remote User Collision

**Persona:** Alex is editing a task title when the simulated remote user updates the same task.

**Opening Scene:** Alex has the task modal open, mid-edit.

**Rising Action:** Toast: *"Another user updated this task."* Conflict detected — Alex's edit vs. incoming remote change.

**Climax:** Alex is prompted: Keep mine / Take theirs. He picks "Keep mine". Reconciliation applies his change over the remote state.

**Resolution:** No data silently lost. Board reflects correct final state.

*Reveals: Real-time simulation interval, conflict detection, reconciliation strategy, merge notification.*

---

### Journey 4: Undo/Redo Chain

**Persona:** Alex makes five rapid changes — moves tasks, renames two, reassigns one.

**Opening Scene:** Alex realises he reassigned the wrong task.

**Rising Action:** Ctrl+Z reverts reassignment. Ctrl+Z again reverts a rename. He goes one too far — Ctrl+Shift+Z redoes it. Each step shows a UI label for the next undo/redo action.

**Climax:** Alex makes a new change after undoing. Redo stack clears correctly. History behaves like any modern editor.

**Resolution:** Undo/redo is predictable and works even after an optimistic rollback mid-chain.

*Reveals: History stack (max 50), keyboard shortcuts, optimistic-aware undo/redo, UI hint label.*

---

### Journey 5: Scale — 1000+ Task Board

**Persona:** Alex's team has 1,200 tasks accumulated.

**Opening Scene:** Board loads without freezing. Scroll is smooth.

**Rising Action:** Alex scrolls 800 tasks deep in Done. Searches "payment" — virtualized list filters instantly. A remote update fires mid-scroll.

**Climax:** Update applies without interrupting scroll position or triggering a full re-render.

**Resolution:** Performance is invisible to Alex at any data scale.

*Reveals: Virtualization (@tanstack/react-virtual), memoized filter/sort, incremental remote updates.*

---

### Journey 6: Mobile — On-the-Go

**Persona:** Alex checks the board on his phone during stand-up.

**Opening Scene:** Columns stack vertically. Cards have large tap targets.

**Rising Action:** Alex taps a task, changes status via dropdown, saves. Task updates optimistically. A real-time notification appears as a non-intrusive top banner.

**Resolution:** The board is fully functional on mobile — genuinely usable one-handed, not just "technically responsive."

*Reveals: Responsive layout, touch tap targets, mobile modal, drag-and-drop touch fallback, responsive toast.*

---

### Journey Requirements Summary

| Capability Area | Journey |
|---|---|
| Task CRUD + display | 1 |
| Drag-and-drop + column management | 1, 6 |
| Optimistic updates + rollback | 2 |
| Error toasts + loading states | 2 |
| Real-time simulation + conflict handling | 3 |
| Undo/redo + keyboard shortcuts | 4 |
| Virtualization + memoization | 5 |
| Responsive layout + touch support | 6 |

## Functional Requirements

### Task Management

- **FR1:** User can create a task with title, description, assignee, priority (Low/Medium/High), and optional tags
- **FR2:** User can edit any field of an existing task
- **FR3:** User can delete a task
- **FR4:** User can view tasks with title, description, status, priority badge, assignee, and created date
- **FR5:** System organizes tasks into three status columns: Todo, In Progress, and Done
- **FR6:** User can open a task detail modal from a task card

### Board Navigation & Filtering

- **FR7:** User can filter the board by assignee
- **FR8:** User can filter the board by priority level
- **FR9:** User can search tasks by title and description text
- **FR10:** User can combine multiple active filters simultaneously
- **FR11:** System updates filtered results in real time as filter inputs change

### Task Movement

- **FR12:** User can move a task between columns via drag-and-drop on desktop
- **FR13:** User can change a task's status via a status selector on mobile/touch devices
- **FR14:** System reflects column changes immediately upon user interaction (before API confirmation)

### Optimistic Updates & Error Handling

- **FR15:** System applies task mutations immediately to the UI before the mock API resolves
- **FR16:** System simulates API latency of approximately 2 seconds per operation
- **FR17:** System randomly fails approximately 10% of API operations
- **FR18:** System rolls back a failed mutation to its prior state automatically
- **FR19:** System notifies the user with a descriptive toast when a mutation fails and is rolled back
- **FR20:** System displays a loading indicator on tasks with in-flight API operations
- **FR21:** System recovers gracefully from feature-level errors without crashing the full application

### Real-Time Collaboration Simulation

- **FR22:** System applies random task updates simulating a second user every 10–15 seconds
- **FR23:** System notifies the user with a non-intrusive toast when a remote update occurs
- **FR24:** System detects when an incoming remote update conflicts with a user's active edit
- **FR25:** User can resolve a conflict by choosing to keep their own change or accept the remote change
- **FR26:** System applies the resolved state without data loss from either version

### History Management

- **FR27:** User can undo the most recent tracked action via Ctrl/Cmd+Z
- **FR28:** User can redo the most recently undone action via Ctrl/Cmd+Shift+Z
- **FR29:** System maintains a history stack of up to 50 tracked actions
- **FR30:** System tracks all task mutations (status change, field edits, creation, deletion)
- **FR31:** System displays a UI label indicating what action will be undone or redone next
- **FR32:** System clears the redo stack when the user performs a new action after undoing
- **FR33:** System handles undo/redo correctly in the presence of optimistic rollbacks

### Performance & Rendering

- **FR34:** System renders task columns without degradation when total task count exceeds 1,000
- **FR35:** System renders only visible task items within the viewport (virtualization)
- **FR36:** System applies remote updates to the task list without resetting scroll position or causing full re-renders

### Responsive & Accessible UI

- **FR37:** System displays task columns stacked vertically on screens narrower than 768px
- **FR38:** All interactive elements are reachable and operable via keyboard navigation
- **FR39:** All buttons, modals, and form inputs carry descriptive ARIA labels
- **FR40:** Modals trap focus while open and restore focus to the triggering element on close

## Non-Functional Requirements

### Performance

- **NFR1:** Lighthouse Performance score ≥ 85 on production build
- **NFR2:** Initial page load < 2 seconds on fast 3G
- **NFR3:** Board maintains 60fps scroll and interaction with 1,000+ tasks loaded
- **NFR4:** Filter and search respond within 50ms (client-side, memoized)
- **NFR5:** Optimistic UI updates applied within one animation frame (≤ 16ms perceived latency)
- **NFR6:** Remote simulation updates applied without full component re-renders or scroll position reset

### Code Quality & Maintainability

- **NFR7:** Codebase compiles with zero TypeScript errors in strict mode; zero `any` types
- **NFR8:** Components are single-responsibility, ≤ 150 lines; stateful logic extracted into custom hooks
- **NFR9:** Feature code co-located in feature folders; shared utilities in `shared/`
- **NFR10:** Non-obvious implementation decisions have inline comments; architecture decisions in README
- **NFR11:** ESLint passes with zero warnings on production build

### Accessibility

- **NFR12:** All interactive elements keyboard-navigable via Tab; activatable via Enter/Space
- **NFR13:** Modals implement focus trap on open; restore focus to trigger element on close
- **NFR14:** All interactive elements and form inputs carry `aria-label` or `aria-labelledby`
- **NFR15:** Primary UI elements meet WCAG AA color contrast (4.5:1) — Tailwind defaults satisfy this

### Security

- **NFR16:** All user-supplied input rendered via React's built-in escaping (no `dangerouslySetInnerHTML`)
- **NFR17:** No sensitive data stored in localStorage or sessionStorage
