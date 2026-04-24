import { ErrorBoundary } from '@/shared/components/ErrorBoundary'
import { KanbanBoard } from '@/features/board/components/KanbanBoard'

export default function App() {
  return (
    <ErrorBoundary fallbackMessage="App failed to load">
      <KanbanBoard />
    </ErrorBoundary>
  )
}
