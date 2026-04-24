# Web App Platform Requirements

## Browser Support

| Browser | Versions |
|---|---|
| Chrome | Latest 2 |
| Firefox | Latest 2 |
| Safari | Latest 2 |
| Edge | Latest 2 |
| IE / Legacy | Not supported |

Modern CSS (Grid, Flexbox, custom properties) and ES2020+ syntax used freely. No polyfills.

## Responsive Design

- **Breakpoints:** Mobile < 768px | Tablet 768–1024px | Desktop > 1024px
- Columns stack vertically on mobile; side-by-side on tablet/desktop
- Drag-and-drop degrades to status dropdown on touch devices
- Minimum tap target: 44×44px on all interactive elements

## Accessibility

Basic coverage — pragmatic for interview context:
- All interactive elements reachable via Tab; activatable via Enter/Space
- ARIA labels on buttons, modals, and form inputs
- Focus trap in modals; focus restored to trigger element on close
- WCAG AA color contrast on primary elements (Tailwind defaults satisfy this)
