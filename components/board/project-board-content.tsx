"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
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
import { arrayMove } from "@dnd-kit/sortable";
import { BoardColumn } from "./board-column";
import { IssueCardOverlay } from "./issue-card";
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
  const previousIssuesRef = useRef<Issue[]>([]);

  const epicMap: Record<string, string> = {};
  for (const epic of project.epics) {
    epicMap[epic.id] = epic.title;
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor),
  );

  const issuesByStatus = useMemo(
    () =>
      COLUMNS.map((column) => ({
        ...column,
        issues: issues.filter((issue) => issue.status === column.id),
      })),
    [issues],
  );

  /** Find which column an issue or droppable belongs to */
  const findColumnId = useCallback(
    (id: string): IssueStatus | null => {
      if (COLUMN_IDS.has(id)) return id as IssueStatus;
      const issue = issues.find((i) => i.id === id);
      return issue?.status ?? null;
    },
    [issues],
  );

  function handleDragStart(event: DragStartEvent) {
    const issue = event.active.data.current?.issue as Issue | undefined;
    setActiveIssue(issue ?? null);
    previousIssuesRef.current = issues;
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeColumnId = findColumnId(active.id as string);
    const overColumnId = findColumnId(over.id as string);

    if (!activeColumnId || !overColumnId || activeColumnId === overColumnId) {
      return;
    }

    // Move issue to a different column optimistically
    const activeId = active.id as string;

    setIssues((prev) => {
      const activeIssue = prev.find((i) => i.id === activeId);
      if (!activeIssue) return prev;

      // Get the issues in the target column
      const overColumnIssues = prev.filter(
        (i) => i.status === overColumnId && i.id !== activeId,
      );

      // Determine insertion index
      let newOrder: number;
      if (COLUMN_IDS.has(over.id as string)) {
        // Dropped on the column itself — append to end
        newOrder =
          overColumnIssues.length > 0
            ? Math.max(...overColumnIssues.map((i) => i.order)) + 1
            : 0;
      } else {
        // Dropped on a specific issue — insert at that position
        const overIssue = prev.find((i) => i.id === over.id);
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
          (i) => i.status !== targetColumnId && i.id !== activeId,
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
      {/* Header */}
      <div className="border-b px-6 py-4 space-y-5">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          All Projects
        </Link>
        <h1 className="text-xl font-semibold mt-1">{project.name}</h1>
      </div>

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
    </>
  );
}
