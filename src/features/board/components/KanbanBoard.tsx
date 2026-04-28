import { lazy, Suspense, useState } from "react";
import { LayoutGrid, Plus, Keyboard } from "lucide-react";
import { DndContext, DragOverlay, closestCorners } from "@dnd-kit/core";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ErrorBoundary } from "@/shared/components/ErrorBoundary";
import { ThemeToggle } from "@/shared/components/ThemeToggle";
import { KeyboardShortcutsModal } from "@/shared/components/KeyboardShortcutsModal";
import { BoardColumn } from "@/features/board/components/BoardColumn";
import { TaskCard } from "@/features/tasks/components/TaskCard";
import { FilterBar } from "@/features/filters/components/FilterBar";
import { CmdKOverlay } from "@/features/filters/components/CmdKOverlay";
import { useTaskModal } from "@/features/tasks/hooks/useTaskModal";
import { useBoardDnd } from "@/features/board/hooks/useBoardDnd";
import { useUndoRedoShortcuts } from "@/features/history/hooks/useUndoRedoShortcuts";
import { useAppShortcuts } from "@/shared/hooks/useAppShortcuts";
import { UndoHintBar } from "@/features/history/components/UndoHintBar";
import { ConflictModal } from "@/features/realtime/components/ConflictModal";
import { useTasks } from "@/store/BoardStateContext";
import type { TaskStatus } from "@/types/task.types";
import type { Task } from "@/types/task.types";

const TaskModal = lazy(() =>
  import("@/features/tasks/components/TaskModal").then((m) => ({
    default: m.TaskModal,
  })),
);

const COLUMNS: { status: TaskStatus; title: string }[] = [
  { status: "todo", title: "Todo" },
  { status: "in-progress", title: "In Progress" },
  { status: "done", title: "Done" },
];

const COLUMN_LABELS: Record<string, string> = {
  todo: "Todo",
  "in-progress": "In Progress",
  done: "Done",
};

export function KanbanBoard() {
  const tasks = useTasks();
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
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

  useUndoRedoShortcuts();
  useAppShortcuts({
    onNewTask: openCreate,
    onShowHelp: () => setIsShortcutsOpen(true),
  });

  function handleOpenEdit(task: Task) {
    openEdit(task);
  }

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <header className="flex flex-wrap items-center justify-between gap-y-2 px-6 py-4 border-b border-border bg-card">
        <div className="flex items-center gap-2">
          <LayoutGrid className="h-5 w-5 text-violet-600 dark:text-violet-400" aria-hidden="true" />
          <h1 className="text-lg font-semibold text-foreground">
            Real-time Board
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsShortcutsOpen(true)}
                  aria-label="Keyboard shortcuts"
                  className="min-h-[44px] min-w-[44px]"
                >
                  <Keyboard className="h-5 w-5" aria-hidden="true" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Keyboard shortcuts (Shift+?)</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <ThemeToggle />
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={() => openCreate()}
                  className="bg-violet-600 hover:bg-violet-700 dark:bg-violet-500 dark:hover:bg-violet-600 text-white focus-visible:ring-2 focus-visible:ring-violet-500 min-h-[44px]"
                  aria-label="New Task"
                >
                  <Plus className="h-4 w-4 mr-1" aria-hidden="true" />
                  New Task
                </Button>
              </TooltipTrigger>
              <TooltipContent>New task (N)</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </header>

      <FilterBar />
      <CmdKOverlay onOpenEdit={handleOpenEdit} />
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
                const task = tasks.find((t) => t.id === String(active.id));
                return task
                  ? `Picked up task "${task.title}"`
                  : "Picked up task";
              },
              onDragOver({ over }) {
                if (!over) return "Not over a drop area";
                const colLabel =
                  COLUMN_LABELS[String(over.id)] ?? String(over.id);
                return `Dragging over ${colLabel} column`;
              },
              onDragEnd({ over }) {
                if (!over) return "Drag cancelled";
                const colLabel =
                  COLUMN_LABELS[String(over.id)] ?? String(over.id);
                return `Task dropped in ${colLabel} column`;
              },
              onDragCancel() {
                return "Drag cancelled";
              },
            },
          }}
        >
          <main
            id="main-content"
            className="flex flex-col md:flex-row flex-1 gap-4 p-4 overflow-x-auto scrollbar-hide"
          >
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
            {activeTask ? (
              <TaskCard task={activeTask} isOverlay isPending={false} />
            ) : null}
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
      <KeyboardShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />
    </div>
  );
}
