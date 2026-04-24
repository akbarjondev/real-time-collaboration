# Story 1.1: Initialize Project with Dependencies and Configuration

Status: done

## Story

As a developer,
I want a fully initialized Vite project with all required dependencies and configuration files,
so that I can start implementing features on a correctly configured, TypeScript-strict foundation.

## Acceptance Criteria

1. **Given** a clean working directory **When** the project is initialized using `npm create vite@latest real-time-collaboration -- --template react-swc-ts` **Then** the project compiles with zero TypeScript errors in strict mode **And** `npm run dev` starts the Vite dev server without errors.

2. **Given** the initialized project **When** all required dependencies are installed **Then** `npm install` completes without errors and all packages are resolvable.

3. **Given** the installed dependencies **When** `vite.config.ts` is configured with `@vitejs/plugin-react-swc`, `@tailwindcss/vite`, and `resolve.alias: { '@': path.resolve(__dirname, './src') }` **Then** imports using the `@/` alias resolve correctly to `src/`.

4. **Given** `tsconfig.app.json` **When** configured with `"strict": true`, `"noUncheckedIndexedAccess": true`, and `"paths": { "@/*": ["./src/*"] }` **Then** `tsc --noEmit` passes with zero errors.

5. **Given** `vitest.config.ts` **When** configured with `environment: 'jsdom'` and `setupFiles: ['./src/test-setup.ts']` (which imports `@testing-library/jest-dom`) **Then** `npm run test` runs successfully with zero test failures.

6. **Given** `src/index.css` **When** it contains `@import "tailwindcss"` **Then** Tailwind utility classes render correctly in the browser.

7. **Given** the feature-based folder structure defined in the architecture **When** the empty directories and placeholder files are created **Then** the structure matches the architecture specification exactly with no barrel `index.ts` exports.

## Tasks / Subtasks

- [x] Task 1: Initialize Vite project with React SWC TypeScript template (AC: #1)
  - [ ] Run `npm create vite@latest real-time-collaboration -- --template react-swc-ts`
  - [ ] Verify `npm run dev` starts without errors on the default scaffold

- [x] Task 2: Install all production and dev dependencies (AC: #2)
  - [ ] Install production deps: `npm install tailwindcss @tailwindcss/vite @tanstack/react-virtual @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities nanoid sonner react-hook-form`
  - [ ] Install dev deps: `npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom`
  - [ ] Verify `npm install` completes with zero errors

- [x] Task 3: Configure `vite.config.ts` (AC: #3)
  - [ ] Import `react` from `@vitejs/plugin-react-swc`, `tailwindcss` from `@tailwindcss/vite`, `path` from `node:path`
  - [ ] Add both plugins to `plugins: [react(), tailwindcss()]`
  - [ ] Add `resolve.alias: { '@': path.resolve(__dirname, './src') }`

- [x] Task 4: Configure `tsconfig.app.json` (AC: #4)
  - [ ] Set `"strict": true`
  - [ ] Set `"noUncheckedIndexedAccess": true`
  - [ ] Add `"paths": { "@/*": ["./src/*"] }` under `compilerOptions`
  - [ ] Run `tsc --noEmit` and confirm zero errors

- [x] Task 5: Create `vitest.config.ts` and `src/test-setup.ts` (AC: #5)
  - [ ] Create `vitest.config.ts` with `environment: 'jsdom'` and `setupFiles: ['./src/test-setup.ts']`
  - [ ] Create `src/test-setup.ts` containing `import '@testing-library/jest-dom'`
  - [ ] Verify `npm run test` runs successfully

- [x] Task 6: Configure Tailwind CSS v4 (AC: #6)
  - [ ] Replace entire contents of `src/index.css` with `@import "tailwindcss"`
  - [ ] **DO NOT create `tailwind.config.js`** — Tailwind v4 uses the CSS import approach only

- [x] Task 7: Scaffold complete feature-based folder structure (AC: #7)
  - [ ] Create all directories per the architecture spec (see Dev Notes)
  - [ ] Create placeholder `.gitkeep` files where needed to track empty directories
  - [ ] **DO NOT create any `index.ts` barrel export files**
  - [ ] Create stub files listed in Dev Notes so TypeScript can resolve imports in later stories

## Dev Notes

### Critical Architecture Constraints

**FORBIDDEN patterns — will break the entire architecture:**
- Barrel `index.ts` files in any feature or shared folder — import directly from file paths
- Wrapping context values in objects: `value={{ tasks }}` — use `value={tasks}`
- Raw `useContext(BoardStateContext)` — always consume via custom hooks
- Number IDs — always `nanoid()` strings
- `Date` objects or `Date.now()` timestamps — always `new Date().toISOString()`
- `loading: boolean + data + error` async state shape — always discriminated union
- `any` type — zero tolerance; use `unknown` + type guards

**This story's scope:** Project initialization, configuration, folder scaffolding ONLY. Do NOT implement:
- State management contexts (Story 1.2)
- Mock API layer or seed data (Story 1.3)
- Board shell or any React components (Story 1.4)
- shadcn/ui component installation (Story 1.4)

### Exact Dependency List

**Production:**
```
tailwindcss @tailwindcss/vite
@tanstack/react-virtual
@dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
nanoid sonner react-hook-form
```

**Dev:**
```
vitest @testing-library/react @testing-library/jest-dom jsdom
```

**Note:** `@vitejs/plugin-react-swc` is pre-installed by the Vite template — do not reinstall.

### Exact Configuration File Contents

**`vite.config.ts`:**
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
})
```

**`vitest.config.ts`** (create this file — separate from `vite.config.ts`):
```typescript
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
  },
})
```

**`src/test-setup.ts`:**
```typescript
import '@testing-library/jest-dom'
```

**`src/index.css`** (replace entire file):
```css
@import "tailwindcss";
```

**`tsconfig.app.json`** — add/update these compilerOptions (keep existing fields):
```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "paths": { "@/*": ["./src/*"] }
  }
}
```

### Exact Folder Structure to Scaffold

Create ALL these directories and stub files. For empty directories, add `.gitkeep`.

```
src/
├── main.tsx                          ← keep default Vite scaffold content for now
├── App.tsx                           ← keep default Vite scaffold content for now
├── index.css                         ← REPLACE with @import "tailwindcss"
├── test-setup.ts                     ← CREATE: import '@testing-library/jest-dom'
│
├── types/
│   ├── task.types.ts                 ← CREATE stub (empty export {})
│   └── common.types.ts               ← CREATE stub (empty export {})
│
├── api/
│   ├── mock-client.ts                ← CREATE stub (empty export {})
│   ├── tasks.ts                      ← CREATE stub (empty export {})
│   └── types.ts                      ← CREATE stub (empty export {})
│
├── store/
│   ├── AppProvider.tsx               ← CREATE stub
│   ├── BoardStateContext.tsx         ← CREATE stub
│   ├── PendingOpsContext.tsx         ← CREATE stub
│   ├── ConflictContext.tsx           ← CREATE stub
│   ├── BoardAPIContext.tsx           ← CREATE stub
│   ├── boardReducer.ts               ← CREATE stub
│   ├── FilterContext.tsx             ← CREATE stub
│   ├── FilterAPIContext.tsx          ← CREATE stub
│   └── HistoryContext.tsx            ← CREATE stub
│
├── features/
│   ├── board/
│   │   ├── components/
│   │   │   ├── KanbanBoard.tsx       ← CREATE stub
│   │   │   └── BoardColumn.tsx       ← CREATE stub
│   │   └── hooks/
│   │       └── useBoardDnd.ts        ← CREATE stub
│   │
│   ├── tasks/
│   │   ├── components/
│   │   │   ├── TaskCard.tsx          ← CREATE stub
│   │   │   └── TaskModal.tsx         ← CREATE stub
│   │   ├── hooks/
│   │   │   └── useTaskModal.ts       ← CREATE stub
│   │   └── utils.ts                  ← CREATE stub
│   │
│   ├── filters/
│   │   ├── components/
│   │   │   └── FilterBar.tsx         ← CREATE stub
│   │   └── utils/
│   │       └── filterTasks.ts        ← CREATE stub
│   │
│   ├── history/
│   │   ├── components/
│   │   │   └── UndoHintBar.tsx       ← CREATE stub
│   │   ├── hooks/
│   │   │   └── useHistory.ts         ← CREATE stub
│   │   └── types.ts                  ← CREATE stub
│   │
│   └── realtime/
│       ├── components/
│       │   └── ConflictModal.tsx     ← CREATE stub
│       └── hooks/
│           └── useRealtimeSimulation.ts ← CREATE stub
│
└── shared/
    ├── components/
    │   ├── ErrorBoundary.tsx         ← CREATE stub
    │   └── ToastProvider.tsx         ← CREATE stub
    ├── hooks/
    │   └── useKeyboardShortcut.ts    ← CREATE stub
    └── utils/
        ├── sleep.ts                  ← CREATE stub
        └── mockData.ts               ← CREATE stub
```

**Stub file format** (use for all `.ts`/`.tsx` stubs — keeps TypeScript happy without implementation):
```typescript
export {}
```

### Naming Conventions (enforce from day 1)

| Artifact | Convention | Example |
|---|---|---|
| Component files | PascalCase.tsx | `TaskCard.tsx` |
| Hook files | camelCase with `use` prefix | `useHistory.ts` |
| Context files | PascalCase + Context suffix | `BoardStateContext.tsx` |
| Test files | co-located, same folder | `TaskCard.test.tsx` |
| Action types | SCREAMING_SNAKE_CASE, NOUN_VERB | `TASK_MOVE`, `OP_ROLLBACK` |
| TypeScript types | PascalCase | `Task`, `BoardAction` |
| Union string values | lowercase | `'todo'`, `'in-progress'` |

### TypeScript Patterns (establish from the start)

```typescript
// IDs — nanoid() strings only (NEVER numbers)
type ID = string

// Dates — ISO 8601 strings only (NEVER Date objects)
createdAt: new Date().toISOString()

// Async state — discriminated union (NEVER loading/data/error flags)
type AsyncState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: string }
```

### Package Versions Context

- **Tailwind CSS v4** — uses `@import "tailwindcss"` in CSS; NO `tailwind.config.js` required for basic use
- **@dnd-kit** — requires all three packages: `core`, `sortable`, AND `utilities` together
- **Sonner** — React 18 native toast library, Tailwind-compatible
- **Vitest** — configured in a SEPARATE `vitest.config.ts` (not inside `vite.config.ts`)

### Project Structure Notes

- This is a greenfield project — `npm create vite@latest` creates the project from scratch
- The Vite SWC template pre-installs: React, TypeScript, `@vitejs/plugin-react-swc`, ESLint with react-hooks plugin
- ESLint is pre-configured in the template with zero-warning target (NFR11) — do not modify unless necessary
- `App.tsx` and `main.tsx` keep default scaffold content for now — Story 1.4 will replace them
- `src/assets/` from the Vite scaffold can be deleted (not in architecture spec)
- `src/App.css` from the Vite scaffold should be deleted (replaced by Tailwind)

### Verification Commands

Run these to confirm the story is complete before marking done:

```bash
# 1. TypeScript — must show zero errors
npx tsc --noEmit

# 2. Dev server — must start without errors
npm run dev

# 3. Tests — must run (0 tests, 0 failures is passing)
npm run test

# 4. Confirm no barrel exports exist
find src -name "index.ts" -o -name "index.tsx"  # must return nothing
```

### References

- Architecture command and config details: [Source: architecture.md#Starter Template / Library Decisions]
- Folder structure specification: [Source: architecture.md#Complete Project Directory Structure]
- Naming conventions: [Source: architecture.md#Naming Patterns]
- TypeScript pattern enforcement: [Source: architecture.md#Format Patterns]
- Tailwind v4 approach (no config.js): [Source: architecture.md#Architectural Decisions from Starter]
- Dependency list: [Source: epics.md#Story 1.1 Acceptance Criteria]
- No barrel exports rule: [Source: architecture.md#No Barrel Exports Rule]

## Dev Agent Record

### Agent Model Used

_to be filled by dev agent_

### Debug Log References

### Completion Notes List

### File List
