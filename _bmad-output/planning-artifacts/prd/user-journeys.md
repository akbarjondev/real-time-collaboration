# User Journeys

## Journey 1: Happy Path — First Board Interaction

**Persona:** Alex, a mid-level engineer, opens the task board for the first time during a sprint.

**Opening Scene:** Three columns load instantly — Todo, In Progress, Done — each populated with tasks showing title, priority badge, assignee, and created date.

**Rising Action:** Alex searches "authentication" — results filter instantly. He switches to filter by assignee "John Doe". He opens the create modal, fills in title, description, assignee, and priority High, and submits.

**Climax:** The new task appears in Todo immediately (optimistic update) — no spinner, no wait.

**Resolution:** Alex drags the task to In Progress. The move is instant and smooth. The board feels trustworthy.

*Reveals: Task display, filtering, search, drag-and-drop, task creation modal, optimistic insert.*

---

## Journey 2: Optimistic Update Failure & Rollback

**Persona:** Alex, mid-sprint, moving tasks quickly.

**Opening Scene:** Alex drags a task from In Progress to Done. Column updates instantly.

**Rising Action:** Two seconds pass. Mock API fails (10% chance). Task snaps back to In Progress. Toast: *"Update failed — change has been reverted."*

**Climax:** Error is clear, state is consistent, board is not broken. Alex tries again — it succeeds.

**Resolution:** Alex trusts the board because failure is transparent and recovery is automatic.

*Reveals: Optimistic update, 10% failure simulation, rollback, error toast, loading state.*

---

## Journey 3: Real-Time Conflict — Remote User Collision

**Persona:** Alex is editing a task title when the simulated remote user updates the same task.

**Opening Scene:** Alex has the task modal open, mid-edit.

**Rising Action:** Toast: *"Another user updated this task."* Conflict detected — Alex's edit vs. incoming remote change.

**Climax:** Alex is prompted: Keep mine / Take theirs. He picks "Keep mine". Reconciliation applies his change over the remote state.

**Resolution:** No data silently lost. Board reflects correct final state.

*Reveals: Real-time simulation interval, conflict detection, reconciliation strategy, merge notification.*

---

## Journey 4: Undo/Redo Chain

**Persona:** Alex makes five rapid changes — moves tasks, renames two, reassigns one.

**Opening Scene:** Alex realises he reassigned the wrong task.

**Rising Action:** Ctrl+Z reverts reassignment. Ctrl+Z again reverts a rename. He goes one too far — Ctrl+Shift+Z redoes it. Each step shows a UI label for the next undo/redo action.

**Climax:** Alex makes a new change after undoing. Redo stack clears correctly. History behaves like any modern editor.

**Resolution:** Undo/redo is predictable and works even after an optimistic rollback mid-chain.

*Reveals: History stack (max 50), keyboard shortcuts, optimistic-aware undo/redo, UI hint label.*

---

## Journey 5: Scale — 1000+ Task Board

**Persona:** Alex's team has 1,200 tasks accumulated.

**Opening Scene:** Board loads without freezing. Scroll is smooth.

**Rising Action:** Alex scrolls 800 tasks deep in Done. Searches "payment" — virtualized list filters instantly. A remote update fires mid-scroll.

**Climax:** Update applies without interrupting scroll position or triggering a full re-render.

**Resolution:** Performance is invisible to Alex at any data scale.

*Reveals: Virtualization (@tanstack/react-virtual), memoized filter/sort, incremental remote updates.*

---

## Journey 6: Mobile — On-the-Go

**Persona:** Alex checks the board on his phone during stand-up.

**Opening Scene:** Columns stack vertically. Cards have large tap targets.

**Rising Action:** Alex taps a task, changes status via dropdown, saves. Task updates optimistically. A real-time notification appears as a non-intrusive top banner.

**Resolution:** The board is fully functional on mobile — genuinely usable one-handed, not just "technically responsive."

*Reveals: Responsive layout, touch tap targets, mobile modal, drag-and-drop touch fallback, responsive toast.*

---

## Journey Requirements Summary

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
