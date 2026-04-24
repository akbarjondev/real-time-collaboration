# Story 2.1: Display Full Task Card with All Visual States

Status: review

## Blocker

**Do NOT start implementation until ALL Epic 1 stories (1.1 → 1.2 → 1.3 → 1.4) are marked `done`.**
This story extends the base `TaskCard` component stubbed in Story 1.4 and depends on: `Task` type (1.2), `usePendingOps()` context (1.2), `mockData.ts` seed tasks (1.3), and `BoardColumn` + shadcn `Badge` being in place (1.4).

---

## Story

As a user,
I want task cards to display all relevant fields with clear visual hierarchy and distinct states (default, hover, done, in-flight),
so that I can scan the board and understand each task's details at a glance without clicking into them.

## Acceptance Criteria

1. **Given** a task card in its default state **When** rendered **Then** it displays: title (`text-sm font-medium`, dominant), priority badge (colored dot + label text, never color alone), assignee name (`text-xs text-zinc-500`), created date right-aligned **And** it uses `role="article"` with `aria-label` containing title, priority, and assignee.

2. **Given** a task with `status: 'done'` **When** rendered as a TaskCard **Then** the card renders at `opacity-[0.65]` with the title struck-through (`line-through`).

3. **Given** a TaskCard **When** the user hovers over it **Then** the card border elevates and a deeper shadow appears (e.g. `hover:border-zinc-300 hover:shadow-md transition-shadow`).

4. **Given** a TaskCard with a pending operation in `PendingOpsContext` matching `task.id` **When** the card renders **Then** a `violet-600` animated pulse border ring (`cardPulse` CSS keyframe, 1.8s infinite) appears around the card **And** a CSS spinner appears in the top-right corner **And** `aria-busy="true"` is set on the card element.

5. **Given** the `cardPulse` animation **When** OP_SUCCESS or OP_ROLLBACK is dispatched for that task's opId **Then** the animation stops and the card returns to default state.

6. **Given** the TaskCard component **When** implemented **Then** it is wrapped in `React.memo` — re-renders ONLY when its own `task` prop changes (verified: a sibling task update must NOT re-render this card).

7. **Given** an empty column after tasks are moved or deleted **When** the column renders **Then** the empty state (UX-DR14) shows: `inbox` Lucide icon, "No tasks" heading, "Drag a task here or add one" subtext, and "Add task" ghost dashed button (non-functional in this story).

8. **Given** priority badges **When** rendered **Then** High → `rose-500` dot + "High" text, Medium → `amber-500` dot + "Medium" text, Low → `sky-500` dot + "Low" text — always dot + label, never color alone (accessibility: WCAG contrast AA confirmed for each).

## Tasks / Subtasks

- [x] Task 1: Implement full TaskCard component with all 5 visual states (AC: #1, #2, #3, #4, #5, #6)
  - [x] Implement props interface: `{ task: Task }` — no other props needed
  - [x] Render card anatomy: title (`text-sm font-medium`), priority badge (dot + text), assignee (`text-xs text-zinc-500`), created date right-aligned
  - [x] Add `role="article"` and `aria-label={`${task.title}, ${task.priority} priority, assigned to ${task.assignee}`}`
  - [x] Implement done state: `opacity-[0.65]` + `line-through` on title when `task.status === 'done'`
  - [x] Implement hover state: `hover:border-zinc-300 hover:shadow-md transition-shadow`
  - [x] Implement in-flight state: read `usePendingOps()`, check if any op's `taskId === task.id`, apply `cardPulse` animation + CSS spinner + `aria-busy="true"`
  - [x] Define `cardPulse` CSS keyframe in `src/index.css` or a component CSS module
  - [x] Wrap entire component in `React.memo`

- [x] Task 2: Implement priority badge sub-component (AC: #8)
  - [x] Create helper function or inline logic in `TaskCard.tsx` for priority color mapping
  - [x] Use shadcn `Badge` component from `src/components/ui/badge.tsx`
  - [x] Render colored dot (12px inline SVG or `rounded-full` div) + text label side-by-side
  - [x] Never render color alone — always pair dot with text

- [x] Task 3: Implement empty state for columns (AC: #7)
  - [x] Check if `BoardColumn` already renders empty state from Story 1.4; if so, verify it matches UX-DR14 spec exactly
  - [x] Ensure `inbox` Lucide icon, "No tasks", "Drag a task here or add one", "Add task" ghost dashed button are present
  - [x] "Add task" button is non-functional in this story (wire up in 2.2)

- [x] Task 4: Write tests (AC: all)
  - [x] `TaskCard.test.tsx`: test default render (title/priority/assignee/date), done state (opacity + strikethrough), hover class presence, in-flight animation trigger/removal, React.memo behavior
  - [x] Mock `usePendingOps` to return a Map with a matching taskId for in-flight test

## Dev Notes

### Critical Architecture Constraints

**FORBIDDEN patterns — any of these will break the architecture:**
- Barrel `index.ts` exports — import directly: `import { TaskCard } from '@/features/tasks/components/TaskCard'`
- Wrapping context values in objects: `value={{ tasks }}` → use `value={tasks}` directly
- `any` type — zero tolerance; use `unknown` + type guards
- Number IDs — all task IDs are `nanoid()` strings
- `Date` objects — all dates are ISO 8601 strings; use `new Date(task.createdAt).toLocaleDateString()`
- `loading: boolean` flags — async state is always discriminated union; per-task loading is checked via `PendingOpsContext`

**TaskCard must NOT:**
- Import from `src/api/tasks.ts` or `src/api/mock-client.ts` — mutations go through `useBoardAPI()` only
- Manage its own mutation state — all state comes from contexts
- Use `useSelector`, `useState`, or any local state for the task data — reads from context only

### In-Flight Animation Spec (UX-DR11)

```css
/* Add to src/index.css */
@keyframes cardPulse {
  0%, 100% { box-shadow: 0 0 0 2px rgb(124 58 237 / 0.3); }
  50%       { box-shadow: 0 0 0 4px rgb(124 58 237 / 0.6); }
}
.card-pulse {
  animation: cardPulse 1.8s ease-in-out infinite;
}
```

Apply `.card-pulse` class to the card wrapper div when `isPending` is `true`.

CSS spinner (top-right corner):
```tsx
{isPending && (
  <div className="absolute top-2 right-2 h-3 w-3 animate-spin rounded-full border-2 border-violet-600 border-t-transparent" />
)}
```
Card wrapper needs `position: relative` (Tailwind: `relative`) for the spinner positioning.

### Pending Operation Detection

```typescript
// Inside TaskCard component:
const pendingOps = usePendingOps() // Map<string, PendingOperation>
const isPending = [...pendingOps.values()].some(op => op.taskId === task.id)
```

`usePendingOps()` is imported from `@/store/PendingOpsContext`.

### Priority Badge Implementation

```typescript
const PRIORITY_CONFIG: Record<Priority, { dot: string; label: string }> = {
  high:   { dot: 'bg-rose-500',  label: 'High'   },
  medium: { dot: 'bg-amber-500', label: 'Medium' },
  low:    { dot: 'bg-sky-500',   label: 'Low'    },
}
```

Always render as: `<span class="rounded-full h-2 w-2 {dot}" /> <span>{label}</span>` — never color alone.

### Done State

```tsx
<article
  role="article"
  aria-label={`${task.title}, ${task.priority} priority, assigned to ${task.assignee}`}
  aria-busy={isPending}
  className={cn(
    'relative rounded-lg border border-zinc-200 bg-white p-4 transition-shadow',
    'hover:border-zinc-300 hover:shadow-md',
    isPending && 'card-pulse',
    task.status === 'done' && 'opacity-[0.65]',
  )}
>
  <h3 className={cn('text-sm font-medium text-zinc-900', task.status === 'done' && 'line-through')}>
    {task.title}
  </h3>
  ...
</article>
```

### React.memo Usage

```typescript
export const TaskCard = React.memo(function TaskCard({ task }: { task: Task }) {
  // ... implementation
})
```

This prevents parent (e.g., BoardColumn) re-renders from cascading to every card when only one task changed.

### Seed Data Verification

Story 1.3 guarantees 25 tasks across `'todo'`, `'in-progress'`, `'done'` statuses. This story specifically needs `'done'` tasks to test the opacity/strikethrough state — verify at least 5 exist in `mockData.ts`.

### Date Formatting

```typescript
// Use toLocaleDateString — ISO 8601 string from Task.createdAt
const formatted = new Date(task.createdAt).toLocaleDateString('en-US', {
  month: 'short', day: 'numeric'
})
```

Never construct `new Date()` for comparison — only for display.

### File Paths

```
src/features/tasks/components/TaskCard.tsx       ← PRIMARY file for this story
src/features/tasks/components/TaskCard.test.tsx  ← co-located test
src/index.css                                    ← add cardPulse keyframe here
```

Do NOT modify `BoardColumn.tsx` beyond confirming/fixing empty state spec compliance.

### References

- Task card visual states: [Source: ux-design-specification.md#UX-DR3]
- In-flight animation: [Source: ux-design-specification.md#UX-DR11]
- Priority badge colors: [Source: ux-design-specification.md#UX-DR1]
- Empty state spec: [Source: ux-design-specification.md#UX-DR14]
- PendingOperation type: [Source: architecture.md#boardReducer state shape]
- React.memo rule: [Source: architecture.md#TaskCard]
- No barrel exports: [Source: architecture.md#No Barrel Exports Rule]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- Fixed boardReducer OP_ROLLBACK bug (create/delete rollback was inverted); added `opType` to PendingOperation type
- Added `globals: true` and react plugin to vitest.config.ts for jest-dom compatibility
- Added `@/` path alias to vitest.config.ts

### Completion Notes List

- TaskCard fully implemented: done state (opacity-[0.65] + line-through), in-flight (card-pulse animation + CSS spinner + aria-busy), hover (shadow-md), React.memo, all accessibility attributes
- `cardPulse` CSS keyframe added to src/index.css
- Added optional `onOpen` prop to TaskCard for Story 2.3 click/Enter integration (non-breaking; no-op when not provided)
- BoardColumn empty state already matches UX-DR14 spec — no changes needed
- 25 tests passing: default render, done state, in-flight state, priority badges, interaction, memo isolation

### File List

- src/features/tasks/components/TaskCard.tsx (modified)
- src/features/tasks/components/TaskCard.test.tsx (created)
- src/index.css (modified — added cardPulse keyframe)
- src/types/common.types.ts (modified — added opType to PendingOperation)
- src/store/boardReducer.ts (modified — fixed OP_ROLLBACK, added opType to pendingOps entries)
- vitest.config.ts (modified — added globals, react plugin, path alias)

## Change Log

- 2026-04-24: Implemented Story 2.1 — Full TaskCard visual states. Fixed OP_ROLLBACK bug in boardReducer. 25 tests added and passing.
