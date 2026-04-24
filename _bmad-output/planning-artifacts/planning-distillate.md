---
type: bmad-distillate
sources:
  - "prd/executive-summary.md"
  - "prd/functional-requirements.md"
  - "prd/non-functional-requirements.md"
  - "prd/project-classification.md"
  - "prd/project-scoping-phased-development.md"
  - "prd/success-criteria.md"
  - "prd/technical-standards.md"
  - "prd/user-journeys.md"
  - "prd/web-app-platform-requirements.md"
  - "epics/overview.md"
  - "epics/requirements-inventory.md"
  - "epics/epic-list.md"
  - "epics/epic-1-project-foundation-runnable-board-shell.md"
  - "epics/epic-2-task-crud-full-task-display.md"
  - "epics/epic-3-task-movement-drag-and-drop-status-changes.md"
  - "epics/epic-4-filtering-search.md"
  - "epics/epic-5-optimistic-updates-error-recovery.md"
  - "epics/epic-6-real-time-collaboration-simulation-conflict-resolution.md"
  - "epics/epic-7-undoredo-history-system.md"
  - "epics/epic-8-performance-scale.md"
  - "epics/epic-9-responsive-design-accessibility.md"
  - "architecture/project-context-analysis.md"
  - "architecture/starter-template-evaluation.md"
  - "architecture/core-architectural-decisions.md"
  - "architecture/implementation-patterns-consistency-rules.md"
  - "architecture/project-structure-boundaries.md"
  - "architecture/architecture-validation-results.md"
  - "ux-design-specification.md"
downstream_consumer: "general planning — architecture, story implementation, sprint planning"
created: "2026-04-24"
token_estimate: 3541
parts: 1
---

## Project Context
- React SPA; interview technical showcase; solo dev; reviewer = engineering interviewers evaluating depth, architecture, craftsmanship
- Domain: productivity / task management; complexity: medium-high; ~18 architectural components
- 40 FRs across 8 categories; 17 NFRs; 9 epics; 19 UX-DR specs
- Primary user: Alex, mid-level engineer, desktop-primary, mobile one-handed during stand-ups
- Goal: UI/UX polish + performance + architectural clarity simultaneously
- All non-obvious decisions documented: inline comments + README + one technical blog post on most complex decision
- Phased delivery: Phase 1 = MVP (FR1–FR40); Phase 2 = Option B (Advanced Query Builder) or Option C (Conflict Resolution); Phase 3 = Polish + optional AWS
- Depth-first strategy: complete core before expanding scope

## Tech Stack & Libraries
- React 18+ hooks-only functional components; concurrent features available
- TypeScript 5.x strict; noUncheckedIndexedAccess; zero `any`; discriminated unions mandatory for async state
- Tailwind CSS v4 via @tailwindcss/vite plugin; no tailwind.config.js; WCAG AA contrast by defaults
- Vite 8 bundler; SWC ~10x faster than Babel; starter: `npm create vite@latest -- --template react-swc-ts`
- @tanstack/react-virtual: hooks-based TypeScript-native virtualization; estimateSize=72px; overscan=5
- @dnd-kit/core + @dnd-kit/sortable + @dnd-kit/utilities: all three required; react-beautiful-dnd deprecated 2024
- Sonner: React 18 native toast; Tailwind-compatible; bottom-right; richColors
- React Hook Form: uncontrolled inputs = zero re-renders per keystroke; justified at 6+ fields
- Vitest + React Testing Library; jsdom environment; co-located test files; axe-core in component tests
- nanoid: string IDs only; never number IDs; all dates ISO 8601
- shadcn/ui on Tailwind + Radix UI: copy-owned in src/components/ui/; accessibility via Radix primitives
- Path alias `@/` → `./src/`; configured in vite.config.ts + tsconfig.app.json
- Mock API: single mockRequest<T>; setTimeout 2000ms delay; 10% MockApiError failure rate; no component imports mockRequest directly
- 25 seed Task objects in mockData.ts
- No barrel index.ts exports in feature folders

## Folder Structure
- Feature-based: src/features/{board,tasks,filters,history,realtime}/
- src/store/ — context + reducer; src/api/ — mock API client + request/response types; src/shared/components/; src/shared/hooks/; src/shared/utils/; src/types/ — shared TypeScript interfaces

## State Architecture
- Single boardReducer manages { tasks, pendingOps, conflict } as atomic state; AppProvider unpacks into 7 separate read contexts split by update frequency and consumer set
- Atomic invariant: optimistic update changing tasks[] AND recording pendingOp must be one reducer transition
- BoardStateContext = createContext<Task[]>([]); value IS the slice — `value={boardState.tasks}` NOT `value={{ tasks: boardState.tasks }}`
- PendingOpsContext = createContext<Map<string, PendingOperation>>(); Map for O(1) rollback lookup
- ConflictContext = createContext<ConflictState | null>(null)
- BoardAPIContext = stable memoized action creators; useMemo with [] deps; NEVER re-renders consumers
- FilterContext = { assignee, priority, searchQuery }; FilterAPIContext = stable { setFilter, setSearch }; useMemo with [] deps
- HistoryContext = read-only { undoLabel, redoLabel, canUndo, canRedo }
- Provider nesting order: BoardState/PendingOps/Conflict → BoardAPIProvider → FilterProvider → FilterAPIProvider → HistoryProvider → children
- BoardAPIContext is the ONLY mutation entry point; useHistory is the ONLY wrapper for user-initiated mutations
- useRealtimeSimulation bypasses useHistory intentionally; dispatches REMOTE_UPDATE directly to boardReducer
- Anti-patterns: `value={{ tasks }}` (breaks Object.is diffing); importing dispatch directly; pushing OP_ROLLBACK or REMOTE_UPDATE to history; global isLoading flag; `state.tasks.push(...)` (always spread); `: any`

## Data Types & Actions
- Task fields: title, description, assignee, priority (Low/Medium/High), optional tags, status, created date
- TaskStatus: 'todo' | 'in-progress' | 'done'
- Priority: 'low' | 'medium' | 'high'
- BoardState: { tasks: Task[]; pendingOps: Map<string, PendingOperation>; conflict: ConflictState | null }
- PendingOperation: { id: string; taskId: string; snapshot: Task }
- ConflictState: { local: Task; remote: Task }
- FilterState: { assignee: string | null; priority: Priority | null; searchQuery: string }
- HistoryEntry: { id: string; label: string; forward: UserAction; inverse: UserAction }; cap 50
- HistoryViewState: { undoLabel: string | null; redoLabel: string | null; canUndo: boolean; canRedo: boolean }
- USER ACTIONS (pushed to history, all include opId: string): TASK_MOVE, TASK_CREATE, TASK_UPDATE, TASK_DELETE
- SYSTEM ACTIONS (NEVER pushed to history): OP_SUCCESS, OP_ROLLBACK, REMOTE_UPDATE, CONFLICT_DETECTED, CONFLICT_RESOLVE_MINE, CONFLICT_RESOLVE_THEIRS
- UNDO/REDO: HISTORY_APPLY(action: UserAction) — dispatched by useHistory only; never re-pushed to history
- OP_ROLLBACK restores snapshot; history stack UNTOUCHED; rollback transparent to undo/redo

## Optimistic Update Flow
1. opId = nanoid()
2. Record snapshot in pendingOps: { taskId, snapshot: currentTask }
3. Apply change to tasks[] immediately (optimistic) — ≤16ms perceived latency
4. Call mockRequest() in background
5a. Success → dispatch OP_SUCCESS(opId) → remove from pendingOps
5b. Failure → dispatch OP_ROLLBACK(opId) → restore snapshot → toast.error(...); creation rollback re-opens modal pre-filled
- Three data flow paths: (1) user action → useHistory → BoardAPIContext → boardReducer → mockRequest; (2) simulation tick → REMOTE_UPDATE → boardReducer; (3) keyboard shortcut → useHistory.undo() → HISTORY_APPLY

## Epics & Stories
- Epic 1 (Foundation): npm create vite react-swc-ts; all deps; boardReducer + 7 contexts + custom hooks; BoardAPIContext useMemo([],[]); mockRequest<T>; 25 seed tasks; ErrorBoundary; ToastProvider; 3-column Kanban shell with count badges, cards, design tokens, empty states; FRs: FR4 partial, FR5
- Epic 2 (Task CRUD): TaskCard 5 states (default/hover/done/dragging/in-flight); role=article; React.memo; create modal (N key or button); title required; inline validation on blur; unsaved-changes guard; react-hook-form uncontrolled; edit modal pre-populated; delete via modal; OP_ROLLBACK restores + toast.error; FRs: FR1–FR4, FR6
- Epic 3 (Task Movement): DndContext (PointerSensor activationConstraint distance:8) + SortableContext per column; useBoardDnd hook; DragOverlay; moveTask() optimistic sequence; same-column drop = no-op; mobile (<768px) status Select as first field in edit modal dispatching through same moveTask() path; FRs: FR12–FR14
- Epic 4 (Filtering & Search): filterTasks(tasks,filters)→Task[] pure function; AND logic; useMemo in BoardColumn; <50ms for 1000+ tasks; filter bar always visible; active chips (violet-100+×); filtered-empty-state; ⌘K/Ctrl+K overlay; MRU; role=combobox+focus trap; FRs: FR7–FR11
- Epic 5 (Optimistic Updates & Error Recovery): ≤16ms optimistic; PendingOperation per opId; concurrent mutations isolated; cardPulse keyframe 1.8s violet + CSS spinner; aria-busy=true; toast tiers (Error rose persistent / Info zinc 4s / Success emerald 3s); max 3 simultaneous; ≥2 ErrorBoundary instances with Retry button; FRs: FR15–FR21
- Epic 6 (Real-Time Simulation & Conflict): useRealtimeSimulation; random task update every 10–15s; REMOTE_UPDATE directly (NOT through useBoardAPI/useHistory); interval cleanup; info toast on REMOTE_UPDATE (4s); card updates in place; CONFLICT_DETECTED when REMOTE_UPDATE targets task open in edit modal; ConflictModal two-column diff; Keep mine / Take theirs / Cancel; role=alertdialog+focus trap; FRs: FR22–FR26
- Epic 7 (Undo/Redo): HistoryEntry cap 50; OP_ROLLBACK and REMOTE_UPDATE never touch stack; undo→HISTORY_APPLY(inverse); new action after undo clears redo; useKeyboardShortcut at document level; Ctrl+Z/Cmd+Z=undo; Ctrl+Shift+Z/Cmd+Shift+Z=redo; suppressed when modal has focus; UndoHintBar always visible; aria-live=polite; FRs: FR27–FR33
- Epic 8 (Performance & Scale): useVirtualizer; estimateSize=72px; overscan=5; stable task IDs; scroll preserved through remote updates; React.memo on TaskCard; column useMemo([tasks,filters]); BoardAPIContext useMemo([],[]) never re-renders consumers; Lighthouse ≥85; load <2s fast 3G; FRs: FR34–FR36; NFR1–NFR3
- Epic 9 (Responsive & Accessibility): <768px flex-col columns; DnD disabled mobile; filter bar→bottom sheet; ≥44×44px touch targets; mobile-first Tailwind; full Tab order; focus-visible:ring-2 ring-violet-500; Enter=open modal; Space=keyboard drag; aria-label on all; columns role=region; focus auto-moves to title on modal open; focus trap via Radix UI Dialog; error toasts aria-live=assertive; prefers-reduced-motion respected; skip-to-main-content link; FRs: FR37–FR40; NFR12–NFR15

## NFRs & Success Criteria
- Lighthouse Performance ≥85 on production build (NFR1); initial page load <2s fast 3G (NFR2); 60fps scroll+interaction with 1000+ tasks (NFR3)
- Filter/search response ≤50ms client-side memoized (NFR4); optimistic UI updates ≤16ms (one animation frame) (NFR5); remote simulation updates without full re-renders or scroll reset (NFR6)
- Zero TS errors strict mode; zero `any` types (NFR7); components ≤150 lines; stateful logic in custom hooks (NFR8); feature code co-located; shared utilities in shared/ (NFR9)
- Non-obvious decisions have inline comments; architecture in README (NFR10); ESLint passes zero warnings on production build (NFR11)
- All interactive elements keyboard-navigable Tab; activatable Enter/Space (NFR12); modals: focus trap on open, restore focus to trigger on close (NFR13); all interactive elements + form inputs carry aria-label or aria-labelledby (NFR14); WCAG AA 4.5:1 color contrast (NFR15)
- No dangerouslySetInnerHTML (NFR16); no sensitive data in localStorage or sessionStorage (NFR17)
- User success: task interactions instant at 1000+ tasks; rollbacks smooth with clear toast; real-time notifications non-intrusive; undo/redo predictable including after optimistic rollbacks
- Reviewer success: any component readable in 30 seconds; architecture self-evident; TypeScript strict and meaningful; README documents assumptions
- Technical success: zero unnecessary re-renders (React DevTools Profiler); race conditions on concurrent optimistic updates resolve correctly; zero TS errors/ESLint warnings

## Visual Design & UX
- Design direction D: Header Filter Bar with light theme (rejected: A Linear Classic, B Minimal Focus, C Dense Productivity, E Sidebar Filters, F Card-Rich)
- Page bg: zinc-50; column: zinc-100; card: white + zinc-200 border; text primary: zinc-900; text secondary: zinc-500
- Accent: violet-600 (buttons, focus rings, in-flight, drag highlight); hover: violet-700
- Priority High: rose-500; Medium: amber-500; Low: sky-500
- Font: Inter; card title: text-sm font-medium; metadata: text-xs text-zinc-500; column headers: text-sm font-semibold + count badge
- Base spacing 8px; card padding p-4; gap-3 cards / gap-4 columns
- Layout: header (board title + layout-kanban icon + View options + New Task button right-aligned) → filter bar (full-width; ⌘K search + active chips + Assignee/Priority/Tags dropdowns + Clear all; always visible) → undo hint bar (below filter bar, above columns; aria-live=polite) → three equal-width columns
- Cards: title dominant; priority dot+text badge; assignee; date right-aligned
- In-flight: cardPulse keyframe 1.8s infinite + CSS spinner top-right
- TaskCard states: default / hover (elevated) / done (0.65 opacity+strikethrough) / dragging (scale 1.02x+shadow) / in-flight (violet pulse+spinner)
- KanbanColumn states: default / drag-over (violet border) / empty
- DragOverlay: semi-transparent clone; placeholder: dashed slot in destination; touch drag disabled mobile
- Toast tiers: Info zinc 4s ("Task updated by Jane"); Success emerald 3s ("Task created"); Warning amber 6s ("Conflict detected"); Error rose persistent (always names task and action); max 3 simultaneous; queue+coalesce; FORBIDDEN: "Something went wrong"
- Empty states: column no tasks = inbox icon + "No tasks" + "Drag a task here or add one" + Add task ghost; filtered no matches = filter icon + "No matches" + Clear filter link; every empty state = icon + heading + sub-text + action
- Button hierarchy: Primary violet-600 (New Task, Create, Keep mine); Secondary white+zinc border (Take theirs, filter dropdowns); Ghost transparent (Clear all, Cancel, Redo, Add task dashed); never two primary side-by-side; imperative verb labels
- Form: title required; all others optional; inline validation on blur; rose-600+alert-circle below field; Tab order: Title → Priority → Assignee → Due Date → Create; unsaved-changes guard with Discard (destructive) + Keep editing; no guard if nothing changed; failure re-opens modal with data preserved
- ConflictModal: role=alertdialog; focus trap; two-column diff; Keep mine / Take theirs / Cancel
- CmdK overlay: role=combobox; focus trap; MRU; fuzzy search; <50ms results

## Keyboard & Accessibility
- Shortcuts: N=new task; ⌘K/Ctrl+K=search; ⌘Z/Ctrl+Z=undo; ⌘⇧Z/Ctrl+Shift+Z=redo; Escape=close; Tab/Shift+Tab=navigate; Enter=open card; Space=pick up/drop in keyboard drag
- Keyboard drag: Space picks up; arrows move columns; Space drops; Escape cancels; suppressed when modal has focus
- Focus: modal open → title field; modal close → trigger element; ⌘K → search input
- WCAG 2.1 AA: zinc-900/white=19:1; violet-600/white=5.1:1; rose-500 badge=4.6:1
- Radix UI handles focus traps automatically
- All animations: prefers-reduced-motion respected
- UndoHintBar aria-live=polite; error toasts aria-live=assertive
- Columns role=region; TaskCard role=article; aria-busy=true when in-flight
- Skip-to-main-content link present

## Responsive
- Mobile <768px: columns stack flex-col; DnD disabled → status dropdown; filter bar → bottom sheet; ≥44×44px tap targets; column min-width 280px on tablet+; test at 320px minimum
- Tablet 768–1024px: three columns side-by-side; touch DnD + dropdown fallback
- Desktop >1024px: full layout; DnD primary
- Mobile-first Tailwind only

## Scope & Risks
- IN (MVP): all FR1–FR40; 3-column Kanban; drag-and-drop desktop; status dropdown mobile; CRUD modal; filtering/search; optimistic updates+rollback; real-time simulation; conflict detection+resolution; undo/redo 50-stack; virtualization; responsive layout; error boundaries; TypeScript strict
- OUT/DEFERRED: real backend API (mock only); AWS deployment (optional); IE/legacy support; polyfills; dangerouslySetInnerHTML; sensitive data storage; keyboard shortcuts for power users; performant animations; dark mode; offline-first service workers; technical blog post; README; AWS API Gateway+Lambda; AWS S3+CloudFront
- Phase 2 Option B: compound AND/OR filter logic; visual builder UI; URL param sync; saved queries localStorage; performance maintained 1000+ tasks
- Phase 2 Option C: real-time presence indicators; edit locking; merge changes modal (Keep mine / Take theirs / Merge manually); CRDT-like logic for description; network reconnection handling
- Risk 1 (HIGH): undo/redo + optimistic rollback interaction — concurrent undos and API rollbacks can corrupt history stack; mitigation: design state machine upfront; model history as immutable stack with explicit action types; rollbacks restore prior snapshot and never push to history
- Risk 2 (MEDIUM): virtualization + real-time updates — remote updates cause scroll jumps; mitigation: stable item keys; keyed diffing on updates; never reset full list on remote mutation
- Risk 3 (MEDIUM): race conditions on rapid drag — multiple concurrent mock API calls with independent failure rates produce out-of-order rollbacks; mitigation: tag each operation with unique opId; apply rollbacks only to matching operation
