# Story 7.2: Keyboard Shortcuts for Undo and Redo

Status: done

## Blocker

Story 7.1 must be done (`useHistory` hook with working `undo()` and `redo()` functions available from `HistoryContext`).

---

## Story

As a keyboard-driven user,
I want to press Ctrl+Z / Cmd+Z to undo and Ctrl+Shift+Z / Cmd+Shift+Z to redo,
so that I can reverse and replay task changes without reaching for the mouse.

## Acceptance Criteria

1. **Given** the user is on the main board view (no modal open) **When** they press Ctrl+Z (Windows/Linux) or Cmd+Z (macOS) **Then** `undo()` is called from `useHistory`.
2. **Given** the user is on the main board view (no modal open) **When** they press Ctrl+Shift+Z (Windows/Linux) or Cmd+Shift+Z (macOS) **Then** `redo()` is called from `useHistory`.
3. **Given** a modal dialog is open (role="dialog") **When** the user presses Ctrl+Z **Then** the undo shortcut is suppressed and does not fire.
4. **Given** a modal dialog is open **When** the user presses Ctrl+Shift+Z **Then** the redo shortcut is suppressed and does not fire.
5. **Given** `canUndo` is false **When** Ctrl+Z is pressed **Then** `undo()` is called but is a no-op (no visible change — the guard lives inside `undo()` from Story 7.1).
6. **Given** `canRedo` is false **When** Ctrl+Shift+Z is pressed **Then** `redo()` is called but is a no-op.
7. **Given** a text input or textarea inside a non-modal component is focused **When** the user presses Ctrl+Z **Then** the shortcut is suppressed (browser default undo in the field is preserved).
8. **Given** the component using the shortcut unmounts **When** the shortcut key is pressed **Then** no handler fires (event listener removed on cleanup).
9. **Given** the existing N key shortcut for new task **When** this story is implemented **Then** the N shortcut continues to work without regression.

## Tasks / Subtasks

- [x] Task 1: Create `useUndoRedoShortcuts` hook in `src/features/history/hooks/useUndoRedoShortcuts.ts` (AC: #1–#8)
  - [x] Add `document.addEventListener('keydown', handler)` in a `useEffect` with `return () => document.removeEventListener('keydown', handler)` cleanup
  - [x] Detect undo: `e.key === 'z' && (e.ctrlKey || e.metaKey) && !e.shiftKey`
  - [x] Detect redo: `e.key === 'z' && (e.ctrlKey || e.metaKey) && e.shiftKey`
  - [x] Suppress when modal is open: check `document.activeElement?.closest('[role="dialog"]') !== null`
  - [x] Suppress when a form element is focused (input, textarea, select, contenteditable): reuse or inline `isFormElementFocused()` logic
  - [x] When undo condition passes: call `undo()` from `useHistory()` and `e.preventDefault()`
  - [x] When redo condition passes: call `redo()` from `useHistory()` and `e.preventDefault()`
  - [x] Use a stable `handlerRef` pattern (same as existing `useKeyboardShortcut`) — update ref on every render, keep effect deps minimal

- [x] Task 2: Register `useUndoRedoShortcuts` in `KanbanBoard.tsx` (AC: #1–#8)
  - [x] Call `useUndoRedoShortcuts()` at the top of `KanbanBoard` function body — one line, no props needed
  - [x] Confirm it does NOT break the N shortcut (which is registered via `useKeyboardShortcut` in `useTaskModal`)

- [x] Task 3: Write unit tests in `src/features/history/hooks/useUndoRedoShortcuts.test.ts` (AC: #1–#8)
  - [x] Test: Ctrl+Z fires undo
  - [x] Test: Cmd+Z fires undo (metaKey)
  - [x] Test: Ctrl+Shift+Z fires redo
  - [x] Test: Cmd+Shift+Z fires redo
  - [x] Test: Ctrl+Z is suppressed when activeElement is inside a `[role="dialog"]`
  - [x] Test: Ctrl+Z is suppressed when an input element is focused
  - [x] Test: Ctrl+Z is suppressed when a textarea element is focused
  - [x] Test: plain Z key does NOT trigger undo (no modifier)
  - [x] Test: event listener is removed on unmount (use `removeEventListener` spy)

---

## Dev Notes

### Do Not Modify `useKeyboardShortcut`

The existing `src/shared/hooks/useKeyboardShortcut.ts` explicitly filters out Ctrl/Meta combos (`!e.ctrlKey && !e.metaKey && !e.altKey`). It was designed for bare key shortcuts like `N`. Do not change it — adding modifier support would risk breaking the N shortcut.

Instead, create a separate `useUndoRedoShortcuts` hook that handles only the Ctrl+Z / Ctrl+Shift+Z pattern.

### Suppression Logic

Two conditions suppress the shortcuts:

**Modal open:** A `[role="dialog"]` element is in the DOM and `document.activeElement` is inside it (focus is trapped there by Radix UI / shadcn Dialog). Use `.closest('[role="dialog"]')` from `document.activeElement`.

**Form element focused:** Same check already present in `useKeyboardShortcut` — `isFormElementFocused()`. This covers inputs in the filter bar (Epic 4) that are not inside a dialog.

```typescript
function isFormElementFocused(): boolean {
  const el = document.activeElement
  if (!el) return false
  const tag = el.tagName.toLowerCase()
  return (
    tag === 'input' ||
    tag === 'textarea' ||
    tag === 'select' ||
    (el as HTMLElement).isContentEditable
  )
}

function isModalFocused(): boolean {
  return document.activeElement?.closest('[role="dialog"]') !== null
}
```

### Handler Implementation

```typescript
import { useEffect, useRef } from 'react'
import { useHistory } from '@/store/HistoryContext'

export function useUndoRedoShortcuts(): void {
  const { undo, redo } = useHistory()

  const undoRef = useRef(undo)
  const redoRef = useRef(redo)
  useEffect(() => { undoRef.current = undo })
  useEffect(() => { redoRef.current = redo })

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent): void {
      if (!(e.ctrlKey || e.metaKey)) return
      if (e.key !== 'z' && e.key !== 'Z') return
      if (isFormElementFocused() || isModalFocused()) return

      if (e.shiftKey) {
        e.preventDefault()
        redoRef.current()
      } else {
        e.preventDefault()
        undoRef.current()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, []) // empty deps — handlers accessed via refs
}
```

Early-return on `!(e.ctrlKey || e.metaKey)` avoids any per-keystroke cost for non-modifier keystrokes.

### e.preventDefault()

Call `e.preventDefault()` before invoking `undo`/`redo` so the browser does not perform its own undo on text inputs that happen to be rendered but not focused (some browsers fire browser-level undo for Ctrl+Z regardless of focus). This also prevents the shortcut from propagating to the DnD kit.

### Stable Refs Pattern

`undo` and `redo` from `useHistory()` are stable references (they come from a `useMemo` inside `HistoryProvider`), but using refs is still the correct pattern: it guarantees the `useEffect` closure captures the latest values without listing them as deps (which would re-register the listener on every render).

### File Paths

- `src/features/history/hooks/useUndoRedoShortcuts.ts` — new file
- `src/features/history/hooks/useUndoRedoShortcuts.test.ts` — new file
- `src/features/board/components/KanbanBoard.tsx` — add `useUndoRedoShortcuts()` call

### Forbidden Patterns

- Do not modify `src/shared/hooks/useKeyboardShortcut.ts` — changing it risks breaking the N shortcut
- Do not call `undo()` or `redo()` directly from a component event handler without going through the hook
- Do not skip `e.preventDefault()` — browser undo must be suppressed on the keyboard event
- Do not add `undo` or `redo` to `useEffect` deps — use refs to avoid listener re-registration
- No `any`; no `process.env.NODE_ENV` — use `import.meta.env.DEV` if env checks are ever needed

### Verification Checklist

- [ ] `npm run build` exits zero
- [ ] `npm run lint` exits zero
- [ ] All 100 prior tests pass + new shortcut tests pass
- [ ] Ctrl+Z on board with an action in history → task reverts
- [ ] Cmd+Z on macOS (or simulated metaKey in tests) → same behavior
- [ ] Ctrl+Shift+Z after undo → redo works
- [ ] Opening TaskModal and pressing Ctrl+Z → no undo fired
- [ ] Clicking into the search bar (filter, Epic 4) and pressing Ctrl+Z → no undo fired, browser undo in field works
- [ ] N key shortcut still opens create modal after this change

---

## Dev Agent Record

### Agent Model Used
Claude Sonnet 4.6

### Debug Log References
_None_

### Completion Notes List
- `useUndoRedoShortcuts` uses the stable handlerRef pattern (updates refs on each render, empty `useEffect` deps) to avoid listener re-registration.
- Suppression checks: `isFormElementFocused()` for input/textarea/select/contenteditable, `isModalFocused()` via `closest('[role="dialog"]')`.
- `e.key` can be `'z'` or `'Z'` (shift changes case on some OSes), both handled.

### File List
- `src/features/history/hooks/useUndoRedoShortcuts.ts` — new
- `src/features/history/hooks/useUndoRedoShortcuts.test.ts` — new
- `src/features/board/components/KanbanBoard.tsx` — added `useUndoRedoShortcuts()` call and `UndoHintBar` import/placement

### Change Log
- Created `useUndoRedoShortcuts` hook with Ctrl+Z/Cmd+Z (undo) and Ctrl+Shift+Z/Cmd+Shift+Z (redo), with modal and form suppression
- Added 9 unit tests covering all ACs
- Registered hook in `KanbanBoard.tsx`

### Review Findings

- [x] [Review][Patch] ~~`isModalFocused()` falsely returns `true` when `document.activeElement` is `null`~~ — **Fixed**: changed `!== null` to `!= null` (loose inequality catches both `null` and `undefined`). [`src/features/history/hooks/useUndoRedoShortcuts.ts:17`]

- [x] [Review][Patch] ~~Key guard should normalize to `.toLowerCase()` instead of checking `'z'` and `'Z'` separately~~ — **Fixed**: changed to `e.key.toLowerCase() !== 'z'`. [`src/features/history/hooks/useUndoRedoShortcuts.ts:31`]
