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
import { TaskModal } from "@/features/tasks/components/TaskModal";
import { FilterBar } from "@/features/filters/components/FilterBar";
import { CmdKOverlay } from "@/features/filters/components/CmdKOverlay";
import { useTaskModal } from "@/features/tasks/hooks/useTaskModal";
import { useBoardDnd } from "@/features/board/hooks/useBoardDnd";
import type { TaskStatus } from "@/types/task.types";
import type { Task } from "@/types/task.types";

const COLUMNS: { status: TaskStatus; title: string }[] = [
  { status: "todo", title: "Todo" },
  { status: "in-progress", title: "In Progress" },
  { status: "done", title: "Done" },
];

export function KanbanBoard() {
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

  function handleOpenEdit(task: Task) {
    openEdit(task);
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 bg-white">
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
      {/* UndoHintBar — Epic 7 */}

      <ErrorBoundary fallbackMessage="Board failed to load">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <main className="flex gap-4 p-4 overflow-x-auto items-start">
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

      <TaskModal
        isOpen={isOpen}
        mode={mode}
        task={editingTask}
        prefillValues={prefillValues}
        onClose={close}
        onOpenCreate={openCreate}
      />
    </div>
  );
}
