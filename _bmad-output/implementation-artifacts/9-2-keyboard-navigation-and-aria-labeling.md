# Story 9.2: Keyboard Navigation and ARIA Labeling

Status: ready-for-dev

## Blocker

**Do NOT start implementation until Epic 3 is `done`** — this story modifies `useBoardDnd.ts` (adds `KeyboardSensor`) and `TaskCard.tsx` (keyboard event handling), both changed during Epic 3.

Story 9.1 is a **soft dependency**: the `id="main-content"` added to `<main>` in Story 9.1 is referenced by Story 9.3's skip link. Stories 9.1 and 9.2 can be implemented in parallel if needed — they touch different concerns in the same files. If implemented in parallel, merge `TaskCard.tsx` changes carefully.

---

## Story

As a keyboard-only user,
I want to navigate the board, open tasks, and rearrange cards using only the keyboard,
so that I can use the Kanban board without a mouse or touch screen.

## Acceptance Criteria

1. **Given** the board is loaded **When** the user presses Tab repeatedly **Then** focus moves in DOM order: header button → (filter bar when present) → (undo bar when present) → first column first card → next card → end of first column → first card of second column, and so on.

2. **Given** a task card has keyboard focus **When** the user presses Enter **Then** the task edit modal opens (existing behavior — verify it works correctly).

3. **Given** focus is on a task card **When** the user presses Space **Then** dnd-kit's keyboard drag mode activates: the card is "picked up", pressing arrow keys moves it between columns, Space drops it, and Escape cancels.

4. **Given** the keyboard drag is active **When** the user presses Escape **Then** the drag is cancelled and the card returns to its original column with no state change.

5. **Given** any icon-only button (header "New Task" icon area, modal "Delete", close buttons) **When** inspected with a screen reader or accessibility tree **Then** every button has an explicit `aria-label` that describes its action.

6. **Given** each Kanban column **When** inspected with a screen reader **Then** it announces as a landmark region with label `"[Column name] column, [N] task(s)"` — for example `"Todo column, 8 tasks"` or `"In Progress column, 1 task"`.

7. **Given** each task card **When** inspected with a screen reader **Then** the `aria-label` reads `"[title], [priority] priority, assigned to [assignee]"` — or `"[title], [priority] priority, unassigned"` when no assignee is set.

8. **Given** every interactive element on the board (buttons, inputs, select triggers, task cards) **When** focused via keyboard **Then** a visible `focus-visible:ring-2 focus-visible:ring-violet-500` ring appears. The ring MUST NOT use `focus:outline-none` without a replacement ring.

9. **Given** the keyboard sensor is active **When** a drag is initiated via Space **Then** the drag does NOT conflict with the existing `PointerSensor` drag — both sensors co-exist on the same `DndContext`.

## Tasks / Subtasks

- [ ] Task 1: Add KeyboardSensor to useBoardDnd (AC: #3, #4, #9)
  - [ ] Import `KeyboardSensor` from `@dnd-kit/core`
  - [ ] Import `sortableKeyboardCoordinates` from `@dnd-kit/sortable`
  - [ ] Add `useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })` to the `useSensors` call alongside the existing `PointerSensor`
  - [ ] No other changes to `useBoardDnd` — `handleDragEnd` logic is unchanged

- [ ] Task 2: Audit and complete `focus-visible:ring-2 focus-visible:ring-violet-500` on all interactive elements (AC: #8)
  - [ ] `KanbanBoard.tsx` "New Task" Button: already has `focus-visible:ring-2 focus-visible:ring-violet-500` — verify it is not overridden by shadcn base styles
  - [ ] `BoardColumn.tsx` "Add task" Button: already has `focus-visible:ring-2 focus-visible:ring-violet-500` — verify
  - [ ] `TaskCard.tsx` article: already has `focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:outline-none` — verify and confirm `outline-none` has the ring as replacement (it does — this is correct)
  - [ ] `TaskModal.tsx` Delete button: add `focus-visible:ring-2 focus-visible:ring-violet-500` if not present via shadcn destructive variant
  - [ ] `TaskModal.tsx` Cancel button (ghost variant): verify focus ring is present via shadcn variant
  - [ ] `TaskModal.tsx` Create/Save button: verify focus ring via shadcn default variant
  - [ ] `TaskModal.tsx` SelectTrigger elements (Status, Priority): add `focus-visible:ring-2 focus-visible:ring-violet-500` if shadcn default ring color differs
  - [ ] `TaskModal.tsx` text inputs (title, assignee, tags): inputs use `focus-visible:ring-3 focus-visible:ring-ring/50` — this is the shadcn input style using the theme `--ring` token which maps to zinc-400; consider whether this meets WCAG AA visibility. If the ring is not violet-500, it does not need to match exactly — the shadcn input ring is acceptable as-is per the existing implementation pattern. Do NOT change the input ring color unless it causes a visible deficiency.
  - [ ] Check that NO element uses `focus:outline-none` alone without a ring — grep for `focus:outline-none` and verify each occurrence has a companion ring

- [ ] Task 3: Verify and complete aria-labels on all interactive elements (AC: #5, #6, #7)
  - [ ] `KanbanBoard.tsx` "New Task" Button: already has `aria-label="New Task"` — verify
  - [ ] `KanbanBoard.tsx` LayoutGrid icon: already has `aria-hidden="true"` — verify
  - [ ] `BoardColumn.tsx` root `<section>`: already has `role="region"` and `aria-label={`${title} column, ${count} task${count !== 1 ? 's' : ''}`}` — verify plural logic is correct (`"1 task"` not `"1 tasks"`)
  - [ ] `BoardColumn.tsx` "Add task" Button: already has `aria-label={`Add task to ${title}`}` — verify
  - [ ] `BoardColumn.tsx` count badge `<span>`: already has `aria-hidden="true"` — the column `aria-label` on the section already announces the count, so the visual badge should be hidden from screen readers — verify
  - [ ] `TaskCard.tsx` `<article>`: already has `aria-label={\`${task.title}, ${task.priority} priority, assigned to ${task.assignee ?? 'Unassigned'}\`}` — update the fallback to lowercase `'unassigned'` for natural speech: `${task.assignee ?? 'unassigned'}`
  - [ ] `TaskModal.tsx` Delete button: already has `aria-label="Delete task"` — verify
  - [ ] `TaskModal.tsx` Priority `<Select>`: the `<label>` element with `htmlFor` equivalent is a plain `<label className="...">Priority</label>` without a `for` attribute linked to the select. Since shadcn `Select` renders a button (not a native `<select>`), add `aria-label="Priority"` directly to the `<SelectTrigger>` for the Priority field
  - [ ] `TaskModal.tsx` Status `<Select>` (edit mode): similarly add `aria-label="Status"` to its `<SelectTrigger>`
  - [ ] Guard dialog "Keep editing" and "Discard" buttons: verify both have descriptive text (they do — text content is sufficient; no aria-label needed when button text is clear)
  - [ ] `ErrorBoundary.tsx`: already has `role="alert"` — no change needed

- [ ] Task 4: Verify TaskCard Enter key opens modal (AC: #2)
  - [ ] `TaskCard.tsx` already has `onKeyDown={(e) => { if (e.key === 'Enter') onOpen?.(task) }}` — run a manual test to confirm it works
  - [ ] Confirm `tabIndex={isOverlay ? -1 : 0}` is present — overlay cards must NOT be reachable by Tab

- [ ] Task 5: Write tests (AC: #3, #5, #6, #7, #8)
  - [ ] `useBoardDnd.test.ts` (extend): assert `sensors` array includes a sensor with `KeyboardSensor` — check the sensors configuration contains two sensors
  - [ ] `BoardColumn.test.tsx` (extend): assert `aria-label` matches pattern `"Todo column, N task(s)"` for both singular and plural counts
  - [ ] `TaskCard.test.tsx` (extend): assert `aria-label` for a task with assignee reads `"[title], [priority] priority, assigned to [assignee]"`; assert `aria-label` for a task without assignee reads `"[title], [priority] priority, unassigned"`; assert `tabIndex={0}` on normal card; assert `tabIndex={-1}` on overlay card
  - [ ] `TaskModal.test.tsx` (extend): assert Priority SelectTrigger has `aria-label="Priority"`; assert Status SelectTrigger has `aria-label="Status"` in edit mode

- [ ] Task 6: Update sprint-status.yaml
  - [ ] Set `9-2-keyboard-navigation-and-aria-labeling` to `in-progress`

---

## Dev Notes

### KeyboardSensor Integration in useBoardDnd

The only change to `useBoardDnd.ts` is adding `KeyboardSensor` to the sensors array:

**Current:**
```typescript
const sensors = useSensors(
  useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
)
```

**After Story 9.2:**
```typescript
import { KeyboardSensor, PointerSensor, ... } from '@dnd-kit/core'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'

const sensors = useSensors(
  useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
)
```

`sortableKeyboardCoordinates` is the coordinate getter that makes the keyboard sensor aware of the `SortableContext` item positions, allowing arrow key navigation to correctly jump between sortable items and droppable columns.

### Keyboard Drag UX Flow (dnd-kit built-in behavior)

Once `KeyboardSensor` is added, dnd-kit handles keyboard drag natively with no additional code:

1. User tabs to a `TaskCard` (it has `tabIndex={0}` and the `useSortable` listeners)
2. User presses **Space** → card is "picked up" (drag starts)
3. User presses **Arrow Left / Arrow Right** → focus/drag moves to adjacent sortable contexts (columns)
4. User presses **Space** → card is dropped (drag ends, `handleDragEnd` fires)
5. User presses **Escape** → drag cancelled (card stays in origin; `handleDragEnd` fires with `over=null`)

The existing `handleDragEnd` already handles the `!over` case with an early return, so keyboard drag cancel requires no code change.

**Important:** The keyboard drag announcements (screen reader feedback) are handled in Story 9.3 via the `accessibility.announcements` prop on `DndContext`.

### Focus Ring Audit — What to Check

Run a visual audit in the browser with keyboard navigation only:

1. Tab through every element — every focused element must show a violet ring
2. Check shadcn `Button` variants: the shadcn Button component applies `focus-visible:ring-[3px]` via its base styles using the `--ring` CSS variable. In this project, `--ring` is `oklch(0.708 0 0)` (zinc-400-ish). This is **not** `violet-500`. Per the project rules, the focus ring must be `focus-visible:ring-2 focus-visible:ring-violet-500`.
3. For shadcn Button: add `focus-visible:ring-violet-500` to each Button's className prop to override the default ring color. Do NOT edit `src/components/ui/button.tsx` globally — this risks breaking future shadcn updates. Add the override inline at each usage site in KanbanBoard, BoardColumn, and TaskModal.

**Why inline override, not global button change:** The project context states shadcn components are copy-owned and editable. However, changing `button.tsx` globally would affect every future shadcn component addition in unpredictable ways. For accessibility ring color specifically, it is cleaner to override at the usage site since not every button may be in a violet context.

**Exception:** The `TaskCard` article already has `focus-visible:ring-2 focus-visible:ring-violet-500` applied directly — this is correct.

### Column aria-label Plural Logic

The current BoardColumn implementation:
```tsx
aria-label={`${title} column, ${count} task${count !== 1 ? 's' : ''}`}
```

This is correct: `"Todo column, 1 task"` and `"In Progress column, 8 tasks"`. No change needed — just verify.

### TaskCard aria-label — Assignee Case

**Current:**
```tsx
aria-label={`${task.title}, ${task.priority} priority, assigned to ${task.assignee ?? 'Unassigned'}`}
```

**After Story 9.2:**
```tsx
aria-label={`${task.title}, ${task.priority} priority${task.assignee ? `, assigned to ${task.assignee}` : ', unassigned'}`}
```

The change: capitalize-free `'unassigned'` reads more naturally in TTS. The conditional also avoids saying "assigned to Unassigned" which is confusing for screen reader users. The `?:` ternary removes the need for `??`.

### SelectTrigger aria-label in TaskModal

shadcn's `SelectTrigger` renders as a `<button>` with `role="combobox"`. The associated `<label>` element in the TaskModal uses a plain `<label>` tag without `htmlFor` linked to the trigger (because it is not a native `<select>` — there is no corresponding `id` on the trigger). The accessible name must come from `aria-label` or `aria-labelledby` on the trigger itself.

**Priority field fix:**
```tsx
<SelectTrigger className="w-full" aria-label="Priority">
```

**Status field fix (edit mode):**
```tsx
<SelectTrigger ref={statusTriggerRef} className="w-full min-h-[44px]" aria-label="Status">
```

Note: when `min-h-[44px]` is added in Story 9.1, merge both class changes.

### Tab Order Verification

DOM order determines Tab order. The current `KanbanBoard.tsx` DOM structure is:
```
<div>                               ← page root
  <header>                          ← 1st: New Task button
    ...
  </header>
  {/* FilterBar placeholder */}     ← 2nd when present (Epic 4)
  {/* UndoHintBar placeholder */}   ← 3rd when present (Epic 7)
  <DndContext>
    <main id="main-content">        ← 4th: columns
      <BoardColumn status="todo">   ← column 1 cards
      <BoardColumn status="in-progress">
      <BoardColumn status="done">
    </main>
    <DragOverlay />                 ← DragOverlay cards have tabIndex={-1}
  </DndContext>
  <TaskModal />                     ← modal (focus-trapped when open)
</div>
```

This order is already correct. No DOM reordering is needed.

### Keyboard Shortcut Suppression During Modal

Story 2.2's `useKeyboardShortcut` already suppresses the `N` key shortcut when a form element is focused. Keyboard drag (Space) must similarly not fire when the modal is open. The `KeyboardSensor` in dnd-kit uses the `document` event — it will not activate when a modal overlay has focus because dnd-kit checks for pointer/keyboard events on sortable elements, and the modal's `Dialog` focus trap keeps focus inside the modal. No additional suppression needed.

### File Paths

```
src/features/board/hooks/useBoardDnd.ts              ← add KeyboardSensor
src/features/tasks/components/TaskCard.tsx           ← update aria-label assignee fallback
src/features/tasks/components/TaskModal.tsx          ← add aria-label to SelectTriggers
src/features/board/components/KanbanBoard.tsx        ← verify/fix focus ring on New Task button
src/features/board/components/BoardColumn.tsx        ← verify aria-label and focus ring
_bmad-output/implementation-artifacts/sprint-status.yaml
```

### Forbidden Patterns

- `any` type
- `focus:outline-none` without `focus-visible:ring-2 focus-visible:ring-violet-500` replacement
- `useContext(BoardStateContext)` directly — use `useTasks()`
- Barrel `index.ts` exports
- Icon-only buttons without `aria-label`
- `role="button"` on non-button elements — use native `<button>` via shadcn `Button`

### Verification Checklist

After implementing, verify:

```
1. Tab through entire board (no mouse): every focused element shows violet ring
2. Tab to a task card, press Space: keyboard drag activates (card visual feedback changes)
3. Arrow keys while dragging: card moves between columns
4. Space to drop: card lands in new column, optimistic update fires
5. Escape while dragging: drag cancels, card stays in place, no API call
6. Tab to a task card, press Enter: task edit modal opens
7. Screen reader test (NVDA/VoiceOver or axe DevTools): column announces "Todo column, 8 tasks"
8. Screen reader: task card announces title + priority + assignee
9. Screen reader: Priority and Status select triggers announce their label
10. grep -r "focus:outline-none" src/ → zero results (or all have companion ring)
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
