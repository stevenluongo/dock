"use client";

import { useState, useEffect } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Layers,
  InboxIcon,
  ChevronRight,
  ChevronDown,
  GripVertical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { EpicWithIssueCounts, Issue } from "@/lib/types/actions";

const PRIORITY_COLORS: Record<string, string> = {
  CRITICAL: "bg-red-500",
  HIGH: "bg-orange-500",
  MEDIUM: "bg-yellow-500",
  LOW: "bg-green-500",
};

const STATUS_LABELS: Record<string, string> = {
  BACKLOG: "Backlog",
  TODO: "Todo",
  IN_PROGRESS: "In Progress",
  DONE: "Done",
};

const STATUS_ORDER = ["BACKLOG", "TODO", "IN_PROGRESS", "DONE"];

interface EpicSidebarProps {
  epics: EpicWithIssueCounts[];
  issues: Issue[];
  selectedEpicId: string | null;
  onSelectEpic: (epicId: string | null) => void;
  onCreateEpic: () => void;
  onEditEpic: (epic: EpicWithIssueCounts) => void;
  onIssueClick?: (issue: Issue) => void;
  onReorder?: (updates: { id: string; order: number }[]) => void;
}

function getTotal(epic: EpicWithIssueCounts) {
  const c = epic.issueCounts;
  return c.backlog + c.todo + c.inProgress + c.done;
}

function getProgress(epic: EpicWithIssueCounts) {
  const total = getTotal(epic);
  if (total === 0) return 0;
  return Math.round((epic.issueCounts.done / total) * 100);
}

interface SortableEpicItemProps {
  epic: EpicWithIssueCounts;
  issues: Issue[];
  isSelected: boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onSelectEpic: (epicId: string) => void;
  onEditEpic: (epic: EpicWithIssueCounts) => void;
  onIssueClick?: (issue: Issue) => void;
}

function SortableEpicItem({
  epic,
  issues,
  isSelected,
  isExpanded,
  onToggleExpand,
  onSelectEpic,
  onEditEpic,
  onIssueClick,
}: SortableEpicItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: epic.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const total = getTotal(epic);
  const progress = getProgress(epic);
  const epicIssues = issues.filter((i) => i.epicId === epic.id);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(isDragging && "opacity-30")}
    >
      <div
        className={cn(
          "w-full text-left px-3 py-2 hover:bg-accent/50 transition-colors group flex flex-col",
          isSelected && "bg-accent text-accent-foreground",
        )}
      >
        <div className="flex items-center gap-1">
          {/* Drag handle */}
          <button
            className="h-4 w-4 shrink-0 flex items-center justify-center text-muted-foreground/50 hover:text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-3 w-3" />
          </button>
          {/* Expand toggle */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand();
            }}
            className="h-4 w-4 shrink-0 flex items-center justify-center text-muted-foreground hover:text-foreground"
          >
            {isExpanded ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
          </button>
          <span
            className={cn(
              "h-2 w-2 rounded-full shrink-0",
              !epic.color && PRIORITY_COLORS[epic.priority],
            )}
            style={epic.color ? { backgroundColor: epic.color } : undefined}
          />
          <button
            onClick={() => onSelectEpic(epic.id)}
            onDoubleClick={() => onEditEpic(epic)}
            className={cn("text-sm truncate flex-1 text-left", isSelected && "font-medium")}
            title={`${epic.title} — ${epic.issueCounts.done} of ${total} done. Double-click to edit.`}
          >
            {epic.title}
          </button>
          <span className="text-[10px] text-muted-foreground tabular-nums shrink-0">
            {epic.issueCounts.done}/{total}
          </span>
        </div>

        {/* Progress bar */}
        {total > 0 && (
          <div className="mt-1.5 ml-9">
            <div className="h-1 rounded-full bg-muted overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  progress === 100
                    ? "bg-green-500"
                    : progress > 0
                      ? "bg-blue-500"
                      : "bg-transparent",
                )}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Expanded detail view */}
      {isExpanded && (
        <div className="px-3 pb-2 border-l border-muted ml-[1.1rem]">
          {epic.description && (
            <p className="text-[11px] text-muted-foreground mb-2 line-clamp-3">
              {epic.description}
            </p>
          )}

          {epicIssues.length === 0 ? (
            <p className="text-[11px] text-muted-foreground italic">No issues</p>
          ) : (
            STATUS_ORDER.map((status) => {
              const statusIssues = epicIssues.filter((i) => i.status === status);
              if (statusIssues.length === 0) return null;
              return (
                <div key={status} className="mb-1.5">
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-0.5">
                    {STATUS_LABELS[status]} ({statusIssues.length})
                  </p>
                  {statusIssues.map((issue) => (
                    <button
                      key={issue.id}
                      onClick={() => onIssueClick?.(issue)}
                      className="w-full text-left text-[11px] py-0.5 px-1 rounded hover:bg-accent/50 truncate block transition-colors"
                      title={issue.title}
                    >
                      {issue.title}
                    </button>
                  ))}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

function EpicItemOverlay({ epic }: { epic: EpicWithIssueCounts }) {
  const total = getTotal(epic);

  return (
    <div className="w-56 bg-card border rounded-md shadow-lg px-3 py-2">
      <div className="flex items-center gap-1">
        <GripVertical className="h-3 w-3 text-muted-foreground" />
        <span
          className={cn(
            "h-2 w-2 rounded-full shrink-0",
            !epic.color && PRIORITY_COLORS[epic.priority],
          )}
          style={epic.color ? { backgroundColor: epic.color } : undefined}
        />
        <span className="text-sm truncate flex-1">{epic.title}</span>
        <span className="text-[10px] text-muted-foreground tabular-nums shrink-0">
          {epic.issueCounts.done}/{total}
        </span>
      </div>
    </div>
  );
}

export function EpicSidebar({
  epics,
  issues,
  selectedEpicId,
  onSelectEpic,
  onCreateEpic,
  onEditEpic,
  onIssueClick,
  onReorder,
}: EpicSidebarProps) {
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("epic-sidebar-collapsed") === "true";
  });
  const [expandedEpicId, setExpandedEpicId] = useState<string | null>(null);
  const [activeEpic, setActiveEpic] = useState<EpicWithIssueCounts | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor),
  );

  useEffect(() => {
    localStorage.setItem("epic-sidebar-collapsed", String(collapsed));
  }, [collapsed]);

  function handleDragStart(event: DragStartEvent) {
    const epic = epics.find((e) => e.id === event.active.id);
    setActiveEpic(epic ?? null);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveEpic(null);

    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = epics.findIndex((e) => e.id === active.id);
    const newIndex = epics.findIndex((e) => e.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(epics, oldIndex, newIndex);
    const updates = reordered.map((epic, idx) => ({
      id: epic.id,
      order: idx,
    }));

    onReorder?.(updates);
  }

  if (collapsed) {
    return (
      <div className="flex flex-col items-center py-3 px-1 border-r bg-muted/30 shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => setCollapsed(false)}
          title="Expand sidebar"
        >
          <PanelLeftOpen className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="w-60 border-r bg-muted/30 flex flex-col shrink-0 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Epics
        </span>
        <div className="flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={onCreateEpic}
            title="New epic"
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => setCollapsed(true)}
            title="Collapse sidebar"
          >
            <PanelLeftClose className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Epic list */}
      <div className="flex-1 overflow-y-auto py-1">
        {/* All Issues */}
        <button
          onClick={() => onSelectEpic(null)}
          className={cn(
            "w-full flex items-center gap-2 px-3 py-1.5 text-sm text-left hover:bg-accent/50 transition-colors",
            selectedEpicId === null && "bg-accent text-accent-foreground font-medium",
          )}
        >
          <Layers className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <span className="truncate">All Issues</span>
        </button>

        {/* No Epic */}
        <button
          onClick={() => onSelectEpic("none")}
          className={cn(
            "w-full flex items-center gap-2 px-3 py-1.5 text-sm text-left hover:bg-accent/50 transition-colors",
            selectedEpicId === "none" && "bg-accent text-accent-foreground font-medium",
          )}
        >
          <InboxIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <span className="truncate text-muted-foreground">No Epic</span>
        </button>

        {epics.length > 0 && (
          <div className="mx-3 my-1 border-t" />
        )}

        {/* Sortable epic items */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={epics.map((e) => e.id)}
            strategy={verticalListSortingStrategy}
          >
            {epics.map((epic) => (
              <SortableEpicItem
                key={epic.id}
                epic={epic}
                issues={issues}
                isSelected={selectedEpicId === epic.id}
                isExpanded={expandedEpicId === epic.id}
                onToggleExpand={() =>
                  setExpandedEpicId(expandedEpicId === epic.id ? null : epic.id)
                }
                onSelectEpic={onSelectEpic}
                onEditEpic={onEditEpic}
                onIssueClick={onIssueClick}
              />
            ))}
          </SortableContext>

          <DragOverlay>
            {activeEpic ? <EpicItemOverlay epic={activeEpic} /> : null}
          </DragOverlay>
        </DndContext>

        {epics.length === 0 && (
          <div className="px-3 py-4 text-center">
            <p className="text-xs text-muted-foreground">No epics yet</p>
            <Button
              variant="link"
              size="sm"
              className="text-xs h-auto p-0 mt-1"
              onClick={onCreateEpic}
            >
              Create one
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
