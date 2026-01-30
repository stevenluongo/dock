"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { BoardHeader } from "./board-header";
import { BoardFilters, type BoardFilterState } from "./board-filters";
import { BoardColumn } from "./board-column";
import { IssueCardOverlay } from "./issue-card";
import { IssueDetailPanel } from "./issue-detail-panel";
import { updateIssueStatus } from "@/app/actions/issues/update-issue-status-action";
import { reorderIssues } from "@/app/actions/issues/reorder-issues-action";
import type { ProjectWithEpics, Issue, IssueStatus } from "@/lib/types/actions";

const COLUMNS: { id: IssueStatus; title: string; colorClass: string }[] = [
  { id: "BACKLOG", title: "Backlog", colorClass: "bg-muted/50" },
  {
    id: "TODO",
    title: "Todo",
    colorClass: "bg-blue-50/50 dark:bg-blue-950/20",
  },
  {
    id: "IN_PROGRESS",
    title: "In Progress",
    colorClass: "bg-amber-50/50 dark:bg-amber-950/20",
  },
  {
    id: "DONE",
    title: "Done",
    colorClass: "bg-green-50/50 dark:bg-green-950/20",
  },
];

const COLUMN_IDS = new Set<string>(COLUMNS.map((c) => c.id));

interface ProjectBoardContentProps {
  project: ProjectWithEpics;
  issues: Issue[];
}

export function ProjectBoardContent({
  project,
  issues: initialIssues,
}: ProjectBoardContentProps) {
  const router = useRouter();
  const [issues, setIssues] = useState(initialIssues);
  const [activeIssue, setActiveIssue] = useState<Issue | null>(null);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const previousIssuesRef = useRef<Issue[]>([]);
  const [filters, setFilters] = useState<BoardFilterState>({
    search: "",
    priorities: [],
    types: [],
    epicIds: [],
  });

  const epicMap: Record<string, string> = {};
  for (const epic of project.epics) {
    epicMap[epic.id] = epic.title;
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const filteredIssues = useMemo(() => {
    let result = issues;
    if (filters.search) {
      const query = filters.search.toLowerCase();
      result = result.filter((i) => i.title.toLowerCase().includes(query));
    }
    if (filters.priorities.length > 0) {
      result = result.filter((i) => filters.priorities.includes(i.priority));
    }
    if (filters.types.length > 0) {
      result = result.filter((i) => filters.types.includes(i.type));
    }
    if (filters.epicIds.length > 0) {
      result = result.filter((i) =>
        filters.epicIds.includes(i.epicId ?? "none"),
      );
    }
    return result;
  }, [issues, filters]);

  const issuesByStatus = useMemo(
    () =>
      COLUMNS.map((column) => ({
        ...column,
        issues: filteredIssues.filter((issue) => issue.status === column.id),
      })),
    [filteredIssues],
  );

  function handleDragStart(event: DragStartEvent) {
    const issue = event.active.data.current?.issue as Issue | undefined;
    setActiveIssue(issue ?? null);
    previousIssuesRef.current = issues;
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // All column lookups happen inside the updater so we always
    // see the latest state, even when onDragOver fires rapidly.
    setIssues((prev) => {
      const activeIssue = prev.find((i) => i.id === activeId);
      if (!activeIssue) return prev;

      let overColumnId: IssueStatus;
      if (COLUMN_IDS.has(overId)) {
        overColumnId = overId as IssueStatus;
      } else {
        const overIssue = prev.find((i) => i.id === overId);
        if (!overIssue) return prev;
        overColumnId = overIssue.status;
      }

      // Same column — no cross-column move needed
      if (activeIssue.status === overColumnId) return prev;

      // Get the issues in the target column
      const overColumnIssues = prev.filter(
        (i) => i.status === overColumnId && i.id !== activeId,
      );

      // Determine insertion order
      let newOrder: number;
      if (COLUMN_IDS.has(overId)) {
        newOrder =
          overColumnIssues.length > 0
            ? Math.max(...overColumnIssues.map((i) => i.order)) + 1
            : 0;
      } else {
        const overIssue = prev.find((i) => i.id === overId);
        newOrder = overIssue?.order ?? 0;
      }

      return prev.map((i) =>
        i.id === activeId
          ? { ...i, status: overColumnId, order: newOrder }
          : i,
      );
    });
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveIssue(null);

    const { active, over } = event;
    if (!over) {
      setIssues(previousIssuesRef.current);
      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string;
    const prevState = previousIssuesRef.current;

    const prevIssue = prevState.find((i) => i.id === activeId);
    if (!prevIssue) return;

    const sourceColumnId = prevIssue.status;

    // Determine target column from the drop target
    let targetColumnId: IssueStatus;
    if (COLUMN_IDS.has(overId)) {
      targetColumnId = overId as IssueStatus;
    } else {
      const overIssue = prevState.find((i) => i.id === overId);
      targetColumnId = overIssue?.status ?? sourceColumnId;
    }

    const statusChanged = sourceColumnId !== targetColumnId;

    if (statusChanged) {
      // Cross-column move
      const targetColumnIssues = prevState.filter(
        (i) => i.status === targetColumnId,
      );

      // Determine insert position
      let insertIndex: number;
      if (COLUMN_IDS.has(overId)) {
        insertIndex = targetColumnIssues.length;
      } else {
        const idx = targetColumnIssues.findIndex((i) => i.id === overId);
        insertIndex = idx === -1 ? targetColumnIssues.length : idx;
      }

      // Build the new target column with the moved issue inserted
      const newTargetColumn = [...targetColumnIssues];
      newTargetColumn.splice(insertIndex, 0, {
        ...prevIssue,
        status: targetColumnId,
      });

      // Update local state with proper ordering
      setIssues((prev) => {
        const others = prev.filter(
          (i) =>
            i.status !== targetColumnId && i.status !== sourceColumnId,
        );
        const sourceReordered = prev
          .filter((i) => i.status === sourceColumnId && i.id !== activeId)
          .map((issue, idx) => ({ ...issue, order: idx }));
        const ordered = newTargetColumn.map((issue, idx) => ({
          ...issue,
          order: idx,
        }));
        return [...others, ...sourceReordered, ...ordered];
      });

      // Persist status change
      const result = await updateIssueStatus(activeId, {
        status: targetColumnId,
        order: insertIndex,
      });

      if ("error" in result) {
        setIssues(previousIssuesRef.current);
        console.error("Failed to update status:", result.error);
        return;
      }

      // Persist order for target column
      const targetUpdates = newTargetColumn.map((issue, idx) => ({
        id: issue.id,
        order: idx,
      }));
      if (targetUpdates.length > 0) {
        await reorderIssues({ updates: targetUpdates });
      }

      // Persist order for source column (fill gap)
      const sourceUpdates = prevState
        .filter((i) => i.status === sourceColumnId && i.id !== activeId)
        .map((issue, idx) => ({ id: issue.id, order: idx }));
      if (sourceUpdates.length > 0) {
        await reorderIssues({ updates: sourceUpdates });
      }
    } else {
      // Same-column reorder
      if (activeId === overId) return;

      const columnIssues = prevState.filter(
        (i) => i.status === sourceColumnId,
      );
      const oldIndex = columnIssues.findIndex((i) => i.id === activeId);
      const newIndex = columnIssues.findIndex((i) => i.id === overId);

      if (oldIndex === -1 || newIndex === -1) return;

      const reordered = arrayMove(columnIssues, oldIndex, newIndex);

      setIssues((prev) => {
        const others = prev.filter((i) => i.status !== sourceColumnId);
        const ordered = reordered.map((issue, idx) => ({
          ...issue,
          order: idx,
        }));
        return [...others, ...ordered];
      });

      const updates = reordered.map((issue, idx) => ({
        id: issue.id,
        order: idx,
      }));
      const result = await reorderIssues({ updates });

      if ("error" in result) {
        setIssues(previousIssuesRef.current);
        console.error("Failed to reorder:", result.error);
        return;
      }
    }

    router.refresh();
  }

  return (
    <>
      <BoardHeader project={project} onSync={() => router.refresh()} />
      <BoardFilters
        filters={filters}
        onFiltersChange={setFilters}
        epics={project.epics}
      />

      {/* Board */}
      <div className="flex-1 overflow-x-auto p-6">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 h-full">
            {issuesByStatus.map((column) => (
              <BoardColumn
                key={column.id}
                id={column.id}
                title={column.title}
                issues={column.issues}
                colorClass={column.colorClass}
                epicMap={epicMap}
                projectId={project.id}
                epics={project.epics}
                onIssueCreated={() => router.refresh()}
                onIssueClick={setSelectedIssue}
              />
            ))}
          </div>

          <DragOverlay>
            {activeIssue ? (
              <IssueCardOverlay
                issue={activeIssue}
                epicName={
                  activeIssue.epicId
                    ? epicMap[activeIssue.epicId]
                    : undefined
                }
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      <IssueDetailPanel
        issue={selectedIssue}
        open={selectedIssue !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedIssue(null);
        }}
        epicName={
          selectedIssue?.epicId
            ? epicMap[selectedIssue.epicId]
            : undefined
        }
        githubRepo={project.githubRepo}
      />
    </>
  );
}
