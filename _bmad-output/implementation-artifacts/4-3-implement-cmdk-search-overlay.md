# Story 4.3: Implement ⌘K Search Overlay

Status: ready-for-dev

## Blocker

**Do NOT start until Story 4.2 is marked `done`.**  
Story 4.3 builds on the FilterBar (4.2) and assumes `filterTasks` is already wired into `BoardColumn` (4.1). The ⌘K overlay syncs its search query with `FilterContext.searchQuery`, and the board must already react to filter changes.

---

## Story

As a user,
I want a keyboard-triggered search overlay that fuzzy-searches tasks with MRU surfacing,
so that power users can find tasks faster than using the visible filter bar.

## Acceptance Criteria

1. **Given** the board is focused  
   **When** the user presses ⌘K (macOS) or Ctrl+K (Windows/Linux) from anywhere on the page  
   **Then** the ⌘K search overlay opens instantly with focus moved to the search input  
   **And** the shortcut is suppressed when a modal (`Dialog`) has focus

2. **Given** the overlay is open  
   **When** the user types in the search input  
   **Then** matching tasks from all columns are shown in a results list (client-side, < 50ms)  
   **And** results are filtered case-insensitively across task title and description  
   **And** most recently viewed tasks surface first in the empty-query state (MRU)

3. **Given** the user selects a result  
   **When** clicked or activated via Enter/arrow keys  
   **Then** the overlay closes and `filterAPI.resetFilters()` is called  
   **And** the board scrolls to and highlights the selected task card

4. **Given** the overlay is open  
   **When** the user presses Escape  
   **Then** the overlay closes and `filterAPI.resetFilters()` is called  
   **And** focus returns to the previously focused element

5. **Given** the overlay component  
   **When** rendered  
   **Then** it uses `CommandDialog` (role="dialog" + combobox input), focus is trapped inside, and Escape closes it  
   **And** the search updates `FilterContext.searchQuery` so the board behind reflects the query in real time

## Tasks / Subtasks

- [ ] Task 1: Install shadcn Command component (AC: #5)
  - [ ] Run `npx shadcn@latest add command` — installs `cmdk` + `src/components/ui/command.tsx`
  - [ ] Verify `src/components/ui/command.tsx` exists after install

- [ ] Task 2: Extend `useKeyboardShortcut` to support modifier keys (AC: #1)
  - [ ] Add optional `options` parameter: `{ ctrl?: boolean; shift?: boolean }`
  - [ ] When `options.ctrl === true`, require `e.ctrlKey || e.metaKey` (cross-platform ⌘/Ctrl)
  - [ ] When `options.ctrl` is falsy, keep existing behavior (block modifier combos)
  - [ ] Backward-compatible: all existing callers pass no options and are unaffected

- [ ] Task 3: Build `CmdKOverlay` component (AC: #1–#5)
  - [ ] Create `src/features/filters/components/CmdKOverlay.tsx`
  - [ ] Use `CommandDialog`, `CommandInput`, `CommandList`, `CommandEmpty`, `CommandItem` from `@/components/ui/command`
  - [ ] Track `isOpen` state locally (`useState`)
  - [ ] Use extended `useKeyboardShortcut('k', openOverlay, { ctrl: true })` to open overlay
  - [ ] On open: focus managed automatically by `CommandDialog` (radix Dialog)
  - [ ] Search query drives two things: (1) `commandValue` state for filtering results in the overlay, (2) `filterAPI.setSearch(query)` so the board updates live
  - [ ] Derive visible results: `filterTasks(allTasks, { ...emptyFilters, searchQuery: commandValue })`
  - [ ] MRU: track last 5 viewed task IDs in `useRef<string[]>`; update on task selection; show MRU tasks first when query is empty
  - [ ] On result select: call `handleSelect(task)` — see Dev Notes
  - [ ] On close (Escape or backdrop): call `handleClose()` — see Dev Notes
  - [ ] Add `id={`task-${task.id}`}` to the `<article>` element in `TaskCard` for scroll-to support

- [ ] Task 4: Mount `CmdKOverlay` in `KanbanBoard` (AC: #1)
  - [ ] Import and render `<CmdKOverlay />` inside `KanbanBoard` (after `<FilterBar />`)
  - [ ] No props needed — overlay manages its own open state

- [ ] Task 5: Write tests (AC: all)
  - [ ] Create `src/features/filters/components/CmdKOverlay.test.tsx`
  - [ ] Test: overlay opens when ⌘K/Ctrl+K pressed (simulate keydown with `ctrlKey: true, key: 'k'`)
  - [ ] Test: overlay does not open when plain 'k' pressed (no modifier)
  - [ ] Test: typing in input calls `filterAPI.setSearch`
  - [ ] Test: results list shows tasks matching the query
  - [ ] Test: selecting a result closes the overlay and calls `filterAPI.resetFilters`
  - [ ] Test: Escape closes overlay and calls `filterAPI.resetFilters`
  - [ ] Test `useKeyboardShortcut` extension: `{ ctrl: true }` fires on ctrlKey combo; does NOT fire without modifier

---

## Dev Notes

### Install Command Component

```bash
npx shadcn@latest add command
```

This installs `src/components/ui/command.tsx` and adds `cmdk` to package.json. The `CommandDialog` wraps Radix `Dialog`, providing focus trap and Escape handling automatically. `CommandInput` sets `role="combobox"` and `aria-expanded`.

### Extending `useKeyboardShortcut`

File: `src/shared/hooks/useKeyboardShortcut.ts`

Current signature: `useKeyboardShortcut(key: string, handler: () => void): void`

Extended signature (backward-compatible):
```typescript
type ShortcutOptions = {
  ctrl?: boolean   // require ctrlKey OR metaKey (cross-platform Ctrl+K / ⌘K)
  shift?: boolean  // require shiftKey
}

export function useKeyboardShortcut(
  key: string,
  handler: () => void,
  options: ShortcutOptions = {}
): void {
  const handlerRef = useRef(handler)
  useEffect(() => { handlerRef.current = handler })

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key.toLowerCase() !== key.toLowerCase()) return

      if (options.ctrl) {
        if (!e.ctrlKey && !e.metaKey) return
      } else {
        if (e.ctrlKey || e.metaKey || e.altKey) return
      }

      if (options.shift !== undefined) {
        if (e.shiftKey !== options.shift) return
      }

      handlerRef.current()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [key, options.ctrl, options.shift])
}
```

**Why:** Epic 7 will also need `{ ctrl: true }` for ⌘Z and `{ ctrl: true, shift: true }` for ⌘⇧Z. Extending now avoids a second refactor. The `options` param is optional with `= {}` so all existing callers (`'n'` shortcut in `useTaskModal.ts`) are unaffected.

### CmdKOverlay — Key Implementation Details

File: `src/features/filters/components/CmdKOverlay.tsx`

```typescript
import { useState, useRef } from 'react'
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandItem,
} from '@/components/ui/command'
import { useTasks } from '@/store/BoardStateContext'
import { useFilterAPI } from '@/store/FilterAPIContext'
import { filterTasks } from '@/features/filters/utils/filterTasks'
import { useKeyboardShortcut } from '@/shared/hooks/useKeyboardShortcut'
import type { Task } from '@/types/task.types'

const MAX_MRU = 5

export function CmdKOverlay() {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const mruRef = useRef<string[]>([])
  const allTasks = useTasks()
  const filterAPI = useFilterAPI()

  useKeyboardShortcut('k', () => setIsOpen(true), { ctrl: true })

  const results: Task[] = query.trim()
    ? filterTasks(allTasks, { assignee: null, priority: null, searchQuery: query })
    : mruRef.current
        .map(id => allTasks.find(t => t.id === id))
        .filter((t): t is Task => t !== undefined)

  function handleQueryChange(value: string) {
    setQuery(value)
    filterAPI.setSearch(value)
  }

  function handleSelect(task: Task) {
    // record MRU
    mruRef.current = [task.id, ...mruRef.current.filter(id => id !== task.id)].slice(0, MAX_MRU)

    setIsOpen(false)
    setQuery('')
    filterAPI.resetFilters()

    // scroll to card after render
    requestAnimationFrame(() => {
      document.getElementById(`task-${task.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    })
  }

  function handleClose() {
    setIsOpen(false)
    setQuery('')
    filterAPI.resetFilters()
  }

  return (
    <CommandDialog open={isOpen} onOpenChange={open => { if (!open) handleClose() }}>
      <CommandInput
        placeholder="Search tasks…"
        value={query}
        onValueChange={handleQueryChange}
      />
      <CommandList>
        <CommandEmpty>No tasks found.</CommandEmpty>
        {results.map(task => (
          <CommandItem
            key={task.id}
            value={task.title}
            onSelect={() => handleSelect(task)}
          >
            <span className="text-sm font-medium">{task.title}</span>
            <span className="ml-auto text-xs text-zinc-400 capitalize">{task.status}</span>
          </CommandItem>
        ))}
      </CommandList>
    </CommandDialog>
  )
}
```

### Adding `id` to TaskCard

In `src/features/tasks/components/TaskCard.tsx`, add `id={`task-${task.id}`}` to the root `<article>` element:

```tsx
<article
  id={`task-${task.id}`}
  role="article"
  aria-label={task.title}
  // ... existing props
>
```

This is a non-breaking, additive change. No tests need updating for this addition alone.

### ⌘K Shortcut Suppression Inside Modals

`CommandDialog` is a Radix `Dialog`. When `TaskModal` or `ConflictModal` is open, the `Dialog` backdrop captures events via `aria-modal` and `inert` attribute on the rest of the document. The Ctrl+K handler won't fire inside a modal because `document.addEventListener` events on the backdrop-trapped content are stopped at the dialog boundary by Radix's focus trap.

**Caveat:** This is Radix's behavior — do not add extra suppression logic unless testing reveals a gap.

### MRU Behavior

- `mruRef` is a `useRef` (not `useState`) — MRU changes do NOT cause re-renders
- Max 5 entries; deduplicated on each selection
- Cleared only when component unmounts (no persistence — session-only per spec)
- Empty query state: shows up to 5 MRU tasks; if no MRU history yet, shows empty state ("No tasks found.")

### FilterContext Sync Behavior

While the overlay is open and the user types, `filterAPI.setSearch(query)` is called. The board behind the overlay (visible through the semi-transparent backdrop) updates in real time. On close (either via select or Escape), `filterAPI.resetFilters()` is called to clear the search, leaving the board in its unfiltered state.

**Why `resetFilters()` on select (not just `setSearch('')`):** Ensures any prior assignee/priority filters from the filter bar are also cleared, giving the user a clean board view focused on the selected task.

### CommandDialog Accessibility

`CommandDialog` from shadcn wraps Radix `Dialog`:
- Focus trap: automatic via Radix Dialog
- Escape handling: automatic — fires `onOpenChange(false)` which triggers `handleClose()`
- `role="combobox"` on the `CommandInput`: set automatically by cmdk
- `aria-expanded="true"` when open: set automatically

No manual ARIA attributes needed beyond what shadcn/cmdk provides.

### File Paths

```
src/components/ui/command.tsx                         ← created by shadcn install
src/shared/hooks/useKeyboardShortcut.ts               ← extend with options param
src/features/filters/components/CmdKOverlay.tsx       ← new
src/features/filters/components/CmdKOverlay.test.tsx  ← new
src/features/tasks/components/TaskCard.tsx            ← add id={`task-${task.id}`} to <article>
src/features/board/components/KanbanBoard.tsx         ← mount <CmdKOverlay />
```

### Verification Checklist

```
1. npx shadcn@latest add command → src/components/ui/command.tsx exists
2. tsc --noEmit → zero errors
3. npm run test → all tests pass
4. Press Ctrl+K / ⌘K → overlay opens, search input focused
5. Type a task title → matching tasks shown < 50ms
6. Empty query → MRU tasks shown (after having selected some)
7. Select a task → overlay closes, board resets, card scrolled into view
8. Escape → overlay closes, board resets, focus returns to previous element
9. Open TaskModal then press Ctrl+K → ⌘K overlay does NOT open (modal blocks it)
10. Check board filter bar — no lingering filter chips after overlay closes
11. npm run lint → zero warnings
```

### References

- `filterTasks` pure function: [Source: `src/features/filters/utils/filterTasks.ts` — completed in Story 4.1]
- `useKeyboardShortcut` current implementation: [Source: `src/shared/hooks/useKeyboardShortcut.ts`]
- `FilterAPIContext` — `setSearch`, `resetFilters`: [Source: `src/store/FilterAPIContext.tsx`]
- `useTasks()` returns all tasks (not status-filtered): [Source: `src/store/BoardStateContext.tsx`]
- shadcn Command component docs: [Source: https://ui.shadcn.com/docs/components/command]
- ⌘K overlay spec (role=combobox, MRU, <50ms): [Source: planning-distillate.md#Epic 4]
- Scroll-to pattern: [Source: ux-design-specification.md#Journey 3]
- `id` on TaskCard article: additive change, does not break existing tests
- `noUncheckedIndexedAccess` — `allTasks.find(t => t.id === id)` returns `Task | undefined`; filter with type guard `(t): t is Task => t !== undefined` [Source: project-context.md#Language-Specific Rules]

---

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List

### Change Log
