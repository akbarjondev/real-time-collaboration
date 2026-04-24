import { Search, X } from "lucide-react";
import { useFilters } from "@/store/FilterContext";
import { useFilterAPI } from "@/store/FilterAPIContext";
import { isMac } from "@/shared/utils/platform";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Priority } from "@/types/task.types";

export function FilterBar() {
  const filters = useFilters();
  const filterAPI = useFilterAPI();

  const hasActiveFilters =
    filters.assignee !== null ||
    filters.priority !== null ||
    filters.searchQuery !== "";

  return (
    <div className="border-b border-zinc-200 bg-white px-6 py-3 flex flex-col gap-2">
      <div className="flex items-center gap-3 flex-wrap">
        {/* Search input */}
        <div className="relative flex items-center">
          <Search
            className="absolute left-2.5 h-4 w-4 text-zinc-400"
            aria-hidden="true"
          />
          <input
            type="text"
            value={filters.searchQuery}
            onChange={(e) => filterAPI.setSearch(e.target.value)}
            placeholder={
              isMac ? "Search tasks… (⌘K)" : "Search tasks… (Ctrl+Shift+K)"
            }
            aria-label="Search tasks"
            className="pl-9 pr-3 py-1.5 text-sm rounded-md border border-zinc-200 bg-zinc-50 focus:bg-white focus-visible:ring-2 focus-visible:ring-violet-500 focus:outline-none w-58"
          />
        </div>

        {/* Assignee filter */}
        <Select
          value={filters.assignee ?? ""}
          onValueChange={(v) => filterAPI.setAssignee(v === "" ? null : v)}
        >
          <SelectTrigger
            className="w-32 text-sm"
            aria-label="Filter by assignee"
          >
            <SelectValue placeholder="Assignee" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All</SelectItem>
            <SelectItem value="Alice">Alice</SelectItem>
            <SelectItem value="Bob">Bob</SelectItem>
            <SelectItem value="Carol">Carol</SelectItem>
            <SelectItem value="Dave">Dave</SelectItem>
          </SelectContent>
        </Select>

        {/* Priority filter */}
        <Select
          value={filters.priority ?? ""}
          onValueChange={(v) =>
            filterAPI.setPriority(v === "" ? null : (v as Priority))
          }
        >
          <SelectTrigger
            className="w-28 text-sm"
            aria-label="Filter by priority"
          >
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>

        {/* Clear all — only when filters active */}
        {hasActiveFilters && (
          <button
            onClick={() => filterAPI.resetFilters()}
            className={cn(
              "text-sm text-zinc-500 hover:text-zinc-700 px-2 py-1 rounded",
              "focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:outline-none",
            )}
            aria-label="Clear all filters"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Active chips row */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2" aria-label="Active filters">
          {filters.assignee && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-violet-100 border border-violet-300 text-violet-700">
              Assignee: {filters.assignee}
              <button
                onClick={() => filterAPI.setAssignee(null)}
                aria-label="Remove assignee filter"
                className="ml-0.5 rounded-full hover:bg-violet-200 focus-visible:ring-1 focus-visible:ring-violet-500 focus-visible:outline-none p-0.5"
              >
                <X className="h-3 w-3" aria-hidden="true" />
              </button>
            </span>
          )}
          {filters.priority && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-violet-100 border border-violet-300 text-violet-700 capitalize">
              Priority: {filters.priority}
              <button
                onClick={() => filterAPI.setPriority(null)}
                aria-label="Remove priority filter"
                className="ml-0.5 rounded-full hover:bg-violet-200 focus-visible:ring-1 focus-visible:ring-violet-500 focus-visible:outline-none p-0.5"
              >
                <X className="h-3 w-3" aria-hidden="true" />
              </button>
            </span>
          )}
          {filters.searchQuery && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-violet-100 border border-violet-300 text-violet-700">
              <Search className="h-3 w-3" aria-hidden="true" />
              "{filters.searchQuery}"
              <button
                onClick={() => filterAPI.setSearch("")}
                aria-label="Remove search filter"
                className="ml-0.5 rounded-full hover:bg-violet-200 focus-visible:ring-1 focus-visible:ring-violet-500 focus-visible:outline-none p-0.5"
              >
                <X className="h-3 w-3" aria-hidden="true" />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
}
