# Story 5.4: Feature-Level Error Boundaries

Status: review

## Blocker

None — ready to implement. Can proceed concurrently with Stories 5.1–5.3.

---

## Story

As a user,
I want the app to recover gracefully from unexpected render errors without the entire page going blank,
so that a bug in the board area doesn't lose my context or force a full page reload.

## Acceptance Criteria

1. **Given** the app is running **When** audited **Then** there are at minimum two distinct `ErrorBoundary` instances: one wrapping the entire app and one wrapping only the board area.
2. **Given** any `ErrorBoundary` catches an error **When** the fallback renders **Then** a "Retry" button is visible that resets the boundary's error state and attempts to re-render children.
3. **Given** the "Retry" button is clicked **When** `ErrorBoundary` re-renders **Then** its error state is cleared and children are attempted again; if the error was transient it recovers.
4. **Given** the app is in development mode (`import.meta.env.DEV === true`) **When** an error is caught **Then** the error message is displayed in the fallback UI.
5. **Given** the app is in production mode **When** an error is caught **Then** only a generic recovery message is shown — no raw error text.
6. **Given** the board-level ErrorBoundary catches an error **When** the fallback renders **Then** the header (board title + New Task button) remains visible — only the board columns area is replaced by the fallback.
7. **Given** any ErrorBoundary fallback **When** it renders **Then** the fallback `<div>` has `role="alert"` and is focusable or contains a focusable element (the Retry button).
8. **Given** the `ErrorBoundary` component **When** audited **Then** it uses `getDerivedStateFromError` + `componentDidCatch` as a class component (React requires this for error boundaries).

## Tasks / Subtasks

- [x] Task 1: Extend `ErrorBoundary.tsx` with a Retry button and `onReset` prop (AC: #2, #3, #4, #5, #7, #8)
  - [ ] Add optional `onReset?: () => void` prop to `ErrorBoundaryProps`
  - [ ] Add optional `fallbackMessage?: string` prop for a custom production message
  - [ ] Add a "Try again" button to the default fallback that calls `this.setState({ hasError: false, error: null })` — this clears the error state and triggers a re-render of children
  - [ ] If `onReset` prop is provided, call it AFTER `this.setState(...)` when the Retry button is clicked
  - [ ] Retain `role="alert"` on the fallback wrapper `<div>`
  - [ ] In production (`!import.meta.env.DEV`): show `fallbackMessage ?? 'Something went wrong'` — generic only
  - [ ] In development (`import.meta.env.DEV`): show the error message in a `<pre>` element (already present, keep as-is)
  - [ ] Style the Retry button using Tailwind tokens (no hardcoded hex colors): `bg-violet-600 hover:bg-violet-700 text-white rounded-lg px-4 py-2 text-sm font-medium focus-visible:ring-2 focus-visible:ring-violet-500 min-h-[44px]`
  - [ ] Ensure the "Try again" button is the first focusable element inside the fallback for keyboard users

- [x] Task 2: Add board-level ErrorBoundary in `KanbanBoard.tsx` (AC: #1, #6)
  - [ ] Wrap the `<DndContext>` + `<main>` + `<DragOverlay>` block in a `<ErrorBoundary fallbackMessage="Board failed to load">` instance
  - [ ] Do NOT wrap the `<header>` element — header must stay visible when the board area crashes
  - [ ] The board-level ErrorBoundary is a sibling boundary, not nested inside the app-level one
  - [ ] Structure after change:
    ```tsx
    // App.tsx — unchanged: app-level boundary
    <ErrorBoundary fallbackMessage="App failed to load">
      <KanbanBoard />
    </ErrorBoundary>

    // KanbanBoard.tsx — new board-level boundary around columns only
    <div className="min-h-screen bg-zinc-50">
      <header>...</header>
      {/* FilterBar stub */}
      {/* UndoHintBar stub */}
      <ErrorBoundary fallbackMessage="Board failed to load">
        <DndContext ...>
          <main>...</main>
          <DragOverlay>...</DragOverlay>
        </DndContext>
      </ErrorBoundary>
    </div>
    ```

- [x] Task 3: Update `App.tsx` to pass `fallbackMessage` prop (AC: #5, #6)
  - [ ] Change `<ErrorBoundary>` in `App.tsx` to `<ErrorBoundary fallbackMessage="App failed to load">`
  - [ ] This ensures the app-level boundary shows a meaningful message in production

- [x] Task 4: Write tests for `ErrorBoundary` component (AC: #2, #3, #4, #7, #8)
  - [x] Created `src/shared/components/ErrorBoundary.test.tsx` (co-located with `ErrorBoundary.tsx`)
  - [x] Test: renders children when no error is thrown
  - [x] Test: renders fallback with `role="alert"` when a child throws
  - [x] Test: renders "Try again" button in fallback
  - [x] Test: clicking "Try again" resets error state and re-renders children
  - [x] Test: in development mode, error message is displayed (mock `import.meta.env.DEV = true` via `vi.stubEnv`)
  - [x] Test: `onReset` callback is called when "Try again" is clicked (if provided)

---

## Dev Notes

### ErrorBoundary — Full Updated Implementation

The existing `ErrorBoundary.tsx` needs these additions: `onReset` prop, `fallbackMessage` prop, and a "Try again" button. The class structure must remain unchanged (React only supports error boundaries as class components).

```tsx
// src/shared/components/ErrorBoundary.tsx

import React from 'react'

type ErrorBoundaryProps = {
  children: React.ReactNode
  fallback?: React.ReactNode
  fallbackMessage?: string
  onReset?: () => void
}

type ErrorBoundaryState = {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error('[ErrorBoundary] Caught render error:', error, info)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
    this.props.onReset?.()
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback != null) {
        return this.props.fallback
      }
      return (
        <div
          role="alert"
          className="flex flex-col items-center justify-center p-8 text-center gap-4"
        >
          <p className="text-zinc-700 font-medium">
            {import.meta.env.DEV && this.state.error != null
              ? this.state.error.message
              : (this.props.fallbackMessage ?? 'Something went wrong')}
          </p>
          <button
            onClick={this.handleReset}
            className="bg-violet-600 hover:bg-violet-700 text-white rounded-lg px-4 py-2 text-sm font-medium focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:outline-none min-h-[44px]"
          >
            Try again
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
```

Key decisions in this implementation:
- `handleReset` is a class property arrow function (no `bind` needed in constructor)
- The custom `fallback` prop bypass remains — if a consumer passes `fallback`, the Retry button is NOT shown (consumer is responsible for recovery in that case)
- `fallbackMessage` only affects production mode; dev mode always shows the raw error
- The button uses Tailwind tokens, not inline styles — the surrounding `<div>` uses `className` too; delete the old `style={{}}` attributes

### Boundary Placement Strategy

Two instances serve different recovery scopes:

| Boundary | Location | What it protects | Recovery |
|----------|----------|-----------------|----------|
| App-level | `App.tsx` wrapping `<KanbanBoard />` | Catastrophic failure in any top-level component | Full board re-mount |
| Board-level | `KanbanBoard.tsx` wrapping DndContext+main | Drag-and-drop or column render crash | Re-mount only the board, header stays |

If the board-level boundary catches an error, the user still sees the header with "New Task" button — they can attempt recovery without losing their visible board header context.

If the app-level boundary catches an error (e.g., `AppProvider` or context initialization failure), the whole view is replaced with the fallback — this is the last resort.

### KanbanBoard.tsx Boundary Placement

The `TaskModal` renders inside `KanbanBoard` but outside the board-level ErrorBoundary on purpose — modal errors should bubble to the app-level boundary (TaskModal crashes are rare and usually indicate a programming error, not a column-level render issue).

```tsx
// KanbanBoard.tsx structure after change
return (
  <div className="min-h-screen bg-zinc-50">
    <header className="...">
      {/* ... unchanged header content ... */}
    </header>

    {/* FilterBar — Story 4.2 */}
    {/* UndoHintBar — Epic 7 */}

    <ErrorBoundary fallbackMessage="Board failed to load">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <main className="flex gap-4 p-4 overflow-x-auto items-start">
          {COLUMNS.map((col) => (
            <BoardColumn
              key={col.status}
              status={col.status}
              title={col.title}
              onOpenCreate={openCreate}
              onOpenEdit={handleOpenEdit}
            />
          ))}
        </main>

        <DragOverlay>
          {activeTask ? <TaskCard task={activeTask} isOverlay isPending={false} /> : null}
        </DragOverlay>
      </DndContext>
    </ErrorBoundary>

    <TaskModal
      isOpen={isOpen}
      mode={mode}
      task={editingTask}
      prefillValues={prefillValues}
      onClose={close}
      onOpenCreate={openCreate}
    />
  </div>
)
```

Note: `<TaskModal>` is rendered outside the board-level `ErrorBoundary` — this is intentional.

### Testing ErrorBoundary With Vitest + JSDOM

To test that `ErrorBoundary` catches errors, render a component that throws:

```tsx
// In ErrorBoundary.test.tsx
function ThrowingComponent({ shouldThrow }: { shouldThrow: boolean }): React.JSX.Element {
  if (shouldThrow) throw new Error('Test error message')
  return <div>Rendered successfully</div>
}

it('renders fallback with retry button when child throws', () => {
  // Suppress console.error for expected boundary error
  const spy = vi.spyOn(console, 'error').mockImplementation(() => {})

  render(
    <ErrorBoundary fallbackMessage="Test failed">
      <ThrowingComponent shouldThrow={true} />
    </ErrorBoundary>
  )

  expect(screen.getByRole('alert')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()

  spy.mockRestore()
})
```

Use `vi.spyOn(console, 'error').mockImplementation(() => {})` to suppress React's error boundary console output in tests.

For testing the Retry behavior, you need to control whether the child throws. Use a `useState`-driven wrapper or a `React.act` + `fireEvent.click` sequence:

```tsx
it('resets error state and re-renders children when retry is clicked', async () => {
  let shouldThrow = true
  function ControlledThrower(): React.JSX.Element {
    if (shouldThrow) throw new Error('Controlled error')
    return <div>Recovered</div>
  }

  const { rerender } = render(
    <ErrorBoundary>
      <ControlledThrower />
    </ErrorBoundary>
  )

  // ErrorBoundary has caught the error — fallback shown
  expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()

  // Stop throwing before clicking retry
  shouldThrow = false
  fireEvent.click(screen.getByRole('button', { name: /try again/i }))

  // Children re-render successfully
  expect(screen.getByText('Recovered')).toBeInTheDocument()
})
```

### File Paths

```
src/shared/components/ErrorBoundary.tsx       — add Retry button, fallbackMessage, onReset prop (Task 1)
src/shared/components/ErrorBoundary.test.tsx  — new test file (Task 4)
src/features/board/components/KanbanBoard.tsx — add board-level ErrorBoundary (Task 2)
src/App.tsx                                   — add fallbackMessage prop (Task 3)
```

### Forbidden Patterns

- `React.memo` or functional components for ErrorBoundary: React requires class component for `getDerivedStateFromError` and `componentDidCatch`
- Catching errors in `componentDidCatch` and retrying automatically (e.g., `this.setState(...)` inside `componentDidCatch`): this can cause infinite loops; retry must be user-initiated only
- Wrapping `<TaskModal>` inside the board-level ErrorBoundary: modal errors should propagate to app-level boundary
- Hardcoded hex colors on the Retry button: use Tailwind tokens only
- `process.env.NODE_ENV` for dev checks: use `import.meta.env.DEV` (Vite)
- `focus:outline-none` on the Retry button without `focus-visible:ring-2 focus-visible:ring-violet-500`
- Calling `this.setState` inside `componentDidCatch`: only log there; state reset is user-triggered via the Retry button

### Verification Checklist

```
1. In the browser console, temporarily make BoardColumn throw (add `throw new Error('test')` at top): confirm board-level fallback renders with "Try again" button and header remains visible
2. Click "Try again" → remove the thrown error → confirm columns re-render
3. Check import.meta.env.DEV === true in dev build: confirm error message text is visible in fallback
4. Run production build (npm run build && npm run preview): confirm only the fallbackMessage appears, no raw error text
5. npm run test → all tests pass (ErrorBoundary.test.tsx tests pass)
6. npm run lint → zero warnings
7. Tab key reaches the "Try again" button in the fallback UI
```

---

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

_None_

### Completion Notes List

- Extended ErrorBoundary with fallbackMessage, onReset props, and "Try again" button (class property arrow fn handleReset)
- Replaced inline styles with Tailwind tokens in fallback render
- Added board-level ErrorBoundary in KanbanBoard.tsx wrapping DndContext+main+DragOverlay; header stays outside
- Updated App.tsx to pass fallbackMessage="App failed to load"
- Created ErrorBoundary.test.tsx with 7 tests: children render, role=alert, retry button, retry behavior, onReset callback, fallbackMessage in prod, custom fallback node

### File List

- src/shared/components/ErrorBoundary.tsx
- src/shared/components/ErrorBoundary.test.tsx (new)
- src/features/board/components/KanbanBoard.tsx
- src/App.tsx

### Change Log

- Extended ErrorBoundary with Retry button and fallbackMessage/onReset props (2026-04-24)
- Added board-level ErrorBoundary in KanbanBoard.tsx (2026-04-24)

### Review Findings

_TBD_
