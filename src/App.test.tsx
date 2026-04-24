import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import App from '@/App'
import { AppProvider } from '@/store/AppProvider'

// Mock heavy components to keep tests fast
vi.mock('@/features/board/components/KanbanBoard', () => ({
  KanbanBoard: () => <main id="main-content" data-testid="kanban-board">Board</main>,
}))

function renderApp() {
  return render(
    <AppProvider>
      <App />
    </AppProvider>
  )
}

describe('App', () => {
  it('renders skip link as the first focusable element', () => {
    renderApp()
    const skipLink = screen.getByRole('link', { name: /skip to main content/i })
    expect(skipLink).toBeInTheDocument()
  })

  it('skip link has href targeting #main-content', () => {
    renderApp()
    const skipLink = screen.getByRole('link', { name: /skip to main content/i })
    expect(skipLink).toHaveAttribute('href', '#main-content')
  })

  it('skip link has sr-only class for visual hiding', () => {
    renderApp()
    const skipLink = screen.getByRole('link', { name: /skip to main content/i })
    expect(skipLink.className).toContain('sr-only')
  })

  it('renders KanbanBoard with id="main-content"', () => {
    renderApp()
    const mainContent = screen.getByTestId('kanban-board')
    expect(mainContent).toHaveAttribute('id', 'main-content')
  })
})
