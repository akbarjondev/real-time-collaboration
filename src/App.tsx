import { ErrorBoundary } from '@/shared/components/ErrorBoundary'
import { KanbanBoard } from '@/features/board/components/KanbanBoard'

export default function App() {
  return (
    <ErrorBoundary fallbackMessage="App failed to load">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-violet-600 focus:text-white focus:rounded-md focus:text-sm focus:font-medium"
      >
        Skip to main content
      </a>
      <KanbanBoard />
    </ErrorBoundary>
  )
}
