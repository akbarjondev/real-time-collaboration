# Epic 9: Responsive Design & Accessibility

Users can use the full board on mobile and with keyboard-only or screen reader navigation.

## Story 9.1: Responsive Layout and Mobile-First Design

As a mobile user,
I want columns to stack vertically, filters to collapse to a button, and tap targets to be large enough for one-handed use,
So that the board is genuinely usable during stand-ups, not just technically responsive.

**Acceptance Criteria:**

**Given** a viewport narrower than 768px
**When** the board renders
**Then** columns stack vertically (flex-col, each column full-width) in order: Todo → In Progress → Done (FR37)
**And** drag-and-drop is disabled on touch (replaced by status Select dropdown, per Story 3.2)
**And** the filter bar collapses to a single "Filter" button that opens a bottom sheet

**Given** a tablet viewport (768–1024px)
**When** the board renders
**Then** three columns are side-by-side with `md:flex-row`
**And** filter chips may wrap to a second row
**And** column min-width is 280px

**Given** any interactive element on a mobile viewport
**When** rendered
**Then** its tap target is a minimum of 44×44px (FR40, UX-DR9)
**And** badge dismiss buttons use padding expansion to reach 44×44px touch area while remaining visually compact

**Given** the implementation
**When** CSS is written
**Then** only Tailwind responsive prefixes (`md:`, `lg:`) are used — no custom breakpoints and no inline media queries
**And** base styles target mobile, `md:` and `lg:` progressively enhance

---

## Story 9.2: Keyboard Navigation and ARIA Labeling

As a keyboard user,
I want every interactive element on the board to be reachable via Tab and operable via keyboard,
So that I can use the board without a mouse.

**Acceptance Criteria:**

**Given** the board is loaded
**When** the user presses Tab repeatedly
**Then** focus moves through all interactive elements in a logical order: header → filter bar → undo bar → columns → task cards (FR38)
**And** each element has a visible focus indicator: `focus-visible:ring-2 focus-visible:ring-violet-500`

**Given** a focused task card
**When** the user presses Enter
**Then** the task detail modal opens

**Given** a focused task card
**When** the user presses Space
**Then** keyboard drag mode is initiated: arrow keys move the card between columns, Space drops, Escape cancels (UX-DR17)

**Given** all buttons, icons, and form inputs
**When** rendered
**Then** each carries `aria-label` or `aria-labelledby` describing its action (e.g., "Close toast", "Dismiss filter") — never just the icon name (FR39)

**Given** each Kanban column
**When** rendered
**Then** it has `role="region"` and `aria-label="[Column name] column, [N] tasks"`

**Given** all task cards
**When** rendered
**Then** they have `role="article"` with `aria-label` containing title, priority, and assignee

---

## Story 9.3: Focus Management, Screen Reader Support, and Reduced Motion

As a user with assistive technology,
I want focus managed correctly in modals, live regions announcing async changes, and animations that respect motion preferences,
So that the board is fully usable regardless of how I access it.

**Acceptance Criteria:**

**Given** a modal (task create/edit, conflict) is opened
**When** it appears
**Then** focus automatically moves to the first interactive element inside (title field for task modal, "Keep mine" for conflict modal)
**And** focus is trapped inside — Tab wraps within the modal (handled by Radix UI Dialog, FR40)

**Given** a modal is closed
**When** it closes
**Then** focus returns to the element that triggered the modal (FR40, NFR13)

**Given** the Undo Hint Bar with `aria-live="polite"`
**When** the undo/redo label changes
**Then** screen readers announce the new label without interrupting other announcements

**Given** the toast container
**When** an error toast fires
**Then** it uses `aria-live="assertive"` (urgent, interrupts screen reader)
**And** info/success toasts use `aria-live="polite"` (non-interrupting)

**Given** in-flight card state
**When** a mutation is in progress
**Then** the card has `aria-busy="true"` which screen readers announce as "busy"

**Given** a drag-and-drop operation via keyboard or mouse
**When** it occurs
**Then** `aria-live` announcements fire at drag start ("Picked up [task title]"), on drag-over ("Moving to [column name] column"), and on drop ("Dropped in [column name] column")

**Given** the user has `prefers-reduced-motion: reduce` set in their OS
**When** any animation plays (cardPulse, drag physics, toast fade, spinner)
**Then** the animation is reduced to an instant transition or opacity-only fade (UX-DR18)

**Given** the page
**When** it renders
**Then** a "Skip to main content" link is present (visually hidden, visible on focus) that skips to the board `<main>` element
