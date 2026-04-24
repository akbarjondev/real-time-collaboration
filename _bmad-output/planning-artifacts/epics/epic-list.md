# Epic List

## Epic 1: Project Foundation & Runnable Board Shell
A developer can run the project locally and see a Kanban board populated with seed tasks in 3 columns. The complete state architecture, mock API layer, and feature folder structure are in place.
**FRs covered:** FR4 (partial — seed tasks visible), FR5

## Epic 2: Task CRUD & Full Task Display
Users can create, view, edit, and delete tasks with all fields (title, description, assignee, priority, tags). The task detail modal works end-to-end.
**FRs covered:** FR1, FR2, FR3, FR4, FR6

## Epic 3: Task Movement — Drag-and-Drop & Status Changes
Users can move tasks between columns via drag-and-drop on desktop and a status dropdown on mobile. Changes reflect immediately on the board.
**FRs covered:** FR12, FR13, FR14

## Epic 4: Filtering & Search
Users can filter the board by assignee and priority, search by text, and combine multiple filters. The Direction D filter bar and ⌘K overlay are fully implemented.
**FRs covered:** FR7, FR8, FR9, FR10, FR11

## Epic 5: Optimistic Updates & Error Recovery
Users experience instant feedback on all mutations. Failed API calls roll back automatically with descriptive error toasts. In-flight loading indicators appear per-card. Error boundaries prevent full-app crashes.
**FRs covered:** FR15, FR16, FR17, FR18, FR19, FR20, FR21

## Epic 6: Real-Time Collaboration Simulation & Conflict Resolution
Users see simulated remote updates from a second user every 10–15 seconds with quiet info toasts. When a conflict is detected during an active edit, users can choose Keep Mine or Take Theirs without data loss.
**FRs covered:** FR22, FR23, FR24, FR25, FR26

## Epic 7: Undo/Redo History System
Users can undo and redo any tracked action via keyboard shortcuts. A persistent Undo Hint Bar always shows the next undoable action. Undo/redo remains correct even after optimistic rollbacks.
**FRs covered:** FR27, FR28, FR29, FR30, FR31, FR32, FR33

## Epic 8: Performance & Scale
Users experience smooth 60fps board operation with 1000+ tasks. Virtualized rendering, memoized filters, and stable remote update application are verified.
**FRs covered:** FR34, FR35, FR36

## Epic 9: Responsive Design & Accessibility
Users can use the full board on mobile devices (stacked columns, status dropdown, 44px tap targets) and with keyboard-only or screen reader navigation (full ARIA, focus management, reduced motion).
**FRs covered:** FR37, FR38, FR39, FR40

---
