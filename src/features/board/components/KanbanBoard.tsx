import { lazy, Suspense } from "react";
import { LayoutGrid, Plus } from "lucide-react";
import { DndContext, DragOverlay, closestCorners } from "@dnd-kit/core";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ErrorBoundary } from "@/shared/components/ErrorBoundary";
import { BoardColumn } from "@/features/board/components/BoardColumn";
import { TaskCard } from "@/features/tasks/components/TaskCard";
import { FilterBar } from "@/features/filters/components/FilterBar";
import { CmdKOverlay } from "@/features/filters/components/CmdKOverlay";
import { useTaskModal } from "@/features/tasks/hooks/useTaskModal";
import { useBoardDnd } from "@/features/board/hooks/useBoardDnd";
import { useRealtimeSimulation } from "@/features/realtime/hooks/useRealtimeSimulation";
import { useUndoRedoShortcuts } from "@/features/history/hooks/useUndoRedoShortcuts";
import { UndoHintBar } from "@/features/history/components/UndoHintBar";
import { ConflictModal } from "@/features/realtime/components/ConflictModal";
import { useTasks } from "@/store/BoardStateContext";
import type { TaskStatus } from "@/types/task.types";
import type { Task } from "@/types/task.types";

const TaskModal = lazy(() =>
  import("@/features/tasks/components/TaskModal").then(m => ({ default: m.TaskModal }))
)

const COLUMNS: { status: TaskStatus; title: string }[] = [
  { status: "todo", title: "Todo" },
  { status: "in-progress", title: "In Progress" },
  { status: "done", title: "Done" },
];

const COLUMN_LABELS: Record<string, string> = {
  'todo': 'Todo',
  'in-progress': 'In Progress',
  'done': 'Done',
}

export function KanbanBoard() {
  const tasks = useTasks();
  const {
    isOpen,
    mode,
    editingTask,
    prefillValues,
    openCreate,
    openEdit,
    close,
  } = useTaskModal();
  const {
    sensors,
    activeTask,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
  } = useBoardDnd();

  useRealtimeSimulation(editingTask?.id ?? null);
  useUndoRedoShortcuts();

  function handleOpenEdit(task: Task) {
    openEdit(task);
  }

  return (
    <div className="h-screen bg-zinc-50 flex flex-col overflow-hidden">
      <header className="flex flex-wrap items-center justify-between gap-y-2 px-6 py-4 border-b border-zinc-200 bg-white">
        <div className="flex items-center gap-2">
          <LayoutGrid className="h-5 w-5 text-violet-600" aria-hidden="true" />
          <h1 className="text-lg font-semibold text-zinc-900">
            Real-time Board
          </h1>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Button
                onClick={() => openCreate()}
                className="bg-violet-600 hover:bg-violet-700 text-white focus-visible:ring-2 focus-visible:ring-violet-500 min-h-[44px]"
                aria-label="New Task"
              >
                <Plus className="h-4 w-4 mr-1" aria-hidden="true" />
                New Task
              </Button>
            </TooltipTrigger>
            <TooltipContent>New task (N)</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </header>

      <FilterBar />
      <CmdKOverlay />
      <UndoHintBar />

      <ErrorBoundary fallbackMessage="Board failed to load">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          accessibility={{
            announcements: {
              onDragStart({ active }) {
                const task = tasks.find(t => t.id === String(active.id))
                return task ? `Picked up task "${task.title}"` : 'Picked up task'
              },
              onDragOver({ over }) {
                if (!over) return 'Not over a drop area'
                const colLabel = COLUMN_LABELS[String(over.id)] ?? String(over.id)
                return `Dragging over ${colLabel} column`
              },
              onDragEnd({ over }) {
                if (!over) return 'Drag cancelled'
                const colLabel = COLUMN_LABELS[String(over.id)] ?? String(over.id)
                return `Task dropped in ${colLabel} column`
              },
              onDragCancel() {
                return 'Drag cancelled'
              },
            }
          }}
        >
          <main id="main-content" className="flex flex-col md:flex-row flex-1 gap-4 p-4 overflow-x-auto scrollbar-hide">
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

      <Suspense fallback={null}>
        <TaskModal
          isOpen={isOpen}
          mode={mode}
          task={editingTask}
          prefillValues={prefillValues}
          onClose={close}
          onOpenCreate={openCreate}
        />
      </Suspense>
      <ConflictModal />
    </div>
  );
}
