# Story 9.1: Responsive Layout and Mobile-First Design

Status: done

## Blocker

**Do NOT start implementation until Epic 3 is `done`.** This story touches `KanbanBoard.tsx`, `BoardColumn.tsx`, and `TaskCard.tsx` — all modified during Epic 3. Starting before Epic 3 is complete will cause merge conflicts.

Epic 4 (FilterBar) is **in-progress** but not required before this story — the FilterBar slot in KanbanBoard is currently a comment placeholder. Story 9.1 only needs to ensure the future FilterBar area is mobile-accessible; the actual bottom-sheet conversion happens in Epic 4.

---

## Story

As a mobile user,
I want the Kanban board to stack vertically and remain usable on a small screen,
so that I can manage tasks during stand-ups without requiring a desktop browser.

## Acceptance Criteria

1. **Given** a viewport width below 768px **When** the board renders **Then** the three columns are stacked vertically (flex-col) rather than side-by-side, each column takes full width, and all columns are visible without horizontal scrolling.

2. **Given** a viewport 768px or wider **When** the board renders **Then** the three columns appear side-by-side (flex-row), each with a minimum width of 280px, equal flex widths, and horizontal scroll appears only when the viewport is narrower than three columns.

3. **Given** any viewport **When** a user inspects every interactive element (buttons, inputs, select triggers, task cards) **Then** every interactive element meets the 44×44px minimum touch target requirement.

4. **Given** a 320px-wide viewport **When** the board renders **Then** no content is clipped or hidden behind a horizontal scrollbar at the page level; the columns area scrolls horizontally only within the columns container.

5. **Given** the board header on a narrow viewport **When** the title and "New Task" button are both present **Then** the header remains readable without text clipping — the button wraps to a new line or the header layout adapts to prevent overflow.

6. **Given** a mobile viewport **When** the user scrolls a column **Then** each column shows a minimum height even when empty, so users understand it is a valid drop zone / task area.

7. **Given** all viewport sizes **When** the layout is inspected **Then** only Tailwind default breakpoints (`sm:`, `md:`, `lg:`) are used — no custom breakpoints, no inline style breakpoints, no CSS media queries outside `index.css`.

## Tasks / Subtasks

- [ ] Task 1: Convert KanbanBoard columns area to mobile-first layout (AC: #1, #2, #4)
  - [ ] Change the `<main>` className from `flex gap-4 p-4 overflow-x-auto items-start` to `flex flex-col md:flex-row gap-4 p-4 overflow-x-auto items-start`
  - [ ] Add `id="main-content"` to the `<main>` element (required for Story 9.3 skip-link target)
  - [ ] Verify the `overflow-x-auto` is on `<main>` (the columns container) not on the page root — columns should scroll as a group, not the whole page

- [ ] Task 2: Update BoardColumn width and min-height for mobile (AC: #1, #2, #4, #6)
  - [ ] Change column root `<section>` width from `w-80 min-w-[280px]` to `w-full md:w-80 md:min-w-[280px]`
  - [ ] Ensure the column has `min-h-[120px]` so empty columns remain visible on mobile
  - [ ] The existing empty-state block already provides height via `py-8` — verify it renders correctly at 320px width

- [ ] Task 3: Audit and fix all touch target sizes (AC: #3)
  - [ ] "New Task" button in KanbanBoard header: already has `min-h-[44px]` — verify it is present and that `min-w-[44px]` is not needed (it has text + icon so width is fine)
  - [ ] "Add task" ghost button in BoardColumn empty state: already has `min-h-[44px]` — verify
  - [ ] TaskCard `<article>`: add `min-h-[44px]` to the article className in TaskCard.tsx
  - [ ] TaskModal Delete button: add `min-h-[44px]` to the destructive Delete button in TaskModal footer
  - [ ] TaskModal Cancel button: add `min-h-[44px]` to the Cancel ghost button
  - [ ] TaskModal Create/Save button: add `min-h-[44px]` to the primary submit button
  - [ ] Form inputs (title, assignee, description, tags): add `min-h-[44px]` to each `<input>` and `<textarea>` className
  - [ ] Select triggers in TaskModal (Status, Priority): shadcn SelectTrigger has `h-9` by default (36px) — add `min-h-[44px]` or override with `h-11` on the SelectTrigger className

- [ ] Task 4: Fix header layout for narrow viewports (AC: #5)
  - [ ] Change header inner layout: `flex items-center justify-between` → `flex flex-wrap items-center justify-between gap-y-2`
  - [ ] This allows the "New Task" button to wrap below the title on very narrow screens without clipping

- [ ] Task 5: Write tests (AC: #1, #2, #3)
  - [ ] `KanbanBoard.test.tsx` (create or extend): render component and assert `<main>` has `flex-col` class at mobile layout; assert `id="main-content"` present
  - [ ] `BoardColumn.test.tsx` (extend): assert root `<section>` has `w-full` class
  - [ ] `TaskCard.test.tsx` (extend): assert `<article>` has `min-h-[44px]` class

- [ ] Task 6: Update sprint-status.yaml
  - [ ] Set `epic-9` to `in-progress`
  - [ ] Set `9-1-responsive-layout-and-mobile-first-design` to `in-progress`

---

## Dev Notes

### KanbanBoard.tsx — Columns Layout Change

**Current:**
```tsx
<main className="flex gap-4 p-4 overflow-x-auto items-start">
```

**After Story 9.1:**
```tsx
<main id="main-content" className="flex flex-col md:flex-row gap-4 p-4 overflow-x-auto items-start">
```

The `overflow-x-auto` stays on `<main>` — on mobile, the columns are stacked vertically so no horizontal scroll occurs. On desktop, the columns are side-by-side and horizontal scroll activates only if viewport is too narrow to fit all three at 280px minimum.

### BoardColumn.tsx — Width Classes

**Current:**
```
className={cn(
  'bg-zinc-100 rounded-xl p-3 flex flex-col gap-3 w-80 min-w-[280px]',
  ...
)}
```

**After Story 9.1:**
```
className={cn(
  'bg-zinc-100 rounded-xl p-3 flex flex-col gap-3 w-full md:w-80 md:min-w-[280px] min-h-[120px]',
  ...
)}
```

`w-full` on mobile gives each stacked column full container width. `md:w-80` restores the fixed 320px desktop width. `min-h-[120px]` ensures the column body has visible height even if no content renders beyond the header.

### TaskCard.tsx — Touch Target

The `<article>` element is the touch target for opening the modal. Cards must meet the 44px minimum:

```tsx
className={cn(
  'relative rounded-lg border bg-white p-4 transition-shadow min-h-[44px]',
  ...
)}
```

Cards with content will naturally exceed 44px due to padding and content. The `min-h-[44px]` is a floor guarantee for pathologically short titles.

### TaskModal.tsx — Form Input Heights

Each `<input>` and `<textarea>` in the form currently uses `py-2` (8px top + 8px bottom = 16px padding) plus the text line height (~20px) = ~36px total. This falls short of the 44px minimum. Add `min-h-[44px]` to each input:

```tsx
className="rounded-lg border border-input bg-transparent px-3 py-2 text-sm ... min-h-[44px]"
```

For `<textarea>`, `min-h-[44px]` still applies — rows={3} will exceed this naturally but the constraint is important for the rows={1} fallback.

### SelectTrigger Sizing

shadcn's default `SelectTrigger` height is controlled by `h-9` (36px). Override it in-place:

```tsx
<SelectTrigger ref={statusTriggerRef} className="w-full min-h-[44px]">
```

`min-h-[44px]` overrides `h-9` via Tailwind specificity (both are height utilities; last wins in Tailwind v4 with the cascade). If `h-9` is defined in the shadcn component's base styles and not as a utility class, use `h-11` (`44px`) instead on the trigger to override it cleanly.

### DnD on Mobile

Drag-and-drop is NOT disabled at the layout level in this story. The `PointerSensor` in `useBoardDnd` will simply not activate well on touch (pointer events behave differently). The status Select fallback in `TaskModal` (Story 3.2) is the intended mobile path. Story 9.2 adds `KeyboardSensor` for accessibility. No explicit mobile DnD disable guard is needed here — it was intentionally not added in Epic 3 design.

### Mobile Testing Sizes

Manually test at these widths:
- 320px (minimum supported)
- 375px (iPhone SE)
- 390px (iPhone 14)
- 768px (breakpoint boundary — both sides)
- 1280px (full desktop)

### Header Wrapping

The header change prevents the title + button from colliding on narrow screens:

**Current:**
```tsx
<header className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 bg-white">
```

**After:**
```tsx
<header className="flex flex-wrap items-center justify-between gap-y-2 px-6 py-4 border-b border-zinc-200 bg-white">
```

`flex-wrap` allows the header children to wrap without clipping. `gap-y-2` provides spacing when wrapping occurs. On desktop, `justify-between` keeps the title left and button right as before since they fit on one line.

### File Paths

```
src/features/board/components/KanbanBoard.tsx       ← add id="main-content"; flex-col md:flex-row
src/features/board/components/BoardColumn.tsx       ← w-full md:w-80 md:min-w-[280px] min-h-[120px]
src/features/tasks/components/TaskCard.tsx          ← min-h-[44px] on article
src/features/tasks/components/TaskModal.tsx         ← min-h-[44px] on inputs, selects, buttons
_bmad-output/implementation-artifacts/sprint-status.yaml
```

### Forbidden Patterns

- Custom CSS breakpoints or `@media` queries in component files — use Tailwind `md:` prefix only
- `w-80` without the `md:` prefix on mobile — columns must be full width below 768px
- Hardcoded pixel values in `style=` props — use Tailwind utilities
- `focus:outline-none` without ring replacement — not applicable here but verify no regressions introduced
- `any` type anywhere

### Verification Checklist

After implementing, verify:

```
1. Chrome DevTools → 375px: columns stack vertically, no horizontal scrollbar on the page
2. Chrome DevTools → 768px: columns appear side-by-side
3. Chrome DevTools → 320px: board renders without clipping; columns are full-width
4. Header at 375px: title and New Task button both visible without overflow
5. Tap any task card on mobile emulation: card height visually >= 44px
6. Tap any button in TaskModal on mobile: every button visually >= 44px tall
7. TypeScript: tsc --noEmit → zero errors
8. npm run lint → zero warnings
9. All 100 existing tests still pass (npm test)
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
