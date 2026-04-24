# Project Scoping & Phased Development

## Strategy

**Delivery Mode:** Phased — three sequential phases with clear boundaries
**Approach:** Depth-first MVP — complete core experience before expanding scope
**Resource:** Solo developer

## Phase 1 — MVP

**Journeys covered:** 1–6 (happy path, rollback, conflict, undo/redo, scale, mobile)

- Kanban board with 3 columns (Todo / In Progress / Done)
- Drag-and-drop task movement; status dropdown fallback on mobile
- Task creation/edit modal (title, description, assignee, priority, tags)
- Filtering by assignee and priority; full-text search across title and description
- Optimistic updates: mock API 2s delay, 10% failure rate, automatic rollback
- Real-time multi-user simulation: random task updates every 10–15s
- Conflict detection and reconciliation (keep mine / take theirs)
- Virtualized task list for 1000+ tasks
- Undo/redo: 50-action history stack, Ctrl/Cmd+Z and Ctrl/Cmd+Shift+Z, UI hint label
- Responsive layout — mobile-first, columns stack < 768px
- Error boundaries at feature level
- TypeScript strict mode throughout

## Phase 2 — Post-MVP

**Option B — Advanced Query Builder:**
- Compound AND/OR filter logic with visual builder UI
- URL param sync for shareable filter links
- Saved queries in localStorage
- Performance maintained for 1000+ tasks

**Option C — Conflict Resolution System:**
- Real-time presence indicators (who's viewing/editing)
- Edit locking when another user is active on a task
- Merge changes modal (Keep mine / Take theirs / Merge manually)
- CRDT-like logic for description field
- Network reconnection handling

## Phase 3 — End-of-Project Polish

- Keyboard shortcuts for power users
- Performant animations and transitions
- Dark mode
- Offline-first with service workers
- Technical blog post on one complex design decision
- README with assumptions and decisions documented
- AWS API Gateway + Lambda real CRUD API — only if interviewer requests
- AWS S3 + CloudFront deployment — only if interviewer requests

## Risk Mitigation

**Risk 1 — Undo/redo + optimistic rollback interaction (HIGH)**
Concurrent undos and API rollbacks can corrupt the history stack.
*Mitigation:* Design state machine upfront. Model history as an immutable stack with explicit action types. Rollbacks restore a prior snapshot — they never push to history.

**Risk 2 — Virtualization + real-time updates (MEDIUM)**
Applying remote updates to a virtualized list can cause scroll jumps.
*Mitigation:* Stable item keys, keyed diffing on updates, never reset the full list on a remote mutation.

**Risk 3 — Race conditions on rapid drag (MEDIUM)**
Multiple concurrent mock API calls with independent failure rates produce out-of-order rollbacks.
*Mitigation:* Tag each operation with a unique ID; apply rollbacks only to the matching operation.
