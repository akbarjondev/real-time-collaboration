# Non-Functional Requirements

## Performance

- **NFR1:** Lighthouse Performance score ≥ 85 on production build
- **NFR2:** Initial page load < 2 seconds on fast 3G
- **NFR3:** Board maintains 60fps scroll and interaction with 1,000+ tasks loaded
- **NFR4:** Filter and search respond within 50ms (client-side, memoized)
- **NFR5:** Optimistic UI updates applied within one animation frame (≤ 16ms perceived latency)
- **NFR6:** Remote simulation updates applied without full component re-renders or scroll position reset

## Code Quality & Maintainability

- **NFR7:** Codebase compiles with zero TypeScript errors in strict mode; zero `any` types
- **NFR8:** Components are single-responsibility, ≤ 150 lines; stateful logic extracted into custom hooks
- **NFR9:** Feature code co-located in feature folders; shared utilities in `shared/`
- **NFR10:** Non-obvious implementation decisions have inline comments; architecture decisions in README
- **NFR11:** ESLint passes with zero warnings on production build

## Accessibility

- **NFR12:** All interactive elements keyboard-navigable via Tab; activatable via Enter/Space
- **NFR13:** Modals implement focus trap on open; restore focus to trigger element on close
- **NFR14:** All interactive elements and form inputs carry `aria-label` or `aria-labelledby`
- **NFR15:** Primary UI elements meet WCAG AA color contrast (4.5:1) — Tailwind defaults satisfy this

## Security

- **NFR16:** All user-supplied input rendered via React's built-in escaping (no `dangerouslySetInnerHTML`)
- **NFR17:** No sensitive data stored in localStorage or sessionStorage
