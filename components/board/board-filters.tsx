"use client";

import { Filter, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type {
  Priority,
  IssueType,
  EpicWithIssueCounts,
} from "@/lib/types/actions";

const PRIORITIES: { value: Priority; label: string; colorClass: string }[] = [
  { value: "CRITICAL", label: "Critical", colorClass: "bg-red-500" },
  { value: "HIGH", label: "High", colorClass: "bg-orange-500" },
  { value: "MEDIUM", label: "Medium", colorClass: "bg-yellow-500" },
  { value: "LOW", label: "Low", colorClass: "bg-green-500" },
];

const TYPES: { value: IssueType; label: string; className: string }[] = [
  {
    value: "TASK",
    label: "Task",
    className: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  },
  {
    value: "STORY",
    label: "Story",
    className: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  },
  {
    value: "BUG",
    label: "Bug",
    className: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  },
  {
    value: "DOCS",
    label: "Docs",
    className: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300",
  },
];

export interface BoardFilterState {
  search: string;
  priorities: Priority[];
  types: IssueType[];
  epicIds: string[];
}

interface BoardFiltersProps {
  filters: BoardFilterState;
  onFiltersChange: (filters: BoardFilterState) => void;
  epics: EpicWithIssueCounts[];
}

export function BoardFilters({
  filters,
  onFiltersChange,
  epics,
}: BoardFiltersProps) {
  const activeCount =
    (filters.search ? 1 : 0) +
    filters.priorities.length +
    filters.types.length +
    filters.epicIds.length;

  function togglePriority(priority: Priority) {
    const next = filters.priorities.includes(priority)
      ? filters.priorities.filter((p) => p !== priority)
      : [...filters.priorities, priority];
    onFiltersChange({ ...filters, priorities: next });
  }

  function toggleType(type: IssueType) {
    const next = filters.types.includes(type)
      ? filters.types.filter((t) => t !== type)
      : [...filters.types, type];
    onFiltersChange({ ...filters, types: next });
  }

  function toggleEpic(epicId: string) {
    const next = filters.epicIds.includes(epicId)
      ? filters.epicIds.filter((e) => e !== epicId)
      : [...filters.epicIds, epicId];
    onFiltersChange({ ...filters, epicIds: next });
  }

  function clearAll() {
    onFiltersChange({ search: "", priorities: [], types: [], epicIds: [] });
  }

  return (
    <div className="flex items-center gap-2 px-6 py-2 border-b">
      <div className="relative shrink-0">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          value={filters.search}
          onChange={(e) =>
            onFiltersChange({ ...filters, search: e.target.value })
          }
          placeholder="Search issues..."
          className="h-7 w-44 pl-7 text-xs"
        />
      </div>

      <Filter className="h-4 w-4 text-muted-foreground shrink-0" />

      {/* Priority filter */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant={filters.priorities.length > 0 ? "secondary" : "outline"}
            size="sm"
            className="text-xs h-7"
          >
            Priority
            {filters.priorities.length > 0 && (
              <span className="ml-1 rounded-full bg-foreground/10 px-1.5 tabular-nums">
                {filters.priorities.length}
              </span>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuLabel>Priority</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {PRIORITIES.map((p) => (
            <DropdownMenuCheckboxItem
              key={p.value}
              checked={filters.priorities.includes(p.value)}
              onCheckedChange={() => togglePriority(p.value)}
              onSelect={(e) => e.preventDefault()}
            >
              <span
                className={`h-2 w-2 rounded-full shrink-0 ${p.colorClass}`}
              />
              {p.label}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Type filter */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant={filters.types.length > 0 ? "secondary" : "outline"}
            size="sm"
            className="text-xs h-7"
          >
            Type
            {filters.types.length > 0 && (
              <span className="ml-1 rounded-full bg-foreground/10 px-1.5 tabular-nums">
                {filters.types.length}
              </span>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuLabel>Type</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {TYPES.map((t) => (
            <DropdownMenuCheckboxItem
              key={t.value}
              checked={filters.types.includes(t.value)}
              onCheckedChange={() => toggleType(t.value)}
              onSelect={(e) => e.preventDefault()}
            >
              <span
                className={`text-[10px] font-medium leading-none px-1.5 py-0.5 rounded ${t.className}`}
              >
                {t.label}
              </span>
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Epic filter */}
      {epics.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant={filters.epicIds.length > 0 ? "secondary" : "outline"}
              size="sm"
              className="text-xs h-7"
            >
              Epic
              {filters.epicIds.length > 0 && (
                <span className="ml-1 rounded-full bg-foreground/10 px-1.5 tabular-nums">
                  {filters.epicIds.length}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuLabel>Epic</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem
              checked={filters.epicIds.includes("none")}
              onCheckedChange={() => toggleEpic("none")}
              onSelect={(e) => e.preventDefault()}
            >
              <span className="text-muted-foreground">No epic</span>
            </DropdownMenuCheckboxItem>
            {epics.map((epic) => (
              <DropdownMenuCheckboxItem
                key={epic.id}
                checked={filters.epicIds.includes(epic.id)}
                onCheckedChange={() => toggleEpic(epic.id)}
                onSelect={(e) => e.preventDefault()}
              >
                {epic.title}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {/* Clear filters */}
      {activeCount > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearAll}
          className="text-xs h-7 text-muted-foreground"
        >
          <X className="h-3 w-3 mr-1" />
          Clear
        </Button>
      )}
    </div>
  );
}
