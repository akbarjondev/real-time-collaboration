# Story 1.1: Initialize Project & Install Dependencies

Status: ready-for-dev

## Story

As a developer,
I want to initialize the Vite React SWC TypeScript project with all required dependencies installed,
so that the development environment is ready for feature implementation.

## Acceptance Criteria

1. **Given** an empty working directory **When** the developer runs the initialization commands **Then** a Vite project scaffolded with `react-swc-ts` template exists in the current directory
2. **And** the following production dependencies are installed: `tailwindcss @tailwindcss/vite`, `@dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities`, `@tanstack/react-virtual`, `nanoid`, `sonner`, `react-hook-form`, `clsx tailwind-merge`
3. **And** dev dependencies installed: `vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom`
4. **And** `npm run dev` starts the Vite dev server without errors
5. **And** `npm run build` produces a production build without errors

## Tasks / Subtasks

- [ ] Initialize Vite project in current directory (AC: 1)
  - [ ] Run `npm create vite@latest . -- --template react-swc-ts` (`.` because repo already exists at project root)
  - [ ] Run `npm install` for base deps
- [ ] Install production dependencies (AC: 2)
  - [ ] `npm install tailwindcss @tailwindcss/vite`
  - [ ] `npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities`
  - [ ] `npm install @tanstack/react-virtual`
  - [ ] `npm install nanoid sonner react-hook-form`
  - [ ] `npm install clsx tailwind-merge`
- [ ] Install dev dependencies (AC: 3)
  - [ ] `npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom`
- [ ] Verify dev server and build (AC: 4, 5)
  - [ ] Run `npm run dev` — confirm server starts without errors
  - [ ] Run `npm run build` — confirm production build succeeds

## Dev Notes

### Critical: Project Is Initialized Inside the Existing Repo

The working directory is already the git repo root (`real-time-collaboration/`). Do NOT create a nested subdirectory. Use `.` as the Vite project path:

```bash
npm create vite@latest . -- --template react-swc-ts
```

Vite may ask "Current directory is not empty. Remove existing files and continue?" — answer **yes** (only `.claude/`, `_bmad/`, `_bmad-output/`, `docs/` are present; Vite will not touch them).

### Exact Installation Commands

```bash
# Step 1: Scaffold
npm create vite@latest . -- --template react-swc-ts
npm install

# Step 2: Tailwind v4 (NO tailwind.config.js needed — uses @tailwindcss/vite plugin)
npm install tailwindcss @tailwindcss/vite

# Step 3: dnd-kit (drag-and-drop)
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities

# Step 4: Virtualization
npm install @tanstack/react-virtual

# Step 5: Utilities
npm install nanoid sonner react-hook-form clsx tailwind-merge

# Step 6: Test tooling (dev deps)
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

### vite.config.ts After Install

Vite scaffold produces a minimal config. This story ONLY installs; toolchain config (TypeScript strict, path aliases, Tailwind plugin, Vitest) is Story 1.2's responsibility. Do NOT configure vite.config.ts beyond what Vite scaffold generates in this story.

### Package Versions Context

- **Tailwind v4** — uses `@tailwindcss/vite` plugin approach; does not need `tailwind.config.js`
- **dnd-kit** — `@dnd-kit/core` + `@dnd-kit/sortable` + `@dnd-kit/utilities` are three separate packages; all three are required
- **nanoid** — for generating unique IDs; used everywhere (tasks, ops, history entries)
- **sonner** — toast notification library; replaces react-hot-toast / react-toastify
- **react-hook-form** — form management for task modal
- **clsx + tailwind-merge** — used together via `cn()` utility for conditional class composition
- **@tanstack/react-virtual** — hooks-based virtualization; TypeScript-native; used in Epic 8 but installed now per project setup requirements

### Scope Boundary

This story ONLY covers: scaffold + install + verify dev/build run.

Do NOT implement in this story:
- TypeScript config changes (Story 1.2)
- Tailwind plugin wiring in vite.config.ts (Story 1.2)
- Vitest config (Story 1.2)
- Any source files beyond what Vite scaffold generates
- Folder structure creation (Story 1.2+)

### Project Structure Notes

After `npm create vite@latest . -- --template react-swc-ts`, the scaffold generates:
```
src/
  App.css
  App.tsx
  assets/
  index.css
  main.tsx
  vite-env.d.ts
index.html
package.json
tsconfig.json
tsconfig.app.json
tsconfig.node.json
vite.config.ts
```

These are the STARTING FILES. Do not modify them in this story — that is Story 1.2.

### References

- Initialization command: [Source: architecture.md#Starter-Template-Evaluation]
- Dependency list: [Source: epics.md#Story-1.1-Acceptance-Criteria]
- Tailwind v4 approach (no config file): [Source: architecture.md#Architectural-Decisions-Provided-by-Starter]
- dnd-kit, @tanstack/react-virtual, nanoid, sonner, react-hook-form: [Source: epics.md#Additional-Requirements]

## Dev Agent Record

### Agent Model Used

_to be filled by dev agent_

### Debug Log References

### Completion Notes List

### File List
