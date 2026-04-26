# Real-Time Collaboration Board

A modern kanban board with simulated real-time collaboration, built with React 19 and TypeScript. Features optimistic updates, conflict resolution, and full undo/redo support.

![React](https://img.shields.io/badge/React-19-blue?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-6.0-blue?logo=typescript)
![Tailwind](https://img.shields.io/badge/Tailwind-4.0-blue?logo=tailwindcss)
![Vite](https://img.shields.io/badge/Vite-8.0-purple?logo=vite)

## ✨ Features

- **Drag & Drop** — Smooth task reordering with [@dnd-kit](https://dndkit.com/)
- **Optimistic Updates** — Instant UI feedback with automatic rollback on failure
- **Conflict Resolution** — Handles concurrent edits gracefully
- **Undo/Redo** — Full history stack with keyboard shortcuts (Ctrl+Z / Ctrl+Y)
- **Virtualized Lists** — Efficient rendering of large task lists via [@tanstack/react-virtual](https://tanstack.com/virtual)
- **Accessible** — ARIA labels, focus management, keyboard navigation

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

## 📁 Project Structure

```
src/
├── features/           # Feature modules
│   ├── board/          # Board layout, columns, drag context
│   ├── tasks/          # Task cards, modals, CRUD
│   ├── filters/        # Filter bar, search, assignee/priority filters
│   ├── history/        # Undo/redo stack, keyboard shortcuts
│   └── realtime/       # Simulated real-time updates, conflict detection
├── store/              # Contexts, reducers, AppProvider
├── api/                # Mock API client (no backend)
├── shared/             # Cross-feature utilities, hooks, UI primitives
├── components/ui/      # shadcn components (copy-owned)
└── types/              # Shared TypeScript definitions
```

## 🏗️ Architecture

### State Management

Single `boardReducer` manages all board state atomically, unpacked into **7 separate read contexts** to minimize re-renders:

```
BoardDispatch → BoardState → PendingOps → Conflict → BoardAPI → Filter → FilterAPI → History
```

### Mutation Flow

```
User action → useBoardAPI (action creator)
  → useHistory (records inverse for undo)
    → boardDispatch (optimistic update)
      → API call → OP_SUCCESS or OP_ROLLBACK
```

### Key Patterns

- **Optimistic Updates**: Capture `opId` before async calls, dispatch immediately, rollback on failure
- **History Stack**: User actions (TASK_MOVE, TASK_CREATE, etc.) recorded; system actions (OP_SUCCESS, REMOTE_UPDATE) bypass history
- **Context Stability**: Action creators wrapped in `useMemo([])` — never cause re-renders

## 🛠️ Tech Stack

| Category | Technologies |
|----------|-------------|
| **Framework** | React 19, TypeScript 6.0 (strict) |
| **Styling** | Tailwind CSS 4, shadcn, class-variance-authority |
| **Drag & Drop** | @dnd-kit/core, @dnd-kit/sortable |
| **Forms** | React Hook Form |
| **Testing** | Vitest, Testing Library, jsdom |
| **Build** | Vite 8 |

## 📜 Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Type-check and build for production |
| `npm run lint` | Run ESLint |
| `npm test` | Run Vitest in watch mode |
| `npx vitest run` | Single test run |

## 🧪 Testing

Tests are co-located with their subjects:

```
TaskCard.tsx
TaskCard.test.tsx
```

Run a specific test file:
```bash
npx vitest run src/store/boardReducer.test.ts
```

## 📄 License

MIT
