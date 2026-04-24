# Story 7.3: Undo Hint Bar Component

Status: ready-for-dev

## Blocker

Story 7.1 must be done (`HistoryContext` provides `canUndo`, `undoLabel`, `canRedo`, `redoLabel`, `undo`, `redo`).
Story 7.2 should be done before this story so keyboard shortcuts can be verified working alongside the visual bar.

---

## Story

As a user of the Kanban board,
I want a persistent undo/redo hint bar always visible below the header,
so that I can see at a glance what action is available to undo or redo and trigger it with a single click.

## Acceptance Criteria

1. **Given** the board is loaded with no history **When** the user views the UndoHintBar **Then** it shows the static text "Nothing to undo" in muted color.
2. **Given** the user performs any task action **When** the UndoHintBar re-renders **Then** it shows an Undo button with label `Undo: [undoLabel]` (e.g. "Undo: Move 'Fix bug' to Done").
3. **Given** `canUndo = true` **When** the user clicks the Undo button **Then** `undo()` is called from `useHistory`.
4. **Given** `canRedo = true` **When** the UndoHintBar re-renders **Then** a Redo button is visible on the right side showing `Redo: [redoLabel]`.
5. **Given** `canRedo = true` **When** the user clicks the Redo button **Then** `redo()` is called from `useHistory`.
6. **Given** `canRedo = false` **When** the UndoHintBar re-renders **Then** no Redo button is visible.
7. **Given** any board state **When** the UndoHintBar is rendered **Then** it is always visible — it never collapses, hides, or changes height.
8. **Given** a screen reader is used **When** the UndoHintBar updates after an action **Then** the update is announced politely via `aria-live="polite"`.
9. **Given** any interactive element in the bar **When** focused **Then** a visible focus ring appears (`focus-visible:ring-2 focus-visible:ring-violet-500`).
10. **Given** the bar is rendered on a touch device **When** the user inspects button dimensions **Then** each button has a minimum tap target of 44×44px.
11. **Given** the board layout **When** the UndoHintBar is placed in `KanbanBoard.tsx` **Then** it appears below the header/filter bar area and above the three column grid.

## Tasks / Subtasks

- [ ] Task 1: Implement `UndoHintBar` component in `src/features/history/components/UndoHintBar.tsx` (AC: #1–#10)
  - [ ] Call `useHistory()` to get `{ canUndo, undoLabel, canRedo, redoLabel, undo, redo }`
  - [ ] Render a single `<div>` container with `aria-live="polite"` and `aria-atomic="false"`
  - [ ] Fixed layout: `flex items-center justify-between px-4 py-1 border-b border-zinc-200 bg-white min-h-[44px]`
  - [ ] Left side: when `canUndo = false`, render `<span className="text-xs text-zinc-500">Nothing to undo</span>`; when `canUndo = true`, render an Undo ghost button
  - [ ] Right side: when `canRedo = true`, render a Redo ghost button; when `canRedo = false`, render nothing (no placeholder)
  - [ ] Undo button: `<button>` with `undo-2` icon (lucide-react) + text `Undo: {undoLabel}`, `onClick={undo}`, ghost styling, min 44×44px touch target, `aria-label={`Undo: ${undoLabel}`}`
  - [ ] Redo button: `<button>` with `redo-2` icon (lucide-react) + text `Redo: {redoLabel}`, `onClick={redo}`, ghost styling, min 44×44px touch target, `aria-label={`Redo: ${redoLabel}`}`
  - [ ] Apply `focus-visible:ring-2 focus-visible:ring-violet-500 rounded` on both buttons; never `focus:outline-none` alone
  - [ ] Use `cn()` helper for all conditional className composition

- [ ] Task 2: Place `UndoHintBar` in `KanbanBoard.tsx` (AC: #11)
  - [ ] Add `<UndoHintBar />` between the `{/* FilterBar — Story 4.2 */}` comment and the `<DndContext>` block
  - [ ] No props needed — `UndoHintBar` reads context directly

- [ ] Task 3: Write component tests in `src/features/history/components/UndoHintBar.test.tsx` (AC: #1–#8)
  - [ ] Test: renders "Nothing to undo" when `canUndo = false`
  - [ ] Test: renders undo button with correct label when `canUndo = true`
  - [ ] Test: clicking undo button calls `undo()`
  - [ ] Test: renders redo button with correct label when `canRedo = true`
  - [ ] Test: clicking redo button calls `redo()`
  - [ ] Test: redo button absent when `canRedo = false`
  - [ ] Test: container has `aria-live="polite"`
  - [ ] Inject `HistoryContext` via test wrapper providing mock `{ canUndo, undoLabel, canRedo, redoLabel, undo, redo }`

---

## Dev Notes

### Component Structure

```tsx
import { Undo2, Redo2 } from 'lucide-react'
import { cn } from '@/shared/utils/cn'
import { useHistory } from '@/store/HistoryContext'

export function UndoHintBar() {
  const { canUndo, undoLabel, canRedo, redoLabel, undo, redo } = useHistory()

  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="flex items-center justify-between px-4 py-1 border-b border-zinc-200 bg-white min-h-[44px]"
    >
      <div className="flex items-center">
        {canUndo ? (
          <button
            onClick={undo}
            aria-label={`Undo: ${undoLabel}`}
            className={cn(
              'flex items-center gap-1.5 text-xs text-zinc-700 px-2 py-1 rounded',
              'hover:bg-zinc-100 min-h-[44px] min-w-[44px]',
              'focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:outline-none'
            )}
          >
            <Undo2 className="h-3.5 w-3.5" aria-hidden="true" />
            Undo: {undoLabel}
          </button>
        ) : (
          <span className="text-xs text-zinc-500 px-2 py-1">Nothing to undo</span>
        )}
      </div>

      <div className="flex items-center">
        {canRedo && (
          <button
            onClick={redo}
            aria-label={`Redo: ${redoLabel}`}
            className={cn(
              'flex items-center gap-1.5 text-xs text-zinc-700 px-2 py-1 rounded',
              'hover:bg-zinc-100 min-h-[44px] min-w-[44px]',
              'focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:outline-none'
            )}
          >
            <Redo2 className="h-3.5 w-3.5" aria-hidden="true" />
            Redo: {redoLabel}
          </button>
        )}
      </div>
    </div>
  )
}
```

### Always Visible

The bar must always occupy space even when showing "Nothing to undo". Use `min-h-[44px]` on the container (not a conditional render), so the layout does not shift when history state changes. Never use `hidden` or `display: none` on the container.

### aria-live Strategy

`aria-live="polite"` on the container means screen readers announce changes when the user is idle. `aria-atomic="false"` allows the reader to announce only the changed portion (e.g., the new undo label) rather than re-reading the entire bar. This matches the planning requirement: "UndoHintBar aria-live=polite".

### Ghost Button Styling

Design spec: "Ghost transparent (Clear all, Cancel, Redo, Add task dashed)". Ghost buttons have no background at rest, only a hover state. Do not use the shadcn `Button` component with `variant="ghost"` here — the plain `<button>` with Tailwind classes gives more precise control over sizing and avoids shadcn's default height constraints interfering with the 44px minimum touch target.

### Placement in KanbanBoard

The existing `KanbanBoard.tsx` already has a placeholder comment:
```tsx
{/* FilterBar — Story 4.2 */}
{/* UndoHintBar — Epic 7 */}
```
Replace the `{/* UndoHintBar — Epic 7 */}` comment with `<UndoHintBar />`. The FilterBar placeholder stays as a comment since Epic 4 is not yet implemented.

### Test Wrapper for HistoryContext

`HistoryContext` was updated in Story 7.1 to default to `null` (same pattern as `BoardAPIContext`). Tests must wrap the component with a mock provider:

```tsx
import { createContext } from 'react'
import type { HistoryContextType } from '@/store/HistoryContext'

// Re-export the context object for test injection — same pattern as BoardAPIContext
function renderWithHistory(ui: React.ReactElement, value: HistoryContextType) {
  // import the raw context object from HistoryContext.tsx for wrapping
  return render(
    <HistoryContext.Provider value={value}>
      {ui}
    </HistoryContext.Provider>
  )
}
```

This requires `HistoryContext` (the raw context object) to be exported from `src/store/HistoryContext.tsx` for test injection — add `export const HistoryContext` if it is not already exported (it was not exported in the stub).

### lucide-react Icon Names

- Undo icon: `Undo2` (import `{ Undo2 }` from `lucide-react`)
- Redo icon: `Redo2` (import `{ Redo2 }` from `lucide-react`)

These are the correct lucide-react v1.x names. `Undo` and `Redo` also exist but `Undo2`/`Redo2` match the curved arrow style referenced in the epic spec (`undo-2` and `redo-2`).

### File Paths

- `src/features/history/components/UndoHintBar.tsx` — new file
- `src/features/history/components/UndoHintBar.test.tsx` — new file
- `src/features/board/components/KanbanBoard.tsx` — add `<UndoHintBar />` import and placement
- `src/store/HistoryContext.tsx` — export `HistoryContext` raw object (if not already exported by Story 7.1)

### Forbidden Patterns

- Never `focus:outline-none` on the buttons without the `focus-visible:ring-2` replacement
- Never conditionally render the outer container — it must always be present in the DOM (use conditional inner content instead)
- Never hardcode hex colors — use Tailwind tokens only
- No `aria-live="assertive"` — spec requires `"polite"` for the undo bar
- Do not use `dangerouslySetInnerHTML`
- No default export — named export `UndoHintBar` only

### Verification Checklist

- [ ] `npm run build` exits zero
- [ ] `npm run lint` exits zero
- [ ] All prior tests pass + new UndoHintBar tests pass
- [ ] Bar is visible in the DOM with no history ("Nothing to undo" text present)
- [ ] After creating a task: bar shows `Undo: Create task "..."` button
- [ ] Clicking Undo button → task removed (undo fires)
- [ ] After undo: bar shows `Redo: Create task "..."` button on right side
- [ ] Clicking Redo button → task restored (redo fires)
- [ ] Ctrl+Z keyboard shortcut (Story 7.2) and the click button both trigger the same `undo()`
- [ ] Bar height does not change between "Nothing to undo" and active undo state
- [ ] Screen reader test: performing a task action and waiting → reader announces the new undo label

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
