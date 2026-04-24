# Functional Requirements

## Task Management

- **FR1:** User can create a task with title, description, assignee, priority (Low/Medium/High), and optional tags
- **FR2:** User can edit any field of an existing task
- **FR3:** User can delete a task
- **FR4:** User can view tasks with title, description, status, priority badge, assignee, and created date
- **FR5:** System organizes tasks into three status columns: Todo, In Progress, and Done
- **FR6:** User can open a task detail modal from a task card

## Board Navigation & Filtering

- **FR7:** User can filter the board by assignee
- **FR8:** User can filter the board by priority level
- **FR9:** User can search tasks by title and description text
- **FR10:** User can combine multiple active filters simultaneously
- **FR11:** System updates filtered results in real time as filter inputs change

## Task Movement

- **FR12:** User can move a task between columns via drag-and-drop on desktop
- **FR13:** User can change a task's status via a status selector on mobile/touch devices
- **FR14:** System reflects column changes immediately upon user interaction (before API confirmation)

## Optimistic Updates & Error Handling

- **FR15:** System applies task mutations immediately to the UI before the mock API resolves
- **FR16:** System simulates API latency of approximately 2 seconds per operation
- **FR17:** System randomly fails approximately 10% of API operations
- **FR18:** System rolls back a failed mutation to its prior state automatically
- **FR19:** System notifies the user with a descriptive toast when a mutation fails and is rolled back
- **FR20:** System displays a loading indicator on tasks with in-flight API operations
- **FR21:** System recovers gracefully from feature-level errors without crashing the full application

## Real-Time Collaboration Simulation

- **FR22:** System applies random task updates simulating a second user every 10–15 seconds
- **FR23:** System notifies the user with a non-intrusive toast when a remote update occurs
- **FR24:** System detects when an incoming remote update conflicts with a user's active edit
- **FR25:** User can resolve a conflict by choosing to keep their own change or accept the remote change
- **FR26:** System applies the resolved state without data loss from either version

## History Management

- **FR27:** User can undo the most recent tracked action via Ctrl/Cmd+Z
- **FR28:** User can redo the most recently undone action via Ctrl/Cmd+Shift+Z
- **FR29:** System maintains a history stack of up to 50 tracked actions
- **FR30:** System tracks all task mutations (status change, field edits, creation, deletion)
- **FR31:** System displays a UI label indicating what action will be undone or redone next
- **FR32:** System clears the redo stack when the user performs a new action after undoing
- **FR33:** System handles undo/redo correctly in the presence of optimistic rollbacks

## Performance & Rendering

- **FR34:** System renders task columns without degradation when total task count exceeds 1,000
- **FR35:** System renders only visible task items within the viewport (virtualization)
- **FR36:** System applies remote updates to the task list without resetting scroll position or causing full re-renders

## Responsive & Accessible UI

- **FR37:** System displays task columns stacked vertically on screens narrower than 768px
- **FR38:** All interactive elements are reachable and operable via keyboard navigation
- **FR39:** All buttons, modals, and form inputs carry descriptive ARIA labels
- **FR40:** Modals trap focus while open and restore focus to the triggering element on close
