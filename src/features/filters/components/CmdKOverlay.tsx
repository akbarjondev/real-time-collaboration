import { useState } from "react";
import type { TaskStatus } from "@/types/task.types";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandItem,
} from "@/components/ui/command";
import { useTasks } from "@/store/BoardStateContext";
import { useFilterAPI } from "@/store/FilterAPIContext";
import { filterTasks } from "@/features/filters/utils/filterTasks";
import { useKeyboardShortcut } from "@/shared/hooks/useKeyboardShortcut";
import { isMac } from "@/shared/utils/platform";
import type { Task } from "@/types/task.types";

const MAX_MRU = 5;

const STATUS_LABEL: Record<TaskStatus, string> = {
  todo: "Todo",
  "in-progress": "In Progress",
  done: "Done",
};

export function CmdKOverlay() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [mruIds, setMruIds] = useState<string[]>([]);
  const allTasks = useTasks();
  const filterAPI = useFilterAPI();

  // Mac: ⌘K — Cmd+K has no Chrome conflict on Mac
  // Windows/Linux: Ctrl+Shift+K — avoids Chrome's Ctrl+K address-bar shortcut
  useKeyboardShortcut("k", () => setIsOpen(true), isMac ? { ctrl: true } : { ctrl: true, shift: true });

  const results: Task[] = query.trim()
    ? filterTasks(allTasks, {
        assignee: null,
        priority: null,
        searchQuery: query,
      })
    : mruIds
        .map((id) => allTasks.find((t) => t.id === id))
        .filter((t): t is Task => t !== undefined);

  function handleQueryChange(value: string) {
    setQuery(value);
    filterAPI.setSearch(value);
  }

  function handleSelect(task: Task) {
    setMruIds((prev) =>
      [task.id, ...prev.filter((id) => id !== task.id)].slice(0, MAX_MRU)
    );

    setIsOpen(false);
    setQuery("");
    filterAPI.resetFilters();

    requestAnimationFrame(() => {
      document
        .getElementById(`task-${task.id}`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }

  function handleClose() {
    setIsOpen(false);
    setQuery("");
    filterAPI.resetFilters();
  }

  return (
    <CommandDialog
      open={isOpen}
      onOpenChange={(open: boolean) => {
        if (!open) handleClose();
      }}
    >
      <CommandInput
        placeholder="Search tasks…"
        value={query}
        onValueChange={handleQueryChange}
      />
      <CommandList>
        <CommandEmpty>No tasks found.</CommandEmpty>
        {results.map((task) => (
          <CommandItem
            key={task.id}
            value={task.title}
            onSelect={() => handleSelect(task)}
          >
            <span className="text-sm font-medium">{task.title}</span>
            <span className="ml-auto text-xs text-zinc-400">
              {STATUS_LABEL[task.status]}
            </span>
          </CommandItem>
        ))}
      </CommandList>
    </CommandDialog>
  );
}
