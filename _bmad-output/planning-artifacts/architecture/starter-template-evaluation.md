# Starter Template Evaluation

> **Note:** This project later switched from `@vitejs/plugin-react-swc` (SWC) to `@vitejs/plugin-react` (Babel) for compatibility reasons. The analysis below is preserved as historical record.

## Primary Technology Domain

Frontend SPA — React 18, TypeScript strict, Tailwind CSS, Vite. All mandated by the assignment spec; no discovery needed.

## Starter Options Considered

| Option | Notes | Verdict |
|---|---|---|
| `create-vite react-ts` | Babel-based, minimal | Good but SWC is faster |
| `create-vite react-swc-ts` | SWC (Rust) compiler, minimal | **Selected** — ~10x faster transforms, clean baseline |
| `create-t3-app` | Full-stack Next.js opinionated | Wrong domain — pure SPA |
| Custom from scratch | Full control | No additional signal for interview context |

## Selected Starter: `create-vite` with `react-swc-ts`

**Rationale:** PRD explicitly mandates Vite + React 18 + TypeScript. The `react-swc-ts` variant uses the Rust-based SWC compiler (~10x faster than Babel) — a small but visible signal of pragmatic craftsmanship. Minimal baseline, no opinionated abstractions forced onto the project.

**Initialization Commands:**

```bash
npm create vite@latest real-time-collaboration -- --template react-swc-ts
cd real-time-collaboration
npm install

# Tailwind v4 (vite plugin approach — no tailwind.config.js needed)
npm install tailwindcss @tailwindcss/vite

# Virtualization
npm install @tanstack/react-virtual

# dnd-kit (all three packages required)
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities

# Utilities
npm install nanoid sonner react-hook-form

# Dev dependencies
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
```

**`vite.config.ts` after setup:**

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

**`tsconfig.app.json` paths:**

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "paths": { "@/*": ["./src/*"] }
  }
}
```

**`src/index.css`:**

```css
@import "tailwindcss";
```

**`vitest.config.ts`:**

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

## Architectural Decisions Provided by Starter

| Concern | Decision | Note |
|---|---|---|
| Language | TypeScript 5.x strict | `"strict": true`, `"noUncheckedIndexedAccess": true` in tsconfig |
| Compiler | SWC (Rust) | ~10x faster than Babel; no config needed |
| Bundler | Vite 8.x | Fast HMR; esbuild production minification; automatic code splitting |
| Styling | Tailwind v4 via `@tailwindcss/vite` | No `tailwind.config.js` for basic use |
| Testing | Vitest + React Testing Library | jsdom environment; co-located test files |
| Code structure | Flat `src/` by default | **Overridden** with PRD feature-based structure |
| ESLint | React hooks plugin pre-configured | Zero-warning target from NFR11 |

**Note:** Project initialization using this command should be the first implementation story.
