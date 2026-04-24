# Story 9.3: Focus Management, Screen Reader Support, and Reduced Motion

Status: done

## Blocker

**Do NOT start implementation until Epic 3 is `done`.** This story references `KanbanBoard.tsx` (skip link + DnD announcements), `index.css` (reduced motion), and `App.tsx` (skip link placement) — all stabilized after Epic 3.

Story 9.1 is a **hard dependency** for the skip link: the `id="main-content"` attribute must be present on `<main>` before the skip link href `#main-content` resolves. Implement Story 9.1 first, or add the `id` in this story if 9.1 has not been started.

Story 9.2 is a **soft dependency**: the DnD accessibility announcements added here depend on the `KeyboardSensor` added in Story 9.2 to be meaningful. The `accessibility` prop on `DndContext` works regardless of which sensors are active, so this story can be implemented independently if needed.

Epics 6 and 7 are **not required** before this story. The `ConflictModal` (Epic 6.3) and `UndoHintBar` (Epic 7.3) focus management and `aria-live` notes are included as dev notes for when those components are implemented — they do not block this story.

---

## Story

As a screen reader user or user who prefers reduced motion,
I want focus to be managed correctly when modals open and close, animations to be suppressable, and the board to be navigable without visual cues alone,
so that the application is usable and safe for users with accessibility needs.

## Acceptance Criteria

1. **Given** the page loads **When** a keyboard user tabs to the first interactive element **Then** a "Skip to main content" link is the very first focusable element; it is visually hidden until focused, then becomes visible with a violet background.

2. **Given** the "Skip to main content" link is activated (Enter or click) **When** the user follows the link **Then** focus jumps to the `<main>` board content area, bypassing the header and filter bar.

3. **Given** the task create or edit modal opens **When** focus enters the modal **Then** focus is placed on the title input (create mode) or on the Status select trigger on mobile <768px / title input on desktop ≥768px (edit mode). This behavior is already implemented — verify it works end-to-end.

4. **Given** the task modal closes (Cancel, Save, Delete, or Escape) **When** the modal unmounts **Then** focus returns to the element that triggered the modal (the task card, "New Task" button, or "Add task" button). This behavior is already implemented via `triggerRef` — verify it works end-to-end.

5. **Given** a drag-and-drop operation is in progress via keyboard sensor **When** drag starts, the card moves between columns, and the drag ends or is cancelled **Then** a screen reader announces each event via dnd-kit's built-in `accessibility.announcements`.

6. **Given** an in-flight task card (API call pending) **When** inspected by a screen reader **Then** the `<article>` has `aria-busy="true"` to signal to assistive technology that the element is updating. This is already implemented — verify.

7. **Given** the operating system or browser has `prefers-reduced-motion: reduce` set **When** the board renders **Then** all CSS animations and transitions are suppressed: the `cardPulse` animation does not run, the CSS spinner does not spin, and all `transition-*` durations are effectively zero.

8. **Given** the `prefers-reduced-motion: reduce` preference is active **When** a task card is in-flight **Then** the in-flight state is still communicated (ring color, spinner element visible but static) — the indicator does not disappear, only the motion is removed.

9. **Given** the UndoHintBar is rendered (Epic 7.3) **When** a new undo entry is added or an undo/redo completes **Then** the bar has `aria-live="polite"` so screen readers announce changes without interrupting the user. (Note: UndoHintBar is deferred to Epic 7.3 — this story adds the attribute pattern as a dev note for that epic.)

10. **Given** error toasts are shown (Sonner with `richColors`) **When** a persistent error toast appears **Then** screen readers announce it. Sonner's `<Toaster>` renders its own `role="region"` aria region — verify that `richColors` error toasts are announced. Add `aria-live="assertive"` to the Toaster if Sonner does not provide it natively.

## Tasks / Subtasks

- [ ] Task 1: Add skip-to-main-content link in App.tsx (AC: #1, #2)
  - [ ] Add a visually-hidden skip link as the very first element inside the `<ErrorBoundary>` wrapper (before `<KanbanBoard />`)
  - [ ] The link must use `href="#main-content"` targeting the `<main id="main-content">` element (added in Story 9.1)
  - [ ] Style with `sr-only` (visually hidden) by default, `focus:not-sr-only` to reveal on focus:
    ```tsx
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-violet-600 focus:text-white focus:rounded-md focus:text-sm focus:font-medium"
    >
      Skip to main content
    </a>
    ```
  - [ ] Verify `<main>` in `KanbanBoard.tsx` has `id="main-content"` (from Story 9.1); if Story 9.1 has not been done, add it here

- [ ] Task 2: Add DnD accessibility announcements to DndContext in KanbanBoard.tsx (AC: #5)
  - [ ] Import `useTasks` from `@/store/BoardStateContext` in `KanbanBoard.tsx`
  - [ ] Add the `accessibility` prop to `<DndContext>` with `announcements`:
    ```tsx
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      accessibility={{
        announcements: {
          onDragStart({ active }) {
            const task = tasks.find(t => t.id === String(active.id))
            return task ? `Picked up task "${task.title}"` : `Picked up task`
          },
          onDragOver({ active, over }) {
            if (!over) return 'Not over a drop area'
            const COLUMN_LABELS: Record<string, string> = {
              'todo': 'Todo',
              'in-progress': 'In Progress',
              'done': 'Done',
            }
            const colLabel = COLUMN_LABELS[String(over.id)] ?? String(over.id)
            return `Dragging over ${colLabel} column`
          },
          onDragEnd({ active, over }) {
            if (!over) return 'Drag cancelled'
            const COLUMN_LABELS: Record<string, string> = {
              'todo': 'Todo',
              'in-progress': 'In Progress',
              'done': 'Done',
            }
            const colLabel = COLUMN_LABELS[String(over.id)] ?? String(over.id)
            return `Task dropped in ${colLabel} column`
          },
          onDragCancel() {
            return 'Drag cancelled'
          },
        }
      }}
    >
    ```
  - [ ] Call `useTasks()` at the top of `KanbanBoard` (it is not currently called there — the columns call it themselves); the hook is a simple context read and will not cause unnecessary re-renders
  - [ ] Ensure `COLUMN_LABELS` is defined as a `const` outside the component or memoized to avoid re-creating on each render — prefer defining it as a module-level `const` above the component function

- [ ] Task 3: Add reduced motion CSS to index.css (AC: #7, #8)
  - [ ] Add a `prefers-reduced-motion: reduce` media query block to `src/index.css`:
    ```css
    @media (prefers-reduced-motion: reduce) {
      *, *::before, *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
        scroll-behavior: auto !important;
      }
    }
    ```
  - [ ] This suppresses `cardPulse`, `animate-spin`, and all Tailwind transitions globally when the user has reduced motion preference set
  - [ ] The `!important` is required to override inline styles and Tailwind utilities that set these properties directly
  - [ ] Add the block after the `@keyframes cardPulse` and `.card-pulse` rules at the bottom of `index.css`

- [ ] Task 4: Verify in-flight state is visible without animation (AC: #8)
  - [ ] With reduced motion active, the `card-pulse` animation is suppressed. The card still has `border-violet-600` (ring color) and `isPending && 'border-violet-600 card-pulse'` — the `card-pulse` class applies animation only; the violet border remains. Verify this by inspecting the card with motion disabled.
  - [ ] The CSS spinner `animate-spin` is suppressed. The spinner element (`<div className="absolute top-2 right-2 h-3 w-3 animate-spin rounded-full border-2 border-violet-600 border-t-transparent">`) remains visible as a static quarter-circle. This provides a static indicator that the card is pending. No additional change needed.
  - [ ] `aria-busy="true"` remains on the article regardless of motion preference — this is the primary accessible signal for screen readers

- [ ] Task 5: Verify modal focus management end-to-end (AC: #3, #4)
  - [ ] Open task create modal (N key or New Task button): confirm focus lands on the title input
  - [ ] Open task edit modal by clicking a card: confirm focus lands on title input (desktop) or status select trigger (mobile <768px)
  - [ ] Close modal via Cancel: confirm focus returns to the trigger element (task card or button that opened it)
  - [ ] Close modal via Save/Create: confirm focus returns to trigger element
  - [ ] Close modal via Escape: confirm focus returns to trigger element
  - [ ] Close modal via Delete: confirm focus returns to the task card's column (the card is gone, so focus may fall to the column or next focusable element — verify no focus loss to `<body>`)
  - [ ] No code changes expected — this is a verification task. If focus is not returning correctly, debug `useTaskModal.ts` `triggerRef` logic and the `setTimeout(() => triggerRef.current?.focus(), 0)` call

- [ ] Task 6: Verify Sonner toast aria-live behavior (AC: #10)
  - [ ] Inspect the Sonner `<Toaster>` DOM output in browser DevTools
  - [ ] Verify error toasts have `role="alert"` or `aria-live="assertive"` — Sonner v2 with `richColors` renders its toasts inside an `aria-live` region by default
  - [ ] If Sonner does not provide assertive live region for errors, update `ToastProvider.tsx`:
    ```tsx
    <Toaster position="bottom-right" richColors aria-live="assertive" />
    ```
  - [ ] Note: Sonner renders its own ARIA live region container. Adding `aria-live` to the `Toaster` prop may or may not be forwarded — check Sonner v2 documentation or source if needed
  - [ ] If Sonner does not support the prop, this is a known limitation and should be noted in Review Findings

- [ ] Task 7: Write tests (AC: #1, #5, #7)
  - [ ] `App.test.tsx` (create): render `<App />` wrapped in `AppProvider`; assert the first focusable element is a link with text "Skip to main content"; assert the link `href` is `"#main-content"`
  - [ ] `KanbanBoard.test.tsx` (extend): assert `<DndContext>` is rendered (it is — it wraps main); assert `<main>` has `id="main-content"` (if Story 9.1 added it); this is a smoke test, not a drag simulation
  - [ ] Reduced motion CSS is a CSS media query — it cannot be tested in jsdom. Document this in Completion Notes: "Reduced motion verified manually; not testable in jsdom environment."

- [ ] Task 8: Update sprint-status.yaml
  - [ ] Set `9-3-focus-management-screen-reader-support-and-reduced-motion` to `in-progress`

---

## Dev Notes

### Skip Link Implementation in App.tsx

The skip link must be the very first child element rendered in the DOM — before `<ErrorBoundary>` renders the `<KanbanBoard>`. Place it directly inside the root fragment or the `<ErrorBoundary>`:

**After Story 9.3:**
```tsx
export default function App() {
  return (
    <ErrorBoundary>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-violet-600 focus:text-white focus:rounded-md focus:text-sm focus:font-medium"
      >
        Skip to main content
      </a>
      <KanbanBoard />
    </ErrorBoundary>
  )
}
```

`sr-only` is Tailwind's visually hidden class: `position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0,0,0,0)`. `focus:not-sr-only` reverts it to a visible element when focused. This pattern is the standard skip link technique.

**Why `focus:` not `focus-visible:`:** Skip links are always activated intentionally (keyboard Tab) — `focus:` is correct here. `focus-visible:` would hide the link when focused via mouse, but skip links are keyboard-only features so `focus:` is the appropriate pseudo-class.

### DnD Accessibility Announcements — COLUMN_LABELS Constant

Define `COLUMN_LABELS` as a module-level constant to avoid recreation on each render. The `onDragOver` callback receives `over.id` which may be a column status string or a task id (when dragging over a card within a column). The `COLUMN_LABELS` map handles column ids; if `over.id` is a task id, the fallback `?? String(over.id)` will announce the task id (not ideal but acceptable — the drag-over-card case is uncommon in keyboard drag).

```typescript
const COLUMN_LABELS: Record<string, string> = {
  'todo': 'Todo',
  'in-progress': 'In Progress',
  'done': 'Done',
} as const
```

Place this above the `KanbanBoard` function. It does not need to be inside the component.

### useTasks in KanbanBoard

`KanbanBoard` currently does not call `useTasks()` directly — each `BoardColumn` reads its own tasks. For the DnD announcements to include the task title in `onDragStart`, `KanbanBoard` needs access to `tasks`. Adding `const tasks = useTasks()` in `KanbanBoard` is safe and will not cause unnecessary re-renders because:

1. `BoardStateContext` value is `tasks[]` directly (not wrapped in an object)
2. `useTasks()` returns the same reference when tasks haven't changed
3. `KanbanBoard` already re-renders when tasks change (its children do), so one additional `useTasks()` call adds minimal overhead

```typescript
export function KanbanBoard() {
  const tasks = useTasks()  // ← add this
  const { isOpen, mode, editingTask, prefillValues, openCreate, openEdit, close } = useTaskModal()
  const { sensors, activeTask, handleDragStart, handleDragOver, handleDragEnd } = useBoardDnd()
  // ...
}
```

### Reduced Motion CSS — Why Global Override

The `@media (prefers-reduced-motion: reduce)` block with `!important` is the recommended approach from the WCAG 2.1 specification for motion-sensitive content. It is placed in `index.css` rather than using Tailwind's `motion-reduce:` prefix on individual elements because:

1. `cardPulse` is defined in `index.css` as a CSS class, not a Tailwind utility — `motion-reduce:` cannot target it without refactoring
2. `animate-spin` from Tailwind is used on the spinner — adding `motion-reduce:animate-none` to the spinner element would require modifying `TaskCard.tsx`
3. The global override catches all third-party library animations (Sonner toast slide-ins, shadcn dialog fade-ins) without requiring per-element changes

The global `!important` approach is safe because it only activates under the media query condition — normal users are unaffected.

### Modal Focus on Delete

When a user deletes a task via the modal Delete button, the modal closes and the task card is removed from the DOM. The `triggerRef` in `useTaskModal` holds a reference to the element that opened the modal (the task card). After deletion, that element no longer exists in the DOM.

`triggerRef.current?.focus()` — the `?.` operator prevents a null dereference. However, calling `.focus()` on a detached DOM element is a no-op in most browsers, causing focus to fall to `<body>`.

This is an acceptable limitation for MVP. Document in Review Findings: "After task delete, focus falls to `<body>` rather than a meaningful element. A post-MVP improvement would focus the column's 'Add task' button." Do NOT fix this in this story — the scope is too large and the existing behavior is not actively harmful.

### UndoHintBar aria-live (Epic 7.3 Forward Note)

When Story 7.3 implements `UndoHintBar`, the component must include:
```tsx
<div
  role="status"
  aria-live="polite"
  aria-atomic="false"
>
  {/* Undo/Redo label content */}
</div>
```

`aria-live="polite"` announces changes at the next opportunity without interrupting the user.
`aria-atomic="false"` allows partial updates to be announced (individual label changes, not the whole bar).
`role="status"` is the semantic ARIA role for status bars — it implies `aria-live="polite"` by default, but being explicit is clearer.

### ConflictModal Focus (Epic 6.3 Forward Note)

When Story 6.3 implements `ConflictModal`, the initial focus must go to the "Keep mine" button (not the title or first focusable element):
```tsx
// In ConflictModal, the "Keep mine" button:
<Button autoFocus onClick={handleKeepMine}>
  Keep mine
</Button>
```

The conflict modal uses `role="alertdialog"` (not just `role="dialog"`) because it requires immediate user attention. The `@base-ui/react` Dialog component handles the focus trap; `autoFocus` on "Keep mine" sets the initial focus within the trap.

### Sonner Toast aria-live Investigation

Sonner v2's `<Toaster>` renders an `ol` element with `aria-live="polite"` for all toasts. This means error toasts (which should be `assertive`) use `polite` by default. To promote error toasts to assertive announcements, Sonner would need to render them in a separate `aria-live="assertive"` region.

If Sonner v2 does not support per-toast `aria-live` levels natively, two options exist:
1. Accept `polite` for error toasts (less ideal but still accessible)
2. Create a hidden assertive live region and inject error messages into it alongside the Sonner toast

For MVP, option 1 is acceptable. Document in Review Findings if Sonner does not support assertive natively.

### In-Flight Card Without Animation

With `prefers-reduced-motion: reduce` active, the in-flight card's visual state is:
- Violet ring border (`border-violet-600`) — visible, static
- `card-pulse` class present but animation suppressed — no glow pulse
- Spinner div visible as a static quarter-circle arc — no spinning
- `aria-busy="true"` — screen reader announces the loading state

The card is still clearly differentiated from normal cards via the violet border. This satisfies WCAG's requirement that motion removal does not cause loss of functionality or information.

### File Paths

```
src/App.tsx                                         ← add skip link
src/features/board/components/KanbanBoard.tsx       ← add DnD accessibility announcements; useTasks()
src/index.css                                       ← add prefers-reduced-motion media query
src/shared/components/ToastProvider.tsx             ← verify Sonner aria-live (may be no-op)
_bmad-output/implementation-artifacts/sprint-status.yaml
```

### Forbidden Patterns

- `focus:outline-none` without ring replacement (not new in this story, but validate no regressions)
- `dangerouslySetInnerHTML` — never, even for skip link or aria content
- `any` type
- Inline `style=` for accessibility-sensitive visibility — use Tailwind `sr-only`/`focus:not-sr-only`
- Adding `aria-live="assertive"` to non-error content — assertive interrupts screen reader; use only for errors
- Barrel `index.ts` exports

### Verification Checklist

After implementing, verify:

```
1. Tab once on page load: "Skip to main content" link becomes visible (violet bar)
2. Press Enter on skip link: focus jumps to the board main area (past the header)
3. Open create modal (N): focus lands on title input
4. Open edit modal (click a card): focus lands on title on desktop, status trigger on mobile emulation
5. Close modal via Cancel: focus returns to the element that opened it
6. Close modal via Save: focus returns to trigger
7. Close modal via Escape: focus returns to trigger
8. DevTools → Rendering → Emulate CSS media feature: prefers-reduced-motion → reduce
   - Task cards with pending ops: violet ring visible, no animation
   - Spinner visible as static arc, no spinning
   - DragOverlay transition still appears (scale) but no fade animation
9. Screen reader (VoiceOver or NVDA): drag a card via keyboard →
   - "Picked up task '[title]'" announced on Space
   - "Dragging over [column] column" announced on Arrow key
   - "Task dropped in [column] column" announced on Space drop
10. Error toast appears after mock API failure: verify it is announced by screen reader
11. TypeScript: tsc --noEmit → zero errors
12. npm run lint → zero warnings
13. All 100+ tests pass
```

---

## Dev Agent Record

### Agent Model Used
_TBD_

### Debug Log References
_None_

### Completion Notes List
_TBD_

### File List
_TBD_

### Change Log
_TBD_

### Review Findings
_TBD_
